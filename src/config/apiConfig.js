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
      verifyResetToken: '/auth/verify-reset-token',
      completeResetPassword: '/auth/complete-reset-password',
    },

    // Profile endpoints
    profile: {
      get: '/profile',
      update: '/profile',
      delete: '/profile',
      avatar: '/profile/avatar',
    },

    // User endpoints
    user: {
      progress: '/users/progress',
    },

    // Progress endpoints
    progress: {
      overview: '/progress/overview',
      detailed: '/progress/detailed',
      historical: '/progress/historical',
      photos: '/progress-photos',
    },
    // Onboarding endpoints
    onboarding: {
      progress: '/onboarding/progress',
      step: (stepId) => `/onboarding/steps/${stepId}`,
      updateStep: (stepId) => `/onboarding/steps/${stepId}`,
      complete: '/onboarding/complete',
      measurements: '/onboarding/measurements',
    },
    // Achievements endpoints
    achievements: {
      summary: '/achievements/summary',
      badges: '/achievements/badges',
      points: '/achievements/points',
      allBadges: '/achievements/badges/all',
    },

    // Challenges endpoints
    challenges: {
      getAll: '/challenges?status=all',
      assign: (challengeId) => `/challenges/${challengeId}/assign-to-user`,
      leave: (challengeId) => `/challenges/${challengeId}/leave`,
      validation: (challengeId) => `/challenges/${challengeId}/validation`,
      submitText: (challengeId) => `/challenges/${challengeId}/submit-text`,
      uploadPhoto: (challengeId) => `/challenges/${challengeId}/upload-photo`,
      submitQuiz: (challengeId) => `/challenges/${challengeId}/quiz/submit`,
      complete: (challengeId) => `/challenges/${challengeId}/complete`,
    },

    // Badges endpoints
    badges: {
      progress: '/badges/progress/user',
    },

    // Mobile Badge endpoints (new simplified badge system)
    mobile: {
      badges: {
        getAll: '/mobile/badges',
        getSummary: '/mobile/badges/summary',
        getById: (badgeId) => `/mobile/badges/${badgeId}`,
        getNext: '/mobile/badges/next',
      },
    },


    // T.A.S.C.C. Progress endpoints
    tascc: {
      progress: '/tascc/progress',
      levels: '/tascc/levels',
      points: '/tascc/points',
      achievements: '/tascc/achievements',
      leaderboardOverall: '/tascc/leaderboard/overall',
      leaderboardPosition: '/tascc/leaderboard/position',
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
      conversation: (chatId) => `/chat/conversations/${chatId}`,
      messages: (chatId) => `/chat/${chatId}/messages`,
      send: (chatId) => `/chat/${chatId}/messages`,
      oneToOne: '/chat/one-to-one',
      group: '/chat/group',
      findOrCreate: '/chat/find-or-create',
      unreadCount: '/chat/unread/count',
      markRead: (chatId) => `/chat/conversations/${chatId}/read`,
    },

    // Notifications endpoints
    notifications: {
      get: '/notifications',
      markRead: '/notifications/:id/read',
      markAllRead: '/notifications/read-all',
      settings: '/notifications/settings',
    },

    // Subscription endpoints
    subscription: {
      status: '/subscription/status',
      plans: '/subscription/plans',
      subscribe: '/subscription/subscribe',
      cancel: '/subscription/cancel',
      renew: '/subscription/renew',
    },

    // FAQ endpoints
    faq: {
      public: '/faqs/public',
    },

    // Agenda endpoints
    agenda: {
      get: '/content/agenda',
      markComplete: (contentId) => `/content/${contentId}/complete`,
    },

    // Health check endpoint
    health: '/health',
  },

  // HTTP Status Codes
  statusCodes: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    LOCKED: 423,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
  },

  // Error Messages
  errorMessages: {
    NETWORK_ERROR: 'Erreur de connexion réseau',
    TIMEOUT_ERROR: 'Délai de connexion dépassé',
    SERVER_ERROR: 'Erreur du serveur',
    UNAUTHORIZED: 'Non autorisé',
    FORBIDDEN: 'Accès interdit',
    NOT_FOUND: 'Ressource introuvable',
    VALIDATION_ERROR: 'Erreur de validation',
    CONFLICT: 'Conflit de données',
    RATE_LIMIT: 'Trop de requêtes',
  },

  // Request Headers
  headers: {
    CONTENT_TYPE: 'Content-Type',
    AUTHORIZATION: 'Authorization',
    ACCEPT: 'Accept',
    USER_AGENT: 'User-Agent',
  },

  // Content Types
  contentTypes: {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
  },

  // Authentication
  auth: {
    TOKEN_PREFIX: 'Bearer',
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
    MAX_RETRY_ATTEMPTS: 3,
  },

  // File Upload
  upload: {
    MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
  },

  // Pagination
  pagination: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },

  // Cache
  cache: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    USER_PROFILE_TTL: 30 * 60 * 1000, // 30 minutes
    STATIC_DATA_TTL: 24 * 60 * 60 * 1000, // 24 hours
  },
};

/**
 * Get full URL for an endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {string} Full URL
 */
export const getFullUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Get authentication header
 * @param {string} token - Access token
 * @returns {Object} Authorization header
 */
export const getAuthHeader = (token) => {
  return {
    [API_CONFIG.headers.AUTHORIZATION]: `${API_CONFIG.auth.TOKEN_PREFIX} ${token}`,
  };
};

/**
 * Get default headers
 * @returns {Object} Default headers
 */
export const getDefaultHeaders = () => {
  return {
    [API_CONFIG.headers.CONTENT_TYPE]: API_CONFIG.contentTypes.JSON,
    [API_CONFIG.headers.ACCEPT]: API_CONFIG.contentTypes.JSON,
  };
};

/**
 * Get form data headers
 * @returns {Object} Form data headers
 */
export const getFormDataHeaders = () => {
  return {
    [API_CONFIG.headers.ACCEPT]: API_CONFIG.contentTypes.JSON,
  };
};

export default API_CONFIG; 