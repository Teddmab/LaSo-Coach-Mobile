# 📱 Event Triggers pour l'Enregistrement des Appareils

**Date** : Décembre 2025  
**Référence Backend** : Event Triggers suggérés par le backend

---

## 🎯 Vue d'ensemble

Le backend a suggéré d'appeler l'endpoint `/devices/register` dans plusieurs situations pour maintenir les informations de l'appareil à jour. Cette implémentation suit ces recommandations.

---

## ✅ Event Triggers Implémentés

### 1. After Auth Success ✅
**Quand** : Après chaque authentification réussie (login, loginWithGoogle, register)

**Où** : 
- `src/services/firebaseAuthServiceNew.js` - Après login/loginWithGoogle/register
- `src/context/FirebaseAuthContext.js` - Dans le listener Firebase auth state change

**Pourquoi** : Enregistrer l'appareil immédiatement après l'authentification

**Code** :
```javascript
// Dans firebaseAuthServiceNew.js
deviceApi.registerDevice().catch(error => {
  console.warn('⚠️ Échec enregistrement appareil (non bloquant):', error.message);
});

// Dans FirebaseAuthContext.js (listener)
if (user) {
  deviceApi.registerDevice().catch(error => {
    console.warn('⚠️ Échec enregistrement appareil après auth (non bloquant):', error.message);
  });
}
```

---

### 2. App Lifecycle (Foreground) ✅
**Quand** : Quand l'app revient au premier plan (transition background → active)

**Où** : `src/context/FirebaseAuthContext.js` - Listener AppState

**Pourquoi** : Mettre à jour `lastSeenAt` et `appVersion` quand l'utilisateur revient sur l'app

**Code** :
```javascript
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active' && state.isAuthenticated) {
      console.log('📱 App revient au premier plan - Mise à jour lastSeenAt et appVersion...');
      
      deviceApi.registerDevice().catch(error => {
        console.warn('⚠️ Échec mise à jour appareil au foreground (non bloquant):', error.message);
      });
    }
  });

  return () => {
    subscription?.remove();
  };
}, [state.isAuthenticated]);
```

**Comportement** :
- Se déclenche uniquement si l'utilisateur est authentifié
- Met à jour `lastSeenAt` et `appVersion` dans le backend
- Non bloquant : ne bloque pas l'utilisation de l'app si l'appel échoue

---

### 3. Cold Start (Optional) ✅
**Quand** : Au démarrage à froid si l'utilisateur est déjà connecté (session restaurée)

**Où** : `src/context/FirebaseAuthContext.js` - useEffect avec authReady

**Pourquoi** : S'assurer que l'appareil est enregistré même si l'utilisateur n'a pas besoin de se reconnecter

**Code** :
```javascript
useEffect(() => {
  // Attendre que l'auth soit prête et que l'utilisateur soit authentifié
  if (state.authReady && state.isAuthenticated && state.user) {
    console.log('📱 Cold start - Utilisateur déjà connecté, enregistrement appareil...');
    
    // Enregistrer l'appareil une fois au démarrage (avec un petit délai)
    const timeoutId = setTimeout(() => {
      deviceApi.registerDevice().catch(error => {
        console.warn('⚠️ Échec enregistrement appareil au cold start (non bloquant):', error.message);
      });
    }, 2000); // Délai de 2 secondes pour laisser l'app se stabiliser

    return () => {
      clearTimeout(timeoutId);
    };
  }
}, [state.authReady, state.isAuthenticated]);
```

**Comportement** :
- Se déclenche une seule fois quand `authReady` et `isAuthenticated` deviennent `true`
- Délai de 2 secondes pour éviter les appels multiples au démarrage
- Non bloquant : ne bloque pas le démarrage de l'app si l'appel échoue

---

## 📊 Résumé des Event Triggers

| Event Trigger | Quand | Fréquence | Bloquant |
|---------------|-------|-----------|----------|
| **After Auth Success** | Login/Register/Google Sign-In | À chaque authentification | ❌ Non |
| **App Lifecycle (Foreground)** | App revient au premier plan | À chaque retour au premier plan | ❌ Non |
| **Cold Start** | Démarrage avec session restaurée | Une fois au démarrage | ❌ Non |

---

## 🔄 Flux Complet

```
1. Utilisateur ouvre l'app
   ↓
2. Cold Start (si session restaurée)
   → deviceApi.registerDevice()
   ↓
3. Utilisateur se connecte
   ↓
4. After Auth Success
   → deviceApi.registerDevice()
   ↓
5. Utilisateur met l'app en arrière-plan
   ↓
6. Utilisateur revient sur l'app
   ↓
7. App Lifecycle (Foreground)
   → deviceApi.registerDevice() (met à jour lastSeenAt)
```

---

## ⚠️ Caractéristiques Importantes

### Non-Bloquant
Tous les appels à `deviceApi.registerDevice()` sont **non-bloquants** :
- Si l'appel échoue, l'app continue de fonctionner normalement
- Les erreurs sont loggées mais n'interrompent pas le flux utilisateur
- L'authentification n'est jamais bloquée par l'enregistrement de l'appareil

### Gestion des Erreurs
```javascript
deviceApi.registerDevice().catch(error => {
  console.warn('⚠️ Échec enregistrement appareil (non bloquant):', error.message);
});
```

### Optimisations
- **Délai au cold start** : 2 secondes pour éviter les appels multiples
- **Vérification d'authentification** : Les appels ne se font que si l'utilisateur est authentifié
- **Déduplication** : Le backend gère la création/mise à jour automatiquement

---

## 🧪 Tests

### Test 1 : After Auth Success
1. Se connecter avec email/password
2. Vérifier les logs : `✅ [DeviceApi] Appareil enregistré avec succès`
3. Vérifier le backend : Appareil créé/mis à jour

### Test 2 : App Lifecycle (Foreground)
1. Ouvrir l'app (authentifié)
2. Mettre l'app en arrière-plan
3. Revenir sur l'app
4. Vérifier les logs : `📱 App revient au premier plan - Mise à jour lastSeenAt et appVersion...`
5. Vérifier le backend : `lastSeenAt` mis à jour

### Test 3 : Cold Start
1. Fermer complètement l'app
2. Rouvrir l'app (session restaurée)
3. Attendre 2 secondes
4. Vérifier les logs : `📱 Cold start - Utilisateur déjà connecté, enregistrement appareil...`
5. Vérifier le backend : Appareil enregistré

---

## 📋 Checklist Backend

Le backend doit être prêt à :
- ✅ Recevoir des appels fréquents (foreground, cold start)
- ✅ Gérer la création/mise à jour automatiquement
- ✅ Mettre à jour `lastSeenAt` à chaque appel
- ✅ Mettre à jour `appVersion` si elle a changé
- ✅ Implémenter le rate limiting si nécessaire (max 10 req/min par utilisateur)

---

## 🎯 Avantages

1. **Données à jour** : `lastSeenAt` toujours à jour pour analytics
2. **Détection de versions** : `appVersion` mise à jour automatiquement
3. **Sécurité** : Détection de nouveaux appareils même sans nouvelle authentification
4. **Non-intrusif** : Aucun impact sur l'expérience utilisateur
5. **Robuste** : Gestion d'erreurs complète, ne bloque jamais l'app

---

**Dernière Mise à Jour** : Décembre 2025  
**Version** : 1.0

