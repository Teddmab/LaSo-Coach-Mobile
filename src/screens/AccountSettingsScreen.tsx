import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import FixedLayout from '../components/FixedLayout';
import { SecurityForm, DangerZone } from './settings';
import { useSecurity } from './settings/hooks/useSecurity';
import { theme } from '../constants/theme';
import { useCompanionMode } from '../hooks/useCompanionMode';

interface AccountSettingsScreenProps {
  onClose: () => void;
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  avatarSource?: any;
  avatarFallbackText?: string;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({
  onClose,
  activeTab,
  onTabPress,
  avatarSource,
  avatarFallbackText,
}) => {
  const {
    formData,
    setFormData,
    handleUpdateEmail,
    handleChangePassword,
    handleDeleteAccount,
    isDeleting,
  } = useSecurity();
  const { isCompanionMode } = useCompanionMode();

  return (
    <FixedLayout
      headerTitle="Paramètres du compte"
      activeTab={activeTab}
      onTabPress={onTabPress}
      onHelpPress={() => {}}
      onNotificationPress={() => {}}
      onProfilePress={() => {}}
      avatarSource={avatarSource}
      avatarFallbackText={avatarFallbackText}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Form - Email & Password Updates */}
        {!isCompanionMode && (
          <View style={styles.section}>
            <SecurityForm
              formData={formData}
              onEmailChange={(email) => setFormData({ ...formData, email })}
              onCurrentPasswordChange={(pwd) =>
                setFormData({ ...formData, currentPassword: pwd })
              }
              onNewPasswordChange={(pwd) => setFormData({ ...formData, newPassword: pwd })}
              onConfirmPasswordChange={(pwd) =>
                setFormData({ ...formData, confirmPassword: pwd })
              }
              onUpdateEmail={handleUpdateEmail}
              onChangePassword={handleChangePassword}
            />
          </View>
        )}

        {/* Danger Zone - Account Deletion */}
        <View style={styles.section}>
          <DangerZone onDeleteAccount={handleDeleteAccount} />
        </View>

        {/* Spacing for scroll */}
        <View style={styles.spacer} />
      </ScrollView>
    </FixedLayout>
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
  section: {
    marginVertical: 16,
  },
  spacer: {
    height: 20,
  },
});

export default AccountSettingsScreen;
