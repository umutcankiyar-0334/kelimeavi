-- 001_initial_schema.sql
-- Turkish Word Game — Initial Database Schema
-- Run via: supabase db push

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── rooms ───────────────────────────────────────────────────────────────────
create table if not exists rooms (
  id                      uuid primary key default gen_random_uuid(),
  code                    text not null unique,
  host_player_id          uuid,  -- set after first player is created
  status                  text not null default 'lobby'
                            check (status in ('lobby', 'playing', 'finished', 'expired')),
  max_players             int not null default 8,
  min_players             int not null default 2,
  total_rounds            int not null default 8,
  round_duration_seconds  int not null default 30,
  result_duration_seconds int not null default 7,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  expires_at              timestamptz
);

-- Auto-expire rooms after 2 hours of inactivity (set by edge functions)
create index if not exists rooms_status_idx on rooms (status);
create index if not exists rooms_code_idx on rooms (code);
create index if not exists rooms_expires_at_idx on rooms (expires_at);

-- ─── players ─────────────────────────────────────────────────────────────────
create table if not exists players (
  id                  uuid primary key default gen_random_uuid(),
  room_id             uuid not null references rooms (id) on delete cascade,
  nickname            text not null,
  session_token_hash  text not null,
  score               int not null default 0,
  combo_count         int not null default 0,
  is_host             boolean not null default false,
  is_ready            boolean not null default false,
  is_connected        boolean not null default true,
  last_seen_at        timestamptz not null default now(),
  joined_at           timestamptz not null default now(),

  -- Unique nickname per room (case-insensitive)
  constraint players_room_nickname_unique unique (room_id, lower(nickname))
);

-- Nickname constraints
alter table players
  add constraint players_nickname_length
    check (length(nickname) between 2 and 16);

create index if not exists players_room_id_idx on players (room_id);
create index if not exists players_last_seen_idx on players (last_seen_at);

-- ─── rounds ──────────────────────────────────────────────────────────────────
create table if not exists rounds (
  id                  uuid primary key default gen_random_uuid(),
  room_id             uuid not null references rooms (id) on delete cascade,
  round_number        int not null,
  status              text not null default 'pending'
                        check (status in ('pending', 'active', 'finished')),
  scrambled_letters   text[] not null,
  original_word       text not null,   -- PROTECTED via RLS
  difficulty          text not null
                        check (difficulty in ('easy', 'medium', 'hard')),
  distractor_letters  text[] not null default '{}',
  started_at          timestamptz not null,
  ends_at             timestamptz not null,
  finished_at         timestamptz,
  created_at          timestamptz not null default now(),

  -- One row per round per room
  constraint rounds_room_round_unique unique (room_id, round_number)
);

create index if not exists rounds_room_id_idx on rounds (room_id);
create index if not exists rounds_status_idx on rounds (status);
create index if not exists rounds_ends_at_idx on rounds (ends_at);

-- ─── answers ─────────────────────────────────────────────────────────────────
create table if not exists answers (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references rooms (id) on delete cascade,
  round_id         uuid not null references rounds (id) on delete cascade,
  player_id        uuid not null references players (id) on delete cascade,
  submitted_word   text not null,
  normalized_word  text not null,
  is_correct       boolean,          -- null until round finishes
  response_time_ms int,              -- server-calculated, null until scored
  base_score       int not null default 0,
  speed_bonus      int not null default 0,
  combo_bonus      int not null default 0,
  score_awarded    int not null default 0,
  submitted_at     timestamptz not null default now(),

  -- One answer per player per round
  constraint answers_round_player_unique unique (round_id, player_id)
);

create index if not exists answers_round_id_idx on answers (round_id);
create index if not exists answers_player_id_idx on answers (player_id);
create index if not exists answers_room_id_idx on answers (room_id);

-- ─── room_events ─────────────────────────────────────────────────────────────
create table if not exists room_events (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists room_events_room_id_idx on room_events (room_id);
create index if not exists room_events_created_at_idx on room_events (created_at);

-- ─── update trigger for rooms.updated_at ─────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rooms_updated_at
  before update on rooms
  for each row execute function update_updated_at();
