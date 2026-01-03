# ✅ Checklist d'Intégration Sentry

## 📋 Ce qui est déjà configuré dans le code

- ✅ Package `@sentry/react-native` installé
- ✅ Configuration Sentry dans `src/config/sentry.ts`
- ✅ Initialisation très tôt dans `index.ts` (avant tout autre code)
- ✅ Intégration avec les gestionnaires d'erreurs globaux
- ✅ Intégration avec ErrorBoundary React
- ✅ Intégration avec AuthProvider (contexte utilisateur)
- ✅ Types TypeScript configurés

## 🔧 Ce qu'il vous reste à faire

### 1. Ajouter votre DSN dans `.env` ⚠️ OBLIGATOIRE

1. Créez ou modifiez le fichier `.env` à la racine du projet
2. Ajoutez votre DSN Sentry :

```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Remplacez** `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx` par votre vrai DSN depuis Sentry.

### 2. Redémarrer l'application

```bash
# Arrêtez le serveur Expo (Ctrl+C)
# Puis relancez
npm start
```

### 3. Vérifier que Sentry est actif

Dans les logs au démarrage, vous devriez voir :
```
✅ [Sentry] Initialisé avec succès
```

Si vous voyez un avertissement, vérifiez que :
- Le fichier `.env` existe à la racine du projet
- Le DSN est correctement écrit (sans espaces, sans guillemets)
- Vous avez redémarré le serveur après avoir ajouté le DSN

## 🧪 Tester Sentry

### Test rapide (optionnel)

Pour vérifier que Sentry fonctionne, ajoutez temporairement ce code dans `App.tsx` :

```typescript
import { captureException } from './src/config/sentry';

// Dans le useEffect de App()
useEffect(() => {
  // Test Sentry (à retirer après test)
  setTimeout(() => {
    captureException(new Error('Test Sentry - Ceci est un test'));
  }, 5000);
}, []);
```

1. Lancez l'app
2. Attendez 5 secondes
3. Allez sur Sentry → Votre projet
4. Vous devriez voir l'erreur de test apparaître

**N'oubliez pas de retirer ce code de test après !**

## 📊 Ce que Sentry va capturer automatiquement

Une fois configuré, Sentry capturera automatiquement :

- ✅ **Crashes au démarrage** (même pendant le splash screen)
- ✅ **Erreurs JavaScript** non catchées
- ✅ **Promesses rejetées** non catchées
- ✅ **Erreurs React** (via ErrorBoundary)
- ✅ **Contexte utilisateur** (ID, email, nom) quand connecté
- ✅ **Breadcrumbs** (étapes avant le crash)
- ✅ **Informations device** (modèle, OS, version app)

## 📧 Alertes Email

Vous avez déjà configuré une alerte dans Sentry qui vous enverra un email à chaque fois qu'un nouveau problème apparaît.

## 🚀 Prêt pour la production

Une fois le DSN configuré dans `.env`, Sentry est prêt pour la production !

**Important** : Le fichier `.env` est dans `.gitignore`, donc votre DSN ne sera pas commité dans Git (c'est sécurisé).

## ❓ Problèmes courants

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

