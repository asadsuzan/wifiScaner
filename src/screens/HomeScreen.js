import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NetworkCard } from '../components/NetworkCard';
import { StatusSummary } from '../components/StatusSummary';
import {
  loadBaseline,
  saveScanHistory,
  updateBaseline,
} from '../services/baselineStore';
import { processAlerts, setupNotifications } from '../services/notification';
import { scanWifiNetworks } from '../services/wifiService';
import { enrichNetworks } from '../utils/detector';
import { scoreAllNetworks } from '../utils/riskScoring';

const SCAN_INTERVAL_MS = 25000;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'high', label: '🔴 High' },
  { key: 'medium', label: '🟡 Medium' },
  { key: 'low', label: '🟢 Safe' },
];

const SORT_OPTIONS = [
  { key: 'risk_desc', label: 'Risk ↓' },
  { key: 'risk_asc', label: 'Risk ↑' },
  { key: 'signal_desc', label: 'Signal ↓' },
  { key: 'signal_asc', label: 'Signal ↑' },
  { key: 'name_asc', label: 'Name A-Z' },
];

export default function HomeScreen() {
  const [networks, setNetworks] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('risk_desc');
  const timerRef = useRef(null);

  // ── Setup ──────────────────────────────────────────────────
  useEffect(() => {
    setupNotifications();
  }, []);

  // ── Auto-scan loop ─────────────────────────────────────────
  useEffect(() => {
    if (autoScan) {
      handleScan();
      timerRef.current = setInterval(handleScan, SCAN_INTERVAL_MS);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoScan]);

  // ── Scan Handler ───────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      const rawResults = await scanWifiNetworks();
      if (!rawResults || rawResults.length === 0) {
        setIsScanning(false);
        return;
      }

      const enriched = enrichNetworks(rawResults);
      const { baseline, newBSSIDs } = await updateBaseline(enriched);
      const scored = scoreAllNetworks(enriched, baseline, newBSSIDs);
      await saveScanHistory(scored);
      processAlerts(scored, newBSSIDs);

      setNetworks(scored);
      setLastScanTime(new Date());
      setScanCount((prev) => prev + 1);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  // ── Filter + Sort (memoized) ───────────────────────────────
  const displayedNetworks = useMemo(() => {
    // Filter
    let filtered = networks;
    if (activeFilter === 'high') {
      filtered = networks.filter((n) => n.riskLevel === 'High');
    } else if (activeFilter === 'medium') {
      filtered = networks.filter((n) => n.riskLevel === 'Medium');
    } else if (activeFilter === 'low') {
      filtered = networks.filter((n) => n.riskLevel === 'Low');
    }

    // Sort
    const sorted = [...filtered];
    switch (activeSort) {
      case 'risk_desc':
        sorted.sort((a, b) => b.riskScore - a.riskScore);
        break;
      case 'risk_asc':
        sorted.sort((a, b) => a.riskScore - b.riskScore);
        break;
      case 'signal_desc':
        sorted.sort((a, b) => b.level - a.level);
        break;
      case 'signal_asc':
        sorted.sort((a, b) => a.level - b.level);
        break;
      case 'name_asc':
        sorted.sort((a, b) => (a.SSID || '').localeCompare(b.SSID || ''));
        break;
    }

    return sorted;
  }, [networks, activeFilter, activeSort]);

  // ── Helpers ────────────────────────────────────────────────
  const formatTime = (date) => {
    if (!date) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getFilterCount = (key) => {
    if (key === 'all') return networks.length;
    if (key === 'high') return networks.filter((n) => n.riskLevel === 'High').length;
    if (key === 'medium') return networks.filter((n) => n.riskLevel === 'Medium').length;
    if (key === 'low') return networks.filter((n) => n.riskLevel === 'Low').length;
    return 0;
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>EvilDetector</Text>
        <Text style={styles.subtitle}>WiFi Security Scanner</Text>

        <View style={styles.controls}>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>Auto Scan</Text>
            <Switch
              value={autoScan}
              onValueChange={setAutoScan}
              trackColor={{ false: '#3f3f46', true: '#3b82f6' }}
              thumbColor={autoScan ? '#60a5fa' : '#a1a1aa'}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isScanning && styles.buttonDisabled]}
            onPress={handleScan}
            disabled={isScanning}
            activeOpacity={0.7}
          >
            {isScanning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Scan Now</Text>
            )}
          </TouchableOpacity>
        </View>

        {lastScanTime && (
          <Text style={styles.lastScan}>
            Last scan: {formatTime(lastScanTime)}  •  Scans: {scanCount}
          </Text>
        )}
      </View>

      {/* Status Summary */}
      <StatusSummary networks={networks} />

      {/* Filter Chips */}
      {networks.length > 0 && (
        <View style={styles.filterSortContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {FILTERS.map((f) => {
              const count = getFilterCount(f.key);
              const isActive = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setActiveFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {f.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.chipDivider} />

            {SORT_OPTIONS.map((s) => {
              const isActive = activeSort === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.chip, styles.sortChip, isActive && styles.chipActive]}
                  onPress={() => setActiveSort(s.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Network List */}
      <FlatList
        data={displayedNetworks}
        keyExtractor={(item) => item.BSSID || Math.random().toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <NetworkCard network={item} />}
        ListEmptyComponent={
          networks.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No Matches</Text>
              <Text style={styles.emptyText}>
                No networks match the current filter. Try selecting a different category.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyTitle}>No Networks Scanned</Text>
              <Text style={styles.emptyText}>
                Tap "Scan Now" or enable "Auto Scan" to start monitoring nearby WiFi networks.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleText: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  lastScan: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },

  // ── Filter & Sort Chips ──────────────────────────────────
  filterSortContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b',
  },
  sortChip: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#fff',
  },
  chipDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },

  // ── List ──────────────────────────────────────────────────
  list: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 15,
    lineHeight: 22,
  },
});
