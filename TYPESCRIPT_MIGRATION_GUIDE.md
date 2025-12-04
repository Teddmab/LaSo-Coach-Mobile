# 📘 Guide de Migration TypeScript - LaSo Coach Mobile

## ✅ Configuration Complète Effectuée

### 1. **tsconfig.json** - Configuration TypeScript
✅ Configuré avec :
- Extension de la config Expo de base
- Mode strict activé
- Support JSX pour React Native
- Résolution de modules configurée
- Support des imports de chemins (`@/*`)
- Inclusion des fichiers `.ts`, `.tsx`, `.js`, `.jsx`

### 2. **Types Installés**
✅ Packages installés :
- `@types/react-native` - Types pour React Native
- `@types/react` - Types pour React (déjà présent, mis à jour)
- `@types/node` - Types pour Node.js

### 3. **Déclaration de Types pour @env**
✅ Fichier créé : `src/types/env.d.ts`
- Déclare tous les types pour les variables d'environnement
- Permet l'utilisation de `import { API_BASE_URL } from '@env'` avec typage

### 4. **Configuration Metro**
✅ Déjà configuré - Expo supporte TypeScript par défaut
- Metro résout automatiquement `.ts` et `.tsx`
- Pas de modification nécessaire

---

## ⚠️ Ce qui NE SUFFIT PAS : Simple Renomination

### ❌ Ce qui ne fonctionne PAS :
```bash
# ❌ MAUVAISE APPROCHE
mv App.js App.tsx
mv src/screens/LoginScreen.js src/screens/LoginScreen.tsx
```

**Pourquoi ça ne suffit pas ?**
1. **Erreurs de typage** : TypeScript détectera des erreurs
2. **Types manquants** : Props, états, fonctions non typés
3. **Imports non typés** : Les modules JS n'ont pas de types
4. **Configuration incomplète** : Sans `tsconfig.json` approprié

---

## ✅ Approche Correcte : Migration Progressive

### Phase 1 : Nouveaux Fichiers en TypeScript
Pour tous les **nouveaux fichiers**, utilisez `.tsx` ou `.ts` :

```typescript
// ✅ Nouveau composant TypeScript
// src/components/NewComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NewComponentProps {
  title: string;
  onPress?: () => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export default NewComponent;
```

### Phase 2 : Migration Fichier par Fichier

#### Étape 1 : Renommer le fichier
```bash
mv src/screens/LoginScreen.js src/screens/LoginScreen.tsx
```

#### Étape 2 : Ajouter les types

**Avant (JavaScript) :**
```javascript
import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // ...
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
```

**Après (TypeScript) :**
```typescript
import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

// Définir les types de navigation
type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = async (): Promise<void> => {
    // ...
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;
```

### Phase 3 : Types pour les Services API

**Exemple : `src/services/api.ts`**
```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Config from '../config/env';

interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: Config.API_BASE_URL,
      timeout: Config.API_TIMEOUT,
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return {
      data: response.data,
      status: response.status,
    };
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return {
      data: response.data,
      status: response.status,
    };
  }
}

export default new ApiService();
```

---

## 📋 Checklist de Migration

Pour chaque fichier à migrer :

- [ ] 1. Renommer `.js` → `.tsx` (ou `.ts` si pas de JSX)
- [ ] 2. Ajouter les types pour les props de composants
- [ ] 3. Typer les états (`useState<string>('')`)
- [ ] 4. Typer les fonctions (`const fn = (): void => {}`)
- [ ] 5. Typer les paramètres de fonctions
- [ ] 6. Typer les retours de fonctions async (`Promise<T>`)
- [ ] 7. Typer les imports de modules externes
- [ ] 8. Vérifier avec `npx tsc --noEmit`
- [ ] 9. Tester que l'app fonctionne toujours

---

## 🔧 Commandes Utiles

### Vérifier les erreurs TypeScript
```bash
npx tsc --noEmit
```

### Vérifier un fichier spécifique
```bash
npx tsc --noEmit src/screens/LoginScreen.tsx
```

### Mode watch (détection d'erreurs en temps réel)
```bash
npx tsc --noEmit --watch
```

---

## 📁 Fichiers qui Peuvent Rester en JavaScript

Ces fichiers peuvent rester en `.js` :
- `app.config.js` - Configuration Expo
- `babel.config.js` - Configuration Babel
- `metro.config.js` - Configuration Metro
- `index.js` - Point d'entrée (peut rester en JS)
- Scripts de build (`scripts/*.js`)

---

## 🎯 Ordre Recommandé de Migration

1. **Types et interfaces** (`src/types/*.ts`)
2. **Services API** (`src/services/*.ts`)
3. **Contextes** (`src/context/*.tsx`)
4. **Composants réutilisables** (`src/components/*.tsx`)
5. **Écrans** (`src/screens/*.tsx`)
6. **App.js** → `App.tsx` (en dernier)

---

## ⚡ Avantages Immédiats

Une fois la migration complète :

✅ **Autocomplétion** : IDE suggère les props et méthodes
✅ **Détection d'erreurs** : Erreurs détectées avant l'exécution
✅ **Refactoring sûr** : Renommer une variable met à jour toutes les références
✅ **Documentation** : Les types servent de documentation
✅ **Meilleure collaboration** : L'équipe comprend mieux le code

---

## 🚨 Erreurs Communes à Éviter

### 1. Utiliser `any` partout
```typescript
// ❌ MAUVAIS
const data: any = await fetchData();

// ✅ BON
interface UserData {
  id: string;
  name: string;
}
const data: UserData = await fetchData();
```

### 2. Oublier de typer les props
```typescript
// ❌ MAUVAIS
const Component = ({ title }) => { ... }

// ✅ BON
interface ComponentProps {
  title: string;
}
const Component: React.FC<ComponentProps> = ({ title }) => { ... }
```

### 3. Ne pas typer les états
```typescript
// ❌ MAUVAIS
const [count, setCount] = useState(0);

// ✅ BON (inférence automatique OK pour les primitives)
const [count, setCount] = useState<number>(0);
```

---

## 📚 Ressources

- [Documentation TypeScript](https://www.typescriptlang.org/docs/)
- [React Native TypeScript](https://reactnative.dev/docs/typescript)
- [Expo TypeScript](https://docs.expo.dev/guides/typescript/)

---

**Dernière mise à jour** : Configuration complète effectuée ✅
**Prochaine étape** : Migration progressive fichier par fichier

