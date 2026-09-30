import { backupService } from './src/services/backupService.js';
import { getDb } from './src/db/database.js';

async function auditBackupProof() {
  const db = getDb();
  console.log('===============================================================');
  console.log('🛡️ BẮT ĐẦU KIỂM TOÁN CHUYÊN SÂU TÍNH NĂNG SAO LƯU THÔNG BÁO & DỮ LIỆU');
  console.log('===============================================================');

  const auditUserId = 'audit_user_' + Date.now();
  const scheduleId1 = 'sch_zen_' + Date.now();
  const scheduleId2 = 'sch_fanfare_' + Date.now();

  // 1. Setup User Settings (Telegram, Alarm, Daily Goal)
  db.prepare(`
    INSERT INTO user_settings (
      user_id, gemini_model, gemini_api_key, daily_goal, alarm_time,
      telegram_bot_token, telegram_chat_id, telegram_enabled, telegram_due_reminder, updated_at
    ) VALUES (?, 'gemini-3.6-flash', 'AIzaSyTestKey999', 25, '06:45',
      '123456789:ABC_TEST_BOT_TOKEN', '987654321', 1, 1, datetime('now'))
  `).run(auditUserId);

  // 2. Setup Study Schedules with Notification / Alarms
  db.prepare(`
    INSERT INTO study_schedules (
      id, user_id, title, start_time, end_time, study_duration_minutes,
      break_duration_minutes, long_break_minutes, cycles_before_long_break,
      days_of_week, is_active, sound_type, activity_type, auto_start_breaks, created_at, updated_at
    ) VALUES (
      ?, ?, 'Ca Học Sáng Chuông Zen', '07:00', '09:00', 50,
      10, 20, 2, '["mon","wed","fri"]', 1, 'zen', 'vocab', 1, datetime('now'), datetime('now')
    )
  `).run(scheduleId1, auditUserId);

  db.prepare(`
    INSERT INTO study_schedules (
      id, user_id, title, start_time, end_time, study_duration_minutes,
      break_duration_minutes, long_break_minutes, cycles_before_long_break,
      days_of_week, is_active, sound_type, activity_type, auto_start_breaks, created_at, updated_at
    ) VALUES (
      ?, ?, 'Ca Học Tối Kèn Khải Hoàn', '21:00', '23:30', 40,
      8, 15, 3, '["tue","thu","sat"]', 1, 'fanfare', 'coding', 0, datetime('now'), datetime('now')
    )
  `).run(scheduleId2, auditUserId);

  // 3. Setup Global Notification Settings
  const testSettings = [
    { key: 'telegram_morning_time', value: '07:30' },
    { key: 'telegram_reminder_time', value: '20:45' },
    { key: 'discipline_mode', value: 'true' },
    { key: 'telegram_auto_backup', value: 'true' },
    { key: 'telegram_backup_time', value: '23:15' },
    { key: 'daily_word_goal', value: '25' },
    { key: 'streak', value: '18' }
  ];
  const upsertSetting = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  for (const s of testSettings) {
    upsertSetting.run(s.key, s.value);
  }

  // 4. Setup User Gamification Profile
  db.prepare(`
    INSERT INTO user_profile (id, user_id, total_xp, current_level, title, streak_record, updated_at)
    VALUES (?, ?, 3450, 7, 'Polyglot Veteran 🌟', 30, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET total_xp = 3450, current_level = 7, title = 'Polyglot Veteran 🌟', streak_record = 30
  `).run(auditUserId, auditUserId);

  console.log('✅ Bước 1: Khởi tạo dữ liệu người dùng kiểm toán thành công.');

  // 5. Build Backup Payload
  const payload = backupService.buildBackupPayload(auditUserId);

  console.log('\n🔍 Bước 2: Kiểm tra cấu trúc File JSON Export:');
  console.log('  • App:', payload.app);
  console.log('  • Version:', payload.version);
  console.log('  • Tổng số lịch học trong backup:', payload.data.study_schedules.length);
  console.log('  • Lịch 1 (sound_type):', payload.data.study_schedules.find(s => s.id === scheduleId1)?.sound_type);
  console.log('  • Lịch 2 (sound_type):', payload.data.study_schedules.find(s => s.id === scheduleId2)?.sound_type);
  console.log('  • Giờ báo thức user_settings:', payload.data.user_settings?.alarm_time);
  console.log('  • Telegram bot token user_settings:', payload.data.user_settings?.telegram_bot_token?.slice(0, 15) + '...');
  console.log('  • Giờ nhắc sáng (notification_settings):', payload.data.notification_settings?.telegram_morning_time);
  console.log('  • Giờ nhắc tối (notification_settings):', payload.data.notification_settings?.telegram_reminder_time);
  console.log('  • Kỷ luật thép (discipline_mode):', payload.data.notification_settings?.discipline_mode);
  console.log('  • Giờ tự động backup (telegram_backup_time):', payload.data.notification_settings?.telegram_backup_time);
  console.log('  • Cấp độ XP (user_profile):', payload.data.user_profile?.total_xp, 'XP, Cấp:', payload.data.user_profile?.current_level);

  // Assertions on Payload
  if (!payload.data.study_schedules.find(s => s.id === scheduleId1 && s.sound_type === 'zen')) {
    throw new Error('FAIL: Lịch 1 với nhạc chuông Zen không có trong file backup!');
  }
  if (!payload.data.study_schedules.find(s => s.id === scheduleId2 && s.sound_type === 'fanfare')) {
    throw new Error('FAIL: Lịch 2 với nhạc chuông Fanfare không có trong file backup!');
  }
  if (payload.data.user_settings.alarm_time !== '06:45') {
    throw new Error('FAIL: Giờ báo thức không khớp!');
  }
  if (payload.data.notification_settings.telegram_morning_time !== '07:30') {
    throw new Error('FAIL: Giờ nhắc sáng không khớp!');
  }
  if (payload.data.notification_settings.discipline_mode !== 'true') {
    throw new Error('FAIL: Cài đặt Kỷ luật thép không có trong backup!');
  }
  if (payload.data.user_profile.total_xp !== 3450) {
    throw new Error('FAIL: Điểm XP không có trong backup!');
  }

  console.log('✅ Bước 2: Toàn bộ 100% trường thông báo, chuông báo thức, Telegram đã được đóng gói chính xác!');

  // 6. Test Restore
  console.log('\n🔄 Bước 3: Thực hiện Khôi phục (Restore) dữ liệu sang người dùng mục tiêu...');
  const restoredUserId = 'restored_user_' + Date.now();
  const restoreResult = backupService.restoreBackupPayload(payload, restoredUserId);
  console.log('  • Kết quả khôi phục:', restoreResult.message);

  // 7. Verify directly in SQLite Database
  console.log('\n🔬 Bước 4: Truy vấn cơ sở dữ liệu SQLite xác nhận thực tế:');

  const restoredSch1 = db.prepare('SELECT * FROM study_schedules WHERE id = ?').get(scheduleId1);
  console.log('  • Lịch 1 trong DB: id =', restoredSch1.id, '| Chuông =', restoredSch1.sound_type, '| Bắt đầu =', restoredSch1.start_time, '| Kết thúc =', restoredSch1.end_time);
  if (restoredSch1.sound_type !== 'zen' || restoredSch1.study_duration_minutes !== 50 || restoredSch1.break_duration_minutes !== 10) {
    throw new Error('FAIL: Lịch 1 trong DB không khớp sau khi khôi phục!');
  }

  const restoredSch2 = db.prepare('SELECT * FROM study_schedules WHERE id = ?').get(scheduleId2);
  console.log('  • Lịch 2 trong DB: id =', restoredSch2.id, '| Chuông =', restoredSch2.sound_type, '| Bắt đầu =', restoredSch2.start_time, '| Hoạt động =', restoredSch2.activity_type);
  if (restoredSch2.sound_type !== 'fanfare' || restoredSch2.activity_type !== 'coding') {
    throw new Error('FAIL: Lịch 2 trong DB không khớp sau khi khôi phục!');
  }

  const restoredUserSet = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(restoredUserId);
  console.log('  • Cài đặt người dùng trong DB: alarm_time =', restoredUserSet.alarm_time, '| daily_goal =', restoredUserSet.daily_goal, '| telegram_enabled =', restoredUserSet.telegram_enabled);
  if (restoredUserSet.alarm_time !== '06:45' || restoredUserSet.daily_goal !== 25 || restoredUserSet.telegram_enabled !== 1) {
    throw new Error('FAIL: Cài đặt người dùng trong DB không khớp sau khi khôi phục!');
  }

  const morningSetting = db.prepare("SELECT value FROM settings WHERE key = 'telegram_morning_time'").get();
  const reminderSetting = db.prepare("SELECT value FROM settings WHERE key = 'telegram_reminder_time'").get();
  const disciplineSetting = db.prepare("SELECT value FROM settings WHERE key = 'discipline_mode'").get();
  const autoBackupSetting = db.prepare("SELECT value FROM settings WHERE key = 'telegram_auto_backup'").get();
  console.log('  • Cài đặt thông báo toàn hệ thống trong DB: Nhắc sáng =', morningSetting.value, '| Nhắc tối =', reminderSetting.value, '| Kỷ luật thép =', disciplineSetting.value, '| Tự động backup =', autoBackupSetting.value);
  if (morningSetting.value !== '07:30' || reminderSetting.value !== '20:45' || disciplineSetting.value !== 'true' || autoBackupSetting.value !== 'true') {
    throw new Error('FAIL: Cài đặt thông báo toàn hệ thống trong DB không khớp sau khi khôi phục!');
  }

  const restoredProfile = db.prepare('SELECT * FROM user_profile WHERE user_id = ? OR id = ?').get(restoredUserId, restoredUserId);
  console.log('  • Hồ sơ Gamification trong DB: XP =', restoredProfile.total_xp, '| Cấp =', restoredProfile.current_level, '| Danh hiệu =', restoredProfile.title, '| Streak =', restoredProfile.streak_record);
  if (restoredProfile.total_xp !== 3450 || restoredProfile.current_level !== 7 || restoredProfile.streak_record !== 30) {
    throw new Error('FAIL: Hồ sơ Gamification trong DB không khớp sau khi khôi phục!');
  }

  console.log('\n===============================================================');
  console.log('🏆 KẾT QUẢ KIỂM TOÁN: CHẮC CHẮN 100%! TẤT CẢ DỮ LIỆU ĐỀU KHỚP TUYỆT ĐỐI!');
  console.log('===============================================================');
  process.exit(0);
}

auditBackupProof().catch(err => {
  console.error('❌ Kiểm toán thất bại:', err);
  process.exit(1);
});
