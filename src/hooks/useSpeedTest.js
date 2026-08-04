// src/hooks/useSpeedTest.js
// Fast.com-এর মতো: screen খুললেই auto download → upload টেস্ট চলবে।

import { useCallback, useEffect, useRef, useState } from 'react';
import { runDownloadTest, runUploadTest } from '../utils/speedTest';

export default function useSpeedTest() {
  const [phase, setPhase] = useState('idle'); // idle | download | upload | done | error
  const [liveMbps, setLiveMbps] = useState(0);
  const [downloadMbps, setDownloadMbps] = useState(null);
  const [uploadMbps, setUploadMbps] = useState(null);
  const [error, setError] = useState(null);
  const runIdRef = useRef(0); // 🟢 পুরনো test চলাকালীন নতুন test শুরু হলে পুরনোটার callback ignore করার জন্য

  const runTest = useCallback(async () => {
    const myRunId = ++runIdRef.current;
    setError(null);
    setDownloadMbps(null);
    setUploadMbps(null);
    setLiveMbps(0);

    try {
      setPhase('download');
      const avgDown = await runDownloadTest((mbps) => {
        if (runIdRef.current === myRunId) setLiveMbps(mbps);
      });
      if (runIdRef.current !== myRunId) return;
      setDownloadMbps(avgDown);

      setPhase('upload');
      setLiveMbps(0);
      const avgUp = await runUploadTest((mbps) => {
        if (runIdRef.current === myRunId) setLiveMbps(mbps);
      });
      if (runIdRef.current !== myRunId) return;
      setUploadMbps(avgUp);

      setPhase('done');
    } catch (err) {
      if (runIdRef.current === myRunId) {
        setError(err?.message || 'TEST_FAILED');
        setPhase('error');
      }
    }
  }, []);

  // 🟢 screen mount হওয়ার সাথে সাথে auto শুরু (Fast.com-এর মতো)
  useEffect(() => {
    runTest();
  }, [runTest]);

  return { phase, liveMbps, downloadMbps, uploadMbps, error, runTest };
}
