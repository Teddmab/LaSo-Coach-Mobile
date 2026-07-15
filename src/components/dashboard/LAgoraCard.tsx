import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { theme } from '../../constants/theme';
import AgoraIcon from '../icons/AgoraIcon';
import { ShimmerCard } from '../Shimmer';

interface LAgoraCardProps {
  posts?: any[];
  loading?: boolean;
  onPostPress?: (post: any) => void;
  onLikePress?: (postId: string) => void;
  onCommentPress?: (postId: string) => void;
}

const LAgoraCard: React.FC<LAgoraCardProps> = ({ posts, loading, onPostPress, onLikePress, onCommentPress }) => {
  // Extraire les photos de profil uniques des utilisateurs qui ont posté (max 5)
  const userAvatars = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    const uniqueAvatars: any[] = [];
    const seenUserIds = new Set();
    
    if (__DEV__) {
      console.log('🔍 [LAgoraCard] Posts data:', {
        postsCount: posts.length,
        firstPost: posts[0] ? {
          id: posts[0].id,
          userId: posts[0].userId,
          user: posts[0].user,
          hasUser: !!posts[0].user,
          userKeys: posts[0].user ? Object.keys(posts[0].user) : [],
        } : null,
      });
    }
    
    for (const post of posts) {
      // ✅ Gérer les deux formats : user (minuscule) et User (majuscule)
      const userData = post.user || post.User || {};
      const userId = userData.id || post.userId || post.authorId || post.createdBy;
      
      // ✅ Vérifier plusieurs chemins possibles pour l'avatar
      const avatar = userData.avatar || userData.profilePicture || userData.imageUrl || userData.avatarUrl;
      
      // Ne pas logger si le post n'a simplement pas d'avatar (c'est normal pour certains utilisateurs)
      // Seulement logger si le post a un userId mais pas d'objet user du tout
      if (__DEV__ && post.userId && !post.user && !post.User) {
        console.warn('⚠️ [LAgoraCard] Post without user object:', {
          postId: post.id,
          userId: post.userId,
          hasUser: !!post.user,
          hasUserCapital: !!post.User,
        });
      }
      
      if (userId && avatar && !seenUserIds.has(userId) && uniqueAvatars.length < 5) {
        uniqueAvatars.push({
          id: userId,
          avatar: avatar
        });
        seenUserIds.add(userId);
      }
    }
    
    if (__DEV__) {
      console.log('✅ [LAgoraCard] Extracted avatars:', {
        count: uniqueAvatars.length,
        avatars: uniqueAvatars.map(a => a.avatar),
      });
    }
    
    // ✅ Retourner seulement les URLs des avatars pour l'affichage
    return uniqueAvatars.map(item => item.avatar);
  }, [posts]);

  const handleCardPress = () => {
    // Toujours rediriger vers l'écran Agora (Community)
    // Si un post existe, on le passe pour pré-sélection, sinon on passe null
    if (onPostPress) {
      if (posts && posts.length > 0) {
        onPostPress(posts[0]);
      } else {
        // Naviguer vers Community même sans posts
        onPostPress(null);
      }
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}>
            <AgoraIcon width={24} height={24} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>L'Agora</Text>
            <Text style={styles.subtitle}>Espace d'échange</Text>
          </View>
        </View>
        <Ionicons name="arrow-forward-circle" size={24} color={theme.colors.primary} />
      </View>

      {/* Body - Grande icône de conversation avec photos de profil empilées */}
      <View style={styles.body}>
        {/* Grande icône de bulle de conversation avec effet de fond */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            {loading ? (
              <ShimmerCard />
            ) : (
              <LottieView
                source={require('../../../assets/artychat.json')}
                style={styles.chatAnimation}
                autoPlay
                loop
              />
            )}
          </View>
        </View>

        {/* Photos de profil empilées (max 5) - Toujours afficher en bas */}
        <View style={styles.avatarsSection}>
          <Text style={styles.joinText}>Rejoignez la communauté</Text>
          {loading ? (
            <View style={styles.placeholderAvatars}>
              <View style={styles.placeholderAvatar} />
              <View style={styles.placeholderAvatar} />
              <View style={styles.placeholderAvatar} />
            </View>
          ) : userAvatars.length > 0 ? (
            <View style={styles.avatarsContainer}>
              {userAvatars.map((avatar, index) => (
                <Image
                  key={index}
                  source={{ uri: avatar }}
                  style={[
                    styles.avatar,
                    { marginLeft: index > 0 ? -12 : 0 } // Empiler les avatars avec chevauchement
                  ]}
                />
              ))}
              {posts && posts.length > 5 && (
                <View style={[styles.moreAvatars, { marginLeft: -12 }]}>
                  <Text style={styles.moreAvatarsText}>+{posts.length - 5}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderAvatars}>
              <View style={styles.placeholderAvatar} />
              <View style={styles.placeholderAvatar} />
              <View style={styles.placeholderAvatar} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 40, // Augmenté pour soulever et voir la fin
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15', // 15% d'opacité
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.primary + '10', // 10% d'opacité pour un effet subtil
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chatAnimation: {
    width: 160,
    height: 160,
  },
  avatarsSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  joinText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#F0F0F0',
  },
  moreAvatars: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAvatarsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  placeholderAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});

export default LAgoraCard; 