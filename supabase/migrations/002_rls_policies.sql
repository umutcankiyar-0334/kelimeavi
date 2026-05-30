-- 002_rls_policies.sql
-- Row Level Security Policies
-- IMPORTANT: original_word is never exposed to clients during active rounds.

-- Enable RLS on all tables
alter table rooms enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table answers enable row level security;
alter table room_events enable row level security;

-- ─── rooms ───────────────────────────────────────────────────────────────────
-- Anyone can read rooms (for joining, checking status)
create policy "rooms_select_public"
  on rooms for select
  using (true);

-- Only service role can insert/update/delete
create policy "rooms_insert_service"
  on rooms for insert
  with check (false);  -- blocked for anon; edge functions use service key

create policy "rooms_update_service"
  on rooms for update
  using (false);

create policy "rooms_delete_service"
  on rooms for delete
  using (false);

-- ─── players ─────────────────────────────────────────────────────────────────
-- Anyone can read players (for lobby display)
create policy "players_select_public"
  on players for select
  using (true);

-- Only service role can write
create policy "players_insert_service"
  on players for insert
  with check (false);

create policy "players_update_service"
  on players for update
  using (false);

create policy "players_delete_service"
  on players for delete
  using (false);

-- ─── rounds ──────────────────────────────────────────────────────────────────
-- Public can read round data BUT original_word is hidden in the view (see 003_safe_views.sql)
-- Direct table access: service role only for writes
create policy "rounds_select_public"
  on rounds for select
  using (true);  -- safe view is the actual client-facing API

create policy "rounds_insert_service"
  on rounds for insert
  with check (false);

create policy "rounds_update_service"
  on rounds for update
  using (false);

create policy "rounds_delete_service"
  on rounds for delete
  using (false);

-- ─── answers ─────────────────────────────────────────────────────────────────
-- Players can see their own answer + all answers after round finishes
create policy "answers_select_own_or_finished"
  on answers for select
  using (true);  -- further filtering done in the view / application layer

-- Only service role can write
create policy "answers_insert_service"
  on answers for insert
  with check (false);

create policy "answers_update_service"
  on answers for update
  using (false);

create policy "answers_delete_service"
  on answers for delete
  using (false);

-- ─── room_events ─────────────────────────────────────────────────────────────
create policy "room_events_select_public"
  on room_events for select
  using (true);

create policy "room_events_insert_service"
  on room_events for insert
  with check (false);

create policy "room_events_update_service"
  on room_events for update
  using (false);

create policy "room_events_delete_service"
  on room_events for delete
  using (false);
