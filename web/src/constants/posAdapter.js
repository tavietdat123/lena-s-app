/**
 * Part of Speech (POS) Linguistic Adapter
 * Provides accurate, track-aware, and localized part-of-speech mappings
 * for both English (CEFR) and Vietnamese (VSL) curriculums.
 */

export const POS_DEFINITIONS = {
  noun: {
    key: 'noun',
    vi: 'Danh từ',
    en: 'Noun',
    ru: 'Существительное',
    tracks: ['vi', 'en']
  },
  verb: {
    key: 'verb',
    vi: 'Động từ',
    en: 'Verb',
    ru: 'Глагол',
    tracks: ['vi', 'en']
  },
  adjective: {
    key: 'adjective',
    vi: 'Tính từ',
    en: 'Adjective',
    ru: 'Прилагательное',
    tracks: ['vi', 'en']
  },
  adverb: {
    key: 'adverb',
    vi: 'Phó từ / Trạng từ',
    en: 'Adverb',
    ru: 'Наречие',
    tracks: ['vi', 'en']
  },
  classifier: {
    key: 'classifier',
    vi: 'Loại từ (con, cái, chiếc...)',
    en: 'Classifier (con, cái...)',
    ru: 'Счётное слово (Классификатор)',
    tracks: ['vi'] // Specific to Vietnamese grammar
  },
  phrasal_verb: {
    key: 'phrasal_verb',
    vi: 'Cụm động từ (Phrasal Verb)',
    en: 'Phrasal Verb',
    ru: 'Фразовый глагол',
    tracks: ['en'] // Specific to English grammar
  },
  phrase: {
    key: 'phrase',
    vi: 'Cụm từ / Quán ngữ',
    en: 'Phrase / Collocation',
    ru: 'Словосочетание',
    tracks: ['vi', 'en']
  },
  idiom: {
    key: 'idiom',
    vi: 'Thành ngữ',
    en: 'Idiom',
    ru: 'Идиома',
    tracks: ['vi', 'en']
  }
};

/**
 * Get localized display string for a Part of Speech
 * @param {string} pos - Stored pos key, e.g. 'noun', 'verb', 'phrasal_verb'
 * @param {string} targetLanguage - 'vi' | 'en'
 * @param {string} uiLang - 'vi' | 'en' | 'ru'
 * @returns {string}
 */
export function getDisplayPos(pos, targetLanguage = 'en', uiLang = 'en') {
  if (!pos) return '';
  const clean = String(pos).trim().toLowerCase().replace(/\s+/g, '_');
  const found = POS_DEFINITIONS[clean];
  if (found) {
    return found[uiLang] || found.en || pos;
  }
  return pos;
}

/**
 * Get available POS dropdown options tailored for the track & language
 * @param {string} targetLanguage - 'vi' | 'en'
 * @param {string} uiLang - 'vi' | 'en' | 'ru'
 * @returns {Array<{ value: string, label: string }>}
 */
export function getPosOptions(targetLanguage = 'en', uiLang = 'en') {
  const isVi = targetLanguage === 'vi';
  const trackKey = isVi ? 'vi' : 'en';

  return Object.values(POS_DEFINITIONS)
    .filter(item => item.tracks.includes(trackKey))
    .map(item => ({
      value: item.key,
      label: item[uiLang] || item.en
    }));
}
