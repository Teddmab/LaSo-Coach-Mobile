import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

const NetworkStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [fadeAnim] = useState<Animated.Value>(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasConnected = isConnected;
      setIsConnected(state.isConnected ?? false);
      
      if (!state.isConnected) {
        // Mode hors-ligne : afficher immédiatement la bannière rouge
        setIsReconnecting(false);
        fadeAnim.setValue(1);
        return;
      }

      // Show reconnecting state briefly when network comes back
      if (!wasConnected && state.isConnected) {
        setIsReconnecting(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        setTimeout(() => {
          setIsReconnecting(false);
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [isConnected, fadeAnim]);

  if (isConnected && !isReconnecting) {
    return null; // Don't show anything when fully connecté
  }

  return (
    <Animated.View style={[
      isReconnecting ? reconnectionStyles.container : styles.container, 
      { opacity: fadeAnim }
    ]}>
      <Ionicons 
        name={isReconnecting ? "checkmark-circle" : "wifi-outline"} 
        size={16} 
        color="#FFFFFF" 
      />
      <Text style={styles.text}>
        {isReconnecting ? "Connexion rétablie" : "Pas de connexion internet"}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

// Add reconnection success style
const reconnectionStyles = StyleSheet.create({
  container: {
    ...styles.container,
    backgroundColor: '#4CAF50', // Green for success
  },
});

export default NetworkStatus;

