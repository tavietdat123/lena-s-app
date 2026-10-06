import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, LANG_META, getTranslation } from '../i18n/translations';
import { setGlobalTargetLanguage } from '../services/audioService';
import { getTopicDisplayName } from '../constants/topicMeta';

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

  const [targetLanguage, setTargetLanguageState] = useState(() => {
    // 1. First priority: strictly bound to authenticated account's learning target
    if (currentUser?.target_language && (currentUser.target_language === 'vi' || currentUser.target_language === 'en')) {
      setGlobalTargetLanguage(currentUser.target_language);
      return currentUser.target_language;
    }
    // 2. Second priority: cached preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('linguavault_target_language');
      if (saved === 'vi' || saved === 'en') {
        setGlobalTargetLanguage(saved);
        return saved;
      }
    }
    const fallback = 'en';
    setGlobalTargetLanguage(fallback);
    return fallback;
  });

  // When currentUser loads or switches, targetLanguage strictly syncs with user account
  useEffect(() => {
    if (currentUser?.target_language && (currentUser.target_language === 'vi' || currentUser.target_language === 'en')) {
      setTargetLanguageState(currentUser.target_language);
      setGlobalTargetLanguage(currentUser.target_language);
      if (typeof window !== 'undefined') {
        localStorage.setItem('linguavault_target_language', currentUser.target_language);
      }
    }
  }, [currentUser?.target_language, currentUser?.id]);

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
  }, [currentUser?.native_language, currentUser?.id]);

  const setUiLang = (lang) => {
    if (TRANSLATIONS[lang]) {
      setUiLangState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('linguavault_ui_lang', lang);
      }
    }
  };

  const setTargetLanguage = (targetLang) => {
    if (targetLang === 'vi' || targetLang === 'en') {
      setTargetLanguageState(targetLang);
      setGlobalTargetLanguage(targetLang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('linguavault_target_language', targetLang);
      }
    }
  };

  const t = getTranslation(uiLang);
  const currentLangMeta = LANG_META[uiLang] || LANG_META.en;
  const fluentLanguage = currentUser?.native_language || (targetLanguage === 'vi' ? 'en' : 'vi');

  const getWordMeaning = (w) => {
    if (!w) return '';
    if (fluentLanguage === 'en') {
      return w.meaning_en || w.meaning_vi || w.meaning || '';
    }
    if (fluentLanguage === 'ru') {
      return w.meaning_ru || w.meaning_en || w.meaning_vi || w.meaning || '';
    }
    return w.meaning_vi || w.meaning_en || w.meaning || '';
  };

  const getTopicName = (topic) => getTopicDisplayName(topic, fluentLanguage);

  return (
    <LanguageContext.Provider value={{
      uiLang,
      setUiLang,
      targetLanguage,
      setTargetLanguage,
      fluentLanguage,
      getWordMeaning,
      getTopicName,
      isVietnameseTrack: targetLanguage === 'vi',
      isEnglishTrack: targetLanguage === 'en',
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
