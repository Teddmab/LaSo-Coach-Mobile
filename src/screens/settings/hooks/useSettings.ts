import { useState, useEffect } from 'react';
import SubscriptionService from '../../../services/subscriptionService';
import { ProfileApi } from '../../../services/profileApi';
import { ExpandedSections } from '../types';

export const useSettings = () => {
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    profile: false,
  });
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    fetchProfileData();
  }, []);

  const fetchProfileData = async (): Promise<void> => {
    try {
      console.log('👤 Settings: Fetching profile data...');
      const data = await ProfileApi.getProfile();
      setProfileData(data);
      console.log('✅ Settings: Profile data fetched successfully');
    } catch (error) {
      console.error('❌ Settings: Error fetching profile data:', error);
    }
  };

  const checkSubscriptionStatus = async (): Promise<void> => {
    try {
      console.log('💳 Settings: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
    } catch (error) {
      console.error('❌ Settings: Error checking subscription status:', error);
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true,
      });
    }
  };

  const toggleSection = (sectionId: string): void => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return {
    expandedSections,
    subscriptionData,
    profileData,
    toggleSection,
    refetchSubscription: checkSubscriptionStatus,
    refetchProfile: fetchProfileData,
  };
};

