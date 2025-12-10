# 📋 Fichiers Intervenant entre Déconnexion et Connexion Google

## 🔄 Flux Complet

```
DÉCONNEXION (Paramètres)
    ↓
FirebaseAuthContext.tsx (logout)
    ↓
firebaseAuthServiceNew.ts (logout)
    ↓
[AsyncStorage nettoyé + Firebase déconnecté + Google Sign-In supprimé]
    ↓
[Utilisateur sur LoginScreen]
    ↓
LoginScreen.tsx (handleGoogleLogin)
    ↓
useGoogleAuth.ts (signInWithGoogle)
    ↓
firebaseAuthServiceNew.ts (loginWithGoogle)
    ↓
FirebaseAuthContext.tsx (loginWithGoogle)
    ↓
[Utilisateur connecté]
```

---

## 📁 Fichiers Impliqués

### 1. **DÉCONNEXION** 🔴

#### `src/context/FirebaseAuthContext.tsx`
**Rôle** : Point d'entrée de la déconnexion depuis l'UI
**Fonction** : `logout()` (ligne ~419)
**Ce qu'il fait** :
- Appelle `firebaseAuthService.logout()`
- Met à jour l'état Redux
- Appelle `clearPersistedUser()`
- Affiche un Toast de confirmation

**Code clé** :
```typescript
const logout = async (): Promise<void> => {
  await firebaseAuthService.logout();
  clearPersistedUser();
  dispatch({ type: AUTH_ACTIONS.LOGOUT });
}
```

---

#### `src/services/firebaseAuthServiceNew.ts`
**Rôle** : Service qui gère la déconnexion complète
**Fonction** : `logout()` (ligne ~719)
**Ce qu'il fait** :
1. **Nettoie AsyncStorage** (tous les tokens + données)
2. **Déconnecte Firebase** (`auth.signOut()`)
3. **Déconnecte Google Sign-In** (`_forceBrutalGoogleSignOut()`)

**Fonction appelée** : `_forceBrutalGoogleSignOut()` (ligne ~473)
- 7 cycles de déconnexion Google Sign-In
- Supprime comptes réels + fantômes
- Nettoie le cache Android

**Code clé** :
```typescript
async logout() {
  // 1. Nettoyer AsyncStorage
  await AsyncStorage.multiRemove([...toutes les clés...]);
  
  // 2. Déconnecter Firebase
  await auth.signOut();
  
  // 3. Déconnexion brutale Google Sign-In
  await this._forceBrutalGoogleSignOut();
}
```

---

#### `src/services/authPersistence.ts`
**Rôle** : Gestion de la persistance utilisateur
**Fonction** : `clearPersistedUser()` (ligne ~33)
**Ce qu'il fait** :
- Supprime la clé `laso_auth_user_v1` d'AsyncStorage
- Nettoie les données utilisateur persistées

**Code clé** :
```typescript
export async function clearPersistedUser() {
  await AsyncStorage.removeItem('laso_auth_user_v1');
}
```

---

### 2. **CONNEXION GOOGLE** 🟢

#### `src/screens/LoginScreen.tsx`
**Rôle** : Écran de connexion - point d'entrée utilisateur
**Fonction** : `handleGoogleLogin()` (ligne ~96)
**Ce qu'il fait** :
- Appelle `triggerGoogleSignIn()` depuis `useGoogleAuth()`
- Gère les erreurs d'affichage
- Ne montre pas d'erreur si l'utilisateur annule

**Code clé** :
```typescript
const handleGoogleLogin = async (): Promise<void> => {
  const result = await triggerGoogleSignIn();
  if (result?.error) {
    setErrors({ general: result.error });
  }
}
```

**Hook utilisé** :
```typescript
const {
  signInWithGoogle: triggerGoogleSignIn,
  isAvailable: isGoogleAvailable,
  isPrompting: isGooglePrompting,
} = useGoogleAuth();
```

---

#### `src/hooks/useGoogleAuth.ts`
**Rôle** : Hook qui gère l'authentification Google native
**Fonction** : `signInWithGoogle()` (ligne ~202)
**Ce qu'il fait** :
1. **Déconnexion brutale** avant chaque connexion (`forceBrutalSignOut()`)
2. **Boucle de déconnexion silencieuse** (jusqu'à 5 tentatives)
3. **Vérification finale** avant `signIn()` (jusqu'à 3 tentatives)
4. **Appel Google Sign-In** (`GoogleSignin.signIn()`)
5. **Récupération idToken**
6. **Appel Firebase** via `loginWithGoogle()` ou `registerWithGoogle()`

**Fonction appelée** : `forceBrutalSignOut()` (ligne ~78)
- 3 cycles de déconnexion Google Sign-In
- Nettoie le cache avant chaque connexion

**Code clé** :
```typescript
const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  // Déconnexion brutale
  await forceBrutalSignOut();
  
  // Boucle de déconnexion silencieuse
  // ... vérifications ...
  
  // Appel Google Sign-In
  const userInfo = await GoogleSignin.signIn();
  
  // Récupération idToken
  let idToken = userInfo.idToken || await GoogleSignin.getTokens();
  
  // Appel Firebase
  result = await googleAuthFunction(idToken);
}
```

---

#### `src/context/FirebaseAuthContext.tsx`
**Rôle** : Contexte d'authentification - appelle le service Firebase
**Fonction** : `loginWithGoogle()` (ligne ~297)
**Ce qu'il fait** :
- Appelle `firebaseAuthService.loginWithGoogle(googleIdToken)`
- Met à jour l'état Redux
- Affiche un Toast de succès
- Gère les erreurs

**Code clé** :
```typescript
const loginWithGoogle = async (googleIdToken: string) => {
  const user = await firebaseAuthService.loginWithGoogle(googleIdToken);
  // État mis à jour via Firebase auth state listener
}
```

---

#### `src/services/firebaseAuthServiceNew.ts`
**Rôle** : Service qui gère l'authentification Firebase + Backend
**Fonction** : `loginWithGoogle()` (ligne ~380)
**Ce qu'il fait** :
1. **Crée un credential Google** à partir de l'idToken
2. **S'authentifie avec Firebase** (`signInWithCredential()`)
3. **Obtient le Firebase ID Token**
4. **Appelle le backend** (`POST /auth/login`)
5. **Enregistre l'appareil** (`deviceApi.registerDevice()`)
6. **Retourne le profil utilisateur**

**Code clé** :
```typescript
async loginWithGoogle(googleIdToken) {
  // 1. Créer credential Google
  const credential = GoogleAuthProvider.credential(googleIdToken);
  
  // 2. Authentifier avec Firebase
  const userCredential = await signInWithCredential(auth, credential);
  
  // 3. Obtenir Firebase ID Token
  const firebaseIdToken = await firebaseUser.getIdToken();
  
  // 4. Appeler backend
  const response = await this.backendApi.post('/auth/login', {
    idToken: firebaseIdToken,
    provider: 'google',
  });
  
  // 5. Retourner profil utilisateur
  return response.data.data;
}
```

---

## 🔗 Résumé des Appels

### Déconnexion
```
UI (Paramètres) 
  → FirebaseAuthContext.logout()
    → firebaseAuthService.logout()
      → AsyncStorage.multiRemove() [NETTOYAGE]
      → Firebase auth.signOut()
      → _forceBrutalGoogleSignOut() [7 cycles]
        → GoogleSignin.signOut() × 7
        → GoogleSignin.revokeAccess() × 7
```

### Connexion Google
```
LoginScreen.handleGoogleLogin()
  → useGoogleAuth.signInWithGoogle()
    → forceBrutalSignOut() [3 cycles]
    → Boucle déconnexion silencieuse [5 tentatives]
    → Vérification finale [3 tentatives]
    → GoogleSignin.signIn() [UI native]
    → FirebaseAuthContext.loginWithGoogle()
      → firebaseAuthService.loginWithGoogle()
        → Firebase signInWithCredential()
        → Backend POST /auth/login
```

---

## 📊 Fichiers par Catégorie

### 🎨 **UI / Interface Utilisateur**
- `src/screens/LoginScreen.tsx` - Écran de connexion avec bouton Google

### 🔧 **Hooks / Logique Métier**
- `src/hooks/useGoogleAuth.ts` - Hook d'authentification Google (déconnexion + connexion)

### 🏗️ **Context / État Global**
- `src/context/FirebaseAuthContext.tsx` - Contexte d'authentification (logout + loginWithGoogle)

### 🔐 **Services / Backend**
- `src/services/firebaseAuthServiceNew.ts` - Service Firebase (logout + loginWithGoogle)
- `src/services/authPersistence.ts` - Persistance utilisateur (clearPersistedUser)

### ⚙️ **Configuration**
- `src/config/firebaseApp.ts` - Configuration Firebase (firebaseOAuthClientIds)

---

## 🎯 Points Critiques

### Déconnexion
1. **AsyncStorage** doit être nettoyé EN PREMIER
2. **Google Sign-In** doit être déconnecté avec plusieurs cycles
3. **Firebase** doit être déconnecté

### Connexion
1. **Déconnexion brutale** avant chaque connexion
2. **Boucle de vérification** des comptes silencieux
3. **Vérification finale** avant `signIn()`
4. **Appel Google Sign-In** natif
5. **Récupération idToken**
6. **Appel Firebase + Backend**

---

## 🔍 Où Trouver le Code

| Action | Fichier | Fonction | Ligne |
|--------|---------|----------|-------|
| **Déconnexion UI** | `FirebaseAuthContext.tsx` | `logout()` | ~419 |
| **Déconnexion Service** | `firebaseAuthServiceNew.ts` | `logout()` | ~719 |
| **Déconnexion Google** | `firebaseAuthServiceNew.ts` | `_forceBrutalGoogleSignOut()` | ~473 |
| **Connexion UI** | `LoginScreen.tsx` | `handleGoogleLogin()` | ~96 |
| **Connexion Hook** | `useGoogleAuth.ts` | `signInWithGoogle()` | ~202 |
| **Connexion Service** | `firebaseAuthServiceNew.ts` | `loginWithGoogle()` | ~380 |
| **Connexion Context** | `FirebaseAuthContext.tsx` | `loginWithGoogle()` | ~297 |

---

## 💡 Pour Déboguer

Si le sélecteur ne s'affiche pas après déconnexion, vérifier dans l'ordre :

1. **AsyncStorage nettoyé ?** → Logs dans `firebaseAuthServiceNew.ts` ligne ~748
2. **Google Sign-In déconnecté ?** → Logs dans `_forceBrutalGoogleSignOut()` ligne ~478
3. **Compte silencieux présent ?** → Logs dans `useGoogleAuth.ts` ligne ~244
4. **Vérification finale OK ?** → Logs dans `useGoogleAuth.ts` ligne ~407

