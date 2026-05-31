-- 004_enable_realtime.sql
-- Safely enables Realtime Replication for the game tables.
-- This ensures Supabase broadcasts database modifications to all active players.

do $$
begin
  -- 1. Enable Realtime for 'rooms' table if not already added
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    where p.pubname = 'supabase_realtime' and c.relname = 'rooms'
  ) then
    alter publication supabase_realtime add table rooms;
  end if;

  -- 2. Enable Realtime for 'players' table
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    where p.pubname = 'supabase_realtime' and c.relname = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;

  -- 3. Enable Realtime for 'rounds' table
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    where p.pubname = 'supabase_realtime' and c.relname = 'rounds'
  ) then
    alter publication supabase_realtime add table rounds;
  end if;

  -- 4. Enable Realtime for 'answers' table
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    where p.pubname = 'supabase_realtime' and c.relname = 'answers'
  ) then
    alter publication supabase_realtime add table answers;
  end if;

  -- 5. Enable Realtime for 'room_events' table
  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    where p.pubname = 'supabase_realtime' and c.relname = 'room_events'
  ) then
    alter publication supabase_realtime add table room_events;
  end if;
end $$;
