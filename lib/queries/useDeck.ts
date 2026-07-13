import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { Place } from '../../types/place';

export const deckKeys = {
  filtered: (userId: string | undefined, city?: string, moods?: string[], priceLevel?: number) =>
    ['deck', userId, city, moods, priceLevel] as const,
};

interface DeckParams {
  userId: string | undefined;
  city?: string;
  moods?: string[];
  priceLevel?: number;
}

async function fetchDeck(params: DeckParams): Promise<Place[]> {
  if (!params.userId) return [];

  const { data, error } = await supabase.rpc('get_deck_for_user', {
    p_user_id: params.userId,
    p_city: params.city ?? null,
    p_moods: params.moods ?? null,
    p_price_level: params.priceLevel ?? null,
  } as never);

  if (error) throw error;
  return (data ?? []) as Place[];
}

/**
 * The active Discover deck — places the current user hasn't swiped on yet,
 * with optional city/mood/budget filters. Calls the `get_deck_for_user` RPC
 * (0005_deck_rpc.sql) which excludes swiped places server-side in one round-trip.
 */
export function useDeck(params: DeckParams) {
  return useQuery({
    queryKey: deckKeys.filtered(params.userId, params.city, params.moods, params.priceLevel),
    queryFn: async () => {
      try {
        return await fetchDeck(params);
      } catch (e) {
        console.error('[useDeck] fetch failed:', e);
        throw e;
      }
    },
    staleTime: 60_000,
    enabled: !!params.userId,
  });
}