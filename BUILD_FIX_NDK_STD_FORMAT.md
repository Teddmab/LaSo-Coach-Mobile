# Fix pour l'erreur std::format lors du build Android

## Problème

L'erreur se produit lors de la compilation C++ :
```
error: no member named 'format' in namespace 'std'
      return std::format("{}%", dimension.value);
```

React Native 0.81.5 utilise `std::format` (C++20) qui n'est pas disponible dans le NDK Android 26.3.11579264.

## Solution

Forcer l'utilisation d'une version de NDK plus ancienne qui supporte mieux C++20, ou utiliser une version de NDK compatible.

### Option 1 : Forcer NDK 25.2.9519653 (Recommandé)

Ajoutez dans `eas.json` pour le profil Android :

```json
{
  "build": {
    "development": {
      "android": {
        "env": {
          "ANDROID_NDK_VERSION": "25.2.9519653"
        }
      }
    },
    "preview": {
      "android": {
        "env": {
          "ANDROID_NDK_VERSION": "25.2.9519653"
        }
      }
    },
    "production": {
      "android": {
        "env": {
          "ANDROID_NDK_VERSION": "25.2.9519653"
        }
      }
    }
  }
}
```

### Option 2 : Patch React Native (Alternative)

Si l'option 1 ne fonctionne pas, créer un patch pour React Native qui remplace `std::format` par `folly::format` ou `sprintf`.

## Instructions

1. Modifiez `eas.json` avec l'option 1
2. Rebuild : `eas build --platform android --profile development`
3. Si ça ne fonctionne pas, utilisez l'option 2

