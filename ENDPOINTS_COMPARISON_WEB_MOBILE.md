# Comparaison des Endpoints - Web vs Mobile

## ⚠️ Important : Structure des URLs

**Version Mobile** :
- `API_BASE_URL` contient déjà `/api/v1` (ex: `https://laso-coach-backend.onrender.com/api/v1`)
- Les endpoints dans le code utilisent des chemins relatifs (ex: `/subscriptions/plans`)
- **URL finale** : `API_BASE_URL + endpoint` = `https://laso-coach-backend.onrender.com/api/v1/subscriptions/plans` ✅

**Version Web** :
- `getApiUrl()` ajoute `/api/v1` au chemin fourni
- Les endpoints dans le code incluent `/api/v1` (ex: `/api/v1/subscriptions/plans`)
- **URL finale** : `baseURL + /api/v1/subscriptions/plans` ✅

## Résumé

Ce document compare tous les endpoints utilisés entre la version web et mobile pour assurer la conformité.

## Endpoints de Subscription

### ✅ Alignés

| Fonctionnalité | Web (code) | Mobile (code) | URL Finale Mobile | Status |
|----------------|------------|---------------|-------------------|--------|
| Get Plans | `/api/v1/subscriptions/plans` | `/subscriptions/plans` | `/api/v1/subscriptions/plans` | ✅ Aligné |
| Create Subscription | `/api/v1/subscriptions/create` | `/subscriptions/create` | `/api/v1/subscriptions/create` | ✅ Aligné |
| Get Current Subscription | `/api/v1/subscriptions` | `/subscriptions` | `/api/v1/subscriptions` | ✅ Aligné (corrigé) |
| Get History | `/api/v1/subscriptions/history` | `/subscriptions/history` | `/api/v1/subscriptions/history` | ✅ Aligné |
| Renew | `/api/v1/subscriptions/renew` | `/subscriptions/renew` | `/api/v1/subscriptions/renew` | ✅ Aligné |
| Auto-renewal Enable | `/api/v1/subscriptions/{id}/auto-renewal/enable` | `/subscriptions/{id}/auto-renewal/enable` | `/api/v1/subscriptions/{id}/auto-renewal/enable` | ✅ Aligné |
| Auto-renewal Disable | `/api/v1/subscriptions/{id}/auto-renewal/disable` | `/subscriptions/{id}/auto-renewal/disable` | `/api/v1/subscriptions/{id}/auto-renewal/disable` | ✅ Aligné |
| Auto-renewal Status | `/api/v1/subscriptions/{id}/auto-renewal/status` | `/subscriptions/{id}/auto-renewal/status` | `/api/v1/subscriptions/{id}/auto-renewal/status` | ✅ Aligné |

### ✅ Tous alignés

Tous les endpoints de subscription sont maintenant alignés entre web et mobile.

## Endpoints de Paiement

### ✅ Alignés

| Fonctionnalité | Web (code) | Mobile (code) | URL Finale Mobile | Status |
|----------------|------------|---------------|-------------------|--------|
| Create Stripe Checkout | `/api/v1/payments/create-stripe-checkout-session` | `/payments/create-stripe-checkout-session` | `/api/v1/payments/create-stripe-checkout-session` | ✅ Aligné |
| Create PayPal Order | `/api/v1/payments/create-paypal-order` | `/payments/create-paypal-order` | `/api/v1/payments/create-paypal-order` | ✅ Aligné |
| Confirm Stripe Payment | Non trouvé dans web | `/payments/confirm-stripe-payment` | `/api/v1/payments/confirm-stripe-payment` | ✅ Mobile uniquement |
| Confirm PayPal Payment | Non trouvé dans web | `/payments/confirm-paypal-payment` | `/api/v1/payments/confirm-paypal-payment` | ✅ Mobile uniquement |
| Pending Payments | `/api/v1/payments/pending` | `/payments/pending` | `/api/v1/payments/pending` | ✅ Aligné |
| Retry Payment | `/api/v1/payments/{id}/retry` | `/payments/{id}/retry` | `/api/v1/payments/{id}/retry` | ✅ Aligné (corrigé) |
| Get Payment Config | Non trouvé dans web | `/payments/config` | `/api/v1/payments/config` | ✅ Mobile uniquement |
| Latest Payment Method | Non trouvé dans web | `/subscriptions/latest-payment-method` | `/api/v1/subscriptions/latest-payment-method` | ✅ Mobile uniquement |

### ✅ Tous alignés

Tous les endpoints de paiement sont maintenant alignés entre web et mobile.

**Vérification Backend** :
- Backend route : `POST /payments/:transactionId/retry` (confirmé dans `payment.routes.ts`)
- Format correct : `/api/v1/payments/{transactionId}/retry`
- ✅ Web utilise le bon format
- ✅ Mobile corrigé pour utiliser le bon format

### ✅ Actions Complétées

1. ✅ Corriger `/subscriptions/current` → `/subscriptions` dans mobile
2. ✅ Ajouter gestion informative pour abonnement existant dans le flow de paiement
3. ✅ Vérifier que tous les endpoints utilisent des chemins relatifs (sans `/api/v1` car déjà dans `API_BASE_URL`)

## Vérification de la Structure

Tous les endpoints mobiles sont correctement configurés :
- ✅ Utilisent des chemins relatifs (ex: `/subscriptions/plans`)
- ✅ `API_BASE_URL` contient déjà `/api/v1`
- ✅ URL finale = `API_BASE_URL + endpoint` = `/api/v1/subscriptions/plans` ✅

