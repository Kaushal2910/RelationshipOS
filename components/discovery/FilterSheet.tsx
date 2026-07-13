import { useState, useEffect } from 'react';
import { Pressable, ScrollView, Text, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Button } from '../ui/Button';
import { useTheme } from '../../theme/useTheme';
import { useDiscoveryStore } from '../../stores/discovery';

const MOODS: { key: string; label: string }[] = [
  { key: 'romantic', label: 'Romantic' },
  { key: 'budget', label: 'Budget' },
  { key: 'luxury', label: 'Luxury' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'chill', label: 'Chill' },
  { key: 'foodie', label: 'Foodie' },
  { key: 'trending', label: 'Trending' },
  { key: 'nightlife', label: 'Nightlife' },
  { key: 'nature', label: 'Nature' },
  { key: 'indoor', label: 'Indoor' },
  { key: 'outdoor', label: 'Outdoor' },
];

const BUDGET_LEVELS = [
  { value: 1, label: '₹' },
  { value: 2, label: '₹₹' },
  { value: 3, label: '₹₹₹' },
  { value: 4, label: '₹₹₹₹' },
];

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Filter bottom sheet for the Discover deck. City dropdown (hardcoded Pune
 * for V1), mood multi-select chips, and budget (price_level ≤ selected).
 * Applies filters to the discovery Zustand store → deck query refetches.
 */
export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const filters = useDiscoveryStore((s) => s.filters);
  const setFilters = useDiscoveryStore((s) => s.setFilters);
  const resetFilters = useDiscoveryStore((s) => s.resetFilters);

  // Local state mirrors the store while the sheet is open; applied on "Apply".
  const [city, setCity] = useState<string | undefined>(filters.city);
  const [moods, setMoods] = useState<string[]>(filters.moods ?? []);
  const [priceLevel, setPriceLevel] = useState<number | undefined>(filters.priceLevel);

  // Sync from store on open in case filters changed externally.
  useEffect(() => {
    if (visible) {
      setCity(filters.city);
      setMoods(filters.moods ?? []);
      setPriceLevel(filters.priceLevel);
    }
  }, [visible, filters]);

  const toggleMood = (key: string) => {
    setMoods((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  };

  const apply = () => {
    setFilters({ city, moods: moods.length > 0 ? moods : undefined, priceLevel });
    onClose();
  };

  const reset = () => {
    setCity(undefined);
    setMoods([]);
    setPriceLevel(undefined);
    resetFilters();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-bg"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-base pb-sm">
          <Text className="font-inter-bold text-h2 text-text">Filters</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface-alt"
          >
            <X size={20} color={tokens.textMuted} />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-base" showsVerticalScrollIndicator={false}>
          {/* City */}
          <Text className="mb-sm font-inter-semibold text-label text-text">City</Text>
          <View className="mb-lg flex-row gap-sm">
            {['Pune', 'Mumbai'].map((c) => {
              const active = city === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCity(active ? undefined : c)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`min-h-[44px] rounded-pill px-lg py-sm ${
                    active ? 'bg-primary' : 'bg-surface-alt border border-border'
                  }`}
                >
                  <Text
                    className={`font-inter-medium text-label ${
                      active ? 'text-white' : 'text-text-muted'
                    }`}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Mood / Vibe */}
          <Text className="mb-sm font-inter-semibold text-label text-text">Vibe</Text>
          <View className="mb-lg flex-row flex-wrap gap-sm">
            {MOODS.map((m) => {
              const active = moods.includes(m.key);
              return (
                <Pressable
                  key={m.key}
                  onPress={() => toggleMood(m.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`min-h-[44px] rounded-pill px-lg py-sm ${
                    active ? 'bg-primary' : 'bg-surface-alt border border-border'
                  }`}
                >
                  <Text
                    className={`font-inter-medium text-label ${
                      active ? 'text-white' : 'text-text-muted'
                    }`}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Budget */}
          <Text className="mb-sm font-inter-semibold text-label text-text">Max budget</Text>
          <View className="mb-lg flex-row gap-sm">
            {BUDGET_LEVELS.map((b) => {
              const active = priceLevel === b.value;
              return (
                <Pressable
                  key={b.value}
                  onPress={() => setPriceLevel(active ? undefined : b.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`min-h-[44px] rounded-pill px-lg py-sm ${
                    active ? 'bg-primary' : 'bg-surface-alt border border-border'
                  }`}
                >
                  <Text
                    className={`font-inter-medium text-label ${
                      active ? 'text-white' : 'text-text-muted'
                    }`}
                  >
                    {b.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom actions */}
        <View className="gap-sm px-base pt-base">
          <Button label="Apply filters" onPress={apply} />
          <Button label="Reset" variant="ghost" onPress={reset} />
        </View>
      </View>
    </Modal>
  );
}