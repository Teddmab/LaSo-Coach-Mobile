import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Service pour capturer les informations de l'appareil
 * Utilisé pour envoyer les informations du téléphone au backend lors de la connexion
 */
class DeviceInfoService {
  /**
   * Récupère toutes les informations de l'appareil
   * @returns {Promise<DeviceInfo>}
   */
  async getDeviceInfo() {
    try {
      const deviceInfo = {
        // Informations de base
        platform: Platform.OS, // 'android' | 'ios'
        platformVersion: Platform.Version, // Version Android (ex: 13) ou iOS
        
        // Informations du fabricant et modèle
        manufacturer: Device.manufacturer || 'Unknown', // 'Samsung', 'Google', 'Apple', etc.
        modelName: Device.modelName || 'Unknown', // 'SM-G991B', 'Pixel 7', 'iPhone 14 Pro', etc.
        deviceName: Device.deviceName || 'Unknown', // Nom complet de l'appareil
        
        // Informations système
        osName: Device.osName || Platform.OS, // 'Android' | 'iOS'
        osVersion: Device.osVersion || Platform.Version, // Version complète (ex: '13.0')
        osBuildId: Device.osBuildId || null, // Build ID du système
        
        // Informations de l'appareil
        // Device.deviceType can be null/undefined or an enum value - convert to string
        deviceType: Device.deviceType != null ? String(Device.deviceType) : null,
        isDevice: Device.isDevice, // true si c'est un appareil physique (pas un émulateur)
        
        // Informations de l'application
        appVersion: Constants.expoConfig?.version || (Constants.manifest as any)?.version || '1.0.0',
        appBuildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || (Constants.manifest as any)?.ios?.buildNumber || (Constants.manifest as any)?.android?.versionCode || null,
        
        // Informations supplémentaires Android
        ...(Platform.OS === 'android' && {
          androidId: await this._getAndroidId(),
          brand: Device.brand || null, // Marque (ex: 'samsung')
          modelId: Device.modelId || null, // ID du modèle
        }),
        
        // Informations supplémentaires iOS
        ...(Platform.OS === 'ios' && {
          deviceYearClass: Device.deviceYearClass || null, // Année de sortie de l'appareil
          supportedCpuArchitectures: Device.supportedCpuArchitectures || null,
        }),
        
        // Timestamp de la collecte
        collectedAt: new Date().toISOString(),
      };

      return deviceInfo;
    } catch (error) {
      // Retourner un objet minimal en cas d'erreur
      return {
        platform: Platform.OS,
        platformVersion: Platform.Version,
        manufacturer: 'Unknown',
        modelName: 'Unknown',
        deviceName: 'Unknown',
        osName: Platform.OS,
        osVersion: Platform.Version,
        isDevice: false,
        error: (error as any)?.message,
        collectedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Récupère l'Android ID (si disponible)
   * @private
   * @returns {Promise<string|null>}
   */
  async _getAndroidId() {
    try {
      // Note: expo-device ne fournit pas directement l'Android ID
      // Pour l'obtenir, il faudrait utiliser une librairie native comme react-native-device-info
      // Pour l'instant, on retourne null
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Formate les informations de l'appareil pour l'envoi au backend
   * Format attendu par le backend (POST /api/v1/devices/register)
   * @returns {Promise<Object>}
   */
  async getDeviceInfoForBackend() {
    const deviceInfo: any = await this.getDeviceInfo();
    
    // Construire le payload selon la spécification backend
    const payload: Record<string, any> = {
      platform: deviceInfo.platform,
      manufacturer: deviceInfo.manufacturer || 'Unknown',
      modelName: deviceInfo.modelName || 'Unknown',
      osName: deviceInfo.osName || deviceInfo.platform,
      osVersion: deviceInfo.osVersion || String(deviceInfo.platformVersion),
      isDevice: deviceInfo.isDevice !== undefined ? deviceInfo.isDevice : true,
      appVersion: deviceInfo.appVersion || '1.0.0',
    };
    
    // Champs optionnels - ne les ajouter que s'ils existent
    if (deviceInfo.platformVersion !== null && deviceInfo.platformVersion !== undefined) {
      payload.platformVersion = deviceInfo.platformVersion; // Peut être string ou number
    }
    
    if (deviceInfo.deviceName && deviceInfo.deviceName !== 'Unknown') {
      payload.deviceName = deviceInfo.deviceName;
    }
    
    if (deviceInfo.osBuildId) {
      payload.osBuildId = deviceInfo.osBuildId;
    }
    
    // deviceType : convertir en majuscules, défaut "PHONE"
    if (deviceInfo.deviceType) {
      payload.deviceType = String(deviceInfo.deviceType).toUpperCase();
    } else {
      payload.deviceType = 'PHONE'; // Défaut selon spécification backend
    }
    
    if (deviceInfo.appBuildNumber) {
      payload.appBuildNumber = deviceInfo.appBuildNumber;
    }
    
    // Ajouter les champs spécifiques Android
    if (deviceInfo.platform === 'android') {
      if (deviceInfo.brand) {
        payload.brand = deviceInfo.brand;
      }
      if (deviceInfo.modelId) {
        payload.modelId = deviceInfo.modelId;
      }
    }
    
    // Ajouter les champs spécifiques iOS
    if (deviceInfo.platform === 'ios') {
      if (deviceInfo.deviceYearClass) {
        payload.deviceYearClass = deviceInfo.deviceYearClass;
      }
    }
    
    // Retirer les champs undefined/null pour ne pas les envoyer
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null) {
        delete payload[key];
      }
    });
    
    return payload;
  }

  /**
   * Récupère un résumé textuel de l'appareil (pour logs/debug)
   * @returns {Promise<string>}
   */
  async getDeviceSummary() {
    const info = await this.getDeviceInfo();
    return `${info.manufacturer} ${info.modelName} (${info.osName} ${info.osVersion})`;
  }
}

// Export singleton instance
const deviceInfoService = new DeviceInfoService();
export default deviceInfoService;

