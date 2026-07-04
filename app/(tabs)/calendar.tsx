import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/ui/EmptyState';

/** Stub — plans + photo memories are built in P5. */
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-base pb-sm pt-sm">
        <Text className="font-inter-bold text-h1 text-text">Calendar</Text>
      </View>
      <EmptyState
        title="No plans yet"
        subtitle="Saved dates and memories will show up here."
      />
    </View>
  );
}
