import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import SubscriptionApi from '../services/subscriptionApi';
import { theme } from '../constants/theme';
import { 
  MOBILE_MONEY_COUNTRIES,
  getCountryByCode,
  getProviderNames,
  validatePhoneNumber,
  formatPhoneNumber,
  type MobileMoneyCountry 
} from '../config/mobileMoneyConfig';
import MobileMoneyPaymentForm, { MobileMoneyPaymentData } from './MobileMoneyPaymentForm';
import * as mobileMoneyApi from '../services/mobileMoneyApi';
import { usePaymentTracking } from '../context/PaymentContext';
import useCompanionMode from '../hooks/useCompanionMode';
import api from '../services/api';

// PawaPay countries configuration (same as web)
const PAWAPAY_COUNTRIES = [
  {
    code: 'COD',
    label: 'Congo (RDC)',
    prefix: '+243',
    currency: 'CDF',
    providers: [
      { code: 'AIRTEL_COD', label: 'Airtel Money' },
      { code: 'ORANGE_COD', label: 'Orange Money' },
      { code: 'VODACOM_MPESA_COD', label: 'Vodacom M-Pesa' },
    ],
  },
];

/**
 * SubscriptionPaymentFlow - Composant de paiement étape par étape pour mobile
 * 
 * Étapes :
 * 1. Sélection du moyen de paiement (Stripe/PayPal)
 * 2. Saisie des informations de paiement
 * 3. Confirmation et traitement
 * 4. Résultat (succès/erreur)
 */
export default function SubscriptionPaymentFlow({
  visible,
  plan,
  onClose,
  onSuccess,
  onError,
  isEmbedded = false, // Si true, ne pas afficher de Modal (intégré dans bottom sheet)
}) {
  const styles = createStyles(theme);
  // Stripe SDK removed - payments handled server-side via mobile money or web
  const paymentTracking = usePaymentTracking();
  const { isCompanionMode, companionMessage } = useCompanionMode();

  // États du flux
  const [currentStep, setCurrentStep] = useState(0); // 0: informations paiement, 1: formulaire mobile money, 2: confirmation, 3: traitement, 4: résultat
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mobile'); // Toujours 'mobile' pour Android
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(null);

  // États pour Stripe (saisie carte)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [stripeSessionId, setStripeSessionId] = useState(null);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState(null);
  const [showStripeWebView, setShowStripeWebView] = useState(false);

  // États pour PayPal
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [paypalApprovalUrl, setPaypalApprovalUrl] = useState(null);
  const [paypalPayerId, setPaypalPayerId] = useState(null);
  const [showPayPalWebView, setShowPayPalWebView] = useState(false);

  // États pour Mobile Money
  const [mobileMoneyCountry, setMobileMoneyCountry] = useState<string>(PAWAPAY_COUNTRIES[0]?.code || 'COD');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<string>(PAWAPAY_COUNTRIES[0]?.providers[0]?.code || '');
  const [mobileMoneyPhonePrefix, setMobileMoneyPhonePrefix] = useState<string>(PAWAPAY_COUNTRIES[0]?.prefix || '+243');
  const [mobileMoneyPhoneNumber, setMobileMoneyPhoneNumber] = useState<string>('');
  const [mobileMoneyCurrency, setMobileMoneyCurrency] = useState<string>('USD');
  const [mobileMoneyDepositId, setMobileMoneyDepositId] = useState<string | null>(null);
  const [mobileMoneyFormattedPhone, setMobileMoneyFormattedPhone] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState<boolean>(false);
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState<boolean>(false);
  const [showProviderPicker, setShowProviderPicker] = useState<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Détecter si on est sur Android
  const isAndroid = Platform.OS === 'android';

  // Réinitialiser les états quand le modal s'ouvre
  useEffect(() => {
    if (visible && plan) {
      // Plan data available
      resetFlow();
      // Calculer la date de début de l'abonnement (immédiatement)
      const startDate = new Date();
      setSubscriptionStartDate(startDate);
    } else if (visible && !plan) {
    } else if (!visible) {
      // Quand le modal se ferme, nettoyer le polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setProcessing(false);
    }
  }, [visible, plan]);

  const resetFlow = () => {
    // Nettoyer le polling si actif
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setCurrentStep(0); // Commencer à l'étape 0 (informations paiement)
    setSelectedPaymentMethod('mobile'); // Toujours mobile money
    setProcessing(false);
    setError(null);
    setSuccess(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardholderName('');
    setStripeSessionId(null);
    setStripeClientSecret(null);
    setStripeCheckoutUrl(null);
    setShowStripeWebView(false);
    setPaypalOrderId(null);
    setPaypalApprovalUrl(null);
    setPaypalPayerId(null);
    setShowPayPalWebView(false);
    // Reset mobile money states
    setMobileMoneyCountry(PAWAPAY_COUNTRIES[0]?.code || 'COD');
    setMobileMoneyProvider(PAWAPAY_COUNTRIES[0]?.providers[0]?.code || '');
    setMobileMoneyPhonePrefix(PAWAPAY_COUNTRIES[0]?.prefix || '+243');
    setMobileMoneyPhoneNumber('');
    setMobileMoneyCurrency('USD');
    setMobileMoneyDepositId(null);
    setExchangeRate(null);
    setShowCountryPicker(false);
    setShowCurrencyPicker(false);
  };

  /**
   * Récupérer le taux de change USD vers CDF depuis l'API
   */
  const fetchExchangeRate = async (): Promise<number> => {
    try {
      setLoadingExchangeRate(true);
      // Essayer de récupérer le taux depuis l'API
      // Si l'API n'existe pas encore, utiliser le taux fixe comme fallback
      const response = await api.get('/payments/exchange-rate');
      if (response?.data?.success && response?.data?.data?.rate) {
        const rate = parseFloat(response.data.data.rate);
        if (!isNaN(rate) && rate > 0) {
          setExchangeRate(rate);
          return rate;
        }
      }
      // Fallback: taux fixe 2300 CDF = 1 USD
      const fallbackRate = 2300;
      setExchangeRate(fallbackRate);
      return fallbackRate;
    } catch (error) {
      console.warn('[Exchange Rate] API non disponible, utilisation du taux fixe:', error);
      // Fallback: taux fixe 2300 CDF = 1 USD
      const fallbackRate = 2300;
      setExchangeRate(fallbackRate);
      return fallbackRate;
    } finally {
      setLoadingExchangeRate(false);
    }
  };

  // Charger le taux de change quand la devise change vers CDF
  useEffect(() => {
    if (mobileMoneyCurrency === 'CDF' && plan) {
      fetchExchangeRate();
    } else {
      setExchangeRate(null);
    }
  }, [mobileMoneyCurrency, plan]);

  // Mettre à jour le préfixe quand le pays change
  useEffect(() => {
    const selectedCountry = PAWAPAY_COUNTRIES.find(c => c.code === mobileMoneyCountry);
    if (selectedCountry) {
      setMobileMoneyPhonePrefix(selectedCountry.prefix);
      // Réinitialiser le provider au premier du pays
      const countryProviders = selectedCountry.providers || [];
      setMobileMoneyProvider(countryProviders[0]?.code || '');
    }
  }, [mobileMoneyCountry]);

  /**
   * Vérifier si le plan est gratuit
   */
  const isFreePlan = plan && (plan.price === 0 || plan.isFree || plan.name?.toLowerCase().includes('free'));

  /**
   * Étape 0 : Informations de paiement
   * Pour les plans gratuits : activation directe
   * Pour les plans payants : passer à l'étape 1 (formulaire mobile money)
   */
  const handleConfirmSubscription = async () => {
    if (!plan?.id) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Plan d\'abonnement invalide',
      });
      return;
    }

    // Pour les plans payants : passer directement au formulaire mobile money
    if (!isFreePlan) {
      setCurrentStep(1); // Passer à l'étape 1 (formulaire mobile money)
      return;
    }

    // Pour les plans gratuits : activation directe
    try {
      setProcessing(true);
      
      const subscriptionData = await SubscriptionApi.activateFreeTrial(plan.id);
      
      setSuccess(true);
      setCurrentStep(4); // Étape 4 = résultat (au lieu de 3)
      
      if (onSuccess) {
        onSuccess({
          planId: plan.id,
          paymentMethod: 'free',
          subscription: subscriptionData,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'activation de l\'abonnement gratuit';
      setError(errorMessage);
      setCurrentStep(3); // Étape 3 = résultat (au lieu de 4)
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Étape 1 : Sélection du moyen de paiement
   */
  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    // Ne pas créer la session ici, attendre le clic sur "Continuer"
  };

  const handleContinueFromMethodSelection = async () => {
    if (!plan?.id) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Plan d\'abonnement invalide',
      });
      return;
    }
    
    // Pour Stripe, créer la session et ouvrir directement la webview
    if (selectedPaymentMethod === 'stripe') {
      try {
        setProcessing(true);
        
        const sessionData = {
          subscriptionPlanId: plan.id,
          clientType: 'mobile',
        };

        const checkoutData = await SubscriptionApi.createStripeCheckoutSession(sessionData);
        
        
        // Si le backend retourne une URL, ouvrir directement la webview
        if (checkoutData?.url || checkoutData?.checkoutUrl) {
          const stripeUrl = checkoutData.url || checkoutData.checkoutUrl;
          setStripeCheckoutUrl(stripeUrl);
          setShowStripeWebView(true);
          // Passer à l'étape 2 qui affichera la webview
          setCurrentStep(2);
          return;
        }
        
        // Si le backend retourne sessionId/clientSecret, utiliser le SDK natif (CardField)
        if (checkoutData?.sessionId && checkoutData?.clientSecret) {
          setStripeSessionId(checkoutData.sessionId);
          setStripeClientSecret(checkoutData.clientSecret);
          setCurrentStep(2); // Passer à l'étape 2 qui affichera le CardField
          return;
        }
        
        // Si ni URL ni sessionId/clientSecret, erreur
        throw new Error('Réponse Stripe invalide: URL ou sessionId/clientSecret requis');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la session de paiement';
        setError(errorMessage);
        setCurrentStep(3);
      } finally {
        setProcessing(false);
      }
    } else if (selectedPaymentMethod === 'paypal') {
      // Pour PayPal, créer la commande et ouvrir la webview
      try {
        setProcessing(true);
        
        const orderData = {
          subscriptionPlanId: plan.id,
          clientType: 'mobile',
        };

        const paypalData = await SubscriptionApi.createPayPalOrder(orderData);
        
        
        // Pour PayPal, le backend doit retourner orderId ET approvalUrl pour la webview
        if (paypalData?.orderId && paypalData?.approvalUrl) {
          setPaypalOrderId(paypalData.orderId);
          setPaypalApprovalUrl(paypalData.approvalUrl);
          
          // Afficher la webview PayPal
          setShowPayPalWebView(true);
          setCurrentStep(2);
        } else if (paypalData?.orderId) {
          // Si seulement orderId, on continue sans webview (ancien flow)
          setPaypalOrderId(paypalData.orderId);
          setCurrentStep(2);
        } else {
          throw new Error('Réponse PayPal invalide: orderId et approvalUrl requis');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la commande PayPal';
        setError(errorMessage);
        setCurrentStep(3);
      } finally {
        setProcessing(false);
      }
    } else if (selectedPaymentMethod === 'mobile') {
      // Pour Mobile Money, passer à l'étape 1 (formulaire de paiement mobile)
      setCurrentStep(1);
    } else {
      // Par défaut, passer à l'étape 1
      setCurrentStep(1);
    }
  };

  /**
   * Gestionnaire de paiement Mobile Money (PawaPay)
   * Étape 1 : Saisie des informations
   */
  const handleMobileMoneyInfoSubmit = (paymentData: {
    country: string;
    provider: string;
    phoneNumber: string;
    currency: string;
  }) => {
    setMobileMoneyCountry(paymentData.country);
    setMobileMoneyProvider(paymentData.provider);
    setMobileMoneyPhoneNumber(paymentData.phoneNumber);
    setMobileMoneyCurrency(paymentData.currency);
    
    // Nettoyer et formater le numéro pour l'affichage dans la confirmation
    const country = PAWAPAY_COUNTRIES.find(c => c.code === paymentData.country);
    let rawPhone = paymentData.phoneNumber.replace(/\D/g, '');
    const countryPrefixDigits = country?.prefix.replace(/\D/g, '') || '';
    if (rawPhone.startsWith(countryPrefixDigits)) {
      rawPhone = rawPhone.substring(countryPrefixDigits.length);
    }
    setMobileMoneyFormattedPhone(`${country?.prefix || ''} ${rawPhone}`);
    
    setCurrentStep(2); // Passer à l'étape de confirmation
  };

  /**
   * Étape 2 : Confirmation et initiation réelle du paiement
   */
  const handleMobileMoneyConfirm = async () => {
    // Guard: éviter les appels multiples
    if (processing) {
      console.log('⚠️ [PawaPay] Paiement déjà en cours, ignore la demande');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      setPaymentStatus('pending');

      const country = PAWAPAY_COUNTRIES.find(c => c.code === mobileMoneyCountry);
      if (!country) {
        throw new Error('Pays non supporté');
      }

      // Le numéro de téléphone arrive déjà avec le préfixe (format: +243XXXXXXXXX)
      // Nettoyer le numéro de téléphone (garder seulement les chiffres)
      let rawPhone = mobileMoneyPhoneNumber.replace(/\D/g, '');
      
      // Extraire le préfixe du pays (ex: 243 pour +243)
      const countryPrefixDigits = country.prefix.replace(/\D/g, '');
      
      // Si le numéro commence par le préfixe du pays, le retirer
      if (rawPhone.startsWith(countryPrefixDigits)) {
        rawPhone = rawPhone.substring(countryPrefixDigits.length);
      }
      
      // Pour RDC (COD), retirer le 0 initial si présent
      if (mobileMoneyCountry === 'COD' && rawPhone.startsWith('0')) {
        rawPhone = rawPhone.substring(1);
      }
      
      if (!rawPhone || rawPhone.length < 9) {
        throw new Error('Numéro de téléphone invalide (minimum 9 chiffres)');
      }

      // Formater avec le préfixe du pays
      const phoneWithCountry = `${country.prefix}${rawPhone}`;

      // Calculer le montant final (conversion si CDF)
      let finalAmount = plan?.price || 0;
      if (mobileMoneyCurrency === 'CDF') {
        const rate = exchangeRate || 2300; // Utiliser le taux de l'API ou fallback
        finalAmount = finalAmount * rate;
      }

      // Créer le payload pour PawaPay
      const payload = {
        subscriptionPlanId: plan.id,
        phoneNumber: phoneWithCountry,
        rawPhoneNumber: rawPhone,
        provider: mobileMoneyProvider,
        country: mobileMoneyCountry,
        amount: finalAmount,
        currency: mobileMoneyCurrency,
      };

      // Logs détaillés pour le debug
      console.log('🔵 [PawaPay] ========== DÉBUT PAIEMENT ==========');
      console.log('🔵 [PawaPay] Plan ID:', plan?.id);
      console.log('🔵 [PawaPay] Payload complet:', JSON.stringify(payload, null, 2));

      // Appeler l'API PawaPay
      let response;
      let data;
      try {
        console.log('🔵 [PawaPay] Envoi de la requête POST...');
        response = await api.post('/payments/pawapay/create-deposit', payload);
        data = response?.data;
        console.log('✅ [PawaPay] Réponse reçue avec succès');
      } catch (apiError: any) {
        console.error('❌ [PawaPay] ========== ERREUR API ==========');
        throw apiError;
      }

      if (data?.success) {
        const depositId = data.data?.depositId || data.data?.id;
        
        setMobileMoneyDepositId(depositId);
        setPaymentStatus('pending');
        
        // Passer à l'étape de polling (étape 3)
        setCurrentStep(3);
        
        // Afficher notification
        Toast.show({
          type: 'success',
          text1: 'Paiement initié',
          text2: 'Confirmez le paiement sur votre téléphone',
        });

        // Commencer à sonder le statut du paiement
        // Nettoyer tout polling précédent avant de démarrer un nouveau
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        startPollingPaymentStatus(depositId);
      } else {
        const errorMessage = data?.message || data?.error?.message || 'Échec du paiement mobile';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('[PawaPay] Mobile payment error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de l\'initiation du paiement mobile';
      setError(errorMessage);
      setPaymentStatus('failed');
      setCurrentStep(4); // Étape 4 = résultat
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Gestionnaire de paiement Mobile Money (ANCIEN - Supprimé car remplacé par flow en 2 étapes)
   */
  const handleMobileMoneySubmit_OLD = async (paymentData: {
    country: string;
    provider: string;
    phoneNumber: string;
    currency: string;
  }) => {
    // Guard: éviter les appels multiples
    if (processing) {
      console.log('⚠️ [PawaPay] Paiement déjà en cours, ignore la demande');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      setPaymentStatus('pending');

      const country = PAWAPAY_COUNTRIES.find(c => c.code === paymentData.country);
      if (!country) {
        throw new Error('Pays non supporté');
      }

      // Le numéro de téléphone arrive déjà avec le préfixe (format: +243XXXXXXXXX)
      // Nettoyer le numéro de téléphone (garder seulement les chiffres)
      let rawPhone = paymentData.phoneNumber.replace(/\D/g, '');
      
      // Extraire le préfixe du pays (ex: 243 pour +243)
      const countryPrefixDigits = country.prefix.replace(/\D/g, '');
      
      // Si le numéro commence par le préfixe du pays, le retirer
      if (rawPhone.startsWith(countryPrefixDigits)) {
        rawPhone = rawPhone.substring(countryPrefixDigits.length);
      }
      
      // Pour RDC (COD), retirer le 0 initial si présent
      if (paymentData.country === 'COD' && rawPhone.startsWith('0')) {
        rawPhone = rawPhone.substring(1);
      }
      
      if (!rawPhone || rawPhone.length < 9) {
        throw new Error('Numéro de téléphone invalide (minimum 9 chiffres)');
      }

      // Formater avec le préfixe du pays
      const phoneWithCountry = `${country.prefix}${rawPhone}`;

      // Calculer le montant final (conversion si CDF)
      let finalAmount = plan?.price || 0;
      if (paymentData.currency === 'CDF') {
        const rate = exchangeRate || 2300; // Utiliser le taux de l'API ou fallback
        finalAmount = finalAmount * rate;
      }

      // Créer le payload pour PawaPay
      // Identique à la version web - le flux de confirmation est géré par PawaPay selon la config du provider
      const payload = {
        subscriptionPlanId: plan.id,
        phoneNumber: phoneWithCountry,
        rawPhoneNumber: rawPhone,
        provider: paymentData.provider,
        country: paymentData.country,
        amount: finalAmount,
        currency: paymentData.currency,
      };

      // Logs détaillés pour le debug
      console.log('🔵 [PawaPay] ========== DÉBUT PAIEMENT ==========');
      console.log('🔵 [PawaPay] Plan ID:', plan?.id);
      console.log('🔵 [PawaPay] Plan Price:', plan?.price);
      console.log('🔵 [PawaPay] Country:', paymentData.country);
      console.log('🔵 [PawaPay] Provider:', paymentData.provider);
      console.log('🔵 [PawaPay] Currency:', paymentData.currency);
      console.log('🔵 [PawaPay] Exchange Rate:', exchangeRate || 2300);
      console.log('🔵 [PawaPay] Final Amount:', finalAmount);
      console.log('🔵 [PawaPay] Phone Number (raw):', paymentData.phoneNumber);
      console.log('🔵 [PawaPay] Phone Number (cleaned):', rawPhone);
      console.log('🔵 [PawaPay] Phone Number (formatted):', phoneWithCountry);
      console.log('🔵 [PawaPay] Payload complet:', JSON.stringify(payload, null, 2));
      console.log('🔵 [PawaPay] URL API:', '/payments/pawapay/create-deposit');
      console.log('🔵 [PawaPay] Base URL:', api.defaults?.baseURL || 'N/A');

      // Appeler l'API PawaPay
      let response;
      let data;
      try {
        console.log('🔵 [PawaPay] Envoi de la requête POST...');
        response = await api.post('/payments/pawapay/create-deposit', payload);
        data = response?.data;
        console.log('✅ [PawaPay] Réponse reçue avec succès');
        console.log('🔵 [PawaPay] Status Code:', response?.status);
        console.log('🔵 [PawaPay] Response Data:', JSON.stringify(data, null, 2));
      } catch (apiError: any) {
        console.error('❌ [PawaPay] ========== ERREUR API ==========');
        console.error('❌ [PawaPay] Error Type:', apiError?.name || 'Unknown');
        console.error('❌ [PawaPay] Error Message:', apiError?.message || 'No message');
        console.error('❌ [PawaPay] Status Code:', apiError?.response?.status || 'N/A');
        console.error('❌ [PawaPay] Status Text:', apiError?.response?.statusText || 'N/A');
        console.error('❌ [PawaPay] Response Data:', JSON.stringify(apiError?.response?.data || {}, null, 2));
        console.error('❌ [PawaPay] Request URL:', apiError?.config?.url || 'N/A');
        console.error('❌ [PawaPay] Request Method:', apiError?.config?.method || 'N/A');
        console.error('❌ [PawaPay] Request Headers:', JSON.stringify(apiError?.config?.headers || {}, null, 2));
        console.error('❌ [PawaPay] Full Error:', JSON.stringify(apiError, null, 2));
        console.error('❌ [PawaPay] ====================================');
        throw apiError;
      }

      if (data?.success) {
        const depositId = data.data?.depositId || data.data?.id;
        const status = data.data?.status || 'processing';
        
        setMobileMoneyDepositId(depositId);
        setPaymentStatus('pending');
        
        // Passer à l'étape de polling (étape 3)
        setCurrentStep(3);
        
        // Afficher notification
        Toast.show({
          type: 'success',
          text1: 'Paiement initié',
          text2: 'Confirmez le paiement sur votre téléphone',
        });

        // Commencer à sonder le statut du paiement
        setCurrentStep(2); // Étape 2 = traitement
        // Nettoyer tout polling précédent avant de démarrer un nouveau
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        startPollingPaymentStatus(depositId);
      } else {
        const errorMessage = data?.message || data?.error?.message || 'Échec du paiement mobile';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('[PawaPay] Mobile payment error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de l\'initiation du paiement mobile';
      setError(errorMessage);
      setPaymentStatus('failed');
      setCurrentStep(3); // Étape 3 = résultat
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Sonder le statut du paiement PawaPay
   */
  const startPollingPaymentStatus = (depositId: string) => {
    // Nettoyer l'intervalle précédent si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    let pollAttempts = 0;
    const maxAttempts = 60; // 60 tentatives = 2 minutes (2 secondes par tentative)
    const pollInterval = 2000; // 2 secondes

    pollingIntervalRef.current = setInterval(async () => {
      try {
        pollAttempts++;
        console.log(`[PawaPay] Polling attempt ${pollAttempts}/${maxAttempts} for deposit: ${depositId}`);

        // 1. Vérifier d'abord le statut du dépôt via l'API PawaPay
        try {
          const depositStatusRes = await api.get(`/payments/pawapay/deposit/${depositId}/status`);
          const depositStatusData = depositStatusRes?.data;
          
          if (depositStatusData?.success && depositStatusData?.data?.status) {
            const depositStatus = depositStatusData.data.status.toUpperCase();
            console.log(`[PawaPay] Deposit status: ${depositStatus}`);
            
            // Si le paiement est annulé ou échoué, arrêter le polling immédiatement
            if (depositStatus === 'CANCELLED' || depositStatus === 'FAILED') {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }

              setPaymentStatus('cancelled');
              setError(depositStatus === 'CANCELLED' 
                ? 'Paiement annulé. Vous pouvez réessayer quand vous êtes prêt.'
                : 'Le paiement a échoué. Veuillez réessayer ou contacter le support.'
              );
              setCurrentStep(3); // Étape 3 = résultat
              
              Toast.show({
                type: 'error',
                text1: depositStatus === 'CANCELLED' ? 'Paiement annulé' : 'Paiement échoué',
                text2: depositStatus === 'CANCELLED' 
                  ? 'Vous pouvez réessayer quand vous êtes prêt.'
                  : 'Veuillez réessayer ou contacter le support.',
              });
              return;
            }
            
            // Si le paiement est complété, vérifier l'abonnement
            if (depositStatus === 'COMPLETED') {
              // Continuer pour vérifier l'abonnement
            } else if (depositStatus === 'ACCEPTED' || depositStatus === 'SUBMITTED') {
              // Paiement en cours, continuer le polling
              // Ne pas retourner, continuer pour vérifier l'abonnement aussi
            }
          }
        } catch (depositStatusError: any) {
          // Si l'endpoint de statut n'existe pas ou échoue, continuer avec la vérification du profil
          console.log('[PawaPay] Deposit status endpoint not available, using profile check:', depositStatusError?.message);
        }

        // 2. Vérifier le statut de l'abonnement via le profil
        const profileRes = await api.get('/auth/profile');
        const profileData = profileRes.data;

        if (profileData?.success && profileData?.data?.subscription?.status === 'ACTIVE') {
          // Paiement réussi, abonnement actif
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          setPaymentStatus('completed');
          setSuccess(true);
          
          // Récupérer les détails du paiement
          setPaymentDetails({
            depositId,
            amount: plan?.price || 0,
            currency: mobileMoneyCurrency,
            status: 'completed',
            subscription: profileData.data.subscription,
          });

          Toast.show({
            type: 'success',
            text1: 'Paiement approuvé',
            text2: 'Votre abonnement est maintenant actif',
          });

          // Passer à l'étape de succès (étape 3)
          setCurrentStep(3);
          
          if (onSuccess) {
            setTimeout(() => {
              onSuccess({
                planId: plan.id,
                paymentMethod: 'mobile',
                depositId,
                subscription: profileData.data.subscription,
              });
            }, 1500);
          }
          return;
        }

        // Si on a atteint le maximum de tentatives
        if (pollAttempts >= maxAttempts) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          setPaymentStatus('failed');
          setError('La confirmation du paiement a pris trop de temps. Veuillez contacter le support.');
          setCurrentStep(3); // Étape 3 = résultat
        }
      } catch (error: any) {
        console.error('[PawaPay] Error polling payment status:', error);
        
        // Si on a atteint le maximum de tentatives
        if (pollAttempts >= maxAttempts) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          setPaymentStatus('failed');
          setError('Erreur lors de la vérification du paiement. Veuillez contacter le support.');
          setCurrentStep(3);
        }
      }
    }, pollInterval);
  };

  // Nettoyer l'intervalle lors du démontage
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  /**
   * Étape 2 : Affichage du formulaire Mobile Money (PawaPay)
   */
  /**
   * Étape 2 : Confirmation du paiement Mobile Money
   */
  const renderStep2_MobileMoneyConfirmation = () => {
    const country = PAWAPAY_COUNTRIES.find(c => c.code === mobileMoneyCountry);
    const provider = country?.providers.find(p => p.code === mobileMoneyProvider);
    
    // Calculer le montant final pour l'affichage
    let finalAmount = plan?.price || 0;
    let currencyDisplay = 'EUR';
    if (mobileMoneyCurrency === 'CDF') {
      const rate = exchangeRate || 2300;
      finalAmount = finalAmount * rate;
      currencyDisplay = 'CDF';
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Confirmation</Text>
        <Text style={styles.stepSubtitle}>Vérifiez les informations avant de confirmer</Text>

        <View style={styles.confirmationCard}>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Abonnement</Text>
            <Text style={styles.confirmationValue}>{plan?.name}</Text>
          </View>
          
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Montant</Text>
            <Text style={styles.confirmationValue}>
              {mobileMoneyCurrency === 'USD' ? `${plan?.price} $` : `${finalAmount.toLocaleString()} ${currencyDisplay}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Pays</Text>
            <Text style={styles.confirmationValue}>{country?.name}</Text>
          </View>

          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Opérateur</Text>
            <Text style={styles.confirmationValue}>{provider?.name}</Text>
          </View>

          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Numéro</Text>
            <Text style={styles.confirmationValue}>{mobileMoneyFormattedPhone}</Text>
          </View>
        </View>

        <View style={styles.infoMessage}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.infoMessageText}>
            En cliquant sur confirmer, vous recevrez une demande de validation sur votre téléphone.
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => setCurrentStep(1)}
            disabled={processing}
          >
            <Text style={styles.cancelButtonText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.nextButton, processing && styles.buttonDisabled]}
            onPress={handleMobileMoneyConfirm}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.nextButtonText}>Confirmer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep2_MobileMoneyForm = () => {
    const selectedCountry = PAWAPAY_COUNTRIES.find(c => c.code === mobileMoneyCountry);
    const providers = selectedCountry?.providers || [];
    
    // Calculer le montant affiché avec le taux de change
    const rate = exchangeRate || 2300; // Fallback à 2300 si pas encore chargé
    const displayAmount = mobileMoneyCurrency === 'CDF' 
      ? (plan?.price || 0) * rate 
      : (plan?.price || 0);

    return (
      <ScrollView 
        style={styles.stepContainer} 
        contentContainerStyle={styles.stepContainerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Paiement mobile</Text>
        </View>

        {/* Numéro de téléphone en premier */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Numéro de téléphone *</Text>
          <View style={styles.phoneInputContainer}>
            {/* Préfixe du pays (non éditable, affiché seulement) */}
            <View style={styles.phonePrefixContainer}>
              <Text style={styles.phonePrefixText}>{mobileMoneyPhonePrefix}</Text>
            </View>
            {/* Espace entre préfixe et numéro */}
            <View style={{ width: 8 }} />
            {/* Numéro de téléphone */}
            <TextInput
              style={[styles.phoneInput, error && styles.inputError]}
              placeholder="812345678"
              placeholderTextColor="#999"
              value={mobileMoneyPhoneNumber}
              onChangeText={(text) => {
                // Nettoyer le numéro (seulement chiffres)
                const cleaned = text.replace(/\D/g, '');
                setMobileMoneyPhoneNumber(cleaned);
                setError(null);
              }}
              keyboardType="phone-pad"
              editable={!processing}
              maxLength={15}
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Text style={styles.hint}>
            Format: {mobileMoneyPhonePrefix} XXXXXXXXX (sans le 0 initial)
          </Text>
        </View>

        {/* Devise en deuxième */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Devise *</Text>
          <TouchableOpacity
            style={[styles.dropdownButton, processing && styles.dropdownButtonDisabled]}
            onPress={() => !processing && setShowCurrencyPicker(true)}
            disabled={processing}
          >
            <View style={styles.dropdownButtonContent}>
              <Text style={styles.dropdownButtonText}>
                {mobileMoneyCurrency === 'USD' ? 'USD (Dollar américain)' : `CDF (Franc congolais)`}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Pays et Opérateur sur la même ligne en dernier */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Pays *</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, processing && styles.dropdownButtonDisabled]}
              onPress={() => !processing && setShowCountryPicker(true)}
              disabled={processing}
            >
              <View style={styles.dropdownButtonContent}>
                <Text style={[
                  styles.dropdownButtonText,
                  !selectedCountry && styles.dropdownButtonTextPlaceholder
                ]} numberOfLines={1}>
                  {selectedCountry?.label || 'Pays'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Opérateur *</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, processing && styles.dropdownButtonDisabled]}
              onPress={() => !processing && setShowProviderPicker(true)}
              disabled={processing}
            >
              <View style={styles.dropdownButtonContent}>
                <Text style={[
                  styles.dropdownButtonText,
                  !mobileMoneyProvider && styles.dropdownButtonTextPlaceholder
                ]} numberOfLines={1}>
                  {providers.find(p => p.code === mobileMoneyProvider)?.label || 'Opérateur'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box avec affordance */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={theme.colors.info} />
          <Text style={styles.infoText}>
            Vous recevrez une demande de confirmation sur votre téléphone pour valider le paiement.
          </Text>
        </View>

        {/* Bouton de soumission */}
        <TouchableOpacity
          style={[styles.continueButton, processing && styles.continueButtonDisabled]}
          onPress={() => {
            if (!mobileMoneyPhoneNumber.trim()) {
              setError('Numéro de téléphone requis');
              return;
            }
            if (!mobileMoneyProvider) {
              setError('Opérateur requis');
              return;
            }
            // Combiner le préfixe et le numéro
            const fullPhoneNumber = `${mobileMoneyPhonePrefix}${mobileMoneyPhoneNumber}`;
            handleMobileMoneyInfoSubmit({
              country: mobileMoneyCountry,
              provider: mobileMoneyProvider,
              phoneNumber: fullPhoneNumber,
              currency: mobileMoneyCurrency,
            });
          }}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>
              Payer {mobileMoneyCurrency === 'CDF' 
                ? `${loadingExchangeRate ? '...' : Math.round(displayAmount).toLocaleString()} CDF`
                : `${displayAmount} USD`}
            </Text>
          )}
        </TouchableOpacity>

        {/* Bouton retour */}
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => setCurrentStep(0)}
          disabled={processing}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        {/* Modal Dropdown Pays */}
        <Modal
          visible={showCountryPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCountryPicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Sélectionnez un pays</Text>
                <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {PAWAPAY_COUNTRIES.map((country) => (
                  <TouchableOpacity
                    key={country.code}
                    style={styles.pickerOption}
                    onPress={() => {
                      setMobileMoneyCountry(country.code);
                      setMobileMoneyPhonePrefix(country.prefix);
                      const countryProviders = country.providers || [];
                      setMobileMoneyProvider(countryProviders[0]?.code || '');
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>
                      {country.label} ({country.prefix})
                    </Text>
                    {mobileMoneyCountry === country.code && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal Dropdown Devise */}
        <Modal
          visible={showCurrencyPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCurrencyPicker(false)}
        >
          <View style={styles.pickerModal}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Sélectionnez une devise</Text>
                <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setMobileMoneyCurrency('USD');
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>USD (Dollar américain)</Text>
                  {mobileMoneyCurrency === 'USD' && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={() => {
                    setMobileMoneyCurrency('CDF');
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>
                    CDF (Franc congolais{exchangeRate ? ` - Taux: ${exchangeRate.toLocaleString()}` : ''})
                  </Text>
                  {mobileMoneyCurrency === 'CDF' && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  };

  /**
   * Étape 3 : Attendre la confirmation du paiement Mobile Money (Polling)
   */
  const renderStep3_MobileMoneyWaiting = () => (
    <View style={styles.stepContainer}>
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
        <Text style={styles.stepTitle}>Paiement en cours...</Text>
        <Text style={styles.stepDescription}>
          Veuillez confirmer le paiement sur votre téléphone mobile.
        </Text>
        <Text style={styles.stepDescription}>
          Nous vérifions automatiquement le statut de votre paiement...
        </Text>
        
        {mobileMoneyDepositId && (
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionLabel}>ID Transaction:</Text>
            <Text style={styles.transactionId}>{mobileMoneyDepositId}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { marginTop: 20 }]}
          onPress={() => {
            // Arrêter le polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setCurrentStep(2);
          }}
          disabled={processing}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Étape 2 : Saisie des informations de paiement (retour au flux original pour cette étape)
   */
  const formatCardNumber = (text) => {
    // Supprimer tous les espaces
    const cleaned = text.replace(/\s/g, '');
    // Ajouter un espace tous les 4 chiffres
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 chiffres + 3 espaces
  };

  const formatExpiry = (text) => {
    // Format MM/YY
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const formatCvc = (text) => {
    return text.replace(/\D/g, '').substring(0, 4);
  };

  const validateCardInfo = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      return 'Numéro de carte invalide';
    }
    if (!cardExpiry || cardExpiry.length !== 5) {
      return 'Date d\'expiration invalide (MM/YY)';
    }
    if (!cardCvc || cardCvc.length < 3) {
      return 'Code CVC invalide';
    }
    if (!cardholderName || cardholderName.trim().length < 2) {
      return 'Nom du titulaire requis';
    }
    return null;
  };

  const handleContinueFromCardInput = async () => {
    if (selectedPaymentMethod === 'stripe') {
      // Pour Stripe, si on arrive ici, c'est qu'on utilise le SDK natif (CardField)
      // La session a déjà été créée dans handlePaymentMethodSelect
      // On a déjà sessionId et clientSecret, on peut passer à la confirmation
      if (stripeSessionId && stripeClientSecret) {
        setCurrentStep(3);
      } else {
        setError('Session Stripe non disponible. Veuillez réessayer.');
        setCurrentStep(3);
      }
    } else if (selectedPaymentMethod === 'paypal') {
      // Créer la commande PayPal avec le backend
      try {
        setProcessing(true);
        
        const orderData = {
          subscriptionPlanId: plan.id,
          clientType: 'mobile',
        };

        const paypalData = await SubscriptionApi.createPayPalOrder(orderData);
        
        
        // Pour PayPal, le backend doit retourner orderId ET approvalUrl pour la webview
        if (paypalData?.orderId && paypalData?.approvalUrl) {
          setPaypalOrderId(paypalData.orderId);
          setPaypalApprovalUrl(paypalData.approvalUrl);
          
          // Afficher la webview PayPal
          setShowPayPalWebView(true);
        } else if (paypalData?.orderId) {
          // Si seulement orderId, on continue sans webview (ancien flow)
          setPaypalOrderId(paypalData.orderId);
          setCurrentStep(3);
        } else {
          throw new Error('Réponse PayPal invalide: orderId et approvalUrl requis');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la commande PayPal';
        setError(errorMessage);
        setCurrentStep(3);
      } finally {
        setProcessing(false);
      }
    }
  };

  /**
   * Gérer l'approbation PayPal depuis la webview
   */
  const handlePayPalApproval = async (payerId) => {
    try {
      setPaypalPayerId(payerId);
      
      // Passer à l'étape de confirmation
      setCurrentStep(3);
    } catch (error) {
      setError('Erreur lors de l\'approbation PayPal');
      setCurrentStep(3);
    }
  };

  /**
   * Étape 3 : Confirmation et traitement du paiement
   * Appel réel au backend pour confirmer le paiement
   */
  const handleConfirmPayment = async () => {
    try {
      setProcessing(true);
      setError(null);


      let subscriptionData;

      if (selectedPaymentMethod === 'stripe') {
        // Confirmer le paiement Stripe avec le SDK
        if (!stripeClientSecret) {
          throw new Error('Client secret Stripe manquant');
        }

        
        // Stripe SDK removed - use web checkout or mobile money instead
        // Payments with cards should be done via web checkout URL
        throw new Error('Stripe card payments are not available in the app. Please use mobile money or visit the website for card payments.');
        
      } else if (selectedPaymentMethod === 'paypal') {
        // Confirmer le paiement PayPal
        // Note: payerId devrait être passé depuis handlePayPalApproval
        if (!paypalOrderId) {
          throw new Error('Commande PayPal manquante');
        }

        // Le payerId est déjà défini depuis handlePayPalApproval
        if (!paypalPayerId) {
          throw new Error('Payer ID PayPal manquant. Veuillez réessayer.');
        }
        
        const paymentData = {
          orderId: paypalOrderId,
          payerId: paypalPayerId,
        };

        subscriptionData = await SubscriptionApi.confirmPayPalPayment(paymentData);
      } else {
        throw new Error('Méthode de paiement invalide');
      }


      setSuccess(true);
      setCurrentStep(3);
      
      if (onSuccess) {
        onSuccess({
          planId: plan.id,
          paymentMethod: selectedPaymentMethod,
          sessionId: stripeSessionId || null,
          orderId: paypalOrderId || null,
          subscription: subscriptionData,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du traitement du paiement';
      setError(errorMessage);
      setCurrentStep(3);
      
      Toast.show({
        type: 'error',
        text1: 'Erreur de paiement',
        text2: errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Étape 4 : Résultat
   */
  const handleCloseResult = () => {
    if (success) {
      onClose();
    } else {
      // En cas d'erreur, revenir à l'étape 1
      resetFlow();
    }
  };

  /**
   * Rendu des étapes
   */
  const renderStep0_SubscriptionConfirmation = () => {
    if (!plan) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Erreur</Text>
          <Text style={styles.stepSubtitle}>Aucun plan d'abonnement sélectionné</Text>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Pour les plans gratuits, afficher une interface simplifiée
    if (isFreePlan) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Informations</Text>
          <Text style={styles.stepSubtitle}>Activez votre abonnement gratuit</Text>

          <View style={styles.confirmationCard}>
            <View style={styles.planHeader}>
              <View style={styles.planHeaderLeft}>
                <Text style={styles.planNameLarge}>{plan?.name || 'Abonnement gratuit'}</Text>
              </View>
              <View style={styles.planHeaderRight}>
                <Text style={styles.priceStandard}>Gratuit</Text>
              </View>
            </View>

            <View style={styles.startDateInfo}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <View style={styles.startDateTextContainer}>
                <Text style={styles.startDateLabel}>Date de début</Text>
                <Text style={styles.startDateValue}>
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.nextButton, processing && styles.buttonDisabled]}
              onPress={handleConfirmSubscription}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.nextButtonText}>S'abonner</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ✅ COMPLIANCE: iOS Companion Mode - Hide paid plans
    if (isCompanionMode) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Informations</Text>
          <View style={styles.companionModeContainer}>
            <Ionicons name="information-circle-outline" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.companionModeTitle}>Gestion des abonnements</Text>
            <Text style={styles.companionModeMessage}>
              {companionMessage || 'Gérez votre abonnement sur le site web à lasocoach.com'}
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={onClose}
            >
              <Text style={styles.nextButtonText}>Compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Rendu normal pour les plans payants
    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Informations</Text>
        </View>
        
        <View style={styles.planSummaryCard}>
          <View style={styles.planIconContainer}>
            <Ionicons name="flash-outline" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planNameLabel}>{plan.name}</Text>
            <Text style={styles.planPriceLabel}>
              {plan.price}€<Text style={styles.planPeriodLabel}> / mois</Text>
            </Text>
          </View>
        </View>

        <View style={styles.featuresList}>
          {plan.description && (
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>{plan.description}</Text>
            </View>
          )}
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Accès complet à tous les programmes</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Suivi personnalisé de votre progression</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={handleConfirmSubscription}
          >
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep1_MethodSelection = () => {
    // ✅ COMPLIANCE: iOS Companion Mode - Hide all payment methods
    if (isCompanionMode) {
      return (
        <View style={styles.stepContainer}>
          <View style={styles.companionModeContainer}>
            <Ionicons name="information-circle-outline" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.companionModeTitle}>Gestion des abonnements</Text>
            <Text style={styles.companionModeMessage}>
              {companionMessage || 'Gérez votre abonnement sur le site web à lasocoach.com'}
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { fontSize: 18 }]}>Choisir une méthode</Text>
        <Text style={styles.stepSubtitle}>Sélectionnez votre méthode de paiement préférée</Text>

        {plan && (
          <View style={styles.planSummary}>
            <Text style={styles.planSummaryName}>{plan.name}</Text>
            <Text style={styles.planSummaryPrice}>
              {plan.discountPrice && plan.discountPrice < plan.price ? (
                <>
                  <Text style={styles.planPriceDiscount}>€{plan.discountPrice}</Text>
                  <Text style={styles.planPriceOriginal}> €{plan.price}</Text>
                </>
              ) : (
                `€${plan.price}`
              )}
              <Text style={styles.planPricePeriod}> / {SubscriptionApi.getBillingPeriod(plan.duration)}</Text>
            </Text>
          </View>
        )}

        <View style={styles.paymentMethods}>
        <TouchableOpacity
          style={[
            styles.paymentMethodOption,
            selectedPaymentMethod === 'stripe' && styles.paymentMethodSelected,
          ]}
          onPress={() => handlePaymentMethodSelect('stripe')}
        >
          <View style={styles.paymentMethodInfo}>
            <View style={styles.paymentMethodIcon}>
              <Text style={styles.stripeIcon}>💳</Text>
            </View>
            <View style={styles.paymentMethodText}>
              <Text style={styles.paymentMethodName}>Stripe</Text>
              <Text style={styles.paymentMethodDesc}>Carte de crédit / débit</Text>
            </View>
          </View>
          {selectedPaymentMethod === 'stripe' && (
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentMethodOption,
            selectedPaymentMethod === 'paypal' && styles.paymentMethodSelected,
          ]}
          onPress={() => handlePaymentMethodSelect('paypal')}
        >
          <View style={styles.paymentMethodInfo}>
            <View style={styles.paymentMethodIcon}>
              <Text style={styles.paypalIcon}>PayPal</Text>
            </View>
            <View style={styles.paymentMethodText}>
              <Text style={styles.paymentMethodName}>PayPal</Text>
              <Text style={styles.paymentMethodDesc}>Compte PayPal</Text>
            </View>
          </View>
          {selectedPaymentMethod === 'paypal' && (
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentMethodOption,
            selectedPaymentMethod === 'mobile' && styles.paymentMethodSelected,
          ]}
          onPress={() => handlePaymentMethodSelect('mobile')}
        >
          <View style={styles.paymentMethodInfo}>
            <View style={styles.paymentMethodIcon}>
              <Text style={styles.mobileIcon}>MM</Text>
            </View>
            <View style={styles.paymentMethodText}>
              <Text style={styles.paymentMethodName}>Paiement mobile</Text>
              <Text style={styles.paymentMethodDesc}>Airtel / Vodacom / Orange</Text>
            </View>
          </View>
          {selectedPaymentMethod === 'mobile' && (
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.autoRenewalOption}
        onPress={() => setAutoRenewal(!autoRenewal)}
      >
        <Ionicons
          name={autoRenewal ? "checkbox" : "square-outline"}
          size={24}
          color={theme.colors.primary}
        />
        <Text style={styles.autoRenewalText}>Renouvellement automatique</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.continueButton, processing && styles.continueButtonDisabled]}
        onPress={handleContinueFromMethodSelection}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.continueButtonText}>Continuer</Text>
        )}
      </TouchableOpacity>
      </View>
    );
  };

  const renderStep2_CardInput = () => {
    // Pour Stripe, vérifier si on doit afficher la webview
    if (selectedPaymentMethod === 'stripe' && showStripeWebView && stripeCheckoutUrl) {
      return (
        <View style={styles.stepContainer}>
          <View style={styles.webviewHeader}>
            <Text style={styles.stepTitle}>Paiement Stripe</Text>
            <TouchableOpacity
              onPress={() => {
                setShowStripeWebView(false);
                setStripeCheckoutUrl(null);
              }}
              style={styles.webviewCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: stripeCheckoutUrl }}
            style={styles.webview}
            onNavigationStateChange={async (navState) => {
              // Détecter les URLs de retour Stripe
              const url = navState.url;
              
              // Détecter succès (retour avec session_id ou success)
              // URLs Stripe de succès peuvent être : 
              // - https://checkout.stripe.com/payments/success?session_id=...
              // - https://app.lasocoach.com/subscription-success?session_id=...
              // - ou toute URL contenant "success" et "session_id"
              if (url.includes('success') || url.includes('session_id=') || url.includes('payment_intent=')) {
                try {
                  const urlObj = new URL(url);
                  const sessionId = urlObj.searchParams.get('session_id') || 
                                   urlObj.searchParams.get('payment_intent') ||
                                   urlObj.searchParams.get('sessionId');
                  
                  if (sessionId || url.includes('success')) {
                    
                    // Sauvegarder le sessionId pour la confirmation
                    if (sessionId) {
                      setStripeSessionId(sessionId);
                    }
                    
                    setShowStripeWebView(false);
                    
                    // Confirmer le paiement avec le backend
                    try {
                      setProcessing(true);
                      
                      const paymentData = {
                        sessionId: sessionId || stripeSessionId,
                        // Pour les paiements via webview, on n'a pas besoin de clientSecret
                        // Le backend peut vérifier le statut de la session Stripe
                      };
                      
                      const subscriptionData = await SubscriptionApi.confirmStripePayment(paymentData);
                      
                      
                      setSuccess(true);
                      setCurrentStep(3);
                      
                      // Appeler onSuccess pour fermer le bottomsheet
                      if (onSuccess) {
                        onSuccess({
                          planId: plan.id,
                          paymentMethod: 'stripe',
                          sessionId: sessionId || stripeSessionId,
                          subscription: subscriptionData,
                        });
                      }
                    } catch (confirmError) {
                      const errorMessage = confirmError.response?.data?.message || confirmError.message || 'Erreur lors de la confirmation du paiement';
                      setError(errorMessage);
                      setCurrentStep(3);
                    } finally {
                      setProcessing(false);
                    }
                    
                    return;
                  }
                } catch (e) {
                }
              }
              
              // Détecter annulation
              if (url.includes('cancel') || url.includes('cancelled')) {
                setShowStripeWebView(false);
                Toast.show({
                  type: 'info',
                  text1: 'Paiement annulé',
                  text2: 'Vous avez annulé le paiement Stripe',
                });
              }
            }}
          />
        </View>
      );
    }
    
    if (selectedPaymentMethod === 'paypal') {
      // Pour PayPal, afficher la webview si on a l'URL d'approbation
      if (showPayPalWebView && paypalApprovalUrl) {
        return (
          <View style={styles.stepContainer}>
            <View style={styles.webviewHeader}>
              <Text style={styles.stepTitle}>Paiement PayPal</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPayPalWebView(false);
                  setPaypalApprovalUrl(null);
                }}
                style={styles.webviewCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: paypalApprovalUrl }}
              style={styles.webview}
              onNavigationStateChange={(navState) => {
                // Détecter les URLs de retour PayPal
                const url = navState.url;
                
                // Détecter succès (retour avec payerId ou token)
                if (url.includes('PayerID=') || url.includes('payerId=') || url.includes('token=')) {
                  try {
                    const urlObj = new URL(url);
                    const payerId = urlObj.searchParams.get('PayerID') || 
                                   urlObj.searchParams.get('payerId') || 
                                   urlObj.searchParams.get('token');
                    
                    if (payerId) {
                      setShowPayPalWebView(false);
                      // Passer à l'étape de confirmation avec payerId
                      handlePayPalApproval(payerId);
                      return;
                    }
                  } catch (e) {
                  }
                }
                
                // Détecter annulation
                if (url.includes('cancel=true') || url.includes('cancelled=true') || url.includes('canceled=true')) {
                  setShowPayPalWebView(false);
                  Toast.show({
                    type: 'info',
                    text1: 'Paiement annulé',
                    text2: 'Vous avez annulé le paiement PayPal',
                  });
                }
              }}
            />
          </View>
        );
      }
      
      // Sinon, afficher le bouton pour créer la commande PayPal
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Paiement PayPal</Text>
          <Text style={styles.stepSubtitle}>
            Vous serez redirigé vers PayPal pour finaliser votre paiement
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, processing && styles.continueButtonDisabled]}
            onPress={handleContinueFromCardInput}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>Continuer vers PayPal</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // Pour Stripe, utiliser le CardField natif du SDK (si pas de webview)
    // Si on a une URL, elle sera affichée dans la webview ci-dessus
    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Informations de paiement</Text>
        <Text style={styles.stepSubtitle}>Entrez les détails de votre carte bancaire</Text>

        <View style={styles.cardInputContainer}>
          <Text style={styles.stepSubtitle}>
            Stripe SDK removed - payments handled via mobile money or web checkout
          </Text>
          <Text style={styles.stepSubtitle}>
            Please use mobile money payment method or visit the website for card payments.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, processing && styles.continueButtonDisabled]}
          onPress={handleContinueFromCardInput}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Continuer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderStep3_Confirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirmer le paiement</Text>
      <Text style={styles.stepSubtitle}>
        Vérifiez les détails avant de confirmer votre abonnement
      </Text>

      <View style={styles.confirmationCard}>
        <View style={styles.confirmationRow}>
          <Text style={styles.confirmationLabel}>Plan:</Text>
          <Text style={styles.confirmationValue}>{plan?.name}</Text>
        </View>
        <View style={styles.confirmationRow}>
          <Text style={styles.confirmationLabel}>Prix:</Text>
          <Text style={styles.confirmationValue}>
            {plan?.discountPrice ? `${plan.discountPrice}€` : `${plan?.price}€`} / {SubscriptionApi.getBillingPeriod(plan?.duration)}
          </Text>
        </View>
        <View style={styles.confirmationRow}>
          <Text style={styles.confirmationLabel}>Méthode:</Text>
          <Text style={styles.confirmationValue}>
            {selectedPaymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}
          </Text>
        </View>
        <View style={styles.confirmationRow}>
          <Text style={styles.confirmationLabel}>Renouvellement:</Text>
          <Text style={styles.confirmationValue}>
            {autoRenewal ? 'Automatique' : 'Manuel'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, processing && styles.continueButtonDisabled]}
        onPress={handleConfirmPayment}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.continueButtonText}>Confirmer et payer</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep4_Result = () => {
    if (success && paymentDetails) {
      return (
        <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.resultTitle}>Paiement réussi !</Text>
            <Text style={styles.resultSubtitle}>
              Votre abonnement a été activé avec succès
            </Text>
          </View>

          {/* Détails du paiement */}
          <View style={styles.paymentDetailsCard}>
            <Text style={styles.paymentDetailsTitle}>Détails du paiement</Text>
            
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Plan:</Text>
              <Text style={styles.paymentDetailValue}>{plan?.name || 'N/A'}</Text>
            </View>
            
            <View style={styles.paymentDetailRow}>
              <Text style={styles.paymentDetailLabel}>Montant:</Text>
              <Text style={styles.paymentDetailValue}>
                {paymentDetails.currency === 'CDF' 
                  ? `${Math.round(paymentDetails.amount * 2300).toLocaleString()} CDF`
                  : `${paymentDetails.amount} USD`}
              </Text>
            </View>
            
            {mobileMoneyDepositId && (
              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>ID Transaction:</Text>
                <Text style={styles.paymentDetailValue}>{mobileMoneyDepositId}</Text>
              </View>
            )}
            
            {paymentDetails.subscription && (
              <View style={styles.paymentDetailRow}>
                <Text style={styles.paymentDetailLabel}>Statut:</Text>
                <Text style={styles.paymentDetailValue}>
                  {paymentDetails.subscription.status === 'ACTIVE' ? 'Actif' : paymentDetails.subscription.status}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              handleCloseResult();
              if (onClose) {
                onClose();
              }
            }}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // Erreur
    return (
      <View style={styles.stepContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="close-circle" size={80} color="#F44336" />
          <Text style={styles.resultTitle}>Erreur de paiement</Text>
          <Text style={styles.resultSubtitle}>
            {error || 'Une erreur est survenue lors du traitement de votre paiement'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            // Réinitialiser et revenir au formulaire
            resetFlow();
            if (isAndroid) {
              setCurrentStep(2); // Retourner au formulaire mobile money
            } else {
              setCurrentStep(1); // Retourner à la sélection de méthode
            }
          }}
        >
          <Text style={styles.continueButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Picker pour le pays
   */
  const renderCountryPicker = () => (
    <Modal
      visible={showCountryPicker}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCountryPicker(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowCountryPicker(false)}
      >
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Choisir un pays</Text>
          <ScrollView>
            {PAWAPAY_COUNTRIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={styles.pickerItem}
                onPress={() => {
                  setMobileMoneyCountry(c.code);
                  setMobileMoneyPhonePrefix(c.prefix);
                  // Sélectionner automatiquement le premier provider du pays
                  if (c.providers.length > 0) {
                    setMobileMoneyProvider(c.providers[0].code);
                  }
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{c.label}</Text>
                {mobileMoneyCountry === c.code && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  /**
   * Picker pour l'opérateur
   */
  const renderProviderPicker = () => {
    const selectedCountry = PAWAPAY_COUNTRIES.find(c => c.code === mobileMoneyCountry);
    const providers = selectedCountry?.providers || [];

    return (
      <Modal
        visible={showProviderPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProviderPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowProviderPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Choisir un opérateur</Text>
            <ScrollView>
              {providers.map((p) => (
                <TouchableOpacity
                  key={p.code}
                  style={styles.pickerItem}
                  onPress={() => {
                    setMobileMoneyProvider(p.code);
                    setShowProviderPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{p.name}</Text>
                  {mobileMoneyProvider === p.code && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  /**
   * Picker pour la devise
   */
  const renderCurrencyPicker = () => (
    <Modal
      visible={showCurrencyPicker}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCurrencyPicker(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowCurrencyPicker(false)}
      >
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Choisir une devise</Text>
          <TouchableOpacity
            style={styles.pickerItem}
            onPress={() => {
              setMobileMoneyCurrency('USD');
              setShowCurrencyPicker(false);
            }}
          >
            <Text style={styles.pickerItemText}>USD (Dollar américain)</Text>
            {mobileMoneyCurrency === 'USD' && (
              <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pickerItem}
            onPress={() => {
              setMobileMoneyCurrency('CDF');
              setShowCurrencyPicker(false);
            }}
          >
            <Text style={styles.pickerItemText}>CDF (Franc congolais)</Text>
            {mobileMoneyCurrency === 'CDF' && (
              <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderCurrentStep = () => {
    return (
      <>
        {(() => {
          switch (currentStep) {
            case 0:
              return renderStep0_SubscriptionConfirmation();
            case 1:
              return renderStep2_MobileMoneyForm(); 
            case 2:
              return renderStep2_MobileMoneyConfirmation();
            case 3:
              return renderStep3_MobileMoneyWaiting();
            case 4:
              return renderStep4_Result();
            default:
              return renderStep0_SubscriptionConfirmation();
          }
        })()}
        {renderCountryPicker()}
        {renderCurrencyPicker()}
        {renderProviderPicker()}
      </>
    );
  };

  // Si intégré dans un bottom sheet, ne pas utiliser Modal
  if (isEmbedded) {
    return (
      <ScrollView 
        style={styles.embeddedContainer}
        contentContainerStyle={styles.embeddedContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderTitle}>
            {currentStep === 0 && (isFreePlan ? 'Abonnement gratuit' : 'Informations de paiement')}
            {currentStep === 0 && 'Informations de paiement'}
            {currentStep === 1 && 'Paiement mobile'}
            {currentStep === 2 && 'Traitement'}
            {currentStep === 3 && (success ? 'Succès' : 'Erreur')}
          </Text>
          {currentStep !== 3 && currentStep !== 0 && (
            <TouchableOpacity onPress={() => setCurrentStep(currentStep - 1)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
          {currentStep === 0 && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Progress indicator - Masquer pour les plans gratuits */}
        {currentStep !== 3 && !isFreePlan && (
          <View style={styles.progressContainer}>
            {[0, 1, 2].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressStep,
                  currentStep >= step && styles.progressStepActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Content */}
        {renderCurrentStep()}
      </ScrollView>
    );
  }

  // Version avec Modal (pour utilisation standalone)
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Blur natif pour l'overlay (comme iOS) */}
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              {currentStep === 0 && 'Informations de paiement'}
              {currentStep === 1 && 'Paiement mobile'}
              {currentStep === 2 && 'Traitement'}
              {currentStep === 3 && (success ? 'Succès' : 'Erreur')}
            </Text>
          {currentStep !== 3 && currentStep !== 0 && (
            <TouchableOpacity onPress={() => setCurrentStep(currentStep - 1)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
            {currentStep === 0 && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Progress indicator */}
          {currentStep !== 3 && (
            <View style={styles.progressContainer}>
              {[0, 1, 2].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.progressStep,
                    currentStep >= step && styles.progressStepActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Content */}
          {renderCurrentStep()}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme) => StyleSheet.create({
  embeddedContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  embeddedContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '100%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  progressStepActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  stepContainer: {
    flex: 1,
  },
  planSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 20,
    marginTop: 10,
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planNameLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  planPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 2,
  },
  planPeriodLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  featuresList: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
  },
  stepContainerContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 24,
  },
  planSummary: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  planSummaryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  planSummaryPrice: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  planPriceOriginal: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  planPriceDiscount: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  planPricePeriod: {
    color: theme.colors.text.secondary,
  },
  paymentMethods: {
    gap: 12,
    marginBottom: 24,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: theme.colors.primary,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stripeIcon: {
    fontSize: 24,
  },
  paypalIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0070BA',
  },
  mobileIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  paymentMethodText: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  autoRenewalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  autoRenewalText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  cardInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardRowItem: {
    flex: 1,
  },
  stripeCardField: {
    width: '100%',
    height: 50,
    marginVertical: 8,
  },
  webviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  webviewCloseButton: {
    padding: 8,
  },
  webview: {
    flex: 1,
    width: '100%',
  },
  confirmationCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmationLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  planHeaderLeft: {
    flex: 1,
  },
  planHeaderRight: {
    alignItems: 'flex-end',
  },
  planNameLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  planId: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceOriginal: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  priceDiscount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  priceStandard: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  pricePeriod: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  startDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  startDateTextContainer: {
    flex: 1,
  },
  startDateLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  startDateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoMessageText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 4,
  },
  companionModeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  companionModeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  companionModeMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  countryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  countryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  countryButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight || '#E3F2FD',
  },
  countryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  countryButtonTextActive: {
    color: theme.colors.primary,
  },
  providerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  providerButton: {
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  providerButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight || '#E3F2FD',
  },
  providerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  providerButtonTextActive: {
    color: theme.colors.primary,
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  currencyButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  currencyButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight || '#E3F2FD',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  currencyButtonTextActive: {
    color: theme.colors.primary,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 6,
  },
  // Styles pour les dropdowns
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    marginTop: 8,
  },
  dropdownButtonDisabled: {
    opacity: 0.5,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  dropdownButtonTextPlaceholder: {
    color: theme.colors.text.secondary,
  },
  // Styles pour l'input téléphone en deux parties
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  phonePrefixContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 56,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  // Styles pour les modals de picker
  pickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  exchangeRateText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primaryLight || '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  transactionInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  paymentDetailsCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  paymentDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  paymentDetailLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  paymentDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});

