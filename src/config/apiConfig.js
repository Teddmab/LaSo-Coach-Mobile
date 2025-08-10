import Config from './env';

/**
 * Centralized API Configuration
 * All API endpoints and related configurations
 */
export const API_CONFIG = {
  // Base configuration
  BASE_URL: Config.API_BASE_URL,
  TIMEOUT: Config.API_TIMEOUT,

  // API Endpoints organized by feature
  endpoints: {
    // Authentication endpoints
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      register: '/auth/register',
      refreshToken: '/auth/refresh-token',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
    },

    // Profile endpoints
    profile: {
      get: '/profile',
      update: '/profile',
      delete: '/profile',
      avatar: '/profile/avatar',
    },

    // Onboarding endpoints
    onboarding: {
      progress: '/onboarding/progress',
      steps: '/onboarding/steps',
      complete: '/onboarding/complete',
      measurements: {
        get: '/onboarding/measurements',
        create: '/onboarding/measurements',
        update: '/onboarding/measurements',
      },
    },

    // T.A.S.C.C. Progress endpoints
    tascc: {
      progress: '/tascc/progress',
      levels: '/tascc/levels',
      points: '/tascc/points',
      achievements: '/tascc/achievements',
    },

    // Measurements endpoints
    measurements: {
      get: '/measurements',
      create: '/measurements',
      update: '/measurements/:id',
      delete: '/measurements/:id',
      latest: '/measurements/latest',
    },

    // Nutrition endpoints
    nutrition: {
      meals: '/nutrition/meals',
      menu: '/nutrition/menu',
      recommendations: '/nutrition/recommendations',
    },

    // Community endpoints
    community: {
      posts: '/community/posts',
      create: '/community/posts',
      comments: '/community/posts/:id/comments',
    },

    // Chat endpoints
    chat: {
      conversations: '/chat/conversations',
      messages: '/chat/conversations/:id/messages',
      send: '/chat/conversations/:id/messages',
    },

    // Notifications endpoints
    notifications: {
      get: '/notifications',
      markRead: '/notifications/:id/read',
      markAllRead: '/notifications/read-all',
      preferences: '/notifications/preferences',
    },

    // Achievements endpoints
    achievements: {
      get: '/achievements',
      badges: '/achievements/badges',
      leaderboard: '/achievements/leaderboard',
    },

    // Agenda/Calendar endpoints
    agenda: {
      sessions: '/agenda/sessions',
      events: '/agenda/events',
      book: '/agenda/book',
      get: '/content/agenda',
      complete: '/content/{contentId}/complete',
    },

    // Health check
    health: '/health',
  },

  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },

  // Error messages
  errorMessages: {
    network: 'Erreur de connexion. Vérifiez votre connexion internet.',
    server: 'Erreur du serveur. Veuillez réessayer plus tard.',
    unauthorized: 'Session expirée. Veuillez vous reconnecter.',
    forbidden: 'Accès interdit.',
    notFound: 'Ressource non trouvée.',
    timeout: 'Délai de connexion dépassé.',
    unknown: 'Une erreur inattendue s\'est produite.',
  },
};

/**
 * Helper function to build full URL
 * @param {string} endpoint - The endpoint path
 * @returns {string} Full URL
 */
export const buildUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Helper function to replace parameters in endpoint URLs
 * @param {string} endpoint - The endpoint with parameters (e.g., '/users/:id')
 * @param {Object} params - Object with parameter values
 * @returns {string} Endpoint with replaced parameters
 */
export const replaceParams = (endpoint, params = {}) => {
  let result = endpoint;
  Object.keys(params).forEach(key => {
    result = result.replace(`:${key}`, params[key]);
  });
  return result;
};

export default API_CONFIG; 