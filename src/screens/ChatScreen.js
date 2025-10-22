import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Avatar from '../components/Avatar';

const ChatScreen = ({ user, onLogout, onTabPress, activeTab, onClose }) => {
  const [searchText, setSearchText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);

  const conversations = [
    {
      id: 'recap',
      type: 'group',
      title: 'Recap Monday',
      message: 'asdlaksjdlksajdkasds',
      time: 'il y a 4 jours',
      isRead: false,
      avatar: 'R',
      backgroundColor: '#F5F5F5',
      isActive: true
    },
    {
      id: 'admin',
      type: 'direct',
      title: 'Admin User',
      message: 'test',
      time: 'il y a 19 jours',
      isRead: true,
      avatar: 'A',
      backgroundColor: '#F5F5F5'
    }
  ];

  const chatNotifications = [
    {
      id: 'notification-1',
      title: 'Ajouté au Groupe de Discussion',
      message: 'Vous avez été ajouté(e) au groupe "Recap Mond..."',
      time: 'il y a 4 jours',
      type: 'group_added',
      isRead: false
    }
  ];

  const currentChat = {
    user: {
      name: 'Admin User',
      avatar: 'A',
      isOnline: true
    },
    messages: [
      {
        id: 1,
        text: 'asdlaksjdlksajdkasds',
        time: 'il y a 4 jours',
        isOwn: false
      }
    ]
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('Sending message:', messageText);
      // Here you would typically send the message to your backend
      setMessageText('');
    }
  };

  const handleConversationPress = (conversation) => {
    setSelectedConversation(conversation);
    console.log('Selected conversation:', conversation.title);
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        item.isActive && styles.activeConversation
      ]}
      onPress={() => handleConversationPress(item)}
    >
      <View style={[styles.avatarContainer, { backgroundColor: item.backgroundColor }]}>
        <Text style={styles.avatarText}>{item.avatar}</Text>
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationTitle}>{item.title}</Text>
          <Text style={styles.conversationTime}>{item.time}</Text>
        </View>
        <Text style={styles.conversationMessage} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      
      {!item.isRead && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );

  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <Text style={styles.notificationEmoji}>🔔</Text>
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>Notifications de chat</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        <Text style={styles.notificationMessage}>{item.title}</Text>
        <Text style={styles.notificationSubMessage} numberOfLines={1}>
          {item.message}
        </Text>
      </View>
      
      <Ionicons name="checkmark" size={20} color="#4CAF50" />
    </View>
  );

  const renderChatView = () => (
    <View style={styles.chatContainer}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedConversation(null)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.chatUserInfo}>
          <View style={styles.chatAvatar}>
            <Text style={styles.chatAvatarText}>{currentChat.user.avatar}</Text>
          </View>
          <View>
            <Text style={styles.chatUserName}>{currentChat.user.name}</Text>
            <Text style={styles.chatUserStatus}>Admin User</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {currentChat.messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageItem,
              message.isOwn ? styles.ownMessage : styles.otherMessage
            ]}
          >
            {!message.isOwn && (
              <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>{currentChat.user.avatar}</Text>
              </View>
            )}
            <View style={[
              styles.messageBubble,
              message.isOwn ? styles.ownMessageBubble : styles.otherMessageBubble
            ]}>
              <Text style={[
                styles.messageText,
                message.isOwn ? styles.ownMessageText : styles.otherMessageText
              ]}>
                {message.text}
              </Text>
              <Text style={styles.messageTime}>{message.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.messageInputContainer}>
        <TouchableOpacity style={styles.emojiButton}>
          <Text style={styles.emojiIcon}>😊</Text>
        </TouchableOpacity>
        
        <View style={styles.messageInputWrapper}>
          <TextInput
            style={styles.messageInput}
            placeholder="Tapez votre message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            messageText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={messageText.trim() ? "#FFFFFF" : "#999999"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header - Always Visible */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>5</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => onTabPress ? onTabPress('settings') : null}>
            <Avatar 
              source={{ uri: user?.avatar }} 
              size={40}
              style={styles.profileImage}
              fallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
            />
          </TouchableOpacity>
        </View>
      </View>

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
          <ScrollView style={styles.mainConversationsList} showsVerticalScrollIndicator={false}>
            {/* Chat Notifications */}
            {chatNotifications
              .filter(notification => 
                searchText === '' || 
                notification.title.toLowerCase().includes(searchText.toLowerCase()) ||
                notification.message.toLowerCase().includes(searchText.toLowerCase())
              )
              .map((notification) => (
                <View key={notification.id}>
                  {renderNotificationItem({ item: notification })}
                </View>
              ))}
            
            {/* Conversations */}
            {conversations
              .filter(conversation => 
                searchText === '' || 
                conversation.title.toLowerCase().includes(searchText.toLowerCase()) ||
                conversation.message.toLowerCase().includes(searchText.toLowerCase())
              )
              .map((conversation) => (
                <View key={conversation.id}>
                  {renderConversationItem({ item: conversation })}
                </View>
              ))}
          </ScrollView>

          {/* Unread Messages Footer */}
          <View style={styles.unreadFooter}>
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>1</Text>
            </View>
            <Text style={styles.unreadLabel}>Messages non lus</Text>
          </View>
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
    marginVertical: 8,
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
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: '#2196F3',
  },
  otherMessageBubble: {
    backgroundColor: '#F5F5F5',
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
});

export default ChatScreen; 