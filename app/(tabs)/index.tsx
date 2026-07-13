import { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Calendar, Camera, User, Flame, Compass, ArrowRight, Star, Coffee, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useSessionStore } from '../../stores/session';
import { useProfile, useCouple, usePartnerProfile } from '../../lib/queries/useProfile';
import { useNextCalendarItem } from '../../lib/queries/useCalendar';
import { useLatestMemory } from '../../lib/queries/useMemories';
import { differenceInDays, parseISO, format } from 'date-fns';

/**
 * Stitch-inspired Home/Dashboard Screen.
 * Implements overlapping avatars, 16:9 upcoming date hero card,
 * 1:1 latest memory card, bento-grid stats, and tactile scale feedback.
 */
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens } = useTheme();
  const userId = useSessionStore((s) => s.session?.user.id);

  // Queries
  const { data: profile, isLoading: isLoadingProfile, error: profileErr } = useProfile(userId);
  const coupleId = profile?.couple_id;

  const { data: couple, isLoading: isLoadingCouple } = useCouple(coupleId ?? undefined);
  const { data: partner, isLoading: isLoadingPartner } = usePartnerProfile(userId, coupleId ?? undefined);
  const { data: nextDate, isLoading: isLoadingNextDate } = useNextCalendarItem(coupleId ?? undefined);
  const { data: latestMemory, isLoading: isLoadingLatestMemory } = useLatestMemory(coupleId ?? undefined);

  // Streak Calculation
  const streak = useMemo(() => {
    if (!couple?.paired_at) return 0;
    try {
      const days = differenceInDays(new Date(), parseISO(couple.paired_at));
      return Math.max(1, days + 1);
    } catch {
      return 1;
    }
  }, [couple?.paired_at]);

  const handleStreakPress = () => {
    if (!coupleId) {
      Alert.alert('Solo Mode', 'Pair with a partner to start tracking your relationship streak!');
    } else {
      Alert.alert('Flame Streak 🔥', `You and your partner have been paired for ${streak} consecutive ${streak === 1 ? 'day' : 'days'}. Keep sharing date spots together!`);
    }
  };

  const handleCheckinPress = () => {
    Alert.alert('Daily Check-in ✨', "How is the spark today? Shared daily check-ins will be configurable in V2!");
  };

  const isLoading = isLoadingProfile || isLoadingCouple || isLoadingPartner || isLoadingNextDate || isLoadingLatestMemory;

  if (profileErr) {
    return (
      <View className="flex-1 items-center justify-center p-base bg-bg" style={{ paddingTop: insets.top }}>
        <Text className="font-inter-bold text-h2 text-error">Error loading dashboard</Text>
        <Text className="font-inter text-body text-text-muted mt-sm text-center">
          {profileErr instanceof Error ? profileErr.message : 'Please check your connection.'}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      {/* Top App Bar */}
      <View className="flex-row items-center justify-between px-base py-sm border-b border-border bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-xs active:scale-95 transition-transform duration-200">
          <Heart size={22} color={tokens.primary} fill={tokens.primary} />
          <Text className="font-inter-bold text-h2 text-primary">RelationshipOS</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/discover' as any)}
          className="p-sm active:opacity-75 active:scale-95 transition-all duration-200"
        >
          <Compass size={20} className="text-text-muted" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* User Greeting & Avatar Section */}
          <View className="flex-row items-center justify-between mb-lg">
            <View className="space-y-1">
              <Text className="font-inter-bold text-h2 text-text">
                Hi {profile?.display_name?.split(' ')[0] ?? 'Lovebird'},
              </Text>
              <Text className="font-inter text-label text-text-subtle">Ready for your next date?</Text>
            </View>

            {/* Overlapping Avatars */}
            <View className="flex-row items-center h-12 w-20 relative">
              <View className="absolute right-0 h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-surface-alt shadow-sm">
                {partner?.avatar_url ? (
                  <Image source={{ uri: partner.avatar_url }} className="w-full h-full object-cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-primary-soft">
                    <User size={18} color={tokens.primary} />
                  </View>
                )}
              </View>
              <View className="absolute left-0 h-12 w-12 rounded-full border-2 border-white overflow-hidden bg-surface-alt shadow-sm z-10">
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} className="w-full h-full object-cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-secondary-soft">
                    <User size={18} color={tokens.secondary} />
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Upcoming Date Card */}
          <View className="mb-lg">
            <Text className="font-inter-bold text-overline text-text-subtle uppercase px-md mb-xs">Upcoming Date</Text>
            {nextDate ? (
              <Pressable
                onPress={() => nextDate.place_id && router.push(`/(tabs)/place-detail/${nextDate.place_id}` as any)}
                className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm active:scale-[0.98] transition-transform duration-200"
              >
                <View className="aspect-[16/9] w-full bg-surface-alt relative">
                  {nextDate.place?.cover_url ? (
                    <Image source={{ uri: nextDate.place.cover_url }} className="w-full h-full object-cover" />
                  ) : (
                    <View className="w-full h-full bg-surface-alt justify-center items-center relative overflow-hidden">
                      {/* Stylized vector map background lines */}
                      <View className="absolute h-0.5 w-[200%] bg-border/40 rotate-[15deg] top-1/4 left-0" />
                      <View className="absolute h-0.5 w-[200%] bg-border/40 -rotate-[30deg] top-1/2 left-0" />
                      <View className="absolute h-[200%] w-0.5 bg-border/40 top-0 left-1/4" />
                      <View className="absolute h-[200%] w-0.5 bg-border/40 top-0 left-3/4" />
                      {/* Red circle pulsed map pin */}
                      <View className="h-10 w-10 bg-primary/20 rounded-full justify-center items-center">
                        <View className="h-6 w-6 bg-primary/40 rounded-full justify-center items-center">
                          <View className="h-3 w-3 bg-primary rounded-full" />
                        </View>
                      </View>
                      <Text className="absolute bottom-2 right-2 font-inter text-[10px] text-text-subtle bg-surface/90 px-xs py-xxs rounded border border-border">
                        Map Preview
                      </Text>
                    </View>
                  )}
                  {nextDate.place?.rating ? (
                    <View className="absolute top-base right-base bg-white/95 dark:bg-black/90 px-sm py-xxs rounded-full flex-row items-center gap-xxs shadow-sm">
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text className="font-inter-semibold text-caption text-text">{nextDate.place.rating}</Text>
                    </View>
                  ) : null}
                </View>
                <View className="p-base flex-row justify-between items-start">
                  <View className="flex-1 mr-base">
                    <Text className="font-inter-bold text-overline text-primary uppercase mb-xxs">Date Spot</Text>
                    <Text className="font-inter-bold text-h3 text-text mb-sm" numberOfLines={1}>
                      {nextDate.title}
                    </Text>
                    <View className="flex-row items-center gap-xs text-text-muted">
                      <Calendar size={16} color={tokens.textMuted} />
                      <Text className="font-inter text-label text-text-muted">
                        {format(parseISO(nextDate.starts_at), 'eeee, MMM d · h:mm a')}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-primary-soft text-primary p-md rounded-2xl items-center justify-center">
                    <Coffee size={20} color={tokens.primary} />
                  </View>
                </View>
              </Pressable>
            ) : (
              <View className="bg-surface rounded-2xl border border-border p-lg items-center justify-center shadow-sm">
                <Text className="font-inter text-body text-text-muted text-center mb-base">
                  No upcoming dates scheduled.
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/calendar' as any)}
                  className="px-lg py-sm items-center justify-center rounded-xl bg-surface-alt border border-border active:scale-95 transition-transform duration-150"
                >
                  <Text className="font-inter-semibold text-caption text-text">Plan a Date</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Latest Memory Card */}
          <View className="mb-lg">
            <Text className="font-inter-bold text-overline text-text-subtle uppercase px-md mb-xs">Latest Memory</Text>
            {latestMemory ? (
              <Pressable
                onPress={() => router.push(`/(tabs)/memory/${latestMemory.id}` as any)}
                className="bg-surface rounded-2xl p-base border border-border flex-row gap-base shadow-sm active:scale-[0.98] transition-transform duration-200"
              >
                <View className="h-24 w-24 rounded-xl overflow-hidden bg-surface-alt items-center justify-center flex-shrink-0">
                  {latestMemory.media?.[0]?.url ? (
                    <Image source={{ uri: latestMemory.media[0].url }} className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={28} color={tokens.textMuted} />
                  )}
                </View>
                <View className="flex-1 justify-center py-xxs">
                  <Text className="font-inter-bold text-overline text-secondary uppercase mb-xxs">Latest Memory</Text>
                  <Text className="font-inter-bold text-body-strong text-text" numberOfLines={1}>
                    {latestMemory.title ?? 'A beautiful memory'}
                  </Text>
                  {latestMemory.note ? (
                    <Text className="font-inter text-label text-text-subtle mt-xs italic" numberOfLines={1}>
                      "{latestMemory.note}"
                    </Text>
                  ) : (
                    <Text className="font-inter text-caption text-text-subtle mt-xs">
                      {format(parseISO(latestMemory.memory_date), 'MMMM d, yyyy')}
                    </Text>
                  )}
                </View>
              </Pressable>
            ) : (
              <View className="bg-surface rounded-2xl border border-border p-lg items-center justify-center shadow-sm">
                <Text className="font-inter text-body text-text-muted text-center mb-base">
                  No memories logged yet. Record your first date spot memory!
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/calendar' as any)}
                  className="px-lg py-sm items-center justify-center rounded-xl bg-surface-alt border border-border active:scale-95 transition-transform duration-150"
                >
                  <Text className="font-inter-semibold text-caption text-text">Log a Memory</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Stats & CTA Bento Section */}
          <View className="flex-row gap-base mb-lg">
            {/* Streak Card */}
            <Pressable
              onPress={handleStreakPress}
              className="flex-1 bg-surface-alt border border-border rounded-2xl p-base aspect-square justify-between shadow-sm active:scale-[0.98] transition-transform duration-200"
            >
              <View className="h-10 w-10 rounded-full bg-white items-center justify-center shadow-sm">
                <Flame size={20} color="#f97316" fill="#f97316" />
              </View>
              <View>
                <Text className="font-inter-bold text-display text-primary leading-none mb-xxs">
                  {coupleId ? streak : 0}
                </Text>
                <Text className="font-inter-semibold text-caption text-text-muted">Day Streak</Text>
              </View>
            </Pressable>

            {/* Quick Action Card */}
            <Pressable
              onPress={handleCheckinPress}
              className="flex-1 bg-surface border border-border rounded-2xl p-base aspect-square justify-between shadow-sm active:scale-[0.98] transition-transform duration-200"
            >
              <View className="h-10 w-10 rounded-full bg-secondary-soft items-center justify-center shadow-sm">
                <Sparkles size={20} color={tokens.secondary} />
              </View>
              <View>
                <Text className="font-inter-bold text-body-strong text-text mb-xxs">Daily Check-in</Text>
                <Text className="font-inter text-caption text-text-subtle">How's the spark?</Text>
              </View>
            </Pressable>
          </View>

          {/* Start Swiping CTA */}
          <Pressable
            onPress={() => router.push('/(tabs)/discover' as any)}
            className="w-full bg-primary rounded-2xl p-lg flex-row items-center justify-between active:scale-[0.98] transition-transform duration-200 shadow-md shadow-primary/10"
          >
            <View className="flex-1 mr-base">
              <Text className="font-inter-bold text-h2 text-white leading-tight">Start swiping</Text>
              <Text className="font-inter text-label text-white/80 mt-xxs">Discover new date spots together</Text>
            </View>
            <View className="bg-white/20 h-12 w-12 rounded-full items-center justify-center">
              <ArrowRight size={22} color="#ffffff" />
            </View>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
