import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword } from '../services/authService.js';
import { config, ADMIN_USER_ID } from '../config.js';
import { MASTER_PATTERN_CATEGORIES, MASTER_PATTERNS } from './masterPatternData.js';

const DB_PATH = config.dbPath;
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
export const getDb = () => db;

/**
 * study_logs was created with `date TEXT UNIQUE`, which is a single-tenant
 * assumption: the second account to review on a given day hits a UNIQUE
 * violation. Rebuild the table with UNIQUE(user_id, date) instead.
 *
 * SQLite cannot drop a column constraint in place, so this copies through a
 * new table. It is skipped once the new shape is in place.
 */
function migrateStudyLogsUniqueness() {
  const ddl = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'study_logs'")
    .get();
  if (!ddl || !ddl.sql) return;
  if (/UNIQUE\s*\(\s*user_id\s*,\s*date\s*\)/i.test(ddl.sql)) return;

  console.log('🔧 Migrating study_logs to UNIQUE(user_id, date)...');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`
      CREATE TABLE study_logs_migrated (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        user_id TEXT NOT NULL DEFAULT '${ADMIN_USER_ID}',
        reviews_count INTEGER DEFAULT 0,
        new_words_count INTEGER DEFAULT 0,
        duration_seconds INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        UNIQUE (user_id, date)
      );
    `);
    db.exec(`
      INSERT INTO study_logs_migrated (id, date, user_id, reviews_count, new_words_count, duration_seconds, created_at)
      SELECT id, date, COALESCE(user_id, '${ADMIN_USER_ID}'), reviews_count, new_words_count, duration_seconds, created_at
      FROM study_logs;
    `);
    db.exec('DROP TABLE study_logs;');
    db.exec('ALTER TABLE study_logs_migrated RENAME TO study_logs;');
    db.exec('CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, date);');
    db.exec('COMMIT');
    console.log('✅ study_logs migrated');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('❌ study_logs migration failed, leaving the original table in place:', err.message);
  }
}

export function initializeDatabase() {
  // 1. Words Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      phonetic TEXT,
      audio_url TEXT,
      part_of_speech TEXT,
      meaning_vi TEXT NOT NULL,
      meaning_en TEXT,
      collocations TEXT DEFAULT '[]',
      examples TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      level TEXT DEFAULT 'B1',
      repetition INTEGER DEFAULT 0,
      interval INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      due_date TEXT,
      status TEXT DEFAULT 'new',
      last_reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Sentence Patterns Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      formula TEXT NOT NULL,
      explanation TEXT,
      meaning_vi TEXT NOT NULL,
      category TEXT DEFAULT 'emphasis',
      tone TEXT DEFAULT 'Neutral',
      examples TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      repetition INTEGER DEFAULT 0,
      interval INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      due_date TEXT,
      status TEXT DEFAULT 'new',
      last_reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2b. Sentence Pattern Communicative Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pattern_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '🧩',
      color TEXT DEFAULT '#8b5cf6',
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 3. Notes & Reading Materials Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      topic TEXT DEFAULT 'General',
      tags TEXT DEFAULT '[]',
      linked_words TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 4. Study Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_logs (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      reviews_count INTEGER DEFAULT 0,
      new_words_count INTEGER DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 5. Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 6. User Gamification Profile Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      total_xp INTEGER DEFAULT 0,
      current_level INTEGER DEFAULT 1,
      title TEXT DEFAULT 'Novice Scholar 🌱',
      streak_record INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  // 7. Topics / Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '📁',
      color TEXT DEFAULT '#0284c7',
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 8. Quiz History & Saved AI Quizzes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_history (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'vocab',
      is_ai INTEGER DEFAULT 1,
      topic TEXT DEFAULT 'All',
      category TEXT DEFAULT 'all',
      level TEXT DEFAULT 'all',
      mode TEXT DEFAULT 'mixed',
      questions TEXT NOT NULL,
      total_questions INTEGER DEFAULT 5,
      best_score INTEGER,
      attempts_count INTEGER DEFAULT 0,
      last_attempt_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 9. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT DEFAULT '🧑‍🎓',
      role TEXT DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 10. AI Speaking History & Submissions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS speaking_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'admin_master_user_id',
      type TEXT DEFAULT 'read_aloud',
      prompt_title TEXT,
      target_text TEXT,
      spoken_text TEXT,
      score INTEGER,
      feedback_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);

  // 11. Per-User Settings Table (API Keys, Telegram, Daily Goals)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      gemini_model TEXT DEFAULT 'gemini-3.6-flash',
      gemini_api_key TEXT DEFAULT '',
      daily_goal INTEGER DEFAULT 10,
      alarm_time TEXT DEFAULT '08:00',
      telegram_bot_token TEXT DEFAULT '',
      telegram_chat_id TEXT DEFAULT '',
      telegram_enabled INTEGER DEFAULT 0,
      telegram_due_reminder INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );
  `);

  // 12. Active Study Timer Sessions Table (Stopwatch & Pomodoro Tracker)
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'admin_master_user_id',
      activity_type TEXT DEFAULT 'general',
      activity_title TEXT,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      mode TEXT DEFAULT 'stopwatch',
      target_seconds INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, started_at);
  `);

  // 13. Long-term Study Schedules Table (Khung giờ học dài hạn & Thời gian nghỉ giữa giờ)
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_schedules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'admin_master_user_id',
      title TEXT NOT NULL,
      start_time TEXT NOT NULL DEFAULT '20:00',
      end_time TEXT NOT NULL DEFAULT '22:30',
      study_duration_minutes INTEGER NOT NULL DEFAULT 25,
      break_duration_minutes INTEGER NOT NULL DEFAULT 5,
      long_break_minutes INTEGER NOT NULL DEFAULT 15,
      cycles_before_long_break INTEGER NOT NULL DEFAULT 4,
      days_of_week TEXT DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]',
      is_active INTEGER DEFAULT 1,
      sound_type TEXT DEFAULT 'melodic',
      activity_type TEXT DEFAULT 'general',
      auto_start_breaks INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_study_schedules_user ON study_schedules(user_id);
  `);

  // Migration: Ensure study_schedules has activity_type
  try {
    db.exec(`ALTER TABLE study_schedules ADD COLUMN activity_type TEXT DEFAULT 'general';`);
  } catch (e) {}

  // Migration: Ensure words table has topic_id & user_id column
  try {
    db.exec(`ALTER TABLE words ADD COLUMN topic_id TEXT DEFAULT 'daily';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE words ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE patterns ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE notes ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE study_logs ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE quiz_history ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  // Migration: Ensure user_profile table has user_id column
  try {
    db.exec(`ALTER TABLE user_profile ADD COLUMN user_id TEXT;`);
  } catch (e) {}

  migrateStudyLogsUniqueness();

  // Performance Indexes for Multi-Tenant Querying
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);
      CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_quiz_history_user ON quiz_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_speaking_history_user ON speaking_history(user_id);
    `);
  } catch (e) {}

  // Pre-populate & Auto-sync Default Curated Topics
  const defaultTopics = [
    // --- MẢNG CÔNG NGHỆ CHUYÊN SÂU (TECH DOMAINS) ---
    { id: 'ai', name: 'Trí tuệ Nhân tạo (AI & ML)', emoji: '🤖', color: '#6366f1', description: 'Mô hình ngôn ngữ lớn (LLM), deep learning, mạng nơ-ron, prompt engineering và thị giác máy tính' },
    { id: 'cybersecurity', name: 'An ninh Mạng & Bảo mật', emoji: '🛡️', color: '#dc2626', description: 'Mật mã học, lỗ hổng bảo mật, tường lửa, pentest, zero trust và phòng chống tấn công mạng' },
    { id: 'devops', name: 'Cloud & DevOps', emoji: '☁️', color: '#0284c7', description: 'AWS, Azure, Docker, Kubernetes, CI/CD pipeline, hạ tầng dạng mã (IaC) và vi dịch vụ' },
    { id: 'data', name: 'Dữ liệu Lớn & Phân tích', emoji: '📊', color: '#0d9488', description: 'Kho dữ liệu (Data warehouse), ETL pipeline, SQL, phân tích thống kê và trực quan hóa dữ liệu' },
    { id: 'software_eng', name: 'Kỹ nghệ Phần mềm & Kiến trúc', emoji: '⚙️', color: '#7c3aed', description: 'Thiết kế hướng đối tượng (OOP), design patterns, refactoring, Clean Architecture và tối ưu thuật toán' },
    { id: 'web_dev', name: 'Lập trình Web & Frontend', emoji: '🌐', color: '#ea580c', description: 'React, Vue, TypeScript, Next.js, API RESTful/GraphQL, Responsive Design và tối ưu hiệu năng web' },
    { id: 'mobile_dev', name: 'Lập trình Ứng dụng Di động', emoji: '📱', color: '#16a34a', description: 'React Native, Flutter, iOS Swift, Android Kotlin, App Store submission và trải nghiệm cảm ứng' },
    { id: 'blockchain', name: 'Blockchain & Web3', emoji: '⛓️', color: '#d97706', description: 'Hợp đồng thông minh (Smart contracts), tài chính phi tập trung (DeFi), Ethereum và cơ chế đồng thuận' },
    { id: 'iot', name: 'IoT & Hệ thống Nhúng', emoji: '📡', color: '#0891b2', description: 'Cảm biến, vi điều khiển, tự động hóa, giao thức MQTT và phần cứng kết nối mạng' },
    { id: 'product_mgmt', name: 'Quản lý Sản phẩm & Agile', emoji: '🧭', color: '#be185d', description: 'Scrum, Sprint, Kanban, User Stories, Product Roadmap, KPI/OKR và MVP' },
    { id: 'qa_testing', name: 'Kiểm thử & QA Software', emoji: '🧪', color: '#059669', description: 'Unit test, integration test, automated testing (Selenium/Cypress), regression test và quản lý lỗi bug' },
    { id: 'networking', name: 'Mạng Máy tính & Hạ tầng', emoji: '🖧', color: '#4f46e5', description: 'TCP/IP, DNS, định tuyến (Routing), băng thông (Bandwidth), độ trễ (Latency) và cân bằng tải' },

    { id: 'database_systems', name: 'Cơ sở Dữ liệu & Tối ưu SQL', emoji: '🗄️', color: '#0284c7', description: 'PostgreSQL, MySQL, NoSQL, MongoDB, Redis, lập chỉ mục (Indexing), truy vấn và tối ưu hóa DB' },
    { id: 'system_architecture', name: 'Hệ thống Phân tán & Vi dịch vụ', emoji: '🏗️', color: '#4f46e5', description: 'Kafka, RabbitMQ, Event-driven architecture, CAP theorem, sharding, replication và fault-tolerance' },
    { id: 'backend_dev', name: 'Lập trình Backend & API', emoji: '💻', color: '#16a34a', description: 'Node.js, Go, Python, Java Spring, RESTful API, gRPC, JWT Authentication và bộ nhớ đệm Cache' },
    { id: 'game_dev', name: 'Đồ họa & Lập trình Game', emoji: '🎮', color: '#d946ef', description: 'Unity, Unreal Engine, Rendering pipeline, Shader, vật lý game và mô hình không gian 3D' },
    { id: 'embedded_firmware', name: 'Lập trình Nhúng & Vi mạch', emoji: '⚡', color: '#eab308', description: 'C/C++, Assembly, vi điều khiển ARM/RISC-V, RTOS, Driver phần cứng và giao tiếp SPI/I2C' },

    // --- CHỦ ĐỀ CEFR B1 (INTERMEDIATE) ---
    { id: 'b1_workplace', name: 'Giao tiếp Công sở B1', emoji: '💼', color: '#0284c7', description: 'Email công sở, trao đổi với đồng nghiệp, họp định kỳ và lập kế hoạch làm việc (Cấp độ B1)' },
    { id: 'b1_daily_life', name: 'Đời sống & Nhà cửa B1', emoji: '🏠', color: '#10b981', description: 'Thuê nhà, việc nhà, mua sắm hàng ngày, hóa đơn và các tiện ích sinh hoạt (Cấp độ B1)' },
    { id: 'b1_travel_leisure', name: 'Du lịch & Giải trí B1', emoji: '🧳', color: '#f59e0b', description: 'Đặt vé, hỏi đường, phương tiện công cộng, sở thích cuối tuần và giải trí (Cấp độ B1)' },
    { id: 'b1_personal_relations', name: 'Tính cách & Bạn bè B1', emoji: '😊', color: '#ec4899', description: 'Mô tả ngoại hình, tính cách con người, kết bạn và duy trì mối quan hệ (Cấp độ B1)' },
    { id: 'b1_shopping_services', name: 'Dịch vụ & Mua sắm B1', emoji: '🛍️', color: '#06b6d4', description: 'Đi chợ, thanh toán, đổi trả hàng, dịch vụ bảo hành và ăn uống tại quán (Cấp độ B1)' },

    // --- CHỦ ĐỀ CEFR B2 (UPPER-INTERMEDIATE) ---
    { id: 'b2_debate_persuasion', name: 'Tranh biện & Thuyết phục B2', emoji: '🗣️', color: '#8b5cf6', description: 'Lập luận, phản biện, diễn đạt quan điểm cá nhân, thuyết phục và thỏa hiệp (Cấp độ B2)' },
    { id: 'b2_global_issues', name: 'Toàn cầu hóa & Xã hội B2', emoji: '🌍', color: '#3b82f6', description: 'Kinh tế thế giới, biến đổi xã hội, đô thị hóa, di cư và hội nhập văn hóa (Cấp độ B2)' },
    { id: 'b2_media_tech_ethics', name: 'Truyền thông & Đạo đức B2', emoji: '📰', color: '#f97316', description: 'Báo chí, mạng xã hội, tin tức giả, quyền riêng tư và đạo đức công nghệ (Cấp độ B2)' },
    { id: 'b2_academic_writing', name: 'Viết Học thuật & Báo cáo B2', emoji: '📝', color: '#a855f7', description: 'Cấu trúc bài luận, từ nối học thuật, phân tích biểu đồ và viết báo cáo chuyên sâu (Cấp độ B2)' },
    { id: 'b2_business_negotiation', name: 'Đàm phán & Thương thuyết B2', emoji: '🤝', color: '#059669', description: 'Chiến lược thương thảo hợp đồng, giải quyết xung đột lợi ích và quản trị rủi ro (Cấp độ B2)' },

    // --- KINH DOANH, ĐỜI SỐNG & HỌC THUẬT ---
    { id: 'work', name: 'Công việc & Sự nghiệp', emoji: '💼', color: '#0284c7', description: 'Từ vựng đàm phán, phỏng vấn, email công việc và quản lý dự án' },
    { id: 'tech', name: 'Công nghệ & Kỹ thuật', emoji: '💻', color: '#8b5cf6', description: 'Thuật ngữ IT tổng hợp, lập trình, trí tuệ nhân tạo và chuyển đổi số' },
    { id: 'finance', name: 'Tài chính & Đầu tư', emoji: '💰', color: '#10b981', description: 'Thuật ngữ ngân hàng, chứng khoán, đầu tư, ngân sách và phân tích tài chính' },
    { id: 'business', name: 'Kinh doanh & Khởi nghiệp', emoji: '🚀', color: '#f97316', description: 'Thương trường, gọi vốn, mô hình kinh doanh, tiếp thị và tăng trưởng doanh nghiệp' },
    { id: 'marketing', name: 'Marketing & Truyền thông', emoji: '📢', color: '#eab308', description: 'Quảng cáo, xây dựng thương hiệu, sáng tạo nội dung và truyền thông số' },
    { id: 'health', name: 'Sức khỏe & Y tế', emoji: '🩺', color: '#ef4444', description: 'Dinh dưỡng, y học, thể lực, thể chất và lối sống lành mạnh' },
    { id: 'legal', name: 'Pháp lý & Hợp đồng', emoji: '⚖️', color: '#64748b', description: 'Điều khoản hợp đồng, sở hữu trí tuệ, luật pháp và quy định tuân thủ' },
    { id: 'environment', name: 'Môi trường & Sinh thái', emoji: '🌱', color: '#22c55e', description: 'Biến đổi khí hậu, năng lượng tái tạo, bảo tồn sinh thái và lối sống xanh' },
    { id: 'science', name: 'Khoa học & Không gian', emoji: '🔬', color: '#3b82f6', description: 'Vật lý, sinh học, vũ trụ, nghiên cứu học thuật và phát minh khoa học' },
    { id: 'art', name: 'Nghệ thuật & Thiết kế', emoji: '🎨', color: '#d946ef', description: 'Hội họa, kiến trúc, thiết kế đồ họa/UI-UX, nhiếp ảnh và thẩm mỹ' },
    { id: 'food', name: 'Ẩm thực & Nhà hàng', emoji: '🍽️', color: '#f43f5e', description: 'Món ăn, đồ uống, kỹ thuật nấu nướng và văn hóa ẩm thực thế giới' },
    { id: 'education', name: 'Giáo dục & Kỹ năng', emoji: '📚', color: '#6366f1', description: 'Phương pháp học tập, đàm phán, thuyết trình và giải quyết vấn đề' },
    { id: 'sports', name: 'Thể thao & Thể hình', emoji: '⚽', color: '#14b8a6', description: 'Các môn thể thao, thi đấu, luyện tập thể thao và giải đấu quốc tế' },
    { id: 'social', name: 'Mối quan hệ & Xã hội', emoji: '🤝', color: '#a855f7', description: 'Tình bạn, gia đình, giao tiếp xã hội, cảm xúc và ứng xử cộng đồng' },
    { id: 'ielts', name: 'Học thuật & IELTS', emoji: '🎓', color: '#ec4899', description: 'Từ vựng Band 7.0-8.5+, bài luận học thuật và viết thư' },
    { id: 'daily', name: 'Giao tiếp Hàng ngày', emoji: '☕', color: '#10b981', description: 'Từ ngữ đời sống, giao tiếp tự nhiên, quán xá và sinh hoạt' },
    { id: 'travel', name: 'Du lịch & Văn hóa', emoji: '✈️', color: '#f59e0b', description: 'Hàng không, khách sạn, ẩm thực và khám phá thế giới' },
    { id: 'mindset', name: 'Tâm lý & Tư duy', emoji: '🧠', color: '#06b6d4', description: 'Phát triển bản thân, triết học, tư duy phản biện và cảm xúc' }
  ];

  const now = new Date().toISOString();
  const insertTopic = db.prepare(`
    INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of defaultTopics) {
    insertTopic.run(t.id, t.name, t.emoji, t.color, t.description, now, now);
  }

  // Pre-populate & Auto-sync Standard Sentence Pattern Categories (Chức năng câu / Diễn đạt)
  ensureDefaultPatternCategories(db);

  // Auto-sync Golden Master Patterns if patterns table has fewer than 20 patterns
  try {
    const patternsCount = db.prepare('SELECT COUNT(*) as count FROM patterns').get();
    if (!patternsCount || patternsCount.count < 20) {
      ensureMasterPatterns(db, ADMIN_USER_ID);
    }
  } catch (e) {
    console.warn('[Sync Master Patterns Warning]', e.message);
  }

  // Pre-populate Default Master Admin User if users table is empty
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!usersCount || usersCount.count === 0) {
    const now = new Date().toISOString();

    // Default Master Admin User (username `admin`, password from ADMIN_DEFAULT_PASSWORD)
    const { hash, salt } = hashPassword(config.adminDefaultPassword);
    const adminId = ADMIN_USER_ID;
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, salt, full_name, avatar_url, role, created_at, updated_at)
      VALUES (?, 'admin', 'admin@linguavault.local', ?, ?, 'Lingua Master', '👑', 'admin', ?, ?)
    `).run(adminId, hash, salt, now, now);
  }

  // Initialize default user profile if empty
  const profileExists = db.prepare("SELECT id FROM user_profile WHERE id = 'default_user' OR user_id = 'admin_master_user_id'").get();
  if (!profileExists) {
    db.prepare(`
      INSERT INTO user_profile (id, user_id, total_xp, current_level, title, streak_record, updated_at)
      VALUES ('default_user', 'admin_master_user_id', 2150, 5, 'Vault Master 💎', 1, ?)
    `).run(new Date().toISOString());
  }

  // Initialize default user settings for admin if empty
  const settingsExists = db.prepare("SELECT user_id FROM user_settings WHERE user_id = 'admin_master_user_id'").get();
  if (!settingsExists) {
    db.prepare(`
      INSERT INTO user_settings (user_id, gemini_model, daily_goal, alarm_time, telegram_enabled, telegram_due_reminder, updated_at)
      VALUES ('admin_master_user_id', 'gemini-3.6-flash', 10, '08:00', 0, 1, ?)
    `).run(new Date().toISOString());
  }

  console.log('✅ Native SQLite Database initialized at:', DB_PATH);
}

export const defaultPatternCategories = MASTER_PATTERN_CATEGORIES;

export function ensureDefaultPatternCategories(targetDb = db) {
  const now = new Date().toISOString();
  const insertPatternCategory = targetDb.prepare(`
    INSERT INTO pattern_categories (id, name, emoji, color, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      emoji = excluded.emoji,
      color = excluded.color,
      description = excluded.description,
      updated_at = excluded.updated_at
  `);

  for (const cat of defaultPatternCategories) {
    insertPatternCategory.run(cat.id, cat.name, cat.emoji, cat.color, cat.description, now, now);
  }
}

export function ensureMasterPatterns(targetDb = db, userId = ADMIN_USER_ID) {
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  const checkStmt = targetDb.prepare('SELECT id FROM patterns WHERE (name = ? OR id = ?) AND user_id = ?');
  const insertStmt = targetDb.prepare(`
    INSERT INTO patterns (
      id, name, formula, explanation, meaning_vi, category, tone,
      examples, tags, repetition, interval, ease_factor,
      due_date, status, last_reviewed_at, created_at, updated_at, user_id
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, 0, 0, 2.5,
      ?, 'new', null, ?, ?, ?
    )
  `);

  let count = 0;
  for (const p of MASTER_PATTERNS) {
    const existing = checkStmt.get(p.name, p.id, userId);
    if (!existing) {
      insertStmt.run(
        p.id,
        p.name,
        p.formula,
        p.explanation,
        p.meaning_vi,
        p.category,
        p.tone,
        JSON.stringify(p.examples || []),
        JSON.stringify(p.tags || []),
        today,
        now,
        now,
        userId
      );
      count++;
    }
  }
  return count;
}

