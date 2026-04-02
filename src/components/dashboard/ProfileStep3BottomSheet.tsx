import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useOnboarding } from '../../hooks/useOnboarding';
import Toast from 'react-native-toast-message';

interface ProfileStep3BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  isStepCompleted?: boolean; // Indique si l'étape est déjà complétée
}

const ProfileStep3BottomSheet: React.FC<ProfileStep3BottomSheetProps> = ({
  visible,
  onClose,
  onComplete,
  isStepCompleted = false,
}) => {
  const insets = useSafeAreaInsets();
  const { completeRecommendations, loading } = useOnboarding();
  const [photoConsent, setPhotoConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  
  // Si l'étape est déjà complétée, empêcher la modification
  useEffect(() => {
    if (visible && isStepCompleted) {
      Toast.show({
        type: 'info',
        text1: 'Étape déjà complétée',
        text2: 'Cette étape ne peut plus être modifiée',
        visibilityTime: 2000,
      });
      // Fermer le bottomsheet après un court délai
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  }, [visible, isStepCompleted, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setPhotoConsent(false);
      setConsentChecked(false);
    }
  }, [visible]);

  const handleComplete = async () => {
    if (!consentChecked) {
      Toast.show({
        type: 'error',
        text1: 'Consentement requis',
        text2: 'Veuillez accepter de suivre les recommandations',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const result = await completeRecommendations(photoConsent);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Étape 3 complétée !',
          text2: '+20 points obtenus',
          visibilityTime: 3000,
        });
        onComplete();
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: result.error || 'Impossible de compléter l\'étape 3',
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Une erreur est survenue',
        visibilityTime: 3000,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={styles.backdrop}
            />
          </TouchableOpacity>
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Étape 3: Recommandations</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.contentContainer}
            >
              <Text style={styles.sectionTitle}>Instructions et recommandations</Text>
              
              <View style={styles.recommendationsSection}>
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.recommendationText}>
                    Suivez les menus et recommandations personnalisés fournis dans votre programme
                  </Text>
                </View>
                
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.recommendationText}>
                    Respectez les horaires de repas recommandés
                  </Text>
                </View>
                
                <View style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.recommendationText}>
                    Effectuez les exercices recommandés régulièrement
                  </Text>
                </View>
                
                <View style={styles.recommendationItem}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" />
                  <Text style={styles.recommendationText}>
                    Surtout ne pas partager les menus LaSo'Coach (ils sont confidentiels)
                  </Text>
                </View>
                
                <View style={styles.recommendationItem}>
                  <Ionicons name="chatbubble-outline" size={20} color="#FF6B35" />
                  <Text style={styles.recommendationText}>
                    Merci de me citer vos restrictions alimentaires et vos habitudes dans la semaine
                  </Text>
                </View>
              </View>

              {/* Photo Consent */}
              <View style={styles.photoConsentSection}>
                <Text style={styles.sectionTitle}>Consentement photo</Text>
                
                <View style={styles.photoConsentContainer}>
                  <Ionicons name="camera-outline" size={20} color="#7B68EE" />
                  <Text style={styles.photoConsentQuestion}>
                    Autorisez-vous LASO'COACH à utiliser votre image, dans sa rubrique des sessions photos avant et après sur les réseaux sociaux et le site web ?
                  </Text>
                </View>
                
                <View style={styles.consentAnswerContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setPhotoConsent(!photoConsent)}
                  >
                    <Ionicons 
                      name={photoConsent ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={photoConsent ? "#2196F3" : "#999"}
                    />
                  </TouchableOpacity>
                  <View style={styles.consentTextContainer}>
                    <Text style={styles.consentAnswerText}>Oui, j'accepte.</Text>
                    <Text style={styles.consentDetailText}>
                      * Si vous cochez "Oui, j'accepte!", Envoyez une photo avant de commencer le programme avec des vêtements serrés, debout face et debout profil. Envoyez la capture de votre poids sur la balance digitale tous les matins au réveil (Après premières toilettes de préférence, capture du poids uniquement).
                    </Text>
                  </View>
                </View>
              </View>

              {/* Consent Checkbox */}
              <View style={styles.consentSection}>
                <View style={styles.consentContainer}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setConsentChecked(!consentChecked)}
                  >
                    <Ionicons 
                      name={consentChecked ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={consentChecked ? "#2196F3" : "#999"}
                    />
                  </TouchableOpacity>
                  <View style={styles.consentTextContainer}>
                    <Text style={styles.consentText}>
                      J'accepte de suivre les recommandations et instructions personnalisées fournies dans ce programme. *
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.completeButton, (loading || !consentChecked) && styles.completeButtonDisabled]}
                onPress={handleComplete}
                disabled={loading || !consentChecked}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.completeButtonText}>Compléter</Text>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '85%',
    paddingTop: 12,
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
    marginTop: 8,
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  photoConsentSection: {
    marginBottom: 24,
  },
  photoConsentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  photoConsentQuestion: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  consentAnswerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    padding: 4,
  },
  consentTextContainer: {
    flex: 1,
  },
  consentAnswerText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  consentDetailText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  consentSection: {
    marginBottom: 16,
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileStep3BottomSheet;

