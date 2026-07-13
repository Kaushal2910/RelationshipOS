import { View, Text, Pressable, Image } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { format, parseISO } from 'date-fns';
import { CalendarItem } from '../../lib/queries/useCalendar';
import { Button } from '../ui/Button';
import { Calendar, MapPin, Clock, Plus } from 'lucide-react-native';

interface AgendaListProps {
  date: Date;
  items: CalendarItem[];
  onCreateItem: () => void;
  onItemPress: (item: CalendarItem) => void;
}

/**
 * Agenda list for a specific date with calendar items.
 */
export function AgendaList({ date, items, onCreateItem, onItemPress }: AgendaListProps) {
  const { tokens } = useTheme();

  return (
    <View className="flex-col gap-base mt-base">
      {/* Header */}
      <View className="flex-row justify-between items-center px-xs">
        <View className="flex-col">
          <Text className="font-inter-semibold text-overline text-primary uppercase tracking-wider">
            Agenda
          </Text>
          <Text className="font-inter-bold text-h3 text-text">
            {format(date, 'EEEE, MMMM d')}
          </Text>
        </View>
        <Button
          label="Add Plan"
          onPress={onCreateItem}
          variant="ghost"
          fullWidth={false}
        />
      </View>

      {/* Items list */}
      <View className="flex-col gap-md">
        {items.length > 0 ? (
          items.map(item => (
            <Pressable
              key={item.id}
              onPress={() => onItemPress(item)}
              className="bg-surface rounded-card p-base flex-row gap-base items-center active:opacity-90 border border-border shadow-e1"
            >
              <View className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-alt">
                {item.place?.cover_url ? (
                  <Image
                    source={{ uri: item.place.cover_url }}
                    className="w-full h-full"
                    style={{ resizeMode: 'cover' }}
                  />
                ) : (
                  <View className="w-full h-full bg-surface-alt items-center justify-center">
                    <Calendar color={tokens.textSubtle} size={24} />
                  </View>
                )}
              </View>
              <View className="flex-1 flex-col justify-between h-20">
                <View className="flex-row justify-between items-start gap-xs">
                  <Text className="font-inter-semibold text-body-strong leading-tight text-text flex-1" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View className={`px-2 py-0.5 rounded-full ${
                    item.status === 'planned' ? 'bg-primary-soft' :
                    item.status === 'done' ? 'bg-secondary-soft' :
                    'bg-surface-alt'
                  }`}>
                    <Text className={`text-[10px] font-inter-semibold uppercase tracking-wider ${
                      item.status === 'planned' ? 'text-primary' :
                      item.status === 'done' ? 'text-secondary' :
                      'text-text-muted'
                    }`}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-xs mt-1">
                  <Clock size={14} color={tokens.textMuted} />
                  <Text className="font-inter text-caption text-text-muted">
                    {format(parseISO(item.starts_at), 'h:mm a')}
                    {item.ends_at ? ` - ${format(parseISO(item.ends_at), 'h:mm a')}` : ''}
                  </Text>
                </View>

                <View className="flex-row items-center gap-xs">
                  <MapPin size={14} color={tokens.textMuted} />
                  <Text className="font-inter text-caption text-text-muted" numberOfLines={1}>
                    {item.place?.area || item.place?.address || 'Custom Location'}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <Pressable
            onPress={onCreateItem}
            className="bg-surface-alt border-2 border-dashed border-border rounded-card p-lg flex-col items-center justify-center gap-sm py-8 active:opacity-90"
          >
            <View className="w-10 h-10 rounded-full bg-primary-soft items-center justify-center">
              <Plus size={20} color={tokens.primary} />
            </View>
            <Text className="font-inter-semibold text-text mt-sm">No plans scheduled</Text>
            <Text className="font-inter text-caption text-text-muted text-center px-lg">
              Tap here or use the buttons below to create a date plan.
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}