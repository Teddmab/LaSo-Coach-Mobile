import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import FixedLayout from '../components/FixedLayout';

interface WebViewScreenProps {
  url: string;
  title: string;
  onClose: () => void;
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  avatarSource?: any;
  avatarFallbackText?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const WebViewScreen: React.FC<WebViewScreenProps> = ({
  url,
  title,
  onClose,
  activeTab,
  onTabPress,
  avatarSource,
  avatarFallbackText,
  showBackButton = false,
  onBackPress,
}) => {
  const [loading, setLoading] = React.useState(true);

  return (
    <FixedLayout
      headerTitle={title}
      activeTab={activeTab}
      onTabPress={onTabPress}
      onHelpPress={() => {}}
      onNotificationPress={() => {}}
      onProfilePress={() => {}}
      avatarSource={avatarSource}
      avatarFallbackText={avatarFallbackText}
      showBackButton={showBackButton}
      onBackPress={onBackPress}
    >
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setLoading(false);
          }}
        />
      </View>
    </FixedLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
});

export default WebViewScreen;

