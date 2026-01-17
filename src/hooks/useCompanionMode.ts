import { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  IOS_COMPANION_MODE,
  isIOSCompanionMode,
  shouldShowPurchaseFlows,
  shouldInitializePaymentProviders,
  shouldEnableIAP,
  getCompanionModeMessage,
} from '../config/featureFlags';

/**
 * Hook to check companion mode status
 * Use this in components that need to conditionally render based on companion mode
 */
export const useCompanionMode = () => {
  const isCompanionMode = useMemo(() => isIOSCompanionMode(), []);
  const canShowPurchaseFlows = useMemo(() => shouldShowPurchaseFlows(), []);
  const canInitializePayments = useMemo(() => shouldInitializePaymentProviders(), []);
  const canUseIAP = useMemo(() => shouldEnableIAP(), []);
  const companionMessage = useMemo(() => getCompanionModeMessage(), []);

  return {
    /** True if iOS companion mode is active */
    isCompanionMode,
    
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
