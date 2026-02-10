import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import useCompanionMode from '../hooks/useCompanionMode';
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
  const { isCompanionMode } = useCompanionMode();
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
        // ✅ iOS COMPLIANCE: Block subscription navigation on iOS (unless companion mode is enabled)
        if (isCompanionMode) {
          console.log('🎯 [NotificationsScreen] Subscription navigation blocked on iOS');
          return;
        }
        onTabPress('subscription');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <View style={styles.content}>
        {/* ✅ Header modernisé - Une seule ligne avec les deux boutons */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.preferencesIconButton}
            onPress={() => setShowPreferencesModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={22} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.markAllButton} 
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" />
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
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
    backgroundColor: '#F8F9FA',
  },
  // ✅ Header modernisé - Une seule ligne avec les deux boutons
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  preferencesIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    gap: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  markAllText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
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

