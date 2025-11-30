# 🔧 Fix: Variables .env Non Chargées

**Problème** : `baseURL: undefined` malgré `.env` configuré  
**Cause** : Cache Metro/Expo non vidé après création/modification `.env`

---

## ✅ Solution : Redémarrer Expo avec Cache Clear

### Étape 1 : Arrêter Expo

```bash
# Dans le terminal où Expo tourne
Ctrl + C
```

### Étape 2 : Vider le Cache Metro

```bash
cd /home/moses/Documents/Prog-App/LaSo-Coach-Mobile-main

# Vider le cache Metro
npx expo start --clear

# OU si ça ne marche pas
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --clear
```

### Étape 3 : Vérifier les Logs au Démarrage

Tu devrais voir dans les logs :
```
🔥 Firebase Auth Service initialized with API: https://laso-coach-backend.onrender.com/api/v1
```

**Si tu vois toujours `undefined`** → Voir "Solution Alternative" ci-dessous

---

## 🔍 Vérification

### Test 1 : Vérifier Variables Chargées

Dans les logs au démarrage, cherche :
```
🔍 Dev URL sources: { extraEnv: ..., envVar: 'https://...' }
🚀 Using production API: https://laso-coach-backend.onrender.com/api/v1
```

**Si `envVar: undefined`** → Variables `.env` non chargées

---

### Test 2 : Vérifier dans le Code

Ajouter temporairement dans `src/config/env.js` :

```javascript
console.log('🔍 [DEBUG] API_BASE_URL from @env:', API_BASE_URL);
console.log('🔍 [DEBUG] API_BASE_URL_DEV from @env:', API_BASE_URL_DEV);
```

**Si `undefined`** → Problème de chargement `@env`

---

## 🔧 Solution Alternative : Utiliser app.json (Temporaire)

Si `.env` ne se charge toujours pas, on peut forcer via `app.json` :

```json
// app.json
"extra": {
  "env": {
    "apiBaseUrl": "https://laso-coach-backend.onrender.com/api/v1",
    "apiBaseUrlDev": "http://localhost:3000/api/v1",
    "apiTimeout": "60000"
  }
}
```

**Avantage** : Fonctionne toujours (pas de dépendance à `.env`)  
**Inconvénient** : Moins flexible (doit rebuild pour changer)

---

## 🚨 Si Toujours `undefined` Après Redémarrage

### Vérifier Installation Package

```bash
npm list react-native-dotenv
```

**Si pas installé** :
```bash
npm install react-native-dotenv --save-dev
```

### Vérifier babel.config.js

Le fichier doit contenir :
```javascript
plugins: [
  [
    'module:react-native-dotenv',
    {
      moduleName: '@env',
      path: '.env',
    },
  ],
]
```

### Rebuild Node Modules

```bash
rm -rf node_modules
npm install
npx expo start --clear
```

---

## 📋 Checklist

- [ ] `.env` existe et contient `API_BASE_URL=...`
- [ ] `react-native-dotenv` installé
- [ ] `babel.config.js` configuré
- [ ] Expo redémarré avec `--clear`
- [ ] Cache Metro vidé
- [ ] Logs montrent URL correcte

---

## 🎯 Résultat Attendu

Après redémarrage, dans les logs :
```
🔥 Firebase Auth Service initialized with API: https://laso-coach-backend.onrender.com/api/v1
🌐 [DEBUG] Backend Base URL: https://laso-coach-backend.onrender.com/api/v1
```

**Plus de `baseURL: undefined`** ✅

---

**Date** : 30 Novembre 2025  
**Urgence** : 🔴 Bloque authentification Google

