import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Avatar from '../components/Avatar';

const { width } = Dimensions.get('window');

const AgendaScreen = ({ user, onLogout, onTabPress, activeTab, onClose }) => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(7); // July = 7
  const [selectedDate, setSelectedDate] = useState(18);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const programSessions = [
    {
      id: 1,
      title: 'Nouvelle séance So\'Matin',
      date: '13.07.2025',
      time: '03:00',
      day: 'dim.',
      points: 2000,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
      canDelete: true
    },
    {
      id: 2,
      title: 'Nouvelle séance So\'Matin',
      date: '13.07.2025', 
      time: '03:00',
      day: 'dim.',
      points: 2500,
      image: null, // Placeholder for video
      canDelete: true
    }
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    return firstDay === 0 ? 7 : firstDay; // Convert Sunday (0) to 7
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

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
            isWeekend && styles.weekendDay
          ]}
          onPress={() => setSelectedDate(day)}
        >
          <Text style={[
            styles.dayText,
            isToday && styles.todayText,
            isWeekend && styles.weekendText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderProgramSession = (session) => (
    <View key={session.id} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>+{session.points}pts</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton}>
          <Ionicons name="close" size={16} color="#FFFFFF" />
          <Text style={styles.deleteText}>Effacer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sessionContent}>
        {session.image ? (
          <Image source={{ uri: session.image }} style={styles.sessionImage} />
        ) : (
          <View style={styles.videoPlaceholder}>
            <View style={styles.playIcon}>
              <View style={styles.playButton} />
              <View style={styles.playButton} />
              <View style={styles.playButton} />
            </View>
          </View>
        )}
        
        <Text style={styles.programTitle}>LE PROGRAMME LASO'COACH ?</Text>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.sessionTime}>
          <Ionicons name="time-outline" size={16} color="#4A5568" />
          <Text style={styles.timeText}>{session.time}</Text>
          <Ionicons name="calendar-outline" size={16} color="#4A5568" style={styles.calendarIcon} />
          <Text style={styles.dateText}>{session.day} {session.date}</Text>
        </View>
        <Text style={styles.sessionTitle}>{session.title}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>5</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => onTabPress ? onTabPress('settings') : null}>
            <Avatar 
              source={{ uri: user?.avatar }} 
              size={40}
              style={styles.profileImage}
              fallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Program Week Info */}
        <View style={styles.programInfo}>
          <Text style={styles.programWeek}>Semaine actuelle du programme : Semaine 4</Text>
        </View>

        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setSelectedYear(selectedYear - 1)}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <Text style={styles.yearText}>{selectedYear}</Text>
          
          <TouchableOpacity onPress={() => setSelectedYear(selectedYear + 1)}>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* July Calendar */}
        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>Juillet</Text>
            <Text style={styles.monthYear}>2025</Text>
          </View>

          <View style={styles.weekDaysHeader}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {renderCalendar()}
          </View>
        </View>

        {/* August Calendar */}
        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>Août</Text>
          </View>

          <View style={styles.weekDaysHeader}>
            {weekDays.map((day, index) => (
              <Text key={index} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {/* August calendar days - simplified for demo */}
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const isWeekend = (i + 6) % 7 >= 5; // Approximate weekend calculation
              
              return (
                <TouchableOpacity key={day} style={[styles.calendarDay, isWeekend && styles.weekendDay]}>
                  <Text style={[styles.dayText, isWeekend && styles.weekendText]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* September Preview */}
        <View style={styles.monthPreview}>
          <Text style={styles.previewTitle}>Septembre</Text>
        </View>

        {/* Program Sessions */}
        <View style={styles.programSection}>
          <Text style={styles.programSectionTitle}>Au programme</Text>
          <Text style={styles.programDate}>13 juillet 2025</Text>
          
          {programSessions.map(session => renderProgramSession(session))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
          <Ionicons name="home" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('progress')}>
          <Ionicons name="trending-up-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
          <Ionicons name="restaurant" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpButton: {
    padding: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  programInfo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  programWeek: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  calendarHeader: {
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
  calendarDay: {
    width: (width - 80) / 7,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  emptyDay: {
    width: (width - 80) / 7,
    height: 40,
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
  monthPreview: {
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
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  programSection: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
  },
  programSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  programDate: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  pointsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  sessionContent: {
    position: 'relative',
    alignItems: 'center',
    padding: 16,
  },
  sessionImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  playIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  sessionDetails: {
    backgroundColor: '#C8E6C9',
    padding: 16,
  },
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 4,
    marginRight: 16,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 4,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
});

export default AgendaScreen; 