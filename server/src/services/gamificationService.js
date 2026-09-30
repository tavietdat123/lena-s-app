import { getDb } from '../db/database.js';
import { calculateUserStreak } from './streakService.js';

export const LEVEL_LADDER = [
  // 🥉 BRONZE TIER (Cơ Bản & Nhập Môn: A1 - A2)
  { level: 1, minXp: 0, maxXp: 300, title: 'Novice Scholar 🌱', tier: 'Bronze I', perk: 'Khởi đầu hành trình nạp vốn từ vựng cơ bản' },
  { level: 2, minXp: 300, maxXp: 800, title: 'Word Seeker 🔍', tier: 'Bronze II', perk: 'Nhận diện & bóc tách cấu trúc câu cơ bản' },
  { level: 3, minXp: 800, maxXp: 1500, title: 'Lexical Apprentice 🌿', tier: 'Bronze III', perk: 'Mở khóa phân tích sâu Collocations & Ngữ cảnh' },
  { level: 4, minXp: 1500, maxXp: 2500, title: 'Vocab Explorer 📘', tier: 'Bronze IV', perk: 'Kích hoạt thử thách Topic Quiz & Active Recall' },

  // 🥈 SILVER TIER (Chuyên Cần & Mở Rộng: B1 - B2)
  { level: 5, minXp: 2500, maxXp: 4000, title: 'Memory Strategist ⚡', tier: 'Silver I', perk: 'Tối ưu hóa chu kỳ lặp lại ngắt quãng SM-2' },
  { level: 6, minXp: 4000, maxXp: 6000, title: 'Fluent Challenger 🎯', tier: 'Silver II', perk: 'Phản xạ trắc nghiệm tốc độ cao & cấu trúc câu' },
  { level: 7, minXp: 6000, maxXp: 8500, title: 'Articulate Speaker 🎙️', tier: 'Silver III', perk: 'Làm chủ phát âm & ngữ điệu trong AI Speaking Lab' },
  { level: 8, minXp: 8500, maxXp: 11500, title: 'Idiom Navigator 🧭', tier: 'Silver IV', perk: 'Thấu hiểu thành ngữ & cụm động từ tự nhiên' },

  // 🥇 GOLD TIER (Thành Thạo & Chuyên Sâu: C1)
  { level: 9, minXp: 11500, maxXp: 15500, title: 'Vault Master 💎', tier: 'Gold I', perk: 'Làm chủ kho 1000+ từ vựng & cấu trúc nâng cao' },
  { level: 10, minXp: 15500, maxXp: 20500, title: 'Eloquent Orator 👑', tier: 'Gold II', perk: 'Chuyên gia phản xạ đối thoại lưu loát đa chủ đề' },
  { level: 11, minXp: 20500, maxXp: 26500, title: 'Rhetoric Architect 🏛️', tier: 'Gold III', perk: 'Kiến tạo câu văn học thuật & sắc thái nâng cao' },
  { level: 12, minXp: 26500, maxXp: 33500, title: 'Linguistic Sage 🔮', tier: 'Gold IV', perk: 'Cảm thụ tinh tế văn phong & ngữ nghĩa phức hợp' },

  // 💎 DIAMOND & GRANDMASTER TIER (Bậc Thầy & Huyền Thoại: C2+)
  { level: 13, minXp: 33500, maxXp: 42000, title: 'Polyglot Champion ⚔️', tier: 'Diamond I', perk: 'Khả năng ghi nhớ siêu tốc không rào cản' },
  { level: 14, minXp: 42000, maxXp: 52000, title: 'Lexical Titan 🛡️', tier: 'Diamond II', perk: 'Tư duy trực tiếp hoàn toàn bằng tiếng Anh' },
  { level: 15, minXp: 52000, maxXp: 65000, title: 'Supreme Scholar 🌌', tier: 'Diamond III', perk: 'Bậc thầy ngôn ngữ, thấu triệt 100% văn cảnh' },
  { level: 16, minXp: 65000, maxXp: 999999, title: 'Linguistic Grandmaster 🏆', tier: 'Legendary', perk: 'Huyền Thoại Bậc Thầy Ngôn Ngữ Vô Song' }
];

export const calculateLevelFromXp = (xp) => {
  const safeXp = Math.max(0, parseInt(xp, 10) || 0);
  const current = LEVEL_LADDER.find(l => safeXp >= l.minXp && safeXp < l.maxXp) || LEVEL_LADDER[LEVEL_LADDER.length - 1];
  const nextLevel = LEVEL_LADDER.find(l => l.level === current.level + 1) || current;

  const currentLevelMin = current.minXp;
  const currentLevelMax = current.maxXp;
  const xpIntoLevel = Math.max(0, safeXp - currentLevelMin);
  const xpNeededForLevel = Math.max(1, currentLevelMax - currentLevelMin);
  const progressPercent = current.level === 16 ? 100 : Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100));

  return {
    level: current.level,
    title: current.title,
    tier: current.tier,
    perk: current.perk,
    minXp: current.minXp,
    maxXp: current.maxXp,
    xpIntoLevel,
    xpNeededForLevel,
    progressPercent,
    nextLevel: nextLevel.level,
    nextLevelTitle: nextLevel.title
  };
};

export const gamificationService = {
  // 1. Get User Profile with Gamification details for specific account
  getProfile: (userId = 'admin_master_user_id') => {
    const db = getDb();
    let row = db.prepare(`
      SELECT * FROM user_profile 
      WHERE user_id = ? OR id = ? OR (id = 'default_user' AND ? = 'admin_master_user_id')
      ORDER BY CASE WHEN id = ? THEN 1 WHEN user_id = ? THEN 2 ELSE 3 END
      LIMIT 1
    `).get(userId, userId, userId, userId, userId);
    
    if (!row) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO user_profile (id, user_id, total_xp, current_level, title, streak_record, updated_at)
        VALUES (?, ?, 0, 1, 'Novice Scholar 🌱', 1, ?)
      `).run(userId, userId, now);
      row = db.prepare("SELECT * FROM user_profile WHERE user_id = ? OR id = ?").get(userId, userId);
    }

    const levelDetails = calculateLevelFromXp(row.total_xp);

    // Sync title/level if changed
    if (row.current_level !== levelDetails.level || row.title !== levelDetails.title) {
      db.prepare(`
        UPDATE user_profile 
        SET current_level = ?, title = ?, updated_at = ?
        WHERE id = ?
      `).run(levelDetails.level, levelDetails.title, new Date().toISOString(), row.id);
    }

    const streakInfo = calculateUserStreak(db, userId);

    return {
      userId: row.user_id || userId,
      totalXp: row.total_xp,
      total_xp: row.total_xp,
      ...levelDetails,
      streakRecord: streakInfo.maxStreak,
      streak_record: streakInfo.maxStreak,
      currentStreak: streakInfo.currentStreak,
      maxStreak: streakInfo.maxStreak,
      streak: streakInfo.currentStreak,
      activeDaysCount: streakInfo.activeDaysCount,
      hasStudiedToday: streakInfo.hasToday,
      ladder: LEVEL_LADDER
    };
  },

  // 2. Add XP for specific account with reason and check for Level-Up event
  addXp: (arg1 = 'admin_master_user_id', arg2 = 10, arg3 = 'Hoạt động học tập') => {
    let userId = 'admin_master_user_id';
    let amount = 10;
    let reason = 'Hoạt động học tập';

    if (typeof arg1 === 'number') {
      amount = arg1;
      reason = typeof arg2 === 'string' ? arg2 : reason;
      userId = typeof arg3 === 'string' && arg3 !== 'Hoạt động học tập' ? arg3 : 'admin_master_user_id';
    } else {
      userId = typeof arg1 === 'string' && arg1 ? arg1 : 'admin_master_user_id';
      amount = typeof arg2 === 'number' ? arg2 : (parseInt(arg2, 10) || 10);
      reason = typeof arg3 === 'string' ? arg3 : 'Hoạt động học tập';
    }

    const db = getDb();
    const currentProfile = gamificationService.getProfile(userId);
    const oldLevel = currentProfile.level;

    const newTotalXp = Math.max(0, currentProfile.totalXp + amount);
    const newLevelDetails = calculateLevelFromXp(newTotalXp);

    const leveledUp = newLevelDetails.level > oldLevel;

    db.prepare(`
      UPDATE user_profile 
      SET total_xp = ?, current_level = ?, title = ?, updated_at = ?
      WHERE user_id = ? OR id = ? OR (id = 'default_user' AND ? = 'admin_master_user_id')
    `).run(newTotalXp, newLevelDetails.level, newLevelDetails.title, new Date().toISOString(), userId, userId, userId);

    return {
      success: true,
      userId,
      addedXp: amount,
      reason,
      totalXp: newTotalXp,
      oldLevel,
      newLevel: newLevelDetails.level,
      title: newLevelDetails.title,
      leveledUp,
      levelDetails: newLevelDetails
    };
  }
};
