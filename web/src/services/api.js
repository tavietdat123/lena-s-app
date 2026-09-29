const API_BASE = typeof window !== 'undefined' 
  ? (window.location.port === '3000' || window.location.port === '5173'
      ? `http://${window.location.hostname}:5001/api` 
      : '/api')
  : '/api';

const TOKEN_KEY = 'linguavault_auth_token';

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};

export const getAuthHeaders = (extraHeaders = {}) => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const authFetch = async (url, options = {}) => {
  const headers = getAuthHeaders(options.headers || {});
  return fetch(url, { ...options, headers });
};

export const api = {
  // Authentication & Profile
  auth: {
    register: async (data) => {
      const res = await authFetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.success && json.data?.token) {
        setAuthToken(json.data.token);
      }
      return json;
    },

    login: async (username, password) => {
      const res = await authFetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      const json = await res.json();
      if (json.success && json.data?.token) {
        setAuthToken(json.data.token);
      }
      return json;
    },

    getMe: async () => {
      try {
        const token = getAuthToken();
        if (!token) return { success: false, error: 'No token' };
        const res = await authFetch(`${API_BASE}/auth/me`);
        return await res.json();
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    updateProfile: async (data) => {
      const res = await authFetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    logout: async () => {
      setAuthToken(null);
      try {
        await authFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
      } catch (e) {}
      return { success: true };
    }
  },

  // Vocabulary
  getWords: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await authFetch(`${API_BASE}/vocab?${query}`);
      return await res.json();
    } catch (e) {
      console.warn('API fetch error:', e);
      return { success: false, data: [] };
    }
  },

  getWordById: async (id) => {
    const res = await authFetch(`${API_BASE}/vocab/${id}`);
    return res.json();
  },

  createWord: async (data) => {
    const res = await authFetch(`${API_BASE}/vocab`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateWord: async (id, data) => {
    const res = await authFetch(`${API_BASE}/vocab/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteWord: async (id) => {
    const res = await authFetch(`${API_BASE}/vocab/${id}`, { 
      method: 'DELETE'
    });
    return res.json();
  },

  autoLookup: async (word) => {
    const res = await authFetch(`${API_BASE}/vocab/lookup?word=${encodeURIComponent(word)}`);
    return res.json();
  },

  // Topics & Categories
  getTopics: async () => {
    try {
      const res = await authFetch(`${API_BASE}/topics`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createTopic: async (data) => {
    const res = await authFetch(`${API_BASE}/topics`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateTopic: async (id, data) => {
    const res = await authFetch(`${API_BASE}/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteTopic: async (id) => {
    const res = await authFetch(`${API_BASE}/topics/${id}`, { method: 'DELETE' });
    return res.json();
  },

  assignTopic: async (word_id, topic_id) => {
    const res = await authFetch(`${API_BASE}/topics/assign`, {
      method: 'POST',
      body: JSON.stringify({ word_id, topic_id })
    });
    return res.json();
  },

  // Sentence Patterns
  getPatterns: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await authFetch(`${API_BASE}/patterns?${query}`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createPattern: async (data) => {
    const res = await authFetch(`${API_BASE}/patterns`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updatePattern: async (id, data) => {
    const res = await authFetch(`${API_BASE}/patterns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deletePattern: async (id) => {
    const res = await authFetch(`${API_BASE}/patterns/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Sentence Pattern Categories (Communicative Functions)
  getPatternCategories: async () => {
    try {
      const res = await authFetch(`${API_BASE}/pattern-categories`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createPatternCategory: async (data) => {
    const res = await authFetch(`${API_BASE}/pattern-categories`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updatePatternCategory: async (id, data) => {
    const res = await authFetch(`${API_BASE}/pattern-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deletePatternCategory: async (id) => {
    const res = await authFetch(`${API_BASE}/pattern-categories/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Notes & Smart Reader
  getNotes: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await authFetch(`${API_BASE}/notes?${query}`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createNote: async (data) => {
    const res = await authFetch(`${API_BASE}/notes`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateNote: async (id, data) => {
    const res = await authFetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteNote: async (id) => {
    const res = await authFetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // SRS Spaced Repetition
  getDueItems: async () => {
    try {
      const res = await authFetch(`${API_BASE}/srs/due`);
      return await res.json();
    } catch (e) {
      return { success: false, data: { words: [], patterns: [] } };
    }
  },

  submitReview: async (id, type, rating) => {
    const res = await authFetch(`${API_BASE}/srs/review`, {
      method: 'POST',
      body: JSON.stringify({ id, type, rating })
    });
    return res.json();
  },

  getStats: async () => {
    try {
      const res = await authFetch(`${API_BASE}/srs/stats`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  // AI Service
  translateInContextAI: async ({ text, contextSentence = '', articleTitle = '', articleTopic = 'General' }) => {
    const res = await authFetch(`${API_BASE}/ai/translate-in-context`, {
      method: 'POST',
      body: JSON.stringify({ text, contextSentence, articleTitle, articleTopic })
    });
    return res.json();
  },

  parseSentenceAI: async (sentence) => {
    const res = await authFetch(`${API_BASE}/ai/parse-sentence`, {
      method: 'POST',
      body: JSON.stringify({ sentence })
    });
    return res.json();
  },

  checkSentenceAI: async (targetItem, userSentence) => {
    const res = await authFetch(`${API_BASE}/ai/check-sentence`, {
      method: 'POST',
      body: JSON.stringify({ targetItem, userSentence })
    });
    return res.json();
  },

  generateStoryAI: async (words = []) => {
    const res = await authFetch(`${API_BASE}/ai/generate-story`, {
      method: 'POST',
      body: JSON.stringify({ words })
    });
    return res.json();
  },

  paraphraseSentenceAI: async (sentence, tone = 'business') => {
    const res = await authFetch(`${API_BASE}/ai/paraphrase`, {
      method: 'POST',
      body: JSON.stringify({ sentence, tone })
    });
    return res.json();
  },

  exploreCollocationsAI: async (word) => {
    const res = await authFetch(`${API_BASE}/ai/collocations`, {
      method: 'POST',
      body: JSON.stringify({ word })
    });
    return res.json();
  },

  generateDialogueAI: async (scenario, userWords = []) => {
    const res = await authFetch(`${API_BASE}/ai/dialogue`, {
      method: 'POST',
      body: JSON.stringify({ scenario, userWords })
    });
    return res.json();
  },

  // Settings & Backup
  getSettings: async () => {
    try {
      const res = await authFetch(`${API_BASE}/settings`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveSettings: async (data) => {
    const res = await authFetch(`${API_BASE}/settings`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  exportDataUrl: () => {
    const token = getAuthToken();
    return token ? `${API_BASE}/backup/export?token=${encodeURIComponent(token)}` : `${API_BASE}/backup/export`;
  },

  exportData: async () => {
    const res = await authFetch(`${API_BASE}/backup/export`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Lỗi tải file sao lưu (${res.status})`);
    }
    return res.blob();
  },

  importData: async (data) => {
    const res = await authFetch(`${API_BASE}/backup/import`, {
      method: 'POST',
      body: JSON.stringify({ data })
    });
    return res.json();
  },

  // Telegram Bot & Goal Settings
  getTelegramSettings: async () => {
    try {
      const res = await authFetch(`${API_BASE}/telegram/settings`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveTelegramSettings: async (data) => {
    const res = await authFetch(`${API_BASE}/telegram/settings`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  sendTelegramTest: async (data) => {
    const res = await authFetch(`${API_BASE}/telegram/test`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  triggerTelegramReminder: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-reminder`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerTelegramAlarm: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-alarm`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerTelegramDueReminder: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-due-reminder`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerStreakSaver: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-streak-saver`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerWordOfDay: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-word-of-day`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerWeeklyDigest: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-weekly-digest`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerLeechAlert: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-leech-alert`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerTelegramBackup: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-backup`, {
      method: 'POST'
    });
    return res.json();
  },

  getDailyProgress: async () => {
    try {
      const res = await authFetch(`${API_BASE}/telegram/progress`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  // Active Study Timer & Analytics
  getStudyTimerStats: async () => {
    try {
      const res = await authFetch(`${API_BASE}/study-timer/stats`);
      return await res.json();
    } catch (e) {
      return { success: false, data: null };
    }
  },

  getStudyTimerSessions: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await authFetch(`${API_BASE}/study-timer/sessions${query ? `?${query}` : ''}`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [], total: 0 };
    }
  },

  saveStudySession: async (sessionData) => {
    const res = await authFetch(`${API_BASE}/study-timer/sessions`, {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
    return res.json();
  },

  deleteStudySession: async (id) => {
    const res = await authFetch(`${API_BASE}/study-timer/sessions/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Quiz Hub
  getQuizTopics: async () => {
    try {
      const res = await authFetch(`${API_BASE}/quiz/topics`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getQuizDates: async () => {
    try {
      const res = await authFetch(`${API_BASE}/quiz/dates`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  generateQuiz: async (params = { topic: 'All', count: 5, mode: 'mixed' }) => {
    const res = await authFetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return res.json();
  },

  generateAIQuiz: async (params = { topic: 'All', count: 5, mode: 'mixed', words: [], level: 'all' }) => {
    const res = await authFetch(`${API_BASE}/quiz/generate-ai`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return res.json();
  },

  generatePatternQuiz: async (params = { tone: 'all', count: 5, mode: 'mixed', level: 'all' }) => {
    const res = await authFetch(`${API_BASE}/quiz/generate-pattern`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return res.json();
  },

  generateAIPatternQuiz: async (params = { tone: 'all', count: 5, level: 'all', mode: 'mixed' }) => {
    const res = await authFetch(`${API_BASE}/quiz/generate-pattern-ai`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return res.json();
  },

  submitQuiz: async (answers = [], history_id = null) => {
    const payload = typeof answers === 'object' && !Array.isArray(answers) ? answers : { answers, history_id };
    const res = await authFetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Quiz History (Lịch Sử Đề & Làm Lại)
  getQuizHistory: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await authFetch(`${API_BASE}/quiz/history?${query}`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getQuizHistoryById: async (id) => {
    const res = await authFetch(`${API_BASE}/quiz/history/${id}`);
    return res.json();
  },

  deleteQuizHistory: async (id) => {
    const res = await authFetch(`${API_BASE}/quiz/history/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Telegram Real-time Push Notification API
  getTelegramConfig: async () => {
    try {
      const res = await authFetch(`${API_BASE}/telegram/config`);
      return await res.json();
    } catch (e) {
      return { success: false, data: { enabled: false, configured: false } };
    }
  },

  saveTelegramConfig: async (config) => {
    const res = await authFetch(`${API_BASE}/telegram/config`, {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return res.json();
  },

  testTelegram: async () => {
    const res = await authFetch(`${API_BASE}/telegram/test`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerTelegramReminder: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-reminder`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerTelegramAlarm: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-alarm`, {
      method: 'POST'
    });
    return res.json();
  },

  triggerTelegramDueReminder: async () => {
    const res = await authFetch(`${API_BASE}/telegram/trigger-due-reminder`, {
      method: 'POST'
    });
    return res.json();
  },

  getDailyProgress: async () => {
    try {
      const res = await authFetch(`${API_BASE}/telegram/progress`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  // AI Speaking Lab & Pronunciation Assessment
  getSpeakingPrompts: async (category = null) => {
    try {
      const url = category ? `${API_BASE}/speaking/prompts?category=${category}` : `${API_BASE}/speaking/prompts`;
      const res = await authFetch(url);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  analyzeReadAloud: async (data) => {
    const res = await authFetch(`${API_BASE}/speaking/analyze-read-aloud`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  analyzeQASpeaking: async (data) => {
    const res = await authFetch(`${API_BASE}/speaking/analyze-qa`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Gamification (EXP & Level) & AI Mastery Assessment Report
  getGamificationProfile: async () => {
    try {
      const res = await authFetch(`${API_BASE}/gamification/profile`);
      return await res.json();
    } catch (e) {
      return { success: false, data: { level: 1, totalXp: 0, title: 'Novice Scholar 🌱', progressPercent: 0 } };
    }
  },

  addXp: async (amount, reason) => {
    try {
      const res = await authFetch(`${API_BASE}/gamification/add-xp`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason })
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },

  getAIMasteryReport: async () => {
    const res = await authFetch(`${API_BASE}/ai/mastery-report`);
    return await res.json();
  },

  // 11. OS-Level Continuous System Alarm Control
  triggerSystemAlarm: async () => {
    try {
      const res = await authFetch(`${API_BASE}/alarm/trigger`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },

  stopSystemAlarm: async () => {
    try {
      const res = await authFetch(`${API_BASE}/alarm/stop`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  }
};
