// supabase/functions/toggle-ready/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/db.ts';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { validatePlayerToken } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { playerId, token, isReady } = await req.json();

    if (!playerId || !token || typeof isReady !== 'boolean') {
      return errorResponse('Invalid parameters.');
    }

    const supabase = createAdminClient();

    // Authenticate
    const isValid = await validatePlayerToken(supabase, playerId, token);
    if (!isValid) {
      return errorResponse('Unauthorized.', 401);
    }

    // Toggle player ready status
    const { data: player, error } = await supabase
      .from('players')
      .update({ is_ready: isReady })
      .eq('id', playerId)
      .select('id', 'nickname', 'is_ready')
      .single();

    if (error || !player) {
      return errorResponse('Failed to update ready state: ' + error?.message);
    }

    return jsonResponse({
      player,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal Server Error', 500);
  }
});
