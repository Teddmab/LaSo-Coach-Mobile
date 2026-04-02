#!/bin/bash

# Hook EAS post-build pour s'assurer que les icônes iOS sont dans le bundle final
# S'exécute APRÈS la compilation, avant la création de l'IPA

echo "🔧 [post-build] Ensuring app icons are in the final bundle..."

# Chemin vers le bundle de l'app
APP_BUNDLE="${EXPO_BUILD_DIR}/ios/build/LasoCoach.app"
if [ ! -d "$APP_BUNDLE" ]; then
  # Essayer un autre chemin possible
  APP_BUNDLE=$(find "${EXPO_BUILD_DIR}/ios" -name "LasoCoach.app" -type d | head -1)
fi

if [ -d "$APP_BUNDLE" ]; then
  echo "✅ [post-build] Found app bundle: $APP_BUNDLE"
  
  # Chemin vers les icônes source
  ICONS_SOURCE="${EXPO_BUILD_DIR}/ios/LasoCoach/Images.xcassets/AppIcon.appiconset"
  if [ ! -d "$ICONS_SOURCE" ]; then
    # Essayer depuis le repo
    ICONS_SOURCE="${EXPO_BUILD_DIR}/../ios/LasoCoach/Images.xcassets/AppIcon.appiconset"
  fi
  
  if [ -d "$ICONS_SOURCE" ]; then
    echo "✅ [post-build] Found icons source: $ICONS_SOURCE"
    
    # Chemin vers les icônes dans le bundle
    ICONS_DEST="${APP_BUNDLE}/AppIcon.appiconset"
    if [ ! -d "$ICONS_DEST" ]; then
      ICONS_DEST="${APP_BUNDLE}/Assets.car"
      # Les icônes sont dans Assets.car, on doit les copier dans le bundle
      ICONS_DEST_DIR="${APP_BUNDLE}/AppIcon.appiconset"
      mkdir -p "$ICONS_DEST_DIR"
      echo "📁 [post-build] Created AppIcon.appiconset directory in bundle"
    fi
    
    # Copier les icônes
    echo "📋 [post-build] Copying icon files to bundle..."
    cp -f "$ICONS_SOURCE"/*.png "$ICONS_DEST_DIR/" 2>/dev/null || true
    cp -f "$ICONS_SOURCE/Contents.json" "$ICONS_DEST_DIR/" 2>/dev/null || true
    echo "✅ [post-build] Icons copied to bundle"
  else
    echo "⚠️ [post-build] Icons source not found: $ICONS_SOURCE"
  fi
  
  # Vérifier Info.plist dans le bundle
  INFO_PLIST="${APP_BUNDLE}/Info.plist"
  if [ -f "$INFO_PLIST" ]; then
    if ! grep -q "CFBundleIconName" "$INFO_PLIST"; then
      echo "🔧 [post-build] Adding CFBundleIconName to Info.plist in bundle"
      # Utiliser PlistBuddy pour ajouter CFBundleIconName
      /usr/libexec/PlistBuddy -c "Add :CFBundleIconName string AppIcon" "$INFO_PLIST" 2>/dev/null || \
      /usr/libexec/PlistBuddy -c "Set :CFBundleIconName AppIcon" "$INFO_PLIST" 2>/dev/null || true
      echo "✅ [post-build] CFBundleIconName added to Info.plist in bundle"
    else
      echo "✅ [post-build] CFBundleIconName already present in bundle Info.plist"
    fi
  else
    echo "⚠️ [post-build] Info.plist not found in bundle: $INFO_PLIST"
  fi
else
  echo "⚠️ [post-build] App bundle not found: $APP_BUNDLE"
fi

# Vérification Android : Vérifier si l'APK/AAB est généré
echo "🔍 [post-build] Checking for Android build artifacts..."
ANDROID_OUTPUT_DIR="${EXPO_BUILD_DIR}/android/app/build/outputs"
if [ -d "$ANDROID_OUTPUT_DIR" ]; then
  echo "✅ [post-build] Android output directory exists: $ANDROID_OUTPUT_DIR"
  
  # Chercher les APK
  APK_FILES=$(find "$ANDROID_OUTPUT_DIR" -name "*.apk" -type f 2>/dev/null)
  if [ -n "$APK_FILES" ]; then
    echo "✅ [post-build] Found APK files:"
    echo "$APK_FILES" | while read -r apk; do
      echo "   - $apk ($(du -h "$apk" | cut -f1))"
    done
  else
    echo "⚠️ [post-build] No APK files found in $ANDROID_OUTPUT_DIR"
    echo "🔍 [post-build] Searching in subdirectories..."
    find "$ANDROID_OUTPUT_DIR" -type d | head -10
  fi
  
  # Chercher les AAB
  AAB_FILES=$(find "$ANDROID_OUTPUT_DIR" -name "*.aab" -type f 2>/dev/null)
  if [ -n "$AAB_FILES" ]; then
    echo "✅ [post-build] Found AAB files:"
    echo "$AAB_FILES" | while read -r aab; do
      echo "   - $aab ($(du -h "$aab" | cut -f1))"
    done
  else
    echo "ℹ️ [post-build] No AAB files found (this is OK if building APK)"
  fi
else
  echo "⚠️ [post-build] Android output directory not found: $ANDROID_OUTPUT_DIR"
  echo "🔍 [post-build] Checking alternative paths..."
  if [ -d "${EXPO_BUILD_DIR}/android" ]; then
    find "${EXPO_BUILD_DIR}/android" -name "*.apk" -o -name "*.aab" 2>/dev/null | head -5
  fi
fi

echo "✅ [post-build] Post-build hook completed"

