# 🔧 Correction Backend : Profile Upsert

## 🎯 Problème Identifié

Lors de la création d'un utilisateur (register), le backend crée seulement l'utilisateur dans la table `User`, mais **ne crée PAS automatiquement** un enregistrement dans la table `Profile` (relation 1-1).

Quand on fait un `PUT /profile` avec un objet `profile` imbriqué, Prisma essaie de faire un `profile.update()` mais il n'y a pas de record dans la table Profile, d'où l'erreur :

```
Invalid `prisma.profile.update()` invocation:
An operation failed because it depends on one or more records that were required but not found. 
No record was found for an update.
```

## ✅ Solution : Backend doit gérer l'Upsert

Le backend doit modifier l'endpoint `PUT /profile` pour utiliser `upsert` au lieu de `update` pour la relation Profile.

### Code Backend Actuel (❌ Ne fonctionne pas)

```javascript
// ❌ Code actuel qui échoue
await prisma.user.update({
  where: { id: userId },
  data: {
    firstName: data.firstName,
    lastName: data.lastName,
    // ...
    profile: {
      update: {  // ❌ Échoue si Profile n'existe pas
        height: data.profile.height,
        initialWeight: data.profile.initialWeight,
        // ...
      }
    }
  }
});
```

### Code Backend Corrigé (✅ Fonctionne)

```javascript
// ✅ Code corrigé avec upsert
await prisma.user.update({
  where: { id: userId },
  data: {
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    address: data.address,
    // ...
    profile: {
      upsert: {  // ✅ Crée si n'existe pas, met à jour sinon
        create: {
          height: data.profile.height,
          initialWeight: data.profile.initialWeight,
          initialWaistSize: data.profile.initialWaistSize,
          gender: data.profile.gender,
          occupation: data.profile.occupation,
        },
        update: {
          height: data.profile.height,
          initialWeight: data.profile.initialWeight,
          initialWaistSize: data.profile.initialWaistSize,
          gender: data.profile.gender,
          occupation: data.profile.occupation,
        }
      }
    }
  }
});
```

## 📋 Endpoint à Modifier

**Fichier Backend :** `controllers/profile.controller.ts` ou similaire  
**Endpoint :** `PUT /api/v1/profile`  
**Méthode :** `updateProfile` ou `updateUserProfile`

## 🔍 Vérification

Dans l'admin, l'endpoint `PUT /admin/users/${userId}` fonctionne car il gère probablement déjà l'upsert. Le même comportement doit être appliqué à `PUT /profile` pour la version mobile.

## ⚠️ Note Importante

- **Validation côté client :** ✅ Déjà en place - tous les champs sont validés avant l'envoi
- **Création Profile :** ❌ Le backend doit gérer l'upsert pour créer le Profile s'il n'existe pas
- **Update Profile :** ✅ Fonctionne si le Profile existe déjà

## 🚀 Action Requise

**Le backend doit être modifié pour :**
1. Utiliser `profile.upsert()` au lieu de `profile.update()` dans `PUT /profile`
2. Créer automatiquement le Profile lors de la première mise à jour
3. Mettre à jour le Profile s'il existe déjà

Une fois cette correction appliquée côté backend, les erreurs "No record was found for an update" disparaîtront.

---

**Date :** 2025-01-XX  
**Priorité :** 🔴 CRITIQUE  
**Impact :** Bloque l'onboarding Étape 1/4

