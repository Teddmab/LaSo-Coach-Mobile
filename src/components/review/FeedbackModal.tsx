import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import {
  submitAppFeedback,
  AppFeedbackCategory,
  InAppFeedbackSentiment,
} from '../../services/review/feedbackService';
import Toast from 'react-native-toast-message';

interface FeedbackModalProps {
  visible: boolean;
  sentiment: InAppFeedbackSentiment;
  userEmail?: string;
  userId?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const CATEGORIES: { id: AppFeedbackCategory; label: string }[] = [
  { id: 'bug', label: 'Bug' },
  { id: 'suggestion', label: 'Suggestion' },
  { id: 'payment', label: 'Paiement' },
  { id: 'usability', label: 'Utilisation' },
  { id: 'other', label: 'Autre' },
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  sentiment,
  userEmail,
  userId,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<AppFeedbackCategory | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    setRating(0);
    setCategory(null);
    setComment('');
    setSubmitting(false);
    setDone(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5 || !category) {
      return;
    }
    setSubmitting(true);
    try {
      const { ok } = await submitAppFeedback({
        rating,
        comment: comment.trim() || undefined,
        category,
        sentiment,
        userEmail,
        userId,
      });
      if (ok) {
        setDone(true);
        onSubmitted();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Envoi impossible',
          text2: 'Réessayez plus tard ou écrivez à support@lasocoach.com',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const valid = rating >= 1 && rating <= 5 && category != null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {done ? (
              <View style={styles.doneBox}>
                <Ionicons name="checkmark-circle" size={56} color={theme.colors.primary} />
                <Text style={styles.doneTitle}>Merci pour votre retour</Text>
                <Text style={styles.doneSub}>
                  Nous prenons en compte chaque message pour améliorer l’application.
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleClose}>
                  <Text style={styles.primaryBtnText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.title}>Dites-nous en plus</Text>
                <Text style={styles.subtitle}>Note globale (obligatoire)</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setRating(n)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Ionicons
                        name={n <= rating ? 'star' : 'star-outline'}
                        size={36}
                        color={n <= rating ? '#FFC107' : theme.colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.subtitle}>Catégorie (obligatoire)</Text>
                <View style={styles.chips}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.chip,
                        category === c.id && styles.chipActive,
                      ]}
                      onPress={() => setCategory(c.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          category === c.id && styles.chipTextActive,
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.subtitle}>Commentaire (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  multiline
                  numberOfLines={4}
                  placeholder="Décrivez brièvement le problème ou votre idée…"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={comment}
                  onChangeText={setComment}
                  maxLength={2000}
                />

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                    <Text style={styles.cancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, !valid && styles.primaryBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!valid || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Envoyer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginTop: 14,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text.primary,
    fontSize: 14,
  },
  chipTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  doneTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  doneSub: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
});

export default FeedbackModal;
