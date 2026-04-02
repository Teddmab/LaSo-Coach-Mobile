import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Afficher le splash pendant 5 secondes
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  // Try to require icon, fallback if it fails
  let iconSource;
  try {
    iconSource = require('../../assets/icon.png');
  } catch (error) {
    console.error('❌ Error loading splash icon:', error);
    // Fallback: use a simple placeholder or Expo's default
    iconSource = null;
  }

  return (
    <View style={styles.container}>
      {/* StatusBar configurée pour fond vert clair - style dark pour contraste */}
      <StatusBar style="dark" />
      {iconSource ? (
        <Image 
          source={iconSource} 
          style={styles.logo}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>LC</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8BC34A', // Fond vert
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
  logoPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#8BC34A',
  },
});

export default SplashScreen;

