// src/components/Bits.js
// Small shared building blocks used across screens: Card, VerdictBadge,
// MetricRow, StatusTag, EmptyState. Kept in one file since each is tiny.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOW, FONT, statusColors, STATUS_ICON } from '../theme';

export function Card({ children, style }) {
  return <View style={[styles.card, SHADOW.card, style]}>{children}</View>;
}

export function VerdictBadge({ level, text }) {
  const c = statusColors(level);
  const pulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[styles.verdict, { backgroundColor: c.soft, borderColor: c.border }]}>
      <Animated.View style={[styles.verdictDot, { backgroundColor: c.main, opacity: pulse }]} />
      <Ionicons name={STATUS_ICON[level]} size={22} color={c.main} style={{ marginLeft: 2 }} />
      <Text style={[styles.verdictText, { color: c.main }]}>{text}</Text>
    </View>
  );
}

export function MetricRow({ icon, label, value, level, qualityLabel, last }) {
  const c = statusColors(level);
  return (
    <View style={[styles.metricRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.metricLeft}>
        <View style={[styles.metricIcon, { backgroundColor: c.soft }]}>
          <Ionicons name={icon} size={15} color={c.main} />
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <View style={styles.metricRight}>
        <Text style={styles.metricValue}>{value}</Text>
        {qualityLabel ? (
          <View style={[styles.qPill, { backgroundColor: c.soft, borderColor: c.border }]}>
            <Text style={[styles.qPillText, { color: c.main }]}>{qualityLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function StatusTag({ level, text }) {
  const c = statusColors(level);
  return (
    <View style={[styles.tag, { backgroundColor: c.soft, borderColor: c.border }]}>
      <Ionicons name={STATUS_ICON[level]} size={12.5} color={c.main} />
      <Text style={[styles.tagText, { color: c.main }]}>{text}</Text>
    </View>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyCircle}>
        <Ionicons name={icon} size={34} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },

  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.pill,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginTop: SPACING.xl,
    maxWidth: '94%',
  },
  verdictDot: { width: 8, height: 8, borderRadius: 4 },
  verdictText: { marginLeft: 9, fontSize: 15.5, fontFamily: FONT.bold, flexShrink: 1 },

  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metricLeft: { flexDirection: 'row', alignItems: 'center' },
  metricIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  metricLabel: { fontSize: 13.5, color: COLORS.inkSoft, fontFamily: FONT.medium },
  metricRight: { flexDirection: 'row', alignItems: 'center' },
  metricValue: { fontSize: 14.5, fontFamily: FONT.bold, color: COLORS.ink, marginRight: 9 },
  qPill: { borderWidth: 1, borderRadius: RADIUS.sm, paddingVertical: 3, paddingHorizontal: 8 },
  qPillText: { fontSize: 10.5, fontFamily: FONT.bold },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: 5,
    paddingHorizontal: 9,
    alignSelf: 'flex-start',
  },
  tagText: { fontSize: 11, fontFamily: FONT.bold, marginLeft: 4 },

  empty: { alignItems: 'center', paddingTop: 44, paddingHorizontal: 30 },
  emptyCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyText: { textAlign: 'center', color: COLORS.inkMuted, fontSize: 13.5, lineHeight: 20, fontFamily: FONT.medium },
});
