import { createClient } from '@/lib/supabase/client';
import { useGameStore } from './game-store';
import type { PublicPlayer, PublicRound, Room } from '@/lib/supabase/types';

let heartbeatInterval: number | null = null;
let realtimeChannels: any[] = [];

/**
 * Trigger the heartbeat API call.
 */
async function sendHeartbeat(playerId: string, token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ playerId, token }),
    });
    if (!res.ok) {
      console.warn('Heartbeat failed', await res.text());
    } else {
      const data = await res.json();
      if (data.hostMigrated && data.newHostId === playerId) {
        // Player has been promoted to host!
        useGameStore.setState({ isHost: true });
        localStorage.setItem('tr_word_game_is_host', 'true');
      }
    }
  } catch (err) {
    console.error('Heartbeat error', err);
  }
}

/**
 * Call an Edge Function utility.
 */
export async function invokeEdgeFunction(name: string, payload: Record<string, any>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to call function: ${name}`);
  }

  return res.json();
}

/**
 * Initialize all realtime subscriptions for the room.
 */
export function startRealtimeSync(roomId: string, roomCode: string) {
  const supabase = createClient();
  const store = useGameStore.getState();

  // Clear existing channels just in case
  stopRealtimeSync();

  store.setConnecting(true);

  // Helper to re-fetch room state
  const fetchRoomState = async () => {
    const { data } = await supabase
      .from('public_room_state' as any)
      .select('*')
      .eq('id', roomId)
      .maybeSingle();

    if (data) {
      store.setRoom(data as unknown as Partial<Room>);
    }
  };

  // Helper to re-fetch players list
  const fetchPlayersList = async () => {
    const { data } = await supabase
      .from('public_players' as any)
      .select('*')
      .eq('room_id', roomId)
      .order('score', { ascending: false })
      .order('joined_at', { ascending: true });

    store.setPlayers((data as unknown as PublicPlayer[]) || []);
  };

  // Helper to re-fetch safe current round
  const fetchCurrentRound = async () => {
    const { data } = await supabase
      .from('public_current_round' as any)
      .select('*')
      .eq('room_id', roomId)
      .order('round_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    store.setCurrentRound((data as unknown as PublicRound) || null);
  };

  // 1. Listen for room updates
  const roomChannel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        store.setRoom(payload.new as Partial<Room>);
      }
    )
    .subscribe();

  // 2. Listen for players table changes (joins, leaves, scores, ready updates)
  const playersChannel = supabase
    .channel(`players:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
      () => {
        fetchPlayersList();
      }
    )
    .subscribe();

  // 3. Listen for rounds table updates (timer starting, scrambled letters, finishes)
  const roundsChannel = supabase
    .channel(`rounds:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rounds', filter: `room_id=eq.${roomId}` },
      () => {
        fetchCurrentRound();
      }
    )
    .subscribe();

  // 4. Listen for system events / room event notifications
  const eventsChannel = supabase
    .channel(`events:${roomId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'room_events', filter: `room_id=eq.${roomId}` },
      (payload) => {
        console.log('Room event received:', payload.new.type, payload.new.payload);
        if (payload.new.type === 'host_migrated') {
          fetchRoomState();
          fetchPlayersList();
        }
      }
    )
    .subscribe();

  realtimeChannels = [roomChannel, playersChannel, roundsChannel, eventsChannel];

  // Initial loads
  Promise.all([fetchRoomState(), fetchPlayersList(), fetchCurrentRound()])
    .then(() => {
      store.setSynced(true);
      store.setConnecting(false);
    })
    .catch((err) => {
      store.setError(err.message);
      store.setConnecting(false);
    });

  // Start player heartbeats if identity is set
  const { playerId, sessionToken } = store;
  if (playerId && sessionToken) {
    sendHeartbeat(playerId, sessionToken); // immediate first call
    heartbeatInterval = window.setInterval(() => {
      sendHeartbeat(playerId, sessionToken);
    }, 4500); // every 4.5 seconds
  }
}

/**
 * Shut down all subscriptions and intervals.
 */
export function stopRealtimeSync() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  const supabase = createClient();
  realtimeChannels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  realtimeChannels = [];

  const store = useGameStore.getState();
  store.setSynced(false);
}
