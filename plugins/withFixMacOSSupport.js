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

      // Nettoyer le Podfile et ajouter un hook post_install pour supprimer ReactNativeDependencies
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

          // Ajouter un hook post_install pour supprimer ReactNativeDependencies après pod install
          // Ce hook s'exécute APRÈS que React Native ait généré ReactNativeDependencies
          const postInstallHook = `
  # Hook post_install pour supprimer complètement ReactNativeDependencies et ses références macOS
  post_install do |installer|
    # D'abord, supprimer ReactNativeDependencies de tous les targets
    installer.pods_project.targets.each do |target|
      # Supprimer ReactNativeDependencies des frameworks liés
      target.frameworks_build_phase.files.each do |file|
        if file.file_ref&.path&.include?('ReactNativeDependencies')
          target.frameworks_build_phase.remove_file_reference(file.file_ref)
        end
      end
      
      # Pour tous les targets (y compris l'app), supprimer les références à ReactNativeDependencies
      target.build_configurations.each do |config|
        # Supprimer les références @rpath/ReactNativeDependencies des OTHER_LDFLAGS
        if config.build_settings['OTHER_LDFLAGS']
          original_flags = config.build_settings['OTHER_LDFLAGS']
          config.build_settings['OTHER_LDFLAGS'] = original_flags.reject { |flag| 
            flag_str = flag.to_s
            flag_str.include?('@rpath/ReactNativeDependencies') || 
            flag_str.include?('rpath/ReactNativeDependencies') ||
            flag_str.include?('-framework ReactNativeDependencies') ||
            flag_str.include?('ReactNativeDependencies.framework')
          }
        end
        
        # Supprimer les références macOS et ReactNativeDependencies des FRAMEWORK_SEARCH_PATHS
        if config.build_settings['FRAMEWORK_SEARCH_PATHS']
          config.build_settings['FRAMEWORK_SEARCH_PATHS'] = config.build_settings['FRAMEWORK_SEARCH_PATHS'].reject { |path| 
            path_str = path.to_s
            path_str.include?('/macos/') || 
            path_str.downcase.include?('macos') ||
            path_str.include?('ReactNativeDependencies')
          }
        end
        
        # Supprimer les références macOS et ReactNativeDependencies des LD_RUNPATH_SEARCH_PATHS
        if config.build_settings['LD_RUNPATH_SEARCH_PATHS']
          config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = config.build_settings['LD_RUNPATH_SEARCH_PATHS'].reject { |path| 
            path_str = path.to_s
            path_str.include?('macos') || 
            path_str.include?('ReactNativeDependencies') ||
            path_str.include?('@rpath/ReactNativeDependencies')
          }
        end
        
        # Supprimer les références macOS des LIBRARY_SEARCH_PATHS
        if config.build_settings['LIBRARY_SEARCH_PATHS']
          config.build_settings['LIBRARY_SEARCH_PATHS'] = config.build_settings['LIBRARY_SEARCH_PATHS'].reject { |path| 
            path_str = path.to_s
            path_str.include?('macos') || path_str.downcase.include?('macos')
          }
        end
        
        # Désactiver Mac Catalyst et Designed for iPad
        config.build_settings['SUPPORTS_MACCATALYST'] = 'NO'
        config.build_settings['SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD'] = 'NO'
        
        # Exclure les architectures macOS
        config.build_settings['EXCLUDED_ARCHS'] ||= []
        config.build_settings['EXCLUDED_ARCHS'] |= ['arm64-macos', 'x86_64-macos', 'i386-macos', 'x86_64h']
        
        # Filtrer SUPPORTED_PLATFORMS pour iOS uniquement
        if config.build_settings['SUPPORTED_PLATFORMS']
          config.build_settings['SUPPORTED_PLATFORMS'] = config.build_settings['SUPPORTED_PLATFORMS'].reject { |p| 
            p.to_s.include?('macos') || p.to_s.include?('MACOS')
          }
        end
      end
    end
    
    # Nettoyer aussi le projet principal (LasoCoach)
    installer.aggregate_targets.each do |aggregate_target|
      aggregate_target.user_project.targets.each do |target|
        target.build_configurations.each do |config|
          # Supprimer les références @rpath/ReactNativeDependencies
          if config.build_settings['OTHER_LDFLAGS']
            config.build_settings['OTHER_LDFLAGS'] = config.build_settings['OTHER_LDFLAGS'].reject { |flag| 
              flag_str = flag.to_s
              flag_str.include?('@rpath/ReactNativeDependencies') || 
              flag_str.include?('rpath/ReactNativeDependencies') ||
              flag_str.include?('-framework ReactNativeDependencies')
            }
          end
          
          # Supprimer les références macOS
          if config.build_settings['FRAMEWORK_SEARCH_PATHS']
            config.build_settings['FRAMEWORK_SEARCH_PATHS'] = config.build_settings['FRAMEWORK_SEARCH_PATHS'].reject { |path| 
              path.to_s.include?('/macos/') || path.to_s.downcase.include?('macos')
            }
          end
          
          if config.build_settings['LD_RUNPATH_SEARCH_PATHS']
            config.build_settings['LD_RUNPATH_SEARCH_PATHS'] = config.build_settings['LD_RUNPATH_SEARCH_PATHS'].reject { |path| 
              path.to_s.include?('macos') || path.to_s.include?('ReactNativeDependencies')
            }
          end
        end
      end
    end
  end`;

          // Vérifier si notre hook post_install existe déjà
          if (!podfileContent.includes('# Hook post_install pour supprimer complètement ReactNativeDependencies')) {
            // Trouver la fin du fichier ou le dernier post_install existant
            if (podfileContent.includes('post_install do |installer|')) {
              // Trouver le bloc post_install existant et insérer notre code dedans
              const lines = podfileContent.split('\n');
              let postInstallStartIndex = -1;
              let postInstallEndIndex = -1;
              let depth = 0;
              
              // Trouver le début et la fin du bloc post_install
              for (let i = 0; i < lines.length; i++) {
                const trimmedLine = lines[i].trim();
                if (trimmedLine.includes('post_install do |installer|')) {
                  postInstallStartIndex = i;
                  depth = 1;
                } else if (postInstallStartIndex !== -1) {
                  // Compter les blocs imbriqués
                  if (trimmedLine.match(/^\s*do\s*\|/)) {
                    depth++;
                  } else if (trimmedLine === 'end') {
                    depth--;
                    if (depth === 0) {
                      postInstallEndIndex = i;
                      break;
                    }
                  }
                }
              }
              
              if (postInstallStartIndex !== -1 && postInstallEndIndex !== -1) {
                // Extraire le contenu du hook (sans le 'post_install do |installer|' et le 'end')
                const hookLines = postInstallHook.trim().split('\n');
                // Enlever la première ligne (commentaire), la deuxième ('post_install do |installer|')
                // et la dernière ligne ('end')
                const hookContentLines = hookLines.slice(2, -1);
                
                // Déterminer l'indentation du bloc post_install existant
                const indentMatch = lines[postInstallStartIndex].match(/^(\s*)/);
                const baseIndent = indentMatch ? indentMatch[1] : '';
                const contentIndent = baseIndent + '  '; // Indentation pour le contenu (2 espaces de plus)
                
                // Le hook Ruby a déjà une indentation de 2 espaces, on doit la préserver
                // mais l'ajuster à l'indentation du bloc existant
                const indentedHookContent = hookContentLines.map(line => {
                  const trimmed = line.trim();
                  if (!trimmed) {
                    return ''; // Ligne vide
                  }
                  // Le hook original a 2 espaces d'indentation, on les remplace par contentIndent
                  // Si la ligne commence par 2 espaces, on les remplace
                  if (line.startsWith('  ')) {
                    return contentIndent + line.substring(2);
                  }
                  // Sinon, on ajoute simplement l'indentation
                  return contentIndent + trimmed;
                }).filter(line => line !== '').join('\n');
                
                // Insérer le hook juste avant le 'end' du post_install
                lines.splice(postInstallEndIndex, 0, '', contentIndent + '# Hook pour supprimer ReactNativeDependencies macOS', indentedHookContent);
                podfileContent = lines.join('\n');
                modified = true;
              } else {
                // Si on ne trouve pas le bloc, ajouter à la fin
                podfileContent += postInstallHook;
                modified = true;
              }
            } else {
              // Ajouter un nouveau post_install à la fin du fichier
              podfileContent += postInstallHook;
              modified = true;
            }
            console.log('✅ [withFixMacOSSupport] Added post_install hook to remove ReactNativeDependencies macOS references');
          }

          if (modified) {
            fs.writeFileSync(podfilePath, podfileContent, 'utf8');
            console.log('✅ [withFixMacOSSupport] Podfile modified to exclude macOS and add post_install hook');
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


