// src/hooks/useNearbyNetworks.js
// react-native-wifi-reborn (আগে থেকেই প্রজেক্টে আছে) দিয়ে আশেপাশের WiFi
// network scan করে — নতুন কোনো native dependency লাগেনি।

import WifiManager from 'react-native-wifi-reborn';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';

export default function useNearbyNetworks() {
  const [networks, setNetworks] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDeniedForever, setPermissionDeniedForever] = useState(false);
  const mountedRef = useRef(true);

  const ensurePermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'আশেপাশের WiFi network দেখতে Android-এর লোকেশন পারমিশন প্রয়োজন। আপনার লোকেশন কোথাও সংরক্ষণ করা হয় না।',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        setPermissionDeniedForever(true);
      }
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  }, []);

  const scan = useCallback(async () => {
    setError(null);
    const ok = await ensurePermission();
    if (!ok) {
      setError('PERMISSION_DENIED');
      return;
    }
    setScanning(true);
    try {
      // reScanAndLoadWifiList জোর করে নতুন scan করে, তাই সবচেয়ে আপ-টু-ডেট লিস্ট দেয়
      const list = await WifiManager.reScanAndLoadWifiList();
      if (!mountedRef.current) return;
      // signal (level, dBm) অনুযায়ী সবচেয়ে শক্তিশালী নেটওয়ার্ক আগে দেখানো
      const sorted = [...list].sort((a, b) => (b.level ?? -999) - (a.level ?? -999));

      // 🟢 একই SSID-তে একাধিক Access Point থাকলে (mesh/office network এ সাধারণ ঘটনা)
      // আগে প্রতিটা আলাদা আলাদা রো হিসেবে দেখাত (একই নাম বারবার) — এখন SSID অনুযায়ী
      // ডুপ্লিকেট বাদ দিয়ে শুধু সবচেয়ে শক্তিশালী সিগন্যালটা রাখা হচ্ছে।
      // hidden SSID (খালি নাম) গুলো ডুপ্লিকেট ধরা হচ্ছে না, কারণ ওগুলো ভিন্ন ভিন্ন
      // নেটওয়ার্ক হতে পারে যাদের নাম দেখা যাচ্ছে না।
      const seenSsid = new Set();
      const deduped = [];
      for (const net of sorted) {
        const ssid = net.SSID?.trim();
        if (!ssid) {
          deduped.push(net); // hidden network, বাদ দেওয়া হচ্ছে না
          continue;
        }
        if (seenSsid.has(ssid)) continue;
        seenSsid.add(ssid);
        deduped.push(net);
      }

      setNetworks(deduped);
    } catch (err) {
      if (mountedRef.current) {
        // couldNotScan: Android 9+ এ foreground app প্রতি ২ মিনিটে ৪ বারের বেশি scan করতে পারে না
        setError(err?.message || 'SCAN_FAILED');
      }
    } finally {
      if (mountedRef.current) setScanning(false);
    }
  }, [ensurePermission]);

  // 🟢 আগে শুধু বাটন চাপলে scan হতো, এখন screen ওপেন হলেই auto-scan শুরু হয়
  useEffect(() => {
    mountedRef.current = true;
    scan();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { networks, scanning, error, permissionDeniedForever, scan };
}
