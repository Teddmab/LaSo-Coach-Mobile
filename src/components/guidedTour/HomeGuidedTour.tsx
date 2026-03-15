import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

/** Clé AsyncStorage : une fois à "true", le tuto ne s’affiche plus. Exporter pour réinitialisation (ex. Paramètres). */
export const HOME_TOUR_STORAGE_KEY = '@laso_guided_tour_home_done';
const STORAGE_KEY = HOME_TOUR_STORAGE_KEY;

/** 5 étapes alignées avec les sections du Home (ordre d’affichage) — vouvoiement */
const HOME_STEPS: { title: string; description: string }[] = [
  {
    title: "L'onboarding pour compléter votre profil",
    description:
      "Ici vous pouvez compléter votre profil et les étapes de prise en main. Cliquez sur une étape pour l'ouvrir et la valider.",
  },
  {
    title: 'Les badges et les défis',
    description:
      "Les tâches accomplies permettent de débloquer des badges. Cliquez pour voir vos points, vos badges et accéder aux défis.",
  },
  {
    title: 'Le raccourci du menu du jour',
    description:
      "Complétez un repas rapidement ou accédez au plan nutritionnel de base. Cliquez sur un repas pour le détail et le marquer comme complété.",
  },
  {
    title: 'Les news',
    description:
      "Les actualités et contenus recommandés. Cliquez pour lire ou marquer comme lu.",
  },
  {
    title: "L'Agora",
    description:
      "La communauté : posts, likes et commentaires. Cliquez pour participer.",
  },
];

const { width, height: screenHeight } = Dimensions.get('window');
const SCROLL_OFFSET = 60;
const SPOTLIGHT_PADDING = 12;
const OVERLAY_DARK = 'rgba(0,0,0,0.65)';

export type SpotlightRect = { x: number; y: number; width: number; height: number };

interface HomeGuidedTourProps {
  onComplete?: () => void;
  forceShow?: boolean;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  sectionLayouts?: { y: number; height: number }[];
  /** Mesure la position écran de la section (pour spotlight) */
  getSectionRect?: (index: number) => Promise<SpotlightRect | null>;
}

const HomeGuidedTour: React.FC<HomeGuidedTourProps> = ({
  onComplete,
  forceShow = false,
  scrollViewRef,
  sectionLayouts = [],
  getSectionRect,
}) => {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const hasScrolledForStep = useRef<number | null>(null);

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      setStepIndex(0);
      hasScrolledForStep.current = null;
      return;
    }
    let mounted = true;
    const checkAndShow = async () => {
      try {
        const done = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted && !done) setVisible(true);
        else if (mounted && done && onComplete) onComplete();
      } catch {
        if (mounted) setVisible(true);
      }
    };
    checkAndShow();
    return () => {
      mounted = false;
    };
  }, [forceShow, onComplete]);

  /** Défilement dynamique puis mesure du spotlight */
  useEffect(() => {
    if (!visible || !scrollViewRef?.current || !sectionLayouts?.length) return;
    const layout = sectionLayouts[stepIndex];
    if (layout == null || hasScrolledForStep.current === stepIndex) return;
    hasScrolledForStep.current = stepIndex;
    const targetY = Math.max(0, layout.y - SCROLL_OFFSET);
    setSpotlightRect(null);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
      // Mesurer la section après le scroll pour le spotlight
      if (getSectionRect) {
        setTimeout(() => {
          getSectionRect(stepIndex).then((rect) => {
            if (rect) {
              const padded = {
                x: Math.max(0, rect.x - SPOTLIGHT_PADDING),
                y: Math.max(0, rect.y - SPOTLIGHT_PADDING),
                width: rect.width + SPOTLIGHT_PADDING * 2,
                height: rect.height + SPOTLIGHT_PADDING * 2,
              };
              setSpotlightRect(padded);
            } else {
              setSpotlightRect(null);
            }
          });
        }, 350);
      }
    }, 100);
  }, [visible, stepIndex, sectionLayouts, scrollViewRef, getSectionRect]);

  const handleNext = () => {
    if (stepIndex >= HOME_STEPS.length - 1) {
      handleFinish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setVisible(false);
    setStepIndex(0);
    setSpotlightRect(null);
    hasScrolledForStep.current = null;
    // Revenir en haut de l'accueil à la fin de la visite
    setTimeout(() => {
      scrollViewRef?.current?.scrollTo({ y: 0, animated: true });
    }, 50);
    onComplete?.();
  };

  const handleSkip = () => {
    handleFinish();
  };

  if (!visible) return null;

  const step = HOME_STEPS[stepIndex];
  const isLast = stepIndex === HOME_STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <StatusBar barStyle="light-content" />
      <Pressable style={styles.overlay} onPress={handleSkip}>
        {/* Overlay avec trou lumineux sur la section en cours */}
        {spotlightRect ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Haut */}
            <View style={[styles.spotlightPanel, { top: 0, left: 0, right: 0, height: spotlightRect.y }]} />
            {/* Gauche */}
            <View style={[styles.spotlightPanel, { top: spotlightRect.y, left: 0, width: spotlightRect.x, height: spotlightRect.height }]} />
            {/* Droite */}
            <View style={[styles.spotlightPanel, { top: spotlightRect.y, left: spotlightRect.x + spotlightRect.width, right: 0, height: spotlightRect.height }]} />
            {/* Bas */}
            <View style={[styles.spotlightPanel, { top: spotlightRect.y + spotlightRect.height, left: 0, right: 0, bottom: 0 }]} />
            {/* Bordure de la zone éclairée */}
            <View
              style={[
                styles.spotlightBorder,
                {
                  left: spotlightRect.x,
                  top: spotlightRect.y,
                  width: spotlightRect.width,
                  height: spotlightRect.height,
                },
              ]}
            />
          </View>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.spotlightFallback]} pointerEvents="none" />
        )}
        <Pressable style={[styles.card, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={styles.cardInner}>
            <View style={styles.header}>
              <Text style={styles.stepCounter}>
                {stepIndex + 1} / {HOME_STEPS.length}
              </Text>
              <TouchableOpacity
                hitSlop={12}
                onPress={handleSkip}
                style={styles.skipBtn}
              >
                <Text style={styles.skipText}>Passer</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
            <View style={styles.dots}>
              {HOME_STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === stepIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {isLast ? 'Terminer' : 'Suivant'}
              </Text>
              {!isLast && (
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  spotlightPanel: {
    position: 'absolute',
    backgroundColor: OVERLAY_DARK,
  },
  spotlightFallback: {
    backgroundColor: OVERLAY_DARK,
  },
  spotlightBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxWidth: width - 40,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardInner: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepCounter: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  skipBtn: {
    padding: 4,
  },
  skipText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HomeGuidedTour;
