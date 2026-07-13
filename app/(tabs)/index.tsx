import { useState, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlidersHorizontal } from 'lucide-react-native';
import { DeckStack } from '../../components/discovery/DeckStack';
import { FilterSheet } from '../../components/discovery/FilterSheet';
import { MatchOverlay } from '../../components/discovery/MatchOverlay';
import { useTheme } from '../../theme/useTheme';
import { useSessionStore } from '../../stores/session';
import { useProfile } from '../../lib/queries/useProfile';
import { useDiscoveryStore } from '../../stores/discovery';
import { supabase } from '../../lib/supabase';
import type { Place } from '../../types/place';

/**
 * Discover screen (P3). Swipe deck with 1-card-at-a-time drag, like/pass,
 * and 3-card stack depth. Filters are in a bottom sheet. Subscribes to
 * wishlist Realtime so we detect mutual matches and show the MatchOverlay.
 */
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [filterVisible, setFilterVisible] = useState(false);
  const userId = useSessionStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const coupleId = profile?.couple_id;
  const setPendingMatch = useDiscoveryStore((s) => s.setPendingMatch);

  // Realtime: listen for new wishlist rows → show match overlay.
  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel(`match-alerts-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wishlist',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const placeId = (payload.new as { place_id: string }).place_id;
          supabase
            .from('places')
            .select('*')
            .eq('id', placeId)
            .single()
            .then(({ data: place }) => {
              if (place) {
                setPendingMatch({ place: place as Place, coupleId: coupleId as string });
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, setPendingMatch]);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-base pb-sm pt-sm">
        <Text className="font-inter-bold text-h1 text-text">Discover</Text>
        <Pressable
          onPress={() => setFilterVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface-alt"
        >
          <SlidersHorizontal size={20} color={tokens.textMuted} />
        </Pressable>
      </View>

      {/* Deck */}
      <DeckStack />

      {/* Match celebration overlay */}
      <MatchOverlay />

      {/* Filter bottom sheet */}
      <FilterSheet visible={filterVisible} onClose={() => setFilterVisible(false)} />
    </View>
  );
}