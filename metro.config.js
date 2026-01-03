const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Add resolver configuration to handle engine.io-client issues
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    // Polyfill for Node.js modules that don't exist in React Native
    'stream': require.resolve('readable-stream'),
  },
  // Prefer CommonJS over ESM to avoid module resolution issues
  resolverMainFields: ['react-native', 'browser', 'main'],
  // Resolve source extensions including .mjs and .cjs for ESM modules
  sourceExts: [...(config.resolver.sourceExts || []), 'mjs', 'cjs'],
  // Resolve platform-specific extensions
  platforms: ['ios', 'android', 'native', 'web'],
};

// Add transformer configuration
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  // Enable unstable_allowRequireContext for better module resolution
  unstable_allowRequireContext: true,
};

module.exports = config;