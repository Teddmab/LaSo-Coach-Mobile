import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { RendezvousFormData } from '../types';

interface RendezvousFormProps {
  formData: RendezvousFormData;
  submitting: boolean;
  onFormDataChange: (data: Partial<RendezvousFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const RendezvousForm: React.FC<RendezvousFormProps> = ({
  formData,
  submitting,
  onFormDataChange,
  onSubmit,
  onCancel,
}) => {
  const durationOptions = [30, 60, 90];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Planifier un rendez-vous</Text>
      </View>

      <View style={styles.content}>
        {/* Date & Time */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date et heure *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DDTHH:mm"
            value={formData.scheduledAt}
            onChangeText={(value) => onFormDataChange({ scheduledAt: value })}
            placeholderTextColor="#999"
          />
          <Text style={styles.hint}>
            Format: YYYY-MM-DDTHH:mm (ex: 2025-07-20T14:00)
          </Text>
        </View>

        {/* Subject */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Sujet *</Text>
          <TextInput
            style={styles.input}
            placeholder="Session de lancement"
            value={formData.subject}
            onChangeText={(value) => onFormDataChange({ subject: value })}
            maxLength={500}
            placeholderTextColor="#999"
          />
          <Text style={styles.hint}>
            {formData.subject.length}/500 caractères
          </Text>
        </View>

        {/* Duration */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Durée (minutes) *</Text>
          <View style={styles.durationPicker}>
            {durationOptions.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationOption,
                  formData.duration === duration && styles.durationOptionActive,
                ]}
                onPress={() => onFormDataChange({ duration })}
              >
                <Text
                  style={[
                    styles.durationOptionText,
                    formData.duration === duration && styles.durationOptionTextActive,
                  ]}
                >
                  {duration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Ajoutez des notes ou questions..."
            value={formData.notes}
            onChangeText={(value) => onFormDataChange({ notes: value })}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    // Content styles
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: '#FAFAFA',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
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

export default RendezvousForm;

