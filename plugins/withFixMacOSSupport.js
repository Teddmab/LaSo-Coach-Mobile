const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Plugin Expo pour corriger l'avertissement ITMS-90863
 * Exclut les références macOS du projet iOS pour éviter l'erreur
 * "The app links with libraries that aren't present in macOS"
 */
const withFixMacOSSupport = (config) => {
  return withXcodeProject(config, (config) => {
    try {
      const xcodeProject = config.modResults;
      
      // Obtenir toutes les configurations de build
      const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();
      
      if (!buildConfigurations) {
        console.warn('⚠️ [withFixMacOSSupport] No build configurations found');
        return config;
      }
      
      // Parcourir toutes les configurations pour exclure macOS
      Object.keys(buildConfigurations).forEach((configUuid) => {
        const buildConfig = buildConfigurations[configUuid];
        
        // Ignorer les configurations qui ne sont pas des objets valides
        if (!buildConfig || typeof buildConfig !== 'object' || !buildConfig.buildSettings) {
          return;
        }
        
        // Exclure macOS des architectures supportées
        // S'assurer que SUPPORTED_PLATFORMS n'inclut que iOS
        if (buildConfig.buildSettings.SUPPORTED_PLATFORMS) {
          const platforms = buildConfig.buildSettings.SUPPORTED_PLATFORMS;
          if (Array.isArray(platforms)) {
            buildConfig.buildSettings.SUPPORTED_PLATFORMS = platforms.filter(
              (platform) => platform !== 'macosx' && platform !== 'macos'
            );
          } else if (typeof platforms === 'string') {
            buildConfig.buildSettings.SUPPORTED_PLATFORMS = platforms
              .split(' ')
              .filter((platform) => platform !== 'macosx' && platform !== 'macos')
              .join(' ');
          }
        }
        
        // Exclure macOS des architectures (seulement pour les configurations iOS)
        // Ne pas modifier si c'est déjà configuré correctement
        const isIOSConfig = buildConfig.buildSettings.SDKROOT === 'iphoneos' || 
                           buildConfig.buildSettings.SDKROOT === 'iphonesimulator' ||
                           !buildConfig.buildSettings.SDKROOT;
        
        if (isIOSConfig) {
          if (buildConfig.buildSettings.EXCLUDED_ARCHS) {
            const excludedArchs = buildConfig.buildSettings.EXCLUDED_ARCHS;
            if (Array.isArray(excludedArchs)) {
              if (!excludedArchs.includes('arm64-macos')) {
                buildConfig.buildSettings.EXCLUDED_ARCHS.push('arm64-macos');
              }
            } else if (typeof excludedArchs === 'string') {
              if (!excludedArchs.includes('arm64-macos')) {
                buildConfig.buildSettings.EXCLUDED_ARCHS = `${excludedArchs} arm64-macos`.trim();
              }
            }
          } else {
            buildConfig.buildSettings.EXCLUDED_ARCHS = 'arm64-macos';
          }
        }
      });
      
      console.log('✅ [withFixMacOSSupport] Excluded macOS from iOS build configurations');
    } catch (error) {
      console.warn(`⚠️ [withFixMacOSSupport] Error modifying Xcode project: ${error.message}`);
      // Ne pas faire échouer le build si ce plugin échoue
    }
    
    return config;
  });
};

module.exports = withFixMacOSSupport;

