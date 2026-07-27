// src/components/PrimaryButton.js
// Gradient CTA button with a tactile press-scale animation and loading state.

import React, { useRef } from 'react';
import { Text, StyleSheet, Animated, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOW, FONT } from '../theme';

export default function PrimaryButton({ label, icon = 'flash', loading, onPress, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled || loading}>
      <Animated.View style={[styles.wrap, SHADOW.button, { transform: [{ scale }], opacity: disabled ? 0.75 : 1 }]}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Ionicons name={icon} size={19} color={COLORS.white} />
          )}
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  gradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17 },
  label: { color: COLORS.white, fontSize: 16.5, fontFamily: FONT.bold, marginLeft: 10 },
});
