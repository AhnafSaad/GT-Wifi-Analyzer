import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { API_BASE_URL } from "../config/api";

// সার্ভার থেকে ডেটা না পেলে বা ইন্টারনেট না থাকলে এই ডিফল্ট ভ্যালু কাজ করবে
// 🟢 dashboard এর defaultConfig.js এর সাথে মিলিয়ে dns অংশ যোগ করা হলো
const DEFAULT_CONFIG = {
  globalThresholds: {
    ping: { goodMax: 50, fairMax: 100 },
    jitter: { goodMax: 10, fairMax: 30 },
    packetLoss: { goodMax: 1, fairMax: 5 },
    dbm: { goodMin: -65, fairMin: -85 },
    dns: { smoothMax: 80, playableMax: 200 } // 🟢 dashboard এর মান অনুযায়ী
  },
  dns: {
    resolverUrl: 'https://dns.google/resolve',
    domains: ['google.com', 'cloudflare.com', 'wikipedia.org', 'github.com']
  },
  servers: [] 
};

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const hasLoadedOnce = useRef(false);

  // 🟢 প্রতি ৬০ সেকেন্ড পরপর অটো-রিফ্রেশ + app foreground এ ফিরলে রিফ্রেশ,
  // যাতে dashboard থেকে সেটিংস বদলালে app বন্ধ-খোলা ছাড়াই সেটা reflect হয়
  const POLL_INTERVAL_MS = 60000;

  const fetchConfig = async (silent = false) => {
    // 🟢 প্রথমবার ছাড়া (silent refresh এর সময়) লোডিং স্পিনার না দেখানোই ভালো,
    // নাহলে প্রতি মিনিটে screen flicker করবে
    if (!silent) setIsLoading(true);
    try {
      // 🟢 backend address এখন src/config/api.js থেকে আসছে (VPS এ গেলে ওই একটা ফাইল বদলালেই হবে)
      const response = await fetch(`${API_BASE_URL}/api/config`); 
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Config fetch error, using fallback data:", error);
      // এরর হলে আগে থেকে থাকা বা ডিফল্ট কনফিগ ব্যবহার করবে
    } finally {
      if (!silent) setIsLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  useEffect(() => {
    fetchConfig(); // প্রথমবার লোডিং স্পিনার সহ

    // 🟢 প্রতি ৬০ সেকেন্ড পরপর ব্যাকগ্রাউন্ডে (silent) config রিফ্রেশ
    const intervalId = setInterval(() => fetchConfig(true), POLL_INTERVAL_MS);

    // 🟢 App ব্যাকগ্রাউন্ড থেকে foreground এ ফিরলে সাথে সাথেই রিফ্রেশ করা হচ্ছে
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && hasLoadedOnce.current) {
        fetchConfig(true);
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ config, isLoading, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

// 🟢 এই hook টাই ছিল না, তাই DnsCheckScreen.js এ useConfig() কল করলে অ্যাপ crash করছিল
export const useConfig = () => useContext(ConfigContext);