import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Switch,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Avatar from '../components/Avatar';
import AppHeader from '../components/AppHeader';
import notificationsAPI, { NotificationWebSocketManager } from '../services/notificationsApi';
import { useNotifications } from '../context/NotificationContext';
import Toast from 'react-native-toast-message';

const NotificationsScreen = ({ user, onLogout, onTabPress, activeTab, onClose }) => {
  const [selectedTab, setSelectedTab] = useState('all'); // all, unread, messages, content, payments, system
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState({
    messages: true,
    content: true,
    payments: true,
    system: true,
    marketing: false
  });

  // Use global notification context
  const { unreadCount, markAsRead: globalMarkAsRead, markAllAsRead: globalMarkAllAsRead } = useNotifications();

  // Local state for this screen
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasMore: true
  });

  // Fetch profile data for avatar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { ProfileApi } = await import('../services/profileApi');
        const data = await ProfileApi.getProfile();
        setProfileData(data);
        console.log('[NotificationsScreen] 📊 Profile data fetched:', data);
      } catch (error) {
        console.error('[NotificationsScreen] ❌ Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  // API Functions
  const fetchNotifications = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const params = {
        page,
        limit: pagination.limit,
        ...(selectedTab === 'unread' && { unreadOnly: true })
      };

      const response = await notificationsAPI.getNotifications(params);
      
      if (response.status === 'success') {
        const newNotifications = response.data.notifications || [];
        
        if (refresh || page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }

        setPagination(prev => ({
          ...prev,
          page,
          hasMore: response.data.pagination && page < response.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les notifications'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    const success = await globalMarkAsRead(notificationId);
    
    if (success) {
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      Toast.show({
        type: 'success',
        text1: 'Notification marquée comme lue'
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de marquer comme lu'
      });
    }
  };

  const markAllAsRead = async () => {
    const success = await globalMarkAllAsRead();
    
    if (success) {
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      Toast.show({
        type: 'success',
        text1: 'Toutes les notifications marquées comme lues'
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de marquer toutes comme lues'
      });
    }
  };

  // useEffect hooks
  useEffect(() => {
    fetchNotifications(1, true);
  }, []);

  useEffect(() => {
    fetchNotifications(1, true);
  }, [selectedTab]);

  const getTabCount = (tabType) => {
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

  const getFilteredNotifications = () => {
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

  const handleMarkAsRead = (notificationId) => {
    markNotificationAsRead(notificationId);
  };

  const handleDelete = (notificationId) => {
    Alert.alert(
      'Supprimer la notification',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete notification API
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            Toast.show({
              type: 'success',
              text1: 'Notification supprimée'
            });
          }
        }
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRefresh = () => {
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchNotifications(pagination.page + 1, false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'chat_message':
        return { name: 'chatbubble-ellipses', color: '#2196F3' };
      case 'content_assigned':
        return { name: 'document-text', color: '#4CAF50' };
      case 'session':
        return { name: 'calendar', color: '#FF9800' };
      case 'system':
        return { name: 'settings', color: '#9C27B0' };
      case 'payment':
        return { name: 'card', color: '#F44336' };
      default:
        return { name: 'information-circle', color: '#2196F3' };
    }
  };

  const formatNotificationTime = (createdAt) => {
    if (!createdAt) return 'Récemment';
    
    const now = new Date();
    const notificationDate = new Date(createdAt);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    return notificationDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Translate notification title from English to French
   */
  const translateNotificationTitle = (title) => {
    if (!title) return title;
    
    const titleLower = title.toLowerCase().trim();
    let translated = title;
    
    // Common notification title translations (exact matches first)
    const exactTranslations = {
      'badge unlocked': 'Badge débloqué',
      'badge unlocked!': 'Badge débloqué !',
      'congratulations': 'Félicitations',
      'congratulations!': 'Félicitations !',
      'new content': 'Nouveau contenu',
      'new content assigned': 'Nouveau contenu assigné',
      'content assigned': 'Contenu assigné',
      'new message': 'Nouveau message',
      'new session': 'Nouvelle session',
      'session reminder': 'Rappel de session',
      'payment received': 'Paiement reçu',
      'payment successful': 'Paiement réussi',
      'subscription updated': 'Abonnement mis à jour',
      'subscription expired': 'Abonnement expiré',
      'achievement unlocked': 'Succès débloqué',
      'achievement unlocked!': 'Succès débloqué !',
      'goal reached': 'Objectif atteint',
      'goal reached!': 'Objectif atteint !',
      'welcome': 'Bienvenue',
      'welcome!': 'Bienvenue !',
    };
    
    // Check for exact match
    if (exactTranslations[titleLower]) {
      return exactTranslations[titleLower];
    }
    
    // Pattern-based translations (case-insensitive)
    const patterns = [
      { en: /badge unlocked/gi, fr: 'Badge débloqué' },
      { en: /congratulations/gi, fr: 'Félicitations' },
      { en: /new content/gi, fr: 'Nouveau contenu' },
      { en: /content assigned/gi, fr: 'Contenu assigné' },
      { en: /new message/gi, fr: 'Nouveau message' },
      { en: /achievement unlocked/gi, fr: 'Succès débloqué' },
      { en: /goal reached/gi, fr: 'Objectif atteint' },
      { en: /payment received/gi, fr: 'Paiement reçu' },
      { en: /payment successful/gi, fr: 'Paiement réussi' },
      { en: /subscription updated/gi, fr: 'Abonnement mis à jour' },
      { en: /subscription expired/gi, fr: 'Abonnement expiré' },
      { en: /session reminder/gi, fr: 'Rappel de session' },
      { en: /new session/gi, fr: 'Nouvelle session' },
    ];
    
    // Apply pattern replacements
    patterns.forEach(({ en, fr }) => {
      translated = translated.replace(en, fr);
    });
    
    return translated;
  };

  /**
   * Translate notification message from English to French
   */
  const translateNotificationMessage = (message) => {
    if (!message) return message;
    
    let translated = message;
    
    // Pattern-based translations (order matters - more specific first)
    const patterns = [
      // Achievement/Badge related
      { en: /congratulations! you have/gi, fr: 'Félicitations ! Vous avez' },
      { en: /congratulations! you/gi, fr: 'Félicitations ! Vous' },
      { en: /congratulations, you have/gi, fr: 'Félicitations, vous avez' },
      { en: /congratulations, you/gi, fr: 'Félicitations, vous' },
      { en: /congratulations! /gi, fr: 'Félicitations ! ' },
      { en: /congratulations, /gi, fr: 'Félicitations, ' },
      { en: /you have unlocked/gi, fr: 'Vous avez débloqué' },
      { en: /you've unlocked/gi, fr: 'Vous avez débloqué' },
      { en: /you unlocked/gi, fr: 'Vous avez débloqué' },
      
      // Content related
      { en: /new content has been assigned to you/gi, fr: 'Un nouveau contenu vous a été assigné' },
      { en: /new content has been assigned/gi, fr: 'Un nouveau contenu vous a été assigné' },
      { en: /content has been assigned to you/gi, fr: 'Un contenu vous a été assigné' },
      { en: /content has been assigned/gi, fr: 'Un contenu vous a été assigné' },
      { en: /you have new content/gi, fr: 'Vous avez un nouveau contenu' },
      { en: /new content available/gi, fr: 'Nouveau contenu disponible' },
      
      // Message related
      { en: /you have a new message from/gi, fr: 'Vous avez un nouveau message de' },
      { en: /you have a new message/gi, fr: 'Vous avez un nouveau message' },
      { en: /new message from/gi, fr: 'Nouveau message de' },
      
      // Session related
      { en: /your session is starting soon/gi, fr: 'Votre session commence bientôt' },
      { en: /your session is starting/gi, fr: 'Votre session commence' },
      { en: /you have a session/gi, fr: 'Vous avez une session' },
      { en: /session reminder/gi, fr: 'Rappel de session' },
      
      // Payment related
      { en: /your payment was successful/gi, fr: 'Votre paiement a réussi' },
      { en: /payment received successfully/gi, fr: 'Paiement reçu avec succès' },
      { en: /payment received/gi, fr: 'Paiement reçu' },
      { en: /subscription has been updated/gi, fr: 'L\'abonnement a été mis à jour' },
      { en: /subscription updated/gi, fr: 'Abonnement mis à jour' },
      { en: /subscription expired/gi, fr: 'Abonnement expiré' },
      
      // Goal related
      { en: /you have reached your goal/gi, fr: 'Vous avez atteint votre objectif' },
      { en: /you've reached your goal/gi, fr: 'Vous avez atteint votre objectif' },
      { en: /you have reached/gi, fr: 'Vous avez atteint' },
      { en: /you've reached/gi, fr: 'Vous avez atteint' },
      { en: /goal reached/gi, fr: 'Objectif atteint' },
      
      // Achievement related
      { en: /you have earned/gi, fr: 'Vous avez gagné' },
      { en: /you've earned/gi, fr: 'Vous avez gagné' },
      { en: /achievement unlocked/gi, fr: 'Succès débloqué' },
      
      // General phrases
      { en: /click here to/gi, fr: 'Cliquez ici pour' },
      { en: /tap to/gi, fr: 'Appuyez pour' },
      { en: /view more/gi, fr: 'Voir plus' },
      { en: /see details/gi, fr: 'Voir les détails' },
    ];
    
    // Apply pattern replacements
    patterns.forEach(({ en, fr }) => {
      translated = translated.replace(en, fr);
    });
    
    return translated;
  };

  const togglePreference = (type) => {
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const renderPreferencesModal = () => (
    <Modal
      visible={showPreferencesModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowPreferencesModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setShowPreferencesModal(false)}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Préférences de Notifications</Text>
          
          <View style={styles.preferencesList}>
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#666" />
              </View>
              <Text style={styles.preferenceLabel}>Messages</Text>
              <Switch
                value={preferences.messages}
                onValueChange={() => togglePreference('messages')}
                trackColor={{ false: '#E0E0E0', true: '#4285F4' }}
                thumbColor={preferences.messages ? '#FFFFFF' : '#F4F3F4'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="document-text" size={24} color="#666" />
              </View>
              <Text style={styles.preferenceLabel}>Contenu</Text>
              <Switch
                value={preferences.content}
                onValueChange={() => togglePreference('content')}
                trackColor={{ false: '#E0E0E0', true: '#4285F4' }}
                thumbColor={preferences.content ? '#FFFFFF' : '#F4F3F4'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="card" size={24} color="#666" />
              </View>
              <Text style={styles.preferenceLabel}>Paiements</Text>
              <Switch
                value={preferences.payments}
                onValueChange={() => togglePreference('payments')}
                trackColor={{ false: '#E0E0E0', true: '#4285F4' }}
                thumbColor={preferences.payments ? '#FFFFFF' : '#F4F3F4'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="settings" size={24} color="#666" />
              </View>
              <Text style={styles.preferenceLabel}>Système</Text>
              <Switch
                value={preferences.system}
                onValueChange={() => togglePreference('system')}
                trackColor={{ false: '#E0E0E0', true: '#4285F4' }}
                thumbColor={preferences.system ? '#FFFFFF' : '#F4F3F4'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIcon}>
                <Ionicons name="megaphone" size={24} color="#666" />
              </View>
              <Text style={styles.preferenceLabel}>Marketing</Text>
              <Switch
                value={preferences.marketing}
                onValueChange={() => togglePreference('marketing')}
                trackColor={{ false: '#E0E0E0', true: '#4285F4' }}
                thumbColor={preferences.marketing ? '#FFFFFF' : '#F4F3F4'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          </View>

          <Text style={styles.modalDescription}>
            Ces paramètres contrôlent quels types de notifications vous recevrez.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  /**
   * Handle notification press - navigate to corresponding page
   */
  const handleNotificationPress = (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (!onTabPress) return;

    switch (notification.type) {
      case 'content_assigned':
      case 'session':
        // Navigate to Agenda
        onTabPress('agenda');
        break;
      case 'chat_message':
        // Navigate to Chat
        onTabPress('chat');
        break;
      case 'payment':
        // Navigate to Subscription
        onTabPress('subscription');
        break;
      case 'system':
        // Stay on notifications or navigate to settings
        // For now, stay on notifications
        break;
      default:
        // Unknown type, do nothing
        break;
    }
  };

  const renderNotification = (notification) => {
    const icon = getNotificationIcon(notification.type);
    
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIcon}>
          <Ionicons 
            name={icon.name} 
            size={24} 
            color={icon.color} 
          />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[
              styles.notificationTitle,
              !notification.read && styles.unreadTitle
            ]}>
              {translateNotificationTitle(notification.title)}
            </Text>
            <View style={styles.notificationBadges}>
              <View style={[
                styles.categoryBadge,
                notification.type === 'content_assigned' && styles.contentBadge,
                notification.type === 'system' && styles.systemBadge,
                notification.type === 'chat_message' && styles.messageBadge,
                notification.type === 'session' && styles.sessionBadge,
                notification.type === 'payment' && styles.paymentBadge
              ]}>
                <Text style={styles.categoryText}>
                  {notification.type === 'content_assigned' ? 'Contenu' :
                   notification.type === 'chat_message' ? 'Message' :
                   notification.type === 'session' ? 'Session' :
                   notification.type === 'payment' ? 'Paiement' :
                   notification.type === 'system' ? 'Système' : 'Notification'}
                </Text>
              </View>
              {!notification.read && (
                <View style={styles.newBadge}>
                  <Text style={styles.newText}>Nouveau</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.notificationDescription}>
            {translateNotificationMessage(notification.message || notification.description)}
          </Text>

          <View style={styles.notificationFooter}>
            <Text style={styles.notificationTime}>
              {formatNotificationTime(notification.createdAt)}
            </Text>
            <View style={styles.notificationActions}>
              {!notification.read && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleMarkAsRead(notification.id);
                  }}
                >
                  <Text style={styles.actionText}>Marquer comme lu</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleDelete(notification.id);
                }}
              >
                <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <AppHeader
        title="Notifications"
        onHelpPress={() => {
          if (onTabPress) {
            onTabPress('faq');
          }
        }}
        onNotificationPress={() => {
          // Already on notifications page, do nothing or refresh
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={profileData?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
        showNotificationBadge={false}
      />

      <View style={styles.content}>
        {/* Notifications Header */}
        <View style={styles.notificationsHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.pageSubtitle}>Gérez vos notifications et préférences</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.preferencesButton}
              onPress={() => setShowPreferencesModal(true)}
            >
              <Ionicons name="settings-outline" size={16} color="#666" />
              <Text style={styles.preferencesText}>Préférences</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllText}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              {[
                { id: 'all', title: 'Toutes' },
                { id: 'unread', title: 'Non lues' },
                { id: 'messages', title: 'Messages' },
                { id: 'content', title: 'Contenu' },
                { id: 'payments', title: 'Paiements' },
                { id: 'system', title: 'Système' }
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    selectedTab === tab.id && styles.activeTab
                  ]}
                  onPress={() => setSelectedTab(tab.id)}
                >
                  <Text style={[
                    styles.tabText,
                    selectedTab === tab.id && styles.activeTabText
                  ]}>
                    {tab.title}
                  </Text>
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabCount}>{getTabCount(tab.id)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des notifications...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.notificationsList} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationsContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            onScrollEndDrag={handleLoadMore}
          >
            {getFilteredNotifications().length > 0 ? (
              getFilteredNotifications().map(notification => renderNotification(notification))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-outline" size={64} color="#E0E0E0" />
                <Text style={styles.emptyStateTitle}>Aucune notification</Text>
                <Text style={styles.emptyStateText}>
                  {selectedTab === 'unread' 
                    ? 'Vous n\'avez aucune notification non lue'
                    : selectedTab === 'all'
                    ? 'Vous n\'avez aucune notification'
                    : selectedTab === 'messages'
                    ? 'Aucune notification de type Messages'
                    : selectedTab === 'content'
                    ? 'Aucune notification de type Contenu'
                    : selectedTab === 'payments'
                    ? 'Aucune notification de type Paiements'
                    : selectedTab === 'system'
                    ? 'Aucune notification de type Système'
                    : `Aucune notification de type ${selectedTab}`
                  }
                </Text>
              </View>
            )}
            
            {loading && notifications.length > 0 && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingMoreText}>Chargement...</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
          <Ionicons name="home" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('progress')}>
          <Ionicons name="trending-up-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
          <Ionicons name="restaurant" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Preferences Modal */}
      {renderPreferencesModal()}
      
      {/* Toast */}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  notificationsHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerInfo: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  preferencesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  preferencesText: {
    fontSize: 14,
    color: '#666',
  },
  markAllButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginRight: 6,
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCount: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  notificationBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  contentBadge: {
    backgroundColor: '#E8F5E9',
  },
  systemBadge: {
    backgroundColor: '#E3F2FD',
  },
  categoryText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  newBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  notificationDescription: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  deleteButton: {
    // Additional styling for delete button if needed
  },
  deleteText: {
    color: '#F44336',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  preferencesList: {
    marginTop: 24,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceIcon: {
    width: 40,
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  // New styles for API integration
  unreadNotification: {
    backgroundColor: '#F8F9FF',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  messageBadge: {
    backgroundColor: '#E3F2FD',
  },
  sessionBadge: {
    backgroundColor: '#FFF3E0',
  },
  paymentBadge: {
    backgroundColor: '#FFEBEE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen; 