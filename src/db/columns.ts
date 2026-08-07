/**
 * The columns every read selects, explicitly.
 *
 * `edit_token_hash` is deliberately absent. It is a bearer secret, and
 * supabase/policies.sql revokes it from the anon role with a column-level GRANT.
 * Postgres expands `select *` to every column BEFORE checking privileges, so a
 * `.select("*")` from the anon client would fail outright with
 * "permission denied for column edit_token_hash" — naming columns here is what
 * keeps the public reads working, and what keeps the hash out of the browser.
 *
 * Keep these in sync with the GRANT statements in supabase/policies.sql.
 */
export const PHOTO_COLS =
  "id,event_id,storage_key,thumb_key,width,height,uploader_name,caption,featured,status,edited_at,created_at";

export const GUESTBOOK_COLS = "id,event_id,name,message,status,edited_at,created_at";
