import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaces } from '../../lib/queries/usePlaces';
import { PlaceCard } from '../../components/discovery/PlaceCard';
import { PlaceCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { data: places, isLoading, isError, refetch, isRefetching } = usePlaces();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-base pb-sm pt-sm">
        <Text className="font-inter-bold text-h1 text-text">Discover</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 px-base pt-sm">
          <PlaceCardSkeleton />
          <PlaceCardSkeleton />
        </View>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !places || places.length === 0 ? (
        <EmptyState
          title="No spots yet"
          subtitle="Seed a few places in Supabase and pull to refresh 💞"
          actionLabel="Refresh"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PlaceCard place={item} />}
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
