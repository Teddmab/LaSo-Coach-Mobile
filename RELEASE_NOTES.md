# Release Notes - v1.x.x

**Date:** 31 janvier 2026  
**Branche:** MoiseIOS  
**Commit:** 8c82081

---

## 🎯 Nouveautés

### Paiement Stripe
- ✅ **Fermeture automatique** de la WebView après paiement réussi
- ✅ **Détection intelligente** des URLs de succès/annulation
- ✅ **Bouton "Vérifier le statut"** après 2 minutes (secours manuel)
- ✅ **Confirmation backend** automatique du paiement
- ✅ **Modal se ferme automatiquement** 3 secondes après confirmation

### Navigation
- ✅ **Onglets actifs désélectionnés** sur les écrans overlay (Abonnement, L'Agora, etc.)
- ✅ **Redirection vers Abonnement** corrigée sur Android
- ✅ **Navigation fluide** entre overlay et onglets principaux

### Nutrition
- ✅ **Calcul correct du jour** dans le plan nutritionnel (utilise `plan.startDate`)
- ✅ **Plans cycliques** gérés correctement (ex: jour 9 d'un plan de 7 jours = jour 2)
- ✅ **Accent "Petit-Déj"** harmonisé entre Home et Nutrition

---

## 🐛 Corrections de bugs

### Abonnements
- 🔧 Détection d'abonnement actif corrigée sur l'écran Home
- 🔧 Envoi de la plateforme (iOS/Android) au backend lors de l'inscription/connexion
- 🔧 Carte nutrition verrouillée affichée correctement sur Android

### Paiements
- 🔧 WebView Stripe bloquée après paiement → **résolu**
- 🔧 Session Stripe non créée → **résolu** (problème de format `url` vs `checkoutUrl`)
- 🔧 Logs détaillés ajoutés pour débogage

### Navigation
- 🔧 Onglet "home" reste actif sur overlay → **résolu**
- 🔧 Redirection vers page Abonnement ne fonctionnait pas → **résolu**

---

## 🔧 Améliorations techniques

- Logs détaillés pour le flow de paiement Stripe et Mobile Money
- Logique de priorité pour le calcul du jour nutritionnel
- Vérification de compatibilité backward pour les anciennes données
- Gestion des erreurs améliorée dans les WebViews

---

## 📝 Notes pour le backend

Le mobile envoie maintenant `platform: 'ios' | 'android'` lors de :
- `/auth/register` (inscription email/password)
- `/auth/login` (connexion Google)

Le mobile utilise `plan.startDate` si disponible dans `/api/v1/nutrition/plans`.

---

## ⚠️ Breaking Changes

Aucun.

---

## 🧪 Tests recommandés

1. ✅ **Stripe Payment:** Effectuer un paiement et vérifier la fermeture automatique
2. ✅ **Navigation:** Naviguer vers L'Agora → vérifier qu'aucun onglet n'est actif
3. ✅ **Nutrition:** Vérifier que le jour correct est affiché selon `plan.startDate`
4. ✅ **Abonnement:** Après paiement, vérifier que Home débloque le contenu

---

**Contributeur:** Assistant IA  
**Validateur:** @moses

