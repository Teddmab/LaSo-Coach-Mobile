import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';

// Haptics is optional
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Haptics not available
}
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { theme } from '../../constants/theme';
import Toast from 'react-native-toast-message';
import { Meal } from '../../screens/nutrition/types';
import { mealTypeMap } from '../../screens/nutrition/utils/nutritionUtils';

interface MealDetailBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  meal: Meal | null;
  isCompleted: boolean;
  isCompleting: boolean;
  onComplete: () => Promise<void>;
  mealInteractions?: { [mealId: string]: 'like' | 'dislike' | null };
  onLike?: (mealId: string) => void;
  onDislike?: (mealId: string) => void;
  hasActiveSubscription?: boolean; // ✅ Pour masquer le bouton de complétion si pas d'abonnement
  selectedDate?: Date; // ✅ Date sélectionnée pour vérifier si on peut compléter (uniquement jour en cours)
}

const MealDetailBottomSheet: React.FC<MealDetailBottomSheetProps> = ({
  visible,
  onClose,
  meal,
  isCompleted,
  isCompleting,
  onComplete,
  mealInteractions = {},
  onLike,
  onDislike,
  hasActiveSubscription = true, // ✅ Par défaut true pour compatibilité
  selectedDate, // ✅ Date sélectionnée
}) => {
  const insets = useSafeAreaInsets();
  
  // ✅ Vérifier si la date sélectionnée est aujourd'hui
  const isToday = useMemo(() => {
    if (!selectedDate) return true; // Par défaut, permettre si pas de date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return today.getTime() === selected.getTime();
  }, [selectedDate]);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [youtubeModalTab, setYoutubeModalTab] = useState<'recipe' | 'ingredients'>('recipe');
  const [showVideoInHeader, setShowVideoInHeader] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;

  // ✅ Scrollbar custom (toujours visible)
  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(1);

  const isScrollable = contentHeight > scrollViewHeight + 1;
  const scrollableRange = Math.max(1, contentHeight - scrollViewHeight);
  const trackHeight = Math.max(1, scrollViewHeight);
  const minThumbHeight = 28;
  const thumbHeight = isScrollable
    ? Math.max(minThumbHeight, (scrollViewHeight * scrollViewHeight) / Math.max(1, contentHeight))
    : trackHeight;
  const maxThumbTranslate = Math.max(0, trackHeight - thumbHeight);
  const thumbTranslateY = isScrollable
    ? scrollY.interpolate({
        inputRange: [0, scrollableRange],
        // Quand on "descend" dans la liste (contentOffset.y augmente),
        // on veut que le thumb descende aussi.
        outputRange: [0, maxThumbTranslate],
        extrapolate: 'clamp',
      })
    : 0;

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeVideoId = meal?.youtubeUrl ? getYouTubeVideoId(meal.youtubeUrl) : null;

  // Reset tab when modal opens
  useEffect(() => {
    if (visible) {
      setYoutubeModalTab('recipe');
      setYoutubePlaying(false);
      setShowVideoInHeader(false); // Réinitialiser l'affichage vidéo
    }
  }, [visible]);

  // Animation du bouton vidéo clignotant
  useEffect(() => {
    if (youtubeVideoId && !showVideoInHeader) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(buttonPulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(buttonPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [youtubeVideoId, showVideoInHeader, buttonPulseAnim]);

  // Animation fluide lors du remplacement de l'image par la vidéo
  useEffect(() => {
    if (showVideoInHeader) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [showVideoInHeader, fadeAnim, scaleAnim]);

  const handleVideoButtonPress = () => {
    setShowVideoInHeader(true);
    setYoutubePlaying(true); // ✅ Lancer directement la vidéo
    if (__DEV__) {
      console.log('🎬 [MealDetailModal] Video button pressed, replacing image with video and launching immediately');
    }
  };

  if (!meal) {
    if (__DEV__) {
      console.warn('⚠️ [MealDetailModal] meal is null, modal will not render');
    }
    return null;
  }
  
  if (__DEV__) {
    console.log('✅ [MealDetailModal] Rendering modal', {
      visible,
      mealId: meal.id,
      mealName: meal.name,
      isCompleted,
      hasYoutubeUrl: !!meal.youtubeUrl,
    });
  }

  const mealType = mealTypeMap[meal.type] || mealTypeMap.breakfast;

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={20}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      >
        <View style={styles.overlay}>
          {/* Contenu : scrollable partout, ne doit pas déclencher la fermeture */}
          <View style={styles.contentContainer}>
            {/* Handle bar pour indiquer que c'est un bottomsheet */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            
            <View style={styles.content}>
            {/* Header avec grande image et badge */}
            <View style={styles.header}>
              {/* Image/Video container avec overlay badge + pouces + close */}
              <View style={styles.imageContainer}>
                {showVideoInHeader && youtubeVideoId ? (
                  <Animated.View
                    style={[
                      {
                        width: '100%',
                        height: '100%',
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                      },
                    ]}
                  >
                    <YoutubePlayer
                      height={220}
                      width={Dimensions.get('window').width}
                      videoId={youtubeVideoId}
                      play={youtubePlaying} // ✅ Démarre automatiquement car youtubePlaying est true
                      onChangeState={(event: string) => {
                        if (event === 'playing') {
                          setYoutubePlaying(true);
                        } else if (event === 'paused' || event === 'ended') {
                          setYoutubePlaying(false);
                        }
                      }}
                      onError={(error: any) => {
                        Toast.show({
                          type: 'error',
                          text1: 'Erreur',
                          text2: 'Impossible de charger la vidéo'
                        });
                      }}
                      webViewStyle={{ 
                        opacity: 0.99,
                        borderRadius: 0,
                      }}
                      initialPlayerParams={{
                        autoplay: true, // ✅ Autoplay activé
                      }}
                    />
                  </Animated.View>
                ) : (
                  <>
                    {meal.imageUrl ? (
                      <Image
                        source={{ uri: meal.imageUrl }}
                        style={styles.headerImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>🍽️</Text>
                      </View>
                    )}
                    
                    {/* Bouton vidéo clignotant si vidéo disponible */}
                    {youtubeVideoId && (
                      <TouchableOpacity
                        style={styles.videoButtonOverlay}
                        onPress={handleVideoButtonPress}
                        activeOpacity={0.8}
                      >
                        <Animated.View
                          style={[
                            styles.videoButtonBadge,
                            {
                              transform: [{ scale: buttonPulseAnim }],
                            },
                          ]}
                        >
                          <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                          <Text style={styles.videoButtonText}>Voir la vidéo</Text>
                        </Animated.View>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                
                {/* Overlay: Badge + Pouces à gauche, Close button à droite */}
                <View style={styles.imageOverlay}>
                  <View style={styles.headerLeftSection}>
                    {/* Badge type de repas */}
                    <View style={styles.mealTypeBadge}>
                      <Text style={styles.mealTypeIconBadge}>{mealType.icon}</Text>
                      <Text style={styles.mealTypeLabelBadge}>{mealType.title}</Text>
                    </View>
                    
                    {/* Pouces (like/dislike) juste après le badge */}
                    {(onLike || onDislike) && (
                      <View style={styles.interactionRow}>
                        {onLike && (
                          <TouchableOpacity 
                            style={[
                              styles.headerInteractionButton, 
                              mealInteractions[meal.id] === 'like' && styles.activeHeaderInteractionButton
                            ]}
                            onPress={() => onLike(meal.id)}
                          >
                            <Ionicons 
                              name={mealInteractions[meal.id] === 'like' ? "thumbs-up" : "thumbs-up-outline"} 
                              size={18} 
                              color={mealInteractions[meal.id] === 'like' ? '#1877F2' : '#8E8E93'} 
                            />
                          </TouchableOpacity>
                        )}
                        {onDislike && (
                          <TouchableOpacity 
                            style={[
                              styles.headerInteractionButton, 
                              mealInteractions[meal.id] === 'dislike' && styles.activeHeaderInteractionButton
                            ]}
                            onPress={() => onDislike(meal.id)}
                          >
                            <Ionicons 
                              name={mealInteractions[meal.id] === 'dislike' ? "thumbs-down" : "thumbs-down-outline"} 
                              size={18} 
                              color={mealInteractions[meal.id] === 'dislike' ? '#FF3B30' : '#8E8E93'} 
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                  
                  {/* Close button à droite */}
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                  >
                    <View style={styles.closeButtonCircle}>
                      <Ionicons name="close" size={20} color={theme.colors.text.primary} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Nom du plat en dessous de l'image */}
              <View style={styles.nameRow}>
                <Text style={styles.title} numberOfLines={2}>
                  {meal.name || 'Détails du repas'}
                </Text>
              </View>
            </View>
            
            {/* ✅ Contenu avec tabs (Recette et Ingrédients) */}
            <View style={styles.bodyContainer}>
              {/* Navigation Tabs - Fixes, ne scrollent pas */}
              <View style={styles.tabsContainer}>
                <View style={styles.tabs}>
                  <TouchableOpacity 
                    style={[styles.tab, youtubeModalTab === 'recipe' && styles.activeTab]}
                    onPress={() => setYoutubeModalTab('recipe')}
                  >
                    <Ionicons 
                      name="restaurant" 
                      size={20} 
                      color={youtubeModalTab === 'recipe' ? "#000000" : "#666666"} 
                    />
                    <Text style={[styles.tabTitle, youtubeModalTab === 'recipe' && styles.activeTabText]}>
                      Recette
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.tab, youtubeModalTab === 'ingredients' && styles.activeTab]}
                    onPress={() => setYoutubeModalTab('ingredients')}
                  >
                    <Ionicons 
                      name="list" 
                      size={20} 
                      color={youtubeModalTab === 'ingredients' ? "#000000" : "#666666"} 
                    />
                    <Text style={[styles.tabTitle, youtubeModalTab === 'ingredients' && styles.activeTabText]}>
                      Ingrédients
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Tab Content - ScrollView pour le contenu uniquement */}
              <View
                style={styles.tabScrollWrapper}
                onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
              >
                <Animated.ScrollView
                  style={styles.tabScrollView}
                  contentContainerStyle={styles.tabContentContainer}
                  // On cache la scrollbar native (variable selon OS) car on affiche la nôtre (toujours visible)
                  showsVerticalScrollIndicator={false}
                  indicatorStyle={Platform.OS === 'ios' ? 'black' : 'default'}
                  nestedScrollEnabled={Platform.OS === 'android'}
                  bounces={Platform.OS === 'ios'}
                  scrollEnabled={true}
                  alwaysBounceVertical={false}
                  keyboardShouldPersistTaps="handled"
                  removeClippedSubviews={false}
                  scrollEventThrottle={16}
                  directionalLockEnabled={true}
                  overScrollMode={Platform.OS === 'android' ? 'always' : undefined}
                  decelerationRate="normal"
                  canCancelContentTouches={false}
                  fadingEdgeLength={0}
                  onContentSizeChange={(_, h) => setContentHeight(Math.max(1, h))}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                  )}
                >
                  {(() => {
                    if (youtubeModalTab === 'recipe') {
                      // Recette Content
                      return (
                        <>
                          <Text style={styles.contentTitle}>Recette</Text>
                          {meal.instructions && meal.instructions.length > 0 ? (
                            (() => {
                              let instructions: string[] = [];
                              if (Array.isArray(meal.instructions)) {
                                instructions = meal.instructions;
                              } else if (typeof meal.instructions === 'string') {
                                try {
                                  const parsed = JSON.parse(meal.instructions);
                                  instructions = Array.isArray(parsed) ? parsed : [meal.instructions];
                                } catch (e) {
                                  instructions = [meal.instructions];
                                }
                              }
                              return instructions.map((instruction: string, index: number) => (
                                <Text key={index} style={styles.recipeStep}>
                                  {index + 1}. {instruction}
                                </Text>
                              ));
                            })()
                          ) : (
                            <Text style={styles.noContentText}>
                              Aucune recette disponible pour ce repas
                            </Text>
                          )}
                        </>
                      );
                    } else {
                      // Ingredients Content
                      return (
                        <>
                          <Text style={styles.contentTitle}>Liste des ingrédients</Text>
                          {(() => {
                            let ingredients = meal.ingredients;
                            if (typeof ingredients === 'string') {
                              try {
                                ingredients = JSON.parse(ingredients);
                              } catch (e) {
                                ingredients = [];
                              }
                            }

                            return ingredients && ingredients.length > 0 ? (
                              ingredients.map((ingredient: any, index: number) => {
                                const ingredientName = typeof ingredient === 'string' ? ingredient : (ingredient.name || ingredient);
                                const ingredientAmount = ingredient.amount;
                                const ingredientUnit = ingredient.unit;

                                return (
                                  <View key={index} style={styles.ingredientItem}>
                                    <Text style={styles.ingredientNumber}>{index + 1}.</Text>
                                    <View style={styles.ingredientDetails}>
                                      <Text style={styles.ingredientText}>
                                        {ingredientName}
                                      </Text>
                                      {ingredientAmount && ingredientUnit && (
                                        <Text style={styles.ingredientAmount}>
                                          – {ingredientAmount} {ingredientUnit}
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                );
                              })
                            ) : (
                              <Text style={styles.noContentText}>
                                Aucun ingrédient disponible pour ce repas
                              </Text>
                            );
                          })()}
                        </>
                      );
                    }
                  })()}
                </Animated.ScrollView>

                {/* Scrollbar custom (toujours visible) */}
                <View pointerEvents="none" style={styles.customScrollbarTrack}>
                  <Animated.View
                    style={[
                      styles.customScrollbarThumb,
                      {
                        height: thumbHeight,
                        transform: [{ translateY: thumbTranslateY as any }],
                        opacity: isScrollable ? 1 : 0,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
            
            {/* Footer fixe avec bouton de complétion et logo LaSo (baissé) */}
            {/* ✅ Afficher le bouton de complétion uniquement si l'utilisateur a un abonnement actif ET si c'est aujourd'hui */}
            {hasActiveSubscription && isToday && (
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <TouchableOpacity
                  style={[
                    styles.completeButton, 
                    isCompleted && styles.completeButtonCompleted,
                    (isCompleting || isCompleted) && styles.completeButtonDisabled
                  ]}
                  onPress={async () => {
                  if (isCompleted) {
                    // ✅ Ne plus afficher de Toast, le bouton est désactivé
                    return;
                  }
                  
                  if (isCompleting) return;
                  
                  // ✅ Vibration progressive avec dégradation
                  if (Haptics) {
                    // Vibration initiale forte
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    
                    // Puis vibrations progressives avec dégradation
                    for (let i = 1; i < 5; i++) {
                      setTimeout(() => {
                        // Dégradation progressive : Medium -> Light -> Light
                        const intensity = i < 2 
                          ? Haptics.ImpactFeedbackStyle.Medium 
                          : Haptics.ImpactFeedbackStyle.Light;
                        Haptics.impactAsync(intensity);
                      }, i * 60); // Délai progressif
                    }
                  } else if (Platform.OS === 'android') {
                    // Fallback pour Android - vibration progressive
                    const { Vibration } = require('react-native');
                    Vibration.vibrate(120); // Vibration initiale plus longue
                    
                    // Vibrations progressives avec dégradation
                    for (let i = 1; i < 5; i++) {
                      setTimeout(() => {
                        const duration = i < 2 ? 80 - (i * 5) : 60 - (i * 3); // Dégradation progressive
                        Vibration.vibrate(Math.max(30, duration)); // Minimum 30ms
                      }, i * 60);
                    }
                  }
                  
                  try {
                    await onComplete();
                  } catch (error: any) {
                    console.error('❌ [MealDetailModal] Erreur lors de la complétion:', error);
                    Toast.show({
                      type: 'error',
                      text1: 'Erreur',
                      text2: error?.message || 'Impossible de compléter le repas',
                      visibilityTime: 3000,
                    });
                  }
                }}
                disabled={isCompleted || isCompleting}
              >
                {isCompleting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.completeButtonText}>
                      Traitement en cours...
                    </Text>
                  </>
                ) : isCompleted ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.completeButtonText}>
                      Ce repas est complété
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.completeButtonText}>
                      Compléter ce repas
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              </View>
            )}
            
            {/* Logo LaSo en bas (baissé) - Toujours visible */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </View>
    </BlurView>
    </Modal>

    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    width: '100%',
    height: '88%', // Augmenté pour lever le bottomsheet et avoir plus de vue sur le contenu
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'column',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  videoButtonOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
  },
  videoButtonBadge: {
    backgroundColor: '#FF0000', // ✅ Rouge YouTube
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  imageContainer: {
    width: '100%',
    height: 220, // Grande image bien présentée
    position: 'relative',
    marginBottom: 16,
    borderRadius: 16, // Border radius pour l'image
    overflow: 'hidden',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    zIndex: 10,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 16, // Border radius pour l'image
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16, // Border radius pour le placeholder
  },
  placeholderText: {
    fontSize: 64,
    color: '#CCCCCC',
  },
  closeButton: {
    // Bouton dans l'overlay
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mealTypeIconBadge: {
    fontSize: 18,
  },
  mealTypeLabelBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  interactionRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  headerInteractionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    paddingHorizontal: 16,
    marginBottom: 8, // Réduit pour avoir plus d'espace pour le contenu
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    lineHeight: 26,
    textAlign: 'center',
  },
  activeHeaderInteractionButton: {
    backgroundColor: '#E3F2FD',
  },
  bodyContainer: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0, // ✅ Important pour permettre au ScrollView de prendre l'espace disponible
  },
  body: {
    flex: 1,
    minHeight: 0, // Important pour permettre le scroll dans les ScrollView imbriqués
    maxHeight: '100%', // ✅ Limiter la hauteur maximale
  },
  bodyContent: {
    padding: 0, // Pas de padding global, chaque section a son propre padding
    paddingBottom: 24, // Ajouté pour s'assurer que tout le contenu est scrollable jusqu'en bas
    flexGrow: 1,
  },
  youtubePlayerContainer: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    zIndex: 5, // Pour rester au-dessus du contenu scrollable
  },
  tabs: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#000000',
  },
  tabScrollView: {
    flex: 1, // ✅ Prendre tout l'espace disponible entre les tabs et le footer
    minHeight: 0, // ✅ Important pour permettre le scroll correctement
    width: '100%', // ✅ S'assurer que la largeur est complète
  },
  tabScrollWrapper: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  customScrollbarTrack: {
    position: 'absolute',
    top: 0,
    right: 6,
    bottom: 0,
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  customScrollbarThumb: {
    width: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tabContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40, // ✅ Augmenté pour s'assurer que tout le contenu est visible et scrollable
    flexGrow: 1, // ✅ Permettre au contenu de grandir si nécessaire
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  recipeStep: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ingredientNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  ingredientDetails: {
    flex: 1,
  },
  ingredientText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  ingredientAmount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  noContentText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: -40,
    paddingTop:4,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary, // Vert pour "Compléter ce repas"
    paddingVertical: 12, // Réduit de 14 à 12
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    marginBottom: 4, // Réduit de 8 à 4 pour rapprocher du logo
  },
  completeButtonCompleted: {
    backgroundColor: '#FFA500', // Orange pour "Ce repas est complété"
  },
  completeButtonDisabled: {
    opacity: 0.7, // ✅ Légèrement plus visible pour le bouton complété (orange)
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2, // Réduit
    paddingBottom: 2, // Réduit
  },
  logo: {
    width: 60,
    height: 30,
    opacity: 0.7,
  },
  // ✅ Styles pour le choix entre Recette et Ingrédients
  choiceContainer: {
    padding: 20,
    gap: 16,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  choiceButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
  },
  choiceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  choiceButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  // ✅ Styles pour le bottom sheet de contenu
  contentModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentBottomSheetContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20, // ✅ Élévation plus élevée pour être au-dessus du premier bottom sheet
    zIndex: 10001, // ✅ Z-index élevé pour être au-dessus
  },
  contentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  contentModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  contentModalCloseButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  contentModalScrollView: {
    flex: 1,
    maxHeight: Dimensions.get('window').height * 0.6,
    minHeight: 200, // ✅ Hauteur minimale pour garantir une zone de scroll touchable
  },
  contentModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  contentModalStep: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  contentModalStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  contentModalStepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contentModalStepText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  contentModalIngredientItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  contentModalIngredientNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  contentModalIngredientNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  contentModalIngredientDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentModalIngredientText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  contentModalIngredientAmount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 12,
  },
  contentModalNoContent: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 40,
  },
});

export default MealDetailBottomSheet;

