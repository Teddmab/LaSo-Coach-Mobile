# 📱 Implémentation des Informations d'Appareil

**Date** : Décembre 2025  
**Objectif** : Capturer et envoyer les informations de l'appareil Android/iOS au backend lors de la connexion

---

## 🎯 Vue d'ensemble

Le système capture automatiquement les informations de l'appareil (version Android, fabricant, modèle, etc.) et les envoie au backend lors de chaque authentification (login, loginWithGoogle, register).

---

## 📦 Fichiers Créés

### 1. `src/services/deviceInfoService.js`
Service pour capturer les informations de l'appareil.

**Méthodes principales** :
- `getDeviceInfo()` : Récupère toutes les informations de l'appareil
- `getDeviceInfoForBackend()` : Formate les informations pour l'envoi au backend
- `getDeviceSummary()` : Retourne un résumé textuel (pour logs)

### 2. `src/types/device.js`
Types TypeScript/JSDoc pour les informations d'appareil.

---

## 📊 Informations Capturées

### Informations de Base
- **platform** : `'android'` | `'ios'`
- **platformVersion** : Version de la plateforme (ex: `13` pour Android 13)
- **manufacturer** : Fabricant (ex: `'Samsung'`, `'Google'`, `'Apple'`)
- **modelName** : Nom du modèle (ex: `'SM-G991B'`, `'Pixel 7'`, `'iPhone 14 Pro'`)
- **deviceName** : Nom complet de l'appareil

### Informations Système
- **osName** : `'Android'` | `'iOS'`
- **osVersion** : Version complète (ex: `'13.0'`)
- **osBuildId** : Build ID du système
- **deviceType** : `'PHONE'` | `'TABLET'` | `'DESKTOP'` | `'TV'` | `'UNKNOWN'`
- **isDevice** : `true` si appareil physique (pas un émulateur)

### Informations Application
- **appVersion** : Version de l'application (ex: `'1.0.0'`)
- **appBuildNumber** : Numéro de build

### Informations Spécifiques Android
- **brand** : Marque (ex: `'samsung'`)
- **modelId** : ID du modèle

### Informations Spécifiques iOS
- **deviceYearClass** : Année de sortie de l'appareil
- **supportedCpuArchitectures** : Architectures CPU supportées

---

## 🔄 Intégration dans l'Authentification

Les informations de l'appareil sont **automatiquement envoyées** à un **endpoint sécurisé et dédié** après chaque authentification réussie :

### Endpoint Dédié et Sécurisé

```javascript
POST /api/v1/devices/register
Authorization: Bearer <FIREBASE_ID_TOKEN>
{
  "platform": "android",
  "platformVersion": 13,
  "manufacturer": "Samsung",
  "modelName": "SM-G991B",
  "deviceName": "Galaxy S21",
  "osName": "Android",
  "osVersion": "13.0",
  "deviceType": "PHONE",
  "isDevice": true,
  "appVersion": "1.0.0",
  "appBuildNumber": "1"
}
```

**Avantages** :
- ✅ Endpoint séparé et sécurisé (authentification requise)
- ✅ Ne bloque pas l'authentification si l'enregistrement échoue
- ✅ Permet de mettre à jour les infos d'appareil indépendamment
- ✅ Meilleure gestion de la sécurité et analytics

### Flux d'Authentification

1. **Login (Email/Password)** → Authentification → Enregistrement appareil (non bloquant)
2. **Login avec Google** → Authentification → Enregistrement appareil (non bloquant)
3. **Register** → Inscription → Authentification → Enregistrement appareil (non bloquant)

---

## 💻 Utilisation

### Utilisation Automatique
Les informations sont **automatiquement** collectées et envoyées lors de l'authentification. Aucune action requise.

### Utilisation Manuelle (si nécessaire)
```javascript
import deviceInfoService from './services/deviceInfoService';

// Récupérer toutes les informations
const deviceInfo = await deviceInfoService.getDeviceInfo();
console.log('Device:', deviceInfo);

// Récupérer les informations formatées pour le backend
const backendInfo = await deviceInfoService.getDeviceInfoForBackend();
console.log('Backend format:', backendInfo);

// Récupérer un résumé textuel
const summary = await deviceInfoService.getDeviceSummary();
console.log('Summary:', summary); // "Samsung SM-G991B (Android 13.0)"
```

---

## 📝 Exemple de Données Envoyées

### Android (Samsung Galaxy S21)
```json
{
  "platform": "android",
  "platformVersion": 13,
  "manufacturer": "Samsung",
  "modelName": "SM-G991B",
  "deviceName": "Galaxy S21",
  "osName": "Android",
  "osVersion": "13.0",
  "osBuildId": "TP1A.220624.014",
  "deviceType": "PHONE",
  "isDevice": true,
  "appVersion": "1.0.0",
  "appBuildNumber": "1",
  "brand": "samsung",
  "modelId": "SM-G991B"
}
```

### iOS (iPhone 14 Pro)
```json
{
  "platform": "ios",
  "platformVersion": "16.0",
  "manufacturer": "Apple",
  "modelName": "iPhone 14 Pro",
  "deviceName": "iPhone 14 Pro",
  "osName": "iOS",
  "osVersion": "16.0",
  "deviceType": "PHONE",
  "isDevice": true,
  "appVersion": "1.0.0",
  "appBuildNumber": "1",
  "deviceYearClass": 2022,
  "supportedCpuArchitectures": ["arm64"]
}
```

---

## 🔧 Dépendances

- ✅ `expo-device` : Déjà installé (`~7.1.4`)
- ✅ `expo-constants` : Inclus dans Expo SDK
- ✅ `react-native` : `Platform` API

---

## 🧪 Tests

Pour tester la collecte des informations :

```javascript
import deviceInfoService from './services/deviceInfoService';

// Dans un composant ou console
const info = await deviceInfoService.getDeviceInfo();
console.log('📱 Device Info:', JSON.stringify(info, null, 2));
```

---

## 📋 Checklist Backend

Le backend doit créer l'endpoint sécurisé suivant :

- ✅ `POST /api/v1/devices/register` (authentification requise)

**Voir le document complet** : `MESSAGE_BACKEND_DEVICE_ENDPOINT.md`

**Structure attendue** :
```typescript
interface DeviceInfo {
  platform: string;
  platformVersion: string | number;
  manufacturer: string;
  modelName: string;
  deviceName: string;
  osName: string;
  osVersion: string;
  deviceType: string | null;
  isDevice: boolean;
  appVersion: string;
  appBuildNumber: string | null;
  brand?: string; // Android uniquement
  modelId?: string; // Android uniquement
  deviceYearClass?: number; // iOS uniquement
}
```

---

## 🎯 Avantages

1. **Analytics** : Comprendre quels appareils utilisent l'application
2. **Support** : Aider les utilisateurs avec des problèmes spécifiques à leur appareil
3. **Sécurité** : Détecter les connexions suspectes (nouveaux appareils)
4. **Optimisation** : Adapter l'expérience selon le type d'appareil

---

## ⚠️ Notes Importantes

1. **Privacy** : Les informations sont collectées automatiquement mais ne contiennent pas d'informations personnelles identifiables
2. **Performance** : La collecte est asynchrone et ne bloque pas l'authentification
3. **Erreurs** : En cas d'erreur, un objet minimal est retourné pour ne pas bloquer l'authentification
4. **Émulateurs** : `isDevice: false` indique qu'il s'agit d'un émulateur/simulateur

---

**Dernière mise à jour** : Décembre 2025

