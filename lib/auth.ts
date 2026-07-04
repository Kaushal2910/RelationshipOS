import { supabase } from './supabase';

/**
 * Thin wrappers around Supabase Auth (P1). Screens call these; the session
 * store is updated reactively via onAuthStateChange in the root layout, so
 * these return only what a screen needs to branch on (e.g. "verify your email").
 */

export interface SignUpResult {
  /** True when Supabase created the user but requires email confirmation first. */
  needsEmailVerification: boolean;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Stashed in user_metadata → the 0002 trigger copies it into profiles.display_name.
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;

  // When email confirmation is ON, Supabase returns a user but no session yet.
  const needsEmailVerification = !data.session;
  return { needsEmailVerification };
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

/** Map Supabase auth errors to short, human copy for form-level display. */
export function authErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
  if (/email not confirmed/i.test(msg)) return 'Please verify your email first.';
  if (/user already registered/i.test(msg)) return 'That email is already registered.';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Try again in a bit.';
  if (/network|fetch/i.test(msg)) return 'Network issue. Check your connection.';
  return msg || 'Something went wrong. Try again.';
}
