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
      
      <View style={styles.dangerZoneContent}>
        <Text style={styles.dangerZoneSubtitle}>Suppression définitive du compte</Text>
        <Text style={styles.dangerZoneText}>
          Cette action supprimera définitivement votre compte et toutes vos données. 
          Cette action est <Text style={styles.boldText}>irréversible</Text>.
        </Text>
        
        <View style={styles.dataListContainer}>
          <Text style={styles.dataListTitle}>Données qui seront supprimées :</Text>
          <View style={styles.dataList}>
            <Text style={styles.dataListItem}>
              • Informations de profil (nom, email, poids, objectifs)
            </Text>
            <Text style={styles.dataListItem}>
              • Progrès fitness (mesures, photos, réalisations)
            </Text>
            <Text style={styles.dataListItem}>
              • Historique d'abonnement et tokens de paiement
            </Text>
            <Text style={styles.dataListItem}>
              • Activité et données d'utilisation de l'application
            </Text>
          </View>
        </View>
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
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C62828',
    marginLeft: 12,
  },
  dangerZoneContent: {
    marginBottom: 20,
  },
  dangerZoneSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 8,
  },
  dangerZoneText: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 16,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
  },
  dataListContainer: {
    backgroundColor: '#FFCDD2',
    borderWidth: 1,
    borderColor: '#EF9A9A',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  dataListTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 8,
  },
  dataList: {
    gap: 4,
  },
  dataListItem: {
    fontSize: 12,
    color: '#C62828',
    lineHeight: 18,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DangerZone;

