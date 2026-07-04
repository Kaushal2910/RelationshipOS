import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useSessionStore } from '../../stores/session';
import { useProfile, useUpdateProfile } from '../../lib/queries/useProfile';
import { signOut } from '../../lib/auth';

const CITY_OPTIONS = ['Pune', 'Mumbai', 'Bengaluru'];

/** Profile setup — the only onboarding step in P1. Sets name + city, then stamps
 *  onboarded_at (via useUpdateProfile) which flips the route guard to the tabs. */
export default function OnboardingProfileScreen() {
  const insets = useSafeAreaInsets();
  const userId = useSessionStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const updateProfile = useUpdateProfile(userId);

  const [name, setName] = useState('');
  const [city, setCity] = useState('Pune');
  const [nameError, setNameError] = useState<string | null>(null);

  // Prefill the name captured at sign-up once the profile loads.
  useEffect(() => {
    if (profile?.display_name) setName(profile.display_name);
    if (profile?.city) setCity(profile.city);
  }, [profile?.display_name, profile?.city]);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError('Please enter your name');
      return;
    }
    setNameError(null);
    updateProfile.mutate({ displayName: trimmed, city, completeOnboarding: true });
  };

  return (
    <View
      className="flex-1 bg-bg px-lg"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="mb-xs font-display text-h1 text-text">Set up your profile</Text>
      <Text className="mb-lg font-sans text-body text-text-muted">
        This is how your partner will see you.
      </Text>

      <TextField
        label="Your name"
        placeholder="Kaushal"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        error={nameError ?? undefined}
      />

      <Text className="mb-xs font-inter-medium text-label text-text-muted">Your city</Text>
      <View className="mb-lg flex-row flex-wrap gap-sm">
        {CITY_OPTIONS.map((c) => {
          const active = c === city;
          return (
            <Pressable
              key={c}
              onPress={() => setCity(c)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={[
                'min-h-[44px] justify-center rounded-pill border px-lg',
                active ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
              ].join(' ')}
            >
              <Text
                className={`font-inter-medium text-label ${active ? 'text-primary' : 'text-text-muted'}`}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-1" />

      <Button
        label="Continue"
        onPress={onSubmit}
        loading={updateProfile.isPending}
      />
      <Button label="Sign out" variant="ghost" onPress={() => signOut()} />
    </View>
  );
}
