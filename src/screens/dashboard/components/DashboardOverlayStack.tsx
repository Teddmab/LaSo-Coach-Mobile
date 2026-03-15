import React, { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { DashboardOverlayStackParamList } from '../../../types/navigation';
import useCompanionMode from '../../../hooks/useCompanionMode';
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
// ✅ iOS COMPLIANCE: SubscriptionScreen only on Android
import SubscriptionScreen from '../../SubscriptionScreen';

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
  /** Réouvrir l’accueil et afficher le tutoriel guidé (depuis Paramètres > Revoir le tutoriel) */
  onRequestShowHomeTour?: () => void;
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
  onRequestShowHomeTour,
}) => {
  const { isCompanionMode } = useCompanionMode();
  // Navigation stack state - simule une pile de navigation
  // La pile commence toujours avec 'Home' pour permettre le retour
  const [navigationStack, setNavigationStack] = useState<Array<{
    name: keyof DashboardOverlayStackParamList;
    params?: any;
  }>>(() => {
    // Si initialRouteName est 'Home', on commence avec juste Home
    // Sinon, on commence avec Home puis l'écran initial
    if (initialRouteName === 'Home') {
      return [{ name: 'Home' }];
    }
    return [{ name: 'Home' }, { name: initialRouteName }];
  });

  // Current screen
  const currentScreen = navigationStack[navigationStack.length - 1]?.name || initialRouteName;
  const currentParams = navigationStack[navigationStack.length - 1]?.params;

  // Navigation methods
  const navigate = useCallback((name: keyof DashboardOverlayStackParamList, params?: any) => {
    setNavigationStack(prev => {
      // Ne pas ajouter si c'est déjà l'écran actuel
      if (prev.length > 0 && prev[prev.length - 1].name === name) {
        return prev;
      }
      return [...prev, { name, params }];
    });
  }, []);

  const goBack = useCallback(() => {
    setNavigationStack(prev => {
      if (prev.length > 1) {
        const newStack = prev.slice(0, -1);
        const previousScreen = newStack[newStack.length - 1];
        
        // Si on revient à Home, fermer l'overlay et retourner au Dashboard principal
        if (previousScreen.name === 'Home') {
          // Appeler onTabPress('home') pour fermer l'overlay immédiatement
          setTimeout(() => {
            if (onTabPress) {
              onTabPress('home');
            }
          }, 0);
          // Retourner la nouvelle pile pour mettre à jour l'état
          return newStack;
        }
        
        return newStack;
      }
      // Si on est déjà sur Home, fermer l'overlay
      if (onTabPress) {
        setTimeout(() => {
          onTabPress('home');
        }, 0);
      }
      return prev;
    });
  }, [onTabPress]);

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

  // Update stack when initialRouteName changes (quand on navigue depuis Home vers un autre écran)
  useEffect(() => {
    if (initialRouteName && initialRouteName !== 'Home') {
      setNavigationStack(prev => {
        // Si la pile ne contient que Home, on ajoute le nouvel écran
        if (prev.length === 1 && prev[0].name === 'Home') {
          return [{ name: 'Home' }, { name: initialRouteName }];
        }
        // Si on est déjà sur l'écran initial, on ne change rien
        if (prev.length > 0 && prev[prev.length - 1].name === initialRouteName) {
          return prev;
        }
        // Sinon, on garde la pile actuelle
        return prev;
      });
    } else if (initialRouteName === 'Home') {
      // Si on revient à Home, on réinitialise la pile avec juste Home
      setNavigationStack([{ name: 'Home' }]);
    }
  }, [initialRouteName]);

  // Effect to close overlay when returning to Home
  useEffect(() => {
    // Si on est sur Home et qu'il n'y a qu'un élément dans la pile, fermer l'overlay
    // Cela se produit quand on revient à Home depuis un autre écran
    if (currentScreen === 'Home' && navigationStack.length === 1) {
      // Utiliser un petit délai pour éviter les conflits avec les mises à jour d'état
      const timer = setTimeout(() => {
        if (onTabPress) {
          onTabPress('home');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, navigationStack.length, onTabPress]);

  // Helper function to render screen based on current screen name
  const renderScreen = () => {
    const stackNavigation = {
      navigate,
      goBack,
      canGoBack,
    };

    switch (currentScreen) {
      case 'Home':
        // Ne pas rendre null, mais fermer l'overlay via l'effet ci-dessus
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
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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
                } else if (target === 'subscription') {
                  // ✅ iOS COMPLIANCE: Block subscription navigation on iOS (unless companion mode is enabled)
                  if (isCompanionMode) {
                    console.log('🎯 [DashboardOverlayStack] Subscription navigation blocked on iOS');
                    stackNavigation.navigate('Home');
                  } else {
                    stackNavigation.navigate('Subscription');
                  }
                } else if (target === 'security-connection') {
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
                } else if (target === 'replay-tour') {
                  onRequestShowHomeTour?.();
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
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
          >
            <ChatScreen
              user={user}
              onLogout={onLogout}
              onTabPress={onTabPress}
              activeTab={activeTab}
              onClose={() => stackNavigation.goBack()}
              onFAQPress={() => stackNavigation.navigate('FAQ')}
            />
          </FixedLayout>
        );

      case 'Security':
        return (
          <SecurityScreen
            onClose={() => stackNavigation.goBack()}
            activeTab={activeTab}
            onTabPress={onTabPress}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
            onLogout={onLogout}
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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
            url="https://lasocoach.com/politique-de-confidentialite"
            title="Politique de Confidentialité"
            onClose={() => stackNavigation.goBack()}
            activeTab={activeTab}
            onTabPress={onTabPress}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
          />
        );

      case 'TermsOfService':
        return (
          <WebViewScreen
            url="https://lasocoach.com/termes-de-service"
            title="Conditions d'Utilisation"
            onClose={() => stackNavigation.goBack()}
            activeTab={activeTab}
            onTabPress={onTabPress}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
          />
        );

      case 'PlatformRules':
        return (
          <WebViewScreen
            url="https://lasocoach.com/regles-de-plateforme"
            title="Règles de la Plateforme"
            onClose={() => stackNavigation.goBack()}
            activeTab={activeTab}
            onTabPress={onTabPress}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
          />
        );

      case 'ContactSupport':
        return (
          <ContactSupportScreen
            onClose={() => stackNavigation.goBack()}
            onTabPress={onTabPress}
            activeTab={activeTab}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
            user={user}
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
          />
        );

      case 'About':
        return (
          <AboutScreen
            onClose={() => stackNavigation.goBack()}
            onTabPress={onTabPress}
            activeTab={activeTab}
            avatarSource={avatarData.avatarSource}
            avatarFallbackText={avatarData.avatarFallbackText}
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
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

      case 'Subscription':
        // ✅ iOS COMPLIANCE: Block Subscription screen on iOS (unless companion mode is enabled)
        if (isCompanionMode) {
          console.log('🎯 [DashboardOverlayStack] Subscription screen blocked on iOS - redirecting to Home');
          // Redirect to Home by navigating back or to Home
          if (stackNavigation.canGoBack()) {
            stackNavigation.goBack();
          } else {
            stackNavigation.navigate('Home');
          }
          return null; // Return null to prevent rendering
        }
        return (
          <SubscriptionScreen
            onRefresh={onRefresh} // ✅ Passer onRefresh pour rafraîchir le dashboard après activation
            navigation={navigation}
            onClose={() => stackNavigation.goBack()}
            onTabPress={onTabPress}
            activeTab={activeTab}
            showBackButton={stackNavigation.canGoBack()}
            onBackPress={stackNavigation.goBack}
          />
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
