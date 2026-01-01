#!/bin/bash

# Script pour s'assurer que les icônes iOS sont incluses dans le bundle
# S'exécute pendant le build Xcode

echo "🔧 [Xcode Build Script] Ensuring app icons are included..."

ICONS_SOURCE="${SRCROOT}/LasoCoach/Images.xcassets/AppIcon.appiconset"
ICONS_DEST="${SRCROOT}/LasoCoach/Images.xcassets/AppIcon.appiconset"
INFO_PLIST="${SRCROOT}/LasoCoach/Info.plist"

if [ -d "$ICONS_SOURCE" ]; then
  echo "✅ Icons source found: $ICONS_SOURCE"
  # Copier toutes les icônes
  cp -f "$ICONS_SOURCE"/*.png "$ICONS_DEST/" 2>/dev/null || true
  cp -f "$ICONS_SOURCE/Contents.json" "$ICONS_DEST/" 2>/dev/null || true
  echo "✅ Icons copied to bundle"
else
  echo "⚠️ Icons source not found: $ICONS_SOURCE"
fi

# Vérifier CFBundleIconName dans Info.plist
if [ -f "$INFO_PLIST" ]; then
  if ! grep -q "CFBundleIconName" "$INFO_PLIST"; then
    echo "🔧 Adding CFBundleIconName to Info.plist"
    sed -i.bak '/<key>CFBundleVersion<\/key>/,/<\/string>/a\
    <key>CFBundleIconName</key>\
    <string>AppIcon</string>
' "$INFO_PLIST"
  fi
fi

echo "✅ [Xcode Build Script] Icon check completed"

