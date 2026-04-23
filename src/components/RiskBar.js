import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Animated-feel risk bar.
 * Renders a coloured progress bar representing a 0–100 risk score.
 */
export const RiskBar = ({ score = 0, color = '#52c41a', height = 6 }) => {
  const clampedScore = Math.min(100, Math.max(0, score));

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedScore}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    borderRadius: 4,
  },
});
