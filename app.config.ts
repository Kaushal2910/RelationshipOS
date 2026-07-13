import type { ExpoConfig, ConfigContext } from 'expo/config';

// Public config only. The Supabase URL + publishable/anon key are safe to ship
// in the client bundle (RLS is the security boundary). Server secrets never live here.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'RelationOS',
  slug: 'app-relationos',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'relationos',
  userInterfaceStyle: 'automatic',
  // New Architecture is enabled by default in SDK 57 / RN 0.86 — no flag needed.
  // Top-level `splash` was removed in SDK 57; configured via the expo-splash-screen plugin below.
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.relationos.app',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.relationos.app',
    adaptiveIcon: {
      backgroundColor: '#FDF8F6',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#FDF8F6',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
    eas: {
      projectId: '7995ab73-741d-4f1b-9c6d-2490057755d2',
    },
  },
});
