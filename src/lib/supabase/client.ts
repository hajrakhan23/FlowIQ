import { createClient, SupabaseClient } from '@supabase/supabase-js';

// User Configured Supabase Credentials
const SUPABASE_PROJECT_URL = 'https://bwpkgcujoqtlcxcntzch.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cGtnY3Vqb3F0bGN4Y250emNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDgzMjcsImV4cCI6MjEwMjYyNDMyN30.d1fVO5V9PK_fjoVwbNe3Y2gjvJs1OPrENh5UIm3WuPM';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your_supabase_url') &&
  !supabaseAnonKey.includes('your_supabase_anon_key')
);

// Real client with full session and auth capabilities
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string;
  projectId: string;
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl,
    projectId: 'bwpkgcujoqtlcxcntzch',
  };
}
