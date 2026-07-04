import { Stack } from 'expo-router';

/** Unauthenticated stack: welcome / sign-up / sign-in. No headers (screens draw their own). */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
