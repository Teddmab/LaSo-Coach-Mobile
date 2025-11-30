# 📝 Changelog - 29 Novembre 2025

## 🎯 Objectif Global

Implémenter Google Sign-In avec SDK natif et endpoint backend REST standard (POST /auth/login).

## 🆕 Dernière Mise à Jour (29 Nov 23:45)

### Migration POST /auth/login (Standards REST)

**Contexte** : Le backend a demandé d'utiliser POST /auth/login au lieu de GET /auth/profile pour respecter les standards REST (GET ne doit pas modifier de données).

**Changements** :
- ✅ `loginWithGoogle()` : Appelle maintenant POST /auth/login avec idToken
- ✅ `registerWithGoogle()` : Redirige vers loginWithGoogle (même flow)
- ✅ Backend auto-create documenté dans POST /auth/login
- ✅ Documentation complète créée (BACKEND_POST_AUTH_LOGIN.md)

**Impact** :
- Frontend : ~60 lignes modifiées
- Backend : Nouveau endpoint à créer (~80 lignes)
- Standards REST : ✅ Respectés

---

## ✅ Changements Appliqués

### 1. 🔧 Adaptation Structure Backend

#### Fichiers Modifiés
- `src/services/firebaseAuthServiceNew.js`
- `BACKEND_GOOGLE_AUTH_ENDPOINT.md`
- `BACKEND_STRUCTURE_API.md` (nouveau)

#### Changements
**Avant** :
```javascript
return response.data.user || response.data.data || response.data;
```

**Après** :
```javascript
// Priorité à data (structure réelle backend)
return response.data.data || response.data.user || response.data;
```

**Raison** : Le backend retourne `{ success: true, data: {...} }` (pas `user`)

---

### 2. 📊 Structure Backend Documentée

Le backend retourne maintenant une structure enrichie :

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://...",
    "role": "USER",
    "phoneNumber": "+33...",
    "language": "fr",
    "region": "FR",
    "status": "ACTIVE",
    "hasSubscription": true,
    "subscriptionStatus": "ACTIVE",
    "subscription": {
      "id": "...",
      "status": "ACTIVE",
      "plan": { ... }
    },
    "createdAt": "2025-11-29...",
    "updatedAt": "2025-11-29..."
  }
}
```

**Nouveaux champs** :
- `firstName`, `lastName` (séparés du `name`)
- `phoneNumber`
- `language`, `region`
- `hasSubscription`, `subscriptionStatus`
- `subscription` (objet complet avec plan)

---

### 3. 🔄 Forcer Choix Compte Google

#### Fichier Modifié
- `src/hooks/useGoogleAuth.js`

#### Changement
```javascript
// Avant GoogleSignin.signIn()
await GoogleSignin.signOut(); // Force le choix du compte
```

**Résultat** : L'utilisateur peut **toujours** choisir un compte différent, même après une tentative échouée.

---

### 4. 🔐 Correction Endpoint Backend

#### Fichier Modifié
- `src/config/apiConfig.js`

#### Changement
**Avant** :
```javascript
get: '/profile',
```

**Après** :
```javascript
get: '/auth/profile', // ✅ Endpoint réel
```

**Raison** : Alignement avec l'API backend actuelle.

---

## 📚 Documentation Créée/Mise à Jour

### Nouveaux Fichiers

1. **`BACKEND_STRUCTURE_API.md`**
   - Structure complète de réponse backend
   - Liste exhaustive des champs
   - Code auto-create pour Google
   - Tests de validation

2. **`CHANGELOG_29NOV2025.md`** (ce fichier)
   - Récapitulatif de tous les changements

### Fichiers Mis à Jour

1. **`BACKEND_GOOGLE_AUTH_ENDPOINT.md`**
   - Structure réponse : `user` → `data`
   - Exemple avec champs complets (subscription, etc.)
   - Code backend avec auto-create

2. **`BACKEND_RESUME_POUR_DEV.md`**
   - Diagrammes mis à jour
   - Exemples de réponse corrects

---

## ⚙️ Compatibilité Frontend

### ✅ Code Frontend Compatible

Le frontend est **100% compatible** avec la structure backend actuelle :

```javascript
// Parse data en priorité, fallback vers user
response.data.data || response.data.user || response.data
```

**Tests nécessaires** :
- ✅ Création compte Google nouveau
- ✅ Connexion compte Google existant
- ✅ Récupération profil avec subscription
- ✅ Mise à jour profil

---

## 🔴 Action Requise Backend

### Endpoint à Créer

**Nouveau Endpoint** : `POST /api/v1/auth/login`

**Fonction** :
1. Vérifier Firebase ID Token
2. Chercher utilisateur par firebaseUid
3. Auto-créer profil si Google + nouveau
4. Retourner profil complet

**Code Complet** (~80 lignes) :

```javascript
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user && decodedToken.firebase?.sign_in_provider === 'google.com') {
      const nameParts = (decodedToken.name || '').split(' ');
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        role: 'USER',
        status: 'ACTIVE',
        avatar: decodedToken.picture,
        // ... autres champs
      });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
```

**Documentation complète** : `BACKEND_POST_AUTH_LOGIN.md` (500+ lignes)

---

## 📊 Récapitulatif des Endpoints

### POST /auth/register (Email/Password)

**Utilisation** : Inscription classique  
**Modification** : ❌ Aucune  
**Statut** : ✅ Fonctionne

### POST /auth/login (Google Sign-In)

**Utilisation** : Login + Auto-create Google  
**Modification** : ⚠️ À créer  
**Statut** : 🟡 Frontend prêt, backend requis

### GET /auth/profile (Récupération profil)

**Utilisation** : Récupérer profil utilisateur  
**Modification** : ❌ Aucune (reste inchangé)  
**Statut** : ✅ Fonctionne

---

## 🧪 Tests à Effectuer (Après Modification Backend)

### Scénario 1 : Nouveau Google User

1. Cliquer "Continuer avec Google"
2. Sélectionner un compte Google **nouveau** (jamais utilisé)
3. **Attendu** : Connexion réussie + Profil créé automatiquement

### Scénario 2 : Google User Existant

1. Cliquer "Continuer avec Google"
2. Sélectionner un compte Google **existant**
3. **Attendu** : Connexion réussie + Profil chargé

### Scénario 3 : Changement de Compte Google

1. Se déconnecter
2. Cliquer "Continuer avec Google"
3. **Attendu** : Choix de compte Google affiché (pas de connexion auto)

### Scénario 4 : Récupération Profil Complet

1. Se connecter (email ou Google)
2. Vérifier que le profil contient :
   - `firstName`, `lastName`
   - `subscription` (si abonnement actif)
   - `hasSubscription` (true/false)

---

## 🎯 État Actuel

### ✅ Prêt (Frontend)

- Parsing structure backend `{ success: true, data: {...} }` ✅
- Choix compte Google forcé ✅
- Appel POST /auth/login implémenté ✅
- Documentation complète (4 fichiers) ✅
- Standards REST respectés ✅

### ⏳ En Attente (Backend)

- Création endpoint POST /auth/login ⏳
- Implémentation auto-create Google ⏳
- Tests validation endpoint ⏳

---

## 📞 Prochaines Étapes

1. **Dev Backend** : Implémenter auto-create Google (~20 min)
2. **Tests** : Valider les 4 scénarios ci-dessus (~15 min)
3. **Commit** : Pousser les changements frontend dans mobile-main
4. **Migration** : Migrer vers LaSo-Coach-Mobile (branche Moise)
5. **Rebuild APK** : Générer nouvelle version de test

---

**Date** : 29 Novembre 2025, 23:50 UTC  
**Version Frontend** : 2.2.0 (POST /auth/login)  
**Backend Requis** : Création POST /auth/login

