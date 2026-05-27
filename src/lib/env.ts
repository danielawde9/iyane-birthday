/** Centralized environment access + capability flags (server-side only). */

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "photos",
  uploadPin: process.env.UPLOAD_PIN,
  cookieSigningKey: process.env.COOKIE_SIGNING_KEY ?? "dev-insecure-signing-key-change-me",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  uploadTokenTtlMs: Number(process.env.UPLOAD_TOKEN_TTL_MS ?? 12 * 60 * 60 * 1000),
  isProd: process.env.NODE_ENV === "production",
} as const;

export const isDbConfigured = Boolean(env.databaseUrl);
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isStorageConfigured = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
/** When true, the app serves seeded demo content and stores writes in memory. */
export const demoMode = !isDbConfigured;
