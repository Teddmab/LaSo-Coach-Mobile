import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import type { NouveauteStep } from '../../constants/nouveautes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NouveautesBottomSheetProps {
  visible: boolean;
  steps: NouveauteStep[];
  onComplete: () => void;
  /** Nom d'affichage (ex: prénom) pour le variant home */
  welcomeUserName?: string;
  /** Layout "home" | "agora" | "progress" | "nutrition" | "achievements" : feature avec sous-icônes (home ajoute bienvenue) */
  variant?: 'default' | 'home' | 'agora' | 'progress' | 'nutrition' | 'achievements';
}

const NouveautesBottomSheet: React.FC<NouveautesBottomSheetProps> = ({
  visible,
  steps,
  onComplete,
  welcomeUserName,
  variant = 'default',
}) => {
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex >= steps.length - 1;
  const isHomeLayout = variant === 'home' && steps.length >= 1;
  const isAgoraLayout = variant === 'agora' && steps.length >= 1;
  const isProgressLayout = variant === 'progress' && steps.length >= 1;
  const isNutritionLayout = variant === 'nutrition' && steps.length >= 1;
  const isAchievementsLayout = variant === 'achievements' && steps.length >= 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const handleClose = () => {
    onComplete();
  };

  if (!visible || steps.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.backdropAndroid]} />
        )}
      </View>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} style={styles.blurSheet}>
            {isHomeLayout ? <HomeContent /> : isAgoraLayout ? <AgoraContent /> : isProgressLayout ? <ProgressContent /> : isNutritionLayout ? <NutritionContent /> : isAchievementsLayout ? <AchievementsContent /> : <DefaultContent />}
          </BlurView>
        ) : (
          <View style={styles.blurSheet}>
            {isHomeLayout ? <HomeContent /> : isAgoraLayout ? <AgoraContent /> : isProgressLayout ? <ProgressContent /> : isNutritionLayout ? <NutritionContent /> : isAchievementsLayout ? <AchievementsContent /> : <DefaultContent />}
          </View>
        )}
      </View>
    </Modal>
  );

  function DefaultContent() {
    return (
      <>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {currentStep.icon ? (
            <View style={styles.iconWrap}>
              <Ionicons name={currentStep.icon as any} size={48} color={theme.colors.primary} />
            </View>
          ) : null}
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.description}>{currentStep.description}</Text>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>{isLastStep ? 'Compris' : 'Suivant'}</Text>
            {!isLastStep && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </>
    );
  }

  function HomeContent() {
    const step = steps[0];
    const name = welcomeUserName?.trim();
    return (
      <>
        <View style={styles.handle} />
        <View style={styles.homeHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.homeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.homeWelcome}>
            Bienvenue{name ? (
              <Text style={styles.homeWelcomeName}>, {name}</Text>
            ) : ''}
          </Text>
          <Text style={styles.homeSubtitle}>Voici ce qui change dans cette version</Text>

          <View style={styles.homeFeatureRow}>
            <View style={styles.homeFeatureIconWrap}>
              <Ionicons name={(step.icon || 'restaurant-outline') as any} size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.homeFeatureTitle}>{step.title}</Text>
          </View>
          <Text style={styles.homeFeatureIntro}>
            Cette carte vous permet de voir le plat du jour dans le temps, de le compléter directement ou d’ouvrir pour en voir plus.
          </Text>
          <View style={styles.homeFeatureBullets}>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Voir le plat du jour à l’heure</Text>
            </View>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Le compléter en un clic</Text>
            </View>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Ou ouvrir pour voir plus de détails</Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Compris</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  function AgoraContent() {
    const step = steps[0];
    return (
      <>
        <View style={styles.handle} />
        <View style={styles.homeHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.homeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.agoraSubtitle}>Voici ce qui change dans l’Agora</Text>

          <View style={styles.homeFeatureRow}>
            <View style={styles.homeFeatureIconWrap}>
              <Ionicons name={(step.icon || 'heart-outline') as any} size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.homeFeatureTitle}>{step.title}</Text>
          </View>
          <Text style={styles.homeFeatureIntro}>
            Vous pouvez réagir aux publications et contribuer à un contenu approprié.
          </Text>
          <View style={styles.homeFeatureBullets}>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="heart-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Liker avec un retour visuel clair</Text>
            </View>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="flag-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Signaler un contenu inapproprié</Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Compris</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  function ProgressContent() {
    const step = steps[0];
    return (
      <>
        <View style={styles.handle} />
        <View style={styles.homeHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.homeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.agoraSubtitle}>Voici ce qui change dans Progression</Text>

          <View style={styles.homeFeatureRow}>
            <View style={styles.homeFeatureIconWrap}>
              <Ionicons name={(step.icon || 'stats-chart-outline') as any} size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.homeFeatureTitle}>{step.title}</Text>
          </View>
          <Text style={styles.homeFeatureIntro}>
            Un suivi clair de vos mesures dans le temps, avec des graphiques et des photos à l’appui.
          </Text>
          <View style={styles.homeFeatureBullets}>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="stats-chart-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Courbes et statistiques pour suivre l’évolution</Text>
            </View>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="images-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Photos de progression pour visualiser les changements</Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Compris</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  function NutritionContent() {
    const step = steps[0];
    return (
      <>
        <View style={styles.handle} />
        <View style={styles.homeHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.homeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.agoraSubtitle}>Voici ce qui change dans Nutrition</Text>

          <View style={styles.homeFeatureRow}>
            <View style={styles.homeFeatureIconWrap}>
              <Ionicons name={(step.icon || 'checkmark-done-outline') as any} size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.homeFeatureTitle}>{step.title}</Text>
          </View>
          <Text style={styles.homeFeatureIntro}>
            Marquez vos plats comme complétés pour un meilleur suivi et un maintien de votre santé.
          </Text>
          <View style={styles.homeFeatureBullets}>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Marquer les plats complétés au fil du jour</Text>
            </View>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="star-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Gagner des points liés à la complétion</Text>
            </View>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="nutrition-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Suivre votre alimentation et votre santé</Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Compris</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  function AchievementsContent() {
    const step = steps[0];
    return (
      <>
        <View style={styles.handle} />
        <View style={styles.homeHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.homeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.agoraSubtitle}>Voici ce qui change dans Réalisations</Text>

          <View style={styles.homeFeatureRow}>
            <View style={styles.homeFeatureIconWrap}>
              <Ionicons name={(step.icon || 'trophy-outline') as any} size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.homeFeatureTitle}>{step.title}</Text>
          </View>
          <Text style={styles.homeFeatureIntro}>
            Suivez votre classement, cumulez des points et voyez vos réalisations progresser.
          </Text>
          <View style={styles.homeFeatureBullets}>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="podium-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Voir votre classement et celui de la communauté</Text>
            </View>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="star-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Cumuler des points avec vos activités</Text>
            </View>
            <View style={styles.homeBulletRow}>
              <View style={styles.homeBulletIcon}>
                <Ionicons name="medal-outline" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.homeBulletText}>Relever des défis et débloquer des badges</Text>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Compris</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdropAndroid: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.92,
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  blurSheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D1D1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D1D1',
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 20,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Home variant
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  homeScrollContent: {
    paddingBottom: 24,
  },
  homeWelcome: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  homeWelcomeName: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  homeSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 28,
    fontWeight: '500',
  },
  agoraSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 24,
    fontWeight: '500',
  },
  homeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  homeFeatureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  homeFeatureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  homeFeatureIntro: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  homeFeatureBullets: {
    marginBottom: 8,
  },
  homeBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  homeBulletIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  homeBulletText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
  },
});

export default NouveautesBottomSheet;
