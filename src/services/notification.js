import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Setup ──────────────────────────────────────────────────────

export const setupNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('wifi-alerts', {
      name: 'WiFi Security Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

// ─── Debounce State ─────────────────────────────────────────────

const lastNotifiedAt = {}; // { key: timestamp }
const DEBOUNCE_MS = 3 * 60 * 1000; // 3 minutes

const canNotify = (key) => {
  const last = lastNotifiedAt[key];
  if (!last) return true;
  return Date.now() - last > DEBOUNCE_MS;
};

const markNotified = (key) => {
  lastNotifiedAt[key] = Date.now();
};

// ─── Smart Alert ────────────────────────────────────────────────

/**
 * Sends a security alert notification.
 * Debounced per SSID to prevent spam.
 *
 * @param {string} ssid       – network name
 * @param {string} reason     – why it was flagged
 * @param {string} riskLevel  – "Low" | "Medium" | "High"
 * @param {number} riskScore  – 0–100
 */
export const sendSecurityAlert = async (ssid, reason, riskLevel, riskScore) => {
  const key = `${ssid}_${reason}`;
  if (!canNotify(key)) return;

  const emoji = riskLevel === 'High' ? '🚨' : '⚠️';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `WiFi Security Alert ${emoji}`,
      body: `${ssid}: ${reason} (Risk: ${riskLevel} – ${riskScore}/100)`,
      data: { ssid, reason, riskLevel, riskScore },
    },
    trigger: null,
  });

  markNotified(key);
};

/**
 * Processes scored networks and triggers notifications for high-risk items.
 * Only notifies when riskScore > 60 OR when a new BSSID appears.
 */
export const processAlerts = (scoredNetworks, newBSSIDs = []) => {
  // High risk networks
  scoredNetworks.forEach((net) => {
    if (net.riskScore > 60) {
      const reason = net.reasons?.[0] || 'Suspicious activity';
      sendSecurityAlert(net.SSID, reason, net.riskLevel, net.riskScore);
    }
  });

  // New BSSID alerts
  newBSSIDs.forEach(({ SSID, BSSID }) => {
    const reason = `New access point detected (${BSSID})`;
    sendSecurityAlert(SSID, reason, 'Medium', 30);
  });
};

// Legacy export for backward compat
export const sendDuplicateAlert = async (ssid) => {
  await sendSecurityAlert(ssid, 'Duplicate network detected', 'Medium', 50);
};
