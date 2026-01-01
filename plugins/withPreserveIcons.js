const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour préserver les icônes iOS manuelles
 * Restaure les icônes après que Expo les ait régénérées
 * S'exécute APRÈS le prebuild pour restaurer nos icônes personnalisées
 */
const withPreserveIcons = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iconsPath = path.join(
        config.modRequest.platformProjectRoot,
        'LasoCoach',
        'Images.xcassets',
        'AppIcon.appiconset'
      );

      // Chemin vers les icônes source dans le repo
      const sourceIconsPath = path.join(
        config.modRequest.projectRoot,
        'ios',
        'LasoCoach',
        'Images.xcassets',
        'AppIcon.appiconset'
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
          console.warn(`⚠️ Source icon not found: ${iconFile}`);
        }
      }

      if (copiedCount > 0) {
        console.log(`✅ [withPreserveIcons] Restored ${copiedCount} icon files to AppIcon.appiconset`);
      } else {
        console.warn('⚠️ [withPreserveIcons] No icons were restored');
      }

      return config;
    },
  ]);
};

module.exports = withPreserveIcons;

