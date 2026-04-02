/**
 * Système de synchronisation en temps réel entre DashboardScreen et NutritionScreen
 * Utilise un EventEmitter pour notifier les changements de données nutrition
 */

import React from 'react';

type NutritionSyncEvent = 'meal-completed' | 'data-refreshed' | 'completion-status-updated';

type NutritionSyncCallback = (data?: any) => void;

class NutritionSyncEmitter {
  private listeners: Map<NutritionSyncEvent, Set<NutritionSyncCallback>> = new Map();

  /**
   * S'abonner à un événement
   */
  subscribe(event: NutritionSyncEvent, callback: NutritionSyncCallback): () => void {
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
  emit(event: NutritionSyncEvent, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ [NutritionSync] Error in listener for ${event}:`, error);
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
export const nutritionSync = new NutritionSyncEmitter();

/**
 * Hook pour s'abonner aux événements de synchronisation nutrition
 */
export const useNutritionSync = (
  event: NutritionSyncEvent,
  callback: NutritionSyncCallback,
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
    
    const unsubscribe = nutritionSync.subscribe(event, wrappedCallback);
    
    return unsubscribe;
  }, [event]);
};

