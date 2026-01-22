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

# Sauvegarder GoogleService-Info.plist AVANT de supprimer le dossier ios
# Le copier dans firebase-config/ pour que le plugin withFirebaseConfig puisse le trouver
FIREBASE_CONFIG_DIR="./firebase-config"
FIREBASE_CONFIG_SOURCE="ios/LasoCoach/GoogleService-Info.plist"

if [ -f "$FIREBASE_CONFIG_SOURCE" ]; then
  echo "💾 [pre-build] Backing up GoogleService-Info.plist before prebuild..."
  echo "💾 [pre-build] Source: $FIREBASE_CONFIG_SOURCE"
  mkdir -p "$FIREBASE_CONFIG_DIR"
  cp "$FIREBASE_CONFIG_SOURCE" "$FIREBASE_CONFIG_DIR/GoogleService-Info.plist" 2>/dev/null || true
  if [ -f "$FIREBASE_CONFIG_DIR/GoogleService-Info.plist" ]; then
    echo "✅ [pre-build] GoogleService-Info.plist backed up to $FIREBASE_CONFIG_DIR"
    ls -la "$FIREBASE_CONFIG_DIR/GoogleService-Info.plist" || true
  else
    echo "⚠️ [pre-build] Firebase config backup failed"
  fi
else
  echo "⚠️ [pre-build] Firebase config source not found: $FIREBASE_CONFIG_SOURCE"
  echo "⚠️ [pre-build] This is OK if ios directory doesn't exist yet or file already in firebase-config/"
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

# Fix pour l'erreur std::format dans React Native prefabs (Android)
# Le build utilise les prefabs précompilés depuis le cache Gradle, pas les sources
# Il faut corriger les fichiers dans le cache après qu'ils soient téléchargés
if [ -d "$HOME/.gradle" ] || [ -d "/home/expo/.gradle" ]; then
  echo "🔧 [pre-build] Fixing std::format error in React Native prefabs..."
  
  # Chercher le fichier graphicsConversions.h dans le cache Gradle
  GRADLE_CACHE_DIR="${HOME}/.gradle/caches"
  if [ ! -d "$GRADLE_CACHE_DIR" ]; then
    GRADLE_CACHE_DIR="/home/expo/.gradle/caches"
  fi
  
  if [ -d "$GRADLE_CACHE_DIR" ]; then
    echo "🔍 [pre-build] Searching for graphicsConversions.h in Gradle cache..."
    GRAPHICS_FILE=$(find "$GRADLE_CACHE_DIR" -name "graphicsConversions.h" -type f 2>/dev/null | head -1)
    
    if [ -n "$GRAPHICS_FILE" ] && [ -f "$GRAPHICS_FILE" ]; then
      echo "✅ [pre-build] Found graphicsConversions.h: $GRAPHICS_FILE"
      
      # Vérifier si le fichier contient std::format
      if grep -q 'std::format("{}%", dimension.value)' "$GRAPHICS_FILE" 2>/dev/null; then
        echo "🔧 [pre-build] Applying fix: replacing std::format with std::to_string..."
        
        # Créer une sauvegarde
        cp "$GRAPHICS_FILE" "${GRAPHICS_FILE}.backup" 2>/dev/null || true
        
        # Remplacer std::format par std::to_string + concaténation
        sed -i 's/return std::format("{}%", dimension.value);/return std::to_string(dimension.value) + "%";/g' "$GRAPHICS_FILE" 2>/dev/null || \
        sed -i.bak 's/return std::format("{}%", dimension.value);/return std::to_string(dimension.value) + "%";/g' "$GRAPHICS_FILE" 2>/dev/null || true
        
        # Vérifier que le remplacement a fonctionné
        if grep -q 'std::to_string(dimension.value) + "%"' "$GRAPHICS_FILE" 2>/dev/null; then
          echo "✅ [pre-build] Fix applied successfully!"
        else
          echo "⚠️ [pre-build] Fix may not have been applied, but continuing..."
        fi
      else
        echo "ℹ️ [pre-build] File doesn't contain std::format, may already be fixed"
      fi
    else
      echo "⚠️ [pre-build] graphicsConversions.h not found in cache (will be fixed during build if needed)"
    fi
  else
    echo "⚠️ [pre-build] Gradle cache directory not found, will try during build"
  fi
fi

echo "✅ [pre-build] Pre-build hook completed"
echo "🔧 [pre-build] ========================================"

