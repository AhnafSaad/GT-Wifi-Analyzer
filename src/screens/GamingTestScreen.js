import AppHeader from "../components/AppHeader";
import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card, StatusTag } from "../components/Bits";
import { PING_THRESHOLDS, SERVERS, pingLevel } from "../constants/gameservers";
import { T } from "../constants/translations";
import { tr, useLanguage } from "../context/LanguageContext";
import { COLORS, FONT, RADIUS, SHADOW, SPACING, statusColors } from "../theme";
import { singlePing } from "../utils/ping";

// src/screens/GamingTestScreen.js

// প্রতি কত মিলিসেকেন্ড পরপর পিং রিফ্রেশ হবে
const REFRESH_INTERVAL_MS = 5000;

const TAG_KEY = { green: 'smooth', yellow: 'playable', red: 'laggy' };

export default function GamingTestScreen() {
  const { language } = useLanguage();
  const t = (key) => tr(T[key], language);

  const [results, setResults] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null); // একবারে একটা এন্ট্রিই এক্সপ্যান্ড থাকবে
  const intervalRef = useRef(null);

  // ✅ প্রতিটা এন্ট্রির প্রতিটা IP-তে আসল ICMP ping — একসাথে (parallel) চালানো হয়,
  // মূল রো-তে average দেখানো হয়, আর প্রতিটা IP-এর individual রেজাল্টও সেভ থাকে
  // (ট্যাপ করলে expand হয়ে সেগুলো দেখানোর জন্য)। IP গুলো
  // src/constants/gameServers.js থেকে আসে — real সার্ভার IP বসাতে ওখানে যান।
  const refreshPings = async () => {
    const pinged = await Promise.all(
      SERVERS.map(async (s) => {
        const hostResults = await Promise.all(
          s.hosts.map(async (h) => {
            const r = await singlePing(h.ip);
            return { label: h.label, ip: h.ip, isDemo: h.isDemo, ok: r.ok, ms: r.ok ? r.ms : null };
          })
        );
        const okResults = hostResults.filter((r) => r.ok);
        const avgPing = okResults.length
          ? Math.round(okResults.reduce((sum, r) => sum + r.ms, 0) / okResults.length)
          : null;
        const anyDemo = s.hosts.some((h) => h.isDemo);
        return {
          ...s,
          ping: avgPing,
          reachableCount: okResults.length,
          totalHosts: s.hosts.length,
          hostResults,
          isDemo: anyDemo,
        };
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

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderRow = ({ item }) => {
    const hasReading = item.ping != null;
    const level = hasReading ? pingLevel(item.ping) : 'red';
    const c = statusColors(level);
    const isExpanded = expandedId === item.id;

    return (
      <Card style={styles.card}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(item.id)} style={styles.row}>
          <View style={[styles.logo, { backgroundColor: c.soft }]}>
            <Ionicons name={item.icon} size={20} color={c.main} />
          </View>
          <View style={styles.mid}>
            <View style={styles.nameRow}>
              <Text style={styles.gameName} numberOfLines={1}>{item.name}</Text>
              {item.isDemo && (
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>{t('demoIp')}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.ping, { color: c.main }]}>{hasReading ? `${item.ping} ms` : '—'}</Text>
            <Text style={styles.routeInfo}>{item.reachableCount}/{item.totalHosts} route reachable</Text>
          </View>
          {hasReading && <StatusTag level={level} text={t(TAG_KEY[level])} />}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.inkMuted}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.breakdown}>
            {item.hostResults.map((h) => {
              const hLevel = h.ok ? pingLevel(h.ms) : 'red';
              const hc = statusColors(hLevel);
              return (
                <View key={h.ip} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.dot, { backgroundColor: hc.main }]} />
                    <Text style={styles.breakdownLabel}>{h.label}</Text>
                    <Text style={styles.breakdownIp}>({h.ip})</Text>
                  </View>
                  <Text style={[styles.breakdownPing, { color: hc.main }]}>{h.ok ? `${h.ms} ms` : '—'}</Text>
                </View>
              );
            })}
          </View>
        )}
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

        {/* Threshold legend — কোন রেঞ্জে Smooth/Playable/Laggy ধরা হচ্ছে */}
        <View style={styles.thresholdRow}>
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdDot, { backgroundColor: statusColors('green').main }]} />
            <Text style={styles.thresholdText}>{t('smooth')} {'<'} {PING_THRESHOLDS.smooth.max}ms</Text>
          </View>
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdDot, { backgroundColor: statusColors('yellow').main }]} />
            <Text style={styles.thresholdText}>{t('playable')} {PING_THRESHOLDS.smooth.max}–{PING_THRESHOLDS.playable.max}ms</Text>
          </View>
          <View style={styles.thresholdItem}>
            <View style={[styles.thresholdDot, { backgroundColor: statusColors('red').main }]} />
            <Text style={styles.thresholdText}>{t('laggy')} {'>'} {PING_THRESHOLDS.playable.max}ms</Text>
          </View>
        </View>

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
  disclaimer: { fontSize: 10.5, color: COLORS.inkMuted, fontFamily: FONT.medium, marginBottom: SPACING.sm, lineHeight: 15 },

  thresholdRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    gap: 10,
  },
  thresholdItem: { flexDirection: 'row', alignItems: 'center', marginRight: 4 },
  thresholdDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  thresholdText: { fontSize: 10.5, fontFamily: FONT.medium, color: COLORS.inkSoft },

  card: { marginBottom: SPACING.md, padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  logo: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mid: { flex: 1, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  gameName: { fontSize: 13.5, fontFamily: FONT.semibold, color: COLORS.ink },
  demoBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: COLORS.yellowSoft,
    borderWidth: 1,
    borderColor: COLORS.yellowSoftBorder,
  },
  demoBadgeText: { fontSize: 9, fontFamily: FONT.bold, color: '#8a6d00' },
  ping: { fontSize: 13, fontFamily: FONT.extrabold },
  routeInfo: { fontSize: 10, fontFamily: FONT.medium, color: COLORS.inkMuted, marginTop: 2 },

  breakdown: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bg,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 8 },
  breakdownLabel: { fontSize: 12.5, fontFamily: FONT.medium, color: COLORS.ink },
  breakdownIp: { fontSize: 11, fontFamily: FONT.medium, color: COLORS.inkMuted, marginLeft: 5 },
  breakdownPing: { fontSize: 12.5, fontFamily: FONT.bold },
});