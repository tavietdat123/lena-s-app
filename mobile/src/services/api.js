import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_ENDPOINT,
  API_ENDPOINT_CONFIG_VERSION,
  DEVELOPMENT_API_ENDPOINTS
} from '../config';

const STORAGE_KEYS = {
  serverUrl: 'linguavault_server_url',
  serverConfigVersion: 'linguavault_server_config_version',
  authToken: 'linguavault_auth_token',
  cachedUser: 'linguavault_cached_user'
};

// Dynamic Server URL for Simulator, LAN Wi-Fi & Remote Cloud Tunnel
const defaultHost = (typeof window !== 'undefined' && window.location && window.location.hostname) 
  ? window.location.hostname 
  : 'localhost';

export const CANDIDATE_SERVERS = [
  API_ENDPOINT,
  `http://${defaultHost}:5001`,
  ...DEVELOPMENT_API_ENDPOINTS
];

const webStoredEndpointIsCurrent = typeof localStorage !== 'undefined'
  && localStorage.getItem(STORAGE_KEYS.serverConfigVersion) === API_ENDPOINT_CONFIG_VERSION;
let currentServerUrl = webStoredEndpointIsCurrent && localStorage.getItem(STORAGE_KEYS.serverUrl)
  ? localStorage.getItem(STORAGE_KEYS.serverUrl)
  : API_ENDPOINT;

export const getServerUrl = () => currentServerUrl;

export const setServerUrl = (url) => {
  if (!url) return currentServerUrl;
  let formatted = url.trim().replace(/\/+$/, '');
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = 'http://' + formatted;
  }
  currentServerUrl = formatted;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('linguavault_server_url', formatted);
      localStorage.setItem(STORAGE_KEYS.serverConfigVersion, API_ENDPOINT_CONFIG_VERSION);
    } catch (e) {}
  }
  AsyncStorage.setItem(STORAGE_KEYS.serverUrl, formatted).catch(() => {});
  AsyncStorage.setItem(STORAGE_KEYS.serverConfigVersion, API_ENDPOINT_CONFIG_VERSION).catch(() => {});
  return currentServerUrl;
};

let authToken = null;
if (typeof localStorage !== 'undefined') {
  try {
    authToken = localStorage.getItem('linguavault_auth_token');
  } catch (e) {}
}

export const getMobileAuthToken = () => authToken;
export const setMobileAuthToken = (token) => {
  authToken = token;
  if (typeof localStorage !== 'undefined') {
    try {
      if (token) localStorage.setItem('linguavault_auth_token', token);
      else localStorage.removeItem('linguavault_auth_token');
    } catch (e) {}
  }
  const operation = token
    ? AsyncStorage.setItem(STORAGE_KEYS.authToken, token)
    : AsyncStorage.removeItem(STORAGE_KEYS.authToken);
  operation.catch(() => {});
};

let nativeStorageHydrated = false;
let nativeStorageHydrationPromise = null;

export const hydrateMobileSession = async () => {
  if (nativeStorageHydrated) return;
  if (!nativeStorageHydrationPromise) {
    nativeStorageHydrationPromise = (async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          STORAGE_KEYS.serverUrl,
          STORAGE_KEYS.serverConfigVersion,
          STORAGE_KEYS.authToken
        ]);
        const stored = Object.fromEntries(entries);
        if (
          stored[STORAGE_KEYS.serverConfigVersion] === API_ENDPOINT_CONFIG_VERSION
          && stored[STORAGE_KEYS.serverUrl]
        ) {
          currentServerUrl = stored[STORAGE_KEYS.serverUrl];
        } else {
          currentServerUrl = API_ENDPOINT;
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.serverUrl, API_ENDPOINT],
            [STORAGE_KEYS.serverConfigVersion, API_ENDPOINT_CONFIG_VERSION]
          ]);
        }
        if (!authToken && stored[STORAGE_KEYS.authToken]) authToken = stored[STORAGE_KEYS.authToken];
      } finally {
        nativeStorageHydrated = true;
      }
    })();
  }
  await nativeStorageHydrationPromise;
};

const cacheMobileUser = (user) => {
  if (user) {
    AsyncStorage.setItem(STORAGE_KEYS.cachedUser, JSON.stringify(user)).catch(() => {});
  }
};

export const getCachedMobileUser = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.cachedUser);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

// Safe Fast Fetch with Timeout (Default 5 seconds)
export const safeFetch = async (url, options = {}, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

// Auto-healing API requester
export const requestApi = async (endpoint, options = {}, timeoutMs = 6000) => {
  await hydrateMobileSession();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const mergedOptions = { ...options, headers };

  // 1. Try with current configured server first
  try {
    const res = await safeFetch(`${currentServerUrl}${endpoint}`, mergedOptions, timeoutMs);
    const data = await res.json().catch(() => null);
    if (data) {
      return data;
    }
    if (res.ok) {
      return { success: true };
    }
  } catch (err) {
    // Current server unreachable, try candidates
  }

  // 2. Scan all candidate servers rapidly in parallel
  const scanPromises = CANDIDATE_SERVERS
    .filter(c => c !== currentServerUrl)
    .map(async (candidate) => {
      const res = await safeFetch(`${candidate}${endpoint}`, mergedOptions, 3000);
      const data = await res.json().catch(() => null);
      if (data) {
        setServerUrl(candidate);
        return data;
      }
      throw new Error('Not available');
    });

  try {
    return await Promise.any(scanPromises);
  } catch (e) {
    throw new Error('Không thể kết nối đến máy chủ LinguaVault. Hãy kiểm tra Internet và thử lại.');
  }
};

export const mobileApi = {
  getBaseUrl: () => currentServerUrl,

  // 0. Authentication & User Profile
  auth: {
    register: async (data) => {
      const res = await requestApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res && res.success && res.data?.token) {
        setMobileAuthToken(res.data.token);
        cacheMobileUser(res.data.user);
      }
      return res;
    },

    login: async (username, password) => {
      const res = await requestApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (res && res.success && res.data?.token) {
        setMobileAuthToken(res.data.token);
        cacheMobileUser(res.data.user);
      }
      return res;
    },

    guestLogin: async () => {
      const res = await requestApi('/api/auth/guest-login', {
        method: 'POST'
      });
      if (res && res.success && res.data?.token) {
        setMobileAuthToken(res.data.token);
        cacheMobileUser(res.data.user);
      }
      return res;
    },

    getMe: async () => {
      try {
        return await requestApi('/api/auth/me');
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    updateProfile: async (data) => {
      return await requestApi('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    logout: async () => {
      setMobileAuthToken(null);
      AsyncStorage.removeItem(STORAGE_KEYS.cachedUser).catch(() => {});
      try {
        await requestApi('/api/auth/logout', { method: 'POST' });
      } catch (e) {}
      return { success: true };
    },

    getCachedUser: getCachedMobileUser
  },

  // 0.1 Connection & Server Health
  checkHealth: async () => {
    try {
      const data = await requestApi('/api/health', {}, 1500);
      return { success: true, data, url: currentServerUrl };
    } catch (e) {
      return { success: false, error: e.message, url: currentServerUrl };
    }
  },

  // 1. Vocabulary (Kho từ vựng)
  getWords: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await requestApi(`/api/vocab${query ? `?${query}` : ''}`);
    } catch (e) {
      console.warn('API fetch error (getWords):', e);
      return { success: false, data: [] };
    }
  },

  getWordById: async (id) => {
    return await requestApi(`/api/vocab/${id}`);
  },

  createWord: async (data) => {
    return await requestApi('/api/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updateWord: async (id, data) => {
    return await requestApi(`/api/vocab/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  deleteWord: async (id) => {
    return await requestApi(`/api/vocab/${id}`, { method: 'DELETE' });
  },

  autoLookup: async (word) => {
    return await requestApi(`/api/vocab/lookup?word=${encodeURIComponent(word)}`);
  },

  // 1.5 Topics & Categories (Quản lý Chủ đề)
  getTopics: async () => {
    try {
      return await requestApi('/api/topics');
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createTopic: async (data) => {
    return await requestApi('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updateTopic: async (id, data) => {
    return await requestApi(`/api/topics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  deleteTopic: async (id) => {
    return await requestApi(`/api/topics/${id}`, { method: 'DELETE' });
  },

  assignTopic: async (word_id, topic_id) => {
    return await requestApi('/api/topics/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word_id, topic_id })
    });
  },

  // 2. Sentence Patterns (Mẫu câu)
  getPatterns: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await requestApi(`/api/patterns${query ? `?${query}` : ''}`);
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getPatternById: async (id) => {
    return await requestApi(`/api/patterns/${id}`);
  },

  createPattern: async (data) => {
    return await requestApi('/api/patterns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updatePattern: async (id, data) => {
    return await requestApi(`/api/patterns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  deletePattern: async (id) => {
    return await requestApi(`/api/patterns/${id}`, { method: 'DELETE' });
  },

  // 2b. Sentence Pattern Categories (Chức năng mẫu câu)
  getPatternCategories: async () => {
    try {
      return await requestApi('/api/pattern-categories');
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createPatternCategory: async (data) => {
    return await requestApi('/api/pattern-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updatePatternCategory: async (id, data) => {
    return await requestApi(`/api/pattern-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  deletePatternCategory: async (id) => {
    return await requestApi(`/api/pattern-categories/${id}`, { method: 'DELETE' });
  },

  resetPatternCategories: async () => {
    return await requestApi('/api/pattern-categories/reset-defaults', { method: 'POST' });
  },

  // 3. Notes & Smart Reader (Ghi chú & Bài đọc)
  getNotes: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await requestApi(`/api/notes${query ? `?${query}` : ''}`);
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getNoteById: async (id) => {
    return await requestApi(`/api/notes/${id}`);
  },

  createNote: async (data) => {
    return await requestApi('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updateNote: async (id, data) => {
    return await requestApi(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  deleteNote: async (id) => {
    return await requestApi(`/api/notes/${id}`, { method: 'DELETE' });
  },

  // 4. SRS Spaced Repetition (Ôn tập & Thống kê chuỗi ngày)
  getDueItems: async () => {
    try {
      return await requestApi('/api/srs/due');
    } catch (e) {
      return { success: false, data: { words: [], patterns: [] } };
    }
  },

  submitReview: async (id, type, rating) => {
    return await requestApi('/api/srs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type, rating })
    });
  },

  getStats: async () => {
    try {
      return await requestApi('/api/srs/stats');
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  // 5. AI Service (Gemini Lab)
  parseSentenceAI: async (sentence) => {
    return await requestApi('/api/ai/parse-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence })
    }, 35000);
  },

  checkSentenceAI: async (targetItem, userSentence) => {
    return await requestApi('/api/ai/check-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetItem, userSentence })
    }, 35000);
  },

  generateStoryAI: async (words = []) => {
    return await requestApi('/api/ai/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words })
    }, 35000);
  },

  paraphraseSentenceAI: async (sentence, tone = 'business') => {
    return await requestApi('/api/ai/paraphrase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence, tone })
    }, 35000);
  },

  exploreCollocationsAI: async (word) => {
    return await requestApi('/api/ai/collocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word })
    }, 35000);
  },

  generateDialogueAI: async (scenario, userWords = []) => {
    return await requestApi('/api/ai/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, userWords })
    }, 35000);
  },

  translateInContextAI: async ({ text, contextSentence = '', articleTitle = '', articleTopic = 'General' }) => {
    return await requestApi('/api/ai/translate-in-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, contextSentence, articleTitle, articleTopic })
    }, 30000);
  },

  // 6. Settings & Backup / Restore
  getSettings: async () => {
    try {
      return await requestApi('/api/settings');
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveSettings: async (data) => {
    return await requestApi('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  exportDataUrl: () => {
    const token = getMobileAuthToken();
    return token
      ? `${currentServerUrl}/api/backup/export?token=${encodeURIComponent(token)}`
      : `${currentServerUrl}/api/backup/export`;
  },

  exportData: async () => {
    return await requestApi('/api/backup/export');
  },

  importData: async (data) => {
    return await requestApi('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
  },

  // 7. Interactive Quiz Hub
  getQuizTopics: async () => {
    try {
      return await requestApi('/api/quiz/topics');
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getQuizDates: async () => {
    try {
      return await requestApi('/api/quiz/dates');
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  generateQuiz: async (params = { topic: 'All', count: 5, mode: 'mixed' }) => {
    return await requestApi('/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  },

  generateAIQuiz: async (params = { topic: 'All', count: 5, mode: 'mixed', words: [], level: 'all' }) => {
    return await requestApi('/api/quiz/generate-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    }, 45000);
  },

  generatePatternQuiz: async (params = { tone: 'all', count: 5, mode: 'mixed', level: 'all' }) => {
    return await requestApi('/api/quiz/generate-pattern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  },

  generateAIPatternQuiz: async (params = { tone: 'all', count: 5, level: 'all', mode: 'mixed' }) => {
    return await requestApi('/api/quiz/generate-pattern-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    }, 45000);
  },

  submitQuiz: async (answers = [], history_id = null) => {
    const payload = typeof answers === 'object' && !Array.isArray(answers) ? answers : { answers, history_id };
    return await requestApi('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // Quiz History (Lịch Sử Đề & Làm Lại)
  getQuizHistory: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await requestApi(`/api/quiz/history?${query}`);
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getQuizHistoryById: async (id) => {
    try {
      return await requestApi(`/api/quiz/history/${id}`);
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  deleteQuizHistory: async (id) => {
    return await requestApi(`/api/quiz/history/${id}`, { method: 'DELETE' });
  },

  // 8. Telegram Bot & Daily Goal
  getTelegramSettings: async () => {
    try {
      return await requestApi('/api/telegram/settings');
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveTelegramSettings: async (data) => {
    return await requestApi('/api/telegram/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  sendTelegramTest: async (data) => {
    return await requestApi('/api/telegram/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  triggerTelegramReminder: async () => {
    return await requestApi('/api/telegram/trigger-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  triggerTelegramAlarm: async () => {
    return await requestApi('/api/telegram/trigger-alarm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  triggerTelegramDueReminder: async () => {
    return await requestApi('/api/telegram/trigger-due-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  getDailyProgress: async () => {
    try {
      return await requestApi('/api/telegram/progress');
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  // 9. AI Speaking Lab & Pronunciation Assessment
  getSpeakingPrompts: async (category = null) => {
    try {
      const endpoint = category ? `/api/speaking/prompts?category=${category}` : '/api/speaking/prompts';
      return await requestApi(endpoint);
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  analyzeReadAloud: async (data) => {
    return await requestApi('/api/speaking/analyze-read-aloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  analyzeQASpeaking: async (data) => {
    return await requestApi('/api/speaking/analyze-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // 10. Gamification (EXP & Level) & AI Mastery Assessment Report
  getGamificationProfile: async () => {
    try {
      return await requestApi('/api/gamification/profile');
    } catch (e) {
      return { success: false, data: { level: 1, totalXp: 0, title: 'Novice Scholar 🌱', progressPercent: 0 } };
    }
  },

  addXp: async (amount, reason) => {
    try {
      return await requestApi('/api/gamification/add-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason })
      });
    } catch (e) {
      return { success: false };
    }
  },

  getAIMasteryReport: async () => {
    return await requestApi('/api/ai/mastery-report');
  },

  // 11. OS-Level Continuous System Alarm Control
  triggerSystemAlarm: async () => {
    try {
      return await requestApi('/api/alarm/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return { success: false };
    }
  },

  stopSystemAlarm: async () => {
    try {
      return await requestApi('/api/alarm/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return { success: false };
    }
  }
};
