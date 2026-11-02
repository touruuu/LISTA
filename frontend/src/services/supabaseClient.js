import { createClient } from "@supabase/supabase-js";

const environment = import.meta.env ?? {};
const supabaseUrl = environment.VITE_SUPABASE_URL?.trim();
const publishableKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigured = Boolean(supabaseUrl && publishableKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase)
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.local.");
  return supabase;
}
