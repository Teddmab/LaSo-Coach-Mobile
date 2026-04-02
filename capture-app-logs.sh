#!/bin/bash
# Script complet pour capturer les logs de l'app pendant les tests

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Capture des logs Android pour LaSo Coach${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Vérifier que adb est installé
if ! command -v adb &> /dev/null; then
    echo -e "${RED}❌ ADB n'est pas installé ou n'est pas dans le PATH${NC}"
    echo "   Installez Android SDK Platform Tools"
    exit 1
fi

# Vérifier qu'un appareil est connecté
echo -e "${YELLOW}🔍 Vérification de la connexion...${NC}"
if ! adb devices | grep -q "device$"; then
    echo -e "${RED}❌ Aucun appareil Android détecté !${NC}"
    echo ""
    echo "   Étapes à suivre :"
    echo "   1. Connectez votre appareil via USB"
    echo "   2. Activez le débogage USB dans les paramètres développeur"
    echo "   3. Autorisez le débogage USB sur l'appareil"
    echo "   4. Exécutez : adb devices"
    exit 1
fi

DEVICE=$(adb devices | grep "device$" | awk '{print $1}')
echo -e "${GREEN}✅ Appareil détecté : ${DEVICE}${NC}"
echo ""

# Créer le dossier logs s'il n'existe pas
mkdir -p logs

# Générer un timestamp pour le fichier de log
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="logs/app-logs-${TIMESTAMP}.txt"

# Effacer les anciens logs
echo -e "${YELLOW}🧹 Effacement des anciens logs...${NC}"
adb logcat -c
echo -e "${GREEN}✅ Logs effacés${NC}"
echo ""

# Demander le type de capture
echo -e "${BLUE}Choisissez le type de capture :${NC}"
echo "  1) Tous les logs (verbose)"
echo "  2) Erreurs et warnings uniquement (recommandé)"
echo "  3) Erreurs uniquement"
echo "  4) Logs de l'app uniquement (LaSo, React, Expo, Google)"
echo ""
read -p "Votre choix [1-4] (défaut: 2): " choice
choice=${choice:-2}

case $choice in
    1)
        FILTER=""
        echo -e "${YELLOW}📋 Mode : Tous les logs${NC}"
        ;;
    2)
        FILTER="*:W"
        echo -e "${YELLOW}📋 Mode : Erreurs et warnings${NC}"
        ;;
    3)
        FILTER="*:E"
        echo -e "${YELLOW}📋 Mode : Erreurs uniquement${NC}"
        ;;
    4)
        FILTER=""
        GREP_FILTER="grep -iE '(laso|react|expo|google|firebase|error|exception|crash)'"
        echo -e "${YELLOW}📋 Mode : Logs de l'app uniquement${NC}"
        ;;
    *)
        FILTER="*:W"
        echo -e "${YELLOW}📋 Mode par défaut : Erreurs et warnings${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📱 Capture des logs en cours...${NC}"
echo ""
echo "   Fichier de log : ${LOG_FILE}"
echo "   Appareil : ${DEVICE}"
echo ""
echo -e "${YELLOW}💡 Instructions :${NC}"
echo "   1. Lancez votre app sur l'appareil"
echo "   2. Testez la fonctionnalité (ex: connexion Google)"
echo "   3. Les logs seront capturés automatiquement"
echo "   4. Appuyez sur Ctrl+C pour arrêter la capture"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Capturer les logs avec timestamp
if [ -n "$GREP_FILTER" ]; then
    # Mode avec filtre grep
    adb logcat -v time $FILTER | grep -iE "(laso|react|expo|google|firebase|error|exception|crash|fatal)" --color=never | tee "${LOG_FILE}"
else
    # Mode normal
    if [ -n "$FILTER" ]; then
        adb logcat -v time $FILTER | tee "${LOG_FILE}"
    else
        adb logcat -v time | tee "${LOG_FILE}"
    fi
fi

