# Subscription Payment Flow - Documentation

## 📋 Vue d'ensemble

Un composant de paiement mobile étape par étape a été créé pour remplacer la webview de paiement. Ce composant offre une expérience native et fluide pour les abonnements.

## ✅ Ce qui a été fait

### 1. Composant `SubscriptionPaymentFlow.js`
- **Localisation**: `src/components/SubscriptionPaymentFlow.js`
- **Fonctionnalités**:
  - 4 étapes de paiement :
    1. **Sélection du moyen de paiement** : Stripe (carte bancaire) ou PayPal
    2. **Saisie des informations** : Formulaire de carte pour Stripe, ou redirection pour PayPal
    3. **Confirmation** : Récapitulatif avant paiement
    4. **Résultat** : Succès ou erreur
  - Indicateur de progression visuel
  - Gestion des erreurs
  - Interface responsive et moderne

### 2. Intégration dans `DashboardScreen.js`
- Remplacement de la logique webview par l'ouverture du composant de paiement
- Gestion des callbacks `onSuccess` et `onError`
- Rafraîchissement automatique des données d'abonnement après paiement réussi

### 3. Endpoints utilisés
- `POST /payments/create-stripe-checkout-session` - Création de session Stripe
- `POST /payments/create-paypal-order` - Création de commande PayPal

## 🔧 Ce qui reste à faire

### 1. Intégration Stripe SDK (Priorité: Haute)
**Problème actuel**: Le composant simule le paiement Stripe au lieu d'utiliser le SDK réel.

**Solution**:
- Installer `@stripe/stripe-react-native` :
  ```bash
  npm install @stripe/stripe-react-native
  ```
- Intégrer Stripe Elements dans l'étape 2 du composant
- Utiliser `confirmPayment` avec le `clientSecret` retourné par le backend
- Gérer les erreurs de paiement Stripe

**Code à ajouter dans `SubscriptionPaymentFlow.js`**:
```javascript
import { useStripe, useElements, CardElement } from '@stripe/stripe-react-native';

// Dans renderStep2_CardInput pour Stripe:
const { confirmPayment } = useStripe();
const elements = useElements();

// Dans handleConfirmPayment:
const { error, paymentIntent } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
});
```

### 2. Intégration PayPal SDK (Priorité: Moyenne)
**Problème actuel**: Le composant simule le paiement PayPal.

**Options**:
- **Option A**: Utiliser `react-native-paypal` SDK (si disponible)
- **Option B**: Utiliser une webview dédiée pour PayPal (plus simple)
- **Option C**: Rediriger vers l'app PayPal si installée

**Recommandation**: Option B (webview) car plus simple et compatible avec tous les comptes PayPal.

### 3. Endpoints backend manquants (Priorité: Haute)
Le backend doit implémenter ces endpoints pour finaliser les paiements :

#### A. Confirmation Stripe
```
POST /payments/confirm-stripe-payment
Body: {
  sessionId: string,
  paymentIntentId: string,
  paymentMethodId: string
}
Response: {
  success: true,
  data: {
    subscriptionId: string,
    status: "ACTIVE",
    expiresAt: string
  }
}
```

#### B. Confirmation PayPal
```
POST /payments/confirm-paypal-payment
Body: {
  orderId: string,
  payerId: string
}
Response: {
  success: true,
  data: {
    subscriptionId: string,
    status: "ACTIVE",
    expiresAt: string
  }
}
```

### 4. Gestion de la réponse backend
**Problème actuel**: Le backend retourne probablement une `url` pour Stripe checkout, mais on a besoin de `sessionId` et `clientSecret` pour le paiement natif.

**Solution**:
- Modifier le backend pour retourner `sessionId` et `clientSecret` quand `clientType: 'mobile'`
- Ou utiliser une webview pour Stripe si le backend ne peut pas être modifié

## 📱 Flux utilisateur actuel

1. **Sélection du plan** → Bottom sheet avec les plans disponibles
2. **Sélection du moyen de paiement** → Stripe ou PayPal
3. **Saisie des informations** → Formulaire de carte (Stripe) ou redirection (PayPal)
4. **Confirmation** → Récapitulatif avant paiement
5. **Traitement** → Appel backend (actuellement simulé)
6. **Résultat** → Succès ou erreur avec rafraîchissement des données

## 🔍 Structure du code

### Composant principal
```javascript
<SubscriptionPaymentFlow
  visible={showPaymentFlow}
  plan={selectedPlan}
  onClose={() => setShowPaymentFlow(false)}
  onSuccess={handlePaymentSuccess}
  onError={handlePaymentError}
/>
```

### États du composant
- `currentStep`: 1-4 (étape actuelle)
- `selectedPaymentMethod`: 'stripe' | 'paypal'
- `autoRenewal`: boolean
- `processing`: boolean
- `error`: string | null
- `success`: boolean

### Données du plan
```javascript
{
  id: string,
  name: string,
  price: number,
  discountPrice?: number,
  duration: number,
  features: string[],
  currency?: string
}
```

## 🚀 Prochaines étapes

1. **Tester le composant** avec les données réelles
2. **Intégrer Stripe SDK** pour le paiement natif
3. **Implémenter PayPal** (webview ou SDK)
4. **Ajouter les endpoints backend** pour la confirmation
5. **Tester le flux complet** de bout en bout

## 📝 Notes importantes

- Le composant est prêt à être utilisé mais nécessite l'intégration des SDKs de paiement
- La simulation actuelle permet de tester l'interface utilisateur
- Les endpoints backend doivent être adaptés pour retourner les données nécessaires au paiement natif
- Le composant gère déjà les erreurs et les états de chargement

## 🔗 Références

- [Stripe React Native SDK](https://stripe.dev/stripe-react-native/)
- [PayPal Mobile SDK](https://developer.paypal.com/docs/checkout/mobile/)
- Endpoints backend: `src/services/subscriptionApi.js`

