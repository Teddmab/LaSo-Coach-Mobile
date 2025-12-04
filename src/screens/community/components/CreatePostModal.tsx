import React from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../../constants/theme';
import { SelectedImage } from '../types';

interface CreatePostModalProps {
  visible: boolean;
  postText: string;
  selectedImages: SelectedImage[];
  isPublishing: boolean;
  onPostTextChange: (text: string) => void;
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
  onPublish: () => void;
  onClose: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  postText,
  selectedImages,
  isPublishing,
  onPostTextChange,
  onAddImage,
  onRemoveImage,
  onPublish,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Créer un post</Text>
          <TouchableOpacity
            onPress={onPublish}
            disabled={isPublishing || (!postText.trim() && selectedImages.length === 0)}
            style={[
              styles.publishButton,
              (isPublishing || (!postText.trim() && selectedImages.length === 0)) && styles.publishButtonDisabled,
            ]}
          >
            {isPublishing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.publishText}>Publier</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Text Input */}
          <TextInput
            style={styles.textInput}
            placeholder="Quoi de neuf ?"
            placeholderTextColor={theme.colors.text.secondary}
            value={postText}
            onChangeText={onPostTextChange}
            multiline
            maxLength={2000}
            autoFocus
          />

          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <View style={styles.imagesContainer}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => onRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add Image Button */}
          {selectedImages.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={onAddImage}>
              <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.addImageText}>Ajouter une image</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  cancelButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  publishButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  publishButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  publishText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 100,
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 8,
  },
  addImageText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default CreatePostModal;

