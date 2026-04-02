/**
 * Interface commune pour les services de paiement
 * Chaque plateforme implémente cette interface selon ses capacités
 */
export interface PaymentService {
  /**
   * Vérifie si le paiement est disponible sur cette plateforme
   */
  isPaymentAvailable(): boolean;

  /**
   * Initie un processus de paiement
   * @param planId - ID du plan d'abonnement
   * @param amount - Montant (optionnel, peut être dans le plan)
   * @returns Promise avec les données de paiement ou null si non disponible
   */
  initiatePayment(planId: string, amount?: number): Promise<any>;

  /**
   * Vérifie le statut d'un paiement
   * @param paymentId - ID du paiement
   * @returns Promise avec le statut du paiement
   */
  checkPaymentStatus(paymentId: string): Promise<any>;
}

