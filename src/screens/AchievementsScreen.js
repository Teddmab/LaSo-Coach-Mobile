import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import BlurOverlay from '../components/BlurOverlay';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';

const AchievementsScreen = ({ user, onLogout, onTabPress, activeTab, onSubscriptionRenew }) => {
  const [selectedTab, setSelectedTab] = useState('pending'); // pending, my, completed
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      console.log('💳 Achievements: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
      
      if (data.requiresRenewal) {
        setShowBlurOverlay(true);
      }
      
    } catch (error) {
      console.error('❌ Achievements: Error checking subscription status:', error);
      // Default to expired status on error
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true
      });
      setShowBlurOverlay(true);
    }
  };

  const handleSubscriptionRenew = () => {
    console.log('🔄 Achievements: Navigating to subscription renewal page');
    setShowBlurOverlay(false);
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  const badges = [
    {
      id: 'elengi',
      name: 'Elengi',
      level: 3,
      points: 3000,
      totalValue: 3000,
      levels: 3,
      isActive: true,
      description: 'Elengi, c\'est le tout premier badge de ton aventure Laso\'Coach.\nIl marque ce moment magique où tu commences à faire la paix avec ton assiette.\nTu fais des choix plus sains, tu réduis un peu le sucre, tu cuisines avec plus d\'attention. Chaque niveau d\'Elengi, c\'est un pas vers une meilleure alimentation et ça, c\'est pas juste healthy, c\'est peut-être le plus sucré des débuts.',
      levelPoints: {
        1: 200,
        2: 800,
        3: 2000
      },
      color: '#9C27B0',
      image: require('../../assets/badge/Badge-Elengi.png')
    },
    {
      id: 'mpiko',
      name: 'Mpiko',
      level: 3,
      points: 3050,
      color: '#4CAF50',
      image: require('../../assets/badge/Badge-Mpiko.png'),
      description: 'Mpiko, c\'est le badge de ta détermination.\nIl représente ces moments où tu veux abandonner, mais tu choisis d\'avancer quand même. Tu bouges, tu transpires, tu transperces le doute. Chaque niveau de Mpiko, c\'est un mur franchi, une preuve de ton courage. Et franchement, tenir bon, c\'est pas rien : c\'est fort, c\'est toi, c\'est Mpiko.',
      levelPoints: {
        1: 250,
        2: 850,
        3: 1950
      },
      totalValue: 3050,
      levels: 3
    },
    {
      id: 'botosi',
      name: 'Botosi',
      level: 3,
      points: 3000,
      color: '#9C27B0',
      image: require('../../assets/badge/Badge-Botosi.png'),
      description: 'Botosi, c\'est le calme dans le chaos.\nCe badge s\'active quand tu commences à écouter ton corps, à t\'offrir du repos, de l\'attention, à respirer. Tu n\'es pas juste en train de perdre du poids, tu gagnes en équilibre. Chaque niveau de Botosi, c\'est une meilleure version de toi, plus centrée, plus douce, plus en paix.',
      levelPoints: {
        1: 300,
        2: 900,
        3: 1800
      },
      totalValue: 3000,
      levels: 3
    },
    {
      id: 'makasi',
      name: 'Makasi',
      level: 3,
      points: 3000,
      color: '#FF7043',
      image: require('../../assets/badge/Badge-Makasi.png'),
      description: 'Makasi, c\'est la force intérieure et extérieure.\nTu commences à prendre confiance, à repousser tes limites physiques. Ce n\'est pas juste faire du sport, c\'est être plus fort dans ta tête. Chaque niveau de Makasi, c\'est un cran au-dessus. Tu portes ton propre poids, et ça se voit. T\'es plus solide. Plus puissant·e. T\'es Makasi.',
      levelPoints: {
        1: 400,
        2: 1000,
        3: 1600
      },
      totalValue: 3000,
      levels: 3
    },
    {
      id: 'safi',
      name: 'Safi',
      level: 4,
      points: 4000,
      color: '#4CAF50',
      image: require('../../assets/badge/Badge-Safi.png'),
      description: 'Safi, c\'est quand ça commence à briller de l\'intérieur.\nCe badge te suit dans cette phase où tout devient plus fluide, plus aligné. Tu manges mieux, tu vis mieux, tu inspires les autres. Chaque niveau de Safi, c\'est une montée en clarté, en confiance et en beauté. C\'est pur. C\'est net. C\'est propre. C\'est Safi.',
      levelPoints: {
        1: 500,
        2: 1200,
        3: 1800,
        4: 500
      },
      totalValue: 4000,
      levels: 4
    },
    {
      id: 'nzuri',
      name: 'Nzuri',
      level: 4,
      points: 4000,
      color: '#E91E63',
      image: require('../../assets/badge/Badge-Nzuri.png'),
      description: 'Nzuri, c\'est l\'élégance de ton chemin.\nTu ne forces plus, tu rayonnes. Ce badge arrive quand ta transformation devient visible et naturelle. Tu fais ce qu\'il faut, à ton rythme, avec intention. Chaque niveau de Nzuri, c\'est une version de toi plus fluide, plus fière, plus belle. Et franchement, c\'est agréable d\'être bien.',
      levelPoints: {
        1: 600,
        2: 1400,
        3: 2000
      },
      totalValue: 4000,
      levels: 4
    },
    {
      id: 'moto',
      name: 'MOTO',
      level: 4,
      points: 4000,
      color: '#FF7043',
      image: require('../../assets/badge/Badge-MOTO.png'),
      description: 'Moto, c\'est l\'énergie vive qui t\'habite.\nCe badge s\'active quand tu deviens le moteur de ta propre transformation. Tu inspires, tu partages, tu crées l\'élan. Chaque niveau de Moto, c\'est une nouvelle flamme allumée en toi et autour de toi. T\'es plus qu\'un·e suiveur·se, t\'es un feu qui bouge et qui brûle.',
      levelPoints: {
        1: 700,
        2: 1600,
        3: 2200,
        4: -500
      },
      totalValue: 4000,
      levels: 4
    },
    {
      id: 'molende',
      name: 'Molende',
      level: 4,
      points: 4000,
      color: '#9C27B0',
      image: require('../../assets/badge/Badge-Molende.png'),
      description: 'Molende, c\'est le flow, le rythme, la souplesse.\nTu ne suis plus un programme, tu danses avec. Ton corps devient ton allié, ton mood devient constant. Chaque niveau de Molende, c\'est de la fluidité gagnée. C\'est beau à voir. T\'avances comme si c\'était facile, même quand c\'est dur. T\'as trouvé ton groove.',
      levelPoints: {
        1: 800,
        2: 1800,
        3: 2400,
        4: -1000
      },
      totalValue: 4000,
      levels: 4
    },
    {
      id: 'sawa',
      name: 'Sawa',
      level: 5,
      points: 5000,
      color: '#4CAF50',
      image: require('../../assets/badge/Badge-SAWA.png'),
      description: 'Sawa, c\'est l\'alignement parfait.\nCe badge ne s\'ouvre qu\'à celles et ceux qui ont uni force, constance et élégance. Tu es dans ta vérité, dans ton tempo, dans ta forme. Chaque niveau de Sawa t\'emmène vers un équilibre rare. Pas extrême, pas rigide : juste ce qu\'il faut, exactement comme il faut.',
      levelPoints: {
        1: 1000,
        2: 2000,
        3: 3000,
        4: 4000,
        5: -5000
      },
      totalValue: 5000,
      levels: 5
    },
    {
      id: 'mopao',
      name: 'Mopao',
      level: 5,
      points: 25000,
      color: '#FF9800',
      image: require('../../assets/badge/Badge-MOPAO.png'),
      description: 'Mopao, c\'est l\'apothéose.\nTu ne suis plus Laso\'Coach, tu l\'incarnes. Ce badge, c\'est la récompense de ton parcours comme ton propre coach : cohérence, puissance, présence. Chaque niveau de Mopao, c\'est une couronne en plus sur ta constance. Et à ce stade… tu n\'as plus besoin de prouver, tu es la preuve vivante de tes efforts.',
      levelPoints: {
        1: 5000,
        2: 10000,
        3: 15000,
        4: 20000,
        5: -25000
      },
      totalValue: 25000,
      levels: 5
    }
  ];

  const leaderboardData = [
    {
      rank: 1,
      name: 'Teddy mabulay mabulay Mabulay',
      points: 1300,
      avatar: user?.avatar
    }
  ];

  const formatDate = () => {
    return 'Lundi, 12 Mai 2025';
  };

  const renderBadgeIcon = (badge) => {
    return (
      <View style={styles.badgeIconContainer}>
        <Image 
          source={badge.image} 
          style={styles.badgeIcon}
          resizeMode="contain"
        />
        {badge.isActive && (
          <View style={styles.activeBadgeIndicator}>
            <Text style={styles.activeBadgeText}>NIVEAU {badge.level}</Text>
          </View>
        )}
      </View>
    );
  };

  const handleBadgePress = (badge) => {
    console.log('🏆 Badge pressed:', badge.name);
    setSelectedBadge(badge);
  };

  const renderTabContent = () => {
    if (selectedTab === 'pending') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucun défi à afficher.</Text>
        </View>
      );
    }
    
    if (selectedTab === 'my') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucun défi à afficher.</Text>
        </View>
      );
    }
    
    if (selectedTab === 'completed') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucun défi à afficher.</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Défis</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>6</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => onTabPress ? onTabPress('settings') : null}>
            <Image 
              source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} 
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subscription Banner */}
      <SubscriptionBanner 
        subscriptionData={subscriptionData} 
        onRenew={handleSubscriptionRenew} 
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDate()}</Text>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.leaderboardSection}>
          <View style={styles.leaderboardHeader}>
            <Ionicons name="trophy" size={20} color="#FF9800" />
            <Text style={styles.leaderboardTitle}>Top 5 Général</Text>
            <Ionicons name="share-outline" size={20} color="#4CAF50" />
          </View>

          {leaderboardData.map((item, index) => (
            <View key={index} style={styles.leaderboardItem}>
              <Text style={styles.rank}>{item.rank}</Text>
              <Image source={{ uri: item.avatar }} style={styles.leaderboardAvatar} />
              <Text style={styles.leaderboardName}>{item.name}</Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>{item.points}pts</Text>
              </View>
            </View>
          ))}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Défis complétés</Text>
              <Text style={styles.statValue}>2/2</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Badges collectés</Text>
              <Text style={styles.statValue}>0/10</Text>
            </View>
          </View>
        </View>

        {/* Weekly Ranking */}
        <View style={styles.weeklyRanking}>
          <View style={styles.rankingHeader}>
            <Text style={styles.flagEmoji}>🇫🇷</Text>
            <Text style={styles.rankingTitle}>Cette semaine vous êtes N°-</Text>
            <Ionicons name="share-outline" size={20} color="#4CAF50" />
          </View>
          <Text style={styles.rankingSubtitle}>Vous étiez :</Text>
        </View>

        {/* Challenges Section */}
        <View style={styles.challengesSection}>
          <Text style={styles.challengesTitle}>Défis</Text>
          <Text style={styles.challengesDescription}>
            Chaque défis complété vaut des points mais surtout une grande fierté pour vous-même !
          </Text>

          {/* Challenge Tabs */}
          <View style={styles.challengeTabs}>
            <TouchableOpacity 
              style={[styles.challengeTab, selectedTab === 'pending' && styles.activeTab]}
              onPress={() => setSelectedTab('pending')}
            >
              <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
                Défis à relever
              </Text>
              <View style={[styles.tabBadge, { backgroundColor: '#FFC107' }]}>
                <Text style={styles.tabBadgeText}>0</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.challengeTab, selectedTab === 'my' && styles.activeTab]}
              onPress={() => setSelectedTab('my')}
            >
              <Text style={[styles.tabText, selectedTab === 'my' && styles.activeTabText]}>
                Mes défis
              </Text>
              <Text style={styles.tabBadgeText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.challengeTab, selectedTab === 'completed' && styles.activeTab]}
              onPress={() => setSelectedTab('completed')}
            >
              <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
                Défis complétés
              </Text>
              <Text style={styles.tabBadgeText}>2</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {renderTabContent()}
        </View>

        {/* Current Status Section - Separate Card */}
        <View style={styles.currentStatusSection}>
          <View style={styles.pointsDisplay}>
            <Text style={styles.totalPoints}>3000pts</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Ionicons name="medal" size={20} color="#FFD700" />
            <Text style={styles.statusText}>Mon badge actuel : ELENGI</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>NIVEAU 3</Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Ionicons name="medal" size={20} color="#FFD700" />
            <Text style={styles.statusText}>Vous avez 3000 Points</Text>
          </View>
          
          <Text style={styles.nextBadgeText}>
            Plus que <Text style={styles.highlightPoints}>50pts</Text> pour avoir le badge <Text style={styles.highlightBadge}>Mpiko</Text>
          </Text>
        </View>

        {/* Badges Section */}
        <View style={styles.badgesSection}>
          <Text style={styles.badgesTitle}>Badges</Text>
          
          {/* Featured Badge or Selected Badge */}
          <View style={styles.featuredBadge}>
            <View style={styles.featuredBadgeContent}>
              <View style={styles.featuredBadgeIcon}>
                <Image 
                  source={selectedBadge ? selectedBadge.image : badges[0].image} 
                  style={styles.featuredBadgeImage}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.featuredBadgeInfo}>
                <Text style={styles.featuredBadgeTitle}>Badge</Text>
                <Text style={styles.featuredBadgeName}>
                  {selectedBadge ? selectedBadge.name.toUpperCase() : 'ELENGI'}
                </Text>
                <Text style={styles.featuredBadgeValue}>
                  Valeur total : {selectedBadge ? selectedBadge.totalValue : badges[0].totalValue}pts
                </Text>
                <Text style={styles.featuredBadgeLevels}>
                  Nbre de niveaux : {selectedBadge ? selectedBadge.levels : badges[0].levels}
                </Text>
                <View style={styles.collectedBadge}>
                  <Text style={styles.collectedText}>COLLECTÉ</Text>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </View>
              </View>
            </View>
            
            <Text style={styles.badgeDescription}>
              {selectedBadge ? selectedBadge.description : badges[0].description}
            </Text>
            
            <View style={styles.levelPoints}>
              <Text style={styles.levelPointsText}>
                {Object.entries(selectedBadge ? selectedBadge.levelPoints : badges[0].levelPoints).map(([level, points], index) => (
                  <Text key={level}>
                    <Text style={[styles.levelText, { color: selectedBadge ? selectedBadge.color : badges[0].color }]}>
                      Niveau {level} : {points}pts
                    </Text>
                    {index < Object.keys(selectedBadge ? selectedBadge.levelPoints : badges[0].levelPoints).length - 1 ? '  ' : ''}
                  </Text>
                ))}
              </Text>
            </View>
          </View>

          {/* Badge Grid */}
          <View style={styles.badgeGrid}>
            {badges.map((badge) => (
              <TouchableOpacity key={badge.id} onPress={() => handleBadgePress(badge)}>
                <View style={[
                  styles.badgeItem,
                  selectedBadge?.id === badge.id && styles.selectedBadgeItem
                ]}>
                  {renderBadgeIcon(badge)}
                  <Text style={[
                    styles.badgeItemName,
                    selectedBadge?.id === badge.id && styles.selectedBadgeItemName
                  ]}>{badge.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Next Actions Section - Separate Card */}
        <View style={styles.nextActionsSection}>
          <Text style={styles.nextActionsTitle}>Prochaines actions</Text>
          
          <TouchableOpacity style={styles.nextActionItem}>
            <Text style={styles.nextActionText}>Plus que 2 Repas pour passer à la Phase Attaque</Text>
          </TouchableOpacity>
          
          <View style={styles.finalActionItem}>
            <Text style={styles.finalActionText}>Badge Mopao à obtenir après 25000pts</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
          <Ionicons name="home" size={24} color={activeTab === 'home' ? theme.colors.primary : theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('progress')}>
          <Ionicons name="trending-up-outline" size={24} color={activeTab === 'progress' ? theme.colors.primary : theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
          <Ionicons name="restaurant" size={24} color={activeTab === 'nutrition' ? theme.colors.primary : theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navTab, styles.activeNavTab]} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Badge Detail Modal */}
      {/* {renderBadgeModal()} */}

      {/* Blur Overlay for Expired Subscription */}
      <BlurOverlay
        visible={showBlurOverlay}
        onRenew={handleSubscriptionRenew}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpButton: {
    padding: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  dateHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  leaderboardSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 12,
    width: 20,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  leaderboardName: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  pointsBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  pointsText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  weeklyRanking: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  rankingTitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  rankingSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  challengesSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  challengesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  challengesDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  challengeTabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  challengeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.text.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginRight: 8,
  },
  activeTabText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  tabBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  badgesSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badgesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  featuredBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  featuredBadgeContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featuredBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadgeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  featuredBadgeGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featuredBadgeStar: {
    fontSize: 16,
  },
  featuredBadgeInfo: {
    flex: 1,
  },
  featuredBadgeTitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  featuredBadgeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  featuredBadgeValue: {
    fontSize: 14,
    color: '#9C27B0',
    marginBottom: 4,
  },
  featuredBadgeLevels: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  collectedBadge: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  collectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  levelPoints: {
    marginBottom: 16,
  },
  levelPointsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  levelText: {
    fontWeight: '600',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  badgeItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '30%', // Set width to ensure exactly 3 badges per line
    minWidth: 80,
  },
  badgeItemName: {
    fontSize: 12,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
    lineHeight: 14,
    flexWrap: 'nowrap',
  },
  badgeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  activeBadgeIndicator: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFC107',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  currentStatus: {
    marginBottom: 20,
  },
  pointsDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  totalPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: '#8BC34A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nextBadgeText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
  highlightPoints: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
  highlightBadge: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#C8E6C9',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  nextActions: {
    marginTop: 20,
  },
  nextActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  nextActionItem: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 12,
    alignItems: 'center',
  },
  nextActionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  finalActionItem: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  finalActionText: {
    fontSize: 16,
    color: '#FFC107',
    fontWeight: '600',
  },
  nextActionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeNavTab: {
    backgroundColor: theme.colors.primaryLight,
  },
  selectedBadgeItem: {
    backgroundColor: '#E0F2F7', // Light blue background for selected item
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedBadgeItemName: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  selectedBadgeCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#E0F2F7',
  },
  currentStatusSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default AchievementsScreen; 