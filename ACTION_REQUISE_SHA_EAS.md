# 🚨 ACTION REQUISE : Ajouter SHA EAS Build dans Firebase

## ❌ Problème Identifié

Le SHA-1 du keystore EAS Build **actuel** n'est **PAS** dans Firebase Console.

### SHA EAS Build Actuel (depuis expo.dev)

**Package** : `com.afrotouch.lasocoach`

**SHA-1** :
```
5F:3F:F6:17:33:83:3B:29:CD:59:04:9A:52:36:43:8A:3B:1C:4A:5B
```
(Sans les `:` : `5f3ff61733833b29cd59049a5236438a3b1c4a5b`)

**SHA-256** :
```
D2:71:EC:1E:D2:BD:48:7D:F4:E0:82:9E:07:76:1F:42:FF:48:3C:D4:D7:77:A4:34:67:F6:2A:27:21:EA:AE:DF:48:54:1E:03:B3:46:F1:56:D0:AF:EC:18:3F:80:5E:02
```
(Sans les `:` : `d271ec1ed2bd487df4e0829e07761f42ff483cd4d777a43467f62a2721eaaedf48541e03b346f156d0afec183f805e02`)

---

## ✅ Solution : Ajouter dans Firebase Console

### Étape 1 : Aller dans Firebase Console

1. **Aller sur** : https://console.firebase.google.com/
2. **Sélectionner le projet** : `lasocoach-39710`
3. **Paramètres du projet** (⚙️) > **Your apps** > **Android app** (`com.afrotouch.lasocoach`)
4. **Section "SHA certificate fingerprints"**

### Étape 2 : Ajouter le SHA-1 EAS Build

1. **Cliquer sur "Add fingerprint"**
2. **Coller le SHA-1** (avec ou sans les `:`) :
   ```
   5F:3F:F6:17:33:83:3B:29:CD:59:04:9A:52:36:43:8A:3B:1C:4A:5B
   ```
   OU
   ```
   5f3ff61733833b29cd59049a5236438a3b1c4a5b
   ```
3. **Cliquer sur "Save"**

### Étape 3 : Ajouter le SHA-256 EAS Build

1. **Cliquer sur "Add fingerprint"** (à nouveau)
2. **Coller le SHA-256** (avec ou sans les `:`) :
   ```
   D2:71:EC:1E:D2:BD:48:7D:F4:E0:82:9E:07:76:1F:42:FF:48:3C:D4:D7:77:A4:34:67:F6:2A:27:21:EA:AE:DF:48:54:1E:03:B3:46:F1:56:D0:AF:EC:18:3F:80:5E:02
   ```
   OU
   ```
   d271ec1ed2bd487df4e0829e07761f42ff483cd4d777a43467f62a2721eaaedf48541e03b346f156d0afec183f805e02
   ```
3. **Cliquer sur "Save"**

### Étape 4 : Télécharger le Nouveau google-services.json

1. **Toujours dans Firebase Console** > **Your apps** > **Android app**
2. **Cliquer sur "Download google-services.json"**
3. **Sauvegarder le fichier**

### Étape 5 : Remplacer et Committer

```bash
# Remplacer le fichier
# (copier le fichier téléchargé vers)
android/app/google-services.json

# Ajouter au Git
git add android/app/google-services.json

# Committer
git commit -m "Add EAS Build SHA-1/SHA-256 to google-services.json"

# Pusher
git push origin Moise
```

### Étape 6 : Attendre et Rebuilder

1. **Attendre 5-10 minutes** (propagation Firebase)
2. **Relancer le build** :
   ```bash
   eas build --platform android --profile preview
   ```

---

## 📋 Résumé des SHA à Avoir dans Firebase

Après avoir ajouté les SHA EAS, vous devriez avoir **5 empreintes** dans Firebase :

1. ✅ SHA-1 local : `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
2. ✅ SHA-256 local : `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
3. ✅ SHA-1 global : `94:FE:50:92:77:71:1A:A1:C9:27:14:BD:AC:B5:59:8E:33:C5:21:43`
4. ✅ SHA-256 global : `50:FC:E0:D1:60:4A:62:95:6C:E9:12:00:03:D4:95:8D:8B:DC:52:21:93:5C:D3:7D:40:EF:E6:47:4C:B3:58:3A`
5. ⚠️ **SHA-1 EAS Build** : `5F:3F:F6:17:33:83:3B:29:CD:59:04:9A:52:36:43:8A:3B:1C:4A:5B` ← **À AJOUTER**
6. ⚠️ **SHA-256 EAS Build** : `D2:71:EC:1E:D2:BD:48:7D:F4:E0:82:9E:07:76:1F:42:FF:48:3C:D4:D7:77:A4:34:67:F6:2A:27:21:EA:AE:DF:48:54:1E:03:B3:46:F1:56:D0:AF:EC:18:3F:80:5E:02` ← **À AJOUTER**

---

## ⚠️ Note sur le Projet `com.lasocoach`

Vous avez aussi un projet `com.lasocoach` dans EAS Credentials, mais votre app utilise `com.afrotouch.lasocoach`. 

**Vous pouvez ignorer** le projet `com.lasocoach` car il n'est pas utilisé.

---

**Date** : 30 Novembre 2025  
**Status** : 🚨 **ACTION REQUISE - SHA EAS Build manquant dans Firebase**

