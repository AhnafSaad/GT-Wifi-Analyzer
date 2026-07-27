// src/hooks/useRealPing.js
// react-native-ping দিয়ে সত্যিকারের ICMP ping করে ping/jitter/packet-loss মাপে।
// Math.random() নেই — প্রতিটা রিডিং সত্যিকারের নেটওয়ার্ক রাউন্ড-ট্রিপ থেকে আসে।

import { useState, useEffect, useRef } from 'react';
import { singlePing } from '../utils/ping';

const POLL_INTERVAL_MS = 2000;
const MAX_HISTORY_POINTS = 24;
// packet loss % আর jitter ক্যালকুলেট করার জন্য সাম্প্রতিক কতগুলো ping মনে রাখা হবে
const LOSS_WINDOW = 10;

export default function useRealPing(host = '8.8.8.8') {
  const [ping, setPing] = useState(null);
  const [jitter, setJitter] = useState(null);
  const [lossPct, setLossPct] = useState(null);
  const [pingHistory, setPingHistory] = useState([]);

  const intervalRef = useRef(null);
  const lastPingRef = useRef(null);
  const resultWindowRef = useRef([]); // true/false — সফল হয়েছিল কিনা

  useEffect(() => {
    let mounted = true;

    async function poll() {
      const result = await singlePing(host);
      if (!mounted) return;

      // loss window আপডেট করুন (সর্বোচ্চ শেষ LOSS_WINDOW টা রাখুন)
      resultWindowRef.current = [...resultWindowRef.current, result.ok].slice(-LOSS_WINDOW);
      const failCount = resultWindowRef.current.filter((ok) => !ok).length;
      setLossPct(Math.round((failCount / resultWindowRef.current.length) * 1000) / 10);

      if (result.ok) {
        setPing(result.ms);

        // jitter = আগের সফল ping-এর সাথে এখনকার পার্থক্য (consecutive delta)
        if (lastPingRef.current != null) {
          setJitter(Math.abs(result.ms - lastPingRef.current));
        }
        lastPingRef.current = result.ms;

        setPingHistory((prev) => {
          const next = [...prev, result.ms];
          return next.length > MAX_HISTORY_POINTS ? next.slice(-MAX_HISTORY_POINTS) : next;
        });
      }
      // ping fail হলে আগের ভ্যালুই স্ক্রিনে থেকে যাবে, শুধু loss% বাড়বে —
      // এতে চার্ট হঠাৎ শূন্যে নেমে বিভ্রান্তিকর দেখাবে না।
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [host]);

  return { ping, jitter, lossPct, pingHistory };
}