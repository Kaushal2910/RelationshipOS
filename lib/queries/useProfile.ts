import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { Profile } from '../../types/profile';

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
  /** When true, stamps onboarded_at=now (marks profile setup complete). */
  completeOnboarding?: boolean;
}

/** Updates the current user's profile; invalidates the cached profile on success. */
export function useUpdateProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ displayName, city, completeOnboarding }: UpdateProfileInput) => {
      const updates = {
        display_name: displayName,
        city,
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
