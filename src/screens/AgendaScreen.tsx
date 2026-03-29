import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, ActivityIndicator, Platform } from 'react-native';
import { theme } from '../constants/theme';
import { AgendaScreenProps, ProgramSession } from './agenda/types';
import { useAgenda } from './agenda/hooks/useAgenda';
import RendezvousCard from './agenda/components/RendezvousCard';
import RendezvousForm from './agenda/components/RendezvousForm';
import CalendarView from './agenda/components/CalendarView';
import ProgramSessionCard from './agenda/components/ProgramSessionCard';
import { AgendaApi } from '../services/agendaApi';

const AgendaScreen: React.FC<AgendaScreenProps> = ({
  user,
  onTabPress,
  activeTab,
}) => {
  // ✅ Use current date instead of hardcoded date
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // getMonth() returns 0-11
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  
  // ✅ NEW: State for program sessions from API
  const [programSessions, setProgramSessions] = useState<any[]>([]);
  const [programSessionsLoading, setProgramSessionsLoading] = useState<boolean>(true);
  const [agendaItems, setAgendaItems] = useState<any[]>([]);

  const {
    rendezvousLoading,
    rendezvousData,
    showRendezvousForm,
    submitting,
    profileData,
    formData,
    setFormData,
    setShowRendezvousForm,
    handleSubmitRendezvous,
    handleReschedule,
  } = useAgenda();

  const handleOpenMeetingLink = async (link: string): Promise<void> => {
    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      }
    } catch (error) {
    }
  };

  // ✅ NEW: Fetch agenda/program sessions from API
  useEffect(() => {
    const fetchAgenda = async () => {
      try {
        setProgramSessionsLoading(true);
        const items = await AgendaApi.getAgenda();
        setAgendaItems(items);
        console.log('✅ [AgendaScreen] Fetched agenda items:', items.length);
      } catch (error) {
        console.error('❌ [AgendaScreen] Error fetching agenda:', error);
        setAgendaItems([]);
      } finally {
        setProgramSessionsLoading(false);
      }
    };

    fetchAgenda();
  }, []);

  // ✅ NEW: Filter sessions for selected date
  useEffect(() => {
    // Create the selected date string in YYYY-MM-DD format
    const selectedDateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    
    // Filter agenda items for the selected date
    const filteredSessions = agendaItems.filter(item => {
      if (!item.assignedDate) return false;
      
      const itemDate = new Date(item.assignedDate);
      const itemDateStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
      
      return itemDateStr === selectedDateStr;
    });

    // Transform to ProgramSession format
    const sessions = filteredSessions.map(item => ({
      id: item.id,
      title: item.title || 'Session',
      date: new Date(item.assignedDate).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      time: new Date(item.assignedDate).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      day: new Date(item.assignedDate).toLocaleDateString('fr-FR', { weekday: 'short' }),
      points: item.points || 0,
      image: item.thumbnailUrl || null,
      canDelete: !item.completed,
      completed: item.completed || false,
      type: item.type || 'content',
    }));

    setProgramSessions(sessions);

    console.log('📅 [AgendaScreen] Sessions for selected date:', {
      selectedDate: selectedDateStr,
      totalItems: agendaItems.length,
      filteredCount: sessions.length,
    });
  }, [selectedDate, selectedMonth, selectedYear, agendaItems]);

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
        {/* Rendezvous Card or Form */}
        {showRendezvousForm ? (
          <RendezvousForm
            formData={formData}
            submitting={submitting}
            onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
            onSubmit={handleSubmitRendezvous}
            onCancel={() => setShowRendezvousForm(false)}
          />
        ) : (
          <RendezvousCard
            rendezvousData={rendezvousData}
            loading={rendezvousLoading}
            showForm={showRendezvousForm}
            onReschedule={handleReschedule}
            onOpenMeetingLink={handleOpenMeetingLink}
          />
        )}

        {/* Program Week Info */}
        <View style={styles.programInfo}>
          <Text style={styles.programWeek}>Semaine actuelle du programme : Semaine 4</Text>
        </View>

        {/* Calendar */}
        <CalendarView
          year={selectedYear}
          month={selectedMonth}
          selectedDate={selectedDate}
          onYearChange={setSelectedYear}
          onDateSelect={setSelectedDate}
          agendaItems={agendaItems} // ✅ Passer les items d'agenda pour marquer les dates avec programme
        />

        {/* Program Sessions */}
        <View style={styles.programSection}>
          <Text style={styles.programSectionTitle}>Au programme</Text>
          <Text style={styles.programDate}>
            {new Date(selectedYear, selectedMonth - 1, selectedDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
          
          {programSessionsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Chargement des sessions...</Text>
            </View>
          ) : programSessions.length > 0 ? (
            programSessions.map(session => (
              <ProgramSessionCard key={session.id} session={session} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune session programmée pour cette date</Text>
            </View>
          )}
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 98 : 20,
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
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AgendaScreen;

