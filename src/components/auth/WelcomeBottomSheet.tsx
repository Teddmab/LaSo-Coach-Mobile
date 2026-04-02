import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WelcomeBottomSheetProps {
  visible: boolean;
  userName: string;
  onStart: () => void;
}

const WelcomeBottomSheet: React.FC<WelcomeBottomSheetProps> = ({
  visible,
  userName,
  onStart,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Lottie Animation Space */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../../../assets/food.json')}
              autoPlay
              loop={true}
              style={styles.lottieAnimation}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.quoteText}>
              We are what we eat
            </Text>
            <Text style={styles.greeting}>
              Hi <Text style={styles.userName}>{userName}</Text> 👋
            </Text>
            <Text style={styles.description}>
              Prenez soin de votre santé
            </Text>

            {/* Start Button */}
            <TouchableOpacity
              style={styles.startButton}
              onPress={onStart}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary]}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Commencer</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingTop: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
  },
  animationContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  animationPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 24,
    fontStyle: 'italic',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  userName: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  description: {
    fontSize: 18,
    lineHeight: 26,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
    fontWeight: '500',
  },
  startButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WelcomeBottomSheet;

