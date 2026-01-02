# 🐛 Debug Crash au Démarrage iOS

## Problème
L'application se lance, affiche le fond vert avec le logo, puis se ferme brusquement (crash).

## Causes Possibles

### 1. 🔥 Firebase Configuration Manquante
**Symptôme** : Crash immédiat après le splash screen
**Cause** : `GoogleService-Info.plist` manquant ou incorrect
**Solution** :
- Vérifier que `ios/LasoCoach/GoogleService-Info.plist` existe
- Vérifier qu'il est inclus dans le projet Xcode
- Vérifier que les clés Firebase dans `app.json` sont correctes

### 2. ⚠️ Erreur JavaScript Non Catchée
**Symptôme** : Crash silencieux sans message d'erreur
**Cause** : Erreur dans le code JavaScript qui n'est pas catchée
**Solution** :
- Vérifier les logs Xcode pour voir l'erreur exacte
- Vérifier que tous les imports sont corrects
- Vérifier que les modules sont bien installés

### 3. 🔐 Problème avec les Providers
**Symptôme** : Crash après le splash screen, pendant l'initialisation
**Cause** : Erreur dans AuthProvider, NotificationProvider, ou ChatProvider
**Solution** :
- Vérifier que Firebase est correctement initialisé
- Vérifier que les contextes sont bien configurés
- Ajouter des try-catch dans les providers

### 4. 🎨 Problème avec le Splash Screen
**Symptôme** : Crash pendant l'affichage du splash
**Cause** : Erreur dans le composant SplashScreen
**Solution** :
- Vérifier que l'image du splash existe
- Vérifier que les styles sont corrects
- Simplifier le splash screen temporairement

### 5. 📦 Module Manquant
**Symptôme** : Crash avec erreur "Unable to resolve module"
**Cause** : Module non installé ou chemin incorrect
**Solution** :
- Vérifier `package.json` et réinstaller les dépendances
- Vérifier que tous les modules sont bien installés
- Vérifier les imports dans le code

## 🔍 Étapes de Debug

### Étape 1: Vérifier les Logs Xcode

1. Connecter l'iPhone à votre Mac
2. Ouvrir Xcode
3. Window > Devices and Simulators
4. Sélectionner votre iPhone
5. Cliquer sur "Open Console"
6. Filtrer par "LasoCoach" ou "Error"
7. Lancer l'application et observer les logs

### Étape 2: Vérifier les Logs EAS Build

Dans les logs du build EAS, chercher :
- Erreurs de compilation
- Warnings sur les modules
- Erreurs de configuration

### Étape 3: Vérifier la Configuration

#### Vérifier GoogleService-Info.plist
```bash
ls -la ios/LasoCoach/GoogleService-Info.plist
```

#### Vérifier les permissions dans Info.plist
Les permissions doivent être présentes (ajoutées par le plugin `withIOSCrashFix`)

#### Vérifier les imports dans index.ts et App.tsx
Tous les imports doivent être valides

### Étape 4: Test avec Build de Développement

Créer un build de développement pour avoir plus de logs :
```bash
eas build --platform ios --profile development
```

## 🔧 Corrections Appliquées

### Plugin withIOSCrashFix
- ✅ Ajoute toutes les permissions nécessaires
- ✅ Configure les entitlements
- ✅ Ajoute UIViewControllerBasedStatusBarAppearance
- ✅ Ajoute NSAppTransportSecurity

### Plugin withFixMacOSSupport (amélioré)
- ✅ Exclut macOS des architectures
- ✅ Vérifie le Podfile
- ✅ Configure EXCLUDED_ARCHS

## 📝 Checklist de Vérification

Avant de relancer un build, vérifier :

- [ ] `GoogleService-Info.plist` existe dans `ios/LasoCoach/`
- [ ] Les permissions sont dans `Info.plist` (vérifié par le plugin)
- [ ] Tous les modules sont installés (`npm install`)
- [ ] Les imports dans `index.ts` et `App.tsx` sont corrects
- [ ] Firebase est correctement configuré dans `app.json`
- [ ] Le splash screen ne cause pas d'erreur

## 🚀 Prochaines Étapes

1. **Relancer un build** avec les plugins améliorés
2. **Vérifier les logs Xcode** pour identifier l'erreur exacte
3. **Tester avec un build de développement** pour avoir plus de logs
4. **Simplifier temporairement** le code pour isoler le problème

## 📞 Si le Problème Persiste

Si l'application crash toujours après ces corrections :

1. **Partager les logs Xcode complets** (filtre par "Error" ou "FATAL")
2. **Partager les logs EAS Build** de la section "Prebuild" et "Build"
3. **Vérifier si c'est spécifique à un iPhone** ou tous les appareils
4. **Tester avec un iPhone différent** pour isoler le problème

