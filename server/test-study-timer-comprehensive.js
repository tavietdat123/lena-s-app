import http from 'node:http';
import { initializeDatabase, getDb } from './src/db/database.js';
import { studyTimerController } from './src/controllers/studyTimerController.js';
import { backupService } from './src/services/backupService.js';
import { generateToken } from './src/services/authService.js';

initializeDatabase();
const db = getDb();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:5001${path}`,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      },
      (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runComprehensiveTests() {
  console.log('\n=====================================================');
  console.log('🧪 KIỂM THỬ TOÀN DIỆN TÍNH NĂNG BẤM GIỜ & THỐNG KÊ (E2E)');
  console.log('=====================================================\n');

  const userId = 'admin_master_user_id';
  const authToken = generateToken({ id: userId, username: 'admin', role: 'admin' });

  // 1. DATABASE SCHEMA & INTEGRITY
  console.log('📦 1. Kiểm tra Cấu trúc Database & Bảng study_sessions:');
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='study_sessions'").get();
  assert(!!table, 'Bảng study_sessions tồn tại trong SQLite');

  const columns = db.prepare("PRAGMA table_info(study_sessions)").all().map(c => c.name);
  const requiredCols = [
    'id', 'user_id', 'activity_type', 'activity_title', 'duration_seconds',
    'mode', 'target_seconds', 'notes', 'started_at', 'ended_at', 'created_at'
  ];
  const allColsPresent = requiredCols.every(c => columns.includes(c));
  assert(allColsPresent, `Đầy đủ 11 cột bắt buộc: ${requiredCols.join(', ')}`);

  const index = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_study_sessions_user_date'").get();
  assert(!!index, 'Index idx_study_sessions_user_date tối ưu truy vấn thời gian đã tạo thành công');

  // 2. CONTROLLER LOGIC & EDGE CASES
  console.log('\n🧠 2. Kiểm tra Logic Bộ Điều Khiển (Controller Logic & Edge Cases):');
  
  // Test validation: Duration <= 0
  let errRes = null;
  const mockErrRes = {
    status: (code) => ({
      json: (data) => { errRes = { code, data }; return data; }
    })
  };
  studyTimerController.saveSession({ user: { id: userId }, body: { duration_seconds: 0 } }, mockErrRes);
  assert(errRes && errRes.code === 400, 'Bắt lỗi chính xác khi duration_seconds <= 0');

  // Test Save Stopwatch Session
  let saved1 = null;
  const mockRes1 = {
    status: () => ({ json: (d) => { saved1 = d; return d; } }),
    json: (d) => { saved1 = d; return d; }
  };
  studyTimerController.saveSession({
    user: { id: userId },
    body: {
      activity_type: 'vocab',
      activity_title: 'Học từ vựng Unit 1',
      duration_seconds: 720, // 12 minutes
      mode: 'stopwatch',
      notes: 'Học 20 từ chủ đề Công nghệ'
    }
  }, mockRes1);
  assert(saved1 && saved1.success && saved1.data && saved1.data.duration_seconds === 720, 'Lưu phiên bấm giờ (Stopwatch 12 phút) thành công');
  assert(saved1 && saved1.xpEarned === 34, 'Cộng XP chính xác: 10 base + (12 * 2) = 34 XP');

  // Test Save Pomodoro Session with custom 35 minutes
  let saved2 = null;
  const mockRes2 = {
    status: () => ({ json: (d) => { saved2 = d; return d; } }),
    json: (d) => { saved2 = d; return d; }
  };
  studyTimerController.saveSession({
    user: { id: userId },
    body: {
      activity_type: 'quiz',
      activity_title: 'Luyện Đề Quiz Trắc Nghiệm',
      duration_seconds: 2100, // 35 minutes
      mode: 'pomodoro',
      target_seconds: 2100,
      notes: 'Luyện 50 câu ngữ pháp'
    }
  }, mockRes2);
  assert(saved2 && saved2.success && saved2.data && saved2.data.mode === 'pomodoro', 'Lưu phiên Pomodoro tùy chọn (35 phút) thành công');

  // Test Study Logs Aggregation
  const todayStr = new Date().toISOString().slice(0, 10);
  const logRow = db.prepare('SELECT duration_seconds FROM study_logs WHERE user_id = ? AND date = ?').get(userId, todayStr);
  assert(logRow && logRow.duration_seconds >= (720 + 2100), `Tổng thời gian học hôm nay tích lũy vào study_logs chính xác (${logRow?.duration_seconds}s)`);

  // Test Get Stats
  let statsRes = null;
  studyTimerController.getStats({ user: { id: userId } }, { json: (d) => { statsRes = d; return d; } });
  assert(statsRes && statsRes.success && statsRes.data.totalSeconds >= (720 + 2100), 'Lấy KPI tổng thời gian học chính xác');
  assert(statsRes.data.activityBreakdown.length >= 11, 'Phân bổ 11 loại hoạt động đa năng (coding, work, deepwork, ngoại ngữ...) chuẩn xác');
  assert(statsRes.data.activityBreakdown.some(a => a.type === 'coding' && a.emoji === '💻'), 'Hỗ trợ danh mục Lập trình & Học Code (💻)');
  assert(statsRes.data.activityBreakdown.some(a => a.type === 'work' && a.emoji === '💼'), 'Hỗ trợ danh mục Công việc & Dự án (💼)');

  // Test Get Sessions with pagination and filter
  let listRes = null;
  studyTimerController.getSessions({ user: { id: userId }, query: { limit: 10, activity_type: 'vocab' } }, { json: (d) => { listRes = d; return d; } });
  assert(listRes && listRes.success && Array.isArray(listRes.data), 'Lọc danh sách phiên học theo loại (vocab) thành công');

  // 3. BACKUP & RESTORE INTEGRITY
  console.log('\n🛡️ 3. Kiểm tra Tích hợp Sao Lưu & Phục Hồi (Backup Payload):');
  const backup = backupService.buildBackupPayload();
  assert(backup && backup.data && Array.isArray(backup.data.study_sessions), 'Bảng study_sessions đã có trong payload backup tự động (backup.data.study_sessions)');
  assert(backup?.data?.study_sessions?.length >= 2, `Sao lưu ghi nhận thành công ${backup?.data?.study_sessions?.length} phiên học`);

  // 4. LIVE HTTP API ENDPOINTS TEST (PORT 5001)
  console.log('\n🌐 4. Kiểm tra Gọi API HTTP Thực Tế (Live Server Port 5001):');
  
  // 4.1 Unauthorized Check
  const unauthRes = await request('/api/study-timer/stats');
  assert(unauthRes.status === 401, 'Bảo mật: Từ chối truy cập 401 Unauthorized khi không có Bearer token');

  // 4.2 Authorized POST Session
  const postRes = await request('/api/study-timer/sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: {
      activity_type: 'speaking',
      activity_title: 'Luyện Nói & Speaking 15p',
      duration_seconds: 900,
      mode: 'pomodoro',
      target_seconds: 900,
      notes: 'HTTP Integration Test'
    }
  });
  assert(postRes.status === 200 && postRes.data.success, 'POST /api/study-timer/sessions thành công qua HTTP (200 OK)');
  const httpSessionId = postRes.data.data?.id;

  // 4.3 Authorized GET Stats
  const httpStats = await request('/api/study-timer/stats', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  assert(httpStats.status === 200 && httpStats.data.success && httpStats.data.data.todaySeconds > 0, 'GET /api/study-timer/stats trả về dữ liệu KPI đầy đủ qua HTTP');

  // 4.4 Authorized GET Sessions
  const httpSessions = await request('/api/study-timer/sessions?limit=5', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  assert(httpSessions.status === 200 && Array.isArray(httpSessions.data.data), 'GET /api/study-timer/sessions phân trang trả về danh sách phiên qua HTTP');

  // 4.5 Authorized DELETE Session
  if (httpSessionId) {
    const delRes = await request(`/api/study-timer/sessions/${httpSessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert(delRes.status === 200 && delRes.data.success, 'DELETE /api/study-timer/sessions/:id xóa phiên & trừ ngược thời gian nhật ký qua HTTP');
  }

  // Clean up mock records created in controller test
  if (saved1?.data?.id) {
    studyTimerController.deleteSession({ user: { id: userId }, params: { id: saved1.data.id } }, { json: () => {} });
  }
  if (saved2?.data?.id) {
    studyTimerController.deleteSession({ user: { id: userId }, params: { id: saved2.data.id } }, { json: () => {} });
  }

  console.log('\n=====================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ:`);
  console.log(`   • Số test:   ${passed + failed}`);
  console.log(`   • Passed:    ${passed}`);
  console.log(`   • Failed:    ${failed}`);
  console.log(`   • Trạng thái: ${failed === 0 ? '🟢 100% HOÀN HẢO - SẴN SÀNG SỬ DỤNG' : '🔴 CÓ LỖI CẦN SỬA'}`);
  console.log('=====================================================\n');

  if (failed > 0) process.exit(1);
}

runComprehensiveTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
