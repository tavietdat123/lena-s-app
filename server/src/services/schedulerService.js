import { getDb } from '../db/database.js';
import { telegramService } from './telegramService.js';
import { systemAlarmService } from './systemAlarmService.js';

let intervalTimer = null;
let lastMorningSentDate = null;
let lastLunchSentDate = null;
let lastEveningSentDate = null;
let lastStreakSaverSentDate = null;
let lastWeeklyDigestSentDate = null;
let lastBackupSentDate = null;
let hardcoreAlarmCountToday = 0;
let lastHardcoreAlarmTimestamp = 0;

export const schedulerService = {
  start: () => {
    if (intervalTimer) return;

    console.log('⏰ [Scheduler] Full-Suite Smart Study Notification Scheduler initialized.');

    // Check every 20 seconds for precise time triggering
    intervalTimer = setInterval(async () => {
      try {
        const db = getDb();
        const now = new Date();
        
        // Format current HH:MM in local time
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;
        const todayDateStr = now.toISOString().slice(0, 10);
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...

        // Reset daily counters on new day
        if (lastEveningSentDate && lastEveningSentDate !== todayDateStr) {
          hardcoreAlarmCountToday = 0;
        }

        // 1. Morning Spaced Repetition Due Words Reminder (Default 08:30)
        const morningTimeRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_morning_time'").get();
        const morningTargetTime = morningTimeRow?.value || '08:30';

        if (currentTimeStr === morningTargetTime && lastMorningSentDate !== todayDateStr) {
          console.log(`⏰ [Scheduler] Triggering Morning Due Words Digest at ${currentTimeStr}...`);
          lastMorningSentDate = todayDateStr;
          await telegramService.sendDueReviewReminder();
        }

        // 2. Lunchtime Word of the Day (12:00)
        if (currentTimeStr === '12:00' && lastLunchSentDate !== todayDateStr) {
          console.log(`⏰ [Scheduler] Triggering Lunchtime Word of the Day at ${currentTimeStr}...`);
          lastLunchSentDate = todayDateStr;
          await telegramService.sendWordOfTheDay();
        }

        // 3. Evening Daily Goal Progress & Hardcore Alarm Loop (Default 20:00)
        const eveningTimeRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_reminder_time'").get();
        const eveningTargetTime = eveningTimeRow?.value || '20:00';

        const disciplineRow = db.prepare("SELECT value FROM settings WHERE key = 'discipline_mode'").get();
        const isHardcore = disciplineRow?.value === 'hardcore' || disciplineRow?.value === '1';

        // Check if we hit the primary evening time
        if (currentTimeStr === eveningTargetTime && lastEveningSentDate !== todayDateStr) {
          console.log(`⏰ [Scheduler] Triggering Evening Study Progress Check & System Alarm at ${currentTimeStr}...`);
          lastEveningSentDate = todayDateStr;
          hardcoreAlarmCountToday = 1;
          lastHardcoreAlarmTimestamp = Date.now();

          // Trigger continuous system alarm at OS level!
          systemAlarmService.startAlarm();

          if (isHardcore) {
            await telegramService.sendHardcoreAlarmMessage();
          } else {
            await telegramService.checkAndSendDailyReminder();
          }
        } else if (isHardcore && currentTimeStr > eveningTargetTime && now.getHours() >= 19 && now.getHours() < 23) {
          // Hardcore Mode: Repeat alarm at most 3 times per evening, spaced at least 30 minutes apart
          const thirtyMinutesMs = 30 * 60 * 1000;
          if (hardcoreAlarmCountToday < 3 && (Date.now() - lastHardcoreAlarmTimestamp >= thirtyMinutesMs)) {
            const progress = telegramService.getDailyProgress();
            if (!progress.isGoalMet) {
              console.log(`🚨 [Scheduler] HARDCORE ALARM reminder #${hardcoreAlarmCountToday + 1} at ${currentTimeStr} (Missing ${progress.remaining} words)...`);
              hardcoreAlarmCountToday++;
              lastHardcoreAlarmTimestamp = Date.now();
              systemAlarmService.startAlarm();
              await telegramService.sendHardcoreAlarmMessage();
            }
          }
        }

        // 4. Late-Night Streak Saver Warning (22:30)
        if (currentTimeStr === '22:30' && lastStreakSaverSentDate !== todayDateStr) {
          console.log(`🔥 [Scheduler] Checking Late-Night Streak Saver at ${currentTimeStr}...`);
          lastStreakSaverSentDate = todayDateStr;
          const progress = telegramService.getDailyProgress();
          if (!progress.isGoalMet) {
            await telegramService.sendStreakSaverWarning();
          }
        }

        // 5. Sunday Morning Weekly Progress & Memory Digest (09:00 Sunday)
        if (dayOfWeek === 0 && currentTimeStr === '09:00' && lastWeeklyDigestSentDate !== todayDateStr) {
          console.log(`📈 [Scheduler] Triggering Sunday Weekly Digest at ${currentTimeStr}...`);
          lastWeeklyDigestSentDate = todayDateStr;
          await telegramService.sendWeeklyDigest();
        }

        // 6. Nightly Automated Database Backup to Telegram (Default 23:00)
        const autoBackupRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_auto_backup'").get();
        const isAutoBackupEnabled = autoBackupRow ? (autoBackupRow.value === 'true' || autoBackupRow.value === '1') : true;

        const backupTimeRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_backup_time'").get();
        const backupTargetTime = backupTimeRow?.value || '23:00';

        if (isAutoBackupEnabled && currentTimeStr === backupTargetTime && lastBackupSentDate !== todayDateStr) {
          console.log(`📦 [Scheduler] Triggering Nightly Auto-Backup to Telegram at ${currentTimeStr}...`);
          lastBackupSentDate = todayDateStr;
          try {
            await telegramService.sendBackupDocument();
          } catch (bErr) {
            console.error('📦 [Scheduler Backup Error]:', bErr.message);
          }
        }

      } catch (err) {
        console.error('⏰ [Scheduler Error]:', err.message);
      }
    }, 60 * 1000);
  },

  stop: () => {
    if (intervalTimer) {
      clearInterval(intervalTimer);
      intervalTimer = null;
    }
  }
};
