import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import Avatar from '../../../components/Avatar';
import { Post } from '../types';
import { formatTimeAgo } from '../utils/communityUtils';
import ImageCarousel from './ImageCarousel';

// Haptics is optional
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Haptics not available
}

interface PostCardProps {
  post: Post;
  currentUserId?: string | number | null;
  isLiked: boolean;
  showComments: boolean;
  comments: any[];
  loadingComments: boolean;
  commentText: string;
  onLike: (postId: string) => void;
  onCommentIconPress: (postId: string) => void;
  onCommentTextChange?: (postId: string, text: string) => void;
  onCommentSubmit: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport?: (postId: string) => void;
  onBlockUser?: (userId: string, userName: string) => void;
  onPostPress?: (post: Post) => void;
  isLast?: boolean; // Pour retirer la bordure du dernier post
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  isLiked,
  showComments,
  comments,
  loadingComments,
  commentText,
  onLike,
  onCommentIconPress,
  onCommentTextChange,
  onCommentSubmit,
  onShare,
  onReport,
  onBlockUser,
  onPostPress,
  isLast = false,
}) => {
  const authorName = post.user?.firstName || post.user?.name || 'Utilisateur';
  const authorAvatar = post.user?.avatar || '';
  const postContent = post.content || '';
  // Le backend retourne mediaUrls qui est un tableau de strings
  // Adapter comme dans la version web qui utilise post.mediaUrls
  const images = post.mediaUrls || [];
  // Utiliser _count.likes si disponible, sinon utiliser la longueur du tableau likes comme fallback
  const likesCount = Number(
    post._count?.likes !== undefined && post._count.likes !== null
      ? post._count.likes
      : (post.likes?.length ?? 0)
  );
  // Utiliser _count.comments si disponible, sinon utiliser la longueur du tableau comments comme fallback
  const commentsCount = Number(
    post._count?.comments !== undefined && post._count.comments !== null
      ? post._count.comments
      : (post.comments?.length ?? 0)
  );
  const timeAgo = formatTimeAgo(post.createdAt);
  const [showMenu, setShowMenu] = useState(false);
  const postUserId = post.userId || post.user?.id;
  const isOwnPost = postUserId && currentUserId && String(postUserId) === String(currentUserId);
  
  // ✅ Animation des cœurs flottants sur l'ensemble de la publication
  const hearts = useRef<Array<{
    id: number;
    translateY: Animated.Value;
    translateX: Animated.Value;
    opacity: Animated.Value;
    scale: Animated.Value;
    startX: number;
    startY: number;
  }>>([]);
  const heartIdCounter = useRef(0);
  const [activeHearts, setActiveHearts] = useState<number[]>([]);
  const postContainerRef = useRef<View>(null);
  const [postLayout, setPostLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleMorePress = () => {
    if (isOwnPost) {
      // Si c'est son propre post, seulement signaler
      if (onReport) {
        onReport(post.id);
      }
    } else {
      // Menu pour les posts des autres
      Alert.alert(
        'Options',
        '',
        [
          {
            text: 'Signaler',
            onPress: () => {
              if (onReport) {
                onReport(post.id);
              }
            },
          },
          {
            text: 'Bloquer l\'utilisateur',
            style: 'destructive',
            onPress: () => {
              if (onBlockUser && postUserId) {
                onBlockUser(String(postUserId), authorName);
              }
            },
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  // ✅ Animation des cœurs flottants sur l'ensemble de la publication
  const createFloatingHeart = () => {
    if (!postLayout) return; // Attendre que le layout soit disponible
    
    const heartId = heartIdCounter.current++;
    const translateY = new Animated.Value(0);
    const translateX = new Animated.Value(0);
    const opacity = new Animated.Value(1);
    const scale = new Animated.Value(0.3);

    // ✅ Position de départ aléatoire sur toute la publication
    const startX = Math.random() * postLayout.width; // 0 à width
    const startY = Math.random() * postLayout.height; // 0 à height
    
    // ✅ Direction de flottement aléatoire (vers le haut avec légère dispersion)
    const randomX = (Math.random() - 0.5) * 80; // -40 à +40
    const randomY = -100 - Math.random() * 60; // -100 à -160

    hearts.current.push({
      id: heartId,
      translateY,
      translateX,
      opacity,
      scale,
      startX,
      startY,
    });

    setActiveHearts(prev => [...prev, heartId]);

    // Animation combinée
    Animated.parallel([
      // Translation vers le haut avec légère dispersion horizontale
      Animated.timing(translateY, {
        toValue: randomY,
        duration: 1500 + Math.random() * 500, // 1500 à 2000ms pour varier
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: randomX,
        duration: 1500 + Math.random() * 500,
        useNativeDriver: true,
      }),
      // Opacité (fade out)
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1500 + Math.random() * 500,
        useNativeDriver: true,
      }),
      // Scale (grandir puis rétrécir)
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.2,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Nettoyer après l'animation
      hearts.current = hearts.current.filter(h => h.id !== heartId);
      setActiveHearts(prev => prev.filter(id => id !== heartId));
    });
  };

  const handleLikePress = () => {
    // ✅ Vérifier si c'est un like (isLiked devient true) ou un dislike (isLiked devient false)
    const willBeLiked = !isLiked;
    
    // ✅ Vibration progressive avec dégradation seulement lors d'un like
    if (willBeLiked) {
      const heartCount = 8 + Math.floor(Math.random() * 5); // 8 à 12 cœurs
      
      // ✅ Vibration progressive : forte au début, puis dégradation
      if (Haptics) {
        // Vibration initiale forte
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Puis vibrations progressives avec dégradation
        for (let i = 1; i < Math.min(heartCount, 5); i++) {
          setTimeout(() => {
            const intensity = Haptics.ImpactFeedbackStyle.Light; // Dégradation vers léger
            Haptics.impactAsync(intensity);
          }, i * 80); // Délai progressif
        }
      } else if (Platform.OS === 'android') {
        // Fallback pour Android - vibration progressive
        const { Vibration } = require('react-native');
        Vibration.vibrate(100); // Vibration initiale plus longue
        
        // Vibrations progressives avec dégradation
        for (let i = 1; i < Math.min(heartCount, 5); i++) {
          setTimeout(() => {
            Vibration.vibrate(50 - (i * 5)); // Dégradation : 50ms, 45ms, 40ms, etc.
          }, i * 80);
        }
      }

      // ✅ Créer 8-12 cœurs flottants sur toute la publication avec délai seulement lors d'un like
      for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
          createFloatingHeart();
        }, i * 30); // Délai entre chaque cœur
      }
    }
    // ✅ Si c'est un dislike, AUCUNE animation, AUCUNE vibration, juste retirer le cœur rouge

    // ✅ Appeler la fonction onLike originale
    onLike(post.id);
  };

  return (
    <View 
      ref={postContainerRef}
      style={[styles.container, isLast && styles.containerLast]}
      onLayout={() => {
        // ✅ Obtenir la position et taille du container du post
        setTimeout(() => {
          postContainerRef.current?.measureInWindow((x, y, width, height) => {
            setPostLayout({ x, y, width, height });
          });
        }, 50);
      }}
    >
      {/* Post Header - Style Instagram */}
      <View style={styles.header}>
        <Avatar 
          source={{ uri: authorAvatar }} 
          size={32}
          style={styles.avatar}
          fallbackText={authorName?.charAt(0) || 'U'}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{authorName}</Text>
        </View>
        <Text style={styles.postTime}>{timeAgo || 'Maintenant'}</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={handleMorePress}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Post Image - Style Instagram (pleine largeur) */}
      {images.length > 0 && (
        <ImageCarousel 
          postId={post.id} 
          images={images}
          onImagePress={(index) => onPostPress && onPostPress({ ...post, selectedImageIndex: index })}
        />
      )}

      {/* Post Content - Afficher le texte AVANT les actions si pas d'images */}
      {postContent && images.length === 0 && (
        <View style={styles.content}>
          <Text style={styles.postText}>
            <Text style={styles.authorNameInline}>{authorName} </Text>
            {postContent}
          </Text>
        </View>
      )}

      {/* Post Actions - Style Instagram (icônes avec compteurs) */}
      <View style={styles.actions} ref={(ref) => {
        if (ref) {
          ref.measureInWindow((x, y, width, height) => {
            // Mesurer la position du container actions dans la fenêtre
          });
        }
      }}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={handleLikePress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#F44336" : "#000000"} 
            />
            {likesCount > 0 && (
              <Text style={styles.actionCount}>{likesCount}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={() => onCommentIconPress(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#000000" />
            {commentsCount > 0 ? (
              <Text style={styles.actionCount}>{commentsCount}</Text>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Content - Afficher le texte APRÈS les actions si il y a des images */}
      {postContent && images.length > 0 && (
        <View style={styles.content}>
          <Text style={styles.postText}>
            <Text style={styles.authorNameInline}>{authorName} </Text>
            {postContent}
          </Text>
        </View>
      )}

      {/* ✅ Cœurs flottants - Sur l'ensemble de la publication */}
      {activeHearts.map((heartId) => {
        const heart = hearts.current.find(h => h.id === heartId);
        if (!heart || !postLayout) return null;
        
        return (
          <Animated.View
            key={heartId}
            style={[
              styles.floatingHeart,
              {
                // ✅ Position de départ aléatoire sur toute la publication
                top: postLayout.y + heart.startY - 10, // -10 pour centrer l'icône
                left: postLayout.x + heart.startX - 10, // -10 pour centrer l'icône
                transform: [
                  { translateY: heart.translateY },
                  { translateX: heart.translateX },
                  { scale: heart.scale },
                ],
                opacity: heart.opacity,
              },
            ]}
            pointerEvents="none"
          >
            <Ionicons name="heart" size={20} color="#F44336" />
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    marginBottom: 0, // Pas d'espacement entre les posts
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB', // Ligne de séparation subtile entre les posts (style Instagram)
    paddingBottom: 0, // Pas de padding supplémentaire
    overflow: 'visible', // Pour permettre aux cœurs de flotter en dehors
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  authorNameInline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  postTime: {
    fontSize: 12,
    color: '#8E8E8E',
    marginRight: 8,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  postText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 6,
    position: 'relative',
    overflow: 'visible',
  },
  actionCount: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
  },
  containerLast: {
    borderBottomWidth: 0, // Pas de bordure pour le dernier post
  },
  floatingHeart: {
    position: 'absolute',
    marginTop: -10,
    marginLeft: -10,
    zIndex: 1000,
    elevation: 1000, // Pour Android
  },
});

export default PostCard;

