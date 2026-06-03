import { env, isSupabaseConfigured } from "./env";
import { createSupabaseServerClient } from "./supabase/server";

/**
 * Admin identity. In production this is a Supabase Auth session whose email is in
 * ADMIN_EMAILS. Locally (no Supabase configured) admin is open so the dashboard can be
 * previewed — set ADMIN_DEV_BYPASS=0 to force real auth. The bypass can NEVER be active
 * in production (gated by !isProd), even if ADMIN_DEV_BYPASS=1 is left set by mistake.
 */
export const isAdminBypass =
  !env.isProd &&
  (process.env.ADMIN_DEV_BYPASS === "1" ||
    (!isSupabaseConfigured && process.env.ADMIN_DEV_BYPASS !== "0"));

if (isAdminBypass) {
  console.warn("⚠️  Admin auth is BYPASSED (dev only). Set ADMIN_DEV_BYPASS=0 to require real login.");
}

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
