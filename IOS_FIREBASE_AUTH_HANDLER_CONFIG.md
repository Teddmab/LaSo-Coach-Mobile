# Configuration iOS - Authentification Google avec SDK Natif

## 🎯 Objectif

Pour iOS, l'authentification Google utilise maintenant le **SDK natif Google Sign-In** au lieu d'une WebView pour éviter l'erreur "Unable to process request due to missing initial state" (sessionStorage non disponible dans WebView).

## 🔧 Modifications Apportées

### 1. Passage au SDK Natif sur iOS
- **Ancien** : `useGoogleAuthExpo` (WebView avec expo-auth-session)
- **Nouveau** : `useGoogleAuth` (SDK natif `@react-native-google-signin/google-signin`)
- **Raison** : Firebase Auth handler nécessite `sessionStorage` qui n'est pas disponible dans une WebView React Native

### 2. Build Number
- Mis à jour à **17** dans `app.json`

### 3. Avantages du SDK Natif
- ✅ **Pas de WebView** : Ouvre l'UI native de Google (Safari ou App Google)
- ✅ **Pas de problème sessionStorage** : Pas besoin de Firebase Auth handler
- ✅ **Redirections natives** : Gère correctement les redirections via REVERSED_CLIENT_ID
- ✅ **idToken direct** : Retourne directement l'idToken sans échange supplémentaire
- ✅ **Meilleure UX** : Interface native plus fluide

## ⚠️ Configuration Requise

### Étape 1 : Vérifier REVERSED_CLIENT_ID dans Info.plist

Le SDK natif Google Sign-In nécessite que le `REVERSED_CLIENT_ID` soit présent dans les URL schemes de `Info.plist`. Ceci est automatiquement configuré par le plugin `withIOSCrashFix.js`.

**Vérification** :
1. Exécutez : `npx expo prebuild --platform ios`
2. Vérifiez dans `ios/LasoCoach/Info.plist` que `CFBundleURLSchemes` contient :
   ```xml
   <string>com.googleusercontent.apps.855620848279-2cjfq731f6f8ts6fmicqg2ieumssvcl9</string>
   ```

### Étape 2 : Vérifier les Client IDs dans app.json

Assurez-vous que les Client IDs sont correctement configurés :
- `iosClientId` : Pour le SDK natif iOS
- `webClientId` : Pour Firebase Auth (échange du token)

### Étape 3 : Après les modifications

1. **Sauvegardez** les modifications dans Google Cloud Console
2. **Attendez 1-2 minutes** pour la propagation des changements
3. **Nettoyez le cache Metro** : `npx expo start -c`
4. **Redémarrez** l'application

## 🔍 Comment ça fonctionne

1. L'utilisateur clique sur "Continuer avec Google"
2. Le SDK natif Google Sign-In ouvre l'UI native (Safari ou App Google)
3. L'utilisateur sélectionne son compte Google
4. Google authentifie l'utilisateur et retourne directement l'idToken
5. Le SDK natif capture l'idToken (pas besoin de Firebase Auth handler)
6. L'idToken est utilisé pour se connecter avec Firebase Auth via `loginWithGoogle(idToken)`

**Avantages** :
- Pas de WebView = Pas de problème avec sessionStorage
- UI native plus fluide
- Redirections gérées nativement par iOS via REVERSED_CLIENT_ID

## 📋 Vérifications

### Dans les logs de l'app, vous devriez voir :

```
🍎 [iOS] Utilisation du SDK natif Google Sign-In - UI native, pas de WebView
🔧 Configuration GoogleSignin avec: { webClientId: ..., iosClientId: ..., offlineAccess: true }
✅ Google Sign-In SDK natif configuré
🍎 [iOS] iosClientId configuré: ...
🚀 Lancement de l'authentification Google native...
✅ [iOS] Configuration vérifiée, prêt pour signIn()
✅ idToken reçu: ...
✅ Authentification Firebase réussie
```

### Si vous voyez une erreur de configuration :

1. Vérifiez que `REVERSED_CLIENT_ID` est dans `CFBundleURLSchemes` dans `Info.plist`
2. Vérifiez que `iosClientId` et `webClientId` sont présents dans `app.json`
3. Exécutez `npx expo prebuild --platform ios` pour régénérer `Info.plist`
4. Nettoyez le build : `rm -rf ios/ && npx expo prebuild --platform ios`

## 🚨 Problèmes Connus et Solutions

### Problème : "Unable to process request due to missing initial state"

**Cause** : Firebase Auth handler nécessite `sessionStorage` qui n'est pas disponible dans une WebView React Native

**Solution** : Utiliser le SDK natif Google Sign-In au lieu d'une WebView (déjà implémenté)

### Problème : Crash au démarrage sur iOS

**Cause** : `REVERSED_CLIENT_ID` manquant dans `CFBundleURLSchemes` ou `GoogleService-Info.plist` manquant

**Solution** :
1. Vérifier que `withIOSCrashFix.js` ajoute bien le `REVERSED_CLIENT_ID`
2. Vérifier que `withFirebaseConfig.js` copie bien `GoogleService-Info.plist`
3. Exécuter `npx expo prebuild --platform ios` pour régénérer `Info.plist`

## 📝 Client IDs Actuels

```
Web: 855620848279-r239q8v3pq6r37156hddd7lrt6j5mfc2.apps.googleusercontent.com
Android: 855620848279-urs0dvsvoa45k74uhedk0odosfsfuh28.apps.googleusercontent.com
iOS: 855620848279-vsqoisa0hfcgb997ni1oubk7fnuk1nms.apps.googleusercontent.com
```

## ✅ Checklist de Déploiement

- [ ] REVERSED_CLIENT_ID vérifié dans Info.plist
- [ ] Build number mis à jour à 17
- [ ] Code modifié pour utiliser SDK natif sur iOS (useGoogleAuthHybrid)
- [ ] Testé sur un appareil iOS réel
- [ ] Vérifié que l'authentification fonctionne jusqu'à la fin
- [ ] Vérifié qu'il n'y a plus d'erreur "Unable to process request due to missing initial state"
- [ ] Vérifié que l'UI native de Google s'ouvre correctement

---

**Date de modification** : Version 1.0.6 (Build 17)
**Fichiers modifiés** :
- `src/hooks/useGoogleAuthHybrid.ts` (utilise maintenant SDK natif sur iOS)
- `app.json` (buildNumber: 17)

