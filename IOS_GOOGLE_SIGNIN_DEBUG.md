# 🐛 Debug Crash Google Sign-In iOS

## 🚨 Problème

L'application crash toujours quand on clique sur "Continuer avec Google" sur iOS.

## 🔍 Étapes de Diagnostic

### 1. Vérifier que le projet iOS est à jour

```bash
# Nettoyer et régénérer le projet iOS
rm -rf ios/
npx expo prebuild --platform ios
```

### 2. Vérifier que REVERSED_CLIENT_ID est dans Info.plist

```bash
# Utiliser le script de vérification
./scripts/verify-ios-google-signin.sh

# Ou vérifier manuellement
grep -A 5 "CFBundleURLSchemes" ios/LasoCoach/Info.plist
```

Le `REVERSED_CLIENT_ID` doit apparaître dans la liste :
```xml
<string>com.googleusercontent.apps.855620848279-2cjfq731f6f8ts6fmicqg2ieumssvcl9</string>
```

### 3. Vérifier les logs lors du crash

Lorsque vous cliquez sur "Continuer avec Google", regardez les logs pour voir :

1. **Si le SDK est configuré** :
   ```
   ✅ Google Sign-In SDK natif configuré
   🍎 [iOS] iosClientId configuré: ...
   ```

2. **Si la configuration échoue** :
   ```
   ❌ [iOS] Configuration Google Sign-In échouée
   ⚠️ [iOS] Vérifiez que REVERSED_CLIENT_ID est dans CFBundleURLSchemes
   ```

3. **Si signIn() est appelé** :
   ```
   🍎 [iOS] Tentative de signIn() avec gestion d'erreurs robuste...
   ```

### 4. Vérifier que GoogleService-Info.plist est présent

```bash
ls -la ios/LasoCoach/GoogleService-Info.plist
```

Le fichier doit exister et contenir le `REVERSED_CLIENT_ID`.

## 🔧 Solutions Possibles

### Solution 1: REVERSED_CLIENT_ID manquant dans Info.plist

**Symptôme** : Crash immédiat au clic, pas de logs JavaScript

**Solution** :
```bash
# 1. Nettoyer le projet
rm -rf ios/

# 2. Vérifier que les plugins sont dans app.json
cat app.json | grep -A 5 "plugins"

# 3. Régénérer le projet
npx expo prebuild --platform ios

# 4. Vérifier Info.plist
grep -A 10 "CFBundleURLSchemes" ios/LasoCoach/Info.plist
```

### Solution 2: SDK non configuré au moment du clic

**Symptôme** : Le bouton est cliquable mais le SDK n'est pas encore configuré

**Solution** : Le code a été amélioré pour :
- Configurer le SDK immédiatement sur iOS (pas de délai)
- Désactiver le bouton tant que `isConfigured === false`
- Vérifier la configuration avant `signIn()`

### Solution 3: Crash au niveau natif avant JavaScript

**Symptôme** : Crash immédiat, aucun log JavaScript

**Cause possible** : Le SDK Google Sign-In iOS crash au niveau natif si :
- `REVERSED_CLIENT_ID` n'est pas dans `CFBundleURLSchemes`
- `GoogleService-Info.plist` est manquant ou corrompu
- Configuration incorrecte du SDK

**Solution** :
1. Vérifier que `GoogleService-Info.plist` est dans le bundle Xcode
2. Vérifier que `REVERSED_CLIENT_ID` est dans `Info.plist`
3. Vérifier que les plugins sont correctement exécutés

### Solution 4: Problème de version du SDK

**Symptôme** : Crash avec erreur de version

**Solution** : Vérifier la compatibilité des versions :
```json
{
  "@react-native-google-signin/google-signin": "^16.0.0",
  "react-native": "0.81.5",
  "expo": "~54.0.30"
}
```

## 📋 Checklist de Vérification

- [ ] Le projet iOS a été régénéré avec `npx expo prebuild --platform ios`
- [ ] `REVERSED_CLIENT_ID` est présent dans `ios/LasoCoach/Info.plist`
- [ ] `REVERSED_CLIENT_ID` est dans `CFBundleURLSchemes`
- [ ] `GoogleService-Info.plist` est présent dans `ios/LasoCoach/`
- [ ] Les plugins `withIOSCrashFix.js` et `withFirebaseConfig.js` sont dans `app.json`
- [ ] Le SDK est configuré (voir les logs)
- [ ] Le bouton est désactivé tant que `isConfigured === false`

## 🔍 Logs à Surveiller

### Logs de configuration réussie :
```
🔧 Configuration GoogleSignin avec: ...
✅ Google Sign-In SDK natif configuré
🍎 [iOS] iosClientId configuré: ...
🍎 [iOS] SDK prêt pour signIn()
```

### Logs avant signIn() :
```
🍎 [iOS] Vérification de la configuration avant signIn()...
✅ [iOS] Configuration vérifiée, prêt pour signIn()
✅ [iOS] webClientId présent: true
✅ [iOS] iosClientId présent: true
🍎 [iOS] Tentative de signIn() avec gestion d'erreurs robuste...
```

### Logs d'erreur :
```
❌ [iOS] Configuration Google Sign-In échouée
⚠️ [iOS] Vérifiez que REVERSED_CLIENT_ID est dans CFBundleURLSchemes
```

## 🚀 Commandes de Test

```bash
# 1. Nettoyer et régénérer
rm -rf ios/
npx expo prebuild --platform ios

# 2. Vérifier la configuration
./scripts/verify-ios-google-signin.sh

# 3. Build et run
npx expo run:ios

# 4. Surveiller les logs
# Dans un autre terminal:
npx expo start --ios
```

## 📝 Notes Importantes

1. **Le REVERSED_CLIENT_ID doit être exactement le même** dans :
   - `firebase-config/GoogleService-Info.plist`
   - `ios/LasoCoach/Info.plist` (après prebuild)
   - `plugins/withIOSCrashFix.js`

2. **Après modification des plugins**, il faut toujours faire un `prebuild` pour que les changements soient appliqués.

3. **Le SDK doit être configuré AVANT** que `signIn()` soit appelé, sinon crash au niveau natif.

4. **Le bouton est automatiquement désactivé** tant que `isConfigured === false` grâce à `isAvailable` dans le hook.

## 🆘 Si le Problème Persiste

1. **Vérifier Xcode** :
   - Ouvrir `ios/LasoCoach.xcworkspace`
   - Vérifier que `GoogleService-Info.plist` est dans le projet
   - Vérifier que les URL schemes sont dans `Info.plist`

2. **Vérifier Firebase Console** :
   - Bundle ID : `com.afrotouch.lasocoach`
   - `CLIENT_ID` iOS doit correspondre
   - `REVERSED_CLIENT_ID` doit être présent

3. **Vérifier les logs natifs** :
   - Ouvrir Xcode
   - Aller dans Window > Devices and Simulators
   - Sélectionner l'app et voir les logs de crash

4. **Tester avec un projet minimal** :
   - Créer un nouveau projet Expo
   - Ajouter Google Sign-In
   - Comparer les configurations

