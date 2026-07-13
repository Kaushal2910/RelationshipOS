import '../global.css';
import { useEffect, useState, type ReactNode } from 'react';
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
      return;
    }

    // Onboarded → main app. Pairing is opt-in from Profile (App_Flow §2: solo-first,
    // "encouraged but skippable, pair later from Profile"), NOT a gate. Bounce out of
    // (auth)/(onboarding) always, and out of (pairing) once actually paired (covers the
    // live "partner joined" case while the inviter waits passively on the code screen).
    // '/' is the (tabs) index at runtime; generated route types regenerate on `expo start`.
    const paired = !!profile?.couple_id;
    if (group === '(auth)' || group === '(onboarding)') {
      router.replace('/' as unknown as Href);
    } else if ((group as string) === '(pairing)' && paired) {
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
  // MUST complete (even on error) — otherwise the splash never hides and the app
  // shows a blank white screen (return null branch below). A network-unreachable
  // Supabase URL or corrupted AsyncStorage session can cause getSession() to reject.
  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        setBootstrapping(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[bootstrap] getSession failed, continuing unauthenticated:', err);
        setSession(null);
        setBootstrapping(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setBootstrapping]);

  const ready = (fontsLoaded || !!fontError) && !isBootstrapping;

  // Fallback safety timeout: Force the app to mount and hide splash screen if loading hangs (e.g. fonts/network)
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('[bootstrap] Ready timeout triggered, forcing app launch');
      setTimedOut(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready || timedOut) {
      SplashScreen.hideAsync().catch((err) => {
        console.error('[bootstrap] Failed to hide splash screen:', err);
      });
    }
  }, [ready, timedOut]);

  if (!ready && !timedOut) return null;

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
