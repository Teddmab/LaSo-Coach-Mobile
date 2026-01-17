import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { ChatScreenProps } from './chat/types';
import { useChatScreen } from './chat/hooks/useChatScreen';
import { useUgcTerms } from '../hooks/useUgcTerms';
import UgcTermsModal from '../components/UgcTermsModal';
import ConversationList from './chat/components/ConversationList';
import ChatView from './chat/components/ChatView';

const ChatScreen: React.FC<ChatScreenProps> = ({
  user,
  onTabPress,
  activeTab,
}) => {
  const navigation = useNavigation();
  
  // ✅ COMPLIANCE: Track blocked users to instantly remove their messages
  const [blockedUsers, setBlockedUsers] = React.useState<Set<string>>(new Set());

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

  // Phase 7 - TODO #7: Test UGC terms modal on chat entry
  const {
    termsAccepted,
    termsLoading,
    showTermsModal,
    handleAcceptTerms,
    handleDeclineTerms,
  } = useUgcTerms();

  const handleViewTerms = () => {
    navigation.navigate('TermsAndPolicies' as never);
  };

  return (
    <>
      {/* Phase 7 - TODO #8: Display loading state while checking terms */}
      {termsLoading && !termsAccepted ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : !termsAccepted ? (
        // User has not accepted terms - show prompt
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>📋 Terms Required</Text>
          <Text style={styles.emptyText}>
            Please accept our community guidelines to access chat features.
          </Text>
        </View>
      ) : activeChatId && currentChat ? (
        <ChatView
          conversation={currentChat}
          // ✅ COMPLIANCE: Filter out messages from blocked users
          messages={messages.filter(msg => !blockedUsers.has(msg.senderId))}
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

      {/* UGC Terms Modal */}
      <UgcTermsModal
        visible={showTermsModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
        onViewTerms={handleViewTerms}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: theme.colors.background,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
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

