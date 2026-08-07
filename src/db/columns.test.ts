import { describe, it, expect } from "vitest";
import { PHOTO_COLS, GUESTBOOK_COLS } from "./columns";

/**
 * These constants are coupled to the column GRANTs in supabase/policies.sql.
 * Postgres expands `select *` before checking column privileges, so once anon
 * loses SELECT on edit_token_hash, any `select("*")` fails outright — and if the
 * hash were ever added back to this list it would ship to every browser.
 */
describe("public column lists", () => {
  it("never selects the capability-token hash", () => {
    expect(PHOTO_COLS).not.toContain("edit_token_hash");
    expect(GUESTBOOK_COLS).not.toContain("edit_token_hash");
  });

  it("is never a wildcard", () => {
    expect(PHOTO_COLS).not.toContain("*");
    expect(GUESTBOOK_COLS).not.toContain("*");
  });

  it("names every column the mappers read", () => {
    for (const c of ["id", "event_id", "storage_key", "thumb_key", "width", "height", "uploader_name", "caption", "featured", "status", "edited_at", "created_at"]) {
      expect(PHOTO_COLS.split(",")).toContain(c);
    }
    for (const c of ["id", "event_id", "name", "message", "status", "edited_at", "created_at"]) {
      expect(GUESTBOOK_COLS.split(",")).toContain(c);
    }
  });

  it("is a bare comma-separated list PostgREST accepts (no spaces)", () => {
    expect(PHOTO_COLS).toMatch(/^[a-z_]+(,[a-z_]+)*$/);
    expect(GUESTBOOK_COLS).toMatch(/^[a-z_]+(,[a-z_]+)*$/);
  });
});
