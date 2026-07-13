import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../theme/useTheme';
import type { Memory } from '../../lib/queries/useMemories';

interface NostalgiaCardProps {
  memory: Memory;
}

export function NostalgiaCard({ memory }: NostalgiaCardProps) {
  const { tokens } = useTheme();
  const router = useRouter();
  const dateStr = memory.memory_date ? format(parseISO(memory.memory_date), 'MMMM d, yyyy') : '';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/memory/[id]', params: { id: memory.id } } as any)}
      className="bg-primary-soft rounded-[24px] p-base mb-base flex-row gap-base items-center overflow-hidden border border-primary/10 active:opacity-90"
    >
      <View className="flex-1 flex-col justify-center">
        <Text className="font-inter-semibold text-overline text-primary uppercase tracking-wider">
          On This Day
        </Text>
        <Text className="font-inter-bold text-body text-text mt-2xs" numberOfLines={1}>
          {memory.title || memory.place?.name || 'Date Memory'}
        </Text>
        {memory.note ? (
          <Text className="font-sans text-caption text-text-muted mt-3xs" numberOfLines={2}>
            {memory.note}
          </Text>
        ) : null}
        <Text className="font-inter text-caption text-primary mt-xs">
          {dateStr}
        </Text>
      </View>
    </Pressable>
  );
}
