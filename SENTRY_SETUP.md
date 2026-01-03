# 🐛 Configuration Sentry pour le Monitoring d'Erreurs

## 📋 Étapes pour Configurer Sentry

### 1. Créer un Compte Sentry

1. Allez sur [https://sentry.io](https://sentry.io)
2. Cliquez sur **"Sign Up"** (gratuit)
3. Créez votre compte (email + mot de passe)
4. Confirmez votre email

### 2. Créer un Nouveau Projet

1. Une fois connecté, cliquez sur **"Create Project"**
2. Sélectionnez **"React Native"**
3. Donnez un nom à votre projet (ex: "LaSo Coach Mobile")
4. Cliquez sur **"Create Project"**

### 3. Obtenir votre DSN (Data Source Name)

1. Après la création du projet, vous verrez une page avec votre **DSN**
2. Le DSN ressemble à : `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
3. **Copiez ce DSN** (vous en aurez besoin)

### 4. Configurer le DSN dans votre Projet

1. Créez ou modifiez le fichier `.env` à la racine du projet
2. Ajoutez la ligne suivante :

```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Remplacez** `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx` par votre vrai DSN.

### 5. Vérifier la Configuration

1. Redémarrez votre serveur Expo (`npm start`)
2. Lancez l'application
3. Dans les logs, vous devriez voir : `✅ [Sentry] Initialisé avec succès`

Si vous voyez un avertissement, vérifiez que :
- Le fichier `.env` existe
- Le DSN est correctement configuré
- Le fichier `.env` est à la racine du projet

## 🎯 Comment Sentry Fonctionne

### Capture Automatique

Sentry capture automatiquement :
- ✅ **Crashes** (erreurs fatales qui font planter l'app)
- ✅ **Erreurs JavaScript** non catchées
- ✅ **Promesses rejetées** non catchées
- ✅ **Erreurs React** (boundary errors)

### Breadcrumbs (Traces)

Sentry enregistre automatiquement les "breadcrumbs" (étapes) avant un crash :
- Navigation entre écrans
- Requêtes réseau
- Actions utilisateur
- Logs console

### Informations Collectées

Pour chaque erreur, Sentry collecte :
- **Stack trace** complet
- **Device info** (modèle, OS, version)
- **App version** (1.0.4, Build 3)
- **Breadcrumbs** (étapes avant le crash)
- **Contexte** (utilisateur connecté, etc.)

## 📧 Recevoir des Alertes par Email

1. Dans Sentry, allez dans **Settings** > **Projects** > Votre projet
2. Cliquez sur **"Alerts"**
3. Cliquez sur **"Create Alert Rule"**
4. Configurez :
   - **When**: "An issue is created"
   - **Send to**: Votre email
5. Cliquez sur **"Save Rule"**

Maintenant, vous recevrez un email à chaque fois qu'un crash se produit !

## 🔍 Voir les Crashes dans Sentry

1. Connectez-vous sur [https://sentry.io](https://sentry.io)
2. Sélectionnez votre projet
3. Vous verrez la liste des erreurs/crashes
4. Cliquez sur une erreur pour voir les détails complets

## 🛠️ Utilisation Avancée

### Capturer une Erreur Manuellement

```typescript
import { captureException } from './src/config/sentry';

try {
  // Votre code
} catch (error) {
  captureException(error, {
    context: {
      screen: 'DashboardScreen',
      action: 'loadData',
    },
  });
}
```

### Ajouter du Contexte Utilisateur

```typescript
import { setUser } from './src/config/sentry';

// Quand l'utilisateur se connecte
setUser({
  id: user.uid,
  email: user.email,
  username: user.name,
});
```

### Capturer un Message Personnalisé

```typescript
import { captureMessage } from './src/config/sentry';

captureMessage('Utilisateur a cliqué sur le bouton X', 'info');
```

## 📱 Test de Sentry

Pour tester que Sentry fonctionne :

1. Ajoutez temporairement ce code dans `App.tsx` :

```typescript
import { captureException } from './src/config/sentry';

// Test Sentry (à retirer après test)
setTimeout(() => {
  captureException(new Error('Test Sentry - Ceci est un test'));
}, 5000);
```

2. Lancez l'app
3. Attendez 5 secondes
4. Allez sur Sentry, vous devriez voir l'erreur de test

## ⚠️ Important

- Le fichier `.env` est dans `.gitignore` (ne sera pas commité)
- Ne partagez jamais votre DSN publiquement
- Le plan gratuit de Sentry permet 5 000 événements/mois

## 🆘 Problèmes Courants

### Sentry ne s'initialise pas

- Vérifiez que le DSN est correct dans `.env`
- Vérifiez que le fichier `.env` est à la racine du projet
- Redémarrez le serveur Expo

### Pas de crashes dans Sentry

- Vérifiez que Sentry s'est bien initialisé (logs)
- Vérifiez votre connexion internet
- Les crashes sont envoyés en arrière-plan, parfois avec un délai

### Trop d'événements

- Ajustez `tracesSampleRate` dans `src/config/sentry.ts`
- Filtrez les erreurs dans `beforeSend` si nécessaire

