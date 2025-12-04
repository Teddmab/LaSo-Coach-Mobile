import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DangerZoneProps {
  onDeleteAccount: () => void;
}

const DangerZone: React.FC<DangerZoneProps> = ({ onDeleteAccount }) => {
  return (
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
      
      <TouchableOpacity style={styles.deleteButton} onPress={onDeleteAccount}>
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.deleteButtonText}>Supprimer le compte</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default DangerZone;

