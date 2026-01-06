import api from './api';
import Config from '../config/env';

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
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.unreadOnly !== undefined) queryParams.append('unreadOnly', params.unreadOnly);
      
      const queryString = queryParams.toString();
      const url = `/notifications${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
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
      const response = await api.get('/notifications/unread/count');
      return response.data;
    } catch (error) {
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
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
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
      // Aligned with web version: /notifications/read/all
      const response = await api.patch('/notifications/read/all');
      return response.data;
    } catch (error) {
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
      const response = await api.post('/notifications', notificationData);
      return response.data;
    } catch (error) {
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
      
      // Use the same WebSocket base URL as chat (from .env file)
      // The notification endpoint is typically at /ws/notifications
      const wsBaseUrl = Config.WS_BASE_URL;
      const wsUrl = `${wsBaseUrl}/ws/notifications?token=${token}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        
        // Send initial auth payload expected by backend and subscribe
        try {
          const authMessage = JSON.stringify({ action: 'auth', auth: { token } });
          this.ws.send(authMessage);
        } catch (err) {
        }
        // Subscribe to notifications
        this.subscribe();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };
      
      this.ws.onclose = (event) => {
        this.handleReconnect();
      };
      
      this.ws.onerror = (error) => {
      };
      
    } catch (error) {
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
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'notification') {
        this.notifyListeners('new_notification', data.notification);
      } else if (data.type === 'unread_count_update') {
        this.notifyListeners('unread_count_update', data.count);
      }
    } catch (error) {
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
      
      setTimeout(() => {
        // Get fresh token and reconnect
        const token = this.getAuthToken();
        if (token) {
          this.connect(token);
        }
      }, this.reconnectInterval);
    } else {
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
    }
  }
}

export default notificationsAPI;
