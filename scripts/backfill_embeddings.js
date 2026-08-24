import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We need the service role key to update all rows without RLS blocking us
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
    console.error("Missing required environment variables.");
    console.error("Ensure VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and VITE_GEMINI_API_KEY are in your .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

// We use the 004 text embedding model
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function generateEmbedding(text) {
    try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (e) {
        console.error("Failed to generate embedding for text:", text.substring(0, 50), e);
        return null;
    }
}

async function backfillProjects() {
    console.log("Fetching projects...");
    const { data: projects, error } = await supabase.from('projects').select('*').is('embedding', null);
    
    if (error) {
        console.error("Error fetching projects:", error);
        return;
    }

    console.log(`Found ${projects.length} projects without embeddings.`);

    for (const project of projects) {
        // Construct a semantic description of the project
        const textToEmbed = `
            Role: ${project.role}
            Domain: ${project.domain}
            Skills Required: ${project.skills_required?.join(', ') || ''}
            Description: ${project.description || ''}
            Tenure: ${project.tenure} months
        `.replace(/\s+/g, ' ').trim();

        console.log(`Generating embedding for project: ${project.role} (${project.id})`);
        const embedding = await generateEmbedding(textToEmbed);

        if (embedding) {
            // Update the project with the pgvector embedding array
            const { error: updateError } = await supabase
                .from('projects')
                .update({ embedding: `[${embedding.join(',')}]` }) // pgvector expects array string format or direct array
                .eq('id', project.id);
            
            if (updateError) {
                console.error(`Failed to update project ${project.id}:`, updateError);
            } else {
                console.log(`Successfully updated project ${project.id}`);
            }
        }
        
        // Wait slightly to respect Gemini rate limits
        await new Promise(r => setTimeout(r, 500));
    }
}

async function backfillProfiles() {
    console.log("Fetching student profiles...");
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .is('embedding', null);
    
    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Found ${profiles.length} student profiles without embeddings.`);

    for (const profile of profiles) {
        // Construct a semantic description of the student
        const textToEmbed = `
            Name: ${profile.full_name}
            Major/Domain: ${profile.domain || ''}
            Skills: ${profile.skills?.join(', ') || ''}
            Bio: ${profile.bio || ''}
            University: ${profile.university || ''}
        `.replace(/\s+/g, ' ').trim();

        console.log(`Generating embedding for profile: ${profile.full_name} (${profile.id})`);
        const embedding = await generateEmbedding(textToEmbed);

        if (embedding) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ embedding: `[${embedding.join(',')}]` }) 
                .eq('id', profile.id);
            
            if (updateError) {
                console.error(`Failed to update profile ${profile.id}:`, updateError);
            } else {
                console.log(`Successfully updated profile ${profile.id}`);
            }
        }
        
        await new Promise(r => setTimeout(r, 500));
    }
}

async function main() {
    console.log("Starting embedding backfill script...");
    await backfillProjects();
    await backfillProfiles();
    console.log("Backfill complete!");
}

main();
