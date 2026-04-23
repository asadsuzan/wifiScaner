const getBand = (freq) => {
  if (freq >= 2400 && freq <= 2500) return '2.4GHz';
  if (freq >= 4900 && freq <= 5900) return '5GHz';
  if (freq >= 5925 && freq <= 7125) return '6GHz';
  return 'Unknown';
};

const getSecurity = (capabilities) => {
  if (!capabilities) return 'Unknown';
  if (capabilities.includes('WPA3')) return 'WPA3';
  if (capabilities.includes('WPA2')) return 'WPA2';
  if (capabilities.includes('WPA')) return 'WPA';
  if (capabilities.includes('WEP')) return 'WEP';
  return 'Open';
};

/**
 * Enriches raw scan results with band and security info.
 * Filters out hidden / unknown SSIDs.
 * This is now the ONLY job of detector.js – scoring is handled by riskScoring.js
 */
export const enrichNetworks = (networks) => {
  return networks
    .filter((n) => n.SSID && n.SSID !== '<unknown ssid>')
    .map((network) => ({
      ...network,
      band: getBand(network.frequency),
      security: getSecurity(network.capabilities),
    }));
};

// Keep the legacy export for backward compat during transition, but it now
// just enriches without binary duplicate logic (scoring replaces it).
export const detectDuplicates = (networks) => {
  const enriched = enrichNetworks(networks);
  return {
    safeNetworks: enriched,
    duplicateNetworks: [],
  };
};
