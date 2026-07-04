import '../global.css';
import { useEffect, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { queryClient } from '../lib/queryClient';
import { supabase } from '../lib/supabase';
import { useTheme } from '../theme/useTheme';
import { useSessionStore } from '../stores/session';
import { useProfile } from '../lib/queries/useProfile';

SplashScreen.preventAutoHideAsync();

/**
 * Route guard (App_Flow §2). Redirects based on auth + onboarding:
 *   no session            → (auth)/welcome
 *   session, not onboarded → (onboarding)/profile
 *   session, onboarded     → (tabs)
 * Lives inside QueryClientProvider so it can read the profile query.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;
  const { data: profile, isLoading: profileLoading } = useProfile(userId);

  useEffect(() => {
    const group = segments[0]; // '(auth)' | '(onboarding)' | '(tabs)' | undefined

    if (!session) {
      if (group !== '(auth)') router.replace('/(auth)/welcome');
      return;
    }

    // Signed in: wait for the profile to load before deciding onboarding state.
    if (profileLoading && !profile) return;

    const onboarded = !!profile?.onboarded_at;
    if (!onboarded) {
      if (group !== '(onboarding)') router.replace('/(onboarding)/profile');
    } else if (group === '(auth)' || group === '(onboarding)') {
      // '/' is the (tabs) index at runtime. The generated route types (.expo/types)
      // are briefly stale after a route-tree change and regenerate on `expo start`.
      router.replace('/' as unknown as Href);
    }
  }, [session, profile, profileLoading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const { scheme, tokens } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_700Bold,
  });

  const setSession = useSessionStore((s) => s.setSession);
  const setBootstrapping = useSessionStore((s) => s.setBootstrapping);
  const isBootstrapping = useSessionStore((s) => s.isBootstrapping);

  // Load the persisted session on boot, then keep it in sync with auth changes.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBootstrapping(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [setSession, setBootstrapping]);

  const ready = (fontsLoaded || !!fontError) && !isBootstrapping;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: tokens.bg },
              }}
            />
          </AuthGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
