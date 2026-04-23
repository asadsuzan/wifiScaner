import AsyncStorage from '@react-native-async-storage/async-storage';

const BASELINE_KEY = '@evildetector_baseline';
const SCAN_HISTORY_KEY = '@evildetector_scan_history';
const ONBOARDING_KEY = '@evildetector_onboarding_seen';
const MAX_SCAN_HISTORY = 20;

/**
 * Baseline entry structure:
 * {
 *   SSID: string,
 *   knownBSSIDs: string[],
 *   firstSeen: number (timestamp),
 *   lastSeen: number (timestamp),
 *   trusted: boolean,
 *   avgSignalLevels: { [bssid]: number },
 *   scanCount: number
 * }
 */

// ─── Load & Save ────────────────────────────────────────────────

export const loadBaseline = async () => {
  try {
    const raw = await AsyncStorage.getItem(BASELINE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to load baseline:', e);
    return {};
  }
};

const saveBaseline = async (baseline) => {
  try {
    await AsyncStorage.setItem(BASELINE_KEY, JSON.stringify(baseline));
  } catch (e) {
    console.warn('Failed to save baseline:', e);
  }
};

// ─── Update Baseline From Scan ──────────────────────────────────

/**
 * Updates the baseline with a fresh scan result.
 * Returns { baseline, newBSSIDs } where newBSSIDs is an array of
 * { SSID, BSSID } entries that appeared for the first time on a known SSID.
 */
export const updateBaseline = async (networks) => {
  const baseline = await loadBaseline();
  const now = Date.now();
  const newBSSIDs = [];

  networks.forEach((net) => {
    if (!net.SSID || net.SSID === '<unknown ssid>') return;

    const ssid = net.SSID;
    const bssid = net.BSSID;

    if (!baseline[ssid]) {
      // Brand new SSID – create entry
      baseline[ssid] = {
        SSID: ssid,
        knownBSSIDs: [bssid],
        firstSeen: now,
        lastSeen: now,
        trusted: false,
        avgSignalLevels: { [bssid]: net.level },
        scanCount: 1,
      };
    } else {
      const entry = baseline[ssid];
      entry.lastSeen = now;
      entry.scanCount = (entry.scanCount || 0) + 1;

      // After 5 scans with no issues, auto-trust
      if (entry.scanCount >= 5 && !entry.trusted) {
        entry.trusted = true;
      }

      if (!entry.knownBSSIDs.includes(bssid)) {
        // New BSSID for an existing SSID – flag it
        newBSSIDs.push({ SSID: ssid, BSSID: bssid });
        entry.knownBSSIDs.push(bssid);
      }

      // Rolling average signal level per BSSID
      if (!entry.avgSignalLevels) entry.avgSignalLevels = {};
      const prev = entry.avgSignalLevels[bssid];
      entry.avgSignalLevels[bssid] = prev
        ? Math.round((prev + net.level) / 2)
        : net.level;
    }
  });

  await saveBaseline(baseline);
  return { baseline, newBSSIDs };
};

// ─── Query Helpers ──────────────────────────────────────────────

export const isKnownSSID = (baseline, ssid) => !!baseline[ssid];

export const isKnownBSSID = (baseline, ssid, bssid) => {
  const entry = baseline[ssid];
  return entry ? entry.knownBSSIDs.includes(bssid) : false;
};

export const isTrusted = (baseline, ssid) => {
  const entry = baseline[ssid];
  return entry ? entry.trusted : false;
};

export const getExpectedSignal = (baseline, ssid, bssid) => {
  const entry = baseline[ssid];
  if (!entry || !entry.avgSignalLevels) return null;
  return entry.avgSignalLevels[bssid] || null;
};

// ─── Scan History ───────────────────────────────────────────────

export const saveScanHistory = async (scanResults) => {
  try {
    const raw = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];

    history.unshift({
      timestamp: Date.now(),
      networkCount: scanResults.length,
      networks: scanResults.map((n) => ({
        SSID: n.SSID,
        BSSID: n.BSSID,
        level: n.level,
      })),
    });

    // Keep only last N scans
    if (history.length > MAX_SCAN_HISTORY) {
      history.length = MAX_SCAN_HISTORY;
    }

    await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save scan history:', e);
  }
};

export const loadScanHistory = async () => {
  try {
    const raw = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load scan history:', e);
    return [];
  }
};

// ─── Onboarding ─────────────────────────────────────────────────

export const hasSeenOnboarding = async () => {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  } catch {
    return false;
  }
};

export const markOnboardingSeen = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (e) {
    console.warn('Failed to save onboarding state:', e);
  }
};

// ─── Reset (dev/debug) ─────────────────────────────────────────

export const resetAllData = async () => {
  await AsyncStorage.multiRemove([BASELINE_KEY, SCAN_HISTORY_KEY, ONBOARDING_KEY]);
};
