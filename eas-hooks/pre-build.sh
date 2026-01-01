#!/bin/bash

# Hook EAS pre-build pour s'assurer que les icônes iOS personnalisées sont copiées
# avant le build
# Ce script s'exécute via eas-build-pre-install AVANT le prebuild

echo "🔧 [pre-build] ========================================"
echo "🔧 [pre-build] Starting pre-build hook..."
echo "🔧 [pre-build] Working directory: $(pwd)"
echo "🔧 [pre-build] FORCE_PREBUILD=${FORCE_PREBUILD:-false}"

# Sauvegarder les icônes personnalisées AVANT de supprimer le dossier ios
# Les sauvegarder dans le projet pour que le plugin puisse les restaurer
ICONS_BACKUP_DIR="./.icons-backup"
ICONS_SOURCE="ios/LasoCoach/Images.xcassets/AppIcon.appiconset"

if [ -d "$ICONS_SOURCE" ]; then
  echo "💾 [pre-build] Backing up custom icons before prebuild..."
  echo "💾 [pre-build] Source: $ICONS_SOURCE"
  mkdir -p "$ICONS_BACKUP_DIR"
  cp -r "$ICONS_SOURCE" "$ICONS_BACKUP_DIR/" 2>/dev/null || true
  if [ -d "$ICONS_BACKUP_DIR/AppIcon.appiconset" ]; then
    echo "✅ [pre-build] Icons backed up to $ICONS_BACKUP_DIR"
    ls -la "$ICONS_BACKUP_DIR/AppIcon.appiconset/" || true
  else
    echo "⚠️ [pre-build] Backup failed or incomplete"
  fi
else
  echo "⚠️ [pre-build] Icons source not found: $ICONS_SOURCE"
  echo "⚠️ [pre-build] This is OK if ios directory doesn't exist yet"
fi

# CRITIQUE: Forcer le prebuild en supprimant TOUJOURS le dossier ios si FORCE_PREBUILD est défini
# Cela garantit qu'EAS exécutera le prebuild au lieu de le sauter
if [ "${FORCE_PREBUILD:-false}" = "true" ]; then
  echo "🔄 [pre-build] FORCE_PREBUILD=true, removing ios directory to force prebuild..."
  if [ -d "ios" ]; then
    echo "🔄 [pre-build] ios directory exists, removing it..."
    rm -rf ios || {
      echo "❌ [pre-build] Failed to remove ios directory, but continuing..."
    }
    if [ ! -d "ios" ]; then
      echo "✅ [pre-build] ios directory successfully removed, prebuild will be forced"
    else
      echo "⚠️ [pre-build] ios directory still exists after removal attempt"
    fi
  else
    echo "ℹ️ [pre-build] ios directory doesn't exist, prebuild will run anyway"
  fi
else
  echo "⚠️ [pre-build] FORCE_PREBUILD not set or false, prebuild WILL BE SKIPPED"
  echo "⚠️ [pre-build] This means the plugin withPreserveIcons will NOT execute"
fi

# Note: Le plugin withPreserveIcons restaurera les icônes depuis .icons-backup après le prebuild
# et ajoutera CFBundleIconName dans Info.plist
# Le hook pre-build ne fait que sauvegarder les icônes et forcer le prebuild

echo "✅ [pre-build] Pre-build hook completed"
echo "🔧 [pre-build] ========================================"

