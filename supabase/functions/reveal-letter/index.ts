// supabase/functions/reveal-letter/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/db.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { validatePlayerToken } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { playerId, token, roundId } = await req.json();

    if (!playerId || !token || !roundId) {
      return errorResponse('Invalid parameters.');
    }

    const supabase = createAdminClient();

    // 1. Authenticate
    const isValid = await validatePlayerToken(supabase, playerId, token);
    if (!isValid) {
      return errorResponse('Unauthorized.', 401);
    }

    // 2. Fetch the round and its room to check status and game mode
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select('id, room_id, status, original_word')
      .eq('id', roundId)
      .single();

    if (roundError || !round) {
      return errorResponse('Round not found.');
    }

    if (round.status !== 'active') {
      return errorResponse('Round is not active.');
    }

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, game_mode')
      .eq('id', round.room_id)
      .single();

    if (roomError || !room || room.game_mode !== 'dictionary') {
      return errorResponse('Letter reveal is only available in Soru & Cevap (dictionary) mode.');
    }

    // 3. Fetch all active and connected players in the room
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, is_connected')
      .eq('room_id', round.room_id)
      .eq('is_connected', true);

    if (playersError || !players || players.length === 0) {
      return errorResponse('Could not fetch active players.');
    }

    // 4. Fetch existing reveal clicks for this round
    const { data: existingClicks, error: clicksError } = await supabase
      .from('room_events')
      .select('id, payload')
      .eq('room_id', round.room_id)
      .eq('type', 'letter_reveal_vote')
      .filter('payload->>round_id', 'eq', roundId);

    if (clicksError) {
      return errorResponse('Could not check existing clicks.');
    }

    const alreadyClicked = existingClicks?.some((c) => c.payload?.player_id === playerId);
    if (alreadyClicked) {
      // Just return current state safely, do not register duplicate votes
      return jsonResponse({
        success: true,
        alreadyVoted: true,
        totalVotes: existingClicks.length,
        requiredVotes: players.length,
        voted: true
      });
    }

    // 5. Insert new reveal click event
    const { error: insertEventError } = await supabase
      .from('room_events')
      .insert({
        room_id: round.room_id,
        type: 'letter_reveal_vote',
        payload: {
          round_id: roundId,
          player_id: playerId,
        }
      });

    if (insertEventError) {
      return errorResponse('Could not save reveal action.');
    }

    const newVoteCount = (existingClicks?.length || 0) + 1;
    const requiredVotes = players.length;

    let letterRevealed = false;
    let revealedIndex = -1;
    let revealedLetter = '';
    let newRevealedIndices: number[] = [];

    // 6. Check if ALL connected players clicked
    if (newVoteCount >= requiredVotes) {
      // Time to reveal a new letter!
      // Fetch currently revealed indices from room_events for this round
      const { data: revealEvents } = await supabase
        .from('room_events')
        .select('payload')
        .eq('room_id', round.room_id)
        .eq('type', 'letter_revealed')
        .filter('payload->>round_id', 'eq', roundId);

      const alreadyRevealed = revealEvents?.map((e) => e.payload?.index as number) || [];
      const wordLength = round.original_word.length;

      // Find unrevealed indices
      const unrevealed: number[] = [];
      for (let i = 0; i < wordLength; i++) {
        if (!alreadyRevealed.includes(i)) {
          unrevealed.push(i);
        }
      }

      if (unrevealed.length > 0) {
        // Pick a random unrevealed index
        revealedIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        revealedLetter = round.original_word[revealedIndex];
        letterRevealed = true;
        newRevealedIndices = [...alreadyRevealed, revealedIndex];

        // Insert letter_revealed event
        await supabase
          .from('room_events')
          .insert({
            room_id: round.room_id,
            type: 'letter_revealed',
            payload: {
              round_id: roundId,
              index: revealedIndex,
              letter: revealedLetter,
              revealed_indices: newRevealedIndices,
            }
          });

        // Delete all votes for this round so players can request another letter!
        await supabase
          .from('room_events')
          .delete()
          .eq('room_id', round.room_id)
          .eq('type', 'letter_reveal_vote')
          .filter('payload->>round_id', 'eq', roundId);
      }
    }

    return jsonResponse({
      success: true,
      alreadyVoted: false,
      totalVotes: letterRevealed ? 0 : newVoteCount,
      requiredVotes,
      letterRevealed,
      revealedIndex,
      revealedLetter,
      revealedIndices: newRevealedIndices,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500);
  }
});
