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

# Note: Le plugin withPreserveIcons restaurera les icônes depuis .icons-backup après le prebuild
# et ajoutera CFBundleIconName dans Info.plist
# Le hook pre-build ne fait que sauvegarder les icônes et forcer le prebuild

echo "✅ [pre-build] Pre-build hook completed"

