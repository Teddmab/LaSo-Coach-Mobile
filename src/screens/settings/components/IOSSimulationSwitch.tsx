import React from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIOSSimulation } from '../../../hooks/useIOSSimulation';

const IOSSimulationSwitch: React.FC = () => {
  const { isIOSSimulationEnabled, isLoading, toggleIOSSimulation } = useIOSSimulation();

  // Ne montrer le switch que sur Android
  if (Platform.OS !== 'android' || isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="phone-portrait-outline" size={24} color="#4CAF50" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Simulation iOS</Text>
          <Text style={styles.subtitle}>
            Aperçu visuel iOS sur Android
          </Text>
        </View>
        <Switch
          value={isIOSSimulationEnabled}
          onValueChange={toggleIOSSimulation}
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor={isIOSSimulationEnabled ? '#FFFFFF' : '#F4F3F4'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#757575',
  },
});

export default IOSSimulationSwitch;

