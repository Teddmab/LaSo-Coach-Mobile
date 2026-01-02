# ⚡ Guide Rapide - Formulaire Google Play Data Safety

**Version courte pour remplir rapidement le formulaire**

---

## 🎯 CHECKLIST RAPIDE

### ✅ Types de données à COCHER dans le formulaire:

#### 1. Identifiants (Identifiers)
- [x] **Email address** → Collecté ✅ | Partagé ✅ | Stocké ✅
- [x] **User ID** → Collecté ✅ | Partagé ✅ | Stocké ✅
- [x] **Device or other IDs** → Collecté ✅ | Partagé ✅

#### 2. Informations personnelles (Personal Information)
- [x] **Name** → Collecté ✅ | Partagé ✅ | Stocké ✅
- [x] **Phone number** → Collecté ✅ | Partagé ✅ | Stocké ✅ (optionnel)
- [x] **Address** → Collecté ✅ | Partagé ✅ | Stocké ✅ (optionnel)
- [x] **Photos or videos** → Collecté ✅ | Partagé ✅ | Stocké ✅

#### 3. Données de santé (Health & Fitness)
- [x] **Health information** → Collecté ✅ | Partagé ✅ | Stocké ✅
  - Inclut: Taille, Poids, Tour de taille, Mesures, Photos de progression

#### 4. Informations d'appareil (Device Information)
- [x] **Device or other IDs** → Collecté ✅ | Partagé ✅
- [x] **App information** → Collecté ✅ | Partagé ✅
- [x] **Device information** → Collecté ✅ | Partagé ✅
  - Modèle, Fabricant, OS Version, Build ID, Type d'appareil

#### 5. Données de navigation (App Activity)
- [x] **App activity** → Collecté ✅ | Partagé ✅ | Stocké ✅
  - Historique d'utilisation, Messages de chat, Posts communautaires

#### 6. Informations financières (Financial Information)
- [x] **Purchase history** → Collecté ✅ | Partagé ✅ | Stocké ✅

---

## 🔗 Services tiers à déclarer:

1. **Firebase (Google)**
   - Données: Email, User ID, Device ID, Push tokens
   - Usage: Authentication, Cloud Messaging

2. **Backend API** (laso-coach-backend.onrender.com)
   - Données: Toutes les données utilisateur
   - Usage: App functionality, Data storage

3. **Google Play Billing**
   - Données: Purchase history, Subscription status
   - Usage: App functionality

4. **Socket.io** (via Backend)
   - Données: Chat messages
   - Usage: App functionality

---

## ⚠️ DONNÉES CRITIQUES À NE PAS OUBLIER:

Ces données sont **automatiquement collectées** et envoyées au backend:

1. ✅ **Informations d'appareil** (Modèle, Fabricant, OS Version)
   - Collectées via `expo-device`
   - Envoyées à `/api/v1/devices/register` après chaque authentification

2. ✅ **Device ID** (via Firebase)
   - Collecté pour les notifications push
   - Partagé avec Firebase Cloud Messaging

3. ✅ **Données de santé** (Poids, Taille, Mesures)
   - Collectées lors de l'onboarding et des mises à jour
   - Envoyées au backend API

4. ✅ **Messages de chat**
   - Transmis en temps réel via WebSocket (Socket.io)
   - Stockés sur le backend

---

## 📝 Remplir le formulaire - Étapes:

1. **Google Play Console** → Votre app → **Politique et programmes** → **Sécurité des données**

2. Pour **chaque type de données**:
   - Cochez ✅ **Collecté**
   - Cochez ✅ **Partagé** (si applicable)
   - Cochez ✅ **Stocké** (si applicable)
   - Sélectionnez les **buts**: App functionality, Analytics, Personalization

3. **Services tiers**:
   - Ajoutez Firebase, Backend API, Google Play Billing, Socket.io
   - Indiquez les données partagées avec chacun

4. **Soumettez** et attendez la vérification Google

---

**Temps estimé**: 15-20 minutes

**Document complet**: Voir `GOOGLE_PLAY_DATA_DECLARATION.md` pour tous les détails

