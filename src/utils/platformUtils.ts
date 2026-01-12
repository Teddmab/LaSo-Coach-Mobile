import { Platform } from 'react-native';
import { useIOSSimulation } from '../hooks/useIOSSimulation';

/**
 * Hook pour vérifier si on doit se comporter comme iOS
 * (soit vraiment iOS, soit simulation activée sur Android)
 */
export const useIsIOS = () => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  return shouldShowIOSOnly();
};

/**
 * Fonction utilitaire pour vérifier si on doit se comporter comme iOS
 * À utiliser dans les composants qui ne peuvent pas utiliser de hooks
 */
export const isIOSPlatform = (isIOSSimulationEnabled: boolean = false): boolean => {
  return Platform.OS === 'ios' || (Platform.OS === 'android' && isIOSSimulationEnabled);
};

