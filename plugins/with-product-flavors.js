const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withProductFlavors(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let buildGradle = config.modResults.contents;

      // Check if flavorDimensions already exists
      if (!buildGradle.includes('flavorDimensions')) {
        // Find the defaultConfig block and add flavors after it
        const defaultConfigRegex = /(defaultConfig\s*\{[^}]*\})/s;
        if (defaultConfigRegex.test(buildGradle)) {
          buildGradle = buildGradle.replace(
            defaultConfigRegex,
            `$1

    flavorDimensions "store"

    productFlavors {
        play {
            dimension "store"
        }
    }`
          );
          config.modResults.contents = buildGradle;
        }
      }
    }
    return config;
  });
};


