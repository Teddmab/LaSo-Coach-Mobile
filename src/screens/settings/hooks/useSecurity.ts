import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../context/FirebaseAuthContext';
import { SecurityFormData, SecurityInfo, ExpandedSections } from '../types';

export const useSecurity = (userEmail?: string) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<SecurityFormData>({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo>({
    lastLogin: '—',
    lastPasswordChange: '—',
  });

  useEffect(() => {
    // Initialize with user data
    const email = user?.email || userEmail || '';
    setFormData(prev => ({ ...prev, email }));
    
    // TODO: Fetch last login and last password change from API
    // For now, using placeholders
  }, [user, userEmail]);

  const handleUpdateEmail = (): void => {
    // TODO: Implement email update API call
    Alert.alert('Placeholder', 'Email update functionality will be implemented soon.');
  };

  const handleChangePassword = (): void => {
    // TODO: Implement password change API call
    Alert.alert('Placeholder', 'Password change functionality will be implemented soon.');
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion API call
            Alert.alert('Placeholder', 'Account deletion functionality will be implemented soon.');
          },
        },
      ]
    );
  };

  return {
    formData,
    securityInfo,
    setFormData,
    handleUpdateEmail,
    handleChangePassword,
    handleDeleteAccount,
  };
};

