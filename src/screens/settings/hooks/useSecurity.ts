import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../context/FirebaseAuthContext';
import { firebaseAuthService } from '../../../services/firebaseAuthServiceNew';
import { SecurityFormData, SecurityInfo, ExpandedSections } from '../types';

export const useSecurity = (userEmail?: string) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  
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
    // First confirmation: Are you sure?
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
            // Second confirmation: Really really sure?
            Alert.alert(
              'Confirmation définitive',
              'Cette action supprimera:\n• Votre compte\n• Tous vos données personnelles\n• Votre historique d\'abonnement\n• Tous les tokens d\'authentification\n\nCette action est IRRÉVERSIBLE. Continuez?',
              [
                {
                  text: 'Annuler',
                  style: 'cancel',
                  onPress: () => {
                    // User cancelled final confirmation
                  },
                },
                {
                  text: 'Oui, supprimer mon compte',
                  style: 'destructive',
                  onPress: () => {
                    // Proceed with deletion
                    performAccountDeletion();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const performAccountDeletion = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      console.log('🗑️ [useSecurity] Starting account deletion...');
      
      // Call the enhanced deleteAccount method
      await firebaseAuthService.deleteAccount();
      
      console.log('✅ [useSecurity] Account deletion successful');
      
      // Show success message
      Alert.alert(
        'Compte supprimé',
        'Votre compte a été supprimé avec succès. Vous serez redirigé vers l\'écran de connexion.',
        [
          {
            text: 'OK',
            onPress: () => {
              // The auth state listener in App.tsx will handle navigation to Login screen
              // when currentUser becomes null
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ [useSecurity] Account deletion failed:', error?.message);
      
      setIsDeleting(false);
      
      // Show error message
      const errorMessage = error?.message || 'Failed to delete account. Please try again.';
      Alert.alert(
        'Erreur lors de la suppression',
        `Une erreur est survenue: ${errorMessage}`,
        [
          {
            text: 'OK',
            style: 'cancel',
          },
          {
            text: 'Contacter le support',
            onPress: () => {
              // Could navigate to support screen here if needed
            },
          },
        ]
      );
    }
  };

  return {
    formData,
    securityInfo,
    setFormData,
    handleUpdateEmail,
    handleChangePassword,
    handleDeleteAccount,
    isDeleting,
  };
};

