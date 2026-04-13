import { InteractionManager, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type LibraryOptions = ImagePicker.ImagePickerOptions;

/**
 * Ouvre la galerie avec un léger report après les interactions en cours.
 * En build release, un appel immédiat depuis un Modal / ScrollView peut faire échouer
 * ou ne pas rendre le sélecteur (surtout Android).
 * Utilise `mediaTypes: ['images']` (recommandé SDK 52+ à la place de MediaTypeOptions).
 */
export async function launchImageLibraryForUpload(
  options?: LibraryOptions
): Promise<ImagePicker.ImagePickerResult> {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        const delay = Platform.OS === 'android' ? 300 : 80;
        setTimeout(resolve, delay);
      });
    });
  });

  const base: LibraryOptions = {
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.8,
  };

  const iosPresentation: Partial<LibraryOptions> =
    Platform.OS === 'ios'
      ? { presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN }
      : {};

  return ImagePicker.launchImageLibraryAsync({
    ...base,
    ...options,
    ...iosPresentation,
    mediaTypes: options?.mediaTypes ?? base.mediaTypes,
  });
}
