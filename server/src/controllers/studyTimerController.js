import crypto from 'node:crypto';
import { getDb } from '../db/database.js';
import { gamificationService } from '../services/gamificationService.js';

const ACTIVITY_META = {
  vocab: { label: 'Học Từ Vựng Mới', emoji: '📚', color: '#0284c7' },
  flashcard: { label: 'Ôn Tập Flashcards (SRS)', emoji: '🎴', color: '#8b5cf6' },
  reader: { label: 'Đọc Hiểu & Ghi Chú', emoji: '📖', color: '#10b981' },
  quiz: { label: 'Luyện Đề Quiz Trắc Nghiệm', emoji: '🎯', color: '#f59e0b' },
  speaking: { label: 'Luyện Phát Âm & Speaking', emoji: '🎙️', color: '#ec4899' },
  general: { label: 'Tự Học & Tổng Hợp', emoji: '💡', color: '#06b6d4' }
};

export const studyTimerController = {
  // 1. Save Completed Study Session
  saveSession: (req, res) => {
    try {
      const db = getDb();
      const userId = req.user?.id || 'admin_master_user_id';
      const {
        activity_type = 'general',
        activity_title,
        duration_seconds = 0,
        mode = 'stopwatch',
        target_seconds = 0,
        notes = '',
        started_at,
        ended_at
      } = req.body || {};

      const durationSec = parseInt(duration_seconds, 10) || 0;
      if (durationSec <= 0) {
        return res.status(400).json({ success: false, error: 'Thời lượng phiên học phải lớn hơn 0 giây.' });
      }

      const id = crypto.randomUUID();
      const now = new Date();
      const startIso = started_at || new Date(now.getTime() - durationSec * 1000).toISOString();
      const endIso = ended_at || now.toISOString();
      const createdIso = now.toISOString();

      const meta = ACTIVITY_META[activity_type] || ACTIVITY_META.general;
      const title = activity_title || meta.label;

      // 1. Insert session record
      db.prepare(`
        INSERT INTO study_sessions (
          id, user_id, activity_type, activity_title, duration_seconds,
          mode, target_seconds, notes, started_at, ended_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        activity_type,
        title,
        durationSec,
        mode,
        parseInt(target_seconds, 10) || 0,
        String(notes || '').trim(),
        startIso,
        endIso,
        createdIso
      );

      // 2. Accumulate into daily study_logs
      const dateStr = startIso.slice(0, 10);
      const existingLog = db.prepare(`
        SELECT * FROM study_logs 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id')) AND date = ?
      `).get(userId, userId, dateStr);

      if (existingLog) {
        db.prepare(`
          UPDATE study_logs 
          SET duration_seconds = duration_seconds + ? 
          WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id')) AND date = ?
        `).run(durationSec, userId, userId, dateStr);
      } else {
        const logId = `log_${userId}_${dateStr}`;
        db.prepare(`
          INSERT INTO study_logs (id, date, user_id, reviews_count, new_words_count, duration_seconds, created_at)
          VALUES (?, ?, ?, 0, 0, ?, ?)
        `).run(logId, dateStr, userId, durationSec, createdIso);
      }

      // 3. Award Gamification XP (Base 10 XP + 2 XP per minute)
      const minutes = Math.floor(durationSec / 60);
      const xpEarned = Math.min(100, Math.max(10, 10 + minutes * 2));
      const reason = `Bấm giờ học: ${title} (${Math.max(1, Math.round(durationSec / 60))} phút)`;
      const xpResult = gamificationService.addXp(userId, xpEarned, reason);

      const savedSession = {
        id,
        user_id: userId,
        activity_type,
        activity_title: title,
        duration_seconds: durationSec,
        mode,
        target_seconds,
        notes: String(notes || '').trim(),
        started_at: startIso,
        ended_at: endIso,
        created_at: createdIso
      };

      return res.json({
        success: true,
        message: `Đã lưu phiên học thành công! (+${xpEarned} XP)`,
        data: savedSession,
        xpEarned,
        gamification: xpResult
      });
    } catch (err) {
      console.error('[StudyTimer saveSession Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Get Study Sessions List with Pagination & Filters
  getSessions: (req, res) => {
    try {
      const db = getDb();
      const userId = req.user?.id || 'admin_master_user_id';
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
      const activityType = req.query.activity_type;

      let sql = `
        SELECT * FROM study_sessions 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `;
      const params = [userId, userId, userId];

      if (activityType && activityType !== 'all') {
        sql += ' AND activity_type = ?';
        params.push(activityType);
      }

      sql += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const sessions = db.prepare(sql).all(...params);

      // Get count
      let countSql = `
        SELECT COUNT(*) as count FROM study_sessions 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `;
      const countParams = [userId, userId, userId];
      if (activityType && activityType !== 'all') {
        countSql += ' AND activity_type = ?';
        countParams.push(activityType);
      }
      const total = db.prepare(countSql).get(...countParams)?.count || 0;

      return res.json({
        success: true,
        data: sessions,
        total,
        limit,
        offset
      });
    } catch (err) {
      console.error('[StudyTimer getSessions Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Delete Study Session
  deleteSession: (req, res) => {
    try {
      const db = getDb();
      const userId = req.user?.id || 'admin_master_user_id';
      const { id } = req.params;

      const session = db.prepare(`
        SELECT * FROM study_sessions 
        WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `).get(id, userId, userId, userId);

      if (!session) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy phiên học để xóa.' });
      }

      // Deduct from study_logs for that date
      const dateStr = session.started_at.slice(0, 10);
      db.prepare(`
        UPDATE study_logs 
        SET duration_seconds = MAX(0, duration_seconds - ?) 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id')) AND date = ?
      `).run(session.duration_seconds, userId, userId, dateStr);

      db.prepare('DELETE FROM study_sessions WHERE id = ?').run(id);

      return res.json({ success: true, message: 'Đã xóa phiên học thành công.' });
    } catch (err) {
      console.error('[StudyTimer deleteSession Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Get Comprehensive Study Time Statistics & Analytics
  getStats: (req, res) => {
    try {
      const db = getDb();
      const userId = req.user?.id || 'admin_master_user_id';

      // Total study seconds & total sessions count
      const totalRow = db.prepare(`
        SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds, COUNT(*) as count 
        FROM study_sessions 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      `).get(userId, userId, userId);

      const totalSeconds = totalRow?.total_seconds || 0;
      const totalSessions = totalRow?.count || 0;

      // Today's seconds (local date match)
      const todayDate = new Date().toISOString().slice(0, 10);
      const todayRow = db.prepare(`
        SELECT COALESCE(SUM(duration_seconds), 0) as today_seconds, COUNT(*) as count 
        FROM study_sessions 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
          AND (date(started_at, 'localtime') = date('now', 'localtime') OR started_at LIKE ?)
      `).get(userId, userId, userId, `${todayDate}%`);

      const todaySeconds = todayRow?.today_seconds || 0;
      const todaySessions = todayRow?.count || 0;

      // This week (past 7 days)
      const weekRow = db.prepare(`
        SELECT COALESCE(SUM(duration_seconds), 0) as week_seconds, COUNT(*) as count 
        FROM study_sessions 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
          AND started_at >= datetime('now', '-7 days')
      `).get(userId, userId, userId);

      const thisWeekSeconds = weekRow?.week_seconds || 0;

      // This month (past 30 days)
      const monthRow = db.prepare(`
        SELECT COALESCE(SUM(duration_seconds), 0) as month_seconds, COUNT(*) as count 
        FROM study_sessions 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
          AND started_at >= datetime('now', '-30 days')
      `).get(userId, userId, userId);

      const thisMonthSeconds = monthRow?.month_seconds || 0;

      // Average session duration in minutes
      const avgSessionMinutes = totalSessions > 0 ? Math.round((totalSeconds / totalSessions) / 60) : 0;

      // Breakdown by activity type
      const activityRows = db.prepare(`
        SELECT activity_type, COALESCE(SUM(duration_seconds), 0) as total_seconds, COUNT(*) as count 
        FROM study_sessions 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
        GROUP BY activity_type
      `).all(userId, userId, userId);

      const activityBreakdown = Object.entries(ACTIVITY_META).map(([type, meta]) => {
        const found = activityRows.find(r => r.activity_type === type);
        const sec = found ? found.total_seconds : 0;
        const count = found ? found.count : 0;
        const percent = totalSeconds > 0 ? Math.round((sec / totalSeconds) * 100) : 0;
        return {
          type,
          label: meta.label,
          emoji: meta.emoji,
          color: meta.color,
          total_seconds: sec,
          total_minutes: Math.round(sec / 60),
          count,
          percent
        };
      }).sort((a, b) => b.total_seconds - a.total_seconds);

      // 14-day history for bar chart
      const dailyHistory = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];

        const dayRow = db.prepare(`
          SELECT COALESCE(SUM(duration_seconds), 0) as sec, COUNT(*) as count 
          FROM study_sessions 
          WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
            AND started_at LIKE ?
        `).get(userId, userId, userId, `${dayStr}%`);

        const sec = dayRow?.sec || 0;
        dailyHistory.push({
          date: dayStr,
          label: `${weekday}, ${d.getDate()}/${d.getMonth() + 1}`,
          shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
          duration_seconds: sec,
          duration_minutes: Math.round(sec / 60),
          count: dayRow?.count || 0,
          isToday: i === 0
        });
      }

      // Calculate streak
      const streakLogs = db.prepare(`
        SELECT date FROM study_logs 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
          AND (duration_seconds > 0 OR reviews_count > 0)
        ORDER BY date DESC
      `).all(userId, userId, userId).map(r => r.date);

      let streakDays = 0;
      let checkDate = new Date();
      // If no activity today, check if yesterday was active
      const todayHasActivity = streakLogs.includes(todayDate);
      if (!todayHasActivity) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const checkStr = checkDate.toISOString().slice(0, 10);
        if (streakLogs.includes(checkStr)) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return res.json({
        success: true,
        data: {
          totalSeconds,
          todaySeconds,
          thisWeekSeconds,
          thisMonthSeconds,
          totalSessions,
          todaySessions,
          avgSessionMinutes,
          activityBreakdown,
          dailyHistory,
          streakDays
        }
      });
    } catch (err) {
      console.error('[StudyTimer getStats Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Get Long-term Study Schedules
  getSchedules: (req, res) => {
    try {
      const db = getDb();
      const userId = req.user?.id || 'admin_master_user_id';

      const rows = db.prepare(`
        SELECT * FROM study_schedules 
        WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
        ORDER BY created_at DESC
      `).all(userId, userId, userId);

      const schedules = rows.map(s => {
        let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        try { days = JSON.parse(s.days_of_week); } catch (e) {}
        return {
          ...s,
          days_of_week: days,
          is_active: Boolean(s.is_active),
          auto_start_breaks: Boolean(s.auto_start_breaks)
        };
      });

      return res.json({ success: true, data: schedules });
    } catch (err) {
      console.error('[StudyTimer getSchedules Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // 6. Create or Update Study Schedule
  saveSchedule: (req, res) => {
    try {
      const db = getDb();
      const userId = req.user?.id || 'admin_master_user_id';
      const {
        id,
        title,
        start_time = '20:00',
        end_time = '22:30',
        study_duration_minutes = 25,
        break_duration_minutes = 5,
        long_break_minutes = 15,
        cycles_before_long_break = 4,
        days_of_week = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        is_active = true,
        sound_type = 'melodic',
        auto_start_breaks = true
      } = req.body || {};

      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, error: 'Tiêu đề lịch học không được để trống.' });
      }

      const scheduleId = id || crypto.randomUUID();
      const now = new Date().toISOString();
      const daysStr = JSON.stringify(days_of_week);

      const existing = db.prepare('SELECT id FROM study_schedules WHERE id = ?').get(scheduleId);

      if (existing) {
        db.prepare(`
          UPDATE study_schedules SET
            title = ?,
            start_time = ?,
            end_time = ?,
            study_duration_minutes = ?,
            break_duration_minutes = ?,
            long_break_minutes = ?,
            cycles_before_long_break = ?,
            days_of_week = ?,
            is_active = ?,
            sound_type = ?,
            auto_start_breaks = ?,
            updated_at = ?
          WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id'))
        `).run(
          title.trim(),
          start_time,
          end_time,
          parseInt(study_duration_minutes, 10) || 25,
          parseInt(break_duration_minutes, 10) || 5,
          parseInt(long_break_minutes, 10) || 15,
          parseInt(cycles_before_long_break, 10) || 4,
          daysStr,
          is_active ? 1 : 0,
          sound_type || 'melodic',
          auto_start_breaks ? 1 : 0,
          now,
          scheduleId,
          userId,
          userId
        );
      } else {
        db.prepare(`
          INSERT INTO study_schedules (
            id, user_id, title, start_time, end_time,
            study_duration_minutes, break_duration_minutes, long_break_minutes,
            cycles_before_long_break, days_of_week, is_active, sound_type,
            auto_start_breaks, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          scheduleId,
          userId,
          title.trim(),
          start_time,
          end_time,
          parseInt(study_duration_minutes, 10) || 25,
          parseInt(break_duration_minutes, 10) || 5,
          parseInt(long_break_minutes, 10) || 15,
          parseInt(cycles_before_long_break, 10) || 4,
          daysStr,
          is_active ? 1 : 0,
          sound_type || 'melodic',
          auto_start_breaks ? 1 : 0,
          now,
          now
        );
      }

      const saved = db.prepare('SELECT * FROM study_schedules WHERE id = ?').get(scheduleId);
      let days = [];
      try { days = JSON.parse(saved.days_of_week); } catch (e) {}

      return res.json({
        success: true,
        message: existing ? 'Đã cập nhật lịch học thành công!' : 'Đã tạo lịch học mới thành công!',
        data: {
          ...saved,
          days_of_week: days,
          is_active: Boolean(saved.is_active),
          auto_start_breaks: Boolean(saved.auto_start_breaks)
        }
      });
    } catch (err) {
      console.error('[StudyTimer saveSchedule Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // 7. Delete Study Schedule
  deleteSchedule: (req, res) => {
    try {
      const db = getDb();
      const userId = req.user?.id || 'admin_master_user_id';
      const { id } = req.params;

      const result = db.prepare(`
        DELETE FROM study_schedules 
        WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id'))
      `).run(id, userId, userId);

      if (result.changes === 0) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy lịch học để xóa.' });
      }

      return res.json({ success: true, message: 'Đã xóa lịch học thành công.' });
    } catch (err) {
      console.error('[StudyTimer deleteSchedule Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};
