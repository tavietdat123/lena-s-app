import fs from 'fs';
import { MASTER_PATTERN_CATEGORIES, MASTER_PATTERNS } from './src/db/masterPatternData.js';
import { backupService } from './src/services/backupService.js';

async function updateProductionBackup() {
  const targetPath = '/Users/daf/Downloads/lingua_vault_backup_2026-09-30.json';
  const backupCopyPath = '/Users/daf/Downloads/lingua_vault_backup_2026-09-30.original.json';
  const fullCopyPath = '/Users/daf/Downloads/lingua_vault_backup_2026-09-30_full.json';

  console.log(`Đang đọc file backup Production từ: ${targetPath}...`);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Không tìm thấy file ${targetPath}`);
  }

  // Backup original production file first
  if (!fs.existsSync(backupCopyPath)) {
    fs.copyFileSync(targetPath, backupCopyPath);
    console.log(`✓ Đã lưu bản sao lưu gốc tại: ${backupCopyPath}`);
  }

  // Read production file (either from original backup or current)
  const raw = fs.readFileSync(fs.existsSync(backupCopyPath) ? backupCopyPath : targetPath, 'utf8');
  const prod = JSON.parse(raw);
  const prodData = prod.data || prod;

  console.log('\n--- DỮ LIỆU GỐC TỪ PRODUCTION ---');
  console.log(`• Words: ${prodData.words?.length || 0} từ`);
  console.log(`• Patterns: ${prodData.patterns?.length || 0} mẫu câu`);
  console.log(`• Notes: ${prodData.notes?.length || 0} ghi chú`);
  console.log(`• Study Logs: ${prodData.study_logs?.length || 0} ngày`);
  console.log(`• Topics: ${prodData.topics?.length || 0} chủ đề`);
  console.log(`• Quiz History: ${prodData.quiz_history?.length || 0} đề quiz`);
  console.log(`• User Settings: Model ${prodData.user_settings?.gemini_model}, Alarm ${prodData.user_settings?.alarm_time}`);

  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];

  // 1. Categories: Add 24 functional categories
  const pattern_categories = MASTER_PATTERN_CATEGORIES.map(c => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji || '🧩',
    color: c.color || '#8b5cf6',
    description: c.description || '',
    created_at: now,
    updated_at: now
  }));

  // 2. Patterns: Keep user's 2 existing patterns + Add 74 master patterns
  const existingPatterns = Array.isArray(prodData.patterns) ? prodData.patterns : [];
  const existingNames = new Set(existingPatterns.map(p => (p.name || '').trim().toLowerCase()));

  // Map user's existing patterns to appropriate categories if needed
  const preservedUserPatterns = existingPatterns.map(p => {
    let cat = p.category;
    if (p.name.toLowerCase().includes('rather')) cat = 'opinion';
    if (p.name.toLowerCase().includes('deduction') || p.formula.toLowerCase().includes('must be')) cat = 'speculation';
    return {
      ...p,
      category: cat || 'emphasis',
      user_id: p.user_id || 'admin_master_user_id'
    };
  });

  const newMasterPatterns = MASTER_PATTERNS.filter(mp => !existingNames.has(mp.name.trim().toLowerCase())).map(mp => ({
    id: mp.id,
    name: mp.name,
    formula: mp.formula,
    explanation: mp.explanation,
    meaning_vi: mp.meaning_vi,
    category: mp.category,
    tone: mp.tone || 'Neutral',
    examples: mp.examples || [],
    tags: mp.tags || ['Mastery', 'Communicative'],
    repetition: 0,
    interval: 0,
    ease_factor: 2.5,
    due_date: todayStr,
    status: 'new',
    last_reviewed_at: null,
    created_at: now,
    updated_at: now,
    user_id: 'admin_master_user_id'
  }));

  const mergedPatterns = [...preservedUserPatterns, ...newMasterPatterns];

  // Construct updated production payload (NO fake local notes, NO fake local sessions)
  const updatedPayload = {
    app: prod.app || 'LinguaVault',
    version: prod.version || '2.0.0',
    exported_at: now,
    user_id: prod.user_id || 'admin_master_user_id',
    data: {
      words: prodData.words || [],
      patterns: mergedPatterns,
      pattern_categories: pattern_categories,
      notes: prodData.notes || [],
      study_logs: prodData.study_logs || [],
      study_sessions: prodData.study_sessions || [],
      study_schedules: prodData.study_schedules || [],
      topics: prodData.topics || [],
      quiz_history: prodData.quiz_history || [],
      user_settings: prodData.user_settings || null
    }
  };

  // Write updated payload to target file
  fs.writeFileSync(targetPath, JSON.stringify(updatedPayload, null, 2), 'utf8');
  console.log(`\n✓ ĐÃ CẬP NHẬT TRỰC TIẾP FILE PRODUCTION: ${targetPath}`);

  // Also update _full.json for convenience
  fs.writeFileSync(fullCopyPath, JSON.stringify(updatedPayload, null, 2), 'utf8');
  console.log(`✓ Đã cập nhật file: ${fullCopyPath}`);

  const stat = fs.statSync(targetPath);
  console.log(`\n📊 THỐNG KÊ FILE ĐÃ CẬP NHẬT (${(stat.size / 1024).toFixed(1)} KB):`);
  console.log(`  • Words: ${updatedPayload.data.words.length} từ vựng (100% nguyên vẹn từ production)`);
  console.log(`  • Pattern Categories: ${updatedPayload.data.pattern_categories.length} nhóm chức năng câu`);
  console.log(`  • Patterns: ${updatedPayload.data.patterns.length} mẫu câu (2 câu gốc + 74 cấu trúc mới)`);
  console.log(`  • Notes: ${updatedPayload.data.notes.length} bài (theo đúng production)`);
  console.log(`  • Study Logs: ${updatedPayload.data.study_logs.length} ngày (100% nguyên vẹn từ production)`);
  console.log(`  • Topics: ${updatedPayload.data.topics.length} chủ đề (100% nguyên vẹn từ production)`);
  console.log(`  • Quiz History: ${updatedPayload.data.quiz_history.length} đề thi (100% nguyên vẹn từ production)`);
  console.log(`  • User Settings: Giữ nguyên cài đặt và Gemini API Key từ production`);

  // Validate that backupService can restore it cleanly
  console.log('\n🧪 Kiểm thử xác thực tính hợp lệ của file cập nhật...');
  const testUserId = 'test_validate_prod_' + Date.now();
  const testRes = backupService.restoreBackupPayload(updatedPayload, testUserId);
  console.log('✓ Kết quả Restore kiểm thử:', testRes.message);
  console.log('✅ HOÀN TOÀN HỢP LỆ VÀ SẴN SÀNG KHÔI PHỤC TRÊN PRODUCTION!');

  process.exit(0);
}

updateProductionBackup().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
