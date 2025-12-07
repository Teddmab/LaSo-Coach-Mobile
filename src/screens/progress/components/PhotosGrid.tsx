import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { ProgressPhoto } from '../types';
import { formatDate } from '../utils/progressUtils';

const { width } = Dimensions.get('window');

interface PhotosGridProps {
  photos: ProgressPhoto[];
  getPhotoUrl: (photo: ProgressPhoto) => string | null;
  onAddPhoto: () => void;
  onDeletePhoto: (photoId: string) => void;
}

const PhotosGrid: React.FC<PhotosGridProps> = ({
  photos,
  getPhotoUrl,
  onAddPhoto,
  onDeletePhoto,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos de progression</Text>
      <Text style={styles.subtitle}>
        Suivez visuellement votre transformation avec des photos de progression.
      </Text>
      
      <View style={styles.grid}>
        {/* Photo Cards - Affichées en premier */}
        {photos.map((photo) => {
          const photoUrl = getPhotoUrl(photo);
          
          if (!photoUrl) {
            return null;
          }
          
          return (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: photoUrl }} style={styles.photoImage} resizeMode="cover" />
              <View style={styles.overlay}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => photo.id && onDeletePhoto(photo.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.info}>
                <View style={styles.infoHeader}>
                  <Text style={styles.date}>
                    {formatDate(photo.date || photo.createdAt)}
                  </Text>
                  {photo.weight && (
                    <View style={styles.weightBadge}>
                      <Ionicons name="scale-outline" size={14} color="#FFFFFF" style={styles.weightIcon} />
                      <Text style={styles.weightText}>{photo.weight} kg</Text>
                    </View>
                  )}
                </View>
                {photo.notes && (
                  <Text style={styles.notes} numberOfLines={2}>
                    {photo.notes}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {/* Add Photo Button - À la fin */}
        <TouchableOpacity style={styles.addButton} onPress={onAddPhoto} activeOpacity={0.7}>
          <View style={styles.addContainer}>
            <Ionicons name="add" size={40} color="#9CA3AF" />
            <Text style={styles.addText}>Ajouter une photo</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  addButton: {
    width: (width - 72 - 10) / 2, // Largeur: (écran - marges - padding - gap) / 2
    aspectRatio: 1, // Carré
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  addText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  photoCard: {
    width: (width - 72 - 10) / 2, // Largeur: (écran - marges - padding - gap) / 2
    aspectRatio: 1, // Carré pour un affichage uniforme
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 10,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  weightIcon: {
    marginRight: 2,
  },
  weightText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  notes: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 16,
    marginTop: 2,
  },
});

export default PhotosGrid;

