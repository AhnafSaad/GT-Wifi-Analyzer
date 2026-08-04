import AppHeader from "../components/AppHeader";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card, StatusTag } from "../components/Bits";
import { T } from "../constants/translations";
import { ConfigContext } from "../context/ConfigContext";
import { tr, useLanguage } from "../context/LanguageContext";
import { COLORS, FONT, RADIUS, SPACING, statusColors } from "../theme";
import { singlePing } from "../utils/ping";

// src/screens/GamingTestScreen.js

const REFRESH_INTERVAL_MS = 5000;
const TAG_KEY = { green: 'smooth', yellow: 'playable', red: 'laggy' };

// ডায়নামিক থ্রেশহোল্ড অনুযায়ী স্ট্যাটাস লেভেল (green / yellow / red) নির্ধারণ
const getHostStatusLevel = (ms, smoothMax = 40, playableMax = 90) => {
  if (ms == null) return 'red';
  if (ms <= smoothMax) return 'green';
  if (ms <= playableMax) return 'yellow';
  return 'red';
};

export default function GamingTestScreen() {
  const { language } = useLanguage();
  const t = (key) => tr(T[key], language);

  // ড্যাশবোর্ড থেকে লাইভ কনফিগ নেওয়া হচ্ছে
  const { config } = useContext(ConfigContext);

  const [results, setResults] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const intervalRef = useRef(null);
  const isFocused = useIsFocused(); // 🟢 অন্য ট্যাবে থাকলে ping loop বন্ধ রাখার জন্য

  // লাইভ সার্ভার ডেটা দিয়ে পিং টেস্ট পরিচালনা
  const refreshPings = async () => {
    const serversList = config?.servers || [];
    if (!serversList.length) {
      setResults([]);
      return;
    }

    const pinged = await Promise.all(
      serversList.map(async (s) => {
        const hostsList = s.hosts || [];
        const hostResults = await Promise.all(
          hostsList.map(async (h) => {
            // 🟢 আগে default 3000ms timeout ব্যবহার হতো — কোনো host unreachable
            // হলে প্রতিবার পুরো ৩ সেকেন্ড অপেক্ষা করতে হতো, আর ৫ সেকেন্ড পরপর
            // refresh হওয়ায় এটা স্লো/আটকে থাকার মতো লাগত। বাস্তবে ভালো game ping
            // সাধারণত কয়েকশো ms-এর মধ্যেই হয়, তাই 1.5s যথেষ্ট এবং অনেক দ্রুত fail detect করে।
            const r = await singlePing(h.ip, 1500);
            const ms = r.ok ? r.ms : null;
            const level = getHostStatusLevel(ms, h.smoothMax, h.playableMax);
            return {
              label: h.label,
              ip: h.ip,
              ok: r.ok,
              ms,
              level,
              smoothMax: h.smoothMax || 40,
              playableMax: h.playableMax || 90,
            };
          })
        );

        const okResults = hostResults.filter((r) => r.ok);
        // 🟢 আগে সব host-এর average দেখানো হতো (Free Fire-এ একটাই slow host থাকলেও
        // "smooth" এর বদলে সেটাই average টেনে নামিয়ে দিত)। এখন সবচেয়ে ভালো
        // (সবচেয়ে কম ms) route-টা দেখানো হয় — বাস্তবে গেমার যেভাবেই হোক best route-ই
        // ব্যবহার করবে, তাই এটাই বেশি অর্থবহ।
        const bestResult = okResults.length
          ? okResults.reduce((best, r) => (r.ms < best.ms ? r : best))
          : null;
        const bestPing = bestResult ? bestResult.ms : null;

        // সার্ভারের ওভারঅল status এখন best route-এর level অনুযায়ী (worst host আর ধরা হচ্ছে না)
        const overallLevel = bestResult ? bestResult.level : 'red';

        return {
          ...s,
          ping: bestPing,
          overallLevel,
          reachableCount: okResults.length,
          totalHosts: hostsList.length,
          hostResults,
        };
      })
    );
    setResults(pinged);
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    refreshPings().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    // 🟢 আগে এই loop সবসময় চলত, এমনকি অন্য ট্যাবে গেলেও (tab navigator screen
    // unmount করে না, শুধু আড়াল করে) — এতে অন্য স্ক্রিনের (যেমন Devices scan) সাথে
    // native ping resource নিয়ে conflict হয়ে "stuck" মনে হতো। এখন শুধু tab
    // ফোকাসে থাকলেই ping loop চলবে।
    if (!isFocused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    refreshPings();
    intervalRef.current = setInterval(refreshPings, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config, isFocused]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderRow = ({ item }) => {
    const hasReading = item.ping != null;
    const level = hasReading ? item.overallLevel : 'red';
    const c = statusColors(level);
    const isExpanded = expandedId === item.id;

    return (
      <Card style={styles.card}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(item.id)} style={styles.row}>
          <View style={[styles.logo, { backgroundColor: c.soft }]}>
            {/* 🟢 Dashboard emoji (🎮) অথবা logo URL সেট করে — Ionicons name না,
                তাই এখানে Ionicons এর বদলে logo Image অথবা emoji Text দেখানো হচ্ছে */}
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoEmoji}>{item.icon || '🎮'}</Text>
            )}
          </View>
          <View style={styles.mid}>
            <View style={styles.nameRow}>
              <Text style={styles.gameName} numberOfLines={1}>{item.name}</Text>
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
            {item.hostResults.map((h, idx) => {
              const hc = statusColors(h.level);
              return (
                <View key={h.ip + idx} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.dot, { backgroundColor: hc.main }]} />
                    <View>
                      <Text style={styles.breakdownLabel}>{h.label}</Text>
                      <Text style={styles.breakdownIp}>({h.ip})</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.breakdownPing, { color: hc.main }]}>
                      {h.ok ? `${h.ms} ms` : '—'}
                    </Text>
                    <Text style={styles.thresholdSubText}>
                      Max: {h.smoothMax}ms / {h.playableMax}ms
                    </Text>
                  </View>
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

        <FlatList
          data={results ?? []}
          keyExtractor={(i) => i.id || i.name}
          renderItem={renderRow}
          contentContainerStyle={{ paddingTop: SPACING.sm, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
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

  card: { marginBottom: SPACING.md, padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  logo: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  logoImage: { width: 42, height: 42 },
  logoEmoji: { fontSize: 20 },
  mid: { flex: 1, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  gameName: { fontSize: 13.5, fontFamily: FONT.semibold, color: COLORS.ink },
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
  breakdownIp: { fontSize: 10.5, fontFamily: FONT.medium, color: COLORS.inkMuted },
  breakdownPing: { fontSize: 12.5, fontFamily: FONT.bold },
  thresholdSubText: { fontSize: 9.5, fontFamily: FONT.medium, color: COLORS.inkMuted, marginTop: 1 },
});