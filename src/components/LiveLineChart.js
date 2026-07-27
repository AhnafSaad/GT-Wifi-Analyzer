// src/components/LiveLineChart.js
// নতুন কম্পোনেন্ট — লাইভ-আপডেটিং লাইন চার্ট। react-native-svg দিয়ে বানানো
// (Gauge.js-এ যেটা আগে থেকেই ব্যবহৃত হচ্ছে, তাই আলাদা কোনো লাইব্রেরি লাগবে না)।
// একটা ক্রমবর্ধমান নাম্বার array পাস করলেই এটা redraw হতে থাকবে।

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Polygon, Line } from 'react-native-svg';
import { COLORS } from '../theme';

const VIEW_W = 300;
const VIEW_H = 90;
const PAD = 8;

export default function LiveLineChart({ data, color = COLORS.primary, height = VIEW_H }) {
  if (!data || data.length < 2) {
    return <View style={[styles.empty, { height }]} />;
  }

  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const range = hi - lo || 1; // ডেটা সব একই ভ্যালু হলে division-by-zero এড়াতে

  const stepX = (VIEW_W - PAD * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = PAD + i * stepX;
    const norm = (v - lo) / range;
    const y = PAD + (1 - norm) * (VIEW_H - PAD * 2);
    return `${x},${y}`;
  });

  const linePoints = points.join(' ');
  const lastX = PAD + (data.length - 1) * stepX;
  const fillPoints = `${PAD},${VIEW_H - PAD} ${linePoints} ${lastX},${VIEW_H - PAD}`;

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      {/* বেসলাইন */}
      <Line x1={PAD} y1={VIEW_H - PAD} x2={VIEW_W - PAD} y2={VIEW_H - PAD} stroke={COLORS.border} strokeWidth={1} />
      {/* লাইনের নিচে হালকা ফিল */}
      <Polygon points={fillPoints} fill={color} fillOpacity={0.12} stroke="none" />
      {/* মূল লাইন */}
      <Polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: { justifyContent: 'center' },
});