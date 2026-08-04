import AppHeader from "../components/AppHeader";
import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, VerdictBadge } from "../components/Bits";
import { T } from "../constants/translations";
import { useConfig } from "../context/ConfigContext";
import { tr, useLanguage } from "../context/LanguageContext";
import { COLORS, FONT, RADIUS, SPACING, statusColors } from "../theme";

// src/screens/DnsCheckScreen.js
// 🟢 আপনার ConfigContext ইম্পোর্ট করুন (পাথ আপনার প্রজেক্ট অনুযায়ী মিলিয়ে নেবেন)

const REFRESH_INTERVAL_MS = 6000;
const STATUS_KEY = { green: 'stable', yellow: 'slightlySlow', red: 'unstable' };

// 🟢 আগে প্রতিবার একটা random domain বাছাই হতো, তাই fast/slow domain-এর
// পার্থক্যের কারণে সংখ্যা অনেক লাফাতো। এখন সবগুলো domain একসাথে (parallel)
// টেস্ট করে average নেওয়া হয় — এতে result অনেক বেশি স্থির থাকে।
async function measureDnsResolution(resolverUrl, domains) {
  const testDomains = domains && domains.length > 0 ? domains : ['google.com'];

  const attempts = await Promise.all(
    testDomains.map(async (domain) => {
      const start = Date.now();
      try {
        const res = await fetch(`${resolverUrl}?name=${domain}&type=A`, {
          headers: { accept: 'application/dns-json' },
        });
        await res.json();
        return { ok: true, ms: Date.now() - start, domain };
      } catch (err) {
        return { ok: false, ms: null, domain };
      }
    })
  );

  const successful = attempts.filter((a) => a.ok);
  if (successful.length === 0) {
    return { ok: false, ms: null, domain: testDomains[0] };
  }

  const avgMs = Math.round(successful.reduce((sum, a) => sum + a.ms, 0) / successful.length);
  return { ok: true, ms: avgMs, domain: `${successful.length}/${testDomains.length} domains` };
}

export default function DnsCheckScreen() {
  const { language } = useLanguage();
  const t = (key) => tr(T[key], language);
  
  // 🟢 গ্লোবাল কনফিগারেশন নিয়ে আসা হচ্ছে
  const { config } = useConfig();
  const dnsSettings = config?.dns || {};
  const dnsThresholds = config?.globalThresholds?.dns || { smoothMax: 80, playableMax: 200 };

  const [result, setResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);
  const isFocused = useIsFocused(); // 🟢 অন্য ট্যাবে থাকলে DNS check loop বন্ধ রাখার জন্য
  const historyRef = useRef([]); // 🟢 শেষ কয়েকটা reading রাখা হয় smoothing এর জন্য

  const refreshReading = async () => {
    // 🟢 এখন শুধু google.com টেস্ট হবে — dashboard-এর multi-domain লিস্ট এখানে
    // আর ব্যবহার হচ্ছে না (আগে সবগুলো domain average করা হতো)
    const reading = await measureDnsResolution(
      dnsSettings.resolverUrl || 'https://dns.google/resolve', 
      ['google.com']
    );
    if (reading.ok) {
      // 🟢 rolling average: শেষ ৩টা reading এর গড় দেখানো হয়, একটা হঠাৎ স্পাইক
      // পুরো display কে লাফাতে দেবে না
      historyRef.current = [...historyRef.current, reading.ms].slice(-3);
      const smoothedMs = Math.round(
        historyRef.current.reduce((sum, v) => sum + v, 0) / historyRef.current.length
      );
      setResult({ ...reading, ms: smoothedMs });
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    refreshReading().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    // 🟢 আগে এই loop অন্য ট্যাবে গেলেও background-এ চলত (tab navigator unmount করে
    // না) — এখন শুধু tab ফোকাসে থাকলেই চলবে, বাকি ping loop-গুলোর সাথে conflict কমাতে
    if (!isFocused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    historyRef.current = []; // 🟢 config বদলালে পুরনো history দিয়ে নতুন average স্কিউ না হোক
    refreshReading();
    intervalRef.current = setInterval(refreshReading, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [dnsSettings.resolverUrl, isFocused]); // dnsSettings.resolverUrl othoba focus change hole refresh hobe

  // 🟢 ডাইনামিক থ্রেশহোল্ড চেক করার ফাংশন
  const getDnsLevel = (ms) => {
    if (ms < dnsThresholds.smoothMax) return 'green';
    if (ms <= dnsThresholds.playableMax) return 'yellow';
    return 'red';
  };

  const level = result ? getDnsLevel(result.ms) : null;
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
                {/* 🟢 ডাইনামিক Resolver URL থেকে ডোমেইন এক্সট্রাক্ট করে দেখানো */}
                <Text style={styles.serverValue}>
                  {new URL(dnsSettings.resolverUrl || 'https://dns.google/resolve').hostname} ({result.domain})
                </Text>
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