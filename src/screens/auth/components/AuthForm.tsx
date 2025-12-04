import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';

interface AuthFormProps {
  children: React.ReactNode;
}

const AuthForm: React.FC<AuthFormProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AuthForm;

