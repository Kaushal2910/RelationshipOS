import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/ui/EmptyState';

/** Stub — the shared wishlist is built in P3/P4 (mutual matches sync here). */
export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-base pb-sm pt-sm">
        <Text className="font-inter-bold text-h1 text-text">Wishlist</Text>
      </View>
      <EmptyState
        title="Nothing saved yet"
        subtitle="Spots you both like will land here once matching is ready."
      />
    </View>
  );
}
