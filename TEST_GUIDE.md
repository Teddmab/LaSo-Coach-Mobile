# 🧪 Guide de Test - Corrections Profile et BadgeLevel

## ✅ Corrections Appliquées

1. **Mobile** : `profile` → `Profile` (majuscule) pour correspondre au backend
2. **Backend** : `levels` → `BadgeLevel` et `userProgress` → `UserBadgeProgress` dans Prisma

---

## 🧪 Tests Backend

### 1. Démarrer le Backend

```bash
cd /home/moses/Documents/Prog-App/LaSo-Coach-Backend
npm run dev
```

### 2. Tester l'endpoint /profile

**Option A : Script Node.js**
```bash
# Obtenir un token Firebase depuis l'app mobile (dans les logs)
FIREBASE_TOKEN="votre_token_ici" node test-profile-endpoint.js
```

**Option B : curl**
```bash
curl -X GET http://localhost:3000/api/v1/profile \
  -H "Authorization: Bearer VOTRE_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Option C : Postman/Insomnia**
- URL: `GET http://localhost:3000/api/v1/profile`
- Headers:
  - `Authorization: Bearer VOTRE_FIREBASE_TOKEN`
  - `Content-Type: application/json`

### 3. Vérifications Attendues

✅ **Réponse 200 OK**
✅ **Structure JSON avec `Profile` (majuscule)** :
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "Profile": {
      "height": 180,
      "initialWeight": 70,
      "targetWeight": 65,
      ...
    }
  }
}
```

❌ **Ne doit PAS avoir** `profile` (minuscule) dans la réponse

---

## 📱 Tests Mobile

### 1. Démarrer l'App Mobile

```bash
cd /home/moses/Documents/Prog-App/LaSo-Coach-Mobile
npm start
```

### 2. Scénarios de Test

#### Test 1 : Connexion et Récupération du Profil
1. ✅ Se connecter avec un compte existant
2. ✅ Vérifier dans les logs que `/profile` retourne 200
3. ✅ Vérifier que les données de profil s'affichent correctement

#### Test 2 : Affichage des Données de Profil
1. ✅ Aller dans l'écran Profile
2. ✅ Vérifier que les champs suivants s'affichent :
   - Taille (height)
   - Poids initial (initialWeight)
   - Poids cible (targetWeight)
   - Tour de taille initial (initialWaistSize)
   - Tour de taille cible (targetWaistSize)
   - Genre (gender)
   - Occupation (occupation)

#### Test 3 : Dashboard
1. ✅ Vérifier que les données de profil apparaissent dans le Dashboard
2. ✅ Vérifier les Progress Cards (height, weight, etc.)

#### Test 4 : Nutrition Screen
1. ✅ Vérifier que les données de profil sont utilisées correctement
2. ✅ Vérifier les logs pour confirmer `Profile` (majuscule)

---

## 🔍 Vérifications dans les Logs

### Backend (Terminal)
Chercher ces messages :
- ✅ `[ProfileController] ✅ Retrieved user profile`
- ❌ Ne doit PAS avoir d'erreur Prisma sur `levels` ou `userProgress`

### Mobile (Metro/Expo)
Chercher ces messages :
- ✅ `👤 Profile: Fetching profile data...`
- ✅ `Profile data loaded` avec `hasProfileProfile: true`
- ❌ Ne doit PAS avoir d'erreur `Cannot read property 'height' of undefined`

---

## 🐛 Debug en Cas d'Erreur

### Erreur Prisma "Unknown field `levels`"
- ✅ Vérifier que `badge-progress.service.ts` utilise `BadgeLevel` (majuscule)
- ✅ Redémarrer le backend après les modifications

### Erreur "Cannot read property 'height' of undefined"
- ✅ Vérifier que le mobile utilise `Profile` (majuscule) et non `profile`
- ✅ Vérifier que le backend retourne bien `Profile` dans la réponse

### Données manquantes
- ✅ Vérifier que l'utilisateur a un profil créé dans la BDD
- ✅ Vérifier les logs backend pour voir la structure exacte retournée

---

## 📊 Test Rapide

```bash
# Terminal 1 - Backend
cd /home/moses/Documents/Prog-App/LaSo-Coach-Backend
npm run dev

# Terminal 2 - Mobile
cd /home/moses/Documents/Prog-App/LaSo-Coach-Mobile
npm start

# Terminal 3 - Test Backend (si vous avez un token)
cd /home/moses/Documents/Prog-App/LaSo-Coach-Backend
FIREBASE_TOKEN="votre_token" node test-profile-endpoint.js
```

---

## ✅ Checklist de Validation

- [ ] Backend démarre sans erreur
- [ ] Endpoint `/profile` retourne 200 OK
- [ ] Réponse contient `Profile` (majuscule)
- [ ] Mobile se connecte sans erreur
- [ ] Données de profil s'affichent dans ProfileScreen
- [ ] Données de profil s'affichent dans Dashboard
- [ ] Pas d'erreur Prisma dans les logs backend
- [ ] Pas d'erreur "undefined" dans les logs mobile

