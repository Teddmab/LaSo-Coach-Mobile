import { PaymentService } from './PaymentService';

/**
 * Service de paiement pour Android
 * NOTE: Payment services disabled - using backend entitlements only
 */
export class AndroidPaymentService implements PaymentService {
  isPaymentAvailable(): boolean {
    return false; // Payment system disabled
  }

  async initiatePayment(planId: string, amount?: number): Promise<any> {
    throw new Error('Payment system disabled - using backend entitlements only');
  }

  async checkPaymentStatus(paymentId: string): Promise<any> {
    return null;
  }
}

