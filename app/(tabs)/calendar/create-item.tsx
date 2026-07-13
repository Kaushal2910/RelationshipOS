import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TextField } from '../../../components/ui/TextField';
import { Button } from '../../../components/ui/Button';
import { useCreateCalendarItem } from '../../../lib/queries/useCalendar';
import { useWishlist } from '../../../lib/queries/useWishlist';
import { useSessionStore } from '../../../stores/session';
import { useProfile } from '../../../lib/queries/useProfile';
import { useTheme } from '../../../theme/useTheme';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format')
    .refine((val) => {
      const parsed = new Date(val);
      if (isNaN(parsed.getTime())) return false;
      // Validate real calendar days
      const [year, month, day] = val.split('-').map(Number);
      return (
        parsed.getFullYear() === year &&
        parsed.getMonth() + 1 === month &&
        parsed.getDate() === day
      );
    }, 'Invalid calendar date'),
  time: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Use HH:MM format')
    .refine((val) => {
      const [hours, minutes] = val.split(':').map(Number);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    }, 'Invalid time (must be 00:00 - 23:59)'),
  type: z.enum(['date', 'anniversary', 'birthday', 'trip', 'movie_night', 'reservation', 'event', 'other']),
  place_id: z.string().nullable(),
  notes: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

const TYPES = [
  { label: 'Date Night', value: 'date' },
  { label: 'Anniversary', value: 'anniversary' },
  { label: 'Birthday', value: 'birthday' },
  { label: 'Trip', value: 'trip' },
  { label: 'Movie Night', value: 'movie_night' },
  { label: 'Reservation', value: 'reservation' },
  { label: 'Event', value: 'event' },
  { label: 'Other', value: 'other' },
] as const;

export default function CreateCalendarItemScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens } = useTheme();
  const userId = useSessionStore((s) => s.session?.user.id);
  const { data: profile } = useProfile(userId);
  const coupleId = profile?.couple_id ?? undefined;

  const { data: wishlist } = useWishlist(coupleId);
  const { mutate: createItem, isPending } = useCreateCalendarItem(coupleId);

  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toTimeString().slice(0, 5);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      date: todayStr,
      time: timeStr,
      type: 'date',
      place_id: null,
      notes: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!userId || !coupleId) return;

    const startsAt = new Date(`${values.date}T${values.time}:00`).toISOString();

    createItem(
      {
        title: values.title,
        type: values.type,
        starts_at: startsAt,
        ends_at: null,
        place_id: values.place_id,
        notes: values.notes || null,
        created_by: userId,
        status: 'planned',
      },
      {
        onSuccess: () => router.back(),
      }
    );
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-base pb-sm pt-sm border-b border-border flex-row justify-between items-center">
        <Text className="font-inter-bold text-h2 text-text">New Plan</Text>
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
              label="Event Title"
              placeholder="e.g. Dinner date"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.title?.message}
            />
          )}
        />

        {/* Type selector */}
        <Text className="mb-xs font-inter-medium text-label text-text-muted">Event Type</Text>
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange, value } }) => (
            <View className="mb-base flex-row flex-wrap gap-sm">
              {TYPES.map((t) => {
                const active = t.value === value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => onChange(t.value)}
                    className={[
                      'min-h-[40px] justify-center rounded-pill border px-md',
                      active ? 'border-primary bg-primary-soft' : 'border-border bg-surface',
                    ].join(' ')}
                  >
                    <Text className={`font-inter-medium text-caption ${active ? 'text-primary' : 'text-text-muted'}`}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        />

        {/* Date and time fields inline */}
        <View className="flex-row gap-base">
          <View className="flex-1">
            <Controller
              control={control}
              name="date"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Date"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.date?.message}
                />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="time"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Time"
                  placeholder="HH:MM"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.time?.message}
                />
              )}
            />
          </View>
        </View>

        {/* Wishlist place select */}
        {wishlist && wishlist.length > 0 && (
          <View className="mb-base">
            <Text className="mb-xs font-inter-medium text-label text-text-muted">Link a Saved Spot</Text>
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
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Notes"
              placeholder="Add details, dress code, etc."
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
            />
          )}
        />

        <View className="mt-base">
          <Button
            label="Save Plan"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
}
