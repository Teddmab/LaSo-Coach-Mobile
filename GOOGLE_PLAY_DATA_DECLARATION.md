# 📋 Déclaration Complète des Données - Google Play Console

**Date**: Décembre 2025  
**Version de l'application**: 1.0.4  
**Objectif**: Déclarer toutes les données collectées et partagées pour le formulaire de sécurité des données de Google Play

---

## ⚠️ IMPORTANT

Google Play a détecté que votre application transmet des données utilisateur hors de l'appareil qui n'ont pas été déclarées dans le formulaire de sécurité des données. Ce document liste **TOUTES** les données que vous devez déclarer.

---

## 📊 RÉSUMÉ DES DONNÉES À DÉCLARER

### ✅ Données Collectées et Transmises Hors de l'Appareil

| Catégorie | Données | Collectées | Partagées | Stockées |
|-----------|---------|------------|-----------|----------|
| **Identifiants** | Email, Nom, ID utilisateur | ✅ | ✅ | ✅ |
| **Informations personnelles** | Taille, Poids, Objectifs, Adresse, Téléphone | ✅ | ✅ | ✅ |
| **Données de santé** | Mesures corporelles, Photos de progression | ✅ | ✅ | ✅ |
| **Informations d'appareil** | Modèle, OS, Version, Fabricant | ✅ | ✅ | ❌ |
| **Données de navigation** | Historique d'utilisation, Fonctionnalités utilisées | ✅ | ✅ | ✅ |
| **Identifiants d'appareil** | Device ID (via Firebase) | ✅ | ✅ | ❌ |
| **Informations de paiement** | Statut d'abonnement, Reçus IAP | ✅ | ✅ | ✅ |

---

## 🔍 DÉTAIL PAR CATÉGORIE

### 1. IDENTIFIANTS (Identifiers)

#### ✅ Email address
- **Collecté**: Oui (inscription/connexion)
- **Partagé**: Oui (Backend API, Firebase)
- **Stocké localement**: Oui (AsyncStorage: `admin_user_email`)
- **Transmis hors appareil**: Oui
- **SDK tiers**: Firebase Auth, Backend API

#### ✅ User ID
- **Collecté**: Oui (créé par le backend après inscription)
- **Partagé**: Oui (Backend API, Firebase)
- **Stocké localement**: Oui (AsyncStorage: `admin_user_id`)
- **Transmis hors appareil**: Oui
- **SDK tiers**: Firebase Auth, Backend API

#### ✅ Firebase ID Token
- **Collecté**: Oui (généré par Firebase après authentification)
- **Partagé**: Oui (Backend API - dans header Authorization)
- **Stocké localement**: Non (généré à la demande)
- **Transmis hors appareil**: Oui (à chaque requête API)
- **SDK tiers**: Firebase Auth

#### ✅ Device ID / Instance ID
- **Collecté**: Oui (via Firebase - pour notifications push)
- **Partagé**: Oui (Firebase Cloud Messaging)
- **Stocké localement**: Non
- **Transmis hors appareil**: Oui
- **SDK tiers**: Firebase Cloud Messaging, Expo Notifications

---

### 2. INFORMATIONS PERSONNELLES (Personal Information)

#### ✅ Nom (Name)
- **Collecté**: Oui (inscription, profil)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui (AsyncStorage: `admin_user_name`)
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Prénom et Nom de famille
- **Collecté**: Oui (profil utilisateur)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui (AsyncStorage)
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Numéro de téléphone
- **Collecté**: Oui (optionnel, profil utilisateur)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Adresse
- **Collecté**: Oui (optionnel, profil utilisateur)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Photo de profil (Avatar)
- **Collecté**: Oui (optionnel, upload par l'utilisateur)
- **Partagé**: Oui (Backend API - stocké sur S3/AWS)
- **Stocké localement**: Oui (cache local)
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API, AWS S3

---

### 3. DONNÉES DE SANTÉ (Health & Fitness)

#### ✅ Taille (Height)
- **Collecté**: Oui (onboarding, profil)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Poids (Weight)
- **Collecté**: Oui (onboarding, mesures)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Tour de taille (Waist Size)
- **Collecté**: Oui (onboarding, mesures)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Objectifs de poids (Weight Goals)
- **Collecté**: Oui (onboarding, profil)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Mesures corporelles (Body Measurements)
- **Collecté**: Oui (historique des mesures)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Photos de progression (Progress Photos)
- **Collecté**: Oui (upload par l'utilisateur)
- **Partagé**: Oui (Backend API - stocké sur S3/AWS)
- **Stocké localement**: Oui (cache local)
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API, AWS S3

#### ✅ Données de nutrition (Nutrition Data)
- **Collecté**: Oui (plans de repas, suivi nutritionnel)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

---

### 4. INFORMATIONS D'APPAREIL (Device Information)

#### ✅ Modèle d'appareil (Device Model)
- **Collecté**: Oui (automatique via `expo-device`)
- **Partagé**: Oui (Backend API - endpoint `/devices/register`)
- **Stocké localement**: Non
- **Transmis hors appareil**: Oui (après chaque authentification)
- **SDK tiers**: Expo Device, Backend API

#### ✅ Fabricant (Manufacturer)
- **Collecté**: Oui (automatique via `expo-device`)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Non
- **Transmis hors appareil**: Oui
- **SDK tiers**: Expo Device, Backend API

#### ✅ Version du système d'exploitation (OS Version)
- **Collecté**: Oui (automatique via `expo-device`)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Non
- **Transmis hors appareil**: Oui
- **SDK tiers**: Expo Device, Backend API

#### ✅ Version de l'application (App Version)
- **Collecté**: Oui (automatique via `expo-constants`)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Non
- **Transmis hors appareil**: Oui
- **SDK tiers**: Expo Constants, Backend API

#### ✅ Type d'appareil (Device Type)
- **Collecté**: Oui (PHONE, TABLET - via `expo-device`)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Non
- **Transmis hors appareil**: Oui
- **SDK tiers**: Expo Device, Backend API

#### ✅ Build ID du système (OS Build ID)
- **Collecté**: Oui (Android uniquement)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Non
- **Transmis hors appareil**: Oui
- **SDK tiers**: Expo Device, Backend API

#### ✅ Marque (Brand)
- **Collecté**: Oui (Android uniquement - ex: "samsung")
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Non
- **Transmis hors appareil**: Oui
- **SDK tiers**: Expo Device, Backend API

#### ✅ ID du modèle (Model ID)
- **Collecté**: Oui (Android uniquement)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Non
- **Transmis hors appareil**: Oui
- **SDK tiers**: Expo Device, Backend API

---

### 5. DONNÉES DE NAVIGATION ET UTILISATION (App Activity)

#### ✅ Historique d'utilisation (App Usage History)
- **Collecté**: Oui (implicite via les requêtes API)
- **Partagé**: Oui (Backend API - logs serveur)
- **Stocké localement**: Oui (cache)
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Fonctionnalités utilisées (App Interactions)
- **Collecté**: Oui (implicite via les requêtes API)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Messages de chat (Chat Messages)
- **Collecté**: Oui (messages envoyés par l'utilisateur)
- **Partagé**: Oui (Backend API via WebSocket/Socket.io)
- **Stocké localement**: Oui (cache local)
- **Transmis hors appareil**: Oui (temps réel)
- **SDK tiers**: Socket.io Client, Backend API

#### ✅ Posts communautaires (Community Posts)
- **Collecté**: Oui (posts créés par l'utilisateur)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

---

### 6. INFORMATIONS DE PAIEMENT (Financial Information)

#### ✅ Statut d'abonnement (Subscription Status)
- **Collecté**: Oui (vérifié via Google Play Billing)
- **Partagé**: Oui (Backend API, Google Play)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Google Play Billing (`react-native-iap`), Backend API

#### ✅ Reçus d'achat (Purchase Receipts)
- **Collecté**: Oui (via Google Play Billing)
- **Partagé**: Oui (Backend API pour validation)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Google Play Billing, Backend API

#### ✅ Identifiants de produits (Product IDs)
- **Collecté**: Oui (identifiants des abonnements)
- **Partagé**: Oui (Backend API, Google Play)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Google Play Billing, Backend API

---

### 7. AUTRES DONNÉES

#### ✅ Données de profil complémentaires
- **Collecté**: Oui (région, langue, profession, etc.)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Backend API

#### ✅ Notifications push (Push Notification Tokens)
- **Collecté**: Oui (via Expo Notifications + Firebase)
- **Partagé**: Oui (Firebase Cloud Messaging, Backend API)
- **Stocké localement**: Oui
- **Transmis hors appareil**: Oui
- **SDK tiers**: Expo Notifications, Firebase Cloud Messaging

#### ✅ Données de session (Session Data)
- **Collecté**: Oui (tokens d'authentification)
- **Partagé**: Oui (Backend API)
- **Stocké localement**: Oui (AsyncStorage: `admin_token`)
- **Transmis hors appareil**: Oui (dans chaque requête)
- **SDK tiers**: Backend API

---

## 🔗 SERVICES TIERS ET SDK

### Firebase (Google)
- **Données collectées**: Email, ID utilisateur, ID token, Device ID, Push tokens
- **Données partagées**: Toutes les données d'authentification
- **Usage**: Authentification, Cloud Messaging, Analytics (implicite)
- **Déclaration requise**: ✅ Oui

### Backend API (laso-coach-backend.onrender.com)
- **Données collectées**: Toutes les données utilisateur
- **Données partagées**: Toutes les données utilisateur
- **Usage**: Stockage et traitement des données
- **Déclaration requise**: ✅ Oui

### Google Play Billing
- **Données collectées**: Statut d'abonnement, reçus d'achat
- **Données partagées**: Reçus d'achat (pour validation backend)
- **Usage**: Gestion des abonnements
- **Déclaration requise**: ✅ Oui

### Stripe
- **Données collectées**: Informations de paiement (si utilisé pour web)
- **Données partagées**: Informations de paiement
- **Usage**: Traitement des paiements (si applicable)
- **Déclaration requise**: ⚠️ Vérifier si utilisé sur mobile

### Socket.io (WebSocket)
- **Données collectées**: Messages de chat en temps réel
- **Données partagées**: Messages de chat
- **Usage**: Communication temps réel
- **Déclaration requise**: ✅ Oui

### AWS S3 (via Backend)
- **Données collectées**: Photos de profil, photos de progression
- **Données partagées**: Images uploadées
- **Usage**: Stockage de fichiers
- **Déclaration requise**: ✅ Oui (indirectement via Backend)

---

## 📝 CHECKLIST POUR LE FORMULAIRE GOOGLE PLAY

### Section 1: Types de données collectées

Cochez **TOUS** ces éléments dans le formulaire:

#### Identifiants
- [x] **Email address** - Collecté, Partagé, Stocké
- [x] **User ID** - Collecté, Partagé, Stocké
- [x] **Device or other IDs** - Collecté, Partagé (Device ID via Firebase)

#### Informations personnelles
- [x] **Name** - Collecté, Partagé, Stocké
- [x] **Phone number** - Collecté, Partagé, Stocké (optionnel)
- [x] **User IDs** - Collecté, Partagé, Stocké
- [x] **Address** - Collecté, Partagé, Stocké (optionnel)
- [x] **Photos or videos** - Collecté, Partagé, Stocké (photos de profil et progression)

#### Données de santé et fitness
- [x] **Health information** - Collecté, Partagé, Stocké
  - Taille, Poids, Tour de taille
  - Objectifs de poids
  - Mesures corporelles
  - Photos de progression

#### Informations d'appareil
- [x] **Device or other IDs** - Collecté, Partagé
- [x] **App information** - Collecté, Partagé (version app)
- [x] **Device information** - Collecté, Partagé
  - Modèle, Fabricant, OS Version, Build ID, Type d'appareil

#### Données de navigation et utilisation
- [x] **App activity** - Collecté, Partagé, Stocké
  - Historique d'utilisation
  - Fonctionnalités utilisées
  - Messages de chat
  - Posts communautaires

#### Informations financières
- [x] **Purchase history** - Collecté, Partagé, Stocké
  - Statut d'abonnement
  - Reçus d'achat

---

### Section 2: Partage des données

Pour **chaque type de données**, indiquez:

#### Avec qui les données sont partagées:
- [x] **Service providers** (Fournisseurs de services)
  - Backend API (laso-coach-backend.onrender.com)
  - Firebase (Google)
  - AWS S3 (via Backend)
  - Socket.io (via Backend)

#### Pourquoi les données sont partagées:
- [x] **App functionality** (Fonctionnalités de l'app)
- [x] **Analytics** (Analyses)
- [x] **Developer communications** (Communications développeur)
- [x] **Fraud prevention, security, and compliance** (Prévention fraude, sécurité, conformité)
- [x] **Personalization** (Personnalisation)

---

### Section 3: Sécurité des données

#### Chiffrement en transit
- [x] **Oui** - Toutes les communications utilisent HTTPS/TLS

#### Suppression des données
- [x] **Oui** - Les utilisateurs peuvent demander la suppression via le support

---

## 🎯 INSTRUCTIONS POUR REMPLIR LE FORMULAIRE

### Étape 1: Accéder au formulaire
1. Allez sur [Google Play Console](https://play.google.com/console)
2. Sélectionnez votre application **LasoCoach**
3. Allez dans **Politique et programmes** > **Sécurité des données**
4. Cliquez sur **Commencer** ou **Modifier**

### Étape 2: Déclarer les types de données

Pour **chaque type de données** listé ci-dessus:

1. **Cochez** le type de données
2. **Sélectionnez**:
   - ✅ Collecté
   - ✅ Partagé (si applicable)
   - ✅ Stocké (si applicable)
3. **Indiquez** le but:
   - App functionality
   - Analytics
   - Personalization
   - Developer communications
   - Fraud prevention

### Étape 3: Déclarer les services tiers

Pour **chaque SDK tiers**:

1. **Firebase (Google)**
   - Type: Service provider
   - Données: Email, User ID, Device ID, Push tokens
   - Usage: Authentication, Cloud Messaging

2. **Backend API**
   - Type: Service provider
   - Données: Toutes les données utilisateur
   - Usage: App functionality, Data storage

3. **Google Play Billing**
   - Type: Service provider
   - Données: Purchase history, Subscription status
   - Usage: App functionality

4. **Socket.io**
   - Type: Service provider
   - Données: Chat messages
   - Usage: App functionality

### Étape 4: Vérifier et soumettre

1. **Relisez** toutes les déclarations
2. **Vérifiez** que toutes les données transmises hors appareil sont déclarées
3. **Soumettez** le formulaire

---

## ⚠️ POINTS CRITIQUES À NE PAS OUBLIER

### ❌ Erreurs courantes à éviter:

1. **Ne pas déclarer les informations d'appareil**
   - ✅ **À déclarer**: Modèle, Fabricant, OS Version, Build ID
   - Ces données sont automatiquement collectées et envoyées au backend

2. **Ne pas déclarer les Device IDs**
   - ✅ **À déclarer**: Device ID via Firebase (pour notifications push)

3. **Ne pas déclarer les données de santé**
   - ✅ **À déclarer**: Toutes les mesures corporelles, poids, taille, photos de progression

4. **Ne pas déclarer les données de chat**
   - ✅ **À déclarer**: Messages de chat transmis via WebSocket

5. **Ne pas déclarer les données de navigation**
   - ✅ **À déclarer**: Historique d'utilisation, fonctionnalités utilisées

---

## 📚 RESSOURCES

- [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play SDK Index](https://play.google.com/console/sdks)
- [Firebase Data Safety](https://firebase.google.com/support/privacy)

---

## ✅ VÉRIFICATION FINALE

Avant de soumettre, vérifiez que vous avez déclaré:

- [x] Toutes les données personnelles (email, nom, téléphone, adresse)
- [x] Toutes les données de santé (poids, taille, mesures, photos)
- [x] Toutes les informations d'appareil (modèle, OS, version)
- [x] Tous les identifiants (User ID, Device ID, Firebase tokens)
- [x] Toutes les données de navigation (chat, posts, utilisation)
- [x] Toutes les données financières (abonnements, reçus)
- [x] Tous les services tiers (Firebase, Backend, Google Play Billing, Socket.io)

---

**Une fois le formulaire complété et soumis, Google Play vérifiera automatiquement que vos déclarations correspondent aux données réellement collectées par votre application.**

