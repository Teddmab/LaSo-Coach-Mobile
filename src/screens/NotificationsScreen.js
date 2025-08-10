import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

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

  const notifications = [
    {
      id: 1,
      type: 'content',
      title: 'Nouveau Contenu Assigné',
      description: 'Vous avez été assigné(e) au contenu "an other test content" à compléter.',
      time: 'il y a 5 jours • 13/07/2025 à 20:39',
      isRead: false,
      category: 'Contenu',
      isNew: true
    },
    {
      id: 2,
      type: 'content',
      title: 'Nouveau Contenu Assigné',
      description: 'Vous avez été assigné(e) au contenu "test content" à compléter.',
      time: 'il y a 5 jours • 13/07/2025 à 20:08',
      isRead: false,
      category: 'Contenu',
      isNew: true
    },
    {
      id: 3,
      type: 'system',
      title: 'Challenge Completed!',
      description: 'Congratulations! You have completed the "Test Challenge" challenge!',
      time: 'il y a 5 jours • 13/07/2025 à 20:04',
      isRead: false,
      category: 'Système',
      isNew: true
    },
    {
      id: 4,
      type: 'system',
      title: 'Challenge Assigned',
      description: 'New challenge has been assigned to you.',
      time: 'il y a 5 jours • 13/07/2025 à 20:02',
      isRead: false,
      category: 'Système',
      isNew: true
    }
  ];

  const getTabCount = (tabType) => {
    switch (tabType) {
      case 'all':
        return 7;
      case 'unread':
        return 4;
      case 'messages':
        return 0;
      case 'content':
        return 2;
      case 'payments':
        return 0;
      case 'system':
        return 5;
      default:
        return 0;
    }
  };

  const getFilteredNotifications = () => {
    switch (selectedTab) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'content':
        return notifications.filter(n => n.type === 'content');
      case 'system':
        return notifications.filter(n => n.type === 'system');
      case 'messages':
        return notifications.filter(n => n.type === 'messages');
      case 'payments':
        return notifications.filter(n => n.type === 'payments');
      default:
        return notifications;
    }
  };

  const handleMarkAsRead = (notificationId) => {
    console.log('Mark as read:', notificationId);
  };

  const handleDelete = (notificationId) => {
    console.log('Delete notification:', notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('Mark all as read');
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

  const renderNotification = (notification) => (
    <View key={notification.id} style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <Ionicons 
          name="information-circle" 
          size={24} 
          color="#2196F3" 
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <View style={styles.notificationBadges}>
            <View style={[
              styles.categoryBadge,
              notification.type === 'content' && styles.contentBadge,
              notification.type === 'system' && styles.systemBadge
            ]}>
              <Text style={styles.categoryText}>{notification.category}</Text>
            </View>
            {notification.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newText}>Nouveau</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.notificationDescription}>
          {notification.description}
        </Text>

        <View style={styles.notificationFooter}>
          <Text style={styles.notificationTime}>{notification.time}</Text>
          <View style={styles.notificationActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleMarkAsRead(notification.id)}
            >
              <Text style={styles.actionText}>Marquer comme lu</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(notification.id)}
            >
              <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => onTabPress ? onTabPress('settings') : null}>
            <Image 
              source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} 
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

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
        <ScrollView 
          style={styles.notificationsList} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notificationsContent}
        >
          {getFilteredNotifications().map(notification => renderNotification(notification))}
        </ScrollView>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpButton: {
    padding: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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
});

export default NotificationsScreen; 