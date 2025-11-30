# 🔍 Debug: Network Error - POST /auth/login

**Date** : 30 Novembre 2025  
**Problème** : Network Error lors de l'appel POST /auth/login  
**Backend** : ✅ Prêt (supporte déjà Firebase auth)

---

## ✅ Confirmations Backend

D'après le backend :
- ✅ POST /auth/login supporte Firebase (`USE_FIREBASE_AUTH=true`)
- ✅ Accepte `{"idToken": "<firebase_id_token>"}`
- ✅ Auto-création activée (premier login Google)
- ✅ GET /auth/profile fonctionne avec le même token

**Conclusion** : Le backend est **100% prêt**, le problème vient du **frontend** ou du **réseau**.

---

## 🔍 Analyse des Logs

### Logs Frontend

```
✅ [loginWithGoogle] Firebase Auth réussie, UID: hBKsLhzZFFPABhB2Mn98MJhMPPu2
🔑 [loginWithGoogle] Récupération Firebase ID Token...
📡 [loginWithGoogle] Appel POST /auth/login...
✅ Authorization header set with Firebase ID token (x22)
🔍 API Interceptor - Error URL: /auth/login
❌ [loginWithGoogle] Erreur: [Error: Network Error]
```

### Diagnostics

1. ✅ Firebase Auth fonctionne
2. ✅ Firebase ID Token récupéré
3. ✅ Headers Authorization ajoutés (22 fois !)
4. ❌ Network Error → Requête n'atteint pas le backend

---

## 🚨 Problèmes Possibles

### 1. URL Backend Incorrecte ou Inaccessible

**Configuration actuelle** (app.json) :
```json
{
  "apiBaseUrl": "https://laso-coach-backend.onrender.com/api/v1",
  "apiBaseUrlDev": "http://localhost:3000/api/v1"
}
```

**Questions** :
- ❓ Es-tu en mode **dev** (Expo Go) ou **production** (APK) ?
- ❓ Si dev → localhost:3000 est-il accessible ?
- ❓ Si production → Render backend est-il en ligne ?

---

### 2. Backend Render Endormi (Cold Start)

Render gratuit met le backend **en veille** après inactivité.

**Symptômes** :
- ✅ Première requête → 504 Timeout ou Network Error
- ✅ Deuxième requête (1-2 min après) → Fonctionne

**Solution** :
```bash
# Réveiller le backend AVANT de tester l'app
curl https://laso-coach-backend.onrender.com/api/v1/health

# Attendu: 200 OK ou { "status": "ok" }
```

---

### 3. Headers Authorization Dupliqués (x22 !)

**Observation** :
```
✅ Authorization header set with Firebase ID token (x22)
```

**Problème potentiel** :
- L'interceptor ajoute le header 22 fois → Surchage
- Possible boucle infinie ou retry agressif

**À vérifier** :
```javascript
// src/services/axiosInterceptor.js
// S'assurer qu'on n'ajoute le header qu'UNE FOIS
```

---

### 4. CORS (Cross-Origin Resource Sharing)

Si le backend rejette les requêtes depuis le mobile.

**Symptôme** :
- Network Error
- Pas de code statut HTTP

**Solution Backend** :
```javascript
// backend/server.js
app.use(cors({
  origin: '*', // Ou liste spécifique d'origines
  credentials: true
}));
```

---

### 5. Timeout (30 secondes)

**Configuration actuelle** :
```json
"apiTimeout": "30000"  // 30 secondes
```

Si le backend met >30s à répondre → Timeout.

**Solution** :
```json
// app.json
"apiTimeout": "60000"  // 60 secondes
```

---

## 🧪 Tests de Debug

### Test 1 : Vérifier Backend en Ligne

```bash
# Terminal
curl -I https://laso-coach-backend.onrender.com/api/v1/health

# Attendu: HTTP/1.1 200 OK
```

**Si 503/504** → Backend endormi, attendre 1-2 minutes

---

### Test 2 : Tester POST /auth/login Manuellement

**Étape 1** : Obtenir un vrai Firebase ID Token

Dans ton code, **ajoute un console.log** :

```javascript
// src/services/firebaseAuthServiceNew.js (ligne 423)
const firebaseIdToken = await firebaseUser.getIdToken();
console.log('🔑 FIREBASE ID TOKEN:', firebaseIdToken);  // ✅ AJOUTER
```

**Étape 2** : Tester avec curl

```bash
# Copier le token des logs et tester
curl -X POST https://laso-coach-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <COLLER_TOKEN_ICI>" \
  -d '{"idToken":"<COLLER_TOKEN_ICI>","provider":"google"}'

# Attendu: 200 { "success": true, "user": {...} }
```

**Si ça marche en curl mais pas dans l'app** → Problème frontend

**Si ça ne marche pas en curl** → Problème backend/token

---

### Test 3 : Vérifier URL Utilisée

**Ajouter logs dans le code** :

```javascript
// src/services/firebaseAuthServiceNew.js
console.log('📡 [loginWithGoogle] Appel POST /auth/login...');
console.log('🌐 URL complète:', this.backendApi.defaults.baseURL);  // ✅ AJOUTER
console.log('🔗 Endpoint:', API_CONFIG.endpoints.auth.login);       // ✅ AJOUTER
```

**Vérifier dans les logs** :
```
🌐 URL complète: https://laso-coach-backend.onrender.com/api/v1
🔗 Endpoint: /auth/login
```

**Si localhost en production** → Problème de config

---

### Test 4 : Bypass Interceptor (Test Direct)

**Créer une requête directe sans interceptor** :

```javascript
// src/services/firebaseAuthServiceNew.js
import axios from 'axios';

// Dans loginWithGoogle(), remplacer temporairement:
const response = await axios.post(
  'https://laso-coach-backend.onrender.com/api/v1/auth/login',
  {
    idToken: firebaseIdToken,
    provider: 'google'
  },
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firebaseIdToken}`
    },
    timeout: 60000
  }
);
```

**Si ça marche** → Problème dans l'interceptor

**Si ça ne marche pas** → Problème réseau/backend

---

## 🔧 Correctifs à Appliquer

### Correctif 1 : Forcer Production URL (Temporaire)

```javascript
// src/services/firebaseAuthServiceNew.js
const response = await axios.post(
  'https://laso-coach-backend.onrender.com/api/v1/auth/login',  // ✅ URL en dur
  {
    idToken: firebaseIdToken,
    provider: 'google'
  },
  {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 60000
  }
);
```

---

### Correctif 2 : Augmenter Timeout

```json
// app.json
"extra": {
  "env": {
    "apiTimeout": "90000"  // 90 secondes au lieu de 30
  }
}
```

---

### Correctif 3 : Vérifier Interceptor

```javascript
// src/services/axiosInterceptor.js
// S'assurer qu'on n'ajoute le header qu'UNE FOIS
request.interceptors.request.use(
  async (config) => {
    // ❌ ÉVITER: Ajouter header si déjà présent
    if (config.headers.Authorization) {
      return config;
    }
    
    // ✅ Ajouter seulement si absent
    const token = await getFirebaseToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }
);
```

---

## 📋 Checklist Debug

### Étape par Étape

- [ ] **1. Backend en ligne ?**
  ```bash
  curl https://laso-coach-backend.onrender.com/api/v1/health
  ```

- [ ] **2. Copier Firebase ID Token**
  ```javascript
  console.log('🔑 TOKEN:', firebaseIdToken);
  ```

- [ ] **3. Tester avec curl**
  ```bash
  curl -X POST https://laso-coach-backend.onrender.com/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"idToken":"<TOKEN>"}'
  ```

- [ ] **4. Vérifier URL dans logs**
  ```javascript
  console.log('🌐 URL:', this.backendApi.defaults.baseURL);
  ```

- [ ] **5. Tester requête directe (bypass interceptor)**
  ```javascript
  const response = await axios.post('https://...', {...});
  ```

- [ ] **6. Si toujours Network Error → Partager**
  - ✅ URL complète
  - ✅ Headers exacts
  - ✅ Firebase ID Token (début seulement: `eyJhbGciOi...`)
  - ✅ Code statut (si dispo)
  - ✅ Réponse body (si dispo)

---

## 🎯 Actions Immédiates

### 1. Ajouter Logs Détaillés

```javascript
// src/services/firebaseAuthServiceNew.js (ligne 423)
const firebaseIdToken = await firebaseUser.getIdToken();

console.log('🔑 FIREBASE ID TOKEN (100 premiers chars):', firebaseIdToken.substring(0, 100));
console.log('🌐 BASE URL:', this.backendApi.defaults.baseURL);
console.log('🔗 ENDPOINT:', API_CONFIG.endpoints.auth.login);
console.log('📦 BODY:', JSON.stringify({ idToken: '...', provider: 'google' }));
```

### 2. Réveiller Backend

```bash
# Ouvrir dans navigateur ou curl
https://laso-coach-backend.onrender.com/api/v1/health
```

**Attendre 1-2 minutes** que le backend se réveille.

### 3. Tester à Nouveau

Relancer l'app et tenter Google Sign-In.

---

## 📊 Réponses Attendues

### ✅ Succès

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "believe@gmail.com",
    "name": "Believe Mashula",
    "firstName": "Believe",
    "lastName": "Mashula",
    "role": "USER",
    "status": "ACTIVE",
    ...
  }
}
```

### ❌ Échec Token Invalide

```json
{
  "success": false,
  "error": "Invalid credentials",
  "details": "Firebase token verification failed"
}
```

### ❌ Échec Backend Endormi

```
504 Gateway Timeout
```

---

## 📞 Prochaines Étapes

1. **Exécuter Checklist Debug** ci-dessus
2. **Partager résultats** :
   - URL complète utilisée
   - Réponse curl (si applicable)
   - Logs détaillés
   - Code statut HTTP (si dispo)

3. **Si curl fonctionne mais app non** → Problème interceptor/config
4. **Si curl ne fonctionne pas** → Problème backend/token

---

**Date** : 30 Novembre 2025  
**Urgence** : 🔴 Debug en cours  
**Backend** : ✅ Prêt (confirmé)

