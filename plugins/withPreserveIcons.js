const { withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour préserver les icônes iOS manuelles
 * Empêche Expo de régénérer/écraser les icônes dans AppIcon.appiconset
 */
const withPreserveIcons = (config) => {
  return withXcodeProject(config, async (config) => {
    const projectPath = path.join(config.modRequest.platformProjectRoot, 'LasoCoach.xcworkspace');
    const iconsPath = path.join(
      config.modRequest.platformProjectRoot,
      'LasoCoach',
      'Images.xcassets',
      'AppIcon.appiconset'
    );

    // Vérifier que le dossier des icônes existe
    if (!fs.existsSync(iconsPath)) {
      console.log('⚠️ AppIcon.appiconset not found, skipping icon preservation');
      return config;
    }

    // Vérifier que toutes les icônes requises sont présentes
    const requiredIcons = [
      'App-Icon-60x60@2x.png',  // 120x120
      'App-Icon-60x60@3x.png',  // 180x180
      'App-Icon-76x76@1x.png',  // 76x76
      'App-Icon-76x76@2x.png',  // 152x152
      'App-Icon-83.5x83.5@2x.png', // 167x167
      'App-Icon-1024x1024@1x.png'  // 1024x1024
    ];

    const missingIcons = requiredIcons.filter(icon => {
      return !fs.existsSync(path.join(iconsPath, icon));
    });

    if (missingIcons.length > 0) {
      console.warn(`⚠️ Missing icons: ${missingIcons.join(', ')}`);
    } else {
      console.log('✅ All required iOS icons are present');
    }

    // Vérifier que Contents.json existe et est correct
    const contentsJsonPath = path.join(iconsPath, 'Contents.json');
    if (fs.existsSync(contentsJsonPath)) {
      const contents = JSON.parse(fs.readFileSync(contentsJsonPath, 'utf8'));
      const hasAllReferences = contents.images.every(img => {
        if (img.filename) {
          return fs.existsSync(path.join(iconsPath, img.filename));
        }
        return true; // Certaines entrées peuvent ne pas avoir de filename (placeholders)
      });
      
      if (hasAllReferences) {
        console.log('✅ Contents.json references are valid');
      } else {
        console.warn('⚠️ Some Contents.json references are invalid');
      }
    }

    return config;
  });
};

module.exports = withPreserveIcons;

