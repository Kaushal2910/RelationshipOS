import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

/**
 * Session store stub (P0). Auth is P1 — for now this just holds the Supabase
 * session once we wire sign-in. Kept minimal so the route resolver (App_Flow §2)
 * has a place to read from later.
 */
interface SessionState {
  session: Session | null;
  setSession: (session: Session | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}));
