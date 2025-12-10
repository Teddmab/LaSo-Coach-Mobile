# Guide : Tester l'APK sur un appareil physique et capturer les erreurs

## 📱 Étape 1 : Connecter l'appareil

### 1.1 Activer le mode développeur sur l'appareil
1. Aller dans **Paramètres** > **À propos du téléphone**
2. Appuyer 7 fois sur **Numéro de build**
3. Vous verrez "Vous êtes maintenant développeur !"

### 1.2 Activer le débogage USB
1. Aller dans **Paramètres** > **Options développeur**
2. Activer **Débogage USB**
3. Activer **Restez éveillé** (optionnel)

### 1.3 Connecter l'appareil
1. Connecter l'appareil au PC via USB
2. Sur l'appareil, autoriser le débogage USB quand demandé
3. Cocher "Toujours autoriser depuis cet ordinateur"

### 1.4 Vérifier la connexion
```bash
adb devices
```

Vous devriez voir votre appareil listé :
```
List of devices attached
ABC123XYZ    device
```

---

## 📦 Étape 2 : Installer l'APK

### Option A : Installation directe (si APK local)
```bash
# Installer l'APK
adb install -r chemin/vers/votre-app.apk

# Ou si l'APK est dans le projet
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B : Installation depuis un APK téléchargé
```bash
# Si vous avez téléchargé l'APK depuis EAS
adb install -r ~/Downloads/laso-coach-app.apk
```

**Note :** Le flag `-r` permet de réinstaller si l'app existe déjà.

---

## 🔍 Étape 3 : Capturer les logs et erreurs

### 3.1 Voir tous les logs en temps réel
```bash
# Voir tous les logs Android
adb logcat

# Voir uniquement les logs de votre app (recommandé)
adb logcat | grep -i "laso\|react\|expo"
```

### 3.2 Filtrer par niveau de log
```bash
# Voir uniquement les erreurs (ERROR)
adb logcat *:E

# Voir les erreurs et warnings (ERROR, WARN)
adb logcat *:W

# Voir les erreurs, warnings et infos (ERROR, WARN, INFO)
adb logcat *:I
```

### 3.3 Filtrer par tag (plus précis)
```bash
# Logs React Native
adb logcat | grep -i "ReactNativeJS"

# Logs Expo
adb logcat | grep -i "Expo"

# Logs Google Sign-In
adb logcat | grep -i "GoogleSignIn\|Google"

# Logs Firebase
adb logcat | grep -i "Firebase"

# Logs de votre app spécifiquement
adb logcat | grep -i "LaSo\|laso"
```

### 3.4 Sauvegarder les logs dans un fichier
```bash
# Sauvegarder tous les logs
adb logcat > logs-complets.txt

# Sauvegarder uniquement les erreurs
adb logcat *:E > logs-erreurs.txt

# Sauvegarder avec timestamp
adb logcat -v time > logs-avec-timestamp.txt

# Combiner plusieurs filtres
adb logcat -v time *:E *:W | grep -i "laso\|react\|expo" > logs-filtres.txt
```

### 3.5 Effacer les logs avant de tester
```bash
# Effacer tous les logs avant de lancer un nouveau test
adb logcat -c

# Puis lancer votre app et capturer les nouveaux logs
adb logcat -v time > logs-test-$(date +%Y%m%d-%H%M%S).txt
```

---

## 🚀 Étape 4 : Lancer l'app et tester

### 4.1 Lancer l'app depuis la ligne de commande
```bash
# Trouver le nom du package (généralement dans app.json ou AndroidManifest.xml)
# Exemple : com.laso.coach

# Lancer l'app
adb shell am start -n com.laso.coach/.MainActivity

# Ou si vous connaissez le nom exact
adb shell monkey -p com.laso.coach -c android.intent.category.LAUNCHER 1
```

### 4.2 Capturer les logs pendant le test
```bash
# Dans un terminal, lancer la capture de logs
adb logcat -v time *:E *:W | grep -i "laso\|react\|expo\|google" > test-google-auth.log

# Dans un autre terminal ou sur l'appareil, tester la connexion Google
# Les logs seront sauvegardés dans test-google-auth.log
```

---

## 🔧 Commandes utiles supplémentaires

### Voir les processus en cours
```bash
# Voir tous les processus
adb shell ps

# Voir les processus de votre app
adb shell ps | grep laso
```

### Redémarrer l'app
```bash
# Forcer l'arrêt de l'app
adb shell am force-stop com.laso.coach

# Puis relancer
adb shell am start -n com.laso.coach/.MainActivity
```

### Vider le cache de l'app
```bash
# Vider le cache
adb shell pm clear com.laso.coach
```

### Désinstaller l'app
```bash
adb uninstall com.laso.coach
```

### Prendre une capture d'écran
```bash
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

### Enregistrer une vidéo (Android 4.4+)
```bash
# Démarrer l'enregistrement
adb shell screenrecord /sdcard/demo.mp4

# Arrêter avec Ctrl+C, puis récupérer la vidéo
adb pull /sdcard/demo.mp4
```

---

## 📊 Exemple de workflow complet

```bash
# 1. Vérifier que l'appareil est connecté
adb devices

# 2. Effacer les anciens logs
adb logcat -c

# 3. Installer/réinstaller l'APK
adb install -r votre-app.apk

# 4. Lancer l'app
adb shell am start -n com.laso.coach/.MainActivity

# 5. Capturer les logs dans un fichier (dans un autre terminal)
adb logcat -v time *:E *:W *:I | grep -i "laso\|react\|expo\|google\|firebase" > test-$(date +%Y%m%d-%H%M%S).log

# 6. Tester la fonctionnalité (connexion Google) sur l'appareil
# Les logs seront automatiquement capturés dans le fichier

# 7. Arrêter la capture avec Ctrl+C
# Analyser le fichier de logs
```

---

## 🐛 Dépannage

### L'appareil n'apparaît pas dans `adb devices`
```bash
# Redémarrer le serveur adb
adb kill-server
adb start-server
adb devices
```

### Permission refusée
```bash
# Vérifier que le débogage USB est activé sur l'appareil
# Réautoriser le débogage USB sur l'appareil
```

### Logs trop verbeux
```bash
# Utiliser des filtres plus stricts
adb logcat *:E | grep -i "laso"
```

---

## 📝 Notes importantes

1. **Gardez l'appareil connecté** pendant les tests pour capturer les logs
2. **Effacez les logs** avant chaque nouveau test pour avoir des logs propres
3. **Sauvegardez les logs** dans des fichiers avec timestamp pour référence future
4. **Filtrez les logs** pour ne garder que ce qui est pertinent (erreurs, warnings, votre app)
5. **Testez une fonctionnalité à la fois** pour isoler les problèmes

