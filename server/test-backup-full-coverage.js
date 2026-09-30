import { backupService } from './src/services/backupService.js';
import { getDb } from './src/db/database.js';

async function testFullBackupCoverage() {
  console.log('--- TESTING FULL BACKUP COVERAGE ---');
  const db = getDb();
  const testUserId = 'test_backup_user_' + Date.now();

  // 1. Seed test data for notification & schedules
  db.prepare(`
    INSERT INTO user_settings (user_id, daily_goal, alarm_time, telegram_bot_token, telegram_chat_id, telegram_enabled, telegram_due_reminder, updated_at)
    VALUES (?, 15, '07:30', 'bot_123_token', 'chat_456_id', 1, 1, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET daily_goal = 15, alarm_time = '07:30'
  `).run(testUserId);

  db.prepare(`
    INSERT INTO study_schedules (
      id, user_id, title, start_time, end_time, study_duration_minutes,
      break_duration_minutes, long_break_minutes, cycles_before_long_break,
      days_of_week, is_active, sound_type, activity_type, created_at, updated_at
    ) VALUES (
      ?, ?, 'Lịch Học Đêm Báo Thức Zen', '21:00', '23:30', 45, 10, 20, 3,
      '["mon","wed","fri"]', 1, 'zen', 'vocab', datetime('now'), datetime('now')
    )
  `).run('sch_' + Date.now(), testUserId);

  db.prepare(`
    INSERT INTO settings (key, value) VALUES ('telegram_morning_time', '08:15')
    ON CONFLICT(key) DO UPDATE SET value = '08:15'
  `).run();

  db.prepare(`
    INSERT INTO settings (key, value) VALUES ('discipline_mode', 'true')
    ON CONFLICT(key) DO UPDATE SET value = 'true'
  `).run();

  // 2. Export backup
  const exported = backupService.buildBackupPayload(testUserId);
  console.log('Exported payload version:', exported.version);
  console.log('Has study_schedules:', exported.data.study_schedules?.length > 0);
  console.log('Has user_settings:', !!exported.data.user_settings);
  console.log('Has notification_settings:', !!exported.data.notification_settings);
  console.log('Notification morning time in backup:', exported.data.notification_settings?.telegram_morning_time);
  console.log('Discipline mode in backup:', exported.data.notification_settings?.discipline_mode);
  console.log('User settings alarm_time in backup:', exported.data.user_settings?.alarm_time);

  if (!exported.data.study_schedules || exported.data.study_schedules.length === 0) {
    throw new Error('FAILED: study_schedules not exported!');
  }
  if (!exported.data.user_settings || exported.data.user_settings.alarm_time !== '07:30') {
    throw new Error('FAILED: user_settings not properly exported!');
  }
  if (!exported.data.notification_settings || exported.data.notification_settings.telegram_morning_time !== '08:15') {
    throw new Error('FAILED: notification_settings not exported!');
  }

  // 3. Test Restore
  const targetUserId = 'test_restore_user_' + Date.now();
  const restoreResult = backupService.restoreBackupPayload(exported, targetUserId);
  console.log('Restore result:', restoreResult);

  // 4. Verify in DB
  const restoredSchedule = db.prepare('SELECT * FROM study_schedules WHERE user_id = ?').get(targetUserId);
  if (!restoredSchedule || restoredSchedule.sound_type !== 'zen' || restoredSchedule.study_duration_minutes !== 45) {
    throw new Error('FAILED: study_schedules was not properly restored in DB!');
  }

  const restoredUserSettings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(targetUserId);
  if (!restoredUserSettings || restoredUserSettings.alarm_time !== '07:30' || restoredUserSettings.daily_goal !== 15) {
    throw new Error('FAILED: user_settings was not properly restored in DB!');
  }

  console.log('✅ ALL BACKUP NOTIFICATION & SCHEDULE CHECKS PASSED PERFECTLY!');
  process.exit(0);
}

testFullBackupCoverage().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
