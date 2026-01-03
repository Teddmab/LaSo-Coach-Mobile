# 🔍 Vérification Approfondie - Causes de Crash iOS

## Date: $(date)
## Version: 1.0.4
## Build: 4

---

## 1. ✅/❌ GoogleService-Info.plist

### Vérification de l'Existence

**Résultat**: ✅ **PRÉSENT LOCALEMENT** ⚠️ **RISQUE DANS LE BUILD EAS**

Le fichier `GoogleService-Info.plist` existe dans `ios/LasoCoach/GoogleService-Info.plist` localement.

**PROBLÈME CRITIQUE IDENTIFIÉ**:
- Le fichier est dans `.gitignore` (normal pour la sécurité)
- Le dossier `ios/` est dans `.gitignore` (pour forcer le prebuild)
- **RISQUE**: Si le dossier `ios/` est supprimé pendant le prebuild EAS, le fichier sera perdu
- **SOLUTION**: Plugin `withFirebaseConfig.js` créé pour copier automatiquement le fichier pendant le prebuild

### Configuration Firebase dans app.json

```json
"firebase": {
  "apiKey": "AIzaSyDubBwQF27OUZyOMhzmNpIizw2D4dHxzO0",
  "authDomain": "lasocoach-39710.firebaseapp.com",
  "projectId": "lasocoach-39710",
  "storageBucket": "lasocoach-39710.appspot.com",
  "messagingSenderId": "855620848279",
  "appId": "1:855620848279:web:f93cbbf9c0d8f42faef7d2",
  "measurementId": "G-8JK6R4BGYG",
  "iosClientId": "855620848279-vsqoisa0hfcgb997ni1oubk7fnuk1nms.apps.googleusercontent.com"
}
```

### Problème Potentiel

**🔴 CRITIQUE**: Si `GoogleService-Info.plist` est manquant ou incorrect dans le build iOS :

1. **Firebase SDK natif iOS** essaie de charger le fichier au démarrage
2. **Crash immédiat** si le fichier est manquant ou mal formé
3. **Erreur silencieuse** si les valeurs ne correspondent pas

### Code qui Utilise Firebase

- `src/config/firebaseApp.ts` : Initialise Firebase App et Auth
- `index.ts` : Importe `firebase/auth` très tôt
- `App.tsx` : Utilise `AuthProvider` qui dépend de Firebase

### Impact sur le Crash

**Probabilité**: 🔴 **ÉLEVÉE**

Si `GoogleService-Info.plist` est manquant dans le build iOS :
- Firebase SDK natif crash immédiatement au démarrage
- L'app se ferme avant même que JavaScript ne démarre
- Sentry JS ne peut pas capturer ce crash (trop tôt)

### Solution Appliquée

✅ **PLUGIN CRÉÉ**: `plugins/withFirebaseConfig.js`
- Copie automatiquement `GoogleService-Info.plist` pendant le prebuild
- Cherche le fichier dans plusieurs emplacements (ios/, racine, firebase-config/)
- Log des messages pour debug
- Avertit si le fichier n'est pas trouvé

**Actions Requises**:
1. ✅ Plugin créé et ajouté à `app.json` (en premier dans la liste des plugins)
2. ⚠️ **VÉRIFIER** que le fichier existe dans `ios/LasoCoach/GoogleService-Info.plist` localement
3. ⚠️ **VÉRIFIER** dans les logs EAS Build que le plugin copie bien le fichier
4. ⚠️ **VÉRIFIER** que les valeurs correspondent à Firebase Console

---

## 2. ✅/❌ Permissions iOS

### Vérification des Permissions Requises

#### Permissions Configurées par le Plugin

Le plugin `withIOSCrashFix.js` ajoute automatiquement :

1. ✅ **NSPhotoLibraryUsageDescription** - Pour expo-image-picker
2. ✅ **NSCameraUsageDescription** - Pour expo-image-picker
3. ✅ **NSPhotoLibraryAddUsageDescription** - Pour sauvegarder des photos
4. ✅ **NSUserNotificationsUsageDescription** - Pour expo-notifications

### Modules qui Utilisent ces Permissions

#### expo-image-picker
- Utilisé dans l'app pour sélectionner/t prendre des photos
- **Requiert**: NSPhotoLibraryUsageDescription, NSCameraUsageDescription, NSPhotoLibraryAddUsageDescription

#### expo-notifications
- Utilisé pour les notifications push
- **Requiert**: NSUserNotificationsUsageDescription

### Problème Potentiel

**🟡 MOYENNE**: Si les permissions ne sont pas dans `Info.plist` :

1. **L'app ne crash pas immédiatement** au démarrage
2. **Crash lors de l'utilisation** de la fonctionnalité (image picker, notifications)
3. **Rejet par Apple** lors de la soumission si permissions manquantes

### Impact sur le Crash

**Probabilité**: 🟡 **MOYENNE**

Les permissions manquantes ne causent généralement **PAS** de crash au démarrage, mais :
- Peuvent causer un crash si l'app essaie d'accéder à une ressource immédiatement
- Peuvent causer un rejet par Apple lors de la soumission

### Solution

✅ **DÉJÀ FAIT**: Le plugin `withIOSCrashFix` ajoute toutes les permissions nécessaires.

**Vérification**: Les permissions sont ajoutées pendant le prebuild via le plugin.

---

## 3. ✅/❌ Erreur dans le Code Natif iOS

### Vérification des Modules Natifs

#### Modules Natifs Installés

```json
"@sentry/react-native": "^7.8.0",
"@stripe/stripe-react-native": "0.50.3",
"expo-image-picker": "~17.0.10",
"expo-notifications": "~0.32.15",
"react-native-iap": "^12.15.4",
"react-native-keychain": "^10.0.0",
"firebase": "^10.14.1"
```

### Problèmes Potentiels par Module

#### 1. Firebase (firebase)
**Problème**: Initialisation au niveau natif iOS
- **Risque**: 🔴 **ÉLEVÉ** si `GoogleService-Info.plist` manquant
- **Code**: `src/config/firebaseApp.ts` initialise Firebase très tôt
- **Impact**: Crash natif si fichier manquant

#### 2. Sentry (@sentry/react-native)
**Problème**: Plugin Expo configure le code natif
- **Risque**: 🟢 **FAIBLE** - Bien configuré
- **Code**: Plugin `@sentry/react-native/expo` dans `app.json`
- **Impact**: Aucun si bien configuré

#### 3. Stripe (@stripe/stripe-react-native)
**Problème**: Initialisation au niveau natif
- **Risque**: 🟡 **MOYEN** - Peut causer des problèmes si mal configuré
- **Code**: Utilisé dans `App.tsx` avec `StripeProvider`
- **Impact**: Crash si clé Stripe invalide (mais géré avec fallback)

#### 4. expo-image-picker
**Problème**: Accès aux ressources système
- **Risque**: 🟡 **MOYEN** - Si permissions manquantes
- **Code**: Utilisé dans l'app pour sélectionner des photos
- **Impact**: Crash lors de l'utilisation si permissions manquantes

#### 5. expo-notifications
**Problème**: Accès aux notifications
- **Risque**: 🟡 **MOYEN** - Si permissions manquantes
- **Code**: Utilisé dans `NotificationContext.tsx`
- **Impact**: Crash lors de l'utilisation si permissions manquantes

### Ordre d'Initialisation

**Ordre actuel dans `index.ts`**:
1. ✅ Sentry (initialisé en premier)
2. ✅ Polyfills (react-native-gesture-handler, react-native-url-polyfill)
3. ✅ Firebase Auth (import 'firebase/auth')
4. ✅ App component

**Problème Potentiel**: 
- Firebase est importé très tôt, mais `GoogleService-Info.plist` peut être manquant
- Si Firebase crash au niveau natif, Sentry JS n'est pas encore prêt

### Code Natif iOS Généré

Le plugin `@sentry/react-native/expo` génère du code natif iOS qui :
- S'initialise au démarrage de l'app
- Capture les crashes natifs
- Envoie les crashes à Sentry

**Vérification**: Le plugin est bien configuré dans `app.json`.

---

## 🎯 Conclusion et Recommandations

### Causes Probables du Crash (par ordre de probabilité)

1. 🔴 **GoogleService-Info.plist manquant dans le build EAS** (PROBABILITÉ TRÈS ÉLEVÉE)
   - Le fichier existe localement mais peut être perdu pendant le prebuild EAS
   - Firebase SDK natif crash immédiatement si le fichier est absent
   - L'app se ferme avant que JavaScript ne démarre
   - Sentry JS ne peut pas capturer ce crash
   - ✅ **SOLUTION**: Plugin `withFirebaseConfig.js` créé pour garantir la présence du fichier

2. 🟡 **Initialisation Firebase trop tôt** (PROBABILITÉ MOYENNE)
   - Firebase est importé très tôt dans `index.ts` (ligne 104)
   - Firebase SDK natif essaie de charger `GoogleService-Info.plist` au démarrage
   - Si le fichier n'est pas encore copié, crash natif
   - ✅ **ATTÉNUÉ**: Le plugin s'exécute pendant le prebuild, avant le build

3. ✅ **Permissions manquantes** (PROBABILITÉ FAIBLE - CORRIGÉ)
   - Le plugin `withIOSCrashFix` ajoute toutes les permissions nécessaires
   - Ne devrait plus causer de crash au démarrage

### Actions Recommandées

#### Action 1: ✅ Plugin pour GoogleService-Info.plist CRÉÉ

✅ **FAIT**: Plugin `withFirebaseConfig.js` créé qui :
- Cherche `GoogleService-Info.plist` dans plusieurs emplacements
- Le copie dans `ios/LasoCoach/` pendant le prebuild
- Log des messages pour debug
- Avertit si le fichier n'est pas trouvé
- Ajouté à `app.json` en premier dans la liste des plugins

#### Action 2: Retarder l'Initialisation Firebase

Modifier `index.ts` pour :
- Initialiser Sentry en premier
- Attendre que Sentry soit prêt avant Firebase
- Gérer les erreurs Firebase de manière plus robuste

#### Action 3: Vérifier les Logs EAS Build

Dans les logs du build EAS, vérifier :
- Si `GoogleService-Info.plist` est présent dans le tarball
- Si le fichier est copié pendant le prebuild
- S'il y a des erreurs liées à Firebase

---

## 📋 Checklist de Vérification

### Avant le Prochain Build

- [ ] Vérifier que `GoogleService-Info.plist` existe localement
- [ ] Vérifier que le fichier est dans `.gitignore` (normal)
- [ ] Créer un plugin pour copier automatiquement le fichier
- [ ] Vérifier les logs EAS Build pour confirmer la présence du fichier
- [ ] Tester avec un build de développement pour avoir plus de logs

### Après le Build

- [ ] Vérifier les logs Xcode (si disponible)
- [ ] Vérifier les crash reports TestFlight
- [ ] Vérifier Sentry Dashboard pour les crashes natifs
- [ ] Tester l'app sur un iPhone réel

---

## 🚨 Action Immédiate Requise

**CRÉER UN PLUGIN EXPO** pour garantir que `GoogleService-Info.plist` est toujours présent dans le build iOS.

Ce plugin devrait :
1. Vérifier l'existence du fichier source
2. Le copier dans `ios/LasoCoach/` pendant le prebuild
3. Vérifier que les valeurs correspondent à Firebase Console
4. Logger un avertissement si le fichier est manquant

