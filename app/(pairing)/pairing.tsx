import { useEffect, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react-native';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme/useTheme';
import { useSessionStore } from '../../stores/session';
import { profileKeys } from '../../lib/queries/useProfile';
import { supabase } from '../../lib/supabase';
import {
  generateInviteCode,
  redeemInviteCode,
  skipPairing,
  pairingErrorMessage,
} from '../../lib/pairing';

type Mode = 'generate' | 'enter';

/**
 * Pairing (App_Flow §4.2) — one screen, two segments. Generate a code to share,
 * or enter a partner's. On success the profile gains a couple_id and the root
 * route guard redirects to the tabs; no manual "continue" needed. Skippable.
 */
export default function PairingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens } = useTheme();
  const qc = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id);

  const [mode, setMode] = useState<Mode>('generate');
  const [code, setCode] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [entry, setEntry] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = () => qc.invalidateQueries({ queryKey: profileKeys.me(userId) });

  // Mint a code the first time the user lands on the "invite" segment.
  // ponytail: if the app is killed mid-wait the code is lost and a new one is
  // minted next time (orphan pending couple, harmless + RLS-scoped). Persist/
  // resume the pending code only if users complain.
  useEffect(() => {
    if (mode !== 'generate' || code || busy || !userId) return;
    setBusy(true);
    generateInviteCode(userId)
      .then((r) => {
        setCode(r.code);
        setCoupleId(r.coupleId);
      })
      .catch((e) => setError(pairingErrorMessage(e)))
      .finally(() => setBusy(false));
  }, [mode, code, busy, userId]);

  // Live "partner joined": when the couple row flips to active, refresh the
  // profile → its couple_id is now set → the root guard sends us to the tabs.
  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`couple:${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => refreshProfile()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId]);

  const onShare = () => {
    if (code) Share.share({ message: `Pair with me on RelationshipOS 💞 My code: ${code}` });
  };

  const onEnter = async () => {
    const clean = entry.trim().toUpperCase();
    if (clean.length !== 6) {
      setError('Enter the 6-character code.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await redeemInviteCode(clean);
      await refreshProfile(); // guard → tabs
    } catch (e) {
      setError(pairingErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSkip = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      await skipPairing(userId); // records "pair later" so a future home prompt can respect it
      await refreshProfile();
    } finally {
      setBusy(false);
    }
    // Pairing is opt-in now (reached from Profile), so the guard no longer routes
    // skipped users out — leave to the tabs explicitly.
    router.replace('/' as unknown as Href);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  return (
    <View
      className="flex-1 bg-bg px-lg"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <Text className="mb-xs font-display text-h1 text-text">Pair with your partner</Text>
      <Text className="mb-lg font-sans text-body text-text-muted">
        Swipe together and share a wishlist. You can always do this later.
      </Text>

      <View className="mb-lg flex-row rounded-pill bg-surface-alt p-xs">
        {(['generate', 'enter'] as Mode[]).map((m) => {
          const active = m === mode;
          return (
            <Pressable
              key={m}
              onPress={() => switchMode(m)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`min-h-[44px] flex-1 items-center justify-center rounded-pill ${
                active ? 'bg-surface' : ''
              }`}
            >
              <Text
                className={`font-inter-semibold text-label ${active ? 'text-text' : 'text-text-muted'}`}
              >
                {m === 'generate' ? 'Invite partner' : 'Enter code'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'generate' ? (
        <View className="items-center">
          <View className="mb-base h-16 w-16 items-center justify-center rounded-pill bg-primary-soft">
            <Heart size={30} color={tokens.primary} />
          </View>
          <Text className="mb-sm font-sans text-body text-text-muted">
            Share this code with your partner
          </Text>
          <Text className="mb-base font-display text-display tracking-[8px] text-text">
            {code ?? '••••••'}
          </Text>
          <Text className="mb-lg font-sans text-caption text-text-subtle">
            Waiting for your partner to join…
          </Text>
          <View className="w-full">
            <Button label="Share code" onPress={onShare} disabled={!code} />
          </View>
          {error ? (
            <Text className="mt-base font-sans text-caption text-pass" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
        </View>
      ) : (
        <View>
          <TextField
            label="Partner's code"
            placeholder="ABC234"
            value={entry}
            onChangeText={(t) => setEntry(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            error={error ?? undefined}
          />
          <Button label="Pair up" onPress={onEnter} loading={busy} />
        </View>
      )}

      <View className="flex-1" />
      <Button label="I'll do this later" variant="ghost" onPress={onSkip} />
    </View>
  );
}
