// src/utils/speedTest.js
// 🟢 Cloudflare-এর পাবলিক speed test endpoint (speed.cloudflare.com/__down, /__up)
// ব্যবহার করা হচ্ছে। আগে একটামাত্র (single) connection দিয়ে টেস্ট করা হতো, যেটা
// কখনোই পুরো bandwidth ব্যবহার করতে পারে না (আসল speed test tool গুলো — Fast.com,
// Cloudflare-এর নিজস্ব tool — সবসময় একাধিক connection সমান্তরালে খুলে পুরো bandwidth
// saturate করে)। এখন ৬টা parallel connection ব্যবহার করা হচ্ছে, সব connection-এর
// combined throughput যোগ করে আসল speed বের করা হচ্ছে — এতে Cloudflare-এর নিজের
// রেজাল্টের কাছাকাছি সংখ্যা আসার কথা।

const DOWNLOAD_URL = (bytes) => `https://speed.cloudflare.com/__down?bytes=${bytes}`;
const UPLOAD_URL = 'https://speed.cloudflare.com/__up';

const PARALLEL_STREAMS = 4; // 🟢 আগে 6 ছিল — এত বেশি stream + বড় ডেটা মিলে memory pressure এ download hang/fail করছিল, কমানো হলো
const DOWNLOAD_BYTES_PER_STREAM = 8 * 1000 * 1000; // 🟢 আগে 15MB ছিল, কমিয়ে 8MB করা হলো
const UPLOAD_BYTES_PER_STREAM = 4 * 1000 * 1000; // প্রতিটা স্ট্রিমে ৪MB

const PROGRESS_THROTTLE_MS = 200; // 🟢 প্রতিটা progress event-এ state update করলে UI/button lag করছিল, তাই throttle করা হলো

function singleDownloadStream(bytes, onBytes) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastLoaded = 0;
    xhr.open('GET', DOWNLOAD_URL(bytes));
    // 🟢 আগে responseType 'text' ছিল, যেটা পুরো response JS string হিসেবে memory-তে
    // রাখে — বড় সাইজে (একাধিক stream মিলে অনেক MB) এটা ভারী হয়ে download hang/fail
    // করাচ্ছিল। 'blob' অনেক বেশি memory-efficient, শুধু speed মাপার জন্য ডেটার
    // content-এর কোনো দরকারও নেই।
    xhr.responseType = 'blob';
    xhr.onprogress = (event) => {
      onBytes(event.loaded - lastLoaded);
      lastLoaded = event.loaded;
    };
    xhr.onload = () => resolve();
    xhr.onerror = () => reject(new Error('DOWNLOAD_FAILED'));
    xhr.ontimeout = () => reject(new Error('DOWNLOAD_TIMEOUT'));
    xhr.timeout = 25000;
    xhr.send();
  });
}

function singleUploadStream(bytes, payload, onBytes) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastLoaded = 0;
    xhr.open('POST', UPLOAD_URL);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.upload.onprogress = (event) => {
      onBytes(event.loaded - lastLoaded);
      lastLoaded = event.loaded;
    };
    xhr.onload = () => resolve();
    xhr.onerror = () => reject(new Error('UPLOAD_FAILED'));
    xhr.ontimeout = () => reject(new Error('UPLOAD_TIMEOUT'));
    xhr.timeout = 25000;
    xhr.send(payload);
  });
}

/**
 * ৬টা parallel connection দিয়ে download speed টেস্ট করে।
 * @param {(mbps: number) => void} onProgress - প্রতি ~200ms পরপর combined লাইভ speed (Mbps)
 * @returns {Promise<number>} শেষ average Mbps
 */
export async function runDownloadTest(onProgress) {
  const startTime = Date.now();
  let totalBytes = 0;
  let lastEmit = startTime;
  let intervalBytes = 0;

  const onBytes = (delta) => {
    totalBytes += delta;
    intervalBytes += delta;
    const now = Date.now();
    if (now - lastEmit >= PROGRESS_THROTTLE_MS) {
      const sec = (now - lastEmit) / 1000;
      const mbps = (intervalBytes * 8) / sec / 1_000_000;
      onProgress(mbps);
      lastEmit = now;
      intervalBytes = 0;
    }
  };

  const streams = Array.from({ length: PARALLEL_STREAMS }, () =>
    singleDownloadStream(DOWNLOAD_BYTES_PER_STREAM, onBytes)
  );
  await Promise.all(streams);

  const totalSec = (Date.now() - startTime) / 1000;
  return (totalBytes * 8) / totalSec / 1_000_000;
}

/**
 * ৬টা parallel connection দিয়ে upload speed টেস্ট করে।
 */
export async function runUploadTest(onProgress) {
  const chunk = 'x'.repeat(10000);
  const repeats = Math.ceil(UPLOAD_BYTES_PER_STREAM / chunk.length);
  const payload = chunk.repeat(repeats).slice(0, UPLOAD_BYTES_PER_STREAM);

  const startTime = Date.now();
  let totalBytes = 0;
  let lastEmit = startTime;
  let intervalBytes = 0;

  const onBytes = (delta) => {
    totalBytes += delta;
    intervalBytes += delta;
    const now = Date.now();
    if (now - lastEmit >= PROGRESS_THROTTLE_MS) {
      const sec = (now - lastEmit) / 1000;
      const mbps = (intervalBytes * 8) / sec / 1_000_000;
      onProgress(mbps);
      lastEmit = now;
      intervalBytes = 0;
    }
  };

  const streams = Array.from({ length: PARALLEL_STREAMS }, () =>
    singleUploadStream(UPLOAD_BYTES_PER_STREAM, payload, onBytes)
  );
  await Promise.all(streams);

  const totalSec = (Date.now() - startTime) / 1000;
  return (totalBytes * 8) / totalSec / 1_000_000;
}
