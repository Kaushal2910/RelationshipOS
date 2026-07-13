import { supabase } from './supabase';
import type { SwipeDecision } from './database.types';

/**
 * Record a swipe (like / pass / superlike). The mutual-match detection is
 * handled server-side by the `handle_swipe_match` trigger — no client-side
 * match logic here.
 */
export async function recordSwipe(
  userId: string,
  placeId: string,
  decision: SwipeDecision
): Promise<string> {
  const { error } = await supabase
    .from('swipes')
    .insert({ user_id: userId, place_id: placeId, decision } as never);
  if (error) throw error;
  // Refresh the deck (TanStack Query `invalidateQueries`) so this place drops
  // out. Return the decision so callers can trigger side effects.
  return decision;
}