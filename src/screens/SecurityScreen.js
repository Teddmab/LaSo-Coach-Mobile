import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/FirebaseAuthContext';

export default function SecurityScreen({ navigation, onClose, user, onTabPress, activeTab = 'home' }) {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lastLogin, setLastLogin] = useState('—');
  const [lastPasswordChange, setLastPasswordChange] = useState('—');

  useEffect(() => {
    // Initialize with user data
    if (currentUser?.email) {
      setEmail(currentUser.email);
    } else if (user?.email) {
      setEmail(user.email);
    }
    
    // TODO: Fetch last login and last password change from API
    // For now, using placeholders
  }, [currentUser, user]);

  const handleUpdateEmail = () => {
    // TODO: Implement email update API call
    Alert.alert('Placeholder', 'Email update functionality will be implemented soon.');
  };

  const handleChangePassword = () => {
    // TODO: Implement password change API call
    Alert.alert('Placeholder', 'Password change functionality will be implemented soon.');
  };

  const handleDeleteAccount = () => {
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

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
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
        avatarSource={currentUser?.avatar || user?.avatar}
        avatarFallbackText={currentUser?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account Information */}
        <View style={styles.accountInfoSection}>
          <Text style={styles.accountInfoText}>Email: {email || '—'}</Text>
          <Text style={styles.accountInfoText}>Dernière connexion: {lastLogin}</Text>
          <Text style={styles.accountInfoText}>Dernier changement de mot de passe: {lastPasswordChange}</Text>
        </View>

        {/* Security & Connection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Sécurité & Connexion</Text>
          </View>

          {/* Email Address Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.text.primary} />
              <Text style={styles.cardTitle}>Adresse email</Text>
            </View>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Votre adresse email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateEmail}>
              <Text style={styles.updateButtonText}>Mettre à jour</Text>
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
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Mot de passe actuel"
              secureTextEntry
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nouveau mot de passe"
              secureTextEntry
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmer le nouveau mot de passe"
              secureTextEntry
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.updateButton} onPress={handleChangePassword}>
              <Text style={styles.updateButtonText}>Changer le mot de passe</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <View style={styles.dangerZoneHeader}>
            <Ionicons name="warning" size={24} color="#F44336" />
            <Text style={styles.dangerZoneTitle}>Zone de danger</Text>
          </View>
          
          <Text style={styles.dangerZoneSubtitle}>Suppression définitive du compte</Text>
          <Text style={styles.dangerZoneText}>
            Cette action supprimera définitivement votre compte et toutes vos données. Cette action est irréversible.
          </Text>
          
          <Text style={styles.dangerZoneListTitle}>Données qui seront supprimées :</Text>
          <View style={styles.dangerZoneList}>
            <Text style={styles.dangerZoneListItem}>
              • Informations de profil (nom, email, poids, objectifs)
            </Text>
            <Text style={styles.dangerZoneListItem}>
              • Progrès fitness (mesures, photos, réalisations)
            </Text>
            <Text style={styles.dangerZoneListItem}>
              • Historique d'abonnement et tokens de paiement
            </Text>
            <Text style={styles.dangerZoneListItem}>
              • Activité et données d'utilisation de l'application
            </Text>
          </View>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Supprimer le compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {onTabPress && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabPress={onTabPress}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  accountInfoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  accountInfoText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 12,
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
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerZone: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerZoneTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 12,
  },
  dangerZoneSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
  },
  dangerZoneText: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerZoneListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
  },
  dangerZoneList: {
    marginBottom: 20,
  },
  dangerZoneListItem: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 6,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

