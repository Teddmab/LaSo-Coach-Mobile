# Analyse des Modifications à Apporter - Version Mobile

## 📋 Vue d'ensemble

Cette analyse compare la version mobile actuelle avec la version web pour identifier les modifications nécessaires sur trois aspects principaux :
1. **Affichage des plans** (à vérifier)
2. **Page progression** (à revoir)
3. **Page d'abonnement** (doit afficher Stripe et paiement mobile)

**Contrainte importante** : La version mobile doit maintenir la ségrégation iOS/Android :
- **iOS** : Mode compagnon (pas de flux d'achat, redirection vers le web)
- **Android** : Reprend l'implémentation de la version web

---

## 1. AFFICHAGE DES PLANS D'ABONNEMENT

### 🔍 État Actuel (Mobile)

**Fichiers concernés** :
- `src/screens/SubscriptionScreen.tsx`
- `src/screens/subscription/components/PlanCard.tsx`
- `src/screens/subscription/hooks/useSubscriptionScreen.ts`

**Fonctionnalités actuelles** :
- ✅ Récupération des plans via API (`/subscriptions/plans`)
- ✅ Affichage des plans avec images, prix, features
- ✅ Gestion du mode compagnon iOS (masque les plans payants)
- ✅ Support des plans annuels/mensuels avec couleurs personnalisées
- ✅ Affichage des prix avec réduction si applicable

**Problèmes identifiés** :
1. ❌ Pas de sélecteur de méthode de paiement visible avant la sélection du plan
2. ❌ L'affichage des plans ne montre pas explicitement les méthodes de paiement disponibles
3. ❌ Pas de distinction visuelle claire entre Stripe et paiement mobile

### 🔍 État Actuel (Web)

**Fichiers concernés** :
- `src/pages/onboarding/Subscription.tsx`
- `src/components/payment/PaymentMethodSelector.tsx`

**Fonctionnalités web** :
- ✅ Sélecteur de méthode de paiement (Stripe, PayPal, Mobile Money)
- ✅ Affichage visuel des méthodes avec icônes
- ✅ Sélection de la méthode avant le paiement
- ✅ Support de plusieurs pays pour le paiement mobile (COD, ZMB, KEN)

### 📝 Modifications à Apporter

#### 1.1 Améliorer l'affichage des plans

**Objectif** : Rendre visible les méthodes de paiement disponibles sur chaque plan

**Actions** :
1. **Ajouter un indicateur de méthodes de paiement sur chaque PlanCard** :
   - Afficher les icônes Stripe et Mobile Money sur chaque carte de plan
   - Indiquer "Stripe + Mobile Money" ou simplement les icônes
   - Position : Sous le prix ou dans la section features

2. **Créer un composant `PaymentMethodsBadge`** :
   ```typescript
   // src/screens/subscription/components/PaymentMethodsBadge.tsx
   - Affiche les icônes Stripe et Mobile Money
   - Utilisé dans PlanCard pour montrer les options disponibles
   - Masqué sur iOS (mode compagnon)
   ```

3. **Mettre à jour `PlanCard.tsx`** :
   - Ajouter le badge des méthodes de paiement
   - Conditionner l'affichage : `!isCompanionMode`

#### 1.2 Vérifier la cohérence des données

**Actions** :
1. Vérifier que l'API retourne bien toutes les informations nécessaires :
   - `price`, `originalPrice`, `currency`, `billingPeriod`
   - `features`, `imageUrl`
   - `isFree`, `isMonthly`, `isYearly`

2. S'assurer que le format des prix est cohérent avec la version web

---

## 2. PAGE PROGRESSION

### 🔍 État Actuel (Mobile)

**Fichiers concernés** :
- `src/screens/ProgressScreen.tsx`
- `src/screens/progress/hooks/useProgressScreen.ts`
- `src/screens/progress/components/ProgressCard.tsx`
- `src/screens/progress/components/ProgressTabs.tsx`

**Fonctionnalités actuelles** :
- ✅ Affichage des mesures (poids, tour de taille)
- ✅ Graphique de progression
- ✅ Onglets pour mesures et photos
- ✅ Modal pour ajouter/modifier des mesures
- ✅ Gestion des photos de progression
- ✅ Affichage des valeurs initiales, actuelles et objectifs

**Problèmes identifiés** :
1. ❌ Layout différent de la version web (colonnes, organisation)
2. ❌ Pas de carte T.A.S.C.C. progression visible
3. ❌ Pas de widget de badges/défis visible
4. ❌ Organisation des cartes moins structurée que la version web

### 🔍 État Actuel (Web)

**Fichiers concernés** :
- `src/pages/Progress.tsx`
- `src/components/dashboard/ProgressCard.tsx`

**Fonctionnalités web** :
- ✅ Layout en deux colonnes (contenu principal + sidebar)
- ✅ Cartes de statistiques (Poids initial/actuel/objectif, Tour de taille initial/actuel/objectif)
- ✅ Graphique avec historique des mesures
- ✅ Tableau des mesures avec possibilité de cliquer pour comparer
- ✅ Carte T.A.S.C.C. progression avec phases
- ✅ Widget de badges et défis
- ✅ Modal de comparaison de mesures
- ✅ Intégration des photos dans les mesures

### 📝 Modifications à Apporter

#### 2.1 Restructurer le layout

**Objectif** : Adopter un layout similaire à la version web avec colonnes

**Actions** :
1. **Modifier `ProgressScreen.tsx`** :
   - Créer un layout en deux colonnes (contenu principal + sidebar)
   - Colonne gauche (flex: 2) : Graphique et tableau des mesures
   - Colonne droite (flex: 1) : Cartes T.A.S.C.C., badges, défis
   - Utiliser `flexDirection: 'row'` avec `flexWrap: 'wrap'` pour le responsive

2. **Créer des composants de cartes statistiques** :
   ```typescript
   // src/screens/progress/components/StatCard.tsx
   - Carte pour afficher une statistique (Poids initial, Poids actuel, etc.)
   - Style similaire à la version web
   - Layout horizontal avec 3 valeurs (initial, actuel, objectif)
   ```

3. **Réorganiser les cartes de statistiques** :
   - Créer deux cartes côte à côte : "Poids" et "Tour de taille"
   - Chaque carte affiche : Initial | Actuel | Objectif
   - Style : fond blanc, ombre, padding, bordures arrondies

#### 2.2 Ajouter la carte T.A.S.C.C.

**Objectif** : Afficher la progression T.A.S.C.C. comme sur la version web

**Actions** :
1. **Créer `TasccProgressCard.tsx`** :
   ```typescript
   // src/screens/progress/components/TasccProgressCard.tsx
   - Affiche les phases T.A.S.C.C. (T, A, S, C, C)
   - Affiche le total de points
   - Affiche la phase actuelle avec description
   - Affiche le streak (jours d'engagement)
   - Style similaire à la version web
   ```

2. **Intégrer dans `ProgressScreen.tsx`** :
   - Placer dans la colonne droite (sidebar)
   - Récupérer les données depuis `useProgressScreen` ou créer un hook dédié
   - Endpoint API : `/api/v1/profile` ou `/api/v1/progress/overview`

#### 2.3 Améliorer le tableau des mesures

**Objectif** : Rendre le tableau interactif comme sur la version web

**Actions** :
1. **Modifier l'affichage des mesures** :
   - Créer un tableau avec colonnes : Poids | Tour de taille | Notes | Date | Actions
   - Permettre le clic sur une ligne pour ouvrir la modal de comparaison
   - Afficher la mesure initiale dans le tableau (ligne spéciale)

2. **Créer `MeasurementComparisonModal.tsx`** :
   ```typescript
   // src/screens/progress/components/MeasurementComparisonModal.tsx
   - Compare deux mesures (initiale vs sélectionnée)
   - Affiche les photos si disponibles
   - Affiche les différences (poids, tour de taille)
   - Style similaire à la version web
   ```

#### 2.4 Ajouter le widget de badges

**Objectif** : Afficher les badges et défis comme sur la version web

**Actions** :
1. **Créer `BadgesWidget.tsx`** :
   ```typescript
   // src/screens/progress/components/BadgesWidget.tsx
   - Affiche les défis complétés et badges collectés
   - Style : carte blanche avec statistiques
   - Position : sidebar droite
   ```

2. **Intégrer dans `ProgressScreen.tsx`** :
   - Récupérer les données depuis l'API
   - Afficher dans la sidebar

#### 2.5 Améliorer le graphique

**Objectif** : Aligner le graphique avec la version web

**Actions** :
1. Vérifier que le graphique affiche bien :
   - Les deux axes Y (gauche pour poids, droite pour tour de taille)
   - Les mesures initiales
   - Le formatage des dates en français
   - Les tooltips avec informations complètes

---

## 3. PAGE D'ABONNEMENT (PAIEMENT)

### 🔍 État Actuel (Mobile)

**Fichiers concernés** :
- `src/screens/SubscriptionScreen.tsx`
- `src/components/SubscriptionPaymentFlowImproved.tsx`
- `src/services/subscriptionApi.ts`

**Fonctionnalités actuelles** :
- ✅ Affichage des plans
- ✅ Flux de paiement mobile (PawaPay)
- ✅ Support de plusieurs opérateurs (Airtel, Orange, M-Pesa)
- ✅ Gestion du polling pour vérifier le statut du paiement
- ✅ Support des notifications push pour les paiements
- ❌ **Paiement Stripe non visible/accessible directement**

**Problèmes identifiés** :
1. ❌ Le flux de paiement ne montre que le paiement mobile
2. ❌ Pas de sélecteur de méthode de paiement (Stripe vs Mobile)
3. ❌ Stripe n'est pas intégré dans le flux de paiement mobile
4. ❌ Pas de distinction claire entre les deux méthodes

### 🔍 État Actuel (Web)

**Fichiers concernés** :
- `src/pages/onboarding/Subscription.tsx`
- `src/components/payment/PaymentMethodSelector.tsx`
- `src/components/payment/PaymentBottomSheet.tsx`

**Fonctionnalités web** :
- ✅ Sélecteur de méthode de paiement (Stripe, PayPal, Mobile Money)
- ✅ Affichage visuel avec icônes et descriptions
- ✅ Flux Stripe avec formulaire de carte
- ✅ Flux PayPal avec redirection
- ✅ Flux Mobile Money avec formulaire (pays, opérateur, téléphone)
- ✅ Support de plusieurs pays pour Mobile Money

### 📝 Modifications à Apporter

#### 3.1 Ajouter le sélecteur de méthode de paiement

**Objectif** : Permettre à l'utilisateur de choisir entre Stripe et Mobile Money

**Actions** :
1. **Créer `PaymentMethodSelector.tsx`** (mobile) :
   ```typescript
   // src/components/payment/PaymentMethodSelector.tsx
   - Composant similaire à la version web
   - Deux options : Stripe (carte) et Mobile Money
   - Affichage avec icônes et descriptions
   - Style adapté à React Native
   - Masqué sur iOS (mode compagnon)
   ```

2. **Intégrer dans `SubscriptionPaymentFlowImproved.tsx`** :
   - Ajouter une étape 0.5 : Sélection de la méthode de paiement
   - Afficher le sélecteur avant le formulaire
   - Stocker la méthode sélectionnée dans l'état

#### 3.2 Intégrer Stripe dans le flux de paiement

**Objectif** : Permettre le paiement par carte bancaire via Stripe

**Actions** :
1. **Vérifier l'intégration Stripe existante** :
   - Vérifier si `@stripe/stripe-react-native` est installé
   - Vérifier la configuration Stripe dans le projet

2. **Modifier `SubscriptionPaymentFlowImproved.tsx`** :
   - Ajouter la logique pour Stripe dans `handleContinueFromPayment`
   - Si méthode = 'stripe' :
     - Créer une session Stripe via API (`/payments/create-stripe-checkout-session`)
     - Si le backend retourne une URL : ouvrir une WebView Stripe
     - Si le backend retourne `clientSecret` : utiliser le SDK Stripe natif
   - Gérer les callbacks de succès/erreur

3. **Créer `StripePaymentForm.tsx`** (optionnel si SDK natif) :
   ```typescript
   // src/components/payment/StripePaymentForm.tsx
   - Formulaire de carte bancaire avec Stripe Elements
   - Utilise @stripe/stripe-react-native
   - Validation et soumission
   ```

4. **Créer `StripeWebView.tsx`** (si WebView nécessaire) :
   ```typescript
   // src/components/payment/StripeWebView.tsx
   - WebView pour afficher le checkout Stripe
   - Gestion des callbacks de succès/erreur
   - Redirection après paiement
   ```

#### 3.3 Améliorer l'UX du flux de paiement

**Objectif** : Rendre le flux plus clair et intuitif

**Actions** :
1. **Restructurer les étapes** :
   - Étape 0 : Informations du plan (actuel)
   - Étape 0.5 : **Sélection de la méthode de paiement** (NOUVEAU)
   - Étape 1 : Formulaire (Stripe ou Mobile Money selon sélection)
   - Étape 2 : Récapitulatif
   - Étape 3 : Traitement
   - Étape 4 : Résultat

2. **Améliorer les indicateurs d'étapes** :
   - Afficher clairement l'étape actuelle
   - Montrer les étapes suivantes
   - Masquer les indicateurs pendant le traitement

3. **Améliorer les messages d'erreur** :
   - Messages plus clairs et en français
   - Suggestions de résolution
   - Possibilité de réessayer

#### 3.4 Gérer la ségrégation iOS/Android

**Objectif** : Maintenir le mode compagnon sur iOS

**Actions** :
1. **Vérifier `useCompanionMode`** :
   - S'assurer que le hook fonctionne correctement
   - Vérifier que `IOS_COMPANION_MODE` est bien configuré

2. **Masquer les options de paiement sur iOS** :
   - Dans `SubscriptionScreen.tsx` : déjà fait (masque les plans)
   - Dans `SubscriptionPaymentFlowImproved.tsx` : ne pas afficher le sélecteur de méthode sur iOS
   - Afficher le message de redirection vers le web

3. **Sur Android** :
   - Afficher toutes les options (Stripe + Mobile Money)
   - Permettre la sélection et le paiement

---

## 4. CORRECTION DU CALCUL DU JOUR - MenuDuJour

### 🔍 Problème Identifié

Le calcul du jour dans le plan nutritionnel utilise actuellement la **date de début de l'abonnement** (`subscription.startDate`) au lieu de la **date de début du plan nutritionnel** (`plan.startDate`).

**Impact** :
- Le menu affiché ne correspond pas au jour réel du plan nutritionnel
- Si l'utilisateur s'inscrit le 1er janvier mais commence son plan le 26 janvier, le calcul est incorrect
- Le menu affiche toujours le jour 1 au lieu du jour réel dans le cycle du plan

**Exemple de bug** :
- Utilisateur inscrit : 1er janvier 2026
- Plan nutritionnel démarré : 26 janvier 2026
- Date actuelle : 27 janvier 2026
- **Attendu** : Menu du jour 2 (plan démarré hier)
- **Actuel (bug)** : Menu du jour 1 (calculé depuis l'inscription, 26 jours auparavant)

### 🔍 État Actuel (Mobile)

**Fichiers concernés** :
- `src/screens/NutritionScreen.tsx` (ligne 641-689)
- `src/screens/nutrition/utils/nutritionUtils.ts` (ligne 105-125)
- `src/screens/nutrition/types/index.ts` (interface `NutritionPlan`)

**Code actuel (incorrect)** :
```typescript
// NutritionScreen.tsx ligne 650-660
if (!subscriptionData?.subscription?.startDate || !currentPlan?.numDays) {
  return 1;
}
const startDate = new Date((subscriptionData as any).subscription.startDate);
```

**Problème** : Utilise `subscription.startDate` au lieu de `plan.startDate`

### 📝 Modifications à Apporter

#### 4.1 Ajouter le champ `startDate` au modèle NutritionPlan

**Objectif** : Recevoir la date de début du plan depuis l'API

**Actions** :
1. **Modifier `src/screens/nutrition/types/index.ts`** :
   ```typescript
   export interface NutritionPlan {
     id: string;
     name: string;
     isActive?: boolean;
     numDays?: number;
     startDate?: string; // ✅ AJOUTER CE CHAMP
     menus?: Menu[];
     youtubeUrl?: string;
   }
   ```

2. **Vérifier que l'API retourne `startDate`** :
   - Endpoint : `/api/v1/nutrition/plans`
   - Le backend retourne déjà ce champ selon le guide
   - Format attendu : `"startDate": "2026-01-26T08:08:08.987Z"`

#### 4.2 Corriger la logique de calcul du jour

**Objectif** : Utiliser `plan.startDate` comme référence principale

**Actions** :
1. **Modifier `calculateNutritionPlanDay` dans `NutritionScreen.tsx`** :
   ```typescript
   const calculateNutritionPlanDay = (selectedDate: Date | number): number => {
     const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
     
     if (!currentPlan?.numDays) {
       return 1; // Default to day 1
     }
     
     // ✅ PRIORITÉ 1 : Utiliser plan.startDate (date de début du plan nutritionnel)
     let referenceDate: Date;
     
     if (currentPlan.startDate) {
       referenceDate = new Date(currentPlan.startDate);
     } 
     // ✅ PRIORITÉ 2 : Fallback vers subscription.startDate (rétrocompatibilité)
     else if (subscriptionData?.subscription?.startDate) {
       referenceDate = new Date(subscriptionData.subscription.startDate);
     }
     // ✅ PRIORITÉ 3 : Fallback vers profile.createdAt (dernier recours)
     else if (profileData?.createdAt) {
       referenceDate = new Date(profileData.createdAt);
     }
     // ✅ PRIORITÉ 4 : Utiliser la date actuelle (dernier recours absolu)
     else {
       referenceDate = new Date();
     }
     
     referenceDate.setHours(0, 0, 0, 0);
     const currentDate = dateObj;
     currentDate.setHours(0, 0, 0, 0);
     
     // Calculer la différence en jours (0-indexed)
     const daysSinceStart = Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
     
     // Appliquer modulo pour gérer les plans cycliques (1-indexed)
     const planDay = (daysSinceStart % currentPlan.numDays) + 1;
     
     return planDay;
   };
   ```

2. **Modifier `calculateNutritionPlanDay` dans `nutritionUtils.ts`** :
   - Appliquer la même logique de priorité
   - Ajouter le paramètre `currentPlan` avec `startDate`
   - Mettre à jour la signature de la fonction si nécessaire

#### 4.3 Mettre à jour tous les appels à la fonction

**Actions** :
1. Vérifier tous les endroits où `calculateNutritionPlanDay` est appelé
2. S'assurer que `currentPlan` contient bien `startDate`
3. Tester avec différents scénarios de dates

#### 4.4 Tests à effectuer

**Scénarios de test** :
1. ✅ **Plan démarré aujourd'hui** : `startDate` = aujourd'hui → Menu jour 1
2. ✅ **Plan démarré hier** : `startDate` = hier → Menu jour 2
3. ✅ **Plan cyclique (7 jours, utilisateur au jour 9)** : `startDate` = il y a 8 jours → Menu jour 2 (cycle)
4. ✅ **Rétrocompatibilité (pas de startDate)** : Utilise `subscription.startDate` → Fonctionne
5. ✅ **Edge case (aucune date)** : Utilise `profile.createdAt` ou date actuelle → Fonctionne

---

## 5. RETIRER L'ABONNEMENT OBLIGATOIRE LORS DE L'INSCRIPTION (Android uniquement)

### 🔍 Problème Identifié

Actuellement, l'inscription peut nécessiter un abonnement. Sur **Android**, on doit permettre l'inscription **sans abonnement obligatoire**. L'abonnement obligatoire doit être **maintenu uniquement sur iOS**.

**Raison** : 
- Sur Android, les utilisateurs doivent pouvoir s'inscrire et explorer l'application avant de s'abonner
- Sur iOS, le mode compagnon nécessite un abonnement externe (via le web), donc l'obligation peut être maintenue

### 🔍 État Actuel (Mobile)

**Fichiers concernés** :
- `src/screens/LoginScreen.tsx` (inscription)
- `src/screens/RegisterScreen.tsx` (inscription alternative)
- `src/context/FirebaseAuthContext.tsx` (logique d'inscription)
- `src/services/firebaseAuthServiceNew.ts` (service d'inscription)
- `src/components/auth/WelcomeBottomSheet.tsx` (accueil après inscription)
- `src/screens/dashboard/components/ProfileCompletionCard.tsx` (onboarding)

**Code actuel** :
- L'inscription ne force pas explicitement l'abonnement (ligne 424 de `LoginScreen.tsx` : "No automatic plan activation")
- Mais il peut y avoir des redirections ou des prompts vers l'abonnement après l'inscription

### 📝 Modifications à Apporter

#### 5.1 Vérifier le flux d'inscription actuel

**Actions** :
1. **Analyser `LoginScreen.tsx`** :
   - Vérifier que `handleFinalRegistration` ne force pas l'abonnement
   - Vérifier qu'il n'y a pas de redirection automatique vers la page d'abonnement
   - Confirmer que l'utilisateur peut accéder au dashboard sans abonnement

2. **Analyser `WelcomeBottomSheet.tsx`** :
   - Vérifier qu'il n'y a pas de prompt obligatoire vers l'abonnement
   - S'assurer que l'utilisateur peut fermer le welcome sans s'abonner

3. **Analyser `ProfileCompletionCard.tsx`** :
   - Vérifier que l'onboarding ne force pas l'abonnement
   - S'assurer que l'utilisateur peut compléter son profil sans abonnement

#### 5.2 S'assurer qu'Android permet l'inscription sans abonnement

**Objectif** : Garantir que sur Android, l'utilisateur peut s'inscrire et utiliser l'app sans abonnement

**Actions** :
1. **Vérifier les redirections après inscription** :
   ```typescript
   // Dans LoginScreen.tsx ou RegisterScreen.tsx
   // ✅ Sur Android : Ne pas rediriger vers l'abonnement
   // ❌ Sur iOS : Peut rediriger vers l'abonnement (mode compagnon)
   
   const { isCompanionMode } = useCompanionMode();
   const isAndroid = Platform.OS === 'android';
   
   // Après inscription réussie
   if (isAndroid && !isCompanionMode) {
     // ✅ Android : Aller directement au dashboard
     navigation.navigate('Dashboard');
   } else if (isCompanionMode) {
     // iOS : Peut rediriger vers l'abonnement si nécessaire
     // (selon les règles du mode compagnon)
   }
   ```

2. **Vérifier les prompts d'abonnement** :
   - Sur Android : Ne pas afficher de prompts obligatoires d'abonnement
   - Sur iOS : Peut afficher des prompts selon le mode compagnon
   - Utiliser `useCompanionMode()` pour conditionner l'affichage

#### 5.3 Maintenir l'abonnement obligatoire sur iOS (si nécessaire)

**Objectif** : Sur iOS, maintenir la logique d'abonnement obligatoire si c'est le comportement souhaité

**Actions** :
1. **Conditionner les redirections** :
   ```typescript
   // Dans les composants d'inscription
   const { isCompanionMode } = useCompanionMode();
   const isIOS = Platform.OS === 'ios';
   
   if (isIOS && isCompanionMode) {
     // iOS mode compagnon : Peut nécessiter un abonnement externe
     // Rediriger vers le web ou afficher un message
   }
   ```

2. **Vérifier les messages d'accueil** :
   - Sur iOS : Peut afficher un message expliquant qu'un abonnement est nécessaire
   - Sur Android : Pas de message obligatoire

#### 5.4 Tests à effectuer

**Scénarios de test** :
1. ✅ **Android - Inscription sans abonnement** : 
   - S'inscrire → Accéder au dashboard → Pas de prompt d'abonnement obligatoire
   
2. ✅ **Android - Utilisation sans abonnement** :
   - Accéder aux fonctionnalités → Pas de blocage (sauf fonctionnalités premium)
   
3. ✅ **iOS - Inscription avec mode compagnon** :
   - S'inscrire → Message de redirection vers le web si nécessaire
   
4. ✅ **Android - Abonnement optionnel** :
   - L'utilisateur peut s'abonner plus tard depuis la page d'abonnement

---

## 6. MODIFICATION DE L'ONBOARDING - Carte de complétion du profil

### 🔍 Problème Identifié

Actuellement, la carte "Complétez votre profil" disparaît dès que l'étape 4 (rendez-vous) est complétée. Cependant, elle doit **rester visible jusqu'à ce que le rendez-vous soit assigné** (coach assigné).

**Comportement actuel** :
- La carte disparaît quand toutes les 4 étapes sont complétées (y compris `rendezvous`)
- Pas de distinction entre "rendez-vous créé" et "rendez-vous assigné"

**Comportement attendu** :
- La carte reste visible même après l'étape 4 (rendez-vous créé)
- Changement de couleur selon l'état :
  - **Jaune** : Étapes 1-3 complétées, rendez-vous pas encore créé
  - **Orange** : Rendez-vous créé mais pas encore assigné (statut `PENDING`)
  - **Vert** : Rendez-vous assigné (statut `ASSIGNED` ou `CONFIRMED`, ou `assignedCoach` existe)
- La carte disparaît seulement quand le rendez-vous est assigné

### 🔍 État Actuel (Mobile)

**Fichiers concernés** :
- `src/screens/dashboard/components/DashboardContent.tsx` (ligne 133-142)
- `src/screens/DashboardScreen.tsx` (ligne 307-316)
- `src/components/dashboard/ProfileCompletionCard.tsx` (ligne 18-491)

**Logique actuelle** :
```typescript
// DashboardScreen.tsx ligne 316
const isProfileComplete = dashboardData?.onboarding?.data?.isComplete || allFourStepsCompleted;

// DashboardContent.tsx ligne 133
{!isProfileComplete ? (
  <ProfileCompletionCard ... />
) : (
  <ProgressCard ... />
)}
```

**Problème** : `isProfileComplete` devient `true` dès que `rendezvous` est dans `completedSteps`, sans vérifier si le rendez-vous est assigné.

### 📝 Modifications à Apporter

#### 6.1 Modifier la logique `isProfileComplete`

**Objectif** : Ne considérer le profil comme complet que si le rendez-vous est assigné

**Actions** :
1. **Modifier `DashboardScreen.tsx`** :
   ```typescript
   // Vérifier si le rendez-vous est assigné
   const rendezvousData = dashboardData?.rendezvous || dashboardData?.rendezVous;
   const isRendezvousAssigned = rendezvousData && (
     rendezvousData.status === 'ASSIGNED' || 
     rendezvousData.status === 'CONFIRMED' ||
     !!rendezvousData.assignedCoach
   );
   
   // Le profil est complet seulement si toutes les étapes sont complétées ET le rendez-vous est assigné
   const isProfileComplete = (dashboardData?.onboarding?.data?.isComplete || allFourStepsCompleted) && isRendezvousAssigned;
   ```

2. **Récupérer les données du rendez-vous** :
   - Vérifier si `dashboardData` contient déjà `rendezvous` ou `rendezVous`
   - Sinon, faire un appel API pour récupérer le rendez-vous actuel
   - Endpoint : `/api/v1/onboarding/rendezvous/current` ou via `ProfileApi.getCurrentRendezvous()`

#### 6.2 Ajouter la logique de couleur dans ProfileCompletionCard

**Objectif** : Afficher différentes couleurs selon l'état du rendez-vous

**Actions** :
1. **Modifier `ProfileCompletionCard.tsx`** :
   - Ajouter une prop `rendezvousData` pour recevoir les données du rendez-vous
   - Créer une fonction `getCardColor()` qui retourne la couleur selon l'état :
     ```typescript
     const getCardColor = () => {
       const completedSteps = onboardingDataSafe?.data?.completedSteps || [];
       const hasRendezvous = completedSteps.includes('rendezvous');
       const rendezvousData = dashboardData?.rendezvous || dashboardData?.rendezVous;
       
       // Vert : Rendez-vous assigné
       if (rendezvousData && (
         rendezvousData.status === 'ASSIGNED' || 
         rendezvousData.status === 'CONFIRMED' ||
         !!rendezvousData.assignedCoach
       )) {
         return {
           backgroundColor: '#E8F5E9', // Vert clair
           borderColor: '#4CAF50', // Vert
           iconColor: '#4CAF50',
         };
       }
       
       // Orange : Rendez-vous créé mais pas assigné
       if (hasRendezvous && rendezvousData) {
         return {
           backgroundColor: '#FFF3E0', // Orange clair
           borderColor: '#FF9800', // Orange
           iconColor: '#FF9800',
         };
       }
       
       // Jaune : Étapes 1-3 complétées, rendez-vous pas créé
       return {
         backgroundColor: '#FFF9C4', // Jaune clair
         borderColor: '#FBC02D', // Jaune
         iconColor: '#FBC02D',
       };
     };
     ```

2. **Appliquer les couleurs au container** :
   ```typescript
   const cardColors = getCardColor();
   
   <View style={[
     styles.container,
     {
       backgroundColor: cardColors.backgroundColor,
       borderColor: cardColors.borderColor,
       borderWidth: 2,
     }
   ]}>
   ```

3. **Mettre à jour l'icône du header** :
   ```typescript
   <Ionicons 
     name="help-circle-outline" 
     size={20} 
     color={cardColors.iconColor} 
   />
   ```

#### 6.3 Passer les données du rendez-vous à ProfileCompletionCard

**Objectif** : Fournir les données nécessaires pour déterminer l'état

**Actions** :
1. **Modifier `DashboardContent.tsx`** :
   - Récupérer `rendezvousData` depuis `dashboardData` ou faire un appel API
   - Passer `rendezvousData` comme prop à `ProfileCompletionCard`

2. **Modifier `ProfileCompletionCard.tsx`** :
   - Ajouter `rendezvousData` dans les props
   - Utiliser ces données pour déterminer la couleur

#### 6.4 Gérer le cas où le rendez-vous n'est pas encore créé

**Objectif** : Afficher correctement l'état "jaune" quand le rendez-vous n'existe pas encore

**Actions** :
1. Vérifier que `rendezvousData` est `null` ou `undefined` quand le rendez-vous n'est pas créé
2. S'assurer que la couleur jaune s'affiche correctement dans ce cas

#### 6.5 Tests à effectuer

**Scénarios de test** :
1. ✅ **Étapes 1-3 complétées, rendez-vous pas créé** : Carte jaune visible
2. ✅ **Rendez-vous créé (PENDING)** : Carte orange visible
3. ✅ **Rendez-vous assigné (ASSIGNED/CONFIRMED ou assignedCoach)** : Carte verte visible
4. ✅ **Rendez-vous assigné** : Carte disparaît, remplacée par ProgressCard
5. ✅ **Rafraîchissement** : Les couleurs se mettent à jour correctement après rafraîchissement

---

## 7. RÉSUMÉ DES MODIFICATIONS

### Priorité Haute

1. ✅ **Correction MenuDuJour** : Utiliser `plan.startDate` au lieu de `subscription.startDate`
2. ✅ **Onboarding** : Modifier la carte de complétion (reste visible jusqu'à assignation rendez-vous, couleurs jaune/orange/vert)
3. ✅ **Page d'abonnement** : Ajouter le sélecteur Stripe/Mobile Money
4. ✅ **Page d'abonnement** : Intégrer le flux Stripe
5. ✅ **Page progression** : Restructurer le layout en colonnes
6. ✅ **Page progression** : Ajouter la carte T.A.S.C.C.
7. ✅ **Inscription Android** : Retirer l'abonnement obligatoire (garder sur iOS)

### Priorité Moyenne

5. ✅ **Affichage des plans** : Ajouter les badges de méthodes de paiement
6. ✅ **Page progression** : Améliorer le tableau des mesures
7. ✅ **Page progression** : Ajouter le widget de badges

### Priorité Basse

8. ✅ **Page progression** : Créer la modal de comparaison de mesures
9. ✅ **Affichage des plans** : Vérifier la cohérence des données

---

## 5. FICHIERS À CRÉER/MODIFIER

### Nouveaux fichiers à créer

1. `src/components/payment/PaymentMethodSelector.tsx` - Sélecteur de méthode de paiement
2. `src/components/payment/StripePaymentForm.tsx` - Formulaire Stripe (si SDK natif)
3. `src/components/payment/StripeWebView.tsx` - WebView Stripe (si nécessaire)
4. `src/screens/subscription/components/PaymentMethodsBadge.tsx` - Badge méthodes de paiement
5. `src/screens/progress/components/StatCard.tsx` - Carte de statistique
6. `src/screens/progress/components/TasccProgressCard.tsx` - Carte T.A.S.C.C.
7. `src/screens/progress/components/BadgesWidget.tsx` - Widget badges
8. `src/screens/progress/components/MeasurementComparisonModal.tsx` - Modal comparaison

### Fichiers à modifier

1. `src/screens/SubscriptionScreen.tsx` - Ajouter badge méthodes de paiement
2. `src/screens/subscription/components/PlanCard.tsx` - Intégrer le badge
3. `src/components/SubscriptionPaymentFlowImproved.tsx` - Ajouter sélecteur et Stripe
4. `src/screens/ProgressScreen.tsx` - Restructurer le layout
5. `src/screens/progress/hooks/useProgressScreen.ts` - Ajouter données T.A.S.C.C. si nécessaire
6. `src/screens/NutritionScreen.tsx` - Corriger calcul du jour (plan.startDate)
7. `src/screens/nutrition/utils/nutritionUtils.ts` - Corriger calcul du jour
8. `src/screens/nutrition/types/index.ts` - Ajouter champ startDate à NutritionPlan
9. `src/screens/LoginScreen.tsx` - Vérifier flux inscription Android (pas d'abonnement obligatoire)
10. `src/screens/RegisterScreen.tsx` - Vérifier flux inscription Android
11. `src/components/auth/WelcomeBottomSheet.tsx` - Conditionner prompts abonnement (Android vs iOS)
12. `src/screens/DashboardScreen.tsx` - Modifier logique isProfileComplete (vérifier assignation rendez-vous)
13. `src/screens/dashboard/components/DashboardContent.tsx` - Passer rendezvousData à ProfileCompletionCard
14. `src/components/dashboard/ProfileCompletionCard.tsx` - Ajouter logique de couleur (jaune/orange/vert) et prop rendezvousData

---

## 6. CONSIDÉRATIONS TECHNIQUES

### Ségrégation iOS/Android

- ✅ Utiliser `useCompanionMode()` pour vérifier le mode compagnon
- ✅ Masquer les options de paiement sur iOS
- ✅ Afficher le message de redirection vers le web sur iOS
- ✅ Sur Android : afficher toutes les fonctionnalités

### API Backend

- ✅ Vérifier que les endpoints nécessaires existent :
  - `/api/v1/subscriptions/plans` - Plans d'abonnement
  - `/api/v1/payments/create-stripe-checkout-session` - Session Stripe
  - `/api/v1/payments/pawapay/create-deposit` - Paiement mobile
  - `/api/v1/progress/overview` - Données progression
  - `/api/v1/profile` - Profil avec T.A.S.C.C.
  - `/api/v1/nutrition/plans` - Plans nutritionnels (doit retourner `startDate`)

### Dépendances

- ✅ Vérifier `@stripe/stripe-react-native` (si SDK natif)
- ✅ Vérifier `react-native-webview` (si WebView Stripe)
- ✅ Vérifier les autres dépendances de paiement

---

## 7. ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. **Phase 0 (URGENT)** : Correction MenuDuJour
   - Ajouter `startDate` à `NutritionPlan` interface
   - Corriger `calculateNutritionPlanDay` dans `NutritionScreen.tsx`
   - Corriger `calculateNutritionPlanDay` dans `nutritionUtils.ts`
   - Tester avec différents scénarios de dates

2. **Phase 0.3 (URGENT)** : Onboarding - Carte de complétion
   - Modifier `isProfileComplete` pour vérifier l'assignation du rendez-vous
   - Ajouter logique de couleur (jaune/orange/vert) dans `ProfileCompletionCard`
   - Passer `rendezvousData` à `ProfileCompletionCard`
   - Tester les différents états (jaune/orange/vert/disparition)

3. **Phase 0.5 (URGENT)** : Inscription Android sans abonnement
   - Vérifier le flux d'inscription actuel
   - S'assurer qu'Android permet l'inscription sans abonnement
   - Conditionner les redirections et prompts (Android vs iOS)
   - Tester sur Android et iOS

3. **Phase 1** : Page d'abonnement - Sélecteur et Stripe
   - Créer `PaymentMethodSelector.tsx`
   - Modifier `SubscriptionPaymentFlowImproved.tsx`
   - Tester sur Android

4. **Phase 2** : Page progression - Layout et T.A.S.C.C.
   - Restructurer `ProgressScreen.tsx`
   - Créer `StatCard.tsx` et `TasccProgressCard.tsx`
   - Tester l'affichage

5. **Phase 3** : Page progression - Tableau et badges
   - Améliorer le tableau des mesures
   - Créer `BadgesWidget.tsx`
   - Créer `MeasurementComparisonModal.tsx`

6. **Phase 4** : Affichage des plans - Badges
   - Créer `PaymentMethodsBadge.tsx`
   - Intégrer dans `PlanCard.tsx`
   - Tester l'affichage

---

## 8. TESTS À EFFECTUER

### Tests fonctionnels

- [ ] **Correction MenuDuJour** : Calcul du jour avec plan.startDate
- [ ] **Correction MenuDuJour** : Plan démarré aujourd'hui → Jour 1
- [ ] **Correction MenuDuJour** : Plan démarré hier → Jour 2
- [ ] **Correction MenuDuJour** : Plan cyclique (jour 9 d'un plan 7 jours) → Jour 2
- [ ] **Onboarding** : Carte jaune (étapes 1-3, rendez-vous pas créé)
- [ ] **Onboarding** : Carte orange (rendez-vous créé, pas assigné)
- [ ] **Onboarding** : Carte verte (rendez-vous assigné)
- [ ] **Onboarding** : Carte disparaît quand rendez-vous assigné
- [ ] **Inscription Android** : Inscription sans abonnement obligatoire
- [ ] **Inscription Android** : Accès au dashboard sans abonnement
- [ ] **Inscription iOS** : Comportement mode compagnon maintenu
- [ ] Sélection de méthode de paiement (Stripe vs Mobile)
- [ ] Flux de paiement Stripe complet
- [ ] Flux de paiement Mobile Money (existant)
- [ ] Affichage des plans avec badges
- [ ] Layout de progression en colonnes
- [ ] Affichage de la carte T.A.S.C.C.
- [ ] Tableau des mesures interactif
- [ ] Modal de comparaison de mesures

### Tests de ségrégation

- [ ] iOS : Plans masqués (mode compagnon)
- [ ] iOS : Pas de sélecteur de paiement
- [ ] iOS : Message de redirection vers le web
- [ ] Android : Toutes les fonctionnalités visibles
- [ ] Android : Paiement Stripe fonctionnel
- [ ] Android : Paiement Mobile Money fonctionnel

---

## 9. NOTES IMPORTANTES

1. **Respecter le mode compagnon iOS** : Ne jamais afficher d'options de paiement sur iOS
2. **Cohérence avec la version web** : S'inspirer du design et de l'UX de la version web
3. **Responsive** : Adapter le layout pour différentes tailles d'écran
4. **Accessibilité** : S'assurer que les composants sont accessibles
5. **Performance** : Optimiser les chargements d'images et les appels API

---

**Date de création** : 2025-01-XX
**Version** : 1.0
**Auteur** : Analyse automatique basée sur comparaison Web/Mobile

