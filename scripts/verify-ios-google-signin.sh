#!/bin/bash

# Script de vérification pour Google Sign-In iOS
# Vérifie que le REVERSED_CLIENT_ID est présent dans Info.plist

echo "🔍 Vérification de la configuration Google Sign-In iOS..."

# Vérifier que le dossier ios existe
if [ ! -d "ios" ]; then
    echo "❌ Le dossier ios/ n'existe pas."
    echo "💡 Exécutez: npx expo prebuild --platform ios"
    exit 1
fi

# Chemin vers Info.plist
INFO_PLIST="ios/LasoCoach/Info.plist"

if [ ! -f "$INFO_PLIST" ]; then
    echo "❌ Info.plist introuvable: $INFO_PLIST"
    echo "💡 Exécutez: npx expo prebuild --platform ios"
    exit 1
fi

# REVERSED_CLIENT_ID attendu
REVERSED_CLIENT_ID="com.googleusercontent.apps.855620848279-2cjfq731f6f8ts6fmicqg2ieumssvcl9"

echo "📋 REVERSED_CLIENT_ID attendu: $REVERSED_CLIENT_ID"
echo ""

# Vérifier si REVERSED_CLIENT_ID est dans Info.plist
if grep -q "$REVERSED_CLIENT_ID" "$INFO_PLIST"; then
    echo "✅ REVERSED_CLIENT_ID trouvé dans Info.plist"
else
    echo "❌ REVERSED_CLIENT_ID NON TROUVÉ dans Info.plist"
    echo ""
    echo "💡 Solutions:"
    echo "   1. Exécutez: rm -rf ios/ && npx expo prebuild --platform ios"
    echo "   2. Vérifiez que les plugins sont correctement configurés dans app.json"
    echo "   3. Vérifiez que withIOSCrashFix.js et withFirebaseConfig.js sont dans plugins/"
    exit 1
fi

# Vérifier CFBundleURLSchemes
echo ""
echo "📋 Vérification des CFBundleURLSchemes..."
if grep -A 10 "CFBundleURLSchemes" "$INFO_PLIST" | grep -q "$REVERSED_CLIENT_ID"; then
    echo "✅ REVERSED_CLIENT_ID présent dans CFBundleURLSchemes"
else
    echo "❌ REVERSED_CLIENT_ID NON présent dans CFBundleURLSchemes"
    exit 1
fi

# Vérifier GoogleService-Info.plist
echo ""
echo "📋 Vérification de GoogleService-Info.plist..."
GOOGLE_SERVICE_PLIST="ios/LasoCoach/GoogleService-Info.plist"
if [ -f "$GOOGLE_SERVICE_PLIST" ]; then
    echo "✅ GoogleService-Info.plist trouvé"
    if grep -q "$REVERSED_CLIENT_ID" "$GOOGLE_SERVICE_PLIST"; then
        echo "✅ REVERSED_CLIENT_ID présent dans GoogleService-Info.plist"
    else
        echo "⚠️ REVERSED_CLIENT_ID non trouvé dans GoogleService-Info.plist"
    fi
else
    echo "⚠️ GoogleService-Info.plist non trouvé: $GOOGLE_SERVICE_PLIST"
    echo "💡 Vérifiez que withFirebaseConfig.js copie correctement le fichier"
fi

echo ""
echo "✅ Vérification terminée avec succès!"
echo ""
echo "📝 Pour tester:"
echo "   npx expo run:ios"

