import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Animated, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { COLORS, FONT } from "../theme";

// src/components/AppHeader.js
// Gradient brand header shared by every screen — logo mark, screen title,
// and a smooth animated EN/বাং pill toggle.


export default function AppHeader({ title, icon = 'radio', onReload }) {
  const { language, toggleLanguage } = useLanguage();
  const anim = useRef(new Animated.Value(language === 'bn' ? 1 : 0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: language === 'bn' ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 90,
    }).start();
  }, [language]);

  const knobLeft = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 39] });
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleReloadPress = () => {
    if (!onReload) return;
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    onReload();
  };

  return (
    <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <SafeAreaView edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.gradientEnd} />
        <View style={styles.row}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name={icon} size={19} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.brand}>GT Wifi Analyzer</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>

          <View style={styles.rightGroup}>
            {onReload && (
              <TouchableOpacity activeOpacity={0.75} onPress={handleReloadPress} style={styles.reloadBtn}>
                <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
                  <Ionicons name="refresh" size={18} color={COLORS.white} />
                </Animated.View>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.85} onPress={toggleLanguage} style={styles.toggleTrack}>
              <Animated.View style={[styles.knob, { left: knobLeft }]} />
              <View style={styles.toggleLabels}>
                <Text style={[styles.toggleLabel, language === 'en' && styles.toggleLabelActive]}>EN</Text>
                <Text style={[styles.toggleLabel, language === 'bn' && styles.toggleLabelActive]}>বাং</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 68,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  brand: { color: 'rgba(255,255,255,0.88)', fontSize: 11.5, fontFamily: FONT.semibold, letterSpacing: 0.2 },
  title: { color: COLORS.white, fontSize: 18, fontFamily: FONT.extrabold, marginTop: 1 },

  rightGroup: { flexDirection: 'row', alignItems: 'center' },
  reloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  toggleTrack: {
    width: 74,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    top: 3,
    width: 32,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.white,
  },
  toggleLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 9 },
  toggleLabel: { fontSize: 11.5, fontFamily: FONT.bold, color: 'rgba(255,255,255,0.85)', width: 20, textAlign: 'center' },
  toggleLabelActive: { color: COLORS.primary },
});