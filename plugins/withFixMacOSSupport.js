const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour corriger l'avertissement ITMS-90863
 * Exclut macOS des builds iOS sans modifier directement project.pbxproj
 */
const withFixMacOSSupport = (config) => {
  // Ajuster les build settings via l'API XcodeProject (sûr)
  config = withXcodeProject(config, (config) => {
    try {
      const xcodeProject = config.modResults;
      const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();

      if (!buildConfigurations) {
        console.warn('⚠️ [withFixMacOSSupport] No build configurations found');
        return config;
      }

      Object.keys(buildConfigurations).forEach((configUuid) => {
        const buildConfig = buildConfigurations[configUuid];
        if (!buildConfig || typeof buildConfig !== 'object' || !buildConfig.buildSettings) {
          return;
        }

        // SUPPORTED_PLATFORMS : iOS uniquement (modification minimale pour éviter corruption)
        if (buildConfig.buildSettings.SUPPORTED_PLATFORMS) {
          const platforms = buildConfig.buildSettings.SUPPORTED_PLATFORMS;
          if (Array.isArray(platforms)) {
            const filtered = platforms.filter(
              (platform) => platform && platform.includes('iphone') && !platform.includes('mac')
            );
            if (filtered.length > 0) {
              buildConfig.buildSettings.SUPPORTED_PLATFORMS = filtered;
            }
          } else if (typeof platforms === 'string') {
            const filtered = platforms
              .split(' ')
              .filter((platform) => platform && platform.includes('iphone') && !platform.includes('mac'))
              .join(' ');
            if (filtered) {
              buildConfig.buildSettings.SUPPORTED_PLATFORMS = filtered;
            }
          }
        }

        // EXCLUDED_ARCHS : exclure macOS (IMPORTANT: doit être un Array pour le format pbxproj)
        const excludedArchsList = ['arm64-macos', 'x86_64-macos', 'i386-macos', 'x86_64h'];
        if (buildConfig.buildSettings.EXCLUDED_ARCHS) {
          const excludedArchs = buildConfig.buildSettings.EXCLUDED_ARCHS;
          if (Array.isArray(excludedArchs)) {
            // Déjà un tableau, ajouter les architectures manquantes
            excludedArchsList.forEach((arch) => {
              if (!excludedArchs.includes(arch)) {
                excludedArchs.push(arch);
              }
            });
            // S'assurer que c'est toujours un tableau
            buildConfig.buildSettings.EXCLUDED_ARCHS = excludedArchs;
          } else if (typeof excludedArchs === 'string') {
            // Convertir la chaîne en tableau
            const currentArchs = excludedArchs.split(' ').filter(Boolean);
            excludedArchsList.forEach((arch) => {
              if (!currentArchs.includes(arch)) {
                currentArchs.push(arch);
              }
            });
            // Convertir en tableau pour le format pbxproj
            buildConfig.buildSettings.EXCLUDED_ARCHS = currentArchs;
          }
        } else {
          // Créer comme tableau directement
          buildConfig.buildSettings.EXCLUDED_ARCHS = excludedArchsList;
        }

        // ONLY_ACTIVE_ARCH : éviter builds macOS
        if (!buildConfig.buildSettings.ONLY_ACTIVE_ARCH) {
          buildConfig.buildSettings.ONLY_ACTIVE_ARCH = 'YES';
        }

        // SDKROOT : Ne modifier que si nécessaire (éviter corruption)
        // Laisser Expo gérer SDKROOT par défaut

        // OTHER_LDFLAGS : retirer références macOS
        if (buildConfig.buildSettings.OTHER_LDFLAGS) {
          const ldFlags = buildConfig.buildSettings.OTHER_LDFLAGS;
          if (Array.isArray(ldFlags)) {
            buildConfig.buildSettings.OTHER_LDFLAGS = ldFlags.filter((flag) => !flag.includes('macos'));
          } else if (typeof ldFlags === 'string') {
            buildConfig.buildSettings.OTHER_LDFLAGS = ldFlags
              .split(' ')
              .filter((flag) => !flag.includes('macos'))
              .join(' ');
          }
        }

        // VALID_ARCHS : retirer architectures macOS
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

        // TARGETED_DEVICE_FAMILY : Ne pas modifier ici pour éviter les erreurs de parsing
        // La valeur par défaut d'Expo est déjà correcte pour iOS
      });

      console.log('✅ [withFixMacOSSupport] Excluded macOS from iOS build configurations');
    } catch (error) {
      console.warn(`⚠️ [withFixMacOSSupport] Error modifying Xcode project: ${error.message}`);
    }

    return config;
  });

  // Nettoyer le Podfile (sans toucher au project.pbxproj)
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        try {
          let podfileContent = fs.readFileSync(podfilePath, 'utf8');
          let modified = false;

          if (!podfileContent.includes('platform :ios')) {
            console.log('ℹ️ [withFixMacOSSupport] Podfile platform check');
          }

          if (podfileContent.includes('platform :macos')) {
            console.warn('⚠️ [withFixMacOSSupport] Found macOS platform in Podfile, removing it');
            podfileContent = podfileContent.replace(/platform\s*:macos[^\n]*\n?/g, '');
            modified = true;
          }

          if (podfileContent.includes('ReactNativeDependencies') && podfileContent.includes('macos')) {
            console.warn('⚠️ [withFixMacOSSupport] Found ReactNativeDependencies macOS reference, removing it');
            const lines = podfileContent.split('\n');
            podfileContent = lines
              .filter((line) => !(line.includes('ReactNativeDependencies') && line.includes('macos')))
              .join('\n');
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

      return config;
    },
  ]);
};

module.exports = withFixMacOSSupport;

