import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { WishlistRow } from '../database.types';
import type { Place } from '../../types/place';

export const wishlistKeys = {
  byCouple: (coupleId: string | undefined) => ['wishlist', coupleId] as const,
};

export interface WishlistItem extends WishlistRow {
  place: Place | null;
}

async function fetchWishlist(coupleId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist')
    .select('*, place:places(*)')
    .eq('couple_id', coupleId)
    .order('both_liked_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WishlistItem[];
}

/**
 * The couple's shared wishlist (mutual matches). Each row has the matched
 * place joined inline so the screen doesn't need separate place fetches.
 */
export function useWishlist(coupleId: string | undefined) {
  return useQuery({
    queryKey: wishlistKeys.byCouple(coupleId),
    queryFn: () => fetchWishlist(coupleId as string),
    staleTime: 60_000,
    enabled: !!coupleId,
  });
}