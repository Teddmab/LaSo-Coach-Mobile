# 🚀 Déploiement Rapide - Google Auth avec Firebase Hosting

## ✅ Solution Simple et Fonctionnelle

Cette solution utilise **Firebase Hosting** pour gérer le flux OAuth Google. C'est la solution la plus simple qui fonctionne sans proxy ni custom scheme.

## 🌐 Déployer sur un Autre Projet Firebase

**Vous pouvez déployer sur n'importe quel projet Firebase**, même d'un autre compte, avec un nom comme `ioscheck.web.app`.

Voir `DEPLOY_OTHER_FIREBASE_PROJECT.md` pour les instructions détaillées.

## 📋 Étapes de Déploiement

### 1. Installer Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Se connecter à Firebase

```bash
firebase login
```

### 3. Déployer sur Firebase Hosting

```bash
firebase deploy --only hosting
```

L'URL sera : `https://lasocoach-39710.web.app/google-auth.html`

### 4. Configurer Google Cloud Console

1. Aller sur : https://console.cloud.google.com/apis/credentials
2. Projet : `lasocoach-39710`
3. Trouver le **"Client ID for Web application"** (ID: `...r239q8v3pq6r37156hddd7lrt6j5mfc2`)
4. Dans **"Authorized redirect URIs"**, ajouter :
   ```
   https://lasocoach-39710.web.app/google-auth.html
   ```
5. **Sauvegarder** et attendre 1-2 minutes

## ✅ C'est tout !

L'app iOS va maintenant :
1. Ouvrir la page Firebase Hosting dans une WebView
2. La page gère le flux OAuth Google
3. Google redirige vers la page Firebase
4. La page redirige vers l'app avec le token : `lasocoach://auth?id_token=...`
5. L'app traite l'authentification

## 🐛 Si ça ne fonctionne pas

### Vérifier le déploiement
```bash
# Vérifier que la page est accessible
curl https://lasocoach-39710.web.app/google-auth.html
```

### Vérifier Google Console
- Le redirect URI doit être **exactement** : `https://lasocoach-39710.web.app/google-auth.html`
- **Pas de slash** à la fin
- Attendre 1-2 minutes après sauvegarde

### Vérifier les logs
Dans l'app, vérifier les logs qui commencent par :
- `🚀 Lancement de l'authentification Google via Firebase Hosting...`
- `✅ idToken reçu depuis Firebase Hosting`

## 📝 Fichiers Modifiés

- ✅ `firebase.json` : Configuration Firebase Hosting
- ✅ `public/google-auth.html` : Page OAuth
- ✅ `src/hooks/useGoogleAuthExpo.ts` : Utilise Firebase Hosting

