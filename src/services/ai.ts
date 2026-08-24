import { supabase } from '../lib/supabase';

export interface AIResponse {
    response_type: 'candidate_search_result' | 'project_search_result' | 'explanation_result';
    message: string;
    entity_ids?: string[];
    insight: string;
    error?: string;
}

export const askProjectMatch = async (message: string, pageContext: any = {}): Promise<AIResponse> => {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
            throw new Error('You must be logged in to use the AI Assistant.');
        }

        // For MVP, we point to the local Supabase edge functions port when in development,
        // or the remote URL when in production. The @supabase/supabase-js client's `functions.invoke`
        // handles this automatically if configured.
        
        const { data, error } = await supabase.functions.invoke('ask-projectmatch', {
            body: {
                message,
                page_context: pageContext
            }
        });

        if (error) {
            console.error('Edge Function Error:', error);
            throw new Error(error.message || 'Failed to communicate with AI Assistant');
        }

        return data as AIResponse;
    } catch (err: any) {
        console.error('AI Service Error:', err);
        return {
            response_type: 'explanation_result',
            message: '',
            insight: '',
            error: err.message || 'An unexpected error occurred.'
        };
    }
};
