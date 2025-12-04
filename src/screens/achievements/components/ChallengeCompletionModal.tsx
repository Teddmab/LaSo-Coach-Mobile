import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Challenge } from '../types';
import { getCategoryIcon, formatCategoryText, getValidationIcon } from '../../defis/utils/defisUtils';
import { formatPoints } from '../utils/achievementsUtils';

interface ChallengeCompletionModalProps {
  visible: boolean;
  challenge: Challenge | null;
  onClose: () => void;
  onSubmit: (challengeId: string, data: { photo?: string; text?: string }) => Promise<void>;
}

const ChallengeCompletionModal: React.FC<ChallengeCompletionModalProps> = ({
  visible,
  challenge,
  onClose,
  onSubmit,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!challenge || challenge.status === 'completed') return null;

  const handleTakePhoto = async () => {
    Alert.alert(
      'Prendre une photo',
      'Choisissez une option',
      [
        {
          text: 'Appareil photo',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Toast.show({
                  type: 'error',
                  text1: 'Permission refusée',
                  text2: 'Veuillez autoriser l\'accès à l\'appareil photo',
                });
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                setSelectedPhoto(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error taking photo:', error);
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: 'Impossible de prendre la photo',
              });
            }
          },
        },
        {
          text: 'Galerie',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Toast.show({
                  type: 'error',
                  text1: 'Permission refusée',
                  text2: 'Veuillez autoriser l\'accès à votre galerie',
                });
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                setSelectedPhoto(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error selecting photo:', error);
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: 'Impossible de sélectionner la photo',
              });
            }
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    if (challenge.validationMode === 'PHOTO' && !selectedPhoto) {
      Toast.show({
        type: 'error',
        text1: 'Photo requise',
        text2: 'Veuillez prendre ou sélectionner une photo',
      });
      return;
    }

    if (challenge.validationMode === 'TEXT' && !textInput.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Texte requis',
        text2: 'Veuillez décrire votre expérience',
      });
      return;
    }

    try {
      setUploading(true);
      await onSubmit(challenge.id, {
        photo: selectedPhoto || undefined,
        text: textInput || undefined,
      });
      setSelectedPhoto(null);
      setTextInput('');
      onClose();
    } catch (error) {
      console.error('Error submitting challenge:', error);
    } finally {
      setUploading(false);
    }
  };

  const getValidationInput = () => {
    switch (challenge.validationMode) {
      case 'PHOTO':
        return (
          <View style={styles.validationInput}>
            <Text style={styles.validationLabel}>Prenez une photo :</Text>
            <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={24} color="#3B82F6" />
              <Text style={styles.photoButtonText}>
                {selectedPhoto ? 'Photo sélectionnée' : 'Prendre une photo'}
              </Text>
            </TouchableOpacity>
            {selectedPhoto && (
              <View style={styles.selectedPhotoContainer}>
                <Image source={{ uri: selectedPhoto }} style={styles.selectedPhoto} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      case 'TEXT':
        return (
          <View style={styles.validationInput}>
            <Text style={styles.validationLabel}>Décrivez votre expérience :</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Racontez comment vous avez relevé ce défi..."
              multiline
              numberOfLines={4}
              value={textInput}
              onChangeText={setTextInput}
            />
          </View>
        );
      case 'AUTO_CHECK':
        return (
          <View style={styles.validationInput}>
            <View style={styles.autoCheckInfo}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.autoCheckText}>Validation automatique</Text>
            </View>
          </View>
        );
      case 'COACH':
        return (
          <View style={styles.validationInput}>
            <View style={styles.coachValidationInfo}>
              <Ionicons name="person-outline" size={24} color="#FF9800" />
              <Text style={styles.coachValidationText}>Validation par un coach</Text>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.validationInput}>
            <Text style={styles.validationLabel}>
              {(challenge as any).validationDescription || 'Complétez ce défi'}
            </Text>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Compléter le défi</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.body}>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            {challenge.description && (
              <Text style={styles.challengeDescription}>{challenge.description}</Text>
            )}
            
            <View style={styles.challengeInfo}>
              <View style={styles.infoRow}>
                <Ionicons 
                  name={getCategoryIcon(challenge.category) as any} 
                  size={16} 
                  color="#3B82F6" 
                />
                <Text style={styles.infoText}>{formatCategoryText(challenge.category)}</Text>
              </View>
              {(challenge as any).duration && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{(challenge as any).duration} jours</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons name="trophy-outline" size={16} color="#FFD700" />
                <Text style={styles.infoText}>
                  {formatPoints((challenge as any).rewards?.points || challenge.points || 0)} points
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons 
                  name={getValidationIcon(challenge.validationMode) as any} 
                  size={16} 
                  color="#10B981" 
                />
                <Text style={styles.infoText}>
                  {(challenge as any).validationDescription || challenge.validationMode}
                </Text>
              </View>
            </View>
            
            {getValidationInput()}
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Soumettre</Text>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
    lineHeight: 20,
  },
  challengeInfo: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  validationInput: {
    marginTop: 16,
  },
  validationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
  },
  photoButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedPhotoContainer: {
    marginTop: 16,
    position: 'relative',
    alignItems: 'center',
  },
  selectedPhoto: {
    width: 200,
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  autoCheckInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  autoCheckText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  coachValidationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  coachValidationText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChallengeCompletionModal;

