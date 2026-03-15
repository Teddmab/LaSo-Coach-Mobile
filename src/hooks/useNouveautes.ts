import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/FirebaseAuthContext';
import {
  getNouveautesStorageKey,
  NOUVEAUTES_STEPS,
  NouveautesScreenId,
  NouveauteStep,
} from '../constants/nouveautes';

export interface UseNouveautesOptions {
  /** Si défini, on vérifie et affiche seulement quand cette valeur est true (ex: activeTab === 'home') */
  trigger?: boolean;
  /** Si true, n'afficher que lorsque requireCondition() retourne true (ex: Agora après UGC) */
  requireCondition?: () => boolean | Promise<boolean>;
}

export interface UseNouveautesReturn {
  visible: boolean;
  onComplete: () => void;
  steps: NouveauteStep[];
}

/**
 * Hook pour afficher le bottomsheet Nouveautés une seule fois par utilisateur et par écran.
 */
export function useNouveautes(
  screenId: NouveautesScreenId,
  stepsOverride?: NouveauteStep[],
  options?: UseNouveautesOptions
): UseNouveautesReturn {
  const { user } = useAuth();
  const userId = user?.id || user?.uid || '';
  const [visible, setVisible] = useState(false);
  const [steps] = useState<NouveauteStep[]>(() => {
    if (stepsOverride && stepsOverride.length > 0) return stepsOverride;
    return NOUVEAUTES_STEPS[screenId] || [];
  });

  const checkAndShow = useCallback(async () => {
    if (!userId) return;
    const key = getNouveautesStorageKey(screenId, userId);
    try {
      const alreadyShown = await AsyncStorage.getItem(key);
      if (alreadyShown === 'true') return;
      if (options?.requireCondition) {
        const ok = await Promise.resolve(options.requireCondition());
        if (!ok) return;
      }
      setVisible(true);
    } catch (e) {
      // En cas d'erreur, ne pas bloquer l'app
    }
  }, [screenId, userId, options?.requireCondition]);

  const trigger = options?.trigger ?? true;
  useEffect(() => {
    if (!trigger || !userId) return;
    checkAndShow();
  }, [trigger, userId, checkAndShow]);

  const onComplete = useCallback(async () => {
    if (!userId) {
      setVisible(false);
      return;
    }
    const key = getNouveautesStorageKey(screenId, userId);
    try {
      await AsyncStorage.setItem(key, 'true');
    } catch (_) {}
    setVisible(false);
  }, [screenId, userId]);

  return { visible, onComplete, steps };
}
