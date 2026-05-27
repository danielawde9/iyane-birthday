import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Service-role Supabase client for privileged server-side ops (storage uploads). */
export function createSupabaseServiceClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
