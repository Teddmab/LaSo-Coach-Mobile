# ⚙️ Configuration Google Cloud Console

## ✅ URL de Déploiement

Le déploiement est **réussi** ! ✅

- **URL** : `https://inorder-fabab.web.app/google-auth.html`
- **Status** : ✅ Accessible et fonctionnel

## 🔧 Configuration Requise dans Google Cloud Console

### Étape 1 : Accéder à Google Cloud Console

1. Aller sur : https://console.cloud.google.com/apis/credentials
2. Sélectionner le projet : **`lasocoach-39710`** (votre projet principal)

### Étape 2 : Trouver le Client ID Web

1. Trouver le **"Client ID for Web application"**
   - ID se terminant par : `...r239q8v3pq6r37156hddd7lrt6j5mfc2`

### Étape 3 : Ajouter le Redirect URI

1. Cliquer sur le Client ID Web pour l'éditer
2. Dans la section **"Authorized redirect URIs"**, cliquer sur **"ADD URI"**
3. Ajouter **EXACTEMENT** :
   ```
   https://inorder-fabab.web.app/google-auth.html
   ```
   ⚠️ **IMPORTANT** :
   - ❌ PAS de slash à la fin
   - ❌ PAS de majuscules
   - ✅ EXACTEMENT comme ci-dessus

4. Cliquer sur **"SAVE"**
5. **Attendre 1-2 minutes** pour la propagation

## ✅ Vérification

### Tester l'URL

```bash
curl https://inorder-fabab.web.app/google-auth.html
```

Vous devriez voir le HTML de la page OAuth.

### Tester dans l'App

1. Lancer l'app iOS
2. Cliquer sur "Continuer avec Google"
3. Vérifier les logs pour voir si l'URL est correcte

## 🐛 Si ça ne fonctionne pas

### Erreur : "redirect_uri_mismatch"

- Vérifier que le redirect URI est **exactement** : `https://inorder-fabab.web.app/google-auth.html`
- Vérifier qu'il n'y a **pas de slash** à la fin
- Attendre 1-2 minutes après sauvegarde dans Google Console

### La page ne charge pas

- Vérifier que le déploiement a réussi : `firebase deploy --only hosting`
- Vérifier l'URL : `curl https://inorder-fabab.web.app/google-auth.html`

