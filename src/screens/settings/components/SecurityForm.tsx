import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { SecurityFormData } from '../types';

interface SecurityFormProps {
  formData: SecurityFormData;
  onEmailChange: (email: string) => void;
  onCurrentPasswordChange: (password: string) => void;
  onNewPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onUpdateEmail: () => void;
  onChangePassword: () => void;
  emailSaving?: boolean;
  passwordSaving?: boolean;
}

const SecurityForm: React.FC<SecurityFormProps> = ({
  formData,
  onEmailChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onUpdateEmail,
  onChangePassword,
  emailSaving = false,
  passwordSaving = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Email Address Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="mail-outline" size={20} color={theme.colors.text.primary} />
          <Text style={styles.cardTitle}>Adresse email</Text>
        </View>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={onEmailChange}
          placeholder="Votre adresse email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.updateButton, emailSaving && styles.updateButtonDisabled]}
          onPress={onUpdateEmail}
          disabled={emailSaving}
        >
          {emailSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.updateButtonText}>Mettre à jour</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Change Password Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.primary} />
          <Text style={styles.cardTitle}>Changer le mot de passe</Text>
        </View>
        <TextInput
          style={styles.input}
          value={formData.currentPassword}
          onChangeText={onCurrentPasswordChange}
          placeholder="Mot de passe actuel"
          secureTextEntry
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          value={formData.newPassword}
          onChangeText={onNewPasswordChange}
          placeholder="Nouveau mot de passe"
          secureTextEntry
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          value={formData.confirmPassword}
          onChangeText={onConfirmPasswordChange}
          placeholder="Confirmer le nouveau mot de passe"
          secureTextEntry
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.updateButton, passwordSaving && styles.updateButtonDisabled]}
          onPress={onChangePassword}
          disabled={passwordSaving}
        >
          {passwordSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.updateButtonText}>Changer le mot de passe</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SecurityForm;

