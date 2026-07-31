import AppHeader from "../components/AppHeader";
import Gauge from "../components/Gauge";
import LiveLineChart from "../components/LiveLineChart";
import React, { useContext } from "react";
import useRealPing from "../hooks/useRealPing";
import useWifiInfo from "../hooks/useWifiInfo";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card, MetricRow, VerdictBadge } from "../components/Bits";
import { T } from "../constants/translations";
import { ConfigContext } from "../context/ConfigContext";
import { tr, useLanguage } from "../context/LanguageContext";
import { COLORS, FONT, RADIUS, SPACING, statusColors } from "../theme";

// কোয়ালিটি লেবেল এবং ভার্ডিক্ট লজিক আগের মতই থাকছে
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

  // ✅ ড্যাশবোর্ড থেকে লাইভ কনফিগ এবং গ্লোবাল থ্রেশহোল্ড নেওয়া হচ্ছে
  const { config } = useContext(ConfigContext);

  // সেফটি ফলব্যাকসহ কনফিগ ভ্যালু এক্সট্রাক্ট করা
  const thresholds = config?.globalThresholds || {};
  const pingTarget = config?.pingTarget || '8.8.8.8'; 
  
  // ডায়নামিক থ্রেশহোল্ড ফাংশন (কনফিগ থেকে ডেটা না পেলে আগের হার্ডকোডেড ভ্যালু ফলব্যাক হিসেবে কাজ করবে)
  const getSignalLevel = (dBm) => {
    const smoothMin = thresholds.signal?.smoothMin ?? -60;
    const playableMin = thresholds.signal?.playableMin ?? -70;
    return dBm >= smoothMin ? 'green' : dBm >= playableMin ? 'yellow' : 'red';
  };
  
  const getPingLevel = (ms) => {
    const smoothMax = thresholds.ping?.smoothMax ?? 40;
    const playableMax = thresholds.ping?.playableMax ?? 90;
    return ms <= smoothMax ? 'green' : ms <= playableMax ? 'yellow' : 'red';
  };
  
  const getJitterLevel = (ms) => {
    const smoothMax = thresholds.jitter?.smoothMax ?? 10;
    const playableMax = thresholds.jitter?.playableMax ?? 25;
    return ms <= smoothMax ? 'green' : ms <= playableMax ? 'yellow' : 'red';
  };
  
  const getLossLevel = (pct) => {
    const smoothMax = thresholds.packetLoss?.smoothMax ?? 1;
    const playableMax = thresholds.packetLoss?.playableMax ?? 5;
    return pct <= smoothMax ? 'green' : pct <= playableMax ? 'yellow' : 'red';
  };

  const { ssid, band, dBm, dBmHistory, isWifi, permissionGranted, permissionDeniedForever, permissionError, requestPermission } = useWifiInfo();
  
  // ✅ এখন পিং টার্গেটও লাইভ কনফিগ থেকে আসবে
  const { ping, jitter, lossPct, pingHistory } = useRealPing(pingTarget);

  const [refreshing, setRefreshing] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);

  const openAppSettingsSafely = async () => {
    try {
      const result = Linking.openSettings();
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
    if (permissionDeniedForever) {
      await openAppSettingsSafely();
      return;
    }
    setRequesting(true);
    await requestPermission();
    setRequesting(false);
  };

  const networkTitle = !permissionGranted
    ? t('locationPermissionNeeded')
    : isWifi === false
    ? t('notConnectedWifi')
    : ssid
    ? ssid
    : t('unknownNetwork');
  const networkSubtitle = isWifi && band ? band : null;

  const ready = dBm != null && ping != null;

  const handleManualRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  // ✅ ডায়নামিক ফাংশন দিয়ে লেভেল ক্যালকুলেশন
  const dBmLvl = ready ? getSignalLevel(dBm) : null;
  const pLvl = ready ? getPingLevel(ping) : null;
  const jLvl = jitter != null ? getJitterLevel(jitter) : null;
  const lLvl = lossPct != null ? getLossLevel(lossPct) : null;
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