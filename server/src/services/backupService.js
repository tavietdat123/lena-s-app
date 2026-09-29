import { getDb } from '../db/database.js';

function safeParse(val, fallback = []) {
  if (val === null || val === undefined) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

function safeStringify(val, fallback = '[]') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch (e) {
    return fallback;
  }
}

export const backupService = {
  // Build clean backup payload containing words, patterns, notes, logs, etc.
  buildBackupPayload: (userId = 'admin_master_user_id') => {
    const db = getDb();

    const words = db.prepare(`
      SELECT * FROM words 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId).map(w => ({
      ...w,
      collocations: safeParse(w.collocations, []),
      examples: safeParse(w.examples, []),
      tags: safeParse(w.tags, [])
    }));

    const patterns = db.prepare(`
      SELECT * FROM patterns 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId).map(p => ({
      ...p,
      examples: safeParse(p.examples, []),
      tags: safeParse(p.tags, [])
    }));

    const notes = db.prepare(`
      SELECT * FROM notes 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId).map(n => ({
      ...n,
      tags: safeParse(n.tags, []),
      linked_words: safeParse(n.linked_words, [])
    }));

    const study_logs = db.prepare(`
      SELECT * FROM study_logs 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);

    let topics = [];
    try {
      topics = db.prepare('SELECT * FROM topics').all();
    } catch (e) {}

    let quiz_history = [];
    try {
      quiz_history = db.prepare(`
        SELECT * FROM quiz_history 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `).all(userId, userId, userId).map(q => ({
        ...q,
        questions: safeParse(q.questions, [])
      }));
    } catch (e) {}

    let user_settings = null;
    try {
      user_settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) || null;
    } catch (e) {}

    let study_sessions = [];
    try {
      study_sessions = db.prepare(`
        SELECT * FROM study_sessions 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
        ORDER BY started_at DESC
      `).all(userId, userId, userId);
    } catch (e) {}

    let study_schedules = [];
    try {
      study_schedules = db.prepare(`
        SELECT * FROM study_schedules 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
        ORDER BY created_at DESC
      `).all(userId, userId, userId).map(s => ({
        ...s,
        days_of_week: safeParse(s.days_of_week, ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
      }));
    } catch (e) {}

    return {
      app: 'LinguaVault',
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      user_id: userId,
      data: {
        words,
        patterns,
        notes,
        study_logs,
        study_sessions,
        study_schedules,
        topics,
        quiz_history,
        user_settings
      }
    };
  },

  // Restore payload inside atomic transaction
  restoreBackupPayload: (rawPayload, userId = 'admin_master_user_id') => {
    const db = getDb();
    const raw = rawPayload?.data || rawPayload;
    const payload = raw?.data || raw;

    if (!payload || typeof payload !== 'object') {
      throw new Error('Dữ liệu sao lưu không hợp lệ hoặc rỗng.');
    }

    const words = Array.isArray(payload.words) ? payload.words : [];
    const patterns = Array.isArray(payload.patterns) ? payload.patterns : [];
    const notes = Array.isArray(payload.notes) ? payload.notes : [];
    const study_logs = Array.isArray(payload.study_logs) ? payload.study_logs : [];
    const study_sessions = Array.isArray(payload.study_sessions) ? payload.study_sessions : [];
    const study_schedules = Array.isArray(payload.study_schedules) ? payload.study_schedules : [];
    const topics = Array.isArray(payload.topics) ? payload.topics : [];
    const quiz_history = Array.isArray(payload.quiz_history) ? payload.quiz_history : [];
    const user_settings = payload.user_settings || null;

    if (words.length === 0 && patterns.length === 0 && notes.length === 0 && topics.length === 0 && study_sessions.length === 0 && study_schedules.length === 0) {
      throw new Error('File sao lưu không chứa dữ liệu từ vựng hoặc cấu trúc nào để khôi phục.');
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Restore Topics
      if (topics.length > 0) {
        const insertTopic = db.prepare(`
          INSERT INTO topics (id, name, emoji, color, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            emoji = excluded.emoji,
            color = excluded.color,
            description = excluded.description,
            updated_at = excluded.updated_at
        `);
        for (const t of topics) {
          if (!t.id || !t.name) continue;
          insertTopic.run(
            t.id,
            t.name,
            t.emoji || '📁',
            t.color || '#0284c7',
            t.description || '',
            t.created_at || new Date().toISOString(),
            t.updated_at || new Date().toISOString()
          );
        }
      }

      // 2. Restore Words
      if (words.length > 0) {
        const insertWord = db.prepare(`
          INSERT INTO words (
            id, word, phonetic, audio_url, part_of_speech, meaning_vi, meaning_en,
            collocations, examples, tags, level, repetition, interval, ease_factor,
            due_date, status, last_reviewed_at, created_at, updated_at, user_id, topic_id
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
          )
          ON CONFLICT(id) DO UPDATE SET
            word = excluded.word,
            phonetic = excluded.phonetic,
            audio_url = excluded.audio_url,
            part_of_speech = excluded.part_of_speech,
            meaning_vi = excluded.meaning_vi,
            meaning_en = excluded.meaning_en,
            collocations = excluded.collocations,
            examples = excluded.examples,
            tags = excluded.tags,
            level = excluded.level,
            repetition = excluded.repetition,
            interval = excluded.interval,
            ease_factor = excluded.ease_factor,
            due_date = excluded.due_date,
            status = excluded.status,
            last_reviewed_at = excluded.last_reviewed_at,
            topic_id = excluded.topic_id,
            updated_at = excluded.updated_at,
            user_id = excluded.user_id
        `);

        for (const w of words) {
          if (!w.id || !w.word) continue;
          insertWord.run(
            w.id,
            w.word,
            w.phonetic || '',
            w.audio_url || '',
            w.part_of_speech || 'noun',
            w.meaning_vi || '',
            w.meaning_en || '',
            safeStringify(w.collocations, '[]'),
            safeStringify(w.examples, '[]'),
            safeStringify(w.tags, '[]'),
            w.level || 'B1',
            w.repetition || 0,
            w.interval || 0,
            w.ease_factor || 2.5,
            w.due_date || new Date().toISOString().split('T')[0],
            w.status || 'new',
            w.last_reviewed_at || null,
            w.created_at || new Date().toISOString(),
            w.updated_at || new Date().toISOString(),
            userId,
            w.topic_id || 'daily'
          );
        }
      }

      // 3. Restore Patterns
      if (patterns.length > 0) {
        const insertPattern = db.prepare(`
          INSERT INTO patterns (
            id, name, formula, explanation, meaning_vi, category, tone,
            examples, tags, repetition, interval, ease_factor,
            due_date, status, last_reviewed_at, created_at, updated_at, user_id
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?
          )
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            formula = excluded.formula,
            explanation = excluded.explanation,
            meaning_vi = excluded.meaning_vi,
            category = excluded.category,
            tone = excluded.tone,
            examples = excluded.examples,
            tags = excluded.tags,
            repetition = excluded.repetition,
            interval = excluded.interval,
            ease_factor = excluded.ease_factor,
            due_date = excluded.due_date,
            status = excluded.status,
            last_reviewed_at = excluded.last_reviewed_at,
            updated_at = excluded.updated_at,
            user_id = excluded.user_id
        `);

        for (const p of patterns) {
          if (!p.id || !p.name) continue;
          insertPattern.run(
            p.id,
            p.name,
            p.formula || '',
            p.explanation || '',
            p.meaning_vi || '',
            p.category || 'emphasis',
            p.tone || 'Neutral',
            safeStringify(p.examples, '[]'),
            safeStringify(p.tags, '[]'),
            p.repetition || 0,
            p.interval || 0,
            p.ease_factor || 2.5,
            p.due_date || new Date().toISOString().split('T')[0],
            p.status || 'new',
            p.last_reviewed_at || null,
            p.created_at || new Date().toISOString(),
            p.updated_at || new Date().toISOString(),
            userId
          );
        }
      }

      // 4. Restore Notes
      if (notes.length > 0) {
        const insertNote = db.prepare(`
          INSERT INTO notes (id, title, content, topic, tags, linked_words, created_at, updated_at, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            content = excluded.content,
            topic = excluded.topic,
            tags = excluded.tags,
            linked_words = excluded.linked_words,
            updated_at = excluded.updated_at,
            user_id = excluded.user_id
        `);

        for (const n of notes) {
          if (!n.id || !n.title) continue;
          insertNote.run(
            n.id,
            n.title,
            n.content || '',
            n.topic || 'General',
            safeStringify(n.tags, '[]'),
            safeStringify(n.linked_words, '[]'),
            n.created_at || new Date().toISOString(),
            n.updated_at || new Date().toISOString(),
            userId
          );
        }
      }

      // 5. Restore Study Logs
      if (study_logs.length > 0) {
        const insertStudyLog = db.prepare(`
          INSERT INTO study_logs (id, date, user_id, reviews_count, new_words_count, duration_seconds, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, date) DO UPDATE SET
            reviews_count = excluded.reviews_count,
            new_words_count = excluded.new_words_count,
            duration_seconds = excluded.duration_seconds
        `);

        for (const s of study_logs) {
          if (!s.date) continue;
          insertStudyLog.run(
            s.id || `log_${userId}_${s.date}`,
            s.date,
            userId,
            s.reviews_count || 0,
            s.new_words_count || 0,
            s.duration_seconds || 0,
            s.created_at || new Date().toISOString()
          );
        }
      }

      // 6. Restore Quiz History
      if (quiz_history.length > 0) {
        try {
          const insertQuiz = db.prepare(`
            INSERT INTO quiz_history (
              id, title, type, is_ai, topic, category, level, mode,
              questions, total_questions, best_score, attempts_count, last_attempt_at,
              created_at, updated_at, user_id
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?
            )
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              questions = excluded.questions,
              best_score = excluded.best_score,
              attempts_count = excluded.attempts_count,
              last_attempt_at = excluded.last_attempt_at,
              updated_at = excluded.updated_at,
              user_id = excluded.user_id
          `);

          for (const q of quiz_history) {
            if (!q.id || !q.title) continue;
            insertQuiz.run(
              q.id,
              q.title,
              q.type || 'vocab',
              q.is_ai !== undefined ? q.is_ai : 1,
              q.topic || 'All',
              q.category || 'all',
              q.level || 'all',
              q.mode || 'mixed',
              safeStringify(q.questions, '[]'),
              q.total_questions || 5,
              q.best_score || null,
              q.attempts_count || 0,
              q.last_attempt_at || null,
              q.created_at || new Date().toISOString(),
              q.updated_at || new Date().toISOString(),
              userId
            );
          }
        } catch (e) {
          console.warn('[Import Quiz History Warning]', e.message);
        }
      }

      // 7. Restore User Settings (Optional)
      if (user_settings && typeof user_settings === 'object') {
        try {
          db.prepare(`
            INSERT INTO user_settings (user_id, gemini_model, gemini_api_key, daily_goal, alarm_time, telegram_bot_token, telegram_chat_id, telegram_enabled, telegram_due_reminder, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              gemini_model = excluded.gemini_model,
              gemini_api_key = CASE WHEN excluded.gemini_api_key != '' THEN excluded.gemini_api_key ELSE user_settings.gemini_api_key END,
              daily_goal = excluded.daily_goal,
              alarm_time = excluded.alarm_time,
              telegram_bot_token = CASE WHEN excluded.telegram_bot_token != '' THEN excluded.telegram_bot_token ELSE user_settings.telegram_bot_token END,
              telegram_chat_id = CASE WHEN excluded.telegram_chat_id != '' THEN excluded.telegram_chat_id ELSE user_settings.telegram_chat_id END,
              telegram_enabled = excluded.telegram_enabled,
              telegram_due_reminder = excluded.telegram_due_reminder,
              updated_at = excluded.updated_at
          `).run(
            userId,
            user_settings.gemini_model || 'gemini-3.6-flash',
            user_settings.gemini_api_key || '',
            user_settings.daily_goal || 10,
            user_settings.alarm_time || '08:00',
            user_settings.telegram_bot_token || '',
            user_settings.telegram_chat_id || '',
            user_settings.telegram_enabled ? 1 : 0,
            user_settings.telegram_due_reminder ? 1 : 0,
            new Date().toISOString()
          );
        } catch (e) {
          console.warn('[Import User Settings Warning]', e.message);
        }
      }

      // 8. Restore Study Sessions
      if (study_sessions.length > 0) {
        try {
          const insertSession = db.prepare(`
            INSERT INTO study_sessions (
              id, user_id, activity_type, activity_title, duration_seconds,
              mode, target_seconds, notes, started_at, ended_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              activity_type = excluded.activity_type,
              activity_title = excluded.activity_title,
              duration_seconds = excluded.duration_seconds,
              mode = excluded.mode,
              target_seconds = excluded.target_seconds,
              notes = excluded.notes,
              started_at = excluded.started_at,
              ended_at = excluded.ended_at,
              user_id = excluded.user_id
          `);

          for (const s of study_sessions) {
            if (!s.id || !s.duration_seconds) continue;
            insertSession.run(
              s.id,
              userId,
              s.activity_type || 'general',
              s.activity_title || '',
              s.duration_seconds || 0,
              s.mode || 'stopwatch',
              s.target_seconds || 0,
              s.notes || '',
              s.started_at || new Date().toISOString(),
              s.ended_at || new Date().toISOString(),
              s.created_at || new Date().toISOString()
            );
          }
        } catch (e) {
          console.warn('[Import Study Sessions Warning]', e.message);
        }
      }

      // 9. Restore Study Schedules
      if (study_schedules.length > 0) {
        try {
          const insertSchedule = db.prepare(`
            INSERT INTO study_schedules (
              id, user_id, title, start_time, end_time,
              study_duration_minutes, break_duration_minutes, long_break_minutes,
              cycles_before_long_break, days_of_week, is_active, sound_type,
              auto_start_breaks, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              start_time = excluded.start_time,
              end_time = excluded.end_time,
              study_duration_minutes = excluded.study_duration_minutes,
              break_duration_minutes = excluded.break_duration_minutes,
              long_break_minutes = excluded.long_break_minutes,
              cycles_before_long_break = excluded.cycles_before_long_break,
              days_of_week = excluded.days_of_week,
              is_active = excluded.is_active,
              sound_type = excluded.sound_type,
              auto_start_breaks = excluded.auto_start_breaks,
              updated_at = excluded.updated_at,
              user_id = excluded.user_id
          `);

          for (const sch of study_schedules) {
            if (!sch.id || !sch.title) continue;
            insertSchedule.run(
              sch.id,
              userId,
              sch.title,
              sch.start_time || '20:00',
              sch.end_time || '22:30',
              sch.study_duration_minutes || 25,
              sch.break_duration_minutes || 5,
              sch.long_break_minutes || 15,
              sch.cycles_before_long_break || 4,
              safeStringify(sch.days_of_week, '["mon","tue","wed","thu","fri","sat","sun"]'),
              sch.is_active !== undefined ? (sch.is_active ? 1 : 0) : 1,
              sch.sound_type || 'melodic',
              sch.auto_start_breaks !== undefined ? (sch.auto_start_breaks ? 1 : 0) : 1,
              sch.created_at || new Date().toISOString(),
              sch.updated_at || new Date().toISOString()
            );
          }
        } catch (e) {
          console.warn('[Import Study Schedules Warning]', e.message);
        }
      }

      db.exec('COMMIT;');
    } catch (txErr) {
      try { db.exec('ROLLBACK;'); } catch (e) {}
      throw txErr;
    }

    const summaryParts = [];
    if (words.length > 0) summaryParts.push(`${words.length} từ vựng`);
    if (patterns.length > 0) summaryParts.push(`${patterns.length} cấu trúc`);
    if (notes.length > 0) summaryParts.push(`${notes.length} ghi chú`);
    if (topics.length > 0) summaryParts.push(`${topics.length} chủ đề`);
    if (study_logs.length > 0) summaryParts.push(`${study_logs.length} ngày lịch sử`);
    if (study_sessions.length > 0) summaryParts.push(`${study_sessions.length} phiên bấm giờ học`);
    if (study_schedules.length > 0) summaryParts.push(`${study_schedules.length} lịch học dài hạn`);

    return {
      success: true,
      message: `Khôi phục dữ liệu thành công: ${summaryParts.join(', ')}!`,
      stats: {
        words: words.length,
        patterns: patterns.length,
        notes: notes.length,
        topics: topics.length,
        study_logs: study_logs.length,
        study_sessions: study_sessions.length,
        study_schedules: study_schedules.length
      }
    };
  }
};
