// src/screens/NearbyNetworksScreen.js
// আশেপাশের WiFi network-গুলোর তালিকা — signal strength অনুযায়ী সাজানো।

import AppHeader from "../components/AppHeader";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, EmptyState } from "../components/Bits";
import { T } from "../constants/translations";
import useNearbyNetworks from "../hooks/useNearbyNetworks";
import { tr, useLanguage } from "../context/LanguageContext";
import { COLORS, FONT, SPACING } from "../theme";

function signalBars(level) {
  // level সাধারণত -30 (খুব শক্তিশালী) থেকে -90 (খুব দুর্বল) এর মধ্যে dBm
  if (level == null) return 1;
  if (level >= -55) return 4;
  if (level >= -67) return 3;
  if (level >= -80) return 2;
  return 1;
}

export default function NearbyNetworksScreen() {
  const { language } = useLanguage();
  const t = (key) => tr(T[key], language);

  const { networks, scanning, error, scan } = useNearbyNetworks();

  return (
    <View style={styles.screen}>
      <AppHeader title={t('nearbyNetworks')} icon="wifi-outline" onReload={scan} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wifi-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{t('nearbyNetworks')}</Text>
          </View>
          <Text style={styles.disclaimer}>{t('nearbyNetworksDisclaimer')}</Text>

          {scanning && <Text style={styles.scanningText}>{t('scanning')}</Text>}

          {networks.length > 0 && (
            <Text style={styles.countLabelStandalone}>
              {networks.length} {t('networksFound')}
            </Text>
          )}

          {networks.length > 0 ? (
            <View style={styles.networkList}>
              {networks.map((net, idx) => (
                <View key={`${net.BSSID}-${idx}`} style={styles.networkRow}>
                  <View style={styles.networkLeft}>
                    <Ionicons name="wifi" size={16} color={COLORS.inkSoft} />
                    <Text style={styles.networkSsid} numberOfLines={1}>
                      {net.SSID?.trim() || '(hidden network)'}
                    </Text>
                  </View>
                  <View style={styles.signalBars}>
                    {[1, 2, 3, 4].map((bar) => (
                      <View
                        key={bar}
                        style={[
                          styles.bar,
                          { height: 4 + bar * 3 },
                          bar <= signalBars(net.level) ? styles.barActive : styles.barInactive,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            !scanning && <EmptyState icon="wifi-outline" text={t('tapToScanNetworks')} />
          )}

          {error === 'PERMISSION_DENIED' && (
            <Text style={styles.errorText}>{t('locationPermissionNeeded')}</Text>
          )}
          {error && error !== 'PERMISSION_DENIED' && (
            <Text style={styles.errorText}>{t('scanLimitReached')}</Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  sectionCard: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontFamily: FONT.bold, color: COLORS.ink, marginLeft: 8 },
  disclaimer: { fontSize: 12, color: COLORS.inkMuted, fontFamily: FONT.medium, lineHeight: 17, marginBottom: 6 },
  countLabelStandalone: { fontSize: 12.5, color: COLORS.inkSoft, fontFamily: FONT.semibold, marginBottom: 10 },
  scanningText: { fontSize: 12, color: COLORS.primary, fontFamily: FONT.semibold, marginBottom: 8 },
  errorText: { color: COLORS.red, fontFamily: FONT.medium, fontSize: 12.5, textAlign: 'center', marginTop: SPACING.md },
  networkList: { marginTop: 4 },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  networkLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  networkSsid: { fontSize: 13.5, color: COLORS.ink, fontFamily: FONT.medium, marginLeft: 8, flexShrink: 1 },
  signalBars: { flexDirection: 'row', alignItems: 'flex-end' },
  bar: { width: 4, borderRadius: 2, marginLeft: 2 },
  barActive: { backgroundColor: COLORS.primary },
  barInactive: { backgroundColor: COLORS.border },
});
