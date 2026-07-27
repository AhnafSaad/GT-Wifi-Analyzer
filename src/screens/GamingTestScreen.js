// src/screens/GamingTestScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { Card, StatusTag } from '../components/Bits';
import { COLORS, SPACING, RADIUS, SHADOW, FONT, statusColors } from '../theme';
import { useLanguage, tr } from '../context/LanguageContext';
import { T } from '../constants/translations';
import { singlePing } from '../utils/ping';

// প্রতি কত মিলিসেকেন্ড পরপর পিং রিফ্রেশ হবে
const REFRESH_INTERVAL_MS = 5000;

// ⚠️ গেমের আসল সার্ভার IP পাবলিকলি জানা যায় না এবং বেশিরভাগ গেম সার্ভার সরাসরি
// ICMP ping ব্লক করে রাখে। তাই এখানে প্রতিটা গেমের জন্য একটা well-known পাবলিক
// রাউটিং পয়েন্টে (DNS/anycast) real ping করা হয় — এটা real নেটওয়ার্ক ডেটা,
// কিন্তু "সেই গেমের নিজস্ব সার্ভার"-এর ping না। এটা স্ক্রিনেও ছোট করে জানানো আছে।
const SERVERS = [
  { id: 'pubg', name: 'PUBG Mobile', icon: 'game-controller', host: '1.1.1.1' },
  { id: 'freefire', name: 'Free Fire', icon: 'flame', host: '8.8.8.8' },
  { id: 'codm', name: 'Call of Duty Mobile', icon: 'skull', host: '9.9.9.9' },
  { id: 'mlbb', name: 'Mobile Legends: Bang Bang', icon: 'shield', host: '8.8.4.4' },
  { id: 'valorant', name: 'Valorant', icon: 'aperture', host: '208.67.222.222' },
  { id: 'general', name: 'General Reference', icon: 'globe-outline', host: '1.0.0.1' },
];

function pingLevel(ms) { return ms < 40 ? 'green' : ms <= 90 ? 'yellow' : 'red'; }
const TAG_KEY = { green: 'smooth', yellow: 'playable', red: 'laggy' };

export default function GamingTestScreen() {
  const { language } = useLanguage();
  const t = (key) => tr(T[key], language);

  const [results, setResults] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);

  // ✅ প্রতিটা এন্ট্রির জন্য আসল ICMP ping — একসাথে (parallel) চালানো হয়
  // যাতে ৬টা সার্ভার চেক করতে ৬ গুণ সময় না লাগে।
  const refreshPings = async () => {
    const pinged = await Promise.all(
      SERVERS.map(async (s) => {
        const result = await singlePing(s.host);
        return { ...s, ping: result.ok ? result.ms : null };
      })
    );
    setResults(pinged);
  };

  // হেডারের রিলোড আইকন বা উপর থেকে টেনে (pull-to-refresh) — দুটোই এটা কল করে
  const handleManualRefresh = () => {
    setRefreshing(true);
    refreshPings().finally(() => setRefreshing(false));
  };

  // স্ক্রিন ওপেন হওয়ার সাথে সাথেই অটোমেটিক টেস্ট শুরু হয়ে যায়,
  // কোনো বাটন চাপার দরকার নেই — প্রতি ৫ সেকেন্ড পরপর রিফ্রেশ হতে থাকে।
  useEffect(() => {
    refreshPings();
    intervalRef.current = setInterval(refreshPings, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const renderRow = ({ item }) => {
    const hasReading = item.ping != null;
    const level = hasReading ? pingLevel(item.ping) : 'red';
    const c = statusColors(level);
    return (
      <Card style={styles.row}>
        <View style={[styles.logo, { backgroundColor: c.soft }]}>
          <Ionicons name={item.icon} size={20} color={c.main} />
        </View>
        <View style={styles.mid}>
          <Text style={styles.gameName} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.ping, { color: c.main }]}>{hasReading ? `${item.ping} ms` : '—'}</Text>
        </View>
        {hasReading && <StatusTag level={level} text={t(TAG_KEY[level])} />}
      </Card>
    );
  };

  return (
    <View style={styles.screen}>
      <AppHeader title={t('gaming')} icon="game-controller" onReload={handleManualRefresh} />
      <View style={styles.content}>
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t('live')}</Text>
        </View>
        <Text style={styles.disclaimer}>{t('gamingDisclaimer')}</Text>

        <FlatList
          data={results ?? []}
          keyExtractor={(i) => i.id}
          renderItem={renderRow}
          contentContainerStyle={{ paddingTop: SPACING.sm, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleManualRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: SPACING.lg },

  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.red, marginRight: 5 },
  liveText: { fontSize: 10.5, fontFamily: FONT.bold, color: COLORS.red, letterSpacing: 0.5 },
  disclaimer: { fontSize: 10.5, color: COLORS.inkMuted, fontFamily: FONT.medium, marginBottom: SPACING.md, lineHeight: 15 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.soft,
  },
  logo: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mid: { flex: 1, marginRight: 8 },
  gameName: { fontSize: 13.5, fontFamily: FONT.semibold, color: COLORS.ink, marginBottom: 2 },
  ping: { fontSize: 13, fontFamily: FONT.extrabold },
});