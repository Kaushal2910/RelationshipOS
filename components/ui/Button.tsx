import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const container: Record<Variant, string> = {
  primary: 'bg-primary active:bg-primary-pressed',
  secondary: 'bg-surface border border-border active:bg-surface-alt',
  ghost: 'bg-transparent active:bg-surface-alt',
};

const text: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-text',
  ghost: 'text-primary',
};

/** Primary action button (UI_UX_Brief §5). 52pt tall, loading + disabled states. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  const { tokens } = useTheme();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={[
        'min-h-[52px] flex-row items-center justify-center rounded-lg px-lg',
        container[variant],
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : tokens.primary} />
      ) : (
        <View className="flex-row items-center">
          <Text className={`font-inter-semibold text-label ${text[variant]}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
