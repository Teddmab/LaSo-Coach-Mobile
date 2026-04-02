import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

interface AppDataCache {
  dashboardData: any | null;
  subscriptionData: any | null;
  achievementsData: any | null;
  agendaData: any[] | null;
  communityPosts: any[] | null;
  nutritionData: any | null;
  progressData: any | null;
  profileData: any | null;
  rendezvousData: any | null;
  // Timestamps pour savoir quand les données ont été chargées
  lastFetched: {
    dashboardData: number | null;
    subscriptionData: number | null;
    achievementsData: number | null;
    agendaData: number | null;
    communityPosts: number | null;
    nutritionData: number | null;
    progressData: number | null;
    profileData: number | null;
    rendezvousData: number | null;
  };
  // Flags pour savoir si les données sont en cours de chargement
  isLoading: {
    dashboardData: boolean;
    subscriptionData: boolean;
    achievementsData: boolean;
    agendaData: boolean;
    communityPosts: boolean;
    nutritionData: boolean;
    progressData: boolean;
    profileData: boolean;
    rendezvousData: boolean;
  };
}

interface AppDataCacheContextType {
  cache: AppDataCache;
  updateCache: (key: keyof Omit<AppDataCache, 'lastFetched' | 'isLoading'>, data: any) => void;
  getCache: (key: keyof Omit<AppDataCache, 'lastFetched' | 'isLoading'>) => any;
  shouldRefetch: (key: keyof Omit<AppDataCache, 'lastFetched' | 'isLoading'>, maxAge?: number) => boolean;
  setLoading: (key: keyof Omit<AppDataCache, 'lastFetched' | 'isLoading'>, loading: boolean) => void;
  isInitialLoadComplete: boolean;
  setInitialLoadComplete: (complete: boolean) => void;
  clearCache: () => void;
}

const initialCache: AppDataCache = {
  dashboardData: null,
  subscriptionData: null,
  achievementsData: null,
  agendaData: null,
  communityPosts: null,
  nutritionData: null,
  progressData: null,
  profileData: null,
  rendezvousData: null,
  lastFetched: {
    dashboardData: null,
    subscriptionData: null,
    achievementsData: null,
    agendaData: null,
    communityPosts: null,
    nutritionData: null,
    progressData: null,
    profileData: null,
    rendezvousData: null,
  },
  isLoading: {
    dashboardData: false,
    subscriptionData: false,
    achievementsData: false,
    agendaData: false,
    communityPosts: false,
    nutritionData: false,
    progressData: false,
    profileData: false,
    rendezvousData: false,
  },
};

const AppDataCacheContext = createContext<AppDataCacheContextType | undefined>(undefined);

export const AppDataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<AppDataCache>(initialCache);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const initialLoadStartedRef = useRef(false);

  const updateCache = useCallback((key: keyof Omit<AppDataCache, 'lastFetched' | 'isLoading'>, data: any) => {
    setCache(prev => ({
      ...prev,
      [key]: data,
      lastFetched: {
        ...prev.lastFetched,
        [key]: Date.now(),
      },
      isLoading: {
        ...prev.isLoading,
        [key]: false,
      },
    }));
  }, []);

  const getCache = useCallback((key: keyof Omit<AppDataCache, 'lastFetched' | 'isLoading'>) => {
    return cache[key];
  }, [cache]);

  const shouldRefetch = useCallback((key: keyof Omit<AppDataCache, 'lastFetched' | 'isLoading'>, maxAge: number = 5 * 60 * 1000) => {
    // 5 minutes par défaut
    const lastFetched = cache.lastFetched[key];
    if (!lastFetched) return true; // Jamais chargé
    if (cache.isLoading[key]) return false; // Déjà en cours de chargement
    return Date.now() - lastFetched > maxAge; // Trop vieux
  }, [cache]);

  const setLoading = useCallback((key: keyof Omit<AppDataCache, 'lastFetched' | 'isLoading'>, loading: boolean) => {
    setCache(prev => ({
      ...prev,
      isLoading: {
        ...prev.isLoading,
        [key]: loading,
      },
    }));
  }, []);

  const setInitialLoadComplete = useCallback((complete: boolean) => {
    setIsInitialLoadComplete(complete);
  }, []);

  const clearCache = useCallback(() => {
    setCache(initialCache);
    setIsInitialLoadComplete(false);
    initialLoadStartedRef.current = false;
  }, []);

  return (
    <AppDataCacheContext.Provider
      value={{
        cache,
        updateCache,
        getCache,
        shouldRefetch,
        setLoading,
        isInitialLoadComplete,
        setInitialLoadComplete,
        clearCache,
      }}
    >
      {children}
    </AppDataCacheContext.Provider>
  );
};

export const useAppDataCache = () => {
  const context = useContext(AppDataCacheContext);
  if (!context) {
    throw new Error('useAppDataCache must be used within AppDataCacheProvider');
  }
  return context;
};

