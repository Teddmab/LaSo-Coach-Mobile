import { useState, useEffect, useCallback, useRef } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Platform } from 'react-native';
import SubscriptionApi from '../../../services/subscriptionApi';
import SubscriptionService from '../../../services/subscriptionService';
import { Plan, SubscriptionData, Invoice } from '../types';
import Toast from 'react-native-toast-message';

export const useSubscriptionScreen = (
  navigation?: NavigationProp<any>,
  refreshProfile?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const pendingPlanRef = useRef<Plan | null>(null);

  // ✅ Utiliser une ref pour éviter les appels multiples simultanés
  const isLoadingPlansRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  
  const loadPlans = useCallback(async (subscriptionStatus?: SubscriptionData | null) => {
    // Éviter les appels multiples simultanés
    if (isLoadingPlansRef.current) {
      console.log('⏸️ [loadPlans] Chargement déjà en cours, ignoré');
      return;
    }
    
    isLoadingPlansRef.current = true;
    try {
      console.log('🔄 [loadPlans] Début du chargement des plans...');
      const plansData = await SubscriptionApi.getPlans();
      console.log('📥 [loadPlans] Plans reçus du backend:', {
        plansCount: plansData?.length || 0,
        plans: plansData?.map((p: Plan) => ({ id: p.id, name: p.name, price: p.price })),
      });
      
      let filteredPlans = plansData || [];
      
      // ✅ ANDROID: Filtrer SEULEMENT le free plan si l'essai gratuit a expiré ou a déjà été utilisé
      if (Platform.OS === 'android' && plansData && plansData.length > 0) {
        // Utiliser le statut passé en paramètre ou celui actuel
        const statusToUse = subscriptionStatus !== undefined ? subscriptionStatus : currentSubscription;
        const subscriptionStatusToCheck = statusToUse || await SubscriptionService.getSubscriptionStatus();
        console.log('📊 [loadPlans] Statut de l\'abonnement:', {
          hasCurrentSubscription: !!currentSubscription,
          subscriptionStatus: subscriptionStatusToCheck?.status,
          isExpired: subscriptionStatusToCheck?.isExpired,
          currentPlan: subscriptionStatusToCheck?.subscription?.plan?.name,
        });
        
        // Vérifier si l'utilisateur a déjà utilisé l'essai gratuit
        let hasUsedTrial = false;
        try {
          const history = await SubscriptionApi.getHistory();
          if (history?.success && history?.data && Array.isArray(history.data) && history.data.length > 0) {
            // Vérifier si l'utilisateur a déjà eu un plan gratuit dans l'historique qui est expiré
            hasUsedTrial = history.data.some((sub: any) => {
              const isFreePlan = sub.plan?.price === 0 || 
                                 sub.plan?.isFree || 
                                 sub.plan?.name?.toLowerCase().includes('free');
              const isExpired = sub.status === 'EXPIRED' || sub.status === 'CANCELLED';
              return isFreePlan && isExpired;
            });
            console.log('📜 [loadPlans] Historique vérifié:', {
              hasUsedTrial,
              historyCount: history.data.length,
            });
          }
        } catch (error) {
          console.error('Error loading subscription history:', error);
          // Si on ne peut pas récupérer l'historique, on vérifie le statut actuel
          // Mais on doit être plus strict : seulement si le plan actuel est gratuit ET expiré
          if (subscriptionStatusToCheck?.subscription?.plan) {
            const currentPlan = subscriptionStatusToCheck.subscription.plan;
            const isCurrentPlanFree = currentPlan.price === 0 || 
                                      currentPlan.isFree || 
                                      currentPlan.name?.toLowerCase().includes('free');
            const isCurrentPlanExpired = subscriptionStatusToCheck?.isExpired && 
                                        subscriptionStatusToCheck?.subscription?.status !== 'ACTIVE' &&
                                        subscriptionStatusToCheck?.status !== 'ACTIVE';
            hasUsedTrial = isCurrentPlanFree && isCurrentPlanExpired;
            console.log('📊 [loadPlans] Vérification depuis statut actuel:', {
              hasUsedTrial,
              isCurrentPlanFree,
              isCurrentPlanExpired,
            });
          }
        }
        
        // Vérifier si l'essai gratuit actuel est expiré
        const isTrialExpired = subscriptionStatusToCheck?.isExpired && 
                               subscriptionStatusToCheck?.subscription?.status !== 'ACTIVE' &&
                               subscriptionStatusToCheck?.status !== 'ACTIVE';
        
        // Si l'utilisateur a déjà utilisé l'essai gratuit et qu'il est expiré, ne pas afficher SEULEMENT le free plan
        // Mais on doit s'assurer qu'on a bien détecté l'utilisation de l'essai gratuit
        if (hasUsedTrial && isTrialExpired) {
          console.log('🚫 [ANDROID] Filtrage du free plan - essai gratuit utilisé et expiré');
          const beforeFilterCount = filteredPlans.length;
          filteredPlans = filteredPlans.filter((plan: Plan) => {
            const isFreePlan = plan.price === 0 || 
                              plan.isFree || 
                              plan.name?.toLowerCase().includes('free');
            // Ne garder que les plans payants
            return !isFreePlan;
          });
          console.log('✅ [ANDROID] Plans après filtrage:', {
            totalPlans: plansData?.length || 0,
            beforeFilter: beforeFilterCount,
            filteredPlans: filteredPlans.length,
            filteredPlanNames: filteredPlans.map((p: Plan) => p.name),
          });
        } else {
          console.log('✅ [ANDROID] Affichage de tous les plans (y compris free plan):', {
            hasUsedTrial,
            isTrialExpired,
            totalPlans: plansData?.length || 0,
            subscriptionStatus: subscriptionStatusToCheck?.status,
            subscriptionExpired: subscriptionStatusToCheck?.isExpired,
          });
        }
      }
      
      // S'assurer qu'on a au moins un plan à afficher
      if (filteredPlans.length === 0 && plansData && plansData.length > 0) {
        console.warn('⚠️ [ANDROID] Aucun plan après filtrage, affichage de tous les plans');
        filteredPlans = plansData;
      }
      
      console.log('✅ [loadPlans] Plans finaux à afficher:', {
        count: filteredPlans.length,
        plans: filteredPlans.map((p: Plan) => ({ id: p.id, name: p.name, price: p.price })),
      });
      
      setPlans(filteredPlans);
    } catch (error) {
      console.error('❌ [loadPlans] Error loading plans:', error);
      // En cas d'erreur, essayer de charger les plans quand même
      try {
        const plansData = await SubscriptionApi.getPlans();
        console.log('🔄 [loadPlans] Fallback - Plans reçus:', plansData?.length || 0);
        setPlans(plansData || []);
      } catch (fallbackError) {
        console.error('❌ [loadPlans] Error loading plans (fallback):', fallbackError);
        setPlans([]);
      }
    } finally {
      isLoadingPlansRef.current = false;
    }
  }, []); // ✅ Pas de dépendances car on passe subscriptionStatus en paramètre

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const status = await SubscriptionService.getSubscriptionStatus();
      setCurrentSubscription(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setCurrentSubscription(null);
    }
  }, []);

  // ✅ Chargement initial : charger le statut puis les plans
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Charger d'abord le statut de l'abonnement pour pouvoir filtrer les plans
        const status = await SubscriptionService.getSubscriptionStatus();
        if (isMounted) {
          setCurrentSubscription(status);
          // Charger les plans avec le statut récupéré
          await loadPlans(status);
        }
      } catch (error) {
        console.error('Error loading subscription data:', error);
        if (isMounted) {
          // Même en cas d'erreur, essayer de charger les plans
          await loadPlans(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          // Marquer le chargement initial comme terminé
          isInitialLoadRef.current = false;
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []); // ✅ Chargement unique au montage

  // ✅ Recharger les plans seulement quand currentSubscription change (après le chargement initial)
  useEffect(() => {
    // Ignorer le premier changement (qui vient du chargement initial)
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }
    
    // Ne recharger que si on n'est pas en train de charger et que currentSubscription a vraiment changé
    if (!loading && currentSubscription !== null && !isLoadingPlansRef.current) {
      loadPlans(currentSubscription);
    }
  }, [currentSubscription, loading]); // ✅ Dépendances nécessaires

  const handlePlanSelect = useCallback((plan: Plan) => {
    console.log('🔄 [SubscriptionScreen] Plan selected:', plan?.id, plan?.name);
    // Stocker le plan dans une ref pour éviter les problèmes de timing
    pendingPlanRef.current = plan;
    // Mettre à jour les deux états en même temps
    setSelectedPlan(plan);
    setShowPaymentFlow(true);
    console.log('🔄 [SubscriptionScreen] States updated - showPaymentFlow: true, selectedPlan:', plan?.id);
  }, []);

  const handlePaymentSuccess = useCallback(async (paymentData: any) => {
    try {
      console.log('✅ [SubscriptionScreen] Payment success callback, refreshing data...');
      setShowPaymentFlow(false);
      setSelectedPlan(null);
      
      // ✅ Rafraîchir le profil pour mettre à jour les données d'abonnement
      if (refreshProfile) {
        console.log('🔄 [SubscriptionScreen] Refreshing profile...');
        await refreshProfile();
      }
      
      // ✅ Recharger le statut d'abonnement pour mettre à jour les pages bloquées
      console.log('🔄 [SubscriptionScreen] Reloading subscription status...');
      await loadSubscriptionStatus();
      
      // ✅ Recharger les plans pour mettre à jour la liste
      console.log('🔄 [SubscriptionScreen] Reloading plans...');
      const status = await SubscriptionService.getSubscriptionStatus();
      await loadPlans(status);
      
      // Ne pas afficher de toast ici pour les plans gratuits (déjà affiché dans le flow)
      // Seulement pour les plans payants
      if (paymentData?.paymentMethod !== 'free') {
        Toast.show({
          type: 'success',
          text1: 'Paiement réussi',
          text2: 'Votre abonnement a été activé avec succès.',
        });
      }
      
      console.log('✅ [SubscriptionScreen] Data refreshed successfully');
    } catch (error) {
      console.error('❌ [SubscriptionScreen] Error after payment success:', error);
    }
  }, [refreshProfile, loadSubscriptionStatus, loadPlans]);

  const handlePaymentError = useCallback((error: any) => {
    setShowPaymentFlow(false);
    setSelectedPlan(null);
    
    Toast.show({
      type: 'error',
      text1: 'Erreur de paiement',
      text2: error?.message || 'Une erreur est survenue lors du paiement.',
    });
  }, []);

  const handleViewInvoices = useCallback(async () => {
    setShowInvoiceModal(true);
    setLoadingInvoices(true);
    
    try {
      // Load invoices from API
      const response = await SubscriptionApi.getHistory();
      if (response?.success && response?.data) {
        setInvoices(response.data);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const isPlanClickable = useCallback((plan: Plan) => {
    if (!currentSubscription) return true;
    const currentPlanId = currentSubscription.subscription?.plan?.id;
    return plan.id !== currentPlanId;
  }, [currentSubscription]);

  return {
    loading,
    plans,
    currentSubscription,
    selectedPlan,
    showInvoiceModal,
    invoices,
    loadingInvoices,
    profileData,
    showPaymentFlow,
    setShowInvoiceModal,
    setShowPaymentFlow,
    setSelectedPlan,
    handlePlanSelect,
    handlePaymentSuccess,
    handlePaymentError,
    handleViewInvoices,
    isPlanClickable,
  };
};

