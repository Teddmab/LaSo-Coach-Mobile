# 📍 Emplacements des Caches Google Sign-In sur Android

## 🎯 Problème
Android garde des caches Google Sign-In même après déconnexion, ce qui empêche l'affichage du sélecteur de comptes.

## 📂 Emplacements des Caches

### 1. **AccountManager (Système Android)**
**Emplacement** : `/data/system/users/0/accounts.db`
- **Description** : Base de données système qui stocke tous les comptes Google de l'appareil
- **Accès** : Nécessite root ou accès système
- **Impact** : C'est ici qu'Android garde la liste des comptes Google connectés
- **Nettoyage** : Impossible depuis l'app (nécessite root)

### 2. **Cache de l'Application Google Play Services**
**Emplacement** : `/data/data/com.google.android.gms/cache/`
- **Description** : Cache de Google Play Services qui gère l'authentification Google
- **Accès** : Nécessite root ou accès développeur
- **Impact** : Stocke les tokens et sessions Google
- **Nettoyage** : 
  ```
  Paramètres > Applications > Services Google Play > Stockage > Effacer le cache
  ```

### 3. **Cache de l'Application (Notre App)**
**Emplacement** : `/data/data/com.afrotouch.lasocoach/cache/`
- **Description** : Cache de notre application
- **Accès** : Accessible depuis l'app
- **Impact** : Peut stocker des données de session
- **Nettoyage** : 
  ```javascript
  // Dans l'app
  await AsyncStorage.clear(); // Nettoie AsyncStorage
  ```

### 4. **SharedPreferences (Notre App)**
**Emplacement** : `/data/data/com.afrotouch.lasocoach/shared_prefs/`
- **Description** : Préférences partagées de l'application
- **Accès** : Accessible depuis l'app
- **Impact** : Peut stocker des préférences de session
- **Nettoyage** : Via `AsyncStorage.clear()` ou `AsyncStorage.multiRemove()`

### 5. **AccountManager Cache (App Level)**
**Emplacement** : Géré par Android AccountManager API
- **Description** : Cache au niveau de l'application via AccountManager
- **Accès** : Via API Android AccountManager
- **Impact** : Stocke les comptes Google associés à l'app
- **Nettoyage** : 
  ```java
  // En natif Android (nécessite module natif)
  AccountManager accountManager = AccountManager.get(context);
  Account[] accounts = accountManager.getAccountsByType("com.google");
  for (Account account : accounts) {
    accountManager.removeAccount(account, null, null);
  }
  ```

## 🔧 Solutions pour Nettoyer les Caches

### Solution 1 : Nettoyer le Cache de l'App (Déjà Implémenté)
```typescript
// Dans firebaseAuthServiceNew.ts - logout()
await AsyncStorage.clear(); // Nettoie AsyncStorage
```

### Solution 2 : Nettoyer Google Play Services Cache (Manuel)
1. Paramètres Android
2. Applications
3. Services Google Play
4. Stockage
5. Effacer le cache

### Solution 3 : Module Natif pour AccountManager (À Implémenter)
Créer un module natif React Native qui :
- Accède à AccountManager Android
- Supprime les comptes Google associés à l'app
- Force le nettoyage du cache AccountManager

### Solution 4 : Utiliser `revokeAccess()` + `signOut()` (Déjà Implémenté)
```typescript
await GoogleSignin.revokeAccess(); // Révoque l'accès
await GoogleSignin.signOut(); // Déconnecte
```

## ⚠️ Limitations

1. **AccountManager System** : Impossible de nettoyer depuis l'app sans root
2. **Google Play Services Cache** : Nécessite accès développeur ou root
3. **Cache Système Android** : Géré par le système, pas accessible directement

## 💡 Recommandation

Le problème vient principalement du **AccountManager système Android** qui garde les comptes Google même après `signOut()`. 

**Solution recommandée** : Créer un module natif Android qui utilise `AccountManager.removeAccount()` pour supprimer les comptes Google associés à l'app lors de la déconnexion.

## 📝 Code Natif Android (Exemple)

```java
// Dans un module natif React Native
@ReactMethod
public void clearGoogleAccounts(Promise promise) {
    try {
        AccountManager accountManager = AccountManager.get(getReactApplicationContext());
        Account[] accounts = accountManager.getAccountsByType("com.google");
        
        for (Account account : accounts) {
            // Supprimer le compte de l'app (pas du système)
            accountManager.removeAccount(account, null, null);
        }
        
        promise.resolve(true);
    } catch (Exception e) {
        promise.reject("ERROR", e.getMessage());
    }
}
```

## 🎯 Conclusion

Les caches se trouvent principalement dans :
1. **AccountManager système** (`/data/system/users/0/accounts.db`) - Le plus problématique
2. **Google Play Services cache** (`/data/data/com.google.android.gms/cache/`)
3. **Cache de l'app** (`/data/data/com.afrotouch.lasocoach/cache/`)

Pour une solution complète, il faudrait un module natif qui nettoie le AccountManager, mais les déconnexions multiples que nous faisons déjà devraient aider.

