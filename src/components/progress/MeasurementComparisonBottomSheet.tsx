import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { Measurement, InitialMeasurement } from '../../screens/progress/types';

interface MeasurementComparisonBottomSheetProps {
  visible: boolean;
  firstMeasurement: any;
  selectedMeasurement: Measurement;
  onClose: () => void;
  getPhotoUrl?: (photo: any) => string | null;
  initialProgressPhoto?: any; // Photo initiale pour fallback
}

const MeasurementComparisonBottomSheet: React.FC<MeasurementComparisonBottomSheetProps> = ({
  visible,
  firstMeasurement,
  selectedMeasurement,
  onClose,
  getPhotoUrl,
  initialProgressPhoto,
}) => {
  const insets = useSafeAreaInsets();

  // Calculate differences
  // Si c'est la même mesure (mesure initiale cliquée), les différences sont nulles
  const isSameMeasurement = firstMeasurement.id === selectedMeasurement.id ||
    (firstMeasurement.isInitial && selectedMeasurement.isInitial);

  // Vérifier si c'est la mesure initiale seule (pas de comparaison) — declared early to avoid TDZ
  const isInitialOnly = isSameMeasurement && firstMeasurement.isInitial;
  
  const weightDiff = isSameMeasurement ? 0 : 
    (selectedMeasurement.weight && firstMeasurement.weight
      ? selectedMeasurement.weight - firstMeasurement.weight
      : null);

  const waistDiff = isSameMeasurement ? 0 :
    (selectedMeasurement.waistSize && firstMeasurement.waistSize
      ? selectedMeasurement.waistSize - firstMeasurement.waistSize
      : null);

  // Calculate days between measurements
  const firstDate = firstMeasurement.date || firstMeasurement.createdAt;
  const selectedDate = selectedMeasurement.createdAt;
  const daysBetween = isSameMeasurement ? 0 : Math.floor(
    (new Date(selectedDate).getTime() - new Date(firstDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const formatDiff = (diff: number | null, unit: string) => {
    if (diff === null) return null;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)} ${unit}`;
  };

  const getDiffIcon = (diff: number | null) => {
    if (diff === null) return <Ionicons name="remove" size={20} color="#9CA3AF" />;
    if (diff > 0) return <Ionicons name="trending-up" size={20} color="#EF4444" />;
    if (diff < 0) return <Ionicons name="trending-down" size={20} color="#10B981" />;
    return <Ionicons name="remove" size={20} color="#9CA3AF" />;
  };

  const getDiffColor = (diff: number | null) => {
    if (diff === null) return '#4B5563';
    if (diff > 0) return '#EF4444';
    if (diff < 0) return '#10B981';
    return '#4B5563';
  };

  // Get photo URLs
  // Pour la mesure initiale, essayer plusieurs sources comme dans la version web
  let firstPhotoUrl = firstMeasurement.photoUrl || 
    (firstMeasurement as any).url || 
    (firstMeasurement as any).imageUrl;
  
  // Si c'est la mesure initiale seule, utiliser aussi selectedMeasurement.photoUrl comme source
  if (isInitialOnly) {
    firstPhotoUrl = firstPhotoUrl || 
      selectedMeasurement.photoUrl || 
      (selectedMeasurement as any).url || 
      (selectedMeasurement as any).imageUrl;
  }
  
  // Si pas d'URL trouvée et que c'est la mesure initiale, utiliser initialProgressPhoto
  // Cette vérification doit être faite APRÈS avoir vérifié selectedMeasurement pour isInitialOnly
  if (!firstPhotoUrl && (firstMeasurement.isInitial || isInitialOnly) && initialProgressPhoto) {
    const photoFromInitial = initialProgressPhoto.url || 
      initialProgressPhoto.photoUrl || 
      initialProgressPhoto.imageUrl ||
      (getPhotoUrl ? getPhotoUrl(initialProgressPhoto) : null);
    if (photoFromInitial) {
      firstPhotoUrl = photoFromInitial;
    }
  }
  
  // Fallback avec getPhotoUrl si photoId existe
  if (!firstPhotoUrl && getPhotoUrl) {
    if ((firstMeasurement as any).photoId) {
      firstPhotoUrl = getPhotoUrl({ id: (firstMeasurement as any).photoId, url: null, imageUrl: null });
    } else if (isInitialOnly && (selectedMeasurement as any).photoId) {
      firstPhotoUrl = getPhotoUrl({ id: (selectedMeasurement as any).photoId, url: null, imageUrl: null });
    }
  }
  
  // Debug log pour vérifier la photo
  if (isInitialOnly) {
    console.log('[MeasurementComparison] 📸 Initial only mode:', {
      firstPhotoUrl,
      firstMeasurementPhotoUrl: firstMeasurement.photoUrl,
      selectedPhotoUrl: selectedMeasurement.photoUrl,
      initialProgressPhoto: initialProgressPhoto ? {
        url: initialProgressPhoto.url,
        photoUrl: initialProgressPhoto.photoUrl,
        imageUrl: initialProgressPhoto.imageUrl
      } : null
    });
  }
  
  const selectedPhotoUrl = selectedMeasurement.photoUrl || 
    (selectedMeasurement as any).url || 
    (getPhotoUrl && (selectedMeasurement as any).photoId ? getPhotoUrl({ id: (selectedMeasurement as any).photoId }) : null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isInitialOnly ? 'Mesure initiale' : 'Comparaison de mesures'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Message spécial pour la mesure initiale */}
            {isInitialOnly && (
              <View style={styles.initialMessageBox}>
                <Ionicons name="flag" size={32} color={theme.colors.primary} />
                <Text style={styles.initialMessageTitle}>C'est ici que tout a commencé !</Text>
                <Text style={styles.initialMessageText}>
                  Cette mesure représente votre point de départ. Utilisez-la comme référence pour suivre votre progression.
                </Text>
              </View>
            )}
            
            {/* Time difference badge - seulement si ce n'est pas la mesure initiale seule */}
            {!isInitialOnly && (
              <View style={styles.timeBadge}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.timeBadgeText}>
                  {daysBetween} jour{daysBetween > 1 ? 's' : ''} d'écart
                </Text>
              </View>
            )}

            {/* Comparison Grid */}
            <View style={styles.comparisonGrid}>
              {/* First Measurement */}
              <View style={styles.measurementCard}>
                <View style={styles.measurementHeader}>
                  <Text style={styles.measurementTitle}>
                    {isInitialOnly ? 'Votre mesure initiale' : 'Mesure initiale'}
                  </Text>
                  <Text style={styles.measurementDate}>{formatDate(firstDate)}</Text>
                </View>

                {/* Photo */}
                <View style={styles.photoContainer}>
                  {firstPhotoUrl ? (
                    <Image
                      source={{ uri: firstPhotoUrl }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
                      <Text style={styles.photoPlaceholderText}>Aucune photo</Text>
                    </View>
                  )}
                </View>

                {/* Measurements */}
                <View style={styles.measurementsBox}>
                  <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Poids</Text>
                    <Text style={styles.measurementValue}>
                      {firstMeasurement.weight ? `${firstMeasurement.weight} kg` : 'Non mesuré'}
                    </Text>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Tour de taille</Text>
                    <Text style={styles.measurementValue}>
                      {firstMeasurement.waistSize ? `${firstMeasurement.waistSize} cm` : 'Non mesuré'}
                    </Text>
                  </View>
                </View>

                {/* Notes */}
                {firstMeasurement.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notes</Text>
                    <Text style={styles.notesText}>{firstMeasurement.notes}</Text>
                  </View>
                )}
              </View>

              {/* Selected Measurement - seulement si ce n'est pas la mesure initiale seule */}
              {!isInitialOnly && (
                <View style={styles.measurementCard}>
                <View style={styles.measurementHeader}>
                  <Text style={styles.measurementTitle}>Mesure sélectionnée</Text>
                  <Text style={styles.measurementDate}>{formatDate(selectedDate)}</Text>
                </View>

                {/* Photo */}
                <View style={[styles.photoContainer, styles.selectedPhotoContainer]}>
                  {selectedPhotoUrl ? (
                    <Image
                      source={{ uri: selectedPhotoUrl }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
                      <Text style={styles.photoPlaceholderText}>Aucune photo</Text>
                    </View>
                  )}
                </View>

                {/* Measurements with differences */}
                <View style={[styles.measurementsBox, styles.selectedMeasurementsBox]}>
                  <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Poids</Text>
                    <View style={styles.measurementValueRow}>
                      <Text style={styles.measurementValue}>
                        {selectedMeasurement.weight ? `${selectedMeasurement.weight} kg` : 'Non mesuré'}
                      </Text>
                      {weightDiff !== null && (
                        <View style={styles.diffContainer}>
                          {getDiffIcon(weightDiff)}
                          <Text style={[styles.diffText, { color: getDiffColor(weightDiff) }]}>
                            {formatDiff(weightDiff, 'kg')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.measurementRow}>
                    <Text style={styles.measurementLabel}>Tour de taille</Text>
                    <View style={styles.measurementValueRow}>
                      <Text style={styles.measurementValue}>
                        {selectedMeasurement.waistSize ? `${selectedMeasurement.waistSize} cm` : 'Non mesuré'}
                      </Text>
                      {waistDiff !== null && (
                        <View style={styles.diffContainer}>
                          {getDiffIcon(waistDiff)}
                          <Text style={[styles.diffText, { color: getDiffColor(waistDiff) }]}>
                            {formatDiff(waistDiff, 'cm')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Notes */}
                {selectedMeasurement.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notes</Text>
                    <Text style={styles.notesText}>{selectedMeasurement.notes}</Text>
                  </View>
                )}
                </View>
              )}
            </View>

            {/* Progress Summary - seulement si ce n'est pas la mesure initiale seule */}
            {!isInitialOnly && (weightDiff !== null || waistDiff !== null) && (
              <View style={styles.summaryBox}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="trending-down" size={24} color="#FFFFFF" />
                  <Text style={styles.summaryTitle}>Résumé de vos progrès</Text>
                </View>
                <View style={styles.summaryGrid}>
                  {weightDiff !== null && (
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Variation de poids</Text>
                      <Text style={styles.summaryValue}>{formatDiff(weightDiff, 'kg')}</Text>
                      {weightDiff < 0 && (
                        <Text style={styles.summaryMessage}>🎉 Excellente progression !</Text>
                      )}
                    </View>
                  )}
                  {waistDiff !== null && (
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Variation tour de taille</Text>
                      <Text style={styles.summaryValue}>{formatDiff(waistDiff, 'cm')}</Text>
                      {waistDiff < 0 && (
                        <Text style={styles.summaryMessage}>🎉 Continue comme ça !</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeButtonFooter}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '70%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
  },
  timeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  comparisonGrid: {
    gap: 20,
    marginBottom: 20,
  },
  measurementCard: {
    gap: 16,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  measurementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  measurementDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedPhotoContainer: {
    borderColor: '#10B981',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  measurementsBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  selectedMeasurementsBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  measurementValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  diffText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#78350F',
  },
  summaryBox: {
    backgroundColor: theme.colors.primary,
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryGrid: {
    gap: 12,
  },
  summaryItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryMessage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButtonFooter: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  initialMessageBox: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  initialMessageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  initialMessageText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MeasurementComparisonBottomSheet;

