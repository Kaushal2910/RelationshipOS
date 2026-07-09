import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { User } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme/useTheme';
import { useSessionStore } from '../../stores/session';
import { useProfile } from '../../lib/queries/useProfile';
import { signOut } from '../../lib/auth';

/** Profile tab — shows the signed-in user + sign out. Editing/avatar comes later. */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens } = useTheme();
  const session = useSessionStore((s) => s.session);
  const { data: profile } = useProfile(session?.user.id);

  return (
    <View className="flex-1 bg-bg px-lg" style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}>
      <Text className="mb-lg font-inter-bold text-h1 text-text">Profile</Text>

      <View className="items-center py-lg">
        <View className="mb-base h-24 w-24 items-center justify-center rounded-pill bg-primary-soft">
          <User size={40} color={tokens.primary} />
        </View>
        <Text className="font-inter-bold text-h2 text-text">
          {profile?.display_name ?? 'Your name'}
        </Text>
        <Text className="mt-xs font-sans text-body text-text-muted">
          {session?.user.email ?? ''}
        </Text>
        {profile?.city ? (
          <Text className="mt-xs font-sans text-label text-text-subtle">{profile.city}</Text>
        ) : null}
      </View>

      <View className="flex-1" />

      {!profile?.couple_id ? (
        <View className="mb-md">
          <Button
            label="Pair with your partner"
            onPress={() => router.push('/(pairing)/pairing' as unknown as Href)}
          />
        </View>
      ) : null}
      <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
    </View>
  );
}
