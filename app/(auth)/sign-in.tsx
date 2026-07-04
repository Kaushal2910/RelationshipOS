import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { signInSchema, type SignInValues } from '../../lib/validation/auth';
import { signInWithEmail, authErrorMessage } from '../../lib/auth';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: SignInValues) => {
    setFormError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(values.email, values.password);
      // On success the root route guard redirects (onboarding or tabs).
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: insets.top + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-xs font-display text-h1 text-text">Welcome back</Text>
        <Text className="mb-lg font-sans text-body text-text-muted">
          Sign in to pick up where you left off.
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Email"
              placeholder="you@email.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Password"
              placeholder="Your password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="password"
              error={errors.password?.message}
            />
          )}
        />

        {formError ? (
          <Text className="mb-base font-sans text-caption text-pass" accessibilityRole="alert">
            {formError}
          </Text>
        ) : null}

        <Button label="Sign in" onPress={handleSubmit(onSubmit)} loading={submitting} />

        <View className="mt-lg flex-row justify-center">
          <Text className="font-sans text-body text-text-muted">New here? </Text>
          <Text
            className="font-inter-semibold text-body text-primary"
            onPress={() => router.replace('/(auth)/sign-up')}
          >
            Create an account
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
