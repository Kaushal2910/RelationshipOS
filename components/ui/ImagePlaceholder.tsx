import { View, StyleProp, ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';

/** Simple placeholder for images (maps, photos) — uses Skeleton shimmer. */
export function ImagePlaceholder({
  width = '100%',
  height = '100%',
  className = '',
}: { width?: string | number; height?: string | number; className?: string }) {
  return (
    <View style={{ width, height } as StyleProp<ViewStyle>} className={className}>
      <Skeleton className="absolute inset-0" />
    </View>
  );
}