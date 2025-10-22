import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationsAPI, { NotificationWebSocketManager } from '../services/notificationsApi';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('📱 Notification received:', notification);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const wsManagerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      console.log('🔔 Fetching global unread count...');
      const response = await notificationsAPI.getUnreadCount();
      if (response.status === 'success') {
        const count = response.data.count || 0;
        setUnreadCount(count);
        console.log('✅ Global unread count updated:', count);
        return count;
      }
    } catch (error) {
      console.error('❌ Error fetching global unread count:', error);
      setUnreadCount(0);
      return 0;
    }
  };

  // Initialize push notifications
  const initializePushNotifications = async () => {
    try {
      console.log('📱 Initializing push notifications...');
      
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
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return false;
    }
  };

  // Register push token with backend
  const registerPushToken = async (token) => {
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
    } catch (error) {
      console.error('❌ Error registering push token:', error);
    }
  };

  // Initialize WebSocket connection
  const initializeWebSocket = async () => {
    try {
      if (!wsManagerRef.current) {
        console.log('🔌 Initializing WebSocket connection...');
        wsManagerRef.current = new NotificationWebSocketManager();
        
        // Add event listeners
        wsManagerRef.current.addEventListener('new_notification', handleNewNotification);
        wsManagerRef.current.addEventListener('unread_count_update', handleUnreadCountUpdate);
        
        // Get auth token (implement based on your auth system)
        const token = await getAuthToken();
        if (token) {
          await wsManagerRef.current.connect(token);
          setIsConnected(true);
          console.log('✅ WebSocket connected successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error initializing WebSocket:', error);
      setIsConnected(false);
    }
  };

  // Get auth token (placeholder - implement based on your auth system)
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  };

  // Handle new notification from WebSocket
  const handleNewNotification = (notification) => {
    console.log('📨 New notification received:', notification);
    
    // Update local state
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show local notification
    showLocalNotification(notification);
  };

  // Handle unread count update from WebSocket
  const handleUnreadCountUpdate = (count) => {
    console.log('📊 Unread count updated:', count);
    setUnreadCount(count);
  };

  // Show local notification
  const showLocalNotification = async (notification) => {
    try {
      console.log('📱 Showing local notification:', notification);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data || {},
          sound: 'default',
          badge: unreadCount + 1,
        },
        trigger: null, // Show immediately
      });
      
      console.log('✅ Local notification scheduled');
    } catch (error) {
      console.error('❌ Error showing local notification:', error);
    }
  };

  // Handle notification response (when user taps on notification)
  const handleNotificationResponse = (response) => {
    console.log('📱 Notification response:', response);
    // TODO: Navigate to appropriate screen based on notification data
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
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
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return false;
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    setLoading(true);
    try {
      await fetchUnreadCount();
    } finally {
      setLoading(false);
    }
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
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
  const checkNotificationStatus = async () => {
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
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
      return null;
    }
  };

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      await initializePushNotifications();
      await fetchUnreadCount();
      await initializeWebSocket();
    };

    initialize();

    // Add notification event listeners
    const notificationListener = Notifications.addNotificationReceivedListener(handleNotificationResponse);
    const responseListener = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect();
      }
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Test function to manually trigger a notification
  const testNotification = async () => {
    try {
      console.log('🧪 Testing push notification...');
      await showLocalNotification({
        title: 'Test Notification',
        message: 'This is a test notification from LaSo Coach',
        data: { test: true }
      });
    } catch (error) {
      console.error('❌ Error testing notification:', error);
    }
  };

  const value = {
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
