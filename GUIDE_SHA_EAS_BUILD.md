# 🔑 Guide : Récupérer le SHA-1/SHA-256 du Keystore EAS Build

## ❌ Problème

- ✅ **En test local** : Google Sign-In fonctionne
- ❌ **En build EAS (preview/production)** : Erreur "Developer_error - SHA-1/SHA-256 must be added"

## 🔍 Cause

EAS Build utilise un **keystore différent** de votre keystore local :
- **Local (test)** : `android/app/debug.keystore` → SHA déjà dans Firebase ✅
- **EAS Build** : Keystore géré par EAS → SHA **NON** dans Firebase ❌

---

## 🚀 Solution : Récupérer le SHA du Keystore EAS

### Méthode 1 : Via l'Interface Web Expo.dev (RECOMMANDÉ)

1. **Aller sur https://expo.dev**
2. **Se connecter** avec votre compte
3. **Sélectionner votre projet** : `laso-coach` (ou le nom de votre projet)
4. **Aller dans** : **Credentials** (dans le menu de gauche)
5. **Sélectionner** : **Android**
6. **Cliquer sur** : **Keystore** ou **Production Keystore**
7. **Vous verrez** :
   - SHA-1 certificate fingerprint
   - SHA-256 certificate fingerprint

**Copiez ces deux valeurs !**

---

### Méthode 2 : Via EAS CLI

```bash
# 1. Installer EAS CLI (si pas déjà fait)
npm install -g eas-cli

# 2. Se connecter
eas login

# 3. Voir les credentials
eas credentials

# 4. Sélectionner :
#    - Votre projet
#    - Android
#    - Keystore: Manage everything needed to build your project
#    - EAS affichera le SHA-1 et SHA-256
```

---

## 📝 Ajouter les SHA dans Firebase Console

Une fois que vous avez les SHA-1 et SHA-256 du keystore EAS :

1. **Aller sur** : https://console.firebase.google.com/
2. **Sélectionner le projet** : `lasocoach-39710`
3. **Paramètres du projet** (⚙️) > **Your apps** > **Android app** (`com.afrotouch.lasocoach`)
4. **Section "SHA certificate fingerprints"**
5. **Cliquer sur "Add fingerprint"**
6. **Coller le SHA-1 du keystore EAS**
7. **Cliquer sur "Save"**
8. **Répéter pour le SHA-256**

---

## ✅ Vérification

Après avoir ajouté les SHA dans Firebase :

1. **Télécharger le nouveau `google-services.json`** depuis Firebase Console
2. **Remplacer** `android/app/google-services.json` dans votre projet
3. **Committer et pusher** :
   ```bash
   git add android/app/google-services.json
   git commit -m "Update google-services.json with EAS Build SHA fingerprints"
   git push origin Moise
   ```
4. **Attendre 5-10 minutes** pour la propagation Firebase
5. **Relancer le build EAS** :
   ```bash
   eas build --platform android --profile preview
   ```

---

## 📋 Checklist

- [ ] Récupérer SHA-1 du keystore EAS (via expo.dev ou EAS CLI)
- [ ] Récupérer SHA-256 du keystore EAS
- [ ] Ajouter SHA-1 dans Firebase Console
- [ ] Ajouter SHA-256 dans Firebase Console
- [ ] Télécharger nouveau `google-services.json`
- [ ] Remplacer `android/app/google-services.json`
- [ ] Committer et pusher le nouveau fichier
- [ ] Attendre 5-10 minutes
- [ ] Relancer le build EAS

---

## ⚠️ Important

- Les SHA du keystore **EAS Build** sont **DIFFÉRENTS** des SHA du keystore local
- Vous devez avoir **TOUS** les SHA dans Firebase :
  - ✅ SHA du keystore local (pour tests locaux)
  - ✅ SHA du keystore EAS Build (pour builds preview/production)

---

## 🔍 Comment Vérifier les SHA Actuels dans Firebase

Dans Firebase Console > Project Settings > Your apps > Android app, vous devriez voir :

```
SHA certificate fingerprints
✓ 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25 (local)
✓ 94:FE:50:92:77:71:1A:A1:C9:27:14:BD:AC:B5:59:8E:33:C5:21:43 (local global)
✓ [SHA-1 EAS Build] ← À AJOUTER
✓ [SHA-256 EAS Build] ← À AJOUTER
```

---

**Date** : 30 Novembre 2025  
**Status** : ⚠️ Action Requise - Récupérer SHA EAS Build

