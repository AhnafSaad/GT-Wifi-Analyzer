import React, { createContext, useEffect, useState } from "react";

// সার্ভার থেকে ডেটা না পেলে বা ইন্টারনেট না থাকলে এই ডিফল্ট ভ্যালু কাজ করবে
const DEFAULT_CONFIG = {
  globalThresholds: {
    ping: { goodMax: 50, fairMax: 100 },
    jitter: { goodMax: 10, fairMax: 30 },
    packetLoss: { goodMax: 1, fairMax: 5 },
    dbm: { goodMin: -65, fairMin: -85 }
  },
  servers: [] 
};

export const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      // এখানে 'http://localhost:3000' এর জায়গায় আপনার লাইভ VPS সার্ভারের IP/Domain বসবে
      const response = await fetch('http://10.0.2.2:3000/api/config'); 
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error("Config fetch error, using fallback data:", error);
      // এরর হলে আগে থেকে থাকা বা ডিফল্ট কনফিগ ব্যবহার করবে
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, isLoading, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};