import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Measurement, InitialMeasurement } from '../../screens/progress/types';

interface MeasurementHistoryBottomSheetProps {
  visible: boolean;
  measurements: Measurement[];
  initialMeasurements?: InitialMeasurement | null;
  onClose: () => void;
  getPhotoUrl?: (photo: any) => string | null;
  onEditMeasurement?: (measurement: Measurement) => void;
  onDeleteMeasurement?: (id?: string) => void;
}

const MeasurementHistoryBottomSheet: React.FC<MeasurementHistoryBottomSheetProps> = ({
  visible,
  measurements,
  initialMeasurements,
  onClose,
  getPhotoUrl,
  onEditMeasurement,
  onDeleteMeasurement,
}) => {
  const insets = useSafeAreaInsets();

  // Format date to dd/mm/yyyy
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Combine initial measurement with other measurements and sort by date
  const getAllMeasurements = (): (Measurement & { isInitial?: boolean })[] => {
    const allMeasurements: (Measurement & { isInitial?: boolean })[] = [...measurements];
    
    if (initialMeasurements) {
      allMeasurements.push({
        id: 'initial',
        weight: initialMeasurements.weight,
        waistSize: initialMeasurements.waistSize,
        createdAt: initialMeasurements.date || new Date().toISOString(),
        isInitial: true,
      });
    }
    
    return allMeasurements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getActivityLabel = (m: Measurement & { isInitial?: boolean }): string => {
    if (m.notes && m.notes.trim()) return m.notes.trim();
    return '—';
  };

  const sortedMeasurements = getAllMeasurements();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.keyboardAvoidingView}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={styles.backdrop}
          />
        </TouchableOpacity>
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Historique des mesures</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {sortedMeasurements.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="clipboard-outline" size={48} color={theme.colors.text.secondary} />
                <Text style={styles.emptyStateTitle}>Aucune mesure disponible</Text>
                <Text style={styles.emptyStateText}>
                  Commencez à enregistrer vos mesures pour voir votre historique.
                </Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, styles.tableColPoids]}>Poids (kg)</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableColActivite]}>Activité</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableColSource]}>Source</Text>
                  <Text style={[styles.tableHeaderCell, styles.tableColDate]}>Date</Text>
                  <View style={[styles.tableHeaderCell, styles.tableColActions]} />
                </View>
                {sortedMeasurements.map((measurement, index) => (
                  <View key={measurement.id || index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.tableColPoids]} numberOfLines={1}>
                      {measurement.weight ?? '—'}
                    </Text>
                    <Text style={[styles.tableCell, styles.tableColActivite]} numberOfLines={1}>
                      {getActivityLabel(measurement)}
                    </Text>
                    <View style={styles.tableColSource}>
                      <View style={[
                        styles.sourceBadge,
                        measurement.isInitial ? styles.sourceBadgeMesure : (measurement.isFromPhoto ? styles.sourceBadgePhoto : styles.sourceBadgeMesure)
                      ]}>
                        <Text style={[styles.sourceBadgeText, { color: measurement.isFromPhoto ? theme.colors.primary : '#6B7280' }]}>
                          {measurement.isInitial ? 'Mesure initiale' : (measurement.isFromPhoto ? 'Photo' : 'Mesure')}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.tableCell, styles.tableColDate]}>
                      {formatDate(measurement.date || measurement.createdAt || measurement.updatedAt)}
                    </Text>
                    <View style={[styles.tableCell, styles.tableColActions, styles.actionsCell]}>
                      {!measurement.isInitial && onEditMeasurement && onDeleteMeasurement && (
                        <>
                          <TouchableOpacity style={styles.actionButton} onPress={() => onEditMeasurement(measurement)}>
                            <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => Alert.alert(
                              'Supprimer la mesure',
                              'Êtes-vous sûr de vouloir supprimer cette mesure ?',
                              [
                                { text: 'Annuler', style: 'cancel' },
                                { text: 'Supprimer', style: 'destructive', onPress: () => onDeleteMeasurement(measurement.id) }
                              ]
                            )}
                          >
                            <Ionicons name="trash-outline" size={18} color="#F44336" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  backdropTouchable: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tableContainer: {
    paddingBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  tableColPoids: { width: '14%', minWidth: 44 },
  tableColActivite: { flex: 1, minWidth: 60, paddingHorizontal: 4 },
  tableColSource: { width: '22%', minWidth: 80, paddingHorizontal: 2 },
  tableColDate: { width: '22%', minWidth: 72 },
  tableColActions: { width: '18%', minWidth: 56, flexDirection: 'row', justifyContent: 'flex-end' },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sourceBadgePhoto: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  sourceBadgeMesure: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
  },
  sourceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsCell: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurementsList: {
    gap: 0,
  },
  measurementItem: {
    paddingVertical: 16,
  },
  measurementDateHeader: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  measurementDate: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  initialBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
  },
  initialBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.success,
  },
  photoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  measurementPhoto: {
    width: '100%',
    height: '100%',
  },
  valuesContainer: {
    marginBottom: 12,
    gap: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  valueLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  differencesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 8,
  },
  differenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  differenceText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    flex: 1,
  },
  differenceTextPositive: {
    color: '#10B981',
  },
  differenceTextNegative: {
    color: '#EF4444',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 16,
  },
});

export default MeasurementHistoryBottomSheet;

