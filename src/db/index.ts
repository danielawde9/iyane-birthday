import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
// Relative (not "@/lib/env") so the tsx seed/bucket scripts resolve it too.
import { env, isDbConfigured } from "../lib/env";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

/** Lazily-created Drizzle client. Returns null when no DATABASE_URL (demo mode). */
export function getDb(): Db | null {
  if (!isDbConfigured) return null;
  if (!cached) {
    // `prepare: false` is required for Supabase's transaction pooler (pgBouncer).
    const client = postgres(env.databaseUrl!, { prepare: false });
    cached = drizzle(client, { schema });
  }
  return cached;
}
