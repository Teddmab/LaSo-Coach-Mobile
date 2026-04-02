import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IOS_SIMULATION_KEY = 'ios_simulation_enabled';

interface IOSSimulationContextType {
  isIOSSimulationEnabled: boolean;
  toggleIOSSimulation: () => void;
  shouldShowAndroidOnly: () => boolean;
  shouldShowIOSOnly: () => boolean;
  getSimulatedPlatform: () => 'ios' | 'android';
}

const IOSSimulationContext = createContext<IOSSimulationContextType | undefined>(undefined);

export const IOSSimulationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isIOSSimulationEnabled, setIsIOSSimulationEnabled] = useState<boolean>(false);

  // Charger l'état depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadSimulationState = async () => {
      try {
        const saved = await AsyncStorage.getItem(IOS_SIMULATION_KEY);
        if (saved !== null) {
          setIsIOSSimulationEnabled(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'état de simulation iOS:', error);
      }
    };

    loadSimulationState();
  }, []);

  // Toggle la simulation iOS
  const toggleIOSSimulation = useCallback(async () => {
    const newValue = !isIOSSimulationEnabled;
    setIsIOSSimulationEnabled(newValue);
    try {
      await AsyncStorage.setItem(IOS_SIMULATION_KEY, JSON.stringify(newValue));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état de simulation iOS:', error);
    }
  }, [isIOSSimulationEnabled]);

  const getSimulatedPlatform = useCallback((): 'ios' | 'android' => {
    if (Platform.OS === 'android' && isIOSSimulationEnabled) {
      return 'ios';
    }
    return Platform.OS;
  }, [isIOSSimulationEnabled]);

  const shouldShowAndroidOnly = useCallback((): boolean => {
    return Platform.OS === 'android' && !isIOSSimulationEnabled;
  }, [isIOSSimulationEnabled]);

  const shouldShowIOSOnly = useCallback((): boolean => {
    return Platform.OS === 'ios' || (Platform.OS === 'android' && isIOSSimulationEnabled);
  }, [isIOSSimulationEnabled]);

  // Toujours rendre le Provider, même si pas encore prêt
  // Les valeurs par défaut permettront au hook de fonctionner
  return (
    <IOSSimulationContext.Provider
      value={{
        isIOSSimulationEnabled,
        toggleIOSSimulation,
        shouldShowAndroidOnly,
        shouldShowIOSOnly,
        getSimulatedPlatform,
      }}
    >
      {children}
    </IOSSimulationContext.Provider>
  );
};

export const useIOSSimulation = (): IOSSimulationContextType => {
  const context = useContext(IOSSimulationContext);
  if (context === undefined) {
    throw new Error('useIOSSimulation must be used within an IOSSimulationProvider');
  }
  return context;
};

