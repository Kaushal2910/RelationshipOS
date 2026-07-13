import { Tabs } from 'expo-router';
import { Home, Compass, Heart, CalendarDays, User } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

/** Authenticated tab shell. Dashboard is index, Discover is discover. */
export default function TabsLayout() {
  const { tokens } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.textSubtle,
        tabBarStyle: {
          backgroundColor: tokens.surface,
          borderTopColor: tokens.border,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: 'Discover', tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{ title: 'Wishlist', tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar', tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="place-detail/[id]"
        options={{ href: null, title: 'Place Detail' }}
      />
      <Tabs.Screen
        name="calendar/create-item"
        options={{ href: null, title: 'Schedule Date' }}
      />
      <Tabs.Screen
        name="memory/log"
        options={{ href: null, title: 'Log Memory' }}
      />
      <Tabs.Screen
        name="memory/[id]"
        options={{ href: null, title: 'Memory Detail' }}
      />
    </Tabs>
  );
}
