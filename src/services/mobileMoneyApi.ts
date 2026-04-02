import api from './api';
import { API_BASE_URL } from '@env';

interface InitiatePaymentRequest {
  phoneNumber: string;
  provider: string;
  amount: number;
  currency: string;
  subscriptionPlanId: string;
  callbackUrl?: string;
}

interface InitiatePaymentResponse {
  transactionId: string;
  status: 'pending' | 'initiated' | 'failed';
  statusUrl?: string;
  expiresAt?: string;
  message?: string;
}

interface PaymentStatusResponse {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  provider: string;
  phoneNumber: string;
  timestamp: string;
  errorMessage?: string;
  subscriptionStatus?: 'active' | 'inactive';
}

interface PaymentVerificationRequest {
  transactionId: string;
  provider: string;
}

interface PaymentVerificationResponse {
  verified: boolean;
  status: string;
  subscriptionActivated: boolean;
}

const API_ENDPOINT = API_BASE_URL ? `${API_BASE_URL}/api/payments/mobile-money` : '/api/payments/mobile-money';

/**
 * Initiate a mobile money payment
 */
export const initiateMobileMoneyPayment = async (
  request: InitiatePaymentRequest
): Promise<InitiatePaymentResponse> => {
  try {
    const endpoint = `${API_ENDPOINT}/initiate`.replace(API_BASE_URL || '', '').replace(/^\/+/, '');
    const response = await api.post<InitiatePaymentResponse>(`/${endpoint}`, {
        phoneNumber: request.phoneNumber,
        provider: request.provider,
        amount: request.amount,
        currency: request.currency,
        subscriptionPlanId: request.subscriptionPlanId,
        callbackUrl: request.callbackUrl,
    });

    return response.data;
  } catch (error) {
    console.error('Mobile money payment initiation failed:', error);
    throw new Error('Failed to initiate mobile money payment');
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (
  transactionId: string
): Promise<PaymentStatusResponse> => {
  try {
    const endpoint = `${API_ENDPOINT}/${transactionId}/status`.replace(API_BASE_URL || '', '').replace(/^\/+/, '');
    const response = await api.get<PaymentStatusResponse>(`/${endpoint}`);

    return response.data;
  } catch (error) {
    console.error('Payment status check failed:', error);
    throw new Error('Failed to check payment status');
  }
};

/**
 * Verify payment completion and activate subscription
 */
export const verifyMobileMoneyPayment = async (
  request: PaymentVerificationRequest
): Promise<PaymentVerificationResponse> => {
  try {
    const endpoint = `${API_ENDPOINT}/verify`.replace(API_BASE_URL || '', '').replace(/^\/+/, '');
    const response = await api.post<PaymentVerificationResponse>(`/${endpoint}`, {
        transactionId: request.transactionId,
        provider: request.provider,
    });

    return response.data;
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw new Error('Failed to verify payment');
  }
};

/**
 * Poll payment status with retries (for real-time status updates)
 */
export const pollPaymentStatus = async (
  transactionId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<PaymentStatusResponse> => {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const status = await checkPaymentStatus(transactionId);

        // Payment completed or failed
        if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
          clearInterval(pollInterval);
          resolve(status);
          return;
        }

        // Max attempts reached
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          reject(new Error('Payment status check timeout'));
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          reject(error);
        }
        // Continue polling on error
      }
    }, intervalMs);
  });
};

/**
 * Cancel a pending mobile money payment
 */
export const cancelMobileMoneyPayment = async (transactionId: string): Promise<void> => {
  try {
    const endpoint = `${API_ENDPOINT}/${transactionId}/cancel`.replace(API_BASE_URL || '', '').replace(/^\/+/, '');
    await api.post(`/${endpoint}`, {});
  } catch (error) {
    console.error('Payment cancellation failed:', error);
    throw new Error('Failed to cancel payment');
  }
};

/**
 * Get transaction history for user
 */
export const getMobileMoneyTransactionHistory = async (
  limit: number = 10,
  offset: number = 0
): Promise<PaymentStatusResponse[]> => {
  try {
    const endpoint = `${API_ENDPOINT}/transactions?limit=${limit}&offset=${offset}`.replace(API_BASE_URL || '', '').replace(/^\/+/, '');
    const response = await api.get<{ transactions: PaymentStatusResponse[] }>(`/${endpoint}`);

    return response.data.transactions || [];
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    throw new Error('Failed to fetch transaction history');
  }
};

export default {
  initiateMobileMoneyPayment,
  checkPaymentStatus,
  verifyMobileMoneyPayment,
  pollPaymentStatus,
  cancelMobileMoneyPayment,
  getMobileMoneyTransactionHistory,
};
