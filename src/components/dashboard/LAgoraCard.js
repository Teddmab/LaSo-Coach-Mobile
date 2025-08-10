import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import AgoraIcon from '../icons/AgoraIcon';

const LAgoraCard = ({ posts, loading, onPostPress, onLikePress, onCommentPress }) => {
  const renderPost = (post, index) => (
    <TouchableOpacity 
      key={post.id} 
      style={styles.postCard}
      onPress={() => onPostPress?.(post)}
    >
      {/* User Info */}
      <View style={styles.userInfo}>
        <Image 
          source={{ uri: post.user?.avatar || 'https://via.placeholder.com/40' }} 
          style={styles.userAvatar}
        />
        <Text style={styles.userName} numberOfLines={1}>
          {post.user?.firstName || 'Utilisateur'}
        </Text>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent} numberOfLines={3}>
        {post.content}
      </Text>

      {/* Post Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <Image 
          source={{ uri: post.mediaUrls[0] }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Engagement */}
      <View style={styles.engagement}>
        <TouchableOpacity 
          style={styles.engagementItem}
          onPress={() => onLikePress?.(post.id)}
        >
          <Ionicons 
            name="thumbs-up" 
            size={16} 
            color={post._count?.likes > 0 ? theme.colors.primary : theme.colors.text.secondary} 
          />
          <Text style={styles.engagementText}>{post._count?.likes || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.engagementItem}
          onPress={() => onCommentPress?.(post.id)}
        >
          <Ionicons 
            name="chatbubble-outline" 
            size={16} 
            color={theme.colors.text.secondary} 
          />
          <Text style={styles.engagementText}>{post._count?.comments || 0}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AgoraIcon width={20} height={20} />
          <Text style={styles.title}>L'Agora</Text>
        </View>
        <Text style={styles.subtitle}>Glisser pour voir plus de posts populaires</Text>
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="chevron-back" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.postsContainer}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des posts...</Text>
          </View>
        ) : posts && posts.length > 0 ? (
          posts.map((post, index) => renderPost(post, index))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>Aucun post disponible</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    flex: 1,
    marginLeft: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postsContainer: {
    paddingRight: 20,
  },
  postCard: {
    width: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  postContent: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  engagement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: 200,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: 200,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
});

export default LAgoraCard; 