import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import FixedLayout from '../components/FixedLayout';
import { useSecurity } from './settings/hooks/useSecurity';
import SecurityForm from './settings/components/SecurityForm';
import DangerZone from './settings/components/DangerZone';
import { ProfileApi } from '../services/profileApi';
import { useAuth } from '../context/FirebaseAuthContext';
import firebaseAuthService from '../services/firebaseAuthServiceNew';
import AccountDeletionBottomSheet from '../components/settings/AccountDeletionBottomSheet';

interface SecurityScreenProps {
  onClose: () => void;
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  avatarSource?: any;
  avatarFallbackText?: string;
  onLinkPress: (linkId: string) => void;
  onLogout?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const SecurityScreen: React.FC<SecurityScreenProps> = ({
  onClose,
  activeTab,
  onTabPress,
  avatarSource,
  avatarFallbackText,
  onLinkPress,
  onLogout,
  showBackButton = false,
  onBackPress,
}) => {
  const { user, logout } = useAuth();
  const {
    formData,
    securityInfo,
    setFormData,
    handleUpdateEmail,
    handleChangePassword,
    handleDeleteAccount,
  } = useSecurity(user?.email || '');

  const [loading, setLoading] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showDeletionBottomSheet, setShowDeletionBottomSheet] = useState(false);
  const [profileLog, setProfileLog] = useState<{
    email: string;
    lastLogin?: string;
    lastPasswordChange?: string;
  } | null>(null);

  // Load profile data for account info
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profile = await ProfileApi.getProfile();
        if (profile) {
          setProfileLog({
            email: profile.email || user?.email || '',
            lastLogin: profile.lastLogin,
            lastPasswordChange: profile.updatedAt,
          });
          // Update securityInfo with actual data
          if (profile.lastLogin || profile.updatedAt) {
            // This will be handled by useSecurity hook
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };
    loadProfileData();
  }, [user]);

  const handleEmailUpdate = async () => {
    setEmailSaving(true);
    setEmailSuccess(null);
    setEmailError(null);
    try {
      // TODO: Implement email update API call
      // For now, show placeholder
      setEmailError("La mise à jour de l'email n'est pas encore disponible.");
    } catch (error: any) {
      setEmailError(error.message || "Erreur lors de la mise à jour de l'email");
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordSaving(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      setPasswordSaving(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
      setPasswordSaving(false);
      return;
    }

    try {
      await firebaseAuthService.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setPasswordSuccess('Mot de passe mis à jour !');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setPasswordError(error.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setShowDeletionBottomSheet(true);
  };

  const handleDeleteAccountConfirm = async (feedback?: { reason?: string; comments?: string }) => {
    console.log('🗑️ [SecurityScreen] Starting account deletion flow...');
    console.log('📝 [SecurityScreen] Feedback provided:', {
      reason: feedback?.reason || 'none',
      hasComments: !!feedback?.comments,
      commentsLength: feedback?.comments?.length || 0,
    });
    
    try {
      // Delete account from backend with feedback
      console.log('📡 [SecurityScreen] Calling ProfileApi.deleteAccount() with feedback...');
      await ProfileApi.deleteAccount(feedback);
      console.log('✅ [SecurityScreen] Backend account deletion successful');
      
      // Delete Firebase account
      console.log('🔥 [SecurityScreen] Calling firebaseAuthService.deleteAccount()...');
      await firebaseAuthService.deleteAccount();
      console.log('✅ [SecurityScreen] Firebase account deletion successful');
      
      console.log('✅ [SecurityScreen] Account deletion completed successfully');
      
      // Logout after a delay (handled by bottom sheet goodbye message)
      setTimeout(() => {
        console.log('👋 [SecurityScreen] Logging out user...');
        if (onLogout) {
          onLogout();
        } else {
          logout();
        }
      }, 2000);
    } catch (error: any) {
      console.error('❌ [SecurityScreen] Account deletion failed');
      console.error('❌ [SecurityScreen] Error:', error);
      console.error('❌ [SecurityScreen] Error message:', error.message);
      console.error('❌ [SecurityScreen] Error stack:', error.stack);
      
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
      throw error; // Re-throw to let bottom sheet handle the error state
    }
  };

  return (
    <>
      <FixedLayout
        headerTitle="Sécurité & Connexion"
        activeTab={activeTab}
        onTabPress={onTabPress}
        onHelpPress={() => {}}
        onNotificationPress={() => {}}
        onProfilePress={() => {}}
        avatarSource={avatarSource}
        avatarFallbackText={avatarFallbackText}
        showBackButton={showBackButton}
        onBackPress={onBackPress}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Info Section */}
          {profileLog && (
            <View style={styles.accountInfoContainer}>
              <Text style={styles.accountInfoText}>
                <Text style={styles.accountInfoLabel}>Email:</Text> {profileLog.email}
              </Text>
              <Text style={styles.accountInfoText}>
                <Text style={styles.accountInfoLabel}>Dernière connexion:</Text>{' '}
                {profileLog.lastLogin ? new Date(profileLog.lastLogin).toLocaleString('fr-FR') : '—'}
              </Text>
              <Text style={styles.accountInfoText}>
                <Text style={styles.accountInfoLabel}>Dernier changement de mot de passe:</Text>{' '}
                {profileLog.lastPasswordChange ? new Date(profileLog.lastPasswordChange).toLocaleString('fr-FR') : '—'}
              </Text>
            </View>
          )}

          {/* Header Section */}
          <View style={styles.headerSection}>
            <Ionicons name="shield-checkmark" size={32} color={theme.colors.primary} />
            <Text style={styles.headerTitle}>Sécurité & Connexion</Text>
          </View>

          {/* Security Form (Email & Password) */}
          <SecurityForm
            formData={formData}
            onEmailChange={(email) => setFormData({ ...formData, email })}
            onCurrentPasswordChange={(password) => setFormData({ ...formData, currentPassword: password })}
            onNewPasswordChange={(password) => setFormData({ ...formData, newPassword: password })}
            onConfirmPasswordChange={(password) => setFormData({ ...formData, confirmPassword: password })}
            onUpdateEmail={handleEmailUpdate}
            onChangePassword={handlePasswordChange}
            emailSaving={emailSaving}
            passwordSaving={passwordSaving}
          />
          
          {/* Success/Error Messages */}
          <View style={styles.messagesContainer}>
            {emailSuccess && <Text style={styles.successText}>{emailSuccess}</Text>}
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
            {passwordSuccess && <Text style={styles.successText}>{passwordSuccess}</Text>}
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
            {(emailSaving || passwordSaving) && (
              <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
            )}
          </View>

          {/* Danger Zone Section */}
          <View style={styles.dangerZoneContainer}>
            <DangerZone onDeleteAccount={handleDeleteAccountClick} />
          </View>
        </ScrollView>
      </FixedLayout>

      {/* Account Deletion Bottom Sheet */}
      <AccountDeletionBottomSheet
        visible={showDeletionBottomSheet}
        onClose={() => setShowDeletionBottomSheet(false)}
        onConfirm={handleDeleteAccountConfirm}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  accountInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 16,
  },
  accountInfoText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  accountInfoLabel: {
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 8,
  },
  loader: {
    marginTop: 8,
  },
  dangerZoneContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
});

export default SecurityScreen;
