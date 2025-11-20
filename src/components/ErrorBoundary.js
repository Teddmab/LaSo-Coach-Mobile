import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import firebaseAuthService from '../services/firebaseAuthServiceNew';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('🚨 Error info:', errorInfo);
    
    // Check if it's an animation/transform error
    if (error.message?.includes('Transform') || error.message?.includes('invariant')) {
      console.log('🎭 Animation error detected - attempting to recover...');
      // For animation errors, we can try to recover by resetting state
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 1000);
      return;
    }
    
    // Check if it's a network/API error that should be handled by components
    if (error.message?.includes('Network Error') || 
        error.message?.includes('Request failed') ||
        error.message?.includes('status code')) {
      console.log('🌐 Network/API error detected - letting components handle it');
      // Don't show error boundary for network errors
      return;
    }
    
    // For other errors, set the error state
    this.setState({ hasError: true, error });
  }

  handleRetry = async () => {
    console.log('🔄 ErrorBoundary: Retry triggered - rechecking auth state');
    
    try {
      // Manually trigger Firebase auth state check
      // This ensures the auth listener in AuthProvider picks up the current Firebase user
      // even if no state change event was fired
      await firebaseAuthService.ensureAuth();
      
      // Get the current Firebase auth instance
      const auth = firebaseAuthService.getAuth();
      if (auth?.currentUser) {
        console.log('✅ ErrorBoundary: Firebase user found, auth state will be restored');
        // The auth state listener should pick this up automatically
        // If not, we can manually trigger it by accessing the current user
        const currentUser = firebaseAuthService.getCurrentUser();
        if (!currentUser) {
          // Force a profile fetch which will trigger the listener
          console.log('🔄 ErrorBoundary: Fetching user profile to restore state');
          await firebaseAuthService.getUserProfile();
        }
      } else {
        console.log('ℹ️ ErrorBoundary: No Firebase user found');
      }
    } catch (error) {
      console.error('⚠️ ErrorBoundary: Error checking auth on retry:', error);
      // Continue with retry anyway
    }
    
    // Clear error state to allow components to re-render
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Check if it's an animation error that we can recover from
      if (this.state.error?.message?.includes('Transform') || this.state.error?.message?.includes('invariant')) {
        // For animation errors, show a minimal recovery UI
        return (
          <View style={styles.recoveryContainer}>
            <Text style={styles.recoveryText}>Chargement...</Text>
          </View>
        );
      }

      // For other errors, show the full error UI
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Oups ! Quelque chose s'est mal passé</Text>
          <Text style={styles.errorMessage}>
            Une erreur inattendue s'est produite. Veuillez réessayer.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  recoveryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  recoveryText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
