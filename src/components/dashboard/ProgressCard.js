import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import CircularProgress from '../CircularProgress';

const ProgressCard = ({ 
  dashboardData, 
  onRefresh, 
  subscriptionData = null,
  onSubscriptionRenew,
  onProgressPress 
}) => {
  const isSubscriptionExpired = subscriptionData?.isExpired || false;
  const isSubscriptionExpiringSoon = subscriptionData?.isExpiringSoon || false;
  const requiresRenewal = subscriptionData?.requiresRenewal || false;

  // State for metrics modal
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState(['weight', 'waist', 'points']); // Default metrics

  const handleEnSavoirPlus = () => {
    if (requiresRenewal) {
      console.log('💳 Progress: Subscription renewal required, navigating to subscription page');
      if (onSubscriptionRenew) {
        onSubscriptionRenew();
      }
    } else {
      console.log('📊 Progress: En savoir plus pressed - navigating to progress tab');
      if (onProgressPress) {
        onProgressPress('progress');
      }
    }
  };

  const getProgressData = () => {
    if (!dashboardData) {
      return {
        currentWeight: 0,
        targetWeight: 0,
        initialWeight: 0,
        currentWaistSize: 0,
        targetWaistSize: 0,
        initialWaistSize: 0,
        currentPoints: 0,
        maxPoints: 5000,
        progressPercentage: 0,
        weightProgress: 0,
        waistProgress: 0,
        pointsProgress: 0,
        hasProfileData: false
      };
    }

    const profile = dashboardData.profile;
    const measurements = dashboardData.measurements;
    const tasccProgress = dashboardData.tascc;
    
    if (!profile) {
      return {
        currentWeight: 0,
        targetWeight: 0,
        initialWeight: 0,
        currentWaistSize: 0,
        targetWaistSize: 0,
        initialWaistSize: 0,
        currentPoints: 0,
        maxPoints: 5000,
        progressPercentage: 0,
        weightProgress: 0,
        waistProgress: 0,
        pointsProgress: 0,
        hasProfileData: false
      };
    }

    const initialWeight = profile.initialWeight || 0;
    const targetWeight = profile.targetWeight || 0;
    const currentWeight = measurements?.currentWeight || initialWeight;
    
    const initialWaistSize = profile.initialWaistSize || 0;
    const targetWaistSize = profile.targetWaistSize || 0;
    const currentWaistSize = measurements?.currentWaistSize || initialWaistSize;

    // Get points data
    const currentPoints = tasccProgress?.totalPoints || 0;
    const maxPoints = 5000; // Default max points

    // Calculate progress percentages
    const weightProgress = initialWeight > targetWeight 
      ? Math.max(0, Math.min(100, ((initialWeight - currentWeight) / (initialWeight - targetWeight)) * 100))
      : Math.max(0, Math.min(100, ((currentWeight - initialWeight) / (targetWeight - initialWeight)) * 100));

    const waistProgress = initialWaistSize > targetWaistSize
      ? Math.max(0, Math.min(100, ((initialWaistSize - currentWaistSize) / (initialWaistSize - targetWaistSize)) * 100))
      : Math.max(0, Math.min(100, ((currentWaistSize - initialWaistSize) / (targetWaistSize - initialWaistSize)) * 100));

    const pointsProgress = Math.min(100, (currentPoints / maxPoints) * 100);

    const overallProgress = (weightProgress + waistProgress + pointsProgress) / 3;

    return {
      currentWeight,
      targetWeight,
      initialWeight,
      currentWaistSize,
      targetWaistSize,
      initialWaistSize,
      currentPoints,
      maxPoints,
      progressPercentage: overallProgress,
      weightProgress,
      waistProgress,
      pointsProgress,
      hasProfileData: true
    };
  };

  // Helper function to format points with K suffix
  const formatPoints = (points) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  };

  const progressData = getProgressData();

  // Available metrics
  const availableMetrics = [
    { 
      id: 'weight', 
      label: 'Poids', 
      icon: 'scale',
      color: '#4CAF50',
      getData: () => ({
        progress: progressData.weightProgress,
        current: progressData.currentWeight,
        target: progressData.targetWeight,
        initial: progressData.initialWeight,
        unit: 'kg'
      })
    },
    { 
      id: 'waist', 
      label: 'Tour de taille', 
      icon: 'resize',
      color: '#2196F3',
      getData: () => ({
        progress: progressData.waistProgress,
        current: progressData.currentWaistSize,
        target: progressData.targetWaistSize,
        initial: progressData.initialWaistSize,
        unit: 'cm'
      })
    },
    { 
      id: 'points', 
      label: 'Points', 
      icon: 'trophy',
      color: '#FF9800',
      getData: () => ({
        progress: progressData.pointsProgress,
        current: formatPoints(progressData.currentPoints),
        target: formatPoints(progressData.maxPoints),
        initial: 0,
        unit: ''
      })
    },
    { 
      id: 'length', 
      label: 'Longueur', 
      icon: 'analytics',
      color: '#9C27B0',
      getData: () => {
        // Get length data from dashboardData if available
        const lengthData = dashboardData?.measurements?.length || {};
        return {
          progress: lengthData.progress || 0,
          current: lengthData.current || 0,
          target: lengthData.target || 0,
          initial: lengthData.initial || 0,
          unit: 'cm'
        };
      }
    },
    { 
      id: 'agora', 
      label: 'Agora', 
      icon: 'people',
      color: '#FF5722',
      getData: () => {
        // Get Agora participation data from dashboardData if available
        const agoraData = dashboardData?.agora || {};
        return {
          progress: agoraData.participationRate || 0,
          current: agoraData.totalPosts || 0,
          target: agoraData.targetPosts || 100,
          initial: 0,
          unit: 'posts'
        };
      }
    }
  ];

  // Toggle metric selection
  const toggleMetric = (metricId) => {
    if (selectedMetrics.includes(metricId)) {
      // Ensure at least one metric remains selected
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter(id => id !== metricId));
      }
    } else {
      // Limit to maximum 3 metrics
      if (selectedMetrics.length < 3) {
        setSelectedMetrics([...selectedMetrics, metricId]);
      }
    }
  };

  // Get the selected metrics to display
  const getDisplayMetrics = () => {
    return availableMetrics.filter(metric => selectedMetrics.includes(metric.id));
  };

  // Show fallback content when profile data is missing
  if (!progressData.hasProfileData) {
    return (
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trending-up" size={20} color={theme.colors.text.primary} />
          <Text style={styles.title}>Progression</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.addMetricButton}
            onPress={() => setShowMetricsModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.enSavoirPlusButton}
            onPress={handleEnSavoirPlus}
          >
            <Text style={styles.enSavoirPlusText}>En savoir +</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>        {/* Fallback Content */}
        <View style={styles.fallbackContainer}>
          <Ionicons name="person-circle-outline" size={48} color={theme.colors.text.secondary} />
          <Text style={styles.fallbackTitle}>Profil incomplet</Text>
          <Text style={styles.fallbackSubtitle}>
            Complétez votre profil pour voir votre progression
          </Text>
          <TouchableOpacity 
            style={styles.fallbackButton}
            onPress={handleEnSavoirPlus}
          >
            <LinearGradient
              colors={[theme.colors.primary, '#0056b3']}
              style={styles.fallbackButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.fallbackButtonText}>Compléter le profil</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trending-up" size={20} color={theme.colors.text.primary} />
          <Text style={styles.title}>Progression</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.addMetricButton}
            onPress={() => setShowMetricsModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.enSavoirPlusButton,
              requiresRenewal && styles.enSavoirPlusButtonDisabled
            ]}
            onPress={handleEnSavoirPlus}
            disabled={requiresRenewal}
          >
            <Text style={[
              styles.enSavoirPlusText,
              requiresRenewal && styles.enSavoirPlusTextDisabled
            ]}>
              {requiresRenewal ? 'Renouveler' : 'En savoir +'}
            </Text>
            <Ionicons 
              name={requiresRenewal ? "card" : "arrow-forward"} 
              size={16} 
              color={requiresRenewal ? theme.colors.text.secondary : theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Content */}
      <View style={styles.content}>
        {!dashboardData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : (
          <>
            {/* Dynamic Progress Circles */}
            <View style={styles.progressSection}>
              <View style={styles.progressCircles}>
                {getDisplayMetrics().map((metric) => {
                  const data = metric.getData();
                  return (
                    <CircularProgress
                      key={metric.id}
                      progress={data.progress}
                      size={80}
                      strokeWidth={6}
                      initial={data.initial}
                      current={data.current}
                      target={data.target}
                      unit={data.unit}
                      label={metric.label}
                    />
                  );
                })}
              </View>
            </View>

            {/* Weight and Waist Progress */}
            <View style={styles.detailsSection}>
              <View style={styles.progressItem}>
                <View style={styles.progressItemHeader}>
                  <Ionicons name="scale" size={16} color="#4CAF50" />
                  <Text style={styles.progressItemTitle}>Poids</Text>
                </View>
                <Text style={styles.progressItemValue}>
                  {progressData.currentWeight}kg
                </Text>
                <Text style={styles.progressItemTarget}>
                  Objectif: {progressData.targetWeight}kg
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${progressData.weightProgress}%` }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.progressItem}>
                <View style={styles.progressItemHeader}>
                  <Ionicons name="resize" size={16} color="#2196F3" />
                  <Text style={styles.progressItemTitle}>Tour de taille</Text>
                </View>
                <Text style={styles.progressItemValue}>
                  {progressData.currentWaistSize}cm
                </Text>
                <Text style={styles.progressItemTarget}>
                  Objectif: {progressData.targetWaistSize}cm
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${progressData.waistProgress}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>

            {/* Subscription Warning */}
            {requiresRenewal && (
              <View style={styles.subscriptionWarning}>
                <Ionicons 
                  name="warning" 
                  size={16} 
                  color={isSubscriptionExpired ? "#F44336" : "#FF9800"} 
                />
                <Text style={styles.subscriptionWarningText}>
                  {isSubscriptionExpired 
                    ? "Abonnement expiré - Renouvelez pour continuer"
                    : "Abonnement expire bientôt - Renouvelez maintenant"
                  }
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Metrics Selection Modal */}
      <Modal
        visible={showMetricsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMetricsModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowMetricsModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir les métriques</Text>
              <TouchableOpacity onPress={() => setShowMetricsModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Modal Subtitle */}
            <Text style={styles.modalSubtitle}>
              Sélectionnez jusqu'à 3 métriques à afficher
            </Text>

            {/* Metrics List */}
            <View style={styles.metricsList}>
              {availableMetrics.map((metric) => {
                const isSelected = selectedMetrics.includes(metric.id);
                const isDisabled = !isSelected && selectedMetrics.length >= 3;

                return (
                  <TouchableOpacity
                    key={metric.id}
                    style={[
                      styles.metricItem,
                      isSelected && styles.metricItemSelected,
                      isDisabled && styles.metricItemDisabled
                    ]}
                    onPress={() => toggleMetric(metric.id)}
                    disabled={isDisabled}
                  >
                    <View style={styles.metricItemLeft}>
                      <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
                        <Ionicons name={metric.icon} size={24} color={metric.color} />
                      </View>
                      <Text style={[
                        styles.metricItemLabel,
                        isDisabled && styles.metricItemLabelDisabled
                      ]}>
                        {metric.label}
                      </Text>
                    </View>
                    
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Done Button */}
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setShowMetricsModal(false)}
            >
              <LinearGradient
                colors={[theme.colors.primary, '#0056b3']}
                style={styles.modalDoneButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.modalDoneButtonText}>Terminé</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  addMetricButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  enSavoirPlusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F8FF',
  },
  enSavoirPlusButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  enSavoirPlusText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  enSavoirPlusTextDisabled: {
    color: theme.colors.text.secondary,
  },
  content: {
    gap: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fallbackButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  fallbackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  fallbackButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressSection: {
    alignItems: 'center',
    gap: 16,
  },
  progressCircles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  detailsSection: {
    gap: 16,
  },
  progressItem: {
    gap: 8,
  },
  progressItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  progressItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  progressItemTarget: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  subscriptionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  subscriptionWarningText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  metricsList: {
    gap: 12,
    marginBottom: 24,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  metricItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: theme.colors.primary,
  },
  metricItemDisabled: {
    opacity: 0.4,
  },
  metricItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  metricItemLabelDisabled: {
    color: theme.colors.text.secondary,
  },
  modalDoneButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalDoneButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ProgressCard; 