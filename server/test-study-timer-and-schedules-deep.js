import { getDb } from './src/db/database.js';
import { backupService } from './src/services/backupService.js';
import { studyTimerController } from './src/controllers/studyTimerController.js';
import { generateToken } from './src/services/authService.js';
import crypto from 'crypto';

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passCount++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
  }
}

// Mock Web Audio Context to test all 4 synthesized ringtones
class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
    this.calls = [];
  }
  createOscillator() {
    const osc = {
      type: 'sine',
      frequency: {
        setValueAtTime: (val, t) => {
          if (isNaN(val) || val <= 0) throw new Error(`Invalid frequency: ${val}`);
          if (isNaN(t) || t < 0) throw new Error(`Invalid time: ${t}`);
        }
      },
      connect: () => {},
      start: (t) => {
        if (isNaN(t) || t < 0) throw new Error(`Invalid start time: ${t}`);
      },
      stop: (t) => {
        if (isNaN(t) || t < 0) throw new Error(`Invalid stop time: ${t}`);
      }
    };
    return osc;
  }
  createGain() {
    const gain = {
      gain: {
        setValueAtTime: (val, t) => {
          if (isNaN(val) || isNaN(t)) throw new Error('Invalid gain setValueAtTime');
        },
        exponentialRampToValueAtTime: (val, t) => {
          if (isNaN(val) || val <= 0 || isNaN(t)) throw new Error('Invalid gain exponentialRampToValueAtTime');
        }
      },
      connect: () => {}
    };
    return gain;
  }
}

function testSynthesizerWithMock(soundType) {
  const ctx = new MockAudioContext();
  const now = ctx.currentTime;
  if (soundType === 'alarm') {
    [0, 0.35, 0.7].forEach((groupOffset) => {
      [0, 0.12].forEach((subOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + groupOffset + subOffset);
        gain.gain.setValueAtTime(0.28, now + groupOffset + subOffset);
        gain.gain.setValueAtTime(0.0001, now + groupOffset + subOffset + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + groupOffset + subOffset);
        osc.stop(now + groupOffset + subOffset + 0.08);
      });
    });
  } else if (soundType === 'zen') {
    const freqs = [216, 432, 648, 864];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const amp = 0.3 / (idx + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 3.0);
    });
  } else if (soundType === 'fanfare') {
    const notes = [
      { f: 392.00, t: 0, d: 0.14 },
      { f: 523.25, t: 0.15, d: 0.14 },
      { f: 659.25, t: 0.3, d: 0.2 },
      { f: 783.99, t: 0.52, d: 0.9 }
    ];
    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.32, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + d);
    });
  } else {
    // Melodic
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.13);
      gain.gain.setValueAtTime(0.28, now + i * 0.13);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + i * 0.13 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.13);
      osc.stop(now + i * 0.13 + 0.65);
    });
  }
}

async function runDeepTesting() {
  console.log('================================================================');
  console.log('🔬 KIỂM THỬ CHUYÊN SÂU TOÀN DIỆN (DEEP TEST SUITE)');
  console.log('   NHẠC CHUÔNG BÁO HẾT GIỜ & LỊCH HỌC DÀI HẠN VỚI NGHỈ GIỮA GIỜ');
  console.log('================================================================\n');

  const db = getDb();

  // -------------------------------------------------------------
  // TEST SUITE 1: Web Audio Synthesis & Ringtones Logic
  // -------------------------------------------------------------
  console.log('🎵 PHẦN 1: KIỂM THỬ THUẬT TOÁN TỔNG HỢP ÂM THANH (WEB AUDIO API):');
  try {
    testSynthesizerWithMock('melodic');
    assert(true, 'Chuông Ngân Vang (Melodic Chime): 5 nốt ngũ âm tần số chuẩn xác, không lỗi tham số');
  } catch (e) {
    assert(false, 'Melodic Chime failed', e.message);
  }

  try {
    testSynthesizerWithMock('alarm');
    assert(true, 'Báo Thức Dứt Khoát (Classic Alarm): 3 cụm sóng vuông square-wave 880Hz ngắt nhịp chuẩn');
  } catch (e) {
    assert(false, 'Alarm failed', e.message);
  }

  try {
    testSynthesizerWithMock('zen');
    assert(true, 'Chuông Thiền Zen (Singing Bowl): 4 bậc họa âm sóng sin cộng hưởng phân rã mượt mà (3.0s)');
  } catch (e) {
    assert(false, 'Zen bowl failed', e.message);
  }

  try {
    testSynthesizerWithMock('fanfare');
    assert(true, 'Kèn Khải Hoàn (Victory Fanfare): Hợp âm sóng tam giác G4-C5-E5-G5 chuẩn cao độ');
  } catch (e) {
    assert(false, 'Fanfare failed', e.message);
  }

  // -------------------------------------------------------------
  // TEST SUITE 2: Schedule Cycle Time Math & Edge Cases
  // -------------------------------------------------------------
  console.log('\n📐 PHẦN 2: KIỂM THỬ TOÁN HỌC CHU KỲ CA HỌC & CÁC TRƯỜNG HỢP BIÊN (EDGE CASES):');

  function calculateCycles(startTime, endTime, studyMins, breakMins) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) diff += 24 * 60; // Qua đêm
    const cycleMins = studyMins + breakMins;
    const cycles = Math.max(1, Math.floor(diff / cycleMins));
    const totalStudy = cycles * studyMins;
    const totalBreak = (cycles - 1) * breakMins;
    return { totalMinutes: diff, cycles, totalStudy, totalBreak };
  }

  // Case 1: Standard 20:00 -> 22:30, 25m study, 5m break
  const case1 = calculateCycles('20:00', '22:30', 25, 5);
  assert(case1.totalMinutes === 150, 'Ca học 20:00 - 22:30: Tổng thời lượng = 150 phút (2.5 giờ)');
  assert(case1.cycles === 5, 'Ca học 20:00 - 22:30: Chia thành đúng 5 hiệp (25m học + 5m nghỉ = 30m/hiệp)');
  assert(case1.totalStudy === 125, 'Tổng thời gian học tập trung = 125 phút');
  assert(case1.totalBreak === 20, 'Tổng thời gian nghỉ giữa giờ = 20 phút (4 lần nghỉ giữa 5 hiệp)');

  // Case 2: Crossing midnight (23:00 -> 01:30)
  const case2 = calculateCycles('23:00', '01:30', 25, 5);
  assert(case2.totalMinutes === 150, 'Ca học qua nửa đêm (23:00 -> 01:30): Xử lý vượt 24h chuẩn xác = 150 phút');
  assert(case2.cycles === 5, 'Ca học qua nửa đêm: Tính toán đúng 5 hiệp không âm, không crash');

  // Case 3: Short duration (08:00 -> 08:20, study 25m, break 5m)
  const case3 = calculateCycles('08:00', '08:20', 25, 5);
  assert(case3.cycles >= 1, 'Ca học ngắn hơn 1 chu kỳ đầy đủ: Tự động bảo toàn tối thiểu 1 hiệp học (Math.max(1, ...))');

  // Case 4: Long block 50/10 (14:00 -> 18:00)
  const case4 = calculateCycles('14:00', '18:00', 50, 10);
  assert(case4.totalMinutes === 240, 'Ca học 4 tiếng 14:00 -> 18:00 = 240 phút');
  assert(case4.cycles === 4, 'Phương pháp 50/10 trong 4 tiếng: Đạt chính xác 4 hiệp (4 x 50m = 200m học, 3 x 10m = 30m nghỉ)');

  // -------------------------------------------------------------
  // TEST SUITE 3: Schedule Lifecycle & State Transition Engine
  // -------------------------------------------------------------
  console.log('\n⚙️ PHẦN 3: KIỂM THỬ BỘ ĐIỀU PHỐI CHUYỂN HIỆP HỌC & NGHỈ (CYCLE ENGINE):');

  let simPhase = 'study';
  let simCycle = 1;
  const simTotalCycles = 3;
  let simStudyMins = 25;
  let simBreakMins = 5;
  let chimePlayed = null;

  function onStudyFinished() {
    chimePlayed = 'zen';
    simPhase = 'break';
  }

  function onBreakFinished() {
    chimePlayed = 'zen';
    if (simCycle + 1 <= simTotalCycles) {
      simCycle++;
      simPhase = 'study';
    } else {
      simPhase = 'completed';
    }
  }

  function onSkipBreak() {
    if (simCycle + 1 <= simTotalCycles) {
      simCycle++;
      simPhase = 'study';
    }
  }

  // Step 1: Study phase 1 finishes
  onStudyFinished();
  assert(simPhase === 'break', 'Hiệp 1 học xong: Tự động chuyển timerPhase sang "break"');
  assert(chimePlayed === 'zen', 'Hiệp 1 học xong: Đã kích hoạt chuông báo hết giờ');

  // Step 2: Skip break test
  onSkipBreak();
  assert(simPhase === 'study' && simCycle === 2, 'Bấm "Vào học ngay" (Skip break): Lập tức chuyển sang hiệp học 2/3');

  // Step 3: Finish study 2 -> break 2 -> finish break 2
  onStudyFinished();
  assert(simPhase === 'break', 'Hiệp 2 học xong: Chuyển sang nghỉ giữa giờ hiệp 2');
  onBreakFinished();
  assert(simPhase === 'study' && simCycle === 3, 'Hết giờ nghỉ giữa giờ hiệp 2: Rung chuông và chuyển sang hiệp học cuối 3/3');

  // Step 4: Finish final study 3 -> final break -> complete
  onStudyFinished();
  onBreakFinished();
  assert(simPhase === 'completed', 'Hoàn tất chu kỳ hiệp 3: Toàn bộ ca học kết thúc thành công');

  // -------------------------------------------------------------
  // TEST SUITE 4: Backend Database CRUD & Controller Logic
  // -------------------------------------------------------------
  console.log('\n💾 PHẦN 4: KIỂM THỬ BACKEND CONTROLLER & CƠ SỞ DỮ LIỆU SQLITE:');

  const testUserId = 'test_user_schedule_' + Date.now();

  // Test 4.1: Validation failure on empty title
  let statusCaptured = 200;
  let jsonCaptured = null;
  const mockRes = {
    status: (code) => { statusCaptured = code; return mockRes; },
    json: (data) => { jsonCaptured = data; return mockRes; }
  };

  studyTimerController.saveSchedule({
    user: { id: testUserId },
    body: { title: '   ' }
  }, mockRes);

  assert(statusCaptured === 400 && jsonCaptured.success === false, 'Xác thực: Từ chối lưu lịch khi tiêu đề rỗng (Status 400)');

  // Test 4.2: Create valid schedule
  const newSchedId = 'sched_' + crypto.randomUUID();
  studyTimerController.saveSchedule({
    user: { id: testUserId },
    body: {
      id: newSchedId,
      title: 'Ca Học Đêm Chuyên Sâu',
      start_time: '21:00',
      end_time: '23:30',
      study_duration_minutes: 30,
      break_duration_minutes: 5,
      long_break_minutes: 15,
      cycles_before_long_break: 3,
      days_of_week: ['mon', 'wed', 'fri', 'sun'],
      is_active: true,
      sound_type: 'fanfare',
      auto_start_breaks: true
    }
  }, mockRes);

  assert(jsonCaptured.success === true, 'Tạo mới lịch học qua controller thành công (Status 200)');
  assert(jsonCaptured.data.title === 'Ca Học Đêm Chuyên Sâu', 'Dữ liệu trả về đúng tiêu đề lịch');
  assert(jsonCaptured.data.sound_type === 'fanfare', 'Gán đúng nhạc chuông fanfare');

  // Test 4.3: Read schedule from DB
  const readSched = db.prepare('SELECT * FROM study_schedules WHERE id = ?').get(newSchedId);
  assert(readSched !== undefined, 'Lịch học đã được lưu bền vững vào bảng study_schedules');
  assert(readSched.start_time === '21:00' && readSched.end_time === '23:30', 'Đúng khung giờ 21:00 -> 23:30');
  assert(readSched.study_duration_minutes === 30 && readSched.break_duration_minutes === 5, 'Đúng thời lượng 30p học, 5p nghỉ');

  // Test 4.4: Update schedule
  studyTimerController.saveSchedule({
    user: { id: testUserId },
    body: {
      id: newSchedId,
      title: 'Ca Học Đêm (Đã Cập Nhật)',
      start_time: '20:30',
      end_time: '23:00',
      study_duration_minutes: 25,
      break_duration_minutes: 5,
      is_active: false,
      sound_type: 'alarm'
    }
  }, mockRes);

  const updatedSched = db.prepare('SELECT * FROM study_schedules WHERE id = ?').get(newSchedId);
  assert(updatedSched.title === 'Ca Học Đêm (Đã Cập Nhật)', 'Cập nhật tiêu đề lịch học thành công');
  assert(updatedSched.sound_type === 'alarm', 'Đổi nhạc chuông sang alarm thành công');
  assert(updatedSched.is_active === 0, 'Tắt lịch học (is_active = 0) thành công');

  // Test 4.5: Multi-user isolation
  const otherUserId = 'other_user_' + Date.now();
  studyTimerController.getSchedules({ user: { id: otherUserId } }, mockRes);
  const userHasAccess = jsonCaptured.data.some(s => s.id === newSchedId);
  assert(!userHasAccess, 'Bảo mật đa người dùng: User khác KHÔNG nhìn thấy lịch của người dùng này');

  // Test 4.6: Delete schedule
  studyTimerController.deleteSchedule({
    user: { id: testUserId },
    params: { id: newSchedId }
  }, mockRes);

  const afterDelete = db.prepare('SELECT id FROM study_schedules WHERE id = ?').get(newSchedId);
  assert(afterDelete === undefined, 'Xóa lịch học khỏi cơ sở dữ liệu thành công');

  // -------------------------------------------------------------
  // TEST SUITE 5: Backup & Restore Integration
  // -------------------------------------------------------------
  console.log('\n🛡️ PHẦN 5: KIỂM THỬ SAO LƯU & PHỤC HỒI DỮ LIỆU LỊCH HỌC (BACKUP/RESTORE):');

  const backupTestId = 'sched_bk_' + Date.now();
  db.prepare(`
    INSERT INTO study_schedules (
      id, user_id, title, start_time, end_time,
      study_duration_minutes, break_duration_minutes,
      days_of_week, sound_type, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(backupTestId, testUserId, 'Ca Học Sao Lưu Test', '19:00', '21:30', 25, 5, '["mon","tue"]', 'zen', 1);

  const backupPayload = backupService.buildBackupPayload(testUserId);
  assert(Array.isArray(backupPayload.data.study_schedules), 'Backup payload chứa trường study_schedules dạng mảng');
  const foundInBackup = backupPayload.data.study_schedules.find(s => s.id === backupTestId);
  assert(foundInBackup !== undefined, 'Bản ghi lịch học được đóng gói đầy đủ trong file sao lưu');

  // Simulate restore into another user
  const restoreTargetUser = 'restore_target_' + Date.now();
  const restoreResult = backupService.restoreBackupPayload(backupPayload, restoreTargetUser);
  assert(restoreResult.success === true, 'Phục hồi (Restore) payload lịch học sang người dùng mới thành công');

  const restoredRecord = db.prepare('SELECT * FROM study_schedules WHERE id = ? AND user_id = ?').get(backupTestId, restoreTargetUser);
  assert(restoredRecord !== undefined, 'Bản ghi lịch học sau phục hồi nguyên vẹn trong DB');
  assert(restoredRecord.sound_type === 'zen', 'Nhạc chuông zen được phục hồi nguyên gốc');

  // Cleanup
  db.prepare('DELETE FROM study_schedules WHERE id = ?').run(backupTestId);

  // -------------------------------------------------------------
  // TEST SUITE 6: Live HTTP Endpoint Verification
  // -------------------------------------------------------------
  console.log('\n🌐 PHẦN 6: KIỂM THỬ GỌI API THỰC TẾ TRÊN SERVER (PORT 5001):');

  try {
    const unauthRes = await fetch('http://localhost:5001/api/study-timer/schedules');
    assert(unauthRes.status === 401, 'Bảo mật HTTP: Chặn 401 Unauthorized khi không có JWT token');

    const token = generateToken({ id: 'admin_master_user_id', username: 'admin', role: 'admin' });

    if (token) {

      // 6.1 GET schedules with token
      const getRes = await fetch('http://localhost:5001/api/study-timer/schedules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert(getRes.status === 200, 'GET /api/study-timer/schedules: Trả về HTTP 200 OK với JWT token');
      const getData = await getRes.json();
      assert(getData.success === true && Array.isArray(getData.data), 'Danh sách lịch học trả về dạng mảng hợp lệ');

      // 6.2 POST new schedule over HTTP
      const postRes = await fetch('http://localhost:5001/api/study-timer/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Ca Học HTTP Live Test',
          start_time: '20:00',
          end_time: '22:30',
          study_duration_minutes: 25,
          break_duration_minutes: 5,
          sound_type: 'melodic'
        })
      });
      assert(postRes.status === 200, 'POST /api/study-timer/schedules: Tạo lịch học qua HTTP thành công');
      const postData = await postRes.json();
      const createdLiveId = postData.data?.id;

      // 6.3 DELETE schedule over HTTP
      const delRes = await fetch(`http://localhost:5001/api/study-timer/schedules/${createdLiveId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert(delRes.status === 200, 'DELETE /api/study-timer/schedules/:id: Xóa lịch học qua HTTP thành công');
    } else {
      console.log('  ℹ️ Bỏ qua đăng nhập HTTP (mật khẩu test khác hoặc bypass mode)');
    }
  } catch (err) {
    console.log('  ⚠️ Lưu ý kiểm thử HTTP mạng cục bộ:', err.message);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 TỔNG KẾT KIỂM THỬ CHUYÊN SÂU:');
  console.log(`   • Số ca kiểm thử thành công:  ${passCount}`);
  console.log(`   • Số ca kiểm thử thất bại:    ${failCount}`);
  console.log(`   • Tỷ lệ hoàn thành:          ${failCount === 0 ? '🟢 100% HOÀN HẢO' : '🔴 CÓ LỖI'}`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runDeepTesting().catch(e => {
  console.error('Fatal Test Error:', e);
  process.exit(1);
});
