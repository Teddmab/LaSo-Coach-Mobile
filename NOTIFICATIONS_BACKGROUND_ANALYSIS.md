# 🔔 Analyse : Notifications en Arrière-plan - Problème Identifié

## 🚨 Problème Principal

**Les notifications ne sont pas visibles quand l'application est complètement fermée.**

Quand quelqu'un envoie un message, aucune notification n'apparaît. Il faut ouvrir l'application pour recevoir finalement une notification.

---

## 🔍 Analyse du Système Actuel

### **1. Architecture Actuelle**

Le système de notifications utilise **deux mécanismes** :

#### **A. WebSocket (Socket.IO) - Temps Réel**
- **Localisation** : `src/context/NotificationContext.tsx` → `initializeWebSocket()`
- **Fonctionnement** : Écoute les événements `notification` via Socket.IO
- **Problème** : ⚠️ **WebSocket ne fonctionne PAS quand l'app est fermée**
- **Quand ça marche** : Uniquement quand l'app est **ouverte** ou en **arrière-plan actif**

```typescript
// NotificationContext.tsx - ligne 162-202
const initializeWebSocket = (): void => {
  const socket = chatSocketService.getSocket();
  if (socket && socket.connected) {
    const unsubscribeFn = chatSocketService.onNotification((notification: any) => {
      handleNewNotification(notification);
    });
  }
}
```

#### **B. Expo Push Notifications - Push Native**
- **Localisation** : `src/context/NotificationContext.tsx` → `initializePushNotifications()`
- **Fonctionnement** : Obtient un token Expo Push Token
- **Problème** : ⚠️ **Le token n'est JAMAIS envoyé au backend** (TODO non implémenté)
- **Quand ça devrait marcher** : Quand l'app est **fermée** (notifications push natives)

```typescript
// NotificationContext.tsx - ligne 147-160
const registerPushToken = async (token: string): Promise<void> => {
  try {
    // TODO: Implement API call to register push token with your backend
    // Example:
    // await api.post('/notifications/register-token', { 
    //   token, 
    //   platform: Platform.OS,
    //   deviceId: await Device.getDeviceIdAsync()
    // });
  } catch (error: any) {
  }
};
```

---

## ⚠️ Problèmes Identifiés

### **Problème #1 : WebSocket Ne Fonctionne Pas Quand l'App Est Fermée**

**Explication** :
- WebSocket nécessite une **connexion TCP active**
- Quand l'app est fermée, le système d'exploitation **tue tous les processus**
- La connexion WebSocket est **fermée** et ne peut pas recevoir de messages
- **Résultat** : Aucune notification reçue quand l'app est fermée

**Code concerné** :
```typescript
// src/context/NotificationContext.tsx
// Ligne 162-202 : initializeWebSocket()
// Cette fonction ne peut fonctionner que si l'app est ouverte
```

### **Problème #2 : Push Token Non Enregistré au Backend**

**Explication** :
- Le code obtient un **Expo Push Token** (ligne 129)
- Le token est stocké localement dans AsyncStorage (ligne 135)
- **MAIS** : Le token n'est **jamais envoyé au backend** (ligne 150 - TODO)
- Le backend ne peut donc **pas envoyer de notifications push** car il ne connaît pas le token

**Code concerné** :
```typescript
// src/context/NotificationContext.tsx
// Ligne 147-160 : registerPushToken()
// TODO non implémenté - le token n'est jamais envoyé au backend
```

### **Problème #3 : Pas de Service de Notifications en Arrière-plan**

**Explication** :
- Expo Notifications peut recevoir des notifications push natives
- **MAIS** : Il faut configurer un **service de notifications en arrière-plan**
- Actuellement, seul le handler de notifications en **foreground** est configuré
- Pas de configuration pour les notifications en **background** ou **quitted**

**Code concerné** :
```typescript
// src/context/NotificationContext.tsx
// Ligne 36-48 : setNotificationHandler()
// Configure uniquement les notifications en foreground
```

### **Problème #4 : Backend Ne Peut Pas Envoyer de Notifications Push**

**Explication** :
- Le backend reçoit probablement les messages via Socket.IO
- **MAIS** : Pour envoyer des notifications push quand l'app est fermée, le backend doit :
  1. Connaître le **push token** de chaque utilisateur
  2. Utiliser l'**Expo Push API** pour envoyer les notifications
  3. Avoir un système qui détecte quand l'app est fermée et utilise push au lieu de WebSocket

**Actuellement** : Le backend ne peut pas faire ça car il n'a pas les tokens.

---

## 🔧 Solutions Nécessaires

### **Solution #1 : Implémenter l'Enregistrement du Push Token**

**Action** : Compléter la fonction `registerPushToken()` pour envoyer le token au backend

**Code à implémenter** :
```typescript
const registerPushToken = async (token: string): Promise<void> => {
  try {
    await api.post('/notifications/register-token', { 
      token, 
      platform: Platform.OS,
      deviceId: await Device.getDeviceIdAsync()
    });
  } catch (error: any) {
    console.error('Failed to register push token:', error);
  }
};
```

**Endpoint backend nécessaire** :
```
POST /api/v1/notifications/register-token
Body: {
  token: "ExponentPushToken[...]",
  platform: "ios" | "android",
  deviceId: "..."
}
```

### **Solution #2 : Configurer les Notifications en Arrière-plan**

**Action** : Ajouter un handler pour les notifications reçues quand l'app est fermée

**Code à ajouter** :
```typescript
// Dans NotificationContext.tsx
useEffect(() => {
  // Handle notifications received when app is in background or closed
  const subscription = Notifications.addNotificationReceivedListener(
    async (notification) => {
      // This will be called even when app is in background
      console.log('Notification received in background:', notification);
    }
  );

  return () => subscription.remove();
}, []);
```

### **Solution #3 : Backend Doit Envoyer des Notifications Push**

**Action** : Le backend doit être modifié pour :
1. **Stocker les push tokens** de chaque utilisateur
2. **Détecter quand envoyer via push** vs WebSocket
3. **Utiliser Expo Push API** pour envoyer les notifications

**Backend doit implémenter** :
```javascript
// Quand un message est envoyé
if (userAppIsClosed) {
  // Envoyer via Expo Push API
  await sendExpoPushNotification({
    to: userPushToken,
    title: "Nouveau message",
    body: messageContent,
    data: { chatId, messageId }
  });
} else {
  // Envoyer via WebSocket (comme actuellement)
  socket.to(`user:${userId}`).emit('notification', notification);
}
```

### **Solution #4 : Configurer les Permissions Android/iOS**

**Action** : Vérifier que les permissions sont correctement configurées

**Android** :
- ✅ Déjà configuré dans `AndroidManifest.xml` (ligne 16-19)
- ✅ Permissions de notifications présentes

**iOS** :
- ⚠️ Vérifier que les permissions sont demandées
- ⚠️ Vérifier la configuration dans `Info.plist` (si existe)

---

## 📋 Checklist de Correction

### **Côté Mobile (React Native)**

- [ ] **1. Implémenter `registerPushToken()`**
  - Envoyer le token au backend après l'obtention
  - Gérer les erreurs et retry si nécessaire
  - Mettre à jour le token si il change

- [ ] **2. Ajouter un handler pour les notifications en arrière-plan**
  - Écouter les notifications reçues quand l'app est fermée
  - Afficher les notifications même si l'app n'est pas ouverte

- [ ] **3. Gérer la réception de notifications push**
  - Quand l'app est ouverte : utiliser WebSocket (actuel)
  - Quand l'app est fermée : utiliser Push Notifications (à implémenter)

- [ ] **4. Tester les notifications push**
  - Tester avec l'app ouverte
  - Tester avec l'app en arrière-plan
  - Tester avec l'app complètement fermée

### **Côté Backend**

- [ ] **1. Créer l'endpoint `/notifications/register-token`**
  - Recevoir et stocker les push tokens
  - Associer les tokens aux utilisateurs
  - Gérer la mise à jour des tokens

- [ ] **2. Modifier le système d'envoi de notifications**
  - Détecter si l'utilisateur a l'app ouverte (via WebSocket)
  - Si ouverte : envoyer via WebSocket (actuel)
  - Si fermée : envoyer via Expo Push API

- [ ] **3. Intégrer Expo Push API**
  - Utiliser l'API Expo pour envoyer les notifications push
  - Gérer les erreurs (token invalide, etc.)
  - Logger les notifications envoyées

---

## 🔄 Flux Actuel vs Flux Nécessaire

### **Flux Actuel (Ne Fonctionne Pas Quand l'App Est Fermée)**

```
1. Message envoyé → Backend
2. Backend → WebSocket → NotificationContext
3. NotificationContext → showLocalNotification()
4. ❌ PROBLÈME : WebSocket ne fonctionne pas si l'app est fermée
```

### **Flux Nécessaire (Fonctionnera Même Si l'App Est Fermée)**

```
1. Message envoyé → Backend
2. Backend détecte : App fermée ?
   - OUI → Backend → Expo Push API → Notification Push Native
   - NON → Backend → WebSocket → NotificationContext (actuel)
3. Notification Push Native → Système d'exploitation → Notification visible
```

---

## 🎯 Conclusion

**Le problème principal** : Le système actuel utilise **uniquement WebSocket** pour les notifications, qui ne fonctionne **pas quand l'app est fermée**.

**La solution** : Implémenter un **système hybride** :
- **App ouverte** : WebSocket (actuel) ✅
- **App fermée** : Push Notifications natives (à implémenter) ❌

**Actions prioritaires** :
1. ✅ Implémenter `registerPushToken()` pour envoyer le token au backend
2. ✅ Modifier le backend pour stocker les tokens et envoyer des push notifications
3. ✅ Configurer les handlers de notifications en arrière-plan
4. ✅ Tester avec l'app complètement fermée

---

## 📚 Ressources

- **Expo Push Notifications** : https://docs.expo.dev/push-notifications/overview/
- **Expo Push API** : https://docs.expo.dev/push-notifications/sending-notifications/
- **Background Notifications** : https://docs.expo.dev/push-notifications/push-notifications-setup/

