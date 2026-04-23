import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Summary bar shown at the top of the home screen.
 * Shows total networks, safe/medium/high counts, and overall status.
 */
export const StatusSummary = ({ networks = [] }) => {
  const total = networks.length;
  const high = networks.filter((n) => n.riskLevel === 'High').length;
  const medium = networks.filter((n) => n.riskLevel === 'Medium').length;
  const low = total - high - medium;

  let overallStatus = 'All Clear';
  let overallColor = '#52c41a';
  let overallIcon = '🛡️';

  if (high > 0) {
    overallStatus = `${high} Threat${high > 1 ? 's' : ''} Detected`;
    overallColor = '#f5222d';
    overallIcon = '🚨';
  } else if (medium > 0) {
    overallStatus = `${medium} Warning${medium > 1 ? 's' : ''}`;
    overallColor = '#faad14';
    overallIcon = '⚠️';
  }

  if (total === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { borderLeftColor: overallColor }]}>
      <View style={styles.statusRow}>
        <Text style={styles.icon}>{overallIcon}</Text>
        <Text style={[styles.statusText, { color: overallColor }]}>
          {overallStatus}
        </Text>
      </View>

      <View style={styles.countsRow}>
        <View style={styles.countItem}>
          <View style={[styles.dot, { backgroundColor: '#52c41a' }]} />
          <Text style={styles.countText}>{low} Safe</Text>
        </View>
        <View style={styles.countItem}>
          <View style={[styles.dot, { backgroundColor: '#faad14' }]} />
          <Text style={styles.countText}>{medium} Medium</Text>
        </View>
        <View style={styles.countItem}>
          <View style={[styles.dot, { backgroundColor: '#f5222d' }]} />
          <Text style={styles.countText}>{high} High</Text>
        </View>
        <Text style={styles.totalText}>{total} total</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  countText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  totalText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 'auto',
  },
});
