import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface PaymentTransaction {
  transactionId: string;
  provider: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  subscriptionStatus?: 'active' | 'inactive';
}

interface PaymentContextType {
  currentTransaction: PaymentTransaction | null;
  transactionHistory: PaymentTransaction[];
  isProcessing: boolean;
  
  // Actions
  startPayment: (transaction: PaymentTransaction) => void;
  updatePaymentStatus: (transactionId: string, status: PaymentTransaction['status']) => void;
  completePayment: (transactionId: string, subscriptionStatus?: 'active' | 'inactive') => void;
  failPayment: (transactionId: string, errorMessage?: string) => void;
  cancelPayment: (transactionId: string) => void;
  clearCurrentTransaction: () => void;
  addToHistory: (transaction: PaymentTransaction) => void;
  clearHistory: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTransaction, setCurrentTransaction] = useState<PaymentTransaction | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<PaymentTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const startPayment = useCallback((transaction: PaymentTransaction) => {
    setCurrentTransaction({
      ...transaction,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setIsProcessing(true);
  }, []);

  const updatePaymentStatus = useCallback(
    (transactionId: string, status: PaymentTransaction['status']) => {
      if (currentTransaction?.transactionId === transactionId) {
        setCurrentTransaction((prev) =>
          prev ? { ...prev, status } : null
        );
      }
    },
    [currentTransaction?.transactionId]
  );

  const completePayment = useCallback(
    (transactionId: string, subscriptionStatus?: 'active' | 'inactive') => {
      if (currentTransaction?.transactionId === transactionId) {
        const completedTransaction: PaymentTransaction = {
          ...currentTransaction,
          status: 'completed',
          completedAt: new Date().toISOString(),
          subscriptionStatus,
        };
        
        setCurrentTransaction(completedTransaction);
        setTransactionHistory((prev) => [completedTransaction, ...prev]);
        setIsProcessing(false);
      }
    },
    [currentTransaction]
  );

  const failPayment = useCallback(
    (transactionId: string, errorMessage?: string) => {
      if (currentTransaction?.transactionId === transactionId) {
        const failedTransaction: PaymentTransaction = {
          ...currentTransaction,
          status: 'failed',
          errorMessage,
          completedAt: new Date().toISOString(),
        };
        
        setCurrentTransaction(failedTransaction);
        setTransactionHistory((prev) => [failedTransaction, ...prev]);
        setIsProcessing(false);
      }
    },
    [currentTransaction]
  );

  const cancelPayment = useCallback(
    (transactionId: string) => {
      if (currentTransaction?.transactionId === transactionId) {
        const cancelledTransaction: PaymentTransaction = {
          ...currentTransaction,
          status: 'cancelled',
          completedAt: new Date().toISOString(),
        };
        
        setCurrentTransaction(cancelledTransaction);
        setTransactionHistory((prev) => [cancelledTransaction, ...prev]);
        setIsProcessing(false);
      }
    },
    [currentTransaction]
  );

  const clearCurrentTransaction = useCallback(() => {
    setCurrentTransaction(null);
    setIsProcessing(false);
  }, []);

  const addToHistory = useCallback((transaction: PaymentTransaction) => {
    setTransactionHistory((prev) => [transaction, ...prev]);
  }, []);

  const clearHistory = useCallback(() => {
    setTransactionHistory([]);
  }, []);

  const value: PaymentContextType = {
    currentTransaction,
    transactionHistory,
    isProcessing,
    startPayment,
    updatePaymentStatus,
    completePayment,
    failPayment,
    cancelPayment,
    clearCurrentTransaction,
    addToHistory,
    clearHistory,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

export const usePaymentTracking = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePaymentTracking must be used within a PaymentProvider');
  }
  return context;
};

export default PaymentContext;
