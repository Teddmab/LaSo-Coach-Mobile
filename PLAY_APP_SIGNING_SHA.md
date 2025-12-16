# 🔑 Récupérer le SHA du Play App Signing (pour AAB)

## ❌ Problème

- ✅ **APK** : Google Sign-In fonctionne
- ❌ **AAB** : Erreur SHA même après avoir ajouté les SHA EAS

## 🔍 Cause

Quand tu uploades un **AAB** sur le Play Store, Google **re-signe l'app** avec son propre keystore (Play App Signing). Le SHA final utilisé par l'app installée depuis le Play Store est **différent** du SHA du keystore EAS.

---

## 🚀 Solution : Récupérer le SHA du Play App Signing

### Étape 1 : Accéder à Google Play Console

1. Aller sur **https://play.google.com/console/**
2. Se connecter avec ton compte développeur
3. Sélectionner ton app : **LasoCoach** (ou le nom de ton app)

### Étape 2 : Trouver le SHA du Play App Signing

1. Dans le menu de gauche, aller dans **Configuration** (ou **Setup**)
2. Cliquer sur **Intégrité de l'application** (ou **App integrity**)
3. Scroller jusqu'à la section **"Clé de signature de l'application"** (ou **"App signing key"**)
4. Tu verras :
   - **SHA-1 certificate fingerprint** : `XX:XX:XX:XX:...`
   - **SHA-256 certificate fingerprint** : `YY:YY:YY:YY:...`

**⚠️ IMPORTANT** : Ce sont les SHA du keystore **Play App Signing**, pas ceux d'EAS !

### Étape 3 : Copier les SHA

Copie **les deux valeurs** :
- SHA-1 du Play App Signing
- SHA-256 du Play App Signing

---

## 📝 Ajouter les SHA dans Firebase

### Étape 1 : Ouvrir Firebase Console

1. Aller sur **https://console.firebase.google.com/**
2. Sélectionner le projet : **lasocoach-39710**
3. ⚙️ **Paramètres** > **Your apps** > **Android app** (`com.afrotouch.lasocoach`)

### Étape 2 : Ajouter les SHA Play App Signing

1. Section **"SHA certificate fingerprints"**
2. Cliquer sur **"Add fingerprint"**
3. Coller le **SHA-1 du Play App Signing** (celui récupéré depuis Play Console)
4. Cliquer sur **"Save"**
5. Répéter pour le **SHA-256 du Play App Signing**

### Étape 3 : Télécharger le nouveau google-services.json

1. Toujours dans Firebase Console > **Your apps** > Android app
2. Cliquer sur **"Download google-services.json"**
3. Sauvegarder le fichier

### Étape 4 : Remplacer le fichier dans le projet

```bash
# Remplacer le fichier téléchargé
cp ~/Downloads/google-services.json android/app/google-services.json
```

OU manuellement :
- Remplacer `android/app/google-services.json` par le fichier téléchargé

---

## ✅ Checklist Complète

Pour que Google Sign-In fonctionne avec **TOUS** les builds, tu dois avoir **TOUS** ces SHA dans Firebase :

- [ ] ✅ SHA-1 du **debug keystore local** (pour tests locaux)
- [ ] ✅ SHA-256 du **debug keystore local**
- [ ] ✅ SHA-1 du **keystore EAS** (pour builds EAS preview/production)
- [ ] ✅ SHA-256 du **keystore EAS**
- [ ] ✅ SHA-1 du **Play App Signing** (pour AAB installés depuis Play Store) ⚠️ **MANQUANT**
- [ ] ✅ SHA-256 du **Play App Signing** ⚠️ **MANQUANT**

---

## 🔄 Après avoir ajouté les SHA Play App Signing

1. **Attendre 5-10 minutes** pour la propagation Firebase
2. **Télécharger** le nouveau `google-services.json` depuis Firebase
3. **Remplacer** `android/app/google-services.json` dans le projet
4. **Commit et push** :
   ```bash
   git add android/app/google-services.json
   git commit -m "Add Play App Signing SHA to google-services.json"
   git push origin Moise
   ```
5. **Rebuild** un AAB avec EAS
6. **Tester** Google Sign-In sur l'AAB installé depuis le Play Store

---

## 📊 Résumé des Keystores

| Keystore | SHA dans Firebase ? | Utilisé pour |
|----------|---------------------|--------------|
| **Debug local** | ✅ OUI | Tests locaux (APK) |
| **EAS Build** | ✅ OUI | Builds EAS preview/production |
| **Play App Signing** | ❌ **NON** (à ajouter) | AAB installés depuis Play Store |

---

**Date** : Décembre 2025  
**Status** : ⚠️ Action Requise - Ajouter SHA Play App Signing

