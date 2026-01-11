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
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [duration, setDuration] = useState(60);
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize with existing rendezvous data if available
  useEffect(() => {
    if (visible && dashboardData) {
      // Check if there's existing rendezvous data
      const existingRendezvous = dashboardData?.rendezvous || dashboardData?.rendezVous;
      if (existingRendezvous) {
        const scheduledAt = new Date(existingRendezvous.scheduledAt);
        setSelectedDate(scheduledAt);
        setSelectedTime(scheduledAt);
        setDuration(existingRendezvous.duration || 60);
        setSubject(existingRendezvous.subject || '');
        setNotes(existingRendezvous.notes || '');
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

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setTempDate(date);
  };

  const handleTimeChange = (time: Date) => {
    setSelectedTime(time);
    setTempTime(time);
  };

  const confirmDate = () => {
    setSelectedDate(tempDate);
    setShowDatePicker(false);
  };

  const confirmTime = () => {
    setSelectedTime(tempTime);
    setShowTimePicker(false);
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

    if (scheduledDateTime <= now) {
      newErrors.date = 'La date et l\'heure doivent être dans le futur';
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

      const result = await completeRendezVous({
        scheduledAt: scheduledDateTime.toISOString(),
        subject: subject.trim(),
        duration,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Étape 4 complétée !',
          text2: '+25 points obtenus',
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
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Étape 4: Rendez-vous</Text>
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
                  onPress={() => {
                    setTempDate(selectedDate);
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.dateTimeText}>
                    {formatDate(selectedDate)}
                  </Text>
                </TouchableOpacity>
                {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Heure *</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => {
                    setTempTime(selectedTime);
                    setShowTimePicker(true);
                  }}
                >
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.dateTimeText}>
                    {formatTime(selectedTime)}
                  </Text>
                </TouchableOpacity>
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

            {/* Date Picker Modal */}
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <Text style={styles.pickerModalTitle}>Sélectionner la date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerScrollView}>
                    <View style={styles.datePickerRow}>
                      <View style={styles.datePickerColumn}>
                        <Text style={styles.dateInputLabel}>Jour</Text>
                        <View style={styles.datePickerControls}>
                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => {
                              const newDate = new Date(tempDate);
                              newDate.setDate(tempDate.getDate() - 1);
                              if (newDate >= new Date()) {
                                setTempDate(newDate);
                              }
                            }}
                          >
                            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.datePickerValue}>
                            {tempDate.getDate().toString().padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => {
                              const newDate = new Date(tempDate);
                              newDate.setDate(tempDate.getDate() + 1);
                              setTempDate(newDate);
                            }}
                          >
                            <Ionicons name="chevron-up" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.datePickerColumn}>
                        <Text style={styles.dateInputLabel}>Mois</Text>
                        <View style={styles.datePickerControls}>
                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => {
                              const newDate = new Date(tempDate);
                              newDate.setMonth(tempDate.getMonth() - 1);
                              if (newDate >= new Date()) {
                                setTempDate(newDate);
                              }
                            }}
                          >
                            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.datePickerValue}>
                            {(tempDate.getMonth() + 1).toString().padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => {
                              const newDate = new Date(tempDate);
                              newDate.setMonth(tempDate.getMonth() + 1);
                              setTempDate(newDate);
                            }}
                          >
                            <Ionicons name="chevron-up" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.datePickerColumn}>
                        <Text style={styles.dateInputLabel}>Année</Text>
                        <View style={styles.datePickerControls}>
                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => {
                              const newDate = new Date(tempDate);
                              newDate.setFullYear(tempDate.getFullYear() - 1);
                              if (newDate >= new Date()) {
                                setTempDate(newDate);
                              }
                            }}
                          >
                            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.datePickerValue}>
                            {tempDate.getFullYear()}
                          </Text>
                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => {
                              const newDate = new Date(tempDate);
                              newDate.setFullYear(tempDate.getFullYear() + 1);
                              setTempDate(newDate);
                            }}
                          >
                            <Ionicons name="chevron-up" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.datePreview}>
                      {formatDate(tempDate)}
                    </Text>
                  </ScrollView>
                  <View style={styles.pickerModalFooter}>
                    <TouchableOpacity
                      style={styles.pickerCancelButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.pickerCancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pickerConfirmButton}
                      onPress={confirmDate}
                    >
                      <Text style={styles.pickerConfirmText}>Confirmer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Time Picker Modal */}
            <Modal
              visible={showTimePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowTimePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <Text style={styles.pickerModalTitle}>Sélectionner l'heure</Text>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.pickerScrollView}>
                    <View style={styles.timeInputContainer}>
                      <View style={styles.timeInputGroup}>
                        <Text style={styles.timeInputLabel}>Heure</Text>
                        <View style={styles.timePickerControls}>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const newTime = new Date(tempTime);
                              const newHour = tempTime.getHours() === 0 ? 23 : tempTime.getHours() - 1;
                              newTime.setHours(newHour);
                              setTempTime(newTime);
                            }}
                          >
                            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.timePickerValue}>
                            {tempTime.getHours().toString().padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const newTime = new Date(tempTime);
                              const newHour = tempTime.getHours() === 23 ? 0 : tempTime.getHours() + 1;
                              newTime.setHours(newHour);
                              setTempTime(newTime);
                            }}
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
                            onPress={() => {
                              const newTime = new Date(tempTime);
                              const newMinute = tempTime.getMinutes() === 0 ? 59 : tempTime.getMinutes() - 1;
                              newTime.setMinutes(newMinute);
                              setTempTime(newTime);
                            }}
                          >
                            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.timePickerValue}>
                            {tempTime.getMinutes().toString().padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const newTime = new Date(tempTime);
                              const newMinute = tempTime.getMinutes() === 59 ? 0 : tempTime.getMinutes() + 1;
                              newTime.setMinutes(newMinute);
                              setTempTime(newTime);
                            }}
                          >
                            <Ionicons name="chevron-up" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.timePreview}>
                      {formatTime(tempTime)}
                    </Text>
                  </ScrollView>
                  <View style={styles.pickerModalFooter}>
                    <TouchableOpacity
                      style={styles.pickerCancelButton}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.pickerCancelText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pickerConfirmButton}
                      onPress={confirmTime}
                    >
                      <Text style={styles.pickerConfirmText}>Confirmer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

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
                    <Text style={styles.completeButtonText}>Compléter</Text>
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
});

export default ProfileStep4BottomSheet;

