// src/context/LanguageContext.js
// One global language state shared by all 3 tabs — toggling in one screen
// now updates the whole app instead of resetting per-tab.

import React, { createContext, useContext, useMemo, useState } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('bn'); // 'en' | 'bn'
  const toggleLanguage = () => setLanguage((p) => (p === 'en' ? 'bn' : 'en'));
  const value = useMemo(() => ({ language, toggleLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}

/** Helper: t(dict, lang) -> localized string from a {en, bn} pair */
export function tr(pair, language) {
  return pair?.[language] ?? pair?.en ?? '';
}
