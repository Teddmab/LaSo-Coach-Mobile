#!/bin/bash

# Add product flavors to android/app/build.gradle to fix react-native-iap variant ambiguity
if [ -f "android/app/build.gradle" ]; then
  # Check if flavorDimensions already exists
  if ! grep -q "flavorDimensions" android/app/build.gradle; then
    # Find the android block and add flavorDimensions and productFlavors after defaultConfig
    sed -i '/defaultConfig {/,/}/ {
      /}/ a\
\
    flavorDimensions "store"\
\
    productFlavors {\
        play {\
            dimension "store"\
        }\
    }
    }' android/app/build.gradle
  fi
fi


