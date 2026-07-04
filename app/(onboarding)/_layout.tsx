import { Stack } from 'expo-router';

/** Post-signup onboarding (profile setup). No headers. */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
