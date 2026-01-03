const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour corriger l'avertissement ITMS-90863
 * Exclut macOS des builds iOS et supprime toutes les références macOS
 */
const withFixMacOSSupport = (config) => {
  // Ajuster les build settings via l'API XcodeProject et supprimer les frameworks macOS
  config = withXcodeProject(config, (config) => {
    try {
      const xcodeProject = config.modResults;
      const buildConfigurations = xcodeProject.pbxXCBuildConfigurationSection();

      if (!buildConfigurations) {
        console.warn('⚠️ [withFixMacOSSupport] No build configurations found');
        return config;
      }

      // Supprimer ReactNativeDependencies.framework de toutes les sections
      const project = xcodeProject.hash.project;
      const projectObjects = project.objects;

      // Supprimer de PBXFileReference
      if (projectObjects.PBXFileReference) {
        Object.keys(projectObjects.PBXFileReference).forEach((fileRefUuid) => {
          const fileRef = projectObjects.PBXFileReference[fileRefUuid];
          if (fileRef && fileRef.path && (
            fileRef.path.includes('ReactNativeDependencies') ||
            fileRef.path.includes('@rpath/ReactNativeDependencies') ||
            fileRef.path.includes('rpath/ReactNativeDependencies') ||
            fileRef.path.includes('macos') ||
            fileRef.path.toLowerCase().includes('macos')
          )) {
            console.log(`🗑️ [withFixMacOSSupport] Removing PBXFileReference: ${fileRef.path}`);
            delete projectObjects.PBXFileReference[fileRefUuid];
          }
        });
      }

      // Supprimer de PBXBuildFile
      if (projectObjects.PBXBuildFile) {
        Object.keys(projectObjects.PBXBuildFile).forEach((buildFileUuid) => {
          const buildFile = projectObjects.PBXBuildFile[buildFileUuid];
          if (buildFile && buildFile.fileRef) {
            const fileRef = projectObjects.PBXFileReference?.[buildFile.fileRef];
            if (fileRef && fileRef.path && (
              fileRef.path.includes('ReactNativeDependencies') ||
              fileRef.path.includes('@rpath/ReactNativeDependencies') ||
              fileRef.path.includes('rpath/ReactNativeDependencies') ||
              fileRef.path.includes('macos') ||
              fileRef.path.toLowerCase().includes('macos')
            )) {
              console.log(`🗑️ [withFixMacOSSupport] Removing PBXBuildFile for: ${fileRef.path}`);
              delete projectObjects.PBXBuildFile[buildFileUuid];
            }
          }
        });
      }

      // Supprimer de PBXFrameworksBuildPhase
      if (projectObjects.PBXFrameworksBuildPhase) {
        Object.keys(projectObjects.PBXFrameworksBuildPhase).forEach((phaseUuid) => {
          const phase = projectObjects.PBXFrameworksBuildPhase[phaseUuid];
          if (phase && phase.files) {
            const originalFiles = [...phase.files];
            phase.files = originalFiles.filter((fileUuid) => {
              const buildFile = projectObjects.PBXBuildFile?.[fileUuid];
              if (buildFile && buildFile.fileRef) {
                const fileRef = projectObjects.PBXFileReference?.[buildFile.fileRef];
                if (fileRef && fileRef.path && (
                  fileRef.path.includes('ReactNativeDependencies') ||
                  fileRef.path.includes('@rpath/ReactNativeDependencies') ||
                  fileRef.path.includes('rpath/ReactNativeDependencies') ||
                  fileRef.path.includes('macos') ||
                  fileRef.path.toLowerCase().includes('macos')
                )) {
                  console.log(`🗑️ [withFixMacOSSupport] Removing framework from PBXFrameworksBuildPhase: ${fileRef.path}`);
                  return false;
                }
              }
              return true;
            });
          }
        });
      }

      // Modifier les build configurations
      Object.keys(buildConfigurations).forEach((configUuid) => {
        const buildConfig = buildConfigurations[configUuid];
        if (!buildConfig || typeof buildConfig !== 'object' || !buildConfig.buildSettings) {
          return;
        }

        // SUPPORTED_PLATFORMS : iOS uniquement
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

        // EXCLUDED_ARCHS : exclure macOS
        const excludedArchsList = ['arm64-macos', 'x86_64-macos', 'i386-macos', 'x86_64h'];
        if (buildConfig.buildSettings.EXCLUDED_ARCHS) {
          const excludedArchs = buildConfig.buildSettings.EXCLUDED_ARCHS;
          if (Array.isArray(excludedArchs)) {
            excludedArchsList.forEach((arch) => {
              if (!excludedArchs.includes(arch)) {
                excludedArchs.push(arch);
              }
            });
            buildConfig.buildSettings.EXCLUDED_ARCHS = excludedArchs;
          } else if (typeof excludedArchs === 'string') {
            const currentArchs = excludedArchs.split(' ').filter(Boolean);
            excludedArchsList.forEach((arch) => {
              if (!currentArchs.includes(arch)) {
                currentArchs.push(arch);
              }
            });
            buildConfig.buildSettings.EXCLUDED_ARCHS = currentArchs;
          }
        } else {
          buildConfig.buildSettings.EXCLUDED_ARCHS = excludedArchsList;
        }

        // ONLY_ACTIVE_ARCH : éviter builds macOS
        if (!buildConfig.buildSettings.ONLY_ACTIVE_ARCH) {
          buildConfig.buildSettings.ONLY_ACTIVE_ARCH = 'YES';
        }

        // SUPPORTS_MACCATALYST : désactiver Mac Catalyst
        buildConfig.buildSettings.SUPPORTS_MACCATALYST = 'NO';

        // SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD : désactiver "Designed for iPad" sur Mac
        buildConfig.buildSettings.SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = 'NO';

        // OTHER_LDFLAGS : retirer références macOS et ReactNativeDependencies
        // Supprimer spécifiquement @rpath/ReactNativeDependencies.framework/ReactNativeDependencies
        if (buildConfig.buildSettings.OTHER_LDFLAGS) {
          const ldFlags = buildConfig.buildSettings.OTHER_LDFLAGS;
          if (Array.isArray(ldFlags)) {
            buildConfig.buildSettings.OTHER_LDFLAGS = ldFlags.filter(
              (flag) => !flag.includes('macos') && 
                       !flag.includes('ReactNativeDependencies') &&
                       !flag.includes('@rpath/ReactNativeDependencies') &&
                       !flag.includes('rpath/ReactNativeDependencies') &&
                       !flag.toLowerCase().includes('macos')
            );
          } else if (typeof ldFlags === 'string') {
            // Supprimer les références @rpath/ReactNativeDependencies
            let cleanedFlags = ldFlags
              .replace(/@rpath\/ReactNativeDependencies[^\s]*/g, '')
              .replace(/rpath\/ReactNativeDependencies[^\s]*/g, '')
              .replace(/-framework\s+ReactNativeDependencies[^\s]*/g, '')
              .split(' ')
              .filter(
                (flag) => flag.trim() !== '' &&
                         !flag.includes('macos') && 
                         !flag.includes('ReactNativeDependencies') &&
                         !flag.toLowerCase().includes('macos')
              )
              .join(' ');
            buildConfig.buildSettings.OTHER_LDFLAGS = cleanedFlags;
          }
        }

        // FRAMEWORK_SEARCH_PATHS : retirer chemins macOS et ReactNativeDependencies
        if (buildConfig.buildSettings.FRAMEWORK_SEARCH_PATHS) {
          const searchPaths = buildConfig.buildSettings.FRAMEWORK_SEARCH_PATHS;
          if (Array.isArray(searchPaths)) {
            buildConfig.buildSettings.FRAMEWORK_SEARCH_PATHS = searchPaths.filter(
              (path) => !path.includes('macos') && 
                       !path.includes('ReactNativeDependencies') &&
                       !path.includes('@rpath/ReactNativeDependencies') &&
                       !path.includes('rpath/ReactNativeDependencies') &&
                       !path.toLowerCase().includes('macos')
            );
          } else if (typeof searchPaths === 'string') {
            buildConfig.buildSettings.FRAMEWORK_SEARCH_PATHS = searchPaths
              .split(' ')
              .filter(
                (path) => !path.includes('macos') && 
                         !path.includes('ReactNativeDependencies') &&
                         !path.includes('@rpath/ReactNativeDependencies') &&
                         !path.includes('rpath/ReactNativeDependencies') &&
                         !path.toLowerCase().includes('macos')
              )
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

        // LD_RUNPATH_SEARCH_PATHS : retirer chemins ReactNativeDependencies
        if (buildConfig.buildSettings.LD_RUNPATH_SEARCH_PATHS) {
          const runpathPaths = buildConfig.buildSettings.LD_RUNPATH_SEARCH_PATHS;
          if (Array.isArray(runpathPaths)) {
            buildConfig.buildSettings.LD_RUNPATH_SEARCH_PATHS = runpathPaths.filter(
              (path) => !path.includes('macos') && 
                       !path.includes('ReactNativeDependencies') &&
                       !path.includes('@rpath/ReactNativeDependencies') &&
                       !path.toLowerCase().includes('macos')
            );
          } else if (typeof runpathPaths === 'string') {
            buildConfig.buildSettings.LD_RUNPATH_SEARCH_PATHS = runpathPaths
              .split(' ')
              .filter(
                (path) => !path.includes('macos') && 
                         !path.includes('ReactNativeDependencies') &&
                         !path.includes('@rpath/ReactNativeDependencies') &&
                         !path.toLowerCase().includes('macos')
              )
              .join(' ');
          }
        }

        // LIBRARY_SEARCH_PATHS : retirer chemins macOS et ReactNativeDependencies
        if (buildConfig.buildSettings.LIBRARY_SEARCH_PATHS) {
          const libraryPaths = buildConfig.buildSettings.LIBRARY_SEARCH_PATHS;
          if (Array.isArray(libraryPaths)) {
            buildConfig.buildSettings.LIBRARY_SEARCH_PATHS = libraryPaths.filter(
              (path) => !path.includes('macos') && 
                       !path.includes('ReactNativeDependencies') &&
                       !path.includes('@rpath/ReactNativeDependencies') &&
                       !path.toLowerCase().includes('macos')
            );
          } else if (typeof libraryPaths === 'string') {
            buildConfig.buildSettings.LIBRARY_SEARCH_PATHS = libraryPaths
              .split(' ')
              .filter(
                (path) => !path.includes('macos') && 
                         !path.includes('ReactNativeDependencies') &&
                         !path.includes('@rpath/ReactNativeDependencies') &&
                         !path.toLowerCase().includes('macos')
              )
              .join(' ');
          }
        }
      });

      console.log('✅ [withFixMacOSSupport] Removed all macOS references from Xcode project');
      console.log('✅ [withFixMacOSSupport] Excluded macOS from iOS build configurations');
      console.log('✅ [withFixMacOSSupport] Disabled Mac Catalyst (SUPPORTS_MACCATALYST = NO)');
      console.log('✅ [withFixMacOSSupport] Disabled Mac Designed for iPad (SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = NO)');
    } catch (error) {
      console.warn(`⚠️ [withFixMacOSSupport] Error modifying Xcode project: ${error.message}`);
      console.warn(`⚠️ [withFixMacOSSupport] Stack: ${error.stack}`);
    }

    return config;
  });

  // Nettoyer le Podfile et project.pbxproj directement
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      const podfilePath = path.join(iosProjectRoot, 'Podfile');
      const projectPbxprojPath = path.join(iosProjectRoot, 'LasoCoach.xcodeproj', 'project.pbxproj');

      // Nettoyer le Podfile
      if (fs.existsSync(podfilePath)) {
        try {
          let podfileContent = fs.readFileSync(podfilePath, 'utf8');
          let modified = false;

          // Supprimer toutes les références macOS et ReactNativeDependencies en une seule passe
          if (podfileContent.includes('macos') || 
              podfileContent.includes('ReactNativeDependencies') ||
              podfileContent.toLowerCase().includes('macos')) {
            console.warn('⚠️ [withFixMacOSSupport] Found macOS/ReactNativeDependencies references in Podfile, removing them');
            const lines = podfileContent.split('\n');
            const filteredLines = lines.filter((line) => {
              // Supprimer les lignes contenant ReactNativeDependencies
              if (line.includes('ReactNativeDependencies')) {
                return false;
              }
              // Supprimer les lignes contenant des références macOS dans les configurations
              if (line.includes('macos') || line.toLowerCase().includes('macos')) {
                // Supprimer si c'est une référence de platform, target ou configuration
                if (line.match(/platform\s*:macos/gi) ||
                    line.match(/target\s+.*macos/gi) ||
                    line.match(/pod\s+.*macos/gi)) {
                  return false; // Supprimer cette ligne
                }
              }
              return true; // Garder cette ligne
            });
            
            if (filteredLines.length !== lines.length) {
              podfileContent = filteredLines.join('\n');
              modified = true;
            }
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

      // Nettoyer project.pbxproj directement (sécurité supplémentaire)
      if (fs.existsSync(projectPbxprojPath)) {
        try {
          let pbxprojContent = fs.readFileSync(projectPbxprojPath, 'utf8');
          let modified = false;

          // Supprimer les lignes contenant ReactNativeDependencies et @rpath/ReactNativeDependencies
          if (pbxprojContent.includes('ReactNativeDependencies') || 
              pbxprojContent.includes('@rpath/ReactNativeDependencies') ||
              pbxprojContent.includes('rpath/ReactNativeDependencies')) {
            console.warn('⚠️ [withFixMacOSSupport] Found ReactNativeDependencies/@rpath references in project.pbxproj, removing them');
            const lines = pbxprojContent.split('\n');
            const filteredLines = lines.filter(
              (line) => !line.includes('ReactNativeDependencies') &&
                       !line.includes('@rpath/ReactNativeDependencies') &&
                       !line.includes('rpath/ReactNativeDependencies')
            );
            if (filteredLines.length !== lines.length) {
              pbxprojContent = filteredLines.join('\n');
              modified = true;
            }
          }

          // Supprimer les références macOS et @rpath/ReactNativeDependencies dans les chemins de frameworks
          const lines = pbxprojContent.split('\n');
          const filteredLines = lines.filter((line) => {
            // Supprimer les lignes contenant ReactNativeDependencies ou @rpath/ReactNativeDependencies
            if (line.includes('ReactNativeDependencies') ||
                line.includes('@rpath/ReactNativeDependencies') ||
                line.includes('rpath/ReactNativeDependencies')) {
              return false; // Supprimer cette ligne
            }
            // Garder la ligne si elle ne contient pas de références macOS dans les chemins
            if (line.includes('macos') || line.toLowerCase().includes('macos')) {
              // Supprimer seulement si c'est un chemin de framework ou une référence de build
              if (line.includes('/macos/') || 
                  line.includes('framework') ||
                  line.includes('FRAMEWORK_SEARCH_PATHS') ||
                  line.includes('OTHER_LDFLAGS') ||
                  line.includes('LD_RUNPATH_SEARCH_PATHS') ||
                  line.includes('LIBRARY_SEARCH_PATHS')) {
                return false; // Supprimer cette ligne
              }
            }
            return true; // Garder cette ligne
          });
          
          if (filteredLines.length !== lines.length) {
            pbxprojContent = filteredLines.join('\n');
            modified = true;
          }

          if (modified) {
            fs.writeFileSync(projectPbxprojPath, pbxprojContent, 'utf8');
            console.log('✅ [withFixMacOSSupport] project.pbxproj cleaned - macOS references removed');
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


