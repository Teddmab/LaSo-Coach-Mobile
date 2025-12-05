import { useState, useCallback } from 'react';

export const useDashboardNavigation = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [initialProfileStep, setInitialProfileStep] = useState<number>(1);

  const handleTabPress = useCallback((tabId: string): void => {
    if (tabId === 'more') {
      setShowMoreMenu(true);
      console.log('Tab pressed: more - showing menu');
    } else if (['settings', 'notifications', 'faq', 'chat', 'community', 'agenda', 'profile', 'subscription', 'language', 'notification-settings'].includes(tabId)) {
      // Écrans spéciaux qui ne sont pas des onglets de navigation
      console.log('Screen navigation:', tabId);
      setCurrentScreen(tabId);
    } else {
      // Onglets de navigation principaux
      console.log('Tab pressed:', tabId);
      setActiveTab(tabId);
      setCurrentScreen(tabId);
    }
  }, []);

  const handleMoreMenuItemPress = useCallback((itemId: string): void => {
    const pageNames: Record<string, string> = {
      'chat': 'Chat',
      'notifications': 'Notifications',
      'community': 'Community',
      'agenda': 'Agenda',
      'settings': 'Settings',
    };
    
    const pageName = pageNames[itemId] || itemId;
    console.log('📊 Page Navigation:', pageName);
    
    switch (itemId) {
      case 'chat':
        setCurrentScreen('chat');
        break;
      case 'notifications':
        setCurrentScreen('notifications');
        break;
      case 'community':
        setCurrentScreen('community');
        break;
      case 'agenda':
        setCurrentScreen('agenda');
        break;
      case 'settings':
        setCurrentScreen('settings');
        break;
      default:
        console.log('Unknown menu item:', itemId);
    }
    
    setShowMoreMenu(false);
  }, []);

  const handleMoreMenuClose = useCallback((): void => {
    setShowMoreMenu(false);
  }, []);

  const handleProfileStepPress = useCallback((stepId: number): void => {
    const stepNames: Record<number, string> = {
      1: 'Mon Profile',
      2: 'Mes Objectifs',
      3: 'Recommandations',
      4: 'Rendez-vous',
      5: 'Abonnement',
      6: 'Confirmation',
    };
    
    console.log('📊 Page Navigation:', `Profile - ${stepNames[stepId] || `Step ${stepId}`}`);
    setCurrentScreen('profile');
    setInitialProfileStep(stepId);
  }, []);

  return {
    activeTab,
    currentScreen,
    showMoreMenu,
    initialProfileStep,
    handleTabPress,
    handleMoreMenuItemPress,
    handleMoreMenuClose,
    handleProfileStepPress,
    setCurrentScreen,
    setActiveTab,
  };
};

