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
      return;
    }
    
    // REMEDIATION STEP 7: Ensure only one handshake in flight
    if (this.handshakeInFlight) {
      let attempts = 0;
      while (this.handshakeInFlight && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        if (this.socket && this.socket.connected) {
          return;
        }
      }
      if (this.handshakeInFlight) {
        return;
      }
    }
    
    // If socket exists and is connecting, wait for it to complete
    if (this.socket && this.socket.connecting) {
      let attempts = 0;
      while (this.socket.connecting && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        if (this.socket.connected) {
          return;
        }
      }
      if (this.socket.connecting) {
        return;
      }
    }
    
    // If we're in the process of connecting (but socket doesn't exist yet), wait
    if (this.isConnecting) {
      let attempts = 0;
      while (this.isConnecting && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        if (this.isConnected || (this.socket && this.socket.connected)) {
          return;
        }
      }
    }

    try {
      this.isConnecting = true;
      this.handshakeInFlight = true;
      
      // REMEDIATION STEP 4a: Confirm Firebase token is available
      const idToken = await firebaseAuthService.getIdToken();
      if (!idToken) {
        this.isConnecting = false;
        this.handshakeInFlight = false;
        if (onError) onError(new Error('No authentication token available'));
        return;
      }
      
      // REMEDIATION STEP 4b: Warm up service with lightweight API call
      // Backend requirement: Instance must be warm before Socket.IO connection
      // This prevents "x-render-routing: no-server" 404 errors from cold starts
      try {
        const healthResponse = await axios.get(`${Config.API_BASE_URL}/health`, {
          timeout: 10000,
        });
        
        // Backend recommendation: Brief delay after warmup to ensure instance is ready
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (healthError) {
        // Don't block connection if health check fails, but log it
        // Still add brief delay to allow instance to wake up
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const wsUrl = Config.WS_BASE_URL;

      // Only clean up if socket exists and is truly disconnected
      // Don't aggressively tear down - let Socket.IO handle reconnection
      if (this.socket && !this.socket.connected && !this.socket.connecting) {
        // Remove all event listeners from old socket
        this.socket.io.off('reconnect_attempt');
        this.socket.io.off('reconnect');
        this.socket.io.off('reconnect_failed');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      } else if (this.socket && (this.socket.connected || this.socket.connecting)) {
        // Socket is already connected or connecting - don't create duplicate
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
        // Force remove any remaining port using regex
        connectionUrl = connectionUrl.replace(/:\d+/, '');
      }
      
      // Additional safety: Remove any port pattern that might have been added
      connectionUrl = connectionUrl.replace(/:\d+(\/|$)/, '$1');
      
      // Final assertion: URL must not have a port
      if (connectionUrl.match(/:\d+/)) {
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
        
        this.isConnected = true;
        this.isConnecting = false;
        this.handshakeInFlight = false;
        this.reconnectAttempts = 0;
        
        // CRITICAL: Subscribe to notifications after connection (per backend guide)
        this.socket.emit('subscribe:notifications');
        
        // Note: Rooms will be joined immediately in handleConnect callback
        // which fetches conversations and joins all rooms synchronously
        
        if (onConnect) onConnect();
      });
      
      // Add additional event listeners for debugging
      this.socket.io.on('error', (error) => {
      });
      
      this.socket.io.on('reconnect_attempt', (attemptNumber) => {
      });
      
      this.socket.io.on('reconnect', (attemptNumber) => {
      });
      
      this.socket.io.on('reconnect_failed', () => {
      });

      this.socket.on('disconnect', (reason) => {
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
        
        // REMEDIATION STEP 8: Capture details for 404 with x-render-routing:no-server
        if (responseStatus === 404 || (typeof responseStatus === 'object' && responseStatus?.message?.includes('404'))) {
          
          if (responseHeaders['x-render-routing'] === 'no-server') {
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
          if (onError) onError(error);
        }
      });

      // Reconnection handlers
      this.socket.io.on('reconnect_attempt', (attemptNumber) => {
        // Only log every 10th reconnection attempt to reduce log spam
        if (attemptNumber % 10 === 0 || attemptNumber <= 3) {
        }
      });

      this.socket.io.on('reconnect', (attemptNumber) => {
        this.isConnected = true;
        this.isConnecting = false;
        this.handshakeInFlight = false; // Reset handshake flag on reconnect
        this.reconnectAttempts = 0;
        
        // CRITICAL: Subscribe to notifications after reconnection
        this.socket.emit('subscribe:notifications');
        
        // Note: Rooms will be rejoined by the useEffect in ChatContext
        // that watches isSocketConnected and conversations
        // We don't need to manually rejoin here because the useEffect will handle it
      });

      this.socket.io.on('reconnect_failed', () => {
        this.isConnecting = false;
        this.isConnected = false;
        // Don't call onError here - let the user manually retry or wait for next connection attempt
        // The socket.io client will keep trying to reconnect
      });

    } catch (error) {
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
        this.socket.connect();
      } else {
      }
    } else {
      // No socket - need to call connect() to create one
    }
  }
  
  /**
   * Update authentication token (for token refresh)
   * @param {string} newToken - New Firebase ID token
   */
  updateAuthToken(newToken) {
    if (!this.socket) {
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
      this.socket.connect();
    } else {
    }
  }

  /**
   * Join a chat room
   * @param {string} chatId - Chat ID to join
   */
  joinChat(chatId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    if (this.joinedRooms.has(chatId)) {
      return;
    }

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

    this.socket.emit('chat:leave', { chatId });
    this.joinedRooms.delete(chatId);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markNotificationRead(notificationId) {
    if (!this.socket || !this.isConnected) {
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
      return () => {};
    }

    const listener = (message) => {
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
      // CRITICAL: Handle ALL notification types, not just CHAT_MESSAGE
      // Backend sends all notifications (challenges, achievements, etc.) through this event
      callback(notification);
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
      
      const response = await axios.get(healthUrl, { timeout: 10000 });
      
      return response.data;
    } catch (error) {
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

