import { z } from "npm:zod";

export const CandidateSearchResultSchema = z.object({
  response_type: z.literal("candidate_search_result"),
  message: z.string().describe("Conversational response to the user"),
  entity_ids: z.array(z.string()).describe("List of candidate IDs found"),
  insight: z.string().describe("A summary explaining why these candidates were selected"),
});

export const ProjectSearchResultSchema = z.object({
  response_type: z.literal("project_search_result"),
  message: z.string().describe("Conversational response to the user"),
  entity_ids: z.array(z.string()).describe("List of project IDs found"),
  insight: z.string().describe("A summary explaining why these projects fit the criteria"),
});

export const ExplanationResultSchema = z.object({
  response_type: z.literal("explanation_result"),
  message: z.string().describe("Conversational response to the user"),
  insight: z.string().describe("Detailed explanation or fit analysis"),
});

export const IntentSchema = z.object({
  intent: z.enum(["candidate_search", "project_search", "explanation", "unknown"]),
  semantic_query: z.string().optional().describe("The core semantic concept the user is searching for, stripped of conversational filler"),
  filters: z.record(z.any()).optional().describe("Any hard structured filters requested (e.g. minimum_hours: 10)"),
});
