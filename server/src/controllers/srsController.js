import { db } from '../db/database.js';
import { calculateNextSRS, previewNextIntervals } from '../services/srsAlgorithm.js';
import crypto from 'node:crypto';
import { gamificationService } from '../services/gamificationService.js';
import { activityChartService } from '../services/activityChartService.js';
import { calculateUserStreak } from '../services/streakService.js';

export const srsController = {
  // 1. Get all items due for review today for specific account
  getDueItems: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const targetLang = req.query.target_language;
      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];

      // Due words
      let wordsQuery = `
        SELECT * FROM words
        WHERE (due_date <= ? OR due_date IS NULL)
          AND (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `;
      const wordsParams = [nowIso, userId, userId, userId];
      if (targetLang && targetLang !== 'all') {
        if (targetLang === 'vi') {
          wordsQuery += ' AND target_language = ?';
          wordsParams.push('vi');
        } else if (targetLang === 'en') {
          wordsQuery += ' AND (target_language = ? OR target_language IS NULL)';
          wordsParams.push('en');
        }
      }
      wordsQuery += ' ORDER BY status ASC, repetition ASC';

      const wordsStmt = db.prepare(wordsQuery);
      let words = wordsStmt.all(...wordsParams);
      words = words.map(w => ({
        ...w,
        type: 'word',
        collocations: JSON.parse(w.collocations || '[]'),
        examples: JSON.parse(w.examples || '[]'),
        tags: JSON.parse(w.tags || '[]'),
        previewIntervals: previewNextIntervals(w)
      }));

      // Due patterns
      let patternsQuery = `
        SELECT * FROM patterns
        WHERE (due_date <= ? OR due_date IS NULL)
          AND (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `;
      const patternsParams = [nowIso, userId, userId, userId];
      if (targetLang && targetLang !== 'all') {
        if (targetLang === 'vi') {
          patternsQuery += ' AND target_language = ?';
          patternsParams.push('vi');
        } else if (targetLang === 'en') {
          patternsQuery += ' AND (target_language = ? OR target_language IS NULL)';
          patternsParams.push('en');
        }
      }
      patternsQuery += ' ORDER BY status ASC, repetition ASC';

      const patternsStmt = db.prepare(patternsQuery);
      let patterns = patternsStmt.all(...patternsParams);
      patterns = patterns.map(p => ({
        ...p,
        type: 'pattern',
        examples: JSON.parse(p.examples || '[]'),
        tags: JSON.parse(p.tags || '[]'),
        previewIntervals: previewNextIntervals(p)
      }));

      res.json({
        success: true,
        data: {
          today,
          due_words_count: words.length,
          due_patterns_count: patterns.length,
          total_due: words.length + patterns.length,
          words,
          patterns
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Submit SRS Review for a Word or Pattern
  submitReview: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const { id, type = 'word', rating = 'good' } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Thiếu ID của thẻ ôn tập' });
      }

      const table = type === 'pattern' ? 'patterns' : 'words';
      const getStmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
      const item = getStmt.get(id);

      if (!item) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy thẻ để ôn tập' });
      }

      // Calculate next SRS interval
      const nextSRS = calculateNextSRS({
        repetition: item.repetition,
        interval: item.interval,
        easeFactor: item.ease_factor,
        rating
      }, rating);

      const now = new Date().toISOString();

      // Update Word / Pattern record
      const updateStmt = db.prepare(`
        UPDATE ${table} SET
          repetition = ?,
          interval = ?,
          ease_factor = ?,
          due_date = ?,
          status = ?,
          last_reviewed_at = ?,
          updated_at = ?
        WHERE id = ?
      `);

      updateStmt.run(
        nextSRS.repetition,
        nextSRS.interval,
        nextSRS.easeFactor,
        nextSRS.dueDate,
        nextSRS.status,
        now,
        now,
        id
      );

      // Record daily study log for specific account
      const today = now.split('T')[0];
      const logId = `${userId}_${today}`;
      const existingLog = db.prepare('SELECT * FROM study_logs WHERE (id = ? OR (date = ? AND user_id = ?))').get(logId, today, userId);

      if (existingLog) {
        const updateLog = db.prepare(`
          UPDATE study_logs 
          SET reviews_count = reviews_count + 1
          WHERE id = ?
        `);
        updateLog.run(existingLog.id);
      } else {
        const insertLog = db.prepare(`
          INSERT INTO study_logs (id, date, reviews_count, new_words_count, duration_seconds, created_at, user_id)
          VALUES (?, ?, 1, 0, 0, ?, ?)
        `);
        insertLog.run(logId, today, now, userId);
      }

      // Gamification: Reward +15 XP for SRS review
      let xpResult = null;
      try {
        xpResult = gamificationService.addXp(userId, 15, `Ôn tập thẻ SM-2: ${item.word || item.name || ''}`);
      } catch (e) {}

      res.json({
        success: true,
        message: 'Đã ghi nhận kết quả ôn tập',
        data: nextSRS,
        gamification: xpResult
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Get Overview Stats & Daily Streak for specific account
  getStats: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];

      // Total words & status count for specific user
      const wordsCountStmt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered,
          SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
          SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as learning,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
          SUM(CASE WHEN (due_date <= ? OR due_date IS NULL) THEN 1 ELSE 0 END) as due_today
        FROM words
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `);
      const wordStats = wordsCountStmt.get(nowIso, userId, userId, userId) || {};

      // Patterns stats for specific user
      const patternsCountStmt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered,
          SUM(CASE WHEN (due_date <= ? OR due_date IS NULL) THEN 1 ELSE 0 END) as due_today
        FROM patterns
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `);
      const patternStats = patternsCountStmt.get(nowIso, userId, userId, userId) || {};

      // Notes count for specific user
      const notesCountStmt = db.prepare(`
        SELECT COUNT(*) as total FROM notes
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `);
      const noteStats = notesCountStmt.get(userId, userId, userId) || {};

      // Calculate Daily Streak synchronized with study sessions, timer, and words
      const streakInfo = calculateUserStreak(db, userId);
      const streak = streakInfo.currentStreak;
      const maxStreak = streakInfo.maxStreak;

      const logsStmt = db.prepare(`
        SELECT date, reviews_count, duration_seconds FROM study_logs 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
        ORDER BY date DESC LIMIT 30
      `);
      const logs = logsStmt.all(userId, userId, userId);

      res.json({
        success: true,
        data: {
          words: {
            total: wordStats.total || 0,
            mastered: wordStats.mastered || 0,
            reviewing: wordStats.reviewing || 0,
            learning: wordStats.learning || 0,
            new: wordStats.new_count || 0,
            due_today: wordStats.due_today || 0
          },
          patterns: {
            total: patternStats.total || 0,
            mastered: patternStats.mastered || 0,
            due_today: patternStats.due_today || 0
          },
          notes: {
            total: noteStats.total || 0
          },
          total_due_today: (wordStats.due_today || 0) + (patternStats.due_today || 0),
          streak,
          max_streak: maxStreak,
          active_days_count: streakInfo.activeDaysCount,
          has_studied_today: streakInfo.hasToday,
          recent_logs: logs,
          periodsData: activityChartService.buildPeriodsData(db, userId),
          supervisorFeedbacks: db.prepare(`
            SELECT id, supervisor_name, type, message, created_at
            FROM supervisor_feedbacks
            WHERE user_id = ? OR user_id = 'admin_master_user_id'
            ORDER BY created_at DESC
            LIMIT 5
          `).all(userId)
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
