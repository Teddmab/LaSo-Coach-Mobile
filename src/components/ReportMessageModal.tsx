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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface ReportMessageModalProps {
  visible: boolean;
  messageId: string;
  senderName?: string;
  onClose: () => void;
  onReport: (messageId: string, reason: string) => Promise<void>;
}

const REPORT_REASONS = [
  {
    id: 'spam',
    label: 'Spam ou publicité',
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
    id: 'abuse',
    label: 'Abus ou menaces',
    icon: 'alert-circle-outline',
  },
  {
    id: 'misinformation',
    label: 'Fausse information ou désinformation',
    icon: 'information-circle-outline',
  },
  {
    id: 'other',
    label: 'Autre raison',
    icon: 'ellipsis-horizontal-outline',
  },
];

/**
 * ReportMessageModal - Modal for reporting messages in chat
 * 
 * Phase 8 - TODO #8: Add message preview in report modal
 * Phase 8 - TODO #9: Track reporting patterns for auto-moderation
 * 
 * Allows users to report problematic messages with predefined or custom reasons
 */
const ReportMessageModal: React.FC<ReportMessageModalProps> = ({
  visible,
  messageId,
  senderName,
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
      Alert.alert('Erreur', 'Veuillez sélectionner une raison pour signaler ce message');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      Alert.alert('Erreur', 'Veuillez fournir une raison pour signaler ce message');
      return;
    }

    const finalReason =
      selectedReason === 'other'
        ? customReason.trim()
        : REPORT_REASONS.find((r) => r.id === selectedReason)?.label || selectedReason;

    try {
      setIsSubmitting(true);
      console.log('📋 [ReportMessageModal] Submitting report:', {
        messageId,
        reason: finalReason,
      });
      await onReport(messageId, finalReason);

      Alert.alert(
        'Signalement envoyé',
        'Merci d\'avoir signalé ce message. Notre équipe de modération l\'examinera bientôt.',
        [
          {
            text: 'OK',
            onPress: handleClose,
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ [ReportMessageModal] Error submitting report:', error);
      Alert.alert(
        'Erreur',
        error?.message || 'Erreur lors de l\'envoi du signalement. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <Text style={styles.title}>Signaler le message</Text>
            {senderName && (
              <Text style={styles.senderName}>De : {senderName}</Text>
            )}
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            <Text style={styles.label}>Pourquoi signalez-vous ce message ?</Text>

            {/* Reason Selection */}
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonButton,
                  selectedReason === reason.id && styles.reasonButtonSelected,
                ]}
                onPress={() => handleReasonSelect(reason.id)}
              >
                <View style={styles.reasonContent}>
                  <Ionicons
                    name={reason.icon as any}
                    size={20}
                    color={
                      selectedReason === reason.id
                        ? theme.colors.primary
                        : theme.colors.text.secondary
                    }
                    style={styles.reasonIcon}
                  />
                  <Text
                    style={[
                      styles.reasonLabel,
                      selectedReason === reason.id && styles.reasonLabelSelected,
                    ]}
                  >
                    {reason.label}
                  </Text>
                </View>
                {selectedReason === reason.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}

            {/* Custom Reason Input */}
            {selectedReason === 'other' && (
              <TextInput
                style={styles.customInput}
                placeholder="Veuillez expliquer le problème..."
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={3}
                maxLength={200}
                value={customReason}
                onChangeText={setCustomReason}
                editable={!isSubmitting}
              />
            )}

            {/* Info Text */}
            <Text style={styles.infoText}>
              Votre signalement sera examiné par notre équipe de modération. Les faux signalements peuvent entraîner des restrictions sur votre compte.
            </Text>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting || !selectedReason}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.surface} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Envoyer le signalement</Text>
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
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    display: 'flex',
    flexDirection: 'column',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  senderName: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reasonButtonSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: theme.colors.primary,
  },
  reasonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonIcon: {
    marginRight: 12,
  },
  reasonLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  reasonLabelSelected: {
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  customInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 16,
    fontSize: 14,
    color: theme.colors.text.primary,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 16,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.surface,
  },
});

export default ReportMessageModal;
