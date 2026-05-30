// supabase/functions/start-game/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/db.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { validatePlayerToken } from '../_shared/auth.ts';
import { selectWord, scrambleWord, generateDistractors, mergeAndShuffle, getDistractorCount } from '../_shared/word-engine.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { playerId, token, roomId } = await req.json();

    if (!playerId || !token || !roomId) {
      return errorResponse('Invalid parameters.');
    }

    const supabase = createAdminClient();

    // Authenticate
    const isValid = await validatePlayerToken(supabase, playerId, token);
    if (!isValid) {
      return errorResponse('Unauthorized.', 401);
    }

    // Verify host
    const { data: hostCheck, error: hostError } = await supabase
      .from('players')
      .select('is_host, room_id')
      .eq('id', playerId)
      .single();

    if (hostError || !hostCheck || !hostCheck.is_host || hostCheck.room_id !== roomId) {
      return errorResponse('Only the host can start the game.');
    }

    // Verify room status and player list
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, code, status, total_rounds, round_duration_seconds')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return errorResponse('Room not found.');
    }

    if (room.status !== 'lobby') {
      return errorResponse('Game has already started.');
    }

    // Fetch players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, is_ready')
      .eq('room_id', roomId);

    if (playersError || !players || players.length < 1) {
      return errorResponse('Could not fetch players.');
    }

    // Check ready state (all but host must be ready)
    const unreadyPlayers = players.filter((p) => p.id !== playerId && !p.is_ready);
    if (unreadyPlayers.length > 0) {
      return errorResponse('Wait for all players to be ready.');
    }

    // Select the first word
    const roundConfig = { roundNumber: 1, totalRounds: room.total_rounds };
    const wordEntry = selectWord(roundConfig, []);

    const wordLetters = [...wordEntry.word];
    const difficultyConfig = wordEntry.difficulty;
    const distractorCount = getDistractorCount(1, room.total_rounds, difficultyConfig);
    const distractors = generateDistractors(wordLetters, distractorCount);
    const scrambled = mergeAndShuffle(wordLetters, distractors);

    const roundDurationMs = room.round_duration_seconds * 1000;
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + roundDurationMs);

    // Create Round 1
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .insert({
        room_id: roomId,
        round_number: 1,
        status: 'active',
        scrambled_letters: scrambled,
        original_word: wordEntry.word,
        difficulty: difficultyConfig,
        distractor_letters: distractors,
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .select()
      .single();

    if (roundError || !round) {
      return errorResponse('Failed to start first round: ' + roundError?.message);
    }

    // Set room status to playing
    const { error: updateError } = await supabase
      .from('rooms')
      .update({ status: 'playing' })
      .eq('id', roomId);

    if (updateError) {
      // Cleanup round
      await supabase.from('rounds').delete().eq('id', round.id);
      return errorResponse('Failed to update room status.');
    }

    // Broadcast event (optional, or rely on Postgres realtime)
    await supabase.from('room_events').insert({
      room_id: roomId,
      type: 'game_started',
      payload: { round_id: round.id },
    });

    return jsonResponse({
      room: { id: roomId, status: 'playing' },
      roundId: round.id,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500);
  }
});
