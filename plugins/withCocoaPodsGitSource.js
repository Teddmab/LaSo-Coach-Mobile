const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour utiliser le repo git CocoaPods au lieu du CDN
 * Fixe les erreurs 429 (rate limiting) lors de pod install
 */
const withCocoaPodsGitSource = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      if (!fs.existsSync(podfilePath)) {
        console.log('⚠️ [withCocoaPodsGitSource] Podfile not found, skipping');
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Vérifier si la source git est déjà présente
      if (podfileContent.includes("source 'https://github.com/CocoaPods/Specs.git'")) {
        console.log('✅ [withCocoaPodsGitSource] Git source already configured');
        return config;
      }

      // Ajouter la source git après les require statements
      // Chercher la ligne après les require pour insérer la source
      const requirePattern = /(require\s+['"].*['"]\s*\n)+/;
      const match = podfileContent.match(requirePattern);

      if (match) {
        // Insérer la source git après les require statements
        const insertPosition = match.index + match[0].length;
        const sourceLine = "\n# Fix CocoaPods CDN rate limiting (429 errors)\n# Use git repo instead of CDN for better reliability in CI/CD\nsource 'https://github.com/CocoaPods/Specs.git'\n";
        
        podfileContent = 
          podfileContent.slice(0, insertPosition) +
          sourceLine +
          podfileContent.slice(insertPosition);

        fs.writeFileSync(podfilePath, podfileContent, 'utf8');
        console.log('✅ [withCocoaPodsGitSource] Added git source to Podfile');
      } else {
        // Fallback: ajouter au début du fichier
        const sourceLine = "# Fix CocoaPods CDN rate limiting (429 errors)\n# Use git repo instead of CDN for better reliability in CI/CD\nsource 'https://github.com/CocoaPods/Specs.git'\n\n";
        podfileContent = sourceLine + podfileContent;
        fs.writeFileSync(podfilePath, podfileContent, 'utf8');
        console.log('✅ [withCocoaPodsGitSource] Added git source to beginning of Podfile');
      }

      return config;
    },
  ]);
};

module.exports = withCocoaPodsGitSource;

