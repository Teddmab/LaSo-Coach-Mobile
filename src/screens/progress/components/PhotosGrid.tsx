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
        {/* Add Photo Button */}
        <TouchableOpacity style={styles.addButton} onPress={onAddPhoto}>
          <View style={styles.addContainer}>
            <Ionicons name="add" size={48} color="#9CA3AF" />
            <Text style={styles.addText}>Ajouter une photo</Text>
          </View>
        </TouchableOpacity>

        {/* Photo Cards */}
        {photos.map((photo) => {
          const photoUrl = getPhotoUrl(photo);
          if (!photoUrl) return null;
          
          return (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: photoUrl }} style={styles.photoImage} resizeMode="cover" />
              <View style={styles.overlay}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => photo.id && onDeletePhoto(photo.id)}
                >
                  <Ionicons name="trash" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.info}>
                <Text style={styles.date}>
                  {formatDate(photo.date || photo.createdAt)}
                </Text>
                {photo.weight && (
                  <View style={styles.weightBadge}>
                    <Text style={styles.weightText}>{photo.weight} kg</Text>
                  </View>
                )}
                {photo.notes && (
                  <Text style={styles.notes} numberOfLines={2}>
                    {photo.notes}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
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
    gap: 16,
  },
  addButton: {
    width: (width - 72) / 2,
    height: 192,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  photoCard: {
    width: (width - 72) / 2,
    height: 192,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    position: 'relative',
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderRadius: 16,
    padding: 8,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  date: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  weightBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  weightText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notes: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

export default PhotosGrid;

