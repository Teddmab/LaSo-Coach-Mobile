import api from './api';
import { API_CONFIG } from '../config/apiConfig';

/**
 * FAQ REST API Service
 * Handles all FAQ-related REST API calls
 */
const faqApi = {
  /**
   * Get all active FAQs (public endpoint)
   * @returns {Promise<Array>} List of FAQs
   */
  async getFAQs() {
    try {
      const response = await api.get(API_CONFIG.endpoints.faq.public);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      throw error;
    }
  },
};

export default faqApi;

