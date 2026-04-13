import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { ChatScreenProps } from './chat/types';
import { useChatScreen } from './chat/hooks/useChatScreen';
import { useUgcTerms } from '../hooks/useUgcTerms';
import { useModeration } from '../hooks/useModeration';
import { ProfileApi } from '../services/profileApi';
import UgcTermsModal from '../components/UgcTermsModal';
import BlockUserModal from '../components/BlockUserModal';
import ConversationList from './chat/components/ConversationList';
import ChatView from './chat/components/ChatView';
import ProfileStep4BottomSheet from '../components/dashboard/ProfileStep4BottomSheet';

const ChatScreen: React.FC<ChatScreenProps> = ({
  user,
  onTabPress,
  activeTab,
  onFAQPress,
  initialChatId,
}) => {
  const navigation = useNavigation();
  
  // ✅ COMPLIANCE: Moderation hook for blocking users
  const {
    blockedUsers: blockedUsersList,
    isUserBlocked,
    blockUser: blockUserAction,
    unblockUser: unblockUserAction,
  } = useModeration();
  
  // Convert array to Set for O(1) lookup
  const blockedUsers = React.useMemo(() => new Set(blockedUsersList), [blockedUsersList]);
  
  // Block user modal state
  const [showBlockModal, setShowBlockModal] = React.useState(false);
  const [userToBlock, setUserToBlock] = React.useState<{ id: string; name: string } | null>(null);
  
  // ✅ MODIFICATION: État pour les données du rendez-vous
  const [rendezvousData, setRendezvousData] = React.useState<any>(null);
  const [showRendezvousBottomSheet, setShowRendezvousBottomSheet] = React.useState(false);
  
  // ✅ MODIFICATION: Fonction pour récupérer les données du rendez-vous
  const fetchRendezvousData = useCallback(async () => {
    try {
      const data = await ProfileApi.getCurrentRendezvous();
      setRendezvousData(data);
    } catch (error) {
      console.error('Error fetching rendezvous data:', error);
      setRendezvousData(null);
    }
  }, []);
  
  // ✅ MODIFICATION: Charger les données du rendez-vous au montage et lors du focus
  useEffect(() => {
    fetchRendezvousData();
  }, [fetchRendezvousData]);
  
  // ✅ MODIFICATION: Handler pour compléter le rendez-vous depuis le bottom sheet
  const handleRendezvousComplete = useCallback(async () => {
    setShowRendezvousBottomSheet(false);
    // Rafraîchir les données du rendez-vous après création
    await fetchRendezvousData();
  }, [fetchRendezvousData]);

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
    openChat,
  } = useChatScreen();

  // Phase 7 - TODO #7: Test UGC terms modal on chat entry
  const {
    termsAccepted,
    termsLoading,
    showTermsModal,
    handleAcceptTerms,
    handleDeclineTerms,
  } = useUgcTerms();

  useEffect(() => {
    const id = initialChatId?.trim();
    if (!id || !termsAccepted || termsLoading || !openChat) {
      return;
    }
    void (async () => {
      try {
        await openChat(id);
      } catch (err) {
        console.warn('[ChatScreen] initialChatId openChat:', err);
      }
    })();
  }, [initialChatId, termsAccepted, termsLoading, openChat]);

  const handleViewTerms = () => {
    navigation.navigate('TermsAndPolicies' as never);
  };

  // ✅ COMPLIANCE: Handle user blocking
  const handleBlockUser = (userId: string, userName: string) => {
    setUserToBlock({ id: userId, name: userName });
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async (userId: string) => {
    try {
      const isBlocked = isUserBlocked(userId);
      if (isBlocked) {
        await unblockUserAction(userId);
      } else {
        await blockUserAction(userId);
      }
      setShowBlockModal(false);
      setUserToBlock(null);
    } catch (error) {
      console.error('❌ [ChatScreen] Error blocking user:', error);
    }
  };

  const handleCancelBlock = () => {
    setShowBlockModal(false);
    setUserToBlock(null);
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
          <Text style={styles.emptyTitle}>📋 Acceptation requise</Text>
          <Text style={styles.emptyText}>
            Veuillez accepter les règles de la communauté pour accéder aux fonctionnalités de chat.
          </Text>
        </View>
      ) : activeChatId && currentChat ? (
        <ChatView
          conversation={currentChat}
          // ✅ COMPLIANCE: Filter out messages from blocked users
          messages={messages.filter(msg => {
            const senderId = msg.senderId || msg.sender?.id;
            return senderId && !blockedUsers.has(String(senderId));
          })}
          messageText={messageText}
          loading={loading}
          isSocketConnected={isSocketConnected}
          currentUser={currentUser}
          onMessageTextChange={setMessageText}
          onSendMessage={handleSendMessage}
          onBackPress={handleBackPress}
          onBlockUser={handleBlockUser}
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
            rendezvousData={rendezvousData}
            onFAQPress={onFAQPress || (() => onTabPress?.('faq'))}
            onTakeRendezvous={() => {
              // ✅ MODIFICATION: Ouvrir le bottom sheet de rendez-vous (même que l'étape 4)
              setShowRendezvousBottomSheet(true);
            }}
            onModifyRendezvous={() => {
              // Naviguer vers l'onglet Agenda pour modifier le rendez-vous
              onTabPress?.('agenda');
            }}
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

      {/* Block User Modal */}
      {userToBlock && (
        <BlockUserModal
          visible={showBlockModal}
          userId={userToBlock.id}
          userName={userToBlock.name}
          isBlocked={isUserBlocked(userToBlock.id)}
          onConfirm={handleConfirmBlock}
          onCancel={handleCancelBlock}
        />
      )}

      {/* ✅ MODIFICATION: Bottom sheet pour prendre un rendez-vous (même que l'étape 4) */}
      <ProfileStep4BottomSheet
        visible={showRendezvousBottomSheet}
        onClose={() => setShowRendezvousBottomSheet(false)}
        onComplete={handleRendezvousComplete}
        dashboardData={{ rendezvous: rendezvousData, rendezVous: rendezvousData }}
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

