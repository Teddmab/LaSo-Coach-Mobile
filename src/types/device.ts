// Types pour les informations d'appareil

export type DevicePlatform = 'android' | 'ios';
export type DeviceType = 'PHONE' | 'TABLET' | 'DESKTOP' | 'TV' | 'UNKNOWN';
export type OSName = 'Android' | 'iOS';

export interface DeviceInfo {
  platform: DevicePlatform;
  platformVersion: string | number;
  manufacturer: string;
  modelName: string;
  deviceName: string;
  osName: OSName;
  osVersion: string;
  osBuildId: string | null;
  deviceType: DeviceType | null;
  isDevice: boolean;
  appVersion: string;
  appBuildNumber: string | null;
  androidId?: string | null;
  brand?: string | null;
  modelId?: string | null;
  deviceYearClass?: number | null;
  supportedCpuArchitectures?: string[] | null;
  collectedAt: string;
  error?: string;
}

export interface DeviceInfoForBackend {
  platform: DevicePlatform;
  platformVersion: string | number;
  manufacturer: string;
  modelName: string;
  deviceName: string;
  osName: OSName;
  osVersion: string;
  deviceType: DeviceType | null;
  isDevice: boolean;
  appVersion: string;
  appBuildNumber: string | null;
  brand?: string;
  modelId?: string;
  deviceYearClass?: number;
}

