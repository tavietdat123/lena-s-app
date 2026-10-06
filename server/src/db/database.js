import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword } from '../services/authService.js';
import { config, ADMIN_USER_ID } from '../config.js';
import { MASTER_PATTERN_CATEGORIES, MASTER_PATTERNS } from './masterPatternData.js';
import { seedVSLData } from './vslSeedData.js';

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
      native_language TEXT DEFAULT 'en',
      target_language TEXT DEFAULT 'en',
      target_language_locked INTEGER DEFAULT 0,
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

  // 14. Supervisor Accountability Nudges & Messages Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS supervisor_feedbacks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'admin_master_user_id',
      supervisor_name TEXT DEFAULT 'Người Giám Sát',
      type TEXT DEFAULT 'cheer',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_supervisor_feedbacks_user ON supervisor_feedbacks(user_id, created_at);
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

  // Migration: Ensure users table has native_language and target_language columns
  try {
    db.exec(`ALTER TABLE users ADD COLUMN native_language TEXT DEFAULT 'vi';`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN target_language TEXT DEFAULT 'en';`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN target_language_locked INTEGER DEFAULT 0;`);
  } catch (e) {}
  try {
    db.exec(`UPDATE users SET native_language = 'vi' WHERE native_language IS NULL;`);
    db.exec(`UPDATE users SET target_language = 'en' WHERE target_language IS NULL;`);
  } catch (e) {}

  // Migration: Target language isolation & VSL curriculum support
  try {
    db.exec(`ALTER TABLE words ADD COLUMN target_language TEXT DEFAULT 'en';`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE words ADD COLUMN tone TEXT;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE words ADD COLUMN sino_vietnamese TEXT;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE words ADD COLUMN vsl_level TEXT;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE patterns ADD COLUMN target_language TEXT DEFAULT 'en';`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE topics ADD COLUMN target_language TEXT DEFAULT 'all';`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE user_settings ADD COLUMN target_language TEXT DEFAULT 'en';`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE notes ADD COLUMN target_language TEXT DEFAULT 'en';`);
  } catch (e) {}

  migrateStudyLogsUniqueness();

  // Performance Indexes for Multi-Tenant Querying & Language Isolation
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);
      CREATE INDEX IF NOT EXISTS idx_words_user_lang ON words(user_id, target_language);
      CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns(user_id);
      CREATE INDEX IF NOT EXISTS idx_patterns_user_lang ON patterns(user_id, target_language);
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_user_lang ON notes(user_id, target_language);
      CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_quiz_history_user ON quiz_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_speaking_history_user ON speaking_history(user_id);
    `);
  } catch (e) {}

  // Pre-populate & Auto-sync Default Broad Curated Topics (Toàn diện đời sống & giao tiếp, không lệch IT)
  const defaultTopics = [
    { id: 'daily', name: 'Đời sống & Giao tiếp', emoji: '☕', color: '#10b981', description: 'Giao tiếp sinh hoạt hàng ngày, thói quen và đời sống thường nhật', target_language: 'all' },
    { id: 'social', name: 'Gia đình & Mối quan hệ', emoji: '🤝', color: '#a855f7', description: 'Gia đình, bạn bè, quan hệ xã hội, giao tiếp và cảm xúc', target_language: 'all' },
    { id: 'food', name: 'Ẩm thực & Nhà hàng', emoji: '🍽️', color: '#f43f5e', description: 'Món ăn, đồ uống, ăn uống tại quán và văn hóa ẩm thực', target_language: 'all' },
    { id: 'travel', name: 'Du lịch & Văn hóa', emoji: '✈️', color: '#f59e0b', description: 'Đi lại, khách sạn, tham quan, văn hóa và khám phá thế giới', target_language: 'all' },
    { id: 'work', name: 'Công việc & Sự nghiệp', emoji: '💼', color: '#0284c7', description: 'Môi trường công sở, phỏng vấn, dự án và phát triển sự nghiệp', target_language: 'all' },
    { id: 'education', name: 'Giáo dục & Học vấn', emoji: '📚', color: '#6366f1', description: 'Trường học, phương pháp học tập, nghiên cứu và kỹ năng', target_language: 'all' },
    { id: 'health', name: 'Sức khỏe & Thể chất', emoji: '🩺', color: '#ef4444', description: 'Y tế, dinh dưỡng, thể lực, lối sống lành mạnh và tinh thần', target_language: 'all' },
    { id: 'art', name: 'Nghệ thuật & Giải trí', emoji: '🎨', color: '#d946ef', description: 'Hội họa, âm nhạc, phim ảnh, sở thích và giải trí', target_language: 'all' },
    { id: 'sports', name: 'Thể thao & Vận động', emoji: '⚽', color: '#14b8a6', description: 'Các môn thể thao, thi đấu, luyện tập và rèn luyện thể chất', target_language: 'all' },
    { id: 'shopping', name: 'Mua sắm & Dịch vụ', emoji: '🛍️', color: '#06b6d4', description: 'Đi chợ, trung tâm thương mại, mua sắm và dịch vụ đời sống', target_language: 'all' },
    { id: 'business', name: 'Kinh doanh & Thương mại', emoji: '🚀', color: '#f97316', description: 'Thương trường, khởi nghiệp, hợp đồng và phát triển kinh doanh', target_language: 'all' },
    { id: 'finance', name: 'Tài chính & Tiền tệ', emoji: '💰', color: '#10b981', description: 'Ngân hàng, đầu tư, quản lý tiền bạc và chi tiêu cá nhân', target_language: 'all' },
    { id: 'nature', name: 'Thiên nhiên & Môi trường', emoji: '🌱', color: '#22c55e', description: 'Khí hậu, động thực vật, sinh thái và bảo vệ môi trường', target_language: 'all' },
    { id: 'science', name: 'Khoa học & Khám phá', emoji: '🔬', color: '#3b82f6', description: 'Vũ trụ, vật lý, sinh học và các phát minh khoa học đời sống', target_language: 'all' },
    { id: 'tech', name: 'Công nghệ & Đời sống Số', emoji: '💻', color: '#8b5cf6', description: 'Thiết bị điện tử, Internet, ứng dụng số và công nghệ hiện đại', target_language: 'all' },
    { id: 'mindset', name: 'Tâm lý & Cảm xúc', emoji: '🧠', color: '#06b6d4', description: 'Tư duy tích cực, phát triển bản thân và thấu hiểu cảm xúc', target_language: 'all' },
    { id: 'society', name: 'Xã hội & Cộng đồng', emoji: '🏛️', color: '#64748b', description: 'Đời sống cộng đồng, văn hóa xã hội và tin tức thời sự', target_language: 'all' },
    { id: 'ielts', name: 'Học thuật & Tranh biện', emoji: '🎓', color: '#ec4899', description: 'Từ vựng học thuật, viết luận, tranh biện và thuyết trình', target_language: 'en' }
  ];

  try {
    // Clean up obsolete niche IT topics and reassign words to tech / work
    db.prepare(`
      UPDATE words SET topic_id = 'tech' WHERE topic_id IN (
        'ai', 'cybersecurity', 'devops', 'data', 'software_eng', 'web_dev',
        'mobile_dev', 'blockchain', 'iot', 'networking', 'database_systems',
        'system_architecture', 'backend_dev', 'game_dev', 'embedded_firmware'
      )
    `).run();
    db.prepare(`
      UPDATE words SET topic_id = 'work' WHERE topic_id IN (
        'product_mgmt', 'qa_testing', 'b1_workplace', 'b2_business_negotiation'
      )
    `).run();
    db.prepare(`UPDATE words SET topic_id = 'daily' WHERE topic_id = 'b1_daily_life'`).run();
    db.prepare(`UPDATE words SET topic_id = 'social' WHERE topic_id = 'b1_personal_relations'`).run();
    db.prepare(`UPDATE words SET topic_id = 'shopping' WHERE topic_id = 'b1_shopping_services'`).run();
    db.prepare(`UPDATE words SET topic_id = 'travel' WHERE topic_id = 'b1_travel_leisure'`).run();
    db.prepare(`UPDATE words SET topic_id = 'ielts' WHERE topic_id IN ('b2_debate_persuasion', 'b2_academic_writing')`).run();
    db.prepare(`UPDATE words SET topic_id = 'society' WHERE topic_id IN ('b2_global_issues', 'b2_media_tech_ethics')`).run();
    db.prepare(`UPDATE words SET topic_id = 'nature' WHERE topic_id = 'environment'`).run();
    db.prepare(`UPDATE words SET topic_id = 'business' WHERE topic_id IN ('marketing', 'legal')`).run();

    db.prepare(`
      DELETE FROM topics WHERE id IN (
        'ai', 'cybersecurity', 'devops', 'data', 'software_eng', 'web_dev',
        'mobile_dev', 'blockchain', 'iot', 'product_mgmt', 'qa_testing',
        'networking', 'database_systems', 'system_architecture', 'backend_dev',
        'game_dev', 'embedded_firmware', 'b1_workplace', 'b1_daily_life',
        'b1_travel_leisure', 'b1_personal_relations', 'b1_shopping_services',
        'b2_debate_persuasion', 'b2_global_issues', 'b2_media_tech_ethics',
        'b2_academic_writing', 'b2_business_negotiation', 'environment', 'marketing', 'legal'
      )
    `).run();
  } catch (e) {}

  const now = new Date().toISOString();
  const upsertTopic = db.prepare(`
    INSERT INTO topics (id, name, emoji, color, description, target_language, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      emoji = excluded.emoji,
      color = excluded.color,
      description = excluded.description,
      target_language = excluded.target_language,
      updated_at = excluded.updated_at
  `);

  for (const t of defaultTopics) {
    upsertTopic.run(t.id, t.name, t.emoji, t.color, t.description, t.target_language || 'all', now, now);
  }

  // Pre-populate & Auto-sync Standard Sentence Pattern Categories (Chức năng câu / Diễn đạt)
  ensureDefaultPatternCategories(db);

  // Pre-populate Default Master Admin User if users table is empty
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!usersCount || usersCount.count === 0) {
    const now = new Date().toISOString();

    // Default Master Admin User (username `admin`, password from ADMIN_DEFAULT_PASSWORD)
    const { hash, salt } = hashPassword(config.adminDefaultPassword);
    const adminId = ADMIN_USER_ID;
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, salt, full_name, avatar_url, role, native_language, target_language, created_at, updated_at)
      VALUES (?, 'admin', 'admin@linguavault.local', ?, ?, 'Lingua Master', '👑', 'admin', 'en', 'en', ?, ?)
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

  // Auto-seed VSL Vietnamese curriculum & reader articles if missing
  try {
    seedVSLData();
  } catch (e) {
    console.warn('VSL auto-seed check:', e.message);
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

