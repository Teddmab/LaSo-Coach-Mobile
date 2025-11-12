import api from './api';

/**
 * Notifications API Service
 * Handles all notification-related API calls and WebSocket integration
 */
export const notificationsAPI = {
  /**
   * Get user notifications with pagination
   * Endpoint: GET /api/v1/notifications
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10, max: 50)
   * @param {boolean} params.unreadOnly - Filter only unread notifications (default: false)
   * @returns {Promise<Object>} Notifications data with pagination
   */
  async getNotifications(params = {}) {
    try {
      console.log('🔔 Fetching notifications...', params);
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.unreadOnly !== undefined) queryParams.append('unreadOnly', params.unreadOnly);
      
      const queryString = queryParams.toString();
      const url = `/notifications${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      console.log('✅ Notifications fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Get unread notifications count
   * Endpoint: GET /api/v1/notifications/unread/count
   * @returns {Promise<Object>} Unread count data
   */
  async getUnreadCount() {
    try {
      console.log('🔔 Fetching unread notifications count...');
      const response = await api.get('/notifications/unread/count');
      console.log('✅ Unread count fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      throw error;
    }
  },

  /**
   * Mark single notification as read
   * Endpoint: PATCH /api/v1/notifications/{id}/read
   * @param {string} notificationId - The notification ID
   * @returns {Promise<Object>} Update response
   */
  async markAsRead(notificationId) {
    try {
      console.log(`🔔 Marking notification ${notificationId} as read...`);
      const response = await api.patch(`/notifications/${notificationId}/read`);
      console.log('✅ Notification marked as read successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * Endpoint: PATCH /api/v1/notifications/read/all
   * @returns {Promise<Object>} Update response
   */
  async markAllAsRead() {
    try {
      console.log('🔔 Marking all notifications as read...');
      const response = await api.patch('/notifications/read/all');
      console.log('✅ All notifications marked as read successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Create notification (internal use)
   * Endpoint: POST /api/v1/notifications
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {Object} notificationData.metadata - Additional metadata
   * @returns {Promise<Object>} Created notification data
   */
  async createNotification(notificationData) {
    try {
      console.log('🔔 Creating notification...', notificationData);
      const response = await api.post('/notifications', notificationData);
      console.log('✅ Notification created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }
};

/**
 * WebSocket Notification Manager
 * Handles real-time notification updates
 */
export class NotificationWebSocketManager {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
  }

  /**
   * Connect to WebSocket for real-time notifications
   * @param {string} token - JWT authentication token
   * @returns {Promise<void>}
   */
  async connect(token) {
    try {
      console.log('🔌 Connecting to notifications WebSocket...');
      
      // WebSocket URL (adjust based on your backend WebSocket endpoint)
      const wsUrl = `${process.env.WEBSOCKET_URL || 'wss://laso-coach-backend.onrender.com'}/ws/notifications?token=${token}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        
        // Send initial auth payload expected by backend and subscribe
        try {
          const authMessage = JSON.stringify({ action: 'auth', auth: { token } });
          this.ws.send(authMessage);
          console.log('📡 Sent WebSocket auth payload (masked):', token ? `${token.substring(0,6)}...${token.slice(-6)}` : 'null');
        } catch (err) {
          console.warn('⚠️ Failed to send WS auth payload:', err?.message);
        }
        // Subscribe to notifications
        this.subscribe();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.handleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
      throw error;
    }
  }

  /**
   * Subscribe to notifications channel
   */
  subscribe() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const subscribeMessage = {
        action: 'subscribe',
        channel: 'notifications'
      };
      this.ws.send(JSON.stringify(subscribeMessage));
      console.log('📡 Subscribed to notifications channel');
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 Received WebSocket message:', data);
      
      if (data.type === 'notification') {
        this.notifyListeners('new_notification', data.notification);
      } else if (data.type === 'unread_count_update') {
        this.notifyListeners('unread_count_update', data.count);
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Handle WebSocket reconnection
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        // Get fresh token and reconnect
        const token = this.getAuthToken();
        if (token) {
          this.connect(token);
        }
      }, this.reconnectInterval);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  /**
   * Get authentication token
   * @returns {string|null} JWT token
   */
  getAuthToken() {
    // Implement token retrieval logic
    // This should get the current JWT token from storage or context
    return null; // Replace with actual token retrieval
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log('🔌 WebSocket disconnected');
    }
  }
}

export default notificationsAPI;
