# 🚀 Déployer sur un Autre Projet Firebase

## ✅ C'est Possible !

Vous pouvez déployer la page OAuth Google sur **n'importe quel projet Firebase**, même d'un autre compte, avec un nom de domaine personnalisé comme `ioscheck.web.app`.

## 📋 Étapes de Configuration

### 1. Créer/Utiliser un Autre Projet Firebase

#### ✅ Projet Configuré : inorder
- **ID du projet** : `inorder-fabab`
- **Site Hosting** : `ios-check`
- **URL** : `https://ios-check.web.app/google-auth.html`

Voir `FIREBASE_PROJECT_CONFIG.md` pour les détails complets.

#### Option A : Utiliser un Projet Existant
Si vous avez déjà un projet Firebase (ex: `inorder-fabab`), passez à l'étape 2.

#### Option B : Créer un Nouveau Projet
1. Aller sur : https://console.firebase.google.com/
2. Cliquer sur **"Ajouter un projet"** ou **"Add project"**
3. Entrer le nom du projet
4. Suivre les étapes de création

### 2. Activer Firebase Hosting

1. Dans votre projet Firebase, aller dans **"Hosting"**
2. Cliquer sur **"Commencer"** ou **"Get started"**
3. Suivre les instructions pour initialiser

### 3. Configurer le Projet Local

Le fichier `.firebaserc` est déjà configuré :

```json
{
  "projects": {
    "default": "lasocoach-39710",
    "oauth": "inorder-fabab"
  }
}
```

Utiliser le projet OAuth :

```bash
# Se connecter avec le compte Firebase approprié
firebase login

# Utiliser le projet OAuth
firebase use oauth
# ou directement
firebase use inorder-fabab
```

### 4. Déployer

```bash
# Déployer uniquement sur le projet OAuth
firebase deploy --only hosting --project inorder-fabab
# ou si vous avez utilisé "firebase use oauth"
firebase deploy --only hosting
```

L'URL sera : `https://ios-check.web.app/google-auth.html`

### 5. Configurer l'App Mobile

L'URL est déjà configurée dans `src/config/googleAuthHosting.ts` :

```typescript
export const GOOGLE_AUTH_HOSTING_URL = 'https://ios-check.web.app/google-auth.html';
```

### 6. Configurer Google Cloud Console

1. Aller sur : https://console.cloud.google.com/apis/credentials
2. Sélectionner le projet : `lasocoach-39710` (votre projet principal)
3. Trouver le **"Client ID for Web application"**
4. Dans **"Authorized redirect URIs"**, ajouter :
   ```
   https://ios-check.web.app/google-auth.html
   ```
5. **Sauvegarder** et attendre 1-2 minutes

## 🔐 Utiliser un Autre Compte Firebase

### Se connecter avec un Autre Compte

```bash
# Se déconnecter du compte actuel
firebase logout

# Se connecter avec le nouveau compte
firebase login

# Sélectionner le projet approprié
firebase use ioscheck
```

### Déployer

```bash
firebase deploy --only hosting --project inorder-fabab
```

## 📝 Fichiers à Modifier

### 1. Configuration de l'URL (`src/config/googleAuthHosting.ts`)

✅ **Déjà configuré** :
```typescript
export const GOOGLE_AUTH_HOSTING_URL = 'https://ios-check.web.app/google-auth.html';
```

### 2. Fichier `.firebaserc`

✅ **Déjà configuré** :
```json
{
  "projects": {
    "default": "lasocoach-39710",
    "oauth": "inorder-fabab"
  }
}
```

## ✅ Avantages

- ✅ **Séparation** : Projet OAuth séparé du projet principal
- ✅ **Autre compte** : Peut être sur un compte Firebase différent
- ✅ **Domaine personnalisé** : Nom de domaine `ios-check.web.app`
- ✅ **Facile à changer** : Juste modifier l'URL dans la config
- ✅ **Déjà configuré** : Tout est prêt pour le projet `inorder-fabab`

## 🐛 Dépannage

### Erreur : "Project not found"

```bash
# Vérifier les projets disponibles
firebase projects:list

# Utiliser le bon projet
firebase use ioscheck
```

### Erreur : "Permission denied"

- Vérifier que vous êtes connecté avec le bon compte Firebase
- Vérifier que vous avez les permissions sur le projet

### L'URL ne fonctionne pas

- Vérifier que Firebase Hosting est activé sur le projet
- Vérifier que le déploiement a réussi : `firebase deploy --only hosting`
- Tester l'URL : `curl https://ios-check.web.app/google-auth.html`

## 📋 Checklist

- [ ] Projet Firebase créé/accessible
- [ ] Firebase Hosting activé
- [ ] Connecté avec le bon compte Firebase
- [ ] Projet sélectionné : `firebase use inorder-fabab` ou `firebase use oauth`
- [ ] Déployé : `firebase deploy --only hosting`
- [ ] URL configurée dans `src/config/googleAuthHosting.ts`
- [ ] Redirect URI ajouté dans Google Cloud Console
- [ ] Testé dans l'app

