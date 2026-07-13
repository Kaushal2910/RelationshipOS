import { useState, useMemo, useEffect } from 'react';
import { Text, View, TextInput, ScrollView, ActivityIndicator, Alert, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  User,
  Flame,
  MapPin,
  Mail,
  ChevronRight,
  Bell,
  Palette,
  Download,
  Trash2,
  Info,
  LogOut,
  Check,
  X,
  ShieldAlert,
  Sliders,
  Heart
} from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useSessionStore } from '../../stores/session';
import { useProfile, useCouple, usePartnerProfile, useUpdateProfile, useUnpair } from '../../lib/queries/useProfile';
import { signOut } from '../../lib/auth';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Stitch-inspired Profile & Settings screen.
 * Implements high-fidelity iOS grouped lists, tactile scale feedback,
 * inline editing, and a premium appearance theme switcher.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens } = useTheme();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>('system');
  const session = useSessionStore((s) => s.session);
  const userId = session?.user.id;

  // Profile and couple queries
  const { data: profile, isLoading: isLoadingProfile } = useProfile(userId);
  const coupleId = profile?.couple_id;

  const { data: couple, isLoading: isLoadingCouple } = useCouple(coupleId ?? undefined);
  const { data: partner, isLoading: isLoadingPartner } = usePartnerProfile(userId, coupleId ?? undefined);

  // Mutations
  const updateProfile = useUpdateProfile(userId);
  const unpair = useUnpair(userId);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');

  // Sync edits
  useEffect(() => {
    if (profile) {
      setEditName(profile.display_name ?? '');
      setEditCity(profile.city ?? 'Pune');
    }
  }, [profile]);

  // Streak Calculation
  const streak = useMemo(() => {
    if (!couple?.paired_at) return 0;
    try {
      const days = differenceInDays(new Date(), parseISO(couple.paired_at));
      return Math.max(1, days + 1);
    } catch {
      return 1;
    }
  }, [couple?.paired_at]);

  const handleSave = () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Display name cannot be empty.');
      return;
    }
    updateProfile.mutate(
      { displayName: editName.trim(), city: editCity.trim() },
      {
        onSuccess: () => setIsEditing(false),
        onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile'),
      }
    );
  };

  const handleUnpair = () => {
    Alert.alert(
      'Unpair Relationship',
      'Are you sure you want to unpair? You will lose access to your shared wishlist, calendar plans, and memory logs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: () => {
            unpair.mutate(undefined, {
              onError: (err) => Alert.alert('Error', err instanceof Error ? err.message : 'Failed to unpair'),
            });
          },
        },
      ]
    );
  };

  const isLoading = isLoadingProfile || isLoadingCouple || isLoadingPartner || updateProfile.isPending || unpair.isPending;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Top App Bar */}
      <View className="flex-row items-center justify-between px-base py-sm border-b border-border bg-surface">
        <View className="flex-row items-center gap-xs">
          <Heart size={22} color={tokens.primary} fill={tokens.primary} />
          <Text className="font-inter-bold text-h2 text-primary">RelationshipOS</Text>
        </View>
        <Pressable
          className="p-sm active:opacity-75 transition-opacity"
          onPress={() => router.push('/(tabs)/discover' as any)}
        >
          <Bell size={20} className="text-text-muted" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.primary} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View className="items-center mb-xl">
            <View className="relative mb-md">
              <View className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-surface-alt items-center justify-center">
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} color={tokens.textMuted} />
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-primary w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <Check size={14} color="#ffffff" strokeWidth={3} />
              </View>
            </View>

            {isEditing ? (
              <View className="w-full bg-surface border border-border p-base rounded-2xl shadow-e1">
                <Text className="font-inter-semibold text-caption text-text-muted mb-xxs">Display Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Elena Rodriguez"
                  placeholderTextColor={tokens.textSubtle}
                  className="w-full h-11 px-base rounded-xl border border-border bg-bg text-text font-inter text-body mb-sm"
                  maxLength={50}
                />

                <Text className="font-inter-semibold text-caption text-text-muted mb-xxs">Current City</Text>
                <TextInput
                  value={editCity}
                  onChangeText={setEditCity}
                  placeholder="Pune"
                  placeholderTextColor={tokens.textSubtle}
                  className="w-full h-11 px-base rounded-xl border border-border bg-bg text-text font-inter text-body mb-base"
                  maxLength={50}
                />

                <View className="flex-row gap-base">
                  <Pressable
                    onPress={() => {
                      setIsEditing(false);
                      setEditName(profile?.display_name ?? '');
                      setEditCity(profile?.city ?? 'Pune');
                    }}
                    className="flex-1 h-11 items-center justify-center rounded-xl bg-surface-alt border border-border flex-row active:scale-[0.98] transition-transform duration-100"
                  >
                    <X size={16} color={tokens.text} />
                    <Text className="ml-xs font-inter-semibold text-button text-text">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSave}
                    className="flex-1 h-11 items-center justify-center rounded-xl bg-primary flex-row active:scale-[0.98] transition-transform duration-100"
                  >
                    <Check size={16} color="#fff" />
                    <Text className="ml-xs font-inter-semibold text-button text-white">Save</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="items-center">
                <Text className="font-inter-bold text-h1 text-text">{profile?.display_name ?? 'Your Name'}</Text>
                <Text className="font-sans text-body text-text-muted mt-xxs">{profile?.city ?? 'Pune'}</Text>
                <Pressable
                  onPress={() => setIsEditing(true)}
                  className="mt-base px-6 py-2 rounded-full border border-primary active:bg-primary-soft active:scale-95 transition-transform duration-150"
                >
                  <Text className="font-inter-semibold text-caption text-primary">Edit Profile</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Group 1: Connection & Partner */}
          <View className="mb-base">
            <Text className="font-inter-bold text-overline text-text-subtle uppercase px-md mb-xs">Connected Partner</Text>
            <View className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
              {coupleId ? (
                <Pressable
                  onPress={() => {}}
                  className="flex-row items-center justify-between p-base active:bg-surface-alt transition-colors duration-150 flex-1"
                >
                  <View className="flex-row items-center gap-md">
                    <View className="w-12 h-12 rounded-full overflow-hidden bg-surface-alt items-center justify-center">
                      {partner?.avatar_url ? (
                        <Image source={{ uri: partner.avatar_url }} className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} color={tokens.textMuted} />
                      )}
                    </View>
                    <View>
                      <Text className="font-inter-bold text-body-strong text-text">{partner?.display_name ?? 'Partner Name'}</Text>
                      <View className="flex-row items-center gap-xxs mt-xxs">
                        <View className="w-2 h-2 rounded-full bg-like" />
                        <Text className="font-inter text-caption text-text-muted">
                          Planning a date with you
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color={tokens.textSubtle} />
                </Pressable>
              ) : (
                <View className="p-base items-center">
                  <Text className="font-inter text-caption text-text-muted text-center mb-sm">
                    No partner connected. Pair now to sync swipe wishlists!
                  </Text>
                  <Pressable
                    onPress={() => router.push('/(pairing)/pairing' as any)}
                    className="px-base py-sm rounded-xl bg-primary flex-row items-center active:scale-95 transition-transform duration-150"
                  >
                    <Text className="font-inter-semibold text-caption text-white">Connect Partner</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* Group 2: Preferences */}
          <View className="mb-base">
            <Text className="font-inter-bold text-overline text-text-subtle uppercase px-md mb-xs">Preferences</Text>
            <View className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
              <Pressable className="flex-row items-center justify-between p-base border-b border-border/50 active:bg-surface-alt transition-colors">
                <View className="flex-row items-center gap-md">
                  <Sliders size={20} color={tokens.primary} />
                  <Text className="font-inter text-body text-text">Preferences & Sharing</Text>
                </View>
                <ChevronRight size={18} color={tokens.textSubtle} />
              </Pressable>
              <Pressable className="flex-row items-center justify-between p-base active:bg-surface-alt transition-colors">
                <View className="flex-row items-center gap-md">
                  <Bell size={20} color={tokens.primary} />
                  <Text className="font-inter text-body text-text">Notifications</Text>
                </View>
                <ChevronRight size={18} color={tokens.textSubtle} />
              </Pressable>
            </View>
          </View>

          {/* Group 3: System & Privacy */}
          <View className="mb-base">
            <Text className="font-inter-bold text-overline text-text-subtle uppercase px-md mb-xs">System & Privacy</Text>
            <View className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
              {/* Appearance Mode Segment Selector */}
              <View className="flex-row items-center justify-between p-base border-b border-border/50">
                <View className="flex-row items-center gap-md">
                  <Palette size={20} color={tokens.primary} />
                  <Text className="font-inter text-body text-text">Appearance</Text>
                </View>
                <View className="flex-row bg-surface-alt rounded-xl p-xs border border-border">
                  <Pressable
                    onPress={() => {
                      setColorScheme('light');
                      setThemePref('light');
                    }}
                    className={`px-sm py-xxs rounded-lg active:scale-95 transition-transform duration-100 ${themePref === 'light' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Text className={`font-inter-semibold text-caption ${themePref === 'light' ? 'text-primary' : 'text-text-muted'}`}>Light</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setColorScheme('dark');
                      setThemePref('dark');
                    }}
                    className={`px-sm py-xxs rounded-lg active:scale-95 transition-transform duration-100 ${themePref === 'dark' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Text className={`font-inter-semibold text-caption ${themePref === 'dark' ? 'text-primary' : 'text-text-muted'}`}>Dark</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setColorScheme('system');
                      setThemePref('system');
                    }}
                    className={`px-sm py-xxs rounded-lg active:scale-95 transition-transform duration-100 ${themePref === 'system' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Text className={`font-inter-semibold text-caption ${themePref === 'system' ? 'text-primary' : 'text-text-muted'}`}>Auto</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable className="flex-row items-center justify-between p-base border-b border-border/50 active:bg-surface-alt transition-colors">
                <View className="flex-row items-center gap-md">
                  <Download size={20} color={tokens.primary} />
                  <Text className="font-inter text-body text-text">Export My Data</Text>
                </View>
                <ChevronRight size={18} color={tokens.textSubtle} />
              </Pressable>

              {coupleId ? (
                <Pressable
                  onPress={handleUnpair}
                  className="flex-row items-center p-base active:bg-surface-alt transition-colors"
                >
                  <View className="flex-row items-center gap-md">
                    <Trash2 size={20} color={tokens.pass} />
                    <Text className="font-inter-semibold text-body text-pass">Unpair Relationship</Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable className="flex-row items-center p-base active:bg-surface-alt transition-colors">
                  <View className="flex-row items-center gap-md">
                    <Trash2 size={20} color={tokens.pass} />
                    <Text className="font-inter-semibold text-body text-pass">Delete Account</Text>
                  </View>
                </Pressable>
              )}
            </View>
          </View>

          {/* Group 4: Legal */}
          <View className="mb-base">
            <Text className="font-inter-bold text-overline text-text-subtle uppercase px-md mb-xs">Legal</Text>
            <View className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
              <Pressable className="flex-row items-center justify-between p-base active:bg-surface-alt transition-colors">
                <View className="flex-row items-center gap-md">
                  <Info size={20} color={tokens.primary} />
                  <Text className="font-inter text-body text-text">About RelationshipOS</Text>
                </View>
                <View className="flex-row items-center gap-xxs">
                  <Text className="font-inter text-caption text-text-subtle">v1.0.0</Text>
                  <ChevronRight size={18} color={tokens.textSubtle} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Logout Group */}
          <View className="mt-base rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
            <Pressable
              onPress={() => signOut()}
              className="p-base items-center justify-center active:bg-surface-alt flex-row gap-xs"
            >
              <LogOut size={18} color={tokens.primary} />
              <Text className="font-inter-bold text-body-strong text-primary">Log out</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
