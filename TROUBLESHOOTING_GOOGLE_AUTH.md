# 🔧 Dépannage - Google Auth qui revient au choix des comptes

## 🐛 Problème

Quand on choisit un compte Google, ça ne redirige pas et ça revient au choix des comptes.

## 🔍 Causes Possibles

### 1. Redirect URI non configuré dans Google Cloud Console

**Solution** : Vérifier que le redirect URI est bien ajouté dans Google Cloud Console.

1. Aller sur : https://console.cloud.google.com/apis/credentials
2. Projet : `lasocoach-39710`
3. Trouver le **"Client ID for Web application"**
4. Vérifier que dans **"Authorized redirect URIs"** vous avez :
   ```
   https://inorder-fabab.web.app/google-auth.html
   ```
5. Si absent, l'ajouter et **sauvegarder**
6. Attendre 1-2 minutes pour la propagation

### 2. Le token est dans le hash (#) au lieu des query params (?)

Google OAuth avec `response_type: 'id_token'` peut mettre le token dans le hash de l'URL.

**Solution** : La page HTML a été mise à jour pour gérer les deux cas (query params et hash).

### 3. Le deep link ne fonctionne pas

**Vérification** :

1. Vérifier que `lasocoach://` est dans `Info.plist` :
   ```xml
   <key>CFBundleURLSchemes</key>
   <array>
     <string>lasocoach</string>
   </array>
   ```

2. Tester le deep link manuellement :
   ```bash
   # Sur iOS Simulator
   xcrun simctl openurl booted "lasocoach://auth?id_token=test"
   ```

### 4. La page Firebase ne gère pas correctement le callback

**Vérification** :

1. Ouvrir la console du navigateur sur la page Firebase
2. Vérifier les logs qui commencent par `🔍 [Google Auth]`
3. Vérifier si l'id_token est bien reçu

## 🔧 Solutions

### Solution 1 : Vérifier les Logs

Dans l'app iOS, vérifier les logs qui commencent par :
- `🚀 Lancement de l'authentification Google via Firebase Hosting...`
- `📬 Résultat authentification:`
- `📋 URL de retour:`

Dans la page Firebase (console navigateur), vérifier les logs :
- `🔍 [Google Auth] Page chargée`
- `🔍 [Google Auth] idToken dans URL:`
- `✅ [Google Auth] id_token reçu`

### Solution 2 : Redéployer la Page

```bash
firebase deploy --only hosting --project inorder-fabab
```

### Solution 3 : Vérifier le Redirect URI

Tester directement l'URL dans un navigateur :
```
https://inorder-fabab.web.app/google-auth.html
```

Vous devriez être redirigé vers Google OAuth.

### Solution 4 : Vérifier Google Cloud Console

1. Aller sur : https://console.cloud.google.com/apis/credentials
2. Vérifier que le redirect URI est **exactement** :
   ```
   https://inorder-fabab.web.app/google-auth.html
   ```
3. Vérifier qu'il n'y a **pas de slash** à la fin
4. Vérifier qu'il n'y a **pas d'espaces**

## 📋 Checklist de Vérification

- [ ] Redirect URI ajouté dans Google Cloud Console
- [ ] Redirect URI est exactement : `https://inorder-fabab.web.app/google-auth.html`
- [ ] Pas de slash à la fin
- [ ] Attendu 1-2 minutes après sauvegarde
- [ ] Page Firebase déployée : `firebase deploy --only hosting`
- [ ] Deep link configuré dans `Info.plist`
- [ ] Logs vérifiés dans l'app et dans la page Firebase

## 🐛 Logs à Vérifier

### Dans l'App iOS

```
🚀 Lancement de l'authentification Google via Firebase Hosting...
🌐 [iOS] Ouverture de la page Firebase Hosting: https://inorder-fabab.web.app/google-auth.html
📬 Résultat authentification: success
📋 URL de retour: lasocoach://auth?id_token=...
```

### Dans la Page Firebase (Console Navigateur)

```
🔍 [Google Auth] Page chargée
🔍 [Google Auth] URL actuelle: https://inorder-fabab.web.app/google-auth.html?id_token=...
🔍 [Google Auth] idToken dans URL: true
✅ [Google Auth] id_token reçu, longueur: 1234
🔗 [Google Auth] Redirection vers app: lasocoach://auth?id_token=...
```

## ✅ Si ça ne fonctionne toujours pas

1. Vérifier les logs complets dans l'app
2. Vérifier les logs dans la console du navigateur (si accessible)
3. Vérifier que le redirect URI est bien configuré dans Google Cloud Console
4. Tester avec un autre compte Google
5. Vérifier que le deep link fonctionne manuellement

