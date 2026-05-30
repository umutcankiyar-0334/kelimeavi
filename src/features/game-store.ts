import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { PublicPlayer, PublicRound, Room } from '@/lib/supabase/types';

export interface GameState {
  // Identity
  playerId: string | null;
  nickname: string | null;
  isHost: boolean;
  sessionToken: string | null;

  // Room
  roomId: string | null;
  roomCode: string | null;
  roomStatus: Room['status'] | null;
  hostPlayerId: string | null;
  totalRounds: number;
  roundDurationSeconds: number;
  resultDurationSeconds: number;

  // Players & Round State
  players: PublicPlayer[];
  currentRound: PublicRound | null;
  myLastAnswer: string | null;
  isSubmitted: boolean;

  // Sync state
  isConnecting: boolean;
  isSynced: boolean;
  error: string | null;

  // Action setters
  setIdentity: (playerId: string, nickname: string, isHost: boolean, token: string) => void;
  setRoom: (room: Partial<Room>) => void;
  setPlayers: (players: PublicPlayer[]) => void;
  setCurrentRound: (round: PublicRound | null) => void;
  setSubmittedState: (isSubmitted: boolean, answer: string | null) => void;
  resetGameStore: () => void;
  setError: (msg: string | null) => void;
  setConnecting: (val: boolean) => void;
  setSynced: (val: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerId: null,
  nickname: null,
  isHost: false,
  sessionToken: null,

  roomId: null,
  roomCode: null,
  roomStatus: null,
  hostPlayerId: null,
  totalRounds: 8,
  roundDurationSeconds: 30,
  resultDurationSeconds: 7,

  players: [],
  currentRound: null,
  myLastAnswer: null,
  isSubmitted: false,

  isConnecting: false,
  isSynced: false,
  error: null,

  setIdentity: (playerId, nickname, isHost, token) => {
    // Save to localStorage for robust reconnects
    localStorage.setItem('tr_word_game_player_id', playerId);
    localStorage.setItem('tr_word_game_nickname', nickname);
    localStorage.setItem('tr_word_game_is_host', String(isHost));
    localStorage.setItem('tr_word_game_token', token);

    set({ playerId, nickname, isHost, sessionToken: token });
  },

  setRoom: (room) => {
    if (room.code) localStorage.setItem('tr_word_game_room_code', room.code);
    if (room.id) localStorage.setItem('tr_word_game_room_id', room.id);

    set((state) => ({
      roomId: room.id ?? state.roomId,
      roomCode: room.code ?? state.roomCode,
      roomStatus: room.status ?? state.roomStatus,
      hostPlayerId: room.host_player_id ?? state.hostPlayerId,
      totalRounds: room.total_rounds ?? state.totalRounds,
      roundDurationSeconds: room.round_duration_seconds ?? state.roundDurationSeconds,
      resultDurationSeconds: room.result_duration_seconds ?? state.resultDurationSeconds,
    }));
  },

  setPlayers: (players) => set({ players }),

  setCurrentRound: (round) => {
    set((state) => {
      // If round changes or resets, reset submission state
      if (!round || state.currentRound?.id !== round.id) {
        return { currentRound: round, isSubmitted: false, myLastAnswer: null };
      }
      return { currentRound: round };
    });
  },

  setSubmittedState: (isSubmitted, answer) => set({ isSubmitted, myLastAnswer: answer }),

  resetGameStore: () => {
    localStorage.removeItem('tr_word_game_player_id');
    localStorage.removeItem('tr_word_game_nickname');
    localStorage.removeItem('tr_word_game_is_host');
    localStorage.removeItem('tr_word_game_token');
    localStorage.removeItem('tr_word_game_room_code');
    localStorage.removeItem('tr_word_game_room_id');

    set({
      playerId: null,
      nickname: null,
      isHost: false,
      sessionToken: null,
      roomId: null,
      roomCode: null,
      roomStatus: null,
      hostPlayerId: null,
      players: [],
      currentRound: null,
      myLastAnswer: null,
      isSubmitted: false,
      isConnecting: false,
      isSynced: false,
      error: null,
    });
  },

  setError: (error) => set({ error }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setSynced: (isSynced) => set({ isSynced }),
}));
