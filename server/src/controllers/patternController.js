import { db } from '../db/database.js';
import crypto from 'node:crypto';

export const patternController = {
  // 1. Get all sentence patterns for specific account
  getAllPatterns: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const { search, category, tone } = req.query;
      let query = `
        SELECT * FROM patterns 
        WHERE (user_id = ? OR user_id IS NULL OR user_id = 'admin_master_user_id')
      `;
      const params = [userId];

      if (search) {
        query += ' AND (name LIKE ? OR formula LIKE ? OR meaning_vi LIKE ? OR explanation LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
      }

      if (tone && tone !== 'all') {
        query += ' AND tone = ?';
        params.push(tone);
      }

      query += ' ORDER BY created_at DESC';

      const stmt = db.prepare(query);
      let patterns = stmt.all(...params);

      patterns = patterns.map(p => ({
        ...p,
        category: p.category || 'emphasis',
        examples: JSON.parse(p.examples || '[]'),
        tags: JSON.parse(p.tags || '[]')
      }));

      res.json({ success: true, data: patterns });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Get pattern by ID
  getPatternById: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        SELECT * FROM patterns 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);
      const pattern = stmt.get(id, userId, userId);

      if (!pattern) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy mẫu câu' });
      }

      pattern.category = pattern.category || 'emphasis';
      pattern.examples = JSON.parse(pattern.examples || '[]');
      pattern.tags = JSON.parse(pattern.tags || '[]');

      res.json({ success: true, data: pattern });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Create pattern
  createPattern: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const {
        name,
        formula,
        explanation,
        meaning_vi,
        category = 'emphasis',
        tone = 'Neutral',
        examples = [],
        tags = []
      } = req.body;

      if (!name || !formula || !meaning_vi) {
        return res.status(400).json({ success: false, error: 'Tên, công thức và nghĩa tiếng Việt là bắt buộc' });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      const stmt = db.prepare(`
        INSERT INTO patterns (
          id, name, formula, explanation, meaning_vi, category, tone,
          examples, tags, repetition, interval, ease_factor,
          due_date, status, created_at, updated_at, user_id
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, 0, 0, 2.5,
          ?, 'new', ?, ?, ?
        )
      `);

      stmt.run(
        id,
        name.trim(),
        formula.trim(),
        explanation || '',
        meaning_vi.trim(),
        category || 'emphasis',
        tone,
        JSON.stringify(examples),
        JSON.stringify(tags),
        today,
        now,
        now,
        userId
      );

      res.status(201).json({ success: true, data: { id, name, formula, category, status: 'new' } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Update pattern
  updatePattern: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const existing = db.prepare(`
        SELECT * FROM patterns 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `).get(id, userId, userId);

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy mẫu câu' });
      }

      const {
        name = existing.name,
        formula = existing.formula,
        explanation = existing.explanation,
        meaning_vi = existing.meaning_vi,
        category = existing.category || 'emphasis',
        tone = existing.tone || 'Neutral',
        examples = (req.body.examples !== undefined ? req.body.examples : JSON.parse(existing.examples || '[]')),
        tags = (req.body.tags !== undefined ? req.body.tags : JSON.parse(existing.tags || '[]'))
      } = req.body;

      const now = new Date().toISOString();

      const stmt = db.prepare(`
        UPDATE patterns SET
          name = ?, formula = ?, explanation = ?, meaning_vi = ?,
          category = ?, tone = ?, examples = ?, tags = ?, updated_at = ?
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);

      stmt.run(
        String(name || '').trim(),
        String(formula || '').trim(),
        explanation || '',
        String(meaning_vi || '').trim(),
        category || 'emphasis',
        tone || 'Neutral',
        typeof examples === 'string' ? examples : JSON.stringify(examples),
        typeof tags === 'string' ? tags : JSON.stringify(tags),
        now,
        id,
        userId,
        userId
      );

      res.json({ success: true, message: 'Cập nhật mẫu câu thành công' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Delete pattern
  deletePattern: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        DELETE FROM patterns 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);
      stmt.run(id, userId, userId);
      res.json({ success: true, message: 'Đã xóa mẫu câu' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
