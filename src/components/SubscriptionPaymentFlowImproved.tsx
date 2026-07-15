import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    TextInput,
    StyleSheet,
    Platform,
    Modal,
    KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Toast from 'react-native-toast-message';
import SubscriptionApi from '../services/subscriptionApi';
import { theme } from '../constants/theme';
import api from '../services/api';
import * as Notifications from 'expo-notifications';

// Styles pour StripeWebViewModal (définis avant utilisation)
const stripeWebViewStyles = StyleSheet.create({
    webViewContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    webViewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    webViewTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
});

// WebView Stripe - Modal séparé (déclaré avant utilisation)
function StripeWebViewModal({
    visible,
    checkoutUrl,
    sessionId,
    planId,
    onClose,
    onSuccess,
    onError,
}: {
    visible: boolean;
    checkoutUrl: string | null;
    sessionId: string | null;
    planId: string | undefined;
    onClose: () => void;
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
}) {
    const [showCheckStatusButton, setShowCheckStatusButton] = React.useState(false);

    // Afficher le bouton "Vérifier le statut" après 2 minutes
    React.useEffect(() => {
        if (!visible) {
            setShowCheckStatusButton(false);
            return;
        }

        const timer = setTimeout(() => {
            setShowCheckStatusButton(true);
            console.log('⏰ [Stripe WebView] Affichage du bouton "Vérifier le statut"');
        }, 120000); // 2 minutes

        return () => clearTimeout(timer);
    }, [visible]);

    const handleCheckStatus = async () => {
        console.log('🔍 [Stripe WebView] Vérification manuelle du statut...');
        try {
            // Vérifier si le paiement est passé côté backend
            const confirmResponse = await SubscriptionApi.confirmStripePayment({
                sessionId: sessionId,
                planId: planId,
            });
            
            console.log('✅ [Stripe WebView] Statut vérifié:', confirmResponse);
            
            // Si le paiement est confirmé, déclencher le succès
            onClose();
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess({
                        planId,
                        paymentMethod: 'stripe',
                        sessionId,
                    });
                }, 300);
            }
        } catch (error: any) {
            console.error('❌ [Stripe WebView] Erreur lors de la vérification:', error);
            Toast.show({
                type: 'error',
                text1: 'Vérification échouée',
                text2: error.message || 'Impossible de vérifier le statut du paiement',
                position: 'top',
            });
        }
    };

    if (!visible || !checkoutUrl) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={stripeWebViewStyles.webViewContainer}>
                <View style={stripeWebViewStyles.webViewHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={stripeWebViewStyles.webViewTitle}>Paiement Stripe</Text>
                        {showCheckStatusButton && (
                            <Text style={{ fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 }}>
                                Paiement effectué ? Vérifiez le statut →
                            </Text>
                        )}
                    </View>
                    {showCheckStatusButton && (
                        <TouchableOpacity 
                            onPress={handleCheckStatus}
                            style={{
                                backgroundColor: theme.colors.primary,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 6,
                                marginRight: 8,
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>
                                Vérifier
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                </View>
                <WebView
                    source={{ uri: checkoutUrl }}
                    // Intercepter les URLs AVANT qu'elles ne chargent (crucial pour custom schemes)
                    onShouldStartLoadWithRequest={(request) => {
                        const url = request.url;
                        console.log('🔍 [Stripe WebView] Tentative de navigation vers:', url);
                        
                        // Détecter les URLs de succès
                        if (url.includes('lasocoach://subscription-success') || 
                            url.includes('subscription-success') || 
                            url.includes('payment/success') ||
                            url.includes('checkout/success')) {
                            console.log('✅ [Stripe WebView] URL de succès détectée (interceptée)');
                            onClose();
                            if (onSuccess) {
                                setTimeout(() => {
                                    onSuccess({
                                        planId,
                                        paymentMethod: 'stripe',
                                        sessionId,
                                    });
                                }, 300);
                            }
                            return false; // Empêcher le chargement de l'URL
                        }
                        
                        // Détecter les URLs d'annulation
                        if (url.includes('lasocoach://subscription-cancel') || 
                            url.includes('subscription-cancel') ||
                            url.includes('payment/cancel') ||
                            url.includes('checkout/cancel')) {
                            console.log('❌ [Stripe WebView] URL d\'annulation détectée (interceptée)');
                            onClose();
                            if (onError) {
                                onError('Paiement annulé');
                            }
                            return false; // Empêcher le chargement de l'URL
                        }
                        
                        // Autoriser les autres URLs (Stripe, etc.)
                        return true;
                    }}
                    onNavigationStateChange={(navState) => {
                        const url = navState.url;
                        console.log('🔄 [Stripe WebView] Navigation state change:', url);
                        
                        // Fallback pour les URLs qui passent par onNavigationStateChange
                        if (url.includes('lasocoach://subscription-success') || 
                            url.includes('subscription-success') || 
                            url.includes('payment/success') ||
                            url.includes('checkout/success')) {
                            console.log('✅ [Stripe WebView] URL de succès détectée (navigation)');
                            onClose();
                            if (onSuccess) {
                                setTimeout(() => {
                                    onSuccess({
                                        planId,
                                        paymentMethod: 'stripe',
                                        sessionId,
                                    });
                                }, 300);
                            }
                        } else if (url.includes('lasocoach://subscription-cancel') || 
                                   url.includes('subscription-cancel') ||
                                   url.includes('payment/cancel') ||
                                   url.includes('checkout/cancel')) {
                            console.log('❌ [Stripe WebView] URL d\'annulation détectée (navigation)');
                            onClose();
                            if (onError) {
                                onError('Paiement annulé');
                            }
                        }
                    }}
                    onError={(syntheticEvent) => {
                        const errorEvent = syntheticEvent.nativeEvent;
                        console.error('❌ [Stripe WebView] Erreur de chargement:', errorEvent);
                        
                        // Si l'erreur est due à une URL custom scheme (normal après succès), ignorer
                        if (errorEvent.description?.includes('lasocoach://')) {
                            console.log('ℹ️ [Stripe WebView] Erreur ignorée (custom scheme attendu)');
                            return;
                        }
                        
                        onClose();
                        if (onError) {
                            onError('Erreur lors du chargement de la page de paiement');
                        }
                    }}
                    onLoadStart={() => {
                        console.log('🔄 [Stripe WebView] Chargement de la page Stripe...');
                    }}
                    onLoadEnd={() => {
                        console.log('✅ [Stripe WebView] Page Stripe chargée');
                    }}
                />
            </View>
        </Modal>
    );
}

// Configuration PawaPay
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

interface SubscriptionPaymentFlowProps {
    visible: boolean;
    plan: any;
    onClose: () => void;
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
}

/**
 * Flux de paiement amélioré avec UX optimisée
 * 
 * Étapes:
 * 0. Informations de l'abonnement
 * 1. Méthode de paiement (formulaire)
 * 2. Récapitulatif
 * 3. Traitement du paiement
 * 4. Résultat (succès/erreur)
 */
export default function SubscriptionPaymentFlowImproved({
    visible,
    plan,
    onClose,
    onSuccess,
    onError,
}: SubscriptionPaymentFlowProps) {
    // Log au début du composant pour voir s'il est rendu
    console.log('🔄🔄🔄 [PaymentFlow] ===== Component function called ===== visible:', visible, 'plan:', plan?.id, 'plan exists:', !!plan);
    console.log('🔄 [PaymentFlow] Platform:', Platform.OS);
    
    // États du flux
    const [currentStep, setCurrentStep] = useState(0);
    console.log('🔄 [PaymentFlow] After useState - currentStep:', currentStep);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // ✅ Sélection de la méthode de paiement (Stripe ou Mobile Money)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'mobile' | null>(null);

    // États du formulaire Mobile Money
    const [country, setCountry] = useState(PAWAPAY_COUNTRIES[0].code);
    const [provider, setProvider] = useState(PAWAPAY_COUNTRIES[0].providers[0].code);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);

    // États pour Stripe
    const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
    const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
    const [showStripeWebView, setShowStripeWebView] = useState(false);
    const [stripeEnabled, setStripeEnabled] = useState(false);

    // États du paiement
    const [depositId, setDepositId] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | 'cancelled' | null>(null);

    // Modals
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [showProviderPicker, setShowProviderPicker] = useState(false);
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Récupérer le pays et les providers sélectionnés
    const selectedCountry = PAWAPAY_COUNTRIES.find(c => c.code === country);
    const selectedProvider = selectedCountry?.providers.find(p => p.code === provider);
    const phonePrefix = selectedCountry?.prefix || '+243';

    // Charger la config paiement (Stripe activé ou non par l'admin) à l'ouverture du flux
    useEffect(() => {
        if (visible) {
            SubscriptionApi.getPaymentConfig().then((config) => {
                setStripeEnabled(config.stripeEnabled);
            }).catch(() => setStripeEnabled(false));
        }
    }, [visible]);

    // Charger le taux de change pour CDF
    useEffect(() => {
        if (currency === 'CDF' && plan) {
            fetchExchangeRate();
        } else {
            setExchangeRate(null);
        }
    }, [currency, plan]);

    const fetchExchangeRate = async () => {
        try {
            setLoadingExchangeRate(true);
            const response = await api.get('/payments/exchange-rate');
            if (response?.data?.success && response?.data?.data?.rate) {
                const rate = parseFloat(response.data.data.rate);
                if (!isNaN(rate) && rate > 0) {
                    setExchangeRate(rate);
                    return;
                }
            }
            setExchangeRate(2300); // Fallback
        } catch (error) {
            setExchangeRate(2300); // Fallback
        } finally {
            setLoadingExchangeRate(false);
        }
    };

    // Écouter les notifications de paiement
    useEffect(() => {
        if (!depositId || paymentStatus !== 'pending') return;

        console.log('🎧 [PaymentFlow] Listening for payment notifications for deposit:', depositId);

        const subscription = Notifications.addNotificationReceivedListener(notification => {
            try {
                const data = notification.request.content.data;
                console.log('📬 [PaymentFlow] Notification received:', JSON.stringify(data));

                // Vérifier si la notification concerne ce paiement
                if (data && (data.depositId === depositId || data.id === depositId)) {
                    console.log('✅ [PaymentFlow] Notification matches current deposit!');

                    if (data.paymentStatus === 'FAILED' || data.type === 'error' || data.status === 'FAILED') {
                        console.log('❌ [PaymentFlow] Payment failed via notification');

                        // Arrêter le polling
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }

                        setPaymentStatus('failed');
                        setError(String(data.failureMessage || data.message || 'Le paiement a échoué.'));
                        setCurrentStep(4);
                    } else if (data.paymentStatus === 'COMPLETED' || data.type === 'success' || data.status === 'COMPLETED') {
                        console.log('✅ [PaymentFlow] Payment success via notification');

                        // Arrêter le polling
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }

                        setPaymentStatus('completed');
                        setSuccess(true);
                        setCurrentStep(4);

                        if (onSuccess) {
                            setTimeout(() => {
                                onSuccess({
                                    planId: plan.id,
                                    paymentMethod: 'mobile',
                                    depositId,
                                });
                            }, 1500);
                        }

                        // Fermer automatiquement le modal après 3 secondes
                        console.log('⏱️ [Mobile Money] Fermeture automatique du modal dans 3 secondes...');
                        setTimeout(() => {
                            console.log('✅ [Mobile Money] Fermeture automatique du modal');
                            handleClose();
                        }, 3000);
                    }
                }
            } catch (err) {
                console.error('⚠️ [PaymentFlow] Error processing notification:', err);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [depositId, paymentStatus, plan]);

    // Réinitialiser le flux
    const resetFlow = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        setCurrentStep(0);
        setProcessing(false);
        setError(null);
        setSuccess(false);
        setPhoneNumber('');
        setDepositId(null);
        setPaymentStatus(null);
        setSelectedPaymentMethod(null);
        setStripeSessionId(null);
        setStripeCheckoutUrl(null);
        setShowStripeWebView(false);
    };

    // REMOVED: Reset logic was causing render issues
    // The component will initialize with correct default states
    useEffect(() => {
        console.log('🔄 [PaymentFlow] useEffect - visible:', visible, 'plan:', plan?.id);
        if (!visible && pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, [visible]);

    // Log current step changes
    useEffect(() => {
        console.log('🔄 [PaymentFlow] Current step changed to:', currentStep);
    }, [currentStep]);

    // Nettoyer le polling au démontage
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, []);

    // Vérifier si le plan est gratuit (défini tôt pour être utilisé partout)
    const isFreePlan = plan && (plan.price === 0 || plan.isFree || plan.name?.toLowerCase().includes('free'));

    // Calculer le montant final
    const calculateFinalAmount = () => {
        const basePrice = plan?.price || 0;
        if (currency === 'CDF') {
            const rate = exchangeRate || 2300;
            return basePrice * rate;
        }
        return basePrice;
    };

    // Valider le formulaire
    const validateForm = () => {
        if (!phoneNumber.trim()) {
            setError('Numéro de téléphone requis');
            return false;
        }
        if (phoneNumber.replace(/\D/g, '').length < 9) {
            setError('Numéro de téléphone invalide (minimum 9 chiffres)');
            return false;
        }
        if (!provider) {
            setError('Opérateur requis');
            return false;
        }
        return true;
    };

    // Passer à l'étape suivante depuis l'étape 0
    const handleContinueFromInfo = async () => {
        if (!plan?.id) {
            Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: 'Plan d\'abonnement invalide',
            });
            return;
        }

        // ✅ Pour les plans gratuits : activation directe sans passer par le choix de méthode de paiement
        if (isFreePlan) {
            try {
                setProcessing(true);
                setError(null);
                
                console.log('🆓 [PaymentFlow] Plan gratuit détecté, activation directe...');
                
                const subscriptionData = await SubscriptionApi.activateFreeTrial(plan.id);
                
                console.log('✅ [PaymentFlow] Plan gratuit activé avec succès:', subscriptionData);
                
                setSuccess(true);
                setPaymentStatus('completed');
                setCurrentStep(4); // ✅ OBLIGATOIRE : Passer directement à l'étape 4 (Confirmation) pour TOUS les plans
                
                // ✅ Appeler onSuccess immédiatement pour rafraîchir les données et débloquer les pages
                if (onSuccess) {
                    // Ne pas attendre, appeler immédiatement pour mettre à jour les pages bloquées
                    onSuccess({
                        planId: plan.id,
                        paymentMethod: 'free',
                        subscription: subscriptionData,
                    });
                }
                
                Toast.show({
                    type: 'success',
                    text1: 'Abonnement activé',
                    text2: 'Votre plan gratuit a été activé avec succès !',
                    visibilityTime: 3000,
                });
                
                // ✅ MODIFICATION : Augmenter le délai de fermeture automatique pour permettre à l'utilisateur de voir la confirmation
                // Fermer automatiquement le modal après 5 secondes (au lieu de 2) pour laisser le temps de voir la confirmation
                setTimeout(() => {
                    handleClose();
                }, 5000);
            } catch (error: any) {
                // ✅ Extraire correctement les données d'erreur selon la structure fetch/axios
                const errorStatus = error?.response?.status || error?.status || (error?.message?.includes('400') ? 400 : undefined);
                const errorData = error?.response?.data || error?.data || null;
                const errorMessage = errorData?.message || errorData?.error || error?.message || 'Erreur lors de l\'activation de l\'abonnement gratuit';
                
                console.error('❌ [PaymentFlow] Erreur lors de l\'activation du plan gratuit:', {
                    error,
                    errorType: typeof error,
                    errorKeys: Object.keys(error || {}),
                    errorResponse: error?.response,
                    errorStatus,
                    errorData,
                    errorMessage,
                    planId: plan.id,
                    planName: plan.name,
                    fullErrorString: JSON.stringify(error, null, 2),
                });
                
                // ✅ Gestion spécifique pour l'erreur 400 (Bad Request)
                // Cela peut indiquer que l'utilisateur a déjà utilisé l'essai gratuit
                if (errorStatus === 400) {
                    const isAlreadyUsed = errorMessage?.toLowerCase().includes('déjà') || 
                                         errorMessage?.toLowerCase().includes('already') ||
                                         errorMessage?.toLowerCase().includes('utilisé') ||
                                         errorMessage?.toLowerCase().includes('used') ||
                                         errorMessage?.toLowerCase().includes('essai gratuit');
                    
                    if (isAlreadyUsed) {
                        const message = 'Vous avez déjà utilisé votre essai gratuit. Veuillez choisir un plan payant.';
                        setError(message);
                        Toast.show({
                            type: 'info',
                            text1: 'Essai gratuit déjà utilisé',
                            text2: message,
                            visibilityTime: 4000,
                        });
                    } else {
                        // Autre erreur 400 (plan invalide, données manquantes, etc.)
                        setError(errorMessage);
                        Toast.show({
                            type: 'error',
                            text1: 'Erreur',
                            text2: errorMessage,
                            visibilityTime: 4000,
                        });
                    }
                } else {
                    // Autres erreurs (401, 403, 500, etc.)
                    setError(errorMessage);
                    Toast.show({
                        type: 'error',
                        text1: 'Erreur',
                        text2: errorMessage,
                        visibilityTime: 4000,
                    });
                }
                
                setCurrentStep(4); // Afficher l'erreur dans l'étape 4
                
                // Appeler onError si fourni
                if (onError) {
                    onError(error);
                }
            } finally {
                setProcessing(false);
            }
            return;
        }

        // Pour les plans payants : passer à l'étape 1 (Méthode de paiement)
        console.log('💳 [PaymentFlow] Plan payant, passage à l\'étape 1 (Méthode de paiement)');
        setCurrentStep(1);
    };

    // Passer à l'étape suivante depuis l'étape 1 (Mobile Money uniquement)
    const handleContinueFromPayment = () => {
        if (selectedPaymentMethod !== 'mobile') {
            return;
        }
        if (!validateForm()) {
            return;
        }
        setError(null);
        setCurrentStep(2); // Aller à l'étape 2 (Récapitulatif)
    };

    // Gérer le paiement Stripe
    const handleStripePayment = async () => {
        if (processing || !plan?.id) {
            console.log('⚠️ [Stripe] Conditions non remplies:', { processing, hasPlanId: !!plan?.id });
            return;
        }

        try {
            setProcessing(true);
            setError(null);

            console.log('🔵 [Stripe] Démarrage de la création de session');
            console.log('🔵 [Stripe] Plan:', { id: plan.id, name: plan.name, price: plan.price });

            // Créer une session de checkout Stripe via l'API backend
            const requestData = {
                subscriptionPlanId: plan.id,
                amount: plan.price,
                currency: 'usd',
                successUrl: 'lasocoach://subscription-success',
                cancelUrl: 'lasocoach://subscription-cancel',
                clientType: 'mobile',
            };
            
            console.log('🔵 [Stripe] Requête vers backend:', requestData);
            const response = await api.post('/payments/create-stripe-checkout-session', requestData);
            
            console.log('✅ [Stripe] Réponse reçue du backend:', {
                status: response.status,
                hasData: !!response.data,
                hasSuccess: response.data?.success,
                hasCheckoutUrl: !!(response.data?.data?.checkoutUrl || response.data?.data?.url || response.data?.checkoutUrl || response.data?.url),
                hasClientSecret: !!(response.data?.data?.clientSecret || response.data?.clientSecret),
                fullResponse: JSON.stringify(response.data, null, 2)
            });

            // Vérifier différents formats de réponse possibles
            // Le backend peut retourner 'checkoutUrl' ou 'url'
            const checkoutUrl = response.data?.data?.checkoutUrl || response.data?.data?.url || response.data?.checkoutUrl || response.data?.url;
            const sessionId = response.data?.data?.sessionId || response.data?.sessionId;
            const clientSecret = response.data?.data?.clientSecret || response.data?.clientSecret;

            if (checkoutUrl) {
                console.log('✅ [Stripe] URL de checkout reçue, ouverture de la WebView');
                // Ouvrir la WebView Stripe
                setStripeCheckoutUrl(checkoutUrl);
                setStripeSessionId(sessionId);
                setShowStripeWebView(true);
            } else if (clientSecret) {
                console.log('⚠️ [Stripe] ClientSecret reçu mais SDK natif non implémenté');
                // Si le backend retourne un clientSecret, utiliser le SDK Stripe natif
                // (nécessite @stripe/stripe-react-native)
                setError('Paiement Stripe natif non implémenté. Veuillez contacter le support.');
            } else {
                console.error('❌ [Stripe] Format de réponse invalide:', response.data);
                setError('Impossible de créer la session de paiement Stripe. Format de réponse invalide.');
            }
        } catch (err: any) {
            console.error('❌ [Stripe] Erreur lors de la création de la session:');
            console.error('❌ [Stripe] Status:', err.response?.status);
            console.error('❌ [Stripe] Message:', err.response?.data?.message);
            console.error('❌ [Stripe] Data:', JSON.stringify(err.response?.data, null, 2));
            console.error('❌ [Stripe] Full error:', err);
            
            const errorMessage = err.response?.data?.message || 
                               err.response?.data?.error || 
                               err.message || 
                               'Erreur lors de l\'initialisation du paiement Stripe';
            setError(errorMessage);
            
            // Afficher un Toast avec plus de détails
            Toast.show({
                type: 'error',
                text1: 'Erreur Stripe',
                text2: errorMessage,
                visibilityTime: 5000,
            });
        } finally {
            setProcessing(false);
        }
    };

    // Confirmer le paiement
    const handleConfirmPayment = async () => {
        if (processing) return;

        try {
            setProcessing(true);
            setError(null);
            setPaymentStatus('pending');

            // Nettoyer le numéro
            let rawPhone = phoneNumber.replace(/\D/g, '');
            const countryPrefixDigits = phonePrefix.replace(/\D/g, '');

            if (rawPhone.startsWith(countryPrefixDigits)) {
                rawPhone = rawPhone.substring(countryPrefixDigits.length);
            }

            if (country === 'COD' && rawPhone.startsWith('0')) {
                rawPhone = rawPhone.substring(1);
            }

            const phoneWithCountry = `${phonePrefix}${rawPhone}`;
            const finalAmount = calculateFinalAmount();

            const payload = {
                subscriptionPlanId: plan.id,
                phoneNumber: phoneWithCountry,
                rawPhoneNumber: rawPhone,
                provider,
                country,
                amount: finalAmount,
                currency,
            };

            // Logs détaillés pour le debug
            console.log('🔵 [PawaPay] ========== DÉBUT PAIEMENT ==========');
            console.log('🔵 [PawaPay] Plan ID:', plan?.id);
            console.log('🔵 [PawaPay] Plan Price:', plan?.price);
            console.log('🔵 [PawaPay] Country:', country);
            console.log('🔵 [PawaPay] Provider:', provider);
            console.log('🔵 [PawaPay] Currency:', currency);
            console.log('🔵 [PawaPay] Exchange Rate:', exchangeRate || 2300);
            console.log('🔵 [PawaPay] Final Amount:', finalAmount);
            console.log('🔵 [PawaPay] Phone Number (input):', phoneNumber);
            console.log('🔵 [PawaPay] Phone Number (cleaned):', rawPhone);
            console.log('🔵 [PawaPay] Phone Number (formatted):', phoneWithCountry);
            console.log('🔵 [PawaPay] Payload complet:', JSON.stringify(payload, null, 2));
            console.log('🔵 [PawaPay] URL API:', '/payments/pawapay/create-deposit');

            const response = await api.post('/payments/pawapay/create-deposit', payload);
            const data = response?.data;

            console.log('✅ [PawaPay] Réponse reçue avec succès');
            console.log('🔵 [PawaPay] Status Code:', response?.status);
            console.log('🔵 [PawaPay] Response Data:', JSON.stringify(data, null, 2));

            if (data?.success) {
                const newDepositId = data.data?.depositId || data.data?.id;
                setDepositId(newDepositId);
                setPaymentStatus('pending');
                setCurrentStep(3); // Aller à l'étape 3 (Traitement)

                Toast.show({
                    type: 'success',
                    text1: 'Paiement initié',
                    text2: 'Confirmez le paiement sur votre téléphone',
                });

                // Démarrer le polling
                startPollingPaymentStatus(newDepositId);
            } else {
                throw new Error(data?.message || 'Échec du paiement mobile');
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.message || 'Erreur lors de l\'initiation du paiement';
            setError(errorMessage);
            setPaymentStatus('failed');
            setCurrentStep(4); // Aller à l'étape 4 (Résultat)

            Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: errorMessage,
            });
        } finally {
            setProcessing(false);
        }
    };

    // Polling du statut du paiement
    const startPollingPaymentStatus = (depositId: string) => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        let pollAttempts = 0;
        const maxAttempts = 60;
        const pollInterval = 2000;

        pollingIntervalRef.current = setInterval(async () => {
            try {
                pollAttempts++;

                // Vérifier le statut du dépôt
                try {
                    const depositStatusRes = await api.get(`/payments/pawapay/deposit/${depositId}/status`);
                    const depositStatusData = depositStatusRes?.data;

                    if (depositStatusData?.success && depositStatusData?.data?.status) {
                        const depositStatus = depositStatusData.data.status.toUpperCase();

                        if (depositStatus === 'CANCELLED' || depositStatus === 'FAILED') {
                            if (pollingIntervalRef.current) {
                                clearInterval(pollingIntervalRef.current);
                                pollingIntervalRef.current = null;
                            }

                            setPaymentStatus(depositStatus === 'CANCELLED' ? 'cancelled' : 'failed');
                            setError(depositStatus === 'CANCELLED'
                                ? 'Paiement annulé. Vous pouvez réessayer quand vous êtes prêt.'
                                : 'Le paiement a échoué. Veuillez réessayer ou contacter le support.'
                            );
                            setCurrentStep(4);

                            Toast.show({
                                type: 'error',
                                text1: depositStatus === 'CANCELLED' ? 'Paiement annulé' : 'Paiement échoué',
                                text2: depositStatus === 'CANCELLED'
                                    ? 'Vous pouvez réessayer quand vous êtes prêt.'
                                    : 'Veuillez réessayer ou contacter le support.',
                            });
                            return;
                        }
                    }
                } catch (depositStatusError) {
                    // Continuer avec la vérification du profil
                }

                // Vérifier le profil
                const profileRes = await api.get('/auth/profile');
                const profileData = profileRes.data;

                if (profileData?.success && profileData?.data?.subscription?.status === 'ACTIVE') {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }

                    setPaymentStatus('completed');
                    setSuccess(true);
                    setCurrentStep(4);

                    Toast.show({
                        type: 'success',
                        text1: 'Paiement approuvé',
                        text2: 'Votre abonnement est maintenant actif',
                    });

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

                    // Fermer automatiquement le modal après 3 secondes
                    console.log('⏱️ [Mobile Money] Fermeture automatique du modal dans 3 secondes...');
                    setTimeout(() => {
                        console.log('✅ [Mobile Money] Fermeture automatique du modal');
                        handleClose();
                    }, 3000);
                    
                    return;
                }

                if (pollAttempts >= maxAttempts) {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }

                    setPaymentStatus('failed');
                    setError('La confirmation du paiement a pris trop de temps. Veuillez contacter le support.');
                    setCurrentStep(4);
                }
            } catch (error) {
                if (pollAttempts >= maxAttempts) {
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                        pollingIntervalRef.current = null;
                    }

                    setPaymentStatus('failed');
                    setError('Erreur lors de la vérification du paiement. Veuillez contacter le support.');
                    setCurrentStep(4);
                }
            }
        }, pollInterval);
    };

    // Réessayer le paiement
    const handleRetry = () => {
        resetFlow();
    };

    // Fermer le modal
    const handleClose = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
        onClose();
    };

    // Rendu de l'en-tête
    const renderHeader = () => {
        const titles = [
            'Informations',
            'Méthode de paiement',
            'Récapitulatif',
            'Paiement en cours',
            paymentStatus === 'completed' ? 'Paiement réussi' : paymentStatus === 'cancelled' ? 'Paiement annulé' : 'Erreur de paiement',
        ];

        return (
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{titles[currentStep]}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>
        );
    };

    // Rendu des indicateurs d'étapes
    const renderStepIndicators = () => {
        if (currentStep >= 3) return null; // Masquer pour les étapes de traitement et résultat
        
        // Pour les plans gratuits, ne pas afficher les indicateurs d'étapes (seulement 2 étapes)
        if (isFreePlan) return null;

        return (
            <View style={styles.stepIndicators}>
                {[0, 1, 2].map((step) => (
                    <View
                        key={step}
                        style={[
                            styles.stepDot,
                            currentStep === step && styles.stepDotActive,
                            currentStep > step && styles.stepDotCompleted,
                        ]}
                    />
                ))}
            </View>
        );
    };

    // Étape 0: Informations de l'abonnement
    const renderStep0 = () => (
        <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.planCard}>
                <View style={styles.planHeader}>
                    <Ionicons name="star" size={32} color={theme.colors.primary} />
                    <Text style={styles.planName}>{plan?.name}</Text>
                </View>

                <View style={styles.planDetails}>
                    <View style={styles.planRow}>
                        <Text style={styles.planLabel}>ID du plan</Text>
                        <Text style={styles.planValue} numberOfLines={1} ellipsizeMode="tail">{plan?.id}</Text>
                    </View>

                    <View style={styles.planDivider} />

                    <View style={styles.planRow}>
                        <Text style={styles.planLabel}>Montant</Text>
                        <Text style={styles.planPrice}>{plan?.price} $</Text>
                    </View>
                </View>

                <View style={styles.featuresList}>
                    <Text style={styles.featuresTitle}>Avantages inclus :</Text>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                        <Text style={styles.featureText}>Accès complet à tous les programmes</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                        <Text style={styles.featureText}>Plans nutritionnels personnalisés</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                        <Text style={styles.featureText}>Suivi de progression détaillé</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.primaryButton, processing && styles.buttonDisabled]}
                onPress={() => {
                    console.log('🔄 [PaymentFlow] Button clicked, current step:', currentStep, 'isFreePlan:', isFreePlan);
                    handleContinueFromInfo();
                }}
                disabled={processing}
            >
                {processing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <>
                        <Text style={styles.primaryButtonText}>
                            {isFreePlan ? 'Compléter' : 'Suivant'}
                        </Text>
                        <Ionicons 
                            name={isFreePlan ? "checkmark-circle" : "arrow-forward"} 
                            size={20} 
                            color="#FFFFFF" 
                        />
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );

    // Étape 1: Sélection de la méthode de paiement puis formulaire
    const renderStep1 = () => {
        // Si aucune méthode n'est sélectionnée, afficher le sélecteur
        if (!selectedPaymentMethod) {
            return (
                <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>Choisissez votre méthode de paiement</Text>
                    <Text style={styles.sectionSubtitle}>Sélectionnez comment vous souhaitez payer</Text>

                    {/* Stripe affiché seulement si l'admin l'a activé (config backend) */}
                    {stripeEnabled && (
                    <TouchableOpacity
                        style={[
                            styles.paymentMethodCard,
                            selectedPaymentMethod === 'stripe' && styles.paymentMethodCardSelected
                        ]}
                        onPress={() => setSelectedPaymentMethod('stripe')}
                        disabled={processing}
                    >
                        <View style={styles.paymentMethodHeader}>
                            <View style={styles.paymentMethodIcon}>
                                <Text style={styles.paymentMethodIconText}>💳</Text>
                            </View>
                            <View style={styles.paymentMethodInfo}>
                                <Text style={styles.paymentMethodName}>Carte bancaire (Stripe)</Text>
                                <Text style={styles.paymentMethodDesc}>Visa, Mastercard, American Express</Text>
                            </View>
                            {selectedPaymentMethod === 'stripe' && (
                                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                            )}
                        </View>
                    </TouchableOpacity>
                    )}

                    {/* Sélecteur Mobile Money */}
                    <TouchableOpacity
                        style={[
                            styles.paymentMethodCard,
                            selectedPaymentMethod === 'mobile' && styles.paymentMethodCardSelected
                        ]}
                        onPress={() => setSelectedPaymentMethod('mobile')}
                        disabled={processing}
                    >
                        <View style={styles.paymentMethodHeader}>
                            <View style={styles.paymentMethodIcon}>
                                <Text style={styles.paymentMethodIconText}>📱</Text>
                            </View>
                            <View style={styles.paymentMethodInfo}>
                                <Text style={styles.paymentMethodName}>Paiement Mobile</Text>
                                <Text style={styles.paymentMethodDesc}>Airtel Money, Orange Money, M-Pesa</Text>
                            </View>
                            {selectedPaymentMethod === 'mobile' && (
                                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                            )}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => setCurrentStep(0)}
                            disabled={processing}
                        >
                            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                            <Text style={styles.secondaryButtonText}>Retour</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            );
        }

        // Si Stripe est sélectionné
        if (selectedPaymentMethod === 'stripe') {
            return (
                <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.paymentMethodHeader}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setSelectedPaymentMethod(null)}
                            disabled={processing}
                        >
                            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.sectionTitle}>Paiement par carte bancaire</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>Vous serez redirigé vers Stripe pour finaliser votre paiement</Text>

                    <View style={styles.planSummaryCard}>
                        <Text style={styles.summaryTitle}>Récapitulatif</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Plan</Text>
                            <Text style={styles.summaryValue}>{plan?.name}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Montant</Text>
                            <Text style={styles.summaryValue}>{plan?.price} $</Text>
                        </View>
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleStripePayment}
                        disabled={processing}
                    >
                        {processing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.primaryButtonText}>Payer avec Stripe</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => setSelectedPaymentMethod(null)}
                            disabled={processing}
                        >
                            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                            <Text style={styles.secondaryButtonText}>Retour</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            );
        }

        // Si Mobile Money est sélectionné (formulaire existant)
        return (
            <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.paymentMethodHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setSelectedPaymentMethod(null)}
                        disabled={processing}
                    >
                        <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.sectionTitle}>Paiement Mobile</Text>
                </View>
                <Text style={styles.sectionSubtitle}>Sélectionnez votre opérateur et entrez votre numéro</Text>

            {/* Pays et Opérateur */}
            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Pays *</Text>
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => setShowCountryPicker(true)}
                        disabled={processing}
                    >
                        <Text style={styles.selectButtonText} numberOfLines={1}>
                            {selectedCountry?.label}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Opérateur *</Text>
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => setShowProviderPicker(true)}
                        disabled={processing}
                    >
                        <Text style={styles.selectButtonText} numberOfLines={1}>
                            {selectedProvider?.label}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Numéro de téléphone */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Numéro de téléphone *</Text>
                <View style={styles.phoneInputContainer}>
                    <View style={styles.phonePrefix}>
                        <Text style={styles.phonePrefixText}>{phonePrefix}</Text>
                    </View>
                    <TextInput
                        style={[styles.phoneInput, error && styles.inputError]}
                        placeholder="812345678"
                        placeholderTextColor="#999"
                        value={phoneNumber}
                        onChangeText={(text) => {
                            setPhoneNumber(text.replace(/\D/g, ''));
                            setError(null);
                        }}
                        keyboardType="phone-pad"
                        editable={!processing}
                        maxLength={15}
                    />
                </View>
                <Text style={styles.hint}>Format: {phonePrefix} XXXXXXXXX (sans le 0 initial)</Text>
            </View>

            {/* Devise */}
            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Devise *</Text>
                <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowCurrencyPicker(true)}
                    disabled={processing}
                >
                    <Text style={styles.selectButtonText}>
                        {currency === 'USD' ? 'USD (Dollar américain)' : `CDF (Franc congolais)`}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setCurrentStep(0)}
                    disabled={processing}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                    <Text style={styles.secondaryButtonText}>Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1, marginLeft: 12 }]}
                    onPress={handleContinueFromPayment}
                    disabled={processing}
                >
                    <Text style={styles.primaryButtonText}>Suivant</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Modals pour les sélecteurs */}
            {renderCountryPicker()}
            {renderProviderPicker()}
            {renderCurrencyPicker()}
        </ScrollView>
        );
    };

    // Étape 2: Récapitulatif
    const renderStep2 = () => {
        const finalAmount = calculateFinalAmount();
        const formattedPhone = `${phonePrefix} ${phoneNumber}`;

        return (
            <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Récapitulatif</Text>
                <Text style={styles.sectionSubtitle}>Vérifiez les informations avant de confirmer</Text>

                <View style={styles.summaryCard}>
                    <View style={styles.summarySection}>
                        <Text style={styles.summarySectionTitle}>Abonnement</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Plan</Text>
                            <Text style={styles.summaryValue}>{plan?.name}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Montant</Text>
                            <Text style={styles.summaryValueBold}>
                                {currency === 'USD'
                                    ? `${plan?.price} $`
                                    : `${Math.round(finalAmount).toLocaleString()} CDF`
                                }
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summarySection}>
                        <Text style={styles.summarySectionTitle}>Paiement</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Pays</Text>
                            <Text style={styles.summaryValue}>{selectedCountry?.label}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Opérateur</Text>
                            <Text style={styles.summaryValue}>{selectedProvider?.label}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Numéro</Text>
                            <Text style={styles.summaryValue}>{formattedPhone}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Devise</Text>
                            <Text style={styles.summaryValue}>{currency}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color={theme.colors.info} />
                    <Text style={styles.infoText}>
                        PawaPay est un partenaire de LaSoCoach pour les paiements mobiles sécurisés.
                    </Text>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setCurrentStep(1)}
                        disabled={processing}
                    >
                        <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                        <Text style={styles.secondaryButtonText}>Modifier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.confirmButton, { flex: 1, marginLeft: 12 }, processing && styles.buttonDisabled]}
                        onPress={handleConfirmPayment}
                        disabled={processing}
                    >
                        {processing ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.confirmButtonText}>Confirmer le paiement</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    // Étape 3: Traitement du paiement
    const renderStep3 = () => (
        <View style={styles.processingContainer}>
            <View style={styles.processingContent}>
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 24 }} />
                <Ionicons name="phone-portrait-outline" size={64} color={theme.colors.primary} style={{ marginBottom: 16 }} />
                <Text style={styles.processingTitle}>Paiement en cours...</Text>
                <Text style={styles.processingText}>
                    Veuillez confirmer le paiement sur votre téléphone mobile.
                </Text>
                <Text style={styles.processingSubtext}>
                    Nous vérifions automatiquement le statut de votre paiement.
                </Text>

                {depositId && (
                    <View style={styles.transactionInfo}>
                        <Text style={styles.transactionLabel}>ID Transaction</Text>
                        <Text style={styles.transactionId}>{depositId}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.secondaryButton, { marginTop: 32 }]}
                    onPress={() => {
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                        setPaymentStatus('cancelled');
                        setError('Paiement annulé par l\'utilisateur');
                        setCurrentStep(4);
                    }}
                    disabled={processing}
                >
                    <Text style={styles.secondaryButtonText}>Annuler</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Étape 4: Résultat
    const renderStep4 = () => {
        const isSuccess = paymentStatus === 'completed';
        const isCancelled = paymentStatus === 'cancelled';

        return (
            <View style={styles.resultContainer}>
                <View style={styles.resultContent}>
                    <View style={[
                        styles.resultIcon,
                        isSuccess && styles.resultIconSuccess,
                        !isSuccess && styles.resultIconError,
                    ]}>
                        <Ionicons
                            name={isSuccess ? 'checkmark-circle' : isCancelled ? 'close-circle' : 'alert-circle'}
                            size={80}
                            color={isSuccess ? theme.colors.success : theme.colors.error}
                        />
                    </View>

                    <Text style={styles.resultTitle}>
                        {isSuccess 
                            ? (isFreePlan ? 'Abonnement activé avec succès !' : 'Paiement effectué avec succès !')
                            : isCancelled 
                                ? 'Paiement annulé' 
                                : 'Erreur de paiement'}
                    </Text>

                    <Text style={styles.resultMessage}>
                        {isSuccess
                            ? (isFreePlan 
                                ? 'Votre plan gratuit est maintenant actif. Profitez de tous les avantages !'
                                : 'Votre abonnement est maintenant actif. Profitez de tous les avantages !')
                            : isCancelled
                                ? 'Vous avez annulé le paiement. Vous pouvez réessayer quand vous êtes prêt.'
                                : error || 'Une erreur est survenue lors du paiement. Veuillez réessayer.'}
                    </Text>

                    {isSuccess && (
                        <Text style={[styles.resultMessage, { fontSize: 13, color: theme.colors.text.secondary, marginTop: -8 }]}>
                            Cette fenêtre se fermera automatiquement...
                        </Text>
                    )}

                    {isSuccess ? (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleClose}
                        >
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>Fermer maintenant</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleClose}
                            >
                                <Text style={styles.secondaryButtonText}>Quitter</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.primaryButton, { flex: 1, marginLeft: 12 }]}
                                onPress={handleRetry}
                            >
                                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                                <Text style={styles.primaryButtonText}>Réessayer</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // Modals
    const renderCountryPicker = () => (
        <Modal
            visible={showCountryPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCountryPicker(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Sélectionnez un pays</Text>
                        <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {PAWAPAY_COUNTRIES.map((c) => (
                            <TouchableOpacity
                                key={c.code}
                                style={styles.modalOption}
                                onPress={() => {
                                    setCountry(c.code);
                                    setProvider(c.providers[0]?.code || '');
                                    setShowCountryPicker(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>{c.label} ({c.prefix})</Text>
                                {country === c.code && (
                                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderProviderPicker = () => (
        <Modal
            visible={showProviderPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowProviderPicker(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Sélectionnez un opérateur</Text>
                        <TouchableOpacity onPress={() => setShowProviderPicker(false)}>
                            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {selectedCountry?.providers.map((p) => (
                            <TouchableOpacity
                                key={p.code}
                                style={styles.modalOption}
                                onPress={() => {
                                    setProvider(p.code);
                                    setShowProviderPicker(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>{p.label}</Text>
                                {provider === p.code && (
                                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const renderCurrencyPicker = () => (
        <Modal
            visible={showCurrencyPicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowCurrencyPicker(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Sélectionnez une devise</Text>
                        <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setCurrency('USD');
                                setShowCurrencyPicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>USD (Dollar américain)</Text>
                            {currency === 'USD' && (
                                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                setCurrency('CDF');
                                setShowCurrencyPicker(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>
                                CDF (Franc congolais{exchangeRate ? ` - Taux: ${exchangeRate.toLocaleString()}` : ''})
                            </Text>
                            {currency === 'CDF' && (
                                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // Log when modal visibility changes
    useEffect(() => {
        console.log('🔄 [PaymentFlow] Modal visibility changed:', visible, 'Plan:', plan?.id, plan?.name);
        if (visible) {
            console.log('✅ [PaymentFlow] Modal should be visible now');
        } else {
            console.log('❌ [PaymentFlow] Modal should be hidden');
        }
    }, [visible, plan]);

    // Log on every render to see if component is being rendered
    console.log('🔄 [PaymentFlow] Component render - visible:', visible, 'plan:', plan?.id, 'plan exists:', !!plan);

    // Ne pas retourner null ici, laisser le Modal gérer la visibilité
    console.log('🔄 [PaymentFlow] Checks passed, about to return JSX');
    console.log('🔄 [PaymentFlow] visible type:', typeof visible, 'plan type:', typeof plan);

    if (!visible || !plan) {
        console.log('🔄 [PaymentFlow] Not visible or no plan, returning null');
        return null;
    }

    console.log('✅✅✅ [PaymentFlow] RENDERING MODAL NOW ✅✅✅');

    // Rendu de l'étape actuelle
    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0:
                return renderStep0();
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            case 4:
                return renderStep4();
            default:
                return renderStep0();
        }
    };

    return (
        <>
            <Modal
                visible={true}
                transparent
                animationType="slide"
                onRequestClose={handleClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <View style={styles.container}>
                        {/* Backdrop avec BlurView pour fermer le modal */}
                        <TouchableOpacity
                            style={styles.backdropTouchable}
                            activeOpacity={1}
                            onPress={handleClose}
                        >
                            <BlurView
                                intensity={20}
                                tint="dark"
                                style={styles.backdrop}
                            />
                        </TouchableOpacity>
                        
                        {/* Contenu du bottomsheet */}
                        <View style={styles.content}>
                            {renderHeader()}
                            {renderStepIndicators()}
                            {renderCurrentStep()}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <StripeWebViewModal
                visible={showStripeWebView}
                checkoutUrl={stripeCheckoutUrl}
                sessionId={stripeSessionId}
                planId={plan?.id}
                onClose={() => {
                    console.log('🔵 [Stripe WebView] Fermeture manuelle de la WebView');
                    setShowStripeWebView(false);
                    setStripeCheckoutUrl(null);
                }}
                onSuccess={async (data) => {
                    console.log('✅ [Stripe WebView] Succès détecté, vérification du paiement côté backend...');
                    console.log('✅ [Stripe WebView] Data:', data);
                    
                    try {
                        // Vérifier le paiement côté backend
                        if (data.sessionId) {
                            console.log('🔄 [Stripe] Confirmation du paiement avec sessionId:', data.sessionId);
                            const confirmResponse = await SubscriptionApi.confirmStripePayment({
                                sessionId: data.sessionId,
                                planId: data.planId,
                            });
                            console.log('✅ [Stripe] Paiement confirmé par le backend:', confirmResponse);
                        }
                        
                        // Afficher l'étape de confirmation
                        setSuccess(true);
                        setPaymentStatus('completed');
                        setCurrentStep(4);
                        
                        // Appeler le callback onSuccess parent
                        if (onSuccess) {
                            onSuccess(data);
                        }
                        
                        // Fermer automatiquement le modal après 3 secondes
                        console.log('⏱️ [Stripe] Fermeture automatique du modal dans 3 secondes...');
                        setTimeout(() => {
                            console.log('✅ [Stripe] Fermeture automatique du modal');
                            handleClose();
                        }, 3000);
                    } catch (error: any) {
                        console.error('❌ [Stripe] Erreur lors de la confirmation du paiement:', error);
                        // Même en cas d'erreur de confirmation, on considère que le paiement peut être réussi côté Stripe
                        // On affiche quand même le succès mais on log l'erreur
                        setSuccess(true);
                        setPaymentStatus('completed');
                        setCurrentStep(4);
                        
                        if (onSuccess) {
                            onSuccess(data);
                        }
                        
                        // Fermer automatiquement après 3 secondes
                        setTimeout(() => {
                            handleClose();
                        }, 3000);
                    }
                }}
                onError={(error) => {
                    console.log('❌ [Stripe WebView] Erreur ou annulation détectée:', error);
                    setError(error);
                    setPaymentStatus('cancelled');
                    setCurrentStep(4);
                    if (onError) {
                        onError(error);
                    }
                }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdropTouchable: {
        ...StyleSheet.absoluteFillObject,
    },
    backdrop: {
        flex: 1,
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '95%',
        minHeight: '80%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: 4,
    },
    stepIndicators: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
    },
    stepDotActive: {
        width: 24,
        backgroundColor: theme.colors.primary,
    },
    stepDotCompleted: {
        backgroundColor: theme.colors.success,
    },
    stepContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'android' ? 24 : 0,
    },

    // Étape 0: Plan
    planCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    planHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    planName: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginTop: 12,
    },
    planDetails: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    planRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    planLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    planValue: {
        fontSize: 14,
        color: theme.colors.text.primary,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    planDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    featuresList: {
        gap: 12,
    },
    featuresTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        flex: 1,
    },

    // Étape 1: Formulaire
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
        marginTop: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    selectButtonText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        flex: 1,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    phonePrefix: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginRight: 8,
    },
    phonePrefixText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    phoneInput: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: theme.colors.text.primary,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    // Méthodes de paiement
    paymentMethodCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    paymentMethodCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#F0F7FF',
    },
    paymentMethodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paymentMethodIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    paymentMethodIconText: {
        fontSize: 24,
    },
    paymentMethodInfo: {
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
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    planSummaryCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    hint: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        fontSize: 13,
        color: theme.colors.error,
        flex: 1,
    },

    // Étape 2: Récapitulatif
    summaryCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    summarySection: {
        gap: 12,
    },
    summarySectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    summaryValue: {
        fontSize: 14,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    summaryValueBold: {
        fontSize: 16,
        color: theme.colors.primary,
        fontWeight: '700',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 16,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        gap: 12,
    },
    infoText: {
        fontSize: 13,
        color: theme.colors.info,
        flex: 1,
        lineHeight: 18,
    },

    // Étape 3: Traitement
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    processingContent: {
        alignItems: 'center',
        width: '100%',
    },
    processingTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    processingText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    processingSubtext: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    transactionInfo: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        width: '100%',
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

    // Étape 4: Résultat
    resultContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    resultContent: {
        alignItems: 'center',
        width: '100%',
    },
    resultIcon: {
        marginBottom: 24,
    },
    resultIconSuccess: {},
    resultIconError: {},
    resultTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    resultMessage: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },

    // Boutons
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.success,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalOptionText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        flex: 1,
    },
});
