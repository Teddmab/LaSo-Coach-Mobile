# 🐛 Debug: APK Preview Crash au Démarrage

## Problème
L'APK preview se ferme immédiatement après l'installation sans s'ouvrir.

## Causes Probables

### 1. **Erreur JavaScript Non Catchée**
Une erreur non gérée dans le code JavaScript peut faire crasher l'app au démarrage.

### 2. **Module/Import Manquant**
Un module requis pourrait manquer ou être mal importé.

### 3. **Configuration Firebase**
Problème d'initialisation Firebase (credentials manquantes ou incorrectes).

### 4. **Assets Manquants**
Fichiers d'assets (images, icônes) manquants ou mal référencés.

### 5. **Problème avec les Variables d'Environnement**
Variables `.env` non chargées correctement en production.

## 🔍 Étapes de Debug

### Étape 1: Capturer les Logs d'Erreur

**Méthode 1: Script automatique**
```bash
./get-crash-logs.sh
```

**Méthode 2: Commandes manuelles**
```bash
# Vider les logs précédents
adb logcat -c

# Lancer l'app puis capturer les logs
adb logcat | grep -E "(ReactNative|Expo|FATAL|AndroidRuntime|JS|Error|Exception|Crash)"

# Ou pour voir tous les logs
adb logcat > crash-logs.txt
```

### Étape 2: Vérifier les Erreurs Communes

#### A. Erreur "Unable to resolve module"
- **Cause**: Module non installé ou chemin incorrect
- **Solution**: Vérifier `package.json` et réinstaller les dépendances

#### B. Erreur Firebase "Missing or insufficient permissions"
- **Cause**: Configuration Firebase manquante ou incorrecte
- **Solution**: Vérifier `google-services.json` (Android) dans `android/app/`

#### C. Erreur "Cannot find module '@env'"
- **Cause**: Variables d'environnement non chargées
- **Solution**: Vérifier que `react-native-dotenv` est configuré dans `babel.config.js`

#### D. Erreur "Image source not found"
- **Cause**: Chemin d'image incorrect ou asset manquant
- **Solution**: Vérifier que tous les assets référencés existent dans `assets/`

### Étape 3: Vérifier la Configuration

#### Vérifier `app.json`
```bash
cat app.json | grep -A 10 "expo"
```

#### Vérifier `babel.config.js`
```bash
cat babel.config.js
```

#### Vérifier les assets
```bash
ls -la assets/
```

### Étape 4: Build de Debug pour Plus d'Informations

```bash
# Build de debug (avec plus de logs)
eas build --platform android --profile test --local

# Ou avec gradle directement
cd android
./gradlew assembleDebug
```

## 🔧 Corrections Appliquées

### 1. Gestion d'Erreurs Globale (`index.ts`)
- Ajout de handlers pour les erreurs non gérées
- Gestion des rejets de promesses non gérés
- Fallback en cas d'erreur de chargement

### 2. Protection du SplashScreen
- Try-catch autour du chargement de l'image
- Fallback si l'image ne charge pas

### 3. Protection de l'Initialisation App
- Try-catch autour de l'initialisation TokenManager
- Gestion d'erreur pour le chargement du module Stripe

### 4. Correction de `useNavigationContainerRef`
- Remplacement de `useRef` par `useNavigationContainerRef` pour la navigation

## 📋 Checklist de Vérification

- [ ] Les logs d'erreur ont été capturés
- [ ] Tous les modules sont installés (`npm install` ou `yarn install`)
- [ ] La configuration Firebase est présente (`google-services.json`)
- [ ] Les assets existent dans `assets/`
- [ ] Le build a réussi sans erreurs
- [ ] Les variables d'environnement sont configurées

## 🚀 Commandes de Test

```bash
# 1. Nettoyer et réinstaller
rm -rf node_modules
npm install

# 2. Nettoyer le cache
npx expo start --clear

# 3. Build test
eas build --platform android --profile test

# 4. Installer et tester
adb install -r <path-to-apk>
adb logcat -c
adb logcat | grep -E "(ReactNative|Expo|FATAL|Error)"
```

## 📞 Si le Problème Persiste

1. Partager les logs d'erreur complets
2. Vérifier la version de Node.js (`node --version`)
3. Vérifier la version d'Expo (`npx expo --version`)
4. Vérifier les permissions Android dans `AndroidManifest.xml`

