# 🚨 Fix Crash Natif iOS (Avant JavaScript)

## Problème

L'application crash au niveau natif iOS **AVANT** même que le JavaScript ne démarre. Sentry JS ne peut pas capturer ces crashes car ils se produisent avant l'initialisation du JavaScript.

## Causes Possibles

### 1. 🔥 GoogleService-Info.plist Manquant ou Incorrect
**Symptôme** : Crash immédiat au lancement (moins d'1 seconde)
**Cause** : Firebase essaie de s'initialiser au niveau natif mais ne trouve pas le fichier

**Vérification** :
- Le fichier `ios/LasoCoach/GoogleService-Info.plist` doit exister
- Il doit être inclus dans le projet Xcode (Target Membership)
- Les valeurs doivent correspondre à celles dans `app.json > extra.firebase`

**Solution** :
1. Vérifier que le fichier existe dans `ios/LasoCoach/`
2. Vérifier qu'il est inclus dans le build (Xcode > Target > Build Phases > Copy Bundle Resources)
3. Vérifier que les valeurs correspondent à Firebase Console

### 2. ⚠️ Permissions iOS Manquantes
**Symptôme** : Crash lors de l'accès à une ressource système
**Cause** : L'app essaie d'accéder à une ressource (caméra, photos, notifications) sans permission

**Solution** : Le plugin `withIOSCrashFix` devrait avoir ajouté toutes les permissions nécessaires dans `Info.plist`

### 3. 🔐 Entitlements Incorrects
**Symptôme** : Crash lors de l'accès à des services Apple (Push Notifications, Associated Domains)
**Cause** : Les entitlements ne correspondent pas au profil de provisioning

**Solution** : Vérifier que les entitlements dans `LasoCoach.entitlements` correspondent au profil de provisioning

### 4. 📦 Module Natif Manquant
**Symptôme** : Crash avec erreur "Unable to load module"
**Cause** : Un module natif requis n'est pas lié correctement

**Solution** : Vérifier que tous les pods sont installés (`pod install`)

## Solutions Appliquées

### 1. Initialisation Sentry Plus Tôt
- Sentry est maintenant initialisé **AVANT** tous les autres imports
- Cela permet de capturer les crashes qui se produisent pendant l'initialisation

### 2. Configuration Sentry Native
- `enableNative: true` - Active le crash handling natif
- `enableNativeCrashHandling: true` - Capture les crashes natifs iOS/Android

### 3. Plugin Sentry Expo
- Le plugin `@sentry/react-native/expo` configure Sentry au niveau natif
- Il ajoute le code nécessaire dans le projet Xcode pour capturer les crashes natifs

## Comment Vérifier

### 1. Vérifier les Logs Xcode
1. Connecter l'iPhone à votre Mac
2. Ouvrir Xcode
3. Window > Devices and Simulators
4. Sélectionner votre iPhone
5. Cliquer sur "Open Console"
6. Filtrer par "Error" ou "FATAL"
7. Lancer l'application et observer les logs

### 2. Vérifier les Crash Reports TestFlight
1. Aller sur App Store Connect
2. Tester > Crashes
3. Vérifier les crash reports récents

### 3. Vérifier Sentry Dashboard
1. Aller sur https://sentry.io
2. Vérifier si des crashes natifs sont capturés
3. Les crashes natifs apparaîtront avec le tag "native"

## Prochaines Étapes

1. **Relancer un build EAS** avec les modifications Sentry
2. **Installer l'app sur iPhone** via TestFlight
3. **Vérifier les crash reports** dans Sentry
4. **Si aucun crash n'apparaît dans Sentry**, le problème est probablement :
   - GoogleService-Info.plist manquant
   - Permissions iOS manquantes
   - Erreur dans le code natif iOS

## Debug Avancé

Si Sentry ne capture toujours pas les crashes :

1. **Vérifier GoogleService-Info.plist** :
   ```bash
   ls -la ios/LasoCoach/GoogleService-Info.plist
   ```

2. **Vérifier les permissions dans Info.plist** :
   ```bash
   grep -A 1 "NSPhotoLibraryUsageDescription" ios/LasoCoach/Info.plist
   ```

3. **Vérifier les entitlements** :
   ```bash
   cat ios/LasoCoach/LasoCoach.entitlements
   ```

4. **Vérifier les logs EAS Build** :
   - Aller sur https://expo.dev
   - Sélectionner le dernier build
   - Examiner les logs "Run fastlane" et "Xcode build"

## Note Importante

Les crashes natifs iOS qui se produisent **avant** l'initialisation du JavaScript peuvent être capturés par Sentry natif, mais seulement si :
1. Le plugin `@sentry/react-native/expo` est correctement configuré
2. Le code natif Sentry est inclus dans le build
3. Les symboles natifs sont disponibles (pour le symbolication)

Si Sentry ne capture toujours pas les crashes, le problème est probablement au niveau du code natif iOS lui-même (GoogleService-Info.plist, permissions, etc.).

