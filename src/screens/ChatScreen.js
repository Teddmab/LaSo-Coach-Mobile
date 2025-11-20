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
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Avatar from '../components/Avatar';
import AppHeader from '../components/AppHeader';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/FirebaseAuthContext';

const ChatScreen = ({ user, onLogout, onTabPress, activeTab, onClose }) => {
  const { 
    conversations, 
    messages, 
    activeChatId,
    unreadCount,
    loading,
    error,
    isSocketConnected,
    loadConversations,
    loadMessages,
    sendMessage,
    openChat,
    closeChat,
    getChatMessages,
    getConversation,
    markChatAsRead
  } = useChat();
  const { user: currentUser } = useAuth();
  
  // Ensure messages is always an object to prevent undefined errors
  const safeMessages = messages || {};
  const safeConversations = conversations || [];
  
  const [searchText, setSearchText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const scrollViewRef = useRef(null);

  // Fetch profile data for avatar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { ProfileApi } = await import('../services/profileApi');
        const data = await ProfileApi.getProfile();
        setProfileData(data);
        console.log('[ChatScreen] 📊 Profile data fetched:', data);
      } catch (error) {
        console.error('[ChatScreen] ❌ Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeChatId && scrollViewRef.current && sortedMessages && Array.isArray(sortedMessages) && sortedMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [sortedMessages, activeChatId]); // Changed from sortedMessages?.length to sortedMessages to detect any changes

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Get conversation title - ALWAYS extract from participants, NEVER use conversation.name for one-to-one chats
  const getConversationTitle = (conversation) => {
    // Debug: Log key conversation fields to understand its structure
    if (__DEV__) {
      console.log('🔍 getConversationTitle called:', {
        id: conversation?.id,
        type: conversation?.type,
        name: conversation?.name,
        hasParticipants: !!conversation?.participants,
        participantsCount: conversation?.participants?.length || 0,
        hasLastMessage: !!conversation?.lastMessage
      });
    }
    
    // For group chats, use the group name
    if (conversation.type === 'GROUP' && conversation.name) {
      return conversation.name;
    }
    
    // For one-to-one chats, ALWAYS extract name from participants (completely ignore conversation.name)
    // Check multiple possible participant array locations
    const participants = conversation.participants || 
                        conversation.participantUsers || 
                        conversation.users ||
                        [];
    
    if (Array.isArray(participants) && participants.length > 0) {
      const currentUserIdStr = currentUser?.id ? String(currentUser.id) : null;
      
      if (__DEV__) {
        console.log('🔍 Participants found:', participants.length, 'Current user ID:', currentUserIdStr);
      }
      
      // Filter out current user - try multiple ID field variations
      const otherParticipants = participants.filter(p => {
        if (!currentUserIdStr) {
          // If no current user ID, take the first participant that's not us
          return true;
        }
        
        // Try all possible ID field locations
        const participantId = p.id || 
                             p.userId || 
                             p.user?.id || 
                             p.userId ||
                             p.participantId ||
                             (p.user && (p.user.id || p.user.userId));
        
        if (!participantId) {
          // If no ID found, include it (might be the other person)
          return true;
        }
        
        const isCurrentUser = String(participantId) === currentUserIdStr;
        if (__DEV__ && participants.length <= 2) {
          console.log('🔍 Participant check:', {
            participantId: String(participantId),
            currentUserId: currentUserIdStr,
            isCurrentUser,
            participantData: p
          });
        }
        
        return !isCurrentUser;
      });
      
      if (otherParticipants.length > 0) {
        // Prioritize admin/coach participants
        const adminParticipant = otherParticipants.find(p => {
          const role = p.role || p.user?.role || p.userRole || p.user?.userRole;
          return role === 'ADMIN' || role === 'COACH' || role === 'admin' || role === 'coach';
        }) || otherParticipants[0];
        
        // Try different name fields - check both direct fields and nested user object
        const participant = adminParticipant.user || adminParticipant;
        
        if (__DEV__) {
          console.log('🔍 Extracting name from participant:', {
            adminParticipant,
            participant,
            hasUser: !!adminParticipant.user
          });
        }
        
        // Try all possible name field combinations
        let name = participant?.name || 
                   participant?.firstName || 
                   participant?.fullName ||
                   adminParticipant?.name ||
                   adminParticipant?.firstName ||
                   null;
        
        // If we have firstName and lastName, combine them
        if (!name && participant?.firstName && participant?.lastName) {
          name = `${participant.firstName} ${participant.lastName}`.trim();
        }
        if (!name && adminParticipant?.firstName && adminParticipant?.lastName) {
          name = `${adminParticipant.firstName} ${adminParticipant.lastName}`.trim();
        }
        
        // Fallback to email username or full email
        if (!name) {
          const email = participant?.email || adminParticipant?.email;
          if (email) {
            name = email.split('@')[0] || email;
          }
        }
        
        // Clean up any "Chat with" prefix if it somehow got in there
        if (name && typeof name === 'string') {
          name = name.replace(/^Chat with\s+/i, '').trim();
        }
        
        if (name) {
          if (__DEV__) {
            console.log('✅ Chat title extracted from participant:', name, '| Backend name (ignored):', conversation.name);
          }
          return name;
        }
      }
      
      // Debug: log if we couldn't extract name
      if (__DEV__) {
        console.log('⚠️ Could not extract name from participants:', {
          participants,
          currentUserId: currentUser?.id,
          otherParticipantsCount: otherParticipants.length,
          otherParticipants: otherParticipants
        });
      }
    } else if (__DEV__) {
      console.log('⚠️ No participants array found in conversation:', {
        hasParticipants: !!conversation.participants,
        hasParticipantUsers: !!conversation.participantUsers,
        hasUsers: !!conversation.users,
        conversationKeys: Object.keys(conversation)
      });
    }
    
    // Last resort: Try to get name from last message sender
    if (conversation.lastMessage && conversation.lastMessage.sender) {
      const sender = conversation.lastMessage.sender;
      let name = sender.name || sender.firstName || null;
      if (!name && sender.firstName && sender.lastName) {
        name = `${sender.firstName} ${sender.lastName}`.trim();
      }
      if (name) {
        // Make sure it's not the current user
        const senderId = sender.id || sender.userId;
        const currentUserIdStr = currentUser?.id ? String(currentUser.id) : null;
        if (senderId && currentUserIdStr && String(senderId) !== currentUserIdStr) {
          if (__DEV__) {
            console.log('✅ Chat title extracted from last message sender:', name);
          }
          return name.replace(/^Chat with\s+/i, '').trim();
        }
      }
    }
    
    // DO NOT use conversation.name for one-to-one chats - return default instead
    if (__DEV__) {
      console.log('⚠️ Returning default "Chat" - conversation.name was:', conversation.name);
    }
    return 'Chat';
  };

  // Get conversation avatar - prioritize admin
  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'GROUP') {
      return conversation.name?.charAt(0).toUpperCase() || 'G';
    }
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipants = conversation.participants.filter(p => p.id !== currentUser?.id);
      
      if (otherParticipants.length > 0) {
        // Prioritize admin/coach participants
        const adminParticipant = otherParticipants.find(p => 
          p.role === 'ADMIN' || 
          p.role === 'COACH' || 
          p.role === 'admin' || 
          p.role === 'coach'
        ) || otherParticipants[0];
        
        // Try different name fields for avatar
        const name = adminParticipant?.name || 
                     adminParticipant?.firstName || 
                     adminParticipant?.email?.split('@')[0] ||
                     'A';
        
        return name.charAt(0).toUpperCase();
      }
    }
    return 'A'; // Default to 'A' for Admin
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeChatId) {
      console.log('⚠️ Cannot send message:', { hasText: !!messageText.trim(), activeChatId });
      return;
    }
    
    const messageContent = messageText.trim();
    console.log('📤 Sending message:', { chatId: activeChatId, content: messageContent });
    
    try {
      // Clear input immediately for better UX
      setMessageText('');
      await sendMessage(activeChatId, messageContent);
      console.log('✅ Message sent successfully');
    } catch (err) {
      console.error('❌ Error sending message:', err);
      // Restore message text on error
      setMessageText(messageContent);
      Alert.alert('Erreur', err.message || 'Impossible d\'envoyer le message. Veuillez réessayer.');
    }
  };

  const handleConversationPress = async (conversation) => {
    try {
      setSelectedConversation(conversation);
      await openChat(conversation.id);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation.');
    }
  };

  const handleBackPress = () => {
    if (activeChatId) {
      closeChat(activeChatId);
    }
    setSelectedConversation(null);
  };

  // Filter conversations based on search
  const filteredConversations = (safeConversations && Array.isArray(safeConversations)) 
    ? safeConversations.filter(conv => {
        if (!searchText) return true;
        const title = getConversationTitle(conv).toLowerCase();
        const lastMessage = conv.lastMessage?.content?.toLowerCase() || '';
        return title.includes(searchText.toLowerCase()) || lastMessage.includes(searchText.toLowerCase());
      })
    : [];

  // Get current chat data - watch messages state directly to ensure re-renders
  const currentChat = selectedConversation ? getConversation(selectedConversation.id) : null;
  // Access messages directly from context to ensure re-renders when state changes
  // Add safety check for messages object
  const currentMessages = activeChatId && safeMessages ? (safeMessages[activeChatId] || []) : [];
  
  // Sort messages by createdAt to ensure proper order
  // Use useMemo to prevent unnecessary re-sorts and ensure re-renders when messages change
  const sortedMessages = React.useMemo(() => {
    if (!currentMessages || !Array.isArray(currentMessages) || currentMessages.length === 0) {
      return [];
    }
    return [...currentMessages].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA - dateB;
    });
  }, [currentMessages]);

  const renderConversationItem = ({ item }) => {
    const title = getConversationTitle(item);
    const avatar = getConversationAvatar(item);
    const lastMessage = item.lastMessage?.content || 'Aucun message';
    const time = item.lastMessage?.createdAt ? formatDate(item.lastMessage.createdAt) : '';
    const unread = item.unreadCount > 0;
    const isActive = activeChatId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isActive && styles.activeConversation
        ]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={[styles.avatarContainer, { backgroundColor: '#F5F5F5' }]}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationTitle}>{title}</Text>
            {time ? <Text style={styles.conversationTime}>{time}</Text> : null}
          </View>
          <Text style={styles.conversationMessage} numberOfLines={2}>
            {lastMessage}
          </Text>
        </View>
        
        {unread && (
          <View style={styles.unreadIndicator} />
        )}
      </TouchableOpacity>
    );
  };


  const renderChatView = () => {
    if (!currentChat) return null;

    const title = getConversationTitle(currentChat);
    const avatar = getConversationAvatar(currentChat);
    const chatMessages = (sortedMessages && Array.isArray(sortedMessages)) ? sortedMessages : [];
    // Use same ID extraction logic as ChatContext for consistency
    // Backend profile has 'id' (database ID), Firebase has 'uid'
    // Check both to handle different ID formats
    const currentUserId = currentUser?.id || currentUser?.uid || currentUser?.userId;

    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.chatUserInfo}>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>{avatar}</Text>
            </View>
            <View>
              <Text style={styles.chatUserName}>{title}</Text>
              <Text style={styles.chatUserStatus}>
                {isSocketConnected ? 'En ligne' : 'Hors ligne'}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        {loading && (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={scrollViewRef}
            data={chatMessages}
            extraData={`${chatMessages.length}-${chatMessages.map(m => m.id).join(',')}`} // Force re-render when messages array changes
            keyExtractor={(item, index) => `${item.id}-${index}-${item.createdAt || Date.now()}`}
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingVertical: 8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              // Small delay to ensure content is rendered
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
            renderItem={({ item: message, index }) => {
              // Check if message is from current user - use same logic as ChatContext
              // Convert to strings for comparison (handles integer vs string mismatches)
              const currentUserIdStr = currentUserId ? String(currentUserId) : null;
              const messageSenderId = message.senderId || message.sender?.id || message.sender?.userId;
              const messageSenderIdStr = messageSenderId ? String(messageSenderId) : null;
              const messageSenderEmail = message.sender?.email;
              const currentUserEmail = currentUser?.email;
              
              // Try multiple ID comparison strategies (same as ChatContext)
              const idMatch = currentUserIdStr && messageSenderIdStr && (
                messageSenderIdStr === currentUserIdStr ||
                // Also check if one is a substring of the other (handles UUID vs short ID)
                messageSenderIdStr.includes(currentUserIdStr) ||
                currentUserIdStr.includes(messageSenderIdStr)
              );
              
              const emailMatch = currentUserEmail && messageSenderEmail && 
                currentUserEmail.toLowerCase().trim() === messageSenderEmail.toLowerCase().trim();
              
              // Comprehensive check: compare by ID (multiple strategies) OR by email
              const isOwn = idMatch || emailMatch;
              
              // Debug log if message might be from current user but isOwn is false
              if (__DEV__ && !isOwn && message.content && (messageSenderIdStr || messageSenderEmail)) {
                const mightBeOwn = (currentUserIdStr && messageSenderIdStr && 
                                   (messageSenderIdStr === currentUserIdStr || 
                                    messageSenderIdStr.includes(currentUserIdStr) ||
                                    currentUserIdStr.includes(messageSenderIdStr))) ||
                                  (currentUserEmail && messageSenderEmail && 
                                   currentUserEmail.toLowerCase().trim() === messageSenderEmail.toLowerCase().trim());
                if (mightBeOwn) {
                  console.log('⚠️ [ChatScreen] Message might be from current user but isOwn=false:', {
                    messageId: message.id,
                    senderId: messageSenderIdStr,
                    currentUserId: currentUserIdStr,
                    senderEmail: messageSenderEmail,
                    currentUserEmail: currentUserEmail,
                    idMatch,
                    emailMatch,
                    isOwn,
                  });
                }
              }
              
              const senderName = message.sender?.name || message.sender?.firstName || 'Utilisateur';
              const senderInitial = senderName.charAt(0).toUpperCase();
              
              // Debug log to verify message ownership (only for own messages that might be misaligned)
              if (__DEV__ && !isOwn && message.content) {
                // Log if message looks like it might be from current user but isOwn is false
                const mightBeOwn = messageSenderIdStr && currentUserIdStr && 
                                  (messageSenderIdStr === currentUserIdStr || 
                                   (currentUserEmail && messageSenderEmail && 
                                    currentUserEmail.toLowerCase().trim() === messageSenderEmail.toLowerCase().trim()));
                if (mightBeOwn) {
                  console.log('⚠️ [ChatScreen] Message might be from current user but isOwn=false:', {
                    messageId: message.id,
                    senderId: messageSenderIdStr,
                    currentUserId: currentUserIdStr,
                    senderEmail: messageSenderEmail,
                    currentUserEmail: currentUserEmail,
                    isOwn,
                  });
                }
              }
              
              return (
                <View
                  key={`${message.id}-${index}-${message.createdAt}`}
                  style={[
                    styles.messageItem,
                    isOwn ? styles.ownMessage : styles.otherMessage
                  ]}
                >
                  {/* Avatar only for received messages (left side) */}
                  {!isOwn && (
                    <View style={styles.messageAvatar}>
                      <Text style={styles.messageAvatarText}>{senderInitial}</Text>
                    </View>
                  )}
                  
                  {/* Message bubble */}
                  <View style={[
                    styles.messageBubble,
                    isOwn ? styles.ownMessageBubble : styles.otherMessageBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      isOwn ? styles.ownMessageText : styles.otherMessageText
                    ]}>
                      {message.content}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      isOwn ? styles.ownMessageTime : styles.otherMessageTime
                    ]}>
                      {formatDate(message.createdAt)}
                      {isOwn && ' ✓'}
                    </Text>
                  </View>
                  
                  {/* Avatar for own messages (right side) - currently not shown, but structure allows it */}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun message</Text>
              </View>
            }
          />
        )}

        {/* Message Input */}
        <View style={styles.messageInputContainer}>
          <TouchableOpacity style={styles.emojiButton}>
            <Text style={styles.emojiIcon}>😊</Text>
          </TouchableOpacity>
          
          <View style={styles.messageInputWrapper}>
            <TextInput
              style={styles.messageInput}
              placeholder="Tapez votre message..."
              placeholderTextColor="#999"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
              editable={true}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
          </View>
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              messageText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || !activeChatId}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={messageText.trim() ? "#FFFFFF" : "#999999"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header - Always Visible */}
      <AppHeader
        title="Chat"
        onHelpPress={() => {
          if (onTabPress) {
            onTabPress('faq');
          }
        }}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={profileData?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

      {/* Content Area */}
      {selectedConversation ? (
        // Show individual chat conversation
        renderChatView()
      ) : (
        // Show conversations list
        <View style={styles.content}>
          {/* Messages Header */}
          <View style={styles.messagesHeader}>
            <Text style={styles.messagesTitle}>Messages</Text>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher des conversations..."
              value={searchText}
              onChangeText={setSearchText}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Main Conversations List */}
          {loading && (!safeConversations || !Array.isArray(safeConversations) || safeConversations.length === 0) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <>
              <FlatList
                style={styles.mainConversationsList}
                data={filteredConversations}
                extraData={`${conversations.length}-${conversations.map(c => `${c.id}-${c.unreadCount || 0}-${c.lastMessage?.id || ''}`).join(',')}`} // Force re-render when conversations change
                renderItem={renderConversationItem}
                keyExtractor={(item) => `${item.id}-${item.lastMessage?.id || ''}-${item.unreadCount || 0}`} // Include lastMessage and unreadCount in key
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aucune conversation</Text>
                  </View>
                }
              />
              
              {/* Unread Messages Footer */}
              {unreadCount > 0 && (
                <View style={styles.unreadFooter}>
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                  <Text style={styles.unreadLabel}>Messages non lus</Text>
                </View>
              )}
            </>
          )}
          
          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {/* Connection Status - Only show if there's an actual error */}
          {error && error.includes('connection') && !isSocketConnected && (
            <View style={styles.connectionStatus}>
              <Text style={styles.connectionText}>
                {error.includes('reconnect') ? 'Tentative de reconnexion...' : 'Connexion en cours...'}
              </Text>
            </View>
          )}
        </View>
      )}

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  messagesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  clearButton: {
    padding: 8,
  },
  mainConversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activeConversation: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  conversationTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  conversationMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
    marginLeft: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationEmoji: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  notificationMessage: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  notificationSubMessage: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  unreadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  unreadBadge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unreadLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  chatUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  chatUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  chatUserStatus: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageItem: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 4,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0, // Prevent avatar from shrinking
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4, // Slight corner cut for chat bubble effect
  },
  otherMessageBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4, // Slight corner cut for chat bubble effect
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: theme.colors.text.primary,
  },
  messageTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  emojiButton: {
    padding: 8,
    marginRight: 8,
  },
  emojiIcon: {
    fontSize: 24,
  },
  messageInputWrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  messageInput: {
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 40,
    padding: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#2196F3',
  },
  sendButtonInactive: {
    backgroundColor: '#E0E0E0',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderTopWidth: 1,
    borderTopColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  connectionStatus: {
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderTopWidth: 1,
    borderTopColor: '#FF9800',
  },
  connectionText: {
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
  },
  ownMessageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  otherMessageTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
});

export default ChatScreen; 