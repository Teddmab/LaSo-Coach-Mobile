const { withDangerousMod, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour préserver les icônes iOS manuelles
 * Restaure les icônes après que Expo les ait régénérées
 * S'exécute APRÈS le prebuild pour restaurer nos icônes personnalisées
 */
const withPreserveIcons = (config) => {
  // D'abord, s'assurer que CFBundleIconName est dans Info.plist via withInfoPlist
  config = withInfoPlist(config, (config) => {
    config.modResults.CFBundleIconName = 'AppIcon';
    return config;
  });

  // Ensuite, copier les icônes et vérifier Info.plist pendant le prebuild
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iconsPath = path.join(
        config.modRequest.platformProjectRoot,
        'LasoCoach',
        'Images.xcassets',
        'AppIcon.appiconset'
      );

      // Chemin vers les icônes source - chercher dans l'ordre :
      // 1. ios-icons-backup (dans le dépôt Git)
      // 2. .icons-backup (sauvegarde temporaire du hook pre-build)
      // 3. ios/ (si le dossier existe localement)
      const gitBackupIconsPath = path.join(
        config.modRequest.projectRoot,
        'ios-icons-backup'
      );
      const tempBackupIconsPath = path.join(
        config.modRequest.projectRoot,
        '.icons-backup',
        'AppIcon.appiconset'
      );
      const repoIconsPath = path.join(
        config.modRequest.projectRoot,
        'ios',
        'LasoCoach',
        'Images.xcassets',
        'AppIcon.appiconset'
      );
      
      // Utiliser la sauvegarde Git si elle existe, sinon la sauvegarde temporaire, sinon le repo
      let sourceIconsPath;
      if (fs.existsSync(gitBackupIconsPath)) {
        sourceIconsPath = gitBackupIconsPath;
      } else if (fs.existsSync(tempBackupIconsPath)) {
        sourceIconsPath = tempBackupIconsPath;
      } else {
        sourceIconsPath = repoIconsPath;
      }

      const infoPlistPath = path.join(
        config.modRequest.platformProjectRoot,
        'LasoCoach',
        'Info.plist'
      );

      console.log('🔧 [withPreserveIcons] Starting icon restoration...');
      console.log(`📁 Source path: ${sourceIconsPath}`);
      console.log(`📁 Destination path: ${iconsPath}`);

      // Vérifier que le dossier source existe
      if (!fs.existsSync(sourceIconsPath)) {
        console.log('⚠️ Source AppIcon.appiconset not found, skipping icon restoration');
        return config;
      }

      // Vérifier que le dossier de destination existe
      if (!fs.existsSync(iconsPath)) {
        console.log('⚠️ Destination AppIcon.appiconset not found, creating it');
        fs.mkdirSync(iconsPath, { recursive: true });
      }

      // Liste des icônes à copier
      const requiredIcons = [
        'App-Icon-60x60@2x.png',  // 120x120
        'App-Icon-60x60@3x.png',  // 180x180
        'App-Icon-76x76@1x.png',  // 76x76
        'App-Icon-76x76@2x.png',  // 152x152
        'App-Icon-83.5x83.5@2x.png', // 167x167
        'App-Icon-1024x1024@1x.png',  // 1024x1024
        'Contents.json'
      ];

      // Copier toutes les icônes depuis le repo vers le build
      let copiedCount = 0;
      for (const iconFile of requiredIcons) {
        const sourcePath = path.join(sourceIconsPath, iconFile);
        const destPath = path.join(iconsPath, iconFile);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          copiedCount++;
          console.log(`✅ Copied: ${iconFile}`);
        } else {
          console.warn(`⚠️ Source icon not found: ${iconFile} at ${sourcePath}`);
          // Contents.json peut être généré automatiquement par Expo, ce n'est pas critique
          if (iconFile === 'Contents.json') {
            console.log('ℹ️ Contents.json will be generated automatically by Expo if missing');
          }
        }
      }

      if (copiedCount > 0) {
        console.log(`✅ [withPreserveIcons] Restored ${copiedCount} icon files to AppIcon.appiconset`);
      } else {
        console.warn('⚠️ [withPreserveIcons] No icons were restored');
      }

      // S'assurer que CFBundleIconName est présent dans Info.plist
      if (fs.existsSync(infoPlistPath)) {
        try {
          let infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');
          
          // Vérifier si CFBundleIconName est déjà présent
          if (!infoPlistContent.includes('<key>CFBundleIconName</key>')) {
            console.log('🔧 [withPreserveIcons] Adding CFBundleIconName to Info.plist');
            // Ajouter CFBundleIconName juste après CFBundleVersion
            const bundleVersionPattern = /(<key>CFBundleVersion<\/key>\s*<string>.*?<\/string>)/;
            if (bundleVersionPattern.test(infoPlistContent)) {
              infoPlistContent = infoPlistContent.replace(
                bundleVersionPattern,
                `$1\n    <key>CFBundleIconName</key>\n    <string>AppIcon</string>`
              );
              fs.writeFileSync(infoPlistPath, infoPlistContent, 'utf8');
              console.log('✅ [withPreserveIcons] CFBundleIconName added to Info.plist');
            } else {
              console.warn('⚠️ [withPreserveIcons] Could not find CFBundleVersion in Info.plist to insert CFBundleIconName');
            }
          } else {
            // Vérifier que la valeur est correcte
            const iconNamePattern = /<key>CFBundleIconName<\/key>\s*<string>(.*?)<\/string>/;
            const match = infoPlistContent.match(iconNamePattern);
            if (match && match[1] !== 'AppIcon') {
              console.log('🔧 [withPreserveIcons] Updating CFBundleIconName value in Info.plist');
              infoPlistContent = infoPlistContent.replace(
                iconNamePattern,
                '<key>CFBundleIconName</key>\n    <string>AppIcon</string>'
              );
              fs.writeFileSync(infoPlistPath, infoPlistContent, 'utf8');
              console.log('✅ [withPreserveIcons] CFBundleIconName updated in Info.plist');
            } else {
              console.log('✅ [withPreserveIcons] CFBundleIconName already present and correct in Info.plist');
            }
          }
        } catch (error) {
          console.warn(`⚠️ [withPreserveIcons] Error updating Info.plist: ${error.message}`);
        }
      } else {
        console.warn(`⚠️ [withPreserveIcons] Info.plist not found at: ${infoPlistPath}`);
      }

      return config;
    },
  ]);
};

module.exports = withPreserveIcons;

