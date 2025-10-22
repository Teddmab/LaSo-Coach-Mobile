import api from './api';
import Config from '../config/env';

/**
 * Agenda API Service
 * Handles all API calls related to agenda content
 */
export class AgendaApi {
  /**
   * Get agenda content
   * @returns {Promise<Array>} Array of agenda content items
   */
  static async getAgenda() {
    try {
      // Check if api is properly initialized
      if (!api) {
        throw new Error('API instance is not initialized');
      }
      
      console.log('📅 Fetching agenda content...');
      console.log('📅 Request URL:', '/agenda');
      console.log('📅 Full URL:', `${Config.API_BASE_URL}/agenda`);
      
      // Log the API instance configuration
      console.log('📅 API base URL:', Config.API_BASE_URL);
      console.log('📅 API timeout:', Config.API_TIMEOUT);
      
      const response = await api.get('/agenda');
      
      console.log('✅ Agenda content fetched successfully');
      console.log('📅 Response status:', response.status);
      console.log('📅 Response headers:', response.headers);
      console.log('📅 Raw agenda data:', JSON.stringify(response.data, null, 2));
      
      // Parse the agenda data structure - new format with dates as keys
      const rawData = response.data.data || response.data;
      
      // Transform the data structure from { "2025-07-22": [...] } to flat array
      const agendaItems = [];
      
      if (rawData && typeof rawData === 'object') {
        Object.keys(rawData).forEach(dateKey => {
          const itemsForDate = rawData[dateKey];
          if (Array.isArray(itemsForDate)) {
            itemsForDate.forEach(item => {
              agendaItems.push({
                id: item.id,
                title: item.content?.title || item.title,
                description: item.content?.description || item.description,
                thumbnailUrl: item.content?.thumbnailUrl || item.thumbnailUrl,
                contentUrl: item.content?.contentUrl,
                points: item.content?.points || 0,
                author: item.content?.creator?.name || 'Anonyme',
                assignedDate: item.assignedDate,
                completed: item.completed || false,
                completedAt: item.completedAt,
                content: item.content
              });
              
              // Log contentUrl for debugging
              if (item.content?.contentUrl) {
                console.log('📹 Found contentUrl:', item.content.contentUrl);
              }
            });
          }
        });
      }
      
      console.log('📅 Parsed agenda items:', agendaItems);
      console.log('📅 Total items found:', agendaItems.length);
      
      return agendaItems;
    } catch (error) {
      console.error('❌ Error fetching agenda:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  /**
   * Mark content as completed
   * @param {string} contentId - The ID of the content to mark as complete
   * @returns {Promise<Object>} Response from the API
   */
  static async markContentComplete(contentId) {
    try {
      console.log('✅ Marking content as complete:', contentId);
      console.log('✅ Request URL:', `/agenda/${contentId}/complete`);
      console.log('✅ Full URL:', `${Config.API_BASE_URL}/agenda/${contentId}/complete`);
      
      const response = await api.post(`/agenda/${contentId}/complete`);
      
      console.log('✅ Content marked as complete successfully');
      console.log('✅ Response status:', response.status);
      console.log('✅ Response data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error marking content as complete:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  /**
   * Filter agenda items to show past 3 days + future content
   * @param {Array} agendaItems - Array of agenda items
   * @returns {Array} Filtered agenda items
   */
  static filterAgendaItems(agendaItems) {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    return agendaItems.filter(item => {
      const assignedDate = new Date(item.assignedDate);
      return assignedDate >= threeDaysAgo || assignedDate >= now;
    });
  }
}

export default AgendaApi; 