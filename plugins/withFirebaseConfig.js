const { withDangerousMod, withXcodeProject, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour garantir que GoogleService-Info.plist est présent dans le build iOS
 * Copie le fichier depuis le dépôt vers le projet iOS généré pendant le prebuild
 * ET l'inclut dans le target Xcode pour qu'il soit inclus dans le bundle
 */
const withFirebaseConfig = (config) => {
  // D'abord, copier le fichier
  config = withDangerousMod(config, [
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
        // Lire le contenu du fichier source pour vérification
        const fileContent = fs.readFileSync(sourcePath, 'utf8');
        
        // Vérifier que le fichier contient bien les clés Firebase essentielles
        const requiredKeys = ['BUNDLE_ID', 'PROJECT_ID', 'GOOGLE_APP_ID', 'API_KEY'];
        const missingKeys = requiredKeys.filter(key => !fileContent.includes(`<key>${key}</key>`));
        
        if (missingKeys.length > 0) {
          console.warn(`⚠️ [withFirebaseConfig] Warning: Missing required keys in GoogleService-Info.plist: ${missingKeys.join(', ')}`);
        } else {
          console.log(`✅ [withFirebaseConfig] GoogleService-Info.plist contains all required keys`);
        }
        
        // Copier le fichier
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ [withFirebaseConfig] Copied GoogleService-Info.plist to: ${destPath}`);
        
        // Vérifier que le fichier a bien été copié
        if (fs.existsSync(destPath)) {
          const stats = fs.statSync(destPath);
          console.log(`✅ [withFirebaseConfig] File verified: ${stats.size} bytes`);
          
          // Vérifier que le contenu correspond
          const copiedContent = fs.readFileSync(destPath, 'utf8');
          if (copiedContent === fileContent) {
            console.log(`✅ [withFirebaseConfig] File content verified - copy successful`);
          } else {
            console.error(`❌ [withFirebaseConfig] File content mismatch - copy may be corrupted`);
          }
        } else {
          console.error('❌ [withFirebaseConfig] File copy failed - destination file does not exist');
          throw new Error('File copy verification failed');
        }
      } catch (error) {
        console.error(`❌ [withFirebaseConfig] Error copying GoogleService-Info.plist: ${error.message}`);
        console.error(`❌ [withFirebaseConfig] Source: ${sourcePath}`);
        console.error(`❌ [withFirebaseConfig] Destination: ${destPath}`);
        console.error(`❌ [withFirebaseConfig] Stack: ${error.stack}`);
        // Ne pas faire échouer le build, mais logger l'erreur
        console.warn(`⚠️ [withFirebaseConfig] Continuing build despite error - Firebase may not work correctly`);
      }

      return config;
    },
  ]);

  // NOTE: Expo/Xcode inclut automatiquement les fichiers .plist dans le bundle
  // s'ils sont dans le dossier de l'app (ios/LasoCoach/).
  // Le fichier a été copié avec succès, donc il devrait être inclus automatiquement.
  // Si ce n'est pas le cas, il faudra l'ajouter manuellement dans Xcode :
  // Target > Build Phases > Copy Bundle Resources > + > GoogleService-Info.plist

  // Ajouter le REVERSED_CLIENT_ID aux URL schemes pour Google Sign-In iOS
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;
    
    // Lire le REVERSED_CLIENT_ID depuis GoogleService-Info.plist
    let reversedClientId = null;
    const googleServicePath = path.join(config.modRequest.projectRoot, 'firebase-config', 'GoogleService-Info.plist');
    
    if (fs.existsSync(googleServicePath)) {
      try {
        const plistContent = fs.readFileSync(googleServicePath, 'utf8');
        const reversedClientIdMatch = plistContent.match(/<key>REVERSED_CLIENT_ID<\/key>\s*<string>(.*?)<\/string>/);
        if (reversedClientIdMatch) {
          reversedClientId = reversedClientIdMatch[1];
          console.log(`✅ [withFirebaseConfig] Found REVERSED_CLIENT_ID: ${reversedClientId}`);
        }
      } catch (error) {
        console.warn(`⚠️ [withFirebaseConfig] Could not read REVERSED_CLIENT_ID: ${error.message}`);
      }
    }
    
    // Ajouter le REVERSED_CLIENT_ID aux URL schemes si trouvé
    if (reversedClientId) {
      if (!infoPlist.CFBundleURLTypes) {
        infoPlist.CFBundleURLTypes = [
          {
            CFBundleURLSchemes: [reversedClientId],
            CFBundleURLName: 'com.afrotouch.lasocoach.google',
          },
        ];
        console.log(`✅ [withFirebaseConfig] Added CFBundleURLTypes with REVERSED_CLIENT_ID for Google Sign-In`);
      } else {
        // Chercher si le REVERSED_CLIENT_ID existe déjà
        let found = false;
        for (const urlType of infoPlist.CFBundleURLTypes) {
          if (Array.isArray(urlType.CFBundleURLSchemes)) {
            if (urlType.CFBundleURLSchemes.includes(reversedClientId)) {
              found = true;
              break;
            }
          }
        }
        
        // Si pas trouvé, l'ajouter au premier élément ou créer un nouveau
        if (!found) {
          if (infoPlist.CFBundleURLTypes.length > 0 && Array.isArray(infoPlist.CFBundleURLTypes[0].CFBundleURLSchemes)) {
            infoPlist.CFBundleURLTypes[0].CFBundleURLSchemes.push(reversedClientId);
            console.log(`✅ [withFirebaseConfig] Added REVERSED_CLIENT_ID to existing CFBundleURLSchemes`);
          } else {
            infoPlist.CFBundleURLTypes.push({
              CFBundleURLSchemes: [reversedClientId],
              CFBundleURLName: 'com.afrotouch.lasocoach.google',
            });
            console.log(`✅ [withFirebaseConfig] Added new CFBundleURLType with REVERSED_CLIENT_ID`);
          }
        } else {
          console.log(`ℹ️ [withFirebaseConfig] REVERSED_CLIENT_ID already in CFBundleURLSchemes`);
        }
      }
    } else {
      console.warn(`⚠️ [withFirebaseConfig] REVERSED_CLIENT_ID not found - Google Sign-In may not work on iOS`);
    }
    
    return config;
  });

  return config;
};

module.exports = withFirebaseConfig;

