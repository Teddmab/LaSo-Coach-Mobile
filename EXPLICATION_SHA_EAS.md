# 🔑 Explication : Quel SHA EAS Doit Utiliser ?

## ❓ Question

**"C'est quoi le SHA que EAS doit utiliser ?"**

## ✅ Réponse

**EAS n'utilise pas un SHA spécifique.** C'est l'inverse :

### 🔄 Comment ça fonctionne

1. **EAS Build crée/gère automatiquement un keystore** pour signer votre application
2. **Ce keystore a des SHA-1 et SHA-256 uniques** (générés automatiquement)
3. **Firebase doit connaître ces SHA** pour autoriser l'authentification Google
4. **Actuellement, Firebase ne connaît QUE les SHA de votre keystore local** ❌

---

## 📊 Situation Actuelle

| Keystore | SHA dans Firebase ? | Utilisé pour |
|----------|---------------------|--------------|
| **Local debug** (`android/app/debug.keystore`) | ✅ OUI | Tests locaux |
| **EAS Build keystore** (géré par EAS) | ❌ NON | Builds preview/production |

---

## 🎯 Solution

Vous devez **récupérer les SHA du keystore EAS** et **les ajouter dans Firebase**.

### Étape 1 : Récupérer les SHA du Keystore EAS

**Via l'interface web Expo.dev** (le plus simple) :

1. Aller sur **https://expo.dev**
2. Se connecter
3. Sélectionner votre projet : **laso-coach**
4. Menu de gauche : **Credentials**
5. **Android** > **Keystore** (ou **Production Keystore**)
6. **Vous verrez** :
   ```
   SHA-1 certificate fingerprint: XX:XX:XX:XX:...
   SHA-256 certificate fingerprint: XX:XX:XX:XX:...
   ```

**Copiez ces deux valeurs !**

---

### Étape 2 : Ajouter dans Firebase Console

1. Aller sur **https://console.firebase.google.com/**
2. Projet : **lasocoach-39710**
3. ⚙️ **Paramètres** > **Your apps** > **Android app** (`com.afrotouch.lasocoach`)
4. Section **"SHA certificate fingerprints"**
5. **"Add fingerprint"** → Coller le **SHA-1 du keystore EAS**
6. **"Add fingerprint"** → Coller le **SHA-256 du keystore EAS**

---

### Étape 3 : Mettre à jour google-services.json

1. **Télécharger** le nouveau `google-services.json` depuis Firebase
2. **Remplacer** `android/app/google-services.json`
3. **Committer et pusher** :
   ```bash
   git add android/app/google-services.json
   git commit -m "Update google-services.json with EAS Build SHA"
   git push origin Moise
   ```

---

### Étape 4 : Relancer le Build

```bash
eas build --platform android --profile preview
```

---

## 📋 Résumé

- ❌ **Ce n'est PAS** : "EAS doit utiliser tel SHA"
- ✅ **C'est** : "Firebase doit connaître le SHA du keystore qu'EAS utilise"

**Le SHA du keystore EAS est généré automatiquement par EAS.** Vous devez juste le récupérer et l'ajouter dans Firebase.

---

## 🔍 Où Trouver les SHA EAS ?

**Option 1 : Interface Web (RECOMMANDÉ)**
- https://expo.dev → Votre projet → Credentials → Android → Keystore

**Option 2 : EAS CLI**
```bash
npm install -g eas-cli
eas login
eas credentials
# Sélectionner Android > Keystore
```

---

**Date** : 30 Novembre 2025

