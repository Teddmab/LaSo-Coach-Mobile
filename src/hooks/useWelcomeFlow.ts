import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/FirebaseAuthContext';

const WELCOME_SHOWN_KEY = '@laso_welcome_shown';
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
        // Check if we've already shown welcome for this user
        const welcomeShown = await AsyncStorage.getItem(`${WELCOME_SHOWN_KEY}_${user.id || user.uid}`);
        const isNewUserFlag = await AsyncStorage.getItem(`${IS_NEW_USER_KEY}_${user.id || user.uid}`);

        // Check if account was just created (createdAt is recent - within last 10 minutes)
        const accountCreatedAt = (user as any).createdAt || (user as any).created_at;
        const isRecentlyCreated = accountCreatedAt 
          ? (Date.now() - new Date(accountCreatedAt).getTime()) < 10 * 60 * 1000 // 10 minutes
          : false;

        // PRIORITÉ 1: Nouvel utilisateur - vérifier d'abord si c'est un nouvel utilisateur
        // Si isNewUserFlag est 'true' OU si le compte a été créé récemment (dans les 10 dernières minutes)
        // OU si l'utilisateur a le flag _isNewUser dans l'objet user (venant de Firebase)
        const userIsNewFlag = (user as any)._isNewUser === true;
        const isNewUser = isNewUserFlag === 'true' || isRecentlyCreated || userIsNewFlag;
        
        if (!welcomeShown && isNewUser) {
          console.log('🎉 [useWelcomeFlow] New user detected - showing welcome bottom sheet', {
            isNewUserFlag,
            isRecentlyCreated,
            userIsNewFlag,
            accountCreatedAt,
            userId: user.id || user.uid
          });
          setIsNewUser(true);
          setShowWelcomeBottomSheet(true);
          return; // Important: ne pas continuer pour éviter d'afficher le bottom sheet de retour
        }

        // PRIORITÉ 2: Utilisateur de retour - seulement si on est CERTAIN que ce n'est PAS un nouvel utilisateur
        // Conditions:
        // 1. On n'a pas encore montré le welcome
        // 2. isNewUserFlag est explicitement 'false' (utilisateur existant marqué)
        // 3. OU (isNewUserFlag est null ET le compte n'a PAS été créé récemment) - dans ce cas, c'est probablement un utilisateur de retour
        const isDefinitelyReturningUser = !welcomeShown && 
          (isNewUserFlag === 'false' || (isNewUserFlag === null && !isRecentlyCreated));
        
        if (isDefinitelyReturningUser) {
          console.log('👋 [useWelcomeFlow] Returning user - showing welcome back bottom sheet', {
            isNewUserFlag,
            isRecentlyCreated,
            accountCreatedAt,
            userId: user.id || user.uid
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
      // Mark welcome as shown for this user
      if (user?.id || user?.uid) {
        await AsyncStorage.setItem(`${WELCOME_SHOWN_KEY}_${user.id || user.uid}`, 'true');
        // Marquer aussi comme utilisateur existant pour éviter de montrer le welcome à nouveau
        await AsyncStorage.setItem(`${IS_NEW_USER_KEY}_${user.id || user.uid}`, 'false');
        console.log('✅ [useWelcomeFlow] Welcome shown - user marked as existing:', { userId: user.id || user.uid });
      }
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

