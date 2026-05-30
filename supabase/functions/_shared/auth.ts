// supabase/functions/_shared/auth.ts
// Token validation shared across all Edge Functions.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function validatePlayerToken(
  supabase: ReturnType<typeof createClient>,
  playerId: string,
  rawToken: string
): Promise<boolean> {
  const tokenHash = hashToken(rawToken);

  const { data, error } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('session_token_hash', tokenHash)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit O,0,1,I for readability
  let code = '';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  for (const b of array) {
    code += chars[b % chars.length];
  }
  return code;
}
