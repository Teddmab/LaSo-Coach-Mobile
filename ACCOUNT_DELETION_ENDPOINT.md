# Endpoint de Suppression de Compte Mobile

## Analyse du Backend

D'après le commit mentionné : `feat: implement mobile account deletion with auto-logout`

### Endpoint Mobile-Friendly (selon le commit)

**Endpoint** : `POST /api/v1/user/account-deletion`

**Caractéristiques** :
- ✅ Pas de mot de passe requis (mobile-friendly)
- ✅ Support des champs `reason` et `feedback` (comments)
- ✅ Auto-logout après suppression
- ✅ Nettoyage des tokens (cookies + logoutRequired flag)
- ✅ Période de rétention de 7 ans (conformité GDPR)
- ✅ Marque le statut utilisateur comme INACTIVE
- ✅ Définit `deletedAt` timestamp

### Endpoints Actuels dans le Backend

D'après le code actuel dans `/home/moses/Documents/Prog-App/LaSo-Coach-Backend` :

1. **DELETE /api/users/account** (ligne 18 de `account-deletion.routes.ts`)
   - ❌ Nécessite un mot de passe
   - ✅ Supporte `reason` (optionnel)
   - ❌ Ne supporte pas `feedback`/`comments`
   - Body: `{ password: string, reason?: string, confirmDeletion: boolean }`

2. **POST /api/users/account-deletion-request** (ligne 26)
   - ✅ Pas de mot de passe requis
   - ✅ Supporte `reason` (optionnel)
   - ❌ Nécessite un email (pas d'auth)
   - Body: `{ email: string, reason?: string }`

3. **DELETE /api/v1/users/:id** (ligne 48)
   - ✅ Pas de mot de passe requis (authentifié via token)
   - ❌ Ne supporte pas `reason` ni `feedback`
   - Soft delete uniquement

## Solution Recommandée

### Option 1 : Utiliser l'endpoint mobile-friendly (si disponible sur GitHub)

Si le commit a été mergé sur GitHub, utiliser :

**Endpoint** : `POST /api/v1/user/account-deletion`

**Body** :
```json
{
  "reason": "string (optionnel)",
  "feedback": "string (optionnel, correspond à 'comments')"
}
```

**Headers** :
```
Authorization: Bearer {firebaseIdToken}
Content-Type: application/json
```

### Option 2 : Modifier le code mobile pour utiliser DELETE /api/users/account

Si l'endpoint mobile-friendly n'existe pas encore, modifier le code pour :

1. **Envoyer le feedback dans le body** (actuellement non envoyé)
2. **Utiliser DELETE /api/users/account** avec un mot de passe vide ou un flag mobile

**Modification nécessaire dans `ProfileApi.deleteAccount()`** :

```typescript
static async deleteAccount(feedback?: { reason?: string; comments?: string }) {
  // ...
  const response = await fetch(url, {
    method: 'DELETE', // ou 'POST' si endpoint mobile existe
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      reason: feedback?.reason,
      feedback: feedback?.comments, // ou 'comments' selon le backend
      // Pour mobile, on pourrait ajouter un flag
      isMobile: true,
      // Si mot de passe requis, utiliser un token spécial ou laisser vide
      password: '', // ou omettre si endpoint mobile-friendly
      confirmDeletion: true
    }),
  });
  // ...
}
```

### Option 3 : Vérifier si l'endpoint existe sous /user (singulier)

Le commit mentionne "Mount account deletion routes under both /user and /users prefixes".

Vérifier si dans `src/routes/index.ts`, il y a aussi :
```typescript
router.use('/user', accountDeletionRoutes); // En plus de /users
```

Et si dans `account-deletion.routes.ts`, il y a un endpoint :
```typescript
router.post('/account-deletion', authenticate, accountDeletionController.deleteAccountMobile.bind(accountDeletionController));
```

## Action Immédiate

1. **Vérifier sur GitHub** si le commit `feat: implement mobile account deletion with auto-logout` a été mergé
2. **Vérifier l'endpoint exact** : `POST /api/v1/user/account-deletion` ou `POST /api/users/account-deletion`
3. **Modifier `ProfileApi.deleteAccount()`** pour :
   - Accepter le paramètre `feedback`
   - Envoyer `reason` et `feedback`/`comments` dans le body
   - Utiliser la bonne méthode HTTP (POST ou DELETE)
   - Utiliser le bon endpoint

## Code Actuel à Modifier

**Fichier** : `src/services/profileApi.ts`

**Méthode** : `deleteAccount()`

**Modifications nécessaires** :
1. Ajouter le paramètre `feedback?: { reason?: string; comments?: string }`
2. Envoyer le feedback dans le body de la requête
3. Vérifier l'endpoint exact (POST vs DELETE, /user vs /users)

## Flux Complet Attendu

1. User va dans Settings → Security → Delete Account
2. Remplit le formulaire avec feedback optionnel (raison + commentaires)
3. Soumet via **POST /api/v1/user/account-deletion** (ou endpoint mobile-friendly)
4. Backend traite la suppression (30 jours de rétention)
5. Toast de succès affiché
6. Auto-logout déclenché
7. Tous les tokens nettoyés (token, refreshToken, firebase jid_token)
8. Firebase user signé out
9. Redirection vers /login
10. Email de confirmation envoyé par le backend

## Date de création
2024-12-19

