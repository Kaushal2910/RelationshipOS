import { Stack } from 'expo-router';

/** Pairing stack (P2). No headers — the screen draws its own. */
export default function PairingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
