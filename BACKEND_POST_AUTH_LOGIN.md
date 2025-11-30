# 📡 Backend Endpoint: POST /auth/login

**Date** : 29 Novembre 2025  
**Priorité** : 🔴 CRITIQUE  
**Impact** : Google Sign-In

---

## 🎯 Objectif

Créer un endpoint **POST /auth/login** qui :
1. ✅ Vérifie le Firebase ID Token
2. ✅ Récupère le profil utilisateur (si existant)
3. ✅ **Auto-crée le profil** si Google Sign-In + nouvel utilisateur
4. ✅ Retourne le profil complet

---

## 📊 Spécifications

### URL
```
POST /api/v1/auth/login
```

### Headers
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjQxMzQ...",
  "provider": "google"
}
```

**Champs** :
- `idToken` (string, **obligatoire**) : Firebase ID Token
- `provider` (string, **optionnel**) : `"google"` | `"password"` | `"facebook"` etc.

---

## ✅ Réponse Succès (200)

### Cas 1 : Utilisateur Existant

```json
{
  "success": true,
  "data": {
    "id": "0f6c9c38-5b72-4c36-9e9d-123456789abc",
    "email": "john@gmail.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://lh3.googleusercontent.com/...",
    "role": "USER",
    "phoneNumber": "+33123456789",
    "language": "fr",
    "region": "FR",
    "status": "ACTIVE",
    "hasSubscription": true,
    "subscriptionStatus": "ACTIVE",
    "subscription": {
      "id": "4b0e2e45-2f1d-4937-8c31-abcdef123456",
      "status": "ACTIVE",
      "startDate": "2025-11-01T10:15:33.512Z",
      "endDate": "2025-12-01T10:15:33.512Z",
      "plan": { ... }
    },
    "createdAt": "2025-11-01T10:15:33.512Z",
    "updatedAt": "2025-11-29T23:00:00.000Z"
  }
}
```

### Cas 2 : Nouvel Utilisateur Google (Auto-Create)

```json
{
  "success": true,
  "data": {
    "id": "xyz789-new-user-id",
    "email": "newuser@gmail.com",
    "name": "New User",
    "firstName": "New",
    "lastName": "User",
    "avatar": "https://lh3.googleusercontent.com/...",
    "role": "USER",
    "phoneNumber": null,
    "language": "fr",
    "region": "FR",
    "status": "ACTIVE",
    "hasSubscription": false,
    "subscriptionStatus": null,
    "subscription": null,
    "createdAt": "2025-11-29T23:30:00.000Z",  // ✅ Juste créé
    "updatedAt": "2025-11-29T23:30:00.000Z"
  }
}
```

---

## ❌ Réponses Erreur

### 401 Unauthorized (Token Invalide)

```json
{
  "success": false,
  "error": "Invalid credentials",
  "details": "Firebase token verification failed"
}
```

**Causes** :
- Token expiré
- Token malformé
- Token signé avec mauvaise clé

---

### 500 Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

---

## 💻 Implémentation Backend

### Code Complet

```javascript
const admin = require('firebase-admin');
const { User } = require('../models');

/**
 * POST /api/v1/auth/login
 * Login avec Firebase (supporte auto-create pour Google)
 */
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    // 1. Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        details: 'Missing or invalid Authorization header'
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // 2. Vérifier le Firebase ID Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        details: 'Firebase token verification failed'
      });
    }
    
    console.log('✅ Token vérifié, UID Firebase:', decodedToken.uid);
    console.log('📧 Email:', decodedToken.email);
    console.log('🔐 Provider:', decodedToken.firebase?.sign_in_provider);
    
    // 3. Chercher l'utilisateur dans la base de données
    const firebaseUid = decodedToken.uid;
    let user = await User.findOne({ firebaseUid });
    
    // 4. AUTO-CREATE pour Google Sign-In si utilisateur n'existe pas
    if (!user && decodedToken.firebase?.sign_in_provider === 'google.com') {
      console.log('🆕 Nouvel utilisateur Google, création auto du profil...');
      
      // Extraire firstName et lastName du displayName
      const displayName = decodedToken.name || decodedToken.email.split('@')[0];
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Créer le nouvel utilisateur
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: displayName,
        firstName: firstName,
        lastName: lastName,
        role: 'USER',
        status: 'ACTIVE',
        avatar: decodedToken.picture || null,
        phoneNumber: null,
        language: 'fr',
        region: 'FR',
        hasSubscription: false,
        subscriptionStatus: null,
        emailVerified: decodedToken.email_verified || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ Profil créé avec succès, ID:', user.id);
    }
    
    // 5. Si toujours pas d'utilisateur (ex: email/password sans profil backend)
    if (!user) {
      console.log('❌ Utilisateur non trouvé pour UID:', firebaseUid);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        details: 'User not found. Please register first.'
      });
    }
    
    // 6. Mettre à jour lastLoginAt (optionnel)
    user.lastLoginAt = new Date();
    await user.save();
    
    // 7. Retourner le profil complet
    console.log('✅ Login réussi pour:', user.email);
    
    return res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('❌ Erreur POST /auth/login:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});
```

---

## 🔒 Sécurité

### 1. Vérification Token Firebase

```javascript
const decodedToken = await admin.auth().verifyIdToken(idToken);
```

**Garanties** :
- ✅ Token signé par Google/Firebase
- ✅ Token non expiré
- ✅ Utilisateur vérifié par Firebase

### 2. Pas de Password

Pour Google Sign-In :
- ❌ Pas de password stocké
- ✅ Auth déléguée à Google
- ✅ Plus sécurisé qu'un password classique

### 3. Auto-Create Sécurisé

```javascript
if (!user && decodedToken.firebase?.sign_in_provider === 'google.com')
```

**Protections** :
- ✅ Token vérifié AVANT auto-create
- ✅ Seulement pour Google (pas email/password)
- ✅ Email vient du token (pas du body)

---

## 🧪 Tests

### Test 1 : Nouvel Utilisateur Google

**Étapes** :
1. Frontend : Google Sign-In natif
2. Frontend : Obtient Firebase ID Token
3. Frontend : POST /auth/login avec token
4. Backend : Vérifie token ✅
5. Backend : User n'existe pas + provider = google ✅
6. Backend : Crée user auto ✅
7. Backend : Retourne profil

**Commande curl** :
```bash
curl -X POST https://api.lasocoach.com/api/v1/auth/login \
  -H "Authorization: Bearer <FIREBASE_TOKEN_GOOGLE_NOUVEAU>" \
  -H "Content-Type: application/json" \
  -d '{"idToken": "<FIREBASE_TOKEN>", "provider": "google"}'
```

**Attendu** : 200 avec nouveau profil créé

---

### Test 2 : Utilisateur Google Existant

**Étapes** :
1. User Google déjà dans la DB
2. POST /auth/login
3. Backend trouve user
4. Backend retourne profil existant

**Attendu** : 200 avec profil existant

---

### Test 3 : Token Invalide

**Étapes** :
1. POST /auth/login avec token expiré/invalide
2. Firebase Admin SDK rejette

**Attendu** : 401 "Invalid credentials"

---

## 📊 Données Firebase Token

Le Firebase ID Token contient :

```javascript
decodedToken = {
  uid: "kJ8xPzQ9sRh4Nm2Bv1Ty7Wd3Cq",     // UID Firebase (unique)
  email: "user@gmail.com",
  email_verified: true,
  name: "John Doe",                       // DisplayName
  picture: "https://lh3.googleusercontent.com/...",
  firebase: {
    sign_in_provider: "google.com",      // ✅ Important !
    identities: {
      "google.com": ["105467890123456789012"]
    }
  },
  iat: 1701234567,  // Issued At
  exp: 1701238167,  // Expiration (1h après iat)
  iss: "https://securetoken.google.com/lasocoach-39710",
  aud: "lasocoach-39710",
  sub: "kJ8xPzQ9sRh4Nm2Bv1Ty7Wd3Cq"
}
```

---

## 🔄 Flow Complet

```
Frontend
   │
   ↓ 1. Google Sign-In natif
   │
   ↓ 2. Firebase.signInWithCredential(googleToken)
   │
   ↓ 3. Obtient Firebase ID Token
   │
   ↓ 4. POST /auth/login { idToken }
   │
Backend
   │
   ↓ 5. Vérifie token avec Firebase Admin SDK
   │
   ↓ 6. Cherche user par firebaseUid
   │
   ├─────────┬─────────────┐
   │         │             │
TROUVÉ   PAS TROUVÉ    PAS TROUVÉ
Google    Google       Email/Pass
   │         │             │
   ↓         ↓             ↓
Retourne  Crée Auto    401 Error
Profil    Profil       (register first)
   │         │
   └────┬────┘
        │
        ↓ 7. Return { success: true, data: user }
        │
Frontend
   │
   ↓ 8. Stocke currentUser
   │
   ↓ 9. Redirige Dashboard
```

---

## ✅ Checklist Implémentation

- [ ] Installer Firebase Admin SDK (`npm install firebase-admin`)
- [ ] Configurer Firebase Admin avec service account
- [ ] Créer route POST /auth/login
- [ ] Vérifier token avec `admin.auth().verifyIdToken()`
- [ ] Chercher user par `firebaseUid`
- [ ] Ajouter condition auto-create pour Google
- [ ] Extraire firstName/lastName du displayName
- [ ] Créer user avec tous les champs
- [ ] Retourner `{ success: true, data: user }`
- [ ] Tester avec nouveau user Google
- [ ] Tester avec user Google existant
- [ ] Tester avec token invalide

---

## 📞 Questions/Précisions

**Q1 : Faut-il aussi gérer email/password dans POST /auth/login ?**

Optionnel. Pour l'instant, POST /auth/login peut :
- ✅ Gérer Google (auto-create)
- ✅ Gérer email/password (login seulement, pas de create)

Ou bien créer un endpoint séparé POST /auth/login/google.

---

**Q2 : Le body `{ idToken, provider }` est-il nécessaire ?**

Le `provider` est **optionnel** car le backend peut le déduire de `decodedToken.firebase.sign_in_provider`.

Mais ça peut être utile pour :
- Validation côté frontend
- Logging/Analytics

---

**Q3 : Que faire si Firebase Admin n'est pas configuré ?**

Installer Firebase Admin SDK :

```bash
npm install firebase-admin
```

Configurer avec service account :

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

---

## 🎯 Résumé

**Endpoint** : POST /auth/login  
**Fonction** : Login + Auto-create Google  
**Code Backend** : ~80 lignes  
**Temps Estimé** : 1-2 heures  
**Priorité** : 🔴 CRITIQUE

---

**Dernière Mise à Jour** : 29 Novembre 2025  
**Version** : 1.0  
**Contact Frontend** : Moses

