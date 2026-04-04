import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

interface AchievementsCardProps {
  badgesData?: any;
  onPress?: () => void;
  subscriptionData?: any;
  onSubscriptionRenew?: () => void;
}

const AchievementsCard: React.FC<AchievementsCardProps> = ({ 
  badgesData,
  onPress,
  subscriptionData,
  onSubscriptionRenew
}) => {
  // Extract data from badgesData (BadgeProgressWidget structure as per specification)
  const userPoints = badgesData?.totalPoints || 0;
  const currentBadge = badgesData?.currentBadge || null;
  const currentBadgeDescription = badgesData?.currentBadgeDescription || null;
  const currentBadgeLevel = badgesData?.currentBadgeLevel || 1;
  const pointsNeededForNext = badgesData?.pointsNeededForNext || 0; // Remaining points to finish
  const maxPointsForCurrentBadge = badgesData?.maxPointsForCurrentBadge || null; // Total points needed
  const nextBadgeName = badgesData?.nextBadgeName || null;
  // Support both unlockedBadges and badgesUnlocked field names
  const unlockedBadges = badgesData?.unlockedBadges || badgesData?.badgesUnlocked || 0;
  const totalBadges = badgesData?.totalBadges || 10;
  const progressPercentage = badgesData?.progressPercentage || 0;
  
  // Debug logging
  if (__DEV__) {
    console.log('🏆 [AchievementsCard] Badge data:', {
      unlockedBadges,
      totalBadges,
      userPoints,
      currentBadge,
      progressPercentage,
      rawData: badgesData
    });
  }
  
  // Calculate points earned for current badge (if maxPoints is available)
  const pointsEarnedForCurrentBadge = maxPointsForCurrentBadge !== null 
    ? Math.max(0, maxPointsForCurrentBadge - pointsNeededForNext)
    : null;
  
  // Badge status logic as per specification
  const isCompleted = currentBadgeLevel > 0;
  const isCurrent = badgesData?.isCurrent || false;
  
  // Status indicators as per specification
  let status, statusColor;
  if (isCurrent) {
    status = "NIVEAU " + currentBadgeLevel + " 🏅";
    statusColor = "#FFD600"; // Yellow
  } else if (isCompleted) {
    status = "NIVEAU " + currentBadgeLevel + " ✓";
    statusColor = "#10B981"; // Green
  } else {
    status = "DISPONIBLE 🎯";
    statusColor = "#3B82F6"; // Blue
  }

  // Format points display
  const formatPoints = (points: number | undefined): string => {
    if (!points) return '0';
    return points.toLocaleString();
  };

  // Get badge image based on badge name (as per specification)
  const getBadgeImage = (badgeName: string | undefined): any => {
    if (!badgeName) return null;
    
    const badgeImages = {
      'BOTOSI': require('../../../assets/badge/Badge-Botosi.png'),
      'ELENGI': require('../../../assets/badge/Badge-Elengi.png'),
      'MAKASI': require('../../../assets/badge/Badge-Makasi.png'),
      'MOLENDE': require('../../../assets/badge/Badge-Molende.png'),
      'MOPAO': require('../../../assets/badge/Badge-MOPAO.png'),
      'MOTO': require('../../../assets/badge/Badge-MOTO.png'),
      'MPIKO': require('../../../assets/badge/Badge-Mpiko.png'),
      'NZURI': require('../../../assets/badge/Badge-Nzuri.png'),
      'SAFI': require('../../../assets/badge/Badge-Safi.png'),
      'SAWA': require('../../../assets/badge/Badge-SAWA.png'),
    };
    
    return badgeImages[badgeName?.toUpperCase() as keyof typeof badgeImages] || null;
  };

  // Calculate progress percentage for the progress bar (based on points earned vs points needed)
  const badgeProgressPercentage = progressPercentage;
  // Calculate global progress percentage with safety checks
  const globalProgressPercentage = totalBadges > 0 
    ? Math.min((unlockedBadges / totalBadges) * 100, 100)
    : 0;
  
  // Ensure we have valid values for display
  const displayUnlockedBadges = Math.max(0, unlockedBadges);
  const displayTotalBadges = Math.max(1, totalBadges); // At least 1 to avoid division by zero
  const displayGlobalProgress = totalBadges > 0 
    ? Math.min((displayUnlockedBadges / displayTotalBadges) * 100, 100)
    : 0;

  // Debug logging to show expected data structure (BadgeProgressWidget)
  React.useEffect(() => {
    // Data structure logged for debugging
  }, [badgesData]);

  const handlePress = () => {
    const requiresRenewal = subscriptionData?.requiresRenewal || false;

    if (requiresRenewal && onSubscriptionRenew) {
      onSubscriptionRenew();
      return;
    }

    onPress?.();
  };

  /** CTA « Voir les défis » : ouvrir l’onglet Réalisations (le parent passe onTabPress('achievements')). */
  const handleChallengesPress = () => {
    onPress?.();
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Points Display - Top Right (Absolute Positioned) */}
      <View style={styles.pointsContainer}>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{formatPoints(userPoints)}pts</Text>
        </View>
      </View>

      {/* Current Badge Information */}
      <View style={styles.badgeInfo}>
        <View style={styles.badgeIconContainer}>
          {currentBadge && getBadgeImage(currentBadge) ? (
            <Image 
              source={getBadgeImage(currentBadge)} 
              style={styles.badgeImage}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="ribbon" size={24} color="#8B5CF6" />
          )}
        </View>
        <View style={styles.badgeTextContainer}>
          <Text style={styles.badgeLabel}>Mon badge actuel :</Text>
          <View style={styles.badgeNameContainer}>
            <Text style={styles.badgeName}>
              {currentBadge ? currentBadge.toUpperCase() : 'AUCUN'}
            </Text>
            {currentBadge && (
              <View style={[styles.levelBadge, { backgroundColor: statusColor === "#FFD600" ? "#FFF3CD" : statusColor === "#10B981" ? "#D1FAE5" : "#DBEAFE", borderColor: statusColor }]}>
                <Text style={[styles.levelText, { color: statusColor }]}>{status}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Points Confirmation */}
      <View style={styles.medalInfo}>
        <Ionicons name="medal" size={20} color="#FFD700" />
        <Text style={styles.medalText}>
          Vous avez <Text style={styles.medalPoints}>{formatPoints(userPoints)} Points</Text>
        </Text>
      </View>

      {/* Progress to Next Badge Level */}
      <View style={styles.nextLevelContainer}>
        <Text style={styles.nextLevelText}>
          {maxPointsForCurrentBadge !== null && pointsEarnedForCurrentBadge !== null ? (
            // Show "X of Y points" format when maxPoints is available
            <>
              <Text style={styles.nextLevelPoints}>{formatPoints(pointsEarnedForCurrentBadge)}</Text> / <Text style={styles.nextLevelPoints}>{formatPoints(maxPointsForCurrentBadge)}</Text> points pour completer le badge <Text style={styles.nextLevelBadge}>{currentBadge ? currentBadge.toUpperCase() : 'SUIVANT'}</Text>
            </>
          ) : (
            // Fallback to "Plus que X points" format
            <>
              Plus que <Text style={styles.nextLevelPoints}>{formatPoints(pointsNeededForNext)}pts</Text> pour completer le badge <Text style={styles.nextLevelBadge}>{currentBadge ? currentBadge.toUpperCase() : 'SUIVANT'}</Text>
            </>
          )}
        </Text>
      </View>

      {/* Global Badge Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${displayGlobalProgress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {displayUnlockedBadges} badges débloqués sur {displayTotalBadges} ({displayGlobalProgress.toFixed(1)}% global)
        </Text>
      </View>

      {/* Voir les défis Button */}
      <TouchableOpacity 
        style={styles.challengesButton}
        onPress={handleChallengesPress}
        activeOpacity={0.7}
      >
        <Text style={styles.challengesButtonText}>Voir les défis</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  pointsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  pointsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  badgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeImage: {
    width: 56,
    height: 56,
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeLabel: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  badgeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  levelBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  levelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  medalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medalText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  medalPoints: {
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  nextLevelContainer: {
    marginBottom: 16,
  },
  nextLevelText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  nextLevelPoints: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  nextLevelBadge: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  challengesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  challengesButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default AchievementsCard;
