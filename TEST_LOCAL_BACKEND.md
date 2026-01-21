# Guide de Test Local - Mobile connecté au Backend Local

Ce guide explique comment tester l'application mobile connectée au backend local (comme la version web).

## Prérequis

1. **Backend local en cours d'exécution**
   - Le backend doit être lancé sur `http://localhost:5001`
   - Vérifiez que le backend répond : `curl http://localhost:5001/api/v1/health`

2. **Emulateur/Simulateur ou Appareil physique**
   - **Android Emulator** : Utilise `10.0.2.2` pour accéder à `localhost` de la machine hôte
   - **iOS Simulator** : Utilise `localhost` directement
   - **Appareil physique** : Utilise l'IP locale de votre machine (ex: `192.168.1.100`)

## Configuration

### Option 1 : Via le fichier `.env`

Créez ou modifiez le fichier `.env` à la racine du projet mobile :

```env
# Backend local
API_BASE_URL_DEV=http://localhost:5001/api/v1
WS_BASE_URL_DEV=ws://localhost:5001

# Pour Android Emulator, utilisez 10.0.2.2 au lieu de localhost
# API_BASE_URL_DEV=http://10.0.2.2:5001/api/v1
# WS_BASE_URL_DEV=ws://10.0.2.2:5001

# Pour appareil physique, utilisez l'IP de votre machine
# API_BASE_URL_DEV=http://192.168.1.100:5001/api/v1
# WS_BASE_URL_DEV=ws://192.168.1.100:5001
```

### Option 2 : Via `app.json` (recommandé)

Modifiez `app.json` pour ajouter la configuration dans `extra.env` :

```json
{
  "expo": {
    "extra": {
      "env": {
        "apiBaseUrlDev": "http://localhost:5001/api/v1",
        "wsBaseUrlDev": "ws://localhost:5001",
        "forceProdApi": false
      }
    }
  }
}
```

**Pour Android Emulator :**
```json
{
  "expo": {
    "extra": {
      "env": {
        "apiBaseUrlDev": "http://10.0.2.2:5001/api/v1",
        "wsBaseUrlDev": "ws://10.0.2.2:5001",
        "forceProdApi": false
      }
    }
  }
}
```

**Pour appareil physique :**
```json
{
  "expo": {
    "extra": {
      "env": {
        "apiBaseUrlDev": "http://192.168.1.100:5001/api/v1",
        "wsBaseUrlDev": "ws://192.168.1.100:5001",
        "forceProdApi": false
      }
    }
  }
}
```

> **Note** : Remplacez `192.168.1.100` par l'IP locale de votre machine. Pour trouver votre IP :
> - **Linux/Mac** : `ifconfig | grep "inet " | grep -v 127.0.0.1`
> - **Windows** : `ipconfig` (cherchez "IPv4 Address")

## Étapes de Test

### 1. Démarrer le Backend Local

```bash
cd /home/moses/Documents/Prog-App/LaSo-Coach-Backend-main
npm run dev
# ou
npm start
```

Vérifiez que le backend est accessible :
```bash
curl http://localhost:5001/api/v1/health
```

### 2. Configurer le Mobile

1. Modifiez `.env` ou `app.json` comme indiqué ci-dessus
2. Redémarrez le serveur Metro :
   ```bash
   # Arrêtez le serveur actuel (Ctrl+C)
   # Puis relancez
   npm start
   # ou
   npx expo start
   ```

### 3. Lancer l'Application

**Pour Android :**
```bash
npm run android
# ou
npx expo run:android
```

**Pour iOS :**
```bash
npm run ios
# ou
npx expo run:ios
```

### 4. Vérifier la Connexion

Une fois l'app lancée, vérifiez dans les logs :

1. **Logs Metro** : Vous devriez voir les appels API vers `localhost:5001` ou `10.0.2.2:5001`
2. **Logs Backend** : Vous devriez voir les requêtes entrantes dans les logs du backend
3. **Console de l'app** : Vérifiez que `Config.API_BASE_URL` pointe vers votre backend local

## Dépannage

### Problème : "Network request failed" sur Android Emulator

**Solution** : Utilisez `10.0.2.2` au lieu de `localhost` :
```env
API_BASE_URL_DEV=http://10.0.2.2:5001/api/v1
```

### Problème : "Connection refused" sur appareil physique

**Solutions** :
1. Vérifiez que votre machine et votre appareil sont sur le même réseau WiFi
2. Vérifiez que le firewall n'bloque pas le port 5001
3. Utilisez l'IP locale de votre machine (pas `localhost`)

### Problème : L'app utilise toujours le backend de production

**Solution** : Vérifiez que `forceProdApi` est à `false` dans `app.json` :
```json
{
  "expo": {
    "extra": {
      "env": {
        "forceProdApi": false
      }
    }
  }
}
```

Puis redémarrez complètement l'app (pas juste le reload).

### Problème : CORS errors

**Solution** : Assurez-vous que le backend autorise les requêtes depuis l'app mobile. Vérifiez la configuration CORS dans le backend.

## Vérification des Modifications

Pour tester les modifications du plan iOS par défaut :

1. **Nouveau compte** :
   - Créez un nouveau compte via l'app
   - Vérifiez dans les logs backend qu'un plan iOS est attribué automatiquement
   - Vérifiez dans l'app que l'utilisateur a un abonnement actif

2. **Utilisateur existant** :
   - Connectez-vous avec un compte existant
   - Vérifiez que le plan iOS est attribué automatiquement si aucun abonnement n'existe
   - Vérifiez l'affichage dans l'app

3. **Affichage de la phase** :
   - **Android** : Vérifiez que "Phase actuel : Test" s'affiche dans le menu nutrition
   - **iOS** : Vérifiez que la mention de phase ne s'affiche PAS

## Commandes Utiles

```bash
# Voir les logs du backend
cd LaSo-Coach-Backend-main
npm run dev

# Voir les logs Metro (dans un autre terminal)
cd LaSo-Coach-Mobile
npm start

# Voir les logs Android
adb logcat | grep -i "lasocoach\|api\|network"

# Voir les logs iOS (dans Xcode)
# Ouvrez Xcode > Window > Devices and Simulators > Sélectionnez votre appareil > View Device Logs
```

## Notes Importantes

- Le backend doit être accessible depuis l'emulateur/appareil
- Les modifications dans `.env` ou `app.json` nécessitent un redémarrage complet de l'app (pas juste un reload)
- Pour les tests avec un appareil physique, assurez-vous que le backend est accessible depuis le réseau local
- Les WebSockets doivent aussi être configurés correctement pour les fonctionnalités en temps réel

