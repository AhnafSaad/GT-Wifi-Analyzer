# Circle Network — WiFi Analyzer

Android field-technician app: signal/ping/jitter/packet-loss dashboard,
one-tap game server latency test, and a DNS resolution check — each with
a single plain-language verdict and a synced EN/বাংলা toggle across all tabs.

## Project structure

```
CircleNetworkApp/
├── App.js                       # Font loading, language provider, floating tab bar
├── app.json
├── babel.config.js
├── package.json
└── src/
    ├── theme/index.js            # Design tokens: colors, spacing, radius, shadows, type scale
    ├── context/LanguageContext.js
    ├── constants/translations.js
    ├── components/
    │   ├── AppHeader.js          # Gradient header + animated EN/বাং toggle
    │   ├── PrimaryButton.js      # Gradient CTA button with press-scale animation
    │   ├── Gauge.js              # Animated circular signal gauge
    │   └── Bits.js               # Card, VerdictBadge, MetricRow, StatusTag, EmptyState
    └── screens/
        ├── DashboardScreen.js    # "Run Test" — combined signal/ping/jitter/loss verdict
        ├── GamingTestScreen.js   # "Test All Servers" — PUBG/Free Fire/CODM/MLBB/Valorant + reference
        └── DnsCheckScreen.js     # "DNS Check" — resolution speed + suggestion only when needed
```

## Setup

```bash
npm install
npx expo install --fix   # aligns every native package to this Expo SDK version
npm run web               # or: npm run android
```

If you hit a `registerWebModule is not a function` (or similar) error, it means
`expo-font` / `expo-modules-core` got a mismatched version — run:
```bash
npx expo install expo-font expo-modules-core
npm dedupe
```

---

## Making it real-time (replacing the demo data)

Right now every screen calls a local `generate...()` function that returns
random numbers so the UI is fully demoable with zero setup. To show *real*
network data, you need a few native modules — and because of that, **you can't
test real data in Expo Go or on web**; you need a custom **Expo Dev Client**
(a build of your own app with those native modules baked in) and a real
Android phone.

### Step 1 — Switch from Expo Go to a Dev Client

```bash
npx expo install expo-dev-client
```

Then build a dev client once (needs an EAS account, free tier is enough):
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
```
This produces an installable `.apk`. Install it on your test phone — from then
on, `npx expo start` will open into *your* app (with native modules) instead
of Expo Go.

### Step 2 — Real Wi-Fi signal (RSSI), SSID, IP

```bash
npx expo install react-native-wifi-reborn
```
```js
import WifiManager from 'react-native-wifi-reborn';

const rssi = await WifiManager.getCurrentSignalStrength(); // dBm, e.g. -58
const ssid = await WifiManager.getCurrentWifiSSID();
const ip   = await WifiManager.getIP();
```
Needs `ACCESS_FINE_LOCATION` permission on Android (Wi-Fi info is
location-sensitive at the OS level) — add it via `app.json`'s
`android.permissions` array, and request it at runtime with
`expo-location` or `PermissionsAndroid` before calling the above.

### Step 3 — Real ping, jitter, packet loss

```bash
npx expo install react-native-ping
```
```js
import ping from 'react-native-ping';

async function measure(host = '8.8.8.8', count = 8) {
  const samples = [];
  let lost = 0;
  for (let i = 0; i < count; i++) {
    try {
      samples.push(await ping.start(host, { timeout: 1000 }));
    } catch {
      lost++;
    }
  }
  const avgPing = samples.reduce((a, b) => a + b, 0) / samples.length;
  const jitter = Math.sqrt(samples.reduce((s, v) => s + (v - avgPing) ** 2, 0) / samples.length);
  const lossPct = (lost / count) * 100;
  return { avgPing, jitter, lossPct };
}
```
This does real ICMP echo requests — accurate ping/jitter/loss, same as a
desktop `ping` command.

### Step 4 — Real game-server latency

Same `react-native-ping` technique, just pointed at each game's regional
server IP/hostname instead of `8.8.8.8`. You'll want to look up the closest
regional endpoint for each title (PUBG/Free Fire/CODM/MLBB/Valorant all
publish or can be traced to regional server clusters) and swap in a real
IP per row instead of `basePing`.

### Step 5 — Real DNS resolution time

True DNS timing needs a raw DNS query (not just an HTTP request, which
mixes in TCP/TLS time too). Two practical options:

**A. DNS-over-HTTPS timing (simplest, no extra native module):**
```js
async function dnsCheckMs(hostname = 'example.com') {
  const start = Date.now();
  await fetch(`https://1.1.1.1/dns-query?name=${hostname}&type=A`, {
    headers: { accept: 'application/dns-json' },
  });
  return Date.now() - start;
}
```
Not a perfect system-DNS measurement, but a solid, realistic proxy for
"how fast is name resolution on this network" — and needs zero native code.

**B. Native raw DNS query (more accurate, more setup):**
```bash
npx expo install react-native-udp
```
Send a raw UDP DNS query packet to the device's configured DNS server and
time the response — more work to implement correctly, but matches exactly
what "DNS Check" implies.

### Step 6 — Real device scan (if you bring back a Devices tab later)

Ping-sweeping the LAN (192.168.x.1–254) using `react-native-ping` in a loop,
without router login, is exactly the "ping sweep" approach from your original
spec — it can't get device names/vendors, only "this IP responded."

---

### Summary of new native deps for real-time mode
```bash
npx expo install expo-dev-client react-native-wifi-reborn react-native-ping
```
(react-native-udp only if you choose the raw-DNS route in Step 5B)

None of these work in Expo Go or the web preview — they need the Dev Client
build from Step 1 running on an actual Android phone connected to the Wi-Fi
network you're testing.

## Brand

- Gradient: `#FF8A3D → #EA560F` (Circle Network Orange)
- Status: 🟢 `#1B9C5A` / 🟡 `#C48A0A` / 🔴 `#E0392F`
- Font: Inter (400/500/600/700/800), loaded via `@expo-google-fonts/inter`

## Language

`src/context/LanguageContext.js` holds one global `language` state — toggling
in the header on any tab updates the whole app instantly.
