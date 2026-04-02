import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AvatarCropBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (imageUri: string, asset: any) => Promise<void>;
  initialImageUri?: string | null;
}

const AvatarCropBottomSheet: React.FC<AvatarCropBottomSheetProps> = ({
  visible,
  onClose,
  onSave,
  initialImageUri,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImageUri || null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const slideAnim = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Animation: venir du haut
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // Animation: retourner vers le haut
      Animated.timing(slideAnim, {
        toValue: -SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSelectImage = async () => {
    try {
      setError('');
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission refusée. Veuillez autoriser l\'accès à votre galerie.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedImage(asset.uri);
        setSelectedAsset(asset);
      }
    } catch (error: any) {
      console.error('❌ Error selecting image:', error);
      setError('Erreur lors de la sélection de l\'image. Veuillez réessayer.');
    }
  };

  const handleSave = async () => {
    if (!selectedImage || !selectedAsset) {
      setError('Veuillez sélectionner une photo');
      return;
    }

    try {
      setError('');
      setUploading(true);
      await onSave(selectedImage, selectedAsset);
      // Le top sheet sera fermé par le parent après le succès
    } catch (error: any) {
      console.error('❌ Error saving avatar:', error);
      setError(error.message || 'Erreur lors de l\'upload. Veuillez réessayer.');
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedImage(null);
      setSelectedAsset(null);
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={handleClose}
            disabled={uploading}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={styles.backdrop}
            />
          </TouchableOpacity>
          
          {/* Top Sheet qui sort du haut avec animation */}
          <Animated.View
            style={[
              styles.container,
              { paddingTop: insets.top },
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Modifier votre photo de profil</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={uploading}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Photo Preview Area */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Photo *</Text>
                <TouchableOpacity
                  style={styles.photoSelector}
                  onPress={handleSelectImage}
                  disabled={uploading}
                >
                  {selectedImage ? (
                    <View style={styles.previewContainer}>
                      <Image
                        source={{ uri: selectedImage }}
                        style={styles.preview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.changePhotoButton}
                        onPress={handleSelectImage}
                        disabled={uploading}
                      >
                        <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.changePhotoText}>Changer la photo</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.selectorPlaceholder}>
                      <Ionicons name="camera-outline" size={48} color={theme.colors.text.secondary} />
                      <Text style={styles.selectorText}>Sélectionner une photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#F44336" />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.cancelButton, uploading && styles.buttonDisabled]}
                  onPress={handleClose}
                  disabled={uploading}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (uploading || !selectedImage) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={uploading || !selectedImage}
                >
                  <LinearGradient
                    colors={
                      uploading || !selectedImage
                        ? ['#BDBDBD', '#9E9E9E']
                        : [theme.colors.primary, theme.colors.primary]
                    }
                    style={styles.submitGradient}
                  >
                    {uploading ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.submitText}>Upload en cours...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                        <Text style={styles.submitText}>Enregistrer</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
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
    justifyContent: 'flex-start',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    height: '85%',
    minHeight: 500,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  photoSelector: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  selectorPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  selectorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 12,
  },
  previewContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  error: {
    fontSize: 14,
    color: '#F44336',
    flex: 1,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AvatarCropBottomSheet;
