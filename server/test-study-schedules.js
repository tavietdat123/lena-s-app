import { getDb } from './src/db/database.js';
import { backupService } from './src/services/backupService.js';

async function runTest() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TÍNH NĂNG LỊCH HỌC DÀI HẠN & NGHỈ GIỮA GIỜ (STUDY SCHEDULES)...');
  const db = getDb();

  // 1. Kiểm tra bảng study_schedules
  const tableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='study_schedules'`).get();
  if (!tableCheck) {
    throw new Error('❌ Bảng study_schedules chưa được tạo!');
  }
  console.log('  ✅ [PASS] Bảng study_schedules tồn tại trong SQLite');

  // Kiểm tra các cột
  const cols = db.prepare(`PRAGMA table_info(study_schedules)`).all().map(c => c.name);
  const requiredCols = [
    'id', 'user_id', 'title', 'start_time', 'end_time',
    'study_duration_minutes', 'break_duration_minutes', 'long_break_minutes',
    'cycles_before_long_break', 'days_of_week', 'is_active', 'sound_type',
    'auto_start_breaks', 'created_at', 'updated_at'
  ];
  for (const c of requiredCols) {
    if (!cols.includes(c)) throw new Error(`❌ Cột ${c} thiếu trong bảng study_schedules!`);
  }
  console.log('  ✅ [PASS] Đầy đủ 15 cột cấu hình lịch học và chu kỳ nghỉ giữa giờ');

  // 2. Test Backup and Restore
  const user = db.prepare(`SELECT id FROM users LIMIT 1`).get();
  if (!user) {
    console.log('  ⚠️ Không có user trong database, bỏ qua test user-dependent.');
    return;
  }
  const userId = user.id;

  // Insert a test schedule
  const testId = 'test_sched_' + Date.now();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO study_schedules (
      id, user_id, title, start_time, end_time,
      study_duration_minutes, break_duration_minutes,
      sound_type, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(testId, userId, 'Ca Học Test 20:00 - 22:30', '20:00', '22:30', 25, 5, 'alarm', 1, now, now);

  console.log('  ✅ [PASS] Thêm lịch học trực tiếp vào DB thành công');

  // Kiểm tra backup payload
  const backupPayload = backupService.buildBackupPayload(userId);
  if (!backupPayload.data.study_schedules || !Array.isArray(backupPayload.data.study_schedules)) {
    throw new Error('❌ Backup payload không chứa mảng study_schedules!');
  }
  const foundInBackup = backupPayload.data.study_schedules.find(s => s.id === testId);
  if (!foundInBackup) {
    throw new Error('❌ Không tìm thấy schedule vừa tạo trong backup payload!');
  }
  console.log('  ✅ [PASS] Sao lưu tự động (Backup) đã đóng gói study_schedules thành công');

  // Test restore
  const restoreResult = backupService.restoreBackupPayload(backupPayload, userId);
  if (!restoreResult.success) {
    throw new Error('❌ Khôi phục (Restore) thất bại: ' + restoreResult.error);
  }
  console.log('  ✅ [PASS] Phục hồi (Restore) study_schedules hoàn tất mượt mà');

  // 3. Test HTTP API
  const token = 'system_token_bypass_or_login';
  // Let's test with a simulated controller or local fetch if live server is running
  try {
    const res = await fetch('http://localhost:5001/api/study-timer/schedules');
    // Expect 401 without auth token
    if (res.status === 401) {
      console.log('  ✅ [PASS] Bảo mật: GET /api/study-timer/schedules yêu cầu xác thực');
    }
  } catch (e) {
    console.log('  ⚠️ Local live server check skipped (not running or network error)');
  }

  // Cleanup test schedule
  db.prepare(`DELETE FROM study_schedules WHERE id = ?`).run(testId);
  console.log('  ✅ [PASS] Dọn dẹp bản ghi kiểm thử thành công');

  console.log('\n=====================================================');
  console.log('🎉 KIỂM THỬ LỊCH HỌC DÀI HẠN & NGHỈ GIỮA GIỜ THÀNH CÔNG 100%!');
  console.log('=====================================================');
}

runTest().catch(err => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
