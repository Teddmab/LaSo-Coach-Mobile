import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { ChatScreenProps } from './chat/types';
import { useChatScreen } from './chat/hooks/useChatScreen';
import ConversationList from './chat/components/ConversationList';
import ChatView from './chat/components/ChatView';

const ChatScreen: React.FC<ChatScreenProps> = ({
  user,
  onTabPress,
  activeTab,
}) => {
  const {
    conversations,
    messages,
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
  } = useChatScreen();

  return (
    <>
      {activeChatId && currentChat ? (
        <ChatView
          conversation={currentChat}
          messages={messages}
          messageText={messageText}
          loading={loading}
          isSocketConnected={isSocketConnected}
          currentUser={currentUser}
          onMessageTextChange={setMessageText}
          onSendMessage={handleSendMessage}
          onBackPress={handleBackPress}
        />
      ) : (
        <>
          <ConversationList
            conversations={conversations}
            activeChatId={activeChatId}
            searchText={searchText}
            currentUser={currentUser}
            onSearchChange={setSearchText}
            onConversationPress={handleConversationPress}
          />

          {/* Connection Status */}
          {error && (typeof error === 'string' || error === null) && String(error || '').includes('connection') && !isSocketConnected && (
            <View style={styles.connectionStatus}>
              <View style={styles.connectionContent}>
                <View style={styles.connectionIndicator} />
                <View style={styles.connectionTextContainer}>
                  <Text style={styles.connectionText}>
                    {String(error || '').includes('reconnect') ? 'Tentative de reconnexion...' : 'Connexion en cours...'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  connectionStatus: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFC107',
  },
  connectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFC107',
    marginRight: 8,
  },
  connectionTextContainer: {
    flex: 1,
  },
  connectionText: {
    fontSize: 12,
    color: '#856404',
  },
});

export default ChatScreen;

