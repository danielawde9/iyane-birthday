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

-- No anon writes anywhere. (The service role + direct Postgres connection both
-- bypass RLS, so the server can still do everything.)
