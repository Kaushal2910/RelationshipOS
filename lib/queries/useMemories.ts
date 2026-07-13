import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { MemoryRow, MemoryMediaRow } from '../database.types';
import type { Place } from '../../types/place';

export const memoryKeys = {
  byCouple: (coupleId: string | undefined) => ['memories', coupleId] as const,
  byDate: (coupleId: string | undefined, date: string) =>
    ['memories', coupleId, date] as const,
  byMonth: (coupleId: string | undefined, monthStart: string, monthEnd: string) =>
    ['memories', coupleId, 'month', monthStart, monthEnd] as const,
  byId: (memoryId: string | undefined) => ['memories', memoryId] as const,
};

export interface Memory extends MemoryRow {
  place: Place | null;
  media: MemoryMediaRow[];
}

async function fetchMemoriesByDate(
  coupleId: string,
  date: string
): Promise<Memory[]> {
  const { data, error } = await (supabase as any)
    .from('memories')
    .select('*, place:places(*), media:memory_media(*)')
    .eq('couple_id', coupleId)
    .eq('memory_date', date)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Memory[];
}

async function fetchMemoryById(memoryId: string): Promise<Memory> {
  const { data, error } = await (supabase as any)
    .from('memories')
    .select('*, place:places(*), media:memory_media(*)')
    .eq('id', memoryId)
    .is('deleted_at', null)
    .single();

  if (error) throw error;
  return data as Memory;
}

async function fetchMemoriesMonth(
  coupleId: string,
  monthStart: string,
  monthEnd: string
): Promise<Memory[]> {
  const { data, error } = await (supabase as any)
    .from('memories')
    .select('*, place:places(*), media:memory_media(*)')
    .eq('couple_id', coupleId)
    .gte('memory_date', monthStart)
    .lte('memory_date', monthEnd)
    .is('deleted_at', null)
    .order('memory_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Memory[];
}

async function createMemory(
  coupleId: string,
  memory: Omit<MemoryRow, 'id' | 'couple_id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Memory> {
  const { data, error } = await (supabase as any)
    .from('memories')
    .insert({ ...memory, couple_id: coupleId })
    .select('*, place:places(*), media:memory_media(*)')
    .single();

  if (error) throw error;
  return data as Memory;
}

async function updateMemory(
  id: string,
  updates: Partial<MemoryRow>
): Promise<Memory> {
  const { data, error } = await (supabase as any)
    .from('memories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, place:places(*), media:memory_media(*)')
    .single();

  if (error) throw error;
  return data as Memory;
}

async function deleteMemory(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('memories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Memories for a couple on a specific date.
 */
export function useMemoriesByDate(
  coupleId: string | undefined,
  date: string
) {
  return useQuery({
    queryKey: memoryKeys.byDate(coupleId, date),
    queryFn: () => fetchMemoriesByDate(coupleId as string, date),
    staleTime: 60_000,
    enabled: !!coupleId,
  });
}

/**
 * Single memory by ID.
 */
export function useMemoryById(memoryId: string | undefined) {
  return useQuery({
    queryKey: memoryKeys.byId(memoryId),
    queryFn: () => fetchMemoryById(memoryId as string),
    staleTime: 60_000,
    enabled: !!memoryId,
  });
}

/**
 * Create a new memory.
 */
export function useCreateMemory(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memory: Omit<MemoryRow, 'id' | 'couple_id' | 'created_at' | 'updated_at' | 'deleted_at'>) =>
      createMemory(coupleId as string, memory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.byCouple(coupleId) });
    },
  });
}

/**
 * Update an existing memory.
 */
export function useUpdateMemory(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MemoryRow> }) =>
      updateMemory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.byCouple(coupleId) });
    },
  });
}

/**
 * Delete a memory (soft delete).
 */
export function useDeleteMemory(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMemory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.byCouple(coupleId) });
    },
  });
}

async function fetchRecentMemories(coupleId: string, limit = 5): Promise<Memory[]> {
  const { data, error } = await (supabase as any)
    .from('memories')
    .select('*, place:places(*), media:memory_media(*)')
    .eq('couple_id', coupleId)
    .is('deleted_at', null)
    .order('memory_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Memory[];
}

/**
 * Fetch the recent logged memories for a couple (for collage / history).
 */
export function useRecentMemories(coupleId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: ['memories', coupleId, 'recent', limit],
    queryFn: () => fetchRecentMemories(coupleId as string, limit),
    enabled: !!coupleId,
    staleTime: 30_000,
  });
}

async function fetchLatestMemory(coupleId: string): Promise<Memory | null> {
  const { data, error } = await (supabase as any)
    .from('memories')
    .select('*, place:places(*), media:memory_media(*)')
    .eq('couple_id', coupleId)
    .is('deleted_at', null)
    .order('memory_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Memory | null;
}

/**
 * Fetch the single latest logged memory for a couple.
 */
export function useLatestMemory(coupleId: string | undefined) {
  return useQuery({
    queryKey: ['memories', coupleId, 'latest'],
    queryFn: () => fetchLatestMemory(coupleId as string),
    enabled: !!coupleId,
    staleTime: 30_000,
  });
}