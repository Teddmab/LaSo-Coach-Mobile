import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import ReviewPromptModal, { ExperienceSentiment } from './ReviewPromptModal';
import FeedbackModal from './FeedbackModal';
import { reviewEligibilityService } from '../../services/review/reviewEligibilityService';
import { requestNativeReviewFlow } from '../../services/review/reviewService';
import type { InAppFeedbackSentiment } from '../../services/review/feedbackService';

interface ReviewPromptHostProps {
  activeTab: string;
  /** Écran logique dashboard : ne proposer que sur la home principale */
  currentScreen: string;
  profileComplete: boolean;
  user?: { id?: string; email?: string } | null;
  /** Incrémenté après chaque action « core » pour re-vérifier l’éligibilité */
  engagementTick?: number;
}

const HOME_DELAY_MS = 5000;

const ReviewPromptHost: React.FC<ReviewPromptHostProps> = ({
  activeTab,
  currentScreen,
  profileComplete,
  user,
  engagementTick = 0,
}) => {
  const [showSentiment, setShowSentiment] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSentiment, setFeedbackSentiment] = useState<InAppFeedbackSentiment>('okay');
  const feedbackSubmittedRef = useRef(false);

  const lastUserIdRef = useRef<string | null>(null);
  const sentimentOpenRef = useRef(false);

  useEffect(() => {
    sentimentOpenRef.current = showSentiment;
  }, [showSentiment]);

  useEffect(() => {
    const uid = user?.id ?? null;
    if (uid && uid !== lastUserIdRef.current) {
      lastUserIdRef.current = uid;
      void reviewEligibilityService.onAuthSessionStarted();
    }
  }, [user?.id]);

  useEffect(() => {
    if (profileComplete) {
      void reviewEligibilityService.onProfileOnboardingComplete();
    }
  }, [profileComplete]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void reviewEligibilityService.recordAppForegroundDay();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    void reviewEligibilityService.recordAppForegroundDay();
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (activeTab !== 'home' && sentimentOpenRef.current) {
      setShowSentiment(false);
      void reviewEligibilityService.recordDismissed();
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentScreen !== 'home' && sentimentOpenRef.current) {
      setShowSentiment(false);
      void reviewEligibilityService.recordDismissed();
    }
  }, [currentScreen]);

  useEffect(() => {
    if (activeTab !== 'home' || currentScreen !== 'home') {
      return undefined;
    }
    const t = setTimeout(async () => {
      const { eligible } = await reviewEligibilityService.checkEligibility({
        now: Date.now(),
        profileComplete,
      });
      if (eligible) {
        setShowSentiment(true);
      }
    }, HOME_DELAY_MS);
    return () => clearTimeout(t);
  }, [activeTab, currentScreen, profileComplete, engagementTick]);

  useEffect(() => {
    if (showSentiment) {
      void reviewEligibilityService.recordPromptShown();
    }
  }, [showSentiment]);

  const closeSentiment = useCallback(() => {
    setShowSentiment(false);
    void reviewEligibilityService.recordDismissed();
  }, []);

  const onSentimentSelect = useCallback(async (s: ExperienceSentiment) => {
    setShowSentiment(false);
    if (s === 'great') {
      await reviewEligibilityService.recordNativeReviewFlowOpened();
      await requestNativeReviewFlow();
      return;
    }
    const mapped: InAppFeedbackSentiment = s === 'okay' ? 'okay' : 'not_great';
    feedbackSubmittedRef.current = false;
    setFeedbackSentiment(mapped);
    setFeedbackOpen(true);
  }, []);

  const onFeedbackClose = useCallback(() => {
    setFeedbackOpen(false);
    if (!feedbackSubmittedRef.current) {
      void reviewEligibilityService.recordDismissed();
    }
    feedbackSubmittedRef.current = false;
  }, []);

  const onFeedbackSubmitted = useCallback(() => {
    feedbackSubmittedRef.current = true;
    void reviewEligibilityService.recordInternalFeedbackSubmitted();
  }, []);

  return (
    <>
      <ReviewPromptModal
        visible={showSentiment}
        onSelect={onSentimentSelect}
        onDismiss={closeSentiment}
      />
      <FeedbackModal
        visible={feedbackOpen}
        sentiment={feedbackSentiment}
        userEmail={user?.email}
        userId={user?.id}
        onClose={onFeedbackClose}
        onSubmitted={onFeedbackSubmitted}
      />
    </>
  );
};

export default ReviewPromptHost;
