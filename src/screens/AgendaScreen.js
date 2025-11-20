import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { theme } from '../constants/theme';
import Avatar from '../components/Avatar';
import AppHeader from '../components/AppHeader';
import { ProfileApi } from '../services/profileApi';

const { width } = Dimensions.get('window');

const AgendaScreen = ({ user, onLogout, onTabPress, activeTab, onClose }) => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(7); // July = 7
  const [selectedDate, setSelectedDate] = useState(18);
  
  // Rendezvous state
  const [rendezvousLoading, setRendezvousLoading] = useState(true);
  const [rendezvousData, setRendezvousData] = useState(null);
  const [showRendezvousForm, setShowRendezvousForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    scheduledAt: '',
    subject: 'Session de lancement',
    duration: 60,
    notes: '',
  });

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Fetch profile data for avatar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await ProfileApi.getProfile();
        setProfileData(data);
        console.log('[AgendaScreen] 📊 Profile data fetched:', data);
      } catch (error) {
        console.error('[AgendaScreen] ❌ Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  // Fetch rendezvous on mount
  useEffect(() => {
    fetchRendezvous();
  }, []);

  const fetchRendezvous = useCallback(async () => {
    try {
      setRendezvousLoading(true);
      const data = await ProfileApi.getCurrentRendezvous();
      setRendezvousData(data);
      setShowRendezvousForm(!data);
    } catch (error) {
      console.log('No existing rendezvous found');
      setRendezvousData(null);
      setShowRendezvousForm(true);
    } finally {
      setRendezvousLoading(false);
    }
  }, []);

  // Status metadata
  const getStatusMeta = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          badge: 'En attente du coach',
          badgeColor: '#9E9E9E',
          bgColor: 'rgba(158,158,158,0.1)',
          icon: 'time-outline',
          message: 'Votre coach examine votre demande. Préparez vos questions.',
        };
      case 'ASSIGNED':
        return {
          badge: 'Coach assigné',
          badgeColor: '#FF9800',
          bgColor: 'rgba(255,152,0,0.1)',
          icon: 'checkmark-circle-outline',
          message: 'Votre coach est réservé. Préparez vos questions.',
        };
      case 'CONFIRMED':
        return {
          badge: 'Confirmé',
          badgeColor: theme.colors.success,
          bgColor: 'rgba(76,175,80,0.1)',
          icon: 'checkmark-circle',
          message: 'Votre session est confirmée. Ajoutez un rappel à votre calendrier.',
        };
      default:
        return {
          badge: 'Non programmé',
          badgeColor: '#757575',
          bgColor: '#F5F5F5',
          icon: 'calendar-outline',
          message: 'Planifiez votre premier rendez-vous pour commencer votre coaching.',
        };
    }
  };

  const formatDateLabel = (date) => {
    if (!date) return '';
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatTimeLabel = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysUntil = (targetDate) => {
    if (!targetDate) return '';
    const now = new Date();
    const diff = targetDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `Passé depuis ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`;
    if (days === 0) return "C'est aujourd'hui !";
    if (days === 1) return 'Dans 1 jour';
    return `${days} jours restants`;
  };

  const getMeetingProviderLabel = (provider) => {
    const labels = {
      GOOGLE_MEET: 'Google Meet',
      ZOOM: 'Zoom',
      TEAMS: 'Microsoft Teams',
      PHONE: 'Appel téléphonique',
    };
    return labels[provider] || provider;
  };

  const handleSubmitRendezvous = async () => {
    if (!formData.scheduledAt) {
      Toast.show({
        type: 'error',
        text1: 'Date requise',
        text2: 'Veuillez sélectionner une date et heure',
      });
      return;
    }

    const selectedDate = new Date(formData.scheduledAt);
    const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (selectedDate < minDate) {
      Toast.show({
        type: 'error',
        text1: 'Date invalide',
        text2: 'Le rendez-vous doit être prévu au moins 24h à l\'avance',
      });
      return;
    }

    if (!formData.subject || formData.subject.length > 500) {
      Toast.show({
        type: 'error',
        text1: 'Sujet requis',
        text2: 'Le sujet est obligatoire (max 500 caractères)',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        subject: formData.subject,
        duration: parseInt(formData.duration),
        notes: formData.notes,
      };

      await ProfileApi.createRendezvous(payload);
      await ProfileApi.updateProgress({
        step: 'rendezvous',
        completed: true,
      });

      Toast.show({
        type: 'success',
        text1: 'Rendez-vous enregistré',
        text2: 'Votre demande a été envoyée avec succès',
      });

      await fetchRendezvous();
      setShowRendezvousForm(false);
    } catch (error) {
      console.error('Error creating rendezvous:', error);
      
      if (error.response?.status === 409) {
        Toast.show({
          type: 'error',
          text1: 'Créneau indisponible',
          text2: 'Ce créneau n\'est plus disponible.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de créer le rendez-vous.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = () => {
    if (rendezvousData?.status === 'CONFIRMED') {
      Toast.show({
        type: 'info',
        text1: 'Rendez-vous confirmé',
        text2: 'Contactez le support pour modifier',
      });
      return;
    }

    setFormData({
      scheduledAt: rendezvousData?.scheduledAt || '',
      subject: rendezvousData?.subject || 'Session de lancement',
      duration: rendezvousData?.duration || 60,
      notes: rendezvousData?.notes || '',
    });
    setShowRendezvousForm(true);
  };

  const handleOpenMeetingLink = async () => {
    if (!rendezvousData?.meetingLink) return;
    
    try {
      const supported = await Linking.canOpenURL(rendezvousData.meetingLink);
      if (supported) {
        await Linking.openURL(rendezvousData.meetingLink);
      }
    } catch (error) {
      console.error('Error opening meeting link:', error);
    }
  };

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

  const renderRendezvousCard = () => {
    if (rendezvousLoading) {
      return (
        <View style={styles.rendezvousCard}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      );
    }

    if (showRendezvousForm) {
      return (
        <View style={styles.rendezvousCard}>
          <Text style={styles.rendezvousTitle}>Planifier un rendez-vous coach</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date et heure *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="2025-11-20T10:30"
              value={formData.scheduledAt}
              onChangeText={(val) => setFormData({ ...formData, scheduledAt: val })}
            />
            <Text style={styles.formHint}>Format: AAAA-MM-JJTHH:MM</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Sujet *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Session de lancement"
              value={formData.subject}
              onChangeText={(val) => setFormData({ ...formData, subject: val })}
              maxLength={500}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Durée</Text>
            <View style={styles.durationPicker}>
              {[30, 60, 90].map((dur) => (
                <TouchableOpacity
                  key={dur}
                  style={[
                    styles.durationOption,
                    formData.duration === dur && styles.durationOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, duration: dur })}
                >
                  <Text
                    style={[
                      styles.durationOptionText,
                      formData.duration === dur && styles.durationOptionTextActive,
                    ]}
                  >
                    {dur} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes (optionnel)</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea]}
              placeholder="Ajoutez des notes..."
              value={formData.notes}
              onChangeText={(val) => setFormData({ ...formData, notes: val })}
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitRendezvous}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Confirmer</Text>
              </>
            )}
          </TouchableOpacity>

          {rendezvousData && (
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowRendezvousForm(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (rendezvousData) {
      const status = rendezvousData.status;
      const meta = getStatusMeta(status);
      const rendezvousDate = rendezvousData.scheduledAt ? new Date(rendezvousData.scheduledAt) : null;

      return (
        <View style={styles.rendezvousCard}>
          <View style={styles.rendezvousHeader}>
            <Text style={styles.rendezvousTitle}>Rendez-vous Coach</Text>
            <View style={[styles.statusBadge, { backgroundColor: meta.badgeColor }]}>
              <Text style={styles.statusBadgeText}>{meta.badge}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sujet</Text>
            <Text style={styles.detailValue}>{rendezvousData.subject}</Text>
          </View>

          {rendezvousDate && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDateLabel(rendezvousDate)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Heure</Text>
                <Text style={styles.detailValue}>{formatTimeLabel(rendezvousDate)}</Text>
              </View>
              <View style={styles.countdownBox}>
                <Text style={styles.countdownText}>{getDaysUntil(rendezvousDate)}</Text>
              </View>
            </>
          )}

          {rendezvousData.assignedCoach && (
            <View style={styles.coachCard}>
              <Avatar
                source={{ uri: rendezvousData.assignedCoach.avatar }}
                size={48}
                fallbackText={rendezvousData.assignedCoach.name?.charAt(0)}
              />
              <View style={styles.coachInfo}>
                <Text style={styles.coachName}>{rendezvousData.assignedCoach.name}</Text>
                <Text style={styles.coachEmail}>{rendezvousData.assignedCoach.email}</Text>
              </View>
            </View>
          )}

          {rendezvousData.meetingLink && (
            <View style={styles.meetingSection}>
              <Text style={styles.meetingLabel}>Lien de réunion</Text>
              <TouchableOpacity style={styles.meetingLinkButton} onPress={handleOpenMeetingLink}>
                <Text style={styles.meetingLinkText} numberOfLines={1}>
                  {rendezvousData.meetingLink}
                </Text>
                <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              {rendezvousData.meetingProvider && (
                <View style={styles.providerBadge}>
                  <Text style={styles.providerBadgeText}>
                    {getMeetingProviderLabel(rendezvousData.meetingProvider)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {status !== 'CONFIRMED' && (
            <TouchableOpacity style={styles.rescheduleButton} onPress={handleReschedule}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.rescheduleButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

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
      <AppHeader
        title="Agenda"
        onHelpPress={() => {
          if (onTabPress) {
            onTabPress('faq');
          }
        }}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={profileData?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Rendezvous Card */}
        {renderRendezvousCard()}

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
  // Rendezvous styles
  rendezvousCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rendezvousHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rendezvousTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  countdownBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  coachInfo: {
    marginLeft: 12,
    flex: 1,
  },
  coachName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  coachEmail: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  meetingSection: {
    marginTop: 16,
  },
  meetingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  meetingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: 12,
  },
  meetingLinkText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.primary,
    marginRight: 8,
  },
  providerBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  providerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2196F3',
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
  },
  rescheduleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: '#FAFAFA',
  },
  formTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 6,
  },
  durationPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationOption: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
  },
  durationOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  durationOptionTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 14,
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});

export default AgendaScreen; 