import { useState, useEffect, useCallback, useRef } from 'react';
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
 * Évite les réaffichages multiples (race + re-runs) en marquant la clé dès la décision d'afficher.
 */
export function useNouveautes(
  screenId: NouveautesScreenId,
  stepsOverride?: NouveauteStep[],
  options?: UseNouveautesOptions
): UseNouveautesReturn {
  const { user } = useAuth();
  const userId = user?.id || user?.uid || '';
  const [visible, setVisible] = useState(false);
  const hasShownOrClaimedRef = useRef(false);
  const [steps] = useState<NouveauteStep[]>(() => {
    if (stepsOverride && stepsOverride.length > 0) return stepsOverride;
    return NOUVEAUTES_STEPS[screenId] || [];
  });

  const checkAndShow = useCallback(async () => {
    if (!userId) return;
    if (hasShownOrClaimedRef.current) return;
    const key = getNouveautesStorageKey(screenId, userId);
    try {
      const alreadyShown = await AsyncStorage.getItem(key);
      if (alreadyShown === 'true') {
        hasShownOrClaimedRef.current = true;
        return;
      }
      if (options?.requireCondition) {
        const ok = await Promise.resolve(options.requireCondition());
        if (!ok) return;
      }
      hasShownOrClaimedRef.current = true;
      await AsyncStorage.setItem(key, 'true');
      setVisible(true);
    } catch (e) {
      hasShownOrClaimedRef.current = false;
    }
  }, [screenId, userId, options?.requireCondition]);

  const trigger = options?.trigger ?? true;
  useEffect(() => {
    if (!trigger || !userId) return;
    checkAndShow();
  }, [trigger, userId, checkAndShow]);

  const onComplete = useCallback(() => {
    setVisible(false);
  }, []);

  return { visible, onComplete, steps };
}
