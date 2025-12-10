# 📖 Explication de la Logique `useGoogleAuth`

## 🎯 Objectif Principal

Le hook `useGoogleAuth` gère l'authentification Google **native** (pas de WebView) en forçant l'affichage du **sélecteur de comptes** à chaque connexion, même si un compte a été utilisé précédemment.

---

## 🏗️ Structure du Hook

### 1. **Configuration Initiale** (lignes 32-76)

```typescript
useEffect(() => {
  const configureGoogleSignIn = async () => {
    // Configure le SDK Google Sign-In une seule fois au montage
    GoogleSignin.configure({
      webClientId: firebaseOAuthClientIds.web,
      offlineAccess: true,        // CRITIQUE: Pour obtenir l'idToken
      forceCodeForRefreshToken: true,
      scopes: ['email', 'profile'],
      hostedDomain: undefined,    // Ne restreint pas à un domaine spécifique
    });
    setIsConfigured(true);
  };
  configureGoogleSignIn();
}, []);
```

**Rôle** : Configure le SDK Google Sign-In au démarrage de l'app.

**Points clés** :
- `offlineAccess: true` → **OBLIGATOIRE** pour obtenir l'idToken Firebase
- `hostedDomain: undefined` → Permet tous les comptes Google (pas de restriction)
- Configuration effectuée **une seule fois** au montage du composant

---

### 2. **Fonction `forceBrutalSignOut()`** (lignes 82-191)

**Rôle** : Déconnexion **ultra-agressive** en 3 cycles pour nettoyer complètement le cache Google.

**Processus** :

```
CYCLE 1:
  → Reconfigurer le SDK
  → getCurrentUser() → Si compte trouvé → revokeAccess()
  → signOut()
  → Attendre 300ms

CYCLE 2:
  → Reconfigurer le SDK
  → getCurrentUser() → Si compte trouvé → revokeAccess()
  → signOut()
  → Attendre 400ms

CYCLE 3:
  → Reconfigurer le SDK
  → signOut() (dernière tentative)
  → Attendre 500ms
  → Reconfiguration finale
```

**Pourquoi 3 cycles ?**
- Android garde souvent le compte en cache même après un `signOut()`
- Plusieurs cycles augmentent les chances de nettoyer complètement le cache
- Les délais permettent à Android de traiter chaque déconnexion

---

### 3. **Fonction `signInWithGoogle()`** (lignes 197-724)

C'est la fonction **principale** qui gère toute la logique de connexion. Elle est divisée en plusieurs phases :

---

## 📋 Phases de `signInWithGoogle()`

### **PHASE 1 : Vérifications Préliminaires** (lignes 198-217)

```typescript
// 1. Vérifier que le SDK est configuré
if (!isConfigured) {
  return { user: null, error: 'Configuration en cours...' };
}

// 2. Vérifier Google Play Services (Android uniquement)
if (Platform.OS === 'android') {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
}
```

**Rôle** : S'assurer que tout est prêt avant de commencer.

---

### **PHASE 2 : Déconnexion Brutale Initiale** (ligne 223)

```typescript
await forceBrutalSignOut();
```

**Rôle** : Nettoyer complètement le cache Google avant de commencer la connexion.

**Pourquoi ?** : Même si l'utilisateur s'est déconnecté, Android peut garder le compte en cache. Cette déconnexion brutale force le nettoyage.

---

### **PHASE 3 : Boucle de Déconnexion Agressive** (lignes 236-405)

**Objectif** : Détecter et supprimer les **comptes silencieux** (comptes détectés par `signInSilently()` mais pas vraiment connectés).

**Processus** :

```typescript
let maxSilentAttempts = 5;  // Maximum 5 tentatives
let silentAttemptCount = 0;

while (silentAttemptCount < maxSilentAttempts) {
  // 1. Vérifier getCurrentUser()
  const currentUser = await GoogleSignin.getCurrentUser();
  
  // 2. Vérifier signInSilently()
  const silentUser = await GoogleSignin.signInSilently();
  
  // 3. Si un compte est détecté :
  if (silentUser) {
    // Vérifier si c'est un "compte fantôme" (sans email/idToken)
    const isPhantom = !userEmail && !hasIdToken;
    
    // Déconnexion ULTRA-BRUTALE :
    await GoogleSignin.signOut();
    await GoogleSignin.revokeAccess();
    
    // Si compte fantôme : double déconnexion supplémentaire
    if (isPhantom) {
      await GoogleSignin.signOut();
      await GoogleSignin.signOut(); // Double pour forcer le cache
    }
    
    // Reconfigurer le SDK
    GoogleSignin.configure({...});
  } else {
    // Pas de compte silencieux → SUCCÈS, sortir de la boucle
    break;
  }
}
```

**Points clés** :
- **Compte fantôme** : Compte détecté par `signInSilently()` mais sans email/idToken (cache Android)
- **Double déconnexion** : Pour les comptes fantômes, on fait une double déconnexion supplémentaire
- **Maximum 5 tentatives** : Pour éviter une boucle infinie si Android garde toujours le cache

**Pourquoi cette boucle ?**
- Android peut garder un compte en cache même après plusieurs `signOut()`
- `signInSilently()` peut retourner ce compte "fantôme"
- Si on ne le supprime pas, `signIn()` peut automatiquement le réutiliser au lieu d'afficher le sélecteur

---

### **PHASE 4 : Vérification Finale Ultra-Agressive** (lignes 407-522)

**Objectif** : Dernière vérification **juste avant** `signIn()` pour être absolument sûr qu'il n'y a plus de compte.

**Processus** :

```typescript
let maxFinalAttempts = 3;
let finalCheckAttempts = 0;

while (finalCheckAttempts < maxFinalAttempts) {
  // 1. Vérifier getCurrentUser()
  const currentUser = await GoogleSignin.getCurrentUser();
  
  // 2. Vérifier signInSilently()
  const silentUser = await GoogleSignin.signInSilently();
  
  // 3. Si un compte est détecté :
  if (hasAccount) {
    // Déconnexion ULTRA-BRUTALE
    await GoogleSignin.signOut();
    await GoogleSignin.revokeAccess();
    // Reconfigurer le SDK
    GoogleSignin.configure({...});
  } else {
    // Aucun compte → SUCCÈS, sortir
    break;
  }
}
```

**Différence avec la Phase 3** :
- Phase 3 : Boucle jusqu'à 5 tentatives, avec gestion spéciale des comptes fantômes
- Phase 4 : Dernière vérification rapide (max 3 tentatives) juste avant `signIn()`

---

### **PHASE 5 : Déconnexion Immédiate Avant `signIn()`** (lignes 527-552)

**Objectif** : Dernière déconnexion **immédiate** juste avant d'appeler `signIn()` pour maximiser les chances d'afficher le sélecteur.

```typescript
// Déconnexion immédiate (double pour être sûr)
await GoogleSignin.signOut();
await new Promise(resolve => setTimeout(resolve, 100));
await GoogleSignin.signOut(); // Double

// Reconfigurer le SDK avec une config "fraîche"
GoogleSignin.configure({...});

// Attendre 150ms pour que la config soit prise en compte
await new Promise(resolve => setTimeout(resolve, 150));
```

**Pourquoi cette déconnexion immédiate ?**
- Même après toutes les phases précédentes, Android peut encore avoir une session active
- Une déconnexion **juste avant** `signIn()` maximise les chances d'afficher le sélecteur
- La double déconnexion force le nettoyage du cache

---

### **PHASE 6 : Appel `signIn()` et Récupération de l'idToken** (lignes 554-657)

**Objectif** : Ouvrir l'UI native Google et récupérer l'idToken.

```typescript
// Ouvrir l'UI native Google
const userInfo = await GoogleSignin.signIn();

// Récupérer l'idToken
let idToken = userInfo?.idToken || null;

// Si idToken absent, utiliser getTokens()
if (!idToken) {
  const tokens = await GoogleSignin.getTokens();
  idToken = tokens?.idToken || null;
}

// Vérifier que l'idToken existe
if (!idToken) {
  // Erreur ou annulation
  return { user: null, error: ... };
}

// Appeler Firebase avec l'idToken
result = await googleAuthFunction(idToken);
```

**Points clés** :
- `signIn()` ouvre l'UI native Google (sélecteur de comptes)
- Si l'utilisateur annule, `userInfo` peut être `null` ou ne pas avoir d'idToken
- On essaie d'abord `userInfo.idToken`, puis `getTokens()` si nécessaire
- Si pas d'idToken après toutes les tentatives → Erreur ou annulation

---

### **PHASE 7 : Gestion des Erreurs** (lignes 661-716)

**Objectif** : Gérer tous les types d'erreurs possibles.

**Types d'erreurs gérées** :

1. **Annulation utilisateur** :
   ```typescript
   if (error.code === statusCodes.SIGN_IN_CANCELLED) {
     return { user: null, error: null }; // Pas d'erreur pour annulation
   }
   ```

2. **Connexion déjà en cours** :
   ```typescript
   if (error.code === statusCodes.IN_PROGRESS) {
     userMessage = 'Une connexion est déjà en cours.';
   }
   ```

3. **Google Play Services indisponible** :
   ```typescript
   if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
     userMessage = 'Google Play Services n\'est pas disponible.';
   }
   ```

4. **Erreur DEVELOPER_ERROR (code 10)** :
   ```typescript
   if (error.code === 10 || error.message?.includes('DEVELOPER_ERROR')) {
     userMessage = 'Erreur de configuration SHA-1/SHA-256.';
   }
   ```

5. **Erreurs réseau/timeout** :
   ```typescript
   if (error.message?.includes('network')) {
     userMessage = 'Erreur de connexion.';
   }
   ```

---

## 🔄 Flux Complet Résumé

```
1. Configuration SDK (au montage)
   ↓
2. Utilisateur clique sur "Continuer avec Google"
   ↓
3. Vérifications préliminaires (SDK configuré ? Play Services ?)
   ↓
4. Déconnexion brutale initiale (3 cycles)
   ↓
5. Boucle de déconnexion agressive (max 5 tentatives)
   → Détecte comptes silencieux/fantômes
   → Déconnexion ultra-brutale
   → Double déconnexion pour comptes fantômes
   ↓
6. Vérification finale ultra-agressive (max 3 tentatives)
   → Dernière vérification avant signIn()
   ↓
7. Déconnexion immédiate (double) juste avant signIn()
   ↓
8. Appel signIn() → UI native Google s'affiche
   ↓
9. Récupération idToken (userInfo.idToken ou getTokens())
   ↓
10. Appel Firebase (loginWithGoogle ou registerWithGoogle)
   ↓
11. Retour du résultat (user ou error)
```

---

## 🎯 Pourquoi Toute Cette Complexité ?

### Problème Principal
**Android garde le compte Google en cache** même après déconnexion, ce qui empêche l'affichage du sélecteur de comptes.

### Solution
**Déconnexion ultra-agressive en plusieurs phases** pour forcer le nettoyage complet du cache avant chaque connexion.

### Phases de Déconnexion
1. **Déconnexion brutale initiale** : Nettoie le cache de base
2. **Boucle agressive** : Détecte et supprime les comptes silencieux/fantômes
3. **Vérification finale** : Dernière vérification avant signIn()
4. **Déconnexion immédiate** : Dernière déconnexion juste avant signIn()

**Résultat** : Maximise les chances d'afficher le sélecteur de comptes à chaque connexion.

---

## 🔍 Points Techniques Importants

### 1. **Compte Fantôme**
- Détecté par `signInSilently()` mais **sans email/idToken**
- C'est un cache Android qui n'a pas de données réelles
- **MAIS** Android peut quand même l'utiliser pour `signIn()` automatiquement
- **Solution** : Double déconnexion supplémentaire pour forcer le nettoyage

### 2. **SIGN_IN_REQUIRED**
- Erreur normale après `signOut()`
- On l'ignore car c'est le comportement attendu
- Ne pas traiter comme une erreur fatale

### 3. **Délais (setTimeout)**
- Permettent à Android de traiter chaque déconnexion
- Délais progressifs : 100ms → 300ms → 400ms → 500ms
- Donnent le temps au système de nettoyer le cache

### 4. **Reconfiguration du SDK**
- Après chaque déconnexion, on reconfigure le SDK
- Cela "rafraîchit" l'état du SDK
- Peut aider à forcer le nettoyage du cache

---

## 📊 Statistiques de Déconnexion

| Phase | Nombre de Tentatives | Délais | Objectif |
|-------|---------------------|--------|----------|
| **Déconnexion brutale** | 3 cycles | 300ms, 400ms, 500ms | Nettoyer le cache de base |
| **Boucle agressive** | Max 5 tentatives | 300ms, 400ms | Supprimer comptes silencieux/fantômes |
| **Vérification finale** | Max 3 tentatives | 300ms, 500ms | Dernière vérification avant signIn() |
| **Déconnexion immédiate** | 2 (double) | 100ms, 150ms | Dernière déconnexion juste avant signIn() |

**Total** : Jusqu'à **13 déconnexions** possibles avant un seul `signIn()` !

---

## ✅ Résultat Attendu

Après toutes ces phases de déconnexion, `signIn()` devrait :
1. **Afficher le sélecteur de comptes** avec tous les comptes disponibles
2. **Ne pas auto-sélectionner** le dernier compte utilisé
3. **Permettre à l'utilisateur** de choisir n'importe quel compte

---

## 🐛 Cas Limites Gérés

1. **Compte fantôme persistant** : Après 5 tentatives, on continue quand même (signOut() a été fait)
2. **signInSilently() retourne toujours le compte** : On sort de la boucle après 5 tentatives
3. **Annulation utilisateur** : Pas d'erreur affichée (choix de l'utilisateur)
4. **idToken absent** : Vérification et gestion d'erreur appropriée
5. **Erreurs réseau/timeout** : Messages d'erreur clairs pour l'utilisateur

---

## 💡 Pourquoi C'est Si Complexe ?

**Réponse courte** : Android garde le cache Google au niveau système, et le SDK React Native ne permet pas de forcer directement l'affichage du sélecteur.

**Solution** : Déconnexion ultra-agressive en plusieurs phases pour maximiser les chances de nettoyer le cache avant chaque connexion.

**Résultat** : Le sélecteur devrait s'afficher dans la plupart des cas, même si Android garde parfois le cache.

