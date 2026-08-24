import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenerativeAI, SchemaType } from "npm:@google/generative-ai";
import { corsHeaders } from "../_shared/cors.ts";
import { IntentSchema } from "./zodSchemas.ts";

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get securely authenticated user (do not trust client payload for identity)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile to determine role
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Parse input
    const { message, page_context } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Intent Classification
    const intentModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            intent: {
              type: SchemaType.STRING,
              enum: ["candidate_search", "project_search", "explanation", "unknown"],
              description: "The primary intent of the user's message"
            },
            semantic_query: {
              type: SchemaType.STRING,
              description: "The core semantic concept the user is searching for, stripped of conversational filler"
            }
          },
          required: ["intent"],
        },
      }
    });

    const intentPrompt = `
      Analyze this user query and determine their intent.
      User Role: ${role || 'unknown'}
      Query: "${message}"
      Page Context: ${JSON.stringify(page_context || {})}
    `;
    
    const intentResult = await intentModel.generateContent(intentPrompt);
    const intentText = intentResult.response.text();
    const parsedIntent = JSON.parse(intentText);

    console.log("Classified Intent:", parsedIntent);

    let finalResponse;

    // 3. Intent-Specific Retrieval & Synthesis
    switch (parsedIntent.intent) {
      case "project_search":
        finalResponse = await handleProjectSearch(supabaseClient, message, parsedIntent, role);
        break;
      case "candidate_search":
        finalResponse = await handleCandidateSearch(supabaseClient, message, parsedIntent, role);
        break;
      case "explanation":
        finalResponse = await handleExplanation(supabaseClient, message, page_context, role);
        break;
      default:
        finalResponse = {
          response_type: "explanation_result",
          message: "I'm not quite sure how to help with that yet. You can ask me to find projects, search for candidates, or explain details about a specific profile.",
          insight: ""
        };
    }

    // Return structured response
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("AI Assistant Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- Handlers ---

async function handleProjectSearch(supabase: any, originalQuery: string, intentData: any, role: string) {
  let projects;
  let error;

  if (intentData.semantic_query) {
    const embedResult = await embeddingModel.embedContent(intentData.semantic_query);
    const embedding = embedResult.embedding.values;

    const { data, error: rpcError } = await supabase.rpc('match_projects', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: 0.3,
      match_count: 5
    });
    projects = data;
    error = rpcError;
  } else {
    const { data, error: fetchError } = await supabase
      .from('projects')
      .select('id, role, domain, tenure, remuneration')
      .limit(5);
    projects = data;
    error = fetchError;
  }

  if (error || !projects || projects.length === 0) {
     return {
       response_type: "project_search_result",
       message: "I couldn't find any projects matching your criteria right now.",
       entity_ids: [],
       insight: "Try broadening your search criteria."
     };
  }

  // Synthesis
  const synthesisModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          message: { type: SchemaType.STRING },
          entity_ids: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          insight: { type: SchemaType.STRING },
        },
        required: ["message", "entity_ids", "insight"]
      }
    }
  });

  const prompt = `
    You are an AI assistant helping a ${role} find projects on ProjectMatch.
    User Query: "${originalQuery}"
    
    Database returned the following top 5 matching projects:
    ${JSON.stringify(projects)}

    Synthesize a helpful response.
    - Select only the IDs of the projects that genuinely fit the query (up to 5).
    - Write a short conversational message.
    - Write an 'insight' explaining why these are good matches.
  `;

  const result = await synthesisModel.generateContent(prompt);
  const jsonResponse = JSON.parse(result.response.text());

  return {
    response_type: "project_search_result",
    ...jsonResponse
  };
}

async function handleCandidateSearch(supabase: any, originalQuery: string, intentData: any, role: string) {
  // Only recruiters should search candidates
  if (role !== 'recruiter') {
     return {
       response_type: "explanation_result",
       message: "Only recruiters can search for candidates.",
       insight: "Access denied."
     };
  }

  let candidates;
  let error;

  if (intentData.semantic_query) {
    const embedResult = await embeddingModel.embedContent(intentData.semantic_query);
    const embedding = embedResult.embedding.values;

    const { data, error: rpcError } = await supabase.rpc('match_candidates', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: 0.3,
      match_count: 5
    });
    candidates = data;
    error = rpcError;
  } else {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('role', 'student')
      .limit(5);
    candidates = data;
    error = fetchError;
  }

  if (error || !candidates || candidates.length === 0) {
     return {
       response_type: "candidate_search_result",
       message: "I couldn't find any candidates matching your criteria.",
       entity_ids: [],
       insight: ""
     };
  }

  // Synthesis
  const synthesisModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          message: { type: SchemaType.STRING },
          entity_ids: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          insight: { type: SchemaType.STRING },
        },
        required: ["message", "entity_ids", "insight"]
      }
    }
  });

  const prompt = `
    You are an AI assistant helping a recruiter find candidates.
    User Query: "${originalQuery}"
    
    Database returned the following top candidates:
    ${JSON.stringify(candidates)}

    Synthesize a helpful response. Select the best matching IDs, write a short message, and provide an insight on why they fit.
  `;

  const result = await synthesisModel.generateContent(prompt);
  const jsonResponse = JSON.parse(result.response.text());

  return {
    response_type: "candidate_search_result",
    ...jsonResponse
  };
}

async function handleExplanation(supabase: any, originalQuery: string, context: any, role: string) {
  // Synthesis without retrieval (just context injection)
  const synthesisModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          message: { type: SchemaType.STRING },
          insight: { type: SchemaType.STRING },
        },
        required: ["message", "insight"]
      }
    }
  });

  const prompt = `
    You are a helpful AI assistant for ProjectMatch.
    User Role: ${role}
    User Query: "${originalQuery}"
    Page Context: ${JSON.stringify(context || {})}
    
    Provide a concise, helpful explanation based on the context provided.
  `;

  const result = await synthesisModel.generateContent(prompt);
  const jsonResponse = JSON.parse(result.response.text());

  return {
    response_type: "explanation_result",
    ...jsonResponse
  };
}
