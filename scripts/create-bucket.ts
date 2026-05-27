import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: [".env.local", ".env"] });

/** Create the public photos bucket (idempotent). Run with `npm run db:bucket`. */
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "photos";
  if (!url || !key) {
    console.error("✗ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.storage.createBucket(bucket, { public: true });
  if (error && !/exist/i.test(error.message)) {
    console.error("✗", error.message);
    process.exit(1);
  }
  console.log(`✓ Storage bucket '${bucket}' is ready (public).`);
  process.exit(0);
}

main();
