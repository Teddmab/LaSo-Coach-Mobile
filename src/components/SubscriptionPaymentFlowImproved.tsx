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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import SubscriptionApi from '../services/subscriptionApi';
import { theme } from '../constants/theme';
import api from '../services/api';
import * as Notifications from 'expo-notifications';

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
    // États du flux
    const [currentStep, setCurrentStep] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // États du formulaire Mobile Money
    const [country, setCountry] = useState(PAWAPAY_COUNTRIES[0].code);
    const [provider, setProvider] = useState(PAWAPAY_COUNTRIES[0].providers[0].code);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);

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
                        setError(data.failureMessage || data.message || 'Le paiement a échoué.');
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
    };

    useEffect(() => {
        if (visible && plan) {
            resetFlow();
        } else if (!visible) {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        }
    }, [visible, plan]);

    // Nettoyer le polling au démontage
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, []);

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
    const handleContinueFromInfo = () => {
        if (!plan?.id) {
            Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: 'Plan d\'abonnement invalide',
            });
            return;
        }
        setCurrentStep(1); // Aller à l'étape 1 (Méthode de paiement)
    };

    // Passer à l'étape suivante depuis l'étape 1
    const handleContinueFromPayment = () => {
        if (!validateForm()) {
            return;
        }
        setError(null);
        setCurrentStep(2); // Aller à l'étape 2 (Récapitulatif)
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
                style={styles.primaryButton}
                onPress={handleContinueFromInfo}
                disabled={processing}
            >
                <Text style={styles.primaryButtonText}>Suivant</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </ScrollView>
    );

    // Étape 1: Méthode de paiement
    const renderStep1 = () => (
        <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Paiement Mobile</Text>
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
                        {isSuccess ? 'Paiement effectué avec succès !' : isCancelled ? 'Paiement annulé' : 'Erreur de paiement'}
                    </Text>

                    <Text style={styles.resultMessage}>
                        {isSuccess
                            ? 'Votre abonnement est maintenant actif. Profitez de tous les avantages !'
                            : isCancelled
                                ? 'Vous avez annulé le paiement. Vous pouvez réessayer quand vous êtes prêt.'
                                : error || 'Une erreur est survenue lors du paiement. Veuillez réessayer.'}
                    </Text>

                    {isSuccess ? (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleClose}
                        >
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>Fermer</Text>
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

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    {renderHeader()}
                    {renderStepIndicators()}

                    {currentStep === 0 && renderStep0()}
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '95%',
        minHeight: '80%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
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
