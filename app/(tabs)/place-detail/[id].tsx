import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, MapPin, Star, Share2, CheckCircle, BookOpen, Navigation } from 'lucide-react-native';
import { useTheme } from '../../../theme/useTheme';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useSessionStore } from '../../../stores/session';
import type { Place } from '../../../types/place';
import { priceLevelToRupees } from '../../../types/place';
import { ImagePlaceholder } from '../../../components/ui/ImagePlaceholder';

export default function PlaceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width: screenWidth } = useWindowDimensions();

  const [place, setPlace] = useState<Place | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const { data: placeData, error: placeError } = await supabase
          .from('places')
          .select('*')
          .eq('id', id)
          .single();

        if (placeError) throw placeError;
        if (!mounted) return;
        const p = placeData as Place;
        setPlace(p);

        const { data: imagesData } = await supabase
          .from('place_images')
          .select('url')
          .eq('place_id', id)
          .order('position', { ascending: true });

        const urls = (imagesData ?? []).map((img: { url: string }) => img.url);
        if (p.cover_url && !urls.includes(p.cover_url)) {
          urls.unshift(p.cover_url);
        }
        if (mounted) setImages(urls);
      } catch {
        if (mounted) setIsError(true);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="h-full w-full justify-center items-center">
          <ImagePlaceholder width="100%" height="60%" />
        </View>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError || !place) {
    return (
      <View className="flex-1 bg-bg justify-center items-center px-lg" style={{ paddingTop: insets.top }}>
        <Text className="font-inter-bold text-h2 text-text text-center mb-sm">Couldn't load place</Text>
        <Text className="font-sans text-body text-text-muted text-center mb-lg">
          This place might not exist or there was a network error.
        </Text>
        <Pressable onPress={() => router.back()} className="px-lg py-sm bg-primary rounded-xl">
          <Text className="font-inter-semibold text-label text-white">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const price = priceLevelToRupees(place.price_level);
  const distance = place.lat && place.lng ? '2.4 km away' : 'Distance unknown';

  // ── Action handlers ──────────────────────────────────────────────────────
  const handleDirections = () => {
    if (place.lat && place.lng) {
      const label = encodeURIComponent(place.name);
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=${label}`);
    } else {
      const query = encodeURIComponent(`${place.name} ${place.address ?? place.area ?? place.city}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  const handleShare = () => {
    const message = [
      `📌 ${place.name}`,
      place.area ? `📍 ${place.area}, ${place.city}` : `📍 ${place.city}`,
      place.description ? `\n${place.description.slice(0, 120)}…` : '',
      price ? `\n${price}` : '',
    ].filter(Boolean).join('\n');
    Share.share({ message });
  };

  const handleBook = () => {
    if (place.booking_url) {
      Linking.openURL(place.booking_url);
    } else {
      Alert.alert('Booking unavailable', 'This place doesn\'t have a booking link yet.');
    }
  };

  const handleSaveToCalendar = () => {
    router.push('/calendar');
  };

  const handleMarkAsDone = async () => {
    if (!userId || !place.id) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('couple_id')
      .eq('id', userId)
      .single();
    const coupleId = (profile as { couple_id: string | null } | null)?.couple_id;
    if (!coupleId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('wishlist') as any)
      .update({ status: 'done' })
      .eq('couple_id', coupleId)
      .eq('place_id', place.id);
    if (error) {
      Alert.alert('Couldn\'t update', error.message);
    } else {
      Alert.alert('Done! 💞', 'Marked as done on your shared wishlist.');
    }
  };

  // ── Content ──────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* ── Hero Image Gallery ─────────────────────────────────────────── */}
      <View className="relative h-[320px] w-full">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const w = e.nativeEvent.layoutMeasurement.width;
            const off = e.nativeEvent.contentOffset.x;
            setCurrentImageIndex(Math.round(off / w));
          }}
          className="h-full w-full"
          contentContainerStyle={{ width: Math.max(images.length, 1) * screenWidth }}
        >
          {images.length > 0 ? (
            images.map((url, i) => (
              <View key={i} className="h-full" style={{ width: screenWidth }}>
                <Image
                  source={{ uri: url }}
                  style={{ width: screenWidth, height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            ))
          ) : (
            <View className="h-full bg-surface-alt" style={{ width: screenWidth }} />
          )}
        </ScrollView>

        {/* Pagination Dots */}
        {images.length > 1 ? (
          <View className="absolute bottom-base left-1/2 -translate-x-1/2 flex-row gap-xs">
            {images.map((_, i) => (
              <View
                key={i}
                className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </View>
        ) : null}

        {/* Back Button */}
        <View className="absolute top-0 left-0 right-0 px-lg pt-sm flex-row justify-between items-center">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-surface/80"
          >
            <ArrowLeft size={24} color={tokens.primary} />
          </Pressable>
          <View className="w-11 h-11" />
        </View>
      </View>

      {/* ── Scrollable Details ─────────────────────────────────────────── */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View className="px-lg" style={{ gap: 24 }}>

          {/* ── Header: Name + chips + meta row ─── */}
          <View style={{ gap: 12, marginTop: 20 }}>
            <Text className="font-inter-bold text-h1 text-text">{place.name}</Text>

            {/* Category + mood chips */}
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              <View className="px-md py-1.5 bg-primary-soft rounded-full">
                <Text className="font-inter-medium text-caption text-primary">
                  {place.category.replace(/_/g, ' ')}
                </Text>
              </View>
              {place.moods?.map((mood) => (
                <View
                  key={mood}
                  className="px-md py-1.5 bg-surface-alt rounded-full border border-border"
                >
                  <Text className="font-inter-medium text-caption text-text-muted">
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Price · Rating · Distance */}
            <View className="flex-row items-center flex-wrap" style={{ gap: 10 }}>
              {price ? (
                <Text className="font-inter-medium text-label text-text">{price}</Text>
              ) : null}
              {price ? <View className="w-1 h-1 rounded-full bg-border" /> : null}
              {place.rating != null ? (
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Star size={16} color={tokens.warning} fill={tokens.warning} />
                  <Text className="font-inter-medium text-label text-text">{place.rating.toFixed(1)}</Text>
                </View>
              ) : null}
              {place.rating != null ? <View className="w-1 h-1 rounded-full bg-border" /> : null}
              <Text className="font-sans text-label text-text-muted">{distance}</Text>
            </View>
          </View>

          {/* ── About ─── */}
          <View style={{ gap: 8 }}>
            <Text className="font-inter-semibold text-h3 text-text">About</Text>
            <Text className="font-sans text-body text-text-muted leading-relaxed">
              {place.description ?? 'No description available.'}
            </Text>
          </View>

          {/* ── Timings + Address (stacked cards) ─── */}
          <View style={{ gap: 10 }}>
            {/* Timings */}
            <View className="p-lg rounded-2xl bg-surface-alt flex-row items-center" style={{ gap: 16 }}>
              <View className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center">
                <BookOpen size={22} color={tokens.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-inter-semibold text-body text-text">Timings</Text>
                <Text className="font-sans text-label text-text-muted mt-1">
                  {place.timings && typeof place.timings === 'object' && 'open' in place.timings
                    ? `Open today: ${place.timings.open as string} – ${place.timings.close as string}`
                    : 'Open today: 11:00 – 20:00'}
                </Text>
              </View>
            </View>

            {/* Address — tapping opens Maps (replaces redundant Directions button) */}
            <Pressable
              className="p-lg rounded-2xl bg-surface-alt flex-row items-center active:opacity-80"
              style={{ gap: 16 }}
              onPress={handleDirections}
              accessibilityRole="button"
              accessibilityLabel="Open in Maps"
            >
              <View className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center">
                <MapPin size={22} color={tokens.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-inter-semibold text-body text-text">Address</Text>
                <Text className="font-sans text-label text-text-muted mt-1" numberOfLines={2}>
                  {place.address ?? place.area ?? place.city}
                </Text>
              </View>
              <Navigation size={18} color={tokens.textMuted} />
            </Pressable>
          </View>

          {/* ── Interaction Row ─── */}
          <View className="flex-row items-center justify-between py-base border-t border-border">
            <Pressable
              className="flex-row items-center active:opacity-70"
              style={{ gap: 8 }}
              onPress={handleMarkAsDone}
              accessibilityRole="button"
              accessibilityLabel="Mark as done"
            >
              <CheckCircle size={22} color={tokens.textMuted} />
              <Text className="font-inter-medium text-label text-text-muted">Mark as done</Text>
            </Pressable>
            <View className="flex-row" style={{ gap: 12 }}>
              <Pressable
                className="w-11 h-11 rounded-full border border-border flex items-center justify-center active:opacity-70"
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share"
              >
                <Share2 size={22} color={tokens.textMuted} />
              </Pressable>
              <Pressable
                className="w-11 h-11 rounded-full border border-border flex items-center justify-center active:opacity-70"
                onPress={() => Alert.alert('Coming soon', 'Favorites will be available in a future update 💞')}
                accessibilityRole="button"
                accessibilityLabel="Add to favorites"
              >
                <Star size={22} color={tokens.primary} fill="transparent" strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Bar ──────────────────────────────────────────── */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border"
        style={{ paddingBottom: insets.bottom + 8, paddingTop: 12, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {/* Book */}
          <Pressable
            className="h-[52px] rounded-xl bg-surface-alt flex-row items-center justify-center active:opacity-70"
            style={{ width: 80, gap: 6 }}
            onPress={handleBook}
            accessibilityRole="button"
            accessibilityLabel="Book"
          >
            <BookOpen size={20} color={tokens.textMuted} />
            <Text className="font-inter-medium text-caption text-text-muted">Book</Text>
          </Pressable>

          {/* Save to Calendar — primary CTA, no icon */}
          <Pressable
            className="flex-1 h-[52px] bg-primary rounded-xl flex-row items-center justify-center active:opacity-90"
            onPress={handleSaveToCalendar}
            accessibilityRole="button"
            accessibilityLabel="Save to calendar"
          >
            <Text className="font-inter-semibold text-label text-white">Save to Calendar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
