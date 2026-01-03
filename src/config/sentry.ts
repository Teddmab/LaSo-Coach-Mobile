import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { SENTRY_DSN } from '@env';

/**
 * Configuration Sentry pour le monitoring d'erreurs et crashes
 * 
 * Pour obtenir votre DSN :
 * 1. Créez un compte sur https://sentry.io (gratuit)
 * 2. Créez un nouveau projet "React Native"
 * 3. Copiez le DSN depuis les paramètres du projet
 * 4. Ajoutez SENTRY_DSN=votre_dsn dans votre fichier .env
 *    OU ajoutez sentryDsn dans app.json > extra.env
 * 
 * Format du DSN : https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
 * 
 * PRIORITÉ pour le DSN (dans l'ordre) :
 * 1. app.json > extra.env.sentryDsn (pour les builds EAS)
 * 2. .env > SENTRY_DSN (pour le développement local)
 * 3. process.env.SENTRY_DSN (fallback)
 */

const extraEnv = Constants.expoConfig?.extra?.env ?? {};
const SENTRY_DSN_VALUE = 
  extraEnv.sentryDsn ||           // Depuis app.json (pour builds EAS)
  SENTRY_DSN ||                   // Depuis .env (pour développement)
  process.env.SENTRY_DSN ||       // Fallback
  '';

/**
 * Initialise Sentry pour capturer les erreurs et crashes
 * Doit être appelé TRÈS TÔT dans index.ts avant tout autre code
 */
export const initSentry = () => {
  // Ne pas initialiser Sentry si le DSN n'est pas configuré
  if (!SENTRY_DSN_VALUE || SENTRY_DSN_VALUE.trim() === '') {
    console.warn('⚠️ [Sentry] DSN non configuré. Sentry ne sera pas activé.');
    console.warn('⚠️ [Sentry] Configurez SENTRY_DSN dans votre fichier .env');
    console.warn('⚠️ [Sentry] Créez un compte sur https://sentry.io et obtenez votre DSN');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN_VALUE,
      
      // Environnement (development, production, etc.)
      environment: __DEV__ ? 'development' : 'production',
      
      // Niveau de debug (true en dev pour voir les logs Sentry)
      debug: __DEV__,
      
      // Activer les traces de performance (optionnel)
      enableAutoSessionTracking: true,
      
      // Session tracking interval (en millisecondes)
      sessionTrackingIntervalMillis: 30000,
      
      // Activer les breadcrumbs (étapes avant le crash)
      enableNative: true,
      enableNativeCrashHandling: true,
      
      // Capturer les erreurs non catchées
      enableCaptureFailedRequests: true,
      
      // Configurer les breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // Filtrer les breadcrumbs trop verbeux si nécessaire
        return breadcrumb;
      },
      
      // Configurer les événements avant envoi
      beforeSend(event, hint) {
        // Vous pouvez filtrer ou modifier les événements ici
        return event;
      },
      
      // Tags personnalisés
      initialScope: {
        tags: {
          platform: 'ios',
          app_version: '1.0.4',
        },
      },
      
      // Activer les traces de performance pour les écrans
      tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% en dev, 20% en prod
    });

    console.log('✅ [Sentry] Initialisé avec succès');
  } catch (error) {
    console.error('❌ [Sentry] Erreur lors de l\'initialisation:', error);
  }
};

/**
 * Capture une erreur manuellement
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture un message personnalisé
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Ajouter du contexte utilisateur
 */
export const setUser = (user: { id?: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

/**
 * Ajouter du contexte supplémentaire
 */
export const setContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

/**
 * Ajouter un tag
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

export default Sentry;

