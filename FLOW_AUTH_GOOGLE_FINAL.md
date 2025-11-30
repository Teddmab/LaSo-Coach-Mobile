# 🔐 Flow Authentification Google - Version Finale (SDK Natif)

**Date** : 29 Novembre 2025  
**Version** : 2.1.0 (SDK Natif + Backend Compatible)

---

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTIFICATION GOOGLE                       │
│                         (SDK Natif)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────┴─────────────────────┐
        │                                           │
   INSCRIPTION                                   CONNEXION
   (Nouveau User)                              (User Existant)
        │                                           │
        └─────────────────────┬─────────────────────┘
                              ↓
                    MÊME FLOW TECHNIQUE
                  (Firebase + Backend Auto-Create)
```

---

## 🎯 Flow Détaillé (Étape par Étape)

### Étape 1 : User Clique "Continuer avec Google" 👆

**Écran** : Login ou Register  
**Fichier** : `src/screens/auth/LoginScreen.js` ou `RegisterScreen.js`

```javascript
// User clique sur le bouton
<TouchableOpacity onPress={() => signInWithGoogle()}>
  <Text>Continuer avec Google</Text>
</TouchableOpacity>
```

**Ce qui se passe** :
- `signInWithGoogle()` est appelée
- Provient du hook `useGoogleAuth()`

---

### Étape 2 : Déconnexion Préalable (Force Choix Compte) 🔄

**Fichier** : `src/hooks/useGoogleAuth.js`

```javascript
// NOUVEAU: Force le choix du compte à chaque fois
await GoogleSignin.signOut();
```

**Ce qui se passe** :
- ✅ Déconnecte le compte Google précédent (si existant)
- ✅ Force l'affichage du sélecteur de comptes Google
- ✅ User peut TOUJOURS choisir un autre compte

**Résultat visible** :
```
┌──────────────────────────────────┐
│  Choisir un compte               │
│  ──────────────────────────────  │
│  📧 john@gmail.com               │
│  📧 mary@gmail.com               │
│  ➕ Utiliser un autre compte     │
└──────────────────────────────────┘
```

---

### Étape 3 : Authentification Google Native 📱

**Fichier** : `src/hooks/useGoogleAuth.js`

```javascript
// Ouvre l'UI NATIVE de Google (pas de WebView !)
const userInfo = await GoogleSignin.signIn();
```

**Ce qui se passe** :
- ✅ UI **native** Android/iOS de Google s'ouvre
- ✅ **Pas de WebView**, pas de redirect URI
- ✅ User sélectionne un compte ou s'authentifie
- ✅ Google retourne les informations utilisateur + ID Token

**Résultat** :
```javascript
userInfo = {
  user: {
    email: "john@gmail.com",
    name: "John Doe",
    photo: "https://lh3.googleusercontent.com/...",
  },
  idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjQxMzQ..."  // ✅ Token Firebase
}
```

---

### Étape 4 : Récupération ID Token 🔑

**Fichier** : `src/hooks/useGoogleAuth.js`

```javascript
let idToken = userInfo.idToken;

// Fallback si idToken absent
if (!idToken) {
  const tokens = await GoogleSignin.getTokens();
  idToken = tokens.idToken;
}
```

**Ce qui se passe** :
- ✅ Récupère l'ID Token (JWT signé par Google)
- ✅ Fallback si absent dans `userInfo`
- ✅ Ce token contient toutes les infos user + signature Google

**Structure ID Token** :
```json
{
  "iss": "https://accounts.google.com",
  "sub": "105467890123456789012",
  "email": "john@gmail.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "iat": 1701234567,
  "exp": 1701238167
}
```

---

### Étape 5 : Authentification Firebase 🔥

**Fichier** : `src/services/firebaseAuthServiceNew.js`

```javascript
// Créer un credential Google avec l'ID Token
const credential = GoogleAuthProvider.credential(idToken);

// S'authentifier avec Firebase
const userCredential = await signInWithCredential(auth, credential);
const firebaseUser = userCredential.user;
```

**Ce qui se passe** :
- ✅ Firebase vérifie l'ID Token auprès de Google
- ✅ Firebase crée/récupère l'utilisateur dans Firebase Auth
- ✅ Firebase génère son propre token JWT

**Résultat** :
```javascript
firebaseUser = {
  uid: "kJ8xPzQ9sRh4Nm2Bv1Ty7Wd3Cq",  // ✅ UID Firebase (unique)
  email: "john@gmail.com",
  displayName: "John Doe",
  photoURL: "https://lh3.googleusercontent.com/...",
  emailVerified: true,
  providerData: [
    {
      providerId: "google.com",
      uid: "105467890123456789012"
    }
  ]
}
```

---

### Étape 6 : Récupération Firebase ID Token 🎫

**Automatique via Interceptor**

**Fichier** : `src/services/axiosInterceptor.js`

```javascript
// Intercepte TOUTES les requêtes backend
const token = await firebaseUser.getIdToken();

// Ajoute le token dans les headers
config.headers.Authorization = `Bearer ${token}`;
```

**Ce qui se passe** :
- ✅ Chaque requête backend inclut automatiquement le Firebase ID Token
- ✅ Le backend peut vérifier le token avec Firebase Admin SDK
- ✅ Pas besoin de gérer manuellement les tokens

**Header envoyé** :
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtp...
```

---

### Étape 7 : Authentification Backend (POST /auth/login) 📡

**Fichier** : `src/services/firebaseAuthServiceNew.js`

```javascript
// Obtenir Firebase ID Token
const firebaseIdToken = await firebaseUser.getIdToken();

// Appeler POST /auth/login pour créer/récupérer le profil
const response = await this.backendApi.post('/auth/login', {
  idToken: firebaseIdToken,
  provider: 'google'
});
```

**Ce qui se passe** :
- ✅ Frontend récupère le Firebase ID Token
- ✅ Frontend envoie `POST /auth/login` avec token dans body
- ✅ Backend vérifie le token Firebase
- ✅ Backend cherche l'utilisateur par `firebaseUid`
- ✅ Backend **auto-crée** le profil si Google + nouveau

**Requête HTTP** :
```http
POST https://api.lasocoach.com/api/v1/auth/login
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "provider": "google"
}
```

---

### Étape 8A : Profil Existe ✅ (User Existant)

**Backend trouve l'utilisateur**

**Code Backend** :
```javascript
// Vérifier token Firebase
const decodedToken = await admin.auth().verifyIdToken(idToken);

// Chercher utilisateur
const user = await User.findOne({ firebaseUid: decodedToken.uid });

if (user) {
  return res.json({ success: true, data: user });
}
```

**Réponse Backend** :
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "email": "john@gmail.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://...",
    "role": "USER",
    "status": "ACTIVE",
    "hasSubscription": true,
    "subscription": { ... },
    "createdAt": "2025-11-01T10:00:00Z",
    "updatedAt": "2025-11-29T18:00:00Z"
  }
}
```

**Frontend** :
- ✅ Parse `response.data.data`
- ✅ Stocke le profil complet
- ✅ Redirige vers Dashboard

---

### Étape 8B : Profil N'existe Pas ✅ (Nouveau User Google - Auto-Create)

**Code Backend (POST /auth/login)** :

```javascript
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    // 1. Vérifier Firebase ID Token
    const { idToken } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 2. Chercher utilisateur
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // 3. AUTO-CREATE si Google + utilisateur n'existe pas
    if (!user && decodedToken.firebase?.sign_in_provider === 'google.com') {
      console.log('🆕 Création auto profil Google:', decodedToken.email);
      
      const nameParts = (decodedToken.name || decodedToken.email.split('@')[0]).split(' ');
      
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        role: 'USER',
        status: 'ACTIVE',
        avatar: decodedToken.picture || null,
        phoneNumber: null,
        language: 'fr',
        region: 'FR',
        hasSubscription: false,
        subscriptionStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ Profil créé, ID:', user.id);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // 4. Retourner le profil (existant ou créé)
    return res.json({ success: true, data: user });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

**Réponse Backend** :
```json
{
  "success": true,
  "data": {
    "id": "xyz789",  // ✅ Nouvel ID créé
    "email": "john@gmail.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://lh3.googleusercontent.com/...",
    "role": "USER",
    "status": "ACTIVE",
    "hasSubscription": false,
    "subscriptionStatus": null,
    "createdAt": "2025-11-29T23:45:00Z",  // ✅ Juste créé
    "updatedAt": "2025-11-29T23:45:00Z"
  }
}
```

**Frontend** :
- ✅ Reçoit le profil nouvellement créé
- ✅ Stocke le profil
- ✅ Redirige vers Dashboard

---

### Étape 9 : Redirection & Stockage 🎉

**Fichier** : `src/context/FirebaseAuthContext.js`

**Mode Inscription** :
```javascript
if (isRegistration) {
  // Nouveau compte créé
  navigation.navigate('Dashboard');
  showMessage({
    message: "Compte créé avec succès !",
    type: "success"
  });
}
```

**Mode Connexion** :
```javascript
if (!isRegistration) {
  // Connexion réussie
  navigation.navigate('Dashboard');
  showMessage({
    message: "Bienvenue !",
    type: "success"
  });
}
```

**Stockage** :
```javascript
// currentUser stocké dans le contexte
this.currentUser = {
  uid: firebaseUser.uid,
  email: profile.email,
  name: profile.name,
  firstName: profile.firstName,
  lastName: profile.lastName,
  avatar: profile.avatar,
  role: profile.role,
  hasSubscription: profile.hasSubscription,
  subscription: profile.subscription,
  // ... tous les autres champs
};
```

---

## 🎯 Flow Complet Visuel

```
┌──────────────────────────────────────────────────────────────┐
│  1. User Clique "Continuer avec Google"                      │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  2. GoogleSignin.signOut() - Force choix compte              │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  3. GoogleSignin.signIn() - UI Native Google                 │
│     ✅ User sélectionne un compte                            │
│     ✅ Google retourne userInfo + idToken                    │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  4. Récupération idToken (+ fallback getTokens())            │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  5. Firebase: signInWithCredential(idToken)                  │
│     ✅ Firebase vérifie le token Google                      │
│     ✅ Firebase crée/récupère firebaseUser                   │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  6. Interceptor ajoute Firebase Token aux requêtes           │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  7. POST /auth/login { idToken, provider }                   │
│     Backend vérifie le Firebase ID Token                     │
│     Backend cherche user par firebaseUid                     │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
            ┌────────────┴────────────┐
            │                         │
      USER TROUVÉ              USER PAS TROUVÉ
            ↓                         ↓
┌──────────────────────┐   ┌──────────────────────────┐
│  8A. Retourne profil │   │  8B. Auto-Create Profil  │
│      existant        │   │      (si Google)         │
└──────────┬───────────┘   └────────────┬─────────────┘
           │                            │
           └────────────┬───────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│  9. Frontend reçoit { success: true, data: {...} }           │
│     Stocke currentUser avec TOUS les champs                  │
│     Redirige vers Dashboard                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Différences Avant/Après

### ❌ Ancien Flow (Expo AuthSession - WebView)

```
User → WebView Google → Redirect lasocoach:// → Erreur "invalid redirect"
```

**Problèmes** :
- WebView pas fiable
- Redirect URI complexe
- Erreurs "missing initial state"
- Dépendait d'URLs Expo

---

### ✅ Nouveau Flow (SDK Natif)

```
User → UI Native Google → SDK retourne token → Firebase → Backend
```

**Avantages** :
- ✅ UI native (meilleure UX)
- ✅ Pas de redirect URI
- ✅ Pas de WebView
- ✅ Plus rapide
- ✅ Plus fiable
- ✅ Choix compte forcé
- ✅ Compatible backend

---

## 📊 Données Transmises à Chaque Étape

### Étape 3 → 4 : Google → Frontend
```javascript
{
  user: { email, name, photo },
  idToken: "eyJhbGci..."  // Google ID Token
}
```

### Étape 5 : Frontend → Firebase
```javascript
GoogleAuthProvider.credential(googleIdToken)
```

### Étape 5 → 6 : Firebase → Frontend
```javascript
{
  uid: "firebase_uid",
  email: "user@gmail.com",
  displayName: "John Doe",
  photoURL: "https://...",
  getIdToken() → "eyJhbGci..."  // Firebase ID Token
}
```

### Étape 7 : Frontend → Backend
```http
POST /auth/login
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json

{
  "idToken": "<Firebase ID Token>",
  "provider": "google"
}
```

### Étape 8 : Backend → Frontend
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "subscription": { ... },
    // ... 20+ champs
  }
}
```

---

## 🎯 Résumé en 3 Points

### 1. **SDK Natif Google** ✅
- UI native Android/iOS
- Pas de WebView
- Pas de redirect URI

### 2. **Firebase Auth** ✅
- Vérification token Google
- Génération Firebase token
- Gestion session

### 3. **Backend POST /auth/login** ✅
- ✅ Frontend implémenté
- ⏳ Backend doit implémenter endpoint (~80 lignes)

---

## 📞 Documentation Associée

- **Flow Création Compte** : `FLOW_CREATION_COMPTE_GOOGLE.md`
- **Structure Backend** : `BACKEND_STRUCTURE_API.md`
- **Instructions Backend** : `BACKEND_RESUME_POUR_DEV.md`
- **Changelog** : `CHANGELOG_29NOV2025.md`

---

**Dernière Mise à Jour** : 29 Novembre 2025, 23:55 UTC  
**Version** : 2.1.0 (SDK Natif + Backend Compatible)

