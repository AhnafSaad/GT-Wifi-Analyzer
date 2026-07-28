import AppHeader from "../components/AppHeader";
import Gauge from "../components/Gauge";
import LiveLineChart from "../components/LiveLineChart";
import React from "react";
import useRealPing from "../hooks/useRealPing";
import useWifiInfo from "../hooks/useWifiInfo";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card, MetricRow, VerdictBadge } from "../components/Bits";
import { T } from "../constants/translations";
import { tr, useLanguage } from "../context/LanguageContext";
import { COLORS, FONT, RADIUS, SPACING, statusColors } from "../theme";

// পিং টেস্টের জন্য টার্গেট হোস্ট — Google Public DNS, বিশ্বব্যাপী সবসময় রিচেবল
const PING_TARGET_HOST = '8.8.8.8';

function signalLevel(dBm) { return dBm >= -60 ? 'green' : dBm >= -70 ? 'yellow' : 'red'; }
function pingLevel(ms) { return ms < 40 ? 'green' : ms <= 90 ? 'yellow' : 'red'; }
function jitterLevel(ms) { return ms < 10 ? 'green' : ms <= 25 ? 'yellow' : 'red'; }
function lossLevel(pct) { return pct <= 1 ? 'green' : pct <= 5 ? 'yellow' : 'red'; }
function qualityLabel(level, lang) {
  return level === 'green' ? tr(T.good, lang) : level === 'yellow' ? tr(T.fair, lang) : tr(T.poor, lang);
}
function computeVerdict({ dBmLvl, pingLvl: pLvl, jitterLvl: jLvl, lossLvl: lLvl }, lang) {
  if (lLvl === 'red') return { level: 'red', text: tr(T.highPacketLoss, lang) };
  if (dBmLvl === 'red') return { level: 'red', text: tr(T.weakSignal, lang) };
  if (pLvl === 'red' || jLvl === 'red') return { level: 'red', text: tr(T.slowNetwork, lang) };
  if ([dBmLvl, pLvl, jLvl, lLvl].includes('yellow')) return { level: 'yellow', text: tr(T.minorIssue, lang) };
  return { level: 'green', text: tr(T.allGood, lang) };
}

export default function DashboardScreen() {
  const { language } = useLanguage();
  const t = (key) => tr(T[key], language);

  // ✅ আসল WiFi হার্ডওয়্যার থেকে সিগন্যাল/SSID/ব্যান্ড (react-native-wifi-reborn)
  const { ssid, band, dBm, dBmHistory, isWifi, permissionGranted, permissionDeniedForever, permissionError, requestPermission } = useWifiInfo();
  // ✅ আসল ICMP ping থেকে ping/jitter/packet-loss (react-native-ping)
  const { ping, jitter, lossPct, pingHistory } = useRealPing(PING_TARGET_HOST);

  const [refreshing, setRefreshing] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);

  const openAppSettingsSafely = async () => {
    try {
      const result = Linking.openSettings();
      // Linking.openSettings() একটা Promise রিটার্ন করে — await করে নিশ্চিত হচ্ছি
      // এটা সত্যিই সফল হয়েছে কিনা, নাহলে silently কিছু না হয়ে যাওয়ার সুযোগ থাকে।
      await result;
    } catch (err) {
      console.warn('[Dashboard] Linking.openSettings failed:', err?.message || err);
      Alert.alert(
        language === 'bn' ? 'ম্যানুয়ালি করতে হবে' : 'Manual step needed',
        language === 'bn'
          ? 'ফোনে Settings অ্যাপ খুলুন → Apps → Circle Network → Permissions → Location অন করুন।'
          : 'Open phone Settings → Apps → Circle Network → Permissions → turn on Location.'
      );
    }
  };

  const handleGrantPermission = async () => {
    // যদি Android আগেই permanently block করে রেখেছে বলে আমরা জানি,
    // তাহলে popup দেখানোর চেষ্টা না করে সরাসরি Settings-এ পাঠানো ঠিক।
    if (permissionDeniedForever) {
      await openAppSettingsSafely();
      return;
    }
    setRequesting(true);
    await requestPermission();
    setRequesting(false);
    // এখানে ইচ্ছাকৃতভাবে Settings-এ auto-redirect করা হচ্ছে না —
    // ব্যর্থ হলে নিচে permissionError দেখিয়ে ইউজারকে আবার চেষ্টা করতে বলা হবে।
  };

  const networkTitle = !permissionGranted
    ? t('locationPermissionNeeded')
    : isWifi === false
    ? t('notConnectedWifi')
    : ssid
    ? ssid
    : t('unknownNetwork');
  const networkSubtitle = isWifi && band ? band : null;

  // সব real hook থেকে অন্তত একটা রিডিং আসা পর্যন্ত "লোডিং" দেখানো হয়
  const ready = dBm != null && ping != null;

  // হেডারের রিলোড আইকন / pull-to-refresh — hook গুলো নিজে থেকেই পোল করতে থাকে,
  // এখানে শুধু সংক্ষিপ্ত একটা spinner দেখানো হয় যাতে ব্যবহারকারী বুঝতে পারে
  // "রিফ্রেশ" রিকোয়েস্ট গৃহীত হয়েছে।
  const handleManualRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const dBmLvl = ready ? signalLevel(dBm) : null;
  const pLvl = ready ? pingLevel(ping) : null;
  const jLvl = jitter != null ? jitterLevel(jitter) : null;
  const lLvl = lossPct != null ? lossLevel(lossPct) : null;
  const verdict = ready ? computeVerdict({ dBmLvl, pingLvl: pLvl, jitterLvl: jLvl, lossLvl: lLvl }, language) : null;
  const gaugeColor = ready ? statusColors(dBmLvl).main : COLORS.border;
  const gaugePercent = ready ? Math.max(0, Math.min(100, ((dBm + 95) / 65) * 100)) : 0;

  return (
    <View style={styles.screen}>
      <AppHeader title={t('dashboard')} icon="flash" onReload={handleManualRefresh} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleManualRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {!permissionGranted && (
          <Card style={styles.permCard}>
            <View style={styles.permIconCircle}>
              <Ionicons name="location" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.permTitle}>{t('locationPermissionNeeded')}</Text>
            <Text style={styles.permBody}>{t('permissionExplain')}</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.permButton}
              onPress={handleGrantPermission}
              disabled={requesting}
            >
              <Ionicons name="key-outline" size={16} color={COLORS.white} style={{ marginRight: 7 }} />
              <Text style={styles.permButtonText}>
                {requesting ? t('checking') : permissionDeniedForever ? t('openSettings') : t('grantPermission')}
              </Text>
            </TouchableOpacity>

            {permissionDeniedForever && (
              <Text style={styles.permHint}>{t('permissionSettingsHint')}</Text>
            )}

            {!permissionDeniedForever && permissionError && (
              <Text style={styles.permErrorDebug}>Debug: {permissionError}</Text>
            )}
          </Card>
        )}

        {permissionGranted && isWifi === false && (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>{t('notConnectedWifi')}</Text>
          </View>
        )}

        {permissionGranted && isWifi !== false && !ready && (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>{t('live')}…</Text>
          </View>
        )}

        {ready && (
          <>
            <Card style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <View style={styles.networkTitleWrap}>
                  <Text style={styles.networkName} numberOfLines={1}>{networkTitle}</Text>
                  <Text style={styles.networkSub}>
                    {networkSubtitle ? `${networkSubtitle} • ${t('signal')}` : t('signalHistory')}
                  </Text>
                </View>
                <View style={styles.liveRowInline}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>{t('live')}</Text>
                </View>
              </View>
              <LiveLineChart data={dBmHistory} color={statusColors(dBmLvl).main} />
            </Card>

            <Card style={styles.gaugeCard}>
              <Gauge percent={gaugePercent} color={gaugeColor} valueText={`${dBm} dBm`} subText={t('signal')} />
              <VerdictBadge level={verdict.level} text={verdict.text} />
            </Card>

            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>{t('pingHistory')}</Text>
              <LiveLineChart data={pingHistory} color={statusColors(pLvl).main} />
            </Card>

            <Card style={styles.detailCard}>
              <MetricRow icon="wifi" label={t('signal')} value={`${dBm} dBm`} level={dBmLvl} qualityLabel={qualityLabel(dBmLvl, language)} />
              <MetricRow icon="speedometer-outline" label={t('ping')} value={`${ping} ms`} level={pLvl} qualityLabel={qualityLabel(pLvl, language)} />
              <MetricRow
                icon="pulse-outline"
                label={t('jitter')}
                value={jitter != null ? `${jitter} ms` : '—'}
                level={jLvl}
                qualityLabel={jLvl ? qualityLabel(jLvl, language) : '—'}
              />
              <MetricRow
                icon="trending-down-outline"
                label={t('packetLoss')}
                value={lossPct != null ? `${lossPct}%` : '—'}
                level={lLvl}
                qualityLabel={lLvl ? qualityLabel(lLvl, language) : '—'}
                last
              />
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  loadingWrap: { paddingTop: SPACING.xxl, alignItems: 'center' },
  loadingText: { fontSize: 13, fontFamily: FONT.semibold, color: COLORS.inkMuted },

  permCard: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  permIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  permTitle: { fontSize: 16, fontFamily: FONT.extrabold, color: COLORS.ink, textAlign: 'center', marginBottom: 6 },
  permBody: { fontSize: 13, fontFamily: FONT.medium, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 19, marginBottom: SPACING.lg },
  permButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: RADIUS.pill,
  },
  permButtonText: { color: COLORS.white, fontSize: 14, fontFamily: FONT.bold },
  permHint: { fontSize: 11.5, fontFamily: FONT.medium, color: COLORS.inkMuted, textAlign: 'center', marginTop: SPACING.md, lineHeight: 16 },
  permErrorDebug: { fontSize: 10.5, fontFamily: FONT.medium, color: COLORS.red, textAlign: 'center', marginTop: SPACING.md, lineHeight: 15 },
  gaugeCard: { alignItems: 'center', paddingVertical: SPACING.xxl, marginTop: SPACING.lg, marginBottom: SPACING.lg },
  chartCard: { marginTop: SPACING.lg, marginBottom: SPACING.lg, paddingVertical: SPACING.lg },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  networkTitleWrap: { flex: 1, marginRight: SPACING.sm },
  networkName: { fontSize: 15, fontFamily: FONT.extrabold, color: COLORS.ink },
  networkSub: { fontSize: 11.5, fontFamily: FONT.medium, color: COLORS.inkSoft, marginTop: 1 },
  chartTitle: { fontSize: 13, fontFamily: FONT.semibold, color: COLORS.inkSoft },
  detailCard: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  liveRowInline: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.red, marginRight: 5 },
  liveText: { fontSize: 10.5, fontFamily: FONT.bold, color: COLORS.red, letterSpacing: 0.5 },
});