import { Pressable, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Warm, never-a-dead-end empty state (UI_UX_Brief §6). Illustration + copy + one action. */
export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const { tokens } = useTheme();
  return (
    <View className="flex-1 items-center justify-center px-lg" accessibilityRole="summary">
      <View className="mb-base h-16 w-16 items-center justify-center rounded-pill bg-primary-soft">
        <Heart size={28} color={tokens.primary} />
      </View>
      <Text className="mb-xs text-center font-inter-bold text-h2 text-text">{title}</Text>
      {subtitle ? (
        <Text className="text-center font-sans text-body text-text-muted">{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="mt-lg min-h-[44px] justify-center rounded-lg bg-primary px-lg py-md active:bg-primary-pressed"
        >
          <Text className="font-inter-semibold text-label text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
