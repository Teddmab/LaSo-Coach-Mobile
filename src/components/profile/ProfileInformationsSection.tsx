import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useOnboarding } from '../../hooks/useOnboarding';
import Toast from 'react-native-toast-message';

interface ProfileInformationsSectionProps {
  user: any;
  profileData: any;
  dashboardData?: any;
  onEdit: () => void;
  onSave?: () => void;
}

const ProfileInformationsSection: React.FC<ProfileInformationsSectionProps> = ({
  user,
  profileData,
  dashboardData,
  onEdit,
  onSave,
}) => {
  const { completeProfileSetup, completeGoalsSetup } = useOnboarding();
  
  // State for accordion sections - all collapsed by default
  const [expandedSections, setExpandedSections] = useState<{
    personalInfo: boolean;
    profile: boolean;
    objectives: boolean;
    recommendations: boolean;
  }>({
    personalInfo: false,
    profile: false,
    objectives: false,
    recommendations: false,
  });
  
  // State for editing each section independently
  const [editingSections, setEditingSections] = useState<{
    personalInfo: boolean;
    profile: boolean;
    objectives: boolean;
  }>({
    personalInfo: false,
    profile: false,
    objectives: false,
  });
  
  // State for saving each section
  const [savingSections, setSavingSections] = useState<{
    personalInfo: boolean;
    profile: boolean;
    objectives: boolean;
  }>({
    personalInfo: false,
    profile: false,
    objectives: false,
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  const startEditing = (section: 'personalInfo' | 'profile' | 'objectives') => {
    // Check if onboarding is complete before allowing editing
    if (!isOnboardingComplete) {
      Toast.show({
        type: 'info',
        text1: 'Onboarding incomplet',
        text2: 'Veuillez d\'abord compléter l\'onboarding pour débloquer la modification des informations.',
        visibilityTime: 4000,
      });
      return;
    }
    
    setEditingSections(prev => ({
      ...prev,
      [section]: true,
    }));
  };
  
  const cancelEditing = (section: 'personalInfo' | 'profile' | 'objectives') => {
    setEditingSections(prev => ({
      ...prev,
      [section]: false,
    }));
    // Reload data from dashboardData to reset changes
    // This will be handled by useEffect when editingSections changes
  };

  // Get profile data from all possible sources
  const getProfileData = () => {
    // Try dashboardData.profile.Profile first (structure from getDashboardData)
    if (dashboardData?.profile?.Profile) {
      if (__DEV__) {
        console.log('📊 [ProfileInformationsSection] Found profile at dashboardData.profile.Profile:', {
          hasTargetWeight: dashboardData.profile.Profile.targetWeight !== undefined && dashboardData.profile.Profile.targetWeight !== null,
          targetWeight: dashboardData.profile.Profile.targetWeight,
          hasTargetWaistSize: dashboardData.profile.Profile.targetWaistSize !== undefined && dashboardData.profile.Profile.targetWaistSize !== null,
          targetWaistSize: dashboardData.profile.Profile.targetWaistSize,
          hasGoal: !!dashboardData.profile.Profile.goal,
          goal: dashboardData.profile.Profile.goal,
          hasGoals: Array.isArray(dashboardData.profile.Profile.goals),
          goals: dashboardData.profile.Profile.goals,
          hasDietaryRestrictions: Array.isArray(dashboardData.profile.Profile.dietaryRestrictions),
          dietaryRestrictions: dashboardData.profile.Profile.dietaryRestrictions,
        });
      }
      return dashboardData.profile.Profile;
    }
    // Try dashboardData.profile.profile
    if (dashboardData?.profile?.profile) {
      console.log('📊 Found profile at dashboardData.profile.profile');
      return dashboardData.profile.profile;
    }
    // Try dashboardData.Profile (direct)
    if (dashboardData?.Profile) {
      console.log('📊 Found profile at dashboardData.Profile');
      return dashboardData.Profile;
    }
    // Try dashboardData.profile (direct)
    if (dashboardData?.profile) {
      console.log('📊 Found profile at dashboardData.profile');
      return dashboardData.profile;
    }
    // Try profileData.Profile
    if (profileData?.Profile) {
      console.log('📊 Found profile at profileData.Profile');
      return profileData.Profile;
    }
    // Try profileData.profile
    if (profileData?.profile) {
      console.log('📊 Found profile at profileData.profile');
      return profileData.profile;
    }
    // Fallback to empty object
    console.log('⚠️ No profile data found in any location');
    return {};
  };

  // Get address from all possible sources
  const getAddress = () => {
    if (dashboardData?.profile?.Profile?.address) return dashboardData.profile.Profile.address;
    if (dashboardData?.profile?.profile?.address) return dashboardData.profile.profile.address;
    if (dashboardData?.Profile?.address) return dashboardData.Profile.address;
    if (dashboardData?.profile?.address) return dashboardData.profile.address;
    if (profileData?.address) return profileData.address;
    if (user?.address) return user.address;
    return '';
  };

  // Helper to get value from multiple sources
  const getValue = (...sources: any[]) => {
    for (const source of sources) {
      if (source !== undefined && source !== null && source !== '') {
        return source;
      }
    }
    return '';
  };

  // Helper to get array value
  const getArrayValue = (...sources: any[]) => {
    for (const source of sources) {
      if (Array.isArray(source) && source.length > 0) {
        return source;
      }
    }
    return [];
  };

  // Check which steps are completed
  const completedSteps = dashboardData?.onboarding?.data?.completedSteps || [];
  const isStep1Completed = completedSteps.includes('profile_setup');
  const isStep2Completed = completedSteps.includes('goals_setup');
  const isStep3Completed = completedSteps.includes('recommendations');
  const isStep4Completed = completedSteps.includes('rendezvous');
  
  // Check if onboarding is fully completed (all 4 steps)
  const isOnboardingComplete = isStep1Completed && isStep2Completed && isStep3Completed && isStep4Completed;

  // Debug log - comprehensive data check
  if (__DEV__) {
    const currentProfile = getProfileData();
    console.log('📊 ProfileInformationsSection - Complete data check:', {
      completedSteps,
      isStep1Completed,
      isStep2Completed,
      hasDashboardData: !!dashboardData,
      hasProfileData: !!profileData,
      hasUser: !!user,
      dashboardStructure: {
        hasOnboarding: !!dashboardData?.onboarding,
        hasProfile: !!dashboardData?.profile,
        hasProfileProfile: !!dashboardData?.profile?.Profile,
        hasProfileProfile2: !!dashboardData?.profile?.profile,
        hasProfileDirect: !!dashboardData?.Profile,
      },
      currentProfileData: {
        height: currentProfile.height,
        initialWeight: currentProfile.initialWeight,
        initialWaistSize: currentProfile.initialWaistSize,
        targetWeight: currentProfile.targetWeight,
        targetWaistSize: currentProfile.targetWaistSize,
        goal: currentProfile.goal,
        goals: currentProfile.goals,
        dietaryRestrictions: currentProfile.dietaryRestrictions,
      },
    });
  }

  // Parse address if it exists
  // Format attendu: "line1; line2; city; postalCode; country" (5 parties avec séparateurs)
  // Format ancien possible: "line1; city; postalCode; country" (4 parties)
  const parseAddress = (address: string) => {
    if (!address) return { line1: '', line2: '', city: '', postalCode: '', country: '' };
    
    // Toujours parser en gardant les parties vides pour maintenir la structure
    const allParts = address.split(';').map(p => p.trim());
    
    // Si on a 5 parties ou plus (avec séparateurs), c'est le nouveau format
    if (allParts.length >= 5) {
      return {
        line1: allParts[0] || '',
        line2: allParts[1] || '',
        city: allParts[2] || '',
        postalCode: allParts[3] || '',
        country: allParts[4] || '',
      };
    }
    
    // Si on a 4 parties, c'est l'ancien format (pas de ligne 2)
    if (allParts.length === 4) {
      return {
        line1: allParts[0] || '',
        line2: '', // Pas de ligne 2 dans l'ancien format
        city: allParts[1] || '',
        postalCode: allParts[2] || '',
        country: allParts[3] || '',
      };
    }
    
    // Fallback par défaut
    return {
      line1: allParts[0] || '',
      line2: '',
      city: allParts[1] || '',
      postalCode: allParts[2] || '',
      country: allParts[3] || '',
    };
  };

  const profile = getProfileData();
  const initialAddress = parseAddress(getAddress());
  
  // Restrictions alimentaires en français (même liste que ProfileStep2BottomSheet)
  const DIETARY_RESTRICTIONS = [
    'Végétarien',
    'Vegan',
    'Sans lactose',
    'Sans gluten',
    'Sans noix',
    'Sans œufs',
    'Sans fruits de mer',
    'Halal',
    'Casher',
    'Aucune',
    'Autre'
  ];

  // Form state - Step 1 data
  const [formData, setFormData] = useState({
    // Step 1: Personal info - check all sources
    firstName: getValue(
      user?.firstName,
      profileData?.firstName,
      dashboardData?.profile?.Profile?.firstName,
      dashboardData?.profile?.profile?.firstName,
      dashboardData?.profile?.firstName,
      dashboardData?.Profile?.firstName,
      ''
    ),
    lastName: getValue(
      user?.lastName,
      profileData?.lastName,
      dashboardData?.profile?.Profile?.lastName,
      dashboardData?.profile?.profile?.lastName,
      dashboardData?.profile?.lastName,
      dashboardData?.Profile?.lastName,
      ''
    ),
    email: getValue(
      user?.email,
      profileData?.email,
      dashboardData?.profile?.email,
      dashboardData?.email,
      ''
    ),
    phone: getValue(
      user?.phoneNumber,
      user?.phone,
      profileData?.phoneNumber,
      dashboardData?.profile?.Profile?.phoneNumber,
      dashboardData?.profile?.profile?.phoneNumber,
      dashboardData?.profile?.phoneNumber,
      dashboardData?.Profile?.phoneNumber,
      ''
    ),
    addressLine1: initialAddress.line1 || '',
    addressLine2: initialAddress.line2 || '',
    city: initialAddress.city || '',
    postalCode: initialAddress.postalCode || '',
    country: initialAddress.country || '',
    // Step 1: Profile
    height: profile.height ? profile.height.toString() : '',
    initialWeight: profile.initialWeight ? profile.initialWeight.toString() : '',
    initialWaistSize: profile.initialWaistSize ? profile.initialWaistSize.toString() : '',
    gender: profile.gender === 'male' ? 'Homme' : profile.gender === 'female' ? 'Femme' : profile.gender || '',
    occupation: profile.occupation || '',
    // Step 2: Goals - check all possible sources
    targetWeight: profile.targetWeight !== undefined && profile.targetWeight !== null 
      ? profile.targetWeight.toString() 
      : (dashboardData?.profile?.Profile?.targetWeight !== undefined && dashboardData.profile.Profile.targetWeight !== null
        ? dashboardData.profile.Profile.targetWeight.toString()
        : (dashboardData?.profile?.profile?.targetWeight !== undefined && dashboardData.profile.profile.targetWeight !== null
          ? dashboardData.profile.profile.targetWeight.toString()
          : (dashboardData?.Profile?.targetWeight !== undefined && dashboardData.Profile.targetWeight !== null
            ? dashboardData.Profile.targetWeight.toString()
            : (profileData?.Profile?.targetWeight !== undefined && profileData.Profile.targetWeight !== null
              ? profileData.Profile.targetWeight.toString()
              : '')))),
    targetWaistSize: profile.targetWaistSize !== undefined && profile.targetWaistSize !== null 
      ? profile.targetWaistSize.toString() 
      : (dashboardData?.profile?.Profile?.targetWaistSize !== undefined && dashboardData.profile.Profile.targetWaistSize !== null
        ? dashboardData.profile.Profile.targetWaistSize.toString()
        : (dashboardData?.profile?.profile?.targetWaistSize !== undefined && dashboardData.profile.profile.targetWaistSize !== null
          ? dashboardData.profile.profile.targetWaistSize.toString()
          : (dashboardData?.Profile?.targetWaistSize !== undefined && dashboardData.Profile.targetWaistSize !== null
            ? dashboardData.Profile.targetWaistSize.toString()
            : (profileData?.Profile?.targetWaistSize !== undefined && profileData.Profile.targetWaistSize !== null
              ? profileData.Profile.targetWaistSize.toString()
              : '')))),
    goal: profile.goal || dashboardData?.profile?.Profile?.goal || dashboardData?.profile?.profile?.goal || dashboardData?.Profile?.goal || profileData?.Profile?.goal || '',
    goals: getArrayValue(
      profile.goals,
      dashboardData?.profile?.Profile?.goals,
      dashboardData?.profile?.profile?.goals,
      dashboardData?.Profile?.goals,
      profileData?.Profile?.goals,
      []
    ),
    dietaryRestrictions: getArrayValue(
      profile.dietaryRestrictions,
      dashboardData?.profile?.Profile?.dietaryRestrictions,
      dashboardData?.profile?.profile?.dietaryRestrictions,
      dashboardData?.Profile?.dietaryRestrictions,
      profileData?.Profile?.dietaryRestrictions,
      []
    ),
  });

  const [newSpecificGoal, setNewSpecificGoal] = useState('');

  // Initialize form data from dashboardData when available
  useEffect(() => {
    // Get profile from all sources
    const currentProfile = getProfileData();
    const currentAddress = parseAddress(getAddress());
      
    // Debug log
    console.log('📊 ProfileInformationsSection - Loading all data:', {
      hasDashboardData: !!dashboardData,
      hasProfileData: !!profileData,
      hasUser: !!user,
      profileStructure: {
        dashboardProfile: !!dashboardData?.profile?.Profile,
        dashboardProfile2: !!dashboardData?.profile?.profile,
        dashboardProfileDirect: !!dashboardData?.Profile,
        profileDataProfile: !!profileData?.Profile,
      },
      currentProfile: {
        hasHeight: !!currentProfile.height,
        hasInitialWeight: !!currentProfile.initialWeight,
        hasTargetWeight: !!currentProfile.targetWeight,
        hasTargetWaistSize: !!currentProfile.targetWaistSize,
        hasGoal: !!currentProfile.goal,
        goalsCount: currentProfile.goals?.length || 0,
        restrictionsCount: currentProfile.dietaryRestrictions?.length || 0,
      },
      completedSteps,
      isStep1Completed,
      isStep2Completed,
      isStep3Completed,
      formDataValues: {
        targetWeight: formData.targetWeight,
        targetWaistSize: formData.targetWaistSize,
        goal: formData.goal,
        goalsCount: formData.goals?.length || 0,
        restrictionsCount: formData.dietaryRestrictions?.length || 0,
      },
    });
    
    setFormData(prev => ({
      ...prev,
      // Step 1: Personal info - check all sources
      firstName: getValue(
        user?.firstName,
        profileData?.firstName,
        dashboardData?.profile?.Profile?.firstName,
        dashboardData?.profile?.profile?.firstName,
        dashboardData?.profile?.firstName,
        dashboardData?.Profile?.firstName,
        prev.firstName
      ),
      lastName: getValue(
        user?.lastName,
        profileData?.lastName,
        dashboardData?.profile?.Profile?.lastName,
        dashboardData?.profile?.profile?.lastName,
        dashboardData?.profile?.lastName,
        dashboardData?.Profile?.lastName,
        prev.lastName
      ),
      email: getValue(
        user?.email,
        profileData?.email,
        dashboardData?.profile?.email,
        dashboardData?.email,
        prev.email
      ),
      phone: getValue(
        user?.phoneNumber,
        user?.phone,
        profileData?.phoneNumber,
        dashboardData?.profile?.Profile?.phoneNumber,
        dashboardData?.profile?.profile?.phoneNumber,
        dashboardData?.profile?.phoneNumber,
        dashboardData?.Profile?.phoneNumber,
        prev.phone
      ),
      addressLine1: currentAddress.line1 || prev.addressLine1,
      addressLine2: currentAddress.line2 || prev.addressLine2,
      city: currentAddress.city || prev.city,
      postalCode: currentAddress.postalCode || prev.postalCode,
      country: currentAddress.country || prev.country,
      // Step 1: Profile
      height: currentProfile.height ? currentProfile.height.toString() : prev.height,
      initialWeight: currentProfile.initialWeight ? currentProfile.initialWeight.toString() : prev.initialWeight,
      initialWaistSize: currentProfile.initialWaistSize ? currentProfile.initialWaistSize.toString() : prev.initialWaistSize,
      gender: currentProfile.gender === 'male' ? 'Homme' : currentProfile.gender === 'female' ? 'Femme' : currentProfile.gender || prev.gender,
      occupation: currentProfile.occupation || prev.occupation,
      // Step 2: Goals - prioritize dashboardData, check all possible locations
      targetWeight: currentProfile.targetWeight !== undefined && currentProfile.targetWeight !== null 
        ? currentProfile.targetWeight.toString() 
        : (profileData?.Profile?.targetWeight !== undefined && profileData.Profile.targetWeight !== null 
          ? profileData.Profile.targetWeight.toString() 
          : (dashboardData?.profile?.Profile?.targetWeight !== undefined && dashboardData.profile.Profile.targetWeight !== null
            ? dashboardData.profile.Profile.targetWeight.toString()
            : (dashboardData?.profile?.profile?.targetWeight !== undefined && dashboardData.profile.profile.targetWeight !== null
              ? dashboardData.profile.profile.targetWeight.toString()
              : prev.targetWeight))),
      targetWaistSize: currentProfile.targetWaistSize !== undefined && currentProfile.targetWaistSize !== null 
        ? currentProfile.targetWaistSize.toString() 
        : (profileData?.Profile?.targetWaistSize !== undefined && profileData.Profile.targetWaistSize !== null 
          ? profileData.Profile.targetWaistSize.toString() 
          : (dashboardData?.profile?.Profile?.targetWaistSize !== undefined && dashboardData.profile.Profile.targetWaistSize !== null
            ? dashboardData.profile.Profile.targetWaistSize.toString()
            : (dashboardData?.profile?.profile?.targetWaistSize !== undefined && dashboardData.profile.profile.targetWaistSize !== null
              ? dashboardData.profile.profile.targetWaistSize.toString()
              : prev.targetWaistSize))),
      goal: currentProfile.goal || profileData?.Profile?.goal || dashboardData?.profile?.Profile?.goal || dashboardData?.profile?.profile?.goal || prev.goal,
      goals: getArrayValue(
        currentProfile.goals,
        profileData?.Profile?.goals,
        dashboardData?.profile?.Profile?.goals,
        dashboardData?.profile?.profile?.goals,
        prev.goals
      ),
      dietaryRestrictions: getArrayValue(
        currentProfile.dietaryRestrictions,
        profileData?.Profile?.dietaryRestrictions,
        dashboardData?.profile?.Profile?.dietaryRestrictions,
        dashboardData?.profile?.profile?.dietaryRestrictions,
        prev.dietaryRestrictions
      ),
    }));
    }, [dashboardData, profileData, user, completedSteps, isStep1Completed, isStep2Completed, isStep3Completed]);

  // Use formData for address when editing personalInfo, otherwise use parsed address
  const displayAddress = editingSections.personalInfo ? {
    line1: formData.addressLine1,
    line2: formData.addressLine2,
    city: formData.city,
    postalCode: formData.postalCode,
    country: formData.country,
  } : parseAddress(profileData?.address || user?.address || '');

  // Group info items by section - use formData when editing
  const personalInfo = [
    {
      icon: 'person-outline',
      label: 'Prénom',
      value: editingSections.personalInfo ? formData.firstName : (user?.firstName || profileData?.firstName || 'Non renseigné'),
      key: 'firstName',
    },
    {
      icon: 'person-outline',
      label: 'Nom',
      value: editingSections.personalInfo ? formData.lastName : (user?.lastName || profileData?.lastName || 'Non renseigné'),
      key: 'lastName',
    },
    {
      icon: 'mail-outline',
      label: 'Email',
      value: user?.email || profileData?.email || 'Non renseigné',
      key: 'email',
      editable: false, // Email non éditable
    },
    {
      icon: 'call-outline',
      label: 'Téléphone',
      value: editingSections.personalInfo ? formData.phone : (user?.phoneNumber || user?.phone || profileData?.phoneNumber || 'Non renseigné'),
      key: 'phone',
    },
  ];

  // Save handlers for each section
  const handleSavePersonalInfo = async () => {
    const profileUpdateData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: formData.phone.trim(),
      addressLine1: formData.addressLine1.trim(),
      addressLine2: formData.addressLine2.trim(),
      city: formData.city.trim(),
      postalCode: formData.postalCode.trim(),
      country: formData.country.trim(),
      height: formData.height.trim() || '0',
      initialWeight: formData.initialWeight.trim() || '0',
      initialWaistSize: formData.initialWaistSize.trim() || '0',
      gender: formData.gender === 'Homme' ? 'male' : formData.gender === 'Femme' ? 'female' : 'male',
      occupation: formData.occupation.trim() || '',
    };

    const result = await completeProfileSetup(profileUpdateData);
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la sauvegarde des informations personnelles');
    }
    
    if (onSave) {
      onSave();
    }
  };

  const handleSaveProfile = async () => {
    const profileUpdateData = {
      firstName: formData.firstName.trim() || user?.firstName || '',
      lastName: formData.lastName.trim() || user?.lastName || '',
      phoneNumber: formData.phone.trim() || user?.phoneNumber || '',
      addressLine1: formData.addressLine1.trim() || '',
      addressLine2: formData.addressLine2.trim() || '',
      city: formData.city.trim() || '',
      postalCode: formData.postalCode.trim() || '',
      country: formData.country.trim() || '',
      height: formData.height.trim(),
      initialWeight: formData.initialWeight.trim(),
      initialWaistSize: formData.initialWaistSize.trim(),
      gender: formData.gender === 'Homme' ? 'male' : formData.gender === 'Femme' ? 'female' : 'male',
      occupation: formData.occupation.trim(),
    };

    const result = await completeProfileSetup(profileUpdateData);
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la sauvegarde du profil');
    }
    
    if (onSave) {
      onSave();
    }
  };

  const handleSaveObjectives = async () => {
    const goalsUpdateData = {
      targetWeight: formData.targetWeight.trim(),
      targetWaistSize: formData.targetWaistSize.trim(),
      goal: formData.goal.trim(),
      goals: formData.goals,
      dietaryRestrictions: formData.dietaryRestrictions,
    };

    const result = await completeGoalsSetup(goalsUpdateData);
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la sauvegarde des objectifs');
    }
    
    if (onSave) {
      onSave();
    }
  };

  const addressInfo = [
    {
      icon: 'location-outline',
      label: 'Adresse ligne 1',
      value: displayAddress.line1 || 'Non renseigné',
      key: 'addressLine1',
    },
    {
      icon: 'location-outline',
      label: 'Adresse ligne 2',
      value: displayAddress.line2 || 'N/A',
      key: 'addressLine2',
    },
    {
      icon: 'business-outline',
      label: 'Ville',
      value: displayAddress.city || 'Non renseigné',
      key: 'city',
    },
    {
      icon: 'mail-outline',
      label: 'Code postal',
      value: displayAddress.postalCode || 'Non renseigné',
      key: 'postalCode',
    },
    {
      icon: 'globe-outline',
      label: 'Pays',
      value: displayAddress.country || 'Non renseigné',
      key: 'country',
    },
  ];


  const renderField = (item: any, formKey: string, sectionKey?: 'personalInfo' | 'profile' | 'objectives') => {
    const isEditingSection = sectionKey ? editingSections[sectionKey] : false;
    if (isEditingSection && item.editable !== false) {
      if (item.unit) {
        // Field with unit (height, weight, etc.)
        return (
          <View style={styles.inputWithUnit}>
            <TextInput
              style={[styles.input, styles.inputWithUnitInput]}
              value={formData[formKey as keyof typeof formData]?.toString().replace(item.unit || '', '') || ''}
              onChangeText={(text) => {
                const cleanText = text.replace(/[^0-9.]/g, '');
                setFormData(prev => ({ ...prev, [formKey]: cleanText }));
              }}
              placeholder={item.label || 'Entrez une valeur'}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            {item.unit && <Text style={styles.unitText}>{item.unit}</Text>}
          </View>
        );
      }
      return (
        <TextInput
          style={styles.input}
          value={formData[formKey as keyof typeof formData]?.toString() || ''}
          onChangeText={(text) => setFormData(prev => ({ ...prev, [formKey]: text }))}
          placeholder={item.label || (formKey === 'phone' ? 'Numéro de téléphone' : formKey === 'email' ? 'Email' : 'Entrez une valeur')}
          placeholderTextColor="#999"
          keyboardType={formKey === 'phone' ? 'phone-pad' : formKey === 'email' ? 'email-address' : 'default'}
          multiline={formKey === 'goal' || formKey === 'goals'}
        />
      );
    }
    return (
      <Text style={styles.infoValue} numberOfLines={2}>
        {item.value}
      </Text>
    );
  };

  const addSpecificGoal = () => {
    if (newSpecificGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...(prev.goals || []), newSpecificGoal.trim()]
      }));
      setNewSpecificGoal('');
    }
  };

  const removeSpecificGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_: any, i: number) => i !== index)
    }));
  };

  const toggleDietaryRestriction = (restriction: string) => {
    const current = formData.dietaryRestrictions || [];
    if (current.includes(restriction)) {
      setFormData(prev => ({
        ...prev,
        dietaryRestrictions: current.filter(r => r !== restriction)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dietaryRestrictions: [...current, restriction]
      }));
    }
  };

  // Debug log at render time
  if (__DEV__) {
    console.log('📋 [ProfileInformationsSection] RENDERING - Current state:', {
      hasDashboardData: !!dashboardData,
      hasProfileData: !!profileData,
      completedSteps,
      isStep1Completed,
      isStep2Completed,
      isStep3Completed,
      formData: {
        targetWeight: formData.targetWeight,
        targetWaistSize: formData.targetWaistSize,
        goal: formData.goal,
        goals: formData.goals,
        dietaryRestrictions: formData.dietaryRestrictions,
      },
    });
  }

  // Helper to render a section with header and modify button
  const renderSection = (
    title: string,
    icon: string,
    sectionKey: 'personalInfo' | 'profile' | 'objectives',
    isEditable: boolean,
    children: React.ReactNode,
    onSave?: () => Promise<void>
  ) => {
    const isEditing = editingSections[sectionKey];
    const isSaving = savingSections[sectionKey];
    
    const handleSave = async () => {
      if (onSave) {
        try {
          setSavingSections(prev => ({ ...prev, [sectionKey]: true }));
          await onSave();
          setEditingSections(prev => ({ ...prev, [sectionKey]: false }));
          Toast.show({
            type: 'success',
            text1: 'Informations mises à jour',
            text2: 'Vos informations ont été sauvegardées avec succès',
            visibilityTime: 3000,
          });
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: error.message || 'Impossible de sauvegarder les informations',
            visibilityTime: 3000,
          });
        } finally {
          setSavingSections(prev => ({ ...prev, [sectionKey]: false }));
        }
      }
    };
    
    const handleCancel = () => {
      cancelEditing(sectionKey);
      // Reload form data from dashboardData to reset changes
      const currentProfile = getProfileData();
      const currentAddress = parseAddress(getAddress());
      setFormData(prev => ({
        ...prev,
        ...(sectionKey === 'personalInfo' ? {
          firstName: getValue(user?.firstName, profileData?.firstName, dashboardData?.profile?.Profile?.firstName, prev.firstName),
          lastName: getValue(user?.lastName, profileData?.lastName, dashboardData?.profile?.Profile?.lastName, prev.lastName),
          phone: getValue(user?.phoneNumber, user?.phone, profileData?.phoneNumber, dashboardData?.profile?.Profile?.phoneNumber, prev.phone),
          addressLine1: currentAddress.line1 || prev.addressLine1,
          addressLine2: currentAddress.line2 || prev.addressLine2,
          city: currentAddress.city || prev.city,
          postalCode: currentAddress.postalCode || prev.postalCode,
          country: currentAddress.country || prev.country,
        } : {}),
        ...(sectionKey === 'profile' ? {
          height: currentProfile.height ? currentProfile.height.toString() : prev.height,
          initialWeight: currentProfile.initialWeight ? currentProfile.initialWeight.toString() : prev.initialWeight,
          initialWaistSize: currentProfile.initialWaistSize ? currentProfile.initialWaistSize.toString() : prev.initialWaistSize,
          gender: currentProfile.gender === 'male' ? 'Homme' : currentProfile.gender === 'female' ? 'Femme' : prev.gender,
          occupation: currentProfile.occupation || prev.occupation,
        } : {}),
        ...(sectionKey === 'objectives' ? {
          targetWeight: currentProfile.targetWeight !== undefined && currentProfile.targetWeight !== null 
            ? currentProfile.targetWeight.toString() 
            : prev.targetWeight,
          targetWaistSize: currentProfile.targetWaistSize !== undefined && currentProfile.targetWaistSize !== null 
            ? currentProfile.targetWaistSize.toString() 
            : prev.targetWaistSize,
          goal: currentProfile.goal || prev.goal,
          goals: getArrayValue(currentProfile.goals, dashboardData?.profile?.Profile?.goals, prev.goals),
          dietaryRestrictions: getArrayValue(currentProfile.dietaryRestrictions, dashboardData?.profile?.Profile?.dietaryRestrictions, prev.dietaryRestrictions),
        } : {}),
      }));
    };

    return (
      <View style={styles.sectionContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name={icon as any} size={26} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          {isEditable && !isEditing && (
            <TouchableOpacity
              onPress={() => startEditing(sectionKey)}
              style={[
                styles.modifyButton,
                !isOnboardingComplete && styles.modifyButtonDisabled
              ]}
              disabled={!isOnboardingComplete}
            >
              <Ionicons 
                name="create-outline" 
                size={18} 
                color={!isOnboardingComplete ? theme.colors.text.secondary : theme.colors.primary} 
              />
              <Text style={[
                styles.modifyButtonText,
                !isOnboardingComplete && styles.modifyButtonTextDisabled
              ]}>
                Modifier
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Action Buttons - Below title when editing */}
        {isEditable && isEditing && (
          <View style={styles.sectionActionsBar}>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.cancelButtonSmall}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonTextSmall}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButtonSmall}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonTextSmall}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Section Content */}
        <View style={styles.sectionContent}>
          {children}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Infos personnelles */}
        {renderSection(
          'Infos personnelles',
          'person-outline',
          'personalInfo',
          true,
          <>
            {personalInfo.map((item, index) => (
              <View key={index} style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <Ionicons name={item.icon as any} size={20} color={theme.colors.text.secondary} />
                  <Text style={styles.infoLabel}>{item.label}</Text>
                </View>
                {renderField(item, item.key, 'personalInfo')}
              </View>
            ))}
            {/* Adresse dans la même section */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Adresse</Text>
              {addressInfo.map((item, index) => (
                <View key={index} style={styles.infoItem}>
                  <View style={styles.infoItemLeft}>
                    <Ionicons name={item.icon as any} size={20} color={theme.colors.text.secondary} />
                    <Text style={styles.infoLabel}>{item.label}</Text>
                  </View>
                  {renderField(item, item.key, 'personalInfo')}
                </View>
              ))}
            </View>
          </>,
          handleSavePersonalInfo
        )}

        {/* Séparateur */}
        <View style={styles.separator} />

        {/* Mon profil */}
        {isStep1Completed && renderSection(
          'Mon profil',
          'person-circle-outline',
          'profile',
          true,
          <>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="resize-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Taille</Text>
              </View>
              {renderField({ 
                value: formData.height ? `${formData.height}m` : 'Non renseigné',
                key: 'height',
                unit: 'm',
                editable: true
              }, 'height', 'profile')}
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="scale-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Poids initial</Text>
              </View>
              {renderField({ 
                value: formData.initialWeight ? `${formData.initialWeight}kg` : 'Non renseigné',
                key: 'initialWeight',
                unit: 'kg',
                editable: true
              }, 'initialWeight', 'profile')}
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="ellipse-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Tour de taille initial</Text>
              </View>
              {renderField({ 
                value: formData.initialWaistSize ? `${formData.initialWaistSize}cm` : 'Non renseigné',
                key: 'initialWaistSize',
                unit: 'cm',
                editable: true
              }, 'initialWaistSize', 'profile')}
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="people-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Genre</Text>
              </View>
              {renderField({ 
                value: formData.gender || 'Non renseigné',
                key: 'gender',
                editable: true
              }, 'gender', 'profile')}
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="briefcase-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Occupation</Text>
              </View>
              {renderField({ 
                value: formData.occupation || 'Non renseigné',
                key: 'occupation',
                editable: true
              }, 'occupation', 'profile')}
            </View>
          </>,
          handleSaveProfile
        )}

        {/* Séparateur */}
        {isStep1Completed && <View style={styles.separator} />}

        {/* Objectifs cible */}
        {renderSection(
          'Objectifs cible',
          'flag-outline',
          'objectives',
          true,
          <>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="scale-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Poids cible</Text>
              </View>
              {renderField({ 
                value: formData.targetWeight ? `${formData.targetWeight}kg` : 'Non renseigné',
                key: 'targetWeight',
                unit: 'kg',
                editable: true
              }, 'targetWeight', 'objectives')}
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="ellipse-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Tour de taille cible</Text>
              </View>
              {renderField({ 
                value: formData.targetWaistSize ? `${formData.targetWaistSize}cm` : 'Non renseigné',
                key: 'targetWaistSize',
                unit: 'cm',
                editable: true
              }, 'targetWaistSize', 'objectives')}
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="flag-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Objectif général</Text>
              </View>
              {renderField({ 
                value: formData.goal || 'Non renseigné',
                key: 'goal',
                editable: true
              }, 'goal', 'objectives')}
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="list-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Objectifs spécifiques</Text>
              </View>
              <View style={styles.goalsList}>
                {editingSections.objectives ? (
                  <>
                    {formData.goals.map((goal: string, index: number) => (
                      <View key={index} style={styles.goalTag}>
                        <Text style={styles.goalTagText}>{goal}</Text>
                        <TouchableOpacity onPress={() => removeSpecificGoal(index)}>
                          <Ionicons name="close-circle" size={18} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={styles.addGoalContainer}>
                      <TextInput
                        style={styles.addGoalInput}
                        value={newSpecificGoal}
                        onChangeText={setNewSpecificGoal}
                        placeholder="Ajouter un objectif"
                        onSubmitEditing={addSpecificGoal}
                      />
                      <TouchableOpacity onPress={addSpecificGoal} style={styles.addGoalButton}>
                        <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <Text style={styles.infoValue}>
                    {formData.goals.length > 0 ? formData.goals.join(', ') : 'Non renseigné'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons name="restaurant-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={styles.infoLabel}>Restrictions alimentaires</Text>
              </View>
              {editingSections.objectives ? (
                <View style={styles.restrictionsContainer}>
                  {DIETARY_RESTRICTIONS.map((restriction) => (
                    <TouchableOpacity
                      key={restriction}
                      style={[
                        styles.restrictionChip,
                        formData.dietaryRestrictions.includes(restriction) && styles.restrictionChipSelected
                      ]}
                      onPress={() => toggleDietaryRestriction(restriction)}
                    >
                      <Text style={[
                        styles.restrictionChipText,
                        formData.dietaryRestrictions.includes(restriction) && styles.restrictionChipTextSelected
                      ]}>
                        {restriction}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoValue}>
                  {formData.dietaryRestrictions.length > 0 ? formData.dietaryRestrictions.join(', ') : 'Non renseigné'}
                </Text>
              )}
            </View>
          </>,
          handleSaveObjectives
        )}


      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    margin:15,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 10,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  sectionActionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  modifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  modifyButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  modifyButtonDisabled: {
    opacity: 0.5,
    borderColor: theme.colors.text.secondary,
  },
  modifyButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
  cancelButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  cancelButtonTextSmall: {
    fontSize: 13,
    color: theme.colors.error,
    fontWeight: '500',
  },
  saveButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  saveButtonTextSmall: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sectionContent: {
    paddingHorizontal: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
    marginHorizontal: 20,
  },
  input: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  inputWithUnitInput: {
    flex: 1,
    marginRight: 8,
  },
  unitText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  section: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  goalsList: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  goalTagText: {
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  addGoalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addGoalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
  },
  addGoalButton: {
    padding: 4,
  },
  restrictionsContainer: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  restrictionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  restrictionChipSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  restrictionChipText: {
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  restrictionChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  instructionsContainer: {
    flex: 1,
    marginLeft: 12,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  accordionContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  accordionHeaderCompleted: {
    backgroundColor: '#F1F8F4',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  accordionTitleCompleted: {
    color: '#2E7D32',
  },
  checkIcon: {
    marginLeft: 8,
  },
  accordionContent: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  subsection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  accordionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editIconButton: {
    padding: 4,
  },
  editActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  cancelButtonText: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default ProfileInformationsSection;

