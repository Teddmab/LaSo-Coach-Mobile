import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { NotificationsScreenProps, NotificationTab } from './notifications/types';
import { useNotificationsScreen } from './notifications/hooks/useNotificationsScreen';
import NotificationTabs from './notifications/components/NotificationTabs';
import NotificationItem from './notifications/components/NotificationItem';
import NotificationEmptyState from './notifications/components/NotificationEmptyState';
import NotificationPreferencesModal from './notifications/components/NotificationPreferencesModal';
import { Shimmer } from '../components/Shimmer';

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  user,
  onTabPress,
  activeTab,
}) => {
  const [selectedTab, setSelectedTab] = useState<NotificationTab>('all');
  
  const {
    notifications,
    loading,
    refreshing,
    profileData,
    pagination,
    showPreferencesModal,
    preferences,
    setShowPreferencesModal,
    togglePreference,
    markNotificationAsRead,
    markAllAsRead,
    handleDelete,
    getTabCount,
    handleRefresh,
    handleLoadMore,
  } = useNotificationsScreen(selectedTab);

  const handleNotificationPress = (notification: any): void => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    if (!onTabPress) return;

    switch (notification.type) {
      case 'content_assigned':
      case 'session':
        onTabPress('agenda');
        break;
      case 'chat_message':
        onTabPress('chat');
        break;
      case 'payment':
        onTabPress('subscription');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.subtitle}>Gérez vos notifications et préférences</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.preferencesButton}
              onPress={() => setShowPreferencesModal(true)}
            >
              <Ionicons name="settings-outline" size={16} color="#666" />
              <Text style={styles.preferencesText}>Préférences</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <NotificationTabs
          selectedTab={selectedTab}
          onTabSelect={setSelectedTab}
          getTabCount={getTabCount}
        />

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3, 4, 5].map((index) => (
              <View key={index} style={styles.notificationShimmerCard}>
                <Shimmer width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Shimmer width="70%" height={16} style={{ marginBottom: 8 }} />
                  <Shimmer width="100%" height={14} style={{ marginBottom: 6 }} />
                  <Shimmer width="60%" height={12} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
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
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onPress={() => handleNotificationPress(notification)}
                  onMarkAsRead={() => markNotificationAsRead(notification.id)}
                  onDelete={() => handleDelete(notification.id)}
                />
              ))
            ) : (
              <NotificationEmptyState selectedTab={selectedTab} />
            )}
            
            {loading && notifications.length > 0 && (
              <View style={styles.loadingMore}>
                {[1, 2].map((index) => (
                  <View key={index} style={styles.notificationShimmerCard}>
                    <Shimmer width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Shimmer width="70%" height={16} style={{ marginBottom: 8 }} />
                      <Shimmer width="100%" height={14} style={{ marginBottom: 6 }} />
                      <Shimmer width="60%" height={12} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        visible={showPreferencesModal}
        preferences={preferences}
        onClose={() => setShowPreferencesModal(false)}
        onTogglePreference={togglePreference}
      />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerInfo: {
    marginBottom: 12,
  },
  subtitle: {
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    gap: 6,
  },
  preferencesText: {
    fontSize: 14,
    color: '#666',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Espace pour la navigation fixe
  },
  loadingContainer: {
    flex: 1,
    padding: 16,
  },
  notificationShimmerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
});

export default NotificationsScreen;

