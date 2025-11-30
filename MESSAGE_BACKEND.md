# 📧 Message Pour le Backend

**Date** : 30 Novembre 2025  
**Sujet** : POST /auth/login - Confirmation Configuration

---

Bonjour,

Merci pour la confirmation que POST /auth/login supporte déjà Firebase Auth ! 🎉

---

## ✅ Ce Que J'ai Compris

**Backend (confirmé)** :
- ✅ POST /auth/login supporte Firebase (`USE_FIREBASE_AUTH=true`)
- ✅ Accepte `{"idToken": "<firebase_id_token>"}`
- ✅ Champ `provider` optionnel (ignoré)
- ✅ Auto-création activée pour premiers logins Google
- ✅ GET /auth/profile fonctionne avec le même token

**Frontend (implémenté)** :
- ✅ Firebase Sign-In natif (SDK Android)
- ✅ Obtient Firebase ID Token
- ✅ Appelle POST /auth/login avec `{idToken, provider}`
- ✅ Parse réponse `{success: true, user: {...}}`

---

## 🚨 Problème Actuel

**Symptôme** : Network Error lors de POST /auth/login

**Logs Frontend** :
```
✅ [loginWithGoogle] Firebase Auth réussie, UID: hBKsLhzZFFPABhB2Mn98MJhMPPu2
🔑 [loginWithGoogle] Récupération Firebase ID Token...
📡 [loginWithGoogle] Appel POST /auth/login...
❌ [loginWithGoogle] Erreur: [Error: Network Error]
```

**Diagnostic** :
- Firebase Auth fonctionne ✅
- Firebase ID Token récupéré ✅
- Requête POST /auth/login échoue ❌ (Network Error)

---

## 🔍 Actions Debug (Frontend)

J'ai ajouté des logs détaillés pour identifier le problème :

```javascript
console.log('🔑 Firebase ID Token (100 premiers chars):', token.substring(0, 100));
console.log('🌐 Backend Base URL:', baseURL);
console.log('🔗 Endpoint:', '/auth/login');
console.log('📦 Body:', { idToken: '***', provider: 'google' });
```

Je vais tester et partager :
1. URL complète utilisée
2. Firebase ID Token (début seulement)
3. Code statut HTTP (si dispo)
4. Réponse backend (si dispo)

---

## 🧪 Smoke Test Prévu

### Test 1 : Backend Health
```bash
curl https://laso-coach-backend.onrender.com/api/v1/health
# Vérifier que le backend est en ligne
```

### Test 2 : POST /auth/login (Manuel)
```bash
curl -X POST https://laso-coach-backend.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -d '{"idToken":"<FIREBASE_ID_TOKEN>","provider":"google"}'

# Attendu: 200 { "success": true, "user": {...} }
```

### Test 3 : GET /auth/profile
```bash
curl -X GET https://laso-coach-backend.onrender.com/api/v1/auth/profile \
  -H "Authorization: Bearer <MÊME_FIREBASE_ID_TOKEN>"

# Attendu: 200 avec profil + abonnement
```

---

## ❓ Questions

### Q1 : Format Réponse Backend

**Actuel documenté** :
```json
{
  "success": true,
  "user": { ... }
}
```

**Ou bien** :
```json
{
  "success": true,
  "data": { ... }
}
```

**Frontend parse les deux** (`response.data.user || response.data.data`), donc compatible dans tous les cas.

### Q2 : Headers Requis

**Backend attend** :
- `Content-Type: application/json` ✅
- `Authorization: Bearer <token>` (optionnel pour POST /auth/login ?)

**Frontend envoie** :
- Les deux headers ✅

### Q3 : Backend Render

**URL** : `https://laso-coach-backend.onrender.com/api/v1`

**Question** : Le backend est-il en ligne 24/7 ou se met-il en veille (plan gratuit) ?

**Raison** : Si veille → Premier appel échoue, deuxième réussit (après 1-2 min)

---

## 📊 Données Attendues

### Firebase ID Token (Exemple)

```
eyJhbGciOiJSUzI1NiIsImtpZCI6IjQxMzQxZjM...
```

**Contenu décodé** :
```json
{
  "uid": "hBKsLhzZFFPABhB2Mn98MJhMPPu2",
  "email": "believe@gmail.com",
  "email_verified": true,
  "name": "Believe Mashula",
  "picture": "https://lh3.googleusercontent.com/...",
  "firebase": {
    "sign_in_provider": "google.com"
  }
}
```

### User Créé (Exemple Attendu)

```json
{
  "success": true,
  "user": {
    "id": "...",
    "firebaseUid": "hBKsLhzZFFPABhB2Mn98MJhMPPu2",
    "email": "believe@gmail.com",
    "name": "Believe Mashula",
    "firstName": "Believe",
    "lastName": "Mashula",
    "role": "USER",
    "status": "ACTIVE",
    "avatar": "https://lh3.googleusercontent.com/...",
    "hasSubscription": false,
    "subscriptionStatus": null,
    "createdAt": "2025-11-30T...",
    "updatedAt": "2025-11-30T..."
  }
}
```

---

## 🎯 Prochaines Étapes

1. **Debug Frontend** : Identifier URL/headers exacts utilisés
2. **Test Smoke** : Curl manuel pour valider backend
3. **Partager Résultats** : URL, token, code statut, réponse
4. **Si curl fonctionne** → Problème interceptor/config frontend
5. **Si curl échoue** → Vérifier backend (config, logs, CORS)

---

## 📞 Contact

**Frontend** : Moses  
**Fichiers Debug** : 
- `DEBUG_NETWORK_ERROR.md` (guide complet)
- `src/services/firebaseAuthServiceNew.js` (logs ajoutés)

**Update** : Je partagerai les résultats des tests dans les prochaines heures.

Merci ! 🚀

---

**Urgence** : 🔴 Debug en cours  
**Backend** : ✅ Confirmé prêt  
**Frontend** : 🔍 Investigation Network Error

