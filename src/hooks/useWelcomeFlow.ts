import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/FirebaseAuthContext';

const WELCOME_SHOWN_KEY = '@laso_welcome_shown';
const WELCOME_BOTTOMSHEET_SHOWN_KEY_PREFIX = '@laso_welcome_bottomsheet_shown'; // Préfixe pour la clé spécifique à l'utilisateur
const IS_NEW_USER_KEY = '@laso_is_new_user';
const LAST_LOGIN_SESSION_KEY_PREFIX = '@laso_last_login_session'; // Clé pour tracker la dernière session de connexion

export interface UseWelcomeFlowReturn {
  showWelcomeBottomSheet: boolean;
  isNewUser: boolean;
  handleWelcomeStart: () => void;
  markAsExistingUser: () => void;
}

/**
 * Hook to manage welcome flow (new user vs returning user)
 */
export const useWelcomeFlow = (): UseWelcomeFlowReturn => {
  const { user } = useAuth();
  const [showWelcomeBottomSheet, setShowWelcomeBottomSheet] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Flag pour savoir si WelcomeBottomSheet vient d'être affiché dans cette session
  const welcomeJustShownRef = React.useRef(false);
  
  // Flag pour tracker si c'est la première vérification pour cet utilisateur dans cette session
  // Permet de détecter une nouvelle session de connexion
  const hasCheckedForUserRef = React.useRef<string | null>(null);
  
  // Flag pour éviter les vérifications multiples pendant le chargement
  const isCheckingRef = React.useRef(false);

  // Check if user is new or returning
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      if (!user) {
        // Reset flags quand l'utilisateur se déconnecte
        welcomeJustShownRef.current = false;
        hasCheckedForUserRef.current = null;
        isCheckingRef.current = false;
        return;
      }

      // Éviter les vérifications multiples simultanées
      if (isCheckingRef.current) {
        console.log('⏸️ [useWelcomeFlow] Already checking, skipping...');
        return;
      }

      try {
        isCheckingRef.current = true;
        const userId = user.id || user.uid;
        if (!userId) {
          console.warn('⚠️ [useWelcomeFlow] No user ID available');
          isCheckingRef.current = false;
          return;
        }

        // Vérifier si le bottomsheet de bienvenue a déjà été vu pour CET UTILISATEUR SPÉCIFIQUE
        const welcomeBottomsheetShownKey = `${WELCOME_BOTTOMSHEET_SHOWN_KEY_PREFIX}_${userId}`;
        const welcomeBottomsheetShown = await AsyncStorage.getItem(welcomeBottomsheetShownKey);
        
        // DEBUG: Vérifier toutes les clés welcome dans AsyncStorage
        const allKeys = await AsyncStorage.getAllKeys();
        const welcomeKeys = allKeys.filter(key => key.includes('welcome') || key.includes('laso_welcome'));
        console.log('🔑 [useWelcomeFlow] All welcome keys in AsyncStorage:', welcomeKeys);
        
        // Clé pour tracker la dernière session de connexion
        const lastLoginSessionKey = `${LAST_LOGIN_SESSION_KEY_PREFIX}_${userId}`;
        const lastLoginSession = await AsyncStorage.getItem(lastLoginSessionKey);
        
        // Détecter une nouvelle session de connexion
        // LOGIQUE SIMPLIFIÉE: Si lastLoginSession n'existe pas, c'est une nouvelle session
        // (première connexion ou reconnexion après déconnexion car lastLoginSession est supprimé lors de la déconnexion)
        const now = Date.now();
        const timeSinceLastSession = lastLoginSession ? (now - parseInt(lastLoginSession || '0')) : Infinity;
        
        // NOUVELLE SESSION = lastLoginSession n'existe pas (supprimé lors de la déconnexion)
        // OU si lastLoginSession est très ancien (> 5 minutes) - protection contre les réaffichages rapides
        const isNewSession = !lastLoginSession || timeSinceLastSession > 5 * 60 * 1000;
        
        // Détecter si c'est la première vérification pour cet utilisateur dans cette session
        const isNewLoginSession = hasCheckedForUserRef.current !== userId;
        
        // DEBUG: Vérifier toutes les clés AsyncStorage pour cet utilisateur
        console.log('🔍 [useWelcomeFlow] Checking welcome status:', {
          userId,
          welcomeBottomsheetShownKey,
          welcomeBottomsheetShown,
          welcomeBottomsheetShownIsTrue: welcomeBottomsheetShown === 'true',
          lastLoginSession,
          lastLoginSessionKey,
          isNewSession,
          isNewLoginSession,
          hasCheckedForUserRef: hasCheckedForUserRef.current,
          timeSinceLastSession: lastLoginSession ? `${(timeSinceLastSession / 1000 / 60).toFixed(1)} minutes` : 'N/A'
        });
        
        // Mettre à jour hasCheckedForUserRef APRÈS avoir vérifié isNewLoginSession
        if (isNewLoginSession) {
          console.log('🔄 [useWelcomeFlow] New login session detected', {
            previousUserId: hasCheckedForUserRef.current,
            currentUserId: userId,
            isNewSession,
            lastLoginSession,
            timeSinceLastSession: lastLoginSession ? `${(timeSinceLastSession / 1000 / 60).toFixed(1)} minutes` : 'N/A'
          });
          hasCheckedForUserRef.current = userId;
          welcomeJustShownRef.current = false; // Reset pour la nouvelle session
        }

        // PRIORITÉ 1: Bottomsheet de bienvenue - afficher UNE SEULE FOIS par utilisateur
        // Si ce compte utilisateur n'a jamais vu le bottomsheet de bienvenue, on l'affiche
        // IMPORTANT: Vérifier que welcomeBottomsheetShown est bien 'true' (string), pas null ou undefined
        if (!welcomeBottomsheetShown || welcomeBottomsheetShown !== 'true') {
          console.log('🎉 [useWelcomeFlow] Welcome bottomsheet never shown for this user - showing welcome bottom sheet', {
            userId,
            welcomeBottomsheetShown,
            welcomeBottomsheetShownKey,
            welcomeBottomsheetShownType: typeof welcomeBottomsheetShown,
            isNewLoginSession
          });
          setIsNewUser(true);
          setShowWelcomeBottomSheet(true);
          welcomeJustShownRef.current = true; // Marquer que welcome vient d'être affiché
          // Sauvegarder la session actuelle pour éviter d'afficher welcome back dans la même session
          await AsyncStorage.setItem(lastLoginSessionKey, now.toString());
          return; // Important: ne pas continuer pour éviter d'afficher le bottom sheet de retour
        }

      } catch (error) {
        console.error('❌ [useWelcomeFlow] Error checking welcome status:', error);
      } finally {
        isCheckingRef.current = false;
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
      
      // Vérifier que la clé a bien été sauvegardée
      const verifyKey = await AsyncStorage.getItem(welcomeBottomsheetShownKey);
      console.log('💾 [useWelcomeFlow] Saved welcome bottomsheet key:', {
        key: welcomeBottomsheetShownKey,
        value: verifyKey,
        isTrue: verifyKey === 'true'
      });
      
      // Marquer aussi comme utilisateur existant pour éviter de montrer le welcome à nouveau
      await AsyncStorage.setItem(`${IS_NEW_USER_KEY}_${userId}`, 'false');
      
      // Sauvegarder la session actuelle pour éviter d'afficher welcome back dans la même session
      const lastLoginSessionKey = `${LAST_LOGIN_SESSION_KEY_PREFIX}_${userId}`;
      await AsyncStorage.setItem(lastLoginSessionKey, Date.now().toString());
      
      console.log('✅ [useWelcomeFlow] Welcome bottomsheet shown - marked for user:', { 
        userId,
        welcomeBottomsheetShownKey,
        savedValue: verifyKey
      });
      
      setShowWelcomeBottomSheet(false);
      setIsNewUser(false);
    } catch (error) {
      console.error('❌ [useWelcomeFlow] Error saving welcome status:', error);
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
    isNewUser,
    handleWelcomeStart,
    markAsExistingUser,
  };
};

