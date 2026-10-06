import { db } from '../db/database.js';
import crypto from 'node:crypto';

export const SYSTEM_TOPIC_IDS = new Set([
  'daily', 'social', 'food', 'travel', 'work', 'education', 'health', 'art',
  'sports', 'shopping', 'business', 'finance', 'nature', 'science', 'tech',
  'mindset', 'society', 'ielts',
  'vsl_tones', 'vsl_pronouns', 'vsl_cuisine', 'vsl_bargaining',
  'vsl_workplace', 'vsl_reduplication', 'vsl_sino_vietnamese', 'vsl_idioms'
]);

export const topicController = {
  // 1. Get all topics with live words count
  getAllTopics: (req, res) => {
    try {
      const targetLang = req.query.target_language;
      let topicsQuery = 'SELECT * FROM topics';
      const topicsParams = [];
      if (targetLang && targetLang !== 'all') {
        topicsQuery += " WHERE (target_language = ? OR target_language = 'all' OR target_language IS NULL)";
        topicsParams.push(targetLang);
      }
      topicsQuery += ' ORDER BY created_at ASC';
      const topics = db.prepare(topicsQuery).all(...topicsParams);
      
      // Calculate word count for each topic
      let countQuery = 'SELECT topic_id, COUNT(*) as count FROM words';
      const countParams = [];
      if (targetLang && targetLang !== 'all') {
        if (targetLang === 'vi') {
          countQuery += ' WHERE target_language = ?';
          countParams.push('vi');
        } else if (targetLang === 'en') {
          countQuery += ' WHERE (target_language = ? OR target_language IS NULL)';
          countParams.push('en');
        }
      }
      countQuery += ' GROUP BY topic_id';
      const counts = db.prepare(countQuery).all(...countParams);
      const countMap = {};
      counts.forEach(c => {
        if (c.topic_id) countMap[c.topic_id] = c.count;
      });

      // Also count words matched by tag name for backward compatibility
      let allWordsQuery = 'SELECT id, topic_id, tags FROM words';
      const allWordsParams = [];
      if (targetLang && targetLang !== 'all') {
        if (targetLang === 'vi') {
          allWordsQuery += ' WHERE target_language = ?';
          allWordsParams.push('vi');
        } else if (targetLang === 'en') {
          allWordsQuery += ' WHERE (target_language = ? OR target_language IS NULL)';
          allWordsParams.push('en');
        }
      }
      const allWords = db.prepare(allWordsQuery).all(...allWordsParams);

      const enrichedTopics = topics.map(t => {
        let directCount = countMap[t.id] || 0;
        
        // Count words that have matching tag if topic_id is unset or matches
        const tagMatchedWords = allWords.filter(w => {
          if (w.topic_id === t.id) return true;
          try {
            const tags = JSON.parse(w.tags || '[]');
            return tags.some(tag => tag.toLowerCase() === t.name.toLowerCase() || tag.toLowerCase() === t.id.toLowerCase());
          } catch (e) {
            return false;
          }
        });

        return {
          ...t,
          is_system: SYSTEM_TOPIC_IDS.has(t.id),
          words_count: Math.max(directCount, tagMatchedWords.length)
        };
      });

      res.json({ success: true, data: enrichedTopics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Create new topic
  createTopic: (req, res) => {
    try {
      const { name, emoji = '📁', color = '#0284c7', description = '' } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: 'Tên chủ đề là bắt buộc' });
      }

      const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30) || crypto.randomUUID().slice(0, 8);
      
      // Check if topic ID already exists
      const existing = db.prepare('SELECT id FROM topics WHERE id = ? OR name = ?').get(id, name.trim());
      if (existing) {
        return res.status(400).json({ success: false, error: 'Chủ đề này đã tồn tại' });
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO topics (id, name, emoji, color, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, name.trim(), emoji || '📁', color || '#0284c7', description.trim(), now, now);

      res.status(201).json({
        success: true,
        message: 'Tạo chủ đề thành công',
        data: { id, name: name.trim(), emoji: emoji || '📁', color: color || '#0284c7', description: description.trim(), words_count: 0 }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Update existing topic
  updateTopic: (req, res) => {
    try {
      const { id } = req.params;
      const { name, emoji, color, description } = req.body;

      if (SYSTEM_TOPIC_IDS.has(id)) {
        return res.status(403).json({ success: false, error: 'Chủ đề hệ thống được cố định, không thể chỉnh sửa' });
      }

      const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
      if (!topic) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy chủ đề' });
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        UPDATE topics SET
          name = ?,
          emoji = ?,
          color = ?,
          description = ?,
          updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        name ? name.trim() : topic.name,
        emoji || topic.emoji,
        color || topic.color,
        description !== undefined ? description.trim() : topic.description,
        now,
        id
      );

      res.json({
        success: true,
        message: 'Cập nhật chủ đề thành công',
        data: { id, name: name || topic.name, emoji: emoji || topic.emoji, color: color || topic.color, description }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Delete topic
  deleteTopic: (req, res) => {
    try {
      const { id } = req.params;
      
      if (SYSTEM_TOPIC_IDS.has(id)) {
        return res.status(403).json({ success: false, error: 'Chủ đề hệ thống được cố định, không thể xóa' });
      }

      const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
      if (!topic) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy chủ đề' });
      }

      // Reassign words with this topic to 'daily'
      db.prepare("UPDATE words SET topic_id = 'daily' WHERE topic_id = ?").run(id);

      // Delete topic
      db.prepare('DELETE FROM topics WHERE id = ?').run(id);

      res.json({ success: true, message: 'Đã xóa chủ đề thành công' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Assign topic to word
  assignWordTopic: (req, res) => {
    try {
      const { word_id, topic_id } = req.body;
      if (!word_id || !topic_id) {
        return res.status(400).json({ success: false, error: 'Thiếu word_id hoặc topic_id' });
      }

      const word = db.prepare('SELECT * FROM words WHERE id = ?').get(word_id);
      if (!word) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy từ vựng' });
      }

      const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topic_id);
      if (!topic) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy chủ đề' });
      }

      const now = new Date().toISOString();
      db.prepare('UPDATE words SET topic_id = ?, updated_at = ? WHERE id = ?').run(topic_id, now, word_id);

      res.json({ success: true, message: `Đã gán từ "${word.word}" vào chủ đề "${topic.name}"` });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
