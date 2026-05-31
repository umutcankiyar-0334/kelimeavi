/**
 * Supabase Database type definitions.
 * Mirrors the schema defined in supabase/migrations/001_initial_schema.sql
 *
 * These types provide full TypeScript safety for all Supabase queries.
 */

export type RoomStatus = 'lobby' | 'playing' | 'finished' | 'expired';
export type RoundStatus = 'pending' | 'active' | 'finished';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          code: string;
          host_player_id: string | null;
          status: RoomStatus;
          max_players: number;
          min_players: number;
          total_rounds: number;
          round_duration_seconds: number;
          result_duration_seconds: number;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          game_mode: 'seed_words' | 'dictionary';
        };
        Insert: {
          id?: string;
          code: string;
          host_player_id?: string | null;
          status?: RoomStatus;
          max_players?: number;
          min_players?: number;
          total_rounds?: number;
          round_duration_seconds?: number;
          result_duration_seconds?: number;
          game_mode?: 'seed_words' | 'dictionary';
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>;
      };

      players: {
        Row: {
          id: string;
          room_id: string;
          nickname: string;
          session_token_hash: string;
          score: number;
          combo_count: number;
          is_host: boolean;
          is_ready: boolean;
          is_connected: boolean;
          last_seen_at: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          nickname: string;
          session_token_hash: string;
          score?: number;
          combo_count?: number;
          is_host?: boolean;
          is_ready?: boolean;
          is_connected?: boolean;
          last_seen_at?: string;
          joined_at?: string;
        };
        Update: Partial<Database['public']['Tables']['players']['Insert']>;
      };

      rounds: {
        Row: {
          id: string;
          room_id: string;
          round_number: number;
          status: RoundStatus;
          scrambled_letters: string[];
          original_word: string;
          difficulty: DifficultyLevel;
          distractor_letters: string[];
          started_at: string;
          ends_at: string;
          clue: string | null;
          word_length: number;
        };
        Insert: {
          id?: string;
          room_id: string;
          round_number: number;
          status?: RoundStatus;
          scrambled_letters: string[];
          original_word: string;
          difficulty: DifficultyLevel;
          distractor_letters?: string[];
          started_at: string;
          ends_at: string;
          finished_at?: string | null;
          clue?: string | null;
          word_length?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['rounds']['Insert']>;
      };

      answers: {
        Row: {
          id: string;
          room_id: string;
          round_id: string;
          player_id: string;
          submitted_word: string;
          normalized_word: string;
          is_correct: boolean | null;
          response_time_ms: number | null;
          base_score: number;
          speed_bonus: number;
          combo_bonus: number;
          score_awarded: number;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          round_id: string;
          player_id: string;
          submitted_word: string;
          normalized_word: string;
          is_correct?: boolean | null;
          response_time_ms?: number | null;
          base_score?: number;
          speed_bonus?: number;
          combo_bonus?: number;
          score_awarded?: number;
          submitted_at?: string;
        };
        Update: Partial<Database['public']['Tables']['answers']['Insert']>;
      };

      room_events: {
        Row: {
          id: string;
          room_id: string;
          type: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          type: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['room_events']['Insert']>;
      };
    };
    Views: {
      public_players: {
        Row: {
          id: string;
          room_id: string;
          nickname: string;
          score: number;
          combo_count: number;
          is_host: boolean;
          is_ready: boolean;
          is_connected: boolean;
          last_seen_at: string;
          joined_at: string;
        };
      };
      public_current_round: {
        Row: {
          id: string;
          room_id: string;
          round_number: number;
          status: RoundStatus;
          scrambled_letters: string[];
          // original_word is intentionally excluded from this view when status = 'active'
          original_word: string | null;
          difficulty: DifficultyLevel;
          distractor_letters: string[];
          started_at: string;
          ends_at: string;
          finished_at: string | null;
          clue: string | null;
          word_length: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/** Convenience row types */
export type Room = Database['public']['Tables']['rooms']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type Round = Database['public']['Tables']['rounds']['Row'];
export type Answer = Database['public']['Tables']['answers']['Row'];
export type RoomEvent = Database['public']['Tables']['room_events']['Row'];
export type PublicPlayer = Database['public']['Views']['public_players']['Row'];
export type PublicRound = Database['public']['Views']['public_current_round']['Row'];
