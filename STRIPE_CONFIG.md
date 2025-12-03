# Configuration Stripe

## 📋 Vue d'ensemble

L'application utilise le SDK Stripe natif (`@stripe/stripe-react-native`) pour les paiements par carte bancaire. La clé publishable Stripe doit être configurée pour que le SDK fonctionne correctement.

## 🔑 Configuration de la clé Stripe

### Option 1 : Variable d'environnement (Recommandé)

Ajoutez la clé Stripe publishable dans votre fichier `.env` :

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_stripe_ici
```

**Pour la production :**
```bash
STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_stripe_production
```

### Option 2 : Configuration dans app.json

Vous pouvez également ajouter la clé directement dans `app.json` :

```json
{
  "expo": {
    "extra": {
      "env": {
        "stripePublishableKey": "pk_test_votre_cle_stripe_ici"
      }
    }
  }
}
```

## 🔄 Ordre de priorité

La clé Stripe est chargée dans l'ordre suivant :

1. **app.json** (`extra.env.stripePublishableKey`)
2. **Variable d'environnement** (`.env` → `STRIPE_PUBLISHABLE_KEY`)
3. **Fallback** : `pk_test_placeholder` (affichera un avertissement)

## ✅ Vérification

Lors du démarrage de l'application, vous verrez dans les logs :

- ✅ `[Stripe] Publishable key loaded from configuration` - Clé chargée avec succès
- ⚠️ `[Stripe] Publishable key not found in configuration. Using placeholder.` - Clé manquante

## 🔐 Où trouver votre clé Stripe

1. Connectez-vous à votre [tableau de bord Stripe](https://dashboard.stripe.com/)
2. Allez dans **Developers** → **API keys**
3. Copiez la **Publishable key** (commence par `pk_test_` pour le test, `pk_live_` pour la production)

## 🚨 Sécurité

- ✅ **Publishable key** : Peut être exposée publiquement (dans le code client)
- ❌ **Secret key** : Ne JAMAIS exposer (uniquement côté serveur/backend)

La clé publishable est sécurisée à exposer dans le code client mobile car elle ne permet que de créer des tokens de paiement, pas de traiter les paiements directement.

## 📝 Notes

- La clé est chargée au démarrage de l'application via `App.js`
- Le `StripeProvider` enveloppe toute l'application pour rendre le SDK disponible partout
- Si la clé n'est pas configurée, un placeholder sera utilisé et un avertissement sera affiché dans les logs

