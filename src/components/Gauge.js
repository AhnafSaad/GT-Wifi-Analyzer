// src/components/Gauge.js
// Animated circular gauge — ring smoothly sweeps to the target value
// instead of snapping, with a soft colored glow behind it.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FONT, COLORS } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 200;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export default function Gauge({ percent, color, valueText, subText }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percent,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRC, 0],
  });

  return (
    <View style={styles.wrap}>
      <View style={[styles.glow, { backgroundColor: color, opacity: 0.12 }]} />
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={COLORS.border} strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={dashOffset}
          fill="none"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.value, { color }]}>{valueText}</Text>
        {subText ? <Text style={styles.sub}>{subText}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  glow: { position: 'absolute', width: SIZE - 10, height: SIZE - 10, borderRadius: (SIZE - 10) / 2 },
  center: { position: 'absolute', alignItems: 'center' },
  value: { fontSize: 32, fontFamily: FONT.extrabold },
  sub: { fontSize: 12.5, color: COLORS.inkMuted, marginTop: 4, fontFamily: FONT.semibold, letterSpacing: 0.3 },
});
