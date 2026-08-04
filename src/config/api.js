// 🟢 এই ফাইলটাই একমাত্র জায়গা যেখান থেকে backend এর address ঠিক করা হয়।
// এখন: PC এর লোকাল network IP (ফোন আর PC একই WiFi তে থাকতে হবে)।
// পরে VPS এ deploy হয়ে গেলে শুধু নিচের API_BASE_URL এই একটা লাইন বদলে
// আপনার ডোমেইন/IP বসিয়ে দিলেই পুরো app নতুন সার্ভারে পয়েন্ট করবে।

// ⚠️ Production এ যাওয়ার পর এটা বদলে দিন, যেমন:
// export const API_BASE_URL = 'https://your-vps-domain.com';

export const API_BASE_URL = 'http://10.26.8.122:3000';
