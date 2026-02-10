# 🎯 PLAN D'OPTIMISATION - NUTRITION SCREEN

## OBJECTIF
Aligner la version mobile sur la version web pour :
- Réduire les appels API
- Améliorer les performances
- Être cohérent entre les plateformes

## FLUX ACTUEL (MOBILE) ❌

```
fetchAllData():
  1. GET /subscriptions/current
  2. GET /profile
  3. GET /nutrition/plans
  ↓
  setTimeout → loadDayData():
    4. GET /plans/{planId}/completion-status  ❌ APPEL À CHAQUE CHANGEMENT DE DATE !
```

**Problème** : `completion-status` rechargé à chaque changement de date

## FLUX CIBLE (COMME WEB) ✅

```
fetchAllData():
  1. GET /subscriptions/current
  2. GET /profile
  3. GET /nutrition/plans
  4. GET /plans/{planId}/completion-status  ✅ UNE SEULE FOIS !
  ↓
  loadDayData():
    - Calcul local du menu du jour (pas d'API)
    - Filtrage des repas (pas d'API)
```

**Avantage** : `completion-status` chargé UNE SEULE FOIS, pas de rechargement inutile

## CHANGEMENTS À FAIRE

### 1. Extraire `fetchCompletionStatus()` de `loadDayData()`
```typescript
const fetchCompletionStatus = async (planId: string) => {
  // Charger completion status depuis l'API
  // Appeler UNE SEULE FOIS dans fetchAllData
};
```

### 2. Simplifier `loadDayData()`
```typescript
const loadDayData = () => {
  // PLUS d'appel API
  // Seulement calculs locaux :
  // - Calculer le jour du plan
  // - Trouver le menu correspondant
  // - Filtrer les repas
};
```

### 3. Appeler dans `fetchAllData()`
```typescript
// Après avoir chargé le plan
if (loadedPlan) {
  await fetchCompletionStatus(loadedPlan.id);  // ← API
  loadDayData();  // ← Local seulement
}
```

## RÉSULTAT ATTENDU

- ✅ 1 seul appel `completion-status` au chargement initial
- ✅ Changement de date = calcul local instantané
- ✅ Cohérence totale avec la version web
- ✅ Meilleure performance

