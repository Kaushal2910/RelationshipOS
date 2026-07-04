import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = (extra.supabaseUrl as string | undefined) ?? '';
const supabaseKey = (extra.supabaseKey as string | undefined) ?? '';

if (!supabaseUrl || !supabaseKey) {
  // Surfaced early so a missing/typo'd .env fails loudly instead of silent empty decks.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY. ' +
      'Check .env and restart Expo with cache cleared (npx expo start -c).'
  );
}

// Client uses the publishable/anon key only — RLS is the real security boundary.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
