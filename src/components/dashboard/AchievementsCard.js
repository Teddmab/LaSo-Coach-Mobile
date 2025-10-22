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

const AchievementsCard = ({ 
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
  const pointsNeededForNext = badgesData?.pointsNeededForNext || 0;
  const unlockedBadges = badgesData?.unlockedBadges || 0;
  const totalBadges = badgesData?.totalBadges || 10;
  const progressPercentage = badgesData?.progressPercentage || 0;
  
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
  const formatPoints = (points) => {
    return points.toLocaleString();
  };

  // Get badge image based on badge name (as per specification)
  const getBadgeImage = (badgeName) => {
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
    
    return badgeImages[badgeName.toUpperCase()] || null;
  };

  // Calculate progress percentage for the progress bar (based on points earned vs points needed)
  const badgeProgressPercentage = progressPercentage;
  const globalProgressPercentage = (unlockedBadges / totalBadges) * 100;

  // Debug logging to show expected data structure (BadgeProgressWidget)
  React.useEffect(() => {
    console.log('🏆 AchievementsCard - BadgeProgressWidget Expected Structure:');
    console.log('📊 Current badgesData:', badgesData);
    console.log('📊 Expected API Response Structure:', {
      'badgeProgress.currentBadge.name': 'string (e.g., "BOTOSI", "ELENGI", "MPIKO", etc.)',
      'badgeProgress.currentBadge.description': 'string (badge description)',
      'badgeProgress.currentBadge.level': 'number (e.g., 1, 2, 3)',
      'badgeProgress.nextBadge.pointsNeeded': 'number (e.g., 0, 50, 100)',
      'badgeProgress.unlockedBadges': 'number (e.g., 0, 1, 2)',
      'badgeProgress.totalBadges': 'number (e.g., 10)',
      'tasccProgress.totalPoints': 'number (e.g., 11277)'
    });
    console.log('📊 Available badge names:', [
      'BOTOSI', 'ELENGI', 'ENERGIE', 'MAKASI', 'MOLENDE', 
      'MOPAO', 'MOTO', 'MPIKO', 'NZURI', 'SAFI', 'SAWA'
    ]);
    console.log('📊 Current values:', {
      userPoints,
      currentBadge,
      currentBadgeDescription,
      currentBadgeLevel,
      pointsNeededForNext,
      unlockedBadges,
      totalBadges,
      badgeProgressPercentage,
      globalProgressPercentage
    });
  }, [badgesData]);

  const handlePress = () => {
    // Check subscription status before proceeding
    const requiresRenewal = subscriptionData?.requiresRenewal || false;
    
    if (requiresRenewal && onSubscriptionRenew) {
      console.log('💳 Achievements card blocked - subscription renewal required');
      onSubscriptionRenew();
      return;
    }
    
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Points Display - Top Left */}
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
          Plus que <Text style={styles.nextLevelPoints}>{formatPoints(pointsNeededForNext)}pts</Text> pour le niveau du badge <Text style={styles.nextLevelBadge}>{currentBadge ? currentBadge.toUpperCase() : 'SUIVANT'}</Text>
        </Text>
      </View>

      {/* Global Badge Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${globalProgressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {unlockedBadges} badges débloqués sur {totalBadges} ({globalProgressPercentage.toFixed(1)}% global)
        </Text>
      </View>

      {/* Voir les défis Button */}
      <TouchableOpacity 
        style={styles.challengesButton}
        onPress={handlePress}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pointsContainer: {
    marginBottom: 16,
  },
  pointsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignSelf: 'flex-start',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeImage: {
    width: 32,
    height: 32,
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
