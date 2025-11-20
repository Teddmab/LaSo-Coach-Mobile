/**
 * Structured Logger Utility
 * 
 * Provides organized, toggleable logging per page/component
 * Usage:
 *   const logger = createLogger('ProgressCard', { enabled: true });
 *   logger.debug('Data loaded', { data });
 *   logger.info('User action', { action: 'refresh' });
 *   logger.warn('Warning message');
 *   logger.error('Error occurred', error);
 */

// Global log configuration - can be controlled via environment or config
const LOG_CONFIG = {
  // Enable/disable all logs
  enabled: __DEV__ || false,
  
  // Per-page/component toggles (set to false to disable specific logs)
  pages: {
    DashboardScreen: true,
    ProgressScreen: true,
    NutritionScreen: true,
    AchievementsScreen: true,
    ChatScreen: true,
    CommunityScreen: true,
    AgendaScreen: true,
    NotificationsScreen: true,
    ProfileScreen: true,
    SettingsScreen: true,
  },
  
  components: {
    ProgressCard: true,
    ProfileCompletionCard: true,
    AchievementsCard: true,
    NutritionCard: true,
    AgoraContentCard: true,
    LAgoraCard: true,
    BottomNavigation: true,
    Avatar: true,
    SubscriptionBanner: true,
    SubscriptionAlert: true,
  },
  
  // Log levels (only logs at or above this level will be shown)
  level: 'debug', // 'debug' | 'info' | 'warn' | 'error' | 'none'
  
  // Show timestamps
  showTimestamp: false,
  
  // Show component/page context in logs
  showContext: true,
};

// Log level hierarchy
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

/**
 * Get timestamp string
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

/**
 * Format log message with context
 */
const formatMessage = (context, level, message, data = null) => {
  const parts = [];
  
  // Timestamp
  if (LOG_CONFIG.showTimestamp) {
    parts.push(`[${getTimestamp()}]`);
  }
  
  // Context (page/component name)
  if (LOG_CONFIG.showContext && context) {
    parts.push(`[${context}]`);
  }
  
  // Level emoji/prefix
  const levelEmojis = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };
  parts.push(`${levelEmojis[level] || ''} ${level.toUpperCase()}`);
  
  // Message
  parts.push(message);
  
  return parts.join(' ');
};

/**
 * Check if logging is enabled for a given context
 */
const isLoggingEnabled = (context, level) => {
  // Global toggle
  if (!LOG_CONFIG.enabled) return false;
  
  // Level check
  const currentLevel = LOG_LEVELS[LOG_CONFIG.level] ?? 0;
  const messageLevel = LOG_LEVELS[level] ?? 0;
  if (messageLevel < currentLevel) return false;
  
  // Component/Page specific toggle
  if (LOG_CONFIG.components[context] === false) return false;
  if (LOG_CONFIG.pages[context] === false) return false;
  
  return true;
};

/**
 * Create a logger instance for a specific component/page
 * @param {string} context - Component or page name
 * @param {object} options - Logger options
 * @param {boolean} options.enabled - Override global enabled state for this logger
 * @returns {object} Logger instance with debug, info, warn, error methods
 */
export const createLogger = (context, options = {}) => {
  const enabled = options.enabled !== undefined ? options.enabled : true;
  
  return {
    /**
     * Debug level logs - detailed information for development
     */
    debug: (message, data = null) => {
      if (!enabled || !isLoggingEnabled(context, 'debug')) return;
      const formatted = formatMessage(context, 'debug', message);
      if (data) {
        console.log(formatted, data);
      } else {
        console.log(formatted);
      }
    },
    
    /**
     * Info level logs - general information
     */
    info: (message, data = null) => {
      if (!enabled || !isLoggingEnabled(context, 'info')) return;
      const formatted = formatMessage(context, 'info', message);
      if (data) {
        console.log(formatted, data);
      } else {
        console.log(formatted);
      }
    },
    
    /**
     * Warn level logs - warnings that don't break functionality
     */
    warn: (message, data = null) => {
      if (!enabled || !isLoggingEnabled(context, 'warn')) return;
      const formatted = formatMessage(context, 'warn', message);
      if (data) {
        console.warn(formatted, data);
      } else {
        console.warn(formatted);
      }
    },
    
    /**
     * Error level logs - errors that need attention
     */
    error: (message, error = null) => {
      if (!enabled || !isLoggingEnabled(context, 'error')) return;
      const formatted = formatMessage(context, 'error', message);
      if (error) {
        console.error(formatted, error);
      } else {
        console.error(formatted);
      }
    },
    
    /**
     * Group related logs together
     */
    group: (label) => {
      if (!enabled || !isLoggingEnabled(context, 'debug')) return;
      console.group(`[${context}] ${label}`);
    },
    
    /**
     * End a log group
     */
    groupEnd: () => {
      if (!enabled || !isLoggingEnabled(context, 'debug')) return;
      console.groupEnd();
    },
  };
};

/**
 * Update log configuration at runtime
 * @param {object} updates - Configuration updates
 */
export const updateLogConfig = (updates) => {
  Object.assign(LOG_CONFIG, updates);
  console.log('📝 Log configuration updated:', LOG_CONFIG);
};

/**
 * Get current log configuration
 */
export const getLogConfig = () => {
  return { ...LOG_CONFIG };
};

/**
 * Quick helper to disable all logs
 */
export const disableAllLogs = () => {
  updateLogConfig({ enabled: false });
};

/**
 * Quick helper to enable all logs
 */
export const enableAllLogs = () => {
  updateLogConfig({ enabled: true });
};

/**
 * Quick helper to disable logs for a specific component/page
 */
export const disableLogsFor = (context) => {
  if (LOG_CONFIG.components[context] !== undefined) {
    LOG_CONFIG.components[context] = false;
  }
  if (LOG_CONFIG.pages[context] !== undefined) {
    LOG_CONFIG.pages[context] = false;
  }
};

/**
 * Quick helper to enable logs for a specific component/page
 */
export const enableLogsFor = (context) => {
  if (LOG_CONFIG.components[context] !== undefined) {
    LOG_CONFIG.components[context] = true;
  }
  if (LOG_CONFIG.pages[context] !== undefined) {
    LOG_CONFIG.pages[context] = true;
  }
};

export default createLogger;

