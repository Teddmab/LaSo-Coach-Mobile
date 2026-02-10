# 🗺️ Mapping Abonnements → Plans Nutritionnels

## 📋 Contexte

### Logique actuelle
- **Android/Web** : Différenciation des abonnements
  - Essai gratuit : 7 jours (price: 0)
  - Mensuel : 10$/mois (duration: 30 jours)
  - Annuel : 1 an (duration: 365 jours)

- **iOS** : Mode Companion
  - Pas de différences entre plans
  - Accès complet à tous les plans (premium-like)
  - Pas de restriction basée sur l'abonnement

### Problème actuel
- Tous les utilisateurs reçoivent **tous les plans nutritionnels actifs**
- Pas de filtrage selon le type d'abonnement
- La table `SubscriptionPlanNutritionPlan` existe mais n'est pas utilisée automatiquement

---

## 🎯 Objectif

Mapper les plans d'abonnement aux plans nutritionnels pour :
- **Android/Web** : Filtrer les plans selon l'abonnement (gratuit/premium)
- **iOS** : Garder l'accès complet (pas de changement)

---

## ✅ Actions à faire

### 1. Backend - Modifier `createSubscription`

**Fichier** : `src/controllers/subscription.controller.ts`

**Action** : Assigner automatiquement `assignedPlanId` lors de la création d'une subscription

```typescript
// Après la création de la subscription (ligne ~456)
// Récupérer le mapping SubscriptionPlanNutritionPlan
const nutritionMapping = await this.prisma.subscriptionPlanNutritionPlan.findFirst({
  where: { subscriptionPlanId: planId }
});

if (nutritionMapping) {
  // Mettre à jour la subscription avec le plan nutritionnel assigné
  await this.prisma.subscription.update({
    where: { id: subscription.id },
    data: { assignedPlanId: nutritionMapping.nutritionPlanId }
  });
}
```

---

### 2. Backend - Filtrer les plans dans `getNutritionPlans`

**Fichier** : `src/controllers/nutrition-plan.controller.ts`

**Action** : Retourner uniquement les plans mappés à l'abonnement de l'utilisateur

```typescript
// Au lieu de retourner tous les plans actifs (ligne ~40)
// Filtrer selon SubscriptionPlanNutritionPlan

const userSubscription = await this.prisma.subscription.findFirst({
  where: { userId: user.id, status: 'ACTIVE' }
});

if (userSubscription) {
  // Récupérer les plans nutritionnels mappés
  const mappings = await this.prisma.subscriptionPlanNutritionPlan.findMany({
    where: { subscriptionPlanId: userSubscription.planId },
    include: { NutritionPlan: true }
  });
  
  // Retourner seulement les plans mappés
  const mappedPlans = mappings.map(m => m.NutritionPlan).filter(p => p.isActive);
} else {
  // Pas d'abonnement → retourner plans gratuits ou vides
}
```

**Exception iOS** : Si `platform === 'ios'` ou `isCompanionMode`, retourner tous les plans actifs (comportement actuel)

---

### 3. Backend - Créer les mappings dans la base de données

**Action** : Via l'interface admin ou script SQL

```sql
-- Exemple de mapping
INSERT INTO "SubscriptionPlanNutritionPlan" (id, "subscriptionPlanId", "nutritionPlanId")
VALUES 
  -- Essai gratuit → Plan gratuit
  (gen_random_uuid(), 'plan-gratuit-id', 'nutrition-plan-gratuit-id'),
  -- Mensuel → Plan premium mensuel
  (gen_random_uuid(), 'plan-mensuel-id', 'nutrition-plan-premium-id'),
  -- Annuel → Plan premium annuel
  (gen_random_uuid(), 'plan-annuel-id', 'nutrition-plan-premium-id');
```

---

### 4. Frontend iOS - Aucun changement nécessaire

**Raison** : iOS garde l'accès complet, le backend retournera tous les plans pour iOS

---

### 5. Frontend Web/Android - Aucun changement nécessaire

**Raison** : Le filtrage se fait côté backend, le frontend reçoit déjà les bons plans

---

## 🔍 Points d'attention

1. **Migration des données existantes**
   - Les subscriptions existantes n'ont pas `assignedPlanId`
   - Créer un script de migration pour assigner les plans selon `planId`

2. **Gestion des cas limites**
   - Utilisateur sans abonnement → Plans gratuits ou vides ?
   - Abonnement expiré → Bloquer l'accès ou plans gratuits ?
   - Plusieurs plans nutritionnels mappés → Prendre le premier ou tous ?

3. **iOS Companion Mode**
   - Vérifier que `platform === 'ios'` dans le backend
   - Ou utiliser un header/paramètre pour identifier iOS
   - Retourner tous les plans pour iOS

---

## 📝 Checklist

- [ ] Modifier `createSubscription` pour assigner automatiquement `assignedPlanId`
- [ ] Modifier `getNutritionPlans` pour filtrer selon le mapping
- [ ] Ajouter la détection iOS dans le backend
- [ ] Créer les mappings dans la base de données
- [ ] Script de migration pour les subscriptions existantes
- [ ] Tests : Essai gratuit → Plan gratuit
- [ ] Tests : Mensuel → Plan premium
- [ ] Tests : Annuel → Plan premium
- [ ] Tests : iOS → Tous les plans (accès complet)
- [ ] Tests : Utilisateur sans abonnement → Plans gratuits

---

## 📚 Références

- Table `SubscriptionPlanNutritionPlan` : Mapping abonnement → plan nutritionnel
- Table `Subscription` : Champ `assignedPlanId` pour le plan nutritionnel assigné
- Endpoint admin : `/admin/subscription-plans/:id/nutrition-plans` pour créer les mappings
- iOS Companion Mode : `src/config/featureFlags.ts` → `IOS_COMPANION_MODE = true`

