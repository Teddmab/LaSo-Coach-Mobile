# 🔥 Configuration Projet Firebase - Google OAuth

## 📋 Informations du Projet

- **Nom du projet** : inorder
- **ID du projet** : inorder-fabab
- **Numéro du projet** : 1097031859403
- **Site Hosting** : ios-check
- **URL** : https://inorder-fabab.web.app/google-auth.html

## 🚀 Déploiement

### 1. Se connecter à Firebase

```bash
firebase login
```

### 2. Utiliser le projet OAuth

```bash
firebase use inorder-fabab
```

### 3. Déployer

```bash
firebase deploy --only hosting
```

L'URL sera : `https://inorder-fabab.web.app/google-auth.html`

## ⚙️ Configuration Google Cloud Console

Dans Google Cloud Console (projet `lasocoach-39710`), ajouter ce redirect URI :

```
https://inorder-fabab.web.app/google-auth.html
```

## ✅ Configuration App Mobile

L'URL est déjà configurée dans `src/config/googleAuthHosting.ts` :

```typescript
export const GOOGLE_AUTH_HOSTING_URL = 'https://inorder-fabab.web.app/google-auth.html';
```

## 🔍 Vérification

### Tester l'URL

```bash
curl https://inorder-fabab.web.app/google-auth.html
```

### Vérifier le projet actif

```bash
firebase projects:list
firebase use
```

## 📝 Fichiers de Configuration

- ✅ `.firebaserc` : Configuration des projets Firebase
- ✅ `src/config/googleAuthHosting.ts` : URL du site Hosting
- ✅ `firebase.json` : Configuration Firebase Hosting

