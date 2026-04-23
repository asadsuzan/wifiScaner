import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RiskBar } from './RiskBar';

export const NetworkCard = ({ network }) => {
  const {
    SSID,
    BSSID,
    level,
    band,
    security,
    riskScore = 0,
    riskLevel = 'Low',
    riskColor = '#52c41a',
    reasons = [],
  } = network;

  const cardBorder =
    riskLevel === 'High'
      ? styles.cardHigh
      : riskLevel === 'Medium'
        ? styles.cardMedium
        : styles.cardLow;

  const badgeBg =
    riskLevel === 'High'
      ? styles.badgeHigh
      : riskLevel === 'Medium'
        ? styles.badgeMedium
        : styles.badgeLow;

  return (
    <View style={[styles.card, cardBorder]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.ssid} numberOfLines={1}>
          {SSID || 'Hidden Network'}
        </Text>
        <View style={[styles.badge, badgeBg]}>
          <Text style={styles.badgeText}>
            {riskLevel === 'High' ? '🚨 ' : riskLevel === 'Medium' ? '⚠️ ' : '✓ '}
            {riskLevel}
          </Text>
        </View>
      </View>

      {/* Risk Bar */}
      <RiskBar score={riskScore} color={riskColor} />
      <Text style={[styles.scoreLabel, { color: riskColor }]}>
        Risk: {riskScore}/100
      </Text>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.bssid}>BSSID: {BSSID}</Text>
        <Text style={styles.info}>
          Signal: {level} dBm  •  {band || '—'}  •  {security || '—'}
        </Text>
      </View>

      {/* Reasons */}
      {reasons.length > 0 && (
        <View style={styles.reasonsContainer}>
          {reasons.map((r, i) => (
            <Text key={i} style={styles.reasonText}>
              ⚠️ {r}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLow: {
    borderColor: '#b7eb8f',
    backgroundColor: '#f6ffed',
  },
  cardMedium: {
    borderColor: '#ffd591',
    backgroundColor: '#fff7e6',
  },
  cardHigh: {
    borderColor: '#ffa39e',
    backgroundColor: '#fff1f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ssid: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  badgeLow: {
    backgroundColor: '#52c41a',
  },
  badgeMedium: {
    backgroundColor: '#faad14',
  },
  badgeHigh: {
    backgroundColor: '#f5222d',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },
  details: {
    marginTop: 10,
    gap: 3,
  },
  bssid: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  info: {
    fontSize: 13,
    color: '#666',
  },
  reasonsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 2,
  },
  reasonText: {
    fontSize: 12,
    color: '#d46b08',
    fontWeight: '600',
  },
});
