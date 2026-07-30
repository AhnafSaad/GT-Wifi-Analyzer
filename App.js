import "react-native-gesture-handler";
import * as SplashScreen from "expo-splash-screen";
import DashboardScreen from "./src/screens/DashboardScreen";
import DnsCheckScreen from "./src/screens/DnsCheckScreen";
import GamingTestScreen from "./src/screens/GamingTestScreen";
import React, { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConfigProvider } from "./src/context/ConfigContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { COLORS, FONT, RADIUS, SHADOW } from "./src/theme";

// App.js
// CIRCLE NETWORK — root entry point.
// Loads the Inter font family, wraps everything in the global language
// provider, and renders a floating pill-style bottom tab bar.

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

// নতুন ConfigProvider ইম্পোর্ট করা হলো

SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: { active: 'flash', inactive: 'flash-outline' },
  Gaming: { active: 'game-controller', inactive: 'game-controller-outline' },
  DNS: { active: 'server', inactive: 'server-outline' },
};

function FloatingTabBar({ state, descriptors, navigation }) {
  return (
    <View style={tabStyles.wrap} pointerEvents="box-none">
      <View style={[tabStyles.bar, SHADOW.card]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const set = TAB_ICONS[route.name];
          const label = descriptors[route.key].options.tabBarLabel ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.85}
              onPress={onPress}
              style={[tabStyles.item, focused && tabStyles.itemActive]}
            >
              <Ionicons name={focused ? set.active : set.inactive} size={20} color={focused ? COLORS.white : COLORS.inkMuted} />
              {focused ? <Text style={tabStyles.label}>{label}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: 18 },
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    padding: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
  },
  itemActive: { backgroundColor: COLORS.primary, paddingHorizontal: 18 },
  label: { color: COLORS.white, fontFamily: FONT.bold, fontSize: 12.5, marginLeft: 7 },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      {/* ConfigProvider দিয়ে পুরো অ্যাপটিকে র‍্যাপ করা হলো */}
      <ConfigProvider>
        <LanguageProvider>
          <NavigationContainer onReady={onLayout}>
            <StatusBar style="light" />
            <Tab.Navigator
              screenOptions={{ headerShown: false }}
              tabBar={(props) => <FloatingTabBar {...props} />}
            >
              <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
              <Tab.Screen name="Gaming" component={GamingTestScreen} options={{ tabBarLabel: 'Gaming' }} />
              <Tab.Screen name="DNS" component={DnsCheckScreen} options={{ tabBarLabel: 'DNS' }} />
            </Tab.Navigator>
          </NavigationContainer>
        </LanguageProvider>
      </ConfigProvider>
    </SafeAreaProvider>
  );
}
