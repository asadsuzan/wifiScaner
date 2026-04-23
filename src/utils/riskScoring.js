import { getExpectedSignal, isKnownBSSID, isKnownSSID, isTrusted } from '../services/baselineStore';

/**
 * Risk Scoring Engine
 *
 * Takes the enriched network groups (from detector.js) and a baseline
 * snapshot, then assigns each network a numeric riskScore (0–100) and
 * a human-readable riskLevel.
 *
 * Scoring rules:
 *   High Impact
 *     Security mismatch (WPA2 vs Open)          → +40
 *     New BSSID for known SSID                   → +30
 *   Medium Impact
 *     Vendor/OUI mismatch                        → +20
 *     Strong signal anomaly (sudden high RSSI)    → +15
 *   Low Impact
 *     Channel conflict (same freq, >1 AP)         → +10
 *     Unknown / never-seen SSID                   → +5
 */

// ─── Helpers ────────────────────────────────────────────────────

const getOUI = (bssid) =>
  bssid ? bssid.split(':').slice(0, 3).join(':').toUpperCase() : '';

const getMACLastByte = (bssid) =>
  bssid ? parseInt(bssid.split(':').pop(), 16) : null;

const getRiskLevel = (score) => {
  if (score <= 30) return 'Low';
  if (score <= 60) return 'Medium';
  return 'High';
};

const getRiskColor = (score) => {
  if (score <= 30) return '#52c41a'; // green
  if (score <= 60) return '#faad14'; // amber
  return '#f5222d'; // red
};

// ─── Core Scoring ───────────────────────────────────────────────

/**
 * Scores a single network within its SSID group context.
 *
 * @param {object}   net           – the enriched network object
 * @param {object[]} group         – all networks sharing this SSID
 * @param {object}   baseline      – current baseline snapshot
 * @param {string[]} newBSSIDList  – BSSIDs flagged as new this scan
 * @returns {object} the network object augmented with riskScore, riskLevel, riskColor, reasons[]
 */
export const scoreNetwork = (net, group, baseline, newBSSIDList = []) => {
  let score = 0;
  const reasons = [];

  // ── Security Mismatch ──────────────────────────────────────
  if (group.length > 1) {
    const securities = new Set(group.map((n) => n.security));
    if (securities.size > 1) {
      score += 40;
      reasons.push('Security protocol mismatch detected');
    }
  }

  // ── New BSSID for Known SSID ───────────────────────────────
  const isNew = newBSSIDList.some(
    (b) => b.SSID === net.SSID && b.BSSID === net.BSSID
  );
  if (isNew && isKnownSSID(baseline, net.SSID)) {
    score += 30;
    reasons.push('New access point on known network');
  }

  // ── Vendor / OUI Mismatch ─────────────────────────────────
  if (group.length > 1) {
    const ouis = new Set(group.map((n) => getOUI(n.BSSID)));
    if (ouis.size > 1) {
      // Check sequential MACs (mesh mitigation)
      const lastBytes = group
        .map((n) => getMACLastByte(n.BSSID))
        .filter((b) => b !== null)
        .sort((a, b) => a - b);
      let isSequential = false;
      for (let i = 0; i < lastBytes.length - 1; i++) {
        if (lastBytes[i + 1] - lastBytes[i] <= 3) isSequential = true;
      }
      if (!isSequential) {
        score += 20;
        reasons.push('Hardware vendor mismatch');
      }
    }
  }

  // ── Strong Signal Anomaly ──────────────────────────────────
  const expectedSignal = getExpectedSignal(baseline, net.SSID, net.BSSID);
  if (expectedSignal !== null) {
    const diff = net.level - expectedSignal;
    // If signal jumped up by 20+ dBm compared to baseline, suspicious
    if (diff > 20) {
      score += 15;
      reasons.push(`Signal anomaly (+${diff} dBm vs baseline)`);
    }
  }

  // ── Channel Conflict ───────────────────────────────────────
  if (group.length > 1) {
    const freqs = new Set(group.map((n) => n.frequency));
    if (freqs.size === 1 && !freqs.has(0)) {
      score += 10;
      reasons.push('Same-channel conflict');
    }
  }

  // ── Unknown SSID ───────────────────────────────────────────
  if (!isKnownSSID(baseline, net.SSID)) {
    score += 5;
    reasons.push('Unknown network');
  }

  // ── Trust Reduction ────────────────────────────────────────
  // If the SSID is trusted and there are no major red flags, reduce score
  if (isTrusted(baseline, net.SSID) && score <= 15) {
    score = Math.max(0, score - 10);
  }

  // ── Clamp ──────────────────────────────────────────────────
  score = Math.min(100, Math.max(0, score));

  return {
    ...net,
    riskScore: score,
    riskLevel: getRiskLevel(score),
    riskColor: getRiskColor(score),
    reasons,
  };
};

// ─── Batch Scoring ──────────────────────────────────────────────

/**
 * Scores all networks from a scan.
 * @param {object[]} networks    – raw enriched networks from detector
 * @param {object}   baseline    – baseline snapshot
 * @param {string[]} newBSSIDs   – new BSSIDs flagged this scan
 * @returns {object[]} scored networks sorted by riskScore descending
 */
export const scoreAllNetworks = (networks, baseline, newBSSIDs = []) => {
  // Group by SSID for context-aware scoring
  const groups = {};
  networks.forEach((net) => {
    if (!net.SSID) return;
    if (!groups[net.SSID]) groups[net.SSID] = [];
    groups[net.SSID].push(net);
  });

  const scored = [];
  Object.values(groups).forEach((group) => {
    group.forEach((net) => {
      scored.push(scoreNetwork(net, group, baseline, newBSSIDs));
    });
  });

  // Sort: highest risk first
  scored.sort((a, b) => b.riskScore - a.riskScore);
  return scored;
};

export { getRiskLevel, getRiskColor };
