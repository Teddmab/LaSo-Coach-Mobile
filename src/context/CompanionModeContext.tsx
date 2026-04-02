import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { IOS_COMPANION_MODE } from '../config/featureFlags';

const COMPANION_MODE_OVERRIDE_KEY = '@companion_mode_override';

interface CompanionModeContextType {
  /** True if companion mode is currently active (considering override) */
  isCompanionMode: boolean;
  /** True if companion mode override is enabled (user disabled companion mode) */
  isOverrideEnabled: boolean;
  /** Toggle the companion mode override */
  toggleCompanionMode: () => Promise<void>;
  /** Reset to default companion mode */
  resetCompanionMode: () => Promise<void>;
}

const CompanionModeContext = createContext<CompanionModeContextType | undefined>(undefined);

export const CompanionModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOverrideEnabled, setIsOverrideEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load override state from storage
  useEffect(() => {
    const loadOverrideState = async () => {
      try {
        const stored = await AsyncStorage.getItem(COMPANION_MODE_OVERRIDE_KEY);
        if (stored !== null) {
          setIsOverrideEnabled(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading companion mode override:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverrideState();
  }, []);

  // Calculate if companion mode is active
  // Companion mode is active if:
  // 1. We're on iOS AND
  // 2. IOS_COMPANION_MODE is true AND
  // 3. Override is NOT enabled
  const isCompanionMode = Platform.OS === 'ios' && IOS_COMPANION_MODE && !isOverrideEnabled;

  const toggleCompanionMode = useCallback(async () => {
    try {
      const newValue = !isOverrideEnabled;
      setIsOverrideEnabled(newValue);
      await AsyncStorage.setItem(COMPANION_MODE_OVERRIDE_KEY, JSON.stringify(newValue));
      console.log('🔄 Companion mode override toggled:', newValue ? 'DISABLED' : 'ENABLED');
    } catch (error) {
      console.error('Error toggling companion mode override:', error);
    }
  }, [isOverrideEnabled]);

  const resetCompanionMode = useCallback(async () => {
    try {
      setIsOverrideEnabled(false);
      await AsyncStorage.removeItem(COMPANION_MODE_OVERRIDE_KEY);
      console.log('🔄 Companion mode reset to default');
    } catch (error) {
      console.error('Error resetting companion mode:', error);
    }
  }, []);

  const value: CompanionModeContextType = {
    isCompanionMode,
    isOverrideEnabled,
    toggleCompanionMode,
    resetCompanionMode,
  };

  if (isLoading) {
    // Return a minimal value while loading
    return (
      <CompanionModeContext.Provider
        value={{
          isCompanionMode: Platform.OS === 'ios' && IOS_COMPANION_MODE,
          isOverrideEnabled: false,
          toggleCompanionMode: async () => {},
          resetCompanionMode: async () => {},
        }}
      >
        {children}
      </CompanionModeContext.Provider>
    );
  }

  return <CompanionModeContext.Provider value={value}>{children}</CompanionModeContext.Provider>;
};

export const useCompanionModeContext = (): CompanionModeContextType => {
  const context = useContext(CompanionModeContext);
  if (context === undefined) {
    throw new Error('useCompanionModeContext must be used within a CompanionModeProvider');
  }
  return context;
};

