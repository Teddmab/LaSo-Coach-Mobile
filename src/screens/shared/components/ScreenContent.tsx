import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, RefreshControl, ViewStyle } from 'react-native';
import { theme } from '../../../constants/theme';

interface ScreenContentProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

const ScreenContent: React.FC<ScreenContentProps> = ({
  children,
  refreshing = false,
  onRefresh,
  contentContainerStyle,
  showsVerticalScrollIndicator = true,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
});

export default ScreenContent;

