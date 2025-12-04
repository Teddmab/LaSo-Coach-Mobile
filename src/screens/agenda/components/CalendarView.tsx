import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { MONTHS, WEEK_DAYS } from '../utils/agendaUtils';

const { width } = Dimensions.get('window');

interface CalendarViewProps {
  year: number;
  month: number;
  selectedDate: number;
  onYearChange: (year: number) => void;
  onDateSelect: (date: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  year,
  month,
  selectedDate,
  onYearChange,
  onDateSelect,
}) => {
  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number): number => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    return firstDay === 0 ? 7 : firstDay; // Convert Sunday (0) to 7
  };

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const days: React.ReactNode[] = [];

  // Add empty cells for days before the first day of month
  for (let i = 1; i < firstDay; i++) {
    days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === selectedDate;
    const isWeekend = (firstDay + day - 2) % 7 >= 5;
    
    days.push(
      <TouchableOpacity
        key={day}
        style={[
          styles.calendarDay,
          isToday && styles.todayDay,
          isWeekend && styles.weekendDay,
        ]}
        onPress={() => onDateSelect(day)}
      >
        <Text style={[
          styles.dayText,
          isToday && styles.todayText,
          isWeekend && styles.weekendText,
        ]}>
          {day}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Year Header */}
      <View style={styles.yearHeader}>
        <TouchableOpacity onPress={() => onYearChange(year - 1)}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.yearText}>{year}</Text>
        <TouchableOpacity onPress={() => onYearChange(year + 1)}>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Month Calendar */}
      <View style={styles.calendarContainer}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>{MONTHS[month - 1]}</Text>
          <Text style={styles.monthYear}>{year}</Text>
        </View>

        <View style={styles.weekDaysHeader}>
          {WEEK_DAYS.map((day, index) => (
            <Text key={index} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  yearText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginHorizontal: 40,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  monthYear: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    width: (width - 80) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: (width - 80) / 7,
    height: 40,
  },
  calendarDay: {
    width: (width - 80) / 7,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  todayDay: {
    backgroundColor: '#000000',
    borderRadius: 20,
  },
  weekendDay: {
    // Weekend styling if needed
  },
  dayText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  weekendText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default CalendarView;

