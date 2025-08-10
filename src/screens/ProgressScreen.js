import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import BlurOverlay from '../components/BlurOverlay';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';

const { width } = Dimensions.get('window');

const ProgressScreen = ({ user, onLogout, onTabPress, activeTab, onSubscriptionRenew }) => {
  const [activeToggle, setActiveToggle] = useState('measures');
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhotoWeight, setNewPhotoWeight] = useState('');
  const [newPhotoNotes, setNewPhotoNotes] = useState('');
  const [progressPhotos, setProgressPhotos] = useState([
    // Sample photo data
    {
      id: 1,
      date: '29/06/2025',
      weight: '70kg',
      notes: 'Photo de départ',
      image: 'https://via.placeholder.com/150x200/4CAF50/FFFFFF?text=Avant'
    }
  ]);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      console.log('💳 Progress: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
      
      if (data.requiresRenewal) {
        setShowBlurOverlay(true);
      }
      
    } catch (error) {
      console.error('❌ Progress: Error checking subscription status:', error);
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
    console.log('🔄 Progress: Navigating to subscription renewal page');
    setShowBlurOverlay(false);
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  const handleAddPhoto = () => {
    // In a real app, you would handle image picking here
    const newPhoto = {
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR'),
      weight: newPhotoWeight || 'Non spécifié',
      notes: newPhotoNotes || 'Aucune note',
      image: 'https://via.placeholder.com/150x200/2196F3/FFFFFF?text=Nouvelle'
    };
    
    setProgressPhotos([...progressPhotos, newPhoto]);
    setNewPhotoWeight('');
    setNewPhotoNotes('');
    setShowAddPhotoModal(false);
    Alert.alert('Succès', 'Photo ajoutée avec succès!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progression</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text.primary} />
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
        {/* Toggle Tabs */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleTab, activeToggle === 'measures' && styles.activeToggleTab]}
            onPress={() => setActiveToggle('measures')}
          >
            <Ionicons name="analytics-outline" size={20} color={activeToggle === 'measures' ? theme.colors.primary : theme.colors.text.secondary} />
            <Text style={[styles.toggleText, activeToggle === 'measures' && styles.activeToggleText]}>
              Mesures & Statistiques
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toggleTab, activeToggle === 'photos' && styles.activeToggleTab]}
            onPress={() => setActiveToggle('photos')}
          >
            <Ionicons name="camera-outline" size={20} color={activeToggle === 'photos' ? theme.colors.primary : theme.colors.text.secondary} />
            <Text style={[styles.toggleText, activeToggle === 'photos' && styles.activeToggleText]}>
              Photos de progression
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weight & Stats Section - Always visible */}
        <View style={styles.statsSection}>
          <View style={styles.weightCard}>
            <View style={styles.weightInfo}>
              <Text style={styles.weightLabel}>Poids Initial</Text>
              <Text style={styles.weightValue}>70</Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>
            
            <View style={styles.currentWeight}>
              <Text style={styles.weightLabel}>Poids Actuel</Text>
              <Text style={styles.currentWeightValue}>67</Text>
              <Text style={styles.currentWeightUnit}>kg · kg</Text>
            </View>
            
            <View style={styles.targetWeight}>
              <Text style={styles.weightLabel}>Objectif Poids</Text>
              <Text style={styles.targetWeightValue}>60kg</Text>
            </View>
          </View>

          <View style={styles.achievementStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Défis complétés</Text>
              <Text style={styles.statValue}>0/125</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Badges collectés</Text>
              <Text style={styles.statValue}>0/100</Text>
            </View>
          </View>
        </View>

        {activeToggle === 'measures' ? (
          <>
            {/* Chart Section */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Historique des mesures</Text>
              <Text style={styles.chartSubtitle}>Mesures initiales: 70 kg, 80 cm (le 29/06/2025)</Text>
              
              {/* Simple Chart Placeholder */}
              <View style={styles.chartContainer}>
                <View style={styles.chartBackground}>
                  {/* Y-axis labels */}
                  <View style={styles.yAxisLabels}>
                    <Text style={styles.axisLabel}>80</Text>
                    <Text style={styles.axisLabel}>60</Text>
                    <Text style={styles.axisLabel}>40</Text>
                    <Text style={styles.axisLabel}>20</Text>
                    <Text style={styles.axisLabel}>0</Text>
                  </View>
                  
                  {/* Chart area */}
                  <View style={styles.chartArea}>
                    {/* Grid lines */}
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                    
                    {/* Sample data points */}
                    <View style={[styles.dataPoint, { backgroundColor: '#4CAF50', top: 60, left: 20 }]} />
                    <View style={[styles.dataPoint, { backgroundColor: '#4CAF50', top: 65, left: 80 }]} />
                    <View style={[styles.dataPoint, { backgroundColor: '#4CAF50', top: 70, left: 140 }]} />
                    <View style={[styles.dataPoint, { backgroundColor: '#2196F3', top: 50, left: 20 }]} />
                    <View style={[styles.dataPoint, { backgroundColor: '#2196F3', top: 55, left: 80 }]} />
                    <View style={[styles.dataPoint, { backgroundColor: '#2196F3', top: 60, left: 140 }]} />
                  </View>
                  
                  {/* Right Y-axis */}
                  <View style={styles.rightYAxisLabels}>
                    <Text style={styles.axisLabel}>100</Text>
                    <Text style={styles.axisLabel}>75</Text>
                    <Text style={styles.axisLabel}>50</Text>
                    <Text style={styles.axisLabel}>25</Text>
                    <Text style={styles.axisLabel}>0</Text>
                  </View>
                </View>
                
                {/* Legend */}
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.legendText}>Poids (kg)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.legendText}>Tour de taille (cm)</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Current Phase Section */}
            <View style={styles.phaseSection}>
              <Text style={styles.phaseLabel}>Phase en cours :</Text>
              <Text style={styles.phaseTitle}>TEST</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
              <Text style={styles.daysRemaining}>Jours restants : 2</Text>
            </View>

            {/* T.A.S.C.C Progression */}
            <View style={styles.tasccSection}>
              <Text style={styles.tasccTitle}>Progression T.A.S.C.C</Text>
              <View style={styles.tasccSteps}>
                <View style={styles.tasccStep}>
                  <View style={[styles.stepDot, styles.activeStepDot]} />
                  <Text style={styles.stepLabel}>Test</Text>
                </View>
                <View style={styles.tasccStep}>
                  <View style={styles.stepDot} />
                  <Text style={styles.stepLabel}>Attaque</Text>
                </View>
                <View style={styles.tasccStep}>
                  <View style={styles.stepDot} />
                  <Text style={styles.stepLabel}>Stabilisation</Text>
                </View>
                <View style={styles.tasccStep}>
                  <View style={styles.stepDot} />
                  <Text style={styles.stepLabel}>Consolidation</Text>
                </View>
                <View style={styles.tasccStep}>
                  <View style={styles.stepDot} />
                  <Text style={styles.stepLabel}>Confirmation</Text>
                </View>
              </View>
            </View>

            {/* Points Section */}
            <View style={styles.pointsSection}>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>1300pts</Text>
              </View>
              
              <View style={styles.energyBar}>
                <View style={styles.energyIcon}>
                  <Text>⚡</Text>
                </View>
                <View style={styles.energyProgress}>
                  <View style={styles.energyFill} />
                </View>
                <View style={styles.mpikoIcon}>
                  <Text>🏆</Text>
                </View>
              </View>
              
              <Text style={styles.pointsTitle}>Vous avez 1300 Points</Text>
              <Text style={styles.pointsSubtitle}>Niveau : 1 | Streak actuel : 0 jours</Text>
              
              <TouchableOpacity style={styles.challengesButton}>
                <Text style={styles.challengesButtonText}>Voir les défis</Text>
              </TouchableOpacity>
            </View>

            {/* Next Action */}
            <View style={styles.nextActionSection}>
              <View style={styles.nextActionCard}>
                <View style={styles.nextActionIcon}>
                  <Text style={styles.nextActionEmoji}>🥗</Text>
                </View>
                <View style={styles.nextActionContent}>
                  <Text style={styles.nextActionTitle}>Prochaine action</Text>
                  <Text style={styles.nextActionDescription}>Plus que 2 Repas pour passer à la Phase Attaque</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          /* Photos Section */
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Photos de progression</Text>
            <Text style={styles.chartSubtitle}>Suivez visuellement votre transformation avec des photos de progression.</Text>
            
            {/* Add Photo Button */}
            <TouchableOpacity 
              style={styles.addPhotoButton}
              onPress={() => setShowAddPhotoModal(true)}
            >
              <View style={styles.addPhotoContainer}>
                <View style={styles.addPhotoIcon}>
                  <Ionicons name="add" size={40} color="#999" />
                </View>
                <Text style={styles.addPhotoText}>Ajouter une photo</Text>
              </View>
            </TouchableOpacity>

            {/* Photos Grid */}
            <View style={styles.photosGrid}>
              {progressPhotos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image source={{ uri: photo.image }} style={styles.photoImage} />
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoDate}>{photo.date}</Text>
                    <Text style={styles.photoWeight}>{photo.weight}</Text>
                    <Text style={styles.photoNotes}>{photo.notes}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
          <Ionicons name="home" size={24} color={activeTab === 'home' ? theme.colors.primary : theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navTab, styles.activeNavTab]} onPress={() => onTabPress('progress')}>
          <Ionicons name="trending-up-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
          <Ionicons name="restaurant" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeToggleTab: {
    backgroundColor: theme.colors.primaryLight,
  },
  toggleText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  activeToggleText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weightCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  weightInfo: {
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  weightUnit: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  currentWeight: {
    alignItems: 'center',
  },
  currentWeightValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  currentWeightUnit: {
    fontSize: 14,
    color: '#4CAF50',
  },
  targetWeight: {
    alignItems: 'center',
  },
  targetWeightValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  achievementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  chartSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  chartContainer: {
    height: 200,
  },
  chartBackground: {
    flex: 1,
    flexDirection: 'row',
  },
  yAxisLabels: {
    width: 30,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rightYAxisLabels: {
    width: 30,
    justifyContent: 'space-between',
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  axisLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    margin: 10,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  phaseSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  phaseLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '85%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  daysRemaining: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  tasccSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tasccTitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  tasccSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasccStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  activeStepDot: {
    backgroundColor: '#4CAF50',
  },
  stepLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  pointsSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pointsBadge: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  energyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  energyIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyProgress: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    width: '60%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  mpikoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  pointsSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  challengesButton: {
    backgroundColor: '#E1BEE7',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  challengesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B1FA2',
  },
  nextActionSection: {
    margin: 20,
    marginTop: 0,
  },
  nextActionCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  nextActionEmoji: {
    fontSize: 24,
  },
  nextActionContent: {
    flex: 1,
  },
  nextActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  nextActionDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  photosSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  photoSelector: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  photoSelectorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  photoSelectorPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  photoCard: {
    width: '48%', // Two photos per row
    aspectRatio: 1.2, // Adjust as needed for photo aspect
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  photoDate: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  photoWeight: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  photoNotes: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  addPhotoButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  addPhotoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#757575',
    marginTop: 8,
  },
});

export default ProgressScreen; 