#!/bin/bash

echo "🔍 Vérification de la configuration iOS avant build..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Vérifier que useGoogleAuthHybrid est utilisé
echo "1️⃣ Vérification de l'utilisation de useGoogleAuthHybrid..."
if grep -q "useGoogleAuthHybrid" src/screens/RegisterScreen.tsx && grep -q "useGoogleAuthHybrid" src/screens/LoginScreen.tsx; then
    echo -e "${GREEN}✅ useGoogleAuthHybrid utilisé dans RegisterScreen et LoginScreen${NC}"
else
    echo -e "${RED}❌ useGoogleAuthHybrid non trouvé dans les screens${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 2. Vérifier que expo-auth-session est installé
echo ""
echo "2️⃣ Vérification des dépendances..."
if grep -q "expo-auth-session" package.json && grep -q "expo-web-browser" package.json; then
    echo -e "${GREEN}✅ expo-auth-session et expo-web-browser installés${NC}"
else
    echo -e "${RED}❌ Dépendances manquantes${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 3. Vérifier la configuration Firebase
echo ""
echo "3️⃣ Vérification de la configuration Firebase..."
if grep -q "webClientId" app.json && grep -q "iosClientId" app.json; then
    echo -e "${GREEN}✅ Configuration Firebase présente${NC}"
    WEB_CLIENT_ID=$(grep -o '"webClientId": "[^"]*' app.json | cut -d'"' -f4)
    IOS_CLIENT_ID=$(grep -o '"iosClientId": "[^"]*' app.json | cut -d'"' -f4)
    echo "   Web Client ID: ${WEB_CLIENT_ID:0:30}..."
    echo "   iOS Client ID: ${IOS_CLIENT_ID:0:30}..."
else
    echo -e "${RED}❌ Configuration Firebase incomplète${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 4. Vérifier le bundleIdentifier
echo ""
echo "4️⃣ Vérification du Bundle Identifier..."
BUNDLE_ID=$(grep -o '"bundleIdentifier": "[^"]*' app.json | cut -d'"' -f4)
if [ "$BUNDLE_ID" = "com.afrotouch.lasocoach" ]; then
    echo -e "${GREEN}✅ Bundle Identifier correct: $BUNDLE_ID${NC}"
else
    echo -e "${YELLOW}⚠️ Bundle Identifier: $BUNDLE_ID${NC}"
fi

# 5. Vérifier le buildNumber
echo ""
echo "5️⃣ Vérification du Build Number..."
BUILD_NUMBER=$(grep -o '"buildNumber": "[^"]*' app.json | cut -d'"' -f4)
echo "   Build Number: $BUILD_NUMBER"

# 6. Vérifier les plugins
echo ""
echo "6️⃣ Vérification des plugins..."
if grep -q "withIOSCrashFix.js" app.json && grep -q "withFirebaseConfig.js" app.json && grep -q "expo-web-browser" app.json; then
    echo -e "${GREEN}✅ Plugins iOS configurés${NC}"
else
    echo -e "${RED}❌ Plugins manquants${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 7. Vérifier que les hooks existent
echo ""
echo "7️⃣ Vérification des hooks..."
if [ -f "src/hooks/useGoogleAuthHybrid.ts" ] && [ -f "src/hooks/useGoogleAuthExpo.ts" ] && [ -f "src/hooks/useGoogleAuth.ts" ]; then
    echo -e "${GREEN}✅ Tous les hooks sont présents${NC}"
else
    echo -e "${RED}❌ Hooks manquants${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 8. Vérifier les exports
echo ""
echo "8️⃣ Vérification des exports..."
if grep -q "export const useGoogleAuthHybrid" src/hooks/useGoogleAuthHybrid.ts && \
   grep -q "export const useGoogleAuthExpo" src/hooks/useGoogleAuthExpo.ts && \
   grep -q "export const useGoogleAuth" src/hooks/useGoogleAuth.ts; then
    echo -e "${GREEN}✅ Exports corrects${NC}"
else
    echo -e "${RED}❌ Exports incorrects${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Configuration iOS prête pour le build !${NC}"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "   1. npx expo prebuild --platform ios"
    echo "   2. npx expo run:ios"
    echo ""
    echo "🍎 Sur iOS, Google Sign-In utilisera WebView (pas de crash)"
    echo "🤖 Sur Android, Google Sign-In utilisera SDK natif"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) trouvée(s)${NC}"
    echo "Veuillez corriger les erreurs avant de builder"
    exit 1
fi

