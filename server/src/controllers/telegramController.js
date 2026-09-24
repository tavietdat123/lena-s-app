import { getDb } from '../db/database.js';
import { telegramService } from '../services/telegramService.js';

export const telegramController = {
  // GET /api/telegram/settings
  getSettings: (req, res) => {
    try {
      const db = getDb();
      const userId = req.user?.id || 'admin_master_user_id';

      const userSettings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      const rows = db.prepare(`
        SELECT key, value FROM settings 
        WHERE key IN ('telegram_bot_token', 'telegram_chat_id', 'telegram_enabled', 'daily_word_goal', 'telegram_reminder_time', 'discipline_mode', 'telegram_morning_time', 'telegram_auto_backup', 'telegram_backup_time')
      `).all();

      const settings = {
        telegram_bot_token: '',
        telegram_chat_id: '',
        telegram_enabled: false,
        daily_word_goal: 10,
        telegram_reminder_time: '20:00',
        telegram_morning_time: '08:30',
        discipline_mode: 'standard',
        telegram_auto_backup: true,
        telegram_backup_time: '23:00'
      };

      rows.forEach(r => {
        if (r.key === 'telegram_enabled' || r.key === 'telegram_auto_backup') {
          settings[r.key] = r.value === 'true' || r.value === '1';
        } else if (r.key === 'daily_word_goal') {
          settings[r.key] = parseInt(r.value, 10) || 10;
        } else {
          settings[r.key] = r.value || '';
        }
      });

      if (userSettings) {
        if (userSettings.telegram_bot_token !== undefined && userSettings.telegram_bot_token !== null) {
          settings.telegram_bot_token = userSettings.telegram_bot_token;
        }
        if (userSettings.telegram_chat_id !== undefined && userSettings.telegram_chat_id !== null) {
          settings.telegram_chat_id = userSettings.telegram_chat_id;
        }
        if (userSettings.telegram_enabled !== undefined && userSettings.telegram_enabled !== null) {
          settings.telegram_enabled = Boolean(userSettings.telegram_enabled);
        }
        if (userSettings.daily_goal) {
          settings.daily_word_goal = userSettings.daily_goal;
        }
        if (userSettings.alarm_time) {
          settings.telegram_reminder_time = userSettings.alarm_time;
        }
      }

      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/settings
  saveSettings: (req, res) => {
    try {
      const db = getDb();
      const userId = req.user?.id || 'admin_master_user_id';
      const { 
        telegram_bot_token, 
        telegram_chat_id, 
        telegram_enabled, 
        daily_word_goal, 
        telegram_reminder_time,
        telegram_morning_time,
        discipline_mode,
        telegram_auto_backup,
        telegram_backup_time
      } = req.body;
      const now = new Date().toISOString();

      // Upsert into user_settings
      const existing = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
      if (existing) {
        db.prepare(`
          UPDATE user_settings 
          SET telegram_bot_token = COALESCE(?, telegram_bot_token),
              telegram_chat_id = COALESCE(?, telegram_chat_id),
              telegram_enabled = COALESCE(?, telegram_enabled),
              daily_goal = COALESCE(?, daily_goal),
              alarm_time = COALESCE(?, alarm_time),
              updated_at = ?
          WHERE user_id = ?
        `).run(
          telegram_bot_token !== undefined ? String(telegram_bot_token).trim() : null,
          telegram_chat_id !== undefined ? String(telegram_chat_id).trim() : null,
          telegram_enabled !== undefined ? (telegram_enabled ? 1 : 0) : null,
          daily_word_goal !== undefined ? parseInt(daily_word_goal, 10) : null,
          telegram_reminder_time !== undefined ? String(telegram_reminder_time).trim() : null,
          now,
          userId
        );
      } else {
        db.prepare(`
          INSERT INTO user_settings (user_id, telegram_bot_token, telegram_chat_id, telegram_enabled, daily_goal, alarm_time, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          telegram_bot_token ? String(telegram_bot_token).trim() : '',
          telegram_chat_id ? String(telegram_chat_id).trim() : '',
          telegram_enabled ? 1 : 0,
          daily_word_goal ? parseInt(daily_word_goal, 10) : 10,
          telegram_reminder_time || '20:00',
          now
        );
      }

      // Also maintain global settings for server background daemons
      const upsert = db.prepare(`
        INSERT INTO settings (key, value) 
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);

      if (telegram_bot_token !== undefined) upsert.run('telegram_bot_token', String(telegram_bot_token));
      if (telegram_chat_id !== undefined) upsert.run('telegram_chat_id', String(telegram_chat_id));
      if (telegram_enabled !== undefined) upsert.run('telegram_enabled', String(telegram_enabled));
      if (daily_word_goal !== undefined) upsert.run('daily_word_goal', String(daily_word_goal));
      if (telegram_reminder_time !== undefined) upsert.run('telegram_reminder_time', String(telegram_reminder_time));
      if (telegram_morning_time !== undefined) upsert.run('telegram_morning_time', String(telegram_morning_time));
      if (discipline_mode !== undefined) upsert.run('discipline_mode', String(discipline_mode));
      if (telegram_auto_backup !== undefined) upsert.run('telegram_auto_backup', String(telegram_auto_backup));
      if (telegram_backup_time !== undefined) upsert.run('telegram_backup_time', String(telegram_backup_time));

      res.json({ success: true, message: 'Đã lưu cấu hình Mục tiêu & Telegram thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/test
  sendTest: async (req, res) => {
    try {
      const { telegram_bot_token, telegram_chat_id } = req.body;
      const result = await telegramService.sendTestMessage(telegram_bot_token, telegram_chat_id);
      res.json({ success: true, message: 'Đã gửi tin nhắn thử nghiệm thành công!', data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // GET /api/telegram/progress
  getProgress: (req, res) => {
    try {
      const progress = telegramService.getDailyProgress();
      res.json({ success: true, data: progress });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/trigger-reminder
  triggerReminder: async (req, res) => {
    try {
      const result = await telegramService.checkAndSendDailyReminder(true);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/trigger-alarm (Hardcore Alarm Trigger)
  triggerAlarm: async (req, res) => {
    try {
      const result = await telegramService.sendHardcoreAlarmMessage(true);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/trigger-due-reminder (Morning Due Words Digest)
  triggerDueReminder: async (req, res) => {
    try {
      const result = await telegramService.sendDueReviewReminder(true);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/trigger-streak-saver
  triggerStreakSaver: async (req, res) => {
    try {
      const result = await telegramService.sendStreakSaverWarning(true);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/trigger-word-of-day
  triggerWordOfDay: async (req, res) => {
    try {
      const result = await telegramService.sendWordOfTheDay(true);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/trigger-weekly-digest
  triggerWeeklyDigest: async (req, res) => {
    try {
      const result = await telegramService.sendWeeklyDigest(true);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/trigger-leech-alert
  triggerLeechAlert: async (req, res) => {
    try {
      const result = await telegramService.sendLeechWordsAlert(true);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/trigger-backup
  triggerBackup: async (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const result = await telegramService.sendBackupDocument(null, null, userId);
      res.json({ success: true, message: 'Đã gửi file sao lưu tới Telegram thành công!', data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
};
