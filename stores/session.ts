import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

/**
 * Auth session store (P1). Holds the Supabase session + a bootstrap flag so the
 * root layout can keep the splash up until the initial getSession() resolves.
 *
 * Profile is NOT stored here — it lives in TanStack Query via useProfile() to
 * keep a single source of truth. Read the user id from `session.user.id`.
 */
interface SessionState {
  session: Session | null;
  /** True until the first getSession() call resolves on app boot. */
  isBootstrapping: boolean;
  setSession: (session: Session | null) => void;
  setBootstrapping: (value: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  isBootstrapping: true,
  setSession: (session) => set({ session }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
}));
