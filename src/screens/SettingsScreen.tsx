import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { theme } from '../constants/theme';
import SubscriptionBanner from '../components/SubscriptionBanner';
import { SettingsScreenProps } from './settings/types';
import { useSettings } from './settings/hooks/useSettings';
import SettingsList from './settings/components/SettingsList';
import LogoutSection from './settings/components/LogoutSection';
import { SETTINGS_ITEMS } from './settings/constants/settingsItems';
import { ScreenContent } from './shared';
import { useIOSSimulation } from '../hooks/useIOSSimulation';
import useCompanionMode from '../hooks/useCompanionMode';
import { IOS_COMPANION_MODE } from '../config/featureFlags';

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
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  const { isCompanionMode } = useCompanionMode();

  // ✅ iOS COMPLIANCE: Filtrer les items liés aux paiements sur iOS (en mode compagnon)
  // Les items "Abonnement & Paiement" et "Sécurité & Connexion" ne doivent pas être visibles sur iOS
  // sauf si le mode companion est désactivé (override)
  const filteredSettingsItems = useMemo(() => {
    // Vérification directe de la plateforme iOS pour garantir le filtrage
    // isCompanionMode est true si : Platform.OS === 'ios' && IOS_COMPANION_MODE && !isOverrideEnabled
    // On filtre aussi directement si on est sur iOS et que IOS_COMPANION_MODE est activé
    const shouldFilter = isCompanionMode || (Platform.OS === 'ios' && IOS_COMPANION_MODE);
    
    if (shouldFilter) {
      const filtered = SETTINGS_ITEMS.filter(item => 
        item.id !== 'subscription' && item.id !== 'security-connection'
      );
      if (__DEV__) {
        console.log('🔒 [SettingsScreen] Filtering subscription and security items (iOS companion mode):', {
          isCompanionMode,
          isIOS,
          platform: Platform.OS,
          IOS_COMPANION_MODE,
          shouldFilter,
          originalCount: SETTINGS_ITEMS.length,
          filteredCount: filtered.length,
          subscriptionItemExists: SETTINGS_ITEMS.some(item => item.id === 'subscription'),
          securityItemExists: SETTINGS_ITEMS.some(item => item.id === 'security-connection'),
        });
      }
      return filtered;
    }
    if (__DEV__) {
      console.log('✅ [SettingsScreen] Showing all settings items (not in companion mode):', {
        isCompanionMode,
        isIOS,
        platform: Platform.OS,
        IOS_COMPANION_MODE,
        itemsCount: SETTINGS_ITEMS.length,
      });
    }
    return SETTINGS_ITEMS;
  }, [isCompanionMode, isIOS]);

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
      // ✅ iOS COMPLIANCE: Bloquer la navigation vers subscription sur iOS (en mode compagnon)
      // Vérification directe de la plateforme iOS pour garantir le blocage
      if (isCompanionMode || (Platform.OS === 'ios' && IOS_COMPANION_MODE)) {
        console.log('🎯 [SettingsScreen] Subscription navigation blocked on iOS (companion mode)');
        return;
      }
      onClose('subscription');
    } else if (itemId === 'security-connection' && onClose) {
      // ✅ iOS COMPLIANCE: Bloquer la navigation vers security-connection sur iOS (en mode compagnon)
      // Vérification directe de la plateforme iOS pour garantir le blocage
      if (isCompanionMode || (Platform.OS === 'ios' && IOS_COMPANION_MODE)) {
        console.log('🎯 [SettingsScreen] Security-connection navigation blocked on iOS (companion mode)');
        return;
      }
      onClose('security-connection');
    } else if (itemId === 'privacy' && onClose) {
      // Privacy section is expandable, handled above
      return;
    } else if (itemId === 'security-connection' && onClose) {
      onClose('security-connection');
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
    // Retiré à la demande de l'utilisateur
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
      />

      <ScreenContent>
        {/* Settings Items */}
        <SettingsList
          items={filteredSettingsItems}
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

