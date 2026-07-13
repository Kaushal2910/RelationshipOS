import { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../stores/session';
import { useProfile } from '../../lib/queries/useProfile';
import { useCalendarMonth, CalendarItem } from '../../lib/queries/useCalendar';
import { useMemoriesByDate, useCreateMemory, useUpdateMemory, useDeleteMemory, Memory } from '../../lib/queries/useMemories';
import { useTheme } from '../../theme/useTheme';
import { CalendarGrid } from '../../components/calendar/CalendarGrid';
import { AgendaList } from '../../components/calendar/AgendaList';
import { NostalgiaCard } from '../../components/calendar/NostalgiaCard';
import { format, startOfMonth, endOfMonth, addMonths, isSameDay, parseISO } from 'date-fns';

// Create a query hook to load all memories in the current month range (added inline/reusing standard logic)
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

function useMemoriesMonth(coupleId: string | undefined, monthStart: string, monthEnd: string) {
  return useQuery({
    queryKey: ['memories', coupleId, 'month', monthStart, monthEnd],
    queryFn: async () => {
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
    },
    staleTime: 60_000,
    enabled: !!coupleId,
  });
}

/**
 * Calendar screen with monthly grid (always pinned at top) and scrollable agenda view.
 * Shows nostalgia card for "on this day" memories.
 */
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const router = useRouter();
  const userId = useSessionStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const coupleId: string | undefined = profile?.couple_id ?? undefined;

  // Current month state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const monthStart = useMemo<Date>(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo<Date>(() => endOfMonth(currentMonth), [currentMonth]);

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calendar plans data
  const { data: calendarItems, isLoading: isLoadingCalendar } = useCalendarMonth(
    coupleId,
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd')
  );

  // Memories for selected date
  const { data: memories, isLoading: isLoadingMemories } = useMemoriesByDate(
    coupleId,
    format(selectedDate, 'yyyy-MM-dd')
  );

  // Memories for the whole month to show dots on calendar
  const { data: monthMemories } = useMemoriesMonth(
    coupleId,
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd')
  );

  // Nostalgia memory (random from "on this day")
  const nostalgiaMemory = useMemo<Memory | null>(() => {
    if (!memories || memories.length === 0) return null;
    return memories[Math.floor(Math.random() * memories.length)];
  }, [memories]);

  // Calendar items for selected date
  const selectedDateItems = useMemo<CalendarItem[]>(() => {
    if (!calendarItems) return [];
    return calendarItems.filter((item: CalendarItem) =>
      isSameDay(parseISO(item.starts_at), selectedDate)
    );
  }, [calendarItems, selectedDate]);

  // Month navigation
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  // Date selection handler
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Extract date objects for marking days with plans
  const markedDates = useMemo<Date[]>(() => {
    if (!calendarItems) return [];
    return calendarItems.map((item: CalendarItem) => parseISO(item.starts_at));
  }, [calendarItems]);

  // Extract date objects for marking days with logged memories
  const memoryDates = useMemo<Date[]>(() => {
    if (!monthMemories) return [];
    return monthMemories.map((m: Memory) => parseISO(m.memory_date));
  }, [monthMemories]);

  // Loading state
  const isLoading = isLoadingCalendar || isLoadingMemories;

  // Empty state
  if (!coupleId) {
    return (
      <View className="flex-1 items-center justify-center p-base bg-bg" style={{ paddingTop: insets.top }}>
        <Text className="font-inter-bold text-h2 text-text">Calendar</Text>
        <Text className="font-inter text-body text-text-muted mt-sm text-center">
          Pair up to see your shared calendar
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-base pb-sm pt-sm flex-row items-center justify-between z-50">
        <Text className="font-inter-bold text-h1 text-text">Calendar</Text>
        <Pressable
          onPress={() => router.push(`/(tabs)/memory/log?date=${format(selectedDate, 'yyyy-MM-dd')}` as any)}
          accessibilityRole="button"
          accessibilityLabel="Log Memory"
          className="h-10 px-base rounded-full bg-surface-alt border border-border flex-row items-center justify-center active:opacity-90 shadow-e1"
        >
          <Text className="text-[14px] mr-xs">📸</Text>
          <Text className="font-inter-semibold text-caption text-text">Log Memory</Text>
        </Pressable>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View className="absolute inset-0 z-40 flex items-center justify-center bg-bg/50">
          <ActivityIndicator size="large" color={tokens.primary} />
        </View>
      )}

      {/* Calendar Grid (Always on top) */}
      <View className="px-base mb-base">
        <CalendarGrid
          month={currentMonth}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          markedDates={markedDates}
          memoryDates={memoryDates}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
        />
      </View>

      {/* Scrollable Agenda List below the Calendar */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Nostalgia Card */}
        {nostalgiaMemory && (
          <View className="px-base mb-base">
            <NostalgiaCard memory={nostalgiaMemory} />
          </View>
        )}

        {/* Agenda List */}
        <View className="px-base">
          <AgendaList
            date={selectedDate}
            items={selectedDateItems}
            onCreateItem={() => router.push('/(tabs)/calendar/create-item' as any)}
            onItemPress={(item: CalendarItem) => {
              if (item.place_id) {
                router.push(`/(tabs)/place-detail/${item.place_id}` as any);
              }
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
  
