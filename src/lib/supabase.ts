import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Please add them to your environment variables.');
}

// Fallback to placeholder to prevent bundle crash on mount if Vercel envs are not yet set
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder-url.supabase.co', 'placeholder-key');
