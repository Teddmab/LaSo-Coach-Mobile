# Backend : route unregister-token (notifications)

## À ajouter

**Route :** `POST /api/v1/notifications/unregister-token`  
**Auth :** même middleware que `register-token` (utilisateur authentifié).

**Body :** `{ "token": "ExponentPushToken[xxx]" }` (string obligatoire).

**Comportement :** désactiver le push token pour l’utilisateur connecté (ex. `PushToken.updateMany({ where: { token, userId }, data: { isActive: false } })`). Pas besoin de supprimer la ligne.

**Réponse succès :** `200` + `{ "status": "success", "message": "Push token unregistered" }`.

## Raison

L’app mobile appelle cette URL au **logout**. Sans elle, la requête renvoie 404 et les tokens restent actifs en base, donc des notifications peuvent encore être envoyées après déconnexion.
