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

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async (notification: Notifications.Notification): Promise<Notifications.NotificationBehavior> => {
    console.log('📱 Notification received:', notification);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

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
        console.log('🔔 Skipping unread count fetch (not authenticated yet)');
        return 0;
      }
      console.log('🔔 Fetching global unread count (auth OK)...');
      const response: any = await notificationsAPI.getUnreadCount();
      if (response.status === 'success') {
        const count = response.data.count || 0;
        setUnreadCount(count);
        console.log('✅ Global unread count updated:', count);
        return count;
      }
      return 0;
    } catch (error: any) {
      console.error('❌ Error fetching global unread count:', error);
      setUnreadCount(0);
      return 0;
    }
  };

  // Initialize push notifications
  const initializePushNotifications = async (): Promise<boolean> => {
    try {
      console.log('📱 Initializing push notifications...');
      // Ensure Firebase is initialized before accessing Expo push token
      getFirebaseApp();
      
      // Check if device is physical device
      if (!Device.isDevice) {
        console.log('⚠️ Push notifications only work on physical devices');
        return false;
      }
      
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('📱 Requesting push notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permission denied');
        return false;
      }

      console.log('✅ Push notification permissions granted');

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '6f5af143-a419-447d-a44e-3b3e230cf397', // Your EAS project ID
      });
      
      console.log('✅ Push notification token:', token.data);
      
      // Store token for backend registration
      await AsyncStorage.setItem('expoPushToken', token.data);
      
      // Register token with backend
      await registerPushToken(token.data);
      
      return true;
    } catch (error: any) {
      console.error('❌ Error initializing push notifications:', error);
      return false;
    }
  };

  // Register push token with backend
  const registerPushToken = async (token: string): Promise<void> => {
    try {
      console.log('📱 Registering push token with backend...');
      
      // TODO: Implement API call to register push token with your backend
      // Example:
      // await api.post('/notifications/register-token', { 
      //   token, 
      //   platform: Platform.OS,
      //   deviceId: await Device.getDeviceIdAsync()
      // });
      
      console.log('✅ Push token registered with backend');
    } catch (error: any) {
      console.error('❌ Error registering push token:', error);
    }
  };

  // Initialize WebSocket connection - use same Socket.IO connection as chat
  const initializeWebSocket = (): void => {
    try {
      if (!isAuthenticated) {
        console.log('⚠️ [NotificationContext] Not authenticated - deferring Socket.IO listener setup');
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
        console.log('🔌 [NotificationContext] Setting up Socket.IO notification listener...');
        
        // Subscribe to notification events from Socket.IO
        // This will receive ALL notification types (challenges, achievements, chat, etc.)
        const unsubscribeFn = chatSocketService.onNotification((notification: any) => {
          console.log('🔔 [NotificationContext] Notification received via Socket.IO:', {
            type: notification.type,
            title: notification.title,
          });
          
          // Handle ALL notification types (not just CHAT_MESSAGE)
          // Chat notifications are also handled by ChatContext, but we show the notification here
          handleNewNotification(notification);
        });
        notificationUnsubscriberRef.current = (unsubscribeFn as any) || (() => {});
        
        listenerSetupRef.current = true;
        setIsConnected(true);
        console.log('✅ [NotificationContext] Socket.IO notification listener set up successfully');
      } else {
        console.log('⚠️ [NotificationContext] Socket.IO not connected yet, will retry...');
        setIsConnected(false);
        
        // Retry after a short delay if socket is not connected
        setTimeout(() => {
          initializeWebSocket();
        }, 2000);
      }
    } catch (error: any) {
      console.error('❌ [NotificationContext] Error initializing WebSocket:', error);
      setIsConnected(false);
    }
  };

  // Handle new notification from WebSocket
  const handleNewNotification = useCallback((notification: Notification): void => {
    console.log('📨 [NotificationContext] New notification received:', {
      type: notification.type,
      title: notification.title,
      message: notification.message?.substring(0, 50),
    });
    
    // CRITICAL: Filter out notifications for messages sent by the current user
    // For CHAT_MESSAGE notifications, check if the sender is the current user
    if (notification.type === 'CHAT_MESSAGE' || notification.type === 'chat_message') {
      const currentUserId = user?.id || user?.uid;
      const senderId = notification.data?.senderId || notification.data?.sender?.id;
      
      // Compare sender ID with current user ID
      if (currentUserId && senderId && String(senderId) === String(currentUserId)) {
        console.log('ℹ️ [NotificationContext] Skipping notification for own message:', notification.id);
        return; // Don't show notification for own messages
      }
      
      // Also check by email as fallback
      const currentUserEmail = user?.email;
      const senderEmail = notification.data?.sender?.email || notification.data?.senderEmail;
      if (currentUserEmail && senderEmail && 
          currentUserEmail.toLowerCase().trim() === senderEmail.toLowerCase().trim()) {
        console.log('ℹ️ [NotificationContext] Skipping notification for own message (by email):', notification.id);
        return; // Don't show notification for own messages
      }
    }
    
    // Update local state
    setNotifications(prev => {
      // Check for duplicates
      const exists = prev.some(n => n.id === notification.id);
      if (exists) {
        console.log('⚠️ [NotificationContext] Duplicate notification, skipping:', notification.id);
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
    console.log('📊 Unread count updated:', count);
    setUnreadCount(count);
  };

  // Show local notification
  const showLocalNotification = useCallback(async (notification: Notification): Promise<void> => {
    try {
      // Skip if notification doesn't have required fields
      if (!notification.title || !notification.message) {
        console.warn('⚠️ [NotificationContext] Notification missing title or message, skipping:', notification);
        return;
      }
      
      console.log('📱 [NotificationContext] Showing local notification:', {
        type: notification.type,
        title: notification.title,
        message: notification.message?.substring(0, 50),
      });
      
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
      
      console.log('✅ [NotificationContext] Local notification scheduled successfully');
    } catch (error: any) {
      console.error('❌ [NotificationContext] Error showing local notification:', error);
    }
  }, [unreadCount]);

  // Handle notification response (when user taps on notification)
  const handleNotificationResponse = (response: Notifications.NotificationResponse): void => {
    console.log('📱 Notification response:', response);
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
      console.error('❌ Error marking notification as read:', error);
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
      console.error('❌ Error marking all notifications as read:', error);
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
      console.log('📱 App state changed to:', nextAppState);
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
      console.log('📱 Notification permissions:', permissions);
      
      const token = await AsyncStorage.getItem('expoPushToken');
      console.log('📱 Stored push token:', token);
      
      return {
        permissions,
        token,
        isDevice: Device.isDevice,
        platform: Platform.OS
      };
    } catch (error: any) {
      console.error('❌ Error checking notification status:', error);
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
      console.log('📱 Notification received:', notification);
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      handleNotificationResponse(response);
    });

    // Monitor socket connection status and re-initialize when connected
    const checkSocketInterval = setInterval(() => {
      const socket = chatSocketService.getSocket();
      if (socket && socket.connected && !listenerSetupRef.current) {
        console.log('🔄 [NotificationContext] Socket.IO connected, setting up listener...');
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
      console.log('🔐 [NotificationContext] Auth ready & authenticated - fetching unread count and ensuring socket listener');
      fetchUnreadCount();
      initializeWebSocket();
    }
  }, [authReady, isAuthenticated]);

  // Test function to manually trigger a notification
  const testNotification = async (): Promise<void> => {
    try {
      console.log('🧪 Testing push notification...');
      await showLocalNotification({
        id: 'test-' + Date.now(),
        title: 'Test Notification',
        message: 'This is a test notification from LaSo Coach',
        data: { test: true }
      });
    } catch (error: any) {
      console.error('❌ Error testing notification:', error);
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

