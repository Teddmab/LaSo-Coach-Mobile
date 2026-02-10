import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  PanResponder,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { Notification } from '../types';
import { getNotificationIcon, formatNotificationTime, translateNotificationTitle, translateNotificationMessage } from '../utils/notificationUtils';

// ✅ Activer LayoutAnimation sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const icon = getNotificationIcon(notification.type);
  // ✅ Réinitialiser l'état d'expansion quand la notification change (pour éviter les problèmes d'ordre)
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasBeenExpanded, setHasBeenExpanded] = useState(false);
  const expandAnimation = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  
  // ✅ Réinitialiser l'animation quand la notification change (pour éviter les problèmes d'ordre après refresh)
  useEffect(() => {
    // Réinitialiser l'état d'expansion et l'animation quand la notification change
    setIsExpanded(false);
    setHasBeenExpanded(false);
    expandAnimation.setValue(0);
    pan.setValue({ x: 0, y: 0 });
  }, [notification.id]); // Seulement quand l'ID change (nouvelle notification ou refresh)

  // ✅ PanResponder pour détecter le swipe vers le bas
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isExpanded,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Détecter un swipe vers le bas (dy > 0 et significatif)
        // Permettre aussi un swipe vers le haut si déjà dévoilé
        if (isExpanded) {
          return Math.abs(gestureState.dy) > 10 && gestureState.dy < 0;
        }
        return Math.abs(gestureState.dy) > 10 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (isExpanded) {
          // Si dévoilé, permettre le swipe vers le haut pour fermer
          if (gestureState.dy < 0) {
            pan.setValue({ x: 0, y: gestureState.dy });
          }
        } else {
          // Si fermé, permettre le swipe vers le bas pour dévoiler
          if (gestureState.dy > 0) {
            pan.setValue({ x: 0, y: gestureState.dy });
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        
        if (isExpanded) {
          // Si dévoilé et swipe vers le haut suffisant, fermer
          if (gestureState.dy < -50) {
            handleCollapse();
          } else {
            // Sinon, revenir à la position initiale
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              tension: 50,
              friction: 7,
            }).start();
          }
        } else {
          // Si fermé et swipe vers le bas suffisant, dévoiler
          if (gestureState.dy > 50) {
            handleExpand();
          } else {
            // Sinon, revenir à la position initiale
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              tension: 50,
              friction: 7,
            }).start();
          }
        }
      },
    })
  ).current;

  const handleExpand = () => {
    if (isExpanded) return;
    
    setIsExpanded(true);
    setHasBeenExpanded(true);
    
    // ✅ Marquer comme lu automatiquement lors du dévoilement
    if (!notification.read) {
      onMarkAsRead();
    }
    
    // ✅ Animation de dévoilement avec LayoutAnimation désactivée pour éviter les problèmes d'ordre
    // Utiliser uniquement Animated pour un contrôle plus précis
    Animated.parallel([
      Animated.spring(expandAnimation, {
        toValue: 1,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  };

  const handleCollapse = () => {
    if (!isExpanded) return;
    
    setIsExpanded(false);
    
    // ✅ Pas de LayoutAnimation pour éviter les problèmes d'ordre
    Animated.spring(expandAnimation, {
      toValue: 0,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  };

  const getCategoryLabel = (): string => {
    switch (notification.type) {
      case 'content_assigned':
        return 'Contenu';
      case 'chat_message':
        return 'Message';
      case 'session':
        return 'Session';
      case 'payment':
        return 'Paiement';
      case 'system':
        return 'Système';
      default:
        return 'Notification';
    }
  };

  const contentOpacity = expandAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  const contentScale = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        !notification.read && styles.unread,
        {
          transform: [
            { translateY: pan.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
      // ✅ Important: Ne pas utiliser pointerEvents="box-none" pour maintenir l'ordre dans le flux
      collapsable={false}
    >
      {/* ✅ Carte fermée : Icône + Titre */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={isExpanded ? handleCollapse : handleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.icon}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>

        <View style={styles.headerContent}>
          <Text style={[
            styles.title,
            !notification.read && styles.unreadTitle,
          ]} numberOfLines={1}>
            {translateNotificationTitle(notification.title)}
          </Text>
          
          {!isExpanded && (
            <View style={styles.headerBadges}>
              {!notification.read && (
                <View style={styles.newBadge}>
                  <Text style={styles.newText}>Nouveau</Text>
                </View>
              )}
              <Text style={styles.timeCompact}>
                {formatNotificationTime(notification.createdAt)}
              </Text>
            </View>
          )}
        </View>

        {/* ✅ Indicateur de swipe avec animation */}
        {!hasBeenExpanded && (
          <View style={styles.swipeIndicator}>
            <Ionicons 
              name="chevron-down-outline" 
              size={18} 
              color={theme.colors.text.secondary} 
              style={styles.chevron}
            />
            <Text style={styles.swipeHint}>Tirer</Text>
          </View>
        )}
        
        {hasBeenExpanded && (
          <Animated.View
            style={{
              transform: [
                {
                  rotate: expandAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons 
              name="chevron-down-outline" 
              size={20} 
              color={theme.colors.text.secondary} 
              style={styles.chevron}
            />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* ✅ Contenu dévoilé avec animation */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.expandedContent,
            {
              opacity: contentOpacity,
              transform: [{ scale: contentScale }],
            },
          ]}
        >
          <View style={styles.badges}>
            <View style={[
              styles.categoryBadge,
              notification.type === 'content_assigned' && styles.contentBadge,
              notification.type === 'system' && styles.systemBadge,
              notification.type === 'chat_message' && styles.messageBadge,
              notification.type === 'session' && styles.sessionBadge,
              notification.type === 'payment' && styles.paymentBadge,
            ]}>
              <Text style={styles.categoryText}>{getCategoryLabel()}</Text>
            </View>
          </View>

          <Text style={styles.description}>
            {translateNotificationMessage(notification.message || notification.description)}
          </Text>

          <View style={styles.footer}>
            <Text style={styles.time}>
              {formatNotificationTime(notification.createdAt)}
            </Text>
            
            <View style={styles.actions}>
              {/* ✅ Remplacer "Supprimer" par l'icône de poubelle */}
              <TouchableOpacity
                style={styles.deleteIconButton}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onDelete();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    // ✅ Position relative pour maintenir l'ordre dans le flux
    position: 'relative',
    zIndex: 1,
  },
  unread: {
    backgroundColor: '#F0F7FF',
    borderColor: '#2196F3',
    borderWidth: 1.5,
  },
  // ✅ Header row (carte fermée)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 64,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#1976D2',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  newBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeCompact: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  chevron: {
    marginLeft: 8,
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  swipeHint: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  // ✅ Contenu dévoilé
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    backgroundColor: '#FAFAFA',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contentBadge: {
    backgroundColor: '#E8F5E9',
  },
  systemBadge: {
    backgroundColor: '#F3E5F5',
  },
  messageBadge: {
    backgroundColor: '#E3F2FD',
  },
  sessionBadge: {
    backgroundColor: '#FFF3E0',
  },
  paymentBadge: {
    backgroundColor: '#FFEBEE',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ✅ Bouton de suppression avec icône uniquement
  deleteIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
});

export default NotificationItem;

