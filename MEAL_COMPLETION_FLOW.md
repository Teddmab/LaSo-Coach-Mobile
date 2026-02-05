# 📋 Flux de Complétion des Repas - Documentation Complète

## 🎯 Vue d'ensemble

Ce document explique **quand** et **comment** on sait qu'un utilisateur a complété un repas, et **comment** on récupère et affiche le statut des repas complétés.

---

## 🔄 1. CHARGEMENT INITIAL DES DONNÉES DE COMPLÉTION

### 1.1 Au chargement de l'écran (`NutritionScreen`)

**Moment :** Au montage du composant (`useEffect` ligne 257)

**Flux :**
```
1. useEffect(() => { fetchAllData(); }, []) 
   ↓
2. fetchAllData() charge :
   - Le plan nutritionnel actif
   - Les données de subscription
   - Les jours de la semaine (weekDays)
   ↓
3. useEffect dépendant (ligne 368) détecte que currentPlan, subscriptionData et weekDays sont prêts
   ↓
4. loadDayData() est appelé automatiquement
   ↓
5. loadDayData() appelle nutritionAPI.getCompletionStatus(planId)
   ↓
6. GET /api/v1/meals/plans/{planId}/completion-status
   ↓
7. Réponse stockée dans completionStatus et freshCompletionData
```

**Code clé :**
```typescript
// Ligne 257 - Chargement initial
useEffect(() => {
  fetchAllData();
}, []);

// Ligne 1029 - Dans loadDayData()
const globalCompletionData = await nutritionAPI.getCompletionStatus(currentPlan.id);
setCompletionStatus(globalCompletionData);
```

### 1.2 Quand l'écran revient au focus

**Moment :** Quand l'utilisateur revient sur l'écran (`useFocusEffect` ligne 264)

**Flux :**
```
1. useFocusEffect détecte le focus
   ↓
2. Vérifie si currentPlan et subscriptionData existent
   ↓
3. Appelle loadDayData() pour rafraîchir les données
   ↓
4. getCompletionStatus() est appelé à nouveau
```

---

## ✅ 2. VÉRIFICATION SI UN REPAS EST COMPLÉTÉ

### 2.1 Fonction `isMealCompleted()`

**Localisation :** `NutritionScreen.tsx` ligne 178

**Priorité de vérification :**

1. **PRIORITÉ 1 : `completionsByDay[planDay]`** ⭐ (Source principale)
   ```typescript
   // Vérifie dans completionsByDay pour le jour spécifique
   const dayKey = String(planDay);
   const dayCompletions = completionData.completionsByDay[dayKey];
   if (dayCompletions.some(c => c.mealId === mealId && c.completedAt)) {
     return true; // ✅ Repas complété
   }
   ```

2. **PRIORITÉ 2 : `dayProgress.completedMealIds`** (Compatibilité)
   ```typescript
   if (completionData?.dayProgress?.completedMealIds?.includes(mealId)) {
     return true;
   }
   ```

3. **PRIORITÉ 3 : `mealStatus[mealId].completed`** (Compatibilité)
   ```typescript
   if (completionData?.mealStatus?.[mealId]?.completed === true) {
     return true;
   }
   ```

4. **PRIORITÉ 4 : `allCompletions`** (Compatibilité)
   ```typescript
   if (completionData?.allCompletions?.some(c => c.mealId === mealId)) {
     return true;
   }
   ```

**Structure de données attendue :**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "plan": { "id": "...", "name": "..." },
    "progress": {
      "percentage": 15,
      "completedMeals": 4,
      "totalMeals": 27,
      "remainingMeals": 23
    },
    "completionsByDay": {
      "1": [
        {
          "mealId": "d1b0f115-afe6-49f6-826c-9be69f5a84d4",
          "completionDate": "2026-02-01T00:00:00.000Z",
          "completedAt": "2026-02-02T01:48:47.382Z"
        }
      ],
      "4": [
        {
          "mealId": "e89f11a2-9f3d-4145-af8d-4397a6c42132",
          "completionDate": "2026-02-04T00:00:00.000Z",
          "completedAt": "2026-02-05T21:07:28.411Z"
        }
      ]
    }
  }
}
```

### 2.2 Où est utilisé `isMealCompleted()` ?

1. **Pour filtrer les repas dans le bottomsheet** (`CompleteMealsBottomSheet.tsx`)
2. **Pour vérifier si le bouton "Compléter des repas" doit s'afficher** (`hasIncompleteMeals`)
3. **Pour afficher le statut dans le modal des détails du repas** (YouTube modal)
4. **Pour masquer les repas complétés dans la liste principale**

---

## 🍽️ 3. COMPLÉTION D'UN REPAS (Action utilisateur)

### 3.1 Quand l'utilisateur complète un repas

**Moment :** Clic sur le bouton "Compléter ce repas" ou dans le bottomsheet

**Flux complet :**

```
1. handleMealComplete(mealId) appelé
   ↓
2. POST /api/v1/meals/{mealId}/complete
   Body: {
     planDay: 4,
     nutritionPlanId: "...",
     completionDate: "2026-02-04T00:00:00.000Z"
   }
   ↓
3. Réponse du serveur :
   {
     "status": "success",
     "message": "Meal completed successfully",
     "data": {
       "completionId": "1063f1f8-ba9b-4d47-a8a6-e6dd22a1d735",
       "mealId": "1f2c8052-6ea3-4dc3-94bf-9d6cd1c43643",
       "nutritionPlanId": "bf0087e3-fa2e-452b-bed6-52d92aaed79e",
       "pointsAwarded": 25
     }
   }
   ↓
4. Mise à jour locale immédiate (optimistic update)
   - Ajout du mealId dans dayProgress.completedMealIds
   - Mise à jour de mealStatus[mealId].completed = true
   - Incrémentation de progress.completedMeals
   ↓
5. Rafraîchissement depuis le serveur (comme la version web)
   GET /api/v1/meals/plans/{planId}/completion-status
   ↓
6. Réponse complète avec toutes les complétions
   ↓
7. Mise à jour de completionStatus et freshCompletionData
   ↓
8. Re-render automatique de tous les composants :
   - Le bouton devient "Repas complété avec succès !"
   - Le repas disparaît du bottomsheet
   - La progression se met à jour
   ↓
9. loadDayData() appelé après 200ms pour synchroniser
```

**Code clé :**
```typescript
// Ligne 1333 - handleMealComplete()
const response = await nutritionAPI.completeMeal(mealId, completionData);

// Ligne 1578 - Rafraîchissement immédiat
const apiResponse = await nutritionAPI.getCompletionStatus(currentPlan.id);
setFreshCompletionData(newFreshData);
setCompletionStatus(updatedStatus);
```

---

## 📊 4. STRUCTURE DES DONNÉES DE COMPLÉTION

### 4.1 États dans le composant

```typescript
// État principal (données du serveur)
const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(null);

// Données fraîches (mises à jour après complétion)
const [freshCompletionData, setFreshCompletionData] = useState<any>(null);

// Plan day actuel (pour filtrer par jour)
const [currentPlanDay, setCurrentPlanDay] = useState<number | null>(null);
```

### 4.2 Format de `completionStatus`

```typescript
interface CompletionStatus {
  progress: {
    percentage: number;
    completedMeals: number;
    totalMeals: number;
    remainingMeals: number;
  };
  completionsByDay: {
    [dayKey: string]: Array<{
      mealId: string;
      completionDate: string; // ISO date
      completedAt: string;    // ISO timestamp
    }>;
  };
  dayProgress?: {
    completedMealIds: string[];
  };
  mealStatus?: {
    [mealId: string]: {
      completed: boolean;
    };
  };
  allCompletions?: Array<{
    mealId: string;
    completedAt: string;
  }>;
}
```

---

## 🔍 5. MOMENTS DE CHARGEMENT DES DONNÉES

### 5.1 Chargement initial
- ✅ **Quand :** Au montage du composant (`useEffect` ligne 257)
- ✅ **Quoi :** `fetchAllData()` → `loadDayData()` → `getCompletionStatus()`
- ✅ **Résultat :** `completionStatus` et `freshCompletionData` sont remplis

### 5.2 Rafraîchissement au focus
- ✅ **Quand :** L'utilisateur revient sur l'écran (`useFocusEffect` ligne 264)
- ✅ **Quoi :** `loadDayData()` → `getCompletionStatus()`
- ✅ **Résultat :** Données mises à jour avec les dernières complétions

### 5.3 Après complétion d'un repas
- ✅ **Quand :** Immédiatement après `POST /meals/{mealId}/complete`
- ✅ **Quoi :** `getCompletionStatus()` appelé directement
- ✅ **Résultat :** `freshCompletionData` mis à jour → UI se met à jour immédiatement

### 5.4 Changement de date sélectionnée
- ✅ **Quand :** L'utilisateur change la date dans le calendrier
- ✅ **Quoi :** `loadDayData()` recalcule le `planDay` et charge les repas
- ✅ **Résultat :** Les repas du jour sélectionné sont affichés avec leur statut

---

## 🎨 6. AFFICHAGE DANS L'UI

### 6.1 Bouton "Compléter des repas"
- **Condition d'affichage :** `hasIncompleteMeals === true`
- **Vérification :** Utilise `isMealCompleted()` pour chaque repas du jour
- **Mise à jour :** Se met à jour automatiquement quand `freshCompletionData` change

### 6.2 Modal des détails du repas
- **Bouton "Compléter ce repas" :** Affiche si `!isMealCompleted(mealId, freshCompletionData, currentPlanDay)`
- **Message de succès :** Affiche si `isMealCompleted()` retourne `true`
- **Mise à jour :** Immédiate après complétion grâce à `freshCompletionData`

### 6.3 BottomSheet "Compléter des repas"
- **Filtrage :** Utilise `getIncompleteMeals()` qui filtre avec `isMealCompleted()`
- **Mise à jour :** `useMemo` dépend de `freshCompletionData` et `planDay`
- **Résultat :** Les repas complétés disparaissent automatiquement

---

## 🔄 7. SYNCHRONISATION AVEC LE SERVEUR

### 7.1 Endpoints utilisés

1. **GET `/api/v1/meals/plans/{planId}/completion-status`**
   - **Quand :** Chargement initial, au focus, après complétion
   - **Retourne :** Toutes les complétions du plan organisées par jour

2. **POST `/api/v1/meals/{mealId}/complete`**
   - **Quand :** L'utilisateur complète un repas
   - **Body :** `{ planDay, nutritionPlanId, completionDate }`
   - **Retourne :** `{ completionId, mealId, pointsAwarded }`

### 7.2 Gestion des erreurs

- **401 Unauthorized :** Tentative de rafraîchissement du token Firebase puis retry
- **Erreur réseau :** Fallback sur les données locales (`completionStatus`)
- **Erreur serveur :** Log de l'erreur, UI reste fonctionnelle avec les données locales

---

## 📝 8. RÉSUMÉ DU FLUX COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CHARGEMENT INITIAL                                       │
│    useEffect → fetchAllData() → loadDayData()               │
│    → GET /completion-status                                 │
│    → completionStatus rempli                                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. VÉRIFICATION DU STATUT                                  │
│    isMealCompleted(mealId, completionStatus, planDay)     │
│    → Vérifie dans completionsByDay[planDay]                │
│    → Retourne true/false                                   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. COMPLÉTION D'UN REPAS                                   │
│    handleMealComplete(mealId)                              │
│    → POST /meals/{mealId}/complete                         │
│    → Mise à jour locale optimiste                          │
│    → GET /completion-status (rafraîchissement)            │
│    → freshCompletionData mis à jour                        │
│    → UI se met à jour automatiquement                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. AFFICHAGE MIS À JOUR                                    │
│    - Bouton → "Repas complété avec succès !"               │
│    - BottomSheet → Repas filtré (disparaît)                │
│    - Progression → Pourcentage mis à jour                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Points clés à retenir

1. **Les données sont chargées :**
   - Au montage du composant
   - Quand l'écran revient au focus
   - Immédiatement après chaque complétion

2. **On sait qu'un repas est complété en vérifiant :**
   - `completionsByDay[planDay]` (source principale)
   - `dayProgress.completedMealIds` (fallback)
   - `mealStatus[mealId].completed` (fallback)
   - `allCompletions` (fallback)

3. **La mise à jour de l'UI est automatique :**
   - Grâce à `freshCompletionData` qui force le re-render
   - Les composants utilisent `useMemo` avec les bonnes dépendances
   - Le filtrage se fait automatiquement avec `isMealCompleted()`

4. **La synchronisation avec le serveur :**
   - Se fait immédiatement après chaque complétion
   - Utilise le même endpoint que la version web
   - Gère les erreurs avec fallback sur les données locales

