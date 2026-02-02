import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoutSectionProps {
  onLogout: () => void;
}

const LogoutSection: React.FC<LogoutSectionProps> = ({ onLogout }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={onLogout}>
        <View style={styles.icon}>
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
        </View>
        <Text style={styles.title}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'android' ? -2 : 20,
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'android' ? 20 : 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#F44336',
  },
});

export default LogoutSection;

