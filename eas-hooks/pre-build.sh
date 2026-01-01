#!/bin/bash

# Hook EAS pre-build pour s'assurer que les icônes iOS personnalisées sont copiées
# avant le build

echo "🔧 [pre-build] Starting pre-build hook..."

# Sauvegarder les icônes personnalisées AVANT de supprimer le dossier ios
# Les sauvegarder dans le projet pour que le plugin puisse les restaurer
ICONS_BACKUP_DIR="./.icons-backup"
if [ -d "ios/LasoCoach/Images.xcassets/AppIcon.appiconset" ]; then
  echo "💾 [pre-build] Backing up custom icons before prebuild..."
  mkdir -p "$ICONS_BACKUP_DIR"
  cp -r "ios/LasoCoach/Images.xcassets/AppIcon.appiconset" "$ICONS_BACKUP_DIR/" 2>/dev/null || true
  echo "✅ [pre-build] Icons backed up to $ICONS_BACKUP_DIR"
fi

# Forcer le prebuild en supprimant le dossier ios si FORCE_PREBUILD est défini
if [ "${FORCE_PREBUILD:-false}" = "true" ]; then
  echo "🔄 [pre-build] FORCE_PREBUILD=true, removing ios directory to force prebuild..."
  if [ -d "ios" ]; then
    rm -rf ios
    echo "✅ [pre-build] ios directory removed, prebuild will be forced"
  fi
fi

echo "🔧 [pre-build] Checking iOS icons..."

# Restaurer les icônes depuis la sauvegarde APRÈS le prebuild
# Le plugin withPreserveIcons restaurera les icônes depuis .icons-backup
IOS_ICONS_SOURCE="$ICONS_BACKUP_DIR/AppIcon.appiconset"
IOS_ICONS_DEST="ios/LasoCoach/Images.xcassets/AppIcon.appiconset"

# Attendre que le dossier ios soit recréé par le prebuild
if [ ! -d "ios/LasoCoach" ]; then
  echo "⏳ [pre-build] Waiting for prebuild to complete..."
  # Attendre jusqu'à 60 secondes que le dossier ios soit créé
  for i in {1..60}; do
    if [ -d "ios/LasoCoach" ]; then
      break
    fi
    sleep 1
  done
fi

if [ -d "$IOS_ICONS_SOURCE" ]; then
  echo "✅ [pre-build] Source icons directory found: $IOS_ICONS_SOURCE"
  
  # Vérifier que le dossier de destination existe
  if [ ! -d "$IOS_ICONS_DEST" ]; then
    echo "⚠️ [pre-build] Destination directory not found, creating it..."
    mkdir -p "$IOS_ICONS_DEST"
  fi
  
  # Copier toutes les icônes depuis la sauvegarde
  echo "📋 [pre-build] Restoring icon files from backup..."
  cp -f "$IOS_ICONS_SOURCE"/*.png "$IOS_ICONS_DEST/" 2>/dev/null || true
  cp -f "$IOS_ICONS_SOURCE/Contents.json" "$IOS_ICONS_DEST/" 2>/dev/null || true
  
  echo "✅ [pre-build] Icons restored successfully"
  
  # Vérifier que Contents.json existe
  if [ -f "$IOS_ICONS_DEST/Contents.json" ]; then
    echo "✅ [pre-build] Contents.json found"
  else
    echo "⚠️ [pre-build] Contents.json not found!"
  fi
else
  echo "⚠️ [pre-build] Source icons directory not found: $IOS_ICONS_SOURCE"
  # Essayer de trouver les icônes dans le repo original
  if [ -d "../ios/LasoCoach/Images.xcassets/AppIcon.appiconset" ]; then
    echo "🔄 [pre-build] Trying to restore from repo..."
    cp -f "../ios/LasoCoach/Images.xcassets/AppIcon.appiconset"/*.png "$IOS_ICONS_DEST/" 2>/dev/null || true
    cp -f "../ios/LasoCoach/Images.xcassets/AppIcon.appiconset/Contents.json" "$IOS_ICONS_DEST/" 2>/dev/null || true
  fi
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

