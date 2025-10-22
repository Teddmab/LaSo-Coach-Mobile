import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 80; // Account for card margins and padding

const ProgressChart = ({ 
  chartData, 
  initialMeasurements, 
  measurements = [],
  onDataPointPress,
  onDeleteMeasurement,
  onAddMeasurement
}) => {
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);

  // Format date to dd/mm/yy
  const formatDateShort = (dateString) => {
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
    const sortedData = [...chartData].sort((a, b) => {
      const dateA = a.date || a.createdAt || a.updatedAt;
      const dateB = b.date || b.createdAt || b.updatedAt;
      return new Date(dateA) - new Date(dateB);
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
    const sortedData = [...chartData].sort((a, b) => {
      const dateA = a.date || a.createdAt || a.updatedAt;
      const dateB = b.date || b.createdAt || b.updatedAt;
      return new Date(dateA) - new Date(dateB);
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
  const getChartConfig = (color) => ({
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
  const getSortedMeasurements = () => {
    if (!measurements || measurements.length === 0) {
      return initialMeasurements ? [initialMeasurements] : [];
    }

    const allMeasurements = [...measurements];
    
    // Add initial measurements if available and not already in the list
    if (initialMeasurements && !allMeasurements.find(m => m.isInitial)) {
      allMeasurements.unshift({ ...initialMeasurements, isInitial: true });
    }

    // Sort by date (latest first, but initial measurement stays on top)
    return allMeasurements.sort((a, b) => {
      if (a.isInitial) return -1;
      if (b.isInitial) return 1;
      
      // Handle different date field names
      const dateA = a.date || a.createdAt || a.updatedAt;
      const dateB = b.date || b.createdAt || b.updatedAt;
      
      if (!dateA || !dateB) return 0;
      
      return new Date(dateB) - new Date(dateA);
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
            onDataPointClick={(data) => {
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
            onDataPointClick={(data) => {
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

      {/* Recent Measurements Table */}
      <View style={styles.measurementsSection}>
        <View style={styles.measurementsHeader}>
          <Text style={styles.measurementsTitle}>Mesures récentes</Text>
        </View>
        
        {sortedMeasurements.length > 0 ? (
          <ScrollView style={styles.measurementsTable} showsVerticalScrollIndicator={false}>
            {sortedMeasurements.map((measurement, index) => (
              <View key={index} style={styles.measurementRow}>
                <View style={styles.measurementDate}>
                  <Text style={[
                    styles.measurementDateText,
                    measurement.isInitial && styles.initialMeasurementText
                  ]}>
                    {formatDateShort(measurement.date || measurement.createdAt || measurement.updatedAt)}
                  </Text>
                  {measurement.isInitial && (
                    <View style={styles.initialBadge}>
                      <Text style={styles.initialBadgeText}>Initiale</Text>
                    </View>
                  )}
                </View>
                
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
                
                {!measurement.isInitial && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
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
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyMeasurements}>
            <Ionicons name="clipboard-outline" size={32} color="#E0E0E0" />
            <Text style={styles.emptyMeasurementsText}>Aucune mesure disponible</Text>
          </View>
        )}
        
        {/* Add Measurement Button */}
        <TouchableOpacity style={styles.addButton} onPress={onAddMeasurement}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ajouter une nouvelle mesure</Text>
        </TouchableOpacity>
      </View>
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
  },
  measurementsHeader: {
    marginBottom: 15,
  },
  measurementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  measurementsTable: {
    maxHeight: 200,
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
  },
  measurementDate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  measurementDateText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  initialMeasurementText: {
    fontWeight: '600',
    color: '#8BC34A',
  },
  initialBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  initialBadgeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  measurementValues: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  deleteButton: {
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8BC34A',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 15,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProgressChart;