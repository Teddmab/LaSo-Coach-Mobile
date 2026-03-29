import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { theme } from '../../constants/theme';

export type ExperienceSentiment = 'great' | 'okay' | 'not_great';

interface ReviewPromptModalProps {
  visible: boolean;
  onSelect: (sentiment: ExperienceSentiment) => void;
  onDismiss: () => void;
}

const ReviewPromptModal: React.FC<ReviewPromptModalProps> = ({
  visible,
  onSelect,
  onDismiss,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Comment se passe votre expérience ?</Text>
          <Text style={styles.subtitle}>
            Votre avis nous aide à améliorer LaSo Coach.
          </Text>

          <TouchableOpacity
            style={[styles.option, styles.optionGreat]}
            onPress={() => onSelect('great')}
            activeOpacity={0.85}
          >
            <Text style={styles.optionTextGreat}>Super</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => onSelect('okay')}
            activeOpacity={0.85}
          >
            <Text style={styles.optionText}>Correct</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => onSelect('not_great')}
            activeOpacity={0.85}
          >
            <Text style={styles.optionText}>Pas terrible</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.later} onPress={onDismiss}>
            <Text style={styles.laterText}>Plus tard</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionGreat: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  optionTextGreat: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  later: {
    marginTop: 8,
    paddingVertical: 10,
  },
  laterText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: 15,
  },
});

export default ReviewPromptModal;
