// supabase/functions/submit-answer/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/db.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { validatePlayerToken } from '../_shared/auth.ts';
import { normalizeWord } from '../_shared/word-engine.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { playerId, token, roundId, submittedWord } = await req.json();

    if (!playerId || !token || !roundId || typeof submittedWord !== 'string') {
      return errorResponse('Invalid parameters.');
    }

    const supabase = createAdminClient();

    // Authenticate
    const isValid = await validatePlayerToken(supabase, playerId, token);
    if (!isValid) {
      return errorResponse('Unauthorized.', 401);
    }

    // Verify round is active and get ends_at
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select('id, room_id, status, ends_at')
      .eq('id', roundId)
      .single();

    if (roundError || !round) {
      return errorResponse('Round not found.');
    }

    if (round.status !== 'active') {
      return errorResponse('This round is no longer active.');
    }

    // Check round deadline
    const now = new Date();
    const deadline = new Date(round.ends_at);
    if (now.getTime() > deadline.getTime() + 1000) { // 1 second grace period for network latency
      return errorResponse('Time has expired for this round.');
    }

    // Check duplicate submission
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('round_id', roundId)
      .eq('player_id', playerId)
      .maybeSingle();

    if (existingAnswer) {
      return errorResponse('You have already submitted an answer for this round.');
    }

    // Normalize answer
    const normalized = normalizeWord(submittedWord) || '';

    // Insert answer
    const { data: answer, error: insertError } = await supabase
      .from('answers')
      .insert({
        room_id: round.room_id,
        round_id: roundId,
        player_id: playerId,
        submitted_word: submittedWord.trim(),
        normalized_word: normalized,
        submitted_at: now.toISOString(),
      })
      .select()
      .single();

    if (insertError || !answer) {
      return errorResponse('Failed to submit answer: ' + insertError?.message);
    }

    // Check if ALL active/connected players in the room have submitted
    const { data: activePlayers } = await supabase
      .from('players')
      .select('id')
      .eq('room_id', round.room_id)
      .eq('is_connected', true);

    const { data: submittedAnswers } = await supabase
      .from('answers')
      .select('player_id')
      .eq('round_id', roundId);

    const activePlayerIds = new Set(activePlayers?.map((p) => p.id) || []);
    const submittedPlayerIds = new Set(submittedAnswers?.map((a) => a.player_id) || []);

    // Filter connected players who have not submitted yet
    const remaining = [...activePlayerIds].filter((id) => !submittedPlayerIds.has(id));

    let autoFinished = false;
    if (remaining.length === 0) {
      // All active players have submitted! We can trigger the finish-round logic immediately or flag it
      autoFinished = true;
    }

    return jsonResponse({
      answerId: answer.id,
      submitted: true,
      autoFinished,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500);
  }
});
