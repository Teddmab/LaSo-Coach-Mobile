import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';

interface AuthHeaderProps {
  showLogo?: boolean;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ showLogo = true }) => {
  if (!showLogo) return null;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 100,
  },
});

export default AuthHeader;

