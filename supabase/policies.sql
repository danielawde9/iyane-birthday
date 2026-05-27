-- Row Level Security policies (defense-in-depth).
--
-- The app performs all writes with the Supabase service role and reads over a
-- direct Postgres connection (Drizzle); both bypass RLS. These policies harden
-- what the public anon key can do if it is ever used directly.
--
-- Run this once in the Supabase SQL editor after applying the Drizzle migration.

alter table events    enable row level security;
alter table photos    enable row level security;
alter table guestbook enable row level security;

-- Public may read event details and only visible photos / guestbook entries.
create policy "anon read events"            on events    for select to anon using (true);
create policy "anon read visible photos"    on photos    for select to anon using (status = 'visible');
create policy "anon read visible guestbook" on guestbook for select to anon using (status = 'visible');

-- No anon writes anywhere. (The service role + direct Postgres connection both
-- bypass RLS, so the server can still do everything.)
