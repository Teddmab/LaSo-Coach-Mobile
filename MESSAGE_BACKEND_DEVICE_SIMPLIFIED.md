# Modification Backend - Device Registration (Structure Simplifiée)

## 🎯 Objectif
Adapter le contrôleur `DeviceController` pour accepter la structure simplifiée envoyée par le mobile ET utiliser la structure réelle de la base de données.

## ⚠️ Problème actuel
- **Backend attend** : Ancien format complexe (platform, manufacturer, modelName, osName, osVersion, appVersion, isDevice, etc.)
- **Mobile envoie maintenant** : Format simplifié (type, name, status, lastSync)
- **Base de données réelle** : Structure simple (id, userId, type, name, status, lastSync)
- **Résultat** : Erreur de validation car champs manquants

## 📋 Structure actuelle de la base de données (réelle)
- `id` (TEXT, PRIMARY KEY)
- `userId` (TEXT, NOT NULL)
- `type` (TEXT, NOT NULL)
- `name` (TEXT, NOT NULL)
- `status` (TEXT, NOT NULL)
- `lastSync` (TIMESTAMP)

## 📤 Format ACTUEL reçu du mobile (nouveau)
```json
{
  "type": "ANDROID",
  "name": "Samsung Galaxy S21",
  "status": "ACTIVE",
  "lastSync": "2025-12-01T23:00:00.000Z"
}
```

## 🔧 Modifications à faire

### 1. Schéma Zod (`registerSchema`)
Remplacer par :
```typescript
const registerSchema = z.object({
  type: z.string(),
  name: z.string(),
  status: z.string().optional().default('ACTIVE'),
  lastSync: z.string().datetime().optional(),
});
```

### 2. Logique du contrôleur
- Supprimer le calcul de `deviceIdentifier` (colonne inexistante)
- Utiliser directement `type` et `name` pour identifier l'appareil unique
- Retirer toutes les références aux champs complexes (platform, manufacturer, etc.)
- Simplifier la requête `findFirst` pour chercher par `userId + type + name`
- Utiliser SQL brut ou adapter Prisma pour les colonnes réelles

### 3. Requête Prisma/SQL
Au lieu de :
```typescript
prisma.device.findFirst({ where: { userId, deviceIdentifier } })
```

Utiliser :
```typescript
prisma.$queryRaw`
  SELECT * FROM "Device" 
  WHERE "userId" = ${userId} 
  AND "type" = ${data.type} 
  AND "name" = ${data.name}
`
```

## 📥 Format ANCIEN attendu par le backend (à retirer)
```json
{
  "platform": "android",
  "manufacturer": "Samsung",
  "modelName": "SM-G998B",
  "osName": "Android",
  "osVersion": "14",
  "appVersion": "1.2.3",
  "isDevice": true,
  // ... + 10 autres champs
}
```

## 🔄 Comparaison
| Ancien (Backend attend) | Nouveau (Mobile envoie) |
|------------------------|-------------------------|
| platform, manufacturer, modelName, etc. (15+ champs) | type, name, status, lastSync (4 champs) |
| Calcul deviceIdentifier via SHA256 | Pas de deviceIdentifier (colonne n'existe pas) |
| Utilise Prisma avec schéma complexe | Doit utiliser SQL brut pour colonnes réelles |

## ⚠️ Important
- ❌ Ne plus utiliser `deviceIdentifier` (colonne n'existe pas dans la DB réelle)
- ❌ Ne plus valider les anciens champs (platform, manufacturer, etc.)
- ✅ Accepter seulement : `type`, `name`, `status`, `lastSync`
- ✅ Adapter les requêtes Prisma aux colonnes réelles ou utiliser SQL brut
- ✅ Le `userId` est récupéré depuis `req.user.id` (middleware auth)
- ✅ Identifier l'appareil par `userId + type + name` (au lieu de deviceIdentifier hash)

## 🚨 Action immédiate requise
Le mobile est déjà déployé avec la structure simplifiée. Le backend doit être mis à jour rapidement pour éviter les erreurs de validation en production.

