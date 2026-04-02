import React from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[styles.container, { paddingBottom: insets.bottom, height: '85%', maxHeight: '85%' }]}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Créer une publication</Text>
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
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 400,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#1877F2',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#050505',
  },
  publishButton: {
    backgroundColor: '#1877F2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: '#E4E6EB',
    opacity: 0.6,
  },
  publishText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
  },
  textInput: {
    fontSize: 16,
    color: '#050505',
    minHeight: 120,
    marginBottom: 16,
    lineHeight: 22,
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 6,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E4E6EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: '#F0F2F5',
  },
  addImageText: {
    fontSize: 15,
    color: '#1877F2',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default CreatePostModal;

