import { useState, useEffect, useMemo } from 'react';
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
        
        // ✅ Trier les notifications de manière stable (par date de création, plus récentes en premier)
        // Utiliser l'ID comme critère secondaire pour garantir un ordre stable même si les dates sont identiques
        const sortedNotifications = [...newNotifications].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateB !== dateA) {
            return dateB - dateA; // Plus récentes en premier
          }
          // Si même date, utiliser l'ID pour un tri stable
          return a.id.localeCompare(b.id);
        });
        
        if (refresh || page === 1) {
          setNotifications(sortedNotifications);
        } else {
          // ✅ Maintenir l'ordre lors de l'ajout de nouvelles notifications
          setNotifications(prev => {
            const combined = [...prev, ...sortedNotifications];
            // Re-trier pour maintenir l'ordre chronologique stable
            return combined.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              if (dateB !== dateA) {
                return dateB - dateA;
              }
              // Si même date, utiliser l'ID pour un tri stable
              return a.id.localeCompare(b.id);
            });
          });
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

  // ✅ Utiliser useMemo pour mémoriser la liste filtrée et triée de manière stable
  const filteredNotifications = useMemo((): Notification[] => {
    let filtered: Notification[] = [];
    
    switch (selectedTab) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'content':
        filtered = notifications.filter(n => n.type === 'content_assigned');
        break;
      case 'system':
        filtered = notifications.filter(n => n.type === 'system');
        break;
      case 'messages':
        filtered = notifications.filter(n => n.type === 'chat_message');
        break;
      case 'payments':
        filtered = notifications.filter(n => n.type === 'payment');
        break;
      default:
        filtered = notifications;
    }
    
    // ✅ Trier de manière stable pour maintenir l'ordre même après refresh
    // Utiliser une copie pour éviter de muter le tableau original
    return [...filtered].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      // Si même date, utiliser l'ID pour un tri stable
      if (dateA === dateB) {
        return a.id.localeCompare(b.id);
      }
      return dateB - dateA; // Plus récentes en premier
    });
  }, [notifications, selectedTab]);

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
    notifications: filteredNotifications,
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

