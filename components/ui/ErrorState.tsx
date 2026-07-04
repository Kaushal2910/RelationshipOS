import { Pressable, Text, View } from 'react-native';
import { CloudOff } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/** Calm, actionable error state (UI_UX_Brief §6/§11). Icon + message + Retry. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { tokens } = useTheme();
  return (
    <View className="flex-1 items-center justify-center px-lg" accessibilityRole="alert">
      <View className="mb-base h-16 w-16 items-center justify-center rounded-pill bg-surface-alt">
        <CloudOff size={28} color={tokens.pass} />
      </View>
      <Text className="mb-xs text-center font-inter-bold text-h3 text-text">
        Couldn&apos;t load right now
      </Text>
      <Text className="text-center font-sans text-body text-text-muted">
        {message ?? 'Something went wrong. Try again?'}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
          className="mt-lg min-h-[44px] justify-center rounded-lg border border-border px-lg py-md active:bg-surface-alt"
        >
          <Text className="font-inter-semibold text-label text-text">Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
