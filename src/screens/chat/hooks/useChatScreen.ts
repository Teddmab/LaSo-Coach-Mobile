import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { ProfileApi } from '../../../services/profileApi';
import { useChat } from '../../../context/ChatContext';
import { useAuth } from '../../../context/FirebaseAuthContext';
import { Conversation, Message } from '../types';

export const useChatScreen = () => {
  const chatContext: any = useChat();
  const {
    conversations,
    messages,
    activeChatId,
    loading,
    error,
    isSocketConnected,
    loadConversations,
    sendMessage,
    openChat,
    closeChat,
    getConversation,
  } = chatContext;
  const { user: currentUser } = useAuth();

  const [searchText, setSearchText] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      try {
        const data = await ProfileApi.getProfile();
        // Handle case where profile might be null due to Prisma errors
        if (data) {
        setProfileData(data);
        } else {
          console.warn('⚠️ [useChatScreen] Profile data is null - Prisma error or missing data');
          setProfileData(null);
        }
      } catch (error) {
        console.error('❌ [useChatScreen] Error fetching profile:', error);
        setProfileData(null);
      }
    };
    fetchProfile();
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (loadConversations && typeof loadConversations === 'function') {
      (loadConversations as () => void)();
    }
  }, [loadConversations]);

  // Get current chat data
  const currentChat = selectedConversation && getConversation && typeof getConversation === 'function' 
    ? (getConversation as (id: string) => Conversation | null)(selectedConversation.id) 
    : null;
  const safeMessages = messages || {};
  const currentMessages = activeChatId && safeMessages ? (safeMessages[activeChatId] || []) : [];

  // Sort messages by createdAt
  const sortedMessages = useMemo(() => {
    if (!currentMessages || !Array.isArray(currentMessages) || currentMessages.length === 0) {
      return [];
    }
    return [...currentMessages].sort((a: Message, b: Message) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    });
  }, [currentMessages]);

  const handleSendMessage = async (): Promise<void> => {
    if (!messageText.trim() || !activeChatId) {
      return;
    }
    
    const messageContent = messageText.trim();
    
    try {
      setMessageText('');
      if (sendMessage && typeof sendMessage === 'function') {
        await (sendMessage as (chatId: string, content: string) => Promise<void>)(activeChatId, messageContent);
      }
    } catch (err: any) {
      setMessageText(messageContent);
      Alert.alert('Erreur', err.message || 'Impossible d\'envoyer le message. Veuillez réessayer.');
    }
  };

  const handleConversationPress = async (conversation: Conversation): Promise<void> => {
    try {
      setSelectedConversation(conversation);
      if (openChat && typeof openChat === 'function') {
        await (openChat as (chatId: string) => Promise<void>)(conversation.id);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation.');
    }
  };

  const handleBackPress = (): void => {
    if (activeChatId && closeChat && typeof closeChat === 'function') {
      (closeChat as (chatId: string) => void)(activeChatId);
    }
    setSelectedConversation(null);
  };

  const safeConversations = conversations || [];

  return {
    conversations: safeConversations,
    messages: sortedMessages,
    currentChat,
    activeChatId,
    loading,
    error,
    isSocketConnected,
    searchText,
    messageText,
    profileData,
    currentUser,
    setSearchText,
    setMessageText,
    handleSendMessage,
    handleConversationPress,
    handleBackPress,
  };
};

