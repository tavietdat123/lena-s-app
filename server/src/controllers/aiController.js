import { 
  parseSentenceAI, 
  checkSentenceAI, 
  generateStoryAI, 
  paraphraseSentenceAI, 
  exploreCollocationsAI, 
  generateSituationalDialogueAI,
  translateInContextAI
} from '../services/aiService.js';
import { db } from '../db/database.js';

function getUserLanguages(req) {
  let targetLang = req.body?.target_language || req.body?.targetLanguage || req.query?.target_language || req.query?.targetLanguage;
  let fluentLang = req.body?.fluent_language || req.body?.fluentLanguage || req.body?.native_language || req.body?.nativeLanguage || req.query?.native_language;

  if ((!targetLang || !fluentLang) && req.user?.id) {
    const row = db.prepare('SELECT target_language, native_language FROM users WHERE id = ?').get(req.user.id);
    if (row) {
      if (!targetLang) targetLang = row.target_language;
      if (!fluentLang) fluentLang = row.native_language;
    }
  }

  const finalTarget = targetLang || 'en';
  return {
    targetLang: finalTarget,
    fluentLang: fluentLang || (finalTarget === 'vi' ? 'en' : 'vi')
  };
}

export const aiController = {
  // 1. Smart Sentence Parser & Vocab Extractor
  parseSentence: async (req, res) => {
    try {
      const { sentence, apiKey } = req.body;
      if (!sentence) {
        return res.status(400).json({ success: false, error: 'Thiếu câu cần phân tích' });
      }

      // Check key in settings if not in body
      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      const langOpts = getUserLanguages(req);
      const result = await parseSentenceAI(sentence, key, langOpts);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Check and Correct User's Custom Sentence
  checkSentence: async (req, res) => {
    try {
      const { targetItem, userSentence, apiKey } = req.body;
      if (!targetItem || !userSentence) {
        return res.status(400).json({ success: false, error: 'Thiếu từ vựng hoặc câu bạn tự viết' });
      }

      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      const langOpts = getUserLanguages(req);
      const result = await checkSentenceAI({ targetItem, userSentence }, key, langOpts);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Generate Daily Review Story from Due Words
  generateStory: async (req, res) => {
    try {
      const { words, apiKey } = req.body;

      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      let wordsList = words;
      if (!wordsList || wordsList.length === 0) {
        const nowIso = new Date().toISOString();
        const userId = req.user?.id;
        let q = 'SELECT word FROM words WHERE (due_date <= ? OR due_date IS NULL)';
        const params = [nowIso];
        if (userId && userId !== 'admin_master_user_id') {
          q += ' AND user_id = ?';
          params.push(userId);
        }
        q += ' LIMIT 6';
        const stmt = db.prepare(q);
        wordsList = stmt.all(...params).map(w => w.word);
      }

      const langOpts = getUserLanguages(req);
      const result = await generateStoryAI(wordsList, key, langOpts);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. AI Paraphrase & Tone Polisher
  paraphraseSentence: async (req, res) => {
    try {
      const { sentence, tone, apiKey } = req.body;
      if (!sentence) {
        return res.status(400).json({ success: false, error: 'Thiếu câu cần viết lại' });
      }

      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      const langOpts = getUserLanguages(req);
      const result = await paraphraseSentenceAI({ sentence, tone }, key, langOpts);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. AI Collocation & Deep Idiom Explorer
  exploreCollocations: async (req, res) => {
    try {
      const { word, apiKey } = req.body;
      if (!word) {
        return res.status(400).json({ success: false, error: 'Thiếu từ vựng cần đào sâu' });
      }

      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      const langOpts = getUserLanguages(req);
      const result = await exploreCollocationsAI(word, key, langOpts);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 6. AI Situational Dialogue & Roleplay Generator
  generateDialogue: async (req, res) => {
    try {
      const { scenario, userWords, apiKey } = req.body;

      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      let wordsList = userWords;
      if (!wordsList || wordsList.length === 0) {
        const userId = req.user?.id;
        let q = 'SELECT word FROM words';
        const params = [];
        if (userId && userId !== 'admin_master_user_id') {
          q += ' WHERE user_id = ?';
          params.push(userId);
        }
        q += ' ORDER BY RANDOM() LIMIT 4';
        const stmt = db.prepare(q);
        wordsList = stmt.all(...params).map(w => w.word);
      }

      const langOpts = getUserLanguages(req);
      const result = await generateSituationalDialogueAI({ scenario, userWords: wordsList }, key, langOpts);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 7. Save/Get Settings (Gemini API Key & User Preferences)
  getSettings: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const userSettings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      const globalRows = db.prepare('SELECT * FROM settings').all();
      const settings = {};
      globalRows.forEach(r => settings[r.key] = r.value);

      if (userSettings) {
        settings.gemini_api_key = userSettings.gemini_api_key || settings.gemini_api_key || '';
        settings.gemini_model = userSettings.gemini_model || settings.gemini_model || 'gemini-3.6-flash';
        settings.review_daily_goal = String(userSettings.daily_goal || settings.review_daily_goal || 10);
        settings.alarm_time = userSettings.alarm_time || '08:00';
      }

      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  saveSettings: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const { gemini_api_key, gemini_model, speech_voice, review_daily_goal, alarm_time } = req.body;
      const now = new Date().toISOString();

      // Upsert into user_settings
      const existing = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      if (existing) {
        db.prepare(`
          UPDATE user_settings 
          SET gemini_api_key = COALESCE(?, gemini_api_key),
              gemini_model = COALESCE(?, gemini_model),
              daily_goal = COALESCE(?, daily_goal),
              alarm_time = COALESCE(?, alarm_time),
              updated_at = ?
          WHERE user_id = ?
        `).run(
          gemini_api_key !== undefined ? gemini_api_key.trim() : null,
          gemini_model !== undefined ? gemini_model.trim() : null,
          review_daily_goal !== undefined ? parseInt(review_daily_goal, 10) : null,
          alarm_time !== undefined ? alarm_time : null,
          now,
          userId
        );
      } else {
        db.prepare(`
          INSERT INTO user_settings (user_id, gemini_api_key, gemini_model, daily_goal, alarm_time, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          gemini_api_key ? gemini_api_key.trim() : '',
          gemini_model ? gemini_model.trim() : 'gemini-3.6-flash',
          review_daily_goal ? parseInt(review_daily_goal, 10) : 10,
          alarm_time || '08:00',
          now
        );
      }

      // Also maintain global settings for server defaults
      const stmt = db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);

      if (gemini_api_key !== undefined) stmt.run('gemini_api_key', gemini_api_key.trim());
      if (gemini_model !== undefined) stmt.run('gemini_model', gemini_model.trim());
      if (speech_voice !== undefined) stmt.run('speech_voice', speech_voice);
      if (review_daily_goal !== undefined) stmt.run('review_daily_goal', String(review_daily_goal));

      res.json({ success: true, message: 'Đã lưu cài đặt' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 7. Contextual AI Translation & Breakdown
  translateInContext: async (req, res) => {
    try {
      const { text, contextSentence, articleTitle, articleTopic, apiKey } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, error: 'Thiếu từ hoặc đoạn văn cần dịch' });
      }

      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      const langOpts = getUserLanguages(req);
      const result = await translateInContextAI({
        text: text.trim(),
        contextSentence: (contextSentence || '').trim(),
        articleTitle: (articleTitle || '').trim(),
        articleTopic: (articleTopic || 'General').trim(),
        targetLang: langOpts.targetLang,
        fluentLang: langOpts.fluentLang
      }, key);

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
