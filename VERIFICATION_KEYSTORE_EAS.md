# ✅ Vérification Keystore pour EAS Build

## 📋 Situation Actuelle

### Keystore Local (Debug)
- **Fichier** : `android/app/debug.keystore`
- **Utilisé pour** : Tests locaux uniquement
- **SHA-1** : `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **SHA-256** : `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
- **Status** : ✅ Déjà dans Firebase

### Keystore EAS Build
- **Géré par** : EAS automatiquement
- **Créé** : Lors du premier build EAS
- **Localisation** : Géré par EAS (pas dans votre projet)
- **Status** : ⚠️ **VÉRIFIER que le SHA est dans Firebase**

---

## 🔍 Vérification Requise

### Étape 1 : Récupérer le SHA du Keystore EAS

**Via l'interface web** (le plus simple) :

1. Aller sur **https://expo.dev**
2. Se connecter
3. Sélectionner votre projet : **laso-coach**
4. Menu de gauche : **Credentials**
5. **Android** > **Keystore** (ou **Production Keystore**)
6. **Copier le SHA-1 et SHA-256 affichés**

### Étape 2 : Vérifier dans Firebase

1. Aller sur **https://console.firebase.google.com/**
2. Projet : **lasocoach-39710**
3. ⚙️ **Paramètres** > **Your apps** > **Android app** (`com.afrotouch.lasocoach`)
4. Section **"SHA certificate fingerprints"**
5. **Vérifier** que le SHA-1 du keystore EAS est présent

### Étape 3 : Si le SHA EAS n'est PAS dans Firebase

1. **Ajouter** le SHA-1 du keystore EAS dans Firebase
2. **Ajouter** le SHA-256 du keystore EAS dans Firebase
3. **Télécharger** le nouveau `google-services.json`
4. **Remplacer** `android/app/google-services.json`
5. **Committer et pusher** :
   ```bash
   git add android/app/google-services.json
   git commit -m "Update google-services.json with EAS Build SHA"
   git push origin Moise
   ```

---

## ✅ Checklist Avant de Rebuilder

- [ ] Récupérer SHA-1 du keystore EAS depuis expo.dev
- [ ] Récupérer SHA-256 du keystore EAS depuis expo.dev
- [ ] Vérifier que ces SHA sont dans Firebase Console
- [ ] Si non présents : Les ajouter dans Firebase
- [ ] Télécharger nouveau `google-services.json` si SHA ajoutés
- [ ] Committer et pusher le nouveau `google-services.json`
- [ ] Attendre 5-10 minutes (propagation Firebase)
- [ ] Relancer le build EAS

---

## 📝 Notes Importantes

1. **EAS Build ignore la config `signingConfig` dans `build.gradle`**
   - Même si `release` utilise `debug.keystore` dans le code
   - EAS utilise son propre keystore automatiquement

2. **Le keystore EAS est unique par projet**
   - Il est créé automatiquement au premier build
   - Il reste le même pour tous les builds futurs
   - Il est stocké de manière sécurisée par EAS

3. **Vous n'avez PAS besoin de configurer un keystore manuel**
   - EAS gère tout automatiquement
   - Juste s'assurer que les SHA sont dans Firebase

---

## 🚀 Après Vérification

Une fois que vous avez vérifié/ajouté les SHA dans Firebase :

```bash
# Relancer le build
eas build --platform android --profile preview
```

Le build devrait maintenant fonctionner sans erreur SHA.

---

**Date** : 30 Novembre 2025  
**Status** : ⚠️ Vérification Requise

