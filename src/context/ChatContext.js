import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Dimensions, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import { useAuth } from './FirebaseAuthContext';
import chatApi from '../services/chatApi';
import chatSocketService from '../services/chatSocketService';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({}); // { chatId: [messages] }
  const [activeChatId, setActiveChatId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  
  const messageUnsubscribers = useRef({});
  const chatCreatedUnsubscriber = useRef(null);
  const notificationUnsubscriber = useRef(null);
  const connectCallbacksRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectionCheckIntervalRef = useRef(null);
  const lastScreenDimensions = useRef(Dimensions.get('window'));

  /**
   * Attempt to reconnect WebSocket
   * CRITICAL: Don't manually reconnect if Socket.IO is already handling it
   * Manual reconnection creates duplicate socket instances
   * Let Socket.IO's built-in reconnection handle it
   */
  const attemptReconnect = useCallback((reason = 'unknown') => {
    if (!isAuthenticated || !user) {
      console.log('⚠️ Cannot reconnect: user not authenticated');
      return;
    }

    const isConnected = chatSocketService.getConnectionStatus();
    const socket = chatSocketService.getSocket();
    
    // Check if socket exists and is connected or connecting
    if (socket && (socket.connected || socket.connecting)) {
      console.log(`✅ WebSocket already connected/connecting (reason: ${reason})`);
      return; // Don't interfere with existing connection
    }
    
    // Only reconnect if truly disconnected and socket doesn't exist
    if (!isConnected && !socket) {
      console.log(`🔄 Attempting to reconnect WebSocket (reason: ${reason})...`);
      // Use reconnect() which uses existing socket if available
      // This prevents creating duplicate instances
      chatSocketService.reconnect();
    } else if (!isConnected && socket) {
      // Socket exists but not connected - let Socket.IO's built-in reconnection handle it
      console.log(`ℹ️ Socket exists but disconnected - Socket.IO will auto-reconnect (reason: ${reason})`);
      // Don't manually reconnect - Socket.IO handles it automatically
    }
  }, [isAuthenticated, user]);

  /**
   * Handle app state changes (foreground/background)
   * CRITICAL: Only reconnect if truly disconnected - don't interfere with existing connections
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App has come to the foreground
        console.log('📱 App came to foreground');
        // Only reconnect if actually disconnected - Socket.IO handles reconnection automatically
        const socket = chatSocketService.getSocket();
        const isConnected = chatSocketService.getConnectionStatus();
        if (!isConnected && !socket) {
          // Only reconnect if no socket exists at all
          setTimeout(() => {
            attemptReconnect('app_state_active');
          }, 500);
        } else {
          console.log('ℹ️ Socket exists/connected - letting Socket.IO handle reconnection');
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [attemptReconnect]);

  /**
   * Handle network state changes (critical for Galaxy Fold screen switches)
   * Network may briefly disconnect/reconnect when switching screens
   * CRITICAL: Let Socket.IO handle reconnection automatically - don't manually reconnect
   */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      
      if (isConnected) {
        console.log('🌐 Network connected - Socket.IO will auto-reconnect if needed');
        // Don't manually reconnect - Socket.IO handles it automatically
        // Manual reconnection creates duplicate socket instances
      } else {
        console.log('🌐 Network disconnected - Socket.IO will auto-reconnect when network returns');
        // Network is down, socket.io will handle reconnection automatically
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Handle screen dimension changes (Galaxy Fold screen switching)
   * When switching between external and internal screens, dimensions change
   * CRITICAL: Don't manually reconnect - Socket.IO handles it automatically
   */
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const currentDimensions = window;
      const previousDimensions = lastScreenDimensions.current;
      
      // Check if dimensions actually changed (not just a resize)
      const dimensionsChanged = 
        currentDimensions.width !== previousDimensions.width ||
        currentDimensions.height !== previousDimensions.height;
      
      if (dimensionsChanged) {
        console.log('📐 Screen dimensions changed (Galaxy Fold screen switch detected)');
        console.log(`   Previous: ${previousDimensions.width}x${previousDimensions.height}`);
        console.log(`   Current: ${currentDimensions.width}x${currentDimensions.height}`);
        
        // Update stored dimensions
        lastScreenDimensions.current = currentDimensions;
        
        // Don't manually reconnect - Socket.IO handles reconnection automatically
        // Manual reconnection creates duplicate socket instances
        console.log('ℹ️ Socket.IO will auto-reconnect if needed after screen switch');
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  /**
   * Periodic connection health check
   * CRITICAL: Removed - was causing duplicate socket instances
   * Socket.IO's built-in reconnection handles this automatically
   * Manual health checks interfere with Socket.IO's reconnection logic
   */
  // Removed periodic health check to prevent duplicate socket instances
  // Socket.IO handles reconnection automatically

  /**
   * Initialize WebSocket connection when user is authenticated
   * CRITICAL FIX: Only disconnect on actual logout/unmount, not on dependency changes
   * This prevents premature disconnection when callbacks are recreated
   */
  useEffect(() => {
    // Track if this effect should actually disconnect on cleanup
    // Only disconnect if user logs out or component unmounts
    const shouldDisconnectRef = { value: true };
    
    if (!isAuthenticated || !user) {
      // User logged out - disconnect immediately
      console.log('🔌 User logged out - disconnecting WebSocket');
      chatSocketService.disconnect();
      setIsSocketConnected(false);
      connectCallbacksRef.current = null;
      shouldDisconnectRef.value = false; // Already disconnected, don't disconnect again in cleanup
      return;
    }

    // User is authenticated - set up connection
    shouldDisconnectRef.value = true; // Will disconnect on cleanup if still true

    const handleConnect = async () => {
      console.log('✅ Chat WebSocket connected');
      setIsSocketConnected(true);
      setError(null); // Clear any previous errors
      
      // Set up listeners after connection is established
      setupSocketListeners();
      
      // CRITICAL: Immediately fetch conversations and join all rooms
      // Backend requirement: Join rooms early enough to receive chat:message events
      // Do this synchronously in the connect handler to ensure rooms are joined ASAP
      try {
        console.log('🔄 Fetching conversations to join rooms immediately after connection...');
        const conversationsList = await loadConversations(true); // Pass true to return data
        
        // Join all chat rooms immediately after fetching conversations
        if (conversationsList && conversationsList.length > 0) {
          console.log(`🔄 Immediately joining ${conversationsList.length} chat rooms...`);
          conversationsList.forEach(conv => {
            if (conv.id) {
              console.log(`  → Joining room: chat:${conv.id}`);
              chatSocketService.joinChat(conv.id);
            }
          });
          console.log('✅ All chat rooms joined immediately after connection');
        } else {
          console.log('ℹ️ No conversations to join yet');
        }
      } catch (error) {
        console.error('❌ Error loading conversations on connect:', error);
      }
      
      // Also refresh unread count
      loadUnreadCount();
    };

    const handleDisconnect = (reason) => {
      console.log('❌ Chat WebSocket disconnected:', reason);
      setIsSocketConnected(false);
      // Note: Rooms will be automatically rejoined when socket reconnects
      // via the useEffect that watches isSocketConnected and conversations
    };

    const handleError = (error) => {
      // Only log non-reconnection errors to reduce spam
      const errorMessage = error?.message || '';
      const isReconnectionError = errorMessage.includes('websocket') || 
                                 errorMessage.includes('timeout') ||
                                 errorMessage.includes('ECONNREFUSED') ||
                                 errorMessage.includes('ENOTFOUND') ||
                                 errorMessage.includes('reconnect');
      
      if (!isReconnectionError) {
        console.error('❌ Chat WebSocket error:', error);
        // Only set error state for non-reconnection errors
        setError(errorMessage || 'WebSocket connection error');
      }
      // Reconnection errors are expected and handled automatically by socket.io
      // No need to log or set error state for them
    };

    // Store callbacks for reconnection
    connectCallbacksRef.current = { handleConnect, handleDisconnect, handleError };

    // Check if socket already exists and is connected/connecting
    // If so, don't create a new connection - just update callbacks
    const existingSocket = chatSocketService.getSocket();
    const isAlreadyConnected = chatSocketService.getConnectionStatus();
    
    if (existingSocket && (existingSocket.connected || existingSocket.connecting)) {
      console.log('ℹ️ Socket already exists and is connected/connecting - updating callbacks only');
      // Socket already exists - just update callbacks, don't disconnect/reconnect
      shouldDisconnectRef.value = false; // Don't disconnect existing connection
    } else {
      // No existing connection - create new one
      console.log('🔌 Creating new WebSocket connection...');
      chatSocketService.connect(handleConnect, handleDisconnect, handleError);
    }

    // Cleanup on unmount or when user logs out
    return () => {
      // Only disconnect if:
      // 1. User actually logged out (isAuthenticated is now false)
      // 2. Component is unmounting
      // Don't disconnect if dependencies changed but user is still authenticated
      const shouldDisconnect = shouldDisconnectRef.value && (!isAuthenticated || !user);
      
      if (shouldDisconnect) {
        console.log('🔌 Cleaning up WebSocket connection (logout or unmount)');
        // Clear any pending reconnection timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        chatSocketService.disconnect();
        cleanupSocketListeners();
        connectCallbacksRef.current = null;
      } else {
        console.log('ℹ️ Skipping WebSocket cleanup - user still authenticated and socket in use');
        // Just update callbacks, don't disconnect
        connectCallbacksRef.current = { handleConnect, handleDisconnect, handleError };
      }
    };
  }, [isAuthenticated, user, setupSocketListeners, loadConversations, loadUnreadCount]);

  /**
   * CRITICAL: Join ALL user's chat rooms when WebSocket is connected and conversations are loaded
   * Backend broadcasts messages to chat:{chatId} rooms, so we must join them to receive messages
   * This ensures we receive real-time messages for all chats, not just the active one
   * 
   * This useEffect watches both isSocketConnected and conversations, so it will:
   * - Join rooms when WebSocket connects (if conversations are already loaded)
   * - Join rooms when conversations load (if WebSocket is already connected)
   * - Rejoin rooms when conversations change (new chats added)
   */
  useEffect(() => {
    // Only join rooms if WebSocket is connected and we have conversations
    if (!isSocketConnected || !conversations || conversations.length === 0) {
      return;
    }

    console.log(`🔄 Joining ${conversations.length} chat rooms (WebSocket connected)...`);
    
    // Join all chat rooms
    conversations.forEach(conv => {
      if (conv.id) {
        console.log(`  → Joining room: chat:${conv.id}`);
        chatSocketService.joinChat(conv.id);
      }
    });
    
    console.log('✅ All chat rooms joined');
    
    // Also ensure active chat room is joined (in case it's not in conversations list)
    if (activeChatId) {
      const isAlreadyInConversations = conversations.some(conv => conv.id === activeChatId);
      if (!isAlreadyInConversations) {
        console.log(`🔄 Joining active chat room (not in conversations list): ${activeChatId}`);
        chatSocketService.joinChat(activeChatId);
      }
    }
  }, [isSocketConnected, conversations, activeChatId]);

  /**
   * Show local notification for new message
   */
  const showMessageNotification = useCallback(async (message, conversation) => {
    try {
      const senderName = message.sender?.name || 
                        message.sender?.firstName || 
                        conversation?.name || 
                        'Someone';
      const messagePreview = message.content?.substring(0, 100) || 'New message';
      
      console.log('📱 Showing notification for message:', { senderName, messagePreview });
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `New message from ${senderName}`,
          body: messagePreview,
          data: { 
            chatId: message.chatId || message.chat?.id,
            messageId: message.id,
            type: 'CHAT_MESSAGE'
          },
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Notification scheduled successfully');
    } catch (error) {
      console.error('❌ Error showing message notification:', error);
    }
  }, []);

  /**
   * Handle new message from WebSocket
   * CRITICAL: This is the SINGLE SOURCE OF TRUTH for all message updates
   * All messages (including ones we send) come through this function
   * 
   * Per backend guide:
   * - DO NOT use optimistic updates
   * - WebSocket broadcast is the single source of truth
   * - All messages come through this handler
   */
  const handleNewMessage = useCallback((message) => {
    const chatId = message.chatId || message.chat?.id;
    if (!chatId) {
      console.warn('⚠️ [handleNewMessage] Received message without chatId:', message);
      return;
    }

    // Get current user ID for comparison - check multiple possible ID fields
    // Backend might use database user ID (from profile) vs Firebase UID
    const currentUserId = user?.id || user?.uid || user?.userId;
    const currentUserEmail = user?.email;
    
    // Check multiple possible sender ID fields (backend might use different ID format)
    // Backend might use database ID (integer) vs Firebase UID (string)
    const messageSenderId = message.senderId || message.sender?.id || message.sender?.userId;
    const messageSenderEmail = message.sender?.email;
    
    // CRITICAL: Comprehensive check - compare by ID (multiple formats) OR by email
    // Convert both to strings for comparison to handle integer vs string mismatches
    const currentUserIdStr = currentUserId ? String(currentUserId) : null;
    const messageSenderIdStr = messageSenderId ? String(messageSenderId) : null;
    
    // Try multiple ID comparison strategies
    const idMatch = currentUserIdStr && messageSenderIdStr && (
      messageSenderIdStr === currentUserIdStr ||
      // Also check if one is a substring of the other (handles UUID vs short ID)
      messageSenderIdStr.includes(currentUserIdStr) ||
      currentUserIdStr.includes(messageSenderIdStr)
    );
    
    const emailMatch = currentUserEmail && messageSenderEmail && 
      currentUserEmail.toLowerCase().trim() === messageSenderEmail.toLowerCase().trim();
    
    const isFromCurrentUser = idMatch || emailMatch;
    
    // Enhanced logging to debug ID mismatches
    console.log('📨 [handleNewMessage] Message received:', 
      `ID:${message.id}`, 
      `Chat:${chatId}`,
      `SenderID:${messageSenderIdStr || 'null'}`,
      `SenderEmail:${messageSenderEmail || 'null'}`,
      `CurrentID:${currentUserIdStr || 'null'}`,
      `CurrentEmail:${currentUserEmail || 'null'}`,
      `IDMatch:${idMatch}`,
      `EmailMatch:${emailMatch}`,
      `IsMine:${isFromCurrentUser}`,
      `Content:${message.content?.substring(0, 30)}...`
    );
    
    // Log full user and sender objects for debugging (only if mismatch)
    if (!isFromCurrentUser && message.content) {
      console.log('🔍 [handleNewMessage] ID mismatch - full objects:', {
        userObject: { id: user?.id, uid: user?.uid, userId: user?.userId, email: user?.email },
        messageSender: message.sender,
        messageSenderId: message.senderId,
      });
    }

    // Check if this is the active chat
    const isActiveChat = chatId === activeChatId;

    // CRITICAL: Check for duplicates and add message in one state update
    // Use a ref to track if message was actually added (for notification logic)
    const messageWasAddedRef = { value: false };
    
    setMessages(prev => {
      const existingMessages = prev[chatId] || [];
      
      // Check if message already exists (avoid duplicates)
      // Also check if this real message should replace an optimistic one
      const existingMessageIndex = existingMessages.findIndex(m => m.id === message.id);
      if (existingMessageIndex !== -1) {
        console.log('⚠️ [handleNewMessage] Message already exists, skipping:', message.id);
        messageWasAddedRef.value = false;
        return prev; // Don't update state for duplicates
      }
      
      // Check if there's an optimistic message that should be replaced
      // Optimistic messages have _optimistic flag and matching content/chatId
      // CRITICAL: Match by content and chatId, and check if sender is the current user
      // This handles cases where senderId format might differ (e.g., string vs number, or different field names)
      
      // Find optimistic message to replace
      // CRITICAL: Match by content + chatId first, then verify sender
      // This handles cases where backend uses different ID format than Firebase
      const optimisticIndex = existingMessages.findIndex(m => {
        if (!m._optimistic || m.chatId !== chatId) {
          return false;
        }
        
        // Match by content (exact match, ignoring whitespace differences)
        const contentMatches = m.content?.trim() === message.content?.trim();
        
        if (!contentMatches) {
          return false;
        }
        
        // CRITICAL: If content matches and message is from current user, replace it
        // This handles the case where we sent a message and it comes back via WebSocket
        // Even if sender IDs don't match exactly (different formats), if content matches
        // and we know it's from us, it's definitely the same message
        if (isFromCurrentUser) {
          console.log('🔄 [handleNewMessage] Found optimistic message to replace (content match + isFromCurrentUser):', {
            optimisticId: m.id,
            realId: message.id,
            content: m.content?.substring(0, 30),
          });
          return true;
        }
        
        // FALLBACK: If content matches exactly and there's an optimistic message with same content
        // in the same chat, and the optimistic message was created recently (within last 5 seconds),
        // assume it's the same message even if sender IDs don't match
        // This handles backend ID format differences
        const optimisticTime = m.createdAt ? new Date(m.createdAt).getTime() : 0;
        const now = Date.now();
        const isRecent = (now - optimisticTime) < 5000; // Within 5 seconds
        
        if (isRecent && contentMatches) {
          console.log('🔄 [handleNewMessage] Found recent optimistic message to replace (content match + timing):', {
            optimisticId: m.id,
            realId: message.id,
            content: m.content?.substring(0, 30),
            timeDiff: now - optimisticTime,
          });
          return true;
        }
        
        // For messages from other users, also check senderId match (for safety)
        const senderMatches = m.senderId === messageSenderId || 
                             String(m.senderId) === String(messageSenderId);
        
        if (senderMatches && contentMatches) {
          console.log('🔄 [handleNewMessage] Found optimistic message from other user to replace:', {
            optimisticId: m.id,
            realId: message.id,
            senderId: messageSenderId,
          });
          return true;
        }
        
        return false;
      });
      
      if (optimisticIndex !== -1) {
        // Replace optimistic message with real one
        console.log('🔄 [handleNewMessage] Replacing optimistic message with real message:', {
          optimisticId: existingMessages[optimisticIndex].id,
          realId: message.id,
          contentMatch: true,
          isFromCurrentUser,
        });
        const newMessages = [...existingMessages];
        newMessages[optimisticIndex] = message; // Replace optimistic with real
        messageWasAddedRef.value = true;
        return {
          ...prev,
          [chatId]: newMessages,
        };
      }
      
      // This is a NEW message - add it
      // CRITICAL: If message is from current user but no optimistic message found,
      // it might be a duplicate or already processed - skip it to prevent duplicates
      if (isFromCurrentUser) {
        console.warn('⚠️ [handleNewMessage] Message from current user but no optimistic message found - likely duplicate, skipping:', {
          messageId: message.id,
          content: message.content?.substring(0, 50),
        });
        messageWasAddedRef.value = false;
        return prev; // Don't add duplicate messages from current user
      }
      
      // CRITICAL: Force new array reference to ensure FlatList re-renders
      messageWasAddedRef.value = true;
      console.log('✅ [handleNewMessage] Adding NEW message to chat:', chatId, message.id);
      return {
        ...prev,
        [chatId]: [...(prev[chatId] || []), message], // Force new array reference
      };
    });

    // CRITICAL: Only process notifications and updates for NEW messages
    // If message was a duplicate, exit early and don't process further
    if (!messageWasAddedRef.value) {
      console.log('⚠️ [handleNewMessage] Duplicate message - skipping notification/updates');
      return; // Exit early - don't process duplicates
    }

    // CRITICAL: Skip ALL notification and conversation updates for messages from current user
    // Messages we send should only update the message list (already done above)
    // They should NOT trigger notifications or conversation updates
    // IMPORTANT: Check isFromCurrentUser BEFORE processing notifications
    if (isFromCurrentUser) {
      console.log('ℹ️ [handleNewMessage] Message is from current user - skipping notifications and conversation updates', {
        messageId: message.id,
        senderId: messageSenderId,
        currentUserId: currentUserId,
      });
      // Still update conversation's last message for UI consistency, but skip notifications
      setConversations(prev => {
        const conversationIndex = prev.findIndex(conv => conv.id === chatId);
        if (conversationIndex !== -1) {
          const updatedConv = {
            ...prev[conversationIndex],
            lastMessage: message,
          };
          // Move to top of list (most recent first)
          const newConversations = [...prev];
          newConversations.splice(conversationIndex, 1);
          newConversations.unshift(updatedConv);
          return newConversations;
        }
        return prev;
      });
      return; // Exit early - don't process notifications for our own messages
    }
    
    // From this point on, we only process messages from OTHER users
    console.log('✅ [handleNewMessage] Processing message from other user:', {
      messageId: message.id,
      senderId: messageSenderId,
    });

    // Update conversation's last message and get conversation for notification
    // CRITICAL: Also move conversation to top of list (most recent first)
    // This code only runs for messages from OTHER users
    let conversationForNotification = null;
    setConversations(prev => {
      // Find the conversation that needs updating
      const conversationIndex = prev.findIndex(conv => conv.id === chatId);
      
      if (conversationIndex === -1) {
        // Conversation not found - fetch from API asynchronously
        // Per backend guide: Load conversation via REST API
        console.warn('⚠️ [handleNewMessage] Conversation not found in list, fetching from API...', chatId);
        
        // Fetch conversation asynchronously
        chatApi.getConversationById(chatId)
          .then(conversation => {
            if (conversation) {
              console.log('✅ [handleNewMessage] Conversation fetched from API:', conversation.id);
              
              // Add conversation to list
              setConversations(prevConvs => {
                // Check if it was already added (race condition protection)
                const exists = prevConvs.some(c => c.id === chatId);
                if (exists) {
                  return prevConvs;
                }
                
                // Add conversation with updated last message
                const newConversation = {
                  ...conversation,
                  lastMessage: message,
                  unreadCount: isActiveChat ? 0 : 1,
                };
                
                // Join the room for future messages
                const socket = chatSocketService.getSocket();
                if (socket && socket.connected) {
                  console.log(`🔄 [handleNewMessage] Joining room for fetched conversation: chat:${chatId}`);
                  chatSocketService.joinChat(chatId);
                }
                
                // Re-process the message now that conversation exists
                // This will update the conversation properly
                setTimeout(() => {
                  handleNewMessage(message);
                }, 100);
                
                return [newConversation, ...prevConvs];
              });
            }
          })
          .catch(error => {
            console.error('❌ [handleNewMessage] Failed to fetch conversation from API:', error);
            // Create minimal conversation as fallback
            const minimalConversation = {
              id: chatId,
              type: 'ONE_TO_ONE',
              lastMessage: message,
              unreadCount: isActiveChat ? 0 : 1,
              participants: message.sender ? [message.sender] : [],
              createdAt: message.createdAt,
            };
            setConversations(prevConvs => {
              const exists = prevConvs.some(c => c.id === chatId);
              if (exists) {
                return prevConvs;
              }
              return [minimalConversation, ...prevConvs];
            });
          });
        
        // Return unchanged state temporarily (will be updated when conversation is fetched)
        return prev;
      }
      
      // Update the conversation
      // Per backend guide: Don't manually increment unread count (backend handles it)
      // We'll refresh from API to get accurate count
      const updatedConv = {
        ...prev[conversationIndex],
        lastMessage: message,
        // Unread count will be refreshed from API below
      };
      
      // Store conversation for notification if not active chat
      if (!isActiveChat) {
        conversationForNotification = updatedConv;
      }
      
      // Move updated conversation to top of list (most recent first)
      const newConversations = [...prev];
      newConversations.splice(conversationIndex, 1); // Remove from current position
      newConversations.unshift(updatedConv); // Add to top
      
      console.log('✅ [handleNewMessage] Updated conversation in list:', {
        chatId,
        newUnreadCount: updatedConv.unreadCount,
        hasLastMessage: !!updatedConv.lastMessage,
        movedToTop: true,
      });
      
      return newConversations;
    });

    // Per backend guide: Don't manually increment unread count
    // Backend automatically increments when message is sent
    // We'll refresh unread count from API when needed
    
    // CRITICAL: Double-check isFromCurrentUser before showing notifications
    // This is a safety check in case the earlier check didn't work
    // Re-check sender identification to be absolutely sure (use same logic as above)
    const finalIdMatch = currentUserIdStr && messageSenderIdStr && (
      messageSenderIdStr === currentUserIdStr ||
      messageSenderIdStr.includes(currentUserIdStr) ||
      currentUserIdStr.includes(messageSenderIdStr)
    );
    
    const finalEmailMatch = currentUserEmail && messageSenderEmail && 
      currentUserEmail.toLowerCase().trim() === messageSenderEmail.toLowerCase().trim();
    
    const finalIsFromCurrentUser = finalIdMatch || finalEmailMatch;
    
    if (finalIsFromCurrentUser) {
      console.log('ℹ️ [handleNewMessage] Final check: Message is from current user - skipping notification');
      return; // Exit early - don't show notifications for own messages
    }
    
    // Show local notification if chat is not active (only for NEW messages from OTHER users)
    if (!isActiveChat) {
      // Use the conversation we just updated, or create a minimal one
      if (!conversationForNotification) {
        conversationForNotification = { id: chatId, lastMessage: message };
      }
      
      console.log('🔔 [handleNewMessage] Showing notification for new message from other user:', message.id);
      showMessageNotification(message, conversationForNotification);
      
      // Refresh unread count and conversations from API (backend is source of truth)
      // This ensures accurate unread counts per conversation
      loadUnreadCount();
      loadConversations(); // Refresh conversations to get accurate unread counts
    } else {
      console.log('ℹ️ [handleNewMessage] Chat is active, skipping notification');
    }
  }, [activeChatId, showMessageNotification, loadUnreadCount, loadConversations]);

  /**
   * Handle new chat created
   */
  const handleNewChat = useCallback((chat) => {
    setConversations(prev => {
      // Check if chat already exists
      const exists = prev.some(c => c.id === chat.id);
      if (exists) {
        return prev;
      }
      return [chat, ...prev];
    });
  }, []);

  /**
   * Load unread message count
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await chatApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, []);

  /**
   * Handle chat notification from WebSocket
   * CRITICAL: Backend sends notifications to user:{userId} room (always delivered)
   * This is different from chat:message which is sent to chat:{chatId} room (only if joined)
   * 
   * Per backend guide:
   * - notification.data does NOT contain full message object (only metadata)
   * - Use notification.data.chatId and notification.message (truncated content)
   * - Fetch full message if needed via API
   * - Backend automatically increments unread count, so refresh from API
   */
  const handleChatNotification = useCallback(async (notification) => {
    console.log('🔔 [handleChatNotification] Received notification event:', {
      type: notification.type,
      chatId: notification.data?.chatId,
      messageId: notification.data?.messageId,
    });
    
    // Handle chat message notifications
    if (notification.type === 'CHAT_MESSAGE' || notification.type === 'chat_message') {
      // Per backend guide: chatId is in notification.data.chatId (NOT directly on notification)
      const chatId = notification.data?.chatId || notification.chatId;
      const messageId = notification.data?.messageId;
      const isActiveChat = chatId === activeChatId;
      
      if (!chatId) {
        console.warn('⚠️ [handleChatNotification] Notification missing chatId:', notification);
        return;
      }
      
      console.log('🔔 [handleChatNotification] Chat message notification:', {
        chatId,
        messageId,
        isActiveChat,
        hasTitle: !!notification.title,
        hasMessage: !!notification.message,
      });
      
      // CRITICAL: Show notification using Notifications.scheduleNotificationAsync
      // This ensures notifications appear even when app is in foreground
      // Only show if chat is not active (user is not viewing it)
      if (!isActiveChat && notification.title && notification.message) {
        try {
          console.log('📱 [handleChatNotification] Scheduling notification (chat not active)');
          await Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.message, // Truncated content from backend
              data: {
                chatId: chatId,
                messageId: messageId,
                type: 'CHAT_MESSAGE',
                ...notification.data, // Include all metadata
              },
              sound: 'default',
            },
            trigger: null, // Show immediately
          });
          console.log('✅ [handleChatNotification] Notification scheduled successfully');
        } catch (err) {
          console.error('❌ [handleChatNotification] Error scheduling notification:', err);
        }
      } else {
        console.log('ℹ️ [handleChatNotification] Chat is active, skipping notification');
      }
      
      // Per backend guide: notification.data.message does NOT contain full message object
      // We need to update conversation list with partial data from notification
      // The full message will come via chat:message event if we're in the room
      setConversations(prev => {
        const conversationIndex = prev.findIndex(conv => conv.id === chatId);
        
        if (conversationIndex === -1) {
          // Conversation not in list - fetch from API
          console.warn('⚠️ [handleChatNotification] Conversation not in list, fetching from API...', chatId);
          chatApi.getConversationById(chatId)
            .then(conversation => {
              if (conversation) {
                console.log('✅ [handleChatNotification] Conversation fetched from API:', conversation.id);
                setConversations(prevConvs => {
                  const exists = prevConvs.some(c => c.id === chatId);
                  if (exists) {
                    return prevConvs;
                  }
                  
                  // Add conversation with notification data
                  const newConversation = {
                    ...conversation,
                    lastMessage: {
                      id: messageId,
                      content: notification.message, // Truncated
                      createdAt: notification.createdAt,
                    },
                    unreadCount: isActiveChat ? 0 : 1,
                  };
                  
                  // Join the room for future messages
                  const socket = chatSocketService.getSocket();
                  if (socket && socket.connected) {
                    console.log(`🔄 [handleChatNotification] Joining room: chat:${chatId}`);
                    chatSocketService.joinChat(chatId);
                  }
                  
                  return [newConversation, ...prevConvs];
                });
              }
            })
            .catch(error => {
              console.error('❌ [handleChatNotification] Failed to fetch conversation:', error);
            });
          
          return prev; // Return unchanged temporarily
        }
        
        // Update existing conversation
        // Per backend guide: Don't manually increment unread count (backend handles it)
        const updated = [...prev];
        updated[conversationIndex] = {
          ...updated[conversationIndex],
          lastMessage: {
            id: messageId,
            content: notification.message, // Truncated content
            createdAt: notification.createdAt,
          },
          // Unread count will be refreshed from API below
        };
        
        // Move to top
        const [conv] = updated.splice(conversationIndex, 1);
        updated.unshift(conv);
        
        return updated;
      });
      
      // Per backend guide: Backend automatically increments unread count
      // Don't manually increment - refresh from API
      await loadUnreadCount();
    } else {
      console.log('🔔 [handleChatNotification] Non-chat notification type:', notification.type);
    }
  }, [activeChatId, loadUnreadCount]);

  /**
   * Set up WebSocket event listeners
   */
  const setupSocketListeners = useCallback(() => {
    // Clean up existing listeners first
    cleanupSocketListeners();

    // CRITICAL: Listen for new messages - this is the SINGLE SOURCE OF TRUTH
    // All messages (including ones we send) come through this event
    const messageUnsubscribe = chatSocketService.onMessage((message) => {
      console.log('📨 [WebSocket] New message received (single source of truth):', message);
      handleNewMessage(message);
    });
    messageUnsubscribers.current['global'] = messageUnsubscribe;

    // Listen for new chats
    chatCreatedUnsubscriber.current = chatSocketService.onChatCreated((chat) => {
      console.log('💬 WebSocket chat created:', chat);
      handleNewChat(chat);
    });

    // Listen for notifications
    notificationUnsubscriber.current = chatSocketService.onNotification((notification) => {
      console.log('🔔 WebSocket notification:', notification);
      handleChatNotification(notification);
    });
  }, [handleNewMessage, handleNewChat, handleChatNotification]);

  /**
   * Clean up WebSocket listeners
   */
  const cleanupSocketListeners = useCallback(() => {
    Object.values(messageUnsubscribers.current).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    messageUnsubscribers.current = {};

    if (chatCreatedUnsubscriber.current) {
      chatCreatedUnsubscriber.current();
      chatCreatedUnsubscriber.current = null;
    }

    if (notificationUnsubscriber.current) {
      notificationUnsubscriber.current();
      notificationUnsubscriber.current = null;
    }
  }, []);


  /**
   * Load all conversations
   */
  const loadConversations = useCallback(async (returnData = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatApi.getConversations();
      const conversationsList = data || [];
      setConversations(conversationsList);
      
      // Return data if requested (for immediate room joining)
      if (returnData) {
        return conversationsList;
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
      if (returnData) {
        return [];
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load messages for a specific chat
   */
  const loadMessages = useCallback(async (chatId, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatApi.getMessages(chatId, options);
      setMessages(prev => ({
        ...prev,
        [chatId]: data || [],
      }));
      return data;
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Send a message
   * Per backend guide: Backend guarantees sender receives chat:message event (if room is joined)
   * We add optimistic updates for better UX, then replace with real message when WebSocket confirms
   */
  const sendMessage = useCallback(async (chatId, content) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create optimistic message for immediate UI feedback
    // CRITICAL: Use same ID format as backend might use (check both uid and id)
    const currentUserIdForOptimistic = user?.uid || user?.id;
    const optimisticMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      chatId,
      content,
      senderId: currentUserIdForOptimistic, // Use same format as we check in handleNewMessage
      sender: {
        id: currentUserIdForOptimistic,
        userId: currentUserIdForOptimistic, // Also include userId field for matching
        email: user?.email, // Include email for fallback matching
        name: user.displayName || user.email?.split('@')[0] || 'You',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _optimistic: true, // Flag to identify optimistic messages
    };

    // Add optimistic message to UI immediately
    console.log('📤 [ChatContext] Adding optimistic message:', optimisticMessage.id);
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), optimisticMessage],
    }));

    try {
      setError(null);
      console.log('📤 [ChatContext] Sending message via API:', { chatId, contentLength: content.length });
      
      // Send via API - backend will broadcast chat:message event
      const realMessage = await chatApi.sendMessage(chatId, content);
      console.log('✅ [ChatContext] Message sent to API - waiting for WebSocket broadcast...', realMessage?.id);
      
      // The WebSocket 'chat:message' event will replace the optimistic message
      // We don't need to manually replace it here because handleNewMessage will handle it
      // (it checks for duplicates and will replace the optimistic one with the real one)
      
      return realMessage;
    } catch (err) {
      console.error('❌ [ChatContext] Error sending message:', err);
      
      // Remove optimistic message on failure
      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter(msg => msg.id !== optimisticMessage.id),
      }));
      
      setError(err.message || 'Failed to send message');
      throw err;
    }
  }, [user]);

  /**
   * Open a chat (load messages and join room)
   */
  const openChat = useCallback(async (chatId) => {
    try {
      setActiveChatId(chatId);
      
      // Join WebSocket room
      chatSocketService.joinChat(chatId);

      // Load messages if not already loaded
      if (!messages[chatId]) {
        await loadMessages(chatId);
      }

      // Mark chat as read
      await markChatAsRead(chatId);
    } catch (err) {
      console.error('Error opening chat:', err);
      setError(err.message || 'Failed to open chat');
    }
  }, [messages, loadMessages]);

  /**
   * Close a chat (leave room)
   */
  const closeChat = useCallback((chatId) => {
    chatSocketService.leaveChat(chatId);
    setActiveChatId(null);
  }, []);

  /**
   * Create a one-to-one chat
   */
  const createOneToOneChat = useCallback(async (otherUserId) => {
    try {
      setError(null);
      const chat = await chatApi.createOneToOneChat(otherUserId);
      
      // Add to conversations list
      setConversations(prev => {
        const exists = prev.some(c => c.id === chat.id);
        if (exists) {
          return prev;
        }
        return [chat, ...prev];
      });

      return chat;
    } catch (err) {
      console.error('Error creating one-to-one chat:', err);
      setError(err.message || 'Failed to create chat');
      throw err;
    }
  }, []);

  /**
   * Create a group chat
   */
  const createGroupChat = useCallback(async (groupData) => {
    try {
      setError(null);
      const chat = await chatApi.createGroupChat(groupData);
      
      // Add to conversations list
      setConversations(prev => {
        const exists = prev.some(c => c.id === chat.id);
        if (exists) {
          return prev;
        }
        return [chat, ...prev];
      });

      return chat;
    } catch (err) {
      console.error('Error creating group chat:', err);
      setError(err.message || 'Failed to create group chat');
      throw err;
    }
  }, []);

  /**
   * Mark chat as read
   * Per backend guide: Emit WebSocket event after marking as read via API
   */
  const markChatAsRead = useCallback(async (chatId) => {
    try {
      // Mark as read via API
      await chatApi.markChatAsRead(chatId);
      
      // CRITICAL: Emit WebSocket event to notify other participants (per backend guide)
      if (chatSocketService.getConnectionStatus() && chatSocketService.getSocket()) {
        console.log('📡 Emitting chat:read event for chat:', chatId);
        chatSocketService.getSocket().emit('chat:read', { chatId });
      }
      
      // Update local state
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === chatId) {
            return {
              ...conv,
              unreadCount: 0,
            };
          }
          return conv;
        });
      });

      // Update unread count
      await loadUnreadCount();
    } catch (err) {
      console.error('Error marking chat as read:', err);
    }
  }, []);

  /**
   * Get messages for a specific chat
   */
  const getChatMessages = useCallback((chatId) => {
    return messages[chatId] || [];
  }, [messages]);

  /**
   * Get a specific conversation
   */
  const getConversation = useCallback((chatId) => {
    return conversations.find(conv => conv.id === chatId);
  }, [conversations]);

  const value = {
    // State
    conversations,
    messages,
    activeChatId,
    unreadCount,
    loading,
    error,
    isSocketConnected,

    // Actions
    loadConversations,
    loadMessages,
    sendMessage,
    openChat,
    closeChat,
    createOneToOneChat,
    createGroupChat,
    markChatAsRead,
    loadUnreadCount,
    getChatMessages,
    getConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

