# Adaptation de l'Onboarding en 4 Étapes - Version Mobile

## 📋 Vue d'Ensemble

Dans le projet **Admin**, l'onboarding se fait en **4 étapes** (et non 6) avec des endpoints et payloads spécifiques. Ce document explique comment adapter ce flux dans la version mobile.

---

## 🔄 Les 4 Étapes d'Onboarding (Admin)

### **Étape 1 : Profile Setup (ONBOARDING_PROFILE_SETUP)**

**Endpoint :** `PUT /admin/users/${userId}`

**Payload :**
```json
{
  "firstName": "Jean",
  "lastName": "Mukamba",
  "name": "Jean Mukamba",
  "phoneNumber": "+243900000000",
  "address": "123 Rue Mukamba; ; Kinshasa; 00100; DR Congo",
  "profile": {
    "height": 1.75,
    "initialWeight": 75.5,
    "initialWaistSize": 85.0,
    "gender": "male",
    "occupation": "Je travaille (au bureau ou à la maison)"
  }
}
```

**Points attribués :** 100 points

---

### **Étape 2 : Goals Setup (ONBOARDING_GOALS_SETUP)**

**Endpoint :** `PUT /admin/users/${userId}`

**Payload :**
```json
{
  "firstName": "Jean",
  "lastName": "Mukamba",
  "name": "Jean Mukamba",
  "profile": {
    "targetWeight": 70.0,
    "targetWaistSize": 80.0,
    "goal": "Lose weight and build muscle",
    "goals": ["weight_loss", "muscle_gain"],
    "dietaryRestrictions": ["vegetarian", "gluten_free"]
  }
}
```

**Points attribués :** 30 points

---

### **Étape 3 : Recommendations (ONBOARDING_RECOMMENDATIONS)**

**Endpoint :** `PATCH /admin/onboarding/user/${userId}/progress`

**Payload :**
```json
{
  "step": "recommendations",
  "completed": true
}
```

**Note :** Cette étape marque simplement la consultation des recommandations (avec consentement photo optionnel).

**Points attribués :** 20 points

---

### **Étape 4 : Rendez-vous (ONBOARDING_RENDEZVOUS)**

**Étape 4A : Créer le rendez-vous**

**Endpoint :** `POST /admin/onboarding/rendezvous`

**Payload :**
```json
{
  "userId": "user-id",
  "scheduledAt": "2025-12-15T10:00:00.000Z",
  "subject": "Initial Coaching Session",
  "duration": 60,
  "notes": "User wants to discuss weight loss goals"
}
```

**Étape 4B : Marquer comme complété**

**Endpoint :** `PATCH /admin/onboarding/user/${userId}/progress`

**Payload :**
```json
{
  "step": "rendezvous",
  "completed": true
}
```

**Points attribués :** 25 points

---

## 📱 Adaptation pour la Version Mobile

### **1. Modifier les Endpoints pour Mobile**

Les endpoints admin utilisent `/admin/...`, mais en mobile, il faut utiliser les endpoints utilisateur :

#### **Étape 1 : Profile Setup**
- **Endpoint Mobile :** `PUT /profile` ou `PATCH /profile`
- **Payload :** Identique à l'admin

#### **Étape 2 : Goals Setup**
- **Endpoint Mobile :** `PUT /profile` ou `PATCH /profile`
- **Payload :** Identique à l'admin

#### **Étape 3 : Recommendations**
- **Endpoint Mobile :** `PATCH /onboarding/progress`
- **Payload :** Identique à l'admin

#### **Étape 4 : Rendez-vous**
- **Endpoint Mobile (Création) :** `POST /onboarding/rendezvous`
- **Endpoint Mobile (Progression) :** `PATCH /onboarding/progress`
- **Payload :** Identique à l'admin

---

### **2. Structure de Navigation Mobile**

Créer un flux d'onboarding avec 4 écrans :

```
RegisterScreen (Création compte)
    ↓
OnboardingStep1Screen (Profile Setup)
    ↓
OnboardingStep2Screen (Goals Setup)
    ↓
OnboardingStep3Screen (Recommendations)
    ↓
OnboardingStep4Screen (Rendez-vous)
    ↓
DashboardScreen
```

---

### **3. Points à Vérifier dans le Code Mobile Actuel**

1. **Vérifier si l'onboarding existe déjà** dans `src/screens/` ou `src/components/onboarding/`
2. **Vérifier les services API** dans `src/services/` pour voir si les endpoints sont déjà implémentés
3. **Vérifier le contexte d'authentification** pour voir comment gérer la progression de l'onboarding
4. **Vérifier si les points TASCC sont attribués automatiquement** après chaque étape

---

### **4. Implémentation Recommandée**

#### **A. Créer un Hook `useOnboarding`**

```typescript
// src/hooks/useOnboarding.ts
import { useState } from 'react';
import { apiService } from '../services/api';

export const useOnboarding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeProfileSetup = async (profileData: ProfileData) => {
    // Étape 1 : PUT /profile
    // Points : 100
  };

  const completeGoalsSetup = async (goalsData: GoalsData) => {
    // Étape 2 : PUT /profile
    // Points : 30
  };

  const completeRecommendations = async (photoConsent: boolean) => {
    // Étape 3 : PATCH /onboarding/progress
    // Points : 20
  };

  const completeRendezVous = async (rendezVousData: RendezVousData) => {
    // Étape 4A : POST /onboarding/rendezvous
    // Étape 4B : PATCH /onboarding/progress
    // Points : 25
  };

  return {
    loading,
    error,
    completeProfileSetup,
    completeGoalsSetup,
    completeRecommendations,
    completeRendezVous,
  };
};
```

#### **B. Créer les Écrans d'Onboarding**

- `src/screens/onboarding/OnboardingStep1Screen.tsx` (Profile Setup)
- `src/screens/onboarding/OnboardingStep2Screen.tsx` (Goals Setup)
- `src/screens/onboarding/OnboardingStep3Screen.tsx` (Recommendations)
- `src/screens/onboarding/OnboardingStep4Screen.tsx` (Rendez-vous)

#### **C. Gérer la Progression**

Utiliser `AsyncStorage` ou un contexte pour stocker la progression de l'onboarding :

```typescript
// src/context/OnboardingContext.tsx
const OnboardingContext = createContext({
  currentStep: 1,
  completedSteps: [],
  // ...
});
```

---

### **5. Différences Clés Admin vs Mobile**

| Aspect | Admin | Mobile |
|--------|------|--------|
| **Base URL** | `/admin/...` | `/api/v1/...` ou `/...` |
| **Authentification** | Token admin | Firebase ID Token utilisateur |
| **User ID** | `selectedUserId` (sélectionné) | `currentUser.id` (utilisateur connecté) |
| **Navigation** | Modal avec étapes | Navigation entre écrans |
| **Points** | Attribués automatiquement | À vérifier si automatique ou manuel |

---

### **6. Actions Immédiates**

1. ✅ **Vérifier les endpoints existants** dans `src/services/api.ts` ou similaire
2. ✅ **Créer/modifier les services API** pour les 4 étapes
3. ✅ **Créer les écrans d'onboarding** si inexistants
4. ✅ **Intégrer la navigation** après l'inscription
5. ✅ **Tester le flux complet** de l'inscription au dashboard

---

## 📝 Notes Importantes

- Les **points TASCC** sont attribués automatiquement par le backend après chaque étape
- Le format de l'**adresse** est : `"line1; line2; city; postalCode; country"` (séparé par `; `)
- Les **goals** et **dietaryRestrictions** sont des **tableaux**
- Le **rendez-vous** nécessite **2 appels API** : création puis marquage comme complété
- La progression est suivie via `PATCH /onboarding/progress` avec `step` et `completed`

---

## 🔍 Fichiers à Examiner dans le Projet Mobile

1. ✅ `src/screens/RegisterScreen.tsx` - Voir comment l'inscription est gérée
2. ✅ `src/services/api.ts` - Voir les endpoints disponibles
3. ✅ `src/context/FirebaseAuthContext.tsx` - Voir comment l'utilisateur est géré après l'inscription
4. ✅ `src/navigation/` - Voir la structure de navigation actuelle
5. ✅ `src/services/onboardingApi.ts` - **DÉJÀ EXISTANT** - Service API pour l'onboarding
6. ✅ `src/components/dashboard/OnboardingProgressCard.tsx` - **DÉJÀ EXISTANT** - Composant UI pour afficher la progression

---

## ✅ Ce qui Existe Déjà dans le Projet Mobile

### **1. Service API Onboarding (`src/services/onboardingApi.ts`)**
- ✅ `getOnboardingProgress()` - Récupère la progression
- ✅ `getOnboardingStep(stepId)` - Récupère une étape
- ✅ `updateOnboardingStep(stepId, stepData)` - Met à jour une étape
- ✅ `completeOnboarding()` - Marque l'onboarding comme complété

**⚠️ À ADAPTER :** Les endpoints actuels ne correspondent pas exactement à ceux de l'admin.

### **2. Composant UI (`src/components/dashboard/OnboardingProgressCard.tsx`)**
- ✅ Affiche les 4 étapes : Profile Setup, Goals Setup, Recommendations, Rendez-vous
- ✅ Gère la progression et les états (completed, current, upcoming)
- ✅ Points affichés : 100, 30, 20, 25 (total 175 points)

**✅ CORRECT :** Le composant correspond déjà aux 4 étapes de l'admin.

### **3. Configuration API (`src/config/apiConfig.ts`)**
- ✅ Endpoints onboarding définis :
  - `progress: '/onboarding/progress'`
  - `step: (stepId) => '/onboarding/steps/${stepId}'`
  - `updateStep: (stepId) => '/onboarding/steps/${stepId}'`
  - `complete: '/onboarding/complete'`

**⚠️ À ADAPTER :** Les endpoints doivent correspondre à ceux de l'admin.

---

## 🔧 Adaptations Nécessaires

### **1. Modifier `onboardingApi.ts` pour Correspondre à l'Admin**

#### **Étape 1 : Profile Setup**
```typescript
// ACTUEL (à modifier)
static async updateOnboardingStep(stepId, stepData) {
  return api.put(`/onboarding/steps/${stepId}`, stepData);
}

// NOUVEAU (selon admin)
static async completeProfileSetup(userId, profileData) {
  // Endpoint: PUT /profile (ou PUT /users/${userId} si admin)
  const payload = {
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    name: `${profileData.firstName} ${profileData.lastName}`,
    phoneNumber: profileData.phoneNumber,
    address: `${profileData.addressLine1}; ${profileData.addressLine2}; ${profileData.city}; ${profileData.postalCode}; ${profileData.country}`,
    profile: {
      height: parseFloat(profileData.height),
      initialWeight: parseFloat(profileData.initialWeight),
      initialWaistSize: parseFloat(profileData.initialWaistSize),
      gender: profileData.gender,
      occupation: profileData.occupation
    }
  };
  return api.put('/profile', payload); // Ou PUT /users/${userId} selon backend
}
```

#### **Étape 2 : Goals Setup**
```typescript
static async completeGoalsSetup(userId, goalsData) {
  // Endpoint: PUT /profile (ou PUT /users/${userId} si admin)
  const payload = {
    profile: {
      targetWeight: parseFloat(goalsData.targetWeight),
      targetWaistSize: parseFloat(goalsData.targetWaistSize),
      goal: goalsData.goal,
      goals: goalsData.goals || [],
      dietaryRestrictions: goalsData.dietaryRestrictions || []
    }
  };
  return api.put('/profile', payload);
}
```

#### **Étape 3 : Recommendations**
```typescript
static async completeRecommendations(userId, photoConsent) {
  // Endpoint: PATCH /onboarding/user/${userId}/progress
  const payload = {
    step: 'recommendations',
    completed: photoConsent
  };
  return api.patch(`/onboarding/user/${userId}/progress`, payload);
}
```

#### **Étape 4 : Rendez-vous**
```typescript
static async completeRendezVous(userId, rendezVousData) {
  // Étape 4A : Créer le rendez-vous
  const createPayload = {
    userId: userId,
    scheduledAt: rendezVousData.scheduledAt,
    subject: rendezVousData.subject,
    duration: rendezVousData.duration,
    notes: rendezVousData.notes || undefined
  };
  await api.post('/onboarding/rendezvous', createPayload);
  
  // Étape 4B : Marquer comme complété
  const progressPayload = {
    step: 'rendezvous',
    completed: true
  };
  return api.patch(`/onboarding/user/${userId}/progress`, progressPayload);
}
```

### **2. Mettre à Jour `apiConfig.ts`**

Ajouter les nouveaux endpoints :

```typescript
onboarding: {
  progress: '/onboarding/progress',
  step: (stepId) => `/onboarding/steps/${stepId}`,
  updateStep: (stepId) => `/onboarding/steps/${stepId}`,
  complete: '/onboarding/complete',
  measurements: '/onboarding/measurements',
  // NOUVEAUX ENDPOINTS
  userProgress: (userId) => `/onboarding/user/${userId}/progress`, // PATCH
  rendezvous: '/onboarding/rendezvous', // POST
},
```

### **3. Créer un Hook `useOnboarding`**

```typescript
// src/hooks/useOnboarding.ts
import { useState } from 'react';
import OnboardingApi from '../services/onboardingApi';
import { useAuth } from '../context/FirebaseAuthContext';

export const useOnboarding = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeProfileSetup = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await OnboardingApi.completeProfileSetup(user.id, profileData);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ... autres méthodes similaires

  return {
    loading,
    error,
    completeProfileSetup,
    completeGoalsSetup,
    completeRecommendations,
    completeRendezVous,
  };
};
```

---

## 📋 Checklist d'Implémentation

- [ ] **1. Modifier `onboardingApi.ts`** avec les 4 méthodes correspondant aux étapes admin
- [ ] **2. Mettre à jour `apiConfig.ts`** avec les nouveaux endpoints
- [ ] **3. Créer le hook `useOnboarding.ts`** pour faciliter l'utilisation
- [ ] **4. Vérifier les écrans d'onboarding** existants et les adapter si nécessaire
- [ ] **5. Tester chaque étape** avec les payloads exacts de l'admin
- [ ] **6. Vérifier l'attribution automatique des points** après chaque étape
- [ ] **7. Intégrer la navigation** après l'inscription vers l'onboarding

---

## 🎯 Points Clés à Retenir

1. **Les endpoints admin utilisent `/admin/...`** mais en mobile, il faut utiliser les endpoints utilisateur (`/profile`, `/onboarding/...`)
2. **L'étape 4 (Rendez-vous) nécessite 2 appels API** : création puis marquage comme complété
3. **Les points sont attribués automatiquement** par le backend après chaque étape
4. **Le format d'adresse** est : `"line1; line2; city; postalCode; country"` (séparé par `; `)
5. **Les goals et dietaryRestrictions** sont des **tableaux**

---

**Date de création :** 2025-01-XX  
**Basé sur :** LaSo-Coach-Admin `/admin/components/simulation/UserJourneySimulationModal.tsx`  
**Fichiers existants identifiés :** `onboardingApi.ts`, `OnboardingProgressCard.tsx`

