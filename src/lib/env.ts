/** Centralized environment access + capability flags (server-side only). */

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "photos",
  uploadAllowedCountries: (process.env.UPLOAD_ALLOWED_COUNTRY ?? "LB")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean),
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  isProd: process.env.NODE_ENV === "production",
} as const;

export const isDbConfigured = Boolean(env.databaseUrl);
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isStorageConfigured = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
