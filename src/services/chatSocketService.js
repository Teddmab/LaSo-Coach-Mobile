import { io } from 'socket.io-client';
import axios from 'axios';
import Config from '../config/env';
import firebaseAuthService from './firebaseAuthServiceNew';

/**
 * Chat WebSocket Service
 * Manages Socket.IO connection for real-time chat functionality
 */
class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.listeners = new Map();
    this.joinedRooms = new Set();
    this.firstHandshakeTimestamp = null; // Track first handshake attempt
    this.handshakeInFlight = false; // Ensure only one handshake at a time
  }

  /**
   * Initialize and connect to WebSocket server
   * @param {Function} onConnect - Callback when connected
   * @param {Function} onDisconnect - Callback when disconnected
   * @param {Function} onError - Callback on error
   */
  async connect(onConnect, onDisconnect, onError) {
    // REMEDIATION STEP 5: Keep singleton socket instance - no manual destroy/recreate loop
    // If socket exists and is connected, don't create another
    if (this.socket && this.socket.connected) {
      console.log('🔌 Socket already connected (singleton enforced)');
      return;
    }
    
    // REMEDIATION STEP 7: Ensure only one handshake in flight
    if (this.handshakeInFlight) {
      console.log('🔌 Handshake already in flight, waiting...');
      let attempts = 0;
      while (this.handshakeInFlight && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        if (this.socket && this.socket.connected) {
          console.log('🔌 Socket connected while waiting');
          return;
        }
      }
      if (this.handshakeInFlight) {
        console.warn('⚠️ Handshake still in flight after timeout');
        return;
      }
    }
    
    // If socket exists and is connecting, wait for it to complete
    if (this.socket && this.socket.connecting) {
      console.log('🔌 Socket already connecting, waiting for connection...');
      let attempts = 0;
      while (this.socket.connecting && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        if (this.socket.connected) {
          console.log('🔌 Socket connected while waiting');
          return;
        }
      }
      if (this.socket.connecting) {
        console.warn('⚠️ Socket still connecting after timeout, but not creating duplicate');
        return;
      }
    }
    
    // If we're in the process of connecting (but socket doesn't exist yet), wait
    if (this.isConnecting) {
      console.log('🔌 Connection in progress, waiting...');
      let attempts = 0;
      while (this.isConnecting && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        if (this.isConnected || (this.socket && this.socket.connected)) {
          console.log('🔌 Socket connected while waiting');
          return;
        }
      }
    }

    try {
      this.isConnecting = true;
      this.handshakeInFlight = true;
      
      // REMEDIATION STEP 4a: Confirm Firebase token is available
      console.log('🔐 Step 1: Confirming Firebase token...');
      const idToken = await firebaseAuthService.getIdToken();
      if (!idToken) {
        console.error('❌ No Firebase ID token available for WebSocket connection');
        this.isConnecting = false;
        this.handshakeInFlight = false;
        if (onError) onError(new Error('No authentication token available'));
        return;
      }
      console.log('✅ Firebase token confirmed');
      
      // REMEDIATION STEP 4b: Warm up service with lightweight API call
      // Backend requirement: Instance must be warm before Socket.IO connection
      // This prevents "x-render-routing: no-server" 404 errors from cold starts
      console.log('🔥 Step 2: Warming up service with health check...');
      try {
        const healthResponse = await axios.get(`${Config.API_BASE_URL}/health`, {
          timeout: 10000,
        });
        console.log('✅ Service warmed up:', healthResponse.status);
        
        // Backend recommendation: Brief delay after warmup to ensure instance is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ Warmup delay complete, instance should be ready');
      } catch (healthError) {
        console.warn('⚠️ Health check failed (non-fatal, continuing):', healthError.message);
        // Don't block connection if health check fails, but log it
        // Still add brief delay to allow instance to wake up
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const wsUrl = Config.WS_BASE_URL;
      console.log('🔌 Connecting to WebSocket server:', {
        url: wsUrl,
        hasToken: !!idToken,
        tokenLength: idToken.length,
        tokenPrefix: idToken.substring(0, 20) + '...',
      });

      // Only clean up if socket exists and is truly disconnected
      // Don't aggressively tear down - let Socket.IO handle reconnection
      if (this.socket && !this.socket.connected && !this.socket.connecting) {
        console.log('🧹 Cleaning up disconnected socket...');
        // Remove all event listeners from old socket
        this.socket.io.off('reconnect_attempt');
        this.socket.io.off('reconnect');
        this.socket.io.off('reconnect_failed');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      } else if (this.socket && (this.socket.connected || this.socket.connecting)) {
        // Socket is already connected or connecting - don't create duplicate
        console.log('ℹ️ Socket already exists and is connected/connecting, skipping new connection');
        this.isConnecting = false;
        return;
      }

      // REMEDIATION STEP 1: Remove explicit :443 suffix
      // Use: https://lasocoach-backend.onrender.com (no port)
      // CRITICAL: Socket.IO might add port back, so we need to be very aggressive
      let connectionUrl = wsUrl;
      if (connectionUrl.startsWith('wss://')) {
        connectionUrl = connectionUrl.replace('wss://', 'https://');
      } else if (connectionUrl.startsWith('ws://')) {
        connectionUrl = connectionUrl.replace('ws://', 'http://');
      }
      
      // CRITICAL: Remove explicit port (:443) completely using URL parsing
      // This prevents "x-render-routing: no-server" errors
      // Socket.IO will try to add ports, so we must ensure URL has no port
      try {
        const urlObj = new URL(connectionUrl);
        // Always remove port - Socket.IO will use default ports (443 for https, 80 for http)
        // But we don't want Socket.IO to add it back, so we ensure it's empty
        urlObj.port = '';
        connectionUrl = urlObj.toString();
        // Remove trailing slash
        connectionUrl = connectionUrl.replace(/\/$/, '');
      } catch (e) {
        // Fallback: aggressive regex removal if URL parsing fails
        console.warn('⚠️ URL parsing failed, using regex fallback:', e);
        connectionUrl = connectionUrl.replace(/:443\/?$/, ''); // Remove :443 at end
        connectionUrl = connectionUrl.replace(/:443\//, '/'); // Remove :443 before /
        connectionUrl = connectionUrl.replace(/:443/, ''); // Remove any remaining :443
        connectionUrl = connectionUrl.replace(/:80\/?$/, ''); // Remove :80 at end
        connectionUrl = connectionUrl.replace(/:80\//, '/'); // Remove :80 before /
        connectionUrl = connectionUrl.replace(/:80/, ''); // Remove any remaining :80
        connectionUrl = connectionUrl.replace(/\/$/, ''); // Remove trailing slash
      }
      
      // CRITICAL: Final verification and force removal of any port
      // Socket.IO might add port back, so we do a final aggressive cleanup
      if (connectionUrl.includes(':443') || connectionUrl.includes(':80')) {
        console.error('❌ CRITICAL: URL still contains port after processing!', connectionUrl);
        // Force remove any remaining port using regex
        connectionUrl = connectionUrl.replace(/:\d+/, '');
      }
      
      // Additional safety: Remove any port pattern that might have been added
      connectionUrl = connectionUrl.replace(/:\d+(\/|$)/, '$1');
      
      console.log('🔍 URL processing (remediation step 1):', {
        original: wsUrl,
        final: connectionUrl,
        hasPort: connectionUrl.includes(':443') || connectionUrl.includes(':80'),
        urlLength: connectionUrl.length,
      });
      
      // Final assertion: URL must not have a port
      if (connectionUrl.match(/:\d+/)) {
        console.error('❌ FATAL: URL still has port pattern! Forcing removal...');
        connectionUrl = connectionUrl.replace(/:\d+/, '');
      }
      
      const connectionToken = idToken;
      
      // CRITICAL: Remove Bearer prefix - backend expects token without Bearer
      const tokenWithoutBearer = connectionToken.startsWith('Bearer ') 
        ? connectionToken.replace('Bearer ', '') 
        : connectionToken;
      
      // Store for error logging (needs to be accessible in error handler)
      this.connectionUrl = connectionUrl;
      this.tokenWithoutBearer = tokenWithoutBearer;

      // Create socket connection with authentication
      // CRITICAL: Use standard Socket.IO client with default path (/socket.io)
      // Backend confirms: Only /socket.io is valid, no path cycling needed
      // Let Socket.IO handle reconnection automatically
      console.log('🔌 Connecting to Socket.IO server:', {
        url: connectionUrl,
        originalUrl: wsUrl,
        path: 'default (/socket.io)',
        transport: 'websocket-only (no polling)',
        upgrade: false,
        hasToken: !!tokenWithoutBearer,
        tokenLength: tokenWithoutBearer.length,
        tokenPrefix: tokenWithoutBearer.substring(0, 30) + '...',
        config: {
          transports: ['websocket'],
          upgrade: false,
          rememberUpgrade: false,
        },
      });
      
      // Log the exact connection URL that will be used
      console.log('🔍 Connection details:', {
        finalUrl: connectionUrl,
        willConnectTo: `${connectionUrl}/socket.io/`,
        authTokenPresent: !!tokenWithoutBearer,
        authTokenLength: tokenWithoutBearer?.length || 0,
      });
      
      // CRITICAL: Use standard Socket.IO client configuration (matches Admin FE)
      // Backend confirmed: Admin FE uses standard socket.io-client with default behavior
      // Default: polling first, then upgrade to websocket
      // 
      // IMPORTANT: The 404 error suggests the path might be wrong
      // Backend needs to confirm the correct Socket.IO path
      // For now, we'll try the default path and log detailed errors
      this.socket = io(connectionUrl, {
        auth: {
          token: tokenWithoutBearer, // RAW Firebase ID token - NO Bearer prefix (backend confirmed)
        },
        // Match Admin FE configuration exactly (working pattern)
        // Admin FE explicitly sets path and uses these exact settings
        transports: ['websocket'], // Websocket-only (matches Admin FE)
        path: '/socket.io', // EXPLICITLY SET (matches Admin FE - they set this explicitly)
        timeout: 10000, // Match Admin FE: 10000ms (10 seconds)
        reconnection: true, // Built-in reconnection
        reconnectionAttempts: 5, // Match Admin FE: 5 attempts
        reconnectionDelay: 1000, // Match Admin FE: 1000ms (1 second)
        reconnectionDelayMax: 6000, // Keep max delay
        autoConnect: true,
        forceNew: true, // Prevent duplicate instances
        // CRITICAL: Force Socket.IO to not add port to URL
        // This prevents :443 from being added which causes routing issues
        // Socket.IO will use default ports based on protocol (443 for https, 80 for http)
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        const connectionTime = Date.now();
        const handshakeDuration = this.firstHandshakeTimestamp 
          ? connectionTime - this.firstHandshakeTimestamp 
          : null;
        
        console.log('✅✅✅ Connected to chat server:', {
          socketId: this.socket.id,
          connected: this.socket.connected,
          transport: this.socket.io?.engine?.transport?.name,
          handshakeDuration: handshakeDuration ? `${handshakeDuration}ms` : 'unknown',
          timestamp: new Date(connectionTime).toISOString(),
        });
        this.isConnected = true;
        this.isConnecting = false;
        this.handshakeInFlight = false;
        this.reconnectAttempts = 0;
        
        // CRITICAL: Subscribe to notifications after connection (per backend guide)
        console.log('📡 Subscribing to notifications...');
        this.socket.emit('subscribe:notifications');
        
        // Note: Rooms will be joined immediately in handleConnect callback
        // which fetches conversations and joins all rooms synchronously
        
        if (onConnect) onConnect();
      });
      
      // Add additional event listeners for debugging
      this.socket.io.on('error', (error) => {
        console.log('🔴 [Socket.IO] io error event fired:', error);
      });
      
      this.socket.io.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 [Socket.IO] Reconnect attempt ${attemptNumber}`);
      });
      
      this.socket.io.on('reconnect', (attemptNumber) => {
        console.log(`✅ [Socket.IO] Reconnected after ${attemptNumber} attempts`);
      });
      
      this.socket.io.on('reconnect_failed', () => {
        console.log('❌ [Socket.IO] Reconnect failed');
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from chat server:', reason);
        this.isConnected = false;
        this.joinedRooms.clear();
        if (onDisconnect) onDisconnect(reason);
      });

      this.socket.on('connect_error', (error) => {
        // Detailed error logging for troubleshooting
        const errorMessage = error?.message || 'Unknown connection error';
        const errorType = error?.type || 'unknown';
        const errorDescription = error?.description || '';
        const errorContext = error?.context || {};
        
        // Check if socket is actually connected despite the error
        const isActuallyConnected = this.socket?.connected || this.isConnected;
        
        if (isActuallyConnected) {
          console.log('⚠️ Transport error but socket is connected (non-fatal):', {
            message: errorMessage,
            socketId: this.socket?.id,
          });
          return;
        }
        
        // REMEDIATION STEP 8: Enhanced error logging for 404 with cf-ray header
        // For websocket errors, the error structure is different from polling errors
        const responseStatus = errorContext?.status || errorDescription || error?.status;
        const responseHeaders = errorContext?.responseHeaders || errorContext?._lowerCaseResponseHeaders || error?.headers || {};
        const requestUrl = errorContext?._url || errorContext?.responseURL || error?.url || '';
        const cfRay = responseHeaders['cf-ray'] || responseHeaders['CF-Ray'] || 'N/A';
        
        // Try to extract URL from error message or construct it
        let actualRequestUrl = requestUrl;
        if (!actualRequestUrl && this.connectionUrl) {
          // Construct the likely URL being requested
          actualRequestUrl = `${this.connectionUrl}/socket.io/?EIO=4&transport=websocket`;
        }
        
        console.error('❌ Socket connection error (detailed):', {
          message: errorMessage,
          type: errorType,
          description: errorDescription,
          status: responseStatus,
          requestUrl: requestUrl,
          cfRay: cfRay, // Cloudflare ray ID for debugging
          responseHeaders: responseHeaders,
          url: this.connectionUrl,
          path: 'default (/socket.io)',
          transport: 'websocket-only',
          hasToken: !!this.tokenWithoutBearer,
          tokenLength: this.tokenWithoutBearer?.length || 0,
          tokenPrefix: this.tokenWithoutBearer?.substring(0, 20) + '...',
          socketId: this.socket?.id,
          socketConnected: this.socket?.connected,
          socketConnecting: this.socket?.connecting,
          handshakeTimestamp: this.firstHandshakeTimestamp 
            ? new Date(this.firstHandshakeTimestamp).toISOString() 
            : 'N/A',
          errorResponse: errorContext?._response || errorContext?.response,
        });
        
        // REMEDIATION STEP 8: Capture details for 404 with x-render-routing:no-server
        if (responseStatus === 404 || (typeof responseStatus === 'object' && responseStatus?.message?.includes('404'))) {
          console.error('🚨 404 ERROR - Path not found!');
          console.error('   Connection URL:', this.connectionUrl);
          console.error('   Requested URL:', actualRequestUrl || requestUrl || 'Unable to determine');
          console.error('   Error Message:', errorMessage);
          console.error('   Error Description:', typeof errorDescription === 'object' ? errorDescription?.message : errorDescription);
          console.error('   CF-Ray:', cfRay);
          console.error('   Response Headers:', JSON.stringify(responseHeaders, null, 2));
          console.error('   Full Error Context:', JSON.stringify(errorContext, null, 2));
          console.error('');
          console.error('   ⚠️ This is likely a Render cold start / routing issue!');
          console.error('   The request was terminated by Render edge router BEFORE reaching backend.');
          console.error('   This happens when:');
          console.error('     1. Instance is cold starting / not ready');
          console.error('     2. Socket.IO connects before REST warmup completes');
          console.error('     3. Edge/CDN interaction with WebSocket upgrade protocol');
          console.error('');
          console.error('   ✅ Path is correct: /socket.io/ (backend confirmed)');
          console.error('   ✅ URL is correct: https://lasocoach-backend.onrender.com');
          console.error('   ✅ Configuration matches backend recommendations');
          console.error('');
          console.error('   🔍 NEXT STEPS:');
          console.error('   1. Ensure warmup REST call succeeds before socket init');
          console.error('   2. Check if instance is cold (Render free tier sleeps)');
          console.error('   3. Verify backend logs show request reached Node process');
          console.error('   4. If no backend logs, this confirms edge router termination');
          
          if (responseHeaders['x-render-routing'] === 'no-server') {
            console.error('');
            console.error('   🚨 CRITICAL: x-render-routing: no-server detected!');
            console.error('   This indicates a Render routing issue');
          }
        }
        
        this.handshakeInFlight = false;
        
        this.isConnecting = false;
        
        // Check for auth errors
        const isAuthError = errorMessage.includes('unauthorized') || 
                           errorMessage.includes('authentication') ||
                           errorMessage.includes('token') ||
                           errorDescription === 401;
        
        if (onError && isAuthError) {
          onError(error);
        }
      });

      this.socket.on('error', (error) => {
        // Only log actual errors, not connection errors (which are handled above)
        const errorMessage = error?.message || 'Unknown error';
        if (!errorMessage.includes('websocket') && !errorMessage.includes('connection')) {
          console.error('❌ Socket error:', error);
          if (onError) onError(error);
        }
      });

      // Reconnection handlers
      this.socket.io.on('reconnect_attempt', (attemptNumber) => {
        // Only log every 10th reconnection attempt to reduce log spam
        if (attemptNumber % 10 === 0 || attemptNumber <= 3) {
          console.log(`🔄 WebSocket reconnection attempt ${attemptNumber} (this is normal during network issues)`);
        }
      });

      this.socket.io.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.isConnecting = false;
        this.handshakeInFlight = false; // Reset handshake flag on reconnect
        this.reconnectAttempts = 0;
        
        // CRITICAL: Subscribe to notifications after reconnection
        console.log('📡 Re-subscribing to notifications after reconnect...');
        this.socket.emit('subscribe:notifications');
        
        // Note: Rooms will be rejoined by the useEffect in ChatContext
        // that watches isSocketConnected and conversations
        // We don't need to manually rejoin here because the useEffect will handle it
      });

      this.socket.io.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed after maximum attempts');
        this.isConnecting = false;
        this.isConnected = false;
        // Don't call onError here - let the user manually retry or wait for next connection attempt
        // The socket.io client will keep trying to reconnect
        console.log('ℹ️ Socket.io will continue attempting to reconnect in the background');
      });

    } catch (error) {
      console.error('❌ Error initializing WebSocket connection:', error);
      this.isConnecting = false;
      this.handshakeInFlight = false;
      if (onError) onError(error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from chat server');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.joinedRooms.clear();
      this.listeners.clear();
    }
  }

  /**
   * Manually trigger reconnection if socket exists but is disconnected
   * CRITICAL: Only use this if Socket.IO's automatic reconnection isn't working
   * In most cases, Socket.IO handles reconnection automatically
   */
  reconnect() {
    if (this.socket) {
      // Socket exists - use its built-in reconnect
      if (!this.socket.connected && !this.socket.connecting) {
        console.log('🔄 Manually triggering socket reconnection...');
        this.socket.connect();
      } else {
        console.log('ℹ️ Socket already connected/connecting, Socket.IO will handle reconnection');
      }
    } else {
      // No socket - need to call connect() to create one
      console.log('ℹ️ No socket exists - call connect() to create new connection');
    }
  }
  
  /**
   * Update authentication token (for token refresh)
   * @param {string} newToken - New Firebase ID token
   */
  updateAuthToken(newToken) {
    if (!this.socket) {
      console.warn('⚠️ Cannot update auth token: socket does not exist');
      return;
    }
    
    // Remove Bearer prefix if present
    const tokenWithoutBearer = newToken.startsWith('Bearer ') 
      ? newToken.replace('Bearer ', '') 
      : newToken;
    
    // Update socket auth
    this.socket.auth = { token: tokenWithoutBearer };
    
    // If disconnected, reconnect with new token
    if (!this.socket.connected) {
      console.log('🔄 Reconnecting with updated auth token...');
      this.socket.connect();
    } else {
      console.log('✅ Auth token updated (socket already connected)');
    }
  }

  /**
   * Join a chat room
   * @param {string} chatId - Chat ID to join
   */
  joinChat(chatId) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Cannot join chat: socket not connected');
      return;
    }

    if (this.joinedRooms.has(chatId)) {
      console.log(`ℹ️ Already joined chat: ${chatId}`);
      return;
    }

    console.log(`🔌 Joining chat room: ${chatId}`);
    this.socket.emit('chat:join', { chatId });
    this.joinedRooms.add(chatId);
  }

  /**
   * Leave a chat room
   * @param {string} chatId - Chat ID to leave
   */
  leaveChat(chatId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    if (!this.joinedRooms.has(chatId)) {
      return;
    }

    console.log(`🔌 Leaving chat room: ${chatId}`);
    this.socket.emit('chat:leave', { chatId });
    this.joinedRooms.delete(chatId);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markNotificationRead(notificationId) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Cannot mark notification read: socket not connected');
      return;
    }

    this.socket.emit('notification:read', notificationId);
  }

  /**
   * Subscribe to chat message events
   * @param {Function} callback - Callback function for new messages
   * @returns {Function} Unsubscribe function
   */
  onMessage(callback) {
    if (!this.socket) {
      console.warn('⚠️ Cannot subscribe to messages: socket not initialized');
      return () => {};
    }

    const listener = (message) => {
      console.log('📨 [chatSocketService] Raw WebSocket message received:', {
        messageId: message?.id,
        chatId: message?.chatId || message?.chat?.id,
        hasContent: !!message?.content,
        senderId: message?.senderId || message?.sender?.id,
        fullMessage: message,
      });
      callback(message);
    };

    this.socket.on('chat:message', listener);
    const unsubscribe = () => {
      this.socket.off('chat:message', listener);
    };

    // Store listener for cleanup
    const key = `chat:message-${Date.now()}`;
    this.listeners.set(key, { event: 'chat:message', listener, unsubscribe });

    return unsubscribe;
  }

  /**
   * Subscribe to chat created events
   * @param {Function} callback - Callback function for new chats
   * @returns {Function} Unsubscribe function
   */
  onChatCreated(callback) {
    if (!this.socket) {
      return () => {};
    }

    const listener = (chat) => {
      console.log('💬 New chat created:', chat);
      callback(chat);
    };

    this.socket.on('chat:created', listener);
    const unsubscribe = () => {
      this.socket.off('chat:created', listener);
    };

    const key = `chat:created-${Date.now()}`;
    this.listeners.set(key, { event: 'chat:created', listener, unsubscribe });

    return unsubscribe;
  }

  /**
   * Subscribe to participant added events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onParticipantAdded(callback) {
    if (!this.socket) {
      return () => {};
    }

    const listener = (participant) => {
      console.log('➕ Participant added:', participant);
      callback(participant);
    };

    this.socket.on('chat:participant_added', listener);
    const unsubscribe = () => {
      this.socket.off('chat:participant_added', listener);
    };

    const key = `chat:participant_added-${Date.now()}`;
    this.listeners.set(key, { event: 'chat:participant_added', listener, unsubscribe });

    return unsubscribe;
  }

  /**
   * Subscribe to participant removed events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onParticipantRemoved(callback) {
    if (!this.socket) {
      return () => {};
    }

    const listener = (participantId) => {
      console.log('➖ Participant removed:', participantId);
      callback(participantId);
    };

    this.socket.on('chat:participant_removed', listener);
    const unsubscribe = () => {
      this.socket.off('chat:participant_removed', listener);
    };

    const key = `chat:participant_removed-${Date.now()}`;
    this.listeners.set(key, { event: 'chat:participant_removed', listener, unsubscribe });

    return unsubscribe;
  }

  /**
   * Subscribe to notification events
   * @param {Function} callback - Callback function for notifications
   * @returns {Function} Unsubscribe function
   */
  onNotification(callback) {
    if (!this.socket) {
      return () => {};
    }

    const listener = (notification) => {
      console.log('🔔 New notification:', notification);
      if (notification.type === 'CHAT_MESSAGE') {
        callback(notification);
      }
    };

    this.socket.on('notification', listener);
    const unsubscribe = () => {
      this.socket.off('notification', listener);
    };

    const key = `notification-${Date.now()}`;
    this.listeners.set(key, { event: 'notification', listener, unsubscribe });

    return unsubscribe;
  }

  /**
   * Subscribe to points updated events
   * @param {Function} callback - Callback function for points updates
   * @returns {Function} Unsubscribe function
   */
  onPointsUpdated(callback) {
    if (!this.socket) {
      return () => {};
    }

    const listener = (data) => {
      console.log('💰 Points updated:', data);
      callback(data);
    };

    this.socket.on('points:updated', listener);
    const unsubscribe = () => {
      this.socket.off('points:updated', listener);
    };

    const key = `points:updated-${Date.now()}`;
    this.listeners.set(key, { event: 'points:updated', listener, unsubscribe });

    return unsubscribe;
  }

  /**
   * Subscribe to badge level unlocked events
   * @param {Function} callback - Callback function for badge unlocks
   * @returns {Function} Unsubscribe function
   */
  onBadgeLevelUnlocked(callback) {
    if (!this.socket) {
      return () => {};
    }

    const listener = (data) => {
      console.log('🏆 Badge level unlocked:', data);
      callback(data);
    };

    this.socket.on('badge:level_unlocked', listener);
    const unsubscribe = () => {
      this.socket.off('badge:level_unlocked', listener);
    };

    const key = `badge:level_unlocked-${Date.now()}`;
    this.listeners.set(key, { event: 'badge:level_unlocked', listener, unsubscribe });

    return unsubscribe;
  }

  /**
   * Subscribe to badge updated events (full badge state sync)
   * @param {Function} callback - Callback function for badge updates
   * @returns {Function} Unsubscribe function
   */
  onBadgeUpdated(callback) {
    if (!this.socket) {
      return () => {};
    }

    const listener = (data) => {
      console.log('🔄 Badge updated:', data);
      callback(data);
    };

    this.socket.on('badge:updated', listener);
    const unsubscribe = () => {
      this.socket.off('badge:updated', listener);
    };

    const key = `badge:updated-${Date.now()}`;
    this.listeners.set(key, { event: 'badge:updated', listener, unsubscribe });

    return unsubscribe;
  }

  /**
   * Get connection status
   * @returns {boolean} True if connected
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Check WebSocket health endpoint
   * Per backend team: Validate /ws-health after deployment
   * Should return: { status: 'ok', wsAttached: true, clientCount: N, time: ... }
   * @returns {Promise<Object>} Health check response
   */
  async checkWebSocketHealth() {
    try {
      // Convert wss:// to https:// for health check
      let healthUrl = Config.WS_BASE_URL;
      if (healthUrl.startsWith('wss://')) {
        healthUrl = healthUrl.replace('wss://', 'https://');
      } else if (healthUrl.startsWith('ws://')) {
        healthUrl = healthUrl.replace('ws://', 'http://');
      }
      healthUrl = `${healthUrl}/ws-health`;
      
      console.log('🔍 Checking WebSocket health:', healthUrl);
      const response = await axios.get(healthUrl, { timeout: 10000 });
      
      console.log('✅ WebSocket health check:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ WebSocket health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Get socket instance (for emitting events)
   * @returns {Socket|null} Socket instance or null
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Clean up all listeners
   */
  cleanup() {
    // Remove all stored listeners
    this.listeners.forEach(({ unsubscribe }) => {
      unsubscribe();
    });
    this.listeners.clear();
  }
}

// Export singleton instance
const chatSocketService = new ChatSocketService();
export default chatSocketService;

