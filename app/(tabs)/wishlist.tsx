import { FlatList, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useSessionStore } from '../../stores/session';
import { useProfile } from '../../lib/queries/useProfile';
import { useWishlist, type WishlistItem } from '../../lib/queries/useWishlist';
import { PlaceCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useTheme } from '../../theme/useTheme';

/**
 * Shared Wishlist screen (P3). Lists places both partners have mutually liked.
 * Each row shows the place thumbnail, name, area/category, and match date.
 * Detail view comes in P4 — tap shows an alert with the place name for now.
 */
export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const router = useRouter();
  const userId = useSessionStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const coupleId: string | undefined = profile?.couple_id ?? undefined;

  const {
    data: items,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useWishlist(coupleId);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-base pb-sm pt-sm">
        <Text className="font-inter-bold text-h1 text-text">Wishlist</Text>
        {items && items.length > 0 ? (
          <Text className="mt-xs font-sans text-caption text-text-muted">
            {items.length} {items.length === 1 ? 'match' : 'matches'}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-1 px-base pt-sm">
          <PlaceCardSkeleton />
          <PlaceCardSkeleton />
        </View>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !items || items.length === 0 ? (
        <EmptyState
          title="No matches yet"
          subtitle="Start swiping on Discover! When you both like the same spot, it'll show up here."
          actionLabel="Go to Discover"
          onAction={() => router.push('/')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <WishlistCard item={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          onRefresh={() => refetch()}
          refreshing={isRefetching}
        />
      )}
    </View>
  );
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const { tokens } = useTheme();
  const router = useRouter();
  const place = item.place;
  const matchedDate = item.both_liked_at
    ? new Date(item.both_liked_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  if (!place) {
    return (
      <View className="mb-base rounded-card bg-surface-alt p-base">
        <Text className="font-sans text-body text-text-muted">Place not available</Text>
        {matchedDate ? (
          <Text className="mt-xs font-sans text-caption text-text-subtle">
            Matched on {matchedDate}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, matched on ${matchedDate}`}
      onPress={() => router.push(`/(tabs)/place-detail/${place.id}` as never)}
      className="mb-base overflow-hidden rounded-card bg-surface shadow-e1"
    >
      <View className="flex-row">
        {/* Thumbnail */}
        <View className="h-28 w-28">
          {place.cover_url ? (
            <Image
              source={{ uri: place.cover_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="h-full w-full bg-surface-alt" />
          )}
        </View>

        {/* Info */}
        <View className="flex-1 justify-center p-base">
          <Text className="mb-xs font-inter-semibold text-body-strong text-text" numberOfLines={1}>
            {place.name}
          </Text>
          <Text className="mb-xs font-sans text-caption text-text-muted capitalize" numberOfLines={1}>
            {place.category.replace(/_/g, ' ')}
            {place.area ? ` · ${place.area}` : ''}
          </Text>
          {place.rating != null ? (
            <View className="mb-xs flex-row items-center gap-xs">
              <Star size={12} color={tokens.warning} fill={tokens.warning} />
              <Text className="font-inter-medium text-caption text-text">{place.rating.toFixed(1)}</Text>
            </View>
          ) : null}
          {matchedDate ? (
            <Text className="font-sans text-caption text-text-subtle">
              Matched on {matchedDate}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}