import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { Conversation, Message } from '../types';
import { ShimmerList } from '../../../components/Shimmer';
import { getConversationTitle, getConversationAvatar } from '../utils/chatUtils';
import { User } from '../../../types/auth';

interface ChatViewProps {
  conversation: Conversation | null;
  messages: Message[];
  messageText: string;
  loading: boolean;
  isSocketConnected: boolean;
  currentUser?: User | null;
  onMessageTextChange: (text: string) => void;
  onSendMessage: () => void;
  onBackPress: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  messages,
  messageText,
  loading,
  isSocketConnected,
  currentUser,
  onMessageTextChange,
  onSendMessage,
  onBackPress,
}) => {
  const scrollViewRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Gérer la hauteur du clavier
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll vers le bas quand le clavier s'ouvre
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  if (!conversation) return null;

  const title = getConversationTitle(conversation, currentUser);
  const avatar = getConversationAvatar(conversation, currentUser);
  const currentUserId = currentUser?.id || (currentUser as any)?.uid || (currentUser as any)?.userId;

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = String(item.senderId) === String(currentUserId);
    
    // Pour les messages entrants, vérifier si on doit afficher l'avatar
    // Afficher l'avatar si c'est le premier message ou si l'expéditeur précédent est différent
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isOwnMessage && (
      index === 0 || 
      !prevMessage || 
      String(prevMessage.senderId) !== String(item.senderId)
    );
    
    // Obtenir l'initiale de l'expéditeur
    const getSenderInitial = (message: Message): string => {
      if (isOwnMessage) {
        // Pour nos propres messages, utiliser l'initiale de l'utilisateur actuel
        const userName = currentUser?.firstName || currentUser?.name || currentUser?.email?.split('@')[0] || 'M';
        return userName.charAt(0).toUpperCase();
      }
      // Pour les messages entrants, utiliser l'initiale du sender
      const sender = message.sender;
      if (sender) {
        const senderName = sender.firstName || sender.name || sender.email?.split('@')[0] || 'A';
        return senderName.charAt(0).toUpperCase();
      }
      return 'A';
    };
    
    const senderInitial = getSenderInitial(item);
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}>
        {/* Avatar pour les messages entrants (à gauche) */}
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>{senderInitial}</Text>
              </View>
            ) : (
              <View style={styles.messageAvatarPlaceholder} />
            )}
          </View>
        )}
        
        {/* Bulle de message */}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
          ]}>
            {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        {/* Avatar pour les messages émis (à droite) */}
        {isOwnMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              <View style={styles.messageAvatar}>
                <Text style={styles.messageAvatarText}>{senderInitial}</Text>
              </View>
            ) : (
              <View style={styles.messageAvatarPlaceholder} />
            )}
          </View>
        )}
      </View>
    );
  };

  // Calculer la hauteur de la barre de navigation
  // BottomNavigation: paddingTop (9) + tab height (24) + paddingVertical (12*2) + paddingBottom (safe area)
  // Environ 70-80px + safe area bottom
  const bottomNavHeight = 9 + 24 + 12 * 2 + Math.max(insets.bottom, 16);
  
  // IMPORTANT: Quand le clavier est ouvert, on positionne la zone juste au-dessus du clavier
  // Quand le clavier est fermé, on positionne la zone au-dessus de la barre de nav
  // La barre de navigation reste TOUJOURS fixe en bas, elle ne bouge JAMAIS
  const inputBottomPosition = keyboardHeight > 0 
    ? keyboardHeight  // Zone de réponse monte avec le clavier (juste au-dessus)
    : bottomNavHeight; // Zone de réponse au-dessus de la barre de nav quand clavier fermé

  return (
    <View style={styles.container}>
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{title}</Text>
            <Text style={styles.userStatus}>
              {isSocketConnected ? 'En ligne' : 'Hors ligne'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {loading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ShimmerList count={5} itemHeight={80} />
        </View>
      ) : (
        <FlatList
          ref={scrollViewRef}
          data={messages}
          extraData={`${messages.length}-${messages.map(m => m.id).join(',')}`}
          keyExtractor={(item, index) => `${item.id}-${index}-${item.createdAt || Date.now()}`}
          style={styles.messagesContainer}
          contentContainerStyle={{ 
            paddingVertical: 8, 
            paddingBottom: Math.max(120, inputBottomPosition + 60) 
          }}
          renderItem={renderMessage}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun message</Text>
            </View>
          }
        />
      )}

      {/* Message Input - Positionné en bas avec gestion du clavier */}
      {/* Utiliser position absolute avec bottom dynamique pour que seule cette zone bouge */}
      {/* IMPORTANT: Cette zone monte avec le clavier, mais la barre de navigation reste fixe */}
      <View style={[
        styles.inputWrapper,
        { 
          bottom: inputBottomPosition,
          paddingBottom: keyboardHeight > 0 ? Math.max(insets.bottom, 10) : 10,
        }
      ]} pointerEvents="auto">
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tapez un message..."
            placeholderTextColor={theme.colors.text.secondary}
            value={messageText}
            onChangeText={onMessageTextChange}
            multiline
            maxLength={1000}
            onFocus={() => {
              // Scroll vers le bas quand on focus l'input
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={onSendMessage}
            disabled={!messageText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={messageText.trim() ? '#FFFFFF' : '#CCCCCC'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  userStatus: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  messageAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  messageAvatarPlaceholder: {
    width: 32,
    height: 32,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    // Pas d'ombres portées - design simple et épuré
  },
  ownBubble: {
    backgroundColor: '#4A90E2', // Bleu pour messages émis
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F0F0F0', // Gris clair pour messages entrants
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#666666',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 5000, // Z-index élevé mais inférieur à la barre de navigation (10000)
    // Pas de marginBottom, la position est gérée par le bottom dynamique
    marginBottom: -65,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#333333',
    backgroundColor: '#F8F8F8',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2', // Bleu pour correspondre aux messages
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#D0D0D0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});

export default ChatView;

