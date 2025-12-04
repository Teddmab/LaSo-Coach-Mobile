import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/FirebaseAuthContext';
import { SecurityScreenProps } from './settings/types';
import AccountInfo from './settings/components/AccountInfo';
import SecurityForm from './settings/components/SecurityForm';
import DangerZone from './settings/components/DangerZone';
import { useSecurity } from './settings/hooks/useSecurity';
import { ScreenLayout, ScreenContent } from './shared';

const SecurityScreen: React.FC<SecurityScreenProps> = ({
  navigation,
  onClose,
  user,
  onTabPress,
  activeTab = 'home',
}) => {
  const { user: authUser } = useAuth();
  const userEmail = authUser?.email || user?.email;
  
  const {
    formData,
    securityInfo,
    setFormData,
    handleUpdateEmail,
    handleChangePassword,
    handleDeleteAccount,
  } = useSecurity(userEmail);

  const handleBack = (): void => {
    if (onClose) {
      onClose();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <ScreenLayout>
      <StatusBar style="dark" />
      
      {/* Header */}
      <AppHeader
        title="Sécurité & Connexion"
        onHelpPress={() => {
          if (onTabPress) {
            onTabPress('faq');
          }
        }}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={authUser?.avatar || user?.avatar}
        avatarFallbackText={authUser?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

      <ScreenContent>
        {/* Account Information */}
        <AccountInfo email={formData.email} securityInfo={securityInfo} />

        {/* Security & Connection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Sécurité & Connexion</Text>
          </View>

          <SecurityForm
            formData={formData}
            onEmailChange={(email) => setFormData(prev => ({ ...prev, email }))}
            onCurrentPasswordChange={(password) => setFormData(prev => ({ ...prev, currentPassword: password }))}
            onNewPasswordChange={(password) => setFormData(prev => ({ ...prev, newPassword: password }))}
            onConfirmPasswordChange={(password) => setFormData(prev => ({ ...prev, confirmPassword: password }))}
            onUpdateEmail={handleUpdateEmail}
            onChangePassword={handleChangePassword}
          />
        </View>

        {/* Danger Zone */}
        <DangerZone onDeleteAccount={handleDeleteAccount} />
      </ScreenContent>

      {/* Bottom Navigation */}
      {onTabPress && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabPress={onTabPress}
        />
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
});

export default SecurityScreen;

