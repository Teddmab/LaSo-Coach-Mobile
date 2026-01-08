# 📱 Release Notes - Version 1.0.5

**Date de publication** : $(date)  
**Version** : 1.0.5 (versionCode: 4 pour Android, BuildNumber: 11 pour iOS)

---

## 🎯 Améliorations principales

### 🍽️ Écran Nutrition - Gestion des repas complétés

#### Affichage visuel amélioré
- ✅ **Contour vert visible** : Les repas complétés sont maintenant encadrés d'un contour vert épais (3px) avec ombre verte
- ✅ **Icône de succès** : Icône de validation verte (28px) avec bordure et ombre, positionnée en haut à droite de chaque plat complété
- ✅ **Désactivation du clic** : Les plats complétés ne sont plus cliquables grâce à plusieurs protections (`pointerEvents="none"`, `disabled={true}`, vérification dans `onPress`)

#### Mise à jour immédiate du statut
- ✅ **Feedback instantané** : Le statut de complétion est mis à jour immédiatement dans l'interface après avoir complété un repas, sans attendre le rechargement depuis le serveur
- ✅ **Synchronisation** : Rafraîchissement automatique en arrière-plan pour synchroniser avec le serveur

#### Système d'onglets fonctionnel
- ✅ **Onglets Recette/Ingrédients** : Système d'onglets cliquable avec affichage distinct du contenu
- ✅ **Onglet Recette** (gauche) : Affiche les étapes de préparation
- ✅ **Onglet Ingrédients** (droite) : Affiche la liste complète des ingrédients avec quantités
- ✅ **Par défaut** : L'onglet "Recette" est sélectionné au chargement

### 🔧 Corrections techniques

#### Gestion des erreurs API améliorée
- ✅ **Erreur 400** : Gestion gracieuse des repas déjà complétés avec message informatif
- ✅ **Erreur 403** : Message spécifique pour les abonnements requis
- ✅ **Erreur 404** : Message spécifique pour les repas/plans introuvables
- ✅ **Pas de retry** : Les complétions dupliquées ne sont plus retentées

#### Performance et stabilité
- ✅ **Correction boucle infinie** : Résolution du problème de logs répétitifs dans les `useEffect`
- ✅ **Réduction des logs** : Simplification de la fonction `isDateOutsideSubscription` pour éviter les logs excessifs
- ✅ **Logs de debug** : Ajout de logs détaillés pour faciliter le débogage du statut de complétion

#### Corrections TypeScript
- ✅ **Types de navigation** : Correction des erreurs TypeScript dans `App.tsx` pour les écrans Login et PasswordReset
- ✅ **Types de route** : Mise à jour des types de navigation pour supporter les paramètres optionnels

### 🎨 Améliorations UI/UX

#### Notifications Toast
- ✅ **Position ajustée** : Les notifications toast sont maintenant positionnées plus bas (`topOffset: 60`) pour une meilleure visibilité, notamment lors du login

#### Termes et Services
- ✅ **Suppression du Lorem Ipsum** : Retrait du texte placeholder dans les termes et services
- ✅ **Texte en gras** : Le texte de confirmation est maintenant en gras pour plus de visibilité
- ✅ **Site web ajouté** : Ajout de "www.lasocoach.com" à la fin des termes et services

---

## 🐛 Corrections de bugs

- ✅ **Repas complétés cliquables** : Correction du problème où les repas complétés restaient cliquables même après complétion
- ✅ **Double clic requis** : Résolution du problème nécessitant deux clics pour compléter un repas
- ✅ **Statut non mis à jour** : Correction de la mise à jour immédiate du statut de complétion après action
- ✅ **Boucle infinie** : Correction des appels répétitifs à `loadDayData()` dans les `useEffect`
- ✅ **Version Android** : Correction du problème où le build AAB générait v3 et 1.0.4 au lieu de v4 et 1.0.5

---

## 📋 Détails techniques

### Fichiers modifiés

#### Configuration
- `app.json` : version 1.0.5, versionCode Android: 4, buildNumber iOS: 11
- `android/app/build.gradle` : versionCode 4, versionName "1.0.5"
- `app.config.js` : APP_VERSION 1.0.5
- `plugins/withIOSCrashFix.js` : fallback version 1.0.5
- `src/config/sentry.ts` : app_version 1.0.5

#### Écran Nutrition
- `src/screens/NutritionScreen.tsx` :
  - Amélioration de l'affichage des plats complétés
  - Mise à jour immédiate du statut de complétion
  - Correction de la boucle infinie dans les useEffect
  - Amélioration de la gestion des erreurs API
  - Système d'onglets fonctionnel pour Recette/Ingrédients

#### UI/UX
- `App.tsx` : Position du Toast ajustée (topOffset: 60)
- `src/screens/LoginScreen.tsx` : Suppression lorem ipsum, texte en gras, ajout site web
- `src/screens/RegisterScreen.tsx` : Suppression lorem ipsum, texte en gras, ajout site web
- `src/types/navigation.ts` : Correction des types de navigation

---

## 🔄 Compatibilité API

### Endpoints utilisés
- ✅ `POST /meals/{mealId}/complete` : Complétion de repas avec payload `{ nutritionPlanId, completionDate, planDay }`
- ✅ `GET /meals/plans/{planId}/completion-status` : Récupération du statut de complétion global
- ✅ Gestion complète des erreurs HTTP (400, 403, 404)

### Validation backend
- ✅ Meal exists
- ✅ Plan exists
- ✅ User is owner/admin or has active subscription
- ✅ Not already completed for that plan/date

---

## 📱 Compatibilité

- ✅ **Android** : versionCode 4, versionName 1.0.5
- ✅ **iOS** : BuildNumber 11, Version 1.0.5
- ✅ **Expo SDK** : Compatible avec la version actuelle

---

## 🚀 Prochaines étapes

- Amélioration continue de la gestion des repas complétés
- Optimisation des performances de chargement
- Amélioration de l'expérience utilisateur globale

---

## 📞 Support

Pour toute question ou problème, contactez le support à : support@lasocoach.com  
Site web : www.lasocoach.com

---

**Merci d'utiliser LaSo Coach !** 🎉

