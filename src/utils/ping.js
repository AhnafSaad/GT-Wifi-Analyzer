// src/utils/ping.js
// react-native-ping দিয়ে আসল ICMP ping করার শেয়ার্ড হেল্পার।
// এটা কোনো fake/random ডেটা জেনারেট করে না — সত্যিকারের নেটওয়ার্ক প্যাকেট পাঠায়।

import Ping from 'react-native-ping';

/**
 * একটা হোস্টে একবার real ping করে।
 * সফল হলে { ok: true, ms }, timeout/unreachable হলে { ok: false, ms: null }
 *
 * 🟢 react-native-ping এর নিজের timeout মাঝেমধ্যে ঠিকমতো ফায়ার করে না (device/network
 * অনুযায়ী কখনো কখনো hang করে থাকে) — তাই এখানে একটা আলাদা JS-level হার্ড টাইমআউট
 * বসানো হয়েছে, যাতে native library যাই করুক, এই ফাংশন সবসময় নির্দিষ্ট সময়ের মধ্যেই
 * থেমে যায়। এটা LAN scan-এর মতো bulk/parallel ping-এ পুরো batch আটকে যাওয়া ঠেকায়।
 */
export async function singlePing(host, timeoutMs = 3000) {
  try {
    const ms = await Promise.race([
      Ping.start(host, { timeout: timeoutMs }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('JS_HARD_TIMEOUT')), timeoutMs + 300)),
    ]);
    return { ok: true, ms: Math.round(ms) };
  } catch (err) {
    return { ok: false, ms: null };
  }
}