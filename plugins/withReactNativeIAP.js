const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Plugin Expo pour résoudre l'ambiguïté des variants de react-native-iap
 * Ajoute automatiquement `missingDimensionStrategy 'store', 'play'` dans build.gradle
 */
const withReactNativeIAP = (config) => {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Vérifier si la configuration est déjà présente
    if (buildGradle.includes("missingDimensionStrategy 'store'")) {
      console.log('✅ react-native-iap missingDimensionStrategy already configured');
      return config;
    }

    // Ajouter la configuration dans le bloc defaultConfig
    const updatedBuildGradle = buildGradle.replace(
      /defaultConfig\s*{/,
      `defaultConfig {
        // FIX: react-native-iap variant ambiguity (Amazon vs Play Store)
        // Force Play Store variant instead of Amazon
        missingDimensionStrategy 'store', 'play'
`
    );

    if (updatedBuildGradle === buildGradle) {
      console.warn('⚠️ Could not add missingDimensionStrategy to build.gradle');
    } else {
      console.log('✅ Added missingDimensionStrategy for react-native-iap');
    }

    config.modResults.contents = updatedBuildGradle;
    return config;
  });
};

module.exports = withReactNativeIAP;

