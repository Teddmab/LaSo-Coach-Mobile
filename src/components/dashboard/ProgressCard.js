import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import CircularProgress from '../CircularProgress';

const ProgressCard = ({ 
  dashboardData, 
  onRefresh, 
  subscriptionData = null,
  onSubscriptionRenew 
}) => {
  const isSubscriptionExpired = subscriptionData?.isExpired || false;
  const isSubscriptionExpiringSoon = subscriptionData?.isExpiringSoon || false;
  const requiresRenewal = subscriptionData?.requiresRenewal || false;

  const handleEnSavoirPlus = () => {
    if (requiresRenewal) {
      console.log('💳 Progress: Subscription renewal required, navigating to subscription page');
      if (onSubscriptionRenew) {
        onSubscriptionRenew();
      }
    } else {
      console.log('📊 Progress: En savoir plus pressed');
      // Handle normal progress navigation
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
        progressPercentage: 0,
        weightProgress: 0,
        waistProgress: 0,
        hasProfileData: false
      };
    }

    const profile = dashboardData.profile;
    const measurements = dashboardData.measurements;
    
    if (!profile) {
      return {
        currentWeight: 0,
        targetWeight: 0,
        initialWeight: 0,
        currentWaistSize: 0,
        targetWaistSize: 0,
        initialWaistSize: 0,
        progressPercentage: 0,
        weightProgress: 0,
        waistProgress: 0,
        hasProfileData: false
      };
    }

    const initialWeight = profile.initialWeight || 0;
    const targetWeight = profile.targetWeight || 0;
    const currentWeight = measurements?.currentWeight || initialWeight;
    
    const initialWaistSize = profile.initialWaistSize || 0;
    const targetWaistSize = profile.targetWaistSize || 0;
    const currentWaistSize = measurements?.currentWaistSize || initialWaistSize;

    // Calculate progress percentages
    const weightProgress = initialWeight > targetWeight 
      ? Math.max(0, Math.min(100, ((initialWeight - currentWeight) / (initialWeight - targetWeight)) * 100))
      : Math.max(0, Math.min(100, ((currentWeight - initialWeight) / (targetWeight - initialWeight)) * 100));

    const waistProgress = initialWaistSize > targetWaistSize
      ? Math.max(0, Math.min(100, ((initialWaistSize - currentWaistSize) / (initialWaistSize - targetWaistSize)) * 100))
      : Math.max(0, Math.min(100, ((currentWaistSize - initialWaistSize) / (targetWaistSize - initialWaistSize)) * 100));

    const overallProgress = (weightProgress + waistProgress) / 2;

    return {
      currentWeight,
      targetWeight,
      initialWeight,
      currentWaistSize,
      targetWaistSize,
      initialWaistSize,
      progressPercentage: overallProgress,
      weightProgress,
      waistProgress,
      hasProfileData: true
    };
  };

  const progressData = getProgressData();

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
          
          <TouchableOpacity 
            style={styles.enSavoirPlusButton}
            onPress={handleEnSavoirPlus}
          >
            <Text style={styles.enSavoirPlusText}>En savoir +</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Fallback Content */}
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

      {/* Progress Content */}
      <View style={styles.content}>
        {!dashboardData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : (
          <>
            {/* Main Progress Circle */}
            <View style={styles.progressSection}>
              <CircularProgress
                progress={progressData.progressPercentage}
                size={120}
                strokeWidth={8}
                initial={progressData.initialWeight}
                current={progressData.currentWeight}
                target={progressData.targetWeight}
                unit="kg"
                label="Poids actuel"
              />
              
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>Progression globale</Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(progressData.progressPercentage)}%
                </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
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
});

export default ProgressCard; 