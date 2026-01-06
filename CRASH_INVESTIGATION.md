# 🔍 Investigation Profonde du Crash iOS au Splash Screen

## Problème
L'application crash après ~1 seconde au splash screen, alors que le splash devrait durer 5 secondes. Le crash se produit **avant** que le JavaScript ne puisse s'exécuter complètement.

## Causes Probables (par ordre de probabilité)

### 1. 🔴 GoogleService-Info.plist Manquant dans le Bundle (PROBABILITÉ TRÈS ÉLEVÉE)

**Symptôme** : Crash immédiat au lancement (< 1 seconde)
**Cause** : Firebase SDK natif iOS cherche `GoogleService-Info.plist` au démarrage de l'app. Si le fichier n'est pas dans le bundle, l'app crash immédiatement au niveau natif, avant même que le JavaScript ne démarre.

**Vérification** :
- ✅ Le fichier est copié dans `ios/LasoCoach/GoogleService-Info.plist` (confirmé dans les logs)
- ❓ Le fichier est-il inclus dans le projet Xcode ?
- ❓ Le fichier est-il dans le target "LasoCoach" ?
- ❓ Le fichier est-il dans "Copy Bundle Resources" ?

**Solution Appliquée** :
- ✅ Plugin `withFirebaseConfig.js` amélioré pour ajouter le fichier au projet Xcode
- ✅ Le fichier est ajouté au groupe "LasoCoach" et aux ressources du target

**À Vérifier** :
1. Dans Xcode, ouvrir `ios/LasoCoach.xcworkspace`
2. Vérifier que `GoogleService-Info.plist` apparaît dans le navigateur de projet
3. Vérifier qu'il est dans le target "LasoCoach"
4. Vérifier qu'il est dans "Build Phases > Copy Bundle Resources"

### 2. 🟡 Initialisation Firebase Trop Tôt (PROBABILITÉ MOYENNE)

**Symptôme** : Crash lors de l'import de Firebase
**Cause** : Firebase est importé très tôt dans `index.ts` (ligne 104), ce qui déclenche l'initialisation native immédiatement.

**Solution Appliquée** :
- ✅ Protection avec try-catch dans `firebaseApp.ts`
- ✅ Retard de l'initialisation Auth avec plusieurs tentatives

**À Améliorer** :
- Retarder l'import de Firebase jusqu'à ce que l'app soit prête
- Utiliser un import dynamique pour Firebase

### 3. 🟡 Sentry Initialisation (PROBABILITÉ MOYENNE)

**Symptôme** : Crash lors de l'initialisation de Sentry
**Cause** : Sentry natif peut crash si mal configuré ou si le DSN est invalide.

**Vérification** :
- ✅ Sentry est initialisé avec `enableNative: true`
- ✅ Protection avec try-catch
- ❓ Le DSN Sentry est-il valide ?

**Solution** :
- ✅ Protection avec try-catch
- ✅ Vérification que le DSN n'est pas vide avant initialisation

### 4. 🟢 Permissions iOS Manquantes (PROBABILITÉ FAIBLE - CORRIGÉ)

**Symptôme** : Crash lors de l'accès à une ressource système
**Cause** : L'app essaie d'accéder à une ressource (caméra, photos, notifications) sans permission déclarée.

**Solution Appliquée** :
- ✅ Plugin `withIOSCrashFix.js` ajoute toutes les permissions nécessaires
- ✅ Toutes les permissions sont déclarées dans `Info.plist`

### 5. 🟢 Entitlements Incorrects (PROBABILITÉ FAIBLE - CORRIGÉ)

**Symptôme** : Crash lors de l'accès à des services Apple
**Cause** : Les entitlements ne correspondent pas au profil de provisioning.

**Solution Appliquée** :
- ✅ Plugin `withIOSCrashFix.js` configure les entitlements
- ✅ `aps-environment` et `associated-domains` sont configurés

## Actions Correctives Appliquées

### 1. ✅ Plugin withFirebaseConfig.js Amélioré
- Le fichier est maintenant ajouté au projet Xcode
- Le fichier est ajouté aux ressources du target "LasoCoach"
- Vérification que le fichier existe avant de l'ajouter

### 2. ✅ Protection Firebase
- Try-catch autour de l'initialisation Firebase
- Messages d'erreur détaillés pour diagnostiquer les problèmes

### 3. ✅ Protection Sentry
- Vérification que le DSN n'est pas vide
- Try-catch autour de l'initialisation

## Prochaines Étapes de Debug

### 1. Vérifier dans Xcode
1. Ouvrir `ios/LasoCoach.xcworkspace` dans Xcode
2. Vérifier que `GoogleService-Info.plist` est dans le projet
3. Vérifier qu'il est dans le target "LasoCoach"
4. Vérifier qu'il est dans "Copy Bundle Resources"

### 2. Vérifier les Logs de Crash
1. Connecter un iPhone au Mac
2. Lancer l'app depuis Xcode
3. Consulter les logs dans la console Xcode
4. Chercher les erreurs natives (pas JavaScript)

### 3. Vérifier le Bundle
1. Archiver l'app dans Xcode
2. Extraire l'IPA
3. Vérifier que `GoogleService-Info.plist` est dans le bundle
4. Vérifier que le fichier contient les bonnes valeurs

### 4. Test avec Firebase Désactivé
1. Commenter temporairement l'import Firebase dans `index.ts`
2. Vérifier si l'app démarre sans crash
3. Si oui, le problème est lié à Firebase

## Logs à Surveiller

### Logs EAS Build
- ✅ `[withFirebaseConfig] Copied GoogleService-Info.plist`
- ✅ `[withFirebaseConfig] Added GoogleService-Info.plist to Xcode project resources`
- ❌ `[Firebase] Failed to initialize app` (si présent)

### Logs Xcode Console
- Rechercher les erreurs natives (pas JavaScript)
- Rechercher les erreurs liées à Firebase
- Rechercher les erreurs liées à GoogleService-Info.plist

## Conclusion

Le problème le plus probable est que **GoogleService-Info.plist n'est pas inclus dans le bundle Xcode**, même s'il est copié dans le dossier. Le plugin amélioré devrait résoudre ce problème en ajoutant explicitement le fichier au projet Xcode.

Si le problème persiste après le prochain build, il faudra :
1. Vérifier manuellement dans Xcode que le fichier est inclus
2. Vérifier les logs de crash natifs dans Xcode
3. Tester avec Firebase désactivé pour isoler le problème

