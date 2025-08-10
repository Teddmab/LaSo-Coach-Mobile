import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import CircularProgress from '../CircularProgress';
import DashboardService from '../../services/dashboardService';

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
}

interface ProgressCardProps {
  dashboardData?: any; // Accept dashboard data as prop
  onRefresh?: () => void;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ dashboardData, onRefresh }) => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  // Calculate progress from dashboard data when it changes
  useEffect(() => {
    if (dashboardData && !refreshing) {
      try {
        console.log('📊 ProgressCard: Received dashboard data, calculating progress...');
        const calculatedProgress = DashboardService.calculateProgress(dashboardData);
        console.log('📊 ProgressCard: Progress calculated from props:', calculatedProgress);
        setProgressData(calculatedProgress);
        setError(null);
      } catch (err) {
        console.error('❌ ProgressCard: Error calculating progress from props:', err);
        setError('Erreur lors du calcul des données');
        setProgressData(null);
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
      console.log('📊 ProgressCard: progressData updated:', {
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
      
      console.log('📊 ProgressCard: Fetching dashboard data...');
      const data = await DashboardService.getDashboardData();
      const calculatedProgress = DashboardService.calculateProgress(data);
      
      console.log('📊 ProgressCard: Progress calculated from fetch:', calculatedProgress);
      setProgressData(calculatedProgress);
    } catch (err) {
      console.error('❌ ProgressCard: Error fetching progress data:', err);
      setError('Erreur lors du chargement des données');
      setProgressData(null); // Don't show any fallback data
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      console.log('🔄 ProgressCard: Refresh button pressed - fetching fresh data...');
      console.log('📊 ProgressCard: Current values before refresh:', progressData);
      setRefreshing(true);
      setError(null);
      
      // Always fetch fresh data from backend when refresh is pressed
      const freshData = await DashboardService.getDashboardData();
      console.log('📊 ProgressCard: Fresh dashboard data received:', freshData);
      
      const calculatedProgress = DashboardService.calculateProgress(freshData);
      console.log('📊 ProgressCard: Fresh progress calculated:', calculatedProgress);
      
      setProgressData(calculatedProgress);
      setLastRefreshTime(Date.now());
      
      // Also notify parent component about the refresh
      onRefresh?.();
    } catch (err) {
      console.error('❌ ProgressCard: Error refreshing data:', err);
      setError('Erreur lors du rafraîchissement des données');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLearnMore = () => {
    console.log('📚 Learn more pressed - navigate to progress details');
    // TODO: Navigate to detailed progress screen
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
      
      <View style={styles.progressGrid}>
        <CircularProgress
          size={90}
          progress={progressData.weight.progress}
          initial={progressData.weight.initial}
          current={progressData.weight.current}
          target={progressData.weight.target}
          unit="kg"
          label="Poids"
          color="#8BC34A"
        />
        
        <CircularProgress
          size={90}
          progress={progressData.waist.progress}
          initial={progressData.waist.initial}
          current={progressData.waist.current}
          target={progressData.waist.target}
          unit="cm"
          label="Tour de taille"
          color="#2196F3"
        />
        
        <CircularProgress
          size={90}
          progress={progressData.points.progress}
          initial={0}
          current={progressData.points.current}
          target={progressData.points.max}
          unit=""
          label="Points"
          color="#4CAF50"
        />
      </View>
      
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  refreshButton: {
    padding: 4,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
});

export default ProgressCard; 