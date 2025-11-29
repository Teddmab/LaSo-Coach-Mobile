# 🎯 Flow Complet : Création de Compte avec Google

## 📋 Vue d'Ensemble

Ce document explique **étape par étape** ce qui se passe lorsqu'un utilisateur crée un compte avec Google, depuis le clic sur le bouton jusqu'au stockage final des données.

---

## 🔄 Schéma du Flow

```
User clique "Continuer avec Google" (RegisterScreen)
         ↓
Google Sign-In SDK Natif (UI native Android)
         ↓
Google retourne idToken
         ↓
Firebase Authentication (signInWithCredential)
         ↓
Backend API (création profil utilisateur)
         ↓
Redirection vers Dashboard
```

---

## 📝 Étapes Détaillées

### 1️⃣ Utilisateur sur RegisterScreen

**Fichier** : `src/screens/RegisterScreen.js`

**Action** :
```javascript
const handleGoogleSignup = async () => {
  setGeneralError(null);
  const result = await triggerGoogleSignIn(); // Mode registration = true
  
  if (result.error) {
    setGeneralError(result.error);
  } else {
    // Success - navigation handled by auth context
  }
};
```

**Hook utilisé** :
```javascript
const { signInWithGoogle: triggerGoogleSignIn } = useGoogleAuth(true);
//                                                                ↑
//                                                          true = mode registration
```

---

### 2️⃣ Google Sign-In (SDK Natif)

**Fichier** : `src/hooks/useGoogleAuth.js`

**Processus** :

1. **Configuration du SDK** (au montage du composant) :
```javascript
GoogleSignin.configure({
  webClientId: '855620848279-r239q8v3pq6r37156hddd7lrt6j5mfc2.apps.googleusercontent.com',
  offlineAccess: true,              // Force l'obtention de l'idToken
  forceCodeForRefreshToken: true,
  scopes: ['email', 'profile'],
});
```

2. **Ouverture de l'UI native** :
```javascript
const userInfo = await GoogleSignin.signIn();
// L'UI native de Google s'ouvre (pas de WebView)
```

3. **Données retournées par Google** :
```javascript
{
  idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjQx...",
  serverAuthCode: null,
  scopes: ["email", "profile"],
  user: {
    email: "user@gmail.com",
    id: "105467890123456789012",
    givenName: "John",
    familyName: "Doe",
    name: "John Doe",
    photo: "https://lh3.googleusercontent.com/..."
  }
}
```

4. **Récupération de l'idToken** :
```javascript
let idToken = userInfo.idToken;

// Solution de secours si absent
if (!idToken) {
  const tokens = await GoogleSignin.getTokens();
  idToken = tokens.idToken;
}
```

5. **Appel de la fonction d'authentification** :
```javascript
// Mode registration = true → registerWithGoogle
const result = await registerWithGoogle(idToken);
```

---

### 3️⃣ Firebase Authentication

**Fichier** : `src/services/firebaseAuthServiceNew.js`

**Fonction** : `registerWithGoogle(googleIdToken)`

**Processus** :

1. **Créer un credential Google** :
```javascript
const { GoogleAuthProvider, signInWithCredential } = require('firebase/auth');
const credential = GoogleAuthProvider.credential(googleIdToken);
```

2. **S'authentifier avec Firebase** :
```javascript
const userCredential = await signInWithCredential(auth, credential);
const firebaseUser = userCredential.user;
```

3. **Données créées dans Firebase Authentication** :
```javascript
{
  uid: "kJ8xPzQ9sRh4Nm2Bv1Ty7Wd3Cq",           // Firebase User ID
  email: "user@gmail.com",
  displayName: "John Doe",
  photoURL: "https://lh3.googleusercontent.com/...",
  emailVerified: true,
  metadata: {
    creationTime: "2025-11-29T10:30:00Z",
    lastSignInTime: "2025-11-29T10:30:00Z"
  },
  providerData: [{
    providerId: "google.com",
    uid: "105467890123456789012",              // Google User ID
    displayName: "John Doe",
    email: "user@gmail.com",
    photoURL: "https://lh3.googleusercontent.com/..."
  }]
}
```

4. **Vérifier si c'est un nouvel utilisateur** :
```javascript
const isNewUser = userCredential.additionalUserInfo?.isNewUser;

if (!isNewUser) {
  // Vérifier si profil existe dans le backend
  const profile = await this.getUserProfile();
  if (profile) {
    throw new Error("Ce compte existe déjà. Veuillez vous connecter.");
  }
}
```

---

### 4️⃣ Backend API (Création du Profil)

**URL Backend** : `https://laso-coach-backend.onrender.com/api/v1`

**Endpoint** : `GET /profile`

**Fonction** : `getUserProfile()`

```javascript
async getUserProfile() {
  const response = await this.backendApi.get('/profile');
  // this.backendApi inclut automatiquement le Firebase ID Token dans l'Authorization header
  return response.data.data || response.data;
}
```

**Requête HTTP** :
```http
GET https://laso-coach-backend.onrender.com/api/v1/profile
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjQx...
Content-Type: application/json
```

**Réponse attendue** (si profil existe) :
```json
{
  "success": true,
  "data": {
    "id": "123",
    "firebaseUid": "kJ8xPzQ9sRh4Nm2Bv1Ty7Wd3Cq",
    "email": "user@gmail.com",
    "displayName": "John Doe",
    "photoURL": "https://lh3.googleusercontent.com/...",
    "role": "USER",
    "createdAt": "2025-11-29T10:30:00Z",
    "lastLogin": "2025-11-29T10:30:00Z",
    "preferences": {
      "language": "fr",
      "notifications": true
    }
  }
}
```

**Réponse si profil n'existe pas** (nouvel utilisateur) :
```json
{
  "success": false,
  "error": "User not found"
}
```

**Note** : Pour un nouvel utilisateur Google, le backend devrait **créer automatiquement le profil** lors du premier appel à `/profile` si l'utilisateur Firebase existe mais pas le profil backend.

---

### 5️⃣ Stockage des Données

#### A. Firebase Authentication (Automatique)

**Localisation** : Firebase Console → Authentication → Users

**URL** : https://console.firebase.google.com/project/lasocoach-39710/authentication/users

**Données stockées** :
- UID Firebase
- Email
- Display Name
- Photo URL
- Provider (google.com)
- Email Verified
- Creation Time
- Last Sign In Time

**Accès** : Permanent (jusqu'à suppression du compte)

#### B. Backend Database (Render.com)

**Localisation** : `https://laso-coach-backend.onrender.com`

**Base de données** : Probablement PostgreSQL ou MongoDB

**Table/Collection** : `users` ou équivalent

**Données stockées** :
```javascript
{
  id: "123",                                    // ID interne backend
  firebaseUid: "kJ8xPzQ9sRh4Nm2Bv1Ty7Wd3Cq",  // Lien avec Firebase
  email: "user@gmail.com",
  displayName: "John Doe",
  photoURL: "https://...",
  role: "USER",
  status: "ACTIVE",
  createdAt: "2025-11-29T10:30:00Z",
  updatedAt: "2025-11-29T10:30:00Z",
  lastLogin: "2025-11-29T10:30:00Z",
  preferences: {
    language: "fr",
    notifications: true,
    theme: "light"
  },
  profile: {
    phone: null,
    address: null,
    birthDate: null,
    gender: null
  },
  subscription: {
    plan: "FREE",
    status: "ACTIVE",
    expiresAt: null
  },
  onboardingComplete: false,
  emailVerified: true
}
```

**Accès Backend** : Via API REST avec JWT (Firebase ID Token)

---

### 6️⃣ Contexte d'Authentification

**Fichier** : `src/context/FirebaseAuthContext.js`

**Mise à jour du state** :
```javascript
this.currentUser = {
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  emailVerified: firebaseUser.emailVerified,
  // + données du backend si disponibles
};
```

**Storage local** :
```javascript
// AsyncStorage (React Native)
@RNAsyncStorage:lasocoach:user = {
  uid: "kJ8xPzQ9sRh4Nm2Bv1Ty7Wd3Cq",
  email: "user@gmail.com",
  // ...
}
```

---

### 7️⃣ Redirection vers Dashboard

**Navigation automatique** (gérée par le contexte d'authentification) :

```javascript
// Dans App.js ou Navigation
{currentUser ? (
  <MainNavigator /> // Dashboard, etc.
) : (
  <AuthNavigator /> // Login, Register
)}
```

**Toast de succès** :
```javascript
Toast.show({
  type: 'success',
  text1: 'Compte créé avec succès !',
  text2: `Bienvenue ${currentUser.displayName}`
});
```

---

## 📊 Résumé du Stockage des Données

| Donnée | Firebase Auth | Backend DB | AsyncStorage |
|--------|--------------|------------|--------------|
| **UID** | ✅ | ✅ (firebaseUid) | ✅ |
| **Email** | ✅ | ✅ | ✅ |
| **Display Name** | ✅ | ✅ | ✅ |
| **Photo URL** | ✅ | ✅ | ✅ |
| **Email Verified** | ✅ | ✅ | ✅ |
| **Role** | ❌ | ✅ | ✅ |
| **Preferences** | ❌ | ✅ | ✅ |
| **Subscription** | ❌ | ✅ | ❌ |
| **Profile Details** | ❌ | ✅ | ❌ |
| **Last Login** | ✅ | ✅ | ❌ |

---

## 🔍 Vérifier les Données Créées

### 1. Firebase Authentication

**URL** : https://console.firebase.google.com/project/lasocoach-39710/authentication/users

**Recherche** : Par email ou UID

**Données visibles** :
- User ID (UID)
- Providers (google.com)
- Email
- Created
- Signed In
- User UID

### 2. Backend Database

**Méthode 1 : Via l'API**

```bash
# Récupérer un token Firebase ID
firebase auth:export users.json --project lasocoach-39710

# Utiliser le token pour appeler l'API
curl -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
     https://laso-coach-backend.onrender.com/api/v1/profile
```

**Méthode 2 : Logs Backend**

Vérifier les logs du backend sur Render.com pour voir les requêtes de création de profil.

### 3. AsyncStorage (Local)

**Sur l'appareil** :

```bash
# Connecter en ADB
adb shell

# Voir les données AsyncStorage
run-as com.afrotouch.lasocoach
cd /data/data/com.afrotouch.lasocoach/files/RCTAsyncLocalStorage
cat manifest.json
```

---

## ⚠️ Points d'Attention

### 1. Backend Requis

**L'application nécessite un backend** pour stocker les profils utilisateurs complets.

Si le backend n'est pas accessible :
- ✅ Firebase Authentication fonctionne
- ❌ `getUserProfile()` échoue
- ❌ Les fonctionnalités nécessitant le profil ne fonctionnent pas

### 2. Synchronisation Firebase ↔ Backend

**Important** : Le backend doit :
1. Vérifier le Firebase ID Token
2. Créer un profil si premier login Google
3. Retourner le profil existant si déjà créé

**Code backend attendu** (exemple Node.js) :
```javascript
app.get('/api/v1/profile', authenticateFirebase, async (req, res) => {
  const firebaseUid = req.user.uid; // Extrait du token Firebase
  
  // Chercher profil existant
  let user = await User.findOne({ firebaseUid });
  
  // Si pas trouvé, créer automatiquement pour Google Sign-In
  if (!user && req.user.firebase.sign_in_provider === 'google.com') {
    user = await User.create({
      firebaseUid: req.user.uid,
      email: req.user.email,
      displayName: req.user.name,
      photoURL: req.user.picture,
      role: 'USER',
      emailVerified: req.user.email_verified,
    });
  }
  
  res.json({ success: true, data: user });
});
```

### 3. Gestion des Erreurs

**Scénarios possibles** :

| Scénario | Comportement actuel | Recommandation |
|----------|-------------------|----------------|
| Backend down | Erreur "Impossible de récupérer les informations" | Fallback sur Firebase Auth uniquement |
| Compte Google existe dans Firebase mais pas dans backend | Erreur | Backend doit créer auto |
| Compte existe déjà (register) | Message clair | ✅ OK |
| Pas d'internet | Erreur réseau | Message clair avec retry |

---

## 🚀 Améliorations Possibles

### 1. Mode Offline (Fallback)

Si le backend est inaccessible, permettre l'utilisation de l'app avec Firebase Auth uniquement :

```javascript
async registerWithGoogle(googleIdToken) {
  // Firebase Auth
  const userCredential = await signInWithCredential(auth, credential);
  
  // Tenter de créer/récupérer profil backend
  let profile = null;
  try {
    profile = await this.getUserProfile();
  } catch (error) {
    console.warn('Backend inaccessible, mode offline');
    // Utiliser uniquement les données Firebase
  }
  
  return {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    ...profile, // Si disponible
  };
}
```

### 2. Firestore comme Alternative

Utiliser Firestore au lieu d'un backend séparé :

```javascript
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const db = getFirestore();

// Créer/Mettre à jour profil dans Firestore
await setDoc(doc(db, 'users', uid), {
  email: user.email,
  displayName: user.displayName,
  createdAt: new Date(),
  // ...
});

// Récupérer profil
const docSnap = await getDoc(doc(db, 'users', uid));
const profile = docSnap.data();
```

### 3. Synchronisation Automatique

Créer un Cloud Function Firebase qui synchronise automatiquement :

```javascript
// Firebase Cloud Function
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Créer profil dans Firestore automatiquement
  await admin.firestore().collection('users').doc(user.uid).set({
    email: user.email,
    displayName: user.displayName,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});
```

---

## 📞 Support

**Backend URL** : https://laso-coach-backend.onrender.com

**Repository Backend** : À documenter

**Firebase Console** : https://console.firebase.google.com/project/lasocoach-39710

**Contact** : Support technique LaSo Coach

---

**Date** : 29 Novembre 2025  
**Version** : 1.0  
**Status** : ✅ Documenté

