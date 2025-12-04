import React from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../../constants/theme';
import { PhotoForm } from '../types';

interface PhotoModalProps {
  visible: boolean;
  form: PhotoForm;
  onFormChange: (form: Partial<PhotoForm>) => void;
  onPhotoSelect: () => void;
  onSubmit: () => void;
  onClose: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({
  visible,
  form,
  onFormChange,
  onPhotoSelect,
  onSubmit,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Ajouter une photo de progression</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photo *</Text>
            <TouchableOpacity style={styles.photoSelector} onPress={onPhotoSelect}>
              {form.preview ? (
                <Image source={{ uri: form.preview }} style={styles.preview} />
              ) : (
                <Text style={styles.selectorText}>Sélectionner une photo</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Poids actuel (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={form.weight}
              onChangeText={(text) => onFormChange({ weight: text })}
              placeholder="Ex: 75.5"
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.notes}
              onChangeText={(text) => onFormChange({ notes: text })}
              placeholder="Comment vous sentez-vous aujourd'hui ?"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, form.uploading && styles.submitButtonDisabled]}
              onPress={onSubmit}
              disabled={form.uploading || !form.selectedPhoto}
            >
              <LinearGradient
                colors={form.uploading ? ['#BDBDBD', '#9E9E9E'] : ['#8BC34A', '#689F38']}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {form.uploading ? 'Téléchargement...' : 'Ajouter'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 384,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C340E',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C340E',
    marginBottom: 8,
  },
  photoSelector: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  preview: {
    width: 128,
    height: 128,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text.primary,
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
    marginTop: 20,
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
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PhotoModal;

