// src/constants/translations.js
export const T = {
  // Tabs / titles
  dashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  gaming: { en: 'Gaming', bn: 'গেমিং' },
  dns: { en: 'DNS', bn: 'ডিএনএস' },

  // Dashboard
  runTest: { en: 'Run Test', bn: 'রান টেস্ট' },
  testing: { en: 'Testing…', bn: 'টেস্ট চলছে…' },
  startMonitoring: { en: 'Start Live Monitoring', bn: 'লাইভ মনিটরিং শুরু করুন' },
  stopMonitoring: { en: 'Stop Monitoring', bn: 'মনিটরিং বন্ধ করুন' },
  live: { en: 'LIVE', bn: 'লাইভ' },
  gamingDisclaimer: {
    en: 'Real ping to the nearest public routing point — not the exact game server (game servers block direct ping).',
    bn: 'কাছের পাবলিক রাউটিং পয়েন্টে সত্যিকারের পিং — একদম গেম সার্ভার না (গেম সার্ভার সরাসরি পিং ব্লক করে রাখে)।',
  },
  dnsDisclaimer: {
    en: 'Real round-trip time to Google\'s DNS-over-HTTPS resolver — measures your actual DNS lookup speed.',
    bn: 'Google-এর DNS-over-HTTPS resolver-এ সত্যিকারের রাউন্ড-ট্রিপ টাইম — আপনার আসল DNS লুকআপ স্পিড মাপে।',
  },
  signal: { en: 'Signal', bn: 'সিগন্যাল' },
  ping: { en: 'Ping', bn: 'পিং' },
  jitter: { en: 'Jitter', bn: 'জিটার' },
  packetLoss: { en: 'Packet Loss', bn: 'প্যাকেট লস' },
  signalHistory: { en: 'Signal Strength (live)', bn: 'সিগন্যাল স্ট্রেংথ (লাইভ)' },
  pingHistory: { en: 'Ping (live)', bn: 'পিং (লাইভ)' },
  unknownNetwork: { en: 'Unknown Network', bn: 'অজানা নেটওয়ার্ক' },
  locationPermissionNeeded: { en: 'Allow location access to see network name', bn: 'নেটওয়ার্কের নাম দেখতে লোকেশন পারমিশন দিন' },
  permissionExplain: {
    en: 'GT Wifi Analyzer needs Location permission to read your WiFi signal and network name — this is an Android rule; your location is never stored.',
    bn: 'WiFi সিগন্যাল আর নেটওয়ার্কের নাম পড়তে GT Wifi Analyzer-এর Location পারমিশন দরকার — এটা Android-এর নিয়ম, আপনার লোকেশন কখনো সংরক্ষণ করা হয় না।',
  },
  grantPermission: { en: 'Allow Permission', bn: 'পারমিশন দিন' },
  openSettings: { en: 'Open Settings', bn: 'সেটিংসে যান' },
  permissionSettingsHint: {
    en: 'Permission was blocked earlier. Tap above, then turn on Location for GT Wifi Analyzer from the Settings page.',
    bn: 'পারমিশন আগে ব্লক হয়ে গেছে। উপরে চাপুন, তারপর Settings পেজ থেকে GT Wifi Analyzer-এর জন্য Location অন করুন।',
  },
  notConnectedWifi: { en: 'Not connected to WiFi', bn: 'WiFi-এ কানেক্টেড নেই' },
  good: { en: 'GOOD', bn: 'ভালো' },
  fair: { en: 'FAIR', bn: 'মোটামুটি' },
  poor: { en: 'POOR', bn: 'খারাপ' },
  allGood: { en: 'All Good', bn: 'সব ঠিক আছে' },
  weakSignal: { en: 'Weak Signal', bn: 'সিগন্যাল দুর্বল' },
  highPacketLoss: { en: 'High packet loss — check connector/cable', bn: 'প্যাকেট লস বেশি — কানেক্টর/ক্যাবল চেক করুন' },
  slowNetwork: { en: 'Network slow — check router/ISP', bn: 'নেটওয়ার্ক ধীর — রাউটার/আইএসপি চেক করুন' },
  minorIssue: { en: 'Mostly fine — minor improvement possible', bn: 'মোটামুটি ঠিক আছে — সামান্য উন্নতির সুযোগ আছে' },
  tapToStartDashboard: { en: 'Tap "Start Live Monitoring" to watch this connection in real time.', bn: 'এই কানেকশন রিয়েল-টাইমে দেখতে "লাইভ মনিটরিং শুরু করুন" চাপুন।' },

  // Gaming
  testAllServers: { en: 'Test All Servers', bn: 'সব সার্ভার টেস্ট করুন' },
  smooth: { en: 'Smooth', bn: 'স্মুথ' },
  playable: { en: 'Playable', bn: 'খেলার যোগ্য' },
  laggy: { en: 'Laggy', bn: 'ল্যাগি' },
  demoIp: { en: 'DEMO IP', bn: 'ডেমো আইপি' },
  tapToStartGaming: { en: 'Tap "Test All Servers" to check every game at once.', bn: 'এক ট্যাপে সব গেম চেক করতে "সব সার্ভার টেস্ট করুন" চাপুন।' },

  // DNS
  runCheck: { en: 'DNS Check', bn: 'ডিএনএস চেক করুন' },
  checking: { en: 'Checking…', bn: 'চেক চলছে…' },
  resolutionTime: { en: 'DNS Resolution Time', bn: 'ডিএনএস রেজোলিউশন টাইম' },
  stable: { en: 'Stable', bn: 'স্থিতিশীল' },
  slightlySlow: { en: 'Slightly Slow', bn: 'কিছুটা ধীর' },
  unstable: { en: 'Unstable / Slow', bn: 'অস্থিতিশীল / ধীর' },
  workingWell: { en: 'DNS is working properly. No action needed.', bn: 'ডিএনএস ঠিকভাবে কাজ করছে। কোনো পদক্ষেপ নেওয়ার দরকার নেই।' },
  suggestionTitle: { en: 'Suggestion', bn: 'পরামর্শ' },
  suggestionBody: {
    en: 'Consider switching to Cloudflare (1.1.1.1) or Google DNS (8.8.8.8) for faster, more reliable browsing.',
    bn: 'দ্রুত ও নির্ভরযোগ্য ব্রাউজিংয়ের জন্য Cloudflare (1.1.1.1) বা Google DNS (8.8.8.8)-এ পরিবর্তনের কথা বিবেচনা করুন।',
  },
  tapToStartDns: { en: 'Tap "DNS Check" to test resolution speed on this network.', bn: 'এই নেটওয়ার্কের রেজোলিউশন স্পিড চেক করতে "ডিএনএস চেক করুন" চাপুন।' },
  currentDns: { en: 'Current DNS Server', bn: 'বর্তমান ডিএনএস সার্ভার' },

  // Network scan (Connected Devices + Nearby Networks)
  network: { en: 'Network', bn: 'নেটওয়ার্ক' },
  connectedDevices: { en: 'Connected Devices', bn: 'কানেক্টেড ডিভাইস' },
  connectedDevicesDisclaimer: {
    en: 'Approximate count using ping + a common-port check (catches devices that block ping, like iPhones) — some devices may still not respond. Not the router\'s exact device list.',
    bn: 'পিং + কমন পোর্ট চেক দিয়ে আনুমানিক সংখ্যা (যেসব ডিভাইস ping ব্লক করে, যেমন iPhone, সেগুলোও ধরার চেষ্টা করা হয়) — তবুও কিছু ডিভাইস রেসপন্স না দিতে পারে। এটা রাউটারের হুবহু ডিভাইস তালিকা না।',
  },
  scanDevices: { en: 'Scan Network', bn: 'নেটওয়ার্ক স্ক্যান করুন' },
  scanning: { en: 'Scanning…', bn: 'স্ক্যান চলছে…' },
  devicesFound: { en: 'devices found', bn: 'টি ডিভাইস পাওয়া গেছে' },
  tapToScanDevices: { en: 'Tap "Scan Network" to see how many devices are connected.', bn: 'কতগুলো ডিভাইস কানেক্টেড আছে দেখতে "নেটওয়ার্ক স্ক্যান করুন" চাপুন।' },

  nearbyNetworks: { en: 'Nearby Networks', bn: 'আশেপাশের নেটওয়ার্ক' },
  nearbyNetworksDisclaimer: {
    en: 'WiFi networks detected around you, sorted by signal strength.',
    bn: 'আপনার আশেপাশে যেসব WiFi নেটওয়ার্ক শনাক্ত হয়েছে, সিগন্যাল স্ট্রেংথ অনুযায়ী সাজানো।',
  },
  rescan: { en: 'Rescan', bn: 'আবার স্ক্যান করুন' },
  tapToScanNetworks: { en: 'Tap "Rescan" to see WiFi networks nearby.', bn: 'আশেপাশের WiFi নেটওয়ার্ক দেখতে "আবার স্ক্যান করুন" চাপুন।' },
  networksFound: { en: 'networks found', bn: 'টি নেটওয়ার্ক পাওয়া গেছে' },
  scanLimitReached: {
    en: 'Android limits WiFi scans to a few per 2 minutes. Please wait a moment and try again.',
    bn: 'Android প্রতি ২ মিনিটে সীমিত সংখ্যক WiFi scan-এর অনুমতি দেয়। একটু অপেক্ষা করে আবার চেষ্টা করুন।',
  },

  // Speed Test
  speedTest: { en: 'Speed Test', bn: 'স্পিড টেস্ট' },
  speedIdle: { en: 'Ready', bn: 'প্রস্তুত' },
  speedTestingPing: { en: 'Checking ping…', bn: 'পিং চেক হচ্ছে…' },
  speedTestingDownload: { en: 'Testing download…', bn: 'ডাউনলোড টেস্ট হচ্ছে…' },
  speedTestingUpload: { en: 'Testing upload…', bn: 'আপলোড টেস্ট হচ্ছে…' },
  speedTestingGeneric: { en: 'Testing…', bn: 'টেস্ট চলছে…' },
  speedDone: { en: 'Done', bn: 'সম্পন্ন' },
  speedError: { en: 'Test failed', bn: 'টেস্ট ব্যর্থ হয়েছে' },
  speedErrorDetail: {
    en: 'Could not complete the speed test — check your connection and try again.',
    bn: 'স্পিড টেস্ট সম্পন্ন করা যায়নি — আপনার কানেকশন চেক করে আবার চেষ্টা করুন।',
  },
  speedTestAgain: { en: 'Test Again', bn: 'আবার টেস্ট করুন' },
  speedDownload: { en: 'Download', bn: 'ডাউনলোড' },
  speedUpload: { en: 'Upload', bn: 'আপলোড' },
  speedPing: { en: 'Ping (ms)', bn: 'পিং (ms)' },
  speedDisclaimer: {
    en: 'Tested against Cloudflare\'s global network — a good real-world estimate of your internet speed, though results can vary with network conditions.',
    bn: 'Cloudflare-এর গ্লোবাল নেটওয়ার্কের বিপরীতে টেস্ট করা হয়েছে — এটা আপনার ইন্টারনেট স্পিডের একটা বাস্তবসম্মত আনুমানিক পরিমাপ, তবে নেটওয়ার্ক অবস্থার উপর ভিত্তি করে ফলাফল কিছুটা পরিবর্তিত হতে পারে।',
  },
};