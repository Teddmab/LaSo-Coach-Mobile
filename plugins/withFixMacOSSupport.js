const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Plugin Expo pour corriger l'avertissement ITMS-90863
 * Exclut les références macOS du projet iOS pour éviter l'erreur
 * "The app links with libraries that aren't present in macOS"
 */
const withFixMacOSSupport = (config) => {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    
    // Obtenir toutes les configurations de build
    const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();
    
    // Parcourir toutes les configurations pour exclure macOS
    Object.keys(buildConfigurations).forEach((configUuid) => {
      const buildConfig = buildConfigurations[configUuid];
      
      // Exclure macOS des architectures supportées
      if (buildConfig.buildSettings) {
        // S'assurer que SUPPORTED_PLATFORMS n'inclut que iOS
        if (buildConfig.buildSettings.SUPPORTED_PLATFORMS) {
          const platforms = buildConfig.buildSettings.SUPPORTED_PLATFORMS;
          if (Array.isArray(platforms)) {
            buildConfig.buildSettings.SUPPORTED_PLATFORMS = platforms.filter(
              (platform) => platform !== 'macosx'
            );
          } else if (typeof platforms === 'string') {
            buildConfig.buildSettings.SUPPORTED_PLATFORMS = platforms
              .split(' ')
              .filter((platform) => platform !== 'macosx')
              .join(' ');
          }
        }
        
        // Exclure macOS des architectures
        if (buildConfig.buildSettings.EXCLUDED_ARCHS) {
          const excludedArchs = buildConfig.buildSettings.EXCLUDED_ARCHS;
          if (Array.isArray(excludedArchs)) {
            if (!excludedArchs.includes('arm64-macos')) {
              buildConfig.buildSettings.EXCLUDED_ARCHS.push('arm64-macos');
            }
          } else if (typeof excludedArchs === 'string') {
            if (!excludedArchs.includes('arm64-macos')) {
              buildConfig.buildSettings.EXCLUDED_ARCHS = `${excludedArchs} arm64-macos`;
            }
          }
        } else {
          buildConfig.buildSettings.EXCLUDED_ARCHS = 'arm64-macos';
        }
        
        // S'assurer que le SDK est iOS uniquement
        if (!buildConfig.buildSettings.SDKROOT) {
          buildConfig.buildSettings.SDKROOT = 'iphoneos';
        }
      }
    });
    
    console.log('✅ [withFixMacOSSupport] Excluded macOS from iOS build configurations');
    
    return config;
  });
};

module.exports = withFixMacOSSupport;

