// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

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

// Exclude build directories from watching to prevent ENOENT errors
config.watchFolders = config.watchFolders || [];
config.watchFolders = config.watchFolders.filter(folder => {
  return !folder.includes('android\\build') && !folder.includes('android/build');
});

// Add watcher configuration to ignore problematic paths
config.watcher = {
  ...config.watcher,
  additionalExts: config.watcher?.additionalExts || [],
  ignored: [
    ...(config.watcher?.ignored || []),
    '**/node_modules/**/android/build/**',
    '**/node_modules/**/build/tmp/**',
    '**/android/build/**',
    '**/android/app/build/**',
  ],
};

module.exports = config;

