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
  initialProgressPhoto?: any | null;
  onDataPointPress?: (data: any) => void;
  onDeleteMeasurement?: (id?: string) => void;
  onAddMeasurement?: () => void;
  onEditMeasurement?: (measurement: Measurement) => void;
  onViewHistory?: (measurement: Measurement) => void;
  onMeasurementClick?: (measurement: Measurement) => void;
  getPhotoUrl?: (photo: any) => string | null;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ 
  chartData = [], 
  initialMeasurements, 
  measurements = [],
  initialProgressPhoto = null,
  onDataPointPress,
  onDeleteMeasurement,
  onAddMeasurement,
  onEditMeasurement,
  onViewHistory,
  onMeasurementClick,
  getPhotoUrl
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

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

  // Graphique aligné web référence : Poids (kg) + Tour de taille (cm) + Activité physique (min)
  const formatCombinedChartData = () => {
    if (!chartData || chartData.length === 0) {
      return {
        labels: [] as string[],
        datasets: [
          { data: [] as number[], color: () => 'rgba(52, 211, 153, 1)', strokeWidth: 3 },
          { data: [] as number[], color: () => 'rgba(96, 165, 250, 1)', strokeWidth: 3 },
          { data: [] as number[], color: () => 'rgba(245, 158, 11, 1)', strokeWidth: 3 },
        ],
        sortedData: [] as any[],
      };
    }
    const sortedData = [...chartData].sort((a: any, b: any) => {
      const dateA = a.date || a.createdAt || a.updatedAt;
      const dateB = b.date || b.createdAt || b.updatedAt;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
    const labels: string[] = [];
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
    const weightData = sortedData.map((item: any) => parseFloat(item.weight) || 0);
    const waistData = sortedData.map((item: any) => parseFloat(item.waistSize) || 0);
    const activityData = sortedData.map((item: any) => {
      if (item.activityMinutes != null && !isNaN(Number(item.activityMinutes))) return Number(item.activityMinutes);
      const notes = item.notes || '';
      const match = notes.match(/(\d+)\s*min/);
      return match ? parseInt(match[1], 10) : 0;
    });
    return {
      labels,
      sortedData,
      datasets: [
        { data: weightData, color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`, strokeWidth: 3 },
        { data: waistData, color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`, strokeWidth: 3 },
        { data: activityData, color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, strokeWidth: 3 },
      ],
    };
  };

  const combinedChartData = formatCombinedChartData();

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

  const sortedMeasurements = getSortedMeasurements();
  const hasAnyChartData = combinedChartData.datasets.some(d => d.data.length > 0);

  const initialPhotoUrl = initialProgressPhoto && getPhotoUrl ? getPhotoUrl(initialProgressPhoto) : null;
  const selectedPoint = selectedPointIndex != null && combinedChartData.sortedData[selectedPointIndex] ? combinedChartData.sortedData[selectedPointIndex] : null;
  const selectedMeasurement = selectedPoint && measurements?.length ? measurements.find((m: Measurement) => {
    if ((selectedPoint as any).isInitial && (m.isInitial || m.id === 'initial')) return true;
    const pointDate = selectedPoint.date || selectedPoint.createdAt;
    const mDate = m.date || m.createdAt;
    return pointDate && mDate && new Date(pointDate).getTime() === new Date(mDate).getTime();
  }) : null;
  const latestWithPhoto = measurements?.length ? [...measurements].filter((m: Measurement) => (m as any).photoUrl || m.photoId).pop() : null;
  const resolvePhotoUrl = (m: Measurement | null): string | null => {
    if (!m) return null;
    const direct = (m as any).photoUrl;
    if (typeof direct === 'string' && direct) return direct;
    return getPhotoUrl ? getPhotoUrl(m as any) ?? null : null;
  };
  const currentPhotoUrl = resolvePhotoUrl(selectedMeasurement ?? null) ?? resolvePhotoUrl(latestWithPhoto ?? null);
  // Format date comme sur le web : toLocaleDateString('fr-FR') ex. 12/03/2025
  const formatDateForInitial = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `le ${day}/${month}/${year}`;
  };

  return (
    <View style={styles.container}>
      {/* Titre + Mesures initiales (une seule ligne) */}
      <Text style={styles.sectionTitle}>Historique des mesures</Text>
      {initialMeasurements && (initialMeasurements.weight != null || initialMeasurements.waistSize != null) && (
        <Text style={styles.initialMeasuresText} numberOfLines={1} ellipsizeMode="tail">
          <Text style={styles.initialMeasuresBold}>Init.</Text> {initialMeasurements.weight ?? '-'} kg, {initialMeasurements.waistSize ?? '-'} cm
          {initialMeasurements.date ? ` (${formatDateForInitial(initialMeasurements.date)})` : ''}
        </Text>
      )}

      {/* Légende sur une seule ligne */}
      {hasAnyChartData && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34D399' }]} />
            <Text style={styles.legendLabel}>Poids</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#60A5FA' }]} />
            <Text style={styles.legendLabel}>T. taille</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendLabel}>Activité</Text>
          </View>
        </View>
      )}

      {/* Un seul graphique : Poids (kg) + Tour de taille (cm) + Activité (min) avec grille, image au centre */}
      <View style={styles.chartSection}>
        {hasAnyChartData ? (
          <View style={styles.combinedChartWrapper}>
            <LineChart
              data={{
                labels: combinedChartData.labels,
                datasets: combinedChartData.datasets,
              }}
              width={chartWidth}
              height={240}
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
                const index = data?.index ?? null;
                setSelectedPointIndex(index != null ? index : null);
                if (onDataPointPress) onDataPointPress(data);
              }}
            />
            {/* Tooltip au clic sur un point + bouton fermer */}
            {selectedPointIndex != null && selectedPoint && (
              <View style={styles.tooltipCard}>
                <View style={styles.tooltipHeader}>
                  <Text style={styles.tooltipDate}>
                    {(() => {
                      const d = selectedPoint.date || selectedPoint.createdAt;
                      if (!d) return '—';
                      const date = new Date(d);
                      if (isNaN(date.getTime())) return '—';
                      const day = String(date.getDate()).padStart(2, '0');
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const year = date.getFullYear();
                      return `${day}/${month}/${year}`;
                    })()}
                  </Text>
                  <TouchableOpacity
                    hitSlop={12}
                    onPress={() => setSelectedPointIndex(null)}
                    style={styles.tooltipCloseBtn}
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.tooltipMetrics}>
                  <Text style={[styles.tooltipMetric, { color: '#34D399' }]}>
                    Poids: {selectedPoint.weight ?? '—'} kg
                  </Text>
                  <Text style={[styles.tooltipMetric, { color: '#60A5FA' }]}>
                    T. taille: {selectedPoint.waistSize ?? '—'} cm
                  </Text>
                  <Text style={[styles.tooltipMetric, { color: '#F59E0B' }]}>
                    Activité: {selectedPoint.activityMinutes != null ? selectedPoint.activityMinutes : ((selectedPoint.notes || '').match(/(\d+)\s*min/)?.[1] ?? '0')} min
                  </Text>
                </View>
                {(selectedPoint.notes && selectedPoint.notes.trim()) ? (
                  <Text style={styles.tooltipActivity} numberOfLines={1} ellipsizeMode="tail">{selectedPoint.notes.trim()}</Text>
                ) : null}
                <View style={styles.tooltipPhotosRow}>
                  <View style={styles.tooltipPhotoBox}>
                    <Text style={styles.tooltipPhotoLabel}>Avant</Text>
                    {initialPhotoUrl ? (
                      <Image source={{ uri: initialPhotoUrl }} style={styles.tooltipPhoto} resizeMode="cover" />
                    ) : (
                      <View style={styles.tooltipPhotoPlaceholder}>
                        <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.tooltipPhotoBox}>
                    <Text style={styles.tooltipPhotoLabel}>Après</Text>
                    {currentPhotoUrl ? (
                      <Image source={{ uri: currentPhotoUrl }} style={styles.tooltipPhoto} resizeMode="cover" />
                    ) : (
                      <View style={styles.tooltipPhotoPlaceholder}>
                        <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="trending-up-outline" size={48} color="#E0E0E0" />
            <Text style={styles.emptyChartText}>Aucune donnée disponible</Text>
            <Text style={styles.emptyChartSubtext}>Ajoutez votre première mesure pour voir le graphique</Text>
          </View>
        )}
      </View>

      {/* Tableau des mesures (aligné web : chart → table → add) */}
      <RecentMeasurements
        measurements={measurements}
        initialMeasurements={initialMeasurements}
        onEditMeasurement={onEditMeasurement}
        onViewHistory={onViewHistory}
        onDeleteMeasurement={onDeleteMeasurement}
        onMeasurementClick={onMeasurementClick}
        onAddMeasurement={onAddMeasurement}
      />

      {/* Add Measurement - zone en pointillés (aligné web) */}
      <TouchableOpacity style={styles.addMeasurementInput} onPress={onAddMeasurement} activeOpacity={0.7}>
        <View style={styles.addMeasurementInputInner}>
          <Ionicons name="add" size={40} color="#9CA3AF" />
          <Text style={styles.addMeasurementInputText}>Ajouter une nouvelle mesure</Text>
        </View>
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
  onMeasurementClick?: (measurement: Measurement) => void;
  onAddMeasurement?: () => void;
}

export const RecentMeasurements: React.FC<RecentMeasurementsProps> = ({ 
  measurements = [],
  initialMeasurements,
  onEditMeasurement,
  onViewHistory,
  onDeleteMeasurement,
  onMeasurementClick,
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

  const formatDateTable = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const sortedMeasurements = [...measurements].filter(m => !m.isInitial).sort((a: Measurement, b: Measurement) => {
    const dateA = a.createdAt || a.date || '';
    const dateB = b.createdAt || b.date || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  const hasInitial = initialMeasurements && (initialMeasurements.weight != null || initialMeasurements.waistSize != null);
  const hasAnyRow = sortedMeasurements.length > 0 || hasInitial;

  return (
    <View style={styles.measurementsSection}>
      {hasAnyRow ? (
        <ScrollView style={styles.measurementsTable} showsVerticalScrollIndicator={true}>
          {/* En-tête aligné web référence : Poids | Activité | Source | Date | Actions */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.tableColPoids]}>Poids (kg)</Text>
            <Text style={[styles.tableHeaderCell, styles.tableColActivite]}>Activité</Text>
            <Text style={[styles.tableHeaderCell, styles.tableColSource]}>Source</Text>
            <Text style={[styles.tableHeaderCell, styles.tableColDate]}>Date</Text>
            <View style={styles.tableColActions} />
          </View>
          {sortedMeasurements.map((measurement, index) => (
            <TouchableOpacity
              key={measurement.id || index}
              style={styles.tableRow}
              onPress={() => onMeasurementClick && onMeasurementClick(measurement)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tableCell, styles.tableColPoids]} numberOfLines={1}>
                {measurement.weight ?? '—'}
              </Text>
              <Text style={[styles.tableCell, styles.tableColActivite]} numberOfLines={1}>
                {measurement.notes && measurement.notes.trim() ? measurement.notes.trim() : '—'}
              </Text>
              <View style={styles.tableColSource}>
                <View style={[styles.sourceBadge, measurement.isFromPhoto ? styles.sourceBadgePhoto : styles.sourceBadgeMesure]}>
                  <Text style={[styles.sourceBadgeText, { color: measurement.isFromPhoto ? theme.colors.primary : '#6B7280' }]}>
                    {measurement.isFromPhoto ? 'Photo' : 'Mesure'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.tableCell, styles.tableColDate]}>
                {formatDateTable(measurement.date || measurement.createdAt || measurement.updatedAt)}
              </Text>
              <View style={[styles.tableColActions, styles.actionsCell]}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    onEditMeasurement && onEditMeasurement(measurement);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
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
                        { text: 'Supprimer', style: 'destructive', onPress: () => onDeleteMeasurement && onDeleteMeasurement(measurement.id) }
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#F44336" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          {hasInitial && (
            <View style={[styles.tableRow, styles.initialRow]}>
              <Text style={[styles.tableCell, styles.tableColPoids]}>
                {initialMeasurements!.weight != null ? initialMeasurements!.weight : '—'}
              </Text>
              <Text style={[styles.tableCell, styles.tableColActivite]}>Mesure initiale</Text>
              <View style={styles.tableColSource}>
                <View style={[styles.sourceBadge, styles.sourceBadgeMesure]}>
                  <Text style={[styles.sourceBadgeText, { color: '#6B7280' }]}>Mesure</Text>
                </View>
              </View>
              <Text style={[styles.tableCell, styles.tableColDate]}>
                {initialMeasurements!.date ? formatDateTable(initialMeasurements!.date as string) : '—'}
              </Text>
              <View style={[styles.tableColActions, styles.actionsCell]}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    const initialM: Measurement = {
                      id: 'initial',
                      weight: initialMeasurements!.weight ?? undefined,
                      waistSize: initialMeasurements!.waistSize ?? undefined,
                      notes: 'Mesure initiale',
                      createdAt: initialMeasurements!.date || new Date().toISOString(),
                      isInitial: true,
                    };
                    onEditMeasurement && onEditMeasurement(initialM);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyMeasurements}>
          <Ionicons name="clipboard-outline" size={32} color="#E0E0E0" />
          <Text style={styles.emptyMeasurementsText}>Aucune mesure enregistrée.</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  initialMeasuresText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  initialMeasuresBold: {
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 10,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  chartSection: {
    marginBottom: 30,
  },
  combinedChartWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  chartCenterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonImagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  comparisonImageBox: {
    alignItems: 'center',
    width: 72,
  },
  comparisonImageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  comparisonImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  comparisonImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipCard: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tooltipCloseBtn: {
    padding: 4,
  },
  tooltipDate: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  tooltipMetrics: {
    marginBottom: 6,
  },
  tooltipMetric: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipActivity: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  tooltipPhotosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tooltipPhotoBox: {
    alignItems: 'center',
  },
  tooltipPhotoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  tooltipPhoto: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tooltipPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 4,
  },
  measurementsTable: {
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
  tableColSource: { width: '20%', minWidth: 64, paddingHorizontal: 2 },
  tableColDate: { width: '22%', minWidth: 72 },
  tableColActions: { width: '18%', minWidth: 56, flexDirection: 'row', justifyContent: 'flex-end' },
  initialRow: {
    backgroundColor: '#ECFDF5',
  },
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
    flexWrap: 'wrap',
  },
  measurementCardDate: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  initialBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  initialBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 15,
    minHeight: 100,
  },
  addMeasurementInputInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMeasurementInputText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
  },
});

export default ProgressChart;