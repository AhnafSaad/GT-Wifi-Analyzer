// src/constants/gameServers.js
//
// ⚙️ এই ফাইলটাই একমাত্র জায়গা যেখানে গেম সার্ভারের IP এডিট করতে হবে।
// এখন যেগুলো বসানো আছে (Cloudflare/Google/Quad9/OpenDNS/Verisign) সব
// PLACEHOLDER / DEMO IP — আসল গেম সার্ভারের IP না, শুধু ডেমো দেখানোর জন্য।
//
// আসল গেম সার্ভারের IP হাতে পেলে, নিচের প্রতিটা এন্ট্রির `hosts` array-তে
// শুধু `ip` ভ্যালুটা বদলে দিন এবং `isDemo: false` করে দিন — বাকি কোডে
// (GamingTestScreen.js) কোনো পরিবর্তন লাগবে না, স্বয়ংক্রিয়ভাবে real IP
// দিয়েই ping/threshold হিসাব হবে।
//
// প্রতিটা গেমে একাধিক (২-৩টা) host রাখা যায় — একটা আনরিচেবল হলে বাকিগুলো
// দিয়ে average নেওয়া হয়, তাই রেজাল্ট বেশি স্থিতিশীল থাকে।

export const SERVERS = [
  {
    id: 'pubg',
    name: 'PUBG Mobile',
    icon: 'game-controller',
    hosts: [
      { label: 'Cloudflare 1', ip: '1.1.1.1', isDemo: true }, // ⬅️ আসল PUBG সার্ভার IP এখানে বসান
      { label: 'Cloudflare 2', ip: '1.0.0.1', isDemo: true },
    ],
  },
  {
    id: 'freefire',
    name: 'Free Fire',
    icon: 'flame',
    hosts: [
      { label: 'Google 1', ip: '8.8.8.8', isDemo: true }, // ⬅️ আসল Free Fire সার্ভার IP এখানে বসান
      { label: 'Google 2', ip: '8.8.4.4', isDemo: true },
    ],
  },
  {
    id: 'codm',
    name: 'Call of Duty Mobile',
    icon: 'skull',
    hosts: [
      { label: 'Quad9 1', ip: '9.9.9.9', isDemo: true }, // ⬅️ আসল CODM সার্ভার IP এখানে বসান
      { label: 'Quad9 2', ip: '149.112.112.112', isDemo: true },
    ],
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends: Bang Bang',
    icon: 'shield',
    hosts: [
      { label: 'OpenDNS 1', ip: '208.67.222.222', isDemo: true }, // ⬅️ আসল MLBB সার্ভার IP এখানে বসান
      { label: 'OpenDNS 2', ip: '208.67.220.220', isDemo: true },
    ],
  },
  {
    id: 'valorant',
    name: 'Valorant',
    icon: 'aperture',
    hosts: [
      { label: 'Verisign 1', ip: '64.6.64.6', isDemo: true }, // ⬅️ আসল Valorant সার্ভার IP এখানে বসান
      { label: 'Verisign 2', ip: '64.6.65.6', isDemo: true },
    ],
  },
  {
    id: 'general',
    name: 'General Reference',
    icon: 'globe-outline',
    hosts: [
      { label: 'Cloudflare', ip: '1.1.1.1', isDemo: true },
      { label: 'Google', ip: '8.8.8.8', isDemo: true },
      { label: 'Quad9', ip: '9.9.9.9', isDemo: true },
    ],
  },
];

// 🎯 Ping quality থ্রেশহোল্ড (মিলিসেকেন্ড) — UI-তে legend হিসেবেও দেখানো হয়।
// এখান থেকে বদলালে পুরো অ্যাপে (Gaming স্ক্রিন) সাথে সাথে reflect করবে।
export const PING_THRESHOLDS = {
  smooth: { max: 40, level: 'green' },   // < 40ms  → Smooth
  playable: { max: 90, level: 'yellow' }, // 40–90ms → Playable
  laggy: { max: Infinity, level: 'red' }, // > 90ms  → Laggy
};

export function pingLevel(ms) {
  if (ms < PING_THRESHOLDS.smooth.max) return 'green';
  if (ms <= PING_THRESHOLDS.playable.max) return 'yellow';
  return 'red';
}