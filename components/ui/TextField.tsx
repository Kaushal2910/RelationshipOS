import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../../theme/useTheme';

interface TextFieldProps extends Omit<TextInputProps, 'placeholderTextColor'> {
  label: string;
  error?: string;
}

/** Labeled text input with inline error (UI_UX_Brief §11). Token classes only. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, ...inputProps },
  ref
) {
  const { tokens } = useTheme();
  const hasError = !!error;
  return (
    <View className="mb-base w-full">
      <Text className="mb-xs font-inter-medium text-label text-text-muted">{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={tokens.textSubtle}
        selectionColor={tokens.primary}
        className={[
          'min-h-[52px] rounded-lg border bg-surface px-base py-md',
          'font-sans text-body text-text',
          hasError ? 'border-pass' : 'border-border',
        ].join(' ')}
        accessibilityLabel={label}
        {...inputProps}
      />
      {hasError ? (
        <Text className="mt-xs font-sans text-caption text-pass" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
