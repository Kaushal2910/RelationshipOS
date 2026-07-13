import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import type { Place } from '../../types/place';
import { PlaceCardBody } from './PlaceCard';

const SWIPE_THRESHOLD = 120; // px — commit swipe
const ROTATION_DIVISOR = 15; // px per degree
const FLY_OUT_DURATION = 300; // ms
const SPRING_BACK_CONFIG = { damping: 20, stiffness: 300 };

/** Worklet-safe opacity clamp: 0 at 20px drag, 1 at 100px. */
function stampOpacity(x: number, direction: 'like' | 'pass') {
  'worklet';
  const absX = Math.abs(x);
  if (direction === 'like' && x <= 20) return 0;
  if (direction === 'pass' && x >= -20) return 0;
  const clamped = Math.min((absX - 20) / 80, 1);
  return Math.max(clamped, 0);
}

interface SwipeableCardProps {
  place: Place;
  onSwipe: (decision: 'like' | 'pass') => void;
  onInfoPress?: () => void;
}

/**
 * A single draggable Discover card. Uses Reanimated 4 shared values + a single
 * Gesture.Pan() for 60fps drag/rotate. LIKE/PASS stamps fade in as the user
 * drags past 20px. At ≥120px the swipe commits (fly-out + onSwipe callback).
 * Detail no longer opens on tap — use the (i) button (onInfoPress) instead.
 */
export function SwipeableCard({ place, onSwipe, onInfoPress }: SwipeableCardProps) {
  const { tokens } = useTheme();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Rotation derived from translateX on the worklet thread.
  const rotation = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(0) // respond immediately — no delay
    .onUpdate(({ translationX, translationY }) => {
      'worklet';
      translateX.value = translationX;
      translateY.value = translationY;
      rotation.value = translationX / ROTATION_DIVISOR;
    })
    .onEnd(({ translationX }) => {
      'worklet';
      const absX = Math.abs(translationX);
      if (absX > SWIPE_THRESHOLD) {
        // Commit: fly the card off-screen in the swipe direction.
        const currentY = translateY.value;
        const flyOut = translationX > 0 ? translationX + 500 : translationX - 500;
        translateX.value = withTiming(flyOut, { duration: FLY_OUT_DURATION });
        translateY.value = withTiming(currentY + (translationX > 0 ? 200 : -200), {
          duration: FLY_OUT_DURATION,
        });
        rotation.value = withTiming(translationX > 0 ? 30 : -30, { duration: FLY_OUT_DURATION });

        const decision = translationX > 0 ? 'like' : 'pass';
        runOnJS(onSwipe)(decision);
      } else {
        // Spring back to center.
        translateX.value = withSpring(0, SPRING_BACK_CONFIG);
        translateY.value = withSpring(0, SPRING_BACK_CONFIG);
        rotation.value = withSpring(0, SPRING_BACK_CONFIG);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  // Like stamp opacity — fades in from 20px to 100px drag right.
  const likeStampStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: stampOpacity(translateX.value, 'like') };
  });

  // Pass stamp opacity — fades in from 20px to 100px drag left.
  const passStampStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: stampOpacity(translateX.value, 'pass') };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        {/* LIKE stamp — top-left, rotated */}
        <Animated.View
          style={[styles.stamp, styles.likeStamp, likeStampStyle]}
          pointerEvents="none"
        >
          <Text style={[styles.stampText, { color: tokens.like, borderColor: tokens.like }]}>
            LIKE
          </Text>
        </Animated.View>

        {/* PASS stamp — top-right, rotated */}
        <Animated.View
          style={[styles.stamp, styles.passStamp, passStampStyle]}
          pointerEvents="none"
        >
          <Text style={[styles.stampText, { color: tokens.pass, borderColor: tokens.pass }]}>
            PASS
          </Text>
        </Animated.View>

        <PlaceCardBody place={place} onInfoPress={onInfoPress} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    height: '100%',
  },
  stamp: {
    position: 'absolute',
    zIndex: 40,
    top: 32,
  },
  likeStamp: {
    left: 24,
    transform: [{ rotate: '-12deg' }],
  },
  passStamp: {
    right: 24,
    transform: [{ rotate: '12deg' }],
  },
  stampText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    opacity: 0.9,
  },
});
