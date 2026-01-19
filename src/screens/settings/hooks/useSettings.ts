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
      const data = await ProfileApi.getProfile();
      // Handle case where profile might be null due to Prisma errors
      if (data) {
      setProfileData(data);
      } else {
        console.warn('⚠️ [useSettings] Profile data is null - Prisma error or missing data');
        setProfileData(null);
      }
    } catch (error) {
      console.error('❌ [useSettings] Error fetching profile:', error);
      setProfileData(null);
    }
  };

  const checkSubscriptionStatus = async (): Promise<void> => {
    try {
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
    } catch (error) {
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

