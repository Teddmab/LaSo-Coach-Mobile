import { PaymentService } from './PaymentService';
import SubscriptionApi from '../subscriptionApi';

/**
 * Service de paiement pour Android
 * Supporte Stripe, PayPal, PawaPay et IAP
 */
export class AndroidPaymentService implements PaymentService {
  isPaymentAvailable(): boolean {
    return true; // Android supporte tous les moyens de paiement
  }

  async initiatePayment(planId: string, amount?: number): Promise<any> {
    // Retourne les données nécessaires pour lancer le flux de paiement
    // Le composant SubscriptionPaymentFlow gérera l'UI
    return {
      canProceed: true,
      platform: 'android',
      planId,
      amount,
    };
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    // Vérifie le statut via l'API backend
    try {
      const response = await SubscriptionApi.getPendingPayments();
      const payment = response.find((p: any) => p.id === paymentId);
      return payment || null;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut de paiement:', error);
      return null;
    }
  }
}

