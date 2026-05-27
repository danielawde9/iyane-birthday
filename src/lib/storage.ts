import { createSupabaseServiceClient } from "./supabase/admin";
import { env } from "./env";

/**
 * Turn a stored object key into a public URL. Demo keys (paths under /public,
 * data URIs, or absolute URLs) are returned as-is; real keys are resolved to the
 * Supabase public bucket URL (CDN-cached).
 */
export function toPublicUrl(key: string): string {
  if (key.startsWith("/") || key.startsWith("data:") || key.startsWith("http")) return key;
  return `${env.supabaseUrl}/storage/v1/object/public/${env.storageBucket}/${key}`;
}

/** Upload bytes to the photos bucket using the service role. Throws if storage isn't configured. */
export async function uploadToStorage(
  key: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<void> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase storage is not configured");
  const { error } = await supabase.storage.from(env.storageBucket).upload(key, body, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw error;
}

/** Remove an object from storage (best-effort). */
export async function removeFromStorage(keys: string[]): Promise<void> {
  const realKeys = keys.filter((k) => k && !k.startsWith("/") && !k.startsWith("data:") && !k.startsWith("http"));
  if (realKeys.length === 0) return;
  const supabase = createSupabaseServiceClient();
  if (!supabase) return;
  await supabase.storage.from(env.storageBucket).remove(realKeys);
}
