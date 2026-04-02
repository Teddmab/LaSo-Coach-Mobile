import { Image } from 'react-native';

/**
 * Cache d'images pour précharger et garder les images en mémoire
 * Évite la disparition des images lors des re-renders
 */
class ImageCache {
  private static instance: ImageCache;
  private cachedImages: Set<string> = new Set();
  private preloadedLocalImages: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  /**
   * Précharge une image locale (require)
   */
  preloadLocalImage(key: string, imageSource: any): void {
    if (!this.preloadedLocalImages.has(key)) {
      this.preloadedLocalImages.set(key, imageSource);
      // Les images locales sont déjà en cache, on les garde juste en mémoire
    }
  }

  /**
   * Précharge une image distante (URI)
   */
  async preloadRemoteImage(uri: string): Promise<void> {
    if (!this.cachedImages.has(uri)) {
      try {
        await Image.prefetch(uri);
        this.cachedImages.add(uri);
      } catch (error) {
        // Ignore les erreurs de préchargement
      }
    }
  }

  /**
   * Récupère une image locale préchargée
   */
  getLocalImage(key: string): any {
    return this.preloadedLocalImages.get(key);
  }

  /**
   * Vérifie si une image distante est en cache
   */
  isCached(uri: string): boolean {
    return this.cachedImages.has(uri);
  }

  /**
   * Précharge toutes les images critiques de l'app
   */
  async preloadCriticalImages(): Promise<void> {
    try {
      // Précharger le logo
      const logoSource = require('../../assets/logo.png');
      this.preloadLocalImage('logo', logoSource);

      // Précharger les images de bienvenue
      const welcomeSlide1 = require('../../assets/welcome/slide onboarding 1.png');
      const welcomeSlide2 = require('../../assets/welcome/slide onboarding 2.png');
      const welcomeSlide3 = require('../../assets/welcome/slide onboarding 3.png');
      const welcomeSlide4 = require('../../assets/welcome/slide onboarding 4.png');
      
      this.preloadLocalImage('welcome_slide_1', welcomeSlide1);
      this.preloadLocalImage('welcome_slide_2', welcomeSlide2);
      this.preloadLocalImage('welcome_slide_3', welcomeSlide3);
      this.preloadLocalImage('welcome_slide_4', welcomeSlide4);
    } catch (error) {
      console.warn('⚠️ [ImageCache] Error preloading critical images:', error);
    }
  }
}

export default ImageCache.getInstance();

