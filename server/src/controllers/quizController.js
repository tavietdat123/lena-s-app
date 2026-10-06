import { quizService } from '../services/quizService.js';
import { generateAIQuiz, generateAIPatternQuiz } from '../services/aiService.js';
import { db } from '../db/database.js';
import crypto from 'node:crypto';

// Helper function to auto-save quiz to history
const autoSaveQuizToHistory = ({ title, type = 'vocab', is_ai = 1, topic = 'All', category = 'all', level = 'all', mode = 'mixed', questions = [], userId = 'admin_master_user_id' }) => {
  try {
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.warn('[QuizHistory] No questions to auto-save');
      return null;
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const cleanTopic = Array.isArray(topic) ? topic.join(', ') : String(topic || 'All');
    const cleanCategory = Array.isArray(category) ? category.join(', ') : String(category || 'all');
    const cleanLevel = String(level || 'all');
    const cleanMode = String(mode || 'mixed');
    const cleanTitle = title || (type === 'pattern' ? `🧩 Đề Mẫu Câu: ${cleanCategory} (${questions.length} câu)` : `🎯 Đề Từ Vựng: ${cleanTopic} (${questions.length} câu)`);
    const cleanUserId = userId || 'admin_master_user_id';

    const stmt = db.prepare(`
      INSERT INTO quiz_history (id, title, type, is_ai, topic, category, level, mode, questions, total_questions, attempts_count, created_at, updated_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `);
    stmt.run(
      id,
      cleanTitle,
      type,
      is_ai ? 1 : 0,
      cleanTopic,
      cleanCategory,
      cleanLevel,
      cleanMode,
      JSON.stringify(questions),
      questions.length,
      now,
      now,
      cleanUserId
    );
    console.log(`[QuizHistory] Successfully auto-saved quiz "${cleanTitle}" (ID: ${id}, total: ${questions.length})`);
    return id;
  } catch (e) {
    console.error('[QuizHistory] Error auto-saving quiz to history:', e);
    return null;
  }
};

const formatDateTag = (date_scope, date, start_date, end_date) => {
  if (date_scope === 'today') return ' [Hôm nay]';
  if (date_scope === 'yesterday') return ' [Hôm qua]';
  if (date_scope === 'last_7_days') return ' [7 ngày qua]';
  if (date_scope === 'last_30_days') return ' [30 ngày qua]';
  if (date_scope === 'range' && (start_date || end_date)) {
    return ` [${start_date || '...'} -> ${end_date || '...'}]`;
  }
  if (Array.isArray(date) && date.length > 0) {
    if (date.length === 1) {
      try {
        const [y, m, d] = date[0].split('-');
        return ` [${d}/${m}/${y}]`;
      } catch (e) {
        return ` [${date[0]}]`;
      }
    }
    return ` [${date.length} ngày đã chọn]`;
  }
  if (date) {
    try {
      const [y, m, d] = String(date).split('-');
      return ` [${d}/${m}/${y}]`;
    } catch (e) {
      return ` [${date}]`;
    }
  }
  return '';
};

export const quizController = {
  // GET /api/quiz/topics
  getTopics: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const targetLanguage = req.query.target_language || null;
      const topics = quizService.getTopics(userId, targetLanguage);
      res.json({ success: true, data: topics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/quiz/dates
  getDates: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const targetLanguage = req.query.target_language || null;
      const dates = quizService.getDates(userId, targetLanguage);
      res.json({ success: true, data: dates });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/quiz/generate
  generateQuiz: async (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      let userTargetLang = req.body?.target_language;
      let userNativeLang = req.body?.fluent_language || req.body?.native_language;
      if ((!userTargetLang || !userNativeLang) && req.user?.id) {
        const u = db.prepare('SELECT target_language, native_language FROM users WHERE id = ?').get(req.user.id);
        if (u) {
          if (!userTargetLang) userTargetLang = u.target_language;
          if (!userNativeLang) userNativeLang = u.native_language;
        }
      }
      userTargetLang = userTargetLang || 'en';
      userNativeLang = userNativeLang || (userTargetLang === 'vi' ? 'en' : 'vi');

      const { topic = 'All', count = 5, mode = 'mixed', use_ai = false, level = 'all', context_levels = null, date_scope = 'all', date = null, start_date = null, end_date = null } = req.body;
      const topicLabel = Array.isArray(topic) ? topic.join(', ') : String(topic || 'All');
      const dateTag = formatDateTag(date_scope, date, start_date, end_date);

      if (use_ai) {
        const quiz = await generateAIQuiz({
          topic,
          count: parseInt(count, 10) || 5,
          level,
          context_levels,
          mode,
          date_scope,
          date,
          start_date,
          end_date,
          userId,
          target_language: userTargetLang,
          native_language: userNativeLang
        });
        const finalTopic = quiz.topic || `${topicLabel}${dateTag}`;
        const historyId = autoSaveQuizToHistory({
          title: `✨ Đề AI Từ Vựng: ${finalTopic} (${quiz.questions?.length || count} câu)`,
          type: 'vocab',
          is_ai: 1,
          topic: finalTopic,
          level,
          mode,
          questions: quiz.questions,
          userId
        });
        return res.json({ success: true, data: { ...quiz, history_id: historyId, date_scope, date, start_date, end_date } });
      }
      const quiz = quizService.generateQuiz({ topic, count: parseInt(count, 10) || 5, mode, level, context_levels, date_scope, date, start_date, end_date, userId, target_language: userTargetLang });
      const finalTopic = quiz.topic || `${topicLabel}${dateTag}`;
      const historyId = autoSaveQuizToHistory({
        title: `🎯 Đề Từ Vựng: ${finalTopic} (${quiz.questions?.length || count} câu)`,
        type: 'vocab',
        is_ai: 0,
        topic: finalTopic,
        level,
        mode,
        questions: quiz.questions,
        userId
      });
      res.json({ success: true, data: { ...quiz, history_id: historyId, date_scope, date, start_date, end_date } });
    } catch (err) {
      console.error('generateQuiz error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/quiz/generate-ai
  generateAIQuiz: async (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      let userTargetLang = req.body?.target_language;
      let userNativeLang = req.body?.fluent_language || req.body?.native_language;
      if ((!userTargetLang || !userNativeLang) && req.user?.id) {
        const u = db.prepare('SELECT target_language, native_language FROM users WHERE id = ?').get(req.user.id);
        if (u) {
          if (!userTargetLang) userTargetLang = u.target_language;
          if (!userNativeLang) userNativeLang = u.native_language;
        }
      }
      userTargetLang = userTargetLang || 'en';
      userNativeLang = userNativeLang || (userTargetLang === 'vi' ? 'en' : 'vi');

      const { topic = 'All', count = 5, words = [], level = 'all', context_levels = null, mode = 'mixed', date_scope = 'all', date = null, start_date = null, end_date = null } = req.body;
      let quiz;
      try {
        quiz = await generateAIQuiz({
          topic,
          count: parseInt(count, 10) || 5,
          words,
          level,
          context_levels,
          mode,
          date_scope,
          date,
          start_date,
          end_date,
          userId,
          target_language: userTargetLang,
          native_language: userNativeLang
        });
      } catch (aiErr) {
        console.warn('[AI Quiz Fallback] Gemini call failed, using high-quality local generator:', aiErr.message);
        quiz = quizService.generateQuiz({ topic, count: parseInt(count, 10) || 5, mode, level, context_levels, date_scope, date, start_date, end_date, userId, target_language: userTargetLang });
      }

      const dateTag = formatDateTag(date_scope, date, start_date, end_date);
      const topicLabel = Array.isArray(topic) ? topic.join(', ') : (quiz.topic || `${String(topic || 'All')}${dateTag}`);
      const historyId = autoSaveQuizToHistory({
        title: `✨ Đề AI Từ Vựng: ${topicLabel} (${quiz.questions?.length || count} câu)`,
        type: 'vocab',
        is_ai: 1,
        topic: topicLabel,
        level,
        mode,
        questions: quiz.questions,
        userId
      });
      res.json({ success: true, data: { ...quiz, history_id: historyId, date_scope, date, start_date, end_date } });
    } catch (err) {
      console.error('generateAIQuiz error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/quiz/generate-pattern
  generatePatternQuiz: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      let userTargetLang = req.body?.target_language;
      if (!userTargetLang && req.user?.id) {
        const u = db.prepare('SELECT target_language FROM users WHERE id = ?').get(req.user.id);
        if (u) userTargetLang = u.target_language;
      }
      const { category = 'all', tone = 'all', count = 5, mode = 'mixed', level = 'all', date_scope = 'all', date = null, start_date = null, end_date = null } = req.body;
      const quiz = quizService.generatePatternQuiz({ category, tone, count: parseInt(count, 10) || 5, mode, level, date_scope, date, start_date, end_date, userId, target_language: userTargetLang || 'en' });
      const dateTag = formatDateTag(date_scope, date, start_date, end_date);
      const categoryLabel = Array.isArray(category) ? category.join(', ') : `${String(category || 'Tất cả')}${dateTag}`;
      const historyId = autoSaveQuizToHistory({
        title: `🧩 Đề Mẫu Câu: ${categoryLabel} (${quiz.questions?.length || count} câu)`,
        type: 'pattern',
        is_ai: 0,
        category: categoryLabel,
        level,
        mode,
        questions: quiz.questions,
        userId
      });
      res.json({ success: true, data: { ...quiz, history_id: historyId, date_scope, date, start_date, end_date } });
    } catch (err) {
      console.error('generatePatternQuiz error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/quiz/generate-pattern-ai
  generateAIPatternQuiz: async (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      let userTargetLang = req.body?.target_language;
      let userNativeLang = req.body?.fluent_language || req.body?.native_language;
      if ((!userTargetLang || !userNativeLang) && req.user?.id) {
        const u = db.prepare('SELECT target_language, native_language FROM users WHERE id = ?').get(req.user.id);
        if (u) {
          if (!userTargetLang) userTargetLang = u.target_language;
          if (!userNativeLang) userNativeLang = u.native_language;
        }
      }
      userTargetLang = userTargetLang || 'en';
      userNativeLang = userNativeLang || (userTargetLang === 'vi' ? 'en' : 'vi');

      const { category = 'all', tone = 'all', count = 5, level = 'all', mode = 'mixed', date_scope = 'all', date = null, start_date = null, end_date = null } = req.body;
      let quiz;
      try {
        quiz = await generateAIPatternQuiz({
          category,
          tone,
          count: parseInt(count, 10) || 5,
          level,
          mode,
          date_scope,
          date,
          start_date,
          end_date,
          userId,
          target_language: userTargetLang,
          native_language: userNativeLang
        });
      } catch (aiErr) {
        console.warn('[AI Pattern Quiz Fallback] Gemini call failed, using high-quality local generator:', aiErr.message);
        quiz = quizService.generatePatternQuiz({ category, tone, count: parseInt(count, 10) || 5, mode, level, date_scope, date, start_date, end_date, userId, target_language: userTargetLang });
      }

      const dateTag = formatDateTag(date_scope, date, start_date, end_date);
      const categoryLabel = Array.isArray(category) ? category.join(', ') : `${String(category || 'Tất cả')}${dateTag}`;
      const historyId = autoSaveQuizToHistory({
        title: `✨ Đề AI Mẫu Câu: ${categoryLabel} (${quiz.questions?.length || count} câu)`,
        type: 'pattern',
        is_ai: 1,
        category: categoryLabel,
        level,
        mode,
        questions: quiz.questions,
        userId
      });
      res.json({ success: true, data: { ...quiz, history_id: historyId, date_scope, date, start_date, end_date } });
    } catch (err) {
      console.error('generateAIPatternQuiz error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/quiz/submit
  submitQuiz: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const { history_id, answers = [] } = Array.isArray(req.body) ? { answers: req.body } : req.body;
      const result = quizService.submitQuiz({ answers, userId });

      // If history_id is provided, record this attempt in quiz_history
      if (history_id) {
        try {
          const now = new Date().toISOString();
          db.prepare(`
            UPDATE quiz_history
            SET attempts_count = attempts_count + 1,
                best_score = MAX(COALESCE(best_score, 0), ?),
                last_attempt_at = ?,
                updated_at = ?
            WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
          `).run(result.score || 0, now, now, history_id, userId, userId);
        } catch (e) {
          console.warn('Could not record attempt in quiz_history:', e.message);
        }
      }

      res.json({ success: true, data: result });
    } catch (err) {
      console.error('Submit quiz error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // GET /api/quiz/history
  getHistory: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const { type = 'all', limit = 50 } = req.query;
      let query = `
        SELECT id, title, type, is_ai, topic, category, level, mode, total_questions, best_score, attempts_count, last_attempt_at, created_at 
        FROM quiz_history 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `;
      const params = [userId, userId, userId];

      if (type && type !== 'all') {
        query += ' AND type = ?';
        params.push(type);
      }
      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(parseInt(limit, 10) || 50);

      const items = db.prepare(query).all(...params);
      res.json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/quiz/history/:id
  getQuizHistoryById: (req, res) => {
    try {
      const { id } = req.params;
      const quiz = db.prepare('SELECT * FROM quiz_history WHERE id = ?').get(id);
      if (!quiz) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy đề thi này' });
      }

      let parsedQuestions = [];
      try {
        parsedQuestions = JSON.parse(quiz.questions || '[]');
      } catch (e) {
        parsedQuestions = [];
      }

      res.json({
        success: true,
        data: {
          ...quiz,
          questions: parsedQuestions,
          totalQuestions: parsedQuestions.length,
          history_id: quiz.id
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // DELETE /api/quiz/history/:id
  deleteQuizHistory: (req, res) => {
    try {
      const { id } = req.params;
      db.prepare('DELETE FROM quiz_history WHERE id = ?').run(id);
      res.json({ success: true, message: 'Đã xóa đề thi khỏi lịch sử' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

