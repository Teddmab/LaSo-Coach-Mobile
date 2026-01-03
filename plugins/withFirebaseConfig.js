const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
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

  // Ensuite, s'assurer que le fichier est inclus dans le projet Xcode et le target
  config = withXcodeProject(config, (config) => {
    try {
      const xcodeProject = config.modResults;
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      const googleServicePath = path.join(iosProjectRoot, 'LasoCoach', 'GoogleService-Info.plist');

      // Vérifier que le fichier existe
      if (!fs.existsSync(googleServicePath)) {
        console.warn('⚠️ [withFirebaseConfig] GoogleService-Info.plist not found, skipping Xcode project addition');
        return config;
      }

      // Obtenir le nom du target (généralement le nom de l'app)
      const targetName = config.ios?.bundleIdentifier?.split('.').pop() || 'LasoCoach';
      
      // Ajouter le fichier au projet Xcode s'il n'est pas déjà présent
      const relativePath = 'LasoCoach/GoogleService-Info.plist';
      
      // Vérifier si le fichier est déjà dans le projet
      const fileRefs = xcodeProject.pbxFileReferenceSection();
      let fileRefUuid = null;
      
      for (const uuid in fileRefs) {
        const fileRef = fileRefs[uuid];
        if (fileRef && fileRef.path === relativePath) {
          fileRefUuid = uuid;
          console.log('✅ [withFirebaseConfig] GoogleService-Info.plist already in Xcode project');
          break;
        }
      }

      // Si le fichier n'est pas dans le projet, l'ajouter
      if (!fileRefUuid) {
        fileRefUuid = xcodeProject.addFile(relativePath, 'LasoCoach', {
          target: targetName,
          lastKnownFileType: 'text.plist.xml',
        });
        console.log('✅ [withFirebaseConfig] Added GoogleService-Info.plist to Xcode project');
      }

      // S'assurer que le fichier est dans "Copy Bundle Resources" du target
      const targetUuid = xcodeProject.getTarget(targetName);
      if (targetUuid) {
        const resourcesBuildPhase = xcodeProject.pbxResourcesBuildPhaseObj(targetUuid);
        if (resourcesBuildPhase) {
          // Vérifier si le fichier est déjà dans la phase de ressources
          const files = resourcesBuildPhase.files || [];
          const alreadyInResources = files.some((file) => {
            const buildFile = xcodeProject.pbxBuildFileSection()[file.value];
            return buildFile && buildFile.fileRef === fileRefUuid;
          });

          if (!alreadyInResources) {
            // Ajouter le fichier à la phase de ressources
            xcodeProject.addToPbxResourcesBuildPhase(fileRefUuid);
            console.log('✅ [withFirebaseConfig] Added GoogleService-Info.plist to Copy Bundle Resources');
          } else {
            console.log('✅ [withFirebaseConfig] GoogleService-Info.plist already in Copy Bundle Resources');
          }
        }
      }

      console.log('✅ [withFirebaseConfig] GoogleService-Info.plist configured in Xcode project and target');
    } catch (error) {
      console.warn(`⚠️ [withFirebaseConfig] Error adding file to Xcode project: ${error.message}`);
      console.warn(`⚠️ [withFirebaseConfig] Stack: ${error.stack}`);
      // Ne pas faire échouer le build, le fichier est au moins copié
    }

    return config;
  });

  return config;
};

module.exports = withFirebaseConfig;

