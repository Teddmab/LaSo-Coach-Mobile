import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { MONTHS, WEEK_DAYS } from '../utils/agendaUtils';

// Même principe que le calendrier prise de rendez-vous (ProfileStep4) : 14.28% = 100/7 pour alignement parfait
const CELL_WIDTH_PCT = '14.28%';

interface CalendarViewProps {
  year: number;
  month: number;
  selectedDate: number;
  onYearChange: (year: number) => void;
  onDateSelect: (date: number) => void;
  agendaItems?: any[]; // ✅ NOUVEAU: Items d'agenda pour marquer les dates avec programme
}

const CalendarView: React.FC<CalendarViewProps> = ({
  year,
  month,
  selectedDate,
  onYearChange,
  onDateSelect,
  agendaItems = [],
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

  // Add empty cells for days before the first day of month (firstDay 1 = Lundi, 7 = Dimanche)
  for (let i = 1; i < firstDay; i++) {
    days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
  }

  // ✅ Fonction pour vérifier si une date a un programme assigné
  const hasProgramForDate = (day: number): boolean => {
    if (!agendaItems || agendaItems.length === 0) return false;
    
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return agendaItems.some(item => {
      if (!item.assignedDate) return false;
      const itemDate = new Date(item.assignedDate);
      const itemDateStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
      return itemDateStr === dateStr;
    });
  };

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === selectedDate;
    const isWeekend = (firstDay + day - 2) % 7 >= 5;
    const hasProgram = hasProgramForDate(day);
    
    days.push(
      <TouchableOpacity
        key={day}
        style={[
          styles.calendarDay,
          isToday && styles.todayDay,
          isWeekend && styles.weekendDay,
          hasProgram && !isToday && styles.programDay,
        ]}
        onPress={() => onDateSelect(day)}
      >
        <Text style={[
          styles.dayText,
          isToday && styles.todayText,
          isWeekend && styles.weekendText,
          hasProgram && !isToday && styles.programText,
        ]}>
          {day}
        </Text>
        {hasProgram && !isToday && (
          <View style={styles.programDot} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
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
            <View key={index} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days}
        </View>
      </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignItems: 'center',
  },
  calendarWrapper: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    width: '100%',
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
    width: '100%',
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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%',
  },
  weekDayCell: {
    width: CELL_WIDTH_PCT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    margin: 0,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    margin: 0,
  },
  emptyDay: {
    width: CELL_WIDTH_PCT,
    height: 40,
    margin: 0,
  },
  calendarDay: {
    width: CELL_WIDTH_PCT,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
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
  // ✅ NOUVEAU: Styles pour les dates avec programme assigné
  programDay: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    position: 'relative',
  },
  programText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  programDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
  },
});

export default CalendarView;

