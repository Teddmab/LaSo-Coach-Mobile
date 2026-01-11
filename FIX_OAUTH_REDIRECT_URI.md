# 🔧 Fix : Erreur OAuth 2.0 - redirect_uri invalide

## ❌ Erreur actuelle
```
Error 400: invalid_request
redirect_uri=lasocoach://
```

## 🔍 Cause du problème

Google OAuth ne permet **PAS** les custom schemes (`lasocoach://`) comme redirect URIs pour les **clients OAuth Web**. 

Votre application utilise :
- **iOS** : `useGoogleAuthExpo` avec proxy Expo → devrait utiliser `https://auth.expo.io/@ohriginal-llc/laso-coach`
- **Android** : `useGoogleAuth` avec SDK natif → utilise le Web Client ID

## ✅ Solution : Configurer les Redirect URIs dans Google Cloud Console

### Étape 1 : Accéder à Google Cloud Console

1. Allez sur : https://console.cloud.google.com/apis/credentials
2. Sélectionnez le projet : `lasocoach-39710`
3. Trouvez le **"Client ID for Web application"** (ID se terminant par `...r239q8v3pq6r37156hddd7lrt6j5mfc2`)

### Étape 2 : Ajouter le Redirect URI pour Expo Go (Développement)

Dans la section **"Authorized redirect URIs"**, ajoutez **EXACTEMENT** :

```
https://auth.expo.io/@ohriginal-llc/laso-coach
```

⚠️ **IMPORTANT** :
- ❌ PAS de slash à la fin : `https://auth.expo.io/@ohriginal-llc/laso-coach/` (FAUX)
- ❌ PAS de majuscules : `https://auth.expo.io/@Ohriginal-llc/laso-coach` (FAUX)
- ✅ EXACTEMENT : `https://auth.expo.io/@ohriginal-llc/laso-coach` (CORRECT)

### Étape 3 : Vérifier le Client Android (pour builds standalone)

1. Trouvez le **"Client ID for Android application"** (ID se terminant par `...urs0dvsvoa45k74uhedk0odosfsfuh28`)
2. Vérifiez que le **Package name** est : `com.afrotouch.lasocoach`
3. Si vous utilisez des custom schemes pour Android standalone, vous pouvez ajouter dans "Authorized redirect URIs" :
   ```
   lasocoach://auth
   ```

### Étape 4 : Vérifier le Client iOS (pour builds standalone)

1. Trouvez le **"Client ID for iOS application"** (ID se terminant par `...vsqoisa0hfcgb997ni1oubk7fnuk1nms`)
2. Vérifiez que le **Bundle ID** est : `com.afrotouch.lasocoach`

### Étape 5 : Publier l'écran de consentement OAuth

1. Allez sur : https://console.cloud.google.com/apis/credentials/consent
2. Vérifiez que l'écran de consentement est **"Published"** (pas "Testing")
3. Si en mode "Testing", ajoutez votre email (`moisekapend1290@gmail.com`) aux utilisateurs de test

### Étape 6 : Attendre la propagation

- ⏱️ Attendez **2-3 minutes** après avoir sauvegardé les changements
- Les changements dans Google Cloud Console peuvent prendre quelques minutes pour se propager

### Étape 7 : Redémarrer l'application

```bash
# Nettoyer le cache Metro
npx expo start -c

# Ou redémarrer complètement
# Fermez l'app et relancez-la
```

## 📋 Checklist de vérification

- [ ] Redirect URI `https://auth.expo.io/@ohriginal-llc/laso-coach` ajouté au Web Client
- [ ] Pas de slash à la fin du redirect URI
- [ ] Écran de consentement OAuth publié (ou votre email dans les test users)
- [ ] Attendu 2-3 minutes après les changements
- [ ] Cache Metro nettoyé (`npx expo start -c`)
- [ ] Application redémarrée

## 🔍 Vérification dans les logs

Quand vous testez la connexion Google, vous devriez voir dans les logs :

```
🌐 [iOS] Redirect URI (proxy Expo): https://auth.expo.io/@ohriginal-llc/laso-coach
```

Si vous voyez `lasocoach://` dans les logs, cela signifie que le proxy Expo n'est pas utilisé correctement.

## 🆘 Si le problème persiste

1. **Vérifiez les logs** pour voir quel redirect URI est réellement utilisé
2. **Vérifiez que vous utilisez le bon Client ID** :
   - Expo Go → Web Client ID
   - Build standalone iOS → iOS Client ID
   - Build standalone Android → Android Client ID
3. **Vérifiez l'écran de consentement OAuth** est publié ou votre email est dans les test users
4. **Vérifiez qu'il n'y a pas d'espaces cachés** dans le redirect URI dans Google Cloud Console

## 📝 Notes importantes

- Les custom schemes (`lasocoach://`) ne fonctionnent **PAS** avec les clients OAuth Web
- Pour Expo Go, vous **DEVEZ** utiliser le proxy Expo avec l'URL HTTPS
- Pour les builds standalone, utilisez les clients Android/iOS appropriés

