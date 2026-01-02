# 📱 Checklist Build iOS - Ce qui manque

**Date**: Décembre 2025  
**Version actuelle**: 1.0.4  
**Status**: ⚠️ **NON PRÊT** - Plusieurs éléments manquants

---

## ❌ ÉLÉMENTS MANQUANTS CRITIQUES

### 1. 🔐 Permissions iOS manquantes dans Info.plist

L'application utilise `expo-image-picker` et `expo-notifications` mais les permissions ne sont **pas déclarées** dans `Info.plist`.

#### ❌ À ajouter dans `ios/LasoCoach/Info.plist`:

```xml
<!-- Permission pour accéder à la galerie photo -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Nous avons besoin d'accéder à vos photos pour vous permettre de changer votre avatar et d'ajouter des photos de progression.</string>

<!-- Permission pour accéder à l'appareil photo -->
<key>NSCameraUsageDescription</key>
<string>Nous avons besoin d'accéder à votre appareil photo pour vous permettre de prendre des photos pour compléter vos défis.</string>

<!-- Permission pour les notifications push -->
<key>NSUserNotificationsUsageDescription</key>
<string>Nous envoyons des notifications pour vous informer de vos défis, messages et mises à jour importantes.</string>
```

**Fichier à modifier**: `ios/LasoCoach/Info.plist`

---

### 2. 🔥 Fichier Firebase manquant pour iOS

Le fichier `GoogleService-Info.plist` est **absent** du projet iOS.

#### ❌ À ajouter:

1. **Télécharger depuis Firebase Console**:
   - Aller sur https://console.firebase.google.com
   - Sélectionner le projet `lasocoach-39710`
   - Aller dans **Project Settings** > **Your apps**
   - Sélectionner l'app iOS (ou créer une app iOS si elle n'existe pas)
   - Télécharger `GoogleService-Info.plist`

2. **Placer le fichier**:
   ```
   ios/LasoCoach/GoogleService-Info.plist
   ```

3. **Vérifier dans Xcode**:
   - Ouvrir `ios/LasoCoach.xcworkspace` dans Xcode
   - Vérifier que `GoogleService-Info.plist` est ajouté au projet
   - Vérifier qu'il est dans le target "LasoCoach"

**⚠️ CRITIQUE**: Sans ce fichier, Firebase Auth et Cloud Messaging ne fonctionneront pas sur iOS.

---

### 3. 🔔 Entitlements iOS manquants

Le fichier `LasoCoach.entitlements` est **vide**. Il doit contenir les capabilities nécessaires.

#### ❌ À ajouter dans `ios/LasoCoach/LasoCoach.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Push Notifications -->
    <key>aps-environment</key>
    <string>production</string>
    
    <!-- Associated Domains (pour deep links) -->
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:app.lasocoach.com</string>
    </array>
    
    <!-- In-App Purchase (si utilisé) -->
    <key>com.apple.developer.in-app-payments</key>
    <array/>
</dict>
</plist>
```

**Fichier à modifier**: `ios/LasoCoach/LasoCoach.entitlements`

---

### 4. 📦 Configuration EAS pour iOS Production

La configuration EAS pour iOS production est **incomplète**.

#### ❌ À ajouter dans `eas.json`:

```json
{
  "build": {
    "production": {
      "node": "20.19.4",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release",
        "bundleIdentifier": "com.afrotouch.lasocoach"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

**Fichier à modifier**: `eas.json`

---

### 5. 📱 Version iOS incorrecte dans Info.plist

La version dans `Info.plist` est `1.0.0` alors que l'app est en version `1.0.4`.

#### ❌ À corriger dans `ios/LasoCoach/Info.plist`:

```xml
<key>CFBundleShortVersionString</key>
<string>1.0.4</string>
```

**Fichier à modifier**: `ios/LasoCoach/Info.plist`

---

### 6. 🔒 Configuration usesNonExemptEncryption manquante

Pour soumettre sur l'App Store, Apple demande une déclaration sur le chiffrement.

#### ❌ À ajouter dans `app.json`:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.afrotouch.lasocoach",
      "icon": "./assets/icon.png",
      "associatedDomains": [
        "applinks:app.lasocoach.com"
      ],
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "SKAdNetworkItems": []
      }
    }
  }
}
```

**Fichier à modifier**: `app.json`

---

## ⚠️ ÉLÉMENTS À VÉRIFIER

### 7. ✅ Certificats et Provisioning Profiles

**À vérifier dans Xcode**:
- [ ] Certificat de développement configuré
- [ ] Provisioning Profile pour développement
- [ ] Certificat de distribution configuré
- [ ] Provisioning Profile pour distribution/App Store

**Comment vérifier**:
```bash
cd ios
open LasoCoach.xcworkspace
# Dans Xcode: Project > Signing & Capabilities
```

---

### 8. ✅ In-App Purchase Capability

Si vous utilisez les achats in-app (IAP), la capability doit être activée.

**À vérifier dans Xcode**:
- [ ] Capability "In-App Purchase" ajoutée
- [ ] Products créés dans App Store Connect
- [ ] Shared Secret configuré dans le backend

**Documentation**: Voir `IAP_SETUP_IOS.md`

---

### 9. ✅ Push Notifications Capability

Pour les notifications push, la capability doit être activée.

**À vérifier dans Xcode**:
- [ ] Capability "Push Notifications" ajoutée
- [ ] Certificat APNs configuré dans Apple Developer Portal
- [ ] Certificat APNs uploadé dans Firebase Console

---

### 10. ✅ App Store Connect Configuration

**À vérifier dans App Store Connect**:
- [ ] App créée avec Bundle ID: `com.afrotouch.lasocoach`
- [ ] Informations de l'app complétées
- [ ] Captures d'écran uploadées
- [ ] Description et mots-clés configurés
- [ ] Politique de confidentialité ajoutée
- [ ] Contact support configuré

---

## 📋 RÉSUMÉ DES ACTIONS REQUISES

### Actions CRITIQUES (bloquantes):

1. ✅ **Ajouter permissions dans Info.plist** (NSPhotoLibraryUsageDescription, NSCameraUsageDescription, NSUserNotificationsUsageDescription)
2. ✅ **Ajouter GoogleService-Info.plist** (Firebase)
3. ✅ **Configurer Entitlements** (Push Notifications, Associated Domains)
4. ✅ **Corriger version dans Info.plist** (1.0.4)
5. ✅ **Ajouter usesNonExemptEncryption dans app.json**

### Actions IMPORTANTES (recommandées):

6. ✅ **Configurer EAS pour iOS production**
7. ✅ **Vérifier certificats et provisioning profiles**
8. ✅ **Activer capabilities dans Xcode** (Push Notifications, IAP si nécessaire)

### Actions OPTIONNELLES (selon besoins):

9. ✅ **Configurer App Store Connect**
10. ✅ **Tester sur device physique**

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

### Étape 1: Configuration de base (15 min)
1. Ajouter permissions dans `Info.plist`
2. Corriger version dans `Info.plist`
3. Ajouter `usesNonExemptEncryption` dans `app.json`
4. Configurer `Entitlements`

### Étape 2: Firebase (10 min)
1. Télécharger `GoogleService-Info.plist` depuis Firebase
2. Placer dans `ios/LasoCoach/`
3. Vérifier dans Xcode

### Étape 3: Configuration EAS (5 min)
1. Mettre à jour `eas.json` pour iOS production

### Étape 4: Vérification Xcode (20 min)
1. Ouvrir `ios/LasoCoach.xcworkspace`
2. Vérifier Signing & Capabilities
3. Activer Push Notifications capability
4. Activer In-App Purchase capability (si nécessaire)
5. Vérifier que `GoogleService-Info.plist` est inclus

### Étape 5: Test build (30 min)
1. Build de développement: `eas build --platform ios --profile development`
2. Tester sur device physique
3. Vérifier Firebase Auth
4. Vérifier Notifications
5. Vérifier Image Picker

### Étape 6: Build production (selon besoin)
1. Build production: `eas build --platform ios --profile production`
2. Soumettre à App Store Connect: `eas submit --platform ios`

---

## 📝 FICHIERS À MODIFIER

| Fichier | Action | Priorité |
|---------|--------|----------|
| `ios/LasoCoach/Info.plist` | Ajouter permissions | 🔴 CRITIQUE |
| `ios/LasoCoach/GoogleService-Info.plist` | Ajouter fichier | 🔴 CRITIQUE |
| `ios/LasoCoach/LasoCoach.entitlements` | Configurer entitlements | 🔴 CRITIQUE |
| `app.json` | Ajouter usesNonExemptEncryption | 🔴 CRITIQUE |
| `eas.json` | Configurer iOS production | 🟡 IMPORTANT |
| Xcode Project | Vérifier Signing & Capabilities | 🟡 IMPORTANT |

---

## ⚠️ NOTES IMPORTANTES

1. **GoogleService-Info.plist**: Ce fichier est **obligatoire** pour Firebase. Sans lui, l'authentification Firebase ne fonctionnera pas sur iOS.

2. **Permissions**: Apple **rejette** les apps qui utilisent des APIs (comme ImagePicker) sans déclarer les permissions dans Info.plist.

3. **Entitlements**: Les entitlements doivent correspondre aux capabilities activées dans Xcode.

4. **Version**: La version dans Info.plist doit correspondre à la version dans app.json.

5. **Certificats**: Pour un build production, vous devez avoir un certificat de distribution valide et un provisioning profile App Store.

---

## ✅ CHECKLIST FINALE

Avant de lancer un build iOS production, vérifiez:

- [ ] Permissions ajoutées dans Info.plist
- [ ] GoogleService-Info.plist présent
- [ ] Entitlements configurés
- [ ] Version corrigée (1.0.4)
- [ ] usesNonExemptEncryption ajouté
- [ ] EAS configuré pour iOS
- [ ] Certificats valides dans Xcode
- [ ] Capabilities activées (Push Notifications, IAP si nécessaire)
- [ ] App créée dans App Store Connect
- [ ] Test build réussi sur device

---

**Une fois tous ces éléments en place, l'application sera prête pour un build iOS production!** 🎉

