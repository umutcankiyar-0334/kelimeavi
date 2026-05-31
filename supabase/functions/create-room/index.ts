// supabase/functions/create-room/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/db.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { generateRoomCode, generateSecureToken, hashToken } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { nickname, settings } = await req.json();

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 16) {
      return errorResponse('Nickname must be between 2 and 16 characters.');
    }

    const supabase = createAdminClient();

    // Generate unique room code
    let code = generateRoomCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const { data } = await supabase
        .from('rooms')
        .select('id')
        .eq('code', code)
        .maybeSingle();

      if (!data) {
        isUnique = true;
      } else {
        code = generateRoomCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return errorResponse('Could not generate a unique room code. Please try again.');
    }

    const totalRounds = settings?.totalRounds || 8;
    const roundDurationSeconds = settings?.roundDurationSeconds || 30;
    const resultDurationSeconds = settings?.resultDurationSeconds || 9;
    const gameMode = settings?.gameMode || 'seed_words';

    // Create room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code,
        status: 'lobby',
        max_players: 8,
        min_players: 2,
        total_rounds: totalRounds,
        round_duration_seconds: roundDurationSeconds,
        result_duration_seconds: resultDurationSeconds,
        game_mode: gameMode,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours expiry
      })
      .select()
      .single();

    if (roomError || !room) {
      return errorResponse('Failed to create room: ' + roomError?.message);
    }

    // Create host player
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        room_id: room.id,
        nickname: nickname.trim(),
        session_token_hash: tokenHash,
        is_host: true,
        is_ready: true,
        is_connected: true,
      })
      .select()
      .single();

    if (playerError || !player) {
      // Cleanup room if player creation fails
      await supabase.from('rooms').delete().eq('id', room.id);
      return errorResponse('Failed to create host player: ' + playerError?.message);
    }

    // Update room with host player id
    await supabase
      .from('rooms')
      .update({ host_player_id: player.id })
      .eq('id', room.id);

    return jsonResponse({
      room: {
        id: room.id,
        code: room.code,
        status: room.status,
        total_rounds: room.total_rounds,
        round_duration_seconds: room.round_duration_seconds,
        result_duration_seconds: room.result_duration_seconds,
        game_mode: room.game_mode,
      },

      player: {
        id: player.id,
        nickname: player.nickname,
        is_host: true,
      },
      token: rawToken, // Returned ONLY once
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500);
  }
});
