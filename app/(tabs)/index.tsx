import { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Calendar, Camera, User, Flame, Compass, ArrowRight, Star, Coffee, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useSessionStore } from '../../stores/session';
import { useProfile, useCouple, usePartnerProfile } from '../../lib/queries/useProfile';
import { useNextCalendarItem } from '../../lib/queries/useCalendar';
import { useLatestMemory, useRecentMemories } from '../../lib/queries/useMemories';
import { getSignedMemoryUrl } from '../../lib/storage';
import { differenceInDays, parseISO, format } from 'date-fns';

/**
 * Stitch-inspired Home/Dashboard Screen.
 * Implements greeting header, randomized uneven collage, upcoming date card,
 * latest memory card (with wrapped text), and enriched bento-grid stats.
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

  // Fetch recent memories to build the collage
  const { data: recentMemories } = useRecentMemories(coupleId ?? undefined, 5);

  const [memoryUrl, setMemoryUrl] = useState<string | null>(null);
  const [collageUrls, setCollageUrls] = useState<string[]>([]);

  // Fetch signed URL for private memory media
  useEffect(() => {
    if (latestMemory?.media?.[0]?.url) {
      getSignedMemoryUrl(latestMemory.media[0].url)
        .then(setMemoryUrl)
        .catch((err) => console.error('[Dashboard] Failed to sign memory URL:', err));
    } else {
      setMemoryUrl(null);
    }
  }, [latestMemory]);

  // Sign URLs for collage images and randomize them
  useEffect(() => {
    if (recentMemories) {
      const mediaUrls = recentMemories
        .flatMap((m: any) => m.media ?? [])
        .map((med: any) => med.url);

      if (mediaUrls.length > 0) {
        Promise.all(mediaUrls.map((url: string) => getSignedMemoryUrl(url)))
          .then((urls) => {
            // Randomly shuffle and take up to 5 images for the collage
            const shuffled = [...urls].sort(() => 0.5 - Math.random()).slice(0, 5);
            setCollageUrls(shuffled);
          })
          .catch((err) => console.error('[Dashboard] Failed to sign collage URLs:', err));
      } else {
        setCollageUrls([]);
      }
    }
  }, [recentMemories]);

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
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* User Greeting & Avatar Section (Top) */}
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

          {/* Uneven Collage of Memories */}
          {collageUrls.length > 0 && (
            <View className="mb-lg">
              <Text className="font-inter-bold text-overline text-text-subtle uppercase px-md mb-sm">Recent Moments</Text>
              <View className="flex-row gap-xs h-32">
                {collageUrls.slice(0, 4).map((url, index) => {
                  const rotations = ['1deg', '-2deg', '3deg', '-1deg'];
                  const flexes = [2, 1.2, 1, 1.3];
                  return (
                    <View
                      key={url}
                      className="rounded-xl overflow-hidden bg-surface-alt border border-border shadow-sm"
                      style={{
                        flex: flexes[index % flexes.length],
                        transform: [{ rotate: rotations[index % rotations.length] }],
                      }}
                    >
                      <Image source={{ uri: url }} className="w-full h-full object-cover" />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

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
                      {/* Stylized high-fidelity hybrid vector map background lines */}
                      <View className="absolute inset-0 flex-row justify-around opacity-25">
                        <View className="w-px h-full bg-text-subtle/50" />
                        <View className="w-px h-full bg-text-subtle/50" />
                        <View className="w-px h-full bg-text-subtle/50" />
                        <View className="w-px h-full bg-text-subtle/50" />
                      </View>
                      <View className="absolute inset-0 flex-column justify-around opacity-25">
                        <View className="h-px w-full bg-text-subtle/50" />
                        <View className="h-px w-full bg-text-subtle/50" />
                        <View className="h-px w-full bg-text-subtle/50" />
                      </View>
                      <View className="absolute h-4 w-[200%] bg-border/60 rotate-[22deg] top-1/4 left-[-20px] rounded-full" />
                      <View className="absolute h-3 w-[200%] bg-border/40 -rotate-[15deg] top-2/3 left-[-20px] rounded-full" />
                      <View className="absolute h-5 w-[200%] bg-primary-soft/30 rotate-[60deg] top-0 left-[20%] rounded-full" />

                      {/* Cozy custom marker pin */}
                      <View className="items-center justify-center">
                        <View className="h-14 w-14 bg-primary/10 rounded-full items-center justify-center animate-pulse">
                          <View className="h-9 w-9 bg-primary/20 rounded-full items-center justify-center">
                            <View className="h-5 w-5 bg-primary rounded-full border-2 border-white items-center justify-center shadow-md">
                              <View className="h-1.5 w-1.5 bg-white rounded-full" />
                            </View>
                          </View>
                        </View>
                      </View>
                      <Text className="absolute bottom-2 right-2 font-inter text-[8px] tracking-wide text-text-muted bg-white/90 px-xs py-xxs rounded border border-border">
                        Hybrid Map
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
              <View className="bg-surface rounded-2xl border-2 border-dashed border-border p-lg items-center justify-center shadow-sm py-xl">
                <Calendar size={32} color={tokens.textSubtle} className="mb-sm opacity-60" />
                <Text className="font-inter-bold text-body-strong text-text text-center mb-xxs">
                  Your Calendar is Open
                </Text>
                <Text className="font-inter text-caption text-text-muted text-center mb-base max-w-[240px]">
                  No upcoming dates planned yet. Ready to build a new romantic memory?
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/calendar' as any)}
                  className="px-lg py-sm items-center justify-center rounded-xl bg-primary active:scale-95 transition-transform duration-150 shadow-sm shadow-primary/10"
                >
                  <Text className="font-inter-semibold text-caption text-white">Find a Spot</Text>
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
                  {memoryUrl ? (
                    <Image source={{ uri: memoryUrl }} className="w-full h-full object-cover" />
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
                    <Text className="font-inter text-label text-text-subtle mt-xs italic" numberOfLines={2}>
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
                <Text className="font-inter text-[10px] text-text-subtle mt-xxs">Keep the spark glowing! 🔥</Text>
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
                <Text className="font-inter text-caption text-text-subtle mb-xs">Spark: 100% Active</Text>
                <View className="h-1.5 w-full bg-secondary-soft/80 rounded-full overflow-hidden border border-border/40">
                  <View className="h-full w-full bg-secondary rounded-full" />
                </View>
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
