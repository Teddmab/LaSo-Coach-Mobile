import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';

const DELETION_REASONS = [
  { value: '', label: 'Sélectionnez une raison' },
  { value: 'not-useful', label: "L'application ne m'est pas utile" },
  { value: 'too-expensive', label: 'Trop cher' },
  { value: 'privacy-concerns', label: 'Préoccupations de confidentialité' },
  { value: 'found-alternative', label: "J'ai trouvé une alternative" },
  { value: 'technical-issues', label: 'Problèmes techniques' },
  { value: 'other', label: 'Autre' },
];

interface AccountDeletionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (feedback?: { reason?: string; comments?: string }) => Promise<void>;
}

const AccountDeletionBottomSheet: React.FC<AccountDeletionBottomSheetProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm({
        reason: reason || undefined,
        comments: comments || undefined,
      });
      // Show goodbye message
      setShowGoodbye(true);
      // Wait 2 seconds before closing (the parent will handle logout)
      setTimeout(() => {
        setShowGoodbye(false);
        onClose();
      }, 2000);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting && !showGoodbye) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={(styles as any).backdropTouchable}
            activeOpacity={1}
            onPress={handleClose}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={styles.backdrop}
            />
          </TouchableOpacity>
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={styles.handle} />
            
            {showGoodbye ? (
              <View style={styles.goodbyeContainer}>
                <Ionicons name="checkmark-circle" size={64} color={theme.colors.primary} />
                <Text style={styles.goodbyeTitle}>Au revoir !</Text>
                <Text style={styles.goodbyeMessage}>
                  Merci d'avoir utilisé LaSo Coach
                </Text>
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Attention Section */}
                <View style={styles.attentionSection}>
                  <View style={styles.attentionHeader}>
                    <Ionicons name="warning" size={24} color="#F44336" />
                    <Text style={styles.attentionTitle}>Attention : Action irréversible</Text>
                  </View>
                  <Text style={styles.attentionText}>
                    La suppression de votre compte est <Text style={styles.boldText}>définitive et irréversible</Text>.
                    Toutes vos données personnelles, votre progression et votre historique seront définitivement supprimés.
                  </Text>
                </View>

                {/* Data to be deleted */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Données qui seront supprimées</Text>
                  <View style={styles.dataGrid}>
                    <View style={styles.dataItem}>
                      <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.dataItemContent}>
                        <Text style={styles.dataItemTitle}>Informations de profil</Text>
                        <Text style={styles.dataItemSubtitle}>Nom, email, préférences</Text>
                      </View>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="stats-chart-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.dataItemContent}>
                        <Text style={styles.dataItemTitle}>Progression fitness</Text>
                        <Text style={styles.dataItemSubtitle}>Entraînements, mesures, photos</Text>
                      </View>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.dataItemContent}>
                        <Text style={styles.dataItemTitle}>Données d'abonnement</Text>
                        <Text style={styles.dataItemSubtitle}>Historique, tokens de paiement</Text>
                      </View>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.dataItemContent}>
                        <Text style={styles.dataItemTitle}>Activité et utilisation</Text>
                        <Text style={styles.dataItemSubtitle}>Logs, préférences, synchronisation</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Processing time */}
                <View style={styles.processingSection}>
                  <View style={styles.processingHeader}>
                    <Ionicons name="time-outline" size={20} color="#2196F3" />
                    <Text style={styles.processingTitle}>Délai de traitement</Text>
                  </View>
                  <Text style={styles.processingText}>
                    Votre compte sera supprimé dans les <Text style={styles.boldText}>30 jours</Text> suivant votre demande.
                    Vous recevrez une confirmation par e-mail une fois la suppression effectuée.
                  </Text>
                </View>

                {/* Feedback form - Optional */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Aidez-nous à améliorer (optionnel)</Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Raison de la suppression</Text>
                    <TouchableOpacity
                      style={styles.selectContainer}
                      onPress={() => setShowReasonPicker(true)}
                    >
                      <Text style={[styles.selectText, !reason && styles.selectPlaceholder]}>
                        {reason ? (DELETION_REASONS.find(r => r.value === reason)?.label || 'Sélectionnez une raison') : 'Sélectionnez une raison'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#999" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Commentaires (optionnel)</Text>
                    <TextInput
                      style={styles.textArea}
                      value={comments}
                      onChangeText={setComments}
                      placeholder="Partagez vos commentaires pour nous aider à améliorer..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                    disabled={isDeleting}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                    onPress={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.deleteButtonText}>Supprimer</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Reason Picker Modal */}
      <Modal
        visible={showReasonPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReasonPicker(false)}
      >
        <View style={styles.pickerModal}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowReasonPicker(false)}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
          </TouchableOpacity>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Sélectionnez une raison</Text>
              <TouchableOpacity onPress={() => setShowReasonPicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerScrollView}>
              {DELETION_REASONS.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.pickerOption}
                  onPress={() => {
                    setReason(item.value);
                    setShowReasonPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  attentionSection: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  attentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attentionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
    marginLeft: 8,
  },
  attentionText: {
    fontSize: 14,
    color: '#C62828',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  dataGrid: {
    gap: 12,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dataItemContent: {
    flex: 1,
  },
  dataItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  dataItemSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  processingSection: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  processingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginLeft: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  selectPlaceholder: {
    color: '#999',
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
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  pickerScrollView: {
    maxHeight: 400,
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  pickerOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  goodbyeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  goodbyeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  goodbyeMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  },
});

export default AccountDeletionBottomSheet;

