import type { ProfileRow } from '../lib/database.types';

/**
 * Profile domain type. Currently a 1:1 alias of the DB row — kept as its own
 * type so screens import from `types/` (not `lib/`) and we can add computed
 * fields later without touching call sites.
 */
export type Profile = ProfileRow;

/** True once the user has completed profile setup (drives the onboarding gate). */
export const isOnboarded = (profile: Profile | null | undefined): boolean =>
  !!profile?.onboarded_at;
