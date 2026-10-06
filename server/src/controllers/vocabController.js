import { db } from '../db/database.js';
import crypto from 'node:crypto';
import { lookupDictionary } from '../services/dictionaryService.js';
import { gamificationService } from '../services/gamificationService.js';

export const vocabController = {
  // 1. Get all words with search & filtering for specific account
  getAllWords: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const { search, tag, status, level, topic_id, target_language } = req.query;
      let query = `
        SELECT * FROM words 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `;
      const params = [userId, userId, userId];

      if (target_language && target_language !== 'all') {
        if (target_language === 'vi') {
          query += ' AND target_language = ?';
          params.push('vi');
        } else if (target_language === 'en') {
          query += ' AND (target_language = ? OR target_language IS NULL)';
          params.push('en');
        }
      }

      if (search) {
        query += ' AND (word LIKE ? OR meaning_vi LIKE ? OR meaning_en LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      if (status && status !== 'all') {
        query += ' AND status = ?';
        params.push(status);
      }

      if (level && level !== 'all') {
        query += ' AND level = ?';
        params.push(level);
      }

      if (topic_id && topic_id !== 'all') {
        query += ' AND topic_id = ?';
        params.push(topic_id);
      }

      query += ' ORDER BY created_at DESC';

      const stmt = db.prepare(query);
      let words = stmt.all(...params);

      // Parse JSON fields
      words = words.map(w => ({
        ...w,
        topic_id: w.topic_id || 'daily',
        collocations: JSON.parse(w.collocations || '[]'),
        examples: JSON.parse(w.examples || '[]'),
        tags: JSON.parse(w.tags || '[]')
      }));

      // Filter by tag if provided
      if (tag && tag !== 'all') {
        words = words.filter(w => w.tags.includes(tag) || w.topic_id === tag);
      }

      res.json({ success: true, data: words });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Get single word by ID
  getWordById: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        SELECT * FROM words 
        WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `);
      const word = stmt.get(id, userId, userId, userId);

      if (!word) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy từ vựng' });
      }

      word.topic_id = word.topic_id || 'daily';
      word.collocations = JSON.parse(word.collocations || '[]');
      word.examples = JSON.parse(word.examples || '[]');
      word.tags = JSON.parse(word.tags || '[]');

      res.json({ success: true, data: word });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Create new word
  createWord: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const {
        word,
        phonetic,
        audio_url,
        part_of_speech,
        meaning_vi,
        meaning_en,
        collocations = [],
        examples = [],
        tags = [],
        level = 'B1',
        topic_id = 'daily',
        target_language,
        tone = '',
        sino_vietnamese = '',
        vsl_level = ''
      } = req.body;

      const finalMeaningVi = (meaning_vi || '').trim() || (meaning_en || '').trim();
      const finalMeaningEn = (meaning_en || '').trim() || (meaning_vi || '').trim();

      if (!word || (!finalMeaningVi && !finalMeaningEn)) {
        return res.status(400).json({ success: false, error: 'Từ vựng và Nghĩa là bắt buộc' });
      }

      const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(word || '');
      const finalTargetLang = target_language || (hasVietnameseChars ? 'vi' : 'en');

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      const stmt = db.prepare(`
        INSERT INTO words (
          id, word, phonetic, audio_url, part_of_speech, meaning_vi, meaning_en,
          collocations, examples, tags, level, repetition, interval, ease_factor,
          due_date, status, created_at, updated_at, topic_id, user_id,
          target_language, tone, sino_vietnamese, vsl_level
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 0, 0, 2.5,
          ?, 'new', ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);

      stmt.run(
        id,
        word.trim(),
        phonetic || '',
        audio_url || '',
        part_of_speech || 'noun',
        finalMeaningVi,
        finalMeaningEn,
        JSON.stringify(collocations),
        JSON.stringify(examples),
        JSON.stringify(tags),
        level,
        today,
        now,
        now,
        topic_id || 'daily',
        userId,
        finalTargetLang,
        tone || '',
        sino_vietnamese || '',
        vsl_level || ''
      );

      // Gamification: Reward +10 XP for adding new word
      let xpResult = null;
      try {
        xpResult = gamificationService.addXp(userId, 10, `Thêm từ mới: ${word.trim()}`);
      } catch (e) {}

      res.status(201).json({ success: true, data: { id, word, meaning_vi, topic_id: topic_id || 'daily', status: 'new' }, gamification: xpResult });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Update word
  updateWord: (req, res) => {
    try {
      const { id } = req.params;
      const {
        word,
        phonetic,
        audio_url,
        part_of_speech,
        meaning_vi,
        meaning_en,
        collocations = [],
        examples = [],
        tags = [],
        level,
        topic_id
      } = req.body;

      const now = new Date().toISOString();

      const userId = req.user?.id || 'admin_master_user_id';
      const existingWord = db.prepare(`
        SELECT * FROM words 
        WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `).get(id, userId, userId, userId);

      if (!existingWord) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy từ vựng' });
      }

      const finalTopicId = topic_id !== undefined ? topic_id : (existingWord.topic_id || 'daily');

      const stmt = db.prepare(`
        UPDATE words SET
          word = ?, phonetic = ?, audio_url = ?, part_of_speech = ?,
          meaning_vi = ?, meaning_en = ?, collocations = ?, examples = ?,
          tags = ?, level = ?, updated_at = ?, topic_id = ?
        WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `);

      stmt.run(
        word ? word.trim() : existingWord.word,
        phonetic !== undefined ? phonetic : existingWord.phonetic,
        audio_url !== undefined ? audio_url : existingWord.audio_url,
        part_of_speech || existingWord.part_of_speech || 'noun',
        meaning_vi ? meaning_vi.trim() : existingWord.meaning_vi,
        meaning_en !== undefined ? meaning_en : existingWord.meaning_en,
        JSON.stringify(collocations !== undefined ? collocations : JSON.parse(existingWord.collocations || '[]')),
        JSON.stringify(examples !== undefined ? examples : JSON.parse(existingWord.examples || '[]')),
        JSON.stringify(tags !== undefined ? tags : JSON.parse(existingWord.tags || '[]')),
        level || existingWord.level || 'B1',
        now,
        finalTopicId,
        id,
        userId,
        userId,
        userId
      );

      res.json({ 
        success: true, 
        message: 'Cập nhật từ vựng thành công',
        data: { id, word: word?.trim() || existingWord.word, meaning_vi: meaning_vi?.trim() || existingWord.meaning_vi, level: level || existingWord.level, topic_id: finalTopicId }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Delete word
  deleteWord: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        DELETE FROM words 
        WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `);
      stmt.run(id, userId, userId, userId);
      res.json({ success: true, message: 'Đã xóa từ vựng' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 6. Fast Auto-lookup Dictionary API
  autoLookup: async (req, res) => {
    try {
      const { word, target_language, native_language, fluent_language } = req.query;
      const targetLang = target_language || req.user?.target_language || 'en';
      const nativeLang = fluent_language || native_language || req.user?.native_language || (targetLang === 'vi' ? 'en' : 'vi');
      if (!word) {
        return res.status(400).json({ success: false, error: 'Thiếu từ cần tra cứu' });
      }

      const result = await lookupDictionary(word, targetLang, nativeLang);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
