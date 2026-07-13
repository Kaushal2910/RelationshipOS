import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { CalendarItemRow, ItemStatus, CalendarType } from '../database.types';
import type { Place } from '../../types/place';

export const calendarKeys = {
  byCouple: (coupleId: string | undefined) => ['calendar', coupleId] as const,
  byMonth: (coupleId: string | undefined, monthStart: string, monthEnd: string) =>
    ['calendar', coupleId, monthStart, monthEnd] as const,
};

export interface CalendarItem extends CalendarItemRow {
  place: Place | null;
}

async function fetchCalendarMonth(
  coupleId: string,
  monthStart: string,
  monthEnd: string
): Promise<CalendarItem[]> {
  const { data, error } = await (supabase as any)
    .from('calendar_items')
    .select('*, place:places(*)')
    .eq('couple_id', coupleId)
    .gte('starts_at', monthStart)
    .lte('starts_at', monthEnd)
    .is('deleted_at', null)
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarItem[];
}

async function createCalendarItem(
  coupleId: string,
  item: Omit<CalendarItemRow, 'id' | 'couple_id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<CalendarItem> {
  const { data, error } = await (supabase as any)
    .from('calendar_items')
    .insert({ ...item, couple_id: coupleId })
    .select('*, place:places(*)')
    .single();

  if (error) throw error;
  return data as CalendarItem;
}

async function updateCalendarItem(
  id: string,
  updates: Partial<CalendarItemRow>
): Promise<CalendarItem> {
  const { data, error } = await (supabase as any)
    .from('calendar_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, place:places(*)')
    .single();

  if (error) throw error;
  return data as CalendarItem;
}

async function deleteCalendarItem(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('calendar_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Calendar items for a couple within a month range.
 */
export function useCalendarMonth(
  coupleId: string | undefined,
  monthStart: string,
  monthEnd: string
) {
  return useQuery({
    queryKey: calendarKeys.byMonth(coupleId, monthStart, monthEnd),
    queryFn: () => fetchCalendarMonth(coupleId as string, monthStart, monthEnd),
    staleTime: 60_000,
    enabled: !!coupleId,
  });
}

/**
 * Create a new calendar item.
 */
export function useCreateCalendarItem(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Omit<CalendarItemRow, 'id' | 'couple_id' | 'created_at' | 'updated_at' | 'deleted_at'>) =>
      createCalendarItem(coupleId as string, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.byCouple(coupleId) });
    },
  });
}

/**
 * Update an existing calendar item.
 */
export function useUpdateCalendarItem(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CalendarItemRow> }) =>
      updateCalendarItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.byCouple(coupleId) });
    },
  });
}

/**
 * Delete a calendar item (soft delete).
 */
export function useDeleteCalendarItem(coupleId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCalendarItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.byCouple(coupleId) });
    },
  });
}

async function fetchNextCalendarItem(coupleId: string): Promise<CalendarItem | null> {
  const { data, error } = await (supabase as any)
    .from('calendar_items')
    .select('*, place:places(*)')
    .eq('couple_id', coupleId)
    .gte('starts_at', new Date().toISOString())
    .is('deleted_at', null)
    .eq('status', 'planned')
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as CalendarItem | null;
}

/**
 * Fetch the single next upcoming planned calendar item.
 */
export function useNextCalendarItem(coupleId: string | undefined) {
  return useQuery({
    queryKey: ['calendar', coupleId, 'next'],
    queryFn: () => fetchNextCalendarItem(coupleId as string),
    enabled: !!coupleId,
    staleTime: 30_000,
  });
}