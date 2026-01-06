# 🔧 Fix Crash Google Sign-In sur iOS

## 🚨 Problème

L'application crash sur iOS lorsqu'on clique sur "Continuer avec Google" (connexion ou création de compte).

## 🔍 Cause Identifiée

**REVERSED_CLIENT_ID manquant dans les URL Schemes**

Pour que Google Sign-In fonctionne sur iOS, le SDK Google nécessite que le `REVERSED_CLIENT_ID` du fichier `GoogleService-Info.plist` soit présent dans les `CFBundleURLSchemes` de `Info.plist`.

### Pourquoi c'est nécessaire ?

1. Google Sign-In iOS ouvre Safari ou l'app Google pour l'authentification
2. Après authentification, Google redirige vers l'app via le `REVERSED_CLIENT_ID` comme URL scheme
3. Si le `REVERSED_CLIENT_ID` n'est pas dans les URL schemes, iOS ne peut pas rediriger vers l'app → **CRASH**

## ✅ Solution Appliquée

### 1. Ajout du REVERSED_CLIENT_ID dans `withIOSCrashFix.js`

Le plugin ajoute maintenant automatiquement le `REVERSED_CLIENT_ID` aux URL schemes :

```javascript
const reversedClientId = 'com.googleusercontent.apps.855620848279-2cjfq731f6f8ts6fmicqg2ieumssvcl9';

if (!infoPlist.CFBundleURLTypes) {
  infoPlist.CFBundleURLTypes = [
    {
      CFBundleURLSchemes: ['lasocoach', 'com.laso.coach', reversedClientId],
      CFBundleURLName: 'com.afrotouch.lasocoach',
    },
  ];
}
```

### 2. Ajout du REVERSED_CLIENT_ID dans `withFirebaseConfig.js`

Le plugin lit automatiquement le `REVERSED_CLIENT_ID` depuis `GoogleService-Info.plist` et l'ajoute aux URL schemes :

```javascript
// Lire le REVERSED_CLIENT_ID depuis GoogleService-Info.plist
const plistContent = fs.readFileSync(googleServicePath, 'utf8');
const reversedClientIdMatch = plistContent.match(/<key>REVERSED_CLIENT_ID<\/key>\s*<string>(.*?)<\/string>/);
if (reversedClientIdMatch) {
  reversedClientId = reversedClientIdMatch[1];
  // Ajouter aux URL schemes
}
```

### 3. Reconfiguration avant signIn() sur iOS

Dans `useGoogleAuth.ts`, on reconfigurer le SDK juste avant `signIn()` pour iOS :

```typescript
if (Platform.OS === 'ios') {
  const iosConfig: any = {
    webClientId: firebaseOAuthClientIds.web,
    iosClientId: firebaseOAuthClientIds.ios, // Important pour iOS
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: ['email', 'profile'],
  };
  GoogleSignin.configure(iosConfig);
}
```

### 4. Gestion d'erreurs améliorée

Ajout de gestion d'erreurs spécifique pour iOS pour capturer et logger les erreurs de configuration.

## 📋 Vérifications Requises

### 1. Vérifier que le REVERSED_CLIENT_ID est correct

**Fichier** : `firebase-config/GoogleService-Info.plist`

```xml
<key>REVERSED_CLIENT_ID</key>
<string>com.googleusercontent.apps.855620848279-2cjfq731f6f8ts6fmicqg2ieumssvcl9</string>
```

### 2. Vérifier que les URL Schemes sont configurés

Après un `npx expo prebuild`, vérifier dans `ios/LasoCoach/Info.plist` :

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>lasocoach</string>
      <string>com.laso.coach</string>
      <string>com.googleusercontent.apps.855620848279-2cjfq731f6f8ts6fmicqg2ieumssvcl9</string>
    </array>
  </dict>
</array>
```

### 3. Vérifier la configuration Firebase

**Fichier** : `app.json`

```json
"firebase": {
  "iosClientId": "855620848279-vsqoisa0hfcgb997ni1oubk7fnuk1nms.apps.googleusercontent.com",
  "webClientId": "855620848279-r239q8v3pq6r37156hddd7lrt6j5mfc2.apps.googleusercontent.com"
}
```

## 🔄 Actions Requises

### Pour tester la correction :

1. **Nettoyer le build iOS** :
   ```bash
   rm -rf ios/
   npx expo prebuild --platform ios
   ```

2. **Vérifier Info.plist** :
   ```bash
   grep -A 5 "CFBundleURLSchemes" ios/LasoCoach/Info.plist
   ```
   Le `REVERSED_CLIENT_ID` doit apparaître dans la liste.

3. **Rebuild l'app** :
   ```bash
   npx expo run:ios
   ```

4. **Tester Google Sign-In** :
   - Cliquer sur "Continuer avec Google"
   - L'app ne devrait plus crash
   - L'UI Google devrait s'ouvrir
   - Après sélection du compte, redirection vers l'app

## ⚠️ Notes Importantes

1. **Le REVERSED_CLIENT_ID doit correspondre** au `CLIENT_ID` dans `GoogleService-Info.plist`
2. **Les URL schemes sont sensibles à la casse** - utiliser exactement le même format
3. **Après modification des plugins**, il faut faire un `prebuild` pour que les changements soient appliqués
4. **Le REVERSED_CLIENT_ID** est différent du `iosClientId` dans `app.json` :
   - `iosClientId` : Pour l'authentification Firebase
   - `REVERSED_CLIENT_ID` : Pour la redirection après authentification Google

## 🐛 Debug

Si le problème persiste après ces corrections :

1. **Vérifier les logs** :
   ```bash
   npx expo run:ios --device
   # Regarder les logs pour les erreurs Google Sign-In
   ```

2. **Vérifier Xcode** :
   - Ouvrir `ios/LasoCoach.xcworkspace`
   - Vérifier que `GoogleService-Info.plist` est dans le projet
   - Vérifier que les URL schemes sont présents dans Info.plist

3. **Vérifier Firebase Console** :
   - Le Bundle ID doit correspondre : `com.afrotouch.lasocoach`
   - Le `CLIENT_ID` iOS doit correspondre à celui dans `GoogleService-Info.plist`

## ✅ Résultat Attendu

Après ces corrections :
- ✅ L'app ne crash plus lors du clic sur "Continuer avec Google"
- ✅ L'UI Google s'ouvre correctement
- ✅ Après authentification, redirection vers l'app fonctionne
- ✅ L'authentification Firebase se fait correctement
- ✅ Le backend reçoit les données utilisateur

