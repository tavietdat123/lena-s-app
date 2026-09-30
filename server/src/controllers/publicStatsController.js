import { getDb } from '../db/database.js';
import { activityChartService } from '../services/activityChartService.js';

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

      // 3. Words & Memory Retention Statistics
      const wordsQuery = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN repetition >= 5 OR interval >= 21 THEN 1 ELSE 0 END) as mastered,
          SUM(CASE WHEN repetition >= 2 AND repetition < 5 AND interval < 21 THEN 1 ELSE 0 END) as reviewing,
          SUM(CASE WHEN repetition = 1 THEN 1 ELSE 0 END) as learning,
          SUM(CASE WHEN repetition = 0 OR repetition IS NULL THEN 1 ELSE 0 END) as new_words
        FROM words
        WHERE user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL
      `;
      const wordCounts = db.prepare(wordsQuery).get(userId) || { total: 0, mastered: 0, reviewing: 0, learning: 0, new_words: 0 };

      // Word levels breakdown (A1, A2, B1, B2, C1, C2)
      const levelRows = db.prepare(`
        SELECT level, COUNT(*) as count 
        FROM words 
        WHERE user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL
        GROUP BY level
      `).all(userId);
      const levelsBreakdown = {};
      levelRows.forEach(r => { if (r.level) levelsBreakdown[r.level] = r.count; });

      // 4. Patterns & Communicative Categories
      const patternsCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM patterns 
        WHERE user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL
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
        WHERE user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL
      `).get(userId) || { active_days: 0, total_seconds: 0, total_reviews: 0, total_new_words: 0 };

      // Last 14 days activity trail
      const recentLogs = db.prepare(`
        SELECT date, duration_seconds, reviews_count, new_words_count
        FROM study_logs
        WHERE user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL
        ORDER BY date DESC
        LIMIT 14
      `).all(userId).reverse();

      // 6. Activity Distribution (Vocab, Patterns, Reading, Speaking, Coding, General)
      const sessionDistRows = db.prepare(`
        SELECT activity_type, SUM(duration_seconds) as total_seconds, COUNT(*) as sessions_count
        FROM study_sessions
        WHERE user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL
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
        WHERE user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL
      `).get(userId);

      // 8. Showcase: Top Mastered Words
      const topWords = db.prepare(`
        SELECT word, phonetic, part_of_speech, meaning_vi, level, repetition
        FROM words
        WHERE (user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL)
          AND (repetition >= 2 OR interval >= 7)
        ORDER BY repetition DESC, interval DESC
        LIMIT 8
      `).all(userId);

      // Total focused study hours
      const totalStudyHours = ((logsSummary.total_seconds || 0) / 3600).toFixed(1);

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
          retentionBreakdown: {
            mastered: wordCounts.mastered || 0,
            reviewing: wordCounts.reviewing || 0,
            learning: wordCounts.learning || 0,
            newWords: wordCounts.new_words || 0
          },
          levelsBreakdown,
          activityDistribution: Object.values(activityMap),
          recentLogs,
          periodsData: activityChartService.buildPeriodsData(db, userId),
          topWords
        }
      });
    } catch (err) {
      console.error('[Public Stats Error]', err);
      return res.status(500).json({ success: false, error: 'Không thể tải bảng thống kê công khai: ' + err.message });
    }
  }
};
