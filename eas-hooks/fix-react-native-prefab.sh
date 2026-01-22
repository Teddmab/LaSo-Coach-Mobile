#!/bin/bash

# Script pour corriger l'erreur std::format dans les prefabs React Native
# Ce script doit être exécuté après que Gradle ait téléchargé les prefabs
# mais avant la compilation C++

echo "🔧 [fix-prefab] ========================================"
echo "🔧 [fix-prefab] Fixing std::format error in React Native prefabs..."

# Chercher le fichier graphicsConversions.h dans le cache Gradle
GRADLE_CACHE_DIR="${HOME}/.gradle/caches"
if [ ! -d "$GRADLE_CACHE_DIR" ]; then
  GRADLE_CACHE_DIR="/home/expo/.gradle/caches"
fi

if [ ! -d "$GRADLE_CACHE_DIR" ]; then
  echo "⚠️ [fix-prefab] Gradle cache directory not found"
  exit 0
fi

echo "🔍 [fix-prefab] Searching for graphicsConversions.h in: $GRADLE_CACHE_DIR"

# Chercher tous les fichiers graphicsConversions.h dans le cache
FOUND_FILES=$(find "$GRADLE_CACHE_DIR" -name "graphicsConversions.h" -type f 2>/dev/null)

if [ -z "$FOUND_FILES" ]; then
  echo "⚠️ [fix-prefab] graphicsConversions.h not found in cache (may not be downloaded yet)"
  exit 0
fi

FIXED_COUNT=0
for GRAPHICS_FILE in $FOUND_FILES; do
  echo "📄 [fix-prefab] Checking: $GRAPHICS_FILE"
  
  # Vérifier si le fichier contient std::format
  if grep -q 'std::format("{}%", dimension.value)' "$GRAPHICS_FILE" 2>/dev/null; then
    echo "🔧 [fix-prefab] Applying fix to: $GRAPHICS_FILE"
    
    # Créer une sauvegarde
    cp "$GRAPHICS_FILE" "${GRAPHICS_FILE}.backup" 2>/dev/null || true
    
    # Remplacer std::format par std::to_string + concaténation
    # Utiliser sed avec différentes options selon la disponibilité
    if sed --version >/dev/null 2>&1; then
      # GNU sed (Linux)
      sed -i 's/return std::format("{}%", dimension.value);/return std::to_string(dimension.value) + "%";/g' "$GRAPHICS_FILE" 2>/dev/null
    else
      # BSD sed (macOS)
      sed -i '' 's/return std::format("{}%", dimension.value);/return std::to_string(dimension.value) + "%";/g' "$GRAPHICS_FILE" 2>/dev/null
    fi
    
    # Vérifier que le remplacement a fonctionné
    if grep -q 'std::to_string(dimension.value) + "%"' "$GRAPHICS_FILE" 2>/dev/null; then
      echo "✅ [fix-prefab] Fix applied successfully to: $GRAPHICS_FILE"
      FIXED_COUNT=$((FIXED_COUNT + 1))
    else
      echo "⚠️ [fix-prefab] Fix may not have been applied to: $GRAPHICS_FILE"
    fi
  else
    echo "ℹ️ [fix-prefab] File already fixed or doesn't contain std::format: $GRAPHICS_FILE"
  fi
done

if [ $FIXED_COUNT -gt 0 ]; then
  echo "✅ [fix-prefab] Fixed $FIXED_COUNT file(s)"
else
  echo "ℹ️ [fix-prefab] No files needed fixing"
fi

echo "🔧 [fix-prefab] ========================================"

