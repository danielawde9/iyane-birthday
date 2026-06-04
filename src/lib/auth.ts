import { env } from "./env";
import { createSupabaseServerClient } from "./supabase/server";

/**
 * Admin identity. In production this is a Supabase Auth session whose email is in
 * ADMIN_EMAILS. For local development the dashboard can be previewed without auth ONLY
 * by explicitly setting ADMIN_DEV_BYPASS=1. It is gated by !isProd, so it can NEVER be
 * active in production — or on any Vercel deployment, which runs NODE_ENV=production —
 * even if the var is left set by mistake. There is no implicit open-by-default: with no
 * ADMIN_DEV_BYPASS=1, admin always requires a real allow-listed Supabase session.
 */
export const isAdminBypass = !env.isProd && process.env.ADMIN_DEV_BYPASS === "1";

if (isAdminBypass) {
  console.warn("⚠️  Admin auth is BYPASSED (dev only). Unset ADMIN_DEV_BYPASS to require real login.");
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
