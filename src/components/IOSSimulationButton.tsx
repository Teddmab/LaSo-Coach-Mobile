import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIOSSimulation } from '../hooks/useIOSSimulation';

/**
 * Bouton flottant pour activer/désactiver la simulation iOS
 * Visible partout dans l'app sur Android
 */
const IOSSimulationButton: React.FC = () => {
  // Ne montrer que sur Android
  if (Platform.OS !== 'android') {
    return null;
  }

  const { isIOSSimulationEnabled, toggleIOSSimulation } = useIOSSimulation();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isIOSSimulationEnabled && styles.buttonActive
      ]}
      onPress={toggleIOSSimulation}
      activeOpacity={0.8}
    >
      <Ionicons 
        name="phone-portrait" 
        size={24} 
        color={isIOSSimulationEnabled ? "#FFFFFF" : "#4CAF50"} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1001,
  },
  buttonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
});

export default IOSSimulationButton;

