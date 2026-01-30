import { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  IOS_COMPANION_MODE,
  shouldShowPurchaseFlows,
  shouldInitializePaymentProviders,
  shouldEnableIAP,
  getCompanionModeMessage,
} from '../config/featureFlags';
import { useCompanionModeContext } from '../context/CompanionModeContext';

/**
 * Hook to check companion mode status
 * Use this in components that need to conditionally render based on companion mode
 * Now uses the context to allow runtime override
 */
export const useCompanionMode = () => {
  const { isCompanionMode: isCompanionModeFromContext } = useCompanionModeContext();
  
  const canShowPurchaseFlows = useMemo(() => !isCompanionModeFromContext, [isCompanionModeFromContext]);
  const canInitializePayments = useMemo(() => !isCompanionModeFromContext, [isCompanionModeFromContext]);
  const canUseIAP = useMemo(() => !isCompanionModeFromContext, [isCompanionModeFromContext]);
  const companionMessage = useMemo(() => getCompanionModeMessage(), []);

  return {
    /** True if iOS companion mode is active (considering override) */
    isCompanionMode: isCompanionModeFromContext,
    
    /** True if purchase flows should be shown */
    canShowPurchaseFlows,
    
    /** True if payment providers (Stripe/PayPal) should initialize */
    canInitializePayments,
    
    /** True if IAP should be enabled */
    canUseIAP,
    
    /** Neutral message to show in companion mode */
    companionMessage,
    
    /** Current platform */
    platform: Platform.OS,
    
    /** Raw flag value */
    companionModeEnabled: IOS_COMPANION_MODE,
  };
};

/**
 * Hook to conditionally render components based on companion mode
 * Returns a render function that only renders children if purchase flows are allowed
 */
export const useConditionalRender = () => {
  const { canShowPurchaseFlows } = useCompanionMode();

  return {
    /** Render only if purchase flows are allowed */
    renderIfPurchaseAllowed: (component: JSX.Element | null) => {
      return canShowPurchaseFlows ? component : null;
    },
    
    /** Render only if companion mode is active */
    renderIfCompanionMode: (component: JSX.Element | null) => {
      return !canShowPurchaseFlows ? component : null;
    },
  };
};

export default useCompanionMode;
