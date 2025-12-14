// IMPORTANT: Ne pas importer 'api' au niveau du module pour éviter le cycle de dépendances
// api.ts → firebaseAuthServiceNew.ts → deviceApi.ts → api.ts
import deviceInfoService from './deviceInfoService';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Service API pour gérer les informations de l'appareil
 * Endpoint sécurisé pour enregistrer/mettre à jour les informations de l'appareil
 */
class DeviceApi {
  /**
   * Lazy import de l'instance API pour éviter le cycle de dépendances
   */
  private getApi() {
    // Import dynamique au moment de l'utilisation (pas au chargement du module)
    return require('./api').default;
  }

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

      // Envoyer au backend via endpoint sécurisé
      // Format attendu par le backend : platform, manufacturer, modelName, osName, osVersion, etc.
      const api = this.getApi();
      const response = await api.post(API_CONFIG.endpoints.device.register, deviceInfo);

      
      return response.data;
    } catch (error) {
      // Ne pas bloquer l'authentification si l'enregistrement de l'appareil échoue
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
      const api = this.getApi();
      const response = await api.get(API_CONFIG.endpoints.device.list);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un appareil enregistré
   * 
   * @param {string} deviceId - ID de l'appareil à supprimer
   * @returns {Promise<Object>} Réponse de confirmation
   */
  async removeDevice(deviceId: string) {
    try {
      const api = this.getApi();
      const response = await api.delete(API_CONFIG.endpoints.device.remove(deviceId));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
const deviceApi = new DeviceApi();
export default deviceApi;

