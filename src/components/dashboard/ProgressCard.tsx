import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import CircularProgress from '../CircularProgress';
import DashboardService from '../../services/dashboardService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../../utils/logger';

// Create logger instance for this component
const logger = createLogger('ProgressCard');

interface ProgressData {
  weight: {
    progress: number;
    initial: number;
    current: number;
    target: number;
    remaining: number;
    lost: number;
  };
  waist: {
    progress: number;
    initial: number;
    current: number;
    target: number;
    remaining: number;
    reduced: number;
  };
  points: {
    progress: number;
    current: number;
    max: number;
    remaining: number;
  };
  height?: {
    current: number;
  };
  bmi?: {
    progress: number;
    current: number;
    target: number;
  };
}

interface ProgressCardProps {
  dashboardData?: any; // Accept dashboard data as prop
  onRefresh?: () => void;
  onAddMetric?: () => void; // Optional: open metric selection/additional chart
  onProgressPress?: (tab: string) => void; // Optional: navigate to progress tab
}

const ProgressCard: React.FC<ProgressCardProps> = ({ dashboardData, onRefresh, onAddMetric, onProgressPress }) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['weight', 'waist']);

  /**
   * Transform progress overview API response to match our expected format
   * @param {Object} apiData - Data from the progress overview endpoint
   * @returns {ProgressData} Transformed progress data
   */
  const transformProgressData = (apiData: any): ProgressData => {
    const base: ProgressData = {
      weight: {
        progress: apiData.weightProgress || 0,
        initial: apiData.initialWeight || 0,
        current: apiData.currentWeight || 0,
        target: apiData.targetWeight || 0,
        remaining: Math.max(0, (apiData.targetWeight || 0) - (apiData.currentWeight || 0)),
        lost: Math.max(0, (apiData.initialWeight || 0) - (apiData.currentWeight || 0)),
      },
      waist: {
        progress: apiData.waistProgress || 0,
        initial: apiData.initialWaistSize || 0,
        current: apiData.currentWaistSize || 0,
        target: apiData.targetWaistSize || 0,
        remaining: Math.max(0, (apiData.targetWaistSize || 0) - (apiData.currentWaistSize || 0)),
        reduced: Math.max(0, (apiData.initialWaistSize || 0) - (apiData.currentWaistSize || 0)),
      },
      points: {
        progress: apiData.pointsProgress || 0,
        current: apiData.currentPoints || 0,
        max: apiData.maxPoints || 100,
        remaining: Math.max(0, (apiData.maxPoints || 100) - (apiData.currentPoints || 0)),
      },
    };

    // Height if present from API (cm)
    // API /profile returns height in meters (e.g., 1.6). Normalize to cm.
    const rawHeight = apiData.height || apiData.profileHeight || apiData?.profile?.height || 0;
    const heightCm = rawHeight > 3 ? rawHeight : rawHeight * 100;
    if (heightCm) {
      base.height = { current: heightCm };
    }

    // BMI if weight and height are available
    const weightKg = base.weight.current || apiData.currentWeight || 0;
    if (heightCm && weightKg) {
      const hM = heightCm / 100;
      const bmi = hM > 0 ? weightKg / (hM * hM) : 0;
      const targetBmi = 22;
      const bmiProgress = Math.max(0, Math.min(100, 100 - (Math.abs(bmi - targetBmi) / targetBmi) * 100));
      base.bmi = { current: Number(bmi.toFixed(1)), target: targetBmi, progress: bmiProgress };
    }

    return base;
  };

  // Calculate progress from dashboard data when it changes
  useEffect(() => {
    if (dashboardData && !refreshing) {
      try {
        logger.debug('Received dashboard data, calculating progress');
        const calculatedProgress = DashboardService.calculateProgress(dashboardData);
        logger.debug('Progress calculated from props', calculatedProgress);
        // Enrich with derived/optional metrics from dashboardData
        const rawHeight = dashboardData?.profile?.height || dashboardData?.measurements?.height || 0;
        const heightCm = rawHeight > 3 ? rawHeight : rawHeight * 100;
        const weightKg = calculatedProgress?.weight?.current || 0;
        const enriched: ProgressData = { ...calculatedProgress };
        if (heightCm) {
          enriched.height = { current: heightCm };
          const hM = heightCm / 100;
          if (weightKg) {
            const bmi = hM > 0 ? weightKg / (hM * hM) : 0;
            const targetBmi = 22;
            const bmiProgress = Math.max(0, Math.min(100, 100 - (Math.abs(bmi - targetBmi) / targetBmi) * 100));
            enriched.bmi = { current: Number(bmi.toFixed(1)), target: targetBmi, progress: bmiProgress };
          }
        }
        setProgressData(enriched);
        setError(null);
      } catch (err) {
        logger.error('Error calculating progress from props', err);
        logger.warn('Using fallback progress data due to error');
        
        // Use fallback data instead of showing error
        const fallbackData: ProgressData = {
          weight: {
            progress: 0,
            initial: 70,
            current: 67,
            target: 60,
            remaining: 7,
            lost: 3
          },
          waist: {
            progress: 0,
            initial: 90,
            current: 85,
            target: 80,
            remaining: 5,
            reduced: 5
          },
          points: {
            progress: 10,
            current: 100,
            max: 1000,
            remaining: 900
          }
        };
        
        setProgressData(fallbackData);
        setError(null);
      } finally {
        setLoading(false);
      }
    } else if (!dashboardData && !refreshing) {
      // Fallback to fetching own data if no dashboard data provided
      fetchProgressData();
    }
  }, [dashboardData, refreshing]);

  // Debug: Log when progressData changes
  useEffect(() => {
    if (progressData) {
      logger.debug('Progress data updated', {
        weight: progressData.weight,
        waist: progressData.waist,
        points: progressData.points,
        lastRefreshTime
      });
    }
  }, [progressData, lastRefreshTime]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.debug('Fetching progress data from new endpoint');
      
      // Try to get data from new progress overview endpoint
      const progressOverview = await DashboardService.getProgressOverview();
      
      if (progressOverview) {
        logger.debug('Progress overview data received', progressOverview);
        
        // Transform the new API response to match our expected format
        const transformedData = transformProgressData(progressOverview);
        logger.debug('Transformed progress data', transformedData);
        
        setProgressData(transformedData);
      } else {
        throw new Error('No progress data received');
      }
    } catch (err) {
      logger.error('Error fetching progress data', err);
      setError('Erreur lors du chargement des données');
      setProgressData(null); // Don't show any fallback data
    } finally {
      setLoading(false);
    }
  };

  // Persist and restore metric selection
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@dashboard:selectedMetrics');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length) {
            setSelectedMetrics(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('@dashboard:selectedMetrics', JSON.stringify(selectedMetrics));
      } catch {}
    })();
  }, [selectedMetrics]);

  const handleRefresh = async () => {
    try {
      logger.info('Refresh button pressed - fetching fresh data');
      logger.debug('Current values before refresh', progressData);
      setRefreshing(true);
      setError(null);
      
      // Always fetch fresh data from new progress overview endpoint
      const freshProgressOverview = await DashboardService.getProgressOverview();
      logger.debug('Fresh progress overview received', freshProgressOverview);
      
      if (freshProgressOverview) {
        const transformedProgress = transformProgressData(freshProgressOverview);
        logger.debug('Fresh progress transformed', transformedProgress);
        
        setProgressData(transformedProgress);
        setLastRefreshTime(Date.now());
        
        // Also notify parent component about the refresh
        onRefresh?.();
      } else {
        throw new Error('No fresh progress data received');
      }
    } catch (err) {
      logger.error('Error refreshing data', err);
      setError('Erreur lors du rafraîchissement des données');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLearnMore = () => {
    logger.info('Learn more pressed - navigating to progress tab');
    if (onProgressPress) {
      onProgressPress('progress');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="trending-up" size={20} color="#FF6B35" />
            <Text style={styles.title}>Progression</Text>
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!progressData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="trending-up" size={20} color="#FF6B35" />
            <Text style={styles.title}>Progression</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton} disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="refresh" size={20} color={theme.colors.text.secondary} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#FF6B35" />
          <Text style={styles.errorText}>{error || 'Aucune donnée disponible'}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Helpers to derive optional metrics safely
  const getHeightMetric = () => {
    const fromState = progressData?.height?.current ?? 0;
    if (fromState > 0) return { current: fromState };
    // Fallback to dashboardData profile (can be nested) or measurements.height
    const raw = (
      (dashboardData?.profile?.profile?.height as number | undefined) ??
      (dashboardData?.profile?.height as number | undefined) ??
      (dashboardData?.measurements?.height as number | undefined) ??
      0
    );
    const heightCm = raw > 3 ? raw : raw * 100; // normalize meters -> cm
    return { current: Number((heightCm || 0).toFixed(0)) };
  };

  const getBmiMetric = () => {
    // Height from state or dashboardData (handle nested profile.profile.height)
    const heightFromState = progressData?.height?.current ?? 0;
    const rawHeight =
      heightFromState ||
      (dashboardData?.profile?.profile?.height as number | undefined) ||
      (dashboardData?.profile?.height as number | undefined) ||
      (dashboardData?.measurements?.height as number | undefined) ||
      0;
    const heightCm = rawHeight > 3 ? rawHeight : rawHeight * 100;

    // Weight from state or dashboardData (fallback to initialWeight if needed, handle nested profile.profile.initialWeight)
    const weightKg =
      progressData?.weight?.current ??
      (dashboardData?.measurements?.currentWeight as number | undefined) ??
      (dashboardData?.profile?.profile?.initialWeight as number | undefined) ??
      (dashboardData?.profile?.initialWeight as number | undefined) ??
      0;

    const hM = heightCm > 0 ? Number(heightCm) / 100 : 0;
    const bmi = hM > 0 && weightKg > 0 ? weightKg / (hM * hM) : 0;
    const target = 22;
    const progress = bmi > 0 ? Math.max(0, Math.min(100, 100 - (Math.abs(bmi - target) / target) * 100)) : 0;
    return { current: Number(bmi.toFixed(1)), target, progress };
  };

  const getWeightRemainingMetric = () => {
    const initial = progressData?.weight?.initial ?? 0;
    const target = progressData?.weight?.target ?? 0;
    const current = progressData?.weight?.current ?? 0;
    const totalDelta = Math.max(0, initial - target);
    const remaining = Math.max(0, current - target);
    const progress = totalDelta > 0 ? Math.max(0, Math.min(100, (remaining / totalDelta) * 100)) : 0;
    return { remaining, progress };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trending-up" size={20} color="#FF6B35" />
          <Text style={styles.title}>Progression</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleRefresh} style={styles.iconButton} disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="refresh" size={20} color={theme.colors.text.secondary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.progressRow}
        style={styles.progressRowContainer}
      >
        {selectedMetrics.includes('weight') && (
          <View style={styles.circleWrapper}>
            <CircularProgress
              size={90}
              progress={progressData.weight.progress}
              initial={progressData.weight.initial}
              current={progressData.weight.current}
              target={progressData.weight.target}
              unit="kg"
              label="Poids"
              color="#C6E54A"
            />
          </View>
        )}
        {selectedMetrics.includes('waist') && (
          <View style={styles.circleWrapper}>
            <CircularProgress
              size={90}
              progress={progressData.waist.progress}
              initial={progressData.waist.initial}
              current={progressData.waist.current}
              target={progressData.waist.target}
              unit="cm"
              label="Tour de taille"
              color="#60A5FA"
            />
          </View>
        )}
      </ScrollView>
      
      <TouchableOpacity style={styles.learnMoreButton} onPress={handleLearnMore}>
        <Text style={styles.learnMoreText}>En savoir +</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  progressRowContainer: {
    width: '100%',
  },
  circleWrapper: {
    width: 110,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  learnMoreButton: {
    backgroundColor: '#8BC34A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'center',
  },
  learnMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginTop: 8,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#EFEFEF',
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
  },
});

export default ProgressCard; 