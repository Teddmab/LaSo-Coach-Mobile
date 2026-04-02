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

import Constants from 'expo-constants';

// Determine debug flag from Expo extra env DEBUG_MODE (string 'true') or __DEV__
const extraEnv = Constants?.expoConfig?.extra?.env || {};
const runtimeDebug = extraEnv.debugMode === 'true';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

interface LogConfig {
  enabled: boolean;
  pages: Record<string, boolean>;
  components: Record<string, boolean>;
  level: LogLevel;
  showTimestamp: boolean;
  showContext: boolean;
}

interface LoggerOptions {
  enabled?: boolean;
}

interface Logger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
  group: (label: string) => void;
  groupEnd: () => void;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

// Global log configuration - can be controlled via environment or config
const LOG_CONFIG: LogConfig = {
  // Enable/disable all logs (production sets DEBUG_MODE=false to silence debug spam)
  enabled: (__DEV__ || runtimeDebug) || false,
  
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
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

/**
 * Get timestamp string
 */
const getTimestamp = (): string => {
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
const formatMessage = (context: string, level: LogLevel, message: string, data: any = null): string => {
  const parts: string[] = [];
  
  // Timestamp
  if (LOG_CONFIG.showTimestamp) {
    parts.push(`[${getTimestamp()}]`);
  }
  
  // Context (page/component name)
  if (LOG_CONFIG.showContext && context) {
    parts.push(`[${context}]`);
  }
  
  // Level emoji/prefix
  const levelEmojis: Record<LogLevel, string> = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    none: '',
  };
  parts.push(`${levelEmojis[level] || ''} ${level.toUpperCase()}`);
  
  // Message
  parts.push(message);
  
  return parts.join(' ');
};

/**
 * Check if logging is enabled for a given context
 */
const isLoggingEnabled = (context: string, level: LogLevel): boolean => {
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
 */
export const createLogger = (context: string, options: LoggerOptions = {}): Logger => {
  const enabled = options.enabled !== undefined ? options.enabled : true;
  
  return {
    /**
     * Debug level logs - detailed information for development
     */
    debug: (message: string, data: any = null): void => {
      if (!enabled || !isLoggingEnabled(context, 'debug')) return;
      const formatted = formatMessage(context, 'debug', message);
      if (data) {
      } else {
      }
    },
    
    /**
     * Info level logs - general information
     */
    info: (message: string, data: any = null): void => {
      if (!enabled || !isLoggingEnabled(context, 'info')) return;
      const formatted = formatMessage(context, 'info', message);
      if (data) {
      } else {
      }
    },
    
    /**
     * Warn level logs - warnings that don't break functionality
     */
    warn: (message: string, data: any = null): void => {
      if (!enabled || !isLoggingEnabled(context, 'warn')) return;
      const formatted = formatMessage(context, 'warn', message);
      if (data) {
      } else {
      }
    },
    
    /**
     * Error level logs - errors that need attention
     */
    error: (message: string, error: any = null): void => {
      if (!enabled || !isLoggingEnabled(context, 'error')) return;
      const formatted = formatMessage(context, 'error', message);
      if (error) {
      } else {
      }
    },
    
    /**
     * Group related logs together
     */
    group: (label: string): void => {
      if (!enabled || !isLoggingEnabled(context, 'debug')) return;
      console.group(`[${context}] ${label}`);
    },
    
    /**
     * End a log group
     */
    groupEnd: (): void => {
      if (!enabled || !isLoggingEnabled(context, 'debug')) return;
      console.groupEnd();
    },
  };
};

/**
 * Update log configuration at runtime
 */
export const updateLogConfig = (updates: Partial<LogConfig>): void => {
  Object.assign(LOG_CONFIG, updates);
};

/**
 * Get current log configuration
 */
export const getLogConfig = (): LogConfig => {
  return { ...LOG_CONFIG };
};

/**
 * Quick helper to disable all logs
 */
export const disableAllLogs = (): void => {
  updateLogConfig({ enabled: false });
};

/**
 * Quick helper to enable all logs
 */
export const enableAllLogs = (): void => {
  updateLogConfig({ enabled: true });
};

/**
 * Quick helper to disable logs for a specific component/page
 */
export const disableLogsFor = (context: string): void => {
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
export const enableLogsFor = (context: string): void => {
  if (LOG_CONFIG.components[context] !== undefined) {
    LOG_CONFIG.components[context] = true;
  }
  if (LOG_CONFIG.pages[context] !== undefined) {
    LOG_CONFIG.pages[context] = true;
  }
};

export default createLogger;

