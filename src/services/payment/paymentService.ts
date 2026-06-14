import { Platform } from 'react-native';
import { AndroidPaymentService } from './AndroidPaymentService';
import { IOSPaymentService } from './IOSPaymentService';

export interface PaymentService {
  isPaymentAvailable(): boolean;
  initiatePayment(planId: string, amount?: number): Promise<any>;
  checkPaymentStatus(paymentId: string): Promise<any>;
}

/**
 * Factory qui retourne le service de paiement approprié selon la plateforme
 */
export const getPaymentService = (): PaymentService => {
  if (Platform.OS === 'android') {
    return new AndroidPaymentService();
  }
  // iOS - Reader App model (pas de paiement dans l'app)
  return new IOSPaymentService();
};

