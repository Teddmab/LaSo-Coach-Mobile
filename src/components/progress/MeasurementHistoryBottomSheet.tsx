import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
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
}

const MeasurementHistoryBottomSheet: React.FC<MeasurementHistoryBottomSheetProps> = ({
  visible,
  measurements,
  initialMeasurements,
  onClose,
  getPhotoUrl,
}) => {
  const insets = useSafeAreaInsets();

  console.log('[MeasurementHistoryBottomSheet] 🔍 Component rendered, visible:', visible);
  console.log('[MeasurementHistoryBottomSheet] 🔍 Measurements count:', measurements?.length || 0);
  console.log('[MeasurementHistoryBottomSheet] 🔍 Initial measurements:', !!initialMeasurements);

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
    
    // Sort by date (oldest first)
    return allMeasurements.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });
  };

  const sortedMeasurements = getAllMeasurements();

  // Calculate differences compared to initial measurement
  const calculateDifferences = (measurement: Measurement & { isInitial?: boolean }) => {
    if (!initialMeasurements || measurement.isInitial) {
      return { weightDiff: null, waistDiff: null };
    }
    
    const weightDiff = measurement.weight && initialMeasurements.weight
      ? measurement.weight - initialMeasurements.weight
      : null;
    
    const waistDiff = measurement.waistSize && initialMeasurements.waistSize
      ? measurement.waistSize - initialMeasurements.waistSize
      : null;
    
    return { weightDiff, waistDiff };
  };

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
              <View style={styles.measurementsList}>
                {sortedMeasurements.map((measurement, index) => {
                  const { weightDiff, waistDiff } = calculateDifferences(measurement);
                  const hasPhoto = !!measurement.photoUrl;
                  const photoUrl = hasPhoto && getPhotoUrl ? getPhotoUrl(measurement) : measurement.photoUrl;

                  return (
                    <View key={measurement.id || index} style={styles.measurementItem}>
                      {/* Date Header */}
                      <View style={styles.measurementDateHeader}>
                        <View style={styles.dateRow}>
                          <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                          <Text style={styles.measurementDate}>
                            {formatDate(measurement.date || measurement.createdAt || measurement.updatedAt)}
                          </Text>
                          {measurement.isInitial && (
                            <View style={styles.initialBadge}>
                              <Text style={styles.initialBadgeText}>Initiale</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Photo if available */}
                      {hasPhoto && photoUrl && (
                        <View style={styles.photoContainer}>
                          <Image
                            source={{ uri: photoUrl }}
                            style={styles.measurementPhoto}
                            resizeMode="cover"
                          />
                        </View>
                      )}

                      {/* Values */}
                      <View style={styles.valuesContainer}>
                        {measurement.weight && (
                          <View style={styles.valueRow}>
                            <View style={[styles.valueIndicator, { backgroundColor: '#34D399' }]} />
                            <Text style={styles.valueLabel}>Poids:</Text>
                            <Text style={styles.valueText}>{measurement.weight} kg</Text>
                          </View>
                        )}
                        {measurement.waistSize && (
                          <View style={styles.valueRow}>
                            <View style={[styles.valueIndicator, { backgroundColor: '#60A5FA' }]} />
                            <Text style={styles.valueLabel}>Tour de taille:</Text>
                            <Text style={styles.valueText}>{measurement.waistSize} cm</Text>
                          </View>
                        )}
                      </View>

                      {/* Differences (only for non-initial measurements) */}
                      {!measurement.isInitial && initialMeasurements && (weightDiff !== null || waistDiff !== null) && (
                        <View style={styles.differencesContainer}>
                          {weightDiff !== null && (
                            <View style={styles.differenceRow}>
                              <Ionicons 
                                name={weightDiff < 0 ? "trending-down" : weightDiff > 0 ? "trending-up" : "remove"} 
                                size={14} 
                                color={weightDiff < 0 ? "#10B981" : weightDiff > 0 ? "#EF4444" : "#6B7280"} 
                              />
                              <Text style={[
                                styles.differenceText,
                                weightDiff < 0 && styles.differenceTextPositive,
                                weightDiff > 0 && styles.differenceTextNegative
                              ]}>
                                Poids: {Math.abs(weightDiff).toFixed(1)} kg {weightDiff < 0 ? 'en moins' : weightDiff > 0 ? 'en plus' : ''} par rapport à la mesure initiale
                              </Text>
                            </View>
                          )}
                          {waistDiff !== null && (
                            <View style={styles.differenceRow}>
                              <Ionicons 
                                name={waistDiff < 0 ? "trending-down" : waistDiff > 0 ? "trending-up" : "remove"} 
                                size={14} 
                                color={waistDiff < 0 ? "#10B981" : waistDiff > 0 ? "#EF4444" : "#6B7280"} 
                              />
                              <Text style={[
                                styles.differenceText,
                                waistDiff < 0 && styles.differenceTextPositive,
                                waistDiff > 0 && styles.differenceTextNegative
                              ]}>
                                Tour de taille: {Math.abs(waistDiff).toFixed(1)} cm {waistDiff < 0 ? 'en moins' : waistDiff > 0 ? 'en plus' : ''} par rapport à la mesure initiale
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Notes */}
                      {measurement.notes && (
                        <View style={styles.notesContainer}>
                          <Text style={styles.notesLabel}>Notes:</Text>
                          <Text style={styles.notesText}>{measurement.notes}</Text>
                        </View>
                      )}

                      {/* Separator */}
                      {index < sortedMeasurements.length - 1 && (
                        <View style={styles.separator} />
                      )}
                    </View>
                  );
                })}
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

