import crypto from 'node:crypto';
import { getDb } from '../db/database.js';
import { activityChartService } from '../services/activityChartService.js';

function getBreakdownForDate(db, userId, userClause, dateStr) {
  const isAll = (dateStr === 'all' || !dateStr);

  // 1. CEFR Levels Breakdown
  let levelRows;
  let totalWordsCount = 0;
  if (isAll) {
    levelRows = db.prepare(`
      SELECT level, COUNT(*) as count 
      FROM words 
      WHERE ${userClause}
      GROUP BY level
    `).all(userId);
    totalWordsCount = db.prepare(`SELECT COUNT(*) as count FROM words WHERE ${userClause}`).get(userId)?.count || 0;
  } else {
    levelRows = db.prepare(`
      SELECT level, COUNT(*) as count 
      FROM words 
      WHERE ${userClause}
        AND (created_at LIKE ? OR last_reviewed_at LIKE ?)
      GROUP BY level
    `).all(userId, `${dateStr}%`, `${dateStr}%`);
    totalWordsCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM words 
      WHERE ${userClause}
        AND (created_at LIKE ? OR last_reviewed_at LIKE ?)
    `).get(userId, `${dateStr}%`, `${dateStr}%`)?.count || 0;
  }

  const levelsBreakdown = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
  levelRows.forEach(r => {
    const lvl = (r.level || '').toUpperCase();
    if (levelsBreakdown[lvl] !== undefined) {
      levelsBreakdown[lvl] = r.count;
    }
  });

  // 2. Activity Distribution
  let sessionDistRows;
  if (isAll) {
    sessionDistRows = db.prepare(`
      SELECT activity_type, SUM(duration_seconds) as total_seconds, COUNT(*) as sessions_count
      FROM study_sessions
      WHERE ${userClause}
      GROUP BY activity_type
    `).all(userId);
  } else {
    sessionDistRows = db.prepare(`
      SELECT activity_type, SUM(duration_seconds) as total_seconds, COUNT(*) as sessions_count
      FROM study_sessions
      WHERE ${userClause}
        AND started_at LIKE ?
      GROUP BY activity_type
    `).all(userId, `${dateStr}%`);
  }

  const activityMap = {
    vocab: { label: 'Học Từ Vựng', emoji: '📚', seconds: 0, sessions: 0 },
    patterns: { label: 'Cấu Trúc Câu', emoji: '🧩', seconds: 0, sessions: 0 },
    reading: { label: 'Đọc Hiểu', emoji: '📖', seconds: 0, sessions: 0 },
    speaking: { label: 'Luyện Nói AI', emoji: '🗣️', seconds: 0, sessions: 0 },
    quiz: { label: 'Kiểm Tra & Quiz', emoji: '🎯', seconds: 0, sessions: 0 },
    coding: { label: 'Lập Trình & Dev', emoji: '💻', seconds: 0, sessions: 0 },
    general: { label: 'Tự Học Chung', emoji: '⏱️', seconds: 0, sessions: 0 }
  };

  let totalSessions = 0;
  let totalMinutes = 0;

  sessionDistRows.forEach(r => {
    const key = r.activity_type || 'general';
    if (!activityMap[key]) {
      activityMap[key] = { label: key, emoji: '📌', seconds: 0, sessions: 0 };
    }
    activityMap[key].seconds += (r.total_seconds || 0);
    activityMap[key].sessions += (r.sessions_count || 0);
    totalSessions += (r.sessions_count || 0);
    totalMinutes += Math.round((r.total_seconds || 0) / 60);
  });

  return {
    date: isAll ? 'all' : dateStr,
    isAll,
    totalWords: totalWordsCount,
    totalSessions,
    totalMinutes,
    levelsBreakdown,
    activityDistribution: Object.values(activityMap)
  };
}

export const publicStatsController = {
  // GET /api/public/stats or /api/public/stats/:username
  getPublicStats: async (req, res) => {
    try {
      const db = getDb();
      const targetIdentifier = req.params?.username || req.query?.user || req.query?.username || null;

      // 1. Resolve User Info
      let user = null;
      if (targetIdentifier) {
        user = db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          WHERE username = ? OR id = ?
        `).get(targetIdentifier, targetIdentifier);
      }

      if (!user) {
        // Fallback to primary admin or first registered user
        user = db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          WHERE role = 'admin' OR id = 'admin_master_user_id' 
          ORDER BY created_at ASC 
          LIMIT 1
        `).get() || db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          ORDER BY created_at ASC 
          LIMIT 1
        `).get();
      }

      const userId = user?.id || 'admin_master_user_id';
      const displayName = user?.full_name || user?.username || 'Học Viên LinguaVault';
      const avatarUrl = user?.avatar_url || '🧑‍🎓';
      const memberSince = user?.created_at ? user.created_at.split('T')[0] : '2026-08-20';

      // 2. Gamification Profile (XP, Level, Title, Streak)
      const profileRow = db.prepare(`
        SELECT total_xp, current_level, title, streak_record 
        FROM user_profile 
        WHERE user_id = ? OR id = ? OR id = 'default_user' 
        LIMIT 1
      `).get(userId, userId);

      const streakRow = db.prepare("SELECT value FROM settings WHERE key = 'streak'").get();
      const currentStreak = streakRow ? parseInt(streakRow.value, 10) || 0 : (profileRow?.streak_record || 0);

      const totalXp = profileRow?.total_xp || 0;
      const currentLevel = profileRow?.current_level || 1;
      const userTitle = profileRow?.title || 'Scholar 🌱';
      const maxStreak = Math.max(currentStreak, profileRow?.streak_record || 0);

      // Account Isolation Clause
      const isAdmin = (userId === 'admin_master_user_id' || user?.role === 'admin');
      const userClause = isAdmin 
        ? `(user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL OR user_id = '')` 
        : `(user_id = ?)`;

      // 3. Words & Memory Retention Statistics
      const wordsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN repetition >= 5 OR interval >= 21 THEN 1 ELSE 0 END) as mastered,
          SUM(CASE WHEN repetition >= 2 AND repetition < 5 AND interval < 21 THEN 1 ELSE 0 END) as reviewing,
          SUM(CASE WHEN repetition = 1 THEN 1 ELSE 0 END) as learning,
          SUM(CASE WHEN repetition = 0 OR repetition IS NULL THEN 1 ELSE 0 END) as new_words
        FROM words
        WHERE ${userClause}
      `;
      const wordCounts = db.prepare(wordsQuery).get(userId) || { total: 0, mastered: 0, reviewing: 0, learning: 0, new_words: 0 };

      // Word levels breakdown (A1, A2, B1, B2, C1, C2)
      const levelRows = db.prepare(`
        SELECT level, COUNT(*) as count 
        FROM words 
        WHERE ${userClause}
        GROUP BY level
      `).all(userId);
      const levelsBreakdown = {};
      levelRows.forEach(r => { if (r.level) levelsBreakdown[r.level] = r.count; });

      // 4. Patterns & Communicative Categories
      const patternsCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM patterns 
        WHERE ${userClause}
      `).get(userId)?.count || 0;

      const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM pattern_categories').get()?.count || 0;

      // 5. Study Logs & Time Investment
      const logsSummary = db.prepare(`
        SELECT 
          COUNT(DISTINCT date) as active_days,
          SUM(duration_seconds) as total_seconds,
          SUM(reviews_count) as total_reviews,
          SUM(new_words_count) as total_new_words
        FROM study_logs
        WHERE ${userClause}
      `).get(userId) || { active_days: 0, total_seconds: 0, total_reviews: 0, total_new_words: 0 };

      // Last 14 days activity trail
      const recentLogs = db.prepare(`
        SELECT date, duration_seconds, reviews_count, new_words_count
        FROM study_logs
        WHERE ${userClause}
        ORDER BY date DESC
        LIMIT 14
      `).all(userId).reverse();

      // 6. Activity Distribution (Vocab, Patterns, Reading, Speaking, Coding, General)
      const sessionDistRows = db.prepare(`
        SELECT activity_type, SUM(duration_seconds) as total_seconds, COUNT(*) as sessions_count
        FROM study_sessions
        WHERE ${userClause}
        GROUP BY activity_type
      `).all(userId);

      const activityMap = {
        vocab: { label: 'Học Từ Vựng', emoji: '📚', seconds: 0, sessions: 0 },
        patterns: { label: 'Cấu Trúc Câu', emoji: '🧩', seconds: 0, sessions: 0 },
        reading: { label: 'Đọc Hiểu', emoji: '📖', seconds: 0, sessions: 0 },
        speaking: { label: 'Luyện Nói AI', emoji: '🗣️', seconds: 0, sessions: 0 },
        coding: { label: 'Lập Trình & Dev', emoji: '💻', seconds: 0, sessions: 0 },
        general: { label: 'Tự Học Chung', emoji: '⏱️', seconds: 0, sessions: 0 }
      };

      sessionDistRows.forEach(r => {
        const key = r.activity_type || 'general';
        if (!activityMap[key]) {
          activityMap[key] = { label: key, emoji: '📌', seconds: 0, sessions: 0 };
        }
        activityMap[key].seconds += (r.total_seconds || 0);
        activityMap[key].sessions += (r.sessions_count || 0);
      });

      // 7. Quiz Accomplishments
      const quizSummary = db.prepare(`
        SELECT COUNT(*) as count, AVG(best_score) as avg_score
        FROM quiz_history
        WHERE ${userClause}
      `).get(userId);

      // 8. Showcase: Top Mastered Words
      const topWords = db.prepare(`
        SELECT word, phonetic, part_of_speech, meaning_vi, level, repetition
        FROM words
        WHERE ${userClause}
          AND (repetition >= 2 OR interval >= 7)
        ORDER BY repetition DESC, interval DESC
        LIMIT 8
      `).all(userId);

      // 9. TODAY'S ACCOUNTABILITY & SUPERVISION STATUS (Đánh giá kỷ luật hôm nay)
      const pad = n => String(n).padStart(2, '0');
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      const todaySessionsRow = db.prepare(`
        SELECT SUM(duration_seconds) as sec, COUNT(*) as count, MAX(started_at) as last_started
        FROM study_sessions
        WHERE ${userClause}
          AND substr(started_at, 1, 10) = ?
      `).get(userId, todayStr);

      const todayLogRow = db.prepare(`
        SELECT duration_seconds, reviews_count, new_words_count
        FROM study_logs
        WHERE ${userClause}
          AND date = ?
      `).get(userId, todayStr);

      const todaySeconds = Math.max(todaySessionsRow?.sec || 0, todayLogRow?.duration_seconds || 0);
      const todayMinutes = Math.round(todaySeconds / 60);
      const todayReviews = todayLogRow?.reviews_count || 0;
      const todayNewWords = todayLogRow?.new_words_count || 0;
      const todaySessionsCount = todaySessionsRow?.count || 0;

      // Target goals
      const userSettings = db.prepare(`
        SELECT daily_goal FROM user_settings WHERE user_id = ?
      `).get(userId);
      const targetGoalReviews = userSettings?.daily_goal || 15;
      const targetGoalMinutes = 30; // 30 minutes daily study target

      const isTimeGoalMet = todayMinutes >= targetGoalMinutes;
      const isReviewsGoalMet = todayReviews >= targetGoalReviews;
      const isCompliant = isTimeGoalMet || isReviewsGoalMet;

      let overallStatus = 'not_started';
      let statusLabel = 'Chưa Hoàn Thành Kỷ Luật';
      let statusMessage = 'Học viên hôm nay chưa học phiên nào hoặc chưa đạt mục tiêu tối thiểu!';
      let statusColor = '#ef4444'; // Red

      if (isCompliant) {
        overallStatus = 'completed';
        statusLabel = 'Đạt Chuẩn Kỷ Luật Xuất Sắc';
        statusMessage = `Đã hoàn thành mục tiêu ngày hôm nay (${todayMinutes} phút / ${targetGoalMinutes} phút)!`;
        statusColor = '#22c55e'; // Green
      } else if (todayMinutes > 0 || todayReviews > 0) {
        overallStatus = 'in_progress';
        statusLabel = 'Đang Rèn Luyện (Chưa Đủ Mục Tiêu)';
        statusMessage = `Đã tích lũy ${todayMinutes}/${targetGoalMinutes} phút. Cần học thêm để hoàn thành ngày.`;
        statusColor = '#f59e0b'; // Amber
      }

      const todayAccountability = {
        date: todayStr,
        todaySeconds,
        todayMinutes,
        todayReviews,
        todayNewWords,
        todaySessionsCount,
        targetGoalMinutes,
        targetGoalReviews,
        isTimeGoalMet,
        isReviewsGoalMet,
        overallStatus,
        statusLabel,
        statusMessage,
        statusColor,
        lastActiveAt: todaySessionsRow?.last_started || (todaySeconds > 0 ? `${todayStr}T12:00:00Z` : null)
      };

      // 10. RECENT STUDY SESSIONS WITH PAGINATION (Nhật ký phiên học cụ thể để người giám sát kiểm tra)
      const sessionsPage = Math.max(1, parseInt(req.query.session_page || req.query.page, 10) || 1);
      const sessionsLimit = Math.max(1, Math.min(50, parseInt(req.query.session_limit || req.query.limit, 10) || 10));
      const sessionsOffset = (sessionsPage - 1) * sessionsLimit;

      const totalSessionsCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM study_sessions 
        WHERE ${userClause}
      `).get(userId)?.count || 0;

      const recentSessions = db.prepare(`
        SELECT id, activity_type, activity_title, duration_seconds, mode, notes, started_at, ended_at
        FROM study_sessions
        WHERE ${userClause}
        ORDER BY started_at DESC
        LIMIT ? OFFSET ?
      `).all(userId, sessionsLimit, sessionsOffset).map(s => ({
        id: s.id,
        activity_type: s.activity_type || 'general',
        activity_title: s.activity_title || 'Phiên học tập trung',
        duration_seconds: s.duration_seconds,
        duration_minutes: Math.max(1, Math.round(s.duration_seconds / 60)),
        mode: s.mode || 'stopwatch',
        notes: s.notes || '',
        started_at: s.started_at,
        ended_at: s.ended_at
      }));

      const sessionsPagination = {
        page: sessionsPage,
        limit: sessionsLimit,
        total: totalSessionsCount,
        totalPages: Math.ceil(totalSessionsCount / sessionsLimit) || 1
      };

      // 11. SUPERVISOR FEEDBACKS & NUDGES (Các lời nhắc từ người giám sát)
      const supervisorFeedbacks = db.prepare(`
        SELECT id, supervisor_name, type, message, created_at
        FROM supervisor_feedbacks
        WHERE ${userClause}
        ORDER BY created_at DESC
        LIMIT 10
      `).all(userId);

      // Total focused study hours
      const totalStudyHours = ((logsSummary.total_seconds || 0) / 3600).toFixed(1);

      // 12. Breakdowns for Today and All-Time (CEFR Levels & Study Activities)
      const queryDate = req.query.date || todayStr;
      const dailyBreakdown = getBreakdownForDate(db, userId, userClause, queryDate);
      const allTimeBreakdown = getBreakdownForDate(db, userId, userClause, 'all');

      return res.json({
        success: true,
        data: {
          user: {
            username: user?.username || 'scholar',
            displayName,
            avatarUrl,
            memberSince,
            title: userTitle,
            level: currentLevel,
            totalXp,
            currentStreak,
            maxStreak
          },
          summary: {
            totalWords: wordCounts.total || 0,
            masteredWords: wordCounts.mastered || 0,
            reviewingWords: wordCounts.reviewing || 0,
            learningWords: wordCounts.learning || 0,
            newWords: wordCounts.new_words || 0,
            retentionRate: wordCounts.total > 0 ? Math.round((wordCounts.mastered / wordCounts.total) * 100) : 0,
            totalPatterns: patternsCount,
            totalCategories: categoriesCount,
            totalStudyHours: parseFloat(totalStudyHours),
            activeDays: logsSummary.active_days || 0,
            totalReviews: logsSummary.total_reviews || 0,
            quizzesTaken: quizSummary?.count || 0,
            avgQuizScore: quizSummary?.avg_score ? Math.round(quizSummary.avg_score) : null
          },
          todayAccountability,
          recentSessions,
          sessionsPagination,
          supervisorFeedbacks,
          retentionBreakdown: {
            mastered: wordCounts.mastered || 0,
            reviewing: wordCounts.reviewing || 0,
            learning: wordCounts.learning || 0,
            newWords: wordCounts.new_words || 0
          },
          levelsBreakdown: dailyBreakdown.levelsBreakdown,
          activityDistribution: dailyBreakdown.activityDistribution,
          dailyBreakdown,
          allTimeBreakdown,
          recentLogs,
          periodsData: activityChartService.buildPeriodsData(db, userId, ['week']),
          topWords
        }
      });
    } catch (err) {
      console.error('[Public Stats Error]', err);
      return res.status(500).json({ success: false, error: 'Không thể tải bảng thống kê công khai: ' + err.message });
    }
  },

  // POST /api/public/supervisor-feedback (Gửi lời động viên / nhắc nhở từ người giám sát)
  postSupervisorFeedback: async (req, res) => {
    try {
      const db = getDb();
      const {
        user_id,
        username,
        supervisor_name = 'Người Giám Sát',
        type = 'cheer', // 'cheer' | 'nudge' | 'warning' | 'comment'
        message = ''
      } = req.body || {};

      const cleanMessage = String(message || '').trim();
      if (!cleanMessage) {
        return res.status(400).json({ success: false, error: 'Nội dung lời nhắn giám sát không được để trống.' });
      }

      // Resolve user id
      let targetUserId = user_id;
      if (!targetUserId && username) {
        const u = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        targetUserId = u?.id;
      }
      if (!targetUserId) {
        targetUserId = 'admin_master_user_id';
      }

      const id = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const author = String(supervisor_name || 'Người Giám Sát').trim().slice(0, 50) || 'Người Giám Sát';

      db.prepare(`
        INSERT INTO supervisor_feedbacks (id, user_id, supervisor_name, type, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, targetUserId, author, type, cleanMessage.slice(0, 500), nowIso);

      const feedback = {
        id,
        user_id: targetUserId,
        supervisor_name: author,
        type,
        message: cleanMessage,
        created_at: nowIso
      };

      return res.json({
        success: true,
        message: 'Đã gửi lời nhắc/động viên tới học viên thành công! 🎉',
        data: feedback
      });
    } catch (err) {
      console.error('[Supervisor Feedback Error]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/public/sessions or /api/public/sessions/:username (Phân trang nhật ký phiên học cho người giám sát)
  getPublicSessions: async (req, res) => {
    try {
      const db = getDb();
      const targetIdentifier = req.params?.username || req.query?.user || req.query?.username || null;

      let user = null;
      if (targetIdentifier) {
        user = db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          WHERE username = ? OR id = ?
        `).get(targetIdentifier, targetIdentifier);
      }

      if (!user) {
        user = db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          WHERE role = 'admin' OR id = 'admin_master_user_id' 
          ORDER BY created_at ASC 
          LIMIT 1
        `).get() || db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          ORDER BY created_at ASC 
          LIMIT 1
        `).get();
      }

      const userId = user?.id || 'admin_master_user_id';
      const isAdmin = (userId === 'admin_master_user_id' || user?.role === 'admin');
      const userClause = isAdmin 
        ? "(user_id = ? OR user_id IS NULL OR user_id = '')" 
        : "user_id = ?";

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
      const offset = (page - 1) * limit;

      const totalCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM study_sessions 
        WHERE ${userClause}
      `).get(userId)?.count || 0;

      const sessions = db.prepare(`
        SELECT id, activity_type, activity_title, duration_seconds, mode, notes, started_at, ended_at
        FROM study_sessions
        WHERE ${userClause}
        ORDER BY started_at DESC
        LIMIT ? OFFSET ?
      `).all(userId, limit, offset).map(s => ({
        id: s.id,
        activity_type: s.activity_type || 'general',
        activity_title: s.activity_title || 'Phiên học tập trung',
        duration_seconds: s.duration_seconds,
        duration_minutes: Math.max(1, Math.round(s.duration_seconds / 60)),
        mode: s.mode || 'stopwatch',
        notes: s.notes || '',
        started_at: s.started_at,
        ended_at: s.ended_at
      }));

      const totalPages = Math.ceil(totalCount / limit) || 1;

      return res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages
          }
        }
      });
    } catch (err) {
      console.error('[Public Sessions Error]', err);
      return res.status(500).json({ success: false, error: 'Không thể tải nhật ký phiên học: ' + err.message });
    }
  },

  // GET /api/public/daily-breakdown or /api/public/daily-breakdown/:username (Phân bổ CEFR & hoạt động theo ngày)
  getDailyBreakdown: async (req, res) => {
    try {
      const db = getDb();
      const targetIdentifier = req.params?.username || req.query?.user || req.query?.username || null;

      let user = null;
      if (targetIdentifier) {
        user = db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          WHERE username = ? OR id = ?
        `).get(targetIdentifier, targetIdentifier);
      }

      if (!user) {
        user = db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          WHERE role = 'admin' OR id = 'admin_master_user_id' 
          ORDER BY created_at ASC 
          LIMIT 1
        `).get() || db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          ORDER BY created_at ASC 
          LIMIT 1
        `).get();
      }

      const userId = user?.id || 'admin_master_user_id';
      const isAdmin = (userId === 'admin_master_user_id' || user?.role === 'admin');
      const userClause = isAdmin 
        ? "(user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL OR user_id = '')" 
        : "user_id = ?";

      const pad = n => String(n).padStart(2, '0');
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const queryDate = req.query.date || todayStr;

      const breakdown = getBreakdownForDate(db, userId, userClause, queryDate);

      return res.json({
        success: true,
        data: breakdown
      });
    } catch (err) {
      console.error('[Daily Breakdown Error]', err);
      return res.status(500).json({ success: false, error: 'Không thể tải phân bổ dữ liệu theo ngày: ' + err.message });
    }
  },

  // GET /api/public/activity-chart or /api/public/activity-chart/:username (Tải dữ liệu biểu đồ theo từng tab: week, month, last30, all)
  getPublicActivityChart: async (req, res) => {
    try {
      const db = getDb();
      const targetIdentifier = req.params?.username || req.query?.user || req.query?.username || null;

      let user = null;
      if (targetIdentifier) {
        user = db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          WHERE username = ? OR id = ?
        `).get(targetIdentifier, targetIdentifier);
      }

      if (!user) {
        user = db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          WHERE role = 'admin' OR id = 'admin_master_user_id' 
          ORDER BY created_at ASC 
          LIMIT 1
        `).get() || db.prepare(`
          SELECT id, username, full_name, avatar_url, role, created_at 
          FROM users 
          ORDER BY created_at ASC 
          LIMIT 1
        `).get();
      }

      const userId = user?.id || 'admin_master_user_id';
      const period = String(req.query.period || 'week').trim().toLowerCase();
      const allowedPeriods = ['week', 'month', 'last30', 'all'];
      const cleanPeriod = allowedPeriods.includes(period) ? period : 'week';

      const periodResult = activityChartService.buildPeriodsData(db, userId, [cleanPeriod]);

      return res.json({
        success: true,
        data: periodResult[cleanPeriod] || null,
        period: cleanPeriod
      });
    } catch (err) {
      console.error('[Public Activity Chart Error]', err);
      return res.status(500).json({ success: false, error: 'Không thể tải dữ liệu biểu đồ: ' + err.message });
    }
  }
};
