/**
 * Unified Level & Framework Adapter for LinguaVault V2
 * Bridges CEFR (A1 - C2) for English and VSL (Bậc 1 - Bậc 6) for Vietnamese.
 */

export const TARGET_LANGUAGES = [
  {
    id: 'en',
    code: 'en',
    nameEn: 'English',
    nameVi: 'Tiếng Anh',
    nameRu: 'Английский',
    flag: '🇬🇧',
    framework: 'CEFR',
    frameworkDesc: 'CEFR A1 – C2'
  },
  {
    id: 'vi',
    code: 'vi',
    nameEn: 'Vietnamese',
    nameVi: 'Tiếng Việt',
    nameRu: 'Вьетнамский',
    flag: '🇻🇳',
    framework: 'VSL',
    frameworkDesc: 'VSL Bậc 1 – 6'
  }
];

export const VSL_LEVELS_META = {
  A1: {
    code: 'BAC_1',
    cefrEquivalent: 'A1',
    labelVi: 'Bậc 1 - Sơ cấp 1 (A1)',
    labelEn: 'Level 1 - Elementary 1 (A1)',
    labelRu: 'Уровень 1 - Начальный 1 (A1)',
    shortVi: 'Bậc 1',
    shortEn: 'Level 1',
    shortRu: 'Ур. 1',
    color: '#0284c7',
    descVi: '6 Thanh điệu, chào hỏi & số đếm',
    descEn: '6 Tones, greetings & numbers',
    descRu: '6 тонов, приветствия и числа'
  },
  A2: {
    code: 'BAC_2',
    cefrEquivalent: 'A2',
    labelVi: 'Bậc 2 - Sơ cấp 2 (A2)',
    labelEn: 'Level 2 - Elementary 2 (A2)',
    labelRu: 'Уровень 2 - Начальный 2 (A2)',
    shortVi: 'Bậc 2',
    shortEn: 'Level 2',
    shortRu: 'Ур. 2',
    color: '#10b981',
    descVi: 'Đời sống, ẩm thực & mua sắm',
    descEn: 'Daily life, food & shopping',
    descRu: 'Повседневная жизнь, еда и покупки'
  },
  B1: {
    code: 'BAC_3',
    cefrEquivalent: 'B1',
    labelVi: 'Bậc 3 - Trung cấp 1 (B1)',
    labelEn: 'Level 3 - Intermediate 1 (B1)',
    labelRu: 'Уровень 3 - Средний 1 (B1)',
    shortVi: 'Bậc 3',
    shortEn: 'Level 3',
    shortRu: 'Ур. 3',
    color: '#f59e0b',
    descVi: 'Liên từ đôi, Bị vs Được',
    descEn: 'Conjunctions, passive nuance',
    descRu: 'Союзы, пассивный залог'
  },
  B2: {
    code: 'BAC_4',
    cefrEquivalent: 'B2',
    labelVi: 'Bậc 4 - Trung cấp 2 (B2)',
    labelEn: 'Level 4 - Intermediate 2 (B2)',
    labelRu: 'Уровень 4 - Средний 2 (B2)',
    shortVi: 'Bậc 4',
    shortEn: 'Level 4',
    shortRu: 'Ур. 4',
    color: '#8b5cf6',
    descVi: 'Giao tiếp công sở & đàm phán',
    descEn: 'Workplace & negotiation',
    descRu: 'Деловое общение и переговоры'
  },
  C1: {
    code: 'BAC_5',
    cefrEquivalent: 'C1',
    labelVi: 'Bậc 5 - Cao cấp 1 (C1)',
    labelEn: 'Level 5 - Advanced 1 (C1)',
    labelRu: 'Уровень 5 - Продвинутый 1 (C1)',
    shortVi: 'Bậc 5',
    shortEn: 'Level 5',
    shortRu: 'Ур. 5',
    color: '#ec4899',
    descVi: 'Hán - Việt học thuật & báo chí',
    descEn: 'Sino-Vietnamese & press',
    descRu: 'Хань-Вьет и публицистика'
  },
  C2: {
    code: 'BAC_6',
    cefrEquivalent: 'C2',
    labelVi: 'Bậc 6 - Cao cấp 2 (C2)',
    labelEn: 'Level 6 - Mastery 2 (C2)',
    labelRu: 'Уровень 6 - Владение в совершенстве (C2)',
    shortVi: 'Bậc 6',
    shortEn: 'Level 6',
    shortRu: 'Ур. 6',
    color: '#ef4444',
    descVi: 'Thành ngữ & văn phong bản ngữ',
    descEn: 'Idioms & native nuance',
    descRu: 'Идиомы и стилистика'
  }
};

/**
 * Normalizes input level string to standard A1-C2 canonical key
 */
export function normalizeLevelKey(level) {
  if (!level) return 'B1';
  const clean = String(level).toUpperCase().trim();
  if (clean === 'BAC_1' || clean === 'BẬC 1' || clean === 'BAC 1' || clean === '1') return 'A1';
  if (clean === 'BAC_2' || clean === 'BẬC 2' || clean === 'BAC 2' || clean === '2') return 'A2';
  if (clean === 'BAC_3' || clean === 'BẬC 3' || clean === 'BAC 3' || clean === '3') return 'B1';
  if (clean === 'BAC_4' || clean === 'BẬC 4' || clean === 'BAC 4' || clean === '4') return 'B2';
  if (clean === 'BAC_5' || clean === 'BẬC 5' || clean === 'BAC 5' || clean === '5') return 'C1';
  if (clean === 'BAC_6' || clean === 'BẬC 6' || clean === 'BAC 6' || clean === '6') return 'C2';
  return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(clean) ? clean : 'B1';
}

/**
 * Returns formatted display string for a proficiency level
 */
export function getDisplayLevel(level, targetLanguage = 'en', uiLang = 'en', isShort = false) {
  const normKey = normalizeLevelKey(level);

  if (targetLanguage === 'vi') {
    const meta = VSL_LEVELS_META[normKey] || VSL_LEVELS_META.B1;
    if (isShort) {
      if (uiLang === 'ru') return meta.shortRu;
      if (uiLang === 'vi') return meta.shortVi;
      return meta.shortEn;
    }
    if (uiLang === 'ru') return meta.labelRu;
    if (uiLang === 'vi') return meta.labelVi;
    return meta.labelEn;
  }

  // English Track (CEFR)
  if (isShort) return normKey;
  return `${normKey}`;
}

/**
 * Get Level Color Theme
 */
export function getLevelColor(level) {
  const normKey = normalizeLevelKey(level);
  return VSL_LEVELS_META[normKey]?.color || '#0284c7';
}
