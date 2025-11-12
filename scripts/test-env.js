// Environment Testing Script
// Run this with: node scripts/test-env.js

// Mock __DEV__ for testing
global.__DEV__ = true;

// Import environment config
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    envVars[key.trim()] = value.trim();
  }
});

console.log('🧪 Environment Test Results:');
console.log('📍 Development Mode (__DEV__):', global.__DEV__);
console.log('🌐 Production API URL:', envVars.API_BASE_URL);
console.log('⚡ Development API URL:', envVars.API_BASE_URL_DEV);

// Simulate URL selection logic
const getApiUrl = () => {
  if (global.__DEV__ && envVars.API_BASE_URL_DEV) {
    return envVars.API_BASE_URL_DEV;
  }
  return envVars.API_BASE_URL;
};

console.log('\n✅ Selected API URL:', getApiUrl());
console.log('\n🔧 To test production mode:');
console.log('   - Set __DEV__ = false in the build');
console.log('   - Or create a production build with EAS');