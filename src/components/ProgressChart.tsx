import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Measurement, InitialMeasurement } from '../screens/progress/types';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 80; // Account for card margins and padding

interface ProgressChartProps {
  chartData?: any[];
  initialMeasurements?: InitialMeasurement | null;
  measurements?: Measurement[];
  onDataPointPress?: (data: any) => void;
  onDeleteMeasurement?: (id?: string) => void;
  onAddMeasurement?: () => void;
  onEditMeasurement?: (measurement: Measurement) => void;
  onViewHistory?: (measurement: Measurement) => void;
  getPhotoUrl?: (photo: any) => string | null;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  chartData = [], 
  initialMeasurements, 
  measurements = [],
  onDataPointPress,
  onDeleteMeasurement,
  onAddMeasurement,
  onEditMeasurement,
  onViewHistory,
  getPhotoUrl
}) => {
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);

  // Calculer les différences par rapport à la mesure initiale
  const calculateDifferences = (measurement: Measurement) => {
    if (!initialMeasurements || measurement.isInitial) return { weightDiff: null, waistDiff: null };
    
    const weightDiff = measurement.weight && initialMeasurements.weight
      ? measurement.weight - initialMeasurements.weight
      : null;
    
    const waistDiff = measurement.waistSize && initialMeasurements.waistSize
      ? measurement.waistSize - initialMeasurements.waistSize
      : null;
    
    return { weightDiff, waistDiff };
  };

  // Format date to dd/mm/yy
  const formatDateShort = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Format data for weight chart
  const formatWeightChartData = () => {
    if (!chartData || chartData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`, // Green
            strokeWidth: 3
          }
        ]
      };
    }

    // Sort data by date
    const sortedData = [...chartData].sort((a: any, b: any) => {
      const dateA = a.date || a.createdAt || a.updatedAt;
      const dateB = b.date || b.createdAt || b.updatedAt;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    // Create labels - show only first, middle, and last for mobile
    const labels = [];
    if (sortedData.length === 1) {
      labels.push(formatDateShort(sortedData[0].date || sortedData[0].createdAt || sortedData[0].updatedAt));
    } else if (sortedData.length === 2) {
      labels.push(formatDateShort(sortedData[0].date || sortedData[0].createdAt || sortedData[0].updatedAt));
      labels.push(formatDateShort(sortedData[1].date || sortedData[1].createdAt || sortedData[1].updatedAt));
    } else {
      labels.push(formatDateShort(sortedData[0].date || sortedData[0].createdAt || sortedData[0].updatedAt));
      labels.push(formatDateShort(sortedData[Math.floor(sortedData.length / 2)].date || sortedData[Math.floor(sortedData.length / 2)].createdAt || sortedData[Math.floor(sortedData.length / 2)].updatedAt));
      labels.push(formatDateShort(sortedData[sortedData.length - 1].date || sortedData[sortedData.length - 1].createdAt || sortedData[sortedData.length - 1].updatedAt));
    }

    // Extract weight data
    const weightData = sortedData.map(item => parseFloat(item.weight) || 0);

    return {
      labels,
      datasets: [
        {
          data: weightData,
          color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`, // Green
          strokeWidth: 3
        }
      ]
    };
  };

  // Format data for waist chart
  const formatWaistChartData = () => {
    if (!chartData || chartData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`, // Blue
            strokeWidth: 3
          }
        ]
      };
    }

    // Sort data by date
    const sortedData = [...chartData].sort((a: any, b: any) => {
      const dateA = a.date || a.createdAt || a.updatedAt;
      const dateB = b.date || b.createdAt || b.updatedAt;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    // Create labels - show only first, middle, and last for mobile
    const labels = [];
    if (sortedData.length === 1) {
      labels.push(formatDateShort(sortedData[0].date || sortedData[0].createdAt || sortedData[0].updatedAt));
    } else if (sortedData.length === 2) {
      labels.push(formatDateShort(sortedData[0].date || sortedData[0].createdAt || sortedData[0].updatedAt));
      labels.push(formatDateShort(sortedData[1].date || sortedData[1].createdAt || sortedData[1].updatedAt));
    } else {
      labels.push(formatDateShort(sortedData[0].date || sortedData[0].createdAt || sortedData[0].updatedAt));
      labels.push(formatDateShort(sortedData[Math.floor(sortedData.length / 2)].date || sortedData[Math.floor(sortedData.length / 2)].createdAt || sortedData[Math.floor(sortedData.length / 2)].updatedAt));
      labels.push(formatDateShort(sortedData[sortedData.length - 1].date || sortedData[sortedData.length - 1].createdAt || sortedData[sortedData.length - 1].updatedAt));
    }

    // Extract waist data
    const waistData = sortedData.map(item => parseFloat(item.waistSize) || 0);

    return {
      labels,
      datasets: [
        {
          data: waistData,
          color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`, // Blue
          strokeWidth: 3
        }
      ]
    };
  };

  // Get chart configuration
  const getChartConfig = (color: string) => ({
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 1,
    color: (opacity = 1) => color,
    labelColor: (opacity = 1) => '#666666',
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: '#E0E0E0',
      strokeWidth: 1,
    },
  });

  // Get sorted measurements with initial measurement first
  const getSortedMeasurements = (): Measurement[] => {
    // Toujours créer une mesure initiale en première ligne avec poids et taille
    const initialMeasurement: Measurement | null = initialMeasurements ? {
      id: 'initial',
      weight: initialMeasurements.weight || 0,
      waistSize: initialMeasurements.waistSize || 0,
      createdAt: initialMeasurements.date || new Date().toISOString(),
      isInitial: true,
    } : null;

    if (!measurements || measurements.length === 0) {
      return initialMeasurement ? [initialMeasurement] : [];
    }

    const allMeasurements: Measurement[] = [...measurements];
    
    // S'assurer que la mesure initiale est toujours en première position
    // Retirer toute mesure initiale existante de la liste pour éviter les doublons
    const filteredMeasurements = allMeasurements.filter(m => !m.isInitial);
    
    // Ajouter la mesure initiale en première position si elle existe
    if (initialMeasurement) {
      filteredMeasurements.unshift(initialMeasurement);
    }

    // Sort by date (latest first, but initial measurement stays on top)
    return filteredMeasurements.sort((a, b) => {
      // La mesure initiale reste toujours en première position
      if (a.isInitial) return -1;
      if (b.isInitial) return 1;
      
      // Handle different date field names
      const dateA = a.date || a.createdAt || a.updatedAt;
      const dateB = b.date || b.createdAt || b.updatedAt;
      
      if (!dateA || !dateB) return 0;
      
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  };

  const weightChartData = formatWeightChartData();
  const waistChartData = formatWaistChartData();
  const sortedMeasurements = getSortedMeasurements();

  return (
    <View style={styles.container}>
      {/* Weight Chart */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <View style={[styles.chartIndicator, { backgroundColor: '#34D399' }]} />
            <Text style={styles.chartTitle}>Poids (kg)</Text>
          </View>
        </View>
        
        {weightChartData.datasets[0].data.length > 0 ? (
          <LineChart
            data={weightChartData}
            width={chartWidth}
            height={220}
            chartConfig={getChartConfig('#34D399')}
            bezier
            style={styles.chart}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            withInnerLines={true}
            withOuterLines={false}
            withDots={true}
            withShadow={false}
            withScrollableDot={false}
            decorator={() => null}
            onDataPointClick={(data: any) => {
              if (onDataPointPress) {
                onDataPointPress(data);
              }
            }}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="trending-up-outline" size={48} color="#E0E0E0" />
            <Text style={styles.emptyChartText}>Aucune donnée de poids disponible</Text>
            <Text style={styles.emptyChartSubtext}>Ajoutez votre première mesure pour voir le graphique</Text>
          </View>
        )}
      </View>

      {/* Waist Chart */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
            <View style={[styles.chartIndicator, { backgroundColor: '#60A5FA' }]} />
            <Text style={styles.chartTitle}>Tour de taille (cm)</Text>
          </View>
        </View>
        
        {waistChartData.datasets[0].data.length > 0 ? (
          <LineChart
            data={waistChartData}
            width={chartWidth}
            height={220}
            chartConfig={getChartConfig('#60A5FA')}
            bezier
            style={styles.chart}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            withInnerLines={true}
            withOuterLines={false}
            withDots={true}
            withShadow={false}
            withScrollableDot={false}
            decorator={() => null}
            onDataPointClick={(data: any) => {
              if (onDataPointPress) {
                onDataPointPress(data);
              }
            }}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="trending-up-outline" size={48} color="#E0E0E0" />
            <Text style={styles.emptyChartText}>Aucune donnée de tour de taille disponible</Text>
            <Text style={styles.emptyChartSubtext}>Ajoutez votre première mesure pour voir le graphique</Text>
          </View>
        )}
      </View>

      {/* Add Measurement Button - Input carré */}
      <TouchableOpacity style={styles.addMeasurementInput} onPress={onAddMeasurement}>
        <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.addMeasurementInputText}>Ajouter une nouvelle mesure</Text>
      </TouchableOpacity>
    </View>
  );
};

// Composant séparé pour les mesures récentes
interface RecentMeasurementsProps {
  measurements?: Measurement[];
  initialMeasurements?: InitialMeasurement | null;
  onEditMeasurement?: (measurement: Measurement) => void;
  onViewHistory?: (measurement: Measurement) => void;
  onDeleteMeasurement?: (id?: string) => void;
  onAddMeasurement?: () => void;
}

export const RecentMeasurements: React.FC<RecentMeasurementsProps> = ({ 
  measurements = [],
  initialMeasurements,
  onEditMeasurement,
  onViewHistory,
  onDeleteMeasurement,
  onAddMeasurement
  }) => {
  // Calculer les différences par rapport à la mesure initiale
  const calculateDifferences = (measurement: Measurement) => {
    if (!initialMeasurements || measurement.isInitial) return { weightDiff: null, waistDiff: null };
    
    const weightDiff = measurement.weight && initialMeasurements.weight
      ? measurement.weight - initialMeasurements.weight
      : null;
    
    const waistDiff = measurement.waistSize && initialMeasurements.waistSize
      ? measurement.waistSize - initialMeasurements.waistSize
      : null;
    
    return { weightDiff, waistDiff };
  };

  // Format date to dd/mm/yy
  const formatDateShort = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Sort measurements by date (most recent first)
  const sortedMeasurements = [...measurements].sort((a: Measurement, b: Measurement) => {
    const dateA = a.createdAt;
    const dateB = b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <View style={styles.measurementsSection}>
      <View style={styles.measurementsHeader}>
        <Text style={styles.measurementsTitle}>Mesures récentes</Text>
      </View>
        
        {sortedMeasurements.length > 0 ? (
          <ScrollView style={styles.measurementsTable} showsVerticalScrollIndicator={false}>
            {sortedMeasurements.map((measurement, index) => {
              const { weightDiff, waistDiff } = calculateDifferences(measurement);
              const hasPhoto = !!measurement.photoUrl;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.measurementCard, hasPhoto && styles.measurementCardWithPhoto]}
                  onPress={() => {
                    console.log('[RecentMeasurements] 🖱️ Card pressed, measurement:', measurement);
                    console.log('[RecentMeasurements] 🖱️ onViewHistory defined:', !!onViewHistory);
                    console.log('[RecentMeasurements] 🖱️ isInitial:', measurement.isInitial);
                    if (onViewHistory && !measurement.isInitial) {
                      console.log('[RecentMeasurements] 🖱️ Calling onViewHistory...');
                      onViewHistory(measurement);
                    } else {
                      console.log('[RecentMeasurements] 🖱️ Not calling onViewHistory - conditions not met');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  {/* Photo si disponible */}
                  {hasPhoto && (
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: measurement.photoUrl }}
                        style={styles.measurementPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  
                  {/* Contenu de la carte */}
                  <View style={styles.measurementCardContent}>
                    {/* Header avec date et actions */}
                    <View style={styles.measurementCardHeader}>
                      <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.measurementCardDate}>
                          {formatDateShort(measurement.date || measurement.createdAt || measurement.updatedAt)}
                        </Text>
                      </View>
                      {!measurement.isInitial && (
                        <View style={styles.measurementActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              if (onEditMeasurement) {
                                onEditMeasurement(measurement);
                              }
                            }}
                          >
                            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              Alert.alert(
                                'Supprimer la mesure',
                                'Êtes-vous sûr de vouloir supprimer cette mesure ?',
                                [
                                  { text: 'Annuler', style: 'cancel' },
                                  {
                                    text: 'Supprimer',
                                    style: 'destructive',
                                    onPress: () => onDeleteMeasurement && onDeleteMeasurement(measurement.id)
                                  }
                                ]
                              );
                            }}
                          >
                            <Ionicons name="trash-outline" size={16} color="#F44336" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    
                    {/* Poids et taille sur une ligne */}
                    <View style={styles.measurementValues}>
                      {measurement.weight && (
                        <View style={styles.measurementValue}>
                          <View style={[styles.valueIndicator, { backgroundColor: '#34D399' }]} />
                          <Text style={styles.valueText}>{measurement.weight} kg</Text>
                        </View>
                      )}
                      {measurement.waistSize && (
                        <View style={styles.measurementValue}>
                          <View style={[styles.valueIndicator, { backgroundColor: '#60A5FA' }]} />
                          <Text style={styles.valueText}>{measurement.waistSize} cm</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Stats en pleine largeur */}
                    {!measurement.isInitial && initialMeasurements && (weightDiff !== null || waistDiff !== null) && (
                      <View style={styles.measurementSummary}>
                        {weightDiff !== null && (
                          <View style={styles.summaryRow}>
                            <View style={styles.summaryRowContent}>
                              <Ionicons 
                                name={weightDiff < 0 ? "trending-down" : weightDiff > 0 ? "trending-up" : "remove"} 
                                size={16} 
                                color={weightDiff < 0 ? "#10B981" : weightDiff > 0 ? "#EF4444" : "#6B7280"} 
                              />
                              <Text style={[
                                styles.summaryText,
                                weightDiff < 0 && styles.summaryTextPositive,
                                weightDiff > 0 && styles.summaryTextNegative
                              ]}>
                                Poids: {Math.abs(weightDiff).toFixed(1)} kg {weightDiff < 0 ? 'en moins' : weightDiff > 0 ? 'en plus' : ''} par rapport à la mesure initiale
                              </Text>
                            </View>
                          </View>
                        )}
                        {waistDiff !== null && (
                          <View style={styles.summaryRow}>
                            <View style={styles.summaryRowContent}>
                              <Ionicons 
                                name={waistDiff < 0 ? "trending-down" : waistDiff > 0 ? "trending-up" : "remove"} 
                                size={16} 
                                color={waistDiff < 0 ? "#10B981" : waistDiff > 0 ? "#EF4444" : "#6B7280"} 
                              />
                              <Text style={[
                                styles.summaryText,
                                waistDiff < 0 && styles.summaryTextPositive,
                                waistDiff > 0 && styles.summaryTextNegative
                              ]}>
                                Tour de taille: {Math.abs(waistDiff).toFixed(1)} cm {waistDiff < 0 ? 'en moins' : waistDiff > 0 ? 'en plus' : ''} par rapport à la mesure initiale
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyMeasurements}>
            <Ionicons name="clipboard-outline" size={32} color="#E0E0E0" />
            <Text style={styles.emptyMeasurementsText}>Aucune mesure disponible</Text>
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartSection: {
    marginBottom: 30,
  },
  chartHeader: {
    marginBottom: 15,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  chart: {
    borderRadius: 16,
    alignSelf: 'center',
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 12,
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
    textAlign: 'center',
  },
  measurementsSection: {
    marginTop: 20,
    paddingHorizontal: 4, // Padding sur les bords
  },
  measurementsHeader: {
    marginBottom: 15,
    paddingHorizontal: 4, // Padding pour le titre
  },
  measurementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  measurementsTable: {
    // Pas de maxHeight pour permettre le scroll complet
    paddingBottom: 20, // Espace en bas pour que la dernière mesure soit entièrement visible
  },
  measurementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 0,
    overflow: 'hidden',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  measurementCardWithPhoto: {
    flexDirection: 'row',
  },
  photoContainer: {
    width: 100,
    height: 100,
  },
  measurementPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  measurementCardContent: {
    flex: 1,
    padding: 16,
  },
  measurementCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  measurementCardDate: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  measurementValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  measurementValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  measurementSummary: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryRow: {
    marginBottom: 6,
  },
  summaryRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    flex: 1,
    flexWrap: 'wrap',
  },
  summaryTextPositive: {
    color: '#10B981',
  },
  summaryTextNegative: {
    color: '#EF4444',
  },
  measurementActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewHistoryButton: {
    padding: 8,
  },
  emptyMeasurements: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyMeasurementsText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  addMeasurementInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 15,
    minHeight: 56,
  },
  addMeasurementInputText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default ProgressChart;