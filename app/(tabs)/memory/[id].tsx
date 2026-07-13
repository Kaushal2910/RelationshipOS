import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemoryById } from '../../../lib/queries/useMemories';
import { getSignedMemoryUrls } from '../../../lib/storage';
import { Button } from '../../../components/ui/Button';

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: memory, isLoading } = useMemoryById(id);
  const [urls, setUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (memory?.media && memory.media.length > 0) {
      getSignedMemoryUrls(memory.media.map((m) => m.url)).then(setUrls);
    }
  }, [memory]);

  if (isLoading) {
    return <View className="flex-1 bg-bg" />;
  }

  if (!memory) {
    return (
      <View className="flex-1 bg-bg items-center justify-center p-base">
        <Text className="font-sans text-body text-text-muted">Memory not found</Text>
        <Button label="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      {/* Photo carousel/header */}
      <View className="h-64 bg-surface-variant flex-row">
        {memory.media.map((m) => {
          const signedUrl = urls.get(m.url);
          if (!signedUrl) return null;
          return (
            <Image
              key={m.id}
              source={{ uri: signedUrl }}
              className="flex-1 h-full"
              resizeMode="cover"
            />
          );
        })}
        {memory.media.length === 0 && (
          <View className="flex-1 h-full items-center justify-center bg-surface-alt">
            <Text className="font-sans text-caption text-text-subtle">No Photos</Text>
          </View>
        )}
      </View>

      <View className="p-base">
        <Text className="font-inter-semibold text-caption text-primary uppercase tracking-wider">
          {memory.memory_date}
        </Text>
        <Text className="font-inter-bold text-h1 text-text mt-xs">{memory.title || 'Date Memory'}</Text>
        {memory.place && (
          <View className="mt-sm self-start px-sm py-xs bg-surface-alt border border-border rounded-pill">
            <Text className="font-inter-medium text-caption text-text-muted">{memory.place.name}</Text>
          </View>
        )}
        <Text className="font-sans text-body text-text mt-base leading-relaxed">{memory.note}</Text>
      </View>
    </ScrollView>
  );
}
