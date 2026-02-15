/**
 * Système de synchronisation en temps réel pour les mises à jour de profil
 * Utilise un EventEmitter pour notifier les changements de données de profil
 */

import React from 'react';

type ProfileSyncEvent = 'profile-updated' | 'avatar-updated';

type ProfileSyncCallback = (data?: any) => void;

class ProfileSyncEmitter {
  private listeners: Map<ProfileSyncEvent, Set<ProfileSyncCallback>> = new Map();

  /**
   * S'abonner à un événement
   */
  subscribe(event: ProfileSyncEvent, callback: ProfileSyncCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Retourner une fonction de désabonnement
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Émettre un événement
   */
  emit(event: ProfileSyncEvent, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ [ProfileSync] Error in listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Nettoyer tous les listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Instance singleton
export const profileSync = new ProfileSyncEmitter();

/**
 * Hook pour s'abonner aux événements de synchronisation de profil
 */
export const useProfileSync = (
  event: ProfileSyncEvent,
  callback: ProfileSyncCallback,
  deps: React.DependencyList = []
) => {
  const callbackRef = React.useRef(callback);
  
  // Mettre à jour la référence du callback
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  React.useEffect(() => {
    const wrappedCallback = (data?: any) => {
      callbackRef.current(data);
    };
    
    const unsubscribe = profileSync.subscribe(event, wrappedCallback);
    
    return unsubscribe;
  }, [event]);
};

