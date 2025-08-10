import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const CommunityScreen = ({ user, onLogout, onTabPress, activeTab, onClose, selectedPostId, onPostPress }) => {
  const [commentText, setCommentText] = useState('');
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const scrollViewRef = useRef(null);

  const posts = [
    {
      id: '940e613a-92ef-4401-aa71-209100dcf28f', // This matches the post ID from your log
      author: {
        name: 'Teddy Tresor',
        avatar: user?.avatar || 'https://via.placeholder.com/40',
        timeAgo: 'il y a environ 14 heures'
      },
      content: {
        text: 'Pourquoi c est si dure',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face'
      },
      stats: {
        likes: 0,
        comments: 1,
        shares: 0
      },
      isLiked: false
    },
    {
      id: '2',
      author: {
        name: 'Marie Dupont',
        avatar: 'https://via.placeholder.com/40',
        timeAgo: 'il y a 2 heures'
      },
      content: {
        text: 'Super progression aujourd\'hui ! 💪',
        image: null
      },
      stats: {
        likes: 5,
        comments: 2,
        shares: 1
      },
      isLiked: true
    },
    {
      id: '3',
      author: {
        name: 'Jean Martin',
        avatar: 'https://via.placeholder.com/40',
        timeAgo: 'il y a 5 heures'
      },
      content: {
        text: 'Nouvelle recette testée, c\'était délicieux ! 🍽️',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
      },
      stats: {
        likes: 12,
        comments: 4,
        shares: 2
      },
      isLiked: false
    }
  ];

  // Scroll to selected post when component mounts
  useEffect(() => {
    if (selectedPostId && scrollViewRef.current) {
      const selectedPostIndex = posts.findIndex(post => post.id === selectedPostId);
      if (selectedPostIndex !== -1) {
        // Add a small delay to ensure the component is fully rendered
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: selectedPostIndex * 300, // Approximate height per post
            animated: true
          });
          console.log('📱 CommunityScreen: Scrolled to selected post:', selectedPostId);
        }, 500);
      }
    }
  }, [selectedPostId]);

  const handleLike = (postId) => {
    console.log('Liked post:', postId);
    // Here you would typically update the like status
  };

  const handleComment = (postId) => {
    if (commentText.trim()) {
      console.log('Adding comment to post:', postId, 'Comment:', commentText);
      setCommentText('');
    }
  };

  const handleShare = (postId) => {
    console.log('Shared post:', postId);
  };

  const handleCreatePost = () => {
    setShowCreatePostModal(true);
  };

  const handleCloseCreatePost = () => {
    setShowCreatePostModal(false);
    setNewPostText('');
  };

  const handlePublishPost = () => {
    if (newPostText.trim()) {
      console.log('Publishing new post:', newPostText);
      // Here you would typically send the post to your backend
      Alert.alert('Succès', 'Votre post a été publié!');
      handleCloseCreatePost();
    } else {
      Alert.alert('Erreur', 'Veuillez saisir du contenu pour votre post.');
    }
  };

  const handleAddImage = () => {
    console.log('Add image to post');
    // Here you would typically open image picker
    Alert.alert('Bientôt disponible', 'La fonctionnalité d\'ajout d\'image sera bientôt disponible.');
  };

  const handlePostPress = (post) => {
    console.log('📱 CommunityScreen: Post pressed:', post.id);
    if (onPostPress) {
      onPostPress(post);
    }
  };

  const renderPost = (post) => (
    <View key={post.id} style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Image source={{ uri: post.author.avatar }} style={styles.authorAvatar} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <Text style={styles.postTime}>{post.author.timeAgo}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.postText}>{post.content.text}</Text>
        {post.content.image && (
          <Image source={{ uri: post.content.image }} style={styles.postImage} />
        )}
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(post.id)}
        >
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={post.isLiked ? "#F44336" : theme.colors.text.secondary} 
          />
          <Text style={styles.actionText}>{post.stats.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.actionText}>{post.stats.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(post.id)}
        >
          <Ionicons name="share-outline" size={20} color={theme.colors.text.secondary} />
          <Text style={styles.actionText}>{post.stats.shares}</Text>
        </TouchableOpacity>
      </View>

      {/* Comment Section */}
      <View style={styles.commentSection}>
        <View style={styles.commentInputContainer}>
          <Image source={{ uri: user?.avatar || 'https://via.placeholder.com/32' }} style={styles.commentAvatar} />
          <TextInput
            style={styles.commentInput}
            placeholder="Ajouter un commentaire... Emojis supportés !"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
        </View>
      </View>
    </View>
  );

  const renderCreatePostModal = () => (
    <Modal
      visible={showCreatePostModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseCreatePost}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Créer un post</Text>
          <TouchableOpacity onPress={handleCloseCreatePost} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View style={styles.modalUserInfo}>
            <Image source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} style={styles.modalUserAvatar} />
            <Text style={styles.modalUserName}>Teddy Tresor</Text>
          </View>

          {/* Post Text Input */}
          <TextInput
            style={styles.postTextInput}
            placeholder="Partagez votre progression et motivez la communauté..."
            value={newPostText}
            onChangeText={setNewPostText}
            multiline
            autoFocus
            maxLength={2000}
            textAlignVertical="top"
          />

          {/* Add Image Section */}
          <TouchableOpacity style={styles.addImageSection} onPress={handleAddImage}>
            <View style={styles.addImageContainer}>
              <Text style={styles.addImageText}>Ajouter à votre post</Text>
              <View style={styles.imageIcon}>
                <Ionicons name="image" size={24} color={theme.colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Publish Button */}
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={[
              styles.publishButton,
              newPostText.trim() ? styles.publishButtonActive : styles.publishButtonInactive
            ]}
            onPress={handlePublishPost}
            disabled={!newPostText.trim()}
          >
            <Text style={[
              styles.publishButtonText,
              newPostText.trim() ? styles.publishButtonTextActive : styles.publishButtonTextInactive
            ]}>
              Publier
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>L'Agora</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>6</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => onTabPress ? onTabPress('settings') : null}>
            <Image 
              source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} 
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Community Intro */}
        <TouchableOpacity style={styles.introCard} onPress={handleCreatePost}>
          <Image source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} style={styles.introAvatar} />
          <Text style={styles.introText}>
            Partagez votre progression et motivez la communauté...
          </Text>
        </TouchableOpacity>

        {/* Posts Feed */}
        {posts.map(post => (
          <TouchableOpacity key={post.id} onPress={() => handlePostPress(post)}>
            {renderPost(post)}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
          <Ionicons name="home" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('progress')}>
          <Ionicons name="trending-up-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
          <Ionicons name="restaurant" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Create Post Modal */}
      {renderCreatePostModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpButton: {
    padding: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  introAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  introText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  moreButton: {
    padding: 8,
  },
  postContent: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  postText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 4,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  commentSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
    maxHeight: 100,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  postTextInput: {
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
    maxHeight: 300,
    textAlignVertical: 'top',
  },
  addImageSection: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  addImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  addImageText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginRight: 10,
  },
  imageIcon: {
    padding: 8,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  publishButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  publishButtonInactive: {
    backgroundColor: '#E0E0E0',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  publishButtonTextActive: {
    color: '#FFFFFF',
  },
  publishButtonTextInactive: {
    color: '#B0B0B0',
  },
});

export default CommunityScreen; 