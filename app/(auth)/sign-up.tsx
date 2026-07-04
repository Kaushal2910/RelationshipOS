import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react-native';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme/useTheme';
import { signUpSchema, type SignUpValues } from '../../lib/validation/auth';
import { signUpWithEmail, resendVerificationEmail, authErrorMessage } from '../../lib/auth';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens } = useTheme();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const onSubmit = async (values: SignUpValues) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const { needsEmailVerification } = await signUpWithEmail(
        values.email,
        values.password,
        values.displayName
      );
      // With "Confirm email" ON, no session yet → show the verify state.
      // Otherwise the root route guard will redirect to onboarding automatically.
      if (needsEmailVerification) setSentTo(values.email);
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <View
        className="flex-1 items-center justify-center bg-bg px-lg"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
      >
        <View className="mb-base h-16 w-16 items-center justify-center rounded-pill bg-primary-soft">
          <MailCheck size={30} color={tokens.primary} />
        </View>
        <Text className="mb-xs text-center font-inter-bold text-h2 text-text">Check your email</Text>
        <Text className="mb-lg max-w-[320px] text-center font-sans text-body text-text-muted">
          We sent a verification link to {sentTo}. Tap it, then come back and sign in.
        </Text>
        <View className="w-full gap-md">
          <Button label="Go to sign in" onPress={() => router.replace('/(auth)/sign-in')} />
          <Button
            label="Resend email"
            variant="ghost"
            onPress={async () => {
              try {
                await resendVerificationEmail(sentTo);
              } catch {
                /* best-effort resend */
              }
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: insets.top + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-xs font-display text-h1 text-text">Create your account</Text>
        <Text className="mb-lg font-sans text-body text-text-muted">
          It only takes a minute. 💞
        </Text>

        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Your name"
              placeholder="Kaushal"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              autoComplete="name"
              error={errors.displayName?.message}
            />
          )}
        />
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
              placeholder="At least 8 characters"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="password-new"
              error={errors.password?.message}
            />
          )}
        />

        {formError ? (
          <Text className="mb-base font-sans text-caption text-pass" accessibilityRole="alert">
            {formError}
          </Text>
        ) : null}

        <Button label="Create account" onPress={handleSubmit(onSubmit)} loading={submitting} />

        <View className="mt-lg flex-row justify-center">
          <Text className="font-sans text-body text-text-muted">Already have one? </Text>
          <Text
            className="font-inter-semibold text-body text-primary"
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            Sign in
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
