import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { WebView } from 'react-native-webview';
import SubscriptionApi from '../services/subscriptionApi';
import { theme } from '../constants/theme';

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
  const { confirmPayment } = useStripe();

  // États du flux
  const [currentStep, setCurrentStep] = useState(0); // 0: confirmation abonnement, 1: méthode, 2: infos, 3: traitement, 4: résultat
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe'); // 'stripe' ou 'paypal'
  const [autoRenewal, setAutoRenewal] = useState(true);
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

  // Réinitialiser les états quand le modal s'ouvre
  useEffect(() => {
    if (visible && plan) {
      // Plan data available
      resetFlow();
      // Calculer la date de début de l'abonnement (immédiatement)
      const startDate = new Date();
      setSubscriptionStartDate(startDate);
    } else if (visible && !plan) {
    }
  }, [visible, plan]);

  const resetFlow = () => {
    setCurrentStep(0); // Commencer à l'étape 0 (confirmation)
    setSelectedPaymentMethod('stripe');
    setAutoRenewal(true);
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
  };

  /**
   * Vérifier si le plan est gratuit
   */
  const isFreePlan = plan && (plan.price === 0 || plan.isFree || plan.name?.toLowerCase().includes('free'));

  /**
   * Étape 0 : Confirmation de l'abonnement
   * Pour les plans gratuits : activation directe
   * Pour les plans payants : passer à la sélection de méthode de paiement
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

    // Pour les plans payants, passer à la sélection de la méthode de paiement
    if (!isFreePlan) {
      setCurrentStep(1);
      return;
    }

    // Pour les plans gratuits : activation directe (pas de steps)
    try {
      setProcessing(true);
      
      const subscriptionData = await SubscriptionApi.activateFreeTrial(plan.id);
      
      
      setSuccess(true);
      setCurrentStep(4);
      
      if (onSuccess) {
        onSuccess({
          planId: plan.id,
          paymentMethod: 'free',
          subscription: subscriptionData,
        });
      }
    } catch (error: any) {
      // Vérifier si l'erreur indique qu'un abonnement existe déjà
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'activation de l\'abonnement gratuit';
      const errorCode = error.response?.data?.code || error.response?.status;
      
      // Détecter si l'utilisateur a déjà un abonnement actif
      const hasExistingSubscription = 
        errorMessage?.toLowerCase().includes('déjà un abonnement') ||
        errorMessage?.toLowerCase().includes('already have a subscription') ||
        errorMessage?.toLowerCase().includes('subscription already exists') ||
        errorMessage?.toLowerCase().includes('abonnement actif') ||
        errorMessage?.toLowerCase().includes('active subscription') ||
        errorCode === 409 || // Conflict
        error.response?.status === 409;

      if (hasExistingSubscription) {
        // Afficher un message informatif au lieu d'une erreur
        setError(null);
        setSuccess(true);
        setCurrentStep(4);
        
        Toast.show({
          type: 'info',
          text1: 'Abonnement existant',
          text2: 'Vous possédez déjà un abonnement actif. Vous pouvez le gérer depuis votre profil.',
          visibilityTime: 4000,
        });
        
        if (onSuccess) {
          onSuccess({
            planId: plan.id,
            paymentMethod: 'free',
            subscription: null,
            hasExistingSubscription: true,
          });
        }
      } else {
        setError(errorMessage);
        setCurrentStep(4);
        
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: errorMessage,
        });
      }
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
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la session de paiement';
        const errorCode = error.response?.data?.code || error.response?.status;
        
        // Détecter si l'utilisateur a déjà un abonnement actif
        const hasExistingSubscription = 
          errorMessage?.toLowerCase().includes('déjà un abonnement') ||
          errorMessage?.toLowerCase().includes('already have a subscription') ||
          errorMessage?.toLowerCase().includes('subscription already exists') ||
          errorMessage?.toLowerCase().includes('abonnement actif') ||
          errorMessage?.toLowerCase().includes('active subscription') ||
          errorCode === 409 ||
          error.response?.status === 409;

        if (hasExistingSubscription) {
          // Afficher un message informatif au lieu d'une erreur
          setError(null);
          setSuccess(true);
          setCurrentStep(4);
          
          Toast.show({
            type: 'info',
            text1: 'Abonnement existant',
            text2: 'Vous possédez déjà un abonnement actif. Vous pouvez le gérer depuis votre profil.',
            visibilityTime: 4000,
          });
          
          if (onSuccess) {
            onSuccess({
              planId: plan.id,
              paymentMethod: selectedPaymentMethod,
              subscription: null,
              hasExistingSubscription: true,
            });
          }
        } else {
          setError(errorMessage);
          setCurrentStep(4);
          
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: errorMessage,
          });
        }
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
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la commande PayPal';
        const errorCode = error.response?.data?.code || error.response?.status;
        
        // Détecter si l'utilisateur a déjà un abonnement actif
        const hasExistingSubscription = 
          errorMessage?.toLowerCase().includes('déjà un abonnement') ||
          errorMessage?.toLowerCase().includes('already have a subscription') ||
          errorMessage?.toLowerCase().includes('subscription already exists') ||
          errorMessage?.toLowerCase().includes('abonnement actif') ||
          errorMessage?.toLowerCase().includes('active subscription') ||
          errorCode === 409 ||
          error.response?.status === 409;

        if (hasExistingSubscription) {
          // Afficher un message informatif au lieu d'une erreur
          setError(null);
          setSuccess(true);
          setCurrentStep(4);
          
          Toast.show({
            type: 'info',
            text1: 'Abonnement existant',
            text2: 'Vous possédez déjà un abonnement actif. Vous pouvez le gérer depuis votre profil.',
            visibilityTime: 4000,
          });
          
          if (onSuccess) {
            onSuccess({
              planId: plan.id,
              paymentMethod: selectedPaymentMethod,
              subscription: null,
              hasExistingSubscription: true,
            });
          }
        } else {
          setError(errorMessage);
          setCurrentStep(4);
          
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: errorMessage,
          });
        }
      } finally {
        setProcessing(false);
      }
    } else {
      // Par défaut, passer à l'étape 2
      setCurrentStep(2);
    }
  };

  /**
   * Étape 2 : Saisie des informations de paiement
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
        setCurrentStep(4);
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
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la commande PayPal';
        const errorCode = error.response?.data?.code || error.response?.status;
        
        // Détecter si l'utilisateur a déjà un abonnement actif
        const hasExistingSubscription = 
          errorMessage?.toLowerCase().includes('déjà un abonnement') ||
          errorMessage?.toLowerCase().includes('already have a subscription') ||
          errorMessage?.toLowerCase().includes('subscription already exists') ||
          errorMessage?.toLowerCase().includes('abonnement actif') ||
          errorMessage?.toLowerCase().includes('active subscription') ||
          errorCode === 409 ||
          error.response?.status === 409;

        if (hasExistingSubscription) {
          // Afficher un message informatif au lieu d'une erreur
          setError(null);
          setSuccess(true);
          setCurrentStep(4);
          
          Toast.show({
            type: 'info',
            text1: 'Abonnement existant',
            text2: 'Vous possédez déjà un abonnement actif. Vous pouvez le gérer depuis votre profil.',
            visibilityTime: 4000,
          });
          
          if (onSuccess) {
            onSuccess({
              planId: plan.id,
              paymentMethod: selectedPaymentMethod,
              subscription: null,
              hasExistingSubscription: true,
            });
          }
        } else {
          setError(errorMessage);
          setCurrentStep(4);
          
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: errorMessage,
          });
        }
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
      setCurrentStep(4);
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

        
        // Utiliser le SDK Stripe pour confirmer le paiement
        const { error: stripeError, paymentIntent } = await confirmPayment(stripeClientSecret, {
          paymentMethodType: 'Card',
        });

        if (stripeError) {
          throw new Error(stripeError.message || 'Erreur lors de la confirmation du paiement Stripe');
        }

        if (!paymentIntent) {
          throw new Error('Aucune information de paiement retournée par Stripe');
        }

        
        // Envoyer les données au backend pour finaliser l'abonnement
        const paymentData = {
          sessionId: stripeSessionId,
          clientSecret: stripeClientSecret,
          paymentIntentId: paymentIntent.id,
          paymentMethodId: paymentIntent.paymentMethodId,
        };

        subscriptionData = await SubscriptionApi.confirmStripePayment(paymentData);
        
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
      setCurrentStep(4);
      
      if (onSuccess) {
        onSuccess({
          planId: plan.id,
          paymentMethod: selectedPaymentMethod,
          sessionId: stripeSessionId || null,
          orderId: paypalOrderId || null,
          subscription: subscriptionData,
        });
      }
    } catch (error: any) {
      // Vérifier si l'erreur indique qu'un abonnement existe déjà
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du traitement du paiement';
      const errorCode = error.response?.data?.code || error.response?.status;
      
      // Détecter si l'utilisateur a déjà un abonnement actif
      const hasExistingSubscription = 
        errorMessage?.toLowerCase().includes('déjà un abonnement') ||
        errorMessage?.toLowerCase().includes('already have a subscription') ||
        errorMessage?.toLowerCase().includes('subscription already exists') ||
        errorMessage?.toLowerCase().includes('abonnement actif') ||
        errorMessage?.toLowerCase().includes('active subscription') ||
        errorCode === 409 || // Conflict
        error.response?.status === 409;

      if (hasExistingSubscription) {
        // Afficher un message informatif au lieu d'une erreur
        setError(null);
        setSuccess(true);
        setCurrentStep(4);
        
        Toast.show({
          type: 'info',
          text1: 'Abonnement existant',
          text2: 'Vous possédez déjà un abonnement actif. Vous pouvez le gérer depuis votre profil.',
          visibilityTime: 4000,
        });
        
        if (onSuccess) {
          onSuccess({
            planId: plan.id,
            paymentMethod: selectedPaymentMethod,
            sessionId: stripeSessionId || null,
            orderId: paypalOrderId || null,
            subscription: null,
            hasExistingSubscription: true,
          });
        }
      } else {
        setError(errorMessage);
        setCurrentStep(4);
        
        Toast.show({
          type: 'error',
          text1: 'Erreur de paiement',
          text2: errorMessage,
        });
      }
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

    const formattedDate = subscriptionStartDate 
      ? subscriptionStartDate.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Date().toLocaleDateString('fr-FR');

    // Pour les plans gratuits, afficher une interface simplifiée
    if (isFreePlan) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepSubtitle}>Activez votre abonnement gratuit</Text>

          <View style={styles.confirmationCard}>
            <View style={styles.planHeader}>
              <View style={styles.planHeaderLeft}>
                <Text style={styles.planNameLarge}>{plan?.name || 'Abonnement gratuit'}</Text>
                <Text style={styles.planId}>ID: {plan?.id ? plan.id.substring(0, 8) + '...' : 'N/A'}</Text>
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
                  {subscriptionStartDate 
                    ? subscriptionStartDate.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : new Date().toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>

            <View style={styles.infoMessage}>
              <Ionicons name="information-circle" size={20} color={theme.colors.info} />
              <Text style={styles.infoMessageText}>
                Votre abonnement gratuit sera activé immédiatement.
              </Text>
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

    // Pour les plans payants, afficher l'interface normale avec "Suivant"
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepSubtitle}>Vérifiez les détails de votre abonnement</Text>

        <View style={styles.confirmationCard}>
          <View style={styles.planHeader}>
            <View style={styles.planHeaderLeft}>
              <Text style={styles.planNameLarge}>{plan?.name || 'Abonnement'}</Text>
              <Text style={styles.planId}>ID: {plan?.id ? plan.id.substring(0, 8) + '...' : 'N/A'}</Text>
            </View>
            <View style={styles.planHeaderRight}>
              {plan?.discountPrice && plan.discountPrice < plan.price ? (
                <View style={styles.priceContainer}>
                  <Text style={styles.priceOriginal}>€{plan.price}</Text>
                  <Text style={styles.priceDiscount}>€{plan.discountPrice}</Text>
                </View>
              ) : (
                <Text style={styles.priceStandard}>€{plan?.price || 0}</Text>
              )}
              <Text style={styles.pricePeriod}>/ {SubscriptionApi.getBillingPeriod(plan?.duration || 30)}</Text>
            </View>
          </View>

          <View style={styles.startDateInfo}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <View style={styles.startDateTextContainer}>
              <Text style={styles.startDateLabel}>Date de début</Text>
              <Text style={styles.startDateValue}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.infoMessage}>
            <Ionicons name="information-circle" size={20} color={theme.colors.info} />
            <Text style={styles.infoMessageText}>
              Votre abonnement commencera immédiatement après le paiement.
            </Text>
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

  const renderStep1_MethodSelection = () => (
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
                      setCurrentStep(4);
                      
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
                      setCurrentStep(4);
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
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: theme.colors.background.secondary,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 8,
              textColor: theme.colors.text.primary,
              fontSize: 16,
              placeholderColor: theme.colors.text.secondary,
            }}
            style={styles.stripeCardField}
          />
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
    if (success) {
      return (
        <View style={styles.stepContainer}>
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.resultTitle}>Paiement réussi !</Text>
            <Text style={styles.resultSubtitle}>
              Votre abonnement a été activé avec succès
            </Text>
          </View>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleCloseResult}
          >
            <Text style={styles.continueButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      );
    }

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
          onPress={handleCloseResult}
        >
          <Text style={styles.continueButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep0_SubscriptionConfirmation();
      case 1:
        return renderStep1_MethodSelection();
      case 2:
        return renderStep2_CardInput();
      case 3:
        return renderStep3_Confirmation();
      case 4:
        return renderStep4_Result();
      default:
        return renderStep0_SubscriptionConfirmation();
    }
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
            {currentStep === 0 && (isFreePlan ? 'Abonnement gratuit' : 'Confirmer l\'abonnement')}
            {currentStep === 1 && 'Méthode de paiement'}
            {currentStep === 2 && 'Informations de paiement'}
            {currentStep === 3 && 'Confirmation'}
            {currentStep === 4 && (success ? 'Succès' : 'Erreur')}
          </Text>
          {currentStep !== 4 && currentStep !== 0 && (
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
        {currentStep !== 4 && !isFreePlan && (
          <View style={styles.progressContainer}>
            {[0, 1, 2, 3].map((step) => (
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
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              {currentStep === 0 && 'Confirmer l\'abonnement'}
              {currentStep === 1 && 'Méthode de paiement'}
              {currentStep === 2 && 'Informations de paiement'}
              {currentStep === 3 && 'Confirmation'}
              {currentStep === 4 && (success ? 'Succès' : 'Erreur')}
            </Text>
            {currentStep !== 4 && currentStep !== 0 && (
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
          {currentStep !== 4 && (
            <View style={styles.progressContainer}>
              {[0, 1, 2, 3].map((step) => (
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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
    padding: 20,
    minHeight: 400,
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
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
});

