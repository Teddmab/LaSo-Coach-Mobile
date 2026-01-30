import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import useCompanionMode from '../../../hooks/useCompanionMode';

export const useDashboardNavigation = (navigateOverlay?: (screenName: string, params?: any) => void) => {
  const isCompanionMode = useCompanionMode();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [previousScreen, setPreviousScreen] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [initialProfileStep, setInitialProfileStep] = useState<number>(1);

  const handleTabPress = useCallback((tabId: string): void => {
    if (tabId === 'more') {
      setShowMoreMenu(true);
      console.log('Tab pressed: more - showing menu');
    } else if (['settings', 'notifications', 'faq', 'chat', 'community', 'agenda', 'profile', 'subscription', 'language', 'notification-settings'].includes(tabId)) {
      // ✅ iOS COMPLIANCE: Block subscription navigation on iOS (unless companion mode is enabled)
      if (tabId === 'subscription' && isCompanionMode) {
        console.log('🎯 [useDashboardNavigation] Subscription navigation blocked on iOS');
        return;
      }
      // Écrans spéciaux qui ne sont pas des onglets de navigation - utiliser Stack Navigator
      console.log('Screen navigation:', tabId);
      const routeMap: Record<string, string> = {
        'settings': 'Settings',
        'notifications': 'Notifications',
        'faq': 'FAQ',
        'chat': 'Chat',
        'community': 'Community',
        'agenda': 'Agenda',
        'profile': 'Profile',
        'subscription': 'Subscription',
        'language': 'Language',
        'notification-settings': 'NotificationSettings',
      };
      const routeName = routeMap[tabId];
      if (routeName && navigateOverlay) {
        navigateOverlay(routeName as any);
      }
      setCurrentScreen(tabId);
    } else {
      // Onglets de navigation principaux
      console.log('Tab pressed:', tabId);
      setActiveTab(tabId);
      setCurrentScreen((prevScreen) => {
        // Store previous screen before navigating
        if (prevScreen !== tabId && prevScreen !== 'home') {
          setPreviousScreen(prevScreen);
        }
        return tabId;
      });
    }
  }, [navigateOverlay]);

  const handleMoreMenuItemPress = useCallback((itemId: string): void => {
    const routeMap: Record<string, string> = {
      'chat': 'Chat',
      'notifications': 'Notifications',
      'community': 'Community',
      'agenda': 'Agenda',
      'settings': 'Settings',
    };
    
    const routeName = routeMap[itemId];
    console.log('📊 Page Navigation:', routeName || itemId);
    
    if (routeName && navigateOverlay) {
      navigateOverlay(routeName as any);
      const screenMap: Record<string, string> = {
        'Chat': 'chat',
        'Notifications': 'notifications',
        'Community': 'community',
        'Agenda': 'agenda',
        'Settings': 'settings',
      };
      setCurrentScreen(screenMap[routeName] || itemId);
    }
    
    setShowMoreMenu(false);
  }, [navigateOverlay]);

  const handleMoreMenuClose = useCallback((): void => {
    setShowMoreMenu(false);
  }, []);

  const handleProfileStepPress = useCallback((stepId: number): void => {
    const stepNames: Record<number, string> = {
      1: 'Mon profil',
      2: 'Mes Objectifs',
      3: 'Recommandations',
      4: 'Rendez-vous',
      5: 'Abonnement',
      6: 'Confirmation',
    };
    
    console.log('📊 Page Navigation:', `Profile - ${stepNames[stepId] || `Step ${stepId}`}`);
    setCurrentScreen((prevScreen) => {
      // Store previous screen before navigating to profile
      if (prevScreen !== 'profile' && prevScreen !== 'home') {
        setPreviousScreen(prevScreen);
      }
      return 'profile';
    });
    setInitialProfileStep(stepId);
  }, []);

  const setCurrentScreenWithPrevious = useCallback((screen: string): void => {
    setCurrentScreen((prevScreen) => {
      // Store previous screen before navigating (unless we're already on that screen or going to home)
      if (prevScreen !== screen && prevScreen !== 'home' && screen !== 'home') {
        setPreviousScreen(prevScreen);
      }
      return screen;
    });
  }, []);

  return {
    activeTab,
    currentScreen,
    previousScreen,
    showMoreMenu,
    initialProfileStep,
    handleTabPress,
    handleMoreMenuItemPress,
    handleMoreMenuClose,
    handleProfileStepPress,
    setCurrentScreen: setCurrentScreenWithPrevious,
    setActiveTab,
  };
};

