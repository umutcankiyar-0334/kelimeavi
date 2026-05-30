// supabase/functions/heartbeat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/db.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { validatePlayerToken } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { playerId, token } = await req.json();

    if (!playerId || !token) {
      return errorResponse('Invalid parameters.');
    }

    const supabase = createAdminClient();

    // Authenticate
    const isValid = await validatePlayerToken(supabase, playerId, token);
    if (!isValid) {
      return errorResponse('Unauthorized.', 401);
    }

    const now = new Date();

    // 1. Update current player's heartbeat status
    const { data: currentPlayer, error: playerError } = await supabase
      .from('players')
      .update({
        last_seen_at: now.toISOString(),
        is_connected: true,
      })
      .eq('id', playerId)
      .select('room_id, is_host')
      .single();

    if (playerError || !currentPlayer) {
      return errorResponse('Failed to update player status.');
    }

    const roomId = currentPlayer.room_id;

    // 2. Scan and flag inactive players in the room (older than 12 seconds)
    const timeoutThreshold = new Date(now.getTime() - 12000).toISOString();

    await supabase
      .from('players')
      .update({ is_connected: false })
      .eq('room_id', roomId)
      .lt('last_seen_at', timeoutThreshold);

    // 3. Fetch all active/connected players to check host status
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select('id, is_host, is_connected, joined_at, nickname')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (fetchError || !players) {
      return errorResponse('Failed to scan players.');
    }

    const activePlayers = players.filter((p) => p.is_connected);
    const currentHost = players.find((p) => p.is_host);

    let hostMigrated = false;
    let newHostId = null;

    // 4. Host migration: if the host is no longer connected and other players exist
    if ((!currentHost || !currentHost.is_connected) && activePlayers.length > 0) {
      const nextHost = activePlayers[0]; // Oldest connected player becomes the host
      newHostId = nextHost.id;

      // Revoke old host
      await supabase
        .from('players')
        .update({ is_host: false })
        .eq('room_id', roomId);

      // Appoint new host
      await supabase
        .from('players')
        .update({ is_host: true })
        .eq('id', newHostId);

      // Update room host pointer
      await supabase
        .from('rooms')
        .update({ host_player_id: newHostId })
        .eq('id', roomId);

      hostMigrated = true;

      await supabase.from('room_events').insert({
        room_id: roomId,
        type: 'host_migrated',
        payload: {
          previous_host_id: currentHost?.id || null,
          new_host_id: newHostId,
          new_host_nickname: nextHost.nickname,
        },
      });
    }

    // 5. Auto-expire rooms if empty (all disconnected) for longer than 5 minutes
    if (activePlayers.length === 0) {
      // Just update room's expires_at to be soon
      await supabase
        .from('rooms')
        .update({ expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() })
        .eq('id', roomId);
    } else {
      // Refresh room expiry back to 2 hours
      await supabase
        .from('rooms')
        .update({ expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() })
        .eq('id', roomId);
    }

    return jsonResponse({
      success: true,
      activeCount: activePlayers.length,
      hostMigrated,
      newHostId,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500);
  }
});
