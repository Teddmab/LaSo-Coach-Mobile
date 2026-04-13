import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
  Modal,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { Measurement, InitialMeasurement } from '../screens/progress/types';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 80; // Account for card margins and padding

interface ProgressChartProps {
  chartData?: any[];
  initialMeasurements?: InitialMeasurement | null;
  measurements?: Measurement[];
  initialProgressPhoto?: any | null;
  onDataPointPress?: (data: any, index: number) => void;
  onDeleteMeasurement?: (id?: string) => void;
  onAddMeasurement?: () => void;
  onEditMeasurement?: (measurement: Measurement) => void;
  onViewHistory?: (measurement: Measurement) => void;
  onMeasurementClick?: (measurement: Measurement) => void;
  /** Clic sur un point du graphique → même flux que le tableau (comparaison Avant / Après) */
  onChartMeasurementPress?: (measurement: Measurement) => void;
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
  onChartMeasurementPress,
  getPhotoUrl
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

  const resolveMeasurementFromChartPoint = (point: any): Measurement | null => {
    if (!point) return null;
    const list = measurements ?? [];

    const mid = point.measurementId as string | undefined;
    if (mid === 'initial') {
      const found = list.find((m) => m.isInitial || m.id === 'initial');
      if (found) return found;
      if (initialMeasurements) {
        return {
          id: 'initial',
          weight: point.weight ?? initialMeasurements.weight ?? undefined,
          waistSize: point.waistSize ?? initialMeasurements.waistSize ?? undefined,
          createdAt:
            (point.date || point.createdAt || initialMeasurements.date || new Date().toISOString()) as string,
          isInitial: true,
          notes: point.notes || 'Mesure initiale',
        } as Measurement;
      }
      return null;
    }
    if (mid) {
      const found = list.find((m) => m.id === mid);
      if (found) return found;
    }
    const pt = new Date(point.date || point.createdAt).getTime();
    if (Number.isNaN(pt)) return null;
    return (
      list.find((m) => {
        if (point.isInitial && (m.isInitial || m.id === 'initial')) return true;
        if (m.isInitial || m.id === 'initial') return false;
        const mt = new Date(m.createdAt || m.date || 0).getTime();
        return Math.abs(mt - pt) < 1000 * 60 * 60 * 12;
      }) ?? null
    );
  };

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
          <View style={[styles.combinedChartWrapper, { width: chartWidth }]}>
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
                const index = typeof data?.index === 'number' ? data.index : null;
                if (index == null || index < 0) return;
                const point = combinedChartData.sortedData[index];
                const m = resolveMeasurementFromChartPoint(point);
                if (m && onChartMeasurementPress) {
                  onChartMeasurementPress(m);
                }
                if (onDataPointPress) onDataPointPress(data, index);
              }}
            />
            {/* Couche tactile : les cercles SVG du chart-kit ne reçoivent souvent pas les taps dans un ScrollView */}
            {onChartMeasurementPress && combinedChartData.sortedData.length > 0 && (
              <View
                style={[styles.chartPointOverlay, { width: chartWidth, height: 240 }]}
                pointerEvents="box-none"
              >
                <View style={styles.chartPointOverlayRow} pointerEvents="auto">
                  {combinedChartData.sortedData.map((point: any, i: number) => (
                    <Pressable
                      key={`chart-hit-${i}`}
                      style={styles.chartHitStrip}
                      hitSlop={{ top: 24, bottom: 24 }}
                      onPress={() => {
                        const m = resolveMeasurementFromChartPoint(point);
                        if (m) onChartMeasurementPress(m);
                      }}
                    />
                  ))}
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
  const insets = useSafeAreaInsets();
  const [actionSheet, setActionSheet] = React.useState<{
    measurement: Measurement;
    allowDelete: boolean;
  } | null>(null);

  const closeActionSheet = () => setActionSheet(null);

  const confirmDeleteMeasurement = (measurement: Measurement) => {
    if (!measurement.id) return;
    Alert.alert(
      'Supprimer la mesure',
      'Êtes-vous sûr de vouloir supprimer cette mesure ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDeleteMeasurement && onDeleteMeasurement(measurement.id),
        },
      ]
    );
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

  /** Récap pour le bottom sheet : poids, tour, source, date, extrait notes / activité */
  const buildMeasurementRecap = (m: Measurement): string => {
    const chunks: string[] = [];
    if (m.weight != null && String(m.weight).trim() !== '') chunks.push(`${m.weight} kg`);
    if (m.waistSize != null && String(m.waistSize).trim() !== '') chunks.push(`Tour ${m.waistSize} cm`);
    const src = m.isFromPhoto ? 'Photo' : m.isInitial || m.id === 'initial' ? 'Mesure initiale' : 'Mesure';
    chunks.push(src);
    const d = formatDateTable(m.date || m.createdAt || m.updatedAt);
    if (d !== 'N/A') chunks.push(d);
    const notes = (m.notes || '').trim();
    if (notes && notes !== 'Mesure initiale') {
      const short = notes.length > 48 ? `${notes.slice(0, 45)}…` : notes;
      chunks.push(short);
    }
    return chunks.join(' · ');
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
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableRowMain}>
              <Text style={[styles.tableHeaderCell, styles.tableColPoidsCompact]}>Poids (kg)</Text>
              <Text style={[styles.tableHeaderCell, styles.tableColSourceCompact]}>Source</Text>
            </View>
            <Text style={[styles.tableHeaderCell, styles.tableColActions, styles.tableHeaderAction]}>Action</Text>
          </View>
          {sortedMeasurements.map((measurement, index) => (
            <View key={measurement.id || index} style={styles.tableRow}>
              <Pressable
                style={styles.tableRowMain}
                onPress={() => onMeasurementClick && onMeasurementClick(measurement)}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              >
                <Text style={[styles.tableCell, styles.tableColPoidsCompact]} numberOfLines={1}>
                  {measurement.weight ?? '—'}
                </Text>
                <View style={styles.tableColSourceCompact}>
                  <View style={[styles.sourceBadge, measurement.isFromPhoto ? styles.sourceBadgePhoto : styles.sourceBadgeMesure]}>
                    <Text style={[styles.sourceBadgeText, { color: measurement.isFromPhoto ? theme.colors.primary : '#6B7280' }]}>
                      {measurement.isFromPhoto ? 'Photo' : 'Mesure'}
                    </Text>
                  </View>
                </View>
              </Pressable>
              <View style={[styles.tableColActions, styles.actionsCell]}>
                <TouchableOpacity
                  style={styles.actionMenuButton}
                  onPress={() => setActionSheet({ measurement, allowDelete: true })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Ouvrir les actions sur cette mesure"
                >
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {hasInitial && (
            <View style={[styles.tableRow, styles.initialRow]}>
              <Pressable
                style={styles.tableRowMain}
                onPress={() => {
                  const initialM: Measurement = {
                    id: 'initial',
                    weight: initialMeasurements!.weight ?? undefined,
                    waistSize: initialMeasurements!.waistSize ?? undefined,
                    notes: 'Mesure initiale',
                    createdAt: initialMeasurements!.date || new Date().toISOString(),
                    isInitial: true,
                  };
                  onMeasurementClick && onMeasurementClick(initialM);
                }}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              >
                <Text style={[styles.tableCell, styles.tableColPoidsCompact]}>
                  {initialMeasurements!.weight != null ? initialMeasurements!.weight : '—'}
                </Text>
                <View style={styles.tableColSourceCompact}>
                  <View style={[styles.sourceBadge, styles.sourceBadgeMesure]}>
                    <Text style={[styles.sourceBadgeText, { color: '#6B7280' }]}>Mesure</Text>
                  </View>
                </View>
              </Pressable>
              <View style={[styles.tableColActions, styles.actionsCell]}>
                <TouchableOpacity
                  style={styles.actionMenuButton}
                  onPress={() => {
                    const initialM: Measurement = {
                      id: 'initial',
                      weight: initialMeasurements!.weight ?? undefined,
                      waistSize: initialMeasurements!.waistSize ?? undefined,
                      notes: 'Mesure initiale',
                      createdAt: initialMeasurements!.date || new Date().toISOString(),
                      isInitial: true,
                    };
                    setActionSheet({ measurement: initialM, allowDelete: false });
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Ouvrir les actions mesure initiale"
                >
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
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

      <Modal
        visible={actionSheet != null}
        transparent
        animationType="slide"
        onRequestClose={closeActionSheet}
      >
        <View style={styles.actionSheetRoot}>
          <Pressable style={styles.actionSheetBackdrop} onPress={closeActionSheet} />
          <View style={[styles.actionSheetPanel, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.actionSheetHandle} />
            <Text style={styles.actionSheetTitle}>Actions</Text>
            {actionSheet && (
              <>
                <View style={styles.actionSheetRecap}>
                  <View style={styles.actionSheetRecapIcon}>
                    <Ionicons name="analytics-outline" size={22} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.actionSheetRecapText}>{buildMeasurementRecap(actionSheet.measurement)}</Text>
                </View>
                {onEditMeasurement ? (
                  <TouchableOpacity
                    style={styles.actionSheetRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      const m = actionSheet.measurement;
                      closeActionSheet();
                      onEditMeasurement(m);
                    }}
                  >
                    <View style={[styles.actionSheetRowIcon, styles.actionSheetRowIconPrimary]}>
                      <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.actionSheetRowLabel}>Modifier la mesure</Text>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </TouchableOpacity>
                ) : null}
                {actionSheet.allowDelete && onDeleteMeasurement ? (
                  <TouchableOpacity
                    style={styles.actionSheetRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      const m = actionSheet.measurement;
                      closeActionSheet();
                      confirmDeleteMeasurement(m);
                    }}
                  >
                    <View style={[styles.actionSheetRowIcon, styles.actionSheetRowIconDanger]}>
                      <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </View>
                    <Text style={[styles.actionSheetRowLabel, styles.actionSheetRowLabelDanger]}>Supprimer</Text>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.actionSheetCancelBtn} activeOpacity={0.85} onPress={closeActionSheet}>
                  <Text style={styles.actionSheetCancelBtnText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    alignSelf: 'center',
  },
  chartPointOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 4,
  },
  chartPointOverlayRow: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
  },
  chartHitStrip: {
    flex: 1,
    alignSelf: 'stretch',
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableHeaderAction: {
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 10,
  },
  tableCell: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  tableColPoidsCompact: {
    width: '28%',
    minWidth: 56,
    fontVariant: ['tabular-nums'],
  },
  tableColSourceCompact: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  tableColActions: { width: 52, minWidth: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  actionSheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  actionSheetPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  actionSheetRecap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionSheetRecapIcon: {
    marginTop: 2,
  },
  actionSheetRecapText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  actionSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionSheetRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetRowIconPrimary: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },
  actionSheetRowIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionSheetRowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  actionSheetRowLabelDanger: {
    color: '#EF4444',
  },
  actionSheetCancelBtn: {
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  actionSheetCancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenuButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
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