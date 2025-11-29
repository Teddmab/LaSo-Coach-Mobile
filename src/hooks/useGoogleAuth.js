import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { firebaseOAuthClientIds } from '../config/firebaseApp';
// Debug: log raw client IDs early to confirm availability before constructing request
console.log('🧪 Raw firebaseOAuthClientIds at import time:', firebaseOAuthClientIds);
import { useAuth } from '../context/FirebaseAuthContext';

// CRITICAL: This must be called to complete the OAuth session when using Expo's proxy
// It handles the redirect back from auth.expo.io to the app
WebBrowser.maybeCompleteAuthSession();

/**
 * Hook to initiate Google sign-in using Expo AuthSession providers.
 * Returns a function to trigger the flow and helpers for availability/loading.
 */
export const useGoogleAuth = () => {
  const { loginWithGoogle } = useAuth();
  const [isPrompting, setIsPrompting] = useState(false);

  // Environment detection
  const appOwnership = Constants.appOwnership; // 'expo' (Expo Go), 'guest' (dev client), 'standalone'
  const isExpoGo = appOwnership === 'expo';
  const isNativeLike = appOwnership === 'guest' || appOwnership === 'standalone';
  
  // Log app ownership to verify which app is running
  console.log('🔍 App Ownership Detection:', {
    appOwnership,
    isExpoGo,
    isNativeLike,
    message: isExpoGo 
      ? '⚠️ Using Expo Go - OAuth may have issues. Use development build for reliable OAuth.' 
      : '✅ Using Development Build or Standalone - OAuth should work reliably!'
  });

  // Redirect strategy
  // - Expo Go: Use Expo proxy URL: https://auth.expo.io/@owner/slug
  // - Dev Client / Standalone: custom scheme, native client ID, no proxy.
  let redirectUri;
  if (isExpoGo) {
    // For Expo Go, manually construct the proxy URL to ensure it matches Google Cloud Console
    // Format: https://auth.expo.io/@owner/slug
    // Try multiple sources for owner and slug
    const expoConfig = Constants.expoConfig;
    const manifest2 = Constants.manifest2;
    const owner = expoConfig?.owner || manifest2?.extra?.expoClient?.owner || manifest2?.owner;
    const slug = expoConfig?.slug || manifest2?.extra?.expoClient?.slug || manifest2?.slug;
    
    console.log('🔍 Expo config check:', { 
      hasExpoConfig: !!expoConfig, 
      hasManifest2: !!manifest2,
      owner, 
      slug,
      expoConfigOwner: expoConfig?.owner,
      expoConfigSlug: expoConfig?.slug
    });
    
    if (owner && slug) {
      redirectUri = `https://auth.expo.io/@${owner}/${slug}`;
      console.log('✅ Constructed Expo proxy redirect URI:', redirectUri);
    } else {
      // Fallback: try makeRedirectUri with useProxy
      const fallbackUri = AuthSession.makeRedirectUri({ useProxy: true });
      // If fallback gives us exp://, manually construct from app.json values
      if (fallbackUri.startsWith('exp://')) {
        // Hardcode from app.json as last resort
        redirectUri = 'https://auth.expo.io/@teddmabulay/laso-coach';
        console.warn('⚠️ Using hardcoded redirect URI as fallback:', redirectUri);
      } else {
        redirectUri = fallbackUri;
        console.log('✅ Using makeRedirectUri result:', redirectUri);
      }
    }
  } else {
    // For standalone/dev client, use custom scheme
    redirectUri = AuthSession.makeRedirectUri({ scheme: 'lasocoach' }); // e.g. lasocoach://auth
  }

  console.log('🧭 AuthSession environment', { appOwnership, isExpoGo, isNativeLike, redirectUri });

  // Build request config: ALWAYS include platform client ID if available to satisfy provider invariants.
  // CRITICAL: When using Expo Go with useProxy, the hook requires platform client IDs to be present,
  // but the actual OAuth flow will use the Web client ID (via webClientId/expoClientId) because of useProxy.
  // The redirect URI is registered under the Web client, so the proxy uses Web client ID for the OAuth request.
  
  // Get client IDs with fallbacks
  const webClientId = firebaseOAuthClientIds.web;
  
  // CRITICAL FIX: When using Expo Go with proxy, the hook uses the platform client ID to build the OAuth URL.
  // But the redirect URI is registered under the Web client. So we MUST use Web client ID for platform IDs too.
  // For standalone/dev client, use the actual platform client IDs.
  let androidClientId, iosClientId;
  if (isExpoGo) {
    // Expo Go with proxy: Use Web client ID for everything (redirect URI is registered there)
    androidClientId = webClientId;
    iosClientId = webClientId;
    console.log('🔑 Expo Go mode: Using Web client ID for all client IDs (proxy mode)');
    console.log('🔑 Web client ID:', webClientId);
  } else {
    // Standalone/dev client: Use platform-specific client IDs
    androidClientId = firebaseOAuthClientIds.android || webClientId;
    iosClientId = firebaseOAuthClientIds.ios || webClientId;
    console.log('🔑 Standalone/dev client mode: Using platform-specific client IDs');
  }
  
  // Build config object - include all client IDs directly (hook validates them)
  const authRequestConfig = { 
    scopes: ['openid', 'email', 'profile'],
    // Explicitly set redirectUri - this is critical for matching Google Cloud Console config
    // For Expo Go, this should be https://auth.expo.io/@owner/slug
    // For standalone/dev client, this should be lasocoach://auth
    redirectUri,
    // Always set Web client ID - this is what gets used when useProxy: true
    webClientId: webClientId,
    expoClientId: webClientId,
    // Platform client IDs - for Expo Go, these are set to Web client ID to match redirect URI
    androidClientId: androidClientId,
    iosClientId: iosClientId,
  };

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    ...authRequestConfig,
    // Force account selection and consent screen to always show account picker
    // 'select_account' forces Google to show account picker even if user is logged in
    // 'consent' forces consent screen to appear
    prompt: 'select_account consent'
  });

  console.log('🔐 Google auth redirect URI (configured):', redirectUri);
  console.log('🔐 Google auth redirect URI (request object):', request?.redirectUri);
  
  // Verify redirect URI format for Expo Go
  if (isExpoGo && redirectUri) {
    const expectedFormat = 'https://auth.expo.io/@';
    if (!redirectUri.startsWith(expectedFormat)) {
      console.warn('⚠️ WARNING: Expo Go redirect URI should start with', expectedFormat);
      console.warn('   Actual redirect URI:', redirectUri);
      console.warn('   Expected format: https://auth.expo.io/@owner/slug');
    } else {
      console.log('✅ Redirect URI format is correct for Expo Go');
    }
  }
  
  if (request?.redirectUri && request.redirectUri !== redirectUri) {
    console.log('⚠️ CRITICAL MISMATCH: request.redirectUri differs from configured!');
    console.log('   Configured:', redirectUri);
    console.log('   Request has:', request.redirectUri);
    console.log('   ⚠️ This mismatch may cause redirect_uri_mismatch error!');
  }
  console.log('🔐 Google client IDs (effective):', {
    appOwnership,
    webClientId: authRequestConfig.webClientId,
    expoClientId: authRequestConfig.expoClientId,
    androidClientId: authRequestConfig.androidClientId,
    iosClientId: authRequestConfig.iosClientId,
    platform: Platform.OS,
  });

  const signInWithGoogle = useCallback(async () => {
    const missingClientId = Platform.select({
      ios: !firebaseOAuthClientIds.ios,
      android: !firebaseOAuthClientIds.android,
      default: !firebaseOAuthClientIds.web,
    });

    if (missingClientId) {
      return {
        user: null,
        error: "Connexion Google indisponible. Identifiants OAuth manquants pour cette plateforme.",
      };
    }

    if (!request) {
      return {
        user: null,
        error: 'Configuration Google en cours. Veuillez réessayer dans un instant.',
      };
    }

    try {
      setIsPrompting(true);
      // Log full request object to see what's being sent
      console.log('🚀 Google sign-in starting with config:', {
        useProxy: isExpoGo,
        redirectUri,
        requestRedirectUri: request?.redirectUri,
        requestUrl: request?.url,
        requestParams: request?.params,
        clientIds: {
          android: authRequestConfig.androidClientId,
          ios: authRequestConfig.iosClientId,
          web: authRequestConfig.webClientId,
          expo: authRequestConfig.expoClientId,
        }
      });
      
      // Log the full OAuth URL to see what redirect_uri is being sent
      if (request?.url) {
        try {
          const urlObj = new URL(request.url);
          const redirectParam = urlObj.searchParams.get('redirect_uri');
          const redirectParamDecoded = redirectParam ? decodeURIComponent(redirectParam) : null;
          console.log('🔍 OAuth URL redirect_uri parameter (encoded):', redirectParam);
          console.log('🔍 OAuth URL redirect_uri parameter (decoded):', redirectParamDecoded);
          console.log('🔍 Expected redirect URI:', redirectUri);
          console.log('🔍 Match check:', redirectParamDecoded === redirectUri ? '✅ MATCH' : '❌ MISMATCH');
          if (redirectParamDecoded !== redirectUri) {
            console.error('❌ CRITICAL: redirect_uri in OAuth URL does not match expected!');
            console.error('   Expected:', redirectUri);
            console.error('   Actual (decoded):', redirectParamDecoded);
            console.error('   Actual (encoded):', redirectParam);
          }
          // Log full URL (truncated for readability)
          const fullUrl = request.url;
          console.log('🔍 Full OAuth URL length:', fullUrl.length);
          console.log('🔍 Full OAuth URL (first 300 chars):', fullUrl.substring(0, 300));
          if (fullUrl.length > 300) {
            console.log('🔍 Full OAuth URL (last 200 chars):', '...' + fullUrl.substring(fullUrl.length - 200));
          }
        } catch (e) {
          console.error('⚠️ Could not parse OAuth URL:', e.message);
          console.error('   URL:', request.url);
        }
      } else {
        console.error('❌ No request.url found!');
      }
      
      // Use the redirect URI from the request object (it's the authoritative one)
      // When useProxy is true, Expo handles the redirect URI automatically
      const effectiveRedirectUri = request?.redirectUri || redirectUri;
      console.log('🔗 Using redirect URI:', effectiveRedirectUri);
      console.log('🔗 Request redirect URI:', request?.redirectUri);
      console.log('🔗 Configured redirect URI:', redirectUri);
      
      // CRITICAL: For Expo Go, we MUST ensure the redirect URI matches Google Cloud Console
      // If request.redirectUri doesn't match our configured one, we need to fix it
      if (isExpoGo && request?.redirectUri && request.redirectUri !== redirectUri) {
        console.error('❌ MISMATCH DETECTED! Request redirect URI does not match configured URI!');
        console.error('   Configured (should be in Google Console):', redirectUri);
        console.error('   Request has (will be sent to Google):', request.redirectUri);
        console.error('   This will cause redirect_uri_mismatch error!');
      }
      
      // For Expo Go with useProxy, don't pass redirectUri to promptAsync
      // The request object already has the correct redirect URI from useIdTokenAuthRequest
      // For standalone/dev client, explicitly pass the redirectUri
      console.log('⏳ Waiting for OAuth response from promptAsync...');
      console.log('🌐 Opening browser/webview for Google OAuth...');
      console.log('   URL:', request?.url?.substring(0, 200) + '...');
      console.log('   This should open a browser showing Google account picker');
      
      const result = await promptAsync({
        useProxy: isExpoGo, // proxy only in Expo Go
        // When using proxy, the redirect URI is already set in the request object
        // When not using proxy, we need to explicitly pass it
        ...(isExpoGo ? {} : { redirectUri: effectiveRedirectUri }),
        // Additional options to ensure browser opens and shows account picker
        showInRecents: true, // Keep browser in recent apps
      });
      
      console.log('🌐 Browser/webview closed, processing OAuth result...');
      
      // Log full result - use console.error to ensure it's not filtered
      console.error('📬 Google OAuth result received:', JSON.stringify({
        type: result.type,
        error: result.params?.error,
        error_description: result.params?.error_description,
        error_uri: result.params?.error_uri,
        hasIdToken: !!result.params?.id_token,
        hasCode: !!result.params?.code,
        allParams: result.params,
        url: result.url,
      }, null, 2));
      
      // Also log to console.log (in case error is filtered)
      console.log('📬 Google OAuth result:', {
        type: result.type,
        hasIdToken: !!result.params?.id_token,
        hasCode: !!result.params?.code,
        error: result.params?.error,
      });
      
      // Also log to console.error to ensure it's not filtered
      if (result.type !== 'success') {
        console.error('❌ OAuth Error Details:', {
          type: result.type,
          error: result.params?.error,
          error_description: result.params?.error_description,
          error_uri: result.params?.error_uri,
          fullParams: result.params,
          url: result.url,
        });
      } else {
        console.log('✅ OAuth Success - Processing response...');
        console.log('   Has id_token:', !!result.params?.id_token);
        console.log('   Has code:', !!result.params?.code);
        console.log('   Params keys:', result.params ? Object.keys(result.params) : 'none');
      }

      if (result.type === 'success' && result.params?.id_token) {
        console.log('✅ OAuth successful, calling loginWithGoogle with id_token');
        return await loginWithGoogle(result.params.id_token);
      }

      if (result.type === 'cancel') {
        return { user: null, error: 'Connexion Google annulée.' };
      }

      // Handle 'dismiss' type - this often happens when Expo proxy can't complete the handshake
      if (result.type === 'dismiss') {
        console.error('❌ OAuth dismissed - Expo proxy may have failed to complete handshake');
        console.error('   This usually means the app lost focus or the redirect failed');
        console.error('   Result params:', result.params);
        console.error('   ⚠️ CRITICAL: If you see this error, you are likely using Expo Go!');
        console.error('   ⚠️ Expo Go has known issues with OAuth redirects.');
        console.error('   ✅ SOLUTION: Use Development Client instead of Expo Go!');
        console.error('   📱 Check appOwnership in logs - should be "guest" for dev client, not "expo"');
        const errorMessage = isExpoGo 
          ? 'Erreur OAuth: Vous utilisez Expo Go qui a des problèmes avec l\'authentification Google.\n\n' +
            '✅ SOLUTION: Utilisez le Development Client à la place.\n\n' +
            '1. Attendez que le build Android se termine\n' +
            '2. Installez l\'APK du development client (pas Expo Go)\n' +
            '3. Ouvrez le development client (icône de votre app, pas le logo Expo)\n' +
            '4. L\'authentification Google fonctionnera correctement'
          : 'La connexion a été interrompue. Veuillez réessayer. Si le problème persiste, vérifiez votre connexion internet.';
        return { 
          user: null, 
          error: errorMessage
        };
      }

      let errorMessage =
        result.params?.error_description ||
        result.params?.error ||
        'Impossible de se connecter avec Google.';

      // Provide richer hints for redirect_uri_mismatch
      if (result.params?.error === 'redirect_uri_mismatch') {
        const actualRedirectUri = request?.redirectUri || redirectUri;
        errorMessage = `Erreur de configuration OAuth: Le redirect URI ne correspond pas.\n\n`;
        errorMessage += `Redirect URI utilisé: ${actualRedirectUri}\n\n`;
        errorMessage += `Vérifiez dans Google Cloud Console:\n`;
        errorMessage += `1. Allez sur https://console.cloud.google.com/apis/credentials\n`;
        errorMessage += `2. Ouvrez le client Web OAuth (ID: ...${firebaseOAuthClientIds.web?.slice(-20)})\n`;
        errorMessage += `3. Dans "Authorized redirect URIs", ajoutez EXACTEMENT:\n`;
        errorMessage += `   ${actualRedirectUri}\n\n`;
        errorMessage += `⚠️ Important: Pas de slash final, respecter la casse exacte.`;
      } else if (result.params?.error === 'invalid_request') {
        errorMessage += ' (Vérifiez redirect URI / client ID / consent screen publication)';
      }
      if (isExpoGo && request?.redirectUri && !request.redirectUri.startsWith('https://auth.expo.io')) {
        errorMessage += ' - Redirect proxy non https; vérifier expo start et absence de dev client.';
      }

      return { user: null, error: errorMessage };
    } catch (error) {
      let msg = error?.message || 'Impossible de se connecter avec Google.';
      if (msg.includes('redirect_uri_mismatch')) {
        const actualRedirectUri = request?.redirectUri || redirectUri;
        msg = `Erreur de configuration OAuth: Le redirect URI ne correspond pas.\n\n`;
        msg += `Redirect URI utilisé: ${actualRedirectUri}\n\n`;
        msg += `Vérifiez dans Google Cloud Console:\n`;
        msg += `1. Allez sur https://console.cloud.google.com/apis/credentials\n`;
        msg += `2. Ouvrez le client Web OAuth (ID: ...${firebaseOAuthClientIds.web?.slice(-20)})\n`;
        msg += `3. Dans "Authorized redirect URIs", ajoutez EXACTEMENT:\n`;
        msg += `   ${actualRedirectUri}\n\n`;
        msg += `⚠️ Important: Pas de slash final, respecter la casse exacte.`;
      } else if (msg.includes('invalid_request')) {
        const actualRedirectUri = request?.redirectUri || redirectUri;
        msg += ` Vérifiez que le client Web inclut le redirect ${actualRedirectUri} et que la consent screen est publiée.`;
      }
      return {
        user: null,
        error: msg,
      };
    } finally {
      setIsPrompting(false);
    }
  }, [loginWithGoogle, promptAsync, request, isExpoGo, redirectUri]);

  return {
    signInWithGoogle,
    isAvailable:
      !!request &&
      !!Platform.select({
        ios: firebaseOAuthClientIds.ios,
        android: firebaseOAuthClientIds.android,
        default: firebaseOAuthClientIds.web,
      }),
    isPrompting,
  };
};

export default useGoogleAuth;

