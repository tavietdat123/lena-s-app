/**
 * Activity Chart Service - Aggregates study activity across all time and custom periods
 * (Tuần này, Tháng này, 30 ngày qua, Tổng thời gian từ trước đến nay)
 */

export const activityChartService = {
  buildPeriodsData: (db, userId) => {
    const isAdmin = (userId === 'admin_master_user_id');
    const userClause = isAdmin 
      ? `(user_id = ? OR user_id = 'admin_master_user_id' OR user_id IS NULL)` 
      : `(user_id = ?)`;

    // 1. Fetch all session rows grouped by date (local substring)
    const sessionRows = db.prepare(`
      SELECT substr(started_at, 1, 10) as date, SUM(duration_seconds) as sec, COUNT(*) as count
      FROM study_sessions
      WHERE ${userClause}
      GROUP BY substr(started_at, 1, 10)
    `).all(userId);

    // 2. Fetch all daily study_logs (flashcard reviews, words added, timer duration)
    const logRows = db.prepare(`
      SELECT date, SUM(duration_seconds) as sec, SUM(reviews_count) as reviews, SUM(new_words_count) as new_words
      FROM study_logs
      WHERE ${userClause}
      GROUP BY date
    `).all(userId);

    // 3. Merge into unified date map
    const datesMap = new Map();
    sessionRows.forEach(r => {
      datesMap.set(r.date, {
        date: r.date,
        sessionSec: r.sec || 0,
        sessions: r.count || 0,
        logSec: 0,
        reviews: 0,
        newWords: 0
      });
    });

    logRows.forEach(r => {
      const existing = datesMap.get(r.date) || {
        date: r.date,
        sessionSec: 0,
        sessions: 0,
        logSec: 0,
        reviews: 0,
        newWords: 0
      };
      existing.logSec = Math.max(existing.logSec, r.sec || 0);
      existing.reviews = (existing.reviews || 0) + (r.reviews || 0);
      existing.newWords = (existing.newWords || 0) + (r.new_words || 0);
      datesMap.set(r.date, existing);
    });

    const allActiveDates = Array.from(datesMap.keys()).sort();
    const today = new Date();
    const pad = n => String(n).padStart(2, '0');
    const toDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todayStr = toDateStr(today);
    const weekdayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const getDayData = (dateStr) => {
      const record = datesMap.get(dateStr) || { sessionSec: 0, sessions: 0, logSec: 0, reviews: 0, newWords: 0 };
      const duration_seconds = Math.max(record.sessionSec, record.logSec);
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const weekday = weekdayNames[d.getDay()];
      const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;
      return {
        date: dateStr,
        weekday,
        shortDate,
        label: `${weekday}, ${shortDate}`,
        duration_seconds,
        duration_minutes: Math.round(duration_seconds / 60),
        sessions_count: record.sessions,
        reviews_count: record.reviews,
        new_words_count: record.newWords,
        isToday: dateStr === todayStr
      };
    };

    const summarizePeriod = (days) => {
      let total_seconds = 0;
      let active_days = 0;
      let sessions_count = 0;
      let reviews_count = 0;
      let new_words_count = 0;
      let peak_day = null;
      let max_metric = -1;

      days.forEach(d => {
        total_seconds += d.duration_seconds;
        sessions_count += d.sessions_count;
        reviews_count += d.reviews_count;
        new_words_count += d.new_words_count;
        if (d.duration_seconds > 0 || d.reviews_count > 0 || d.sessions_count > 0) {
          active_days++;
        }
        const metricVal = d.duration_seconds > 0 ? d.duration_seconds : d.reviews_count * 60;
        if (metricVal > max_metric && metricVal > 0) {
          max_metric = metricVal;
          peak_day = {
            date: d.date,
            shortDate: d.shortDate,
            weekday: d.weekday,
            minutes: d.duration_minutes,
            reviews: d.reviews_count
          };
        }
      });

      const total_minutes = Math.round(total_seconds / 60);
      const avg_minutes = active_days > 0 ? Math.round(total_minutes / active_days) : 0;
      const hours = (total_seconds / 3600).toFixed(1);

      return {
        total_seconds,
        total_minutes,
        total_hours: hours,
        active_days,
        total_days: days.length,
        sessions_count,
        reviews_count,
        new_words_count,
        avg_minutes,
        peak_day
      };
    };

    // --- PERIOD 1: TUẦN NÀY (Monday -> Sunday of current week) ---
    const weekDays = [];
    const currentDayOfWeek = today.getDay(); // 0 is Sunday
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const ds = toDateStr(d);
      const dayData = getDayData(ds);
      dayData.isFuture = ds > todayStr;
      weekDays.push(dayData);
    }

    // --- PERIOD 2: THÁNG NÀY (From 1st of current month to end of month) ---
    const monthDays = [];
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    for (let dayNum = 1; dayNum <= lastDayOfMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const ds = toDateStr(d);
      const dayData = getDayData(ds);
      dayData.isFuture = ds > todayStr;
      monthDays.push(dayData);
    }

    // --- PERIOD 3: 30 NGÀY QUA (Rolling 30 days up to today) ---
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const ds = toDateStr(d);
      last30Days.push(getDayData(ds));
    }

    // --- PERIOD 4: TỔNG THỜI GIAN / TỪ TRƯỚC ĐẾN GIỜ (From first recorded date to today) ---
    const earliestDateStr = allActiveDates.length > 0 ? allActiveDates[0] : todayStr;
    const allDays = [];
    const p = earliestDateStr.split('-');
    const cur = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    const targetEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    while (cur <= targetEnd) {
      const ds = toDateStr(cur);
      allDays.push(getDayData(ds));
      cur.setDate(cur.getDate() + 1);
    }

    return {
      week: {
        key: 'week',
        label: 'Tuần Này',
        badge: '7 ngày',
        description: 'Hoạt động tuần hiện tại (Thứ 2 - Chủ Nhật)',
        days: weekDays,
        summary: summarizePeriod(weekDays)
      },
      month: {
        key: 'month',
        label: 'Tháng Này',
        badge: `Tháng ${month + 1}`,
        description: `Toàn bộ Tháng ${month + 1}/${year}`,
        days: monthDays,
        summary: summarizePeriod(monthDays)
      },
      last30: {
        key: 'last30',
        label: '30 Ngày Qua',
        badge: '30 ngày',
        description: '30 ngày học gần nhất liên tục',
        days: last30Days,
        summary: summarizePeriod(last30Days)
      },
      all: {
        key: 'all',
        label: 'Tổng Thời Gian',
        badge: 'Từ trước đến nay',
        description: `Lịch sử trọn vẹn từ ${getDayData(earliestDateStr).shortDate}/${p[0]} đến nay`,
        days: allDays,
        summary: summarizePeriod(allDays)
      }
    };
  }
};
