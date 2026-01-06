# Comparaison des Endpoints de Subscription - Web vs Mobile

## Problème identifié

Il existe une **incohérence** entre les endpoints utilisés pour la subscription au free plan entre la version web et la version mobile.

## Endpoints actuels

### Version Web (`LaSo-Coach-Frontend`)
- **Endpoint** : `POST /api/v1/subscriptions/create`
- **Format** : `{ planId: string }`
- **Fichier** : `src/services/subscriptionApi.ts` ligne 50
- **Utilisation** : `subscriptionApi.createSubscription(plan.id)`

```typescript
createSubscription: (planId: string) =>
  firebaseApi.post<{ success: boolean; data: SubscriptionStatus }>(
    getApiUrl('/api/v1/subscriptions/create'), 
    { planId }
  ),
```

### Version Mobile (`LaSo-Coach-Mobile`)
- **Endpoint** : `POST /subscriptions/subscribe`
- **Format** : `{ subscriptionPlanId: string }`
- **Fichier** : `src/services/subscriptionApi.ts` ligne 273-284
- **Utilisation** : `SubscriptionApi.activateFreeTrial(planId)`

```typescript
static async subscribe(subscriptionData) {
  const response = await api.post('/subscriptions/subscribe', subscriptionData);
  return response.data.data || response.data;
}

static async activateFreeTrial(planId) {
  const subscriptionData = {
    subscriptionPlanId: planId, // Format utilisé par la version web
  };
  return await this.subscribe(subscriptionData);
}
```

## Différences

1. **Chemin d'endpoint différent** :
   - Web : `/api/v1/subscriptions/create`
   - Mobile : `/subscriptions/subscribe`

2. **Nom du paramètre différent** :
   - Web : `planId`
   - Mobile : `subscriptionPlanId`

3. **Structure de réponse** :
   - Les deux semblent retourner `{ success: boolean, data: {...} }` ou `{ data: {...} }`

## Recommandation

Pour assurer la **conformité** entre les deux versions, il faut :

### Option 1 : Aligner Mobile sur Web (RECOMMANDÉ)
Modifier la version mobile pour utiliser le même endpoint que la version web.

**Avantages** :
- Cohérence avec la version web
- Un seul endpoint à maintenir côté backend
- Format de paramètre plus simple (`planId` vs `subscriptionPlanId`)

**Modifications nécessaires** :
1. Mettre à jour `SubscriptionApi.subscribe()` pour utiliser `/api/v1/subscriptions/create`
2. Changer le format du payload de `{ subscriptionPlanId }` à `{ planId }`
3. Mettre à jour `activateFreeTrial()` pour utiliser le nouveau format

### Option 2 : Aligner Web sur Mobile
Modifier la version web pour utiliser `/subscriptions/subscribe`.

**Inconvénients** :
- Plus de changements nécessaires dans la version web
- Le format `subscriptionPlanId` est moins intuitif

## Solution proposée : Option 1

### Fichiers à modifier dans Mobile

1. **`src/services/subscriptionApi.ts`** :
   - Modifier `subscribe()` pour utiliser `/api/v1/subscriptions/create`
   - Changer le format du payload

2. **`src/config/apiConfig.ts`** (optionnel) :
   - Ajouter l'endpoint `/api/v1/subscriptions/create` dans la configuration

## Code proposé pour Mobile

```typescript
/**
 * Subscribe to a plan (aligned with web version)
 * POST /api/v1/subscriptions/create - Same endpoint as web version
 * @param {Object} subscriptionData - Subscription data with planId
 * @returns {Promise<Object>} Subscription data
 */
static async subscribe(subscriptionData) {
  try {
    // Utiliser exactement le même endpoint que la version web
    const response = await api.post('/api/v1/subscriptions/create', subscriptionData);
    
    return response.data.data || response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Activate free trial subscription
 * Utilise le même endpoint que la version web: POST /api/v1/subscriptions/create
 * Le backend détecte automatiquement que c'est un plan gratuit (price = 0)
 * @param {string} planId - Plan ID
 * @returns {Promise<Object>} Subscription data
 */
static async activateFreeTrial(planId) {
  try {
    // Utiliser exactement le même endpoint et format que la version web
    const subscriptionData = {
      planId: planId, // Format utilisé par la version web (au lieu de subscriptionPlanId)
    };
    
    return await this.subscribe(subscriptionData);
  } catch (error) {
    throw error;
  }
}
```

## Vérification backend

Il faut vérifier que le backend accepte les deux formats ou qu'il normalise les paramètres :
- `planId` (version web)
- `subscriptionPlanId` (version mobile actuelle)

Si le backend accepte déjà les deux, alors il faut juste aligner le code mobile pour utiliser le même format que la web.

## Prochaines étapes

1. ✅ Vérifier que le backend accepte `/api/v1/subscriptions/create` avec `{ planId }`
2. ✅ Modifier `src/services/subscriptionApi.ts` dans la version mobile
3. ✅ Tester l'activation du free plan après inscription
4. ✅ Vérifier que le flux d'inscription multi-étapes active automatiquement le free plan

