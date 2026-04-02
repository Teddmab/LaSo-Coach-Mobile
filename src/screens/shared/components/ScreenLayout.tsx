import React, { ReactNode } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { theme } from '../../../constants/theme';

interface ScreenLayoutProps {
  children: ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  showSafeArea?: boolean;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  backgroundColor = theme.colors.background,
  statusBarStyle = 'dark-content',
  showSafeArea = true,
}) => {
  const content = (
    <>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {children}
    </>
  );

  if (showSafeArea) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {content}
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenLayout;

