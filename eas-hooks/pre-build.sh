#!/bin/bash

# Hook EAS pre-build pour s'assurer que les icônes iOS personnalisées sont copiées
# avant le build

echo "🔧 [pre-build] Checking iOS icons..."

IOS_ICONS_SOURCE="ios/LasoCoach/Images.xcassets/AppIcon.appiconset"
IOS_ICONS_DEST="ios/LasoCoach/Images.xcassets/AppIcon.appiconset"

if [ -d "$IOS_ICONS_SOURCE" ]; then
  echo "✅ [pre-build] Source icons directory found: $IOS_ICONS_SOURCE"
  
  # Vérifier que le dossier de destination existe
  if [ ! -d "$IOS_ICONS_DEST" ]; then
    echo "⚠️ [pre-build] Destination directory not found, creating it..."
    mkdir -p "$IOS_ICONS_DEST"
  fi
  
  # Copier toutes les icônes
  echo "📋 [pre-build] Copying icon files..."
  cp -v "$IOS_ICONS_SOURCE"/*.png "$IOS_ICONS_DEST/" 2>/dev/null || true
  cp -v "$IOS_ICONS_SOURCE/Contents.json" "$IOS_ICONS_DEST/" 2>/dev/null || true
  
  echo "✅ [pre-build] Icons copied successfully"
  
  # Vérifier que Contents.json existe
  if [ -f "$IOS_ICONS_DEST/Contents.json" ]; then
    echo "✅ [pre-build] Contents.json found"
  else
    echo "⚠️ [pre-build] Contents.json not found!"
  fi
else
  echo "⚠️ [pre-build] Source icons directory not found: $IOS_ICONS_SOURCE"
fi

# Vérifier que CFBundleIconName est dans Info.plist
INFO_PLIST="ios/LasoCoach/Info.plist"
if [ -f "$INFO_PLIST" ]; then
  if grep -q "CFBundleIconName" "$INFO_PLIST"; then
    echo "✅ [pre-build] CFBundleIconName found in Info.plist"
  else
    echo "⚠️ [pre-build] CFBundleIconName not found in Info.plist, adding it..."
    # Ajouter CFBundleIconName après CFBundleVersion
    sed -i.bak '/<key>CFBundleVersion<\/key>/,/<\/string>/a\
    <key>CFBundleIconName</key>\
    <string>AppIcon</string>
' "$INFO_PLIST"
    echo "✅ [pre-build] CFBundleIconName added to Info.plist"
  fi
else
  echo "⚠️ [pre-build] Info.plist not found: $INFO_PLIST"
fi

echo "✅ [pre-build] Pre-build hook completed"

