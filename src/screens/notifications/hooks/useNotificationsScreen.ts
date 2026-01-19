import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import notificationsAPI from '../../../services/notificationsApi';
import { ProfileApi } from '../../../services/profileApi';
import { useNotifications } from '../../../context/NotificationContext';
import { Notification, NotificationTab, NotificationPreferences, Pagination } from '../types';

export const useNotificationsScreen = (selectedTab: NotificationTab) => {
  const { unreadCount, markAsRead: globalMarkAsRead, markAllAsRead: globalMarkAllAsRead } = useNotifications();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    hasMore: true,
  });
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    messages: true,
    content: true,
    payments: true,
    system: true,
    marketing: false,
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      try {
        const data = await ProfileApi.getProfile();
        // Handle case where profile might be null due to Prisma errors
        if (data) {
        setProfileData(data);
        } else {
          console.warn('⚠️ [useNotificationsScreen] Profile data is null - Prisma error or missing data');
          setProfileData(null);
        }
      } catch (error) {
        console.error('❌ [useNotificationsScreen] Error fetching profile:', error);
        setProfileData(null);
      }
    };
    fetchProfile();
  }, []);

  // Fetch notifications
  const fetchNotifications = async (page = 1, refresh = false): Promise<void> => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const params: any = {
        page,
        limit: pagination.limit,
        ...(selectedTab === 'unread' && { unreadOnly: true }),
      };

      const response: any = await notificationsAPI.getNotifications(params);
      
      if (response?.status === 'success') {
        const newNotifications = response?.data?.notifications || [];
        
        if (refresh || page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }

        setPagination(prev => ({
          ...prev,
          page,
          hasMore: response?.data?.pagination && page < response.data.pagination.pages,
        }));
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les notifications',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch on mount and when tab changes
  useEffect(() => {
    fetchNotifications(1, true);
  }, [selectedTab]);

  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    const success = await globalMarkAsRead(notificationId);
    
    if (success) {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      Toast.show({
        type: 'success',
        text1: 'Notification marquée comme lue',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de marquer comme lu',
      });
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    const success = await globalMarkAllAsRead();
    
    if (success) {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      Toast.show({
        type: 'success',
        text1: 'Toutes les notifications marquées comme lues',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de marquer toutes comme lues',
      });
    }
  };

  const handleDelete = (notificationId: string): void => {
    Alert.alert(
      'Supprimer la notification',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            Toast.show({
              type: 'success',
              text1: 'Notification supprimée',
            });
          },
        },
      ]
    );
  };

  const getTabCount = (tabType: NotificationTab): number => {
    switch (tabType) {
      case 'all':
        return notifications.length;
      case 'unread':
        return unreadCount;
      case 'messages':
        return notifications.filter(n => n.type === 'chat_message').length;
      case 'content':
        return notifications.filter(n => n.type === 'content_assigned').length;
      case 'payments':
        return notifications.filter(n => n.type === 'payment').length;
      case 'system':
        return notifications.filter(n => n.type === 'system').length;
      default:
        return 0;
    }
  };

  const getFilteredNotifications = (): Notification[] => {
    switch (selectedTab) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'content':
        return notifications.filter(n => n.type === 'content_assigned');
      case 'system':
        return notifications.filter(n => n.type === 'system');
      case 'messages':
        return notifications.filter(n => n.type === 'chat_message');
      case 'payments':
        return notifications.filter(n => n.type === 'payment');
      default:
        return notifications;
    }
  };

  const togglePreference = (type: keyof NotificationPreferences): void => {
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleLoadMore = (): void => {
    if (pagination.hasMore && !loading) {
      fetchNotifications(pagination.page + 1, false);
    }
  };

  return {
    notifications: getFilteredNotifications(),
    loading,
    refreshing,
    profileData,
    pagination,
    showPreferencesModal,
    preferences,
    unreadCount,
    setShowPreferencesModal,
    togglePreference,
    markNotificationAsRead,
    markAllAsRead,
    handleDelete,
    getTabCount,
    handleRefresh: () => fetchNotifications(1, true),
    handleLoadMore,
  };
};

