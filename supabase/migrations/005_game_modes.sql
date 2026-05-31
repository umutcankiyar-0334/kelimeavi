-- 005_game_modes.sql
-- Add support for game modes (seed_words vs dictionary)

-- Alter rooms to support game modes
ALTER TABLE rooms 
  ADD COLUMN IF NOT EXISTS game_mode text NOT NULL DEFAULT 'seed_words'
  CHECK (game_mode IN ('seed_words', 'dictionary'));

-- Alter rounds to support dictionary clues and word length
ALTER TABLE rounds
  ADD COLUMN IF NOT EXISTS clue text,
  ADD COLUMN IF NOT EXISTS word_length integer NOT NULL DEFAULT 0;

-- Re-create public view for rounds to include clue and word_length
DROP VIEW IF EXISTS public_current_round;
CREATE OR REPLACE VIEW public_current_round AS
  SELECT
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
    clue,
    word_length,
    -- KEY SECURITY: hide original_word while round is active
    CASE
      WHEN status = 'finished' THEN original_word
      ELSE null
    END AS original_word
  FROM rounds;

-- Re-create public view for rooms to include game_mode
DROP VIEW IF EXISTS public_room_state;

-- Re-create public view for rooms to include game_mode
CREATE OR REPLACE VIEW public_room_state AS
  SELECT
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
    expires_at,
    game_mode
  FROM rooms;
