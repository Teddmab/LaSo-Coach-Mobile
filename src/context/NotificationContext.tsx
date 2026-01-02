import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationsAPI from '../services/notificationsApi';
import chatSocketService from '../services/chatSocketService';
import { getFirebaseApp } from '../config/firebaseApp';
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
}

// Configure notification handling - wrapped in try-catch to avoid crash if module not ready
try {
  Notifications.setNotificationHandler({
    handleNotification: async (notification: Notifications.Notification): Promise<Notifications.NotificationBehavior> => {
      return {
        shouldShowAlert: true,
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
      // Ensure Firebase is initialized before accessing Expo push token - with error handling
      try {
        const firebaseApp = getFirebaseApp();
        if (!firebaseApp) {
          console.warn('⚠️ [NotificationProvider] Firebase not initialized, skipping push notifications');
          return false;
        }
      } catch (firebaseError: any) {
        console.warn('⚠️ [NotificationProvider] Firebase initialization error:', firebaseError.message);
        return false;
      }
      
      // Check if device is physical device
      if (!Device.isDevice) {
        return false;
      }
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return false;
      }


      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '6f5af143-a419-447d-a44e-3b3e230cf397', // Your EAS project ID
      });
      
      
      // Store token for backend registration
      await AsyncStorage.setItem('expoPushToken', token.data);
      
      // Register token with backend
      await registerPushToken(token.data);
      
      return true;
    } catch (error: any) {
      return false;
    }
  };

  // Register push token with backend
  const registerPushToken = async (token: string): Promise<void> => {
    try {
      
      // TODO: Implement API call to register push token with your backend
      // Example:
      // await api.post('/notifications/register-token', { 
      //   token, 
      //   platform: Platform.OS,
      //   deviceId: await Device.getDeviceIdAsync()
      // });
      
    } catch (error: any) {
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
      
      await Notifications.scheduleNotificationAsync({
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
  const handleNotificationResponse = (response: Notifications.NotificationResponse): void => {
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
      const permissions = await Notifications.getPermissionsAsync();
      
      const token = await AsyncStorage.getItem('expoPushToken');
      
      return {
        permissions,
        token,
        isDevice: Device.isDevice,
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
    const notificationListener = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
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
    }
  }, [authReady, isAuthenticated]);

  // Test function to manually trigger a notification
  const testNotification = async (): Promise<void> => {
    try {
      await showLocalNotification({
        id: 'test-' + Date.now(),
        title: 'Test Notification',
        message: 'This is a test notification from LaSo Coach',
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

