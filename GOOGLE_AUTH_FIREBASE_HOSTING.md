# 🔐 Solution Simple : Google Auth avec Firebase Hosting

## ✅ Solution Implémentée

Au lieu d'utiliser le proxy Expo (qui ne fonctionne pas) ou un custom scheme (rejeté par Google), on utilise **Firebase Hosting** qui fournit une URL HTTPS valide.

## 📋 Comment ça fonctionne

1. **iOS App** ouvre une WebView vers : `https://lasocoach-39710.web.app/google-auth.html`
2. **Page Firebase Hosting** démarre le flux OAuth Google avec `responseType: 'id_token'`
3. **Google** redirige vers : `https://lasocoach-39710.web.app/google-auth.html?id_token=...`
4. **Page Firebase Hosting** extrait l'id_token et redirige vers l'app : `lasocoach://auth?id_token=...`
5. **App iOS** reçoit le deep link et traite l'authentification

## 🚀 Déploiement

### Étape 1 : Installer Firebase CLI (si pas déjà fait)

```bash
npm install -g firebase-tools
```

### Étape 2 : Se connecter à Firebase

```bash
firebase login
```

### Étape 3 : Initialiser Firebase Hosting (si pas déjà fait)

```bash
firebase init hosting
```

Sélectionner :
- **What do you want to use as your public directory?** → `public`
- **Configure as a single-page app?** → `No`
- **Set up automatic builds and deploys with GitHub?** → `No`

### Étape 4 : Déployer

```bash
firebase deploy --only hosting
```

L'URL sera : `https://lasocoach-39710.web.app/google-auth.html`

## ⚙️ Configuration Google Cloud Console

### Étape 1 : Ajouter le Redirect URI

1. Aller sur : https://console.cloud.google.com/apis/credentials
2. Sélectionner le projet : `lasocoach-39710`
3. Trouver le **"Client ID for Web application"** (ID se terminant par `...r239q8v3pq6r37156hddd7lrt6j5mfc2`)
4. Dans **"Authorized redirect URIs"**, ajouter :
   ```
   https://lasocoach-39710.web.app/google-auth.html
   ```
   ⚠️ **IMPORTANT** : Pas de slash à la fin, exactement comme ci-dessus

5. Cliquer sur **"Save"**
6. Attendre 1-2 minutes pour la propagation

## 📱 Configuration App iOS

### Deep Link Handler

L'app doit gérer le deep link `lasocoach://auth?id_token=...`

Le code est déjà dans `useGoogleAuthExpo.ts` qui utilise `AuthSession` pour capturer le redirect.

### Vérifier Info.plist

Assurez-vous que le custom scheme est configuré dans `Info.plist` :

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>lasocoach</string>
    </array>
  </dict>
</array>
```

## 🔍 Test

1. **Déployer** la page sur Firebase Hosting
2. **Configurer** le redirect URI dans Google Cloud Console
3. **Tester** la connexion Google dans l'app iOS
4. **Vérifier** les logs pour voir le flux complet

## 📝 Fichiers Créés

- `firebase.json` : Configuration Firebase Hosting
- `public/google-auth.html` : Page OAuth qui gère le flux
- `public/index.html` : Redirection vers la page OAuth
- `src/hooks/useGoogleAuthExpo.ts` : Modifié pour utiliser Firebase Hosting

## ✅ Avantages

- ✅ **Simple** : Juste une page HTML/JS
- ✅ **Fiable** : URL HTTPS acceptée par Google
- ✅ **Pas de proxy** : Pas besoin du proxy Expo
- ✅ **Pas de sessionStorage** : Tout est géré côté serveur
- ✅ **Sécurisé** : Nonce OAuth pour la sécurité

## 🐛 Dépannage

### Erreur : "redirect_uri_mismatch"

- Vérifier que le redirect URI est **exactement** : `https://lasocoach-39710.web.app/google-auth.html`
- Vérifier qu'il n'y a **pas de slash** à la fin
- Attendre 1-2 minutes après avoir sauvegardé dans Google Console

### L'app ne reçoit pas le deep link

- Vérifier que `lasocoach://` est dans `CFBundleURLSchemes` dans `Info.plist`
- Vérifier que l'app écoute les deep links via `AuthSession`

### La page Firebase ne charge pas

- Vérifier que Firebase Hosting est déployé : `firebase deploy --only hosting`
- Vérifier l'URL : `https://lasocoach-39710.web.app/google-auth.html`

