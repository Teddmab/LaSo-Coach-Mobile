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
    
    const uniqueAvatars = [];
    const seenUserIds = new Set();
    
    for (const post of posts) {
      const userId = post.user?.id || post.userId;
      const avatar = post.user?.avatar;
      
      if (userId && avatar && !seenUserIds.has(userId) && uniqueAvatars.length < 5) {
        uniqueAvatars.push(avatar);
        seenUserIds.add(userId);
      }
    }
    
    return uniqueAvatars;
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ShimmerCard />
          </View>
        ) : (
          <>
            {/* Grande icône de bulle de conversation avec effet de fond */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <LottieView
                  source={require('../../../assets/artychat.json')}
                  style={styles.chatAnimation}
                  autoPlay
                  loop
                />
              </View>
            </View>

            {/* Photos de profil empilées (max 5) */}
            {userAvatars.length > 0 ? (
              <View style={styles.avatarsContainer}>
                {userAvatars.map((avatar, index) => (
                  <Image
                    key={index}
                    source={{ uri: avatar }}
                    style={styles.avatar}
                  />
                ))}
                {posts && posts.length > 5 && (
                  <View style={styles.moreAvatars}>
                    <Text style={styles.moreAvatarsText}>+{posts.length - 5}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.emptyText}>Rejoignez la communauté</Text>
            )}
          </>
        )}
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
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8, // Espacement entre les avatars alignés
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    backgroundColor: '#F0F0F0',
  },
  moreAvatars: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreAvatarsText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});

export default LAgoraCard; 