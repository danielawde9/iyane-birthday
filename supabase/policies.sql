-- Row Level Security policies.
--
-- These are now the LIVE read boundary, not just defense-in-depth: the app reads
-- public data through the anon key (supabase-js), so these SELECT policies are
-- what the public is actually allowed to see. Writes and privileged reads (admin
-- / hidden rows) go through the Supabase service role, which bypasses RLS.
--
-- Run this once in the Supabase SQL editor after applying the Drizzle migration.

alter table events    enable row level security;
alter table photos    enable row level security;
alter table guestbook enable row level security;

-- Public may read event details and only visible photos / guestbook entries.
-- NOTE: "anon read events using (true)" exposes EVERY event row (incl. future/unannounced
-- years' venue + address + date) to anyone holding the public anon key. The app reads events
-- over the direct Postgres connection, so this anon policy is only defense-in-depth. If you'd
-- rather not leak unannounced years, replace the events policy with the scoped one below:
--   create policy "anon read active event" on events for select to anon using (is_active = true);
create policy "anon read events"            on events    for select to anon using (true);
create policy "anon read visible photos"    on photos    for select to anon using (status = 'visible');
create policy "anon read visible guestbook" on guestbook for select to anon using (status = 'visible');

-- The 'visible' comparison above (rather than <> 'hidden') means the third status,
-- 'removed' — a guest taking their own row down — is hidden from the public too.

-- No anon writes anywhere. (The service role + direct Postgres connection both
-- bypass RLS, so the server can still do everything.)

-- ---- Guest capability tokens -------------------------------------------------
--
-- photos.edit_token_hash / guestbook.edit_token_hash hold the sha256 of the
-- token that lets a guest edit or remove their own row. RLS filters ROWS, not
-- COLUMNS, so the read boundary for this column has to be a column-level GRANT:
-- revoke everything from anon, then grant back exactly the public columns.
--
-- GOTCHA: Postgres expands `select *` to every column BEFORE checking column
-- privileges. After this runs, any anon query using select("*") on these tables
-- fails with "permission denied for column edit_token_hash". src/db/queries.ts
-- therefore names its columns explicitly via PHOTO_COLS / GUESTBOOK_COLS
-- (src/db/columns.ts). Keep the two lists in sync — src/db/columns.test.ts
-- guards the hash from creeping back in.

revoke all on photos    from anon;
revoke all on guestbook from anon;

grant select (id, event_id, storage_key, thumb_key, width, height,
              uploader_name, caption, featured, status, edited_at, created_at)
  on photos to anon;

grant select (id, event_id, name, message, status, edited_at, created_at)
  on guestbook to anon;

-- Note what is NOT granted: no insert, update or delete of any kind. anon cannot
-- write `status`, `featured` or `edit_token_hash` because it cannot write these
-- tables at all. Guest edits go through /api/photos/[id] and /api/guestbook/[id],
-- which use the service role — and the service role bypasses both RLS and these
-- grants, which is exactly why those routes must authorize themselves in
-- application code (src/lib/edit-authz.ts).
