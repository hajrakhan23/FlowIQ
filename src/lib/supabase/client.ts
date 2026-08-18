import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your_supabase_url') &&
  !supabaseAnonKey.includes('your_supabase_anon_key')
);

// Real or dummy client to prevent instantiation crashes if keys are empty
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://placeholder-flowiq.supabase.co', 'placeholder-anon-key-flowiq', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string;
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  return {
    isConfigured: isSupabaseConfigured,
    url: isSupabaseConfigured ? supabaseUrl : 'Local Demo Mode (Full Real-Time Simulation)',
  };
}
