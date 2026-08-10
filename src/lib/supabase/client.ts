import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service_role key — bypasses Row
 * Level Security entirely, so this must NEVER be imported from a "use
 * client" file or exposed to the browser. Every write is authorized by
 * CoinDuel's own server-side session check (getCurrentUser() in the calling
 * API route), not by Supabase Auth or RLS — this app uses its own custom
 * auth system, not Supabase Auth, so there is no `auth.uid()` for RLS
 * policies to key off. Lazy singleton, same pattern as src/lib/stripe/client.ts.
 */
const globalForSupabase = globalThis as unknown as { supabase: SupabaseClient | undefined };

function createServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. See .env.example."
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (!globalForSupabase.supabase) {
    globalForSupabase.supabase = createServiceClient();
  }
  return globalForSupabase.supabase;
}
