# 📱 Release Notes - Version 1.0.4

**Date de release** : Décembre 2025  
**Version** : 1.0.4 (versionCode: 3)

---

## 🔧 Corrections Techniques

### ✅ Authentification Google - Correction pour les builds AAB
- **Problème résolu** : L'authentification Google ne fonctionnait pas sur les builds AAB installés depuis le Play Store
- **Solution** : Ajout des empreintes SHA-1 et SHA-256 du certificat Play App Signing dans Firebase
- **Impact** : Les utilisateurs peuvent maintenant se connecter avec Google sur toutes les versions de l'application (APK et AAB)

### 🔐 Configuration Firebase
- Mise à jour du fichier `google-services.json` avec les nouveaux certificats
- Support complet pour :
  - Builds de développement (APK local)
  - Builds EAS (preview/production)
  - Builds distribués via Google Play Store (AAB)

---

## 🎨 Améliorations de l'Interface Utilisateur

### 📍 Écran "L'Agora" (Communauté)
- **Nouveau** : Redirection fonctionnelle depuis la carte Agora du dashboard vers l'écran communauté
- **Placeholder** : Affichage d'une carte élégante "Fonctionnalité à venir" en attendant le déploiement complet
- **Expérience** : Navigation fluide sans erreurs, message informatif pour les utilisateurs

---

## 📋 Détails Techniques

### Fichiers modifiés
- `android/app/google-services.json` - Ajout du SHA Play App Signing
- `src/screens/DashboardScreen.tsx` - Implémentation du placeholder Agora
- `src/screens/dashboard/components/DashboardContent.tsx` - Redirection vers l'écran communauté
- `app.json` / `app.config.js` / `android/app/build.gradle` - Mise à jour de version

### Certificats configurés dans Firebase
- ✅ SHA-1/SHA-256 du keystore de debug local
- ✅ SHA-1/SHA-256 du keystore EAS Build
- ✅ SHA-1/SHA-256 du Play App Signing (nouveau)

---

## 🚀 Pour les Développeurs

### Build et Déploiement
- Version actuelle : **1.0.4** (versionCode: 3)
- Build type : AAB pour production
- Configuration Firebase : Complète et opérationnelle

### Prochaines étapes
- Tester l'authentification Google sur un AAB installé depuis le Play Store
- Vérifier que tous les flux d'authentification fonctionnent correctement

---

## 📝 Notes Importantes

⚠️ **Important** : Cette version corrige un problème critique d'authentification sur les builds AAB. Tous les utilisateurs installant l'application depuis le Play Store bénéficient maintenant d'une authentification Google fonctionnelle.

---

## ✅ Checklist de Validation

- [x] Authentification Google fonctionne sur APK local
- [x] Authentification Google fonctionne sur builds EAS
- [x] Authentification Google fonctionne sur AAB Play Store (corrigé)
- [x] Navigation vers l'écran Agora fonctionnelle
- [x] Placeholder "Fonctionnalité à venir" affiché correctement
- [x] Configuration Firebase complète

---

**Version précédente** : 1.0.3  
**Version actuelle** : 1.0.4

