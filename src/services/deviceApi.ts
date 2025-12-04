import api from './api';
import deviceInfoService from './deviceInfoService';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Service API pour gérer les informations de l'appareil
 * Endpoint sécurisé pour enregistrer/mettre à jour les informations de l'appareil
 */
class DeviceApi {
  /**
   * Enregistre ou met à jour les informations de l'appareil
   * Appelé automatiquement après chaque authentification réussie
   * 
   * @returns {Promise<Object>} Réponse du backend avec les informations de l'appareil enregistrées
   */
  async registerDevice() {
    try {
      // Récupérer les informations de l'appareil
      const deviceInfo = await deviceInfoService.getDeviceInfoForBackend();
      
      console.log('📱 [DeviceApi] Enregistrement des informations de l\'appareil...');
      console.log('📱 [DeviceApi] Device info to send:', {
        platform: deviceInfo.platform,
        manufacturer: deviceInfo.manufacturer,
        modelName: deviceInfo.modelName,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
        isDevice: deviceInfo.isDevice,
      });
      console.log('📱 [DeviceApi] Full payload:', JSON.stringify(deviceInfo, null, 2));

      // Envoyer au backend via endpoint sécurisé
      // Format attendu par le backend : platform, manufacturer, modelName, osName, osVersion, etc.
      const response = await api.post(API_CONFIG.endpoints.device.register, deviceInfo);

      console.log('✅ [DeviceApi] Appareil enregistré avec succès');
      
      return response.data;
    } catch (error) {
      // Ne pas bloquer l'authentification si l'enregistrement de l'appareil échoue
      console.warn('⚠️ [DeviceApi] Erreur lors de l\'enregistrement de l\'appareil:', error.message);
      // Retourner null pour indiquer que l'enregistrement a échoué mais ne pas bloquer le flux
      return null;
    }
  }

  /**
   * Liste tous les appareils enregistrés pour l'utilisateur actuel
   * 
   * @returns {Promise<Array>} Liste des appareils
   */
  async getDevices() {
    try {
      const response = await api.get(API_CONFIG.endpoints.device.list);
      return response.data;
    } catch (error) {
      console.error('❌ [DeviceApi] Erreur lors de la récupération des appareils:', error);
      throw error;
    }
  }

  /**
   * Supprime un appareil enregistré
   * 
   * @param {string} deviceId - ID de l'appareil à supprimer
   * @returns {Promise<Object>} Réponse de confirmation
   */
  async removeDevice(deviceId) {
    try {
      const response = await api.delete(API_CONFIG.endpoints.device.remove(deviceId));
      return response.data;
    } catch (error) {
      console.error('❌ [DeviceApi] Erreur lors de la suppression de l\'appareil:', error);
      throw error;
    }
  }
}

// Export singleton instance
const deviceApi = new DeviceApi();
export default deviceApi;

