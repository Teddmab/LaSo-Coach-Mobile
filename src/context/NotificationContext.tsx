import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
// Lazy load native modules to avoid NativeEventEmitter crash at startup
let Notifications: any = null;
let Device: any = null;

const getNotifications = () => {
  if (!Notifications) {
    try {
      Notifications = require('expo-notifications');
    } catch (error) {
      console.warn('⚠️ [NotificationContext] Failed to load Notifications:', error);
    }
  }
  return Notifications;
};

const getDevice = () => {
  if (!Device) {
    try {
      Device = require('expo-device');
    } catch (error) {
      console.warn('⚠️ [NotificationContext] Failed to load Device:', error);
    }
  }
  return Device;
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationsAPI from '../services/notificationsApi';
import chatSocketService from '../services/chatSocketService';
// Removed Firebase import - Expo Push Notifications doesn't require Firebase to be initialized
// Firebase is only needed for FCM on Android, but Expo handles this internally
import { useAuth } from './FirebaseAuthContext';

interface Notification {
  id: string;
  type?: string;
  title: string;
  message?: string;
  read?: boolean;
  data?: any;
}

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;
  isConnected: boolean;
  fetchUnreadCount: () => Promise<number>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  showLocalNotification: (notification: Notification) => Promise<void>;
  testNotification: () => Promise<void>;
  checkNotificationStatus: () => Promise<any>;
  unregisterPushToken: () => Promise<void>; // Expose unregister function for logout
}

// Configure notification handling - wrapped in try-catch to avoid crash if module not ready
// This will be called lazily when notifications are first used
const setupNotificationHandler = () => {
  try {
    const notifications = getNotifications();
    if (!notifications) return;
    
    notifications.setNotificationHandler({
      handleNotification: async (notification: any): Promise<any> => {
        return {
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  } catch (error) {
    console.warn('⚠️ [Notifications] Failed to set notification handler:', error);
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const notificationUnsubscriberRef = useRef<(() => void) | null>(null);
  const listenerSetupRef = useRef<boolean>(false); // Track if listener is set up
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { isAuthenticated, authReady, user } = useAuth();
  const authInitializedRef = useRef<boolean>(false); // avoid duplicate fetches when auth state flips quickly

  // Fetch unread count
  const fetchUnreadCount = async (): Promise<number> => {
    try {
      // Guard: only fetch if authenticated so backend gets a valid bearer token
      if (!isAuthenticated) {
        return 0;
      }
      const response: any = await notificationsAPI.getUnreadCount();
      if (response.status === 'success') {
        const count = response.data.count || 0;
        setUnreadCount(count);
        return count;
      }
      return 0;
    } catch (error: any) {
      setUnreadCount(0);
      return 0;
    }
  };

  // Initialize push notifications
  const initializePushNotifications = async (): Promise<boolean> => {
    try {
      // Check if device is physical device (Expo Push only works on physical devices)
      const device = getDevice();
      if (!device || !device.isDevice) {
        console.log('📱 [NotificationProvider] Not a physical device, skipping push notifications');
        return false;
      }
      
      // Setup notification handler on first use
      setupNotificationHandler();
      
      const notifications = getNotifications();
      if (!notifications) return false;
      
      console.log('📱 [NotificationProvider] Requesting push notification permissions...');
      
      // Request permissions with better user messaging
      const { status: existingStatus } = await notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('📱 [NotificationProvider] Permissions not granted, requesting...');
        const { status } = await notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: false,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('⚠️ [NotificationProvider] Push notification permissions denied');
        return false;
      }
      
      console.log('✅ [NotificationProvider] Push notification permissions granted');

      // Get push token
      // NOTE: Expo Push Notifications can work without Firebase initialized
      // Firebase is only needed for FCM on Android, but Expo handles this internally
      console.log('📱 [NotificationProvider] Getting Expo push token...');
      try {
        const token = await notifications.getExpoPushTokenAsync({
          projectId: '6f5af143-a419-447d-a44e-3b3e230cf397', // Your EAS project ID
        });
        
        console.log('✅ [NotificationProvider] Push token obtained:', token.data.substring(0, 30) + '...');
        
        // Check if token has changed (e.g., after app reinstall)
        const storedToken = await AsyncStorage.getItem('expoPushToken');
        const tokenChanged = storedToken !== token.data;
        
        // Store token for backend registration
        await AsyncStorage.setItem('expoPushToken', token.data);
        
        // Register token with backend (only if user is authenticated)
        // We check authentication here because we need a valid token to register
        if (isAuthenticated) {
          console.log('📱 [NotificationProvider] Registering push token with backend...');
          await registerPushToken(token.data, tokenChanged);
          console.log('✅ [NotificationProvider] Push token registered with backend');
        } else {
          console.log('📱 [NotificationProvider] User not authenticated, token will be registered after login');
        }
        
        return true;
      } catch (tokenError: any) {
        // Handle FCM/Firebase initialization errors gracefully
        if (tokenError.message?.includes('Firebase') || tokenError.message?.includes('FCM')) {
          console.warn('⚠️ [NotificationProvider] Firebase/FCM not initialized yet, will retry later:', tokenError.message);
          // Don't fail completely - we can retry when Firebase is ready
          return false;
        }
        throw tokenError; // Re-throw other errors
      }
    } catch (error: any) {
      console.error('❌ [NotificationProvider] Error initializing push notifications:', error);
      // Don't block app startup if push notifications fail
      return false;
    }
  };

  // Register push token with backend
  const registerPushToken = async (token: string, isNewToken: boolean = false): Promise<void> => {
    try {
      if (!isAuthenticated) {
        console.warn('⚠️ [NotificationProvider] User not authenticated, skipping token registration');
        return;
      }
      
      const device = getDevice();
      const deviceId = device?.osBuildId || undefined;
      
      console.log('📡 [NotificationProvider] Sending push token to backend...', {
        token: token.substring(0, 30) + '...',
        platform: Platform.OS,
        deviceId,
        isNewToken,
      });
      
      await notificationsAPI.registerPushToken({
        token,
        platform: Platform.OS,
        deviceId,
      });
      
      console.log('✅ [NotificationProvider] Push token successfully registered with backend');
    } catch (error: any) {
      // Pour les erreurs 502 (Bad Gateway), réduire le niveau de log
      const is502Error = error.response?.status === 502 || error.status === 502;
      
      if (is502Error) {
        // Erreur 502 souvent temporaire - log silencieux
        if (__DEV__) {
          console.warn('⚠️ [NotificationProvider] Serveur temporairement indisponible (502) - Réessayez dans quelques minutes');
        }
      } else {
        console.error('❌ [NotificationProvider] Failed to register push token:', error);
      }
      // Don't throw - allow app to continue even if token registration fails
    }
  };

  // Unregister push token from backend
  const unregisterPushToken = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem('expoPushToken');
      if (!token) {
        console.log('📱 [NotificationProvider] No push token to unregister');
        return;
      }
      
      console.log('📡 [NotificationProvider] Unregistering push token from backend...');
      
      await notificationsAPI.unregisterPushToken({ token });
      
      // Remove token from storage
      await AsyncStorage.removeItem('expoPushToken');
      
      console.log('✅ [NotificationProvider] Push token successfully unregistered');
    } catch (error: any) {
      console.error('❌ [NotificationProvider] Failed to unregister push token:', error);
      // Still remove token from storage even if API call fails
      await AsyncStorage.removeItem('expoPushToken');
    }
  };

  // Initialize WebSocket connection - use same Socket.IO connection as chat
  const initializeWebSocket = (): void => {
    try {
      if (!isAuthenticated) {
        return;
      }
      // Clean up existing listener
      if (notificationUnsubscriberRef.current) {
        notificationUnsubscriberRef.current();
        notificationUnsubscriberRef.current = null;
      }

      // Use the same Socket.IO connection as chat (chatSocketService)
      // This ensures all notifications come through the same connection
      const socket = chatSocketService.getSocket();
      
      if (socket && socket.connected) {
        
        // Subscribe to notification events from Socket.IO
        // This will receive ALL notification types (challenges, achievements, chat, etc.)
        const unsubscribeFn = chatSocketService.onNotification((notification: any) => {
          // Handle ALL notification types (not just CHAT_MESSAGE)
          // Chat notifications are also handled by ChatContext, but we show the notification here
          handleNewNotification(notification);
        });
        notificationUnsubscriberRef.current = (unsubscribeFn as any) || (() => {});
        
        listenerSetupRef.current = true;
        setIsConnected(true);
      } else {
        setIsConnected(false);
        
        // Retry after a short delay if socket is not connected
        setTimeout(() => {
          initializeWebSocket();
        }, 2000);
      }
    } catch (error: any) {
      setIsConnected(false);
    }
  };

  /**
   * Handle new notification from WebSocket
   * 
   * IMPORTANT COMPORTEMENT POUR LES MESSAGES:
   * - Quand vous envoyez un message: Vous NE recevez PAS de notification (filtrée ici)
   * - Quand quelqu'un vous envoie un message: Vous recevez la notification (passée ici)
   * 
   * Ceci garantit que vous ne voyez jamais vos propres notifications de messages,
   * mais que vos correspondants voient bien les notifications de vos messages.
   */
  const handleNewNotification = useCallback((notification: Notification): void => {
    // CRITICAL: Filter out notifications for messages sent by the current user
    // For CHAT_MESSAGE notifications, check if the sender is the current user
    // This ensures that when you send a message, you don't see your own notification
    // but the recipient will see it
    if (notification.type === 'CHAT_MESSAGE' || notification.type === 'chat_message') {
      if (!user) {
        console.warn('⚠️ [NotificationContext] No user available to filter notification');
        return; // Don't show notifications if user is not authenticated
      }

      // Get current user ID - check multiple possible ID fields (backend might use different formats)
      // Priority: backend id > Firebase uid > userId (if exists)
      const currentUserId = user?.id || user?.uid || (user as any)?.userId;
      const currentUserEmail = user?.email?.toLowerCase()?.trim();
      
      if (!currentUserId && !currentUserEmail) {
        console.warn('⚠️ [NotificationContext] Cannot identify current user (no ID or email)');
        return; // Don't show notifications if we can't identify the user
      }
      
      // Check multiple possible sender ID fields (backend might use different ID format)
      // Also check directly on notification object (some backends put it there)
      const notificationAny = notification as any;
      const senderId = notification.data?.senderId || 
                       notification.data?.sender?.id || 
                       notification.data?.sender?.userId ||
                       notification.data?.userId ||
                       notificationAny.senderId ||
                       notificationAny.sender?.id ||
                       notificationAny.userId;
      const senderEmail = notification.data?.sender?.email || 
                          notification.data?.senderEmail ||
                          notification.data?.email ||
                          notificationAny.sender?.email ||
                          notificationAny.senderEmail ||
                          notificationAny.email;
      
      // Normalize sender email for comparison
      const senderEmailNormalized = senderEmail ? String(senderEmail).toLowerCase().trim() : null;
      
      // Convert both to strings for comparison to handle integer vs string mismatches
      const currentUserIdStr = currentUserId ? String(currentUserId).trim() : null;
      const senderIdStr = senderId ? String(senderId).trim() : null;
      
      // Try multiple ID comparison strategies
      // CRITICAL: Be thorough - check exact match, substring match (for UUID variations), and reverse
      const idMatch = currentUserIdStr && senderIdStr && (
        // Exact match (most common case)
        senderIdStr === currentUserIdStr ||
        // Substring match (handles UUID vs short ID, or partial matches)
        senderIdStr.includes(currentUserIdStr) ||
        currentUserIdStr.includes(senderIdStr) ||
        // Also check if IDs match when normalized (remove dashes, spaces, etc.)
        senderIdStr.replace(/[-_\s]/g, '') === currentUserIdStr.replace(/[-_\s]/g, '')
      );
      
      // Email comparison - most reliable when IDs don't match
      const emailMatch = currentUserEmail && senderEmailNormalized && 
        currentUserEmail === senderEmailNormalized;
      
      // CRITICAL: If sender matches current user by ID OR email, don't show notification
      // This ensures you never see notifications for your own messages
      if (idMatch || emailMatch) {
        console.log('🔕 [NotificationContext] FILTRÉ - Notification pour votre propre message ignorée', {
          currentUserId: currentUserIdStr,
          currentUserEmail: currentUserEmail,
          senderId: senderIdStr,
          senderEmail: senderEmailNormalized,
          idMatch,
          emailMatch,
          notificationId: notification.id,
          notificationType: notification.type,
        });
        return; // CRITICAL: Don't show notification for own messages - exit early
      }
      
      // DEBUG: Log when notification passes filter (for debugging)
      console.log('✅ [NotificationContext] Notification passée - message d\'un autre utilisateur', {
        senderId: senderIdStr,
        senderEmail: senderEmailNormalized,
        currentUserId: currentUserIdStr,
        currentUserEmail: currentUserEmail,
        notificationId: notification.id,
      });
    }
    
    // Update local state
    setNotifications(prev => {
      // Check for duplicates
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        return prev;
      }
      return [notification, ...prev];
    });
    
    // Update unread count
    setUnreadCount(prev => prev + 1);
    
    // CRITICAL: Show local notification for ALL notification types
    // This includes challenges, achievements, chat messages, etc.
    showLocalNotification(notification);
  }, [user]);

  // Handle unread count update from WebSocket
  const handleUnreadCountUpdate = (count: number): void => {
    setUnreadCount(count);
  };

  // Show local notification
  const showLocalNotification = useCallback(async (notification: Notification): Promise<void> => {
    try {
      // Skip if notification doesn't have required fields
      if (!notification.title || !notification.message) {
        return;
      }
      
      const notifications = getNotifications();
      if (!notifications) return;
      
      await notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message || '',
          data: {
            ...notification.data,
            notificationId: notification.id,
            type: notification.type,
          },
          sound: 'default',
          badge: unreadCount + 1,
        },
        trigger: null, // Show immediately
      });
      
    } catch (error: any) {
    }
  }, [unreadCount]);

  // Handle notification response (when user taps on notification)
  const handleNotificationResponse = (response: any): void => {
    // TODO: Navigate to appropriate screen based on notification data
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error: any) {
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<boolean> => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
      
      return true;
    } catch (error: any) {
      return false;
    }
  };

  // Refresh notifications
  const refreshNotifications = async (): Promise<void> => {
    setLoading(true);
    try {
      await fetchUnreadCount();
    } finally {
      setLoading(false);
    }
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string): void => {
      if (nextAppState === 'active') {
        // App became active, refresh unread count
        fetchUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Debug function to check notification permissions
  const checkNotificationStatus = async (): Promise<any> => {
    try {
      const notifications = getNotifications();
      const device = getDevice();
      if (!notifications || !device) return null;
      
      const permissions = await notifications.getPermissionsAsync();
      
      const token = await AsyncStorage.getItem('expoPushToken');
      
      return {
        permissions,
        token,
        isDevice: device.isDevice,
        platform: Platform.OS
      };
    } catch (error: any) {
      return null;
    }
  };

  // Initialize on mount
  useEffect(() => {
    const initialize = async (): Promise<void> => {
      await initializePushNotifications();
      // Do NOT fetch unread count here; wait for authReady
      initializeWebSocket();
    };
    initialize();

    // Add notification event listeners
    const notifications = getNotifications();
    if (!notifications) return;
    
    // Listener for notifications received when app is in foreground/background
    const notificationListener = notifications.addNotificationReceivedListener((notification: any) => {
      console.log('📬 [NotificationProvider] Notification received:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
      
      // If app is in background, the OS will display the notification
      // If app is in foreground, we can handle it here if needed
      // The notification handler (setupNotificationHandler) will show it
    });
    
    // Listener for when user taps on a notification (app opened from notification)
    const responseListener = notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('👆 [NotificationProvider] Notification tapped:', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data,
      });
      
      handleNotificationResponse(response);
    });

    // Monitor socket connection status and re-initialize when connected
    const checkSocketInterval = setInterval(() => {
      const socket = chatSocketService.getSocket();
      if (socket && socket.connected && !listenerSetupRef.current) {
        initializeWebSocket();
      }
    }, 3000);

    return () => {
      if (notificationUnsubscriberRef.current) {
        notificationUnsubscriberRef.current();
        notificationUnsubscriberRef.current = null;
      }
      clearInterval(checkSocketInterval);
      notificationListener.remove();
      responseListener.remove();
    };
  }, []); // Empty deps - only run on mount/unmount

  // React to auth becoming ready & authenticated
  useEffect(() => {
    if (!authReady) return;
    if (isAuthenticated && !authInitializedRef.current) {
      authInitializedRef.current = true;
      fetchUnreadCount();
      initializeWebSocket();
      // Re-initialize push notifications when user logs in
      initializePushNotifications();
    } else if (!isAuthenticated && authInitializedRef.current) {
      // User logged out - unregister push token
      authInitializedRef.current = false;
      unregisterPushToken();
    }
  }, [authReady, isAuthenticated]);

  // Test function to manually trigger a notification
  const testNotification = async (): Promise<void> => {
    try {
      await showLocalNotification({
        id: 'test-' + Date.now(),
        title: 'Notification de test',
        message: 'Ceci est une notification de test de LaSo Coach',
        data: { test: true }
      });
    } catch (error: any) {
    }
  };

  const value: NotificationContextType = {
    unreadCount,
    notifications,
    loading,
    isConnected,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    showLocalNotification,
    testNotification,
    checkNotificationStatus,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

