import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, LANG_META, getTranslation } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children, currentUser }) {
  const [uiLang, setUiLangState] = useState(() => {
    // 1. First priority: persisted user preference in localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('linguavault_ui_lang');
      if (saved && TRANSLATIONS[saved]) return saved;
    }
    // 2. Second priority: user's registered native language
    if (currentUser?.native_language && TRANSLATIONS[currentUser.native_language]) {
      return currentUser.native_language;
    }
    return 'en';
  });

  // When currentUser loads, if user hasn't chosen an interface language yet, default to native_language or 'en'
  useEffect(() => {
    if (currentUser?.native_language && TRANSLATIONS[currentUser.native_language]) {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('linguavault_ui_lang') : null;
      if (!saved) {
        setUiLangState(currentUser.native_language);
        if (typeof window !== 'undefined') {
          localStorage.setItem('linguavault_ui_lang', currentUser.native_language);
        }
      }
    }
  }, [currentUser?.native_language]);

  const setUiLang = (lang) => {
    if (TRANSLATIONS[lang]) {
      setUiLangState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('linguavault_ui_lang', lang);
      }
    }
  };

  const t = getTranslation(uiLang);
  const currentLangMeta = LANG_META[uiLang] || LANG_META.en;

  return (
    <LanguageContext.Provider value={{
      uiLang,
      setUiLang,
      t,
      currentLangMeta,
      LANG_META,
      availableLangs: Object.values(LANG_META)
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    const fallbackLang = typeof window !== 'undefined' ? (localStorage.getItem('linguavault_ui_lang') || 'en') : 'en';
    return {
      uiLang: fallbackLang,
      setUiLang: () => {},
      t: getTranslation(fallbackLang),
      currentLangMeta: LANG_META[fallbackLang] || LANG_META.en,
      LANG_META,
      availableLangs: Object.values(LANG_META)
    };
  }
  return ctx;
}
