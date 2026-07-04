import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import type { Place } from '../../types/place';
import { priceLevelToRupees } from '../../types/place';
import { useTheme } from '../../theme/useTheme';

/**
 * Static Discover place card (P0). Visual per version1 Stitch
 * `discover_swipe_date_spots_1`. Swipe gestures come in P3.
 */
export function PlaceCard({ place }: { place: Place }) {
  const { tokens } = useTheme();
  const price = priceLevelToRupees(place.price_level);
  const mood = place.moods?.[0];

  return (
    <View
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${place.category} in ${place.city}`}
      className="mb-lg overflow-hidden rounded-card bg-surface shadow-e2"
    >
      <View className="aspect-[3/4] w-full">
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

        {/* bottom scrim for on-image text legibility */}
        <View className="absolute inset-x-0 bottom-0 h-1/2 justify-end bg-black/50 p-lg">
          <Text className="mb-xs font-inter-semibold text-overline uppercase text-white/90">
            {place.category.replace(/_/g, ' ')}
          </Text>
          <Text className="mb-xs font-inter-bold text-h3 text-white">{place.name}</Text>

          <View className="flex-row items-center gap-sm">
            {price ? (
              <Text className="font-inter-medium text-label text-white/90">{price}</Text>
            ) : null}
            {place.area ? (
              <Text className="font-sans text-label text-white/70">· {place.area}</Text>
            ) : null}
            {place.rating != null ? (
              <View className="flex-row items-center gap-xs">
                <Star size={14} color={tokens.warning} fill={tokens.warning} />
                <Text className="font-inter-medium text-label text-white">
                  {place.rating.toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>

          {mood ? (
            <View className="mt-md flex-row">
              <View className="rounded-pill border border-white/20 bg-primary-soft/20 px-md py-xs">
                <Text className="font-inter-medium text-label capitalize text-white">{mood}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
