// supabase/functions/finish-round/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/db.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { calculateScore, nextComboCount, selectWord, scrambleWord, generateDistractors, mergeAndShuffle, getDistractorCount } from '../_shared/word-engine.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { roundId } = await req.json();

    if (!roundId) {
      return errorResponse('Invalid parameters.');
    }

    const supabase = createAdminClient();

    // Fetch the round to get timing/room context
    const { data: round, error: fetchError } = await supabase
      .from('rounds')
      .select('id, room_id, round_number, status, started_at, ends_at, original_word')
      .eq('id', roundId)
      .single();

    if (fetchError || !round) {
      return errorResponse('Round not found.');
    }

    // IDEMPOTENCY GUARD: Update status to finished ONLY if it was active
    const { data: updatedRounds, error: updateStatusError } = await supabase
      .from('rounds')
      .update({
        status: 'finished',
        finished_at: new Date().toISOString(),
      })
      .eq('id', roundId)
      .eq('status', 'active')
      .select();

    if (updateStatusError) {
      return errorResponse('Failed to finish round: ' + updateStatusError.message);
    }

    if (!updatedRounds || updatedRounds.length === 0) {
      // Round was already processed and finished by a concurrent call!
      return jsonResponse({
        success: true,
        alreadyProcessed: true,
        message: 'Round already finished by another client.',
      });
    }

    const roomId = round.room_id;

    // Fetch the room settings
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('total_rounds, round_duration_seconds')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return errorResponse('Room details not found.');
    }

    // Fetch all players in the room
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, nickname, score, combo_count, is_connected')
      .eq('room_id', roomId);

    if (playersError || !players) {
      return errorResponse('Failed to fetch players.');
    }

    // Fetch all answers submitted for this round
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('id, player_id, submitted_word, normalized_word, submitted_at')
      .eq('round_id', roundId);

    const answersMap = new Map(answers?.map((a) => [a.player_id, a]) || []);
    const roundDurationMs = room.round_duration_seconds * 1000;
    const startedTime = new Date(round.started_at).getTime();

    // We process each player
    for (const player of players) {
      const answer = answersMap.get(player.id);
      let isCorrect = false;
      let scoreAwarded = 0;
      let baseScore = 0;
      let speedBonus = 0;
      let comboBonus = 0;
      let responseTimeMs = roundDurationMs; // default to maximum if didn't answer or answered late

      if (answer) {
        // Correct answer check: exact match of original word with normalized answer
        isCorrect = answer.normalized_word === round.original_word;
        const submittedTime = new Date(answer.submitted_at).getTime();
        responseTimeMs = Math.min(roundDurationMs, Math.max(0, submittedTime - startedTime));

        const scoring = calculateScore(
          round.original_word.length,
          isCorrect,
          responseTimeMs,
          roundDurationMs,
          player.combo_count
        );

        scoreAwarded = scoring.scoreAwarded;
        baseScore = scoring.baseScore;
        speedBonus = scoring.speedBonus;
        comboBonus = scoring.comboBonus;

        // Update answer with calculation details
        await supabase
          .from('answers')
          .update({
            is_correct: isCorrect,
            response_time_ms: responseTimeMs,
            base_score: baseScore,
            speed_bonus: speedBonus,
            combo_bonus: comboBonus,
            score_awarded: scoreAwarded,
          })
          .eq('id', answer.id);
      } else {
        // Player did not submit any answer: create a blank record for audit
        await supabase.from('answers').insert({
          room_id: roomId,
          round_id: roundId,
          player_id: player.id,
          submitted_word: '',
          normalized_word: '',
          is_correct: false,
          response_time_ms: roundDurationMs,
          base_score: 0,
          speed_bonus: 0,
          combo_bonus: 0,
          score_awarded: 0,
        });
      }

      // Update player scores & combos
      const newCombo = nextComboCount(isCorrect, player.combo_count);
      const newScore = player.score + scoreAwarded;

      await supabase
        .from('players')
        .update({
          score: newScore,
          combo_count: newCombo,
        })
        .eq('id', player.id);
    }

    // Determine if game is finished or next round is needed
    const nextRoundNumber = round.round_number + 1;
    let gameFinished = false;

    if (nextRoundNumber > room.total_rounds) {
      // Room status transitions to finished
      await supabase
        .from('rooms')
        .update({ status: 'finished' })
        .eq('id', roomId);

      gameFinished = true;

      await supabase.from('room_events').insert({
        room_id: roomId,
        type: 'game_finished',
        payload: { finished_at: new Date().toISOString() },
      });
    } else {
      // Select the NEXT word (excluding already used words)
      // Fetch all used words in previous rounds
      const { data: previousRounds } = await supabase
        .from('rounds')
        .select('original_word')
        .eq('room_id', roomId);

      const excludeWords = previousRounds?.map((r) => r.original_word) || [];

      const nextRoundConfig = { roundNumber: nextRoundNumber, totalRounds: room.total_rounds };
      const nextWord = selectWord(nextRoundConfig, excludeWords);

      const wordLetters = [...nextWord.word];
      const distractorCount = getDistractorCount(nextRoundNumber, room.total_rounds, nextWord.difficulty);
      const distractors = generateDistractors(wordLetters, distractorCount);
      const scrambled = mergeAndShuffle(wordLetters, distractors);

      // Start time starts AFTER results view duration (e.g. 7 seconds from now)
      const delayMs = 7000; // result duration
      const startedAt = new Date(Date.now() + delayMs);
      const endsAt = new Date(startedAt.getTime() + roundDurationMs);

      // Create next round in pending status (it will activate on client countdown / auto transition)
      await supabase.from('rounds').insert({
        room_id: roomId,
        round_number: nextRoundNumber,
        status: 'pending',
        scrambled_letters: scrambled,
        original_word: nextWord.word,
        difficulty: nextWord.difficulty,
        distractor_letters: distractors,
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
      });

      await supabase.from('room_events').insert({
        room_id: roomId,
        type: 'next_round_pending',
        payload: {
          round_number: nextRoundNumber,
          started_at: startedAt.toISOString(),
        },
      });
    }

    return jsonResponse({
      success: true,
      gameFinished,
      nextRoundNumber: gameFinished ? null : nextRoundNumber,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500);
  }
});
