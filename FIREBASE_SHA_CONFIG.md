# 🔐 Configuration des Empreintes SHA dans Firebase Console

## ❌ Erreur Actuelle
```
DEVELOPER_ERROR
```

## 🔍 Cause
Les empreintes SHA-1/SHA-256 de votre keystore ne sont **pas configurées** ou **incorrectes** dans Firebase Console.

---

## 📋 Informations de Configuration

### Package Name
```
com.afrotouch.lasocoach
```

### Empreintes à Ajouter dans Firebase

#### 🔑 Debug Keystore (App Local)
**SHA-1:**
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

**SHA-256:**
```
FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

#### 🔑 Debug Keystore (Global)
**SHA-1:**
```
94:FE:50:92:77:71:1A:A1:C9:27:14:BD:AC:B5:59:8E:33:C5:21:43
```

**SHA-256:**
```
50:FC:E0:D1:60:4A:62:95:6C:E9:12:00:03:D4:95:8D:8B:DC:52:21:93:5C:D3:7D:40:EF:E6:47:4C:B3:58:3A
```

---

## 🚀 Comment Ajouter les SHA dans Firebase Console

### Étape 1 : Ouvrir Firebase Console

1. Aller sur : https://console.firebase.google.com/
2. Sélectionner le projet : **lasocoach-39710**

### Étape 2 : Accéder aux Paramètres Android

1. Cliquer sur l'icône **⚙️ (Paramètres)** en haut à gauche
2. Cliquer sur **Project Settings** (Paramètres du projet)
3. Scroller vers le bas jusqu'à **"Your apps"**
4. Trouver l'app Android : **com.afrotouch.lasocoach**
5. Cliquer pour développer les détails

### Étape 3 : Ajouter les Empreintes SHA

Dans la section **"SHA certificate fingerprints"** :

1. Cliquer sur **"Add fingerprint"**
2. Coller le **SHA-1 du Debug Keystore (App Local)** :
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```
3. Cliquer sur **"Save"** ou **"Add"**

4. Cliquer à nouveau sur **"Add fingerprint"**
5. Coller le **SHA-256 du Debug Keystore (App Local)** :
   ```
   FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
   ```
6. Cliquer sur **"Save"**

7. **OPTIONNEL** : Ajouter aussi les SHA du keystore global (recommandé) :
   - SHA-1 : `94:FE:50:92:77:71:1A:A1:C9:27:14:BD:AC:B5:59:8E:33:C5:21:43`
   - SHA-256 : `50:FC:E0:D1:60:4A:62:95:6C:E9:12:00:03:D4:95:8D:8B:DC:52:21:93:5C:D3:7D:40:EF:E6:47:4C:B3:58:3A`

### Étape 4 : Télécharger le Nouveau google-services.json

1. Toujours dans **Project Settings** > **Your apps** > Android app
2. Cliquer sur **"Download google-services.json"**
3. Sauvegarder le fichier

### Étape 5 : Remplacer le Fichier

```bash
# Le fichier téléchargé doit remplacer :
android/app/google-services.json
```

---

## 📸 Capture d'Écran (Exemple)

Vous devriez voir quelque chose comme :

```
SHA certificate fingerprints
✓ 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
✓ FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
✓ 94:FE:50:92:77:71:1A:A1:C9:27:14:BD:AC:B5:59:8E:33:C5:21:43
✓ 50:FC:E0:D1:60:4A:62:95:6C:E9:12:00:03:D4:95:8D:8B:DC:52:21:93:5C:D3:7D:40:EF:E6:47:4C:B3:58:3A

[Add fingerprint]
```

---

## ⏱️ Temps de Propagation

Après avoir ajouté les SHA dans Firebase :

- ⏱️ **Attendre 5-10 minutes** pour que les changements se propagent
- 🔄 Google doit synchroniser les configurations

---

## 🧪 Test Après Configuration

### Rebuild l'App

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

OU avec Expo :

```bash
npx expo run:android
```

### Tester Google Sign-In

1. Ouvrir l'app
2. Cliquer sur **"Continuer avec Google"**
3. **Résultat attendu** : ✅ UI native de Google s'ouvre (pas d'erreur DEVELOPER_ERROR)

---

## 🔍 Vérification Supplémentaire

### Vérifier le Web Client ID

Dans Firebase Console :

1. **Project Settings** > **General**
2. Scroller vers **"Web API Key"**
3. Noter le **Web Client ID**

### Vérifier dans le Code

Le Web Client ID dans `.env` doit correspondre à celui de Firebase :

```bash
# Vérifier
cat .env | grep FIREBASE_WEB_CLIENT_ID
```

---

## ❓ Troubleshooting

### L'erreur persiste après avoir ajouté les SHA

1. **Attendre 10 minutes** (propagation)
2. **Vérifier** que le Package Name dans Firebase est exactement : `com.afrotouch.lasocoach`
3. **Télécharger** et remplacer `google-services.json`
4. **Clean rebuild** :
   ```bash
   cd android
   ./gradlew clean
   cd ..
   rm -rf android/app/build
   npx expo run:android
   ```

### Comment savoir quel keystore est utilisé ?

L'app utilise automatiquement :
- **Debug** : `android/app/debug.keystore` OU `~/.android/debug.keystore`
- **Release** : Le keystore configuré pour la signature
- **EAS Build** : Le keystore géré par EAS (différent du debug local)

Pour les tests locaux, utilisez les **deux keystores debug** dans Firebase.

### 🔑 Récupérer le SHA-1 du Keystore EAS Build (Production)

Si vous utilisez **EAS Build** pour créer des builds de production, vous devez aussi ajouter le SHA-1 du keystore EAS :

```bash
# 1. Installer EAS CLI si pas déjà fait
npm install -g eas-cli

# 2. Se connecter à EAS
eas login

# 3. Voir les credentials Android
eas credentials

# 4. Sélectionner votre projet et "Android"
# 5. Choisir "Keystore: Manage everything needed to build your project"
# 6. EAS affichera le SHA-1 et SHA-256 du keystore de production
```

**OU** via l'interface web :
1. Aller sur https://expo.dev
2. Sélectionner votre projet
3. Aller dans **Credentials** > **Android**
4. Le SHA-1 et SHA-256 sont affichés dans les détails du keystore

**IMPORTANT** : Ajoutez **TOUS** les SHA-1/SHA-256 dans Firebase :
- ✅ SHA du debug keystore local (pour tests locaux)
- ✅ SHA du keystore EAS Build (pour builds de production)

---

## ✅ Checklist

- [ ] Ajouter SHA-1 : `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- [ ] Ajouter SHA-256 : `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
- [ ] Ajouter SHA-1 (global) : `94:FE:50:92:77:71:1A:A1:C9:27:14:BD:AC:B5:59:8E:33:C5:21:43`
- [ ] Ajouter SHA-256 (global) : `50:FC:E0:D1:60:4A:62:95:6C:E9:12:00:03:D4:95:8D:8B:DC:52:21:93:5C:D3:7D:40:EF:E6:47:4C:B3:58:3A`
- [ ] Télécharger nouveau `google-services.json`
- [ ] Remplacer `android/app/google-services.json`
- [ ] Attendre 5-10 minutes
- [ ] Clean + Rebuild l'app
- [ ] Tester Google Sign-In

---

**Date** : 29 Novembre 2025  
**Status** : ⚠️ Configuration Requise

