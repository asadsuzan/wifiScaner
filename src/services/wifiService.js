import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { WifiScannerModule } = NativeModules;

export const requestWifiPermissions = async () => {
  if (Platform.OS !== 'android') return false;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

export const scanWifiNetworks = async () => {
  if (Platform.OS !== 'android') return [];

  const hasPermission = await requestWifiPermissions();
  if (!hasPermission) {
    console.warn('Location permission denied, cannot scan WiFi');
    return [];
  }

  try {
    const results = await WifiScannerModule.scanWifi();
    return results;
  } catch (error) {
    console.error('Error scanning wifi:', error);
    return [];
  }
};

export const testScan = async () => {
  try {
    const data = await WifiScannerModule.scanWifi();
    console.log("WiFi Scan Results:", data);
  } catch (e) {
    console.error("Scan failed:", e);
  }
};
