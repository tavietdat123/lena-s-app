import { getDb } from '../db/database.js';

/**
 * Single source of truth for calculating user continuous daily study streak and records.
 * 
 * An active learning day is defined as any day where:
 * 1. study_logs has duration_seconds > 0, reviews_count > 0, or new_words_count > 0
 * 2. study_sessions has any session with duration_seconds > 0
 * 3. words table has vocabulary items added by the user on that day
 * 
 * Streak continuity logic:
 * - If user studied today: streak starts from today and counts consecutive days backwards.
 * - If user hasn't studied today yet: if yesterday was active, streak is still alive and counts from yesterday backwards.
 * - If neither today nor yesterday had activity: current streak is 0.
 * 
 * @param {object} [dbInstance] - Optional better-sqlite3 db instance
 * @param {string} [userId='admin_master_user_id'] - User ID to compute streak for
 * @returns {{ currentStreak: number, maxStreak: number, activeDaysCount: number, hasToday: boolean, hasYesterday: boolean, lastActiveDate: string | null }}
 */
export function calculateUserStreak(dbInstance, userId = 'admin_master_user_id') {
  const db = dbInstance || getDb();
  const targetUserId = userId || 'admin_master_user_id';
  const isAdmin = (targetUserId === 'admin_master_user_id');

  // Account isolation clause: Admin inherits legacy/unassigned records; normal users isolated
  const userClause = isAdmin 
    ? `(user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL OR user_id = '')` 
    : `(user_id = ?)`;

  const activeDates = new Set();

  try {
    // 1. Collect dates from study_logs (flashcard reviews, words added, timer duration)
    const logs = db.prepare(`
      SELECT date 
      FROM study_logs 
      WHERE ${userClause} 
        AND (duration_seconds > 0 OR reviews_count > 0 OR new_words_count > 0)
    `).all(targetUserId);

    for (const r of logs) {
      if (r.date && typeof r.date === 'string') {
        activeDates.add(r.date.trim());
      }
    }

    // 2. Collect dates from study_sessions (Pomodoro, Stopwatch, Vocab/Reading/Coding)
    const sessions = db.prepare(`
      SELECT substr(started_at, 1, 10) as utc_date, date(started_at, 'localtime') as local_date
      FROM study_sessions
      WHERE ${userClause} AND duration_seconds > 0
    `).all(targetUserId);

    for (const r of sessions) {
      if (r.utc_date) activeDates.add(r.utc_date.trim());
      if (r.local_date) activeDates.add(r.local_date.trim());
    }

    // 3. Collect dates from newly created words
    const words = db.prepare(`
      SELECT substr(created_at, 1, 10) as utc_date, date(created_at, 'localtime') as local_date
      FROM words
      WHERE ${userClause}
    `).all(targetUserId);

    for (const r of words) {
      if (r.utc_date) activeDates.add(r.utc_date.trim());
      if (r.local_date) activeDates.add(r.local_date.trim());
    }
  } catch (err) {
    console.error(`[StreakService] Error querying active dates for ${targetUserId}:`, err.message);
  }

  // Format helper
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const todayUtc = now.toISOString().split('T')[0];

  const yDate = new Date(now);
  yDate.setDate(yDate.getDate() - 1);
  const yesterdayLocal = `${yDate.getFullYear()}-${pad(yDate.getMonth() + 1)}-${pad(yDate.getDate())}`;
  const yesterdayUtc = yDate.toISOString().split('T')[0];

  const hasToday = activeDates.has(todayLocal) || activeDates.has(todayUtc);
  const hasYesterday = activeDates.has(yesterdayLocal) || activeDates.has(yesterdayUtc);

  // Compute Current Continuous Streak
  let currentStreak = 0;
  if (hasToday || hasYesterday) {
    let curr = new Date(hasToday ? now : yDate);
    while (true) {
      const loc = `${curr.getFullYear()}-${pad(curr.getMonth() + 1)}-${pad(curr.getDate())}`;
      const utc = curr.toISOString().split('T')[0];
      if (activeDates.has(loc) || activeDates.has(utc)) {
        currentStreak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Compute All-Time Max Streak from historical active dates
  const sortedDates = Array.from(activeDates).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  let maxConsecutive = 0;
  let running = 0;
  let prevTime = null;

  for (const dStr of sortedDates) {
    const dTime = new Date(`${dStr}T00:00:00Z`).getTime();
    if (prevTime === null) {
      running = 1;
    } else {
      const diffDays = Math.round((dTime - prevTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        running++;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    if (running > maxConsecutive) maxConsecutive = running;
    prevTime = dTime;
  }

  // Fetch streak record from user_profile
  let profileRecord = 0;
  try {
    const profileRow = db.prepare(`
      SELECT streak_record FROM user_profile 
      WHERE user_id = ? OR id = ? OR (id = 'default_user' AND ? = 'admin_master_user_id')
      ORDER BY CASE WHEN id = ? THEN 1 WHEN user_id = ? THEN 2 ELSE 3 END
      LIMIT 1
    `).get(targetUserId, targetUserId, targetUserId, targetUserId, targetUserId);

    profileRecord = profileRow?.streak_record || 0;
  } catch (e) {
    // table or column might not exist in early tests
  }

  const maxStreak = Math.max(currentStreak, maxConsecutive, profileRecord);

  // Auto-sync user_profile if new record achieved
  if (maxStreak > profileRecord) {
    try {
      db.prepare(`
        UPDATE user_profile 
        SET streak_record = ?, updated_at = ?
        WHERE user_id = ? OR id = ? OR (id = 'default_user' AND ? = 'admin_master_user_id')
      `).run(maxStreak, new Date().toISOString(), targetUserId, targetUserId, targetUserId);
    } catch (e) {}
  }

  // For admin, sync settings table for legacy backwards compatibility
  if (isAdmin) {
    try {
      db.prepare(`
        INSERT INTO settings (key, value) VALUES ('streak', ?) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(String(currentStreak));
    } catch (e) {}
  }

  const lastActiveDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

  return {
    currentStreak,
    maxStreak,
    activeDaysCount: activeDates.size,
    hasToday,
    hasYesterday,
    lastActiveDate
  };
}

export default {
  calculateUserStreak
};
