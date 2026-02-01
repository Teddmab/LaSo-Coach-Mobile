import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { theme } from '../constants/theme';
import { AgendaScreenProps, ProgramSession } from './agenda/types';
import { useAgenda } from './agenda/hooks/useAgenda';
import RendezvousCard from './agenda/components/RendezvousCard';
import RendezvousForm from './agenda/components/RendezvousForm';
import CalendarView from './agenda/components/CalendarView';
import ProgramSessionCard from './agenda/components/ProgramSessionCard';

const AgendaScreen: React.FC<AgendaScreenProps> = ({
  user,
  onTabPress,
  activeTab,
}) => {
  // Utiliser la date actuelle au lieu d'une date hardcodée
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // getMonth() retourne 0-11
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());

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

  // Mock program sessions - will be replaced with real data
  const programSessions: ProgramSession[] = [
    {
      id: 1,
      title: 'Nouvelle séance So\'Matin',
      date: '13.07.2025',
      time: '03:00',
      day: 'dim.',
      points: 2000,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
      canDelete: true,
    },
    {
      id: 2,
      title: 'Nouvelle séance So\'Matin',
      date: '13.07.2025',
      time: '03:00',
      day: 'dim.',
      points: 2500,
      image: null,
      canDelete: true,
    },
  ];

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
        />

        {/* Program Sessions */}
        <View style={styles.programSection}>
          <Text style={styles.programSectionTitle}>Au programme</Text>
          <Text style={styles.programDate}>13 juillet 2025</Text>
          
          {programSessions.map(session => (
            <ProgramSessionCard key={session.id} session={session} />
          ))}
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
});

export default AgendaScreen;

