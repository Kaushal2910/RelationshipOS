import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

/** Pulsing shimmer block. Uses built-in Animated (no worklets) for a safe, subtle pulse. */
export function Skeleton({ className = '' }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }} className={`bg-surface-alt ${className}`} />
  );
}

/** Skeleton shaped like a Discover place card (3:4 cover + text lines). */
export function PlaceCardSkeleton() {
  return (
    <View className="mb-lg overflow-hidden rounded-card bg-surface shadow-e1">
      <Skeleton className="aspect-[3/4] w-full" />
      <View className="gap-sm p-base">
        <Skeleton className="h-3 w-20 rounded-pill" />
        <Skeleton className="h-5 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </View>
    </View>
  );
}
