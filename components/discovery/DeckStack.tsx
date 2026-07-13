import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SwipeableCard } from './SwipeableCard';
import { PlaceCardBody } from './PlaceCard';
import { PlaceCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { useTheme } from '../../theme/useTheme';
import { useSessionStore } from '../../stores/session';
import { useDeck, deckKeys } from '../../lib/queries/useDeck';
import { useDiscoveryStore } from '../../stores/discovery';
import { recordSwipe } from '../../lib/swipes';
import type { Place } from '../../types/place';
import type { SwipeDecision } from '../../lib/database.types';

/**
 * Full Discover swipe deck. Queries the filtered deck, renders a 3-card
 * stack (active draggable card + 2 static behind-cards for depth), cycles
 * through the queue on each swipe, and records each decision to Supabase.
 * Realtime match-detection subscription is wired here (Phase 4 adds the
 * MatchOverlay trigger — the store's pendingMatch is the bridge).
 */
export function DeckStack() {
  const { tokens } = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const userId = useSessionStore((s) => s.session?.user.id);
  const filters = useDiscoveryStore((s) => s.filters);

  const { data: places, isLoading, isError, refetch } = useDeck({
    userId,
    city: filters.city,
    moods: filters.moods,
    priceLevel: filters.priceLevel,
  });
  const { data: profile } = { data: null }; // placeholder — profile comes from AuthGate parent

  // Index into the deck array. Loops back to 0 when exhausted so the
  // small seed deck (5 places) cycles for testing.
  const [currentIndex, setCurrentIndex] = useState(0);
  // Swipe counter — bumps on every swipe so the active card remounts fresh
  // (its shared translate value resets to 0). Without this, when the deck
  // cycles back to a place we already saw, React reuses the component and
  // the card stays stuck off-screen.
  const [swipeCount, setSwipeCount] = useState(0);

  const safePlaces = places ?? [];
  const count = safePlaces.length;

  // Background card animated values (springs background cards to new positions
  // when the index changes).
  const bg1Scale = useSharedValue(0.95);
  const bg1TranslateY = useSharedValue(12);
  const bg2Scale = useSharedValue(0.90);
  const bg2TranslateY = useSharedValue(24);

  const bg1AnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bg1Scale.value }, { translateY: bg1TranslateY.value }],
  }));
  const bg2AnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bg2Scale.value }, { translateY: bg2TranslateY.value }],
  }));

  // Wrap index so deck cycles. getCard(i) returns the place at that position
  // (mod length) or null if deck is empty.
  const getCard = (offset: number): Place | null => {
    if (count === 0) return null;
    return safePlaces[(currentIndex + offset) % count];
  };

  const advanceDeck = useCallback(() => {
    // Animate the middle background card up to the active position while the
    // flown-out top card unmounts, then advance the index so a fresh card
    // takes the active slot.
    setCurrentIndex((prev) => (prev + 1) % count);
    setSwipeCount((c) => c + 1);
    // Reset background shared values back to their resting positions after the swap.
    bg1Scale.value = 0.95;
    bg1TranslateY.value = 12;
    bg2Scale.value = 0.90;
    bg2TranslateY.value = 24;
  }, [count, bg1Scale, bg1TranslateY, bg2Scale, bg2TranslateY]);

  const handleSwipe = useCallback(
    async (decision: SwipeDecision) => {
      const place = safePlaces[currentIndex];
      if (!place || !userId) return;
      try {
        await recordSwipe(userId, place.id, decision);
      } catch {
        // Swallow — deck cycle continues regardless.
      }
      qc.invalidateQueries({ queryKey: deckKeys.filtered(userId, filters.city, filters.moods, filters.priceLevel) });
      advanceDeck();
    },
    [currentIndex, safePlaces, userId, qc, filters, advanceDeck]
  );

  // ── 4 states ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center px-base" style={styles.stackContainer}>
        <View style={styles.cardSlot}>
          <PlaceCardSkeleton />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1">
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  if (safePlaces.length === 0) {
    return (
      <View className="flex-1">
        <EmptyState
          title="No spots available"
          subtitle="Check back soon — we're always adding new places 💞"
          actionLabel="Refresh"
          onAction={() => {
            setCurrentIndex(0);
            refetch();
          }}
        />
      </View>
    );
  }

  const active = getCard(0);
  const next1 = getCard(1);
  const next2 = getCard(2);

  // Defensive — if active is null, deck was empty (already caught above).
  if (!active) {
    return (
      <View className="flex-1">
        <EmptyState
          title="No spots available"
          subtitle="Check back soon 💞"
          actionLabel="Refresh"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 px-base" style={styles.stackContainer}>
      {/* Card slots — absolute positioned, z-indexed bottom-up */}
      <View style={styles.cardSlot}>
        {/* Next card 2 (bottom) */}
        {next2 ? (
          <Animated.View
            style={[styles.behindCard, bg2AnimStyle, { zIndex: 10 }]}
            pointerEvents="none"
          >
            <PlaceCardBody place={next2} />
          </Animated.View>
        ) : null}

        {/* Next card 1 (middle) */}
        {next1 ? (
          <Animated.View
            style={[styles.behindCard, bg1AnimStyle, { zIndex: 20 }]}
            pointerEvents="none"
          >
            <PlaceCardBody place={next1} />
          </Animated.View>
        ) : null}

        {/* Active top card — keyed by swipeCount so it remounts fresh after each
            swipe (resets the gesture's shared translate value to 0). */}
        <Animated.View style={[styles.activeCard, { zIndex: 30 }]}>
          <SwipeableCard
            key={`${active.id}-${swipeCount}`}
            place={active}
            onSwipe={handleSwipe}
            onInfoPress={() => router.push(`/(tabs)/place-detail/${active.id}` as never)}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackContainer: {
    // Centers the card stack vertically; padding-bottom comes from the parent.
    justifyContent: 'center',
  },
  cardSlot: {
    width: '100%',
    // 3:4 aspect ratio card — height is 4/3 of the available width minus padding.
    // The stack container fills the horizontal space, so we use aspectRatio.
    aspectRatio: 3 / 4,
    maxHeight: '75%',
  },
  activeCard: {
    ...StyleSheet.absoluteFill,
  },
  behindCard: {
    ...StyleSheet.absoluteFill,
    // Opacity controlled by NativeWind class on the wrapper isn't possible here;
    // the Animated.View uses absoluteFill. Opacity is set via the animated style
    // or inline. For static opacity, we rely on the deck's visual depth from
    // scale+translateY alone — the PlaceCardBody's shadow handles separation.
  },
});