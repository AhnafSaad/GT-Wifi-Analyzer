// src/screens/SpeedTestScreen.js
// Fast.com-এর মতো — screen খুললেই auto download → upload টেস্ট শুরু হয়ে যায়।
// 🟢 আগের flat/সাধারণ UI-এর বদলে এখন একটা animated circular gauge (speedometer-এর
// মতো) দেখানো হচ্ছে — brand color-এর সাথে মিলিয়ে, বেশি polished লাগার জন্য।

import AppHeader from "../components/AppHeader";
import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Card } from "../components/Bits";
import PrimaryButton from "../components/PrimaryButton";
import useSpeedTest from "../hooks/useSpeedTest";
import { tr, useLanguage } from "../context/LanguageContext";
import { T } from "../constants/translations";
import { COLORS, FONT, RADIUS, SPACING } from "../theme";

const PHASE_LABEL_KEY = {
  idle: 'speedIdle',
  download: 'speedTestingDownload',
  upload: 'speedTestingUpload',
  done: 'speedDone',
  error: 'speedError',
};

const GAUGE_SIZE = 220;
const STROKE_WIDTH = 14;
const RADIUS_PX = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_PX;
const GAUGE_MAX_MBPS = 150; // 🟢 gauge পূর্ণ হওয়ার রেফারেন্স ভ্যালু — বেশিরভাগ হোম/মোবাইল কানেকশনের জন্য যথেষ্ট রেঞ্জ

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function SpeedTestScreen() {
  const { language } = useLanguage();
  const t = (key) => tr(T[key], language);

  const { phase, liveMbps, downloadMbps, uploadMbps, error, runTest } = useSpeedTest();

  const isRunning = phase === 'download' || phase === 'upload';
  const bigNumber = isRunning ? liveMbps : phase === 'done' ? downloadMbps : 0;

  // 🟢 gauge fill animation — liveMbps বদলানোর সাথে সাথে মসৃণভাবে ring animate হয়
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const clamped = Math.min((bigNumber || 0) / GAUGE_MAX_MBPS, 1);
    Animated.timing(progressAnim, {
      toValue: clamped,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [bigNumber]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.screen}>
      <AppHeader title={t('speedTest')} icon="speedometer-outline" onReload={runTest} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.mainCard}>
          <Text style={styles.phaseLabel}>{t(PHASE_LABEL_KEY[phase])}</Text>

          <View style={styles.gaugeWrap}>
            <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
              <Circle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={RADIUS_PX}
                stroke={COLORS.border}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <AnimatedCircle
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={RADIUS_PX}
                stroke={COLORS.primary}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
              />
            </Svg>
            <View style={styles.gaugeCenter}>
              <Text style={styles.bigNumber}>{bigNumber ? bigNumber.toFixed(1) : '0.0'}</Text>
              <Text style={styles.unit}>Mbps</Text>
            </View>
          </View>

          {phase === 'error' && (
            <Text style={styles.errorText}>{t('speedErrorDetail')}</Text>
          )}

          <View style={{ marginTop: SPACING.lg, width: '100%' }}>
            <PrimaryButton
              label={isRunning ? t('speedTestingGeneric') : t('speedTestAgain')}
              icon="refresh-outline"
              loading={isRunning}
              onPress={runTest}
            />
          </View>
        </Card>

        {(phase === 'done' || downloadMbps != null) && (
          <View style={styles.resultsRow}>
            <Card style={styles.resultCard}>
              <View style={[styles.resultIconWrap, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="arrow-down" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.resultValue}>{downloadMbps ? downloadMbps.toFixed(1) : '—'}</Text>
              <Text style={styles.resultLabel}>{t('speedDownload')}</Text>
            </Card>
            <Card style={styles.resultCard}>
              <View style={[styles.resultIconWrap, { backgroundColor: COLORS.primarySoft }]}>
                <Ionicons name="arrow-up" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.resultValue}>{uploadMbps ? uploadMbps.toFixed(1) : '—'}</Text>
              <Text style={styles.resultLabel}>{t('speedUpload')}</Text>
            </Card>
          </View>
        )}

        <Text style={styles.disclaimer}>{t('speedDisclaimer')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 100 },
  mainCard: { alignItems: 'center', paddingVertical: SPACING.xl },
  phaseLabel: { fontSize: 13, color: COLORS.inkSoft, fontFamily: FONT.semibold, marginBottom: SPACING.md, letterSpacing: 0.3 },

  gaugeWrap: { width: GAUGE_SIZE, height: GAUGE_SIZE, alignItems: 'center', justifyContent: 'center' },
  gaugeCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bigNumber: { fontSize: 44, fontFamily: FONT.extrabold, color: COLORS.ink, textAlign: 'center' },
  unit: { fontSize: 14, fontFamily: FONT.semibold, color: COLORS.inkSoft, marginTop: 2, textAlign: 'center' },
  errorText: { color: COLORS.red, fontFamily: FONT.medium, fontSize: 12.5, marginTop: 10, textAlign: 'center' },

  resultsRow: { flexDirection: 'row', gap: 10, marginTop: SPACING.lg },
  resultCard: { flex: 1, alignItems: 'center', paddingVertical: SPACING.lg },
  resultIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  resultValue: { fontSize: 18, fontFamily: FONT.extrabold, color: COLORS.ink, marginTop: 8 },
  resultLabel: { fontSize: 11, fontFamily: FONT.medium, color: COLORS.inkMuted, marginTop: 2 },

  disclaimer: { fontSize: 11.5, color: COLORS.inkMuted, fontFamily: FONT.medium, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 16 },
});
