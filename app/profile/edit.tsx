import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Camera, ArrowLeft, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/useTheme';
import { useSessionStore } from '../../stores/session';
import { useProfile, useUpdateProfile } from '../../lib/queries/useProfile';
import { uploadAvatar } from '../../lib/storage';

/**
 * Edit Profile Screen (P6/P1).
 * Features display name + city updating and profile picture uploads via expo-image-picker.
 */
export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens } = useTheme();

  const userId = useSessionStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const updateProfile = useUpdateProfile(userId);

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setCity(profile.city ?? 'Pune');
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display name cannot be empty.');
      return;
    }

    setUploading(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // If a new local photo is selected, upload it
      if (localPhotoUri && userId) {
        const name = localPhotoUri.split('/').pop() || 'avatar.jpg';
        finalAvatarUrl = await uploadAvatar(userId, {
          uri: localPhotoUri,
          name,
          type: 'image/jpeg',
        });
      }

      await new Promise<void>((resolve, reject) => {
        updateProfile.mutate(
          {
            displayName: displayName.trim(),
            city: city.trim(),
            avatarUrl: finalAvatarUrl || undefined,
          },
          {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          }
        );
      });

      router.back();
    } catch (err: any) {
      console.error('[edit-profile] Failed:', err);
      Alert.alert('Error', err?.message || 'Failed to save changes');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-base py-sm border-b border-border bg-surface">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full active:scale-90 transition-transform"
        >
          <ArrowLeft size={22} color={tokens.text} />
        </Pressable>
        <Text className="font-inter-bold text-h2 text-text">Edit Profile</Text>
        <Pressable
          onPress={handleSave}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft active:scale-90 transition-transform"
        >
          {uploading ? (
            <ActivityIndicator size="small" color={tokens.primary} />
          ) : (
            <Check size={22} color={tokens.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-base"
        contentContainerStyle={{ paddingTop: 32, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Select */}
        <View className="items-center mb-xl">
          <Pressable
            onPress={handlePickImage}
            className="relative active:scale-98 transition-transform duration-100"
          >
            <View className="w-28 h-28 rounded-full border-4 border-white bg-surface-alt shadow-md overflow-hidden items-center justify-center">
              {localPhotoUri ? (
                <Image source={{ uri: localPhotoUri }} className="w-full h-full object-cover" />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-full h-full object-cover" />
              ) : (
                <User size={56} color={tokens.textMuted} />
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-primary w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <Camera size={16} color="#ffffff" />
            </View>
          </Pressable>
          <Text className="font-inter text-caption text-text-subtle mt-sm">Tap to change profile picture</Text>
        </View>

        {/* Inputs */}
        <View className="gap-md">
          <View>
            <Text className="font-inter-semibold text-caption text-text-muted mb-xxs">Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={tokens.textSubtle}
              className="w-full h-[52px] px-base rounded-xl border border-border bg-surface text-text font-inter text-body shadow-sm focus:border-primary"
              maxLength={50}
            />
          </View>

          <View>
            <Text className="font-inter-semibold text-caption text-text-muted mb-xxs">City</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Pune"
              placeholderTextColor={tokens.textSubtle}
              className="w-full h-[52px] px-base rounded-xl border border-border bg-surface text-text font-inter text-body shadow-sm focus:border-primary"
              maxLength={50}
            />
          </View>
        </View>

        <View className="mt-2xl flex-row justify-center">
          <Pressable
            onPress={() => router.back()}
            className="px-lg h-12 items-center justify-center rounded-xl bg-surface-alt border border-border active:scale-95 transition-transform duration-100"
          >
            <Text className="font-inter-semibold text-button text-text">Cancel Changes</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
