import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
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
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    if (!form.uploading) {
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
          />
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={styles.handle} />
            
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Ajouter une photo de progression</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={form.uploading}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Photo *</Text>
                <TouchableOpacity
                  style={styles.photoSelector}
                  onPress={onPhotoSelect}
                  disabled={form.uploading}
                >
                  {form.preview ? (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: form.preview }} style={styles.preview} />
                      <TouchableOpacity
                        style={styles.changePhotoButton}
                        onPress={onPhotoSelect}
                        disabled={form.uploading}
                      >
                        <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.changePhotoText}>Changer la photo</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.selectorPlaceholder}>
                      <Ionicons name="camera-outline" size={48} color={theme.colors.text.secondary} />
                      <Text style={styles.selectorText}>Sélectionner une photo</Text>
                    </View>
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
                  editable={!form.uploading}
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
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!form.uploading}
                />
              </View>

              {form.error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#F44336" />
                  <Text style={styles.error}>{form.error}</Text>
                </View>
              ) : null}

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.cancelButton, form.uploading && styles.buttonDisabled]}
                  onPress={handleClose}
                  disabled={form.uploading}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (form.uploading || !form.selectedPhoto) && styles.submitButtonDisabled,
                  ]}
                  onPress={onSubmit}
                  disabled={form.uploading || !form.selectedPhoto}
                >
                  <LinearGradient
                    colors={
                      form.uploading || !form.selectedPhoto
                        ? ['#BDBDBD', '#9E9E9E']
                        : ['#8BC34A', '#689F38']
                    }
                    style={styles.submitGradient}
                  >
                    {form.uploading ? (
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '95%',
    minHeight: 600,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
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
  photoSelector: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  selectorPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 12,
  },
  previewContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  error: {
    fontSize: 14,
    color: '#F44336',
    flex: 1,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
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

export default PhotoModal;
