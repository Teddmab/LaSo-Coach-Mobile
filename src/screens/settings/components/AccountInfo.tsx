import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';
import { SecurityInfo } from '../types';

interface AccountInfoProps {
  email: string;
  securityInfo: SecurityInfo;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ email, securityInfo }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Email: {email || '—'}</Text>
      <Text style={styles.text}>Dernière connexion: {securityInfo.lastLogin}</Text>
      <Text style={styles.text}>Dernier changement de mot de passe: {securityInfo.lastPasswordChange}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  text: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
});

export default AccountInfo;

