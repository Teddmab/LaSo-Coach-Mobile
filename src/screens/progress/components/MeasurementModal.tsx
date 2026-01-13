import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../constants/theme';
import { MeasurementForm } from '../types';

interface MeasurementModalProps {
  visible: boolean;
  form: MeasurementForm;
  onFormChange: (form: Partial<MeasurementForm>) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const MeasurementModal: React.FC<MeasurementModalProps> = ({
  visible,
  form,
  onFormChange,
  onSubmit,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    if (!form.saving) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleClose}
            disabled={form.saving}
          />
          <View style={[styles.container, { paddingBottom: insets.bottom, height: '65%', minHeight: 600 }]}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Ajouter une nouvelle mesure</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                disabled={form.saving}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Poids (kg) *</Text>
                <TextInput
                  style={styles.input}
                  value={form.weight}
                  onChangeText={(text) => onFormChange({ weight: text })}
                  placeholder="Ex: 75.5"
                  keyboardType="numeric"
                  maxLength={5}
                  placeholderTextColor={theme.colors.text.secondary}
                  editable={!form.saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tour de taille (cm) *</Text>
                <TextInput
                  style={styles.input}
                  value={form.waistSize}
                  onChangeText={(text) => onFormChange({ waistSize: text })}
                  placeholder="Ex: 85.0"
                  keyboardType="numeric"
                  maxLength={5}
                  placeholderTextColor={theme.colors.text.secondary}
                  editable={!form.saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (optionnel)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.notes}
                  onChangeText={(text) => onFormChange({ notes: text })}
                  placeholder="Notes..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor={theme.colors.text.secondary}
                  editable={!form.saving}
                />
              </View>

              {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={form.saving}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, (form.saving || !form.weight || !form.waistSize) && styles.submitButtonDisabled]}
                  onPress={onSubmit}
                  disabled={form.saving || !form.weight || !form.waistSize}
                >
                  <LinearGradient
                    colors={(form.saving || !form.weight || !form.waistSize) ? ['#BDBDBD', '#9E9E9E'] : ['#8BC34A', '#689F38']}
                    style={styles.submitGradient}
                  >
                    {form.saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitText}>Ajouter</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
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
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MeasurementModal;

