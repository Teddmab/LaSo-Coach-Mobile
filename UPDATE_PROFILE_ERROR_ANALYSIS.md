# 🔍 Analyse : Erreur "property updateProfile doesn't exist"

## 🚨 Problème Identifié

**Erreur** : `property updateProfile doesn't exist`  
**Quand** : Après la création d'un nouveau compte (register)  
**Localisation** : `src/services/firebaseAuthServiceNew.ts`

---

## 🔍 Analyse du Code

### **Problème Principal**

La fonction `updateProfile` de Firebase Auth est **utilisée mais jamais importée**.

**Fichier concerné** : `src/services/firebaseAuthServiceNew.ts`

**Lignes problématiques** :
- **Ligne 280** : `await updateProfile(this.getAuth().currentUser, { displayName });`
- **Ligne 370** : `await updateProfile(userCredential.user, { displayName });`

### **Imports Actuels**

```typescript
// src/services/firebaseAuthServiceNew.ts - lignes 1-11
import { getFirebaseAuth, isCompatAuth } from '../config/firebaseApp';
import { API_CONFIG } from '../config/apiConfig';
import axios from 'axios';
import firebaseCompat from 'firebase/compat/app';
import 'firebase/compat/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import deviceApi from './deviceApi';
```

**❌ Problème** : `updateProfile` n'est **pas importé** !

---

## 📍 Où l'Erreur Se Produit

### **1. Lors de la Mise à Jour du Profil (ligne 280)**

**Contexte** : Dans `updateUserProfile()` après la mise à jour via le backend

```typescript
// src/services/firebaseAuthServiceNew.ts - ligne 265-290
async updateUserProfile(data) {
  // ... mise à jour via backend API ...
  
  // Update Firebase profile if needed
  if (data.firstName || data.lastName) {
    const displayName = `${data.firstName || this.currentUser?.firstName || ''} ${data.lastName || this.currentUser?.lastName || ''}`.trim();
    await updateProfile(this.getAuth().currentUser, { displayName }); // ❌ ERREUR ICI
  }
}
```

### **2. Lors de l'Inscription (ligne 370)**

**Contexte** : Dans `register()` après la création du compte et la connexion avec le custom token

```typescript
// src/services/firebaseAuthServiceNew.ts - ligne 336-392
async register(credentials) {
  // 1. Register user via backend
  // 2. Sign in with Firebase custom token
  // 3. Ensure Firebase display name is up-to-date
  const displayName = `${credentials.firstName} ${credentials.lastName || ''}`.trim();
  if (displayName) {
    await updateProfile(userCredential.user, { displayName }); // ❌ ERREUR ICI
  }
}
```

**C'est ici que l'erreur apparaît après la création d'un compte !**

---

## 🔧 Solution

### **Option 1 : Importer updateProfile de Firebase Auth (Recommandé)**

Ajouter l'import conditionnel comme pour les autres fonctions Firebase :

```typescript
// Au début du fichier, après les autres imports
let updateProfile: any;

// Dans le code, utiliser conditionnellement
if (isCompatAuth()) {
  // Utiliser la version compat
  updateProfile = async (user: any, profile: any) => {
    await user.updateProfile(profile);
  };
} else {
  // Importer la version modulaire
  const { updateProfile: updateProfileModular } = require('firebase/auth');
  updateProfile = updateProfileModular;
}
```

### **Option 2 : Utiliser la Version Compat Directement**

Utiliser directement la méthode de l'objet user :

```typescript
// Ligne 280 - Remplacer
await updateProfile(this.getAuth().currentUser, { displayName });

// Par
if (isCompatAuth()) {
  await this.getAuth().currentUser.updateProfile({ displayName });
} else {
  const { updateProfile } = require('firebase/auth');
  await updateProfile(this.getAuth().currentUser, { displayName });
}
```

### **Option 3 : Utiliser firebaseCompat (Plus Simple)**

Utiliser directement firebaseCompat qui est déjà importé :

```typescript
// Ligne 280 - Remplacer
await updateProfile(this.getAuth().currentUser, { displayName });

// Par
await this.getAuth().currentUser.updateProfile({ displayName });
```

**Note** : Cette option fonctionne uniquement si on utilise toujours la version compat.

---

## 🎯 Solution Recommandée

**Utiliser l'approche conditionnelle** comme pour `signInWithCustomToken` :

```typescript
// Après les imports existants
let updateProfileFn: any;

// Dans le code, ligne 280
if (isCompatAuth()) {
  await this.getAuth().currentUser.updateProfile({ displayName });
} else {
  const { updateProfile } = require('firebase/auth');
  await updateProfile(this.getAuth().currentUser, { displayName });
}

// Ligne 370 - Même chose
if (isCompatAuth()) {
  await userCredential.user.updateProfile({ displayName });
} else {
  const { updateProfile } = require('firebase/auth');
  await updateProfile(userCredential.user, { displayName });
}
```

---

## 📋 Checklist de Correction

- [ ] **1. Identifier les deux endroits** où `updateProfile` est utilisé (lignes 280 et 370)
- [ ] **2. Ajouter la logique conditionnelle** pour gérer compat vs modulaire
- [ ] **3. Tester la création de compte** pour vérifier que l'erreur est résolue
- [ ] **4. Tester la mise à jour du profil** pour vérifier que ça fonctionne toujours

---

## 🔄 Flux de l'Erreur

```
1. Utilisateur crée un compte → RegisterScreen
2. Appel à register() → FirebaseAuthContext
3. Appel à firebaseAuthService.register() → firebaseAuthServiceNew.ts
4. Backend crée l'utilisateur et retourne un custom token
5. Firebase signInWithCustomToken() → Connexion réussie
6. Tentative de mise à jour du displayName → updateProfile() ❌ ERREUR
7. Erreur : "property updateProfile doesn't exist"
```

---

## 💡 Note Importante

Le code utilise déjà `isCompatAuth()` pour d'autres fonctions Firebase (comme `signInWithCustomToken` ligne 360). Il faut suivre le **même pattern** pour `updateProfile`.

---

## 🎬 Conclusion

**Le problème** : `updateProfile` est utilisé mais jamais importé depuis Firebase Auth.

**La solution** : Importer et utiliser `updateProfile` de manière conditionnelle (compat vs modulaire) comme pour les autres fonctions Firebase dans ce fichier.

