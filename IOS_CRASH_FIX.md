# 🔧 Corrections des Crashes au Démarrage iOS

## Problème
L'application se ferme immédiatement après l'ouverture lors des tests iOS.

## Causes identifiées et corrections

### 1. ✅ Permissions manquantes dans Info.plist

**Problème** : L'application utilise `expo-image-picker` et `expo-notifications` mais les permissions ne sont pas déclarées dans `Info.plist`, ce qui cause un crash au démarrage.

**Solution** : Plugin `withIOSCrashFix.js` ajoute automatiquement :
- `NSPhotoLibraryUsageDescription` - Pour accéder à la galerie photo
- `NSCameraUsageDescription` - Pour accéder à l'appareil photo
- `NSPhotoLibraryAddUsageDescription` - Pour sauvegarder des photos
- `NSUserNotificationsUsageDescription` - Pour les notifications push

### 2. ✅ Entitlements manquants

**Problème** : Les entitlements pour les notifications push et les deep links ne sont pas configurés.

**Solution** : Plugin `withIOSCrashFix.js` configure automatiquement :
- `aps-environment: production` - Pour les notifications push
- `com.apple.developer.associated-domains` - Pour les deep links

### 3. ✅ Configuration CFBundleURLTypes manquante

**Problème** : Les deep links ne sont pas configurés dans `Info.plist`.

**Solution** : Plugin `withIOSCrashFix.js` ajoute automatiquement les URL schemes :
- `lasocoach`
- `com.laso.coach`

### 4. ✅ Amélioration de la gestion d'erreurs

**Problème** : Le plugin `withFixMacOSSupport` pourrait causer des erreurs si mal configuré.

**Solution** : Ajout de gestion d'erreurs et vérifications pour éviter les crashes.

## Plugins ajoutés

### `plugins/withIOSCrashFix.js`
- Ajoute toutes les permissions nécessaires dans `Info.plist`
- Configure les entitlements pour les notifications et deep links
- Ajoute la configuration des URL schemes
- S'assure que `CFBundleIconName` et la version sont corrects

### `plugins/withFixMacOSSupport.js` (amélioré)
- Gestion d'erreurs améliorée
- Vérifications avant modification des configurations
- Ne fait pas échouer le build en cas d'erreur

## Fichiers modifiés

- ✅ `app.json` - Ajout du plugin `withIOSCrashFix.js`
- ✅ `plugins/withIOSCrashFix.js` - Nouveau plugin créé
- ✅ `plugins/withFixMacOSSupport.js` - Amélioration de la gestion d'erreurs

## Prochaines étapes

1. **Relancer un build EAS** :
   ```bash
   eas build --platform ios --profile production
   ```

2. **Vérifier les logs du prebuild** :
   - Les plugins doivent afficher des messages de succès
   - Vérifier que les permissions sont ajoutées dans `Info.plist`
   - Vérifier que les entitlements sont configurés

3. **Tester l'application** :
   - L'application ne devrait plus se fermer immédiatement
   - Les permissions devraient être demandées correctement
   - Les notifications devraient fonctionner

## Vérifications supplémentaires

Si l'application se ferme toujours, vérifier :

1. **GoogleService-Info.plist** :
   - Le fichier doit être présent dans `ios/LasoCoach/GoogleService-Info.plist`
   - Il doit être inclus dans le projet Xcode
   - Il doit être dans le target "LasoCoach"

2. **Firebase Configuration** :
   - Vérifier que les clés Firebase dans `app.json` sont correctes
   - Vérifier que le projet Firebase est bien configuré

3. **Logs de crash** :
   - Consulter les logs Xcode pour voir l'erreur exacte
   - Vérifier les logs EAS Build pour les erreurs de compilation

## Notes importantes

- Les plugins s'exécutent automatiquement pendant le prebuild
- Les modifications sont appliquées au projet Xcode généré
- Si vous modifiez manuellement `Info.plist` ou les entitlements, les plugins les écraseront lors du prochain prebuild

## Support

Si le problème persiste après ces corrections, vérifier :
1. Les logs complets du build EAS
2. Les logs Xcode lors du lancement de l'app
3. Les crash reports dans App Store Connect (si disponible)

