#!/bin/bash

echo "🧹 === NETTOYAGE COMPLET DU CACHE ==="

# 1. Arrêter tous les processus Metro/Expo et libérer le port 8081
echo "1. Arrêt de Metro Bundler et Expo..."
pkill -9 -f "expo start" 2>/dev/null
pkill -9 -f "metro" 2>/dev/null
pkill -9 -f "node.*8081" 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
sleep 3

# 2. Nettoyer les caches
echo "2. Nettoyage des caches..."
rm -rf node_modules/.cache 2>/dev/null
rm -rf .expo 2>/dev/null
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/react-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null

# 3. Watchman (si installé)
if command -v watchman &> /dev/null; then
  echo "3. Nettoyage du cache Watchman..."
  watchman watch-del-all 2>/dev/null
else
  echo "3. Watchman non installé (ignoré)"
fi

# 4. Cache Metro
echo "4. Nettoyage du cache Metro..."
npx expo start --clear &
EXPO_PID=$!

# Attendre 2 secondes puis tuer Expo
sleep 2
kill $EXPO_PID 2>/dev/null

echo ""
echo "✅ Cache nettoyé !"
echo ""
echo "🚀 Démarrage d'Expo avec cache nettoyé..."
echo ""
echo "📱 Sur votre appareil :"
echo "   1. FERMEZ COMPLÈTEMENT l'application (swipe up)"
echo "   2. ROUVREZ l'application"
echo ""
echo "   OU"
echo ""
echo "   1. Secouez l'appareil"
echo "   2. Appuyez sur 'Reload'"
echo ""
echo "🔍 Vérifiez que ces logs apparaissent :"
echo "   - 📊 [LOAD DAY DATA] Structure progress reçue du backend"
echo "   - 🔄 [CompleteMealsBottomSheet] Mise à jour localCompletionData"
echo "   - 🔍 [CompleteMealsBottomSheet] Filtrage des repas"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter Expo"
echo ""

# Démarrer Expo avec cache nettoyé et tunnel
npx expo start --clear --tunnel
