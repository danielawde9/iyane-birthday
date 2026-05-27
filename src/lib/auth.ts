import { env, isSupabaseConfigured } from "./env";
import { createSupabaseServerClient } from "./supabase/server";

/**
 * Admin identity. In production this is a Supabase Auth session whose email is in
 * ADMIN_EMAILS. Locally (no Supabase configured, non-production) admin is open so
 * the dashboard can be previewed — set ADMIN_DEV_BYPASS=0 to force real auth.
 */
export const isAdminBypass =
  process.env.ADMIN_DEV_BYPASS === "1" ||
  (process.env.NODE_ENV !== "production" && !isSupabaseConfigured && process.env.ADMIN_DEV_BYPASS !== "0");

export interface AdminUser {
  email: string;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  if (isAdminBypass) return { email: env.adminEmails[0] ?? "dev@local" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  // Require the email to be explicitly allow-listed. An empty ADMIN_EMAILS means
  // no one gets in via auth (fail closed), not "any logged-in user".
  if (!env.adminEmails.includes(email)) return null;
  return { email };
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}
