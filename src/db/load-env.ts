import { config } from "dotenv";

// Load env for standalone scripts (seed). `.env.local` wins over `.env`.
// Imported first so process.env is populated before env.ts is evaluated.
config({ path: [".env.local", ".env"] });
