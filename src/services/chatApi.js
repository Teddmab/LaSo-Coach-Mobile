import api from './api';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Chat REST API Service
 * Handles all chat-related REST API calls
 */
const chatApi = {
  /**
   * Get all conversations for the current user
   * @returns {Promise<Array>} List of conversations
   */
  async getConversations() {
    try {
      const response = await api.get(API_CONFIG.endpoints.chat.conversations);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  /**
   * Get a single conversation by ID
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Conversation object
   */
  async getConversationById(chatId) {
    try {
      const response = await api.get(API_CONFIG.endpoints.chat.conversation(chatId));
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  /**
   * Get messages for a specific chat
   * @param {string} chatId - Chat ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of messages (default: 50)
   * @param {string} options.before - Date for pagination
   * @returns {Promise<Array>} List of messages
   */
  async getMessages(chatId, options = {}) {
    try {
      const { limit = 50, before } = options;
      const params = { limit };
      if (before) {
        params.before = before;
      }

      const response = await api.get(API_CONFIG.endpoints.chat.messages(chatId), { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Send a message to a chat
   * @param {string} chatId - Chat ID
   * @param {string} content - Message content
   * @returns {Promise<Object>} Created message object
   */
  async sendMessage(chatId, content) {
    try {
      const response = await api.post(API_CONFIG.endpoints.chat.send(chatId), {
        content,
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Create or get a one-to-one chat
   * @param {string} otherUserId - Other user's ID
   * @returns {Promise<Object>} Chat object
   */
  async createOneToOneChat(otherUserId) {
    try {
      const response = await api.post(API_CONFIG.endpoints.chat.oneToOne, {
        otherUserId,
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error creating one-to-one chat:', error);
      throw error;
    }
  },

  /**
   * Create a group chat
   * @param {Object} groupData - Group chat data
   * @param {string} groupData.name - Group name
   * @param {Array<string>} groupData.userIds - Array of user IDs
   * @returns {Promise<Object>} Created group chat object
   */
  async createGroupChat(groupData) {
    try {
      const { name, userIds } = groupData;
      const response = await api.post(API_CONFIG.endpoints.chat.group, {
        name,
        userIds,
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  },

  /**
   * Find or create a chat
   * @param {Object} chatData - Chat data
   * @param {Array<string>} chatData.participantIds - Array of participant IDs
   * @param {string} chatData.type - Chat type ('ONE_TO_ONE' or 'GROUP')
   * @returns {Promise<Object>} Chat object
   */
  async findOrCreateChat(chatData) {
    try {
      const { participantIds, type } = chatData;
      const response = await api.post(API_CONFIG.endpoints.chat.findOrCreate, {
        participantIds,
        type,
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error finding or creating chat:', error);
      throw error;
    }
  },

  /**
   * Get unread message count
   * @returns {Promise<number>} Total unread message count
   */
  async getUnreadCount() {
    try {
      const response = await api.get(API_CONFIG.endpoints.chat.unreadCount);
      return response.data?.data?.count || response.data?.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  /**
   * Mark a chat as read
   * @param {string} chatId - Chat ID
   * @returns {Promise<void>}
   */
  async markChatAsRead(chatId) {
    try {
      await api.post(API_CONFIG.endpoints.chat.markRead(chatId));
    } catch (error) {
      console.error('Error marking chat as read:', error);
      throw error;
    }
  },
};

export default chatApi;

