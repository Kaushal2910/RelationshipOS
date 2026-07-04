import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme/useTheme';

/** First-run landing (App_Flow §1). Brand hero + create-account / sign-in. */
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens } = useTheme();

  return (
    <View
      className="flex-1 bg-bg px-lg"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="flex-1 items-center justify-center">
        <View className="mb-lg h-20 w-20 items-center justify-center rounded-pill bg-primary-soft">
          <Heart size={36} color={tokens.primary} />
        </View>
        <Text className="mb-sm text-center font-display text-display text-text">
          RelationshipOS
        </Text>
        <Text className="max-w-[300px] text-center font-sans text-body text-text-muted">
          Discover date spots together, save your favourites, and remember every moment.
        </Text>
      </View>

      <View className="gap-md">
        <Button label="Create an account" onPress={() => router.push('/(auth)/sign-up')} />
        <Button
          label="I already have an account"
          variant="secondary"
          onPress={() => router.push('/(auth)/sign-in')}
        />
      </View>
    </View>
  );
}
