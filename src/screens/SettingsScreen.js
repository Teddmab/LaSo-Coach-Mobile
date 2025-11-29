import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';
import Avatar from '../components/Avatar';
import AppHeader from '../components/AppHeader';
import { ProfileApi } from '../services/profileApi';

const SettingsScreen = ({ user, onLogout, onTabPress, activeTab, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    profile: false
  });
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    checkSubscriptionStatus();
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      console.log('👤 Settings: Fetching profile data...');
      const data = await ProfileApi.getProfile();
      setProfileData(data);
      console.log('✅ Settings: Profile data fetched successfully');
    } catch (error) {
      console.error('❌ Settings: Error fetching profile data:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      console.log('💳 Settings: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
    } catch (error) {
      console.error('❌ Settings: Error checking subscription status:', error);
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true
      });
    }
  };

  const handleSubscriptionRenew = () => {
    console.log('🔄 Settings: Navigating to subscription renewal page');
    if (onClose) {
      onClose('profile');
    }
  };

  const settingsItems = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      color: '#4CAF50',
      expandable: true,
      subItems: [
        { id: 'mon-profile', title: 'Mon Profile' },
        { id: 'mes-objectifs', title: 'Mes Objectifs' },
        { id: 'recommandations', title: 'Recommandations' },
        { id: 'rendez-vous', title: 'Rendez-vous' },
        { id: 'confirmation', title: 'Confirmation' }
      ]
    },
    {
      id: 'security',
      title: 'Sécurité & Connexion',
      icon: 'shield-checkmark-outline',
      color: '#4CAF50'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      color: '#4CAF50'
    },
    {
      id: 'language',
      title: 'Langue & Région',
      icon: 'language-outline',
      color: '#4CAF50'
    },
    {
      id: 'subscription',
      title: 'Abonnement & Paiement',
      icon: 'card-outline',
      color: '#4CAF50'
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSettingPress = (itemId) => {
    console.log('Settings item pressed:', itemId);
    
    // Handle expandable sections
    const item = settingsItems.find(setting => setting.id === itemId);
    if (item && item.expandable) {
      toggleSection(itemId);
      return;
    }
    
    // Handle navigation to specific settings screens
    if (itemId === 'profile' && onClose) {
      // Pass profile navigation request up to parent
      onClose(itemId);
    } else if (itemId === 'subscription' && onClose) {
      // Navigate to subscription screen
      onClose('subscription');
    } else if (itemId === 'security' && onClose) {
      // Navigate to security screen
      onClose('security');
    }
  };

  const handleSubItemPress = (subItemId) => {
    console.log('Sub-item pressed:', subItemId);
    // Handle navigation to specific profile sub-screens
    if (onClose) {
      onClose(subItemId);
    }
  };

  const handleLogout = () => {
    console.log('Logout pressed');
    onLogout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <AppHeader
        title="Configurations"
        onHelpPress={() => {
          if (onTabPress) {
            onTabPress('faq');
          }
        }}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={profileData?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

      {/* Subscription Banner */}
      <SubscriptionBanner 
        subscriptionData={subscriptionData}
        onRenew={handleSubscriptionRenew}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Settings Items */}
        <View style={styles.settingsContainer}>
          {settingsItems.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={[
                  styles.settingItem,
                  index === settingsItems.length - 1 && !item.expandable && styles.lastSettingItem
                ]}
                onPress={() => handleSettingPress(item.id)}
              >
                <View style={styles.settingIcon}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Ionicons 
                  name={item.expandable ? 
                    (expandedSections[item.id] ? "chevron-up" : "chevron-down") : 
                    "chevron-forward"
                  } 
                  size={20} 
                  color="#C0C0C0" 
                />
              </TouchableOpacity>
              
              {/* Expandable Sub-items */}
              {item.expandable && expandedSections[item.id] && item.subItems && (
                <View style={styles.subItemsContainer}>
                  {item.subItems.map((subItem, subIndex) => (
                    <TouchableOpacity
                      key={subItem.id}
                      style={[
                        styles.subMenuItem,
                        subIndex === item.subItems.length - 1 && styles.lastSubMenuItem
                      ]}
                      onPress={() => handleSubItemPress(subItem.id)}
                    >
                      <View style={styles.subMenuIcon}>
                        <View style={styles.subMenuDot} />
                      </View>
                      <Text style={styles.subMenuTitle}>{subItem.title}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Logout Section */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={24} color="#F44336" />
            </View>
            <Text style={styles.logoutTitle}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  scrollContent: {
    paddingBottom: 20,
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  subItemsContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  lastSubMenuItem: {
    borderBottomWidth: 0,
  },
  subMenuIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  subMenuDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  subMenuTitle: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
  },
  logoutContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  logoutTitle: {
    fontSize: 16,
    color: '#F44336',
    flex: 1,
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
});

export default SettingsScreen; 