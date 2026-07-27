import WifiManager from "react-native-wifi-reborn";
import { useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

// src/hooks/useWifiInfo.js
// react-native-wifi-reborn ব্যবহার করে সরাসরি Android WifiManager থেকে
// আসল SSID, signal strength (dBm), আর ফ্রিকোয়েন্সি পড়ে — কোনো Math.random() নেই।


// প্রতি কত মিলিসেকেন্ড পরপর হার্ডওয়্যার থেকে নতুন রিডিং নেওয়া হবে
const POLL_INTERVAL_MS = 2000;
// চার্টে সর্বোচ্চ কতগুলো পয়েন্ট রাখা হবে
const MAX_HISTORY_POINTS = 24;

function bandFromFrequency(freqMHz) {
  if (!freqMHz) return null;
  if (freqMHz >= 4900 && freqMHz <= 5900) return '5 GHz';
  if (freqMHz >= 2400 && freqMHz <= 2500) return '2.4 GHz';
  return null;
}

export default function useWifiInfo() {
  const [ssid, setSsid] = useState(null);
  const [band, setBand] = useState(null);
  const [dBm, setDBm] = useState(null);
  const [dBmHistory, setDBmHistory] = useState([]);
  const [isWifi, setIsWifi] = useState(null); // null = এখনো চেক করা হয়নি, true/false = কনফার্ম হয়েছে
  const [permissionGranted, setPermissionGranted] = useState(Platform.OS !== 'android');
  const [permissionDeniedForever, setPermissionDeniedForever] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const intervalRef = useRef(null);
  const pollRef = useRef(null);

  async function ensurePermission() {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'WiFi সিগন্যাল ও নেটওয়ার্কের নাম পড়তে Android-এর লোকেশন পারমিশন প্রয়োজন। আপনার লোকেশন কোথাও সংরক্ষণ করা হয় না।',
          buttonPositive: 'OK',
        }
      );
      setPermissionError(null);
      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        setPermissionDeniedForever(true);
      }
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      // আগে এই এররটা চুপচাপ গিলে ফেলা হতো — এখন Metro টার্মিনালে দেখাবে,
      // যাতে আসল কারণ ধরা যায়।
      console.warn('[useWifiInfo] PermissionsAndroid.request failed:', err?.message || err);
      setPermissionError(err?.message || String(err));
      return false;
    }
  }

  // বাটনে চাপ দিলে এটা ম্যানুয়ালি আবার কল করা যায় — যদি Android এখনো
  // dialog দেখাতে রাজি থাকে, popup আসবে; granted হলে polling শুরু হয়ে যাবে।
  async function requestPermission() {
    const ok = await ensurePermission();
    setPermissionGranted(ok);
    if (ok && !intervalRef.current && pollRef.current) {
      pollRef.current();
      intervalRef.current = setInterval(pollRef.current, POLL_INTERVAL_MS);
    }
    return ok;
  }

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const [signal, freq, currentSsid] = await Promise.all([
          WifiManager.getCurrentSignalStrength(), // আসল RSSI, dBm (Android)
          WifiManager.getFrequency().catch(() => null),
          WifiManager.getCurrentWifiSSID().catch(() => null),
        ]);

        if (!mounted) return;

        const validSsid = currentSsid && currentSsid !== '<unknown ssid>' ? currentSsid : null;
        setIsWifi(true);
        setSsid(validSsid);
        setBand(bandFromFrequency(freq));
        setDBm(signal);
        setDBmHistory((prev) => {
          const next = [...prev, signal];
          return next.length > MAX_HISTORY_POINTS ? next.slice(-MAX_HISTORY_POINTS) : next;
        });
      } catch (err) {
        // WiFi-তে কানেক্টেড নেই, বা পারমিশন নেই
        if (!mounted) return;
        setIsWifi(false);
        setSsid(null);
        setBand(null);
        setDBm(null);
      }
    }
    pollRef.current = poll;

    async function init() {
      const ok = await ensurePermission();
      if (!mounted) return;
      setPermissionGranted(ok);
      if (!ok) return;

      poll();
      intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    }
    init();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { ssid, band, dBm, dBmHistory, isWifi, permissionGranted, permissionDeniedForever, permissionError, requestPermission };
}