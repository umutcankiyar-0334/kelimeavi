// supabase/functions/activate-round/index.ts
// Called by any client after the result countdown ends.
// Transitions a 'pending' round to 'active'. Idempotent.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createAdminClient } from '../_shared/db.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

serve(async (req: Request) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const { roundId } = await req.json();
    if (!roundId) return errorResponse('roundId required.');

    const supabase = createAdminClient();

    // Fetch the round
    const { data: round, error: fetchErr } = await supabase
      .from('rounds')
      .select('id, status, started_at, ends_at, room_id')
      .eq('id', roundId)
      .single();

    if (fetchErr || !round) return errorResponse('Round not found.');

    if (round.status === 'active') {
      return jsonResponse({ success: true, alreadyActive: true });
    }

    if (round.status !== 'pending') {
      return errorResponse(`Cannot activate round in status: ${round.status}`);
    }

    // Recalculate times based on NOW (so late clients get the correct window)
    const now = new Date();
    const { data: room } = await supabase
      .from('rooms')
      .select('round_duration_seconds')
      .eq('id', round.room_id)
      .single();

    const durationMs = (room?.round_duration_seconds ?? 30) * 1000;
    const startedAt = now.toISOString();
    const endsAt = new Date(now.getTime() + durationMs).toISOString();

    // IDEMPOTENT: only update if still pending
    const { data: updated } = await supabase
      .from('rounds')
      .update({ status: 'active', started_at: startedAt, ends_at: endsAt })
      .eq('id', roundId)
      .eq('status', 'pending')
      .select();

    if (!updated || updated.length === 0) {
      // Another client already activated it
      return jsonResponse({ success: true, alreadyActive: true });
    }

    await supabase.from('room_events').insert({
      room_id: round.room_id,
      type: 'round_activated',
      payload: { round_id: roundId, started_at: startedAt, ends_at: endsAt },
    });

    return jsonResponse({ success: true, startedAt, endsAt });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
