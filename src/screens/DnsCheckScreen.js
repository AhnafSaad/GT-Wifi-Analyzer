// src/screens/DnsCheckScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { Card, VerdictBadge } from '../components/Bits';
import { COLORS, SPACING, RADIUS, FONT, statusColors } from '../theme';
import { useLanguage, tr } from '../context/LanguageContext';
import { T } from '../constants/translations';

// প্রতি কত মিলিসেকেন্ড পরপর DNS চেক রিফ্রেশ হবে
const REFRESH_INTERVAL_MS = 6000;

// ঘুরিয়ে-ফিরিয়ে চেক করার জন্য কয়েকটা রিয়েল, সুপরিচিত ডোমেইন
const CHECK_DOMAINS = ['google.com', 'cloudflare.com', 'wikipedia.org', 'github.com'];

function dnsLevel(ms) { return ms < 80 ? 'green' : ms <= 200 ? 'yellow' : 'red'; }
const STATUS_KEY = { green: 'stable', yellow: 'slightlySlow', red: 'unstable' };

// ✅ Google-এর DNS-over-HTTPS (DoH) resolver-এ real HTTPS রিকোয়েস্ট পাঠিয়ে
// রাউন্ড-ট্রিপ টাইম মাপা হয় — কোনো Math.random() নেই।
async function measureDnsResolution() {
  const domain = CHECK_DOMAINS[Math.floor(Math.random() * CHECK_DOMAINS.length)];
  const start = Date.now();
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      headers: { accept: 'application/dns-json' },
    });
    await res.json();
    const ms = Date.now() - start;
    return { ok: true, ms, domain };
  } catch (err) {
    return { ok: false, ms: null, domain };
  }
}

export default function DnsCheckScreen() {
  const { language } = useLanguage();
  const t = (key) => tr(T[key], language);

  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  const refreshReading = async () => {
    const reading = await measureDnsResolution();
    if (reading.ok) setResult(reading);
    // ব্যর্থ হলে (নেট না থাকলে) আগের রেজাল্টই স্ক্রিনে থেকে যায়
  };

  // হেডারের রিলোড আইকন বা উপর থেকে টেনে (pull-to-refresh) — দুটোই এটা কল করে
  const handleManualRefresh = () => {
    setRefreshing(true);
    refreshReading().finally(() => setRefreshing(false));
  };

  // স্ক্রিন ওপেন হওয়ার সাথে সাথেই অটোমেটিক চেক শুরু হয়ে যায়,
  // কোনো বাটন চাপার দরকার নেই — প্রতি ৬ সেকেন্ড পরপর রিফ্রেশ হতে থাকে।
  useEffect(() => {
    refreshReading();
    intervalRef.current = setInterval(refreshReading, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const level = result ? dnsLevel(result.ms) : null;
  const c = result ? statusColors(level) : null;
  const needsSuggestion = level === 'yellow' || level === 'red';

  return (
    <View style={styles.screen}>
      <AppHeader title={t('dns')} icon="server-outline" onReload={handleManualRefresh} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleManualRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {result && (
          <>
            <Card style={styles.resultCard}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>{t('live')}</Text>
              </View>
              <Text style={styles.resultLabel}>{t('resolutionTime')}</Text>
              <Text style={[styles.resultValue, { color: c.main }]}>{result.ms} ms</Text>
              <VerdictBadge level={level} text={t(STATUS_KEY[level])} />

              <View style={styles.serverRow}>
                <Ionicons name="hardware-chip-outline" size={15} color={COLORS.inkMuted} />
                <Text style={styles.serverLabel}>{t('currentDns')}:</Text>
                <Text style={styles.serverValue}>dns.google ({result.domain})</Text>
              </View>
              <Text style={styles.disclaimer}>{t('dnsDisclaimer')}</Text>
            </Card>

            {needsSuggestion ? (
              <Card style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <View style={styles.bulbCircle}>
                    <Ionicons name="bulb" size={16} color={COLORS.primary} />
                  </View>
                  <Text style={styles.suggestionTitle}>{t('suggestionTitle')}</Text>
                </View>
                <Text style={styles.suggestionBody}>{t('suggestionBody')}</Text>
              </Card>
            ) : (
              <Card style={styles.okCard}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
                <Text style={styles.okText}>{t('workingWell')}</Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 100 },

  resultCard: { alignItems: 'center', paddingVertical: SPACING.xxl, marginTop: SPACING.lg, marginBottom: SPACING.lg },
  liveRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', position: 'absolute', top: SPACING.md, left: SPACING.md },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.red, marginRight: 5 },
  liveText: { fontSize: 10.5, fontFamily: FONT.bold, color: COLORS.red, letterSpacing: 0.5 },
  resultLabel: { fontSize: 13, color: COLORS.inkSoft, fontFamily: FONT.semibold, marginBottom: 6 },
  resultValue: { fontSize: 42, fontFamily: FONT.extrabold, marginBottom: 6 },

  serverRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' },
  serverLabel: { fontSize: 12, color: COLORS.inkSoft, marginLeft: 6, marginRight: 4, fontFamily: FONT.medium },
  serverValue: { fontSize: 12, color: COLORS.ink, fontFamily: FONT.bold },
  disclaimer: { fontSize: 10.5, color: COLORS.inkMuted, fontFamily: FONT.medium, marginTop: 12, textAlign: 'center', lineHeight: 15 },

  suggestionCard: { backgroundColor: COLORS.primarySoft, borderWidth: 1, borderColor: COLORS.primarySoftBorder },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bulbCircle: { width: 28, height: 28, borderRadius: RADIUS.sm, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  suggestionTitle: { fontSize: 14.5, fontFamily: FONT.bold, color: COLORS.primary },
  suggestionBody: { fontSize: 13, color: COLORS.ink, lineHeight: 20, fontFamily: FONT.medium },

  okCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.greenSoft, borderWidth: 1, borderColor: COLORS.greenSoftBorder },
  okText: { marginLeft: 9, fontSize: 13, color: COLORS.green, fontFamily: FONT.semibold, flex: 1, lineHeight: 19 },
});