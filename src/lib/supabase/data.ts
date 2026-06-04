import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { createSupabaseServiceClient } from "./admin";

/**
 * Request-path data clients. Both talk to PostgREST over HTTP — no Postgres
 * connection is opened, so the serverless connection-pool limits that broke the
 * direct-Drizzle setup do not apply here.
 *
 *  - publicData():     anon key, RLS-enforced. Use for public reads.
 *  - privilegedData(): service-role, bypasses RLS. Use for privileged reads
 *                      (admin / hidden rows) and all writes.
 */

let anon: SupabaseClient | null = null;

/** Anon, RLS-enforced, stateless client for public reads (cached per instance). */
export function publicData(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase anon client is not configured (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).");
  }
  // Safe to cache: holds no per-request state (no session, no cookies).
  anon ??= createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anon;
}

/** Service-role client (bypasses RLS) for privileged reads and all writes. */
export function privilegedData(): SupabaseClient {
  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error("Supabase service-role client is not configured (SUPABASE_SERVICE_ROLE_KEY).");
  }
  return client;
}
