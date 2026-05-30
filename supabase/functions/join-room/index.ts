// supabase/functions/join-room/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/db.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { generateSecureToken, hashToken } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { roomCode, nickname } = await req.json();

    if (!roomCode || typeof roomCode !== 'string') {
      return errorResponse('Invalid room code.');
    }

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 16) {
      return errorResponse('Nickname must be between 2 and 16 characters.');
    }

    const supabase = createAdminClient();

    // Find active room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, code, status, max_players')
      .eq('code', roomCode.toUpperCase())
      .maybeSingle();

    if (roomError || !room) {
      return errorResponse('Room not found.');
    }

    if (room.status !== 'lobby') {
      return errorResponse('This game has already started.');
    }

    // Check player count
    const { count, error: countError } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id);

    if (countError) {
      return errorResponse('Could not fetch player details.');
    }

    if (count && count >= room.max_players) {
      return errorResponse('Room is full.');
    }

    // Check duplicate nickname
    const { data: duplicate } = await supabase
      .from('players')
      .select('id')
      .eq('room_id', room.id)
      .ilike('nickname', nickname.trim())
      .maybeSingle();

    if (duplicate) {
      return errorResponse('Nickname already taken in this room.');
    }

    // Create player
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        room_id: room.id,
        nickname: nickname.trim(),
        session_token_hash: tokenHash,
        is_host: false,
        is_ready: false,
        is_connected: true,
      })
      .select()
      .single();

    if (playerError || !player) {
      return errorResponse('Failed to join room: ' + playerError?.message);
    }

    return jsonResponse({
      room: {
        id: room.id,
        code: room.code,
        status: room.status,
      },
      player: {
        id: player.id,
        nickname: player.nickname,
        is_host: false,
      },
      token: rawToken, // Returned ONLY once
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500);
  }
});
