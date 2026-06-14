import { PaymentService } from './paymentService';

/**
 * Service de paiement pour iOS
 * Ne permet AUCUN paiement dans l'app (Reader App model)
 * Tous les paiements doivent être effectués sur le site web
 */
export class IOSPaymentService implements PaymentService {
  isPaymentAvailable(): boolean {
    return false; // iOS ne permet pas de paiement dans l'app
  }

  async initiatePayment(planId: string, amount?: number): Promise<any> {
    // Sur iOS, on ne peut pas initier de paiement
    // Retourne null pour indiquer que le paiement n'est pas disponible
    return null;
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    // Même si on ne peut pas payer, on peut vérifier le statut
    // (utile pour vérifier les abonnements effectués sur le web)
    return null;
  }
}

