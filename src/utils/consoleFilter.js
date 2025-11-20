/**
 * Console Log Filter
 * Filters console logs to show only WebSocket/chat related logs
 * Hides verbose logs like API requests with data
 */

// Store original console methods
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
};

// WebSocket/Chat related keywords that should be shown
const WEBSOCKET_KEYWORDS = [
  'websocket',
  'socket',
  'chat',
  'message',
  'notification',
  'handleNewMessage',
  'chatSocketService',
  'ChatContext',
  'handleChatNotification',
  'chat:message',
  'chat:created',
  'chat:join',
  'chat:leave',
  'notification',
  '📨',
  '🔔',
  '🔌',
  '📡',
  '💬',
  '✅',
  '❌',
  '⚠️',
  '🔄',
  '[handleNewMessage]',
  '[WebSocket]',
  '[chatSocketService]',
  '[handleChatNotification]',
  '[ChatContext]',
];

// Keywords that indicate verbose logs to hide
const VERBOSE_KEYWORDS = [
  'request',
  'response',
  'api',
  'fetch',
  'axios',
  'profile',
  'user data',
  'data loaded',
  'GET /',
  'POST /',
  'PATCH /',
  'PUT /',
  'DELETE /',
  'data:',
  'data structure:',
  '📥', // Hide all logs starting with 📥 (data logs)
  '✅ get',
  '✅ post',
  '✅ patch',
  '✅ put',
  '✅ delete',
  'fetched successfully',
  'data fetched',
  'profile data',
  'dashboard data',
  'subscription data',
  'parsed subscription',
  'completion response',
  'calculateprogress',
  'calculateProgress',
  'dashboard debug',
  '🏠', // Hide dashboard debug logs
  '📊', // Hide all 📊 logs (progress/calculation logs)
  'onboarding',
  'measurements',
  'tascc',
  'badgeprogress',
  'community/posts',
  'meals/plans',
  'notifications/unread',
  'agenda',
  'profile fetched',
  'global unread count',
  'user authenticated',
  'achievements data',
  'http',
  'https',
  '/api/',
  '/api/v1/',
  'status',
  'statuscode',
  'status code',
  'headers',
  'body',
  'payload',
  'json',
  'json.stringify',
  '{',
  '}',
];

// Configuration
let filterConfig = {
  enabled: true,
  showWebSocketOnly: true, // Only show WebSocket/chat logs
  hideVerbose: true, // Hide verbose API/data logs
  showErrors: true, // Always show errors
  showWarnings: true, // Always show warnings
};

/**
 * Check if log contains data objects (should be hidden)
 * More aggressive: Hide ANY object/JSON, not just large ones
 */
const hasDataObject = (args) => {
  return args.some(arg => {
    if (typeof arg === 'object' && arg !== null) {
      // Hide all objects (they're likely JSON/data)
      // Only allow if it's a simple object with very few keys (like {socketId: '...'})
      try {
        const keys = Object.keys(arg);
        // Allow simple objects with 3 or fewer keys (like connection status)
        if (keys.length <= 3) {
          // Check if it's a simple status object (not data)
          const simpleKeys = ['socketId', 'connected', 'transport', 'url', 'hasToken', 'tokenLength'];
          const isSimpleStatus = keys.every(key => simpleKeys.includes(key));
          if (isSimpleStatus) {
            return false; // Allow simple status objects
          }
        }
        // Hide all other objects (they're likely data/JSON)
        return true;
      } catch {
        return true; // If we can't check, hide it to be safe
      }
    }
    // Check if string contains JSON-like patterns
    if (typeof arg === 'string') {
      // Hide strings that look like JSON (start with { or [)
      const trimmed = arg.trim();
      if ((trimmed.startsWith('{') && trimmed.includes('}')) || 
          (trimmed.startsWith('[') && trimmed.includes(']'))) {
        // But allow if it's a WebSocket log
        const lowerArg = arg.toLowerCase();
        const hasWebSocketKeyword = WEBSOCKET_KEYWORDS.some(keyword => 
          lowerArg.includes(keyword.toLowerCase())
        );
        return !hasWebSocketKeyword; // Hide JSON unless it's WebSocket-related
      }
    }
    return false;
  });
};

/**
 * Check if a log message should be shown
 */
const shouldShowLog = (args) => {
  if (!filterConfig.enabled) {
    return true; // If filter disabled, show all logs
  }

  // Get first argument (usually the message string)
  const firstArg = args[0];
  const firstArgString = typeof firstArg === 'string' ? firstArg : String(firstArg);
  
  // Convert all arguments to string for pattern matching
  const logString = args
    .map((arg, index) => {
      // For first arg, use as-is to preserve emojis
      if (index === 0 && typeof arg === 'string') {
        return arg;
      }
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object') {
        try {
          const json = JSON.stringify(arg);
          // For large objects, just check the first 500 chars to avoid performance issues
          return json.length > 500 ? json.substring(0, 500) : json;
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');

  // Create lowercase version for keyword matching
  const logStringLower = logString.toLowerCase();

  // Get first argument for pattern matching
  const firstArgStr = typeof args[0] === 'string' ? args[0] : '';

  // ALWAYS hide "📥 Data:" logs regardless of filter mode
  if (firstArgStr.includes('📥') && (firstArgStr.includes('Data:') || firstArgStr.includes('Data structure:'))) {
    return false;
  }

  // ALWAYS hide logs that contain JSON-like patterns (unless WebSocket-related)
  if (hasDataObject(args)) {
    const hasWebSocketKeyword = WEBSOCKET_KEYWORDS.some(keyword => {
      return logString.includes(keyword) || logStringLower.includes(keyword.toLowerCase());
    });
    if (!hasWebSocketKeyword) {
      return false; // Hide all JSON/data unless WebSocket-related
    }
  }

  // ALWAYS hide logs that look like HTTP requests/responses (unless WebSocket-related)
  const requestPatterns = [
    /GET\s+\//i,
    /POST\s+\//i,
    /PATCH\s+\//i,
    /PUT\s+\//i,
    /DELETE\s+\//i,
    /status\s*:\s*\d{3}/i,
    /statuscode\s*:\s*\d{3}/i,
    /status\s+code\s*:\s*\d{3}/i,
    /response\s+status/i,
    /request\s+to/i,
    /api\/v1\//i,
    /\/api\//i,
  ];
  
  const looksLikeRequest = requestPatterns.some(pattern => pattern.test(logString));
  if (looksLikeRequest) {
    const hasWebSocketKeyword = WEBSOCKET_KEYWORDS.some(keyword => {
      return logString.includes(keyword) || logStringLower.includes(keyword.toLowerCase());
    });
    if (!hasWebSocketKeyword) {
      return false; // Hide all request-like logs unless WebSocket-related
    }
  }

  // ALWAYS hide logs that contain JSON-like strings (unless WebSocket-related)
  // Check if logString itself contains JSON patterns
  const jsonPatterns = [
    /\{[^}]{20,}\}/, // Object with more than 20 chars inside
    /\[[^\]]{20,}\]/, // Array with more than 20 chars inside
    /"[\w]+"\s*:\s*["\[{]/, // JSON key-value pairs
  ];
  
  const containsJsonString = jsonPatterns.some(pattern => pattern.test(logString));
  if (containsJsonString) {
    const hasWebSocketKeyword = WEBSOCKET_KEYWORDS.some(keyword => {
      return logString.includes(keyword) || logStringLower.includes(keyword.toLowerCase());
    });
    if (!hasWebSocketKeyword) {
      return false; // Hide all JSON-like strings unless WebSocket-related
    }
  }

  // Always show errors and warnings if configured (check first)
  if (filterConfig.showErrors && (logStringLower.includes('error') || logString.includes('❌'))) {
    return true;
  }
  if (filterConfig.showWarnings && (logStringLower.includes('warn') || logString.includes('⚠️'))) {
    return true;
  }

  // If showing WebSocket only, check for WebSocket keywords
  if (filterConfig.showWebSocketOnly) {
    // Always show page navigation logs (user wants to see these)
    if (logString.includes('📱 PAGE:') || logString.includes('═══════════════════════════════════════════════════════════')) {
      return true;
    }
    
    const hasWebSocketKeyword = WEBSOCKET_KEYWORDS.some(keyword => {
      // Check both original and lowercase versions for emoji matching
      return logString.includes(keyword) || logStringLower.includes(keyword.toLowerCase());
    });
    
    if (hasWebSocketKeyword) {
      // Show WebSocket logs, but still hide if they contain large JSON objects
      // Allow simple status objects (like {socketId: '...', connected: true})
      if (hasDataObject(args)) {
        // Check if it's a simple status object
        const firstObj = args.find(arg => typeof arg === 'object' && arg !== null);
        if (firstObj) {
          const keys = Object.keys(firstObj);
          const simpleKeys = ['socketId', 'connected', 'transport', 'url', 'hasToken', 'tokenLength', 'path'];
          const isSimpleStatus = keys.length <= 5 && keys.every(key => simpleKeys.includes(key));
          if (!isSimpleStatus) {
            return false; // Hide complex objects even in WebSocket logs
          }
        }
      }
      return true; // Show WebSocket logs with simple status objects
    }
    
    // If no WebSocket keyword, hide it
    return false;
  }

  // Hide verbose logs if configured
  if (filterConfig.hideVerbose) {
    // Check for verbose emoji patterns in first argument
    const hasVerboseEmoji = ['📥', '🏠', '👤', '💳', '📊', '🥗'].some(emoji => 
      firstArgStr.includes(emoji)
    );
    
    if (hasVerboseEmoji) {
      // Check if it's also a WebSocket log (should show it)
      const hasWebSocketKeyword = WEBSOCKET_KEYWORDS.some(keyword => {
        return logString.includes(keyword) || logStringLower.includes(keyword.toLowerCase());
      });
      
      if (!hasWebSocketKeyword) {
        return false; // Hide verbose non-WebSocket logs
      }
    }
    
    const hasVerboseKeyword = VERBOSE_KEYWORDS.some(keyword => {
      // Check both original and lowercase versions
      // For emoji keywords, check original string
      if (keyword.length === 1 && /[\u{1F300}-\u{1F9FF}]/u.test(keyword)) {
        return logString.includes(keyword);
      }
      return logString.includes(keyword) || logStringLower.includes(keyword.toLowerCase());
    });
    
    if (hasVerboseKeyword) {
      // Check if it's also a WebSocket log (should show it)
      const hasWebSocketKeyword = WEBSOCKET_KEYWORDS.some(keyword => {
        return logString.includes(keyword) || logStringLower.includes(keyword.toLowerCase());
      });
      
      if (!hasWebSocketKeyword) {
        return false; // Hide verbose non-WebSocket logs
      }
    }
    
    // Hide logs with data objects (unless WebSocket related)
    // This is already handled above, but keeping for clarity
  }

  // Default: show the log
  return true;
};

/**
 * Filtered console.log
 */
console.log = (...args) => {
  if (shouldShowLog(args)) {
    originalConsole.log(...args);
  }
};

/**
 * Filtered console.info
 */
console.info = (...args) => {
  if (shouldShowLog(args)) {
    originalConsole.info(...args);
  }
};

/**
 * Filtered console.warn
 */
console.warn = (...args) => {
  if (shouldShowLog(args)) {
    originalConsole.warn(...args);
  }
};

/**
 * Filtered console.error
 */
console.error = (...args) => {
  if (shouldShowLog(args)) {
    originalConsole.error(...args);
  }
};

/**
 * Update filter configuration
 */
export const updateConsoleFilter = (config) => {
  filterConfig = { ...filterConfig, ...config };
  originalConsole.log('📝 Console filter updated:', filterConfig);
};

/**
 * Get current filter configuration
 */
export const getConsoleFilterConfig = () => {
  return { ...filterConfig };
};

/**
 * Enable WebSocket-only mode (default)
 */
export const enableWebSocketOnly = () => {
  updateConsoleFilter({ showWebSocketOnly: true, hideVerbose: true });
};

/**
 * Disable filtering (show all logs)
 */
export const disableConsoleFilter = () => {
  updateConsoleFilter({ enabled: false });
};

/**
 * Enable filtering
 */
export const enableConsoleFilter = () => {
  updateConsoleFilter({ enabled: true });
};

/**
 * Show only errors and warnings
 */
export const showErrorsOnly = () => {
  updateConsoleFilter({ 
    enabled: true, 
    showWebSocketOnly: false, 
    hideVerbose: true,
    showErrors: true,
    showWarnings: true,
  });
};

/**
 * Show all logs (disable all filters)
 */
export const showAllLogs = () => {
  updateConsoleFilter({ 
    enabled: false,
    showWebSocketOnly: false,
    hideVerbose: false,
  });
};

// Auto-enable on import (only in dev mode)
if (__DEV__) {
  enableWebSocketOnly();
  originalConsole.log('🔍 Console filter enabled: WebSocket/chat logs only');
}

export default {
  updateConsoleFilter,
  getConsoleFilterConfig,
  enableWebSocketOnly,
  disableConsoleFilter,
  enableConsoleFilter,
  showErrorsOnly,
  showAllLogs,
};

