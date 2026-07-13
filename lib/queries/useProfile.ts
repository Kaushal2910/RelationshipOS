import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { Profile } from '../../types/profile';
import type { CoupleRow } from '../database.types';

export const profileKeys = {
  me: (userId: string | undefined) => ['profile', userId] as const,
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/** The current user's profile row. `enabled` off until we have a user id. */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.me(userId),
    queryFn: () => fetchProfile(userId as string),
    enabled: !!userId,
  });
}

interface UpdateProfileInput {
  displayName: string;
  city: string;
  avatarUrl?: string;
  /** When true, stamps onboarded_at=now (marks profile setup complete). */
  completeOnboarding?: boolean;
}

/** Updates the current user's profile; invalidates the cached profile on success. */
export function useUpdateProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ displayName, city, avatarUrl, completeOnboarding }: UpdateProfileInput) => {
      const updates = {
        display_name: displayName,
        city,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        ...(completeOnboarding ? { onboarded_at: new Date().toISOString() } : {}),
      };
      const { error } = await supabase
        .from('profiles')
        // Cast: the hand-written database.types stub doesn't fully satisfy supabase-js's
        // write generics (they resolve to `never`). Payload is correct at runtime; drop the
        // cast once we swap in generated types via `supabase gen types typescript`.
        .update(updates as never)
        .eq('id', userId as string);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.me(userId) });
    },
  });
}

async function fetchCouple(coupleId: string): Promise<CoupleRow | null> {
  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/** Fetch couple metadata. */
export function useCouple(coupleId: string | undefined) {
  return useQuery({
    queryKey: ['couple', coupleId],
    queryFn: () => fetchCouple(coupleId as string),
    enabled: !!coupleId,
    staleTime: 60_000,
  });
}

async function fetchPartnerProfile(userId: string, coupleId: string): Promise<Profile | null> {
  const couple = await fetchCouple(coupleId);
  if (!couple) return null;

  const partnerId = couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id;
  if (!partnerId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', partnerId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/** Fetch the partner's profile. */
export function usePartnerProfile(userId: string | undefined, coupleId: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'partner', userId, coupleId],
    queryFn: () => fetchPartnerProfile(userId as string, coupleId as string),
    enabled: !!userId && !!coupleId,
    staleTime: 60_000,
  });
}

/** Unpair from the current partner. Sets couple_id to null on self profile. */
export function useUnpair(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ couple_id: null } as never)
        .eq('id', userId as string);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.me(userId) });
      qc.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
