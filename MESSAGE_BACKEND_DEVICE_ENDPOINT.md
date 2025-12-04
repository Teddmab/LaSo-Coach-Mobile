# 📧 Message Pour le Backend - Endpoint Sécurisé pour Informations d'Appareil

**Date** : Décembre 2025  
**Sujet** : Création d'un endpoint sécurisé pour enregistrer les informations de l'appareil  
**Priorité** : 🟡 MOYENNE  
**Impact** : Analytics, Sécurité, Support

---

## 🎯 Objectif

Créer un endpoint **sécurisé et dédié** pour enregistrer/mettre à jour les informations de l'appareil (version Android, fabricant, modèle, etc.) séparément du flux d'authentification.

**Avantages** :
- ✅ Séparation des responsabilités (auth vs device tracking)
- ✅ Endpoint sécurisé avec authentification requise
- ✅ Possibilité de mettre à jour les infos d'appareil indépendamment
- ✅ Meilleure gestion de la sécurité (détection de nouveaux appareils)
- ✅ Analytics plus précis

---

## 📊 Spécifications de l'Endpoint

### URL
```
POST /api/v1/devices/register
```

### Authentification
**REQUIS** : L'utilisateur doit être authentifié
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
```

### Request Body
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

**Champs** :
- `platform` (string, **obligatoire**) : `"android"` | `"ios"`
- `platformVersion` (string|number, **obligatoire**) : Version de la plateforme
- `manufacturer` (string, **obligatoire**) : Fabricant (ex: `"Samsung"`, `"Google"`, `"Apple"`)
- `modelName` (string, **obligatoire**) : Nom du modèle (ex: `"SM-G991B"`, `"Pixel 7"`)
- `deviceName` (string, **obligatoire**) : Nom complet de l'appareil
- `osName` (string, **obligatoire**) : `"Android"` | `"iOS"`
- `osVersion` (string, **obligatoire**) : Version complète du système
- `deviceType` (string, **optionnel**) : `"PHONE"` | `"TABLET"` | `"DESKTOP"` | `"TV"` | `"UNKNOWN"`
- `isDevice` (boolean, **obligatoire**) : `true` si appareil physique (pas émulateur)
- `appVersion` (string, **obligatoire**) : Version de l'application
- `appBuildNumber` (string, **optionnel**) : Numéro de build
- `osBuildId` (string, **optionnel**) : Build ID du système
- `brand` (string, **optionnel**, Android uniquement) : Marque (ex: `"samsung"`)
- `modelId` (string, **optionnel**, Android uniquement) : ID du modèle
- `deviceYearClass` (number, **optionnel**, iOS uniquement) : Année de sortie

---

## ✅ Réponse Succès (200)

### Cas 1 : Nouvel Appareil (Création)
```json
{
  "success": true,
  "message": "Appareil enregistré avec succès",
  "data": {
    "id": "device-uuid-123",
    "userId": "user-uuid-456",
    "platform": "android",
    "manufacturer": "Samsung",
    "modelName": "SM-G991B",
    "deviceName": "Galaxy S21",
    "osVersion": "13.0",
    "appVersion": "1.0.0",
    "isDevice": true,
    "isActive": true,
    "lastSeenAt": "2025-12-01T10:15:33.512Z",
    "registeredAt": "2025-12-01T10:15:33.512Z",
    "updatedAt": "2025-12-01T10:15:33.512Z"
  }
}
```

### Cas 2 : Appareil Existant (Mise à Jour)
```json
{
  "success": true,
  "message": "Informations de l'appareil mises à jour",
  "data": {
    "id": "device-uuid-123",
    "userId": "user-uuid-456",
    "platform": "android",
    "manufacturer": "Samsung",
    "modelName": "SM-G991B",
    "deviceName": "Galaxy S21",
    "osVersion": "13.0",
    "appVersion": "1.0.1",  // ✅ Version mise à jour
    "isDevice": true,
    "isActive": true,
    "lastSeenAt": "2025-12-01T15:30:00.000Z",  // ✅ Dernière connexion mise à jour
    "registeredAt": "2025-11-15T10:15:33.512Z",
    "updatedAt": "2025-12-01T15:30:00.000Z"
  }
}
```

---

## ❌ Réponses Erreur

### 401 Unauthorized (Non Authentifié)
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Token d'authentification manquant ou invalide"
}
```

### 400 Bad Request (Données Invalides)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Champs obligatoires manquants",
  "details": {
    "platform": "Ce champ est obligatoire",
    "manufacturer": "Ce champ est obligatoire"
  }
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Erreur lors de l'enregistrement de l'appareil"
}
```

---

## 💻 Implémentation Backend Suggérée

### Logique Métier

1. **Vérifier l'authentification** : Valider le Firebase ID Token
2. **Identifier l'appareil** : Créer un identifiant unique basé sur :
   - `platform` + `manufacturer` + `modelName` + `osVersion` + `userId`
   - Ou utiliser un hash de ces champs
3. **Créer ou Mettre à Jour** :
   - Si l'appareil existe déjà pour cet utilisateur → Mettre à jour `lastSeenAt`, `appVersion`, etc.
   - Si nouvel appareil → Créer un nouvel enregistrement
4. **Retourner les données** : Retourner l'appareil créé/mis à jour

### Exemple de Code (Node.js/Express)

```javascript
const admin = require('firebase-admin');
const crypto = require('crypto');

/**
 * POST /api/v1/devices/register
 * Enregistre ou met à jour les informations de l'appareil
 */
app.post('/api/v1/devices/register', async (req, res) => {
  try {
    // 1. Vérifier l'authentification
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token d\'authentification manquant ou invalide'
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // 2. Vérifier le Firebase ID Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token d\'authentification invalide'
      });
    }
    
    const userId = decodedToken.uid;
    
    // 3. Valider les données
    const {
      platform,
      platformVersion,
      manufacturer,
      modelName,
      deviceName,
      osName,
      osVersion,
      deviceType,
      isDevice,
      appVersion,
      appBuildNumber,
      brand,
      modelId,
    } = req.body;
    
    // Validation des champs obligatoires
    if (!platform || !manufacturer || !modelName || !osVersion || !appVersion) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Champs obligatoires manquants',
        details: {
          platform: !platform ? 'Ce champ est obligatoire' : undefined,
          manufacturer: !manufacturer ? 'Ce champ est obligatoire' : undefined,
          modelName: !modelName ? 'Ce champ est obligatoire' : undefined,
          osVersion: !osVersion ? 'Ce champ est obligatoire' : undefined,
          appVersion: !appVersion ? 'Ce champ est obligatoire' : undefined,
        }
      });
    }
    
    // 4. Créer un identifiant unique pour l'appareil
    const deviceIdentifier = crypto
      .createHash('sha256')
      .update(`${userId}-${platform}-${manufacturer}-${modelName}-${osVersion}`)
      .digest('hex');
    
    // 5. Chercher l'appareil existant
    let device = await Device.findOne({
      userId: userId,
      deviceIdentifier: deviceIdentifier
    });
    
    const now = new Date();
    
    if (device) {
      // Mettre à jour l'appareil existant
      device.lastSeenAt = now;
      device.updatedAt = now;
      device.appVersion = appVersion;
      device.appBuildNumber = appBuildNumber || device.appBuildNumber;
      device.isActive = true;
      
      await device.save();
      
      return res.json({
        success: true,
        message: 'Informations de l\'appareil mises à jour',
        data: device
      });
    } else {
      // Créer un nouvel appareil
      device = await Device.create({
        id: crypto.randomUUID(),
        userId: userId,
        deviceIdentifier: deviceIdentifier,
        platform: platform,
        platformVersion: platformVersion,
        manufacturer: manufacturer,
        modelName: modelName,
        deviceName: deviceName,
        osName: osName,
        osVersion: osVersion,
        osBuildId: req.body.osBuildId || null,
        deviceType: deviceType || 'PHONE',
        isDevice: isDevice !== undefined ? isDevice : true,
        appVersion: appVersion,
        appBuildNumber: appBuildNumber || null,
        brand: brand || null,
        modelId: modelId || null,
        isActive: true,
        registeredAt: now,
        lastSeenAt: now,
        updatedAt: now,
      });
      
      return res.json({
        success: true,
        message: 'Appareil enregistré avec succès',
        data: device
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur POST /devices/register:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erreur lors de l\'enregistrement de l\'appareil'
    });
  }
});
```

---

## 🗄️ Structure de Base de Données Suggérée

### Table `devices`

```sql
CREATE TABLE devices (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  device_identifier VARCHAR(255) NOT NULL, -- Hash unique pour identifier l'appareil
  platform ENUM('android', 'ios') NOT NULL,
  platform_version VARCHAR(50),
  manufacturer VARCHAR(255) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  os_name VARCHAR(50) NOT NULL,
  os_version VARCHAR(50) NOT NULL,
  os_build_id VARCHAR(255),
  device_type ENUM('PHONE', 'TABLET', 'DESKTOP', 'TV', 'UNKNOWN') DEFAULT 'PHONE',
  is_device BOOLEAN DEFAULT true,
  app_version VARCHAR(50) NOT NULL,
  app_build_number VARCHAR(50),
  brand VARCHAR(255), -- Android uniquement
  model_id VARCHAR(255), -- Android uniquement
  device_year_class INT, -- iOS uniquement
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMP NOT NULL,
  last_seen_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_device_identifier (device_identifier),
  INDEX idx_user_device (user_id, device_identifier),
  INDEX idx_last_seen (last_seen_at),
  INDEX idx_is_active (is_active),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔒 Sécurité

### 1. Authentification Requise
- ✅ L'endpoint nécessite un Firebase ID Token valide
- ✅ Le token est vérifié à chaque requête
- ✅ L'utilisateur ne peut enregistrer que ses propres appareils

### 2. Validation des Données
- ✅ Validation des champs obligatoires
- ✅ Validation du format des données
- ✅ Protection contre l'injection SQL (si applicable)

### 3. Rate Limiting
- ✅ Limiter à 10 requêtes par minute par utilisateur
- ✅ Éviter le spam d'enregistrements

### 4. Identification Unique
- ✅ Utiliser un hash pour identifier de manière unique l'appareil
- ✅ Empêcher les doublons pour le même utilisateur

---

## 📱 Utilisation Frontend

Le frontend appelle automatiquement cet endpoint **après chaque authentification réussie** :

```javascript
// Après login/loginWithGoogle/register
deviceApi.registerDevice()
  .then(result => {
    console.log('✅ Appareil enregistré:', result);
  })
  .catch(error => {
    // Ne bloque pas l'authentification si cela échoue
    console.warn('⚠️ Échec enregistrement appareil:', error);
  });
```

---

## 🧪 Tests

### Test 1 : Nouvel Appareil
```bash
curl -X POST https://api.lasocoach.com/api/v1/devices/register \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "android",
    "platformVersion": 13,
    "manufacturer": "Samsung",
    "modelName": "SM-G991B",
    "deviceName": "Galaxy S21",
    "osName": "Android",
    "osVersion": "13.0",
    "deviceType": "PHONE",
    "isDevice": true,
    "appVersion": "1.0.0"
  }'
```

**Attendu** : 200 avec nouvel appareil créé

### Test 2 : Appareil Existant (Mise à Jour)
```bash
# Même requête avec version app différente
curl -X POST https://api.lasocoach.com/api/v1/devices/register \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "android",
    "platformVersion": 13,
    "manufacturer": "Samsung",
    "modelName": "SM-G991B",
    "deviceName": "Galaxy S21",
    "osName": "Android",
    "osVersion": "13.0",
    "deviceType": "PHONE",
    "isDevice": true,
    "appVersion": "1.0.1"  // ✅ Version mise à jour
  }'
```

**Attendu** : 200 avec appareil mis à jour

### Test 3 : Token Invalide
```bash
curl -X POST https://api.lasocoach.com/api/v1/devices/register \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Attendu** : 401 Unauthorized

---

## 📋 Checklist Implémentation

- [ ] Créer la table `devices` dans la base de données
- [ ] Créer l'endpoint `POST /api/v1/devices/register`
- [ ] Implémenter la vérification du Firebase ID Token
- [ ] Implémenter la validation des données
- [ ] Implémenter la logique create/update
- [ ] Ajouter les index nécessaires
- [ ] Implémenter le rate limiting
- [ ] Tester avec nouvel appareil
- [ ] Tester avec appareil existant
- [ ] Tester avec token invalide
- [ ] Documenter l'endpoint dans l'API

---

## 🎯 Cas d'Usage

1. **Analytics** : Comprendre quels appareils utilisent l'application
2. **Sécurité** : Détecter les connexions depuis de nouveaux appareils
3. **Support** : Aider les utilisateurs avec des problèmes spécifiques à leur appareil
4. **Optimisation** : Adapter l'expérience selon le type d'appareil
5. **Gestion des Sessions** : Suivre les appareils actifs de l'utilisateur

---

## 📞 Questions/Précisions

**Q1 : Faut-il aussi créer un endpoint pour lister les appareils ?**

**Réponse** : Oui, c'est recommandé pour permettre à l'utilisateur de voir ses appareils enregistrés :
- `GET /api/v1/devices` : Liste tous les appareils de l'utilisateur
- `DELETE /api/v1/devices/:deviceId` : Supprimer un appareil

**Q2 : Comment gérer les appareils inactifs ?**

**Réponse** : Marquer comme `isActive: false` si `lastSeenAt` > 30 jours. Optionnellement, supprimer après 90 jours d'inactivité.

**Q3 : Faut-il limiter le nombre d'appareils par utilisateur ?**

**Réponse** : Recommandé de limiter à 5-10 appareils actifs par utilisateur pour éviter les abus.

---

## 🎯 Résumé

**Endpoint** : `POST /api/v1/devices/register`  
**Authentification** : ✅ REQUIS (Firebase ID Token)  
**Fonction** : Enregistrer/Mettre à jour les informations de l'appareil  
**Code Backend** : ~150 lignes  
**Temps Estimé** : 2-3 heures  
**Priorité** : 🟡 MOYENNE

---

**Dernière Mise à Jour** : Décembre 2025  
**Version** : 1.0  
**Contact Frontend** : Moses

