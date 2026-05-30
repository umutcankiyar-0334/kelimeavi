-- 003_safe_views.sql
-- Public-safe views that hide sensitive data.
-- CRITICAL: public_current_round hides original_word when round is active.

-- ─── public_players ──────────────────────────────────────────────────────────
-- Exposes player data WITHOUT session_token_hash
create or replace view public_players as
  select
    id,
    room_id,
    nickname,
    score,
    combo_count,
    is_host,
    is_ready,
    is_connected,
    last_seen_at,
    joined_at
  from players;

-- ─── public_current_round ────────────────────────────────────────────────────
-- For active rounds: original_word is null.
-- For finished rounds: original_word is revealed.
-- Clients should ONLY use this view, never query rounds directly.
create or replace view public_current_round as
  select
    id,
    room_id,
    round_number,
    status,
    scrambled_letters,
    distractor_letters,
    difficulty,
    started_at,
    ends_at,
    finished_at,
    created_at,
    -- KEY SECURITY: hide original_word while round is active
    case
      when status = 'finished' then original_word
      else null
    end as original_word
  from rounds;

-- ─── public_room_state ───────────────────────────────────────────────────────
-- Room info without internal fields
create or replace view public_room_state as
  select
    id,
    code,
    host_player_id,
    status,
    max_players,
    min_players,
    total_rounds,
    round_duration_seconds,
    result_duration_seconds,
    created_at,
    updated_at,
    expires_at
  from rooms;

-- ─── public_round_answers ────────────────────────────────────────────────────
-- Reveals answer details only after round is finished
create or replace view public_round_answers as
  select
    a.id,
    a.room_id,
    a.round_id,
    a.player_id,
    a.submitted_word,
    a.is_correct,
    a.response_time_ms,
    a.base_score,
    a.speed_bonus,
    a.combo_bonus,
    a.score_awarded,
    a.submitted_at
  from answers a
  join rounds r on r.id = a.round_id
  where r.status = 'finished';
