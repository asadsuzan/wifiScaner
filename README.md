# EvilDetector – WiFi Security Scanner 🛡️

A production-grade React Native Android app that detects **Evil Twin WiFi attacks** and suspicious networks using real-time heuristic analysis, baseline learning, and dynamic risk scoring.

> **Disclaimer:** This app provides heuristic risk analysis, not guaranteed threat detection. Always use a VPN on public WiFi and avoid entering sensitive data on unknown networks.

---

## ✨ Features

- **Native WiFi Scanning** – Custom Kotlin module using Android's `WifiManager` API
- **Baseline Learning** – Remembers trusted networks and detects anomalies over time
- **Risk Scoring (0–100)** – Dynamic scores based on multiple security heuristics
- **Smart Notifications** – Debounced alerts only for genuine threats
- **Onboarding Flow** – Explains Evil Twin attacks and how the app works
- **Production UI** – Color-coded risk levels, progress bars, status summary

---

## 🧠 How Detection Works

### Detection Pipeline

```
Raw Scan → Enrich (band/security) → Update Baseline → Score (0–100) → Alert
```

### Risk Scoring Rules

| Check | Points | Description |
|-------|--------|-------------|
| **Security Mismatch** | +40 | Same SSID but different encryption (e.g., WPA2 vs Open) – classic downgrade attack |
| **New BSSID on Known SSID** | +30 | A new access point appeared on a network you've seen before |
| **Vendor/OUI Mismatch** | +20 | MAC address vendors don't match across APs with the same name |
| **Signal Anomaly** | +15 | Signal strength jumped 20+ dBm compared to historical baseline |
| **Channel Conflict** | +10 | Multiple APs on the same channel causing interference |
| **Unknown SSID** | +5 | A network never seen before |

### Risk Levels

| Score | Level | Color | Meaning |
|-------|-------|-------|---------|
| 0–30 | **Low** | 🟢 Green | Safe – known or normal network |
| 31–60 | **Medium** | 🟡 Amber | Warning – review recommended |
| 61–100 | **High** | 🔴 Red | Threat – potential Evil Twin |

### Baseline Learning System

The app **learns your environment** over time:

- **New SSID** → Stored with first-seen timestamp
- **Known SSID, new BSSID** → Flagged as potential rogue AP (+30 risk)
- **5+ scans with no issues** → Network auto-trusts (reduces future scores)
- **Signal history** → Rolling average per BSSID to detect anomalies

### Evil Twin vs Mesh Network Detection

| Check | Legitimate Mesh | Potential Evil Twin |
|-------|----------------|-------------------|
| **BSSID Proximity** | MAC addresses are sequential (e.g., :56 and :57) | MACs are completely different |
| **Security Protocol** | Both use the same encryption | Twin uses downgraded security |
| **Channel Usage** | Different channels to avoid interference | Same channel to cause interference |
| **Vendor Match** | OUI (first 3 octets) matches | OUIs don't match |

---

## 🔔 Smart Notifications

Alerts trigger **only** when:
- `riskScore > 60` (High risk)
- OR a new BSSID appears on a known SSID

**Debounce:** Same alert won't repeat within 3 minutes to prevent spam.

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── _layout.tsx          # Expo Router root layout
│   └── index.tsx            # Entry point (onboarding → home)
├── components/
│   ├── NetworkCard.js       # Risk-scored network card with progress bar
│   ├── RiskBar.js           # Visual risk score bar
│   └── StatusSummary.js     # Overall threat summary
├── screens/
│   ├── HomeScreen.js        # Main scanner UI
│   └── OnboardingScreen.js  # First-launch walkthrough
├── services/
│   ├── baselineStore.js     # AsyncStorage baseline + history
│   ├── notification.js      # Debounced smart alerts
│   └── wifiService.js       # Native module bridge
└── utils/
    ├── detector.js           # Network enrichment (band/security)
    └── riskScoring.js        # 0–100 risk scoring engine
```

---

## 🛠️ Technical Details

- **Framework:** React Native + Expo (Dev Client)
- **Native Module:** Kotlin (`WifiScannerModule`)
- **Storage:** `@react-native-async-storage/async-storage`
- **Routing:** Expo Router (file-based)
- **Notifications:** `expo-notifications`

### Android Permissions

| Permission | Purpose |
|-----------|---------|
| `ACCESS_FINE_LOCATION` | Required by Android to access WiFi scan results |
| `NEARBY_WIFI_DEVICES` | Required on Android 13+ for WiFi awareness |
| `ACCESS_WIFI_STATE` | Read WiFi connection and scan data |

---

## 🚀 Development

> ⚠️ This app requires a **Development Build** (custom native code). It will **not** work in Expo Go.

### Install Dependencies

```bash
npm install
```

### Build & Run on Android Device

```bash
npx expo run:android
```

### Start Metro Bundler

```bash
npx expo start
```

---

## 📱 Play Store Info

**App Name:** EvilDetector – WiFi Security Scanner

**Short Description:**
Detect Evil Twin WiFi attacks with real-time scanning, baseline learning, and dynamic risk scoring.

**Long Description:**
EvilDetector is a WiFi security scanner that protects you from Evil Twin attacks — fake WiFi networks designed to steal your data. The app uses advanced heuristic analysis to detect suspicious networks by checking security protocols, hardware vendors, signal patterns, and channel usage. It learns your trusted networks over time and only alerts you when something is genuinely suspicious. Every network receives a dynamic risk score from 0 to 100, making it easy to understand your security at a glance. No data is collected or transmitted — all analysis happens locally on your device.

**Privacy:** All data stays on-device. No analytics, no tracking, no cloud.

---

## ⚠️ Limitations

- Android only (WiFi scanning APIs are not available on iOS)
- Location permission is required by Android — the app does not track your location
- Heuristic analysis may produce false positives in complex network environments
- The app cannot guarantee detection of all attack types
