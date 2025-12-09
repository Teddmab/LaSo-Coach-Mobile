import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { SettingsScreenProps } from './settings/types';
import { useSettings } from './settings/hooks/useSettings';
import SettingsList from './settings/components/SettingsList';
import LogoutSection from './settings/components/LogoutSection';
import { SETTINGS_ITEMS } from './settings/constants/settingsItems';
import { ScreenContent } from './shared';

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  onLogout,
  onTabPress,
  activeTab,
  onClose,
}) => {
  const {
    expandedSections,
    subscriptionData,
    profileData,
    toggleSection,
  } = useSettings();

  const handleSettingPress = (itemId: string): void => {

    // Handle expandable sections
    const item = SETTINGS_ITEMS.find(setting => setting.id === itemId);
    if (item && item.expandable) {
      toggleSection(itemId);
      return;
    }

    // Handle navigation to specific settings screens
    if (itemId === 'profile' && onClose) {
      onClose(itemId);
    } else if (itemId === 'subscription' && onClose) {
      onClose('subscription');
    } else if (itemId === 'security' && onClose) {
      onClose('security');
    } else if (itemId === 'language' && onClose) {
      onClose('language');
    } else if (itemId === 'notifications' && onClose) {
      onClose('notifications');
    } else if (itemId === 'contact-support' && onClose) {
      onClose('contact-support');
    } else if (itemId === 'about' && onClose) {
      onClose('about');
    }
  };

  const handleSubItemPress = (subItemId: string): void => {
    if (onClose) {
      onClose(subItemId);
    }
  };

  const handleSubscriptionRenew = (): void => {
    if (onClose) {
      onClose('profile');
    }
  };

  const handleLogout = (): void => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
      {/* Subscription Banner */}
      <SubscriptionBanner
        subscriptionData={subscriptionData}
        onRenew={handleSubscriptionRenew}
      />

      <ScreenContent>
        {/* Settings Items */}
        <SettingsList
          items={SETTINGS_ITEMS}
          expandedSections={expandedSections}
          onItemPress={handleSettingPress}
          onSubItemPress={handleSubItemPress}
        />

        {/* Logout Section */}
        <LogoutSection onLogout={handleLogout} />
      </ScreenContent>

    </>
  );
};

const styles = StyleSheet.create({
  // Styles moved to components
});

export default SettingsScreen;

