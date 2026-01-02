# 📱 Configuration App ID et Certificats iOS

**Guide complet pour créer l'App ID et générer les certificats nécessaires**

---

## 🎯 ÉTAPE 1: Créer l'App ID dans Apple Developer Portal

### 1. Accéder au portail
1. Aller sur https://developer.apple.com/account
2. Se connecter avec votre compte Apple Developer
3. Cliquer sur **Certificates, Identifiers & Profiles**

### 2. Créer un nouvel App ID
1. Dans le menu de gauche, cliquer sur **Identifiers**
2. Cliquer sur le bouton **+** (en haut à gauche)
3. Sélectionner **App IDs** puis **Continue**

### 3. Type d'App ID
- Sélectionner **App** (pas App Clip ou autre)
- Cliquer sur **Continue**

### 4. Description et Bundle ID

**Description**: 
```
LasoCoach
```

**Bundle ID**:
- Option 1: **Explicit** (recommandé)
  - Bundle ID: `com.afrotouch.lasocoach`
  
- Option 2: **Wildcard** (moins recommandé pour production)
  - Bundle ID: `com.afrotouch.*`

**⚠️ IMPORTANT**: Utilisez **Explicit** avec `com.afrotouch.lasocoach` (doit correspondre à votre `app.json`)

---

## ✅ CAPABILITIES À ACTIVER

Lors de la création de l'App ID, vous devez activer ces **Capabilities** (Services):

### 🔴 OBLIGATOIRES:

#### 1. **Push Notifications** ✅
- **Pourquoi**: Pour envoyer des notifications push via Firebase
- **Cocher**: ✅ Push Notifications
- **Action après création**: Vous devrez générer un certificat APNs (voir étape 2)

#### 2. **Associated Domains** ✅
- **Pourquoi**: Pour les deep links (applinks:app.lasocoach.com)
- **Cocher**: ✅ Associated Domains
- **Domaine à ajouter**: `app.lasocoach.com`

### 🟡 RECOMMANDÉES (si vous utilisez IAP):

#### 3. **In-App Purchase** ✅
- **Pourquoi**: Pour les abonnements et achats in-app
- **Cocher**: ✅ In-App Purchase
- **Note**: Nécessaire si vous vendez des abonnements dans l'app

### ❌ À NE PAS COCHER (non utilisées):

- ❌ App Groups
- ❌ Background Modes (sauf si vous en avez besoin)
- ❌ Data Protection
- ❌ HealthKit
- ❌ HomeKit
- ❌ Inter-App Audio
- ❌ Keychain Sharing
- ❌ NFC Tag Reading
- ❌ Personal VPN
- ❌ Sign in with Apple (si vous n'utilisez pas)
- ❌ Wallet
- ❌ Wireless Accessory Configuration

---

## 📋 RÉCAPITULATIF DES CAPABILITIES

**À cocher**:
```
✅ Push Notifications
✅ Associated Domains
✅ In-App Purchase (si vous utilisez les abonnements)
```

**À ne PAS cocher**:
```
❌ Tout le reste (sauf si vous avez un besoin spécifique)
```

---

## 🎯 ÉTAPE 2: Générer les Certificats

Après avoir créé l'App ID, vous devez générer les certificats.

### A. Certificat de Développement (Development Certificate)

**Pour**: Tester l'app sur des devices physiques pendant le développement

1. Dans **Certificates, Identifiers & Profiles**
2. Cliquer sur **Certificates** (menu de gauche)
3. Cliquer sur **+** (en haut à gauche)
4. Sélectionner **Apple Development** (ou **iOS App Development**)
5. Cliquer sur **Continue**
6. **Upload CSR**:
   - Sur votre Mac, ouvrir **Keychain Access**
   - Menu: **Keychain Access** > **Certificate Assistant** > **Request a Certificate From a Certificate Authority**
   - Email: Votre email Apple Developer
   - Common Name: Votre nom
   - CA Email: Laisser vide
   - Sélectionner **Saved to disk**
   - Cliquer sur **Continue** et sauvegarder le fichier `.certSigningRequest`
7. Upload le fichier CSR dans le portail
8. Télécharger le certificat (`.cer`)
9. Double-cliquer sur le fichier pour l'installer dans Keychain

### B. Certificat de Distribution (Distribution Certificate)

**Pour**: Builds de production et soumission à l'App Store

1. Dans **Certificates**
2. Cliquer sur **+**
3. Sélectionner **Apple Distribution** (ou **App Store and Ad Hoc**)
4. Cliquer sur **Continue**
5. Upload le même CSR (ou créer un nouveau)
6. Télécharger le certificat
7. Double-cliquer pour l'installer dans Keychain

### C. Certificat APNs (Push Notifications)

**Pour**: Envoyer des notifications push

1. Dans **Certificates**
2. Cliquer sur **+**
3. Sélectionner **Apple Push Notification service SSL (Sandbox & Production)**
4. Cliquer sur **Continue**
5. Sélectionner votre App ID: `com.afrotouch.lasocoach`
6. Upload un CSR (créer un nouveau si nécessaire)
7. Télécharger le certificat
8. **IMPORTANT**: Upload ce certificat dans Firebase Console
   - Aller sur https://console.firebase.google.com
   - Projet: `lasocoach-39710`
   - Project Settings > Cloud Messaging
   - Upload le certificat APNs (ou la clé .p8 si vous préférez)

---

## 🎯 ÉTAPE 3: Créer les Provisioning Profiles

### A. Provisioning Profile de Développement

1. Dans **Profiles** (menu de gauche)
2. Cliquer sur **+**
3. Sélectionner **iOS App Development**
4. Cliquer sur **Continue**
5. Sélectionner votre App ID: `com.afrotouch.lasocoach`
6. Sélectionner votre certificat de développement
7. Sélectionner les devices de test (vous devez les enregistrer d'abord)
8. Donner un nom: `LasoCoach Development`
9. Télécharger le profile
10. Double-cliquer pour l'installer dans Xcode

### B. Provisioning Profile de Distribution (App Store)

1. Dans **Profiles**
2. Cliquer sur **+**
3. Sélectionner **App Store**
4. Cliquer sur **Continue**
5. Sélectionner votre App ID: `com.afrotouch.lasocoach`
6. Sélectionner votre certificat de distribution
7. Donner un nom: `LasoCoach App Store`
8. Télécharger le profile
9. Double-cliquer pour l'installer dans Xcode

---

## 📝 RÉSUMÉ DES ÉTAPES

### 1. Créer App ID
- Bundle ID: `com.afrotouch.lasocoach`
- Capabilities: Push Notifications, Associated Domains, In-App Purchase

### 2. Générer Certificats
- ✅ Development Certificate
- ✅ Distribution Certificate
- ✅ APNs Certificate (pour Push Notifications)

### 3. Créer Provisioning Profiles
- ✅ Development Profile
- ✅ App Store Profile

### 4. Upload APNs dans Firebase
- Upload le certificat APNs dans Firebase Console

---

## ⚠️ NOTES IMPORTANTES

1. **Bundle ID**: Doit correspondre exactement à `com.afrotouch.lasocoach` (dans `app.json`)

2. **Associated Domains**: Le domaine `app.lasocoach.com` doit être configuré avec un fichier `apple-app-site-association` sur votre serveur

3. **APNs Certificate**: Vous pouvez utiliser soit un certificat (.p12) soit une clé (.p8). La clé .p8 est plus moderne et recommandée.

4. **Certificats expirés**: Les certificats de développement expirent après 1 an. Les certificats de distribution n'expirent pas mais peuvent être révoqués.

5. **EAS Build**: Si vous utilisez EAS Build, vous pouvez laisser EAS gérer les certificats automatiquement (recommandé).

---

## 🚀 OPTION: Laisser EAS gérer les certificats (RECOMMANDÉ)

Si vous utilisez **EAS Build**, vous pouvez laisser EAS gérer automatiquement les certificats:

1. **Créer l'App ID** manuellement (comme décrit ci-dessus)
2. **Activer les capabilities** (Push Notifications, Associated Domains, IAP)
3. **Laisser EAS générer les certificats** automatiquement lors du premier build:
   ```bash
   eas build --platform ios --profile production
   ```
   EAS vous demandera de vous connecter avec votre compte Apple Developer et générera automatiquement les certificats et provisioning profiles.

**Avantages**:
- ✅ Plus simple
- ✅ Certificats gérés automatiquement
- ✅ Renouvellement automatique
- ✅ Moins d'erreurs

**Inconvénients**:
- ⚠️ Vous devez quand même créer l'App ID manuellement
- ⚠️ Vous devez uploader le certificat APNs dans Firebase manuellement

---

## ✅ CHECKLIST FINALE

Avant de lancer un build iOS, vérifiez:

- [ ] App ID créé avec Bundle ID: `com.afrotouch.lasocoach`
- [ ] Push Notifications activé dans l'App ID
- [ ] Associated Domains activé dans l'App ID
- [ ] In-App Purchase activé (si utilisé)
- [ ] Certificat APNs généré et uploadé dans Firebase
- [ ] Certificats installés dans Keychain (si build local)
- [ ] Provisioning Profiles créés (si build local)
- [ ] GoogleService-Info.plist téléchargé et ajouté au projet

---

**Une fois ces étapes complétées, vous serez prêt pour un build iOS!** 🎉


