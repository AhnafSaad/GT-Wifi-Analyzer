// src/utils/ping.js
// react-native-ping দিয়ে আসল ICMP ping করার শেয়ার্ড হেল্পার।
// এটা কোনো fake/random ডেটা জেনারেট করে না — সত্যিকারের নেটওয়ার্ক প্যাকেট পাঠায়।

import Ping from 'react-native-ping';

/**
 * একটা হোস্টে একবার real ping করে।
 * সফল হলে { ok: true, ms }, timeout/unreachable হলে { ok: false, ms: null }
 */
export async function singlePing(host, timeoutMs = 3000) {
  try {
    const ms = await Ping.start(host, { timeout: timeoutMs });
    return { ok: true, ms: Math.round(ms) };
  } catch (err) {
    return { ok: false, ms: null };
  }
}