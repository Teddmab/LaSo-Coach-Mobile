# Structure des Écrans (Screens)

Cette structure organise les écrans de l'application en modules réutilisables et maintenables.

## 📁 Structure des Dossiers

```
src/screens/
├── dashboard/          # Écran principal du tableau de bord
│   ├── components/     # Composants spécifiques au dashboard
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardContent.tsx
│   │   └── DashboardLayout.tsx
│   ├── hooks/          # Hooks personnalisés pour la logique métier
│   │   ├── useDashboardData.ts
│   │   ├── useSubscription.ts
│   │   ├── useDashboardNavigation.ts
│   │   ├── useAchievements.ts
│   │   ├── useAgenda.ts
│   │   └── useCommunity.ts
│   ├── modals/         # Modales spécifiques au dashboard
│   │   └── SubscriptionPlansModal.tsx
│   ├── types/          # Types TypeScript
│   │   └── index.ts
│   └── index.ts        # Exports centralisés
│
├── auth/               # Écrans d'authentification
│   ├── components/     # Composants réutilisables pour l'auth
│   │   ├── AuthHeader.tsx
│   │   └── AuthForm.tsx
│   └── index.ts
│
├── shared/             # Composants partagés entre tous les écrans
│   ├── components/
│   │   ├── ScreenLayout.tsx    # Layout de base pour tous les écrans
│   │   ├── ScreenHeader.tsx    # En-tête réutilisable
│   │   └── ScreenContent.tsx   # Contenu avec scroll et refresh
│   └── index.ts
│
└── [Autres écrans].tsx # Écrans individuels (à migrer progressivement)
```

## 🎯 Principes de Refactorisation

### 1. Séparation des Responsabilités
- **Components** : UI pure, pas de logique métier
- **Hooks** : Logique métier et gestion d'état
- **Types** : Définitions TypeScript centralisées
- **Modals** : Modales spécifiques à un écran

### 2. Réutilisabilité
- Composants partagés dans `shared/`
- Composants spécifiques dans le dossier de l'écran
- Hooks réutilisables pour la logique commune

### 3. Maintenabilité
- Fichiers de moins de 500 lignes
- Un composant = une responsabilité
- Types explicites pour toutes les props

## 📝 Exemple d'Utilisation

### DashboardScreen (Refactorisé)
```typescript
import DashboardLayout from './dashboard/components/DashboardLayout';
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import { useSubscription } from './dashboard/hooks/useSubscription';

const DashboardScreen = () => {
  const { dashboardData } = useDashboardData();
  const { subscriptionData } = useSubscription();
  
  return (
    <DashboardLayout
      dashboardData={dashboardData}
      subscriptionData={subscriptionData}
      // ... autres props
    />
  );
};
```

### Utilisation des Composants Partagés
```typescript
import { ScreenLayout, ScreenHeader, ScreenContent } from './shared';

const MyScreen = () => {
  return (
    <ScreenLayout>
      <ScreenHeader title="Mon Écran" onBack={() => {}} />
      <ScreenContent refreshing={false} onRefresh={() => {}}>
        {/* Contenu */}
      </ScreenContent>
    </ScreenLayout>
  );
};
```

## 🚀 Migration des Autres Écrans

Pour migrer un écran existant :

1. **Créer la structure** : `src/screens/[nom-ecran]/`
2. **Extraire les composants** : UI dans `components/`
3. **Extraire la logique** : Hooks dans `hooks/`
4. **Définir les types** : Types dans `types/`
5. **Refactoriser l'écran** : Utiliser les nouveaux composants

## ✅ Avantages

- ✅ **Maintenabilité** : Code organisé et facile à comprendre
- ✅ **Réutilisabilité** : Composants partagés entre écrans
- ✅ **Testabilité** : Hooks et composants testables indépendamment
- ✅ **Performance** : Code splitting et lazy loading facilités
- ✅ **Type Safety** : TypeScript strict pour moins d'erreurs

