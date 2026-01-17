import React, { useEffect, useState, useCallback } from 'react';
import { DashboardOverlayStackParamList } from '../../../types/navigation';
import FixedLayout from '../../../components/FixedLayout';
import SettingsScreen from '../../SettingsScreen';
import ProfileScreen from '../../ProfileScreen';
import FAQScreen from '../../FAQScreen';
import NotificationsScreen from '../../NotificationsScreen';
import AgendaScreen from '../../AgendaScreen';
import CommunityScreen from '../../CommunityScreen';
import ChatScreen from '../../ChatScreen';
import SecurityScreen from '../../SecurityScreen';
import AccountSettingsScreen from '../../AccountSettingsScreen';
import LanguageScreen from '../../settings/LanguageScreen';
import NotificationSettingsScreen from '../../settings/NotificationSettingsScreen';
import WebViewScreen from '../../WebViewScreen';
import ContactSupportScreen from '../../ContactSupportScreen';
import AboutScreen from '../../AboutScreen';
import TermsAndPoliciesScreen from '../../TermsAndPoliciesScreen';
import MoreMenu from '../../../components/MoreMenu';

interface DashboardOverlayStackProps {
  user: any;
  activeTab: string;
  showMoreMenu: boolean;
  avatarData: { avatarSource: any; avatarFallbackText: string };
  initialProfileStep: number;
  webViewSource: string;
  selectedPostId: string | null;
  onLogout: () => void;
  onTabPress: (tabId: string) => void;
  onMoreMenuClose: () => void;
  onMoreMenuItemPress: (itemId: string) => void;
  onProfileStepPress: (stepId: number) => void;
  onRefresh: () => void;
  onPostPress: (post: any) => void;
  setWebViewSource: (source: string) => void;
  navigation: any;
  overlayNavigationRef?: React.MutableRefObject<{
    navigate: (name: keyof DashboardOverlayStackParamList, params?: any) => void;
    goBack: () => void;
    canGoBack: () => boolean;
  } | null>;
  initialRouteName?: keyof DashboardOverlayStackParamList;
}

export const DashboardOverlayStack: React.FC<DashboardOverlayStackProps> = ({
  user,
  activeTab,
  showMoreMenu,
  avatarData,
  initialProfileStep,
  webViewSource,
  selectedPostId,
  onLogout,
  onTabPress,
  onMoreMenuClose,
  onMoreMenuItemPress,
  onProfileStepPress,
  onRefresh,
  onPostPress,
  setWebViewSource,
  navigation,
  overlayNavigationRef,
  initialRouteName = 'Home',
}) => {
  // Navigation stack state - simule une pile de navigation
  const [navigationStack, setNavigationStack] = useState<Array<{
    name: keyof DashboardOverlayStackParamList;
    params?: any;
  }>>([{ name: initialRouteName }]);

  // Current screen
  const currentScreen = navigationStack[navigationStack.length - 1]?.name || initialRouteName;
  const currentParams = navigationStack[navigationStack.length - 1]?.params;

  // Navigation methods
  const navigate = useCallback((name: keyof DashboardOverlayStackParamList, params?: any) => {
    setNavigationStack(prev => [...prev, { name, params }]);
  }, []);

  const goBack = useCallback(() => {
    setNavigationStack(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  const canGoBack = useCallback(() => {
    return navigationStack.length > 1;
  }, [navigationStack.length]);

  // Expose navigation methods to parent via ref
  useEffect(() => {
    if (overlayNavigationRef) {
      overlayNavigationRef.current = {
        navigate,
        goBack,
        canGoBack,
      };
    }
    return () => {
      if (overlayNavigationRef) {
        overlayNavigationRef.current = null;
      }
    };
  }, [overlayNavigationRef, navigate, goBack, canGoBack]);

  // Update stack when initialRouteName changes (only on mount or when route changes from Home)
  useEffect(() => {
    if (initialRouteName && initialRouteName !== 'Home') {
      setNavigationStack(prev => {
        // Only update if we're currently on Home
        if (prev.length === 1 && prev[0].name === 'Home') {
          return [{ name: initialRouteName }];
        }
        return prev;
      });
    }
  }, [initialRouteName]);

  // Helper function to render screen based on current screen name
  const renderScreen = () => {
    const stackNavigation = {
      navigate,
      goBack,
      canGoBack,
    };

    switch (currentScreen) {
      case 'Home':
        return null;

      case 'Settings':
        return (
          <FixedLayout
            headerTitle="Configurations"
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => stackNavigation.navigate('FAQ')}
            onNotificationPress={() => stackNavigation.navigate('Notifications')}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          >
            <SettingsScreen
              user={user}
              onLogout={onLogout}
              onTabPress={onTabPress}
              activeTab={activeTab}
              onClose={(target?: string) => {
                if (target === 'profile' || target === 'mon-profile') {
                  stackNavigation.navigate('Profile', { initialStep: 1, activeTab: 'profile' });
                } else if (target === 'informations') {
                  stackNavigation.navigate('Profile', { initialStep: 1, activeTab: 'informations' });
                } else if (target === 'rendez-vous') {
                  stackNavigation.navigate('Profile', { initialStep: 1, activeTab: 'rendezvous' });
                } else if (target === 'autre-infos') {
                  stackNavigation.navigate('Profile', { initialStep: 1, activeTab: 'other' });
                } else if (target === 'subscription') {
                  stackNavigation.navigate('Subscription');
                } else if (target === 'security') {
                  stackNavigation.navigate('Security');
                } else if (target === 'language') {
                  stackNavigation.navigate('Language');
                } else if (target === 'notifications') {
                  stackNavigation.navigate('NotificationSettings');
                } else if (target === 'privacy-policy') {
                  setWebViewSource('settings');
                  stackNavigation.navigate('PrivacyPolicy', { source: 'settings' });
                } else if (target === 'terms-of-service') {
                  setWebViewSource('settings');
                  stackNavigation.navigate('TermsOfService', { source: 'settings' });
                } else if (target === 'platform-rules') {
                  setWebViewSource('settings');
                  stackNavigation.navigate('PlatformRules', { source: 'settings' });
                } else if (target === 'contact-support') {
                  stackNavigation.navigate('ContactSupport');
                } else if (target === 'about') {
                  stackNavigation.navigate('About');
                } else {
                  stackNavigation.navigate('Home');
                }
              }}
            />
          </FixedLayout>
        );

      case 'Profile': {
        const step = currentParams?.initialStep || initialProfileStep;
        const getProfileHeaderTitle = () => {
          switch (step) {
            case 1: return 'Profil';
            case 2: return 'Objectifs';
            case 3: return 'Recommandations';
            case 4: return 'Rendez-vous';
            case 5:
            case 6: return 'Abonnement';
            default: return 'Profil';
          }
        };

        return (
          <FixedLayout
            headerTitle={getProfileHeaderTitle()}
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => stackNavigation.navigate('FAQ')}
            onNotificationPress={() => stackNavigation.navigate('Notifications')}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          >
            <ProfileScreen
              user={user}
              onLogout={onLogout}
              onTabPress={onTabPress}
              activeTab={activeTab}
              onClose={(target?: string) => {
                if (target === 'home') {
                  onRefresh();
                  stackNavigation.navigate('Home');
                } else {
                  stackNavigation.navigate('Settings');
                }
              }}
              initialStep={step}
              onFAQPress={() => stackNavigation.navigate('FAQ')}
              navigation={navigation}
              onStepCompleted={onRefresh}
              activeProfileTab={currentParams?.activeTab || 'profile'}
            />
          </FixedLayout>
        );
      }

      case 'FAQ':
        return (
          <FixedLayout
            headerTitle="FAQ"
            showLogo={false}
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => {}}
            onNotificationPress={() => stackNavigation.navigate('Notifications')}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          >
            <FAQScreen
              onClose={() => stackNavigation.goBack()}
              user={user}
              onTabPress={onTabPress}
            />
          </FixedLayout>
        );

      case 'Notifications':
        return (
          <FixedLayout
            headerTitle="Notifications"
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => stackNavigation.navigate('FAQ')}
            onNotificationPress={() => {}}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
            showNotificationBadge={false}
          >
            <NotificationsScreen
              user={user}
              onLogout={onLogout}
              onTabPress={onTabPress}
              activeTab={activeTab}
              onClose={() => stackNavigation.goBack()}
            />
          </FixedLayout>
        );

      case 'Agenda':
        return (
          <FixedLayout
            headerTitle="Agenda"
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => stackNavigation.navigate('FAQ')}
            onNotificationPress={() => stackNavigation.navigate('Notifications')}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          >
            <AgendaScreen
              user={user}
              onLogout={onLogout}
              onTabPress={onTabPress}
              activeTab={activeTab}
              onClose={() => stackNavigation.goBack()}
            />
          </FixedLayout>
        );

      case 'Community':
        return (
          <FixedLayout
            headerTitle="L'Agora"
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => stackNavigation.navigate('FAQ')}
            onNotificationPress={() => stackNavigation.navigate('Notifications')}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          >
            <CommunityScreen
              user={user}
              onTabPress={onTabPress}
              activeTab={activeTab}
              selectedPostId={selectedPostId}
              onPostPress={onPostPress}
            />
          </FixedLayout>
        );

      case 'Chat':
        return (
          <FixedLayout
            headerTitle="Espace de message"
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => stackNavigation.navigate('FAQ')}
            onNotificationPress={() => stackNavigation.navigate('Notifications')}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          >
            <ChatScreen
              user={user}
              onLogout={onLogout}
              onTabPress={onTabPress}
              activeTab={activeTab}
              onClose={() => stackNavigation.goBack()}
            />
          </FixedLayout>
        );

      case 'Security':
        return (
          <AccountSettingsScreen
            onClose={() => stackNavigation.goBack()}
            activeTab={activeTab}
            onTabPress={onTabPress}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          />
        );

      case 'SecurityPolicies':
        return (
          <SecurityScreen
            onClose={() => stackNavigation.goBack()}
            activeTab={activeTab}
            onTabPress={onTabPress}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
            onLinkPress={(linkId) => {
              setWebViewSource('security');
              if (linkId === 'privacy-policy') {
                stackNavigation.navigate('PrivacyPolicy', { source: 'security' });
              } else if (linkId === 'terms-of-service') {
                stackNavigation.navigate('TermsOfService', { source: 'security' });
              } else if (linkId === 'platform-rules') {
                stackNavigation.navigate('PlatformRules', { source: 'security' });
              }
            }}
          />
        );

      case 'Language':
        return (
          <FixedLayout
            headerTitle="Langue & Région"
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => stackNavigation.navigate('FAQ')}
            onNotificationPress={() => stackNavigation.navigate('Notifications')}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          >
            <LanguageScreen
              onClose={() => stackNavigation.goBack()}
              onTabPress={onTabPress}
              activeTab={activeTab}
            />
          </FixedLayout>
        );

      case 'NotificationSettings':
        return (
          <FixedLayout
            headerTitle="P. Notification"
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => stackNavigation.navigate('FAQ')}
            onNotificationPress={() => stackNavigation.navigate('Notifications')}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          >
            <NotificationSettingsScreen
              onClose={() => stackNavigation.goBack()}
              onTabPress={onTabPress}
              activeTab={activeTab}
            />
          </FixedLayout>
        );

      case 'PrivacyPolicy':
        return (
          <WebViewScreen
            url="https://lasocoach.com/privacy-policy"
            title="Politique de Confidentialité"
            onClose={() => stackNavigation.goBack()}
          />
        );

      case 'TermsOfService':
        return (
          <WebViewScreen
            url="https://lasocoach.com/terms-of-service"
            title="Conditions d'Utilisation"
            onClose={() => stackNavigation.goBack()}
          />
        );

      case 'PlatformRules':
        return (
          <WebViewScreen
            url="https://lasocoach.com/platform-rules"
            title="Règles de la Plateforme"
            onClose={() => stackNavigation.goBack()}
          />
        );

      case 'ContactSupport':
        return (
          <ContactSupportScreen
            onClose={() => stackNavigation.goBack()}
            onTabPress={onTabPress}
            activeTab={activeTab}
          />
        );

      case 'About':
        return (
          <AboutScreen
            onClose={() => stackNavigation.goBack()}
            onTabPress={onTabPress}
            activeTab={activeTab}
          />
        );

      case 'TermsAndPolicies':
        return (
          <FixedLayout
            headerTitle="Termes & Politiques"
            activeTab={activeTab}
            onTabPress={onTabPress}
            onHelpPress={() => stackNavigation.navigate('FAQ')}
            onNotificationPress={() => stackNavigation.navigate('Notifications')}
            onProfilePress={() => stackNavigation.navigate('Settings')}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
          >
            <TermsAndPoliciesScreen
              onClose={() => stackNavigation.goBack()}
            />
          </FixedLayout>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderScreen()}
      <MoreMenu
        visible={showMoreMenu}
        onClose={onMoreMenuClose}
        onMenuItemPress={onMoreMenuItemPress}
      />
    </>
  );
};
