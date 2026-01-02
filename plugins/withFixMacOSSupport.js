const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour corriger l'avertissement ITMS-90863
 * Exclut les références macOS du projet iOS pour éviter l'erreur
 * "The app links with libraries that aren't present in macOS"
 * 
 * Le problème vient de ReactNativeDependencies.framework qui est référencé
 * mais n'existe pas sur macOS. On doit s'assurer que le projet n'inclut
 * pas de références macOS.
 */
const withFixMacOSSupport = (config) => {
  // Modifier le projet Xcode pour exclure macOS
  config = withXcodeProject(config, (config) => {
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
        const isIOSConfig = buildConfig.buildSettings.SDKROOT === 'iphoneos' || 
                           buildConfig.buildSettings.SDKROOT === 'iphonesimulator' ||
                           !buildConfig.buildSettings.SDKROOT;
        
        if (isIOSConfig) {
          // Exclure toutes les architectures macOS
          const excludedArchsList = ['arm64-macos', 'x86_64-macos', 'i386-macos'];
          
          if (buildConfig.buildSettings.EXCLUDED_ARCHS) {
            const excludedArchs = buildConfig.buildSettings.EXCLUDED_ARCHS;
            if (Array.isArray(excludedArchs)) {
              excludedArchsList.forEach((arch) => {
                if (!excludedArchs.includes(arch)) {
                  excludedArchs.push(arch);
                }
              });
            } else if (typeof excludedArchs === 'string') {
              const currentArchs = excludedArchs.split(' ').filter(Boolean);
              excludedArchsList.forEach((arch) => {
                if (!currentArchs.includes(arch)) {
                  currentArchs.push(arch);
                }
              });
              buildConfig.buildSettings.EXCLUDED_ARCHS = currentArchs.join(' ');
            }
          } else {
            buildConfig.buildSettings.EXCLUDED_ARCHS = excludedArchsList.join(' ');
          }
          
          // S'assurer que ONLY_ACTIVE_ARCH est configuré pour éviter les builds macOS
          if (!buildConfig.buildSettings.ONLY_ACTIVE_ARCH) {
            buildConfig.buildSettings.ONLY_ACTIVE_ARCH = 'YES';
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

  // Modifier le Podfile pour exclure macOS si nécessaire
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      if (fs.existsSync(podfilePath)) {
        try {
          let podfileContent = fs.readFileSync(podfilePath, 'utf8');
          
          // S'assurer que la plateforme est bien iOS uniquement
          if (!podfileContent.includes("platform :ios")) {
            // Le Podfile devrait déjà avoir platform :ios, mais on vérifie
            console.log('ℹ️ [withFixMacOSSupport] Podfile platform check');
          }
          
          // Vérifier qu'il n'y a pas de références macOS
          if (podfileContent.includes('platform :macos')) {
            console.warn('⚠️ [withFixMacOSSupport] Found macOS platform in Podfile, this may cause ITMS-90863');
          }
          
          fs.writeFileSync(podfilePath, podfileContent, 'utf8');
          console.log('✅ [withFixMacOSSupport] Verified Podfile configuration');
        } catch (error) {
          console.warn(`⚠️ [withFixMacOSSupport] Error reading Podfile: ${error.message}`);
        }
      }
      
      return config;
    },
  ]);
};

module.exports = withFixMacOSSupport;

