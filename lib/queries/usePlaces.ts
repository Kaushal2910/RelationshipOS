import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { Place } from '../../types/place';

export const placesKeys = {
  all: ['places'] as const,
};

async function fetchPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * P0 "prove the pipe" query: the active places deck.
 * P3 will replace this with the filtered, swipe-excluded deck query
 * (Backend_Schema §10).
 */
export function usePlaces() {
  return useQuery({
    queryKey: placesKeys.all,
    queryFn: fetchPlaces,
  });
}
