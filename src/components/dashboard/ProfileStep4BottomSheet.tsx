import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// DateTimePicker will be implemented with a modal-based approach
import { theme } from '../../constants/theme';
import { useOnboarding } from '../../hooks/useOnboarding';
import Toast from 'react-native-toast-message';

interface ProfileStep4BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  dashboardData?: any;
}

const DURATION_OPTIONS = [
  { label: '30 minutes', value: 30 },
  { label: '60 minutes', value: 60 },
  { label: '90 minutes', value: 90 },
];

const ProfileStep4BottomSheet: React.FC<ProfileStep4BottomSheetProps> = ({
  visible,
  onClose,
  onComplete,
  dashboardData,
}) => {
  const insets = useSafeAreaInsets();
  const { completeRendezVous, loading } = useOnboarding();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState(60);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [previousRendezvousDate, setPreviousRendezvousDate] = useState<Date | null>(null);

  // Initialize with existing rendezvous data if available
  useEffect(() => {
    if (visible && dashboardData) {
      // Check if there's existing rendezvous data
      const existingRendezvous = dashboardData?.rendezvous || dashboardData?.rendezVous;
      if (existingRendezvous && existingRendezvous.scheduledAt) {
        const scheduledAt = new Date(existingRendezvous.scheduledAt);
        // Pour un changement de rendez-vous, la date minimale est aujourd'hui + 72h
        const now = new Date();
        const minDate = new Date(now);
        minDate.setDate(now.getDate() + 3); // Ajouter 3 jours (72h)
        minDate.setHours(0, 0, 0, 0);
        
        // Utiliser la date minimale si le rendez-vous existant est dans le passé ou trop proche
        const initialDate = scheduledAt < minDate ? new Date(minDate) : scheduledAt;
        
        setSelectedDate(initialDate);
        setSelectedTime(scheduledAt);
        setDuration(existingRendezvous.duration || 60);
        setSubject(existingRendezvous.subject || '');
        setNotes(existingRendezvous.notes || '');
        setIsRescheduling(true);
        setPreviousRendezvousDate(scheduledAt);
      } else {
        // Nouveau rendez-vous - initialiser avec la date/heure actuelle
        const now = new Date();
        setSelectedDate(now);
        setSelectedTime(now);
        setIsRescheduling(false);
        setPreviousRendezvousDate(null);
      }
    }
  }, [dashboardData, visible]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setErrors({});
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  }, [visible]);

  const updateDate = (field: 'day' | 'month' | 'year', delta: number) => {
    const newDate = new Date(selectedDate);
    
    if (field === 'day') {
      newDate.setDate(selectedDate.getDate() + delta);
    } else if (field === 'month') {
      newDate.setMonth(selectedDate.getMonth() + delta);
    } else if (field === 'year') {
      newDate.setFullYear(selectedDate.getFullYear() + delta);
    }
    
    // Construire la date complète avec l'heure sélectionnée
    const scheduledDateTime = new Date(newDate);
    scheduledDateTime.setHours(selectedTime.getHours());
    scheduledDateTime.setMinutes(selectedTime.getMinutes());
    scheduledDateTime.setSeconds(0);
    scheduledDateTime.setMilliseconds(0);
    
    // Calculer la date minimale : aujourd'hui + 3 jours (pour respecter les 62h)
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(now.getDate() + 3); // Ajouter 3 jours
    minDate.setHours(0, 0, 0, 0); // Commencer à minuit
    
    // Construire la date minimale complète avec l'heure sélectionnée
    const minDateTime = new Date(minDate);
    minDateTime.setHours(selectedTime.getHours());
    minDateTime.setMinutes(selectedTime.getMinutes());
    minDateTime.setSeconds(0);
    minDateTime.setMilliseconds(0);
    
    // Toujours permettre l'incrémentation, mais afficher un avertissement si on est avant la date minimale
    if (isRescheduling && scheduledDateTime < minDateTime) {
      const daysRemaining = Math.ceil((minDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.ceil((minDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60 * 60));
      
      // Afficher un message d'avertissement mais permettre quand même la modification
      Toast.show({
        type: 'warning',
        text1: 'Date minimale requise',
        text2: `Le rendez-vous doit être dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} (${hoursRemaining}h) minimum`,
        visibilityTime: 2500,
      });
      
      // Appliquer quand même la date pour permettre l'incrémentation progressive
      setSelectedDate(newDate);
      return;
    }
    
    // Pour un nouveau rendez-vous, vérifier qu'il est dans le futur
    if (!isRescheduling && scheduledDateTime <= now) {
      Toast.show({
        type: 'info',
        text1: 'Date invalide',
        text2: 'La date et l\'heure doivent être dans le futur',
        visibilityTime: 3000,
      });
      return;
    }
    
    // Si la date est valide, l'appliquer
    setSelectedDate(newDate);
  };

  const updateTime = (field: 'hour' | 'minute', delta: number) => {
    const newTime = new Date(selectedTime);
    
    if (field === 'hour') {
      const newHour = selectedTime.getHours() + delta;
      if (newHour >= 0 && newHour <= 23) {
        newTime.setHours(newHour);
        setSelectedTime(newTime);
      }
    } else if (field === 'minute') {
      const newMinute = selectedTime.getMinutes() + delta;
      if (newMinute >= 0 && newMinute <= 59) {
        newTime.setMinutes(newMinute);
        setSelectedTime(newTime);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mini Calendar Component
  const renderMiniCalendar = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Date minimale : aujourd'hui + 72h (3 jours)
    const minDate = new Date(now);
    minDate.setDate(now.getDate() + 3);
    minDate.setHours(0, 0, 0, 0);
    
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    // Obtenir le premier jour du mois et le nombre de jours
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    // ✅ Corriger l'alignement : convertir getDay() (0=dimanche, 1=lundi...) vers système européen (1=lundi, 7=dimanche)
    // getDay() retourne 0 pour dimanche, 1 pour lundi, etc.
    // On veut : lundi = 1, mardi = 2, ..., dimanche = 7
    const dayOfWeek = firstDay.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    const startDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convertir dimanche de 0 à 7
    
    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const isDateDisabled = (day: number): boolean => {
      const date = new Date(currentYear, currentMonth, day);
      date.setHours(0, 0, 0, 0);
      
      // Désactiver les dates passées
      if (date < now) {
        return true;
      }
      
      // Désactiver les dates dans les 72h (3 jours) après aujourd'hui
      if (date < minDate) {
        return true;
      }
      
      return false;
    };
    
    const isDateSelected = (day: number): boolean => {
      return selectedDate.getDate() === day &&
             selectedDate.getMonth() === currentMonth &&
             selectedDate.getFullYear() === currentYear;
    };
    
    const handleDateSelect = (day: number) => {
      const newDate = new Date(currentYear, currentMonth, day);
      if (!isDateDisabled(day)) {
        setSelectedDate(newDate);
      }
    };
    
    const changeMonth = (delta: number) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(currentMonth + delta);
      // S'assurer que la date minimale est respectée
      if (newDate < minDate) {
        setSelectedDate(new Date(minDate));
      } else {
        setSelectedDate(newDate);
      }
    };
    
    // Créer les jours du calendrier
    const calendarDays: React.ReactNode[] = [];
    
    // Jours vides avant le premier jour du mois
    for (let i = 1; i < startDayOfWeek; i++) {
      calendarDays.push(<View key={`empty-${i}`} style={styles.calendarEmptyDay} />);
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day);
      const selected = isDateSelected(day);
      
      calendarDays.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDayCell,
            selected && styles.calendarDayCellSelected,
            disabled && styles.calendarDayCellDisabled,
          ]}
          onPress={() => handleDateSelect(day)}
          disabled={disabled}
        >
          <Text style={[
            styles.calendarDayText,
            selected && styles.calendarDayTextSelected,
            disabled && styles.calendarDayTextDisabled,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.miniCalendarContainer}>
        {/* Header avec mois et navigation */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.calendarNavButton}
            onPress={() => changeMonth(-1)}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.calendarMonthYear}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity
            style={styles.calendarNavButton}
            onPress={() => changeMonth(1)}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Jours de la semaine */}
        <View style={styles.calendarWeekDays}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.calendarWeekDay}>
              <Text style={styles.calendarWeekDayText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Grille du calendrier */}
        <View style={styles.calendarGrid}>
          {calendarDays}
        </View>
        
        {/* Date sélectionnée */}
        <Text style={styles.calendarSelectedDate}>
          {formatDate(selectedDate)}
        </Text>
      </View>
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) {
      newErrors.subject = 'Le sujet est requis';
    }

    const now = new Date();
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(selectedTime.getHours());
    scheduledDateTime.setMinutes(selectedTime.getMinutes());
    scheduledDateTime.setSeconds(0);
    scheduledDateTime.setMilliseconds(0);

    // Si c'est un changement de RDV, vérifier que la nouvelle date est au moins 3 jours après aujourd'hui (62h)
    if (isRescheduling) {
      const minDate = new Date(now);
      minDate.setDate(now.getDate() + 3); // Ajouter 3 jours
      minDate.setHours(0, 0, 0, 0);
      
      // Construire la date minimale complète avec l'heure sélectionnée
      const minDateTime = new Date(minDate);
      minDateTime.setHours(selectedTime.getHours());
      minDateTime.setMinutes(selectedTime.getMinutes());
      minDateTime.setSeconds(0);
      minDateTime.setMilliseconds(0);
      
      if (scheduledDateTime < minDateTime) {
        const daysRemaining = Math.ceil((minDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.ceil((minDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60 * 60));
        newErrors.date = `Le nouveau rendez-vous doit être dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} minimum (${hoursRemaining}h)`;
      }
    } else {
      // Pour un nouveau rendez-vous, juste vérifier qu'il est dans le futur
      if (scheduledDateTime <= now) {
        newErrors.date = 'La date et l\'heure doivent être dans le futur';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Combine date and time
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(selectedTime.getHours());
      scheduledDateTime.setMinutes(selectedTime.getMinutes());
      scheduledDateTime.setSeconds(0);
      scheduledDateTime.setMilliseconds(0);

      // Si c'est un changement de RDV, utiliser ProfileApi.createRendezvous directement
      // (le backend devrait gérer la mise à jour) et NE PAS marquer comme complété pour éviter les points
      if (isRescheduling) {
        const ProfileApi = require('../../services/profileApi').ProfileApi;
        await ProfileApi.createRendezvous({
          scheduledAt: scheduledDateTime.toISOString(),
          subject: subject.trim(),
          duration,
          notes: notes.trim() || undefined,
        });
        
        Toast.show({
          type: 'success',
          text1: 'Rendez-vous modifié',
          text2: 'Votre rendez-vous a été modifié avec succès',
          visibilityTime: 3000,
        });
        onComplete();
        onClose();
        return;
      }

      // Pour un nouveau rendez-vous, utiliser completeRendezVous qui attribue les points
      const result = await completeRendezVous({
        scheduledAt: scheduledDateTime.toISOString(),
        subject: subject.trim(),
        duration,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        // Ne pas afficher les points si c'est un changement de RDV
        Toast.show({
          type: 'success',
          text1: isRescheduling ? 'Rendez-vous modifié' : 'Étape 4 complétée !',
          text2: isRescheduling ? 'Votre rendez-vous a été modifié avec succès' : '+25 points obtenus',
          visibilityTime: 3000,
        });
        onComplete();
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: result.error || 'Impossible de compléter l\'étape 4',
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Une erreur est survenue',
        visibilityTime: 3000,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={styles.backdrop}
            />
          </TouchableOpacity>
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isRescheduling ? 'Modifier le rendez-vous' : 'Étape 4: Rendez-vous'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.contentContainer}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity
                  style={[styles.dateTimeButton, errors.date && styles.inputError]}
                  onPress={() => setShowDatePicker(!showDatePicker)}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.dateTimeText}>
                    {formatDate(selectedDate)}
                  </Text>
                  <Ionicons 
                    name={showDatePicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
                {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
                
                {/* Mini Calendar Inline */}
                {showDatePicker && (
                  <View style={styles.inlinePickerContainer}>
                    {renderMiniCalendar()}
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Heure *</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(!showTimePicker)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.dateTimeText}>
                    {formatTime(selectedTime)}
                  </Text>
                  <Ionicons 
                    name={showTimePicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
                
                {/* Time Picker Inline */}
                {showTimePicker && (
                  <View style={styles.inlinePickerContainer}>
                    <View style={styles.timeInputContainer}>
                      <View style={styles.timeInputGroup}>
                        <Text style={styles.timeInputLabel}>Heure</Text>
                        <View style={styles.timePickerControls}>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => updateTime('hour', -1)}
                          >
                            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.timePickerValue}>
                            {selectedTime.getHours().toString().padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => updateTime('hour', 1)}
                          >
                            <Ionicons name="chevron-up" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.timeSeparator}>:</Text>
                      <View style={styles.timeInputGroup}>
                        <Text style={styles.timeInputLabel}>Minute</Text>
                        <View style={styles.timePickerControls}>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => updateTime('minute', -1)}
                          >
                            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.timePickerValue}>
                            {selectedTime.getMinutes().toString().padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => updateTime('minute', 1)}
                          >
                            <Ionicons name="chevron-up" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.timePreview}>
                      {formatTime(selectedTime)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Durée *</Text>
                <View style={styles.durationContainer}>
                  {DURATION_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.durationOption,
                        duration === option.value && styles.durationOptionSelected
                      ]}
                      onPress={() => setDuration(option.value)}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        duration === option.value && styles.durationOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Sujet *</Text>
                <TextInput
                  style={[styles.input, errors.subject && styles.inputError]}
                  placeholder="Ex: Suivi de progression et ajustements"
                  value={subject}
                  onChangeText={(text) => {
                    setSubject(text);
                    if (errors.subject) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.subject;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Notes (optionnel)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ajoutez des notes ou questions pour votre coach"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.completeButton, loading && styles.completeButtonDisabled]}
                onPress={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.completeButtonText}>
                      {isRescheduling ? 'Modifier' : 'Compléter'}
                    </Text>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '85%',
    paddingTop: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateTimeText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  durationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  durationOptionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  durationOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: 12,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  pickerScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  datePickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  datePickerControls: {
    alignItems: 'center',
    gap: 8,
  },
  datePickerButton: {
    padding: 8,
  },
  datePickerValue: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    minWidth: 50,
    textAlign: 'center',
  },
  datePreview: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 20,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  timePickerControls: {
    alignItems: 'center',
    gap: 8,
  },
  timePickerButton: {
    padding: 8,
  },
  timePickerValue: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    minWidth: 50,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 32,
  },
  timePreview: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 16,
  },
  pickerModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  pickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  pickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inlinePickerContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  miniCalendarContainer: {
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthYear: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    marginBottom: 8,
    width: '100%', // ✅ S'assurer que la ligne prend toute la largeur
  },
  calendarWeekDay: {
    width: '14.28%', // ✅ 100% / 7 jours = 14.28% pour correspondre exactement aux cellules
    alignItems: 'center',
    paddingVertical: 8,
    margin: 0, // ✅ Pas de margin pour un alignement parfait
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    width: '100%', // ✅ S'assurer que la grille prend toute la largeur
  },
  calendarEmptyDay: {
    width: '14.28%', // ✅ 100% / 7 jours = 14.28%
    aspectRatio: 1,
    margin: 0, // ✅ Pas de margin pour un alignement parfait
  },
  calendarDayCell: {
    width: '14.28%', // ✅ 100% / 7 jours = 14.28%
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 0, // ✅ Pas de margin pour un alignement parfait
  },
  calendarDayCellSelected: {
    backgroundColor: theme.colors.primary,
  },
  calendarDayCellDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.5,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: '#BDBDBD',
  },
  calendarSelectedDate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});

export default ProfileStep4BottomSheet;

