import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/FirebaseAuthContext';

const WELCOME_SHOWN_KEY = '@laso_welcome_shown';
const WELCOME_BOTTOMSHEET_SHOWN_KEY_PREFIX = '@laso_welcome_bottomsheet_shown'; // Préfixe pour la clé spécifique à l'utilisateur
const IS_NEW_USER_KEY = '@laso_is_new_user';

export interface UseWelcomeFlowReturn {
  showWelcomeBottomSheet: boolean;
  showWelcomeBackBottomSheet: boolean;
  isNewUser: boolean;
  handleWelcomeStart: () => void;
  handleWelcomeBackComplete: () => void;
  markAsExistingUser: () => void;
}

/**
 * Hook to manage welcome flow (new user vs returning user)
 */
export const useWelcomeFlow = (): UseWelcomeFlowReturn => {
  const { user } = useAuth();
  const [showWelcomeBottomSheet, setShowWelcomeBottomSheet] = useState(false);
  const [showWelcomeBackBottomSheet, setShowWelcomeBackBottomSheet] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Check if user is new or returning
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      if (!user) return;

      try {
        const userId = user.id || user.uid;
        if (!userId) {
          console.warn('⚠️ [useWelcomeFlow] No user ID available');
          return;
        }

        // Vérifier si le bottomsheet de bienvenue a déjà été vu pour CET UTILISATEUR SPÉCIFIQUE
        const welcomeBottomsheetShownKey = `${WELCOME_BOTTOMSHEET_SHOWN_KEY_PREFIX}_${userId}`;
        const welcomeBottomsheetShown = await AsyncStorage.getItem(welcomeBottomsheetShownKey);
        const welcomeShown = await AsyncStorage.getItem(`${WELCOME_SHOWN_KEY}_${userId}`);
        const isNewUserFlag = await AsyncStorage.getItem(`${IS_NEW_USER_KEY}_${userId}`);

        // Check if account was just created (createdAt is recent - within last 10 minutes)
        const accountCreatedAt = (user as any).createdAt || (user as any).created_at;
        const isRecentlyCreated = accountCreatedAt 
          ? (Date.now() - new Date(accountCreatedAt).getTime()) < 10 * 60 * 1000 // 10 minutes
          : false;

        // PRIORITÉ 1: Bottomsheet de bienvenue - afficher UNE SEULE FOIS par utilisateur
        // Si ce compte utilisateur n'a jamais vu le bottomsheet de bienvenue, on l'affiche
        if (!welcomeBottomsheetShown) {
          console.log('🎉 [useWelcomeFlow] Welcome bottomsheet never shown for this user - showing welcome bottom sheet', {
            userId,
            welcomeBottomsheetShown,
            welcomeBottomsheetShownKey
          });
          setIsNewUser(true);
          setShowWelcomeBottomSheet(true);
          return; // Important: ne pas continuer pour éviter d'afficher le bottom sheet de retour
        }

        // PRIORITÉ 2: Utilisateur de retour - seulement si le bottomsheet de bienvenue a déjà été vu pour cet utilisateur
        // ET si on n'a pas encore montré le welcome back pour cet utilisateur spécifique
        const isDefinitelyReturningUser = !welcomeShown && welcomeBottomsheetShown;
        
        if (isDefinitelyReturningUser) {
          console.log('👋 [useWelcomeFlow] Returning user - showing welcome back bottom sheet', {
            userId,
            isNewUserFlag,
            isRecentlyCreated,
            accountCreatedAt,
            welcomeBottomsheetShown
          });
          setShowWelcomeBackBottomSheet(true);
        }
      } catch (error) {
        console.error('❌ [useWelcomeFlow] Error checking welcome status:', error);
      }
    };

    checkWelcomeStatus();
  }, [user]);

  const handleWelcomeStart = useCallback(async () => {
    try {
      const userId = user?.id || user?.uid;
      if (!userId) {
        console.warn('⚠️ [useWelcomeFlow] No user ID available when saving welcome status');
        return;
      }

      // Marquer le bottomsheet de bienvenue comme vu pour CET UTILISATEUR SPÉCIFIQUE
      const welcomeBottomsheetShownKey = `${WELCOME_BOTTOMSHEET_SHOWN_KEY_PREFIX}_${userId}`;
      await AsyncStorage.setItem(welcomeBottomsheetShownKey, 'true');
      
      // Mark welcome as shown for this user
      await AsyncStorage.setItem(`${WELCOME_SHOWN_KEY}_${userId}`, 'true');
      // Marquer aussi comme utilisateur existant pour éviter de montrer le welcome à nouveau
      await AsyncStorage.setItem(`${IS_NEW_USER_KEY}_${userId}`, 'false');
      console.log('✅ [useWelcomeFlow] Welcome bottomsheet shown - marked for user:', { 
        userId,
        welcomeBottomsheetShownKey
      });
      
      setShowWelcomeBottomSheet(false);
      setIsNewUser(false);
    } catch (error) {
      console.error('❌ [useWelcomeFlow] Error saving welcome status:', error);
    }
  }, [user]);

  const handleWelcomeBackComplete = useCallback(async () => {
    try {
      // Mark welcome back as shown for this user
      if (user?.id || user?.uid) {
        await AsyncStorage.setItem(`${WELCOME_SHOWN_KEY}_${user.id || user.uid}`, 'true');
      }
      setShowWelcomeBackBottomSheet(false);
    } catch (error) {
      console.error('❌ [useWelcomeFlow] Error saving welcome back status:', error);
    }
  }, [user]);

  const markAsExistingUser = useCallback(async () => {
    try {
      if (user?.id || user?.uid) {
        await AsyncStorage.setItem(`${IS_NEW_USER_KEY}_${user.id || user.uid}`, 'false');
      }
      setIsNewUser(false);
    } catch (error) {
      console.error('❌ [useWelcomeFlow] Error marking as existing user:', error);
    }
  }, [user]);

  return {
    showWelcomeBottomSheet,
    showWelcomeBackBottomSheet,
    isNewUser,
    handleWelcomeStart,
    handleWelcomeBackComplete,
    markAsExistingUser,
  };
};

