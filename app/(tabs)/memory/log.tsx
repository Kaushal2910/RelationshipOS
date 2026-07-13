import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { useCreateMemory } from '../../../lib/queries/useMemories';
import { useWishlist } from '../../../lib/queries/useWishlist';
import { useSessionStore } from '../../../stores/session';
import { useProfile } from '../../../lib/queries/useProfile';
import { uploadMemoryPhoto } from '../../../lib/storage';
import { supabase } from '../../../lib/supabase';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  note: z.string().min(1, 'Journal note is required'),
  memory_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .refine((val) => {
      const parsed = new Date(val);
      if (isNaN(parsed.getTime())) return false;
      // Extract components to avoid timezone offsets causing false invalid dates
      const [year, month, day] = val.split('-').map(Number);
      return (
        parsed.getFullYear() === year &&
        parsed.getMonth() + 1 === month &&
        parsed.getDate() === day
      );
    }, 'Invalid calendar date')
    .refine((val) => {
      const parsed = new Date(`${val}T00:00:00`);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Allow log until end of today
      return parsed <= today;
    }, 'Cannot log memories in the future'),
  place_id: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function LogMemoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const userId = useSessionStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const coupleId = profile?.couple_id ?? undefined;

  const { data: wishlist } = useWishlist(coupleId);
  const { mutate: createMemory, isPending: isSavingMemory } = useCreateMemory(coupleId);

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      note: '',
      memory_date: params.date || new Date().toISOString().split('T')[0],
      place_id: null,
    },
  });

  const pickImage = async () => {
    if (images.length >= 9) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 9 - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const selected = result.assets.map((asset: any) => asset.uri);
      setImages(prev => [...prev, ...selected].slice(0, 9));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    if (!userId || !coupleId) return;
    if (images.length === 0) {
      setError('At least one photo is required to save a memory.');
      return;
    }
    setUploading(true);
    setError(null);

    try {
      // 1. Create memory row
      const memory = await new Promise<any>((resolve, reject) => {
        createMemory(
          {
            created_by: userId,
            title: values.title,
            note: values.note,
            memory_date: values.memory_date,
            calendar_item_id: null,
            place_id: values.place_id,
          },
          {
            onSuccess: (data) => resolve(data),
            onError: (err) => reject(err),
          }
        );
      });

      // 2. Upload images and insert records
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const uri = images[i];
          const name = uri.split('/').pop() || `photo_${i}.jpg`;
          const path = await uploadMemoryPhoto(memory.id, {
            uri,
            name,
            type: 'image/jpeg',
          });

          const { error: mediaError } = await supabase.from('memory_media' as any).insert({
            memory_id: memory.id,
            url: path,
            type: 'photo',
            position: i,
          } as any);

          if (mediaError) throw mediaError;
        }
      }

      router.back();
    } catch (err: any) {
      console.error('[log-memory] Failed:', err);
      setError(err?.message || 'Failed to save memory');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-base pb-sm pt-sm border-b border-border flex-row justify-between items-center">
        <Text className="font-inter-bold text-h2 text-text">Log Memory</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text className="font-inter text-body text-primary">Cancel</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-base"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Memory Title"
              placeholder="e.g. Lovely evening at the tea house"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="memory_date"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Date"
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.memory_date?.message}
            />
          )}
        />

        {/* Wishlist place select */}
        {wishlist && wishlist.length > 0 && (
          <View className="mb-base">
            <Text className="mb-xs font-inter-medium text-label text-text-muted">Link a Place</Text>
            <Controller
              control={control}
              name="place_id"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-xs">
                  <Pressable
                    onPress={() => onChange(null)}
                    className={[
                      'px-sm py-xs rounded border',
                      value === null ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
                    ].join(' ')}
                  >
                    <Text className={value === null ? 'text-primary font-inter-semibold text-caption' : 'text-text-muted font-inter text-caption'}>
                      None
                    </Text>
                  </Pressable>
                  {wishlist.map((item) => {
                    if (!item.place) return null;
                    const active = value === item.place.id;
                    return (
                      <Pressable
                        key={item.place.id}
                        onPress={() => onChange(item.place!.id)}
                        className={[
                          'px-sm py-xs rounded border',
                          active ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
                        ].join(' ')}
                      >
                        <Text className={active ? 'text-primary font-inter-semibold text-caption' : 'text-text-muted font-inter text-caption'}>
                          {item.place.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </View>
        )}

        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Journal Entry"
              placeholder="Write your story..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              error={errors.note?.message}
            />
          )}
        />

        {/* Photo Grid */}
        <View className="mb-lg">
          <Text className="mb-xs font-inter-medium text-label text-text-muted">
            Photos (Required, Max 9) <Text className="text-pass">*</Text>
          </Text>
          <View className="flex-row flex-wrap gap-sm">
            {images.map((uri, idx) => (
              <View key={uri} className="relative w-24 h-24 bg-surface-alt rounded-lg overflow-hidden">
                <Image source={{ uri }} className="w-full h-full object-cover" />
                <Pressable
                  onPress={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full w-6 h-6 items-center justify-center"
                >
                  <Text className="text-white text-caption font-bold">×</Text>
                </Pressable>
              </View>
            ))}
            {images.length < 9 && (
              <Pressable
                onPress={pickImage}
                className="w-24 h-24 border border-dashed border-border bg-surface rounded-lg items-center justify-center"
              >
                <Text className="text-text-muted font-inter-semibold text-h2">+</Text>
                <Text className="text-text-subtle font-sans text-[10px]">Add Photo</Text>
              </Pressable>
            )}
          </View>
        </View>

        {error ? (
          <Text className="mb-base font-sans text-caption text-pass" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <View className="mt-base">
          <Button
            label="Save Memory"
            onPress={handleSubmit(onSubmit)}
            loading={isSavingMemory || uploading}
          />
        </View>
      </ScrollView>
    </View>
  );
}
