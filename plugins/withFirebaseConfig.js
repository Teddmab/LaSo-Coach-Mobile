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

  // CRITIQUE: S'assurer que le fichier est inclus dans le projet Xcode
  // Cela garantit qu'il sera inclus dans le bundle de l'app
  // Note: Expo inclut automatiquement les fichiers .plist dans le bundle s'ils sont dans le dossier de l'app
  // Mais pour être sûr, on utilise withXcodeProject pour l'ajouter explicitement
  config = withXcodeProject(config, (config) => {
    try {
      const xcodeProject = config.modResults;
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      
      const googleServicePath = path.join(iosProjectRoot, 'LasoCoach', 'GoogleService-Info.plist');
      
      // Vérifier que le fichier existe avant de l'ajouter
      if (!fs.existsSync(googleServicePath)) {
        console.warn(`⚠️ [withFirebaseConfig] GoogleService-Info.plist not found at ${googleServicePath}`);
        console.warn(`⚠️ [withFirebaseConfig] Cannot add to Xcode project - file may be missing.`);
        return config;
      }
      
      // Utiliser l'API xcode pour ajouter le fichier au projet
      // Chercher le groupe principal du projet
      const project = xcodeProject.getFirstProject().firstProject;
      const mainGroup = project.mainGroup;
      
      // Trouver ou créer le groupe "LasoCoach"
      let lasoCoachGroup = null;
      const findGroup = (group) => {
        if (group.children) {
          for (const child of group.children) {
            if (child.comment === 'LasoCoach' || (child.path && child.path === 'LasoCoach')) {
              return child;
            }
            if (child.children) {
              const found = findGroup(child);
              if (found) return found;
            }
          }
        }
        return null;
      };
      
      lasoCoachGroup = findGroup(mainGroup);
      
      if (!lasoCoachGroup) {
        // Créer le groupe si nécessaire
        lasoCoachGroup = mainGroup.addGroup('LasoCoach', 'LasoCoach');
      }
      
      // Vérifier si le fichier est déjà dans le projet
      const fileExists = lasoCoachGroup.children && lasoCoachGroup.children.some(
        (child) => child.path === 'GoogleService-Info.plist' || child.comment === 'GoogleService-Info.plist'
      );
      
      if (!fileExists) {
        // Ajouter le fichier au groupe avec le chemin relatif
        const fileRef = lasoCoachGroup.addFile('GoogleService-Info.plist', lasoCoachGroup, {
          sourceTree: '<group>',
          lastKnownFileType: 'text.plist.xml',
        });
        
        // Ajouter le fichier aux ressources du target "LasoCoach"
        const target = xcodeProject.getTarget('LasoCoach');
        if (target && target.uuid) {
          const resourcesBuildPhase = target.buildPhases.find(
            (phase) => phase.isa === 'PBXResourcesBuildPhase'
          );
          if (resourcesBuildPhase && fileRef) {
            // Vérifier si le fichier n'est pas déjà dans les ressources
            const fileAlreadyInResources = resourcesBuildPhase.files.some(
              (file) => file.fileRef === fileRef.uuid
            );
            if (!fileAlreadyInResources) {
              resourcesBuildPhase.addFile(fileRef);
              console.log('✅ [withFirebaseConfig] Added GoogleService-Info.plist to Xcode project resources');
            } else {
              console.log('✅ [withFirebaseConfig] GoogleService-Info.plist already in resources build phase');
            }
          } else {
            console.warn('⚠️ [withFirebaseConfig] Could not find resources build phase or file reference');
          }
        } else {
          console.warn('⚠️ [withFirebaseConfig] Could not find target "LasoCoach"');
        }
      } else {
        console.log('✅ [withFirebaseConfig] GoogleService-Info.plist already in Xcode project');
        // Vérifier quand même qu'il est dans les ressources
        const target = xcodeProject.getTarget('LasoCoach');
        if (target && target.uuid) {
          const resourcesBuildPhase = target.buildPhases.find(
            (phase) => phase.isa === 'PBXResourcesBuildPhase'
          );
          if (resourcesBuildPhase) {
            // Chercher le fichier dans les enfants du groupe
            const findFileRef = (group) => {
              if (group.children) {
                for (const child of group.children) {
                  if (child.path === 'GoogleService-Info.plist' || child.comment === 'GoogleService-Info.plist') {
                    return child;
                  }
                  if (child.children) {
                    const found = findFileRef(child);
                    if (found) return found;
                  }
                }
              }
              return null;
            };
            const fileRef = findFileRef(lasoCoachGroup);
            if (fileRef) {
              const fileInResources = resourcesBuildPhase.files.some(
                (file) => file.fileRef === fileRef.uuid
              );
              if (!fileInResources) {
                resourcesBuildPhase.addFile(fileRef);
                console.log('✅ [withFirebaseConfig] Added existing GoogleService-Info.plist to resources build phase');
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ [withFirebaseConfig] Could not add GoogleService-Info.plist to Xcode project: ${error.message}`);
      console.warn(`⚠️ [withFirebaseConfig] Stack: ${error.stack}`);
      console.warn(`⚠️ [withFirebaseConfig] File is copied but may not be included in bundle.`);
      console.warn(`⚠️ [withFirebaseConfig] This may cause Firebase to crash at startup.`);
      // Ne pas faire échouer le build, mais logger l'erreur
    }
    
    return config;
  });

  return config;
};

module.exports = withFirebaseConfig;

