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
          const excludedArchsList = ['arm64-macos', 'x86_64-macos', 'i386-macos', 'x86_64h'];
          
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
          
          // S'assurer que SUPPORTED_PLATFORMS est défini et ne contient que iOS
          if (!buildConfig.buildSettings.SUPPORTED_PLATFORMS) {
            buildConfig.buildSettings.SUPPORTED_PLATFORMS = 'iphoneos iphonesimulator';
          } else {
            const platforms = buildConfig.buildSettings.SUPPORTED_PLATFORMS;
            if (Array.isArray(platforms)) {
              buildConfig.buildSettings.SUPPORTED_PLATFORMS = platforms.filter(
                (platform) => platform !== 'macosx' && platform !== 'macos' && platform.includes('iphone')
              );
            } else if (typeof platforms === 'string') {
              buildConfig.buildSettings.SUPPORTED_PLATFORMS = platforms
                .split(' ')
                .filter((platform) => platform !== 'macosx' && platform !== 'macos' && platform.includes('iphone'))
                .join(' ');
            }
          }
          
          // S'assurer que le SDK est bien iOS
          if (!buildConfig.buildSettings.SDKROOT || 
              (buildConfig.buildSettings.SDKROOT !== 'iphoneos' && 
               buildConfig.buildSettings.SDKROOT !== 'iphonesimulator')) {
            // Ne pas forcer si c'est une configuration de test ou autre
            if (buildConfig.name && buildConfig.name.includes('Debug')) {
              buildConfig.buildSettings.SDKROOT = 'iphonesimulator';
            } else {
              buildConfig.buildSettings.SDKROOT = 'iphoneos';
            }
          }
          
          // Exclure explicitement les frameworks macOS
          // Ne PAS supprimer ReactNativeDependencies complètement car il est nécessaire pour iOS
          // Mais s'assurer qu'il n'y a pas de références macOS dans OTHER_LDFLAGS
          if (buildConfig.buildSettings.OTHER_LDFLAGS) {
            const ldFlags = buildConfig.buildSettings.OTHER_LDFLAGS;
            if (Array.isArray(ldFlags)) {
              buildConfig.buildSettings.OTHER_LDFLAGS = ldFlags.filter(
                (flag) => !flag.includes('macos')
              );
            } else if (typeof ldFlags === 'string') {
              buildConfig.buildSettings.OTHER_LDFLAGS = ldFlags
                .split(' ')
                .filter((flag) => !flag.includes('macos'))
                .join(' ');
            }
          }
          
          // S'assurer que VALID_ARCHS ne contient pas d'architectures macOS
          if (buildConfig.buildSettings.VALID_ARCHS) {
            const validArchs = buildConfig.buildSettings.VALID_ARCHS;
            if (Array.isArray(validArchs)) {
              buildConfig.buildSettings.VALID_ARCHS = validArchs.filter(
                (arch) => !arch.includes('macos') && !arch.includes('x86_64h')
              );
            } else if (typeof validArchs === 'string') {
              buildConfig.buildSettings.VALID_ARCHS = validArchs
                .split(' ')
                .filter((arch) => !arch.includes('macos') && !arch.includes('x86_64h'))
                .join(' ');
            }
          }
          
          // S'assurer que TARGETED_DEVICE_FAMILY est défini pour iOS uniquement
          if (!buildConfig.buildSettings.TARGETED_DEVICE_FAMILY) {
            buildConfig.buildSettings.TARGETED_DEVICE_FAMILY = '1,2'; // iPhone et iPad
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
          let modified = false;
          
          // S'assurer que la plateforme est bien iOS uniquement
          if (!podfileContent.includes("platform :ios")) {
            // Le Podfile devrait déjà avoir platform :ios, mais on vérifie
            console.log('ℹ️ [withFixMacOSSupport] Podfile platform check');
          }
          
          // Supprimer les références macOS du Podfile
          if (podfileContent.includes('platform :macos')) {
            console.warn('⚠️ [withFixMacOSSupport] Found macOS platform in Podfile, removing it');
            podfileContent = podfileContent.replace(/platform\s*:macos[^\n]*\n?/g, '');
            modified = true;
          }
          
          // S'assurer qu'il n'y a pas de références à ReactNativeDependencies pour macOS
          if (podfileContent.includes('ReactNativeDependencies') && podfileContent.includes('macos')) {
            console.warn('⚠️ [withFixMacOSSupport] Found ReactNativeDependencies macOS reference, removing it');
            // Supprimer les lignes contenant ReactNativeDependencies et macos
            const lines = podfileContent.split('\n');
            podfileContent = lines.filter(line => 
              !(line.includes('ReactNativeDependencies') && line.includes('macos'))
            ).join('\n');
            modified = true;
          }
          
          if (modified) {
            fs.writeFileSync(podfilePath, podfileContent, 'utf8');
            console.log('✅ [withFixMacOSSupport] Podfile modified to exclude macOS');
          } else {
            console.log('✅ [withFixMacOSSupport] Podfile verified - no macOS references found');
          }
        } catch (error) {
          console.warn(`⚠️ [withFixMacOSSupport] Error reading Podfile: ${error.message}`);
        }
      }
      
      // Vérifier et modifier le projet.pbxproj pour supprimer les références macOS
      const projectPath = path.join(
        config.modRequest.platformProjectRoot,
        'LasoCoach.xcodeproj',
        'project.pbxproj'
      );
      
      if (fs.existsSync(projectPath)) {
        try {
          let projectContent = fs.readFileSync(projectPath, 'utf8');
          let projectModified = false;
          
          // Supprimer les références à ReactNativeDependencies.framework pour macOS
          // Chercher les patterns comme: "ReactNativeDependencies.framework" dans les sections macOS
          const reactNativeDepPattern = /(.*ReactNativeDependencies\.framework.*)/g;
          const matches = projectContent.match(reactNativeDepPattern);
          
          if (matches) {
            // Vérifier si ces références sont dans un contexte macOS
            matches.forEach(match => {
              // Si la référence est dans une section qui mentionne macos, la supprimer
              const contextBefore = projectContent.substring(
                Math.max(0, projectContent.indexOf(match) - 500),
                projectContent.indexOf(match)
              );
              const contextAfter = projectContent.substring(
                projectContent.indexOf(match),
                Math.min(projectContent.length, projectContent.indexOf(match) + 500)
              );
              
              if (contextBefore.toLowerCase().includes('macos') || 
                  contextAfter.toLowerCase().includes('macos')) {
                console.warn('⚠️ [withFixMacOSSupport] Found ReactNativeDependencies macOS reference in project.pbxproj');
                // Supprimer la ligne complète contenant cette référence
                projectContent = projectContent.replace(new RegExp(`.*${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\n?`, 'g'), '');
                projectModified = true;
              }
            });
          }
          
          // S'assurer que SUPPORTED_PLATFORMS ne contient pas macos dans project.pbxproj
          if (projectContent.includes('SUPPORTED_PLATFORMS') && projectContent.includes('macos')) {
            console.warn('⚠️ [withFixMacOSSupport] Found macOS in SUPPORTED_PLATFORMS in project.pbxproj, fixing...');
            // Remplacer les références macos dans SUPPORTED_PLATFORMS
            projectContent = projectContent.replace(
              /(SUPPORTED_PLATFORMS\s*=\s*[^;]*)(macosx|macos)([^;]*;)/g,
              '$1$3'
            );
            projectModified = true;
          }
          
          if (projectModified) {
            fs.writeFileSync(projectPath, projectContent, 'utf8');
            console.log('✅ [withFixMacOSSupport] project.pbxproj modified to exclude macOS');
          } else {
            console.log('✅ [withFixMacOSSupport] project.pbxproj verified - no macOS references found');
          }
        } catch (error) {
          console.warn(`⚠️ [withFixMacOSSupport] Error reading project.pbxproj: ${error.message}`);
        }
      }
      
      return config;
    },
  ]);
};

module.exports = withFixMacOSSupport;

