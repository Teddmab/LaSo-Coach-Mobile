import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReportPostModalProps {
  visible: boolean;
  postId: string;
  postAuthor?: string;
  onClose: () => void;
  onReport: (postId: string, reason: string) => Promise<void>;
}

const REPORT_REASONS = [
  {
    id: 'spam',
    label: 'Spam ou contenu publicitaire',
    icon: 'ban-outline',
  },
  {
    id: 'inappropriate',
    label: 'Contenu inapproprié ou offensant',
    icon: 'warning-outline',
  },
  {
    id: 'harassment',
    label: 'Harcèlement ou intimidation',
    icon: 'shield-outline',
  },
  {
    id: 'false_info',
    label: 'Fausses informations',
    icon: 'information-circle-outline',
  },
  {
    id: 'violence',
    label: 'Violence ou contenu dangereux',
    icon: 'alert-circle-outline',
  },
  {
    id: 'copyright',
    label: 'Violation de droits d\'auteur',
    icon: 'document-text-outline',
  },
  {
    id: 'other',
    label: 'Autre raison',
    icon: 'ellipsis-horizontal-outline',
  },
];

const ReportPostModal: React.FC<ReportPostModalProps> = ({
  visible,
  postId,
  postAuthor,
  onClose,
  onReport,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    if (reasonId !== 'other') {
      setCustomReason('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Erreur', 'Veuillez sélectionner une raison de signalement');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      Alert.alert('Erreur', 'Veuillez préciser la raison de signalement');
      return;
    }

    const finalReason = selectedReason === 'other' 
      ? customReason.trim() 
      : REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

    // Demander confirmation avant de signaler
    Alert.alert(
      'Confirmer le signalement',
      'Êtes-vous sûr de vouloir signaler cette publication ? Elle sera retirée de votre fil d\'actualité.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await onReport(postId, finalReason);
              Alert.alert(
                'Signalement envoyé',
                'Votre signalement a été transmis à notre équipe de modération. La publication a été retirée de votre fil.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      handleClose();
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert(
                'Erreur',
                error?.userMessage || error?.message || 'Impossible d\'envoyer le signalement. Veuillez réessayer.'
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomReason('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContainer}>
          {/* Handle bar */}
          <View style={styles.handleBar} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Signaler ce post</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.subtitle}>
              {postAuthor 
                ? `Pourquoi signalez-vous le post de ${postAuthor} ?`
                : 'Pourquoi signalez-vous ce post ?'}
            </Text>
            <Text style={styles.description}>
              Votre signalement nous aide à maintenir une communauté respectueuse. 
              Notre équipe examinera ce contenu sous peu.
            </Text>

            {/* Reason Options */}
            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason.id && styles.reasonOptionSelected,
                  ]}
                  onPress={() => handleReasonSelect(reason.id)}
                  disabled={isSubmitting}
                >
                  <Ionicons
                    name={reason.icon as any}
                    size={20}
                    color={
                      selectedReason === reason.id
                        ? theme.colors.primary
                        : theme.colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason.id && styles.reasonTextSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Reason Input */}
            {selectedReason === 'other' && (
              <View style={styles.customReasonContainer}>
                <Text style={styles.customReasonLabel}>
                  Veuillez préciser la raison :
                </Text>
                <TextInput
                  style={styles.customReasonInput}
                  placeholder="Décrivez la raison de votre signalement..."
                  placeholderTextColor={theme.colors.text.secondary}
                  multiline
                  numberOfLines={4}
                  value={customReason}
                  onChangeText={setCustomReason}
                  editable={!isSubmitting}
                  textAlignVertical="top"
                />
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedReason || (selectedReason === 'other' && !customReason.trim()) || isSubmitting) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                !selectedReason ||
                (selectedReason === 'other' && !customReason.trim()) ||
                isSubmitting
              }
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Signaler</Text>
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
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    minHeight: SCREEN_HEIGHT * 0.7,
    flexDirection: 'column',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    flexShrink: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F0F2F5',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: theme.colors.primary,
  },
  reasonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  reasonTextSelected: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  checkIcon: {
    marginLeft: 8,
  },
  customReasonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  customReasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  customReasonInput: {
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: theme.colors.text.primary,
    minHeight: 100,
    borderWidth: 2,
    borderColor: '#E4E6EB',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
    gap: 12,
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default ReportPostModal;

