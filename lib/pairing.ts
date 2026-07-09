import { supabase } from './supabase';

/**
 * Pairing (P2). Thin wrappers, same shape as lib/auth.ts. Screens call these;
 * the route guard reacts to profile.couple_id changing after a successful pair.
 */

// Readable alphabet — no 0/O/1/I to avoid mistypes when a partner types the code.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len = 6): string {
  // ponytail: Math.random is fine for a single-use, 7-day, RLS-guarded invite
  // (31^6 ≈ 887M space). Swap to expo-crypto getRandomBytes if abuse shows up.
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

export interface GeneratedInvite {
  code: string;
  coupleId: string;
}

/** Open a pending couple + mint a fresh invite code owned by the current user. */
export async function generateInviteCode(userId: string): Promise<GeneratedInvite> {
  const { data: couple, error: cErr } = await supabase
    .from('couples')
    .insert({ user_a_id: userId } as never)
    .select('id')
    .single();
  if (cErr) throw cErr;
  const coupleId = (couple as { id: string }).id;

  // Retry once on the (astronomically unlikely) code collision.
  for (let attempt = 0; attempt < 2; attempt++) {
    const code = randomCode();
    const { error } = await supabase
      .from('invite_codes')
      .insert({ code, couple_id: coupleId, created_by: userId } as never);
    if (!error) return { code, coupleId };
    if (!/duplicate|unique/i.test(error.message)) throw error;
  }
  throw new Error('Could not generate a code. Try again.');
}

/** Redeem a partner's code server-side (definer RPC). Returns the couple id. */
export async function redeemInviteCode(code: string): Promise<string> {
  // ponytail: cast the call — supabase-js's rpc generic won't infer args from our
  // hand-written database.types stub. Drop the cast once we swap in generated types.
  const { data, error } = await (supabase.rpc as any)('redeem_invite_code', {
    p_code: code.trim().toUpperCase(),
  });
  if (error) throw error;
  return data as string;
}

/** Mark "pair later" so the route guard stops routing the user to pairing. */
export async function skipPairing(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ pairing_skipped_at: new Date().toISOString() } as never)
    .eq('id', userId);
  if (error) throw error;
}

/** Map redeem_invite_code exceptions to short, human copy. */
export function pairingErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/self_code/i.test(msg)) return "That's your own code — share it with your partner instead.";
  if (/already_used/i.test(msg)) return 'That code has already been used.';
  if (/already_paired/i.test(msg)) return "You're already paired with someone.";
  if (/expired/i.test(msg)) return 'That code has expired. Ask your partner for a new one.';
  if (/invalid/i.test(msg)) return "That code doesn't exist. Check the letters and try again.";
  if (/network|fetch/i.test(msg)) return 'Network issue. Check your connection.';
  return 'Could not pair. Try again.';
}
