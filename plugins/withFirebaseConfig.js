const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour garantir que GoogleService-Info.plist est présent dans le build iOS
 * Copie le fichier depuis le dépôt vers le projet iOS généré pendant le prebuild
 */
const withFirebaseConfig = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      const projectRoot = config.modRequest.projectRoot;
      
      // Chemin de destination dans le projet iOS généré
      const destPath = path.join(iosProjectRoot, 'LasoCoach', 'GoogleService-Info.plist');
      
      // Chemins sources possibles (dans l'ordre de priorité)
      const sourcePaths = [
        // 1. Dans le dépôt Git (si présent)
        path.join(projectRoot, 'ios', 'LasoCoach', 'GoogleService-Info.plist'),
        // 2. À la racine du projet (backup)
        path.join(projectRoot, 'GoogleService-Info.plist'),
        // 3. Dans un dossier firebase-config (si organisé ainsi)
        path.join(projectRoot, 'firebase-config', 'GoogleService-Info.plist'),
      ];

      console.log('🔧 [withFirebaseConfig] Checking for GoogleService-Info.plist...');
      console.log(`📁 Destination: ${destPath}`);

      // Chercher le fichier source
      let sourcePath = null;
      for (const srcPath of sourcePaths) {
        if (fs.existsSync(srcPath)) {
          sourcePath = srcPath;
          console.log(`✅ [withFirebaseConfig] Found source at: ${srcPath}`);
          break;
        }
      }

      if (!sourcePath) {
        console.warn('⚠️ [withFirebaseConfig] GoogleService-Info.plist not found in any source location!');
        console.warn('⚠️ [withFirebaseConfig] Searched in:');
        sourcePaths.forEach((p) => console.warn(`   - ${p}`));
        console.warn('⚠️ [withFirebaseConfig] Firebase may not work correctly without this file.');
        console.warn('⚠️ [withFirebaseConfig] Please ensure GoogleService-Info.plist exists in one of these locations.');
        return config;
      }

      // Vérifier que le dossier de destination existe
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        console.log(`📁 [withFirebaseConfig] Creating destination directory: ${destDir}`);
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Copier le fichier
      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ [withFirebaseConfig] Copied GoogleService-Info.plist to: ${destPath}`);
        
        // Vérifier que le fichier a bien été copié
        if (fs.existsSync(destPath)) {
          const stats = fs.statSync(destPath);
          console.log(`✅ [withFirebaseConfig] File verified: ${stats.size} bytes`);
        } else {
          console.error('❌ [withFirebaseConfig] File copy failed - destination file does not exist');
        }
      } catch (error) {
        console.error(`❌ [withFirebaseConfig] Error copying GoogleService-Info.plist: ${error.message}`);
        console.error(`❌ [withFirebaseConfig] Source: ${sourcePath}`);
        console.error(`❌ [withFirebaseConfig] Destination: ${destPath}`);
      }

      return config;
    },
  ]);
};

module.exports = withFirebaseConfig;

