import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { format, startOfWeek, addDays, isSameDay, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';

interface CalendarGridProps {
  month: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  markedDates: Date[];
  memoryDates?: Date[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Calendar grid component with month navigation and date selection.
 */
export function CalendarGrid({
  month,
  selectedDate,
  onDateSelect,
  markedDates,
  memoryDates = [],
  onPreviousMonth,
  onNextMonth,
}: CalendarGridProps) {
  const { tokens } = useTheme();

  // Generate days for the month
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfMonth(monthEnd);

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Check if a date has calendar items
  const hasMarkedDate = (date: Date) => {
    return markedDates.some(markedDate => isSameDay(markedDate, date));
  };

  // Check if a date has memories
  const hasMemoryDate = (date: Date) => {
    return memoryDates.some(memoryDate => isSameDay(memoryDate, date));
  };

  return (
    <View className="bg-surface rounded-card p-base shadow-e1 border border-border">
      {/* Month navigation */}
      <View className="flex-row items-center justify-between mb-base">
        <Text className="font-inter-semibold text-h3 text-text">
          {format(month, 'MMMM yyyy')}
        </Text>
        <View className="flex-row gap-sm">
          <Pressable
            onPress={onPreviousMonth}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-alt active:scale-95 transition-all"
          >
            <Text className="text-text font-inter-semibold">←</Text>
          </Pressable>
          <Pressable
            onPress={onNextMonth}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-alt active:scale-95 transition-all"
          >
            <Text className="text-text font-inter-semibold">→</Text>
          </Pressable>
        </View>
      </View>

      {/* Days of week headers */}
      <View className="flex-row mb-sm">
        {DAYS_OF_WEEK.map((day, index) => (
          <View key={`${day}-${index}`} className="w-[14.28%] items-center justify-center">
            <Text className="font-inter text-caption text-text-subtle text-center">
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, month);
          const isSelected = isSameDay(day, selectedDate);
          const isMarked = hasMarkedDate(day);
          const hasMemory = hasMemoryDate(day);

          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onDateSelect(day)}
              className="w-[14.28%] h-12 items-center justify-center"
              disabled={!isCurrentMonth}
            >
              <View
                className={`w-9 h-9 items-center justify-center rounded-full ${
                  isSelected ? 'bg-primary' : hasMemory ? 'bg-primary-soft' : ''
                }`}
              >
                <Text
                  className={`font-inter ${
                    isSelected
                      ? 'font-inter-semibold text-white'
                      : hasMemory
                      ? 'font-inter-semibold text-primary'
                      : 'font-inter text-text'
                  } ${
                    isCurrentMonth ? '' : 'opacity-30'
                  }`}
                >
                  {format(day, 'd')}
                </Text>
                {isMarked && (
                  <View
                    className={`absolute bottom-1 w-1 h-1 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-primary'
                    }`}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}