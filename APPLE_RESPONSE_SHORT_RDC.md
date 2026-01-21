# Réponse App Store Connect - Guideline 3.1.1

---

Bonjour App Review Team,

Concernant la Guideline 3.1.1 - Business: Payments - In-App Purchase, nous souhaitons apporter les clarifications suivantes :

## **Contexte géographique et marché**

Nous sommes basés en **République Démocratique du Congo (RDC)** et notre application cible exclusivement les utilisateurs RDC. Les **In-App Purchases ne sont pas disponibles en RDC** selon l'infrastructure de paiement Apple. Nous ne sommes pas basés ailleurs et notre marché cible est uniquement la RDC.

## **Modèle d'application iOS : 100% gratuit avec accès complet**

**Point crucial :** Notre application iOS est **100% gratuite d'accès**. Un nouvel utilisateur qui télécharge l'application iOS a **accès à tout le contenu de l'application** sans aucune restriction ni paiement requis.

### **Fonctionnalités disponibles gratuitement pour tous les utilisateurs iOS :**

1. **Journal de santé personnel** - Suivi des mesures, progression, habitudes
2. **Fonctionnalités communautaires** - Partage d'achievements, support entre utilisateurs
3. **Chat avec autres utilisateurs** - Communication gratuite
4. **Gestion de profil** - Configuration complète du profil utilisateur
5. **Plans nutritionnels** - Accès complet aux plans nutritionnels
6. **Défis et challenges** - Accès à tous les défis disponibles
7. **Suivi de progression** - Analytics et statistiques complètes
8. **Agenda et contenu** - Accès à tout le contenu éditorial
9. **Badges et achievements** - Système de gamification complet
10. **Notifications** - Toutes les notifications sont gratuites

**Aucune fonctionnalité n'est verrouillée ou nécessite un paiement dans l'application iOS.**

## **Directives d'implémentation iOS - Companion Mode à 100%**

Notre application iOS fonctionne en mode "Companion" complet avec les directives suivantes :

### **1. Feature Flag Companion Mode**
- Le mode companion est activé de manière permanente pour iOS
- Détection automatique de la plateforme iOS
- Tous les flux d'achat sont désactivés sur iOS uniquement

### **2. Blocage complet des paiements**
- Service de paiement iOS retourne systématiquement "non disponible"
- Aucune méthode de paiement ne peut être initialisée sur iOS
- Toutes les tentatives de paiement sont bloquées au niveau du service

### **3. Blocage de la validation IAP**
- Validation des reçus IAP bloquée sur iOS
- Tous les appels de validation retournent une erreur "COMPANION_MODE_BLOCKED"
- Synchronisation des abonnements désactivée sur iOS

### **4. Blocage de l'interface utilisateur de paiement**
- Tous les écrans de paiement sont cachés sur iOS
- Tous les plans d'abonnement payants sont masqués
- Aucun bouton d'abonnement n'est visible
- Aucune information de prix n'est affichée
- Aucun message d'upgrade ou de promotion n'est visible
- Aucun lien vers des pages d'abonnement externe

### **5. Blocage des appels API premium**
- Tous les endpoints de subscription retournent le statut "COMPANION_MODE" sur iOS
- Aucun appel API de paiement n'est effectué depuis l'application iOS
- Les requêtes de contenu premium sont interceptées et retournent un statut companion mode

### **6. Blocage des flux de paiement**
- Le composant SubscriptionPaymentFlow est complètement désactivé sur iOS
- Toutes les méthodes de paiement (Stripe, PayPal, Mobile Money) sont cachées
- Aucun formulaire de paiement n'est accessible

### **7. Gestion des entitlements**
- Les entitlements sont gérés en mode companion sur iOS
- Tous les utilisateurs iOS ont accès complet par défaut
- Aucune vérification de subscription n'est effectuée pour bloquer l'accès

### **8. Messages neutres**
- Uniquement des messages neutres affichés si nécessaire
- Aucun call-to-action vers des paiements externes
- Messages informatifs uniquement, sans promotion

## **Résultat de l'implémentation**

**Pour les utilisateurs iOS :**
- ✅ Application 100% gratuite avec accès complet à toutes les fonctionnalités
- ✅ Aucun paiement possible dans l'application
- ✅ Aucune UI de paiement visible
- ✅ Aucun contenu verrouillé ou premium
- ✅ Expérience utilisateur complète sans restriction

**Pour les reviewers Apple :**
- ✅ Aucun écran de paiement visible lors de la navigation
- ✅ Aucun bouton d'abonnement ou de paiement
- ✅ Aucune information de prix affichée
- ✅ Accès complet à toutes les fonctionnalités sans paiement
- ✅ Aucun appel API de paiement depuis l'application

## **Question et demande de directive**

**Question :** Pourquoi notre application est-elle rejetée alors que :
1. L'application iOS est 100% gratuite avec accès complet pour tous les utilisateurs
2. Le companion mode est implémenté à 100% dans tout le code
3. Aucun paiement n'est possible dans l'application iOS
4. Aucune UI de paiement n'est visible
5. Nous sommes basés en RDC où les IAP ne sont pas disponibles

**Demande :** Pouvez-vous nous fournir une **directive claire et spécifique** pour rendre notre application 100% conforme, sachant que :
- Nous sommes en RDC (pas ailleurs) - notre localisation est vérifiable
- Les IAP ne sont pas disponibles en RDC selon l'infrastructure Apple
- L'application iOS est déjà 100% gratuite avec accès complet
- Le companion mode est déjà activé et fonctionnel dans tout le codebase
- Aucun paiement n'est traité dans l'application iOS

**Quelle est la raison spécifique du rejet ?** Nous avons implémenté toutes les mesures de conformité possibles. Si notre implémentation actuelle n'est pas conforme, nous avons besoin de directives précises sur ce qui doit être modifié.

## **Vérification pour les reviewers**

Lors du test de l'application iOS, vous constaterez :
1. **Navigation complète** - Accès à toutes les fonctionnalités sans restriction
2. **Aucun écran de paiement** - Aucun écran d'abonnement ou de paiement visible
3. **Aucun bouton d'achat** - Aucun call-to-action vers des paiements
4. **Contenu complet accessible** - Tous les plans nutritionnels, défis, et fonctionnalités sont accessibles gratuitement
5. **Messages neutres uniquement** - Aucune promotion ou incitation au paiement

## **Conclusion**

Notre application iOS est une application **100% gratuite** où tous les nouveaux utilisateurs ont **accès complet à tout le contenu** sans aucune restriction. Aucun paiement n'est possible dans l'application, aucune UI de paiement n'est visible, et le companion mode est implémenté à 100% dans tout le code.

Nous respectons pleinement les guidelines Apple et avons implémenté toutes les mesures nécessaires. Nous avons besoin de votre guidance pour comprendre pourquoi l'application est rejetée malgré cette implémentation complète.

Merci pour votre compréhension et votre guidance.

**Cordialement,**

**Eddy Lama**  
Project Manager & LasoCoach Dev Team Director  
LasoCoach Development Team

---

**Version:** 1.0.6 (Build 31)  
**Localisation:** République Démocratique du Congo (RDC)  
**Statut IAP:** Non disponible en RDC  
**Modèle iOS:** 100% gratuit avec accès complet

