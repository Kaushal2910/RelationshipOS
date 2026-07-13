import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import { Button } from '../ui/Button';
import { useTheme } from '../../theme/useTheme';
import { useDiscoveryStore } from '../../stores/discovery';
import type { Place } from '../../types/place';

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Full-screen match celebration overlay. Triggered when the discovery store's
 * `pendingMatch` is set (by the Realtime wishlist subscription).
 *
 * Animation: scale-in entrance via RN Animated (one-shot, no gesture).
 * Floating hearts: 3 ♡ icons with staggered up-down loops (pure decoration).
 *
 * Buttons: "View Wishlist" → wishlist tab, "Keep Swiping" → dismiss.
 */
export function MatchOverlay() {
  const router = useRouter();
  const { tokens } = useTheme();
  const pendingMatch = useDiscoveryStore((s) => s.pendingMatch);
  const clearMatch = useDiscoveryStore((s) => s.clearMatch);

  // Entrance animation
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Floating heart animations (3 staggered loops)
  const heart1Y = useRef(new Animated.Value(0)).current;
  const heart2Y = useRef(new Animated.Value(0)).current;
  const heart3Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pendingMatch) return;

    // Entrance spring
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Floating heart loops
    const makeLoop = (val: Animated.Value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: -20, duration: 1500, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      );

    const loops = [
      makeLoop(heart1Y),
      Animated.delay(500).start === undefined ? undefined : makeLoop(heart2Y), // stagger
      makeLoop(heart3Y),
    ];

    const cleanup = () => {
      loops.forEach((l) => l?.stop?.());
    };
    return cleanup;
  }, [pendingMatch, scale, opacity, heart1Y, heart2Y, heart3Y]);

  if (!pendingMatch) return null;

  const { place } = pendingMatch;

  const onViewWishlist = () => {
    clearMatch();
    router.replace('/(tabs)/wishlist' as unknown as Href);
  };

  const onKeepSwiping = () => {
    clearMatch();
  };

  return (
    <View style={StyleSheet.absoluteFill} className="z-50 items-center justify-center">
      {/* Scrim */}
      <Pressable onPress={onKeepSwiping} style={StyleSheet.absoluteFill}>
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: tokens.overlay }]}
        />
      </Pressable>

      {/* Floating hearts (decoration) */}
      <Animated.View
        style={[styles.floatingHeart, { top: '15%', left: '10%', transform: [{ translateY: heart1Y }] }]}
        pointerEvents="none"
      >
        <Heart size={28} color={tokens.primary} fill={tokens.primary} opacity={0.3} />
      </Animated.View>
      <Animated.View
        style={[styles.floatingHeart, { top: '60%', right: '15%', transform: [{ translateY: heart2Y }] }]}
        pointerEvents="none"
      >
        <Heart size={22} color={tokens.primary} fill={tokens.primary} opacity={0.2} />
      </Animated.View>
      <Animated.View
        style={[styles.floatingHeart, { bottom: '20%', left: '20%', transform: [{ translateY: heart3Y }] }]}
        pointerEvents="none"
      >
        <Heart size={18} color={tokens.primary} fill={tokens.primary} opacity={0.25} />
      </Animated.View>

      {/* Central match card */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: tokens.surface },
          { transform: [{ scale }], opacity },
        ]}
      >
        {/* Place image */}
        <View className="aspect-[16/10] w-full overflow-hidden rounded-t-card">
          {place.cover_url ? (
            <Image
              source={{ uri: place.cover_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View className="h-full w-full bg-surface-alt" />
          )}
        </View>

        {/* Content */}
        <View className="items-center px-base pb-lg pt-base">
          <Text
            className="mb-sm font-display text-display text-primary"
            style={{ fontFamily: 'Fraunces_700Bold' }}
          >
            It's a Match! 💞
          </Text>
          <Text className="mb-xs font-inter-semibold text-h3 text-text">
            {place.name}
          </Text>
          <Text className="mb-lg font-sans text-body text-text-muted capitalize">
            {place.category.replace(/_/g, ' ')}
          </Text>

          <View className="w-full gap-sm">
            <Button label="View Wishlist" onPress={onViewWishlist} />
            <Button label="Keep Swiping" variant="ghost" onPress={onKeepSwiping} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_W - 64,
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
  },
  floatingHeart: {
    position: 'absolute',
  },
});