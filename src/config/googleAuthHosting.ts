/**
 * Configuration pour l'URL Firebase Hosting utilisée pour Google OAuth
 * 
 * Vous pouvez déployer la page OAuth sur n'importe quel projet Firebase
 * et changer cette URL selon votre configuration.
 * 
 * Exemples :
 * - https://ioscheck.web.app/google-auth.html
 * - https://votre-projet.web.app/google-auth.html
 * - https://votre-projet.firebaseapp.com/google-auth.html
 */

// ✅ Configuration : Projet Firebase Hosting pour Google OAuth
// Projet : inorder (ID: inorder-fabab)
// URL de déploiement : https://inorder-fabab.web.app/google-auth.html
export const GOOGLE_AUTH_HOSTING_URL = 'https://inorder-fabab.web.app/google-auth.html';

// URL de fallback (projet actuel)
export const GOOGLE_AUTH_HOSTING_URL_FALLBACK = 'https://lasocoach-39710.web.app/google-auth.html';

/**
 * Obtenir l'URL Firebase Hosting pour Google OAuth
 * Utilise l'URL configurée ou le fallback
 */
export const getGoogleAuthHostingUrl = (): string => {
  // Vous pouvez aussi utiliser une variable d'environnement
  // const customUrl = process.env.GOOGLE_AUTH_HOSTING_URL;
  // return customUrl || GOOGLE_AUTH_HOSTING_URL || GOOGLE_AUTH_HOSTING_URL_FALLBACK;
  
  return GOOGLE_AUTH_HOSTING_URL || GOOGLE_AUTH_HOSTING_URL_FALLBACK;
};

