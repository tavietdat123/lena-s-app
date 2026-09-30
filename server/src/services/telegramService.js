import https from 'node:https';
import { getDb } from '../db/database.js';
import { backupService } from './backupService.js';

const telegramAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 30000
});

export function escapeHtml(str = '') {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function postTelegramJson(botToken, method, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/${method}`,
      method: 'POST',
      agent: telegramAgent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (!json.ok) {
            reject(new Error(json.description || `Telegram API Error: ${res.statusCode}`));
          } else {
            resolve(json);
          }
        } catch (err) {
          reject(new Error(`Failed to parse Telegram response: ${body}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Telegram API request timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

export const telegramService = {
  // 1. Send an arbitrary HTML message to Telegram Chat
  sendMessage: async (botToken, chatId, text) => {
    if (!botToken || !chatId) {
      throw new Error('Telegram Bot Token và Chat ID không được để trống.');
    }

    return await postTelegramJson(botToken, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
  },

  // 1b. Send HTML message with Inline Keyboard Buttons
  sendMessageWithButtons: async (botToken, chatId, text, inlineKeyboard = []) => {
    if (!botToken || !chatId) {
      throw new Error('Telegram Bot Token và Chat ID không được để trống.');
    }

    return await postTelegramJson(botToken, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
  },

  // 2. Send instant verification test message
  sendTestMessage: async (botToken, chatId) => {
    const text = `
✨ <b>LINGUAVAULT • KẾT NỐI TELEGRAM THÀNH CÔNG!</b>

👋 Xin chào! Bot thông báo học tập của bạn đã được kích hoạt thành công.

🎯 <b>Tính năng tự động & AI Copilot:</b>
• Trò chuyện trực tiếp 2 chiều với AI Copilot về kho từ vựng.
• Gõ <code>/quiz</code> để làm trắc nghiệm nhanh ngay trong chat.
• Gõ <code>/add [từ]</code> để thêm từ vựng tự động bóc tách vào kho.
• Tự động nhắc nhở & báo động <b>Kỷ Luật Thép</b> bảo vệ chuỗi Streak 🔥.

<i>Chúc bạn có những buổi học tiếng Anh hiệu quả cùng LinguaVault! 🚀</i>
    `.trim();

    return await telegramService.sendMessage(botToken, chatId, text);
  },

  // 2b. Send Hardcore Alarm Message with Unlock Challenge Button
  sendHardcoreAlarmMessage: async (force = false) => {
    const db = getDb();
    
    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
    const botToken = tokenRow?.value;
    const chatId = chatRow?.value;

    if (!botToken || !chatId) {
      return { skipped: true, reason: 'Missing bot token or chat ID' };
    }

    const progress = telegramService.getDailyProgress();

    if (progress.isGoalMet && !force) {
      return { skipped: true, reason: 'Goal already met' };
    }

    const text = `
🚨🚨🚨 <b>BÁO ĐỘNG KỶ LUẬT THÉP • HARDCORE ALARM</b> 🚨🚨🚨

⏰ <b>ĐÃ ĐẾN GIỜ BÁO ĐỘNG HỌC TẬP!</b>
Hiện tại bạn <b>CHƯA HOÀN THÀNH</b> chỉ tiêu hôm nay:
📊 <b>Tiến độ:</b> <code>${progress.studiedToday} / ${progress.dailyGoal} từ</code> (Còn thiếu <b>${progress.remaining} từ</b>)
🔥 <b>Chuỗi Streak:</b> <b>${progress.streak} ngày</b> đang gặp nguy cơ đứt gãy!

⚡ <b>CÁCH TẮT BÁO ĐỘNG:</b>
Hệ thống sẽ <b>nhắc nhở rung chuông liên tục mỗi 10 phút</b> cho đến khi bạn:
1. Bấm nút <b>"⚡ Giải Mã Quiz Để Tắt Chuông"</b> bên dưới và trả lời đúng 3 câu trắc nghiệm.
2. Hoặc mở Web/App hoàn thành đủ bài học hôm nay!
    `.trim();

    const buttons = [
      [{ text: '⚡ Giải Mã 3 Câu Quiz Để Tắt Chuông', callback_data: 'start_quiz_challenge' }],
      [{ text: '📊 Kiểm Tra Tiến Độ Hôm Nay', callback_data: 'check_status' }]
    ];

    const result = await telegramService.sendMessageWithButtons(botToken, chatId, text, buttons);
    return { success: true, sent: true, progress, result };
  },

  // 3. Get Today's Study Progress & Due Words List
  getDailyProgress: () => {
    const db = getDb();
    
    // Get daily goal from settings
    const goalRow = db.prepare("SELECT value FROM settings WHERE key = 'daily_word_goal'").get();
    const dailyGoal = goalRow ? parseInt(goalRow.value, 10) || 10 : 10;

    // Get count of items reviewed or added today
    const todayStr = new Date().toISOString().slice(0, 10);
    const studyLogRow = db.prepare("SELECT reviews_count, new_words_count FROM study_logs WHERE date = ?").get(todayStr);

    const wordsAddedTodayRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM words 
      WHERE date(created_at, 'localtime') = date('now', 'localtime')
    `).get();

    const streakRow = db.prepare("SELECT value FROM settings WHERE key = 'streak'").get();
    const streak = streakRow ? parseInt(streakRow.value, 10) || 0 : 0;

    // Get Due Words for review
    const nowIso = new Date().toISOString();
    const dueWords = db.prepare(`
      SELECT id, word, phonetic, part_of_speech, meaning_vi, examples, interval, repetition
      FROM words 
      WHERE (due_date <= ? OR due_date IS NULL)
      ORDER BY repetition ASC, due_date ASC
      LIMIT 5
    `).all(nowIso).map(w => ({
      ...w,
      examples: JSON.parse(w.examples || '[]')
    }));

    const totalDueRow = db.prepare(`
      SELECT COUNT(*) as count FROM words WHERE (due_date <= ? OR due_date IS NULL)
    `).get(nowIso);

    const totalStudiedToday = (studyLogRow?.reviews_count || 0) + (wordsAddedTodayRow?.count || 0);

    return {
      dailyGoal,
      studiedToday: totalStudiedToday,
      isGoalMet: totalStudiedToday >= dailyGoal,
      remaining: Math.max(0, dailyGoal - totalStudiedToday),
      streak,
      dueWords,
      totalDueCount: totalDueRow?.count || 0
    };
  },

  // 4. Send Morning Spaced Repetition Due Reminder (Ôn tập từ cũ)
  sendDueReviewReminder: async (force = false) => {
    const db = getDb();
    
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_enabled'").get();
    const isEnabled = enabledRow?.value === 'true' || enabledRow?.value === '1';

    if (!isEnabled && !force) {
      return { skipped: true, reason: 'Telegram notification disabled in settings' };
    }

    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
    const botToken = tokenRow?.value;
    const chatId = chatRow?.value;

    if (!botToken || !chatId) {
      return { skipped: true, reason: 'Missing bot token or chat ID' };
    }

    const progress = telegramService.getDailyProgress();
    const { dueWords, totalDueCount } = progress;

    if (totalDueCount === 0 && !force) {
      return { skipped: true, reason: 'No due words to review today' };
    }

    // Build Word Cards for Telegram Message
    let wordListText = '';
    if (dueWords && dueWords.length > 0) {
      wordListText = dueWords.map((w, idx) => {
        const example = w.examples && w.examples.length > 0 ? `\n   <i>"${w.examples[0]}"</i>` : '';
        const ipa = w.phonetic ? ` <code>${w.phonetic}</code>` : '';
        const pos = w.part_of_speech ? ` (${w.part_of_speech})` : '';
        return `<b>${idx + 1}. ${w.word.toUpperCase()}</b>${ipa}${pos}\n   🇻🇳 <b>Nghĩa:</b> ${w.meaning_vi}${example}`;
      }).join('\n\n');
    } else {
      wordListText = '<i>(Hiện tại bạn đã ôn hết toàn bộ từ cũ! Rất xuất sắc 🌟)</i>';
    }

    const message = `
🧠 <b>ÔN TẬP TỪ CŨ • SPICED REPETITION (SM-2)</b>

👋 Chào bạn! Hôm nay có <b>${totalDueCount} từ vựng</b> đã đến chu kỳ ôn tập vàng để chống lãng quên:

${wordListText}

━━━━━━━━━━━━━━━━━━━━
💡 <i>Dành 3 phút lướt qua để củng cố trí nhớ dài hạn (Long-term Memory) nhé!</i>

👉 <b>Mở App Ôn Tập Ngay:</b> <a href="http://localhost:3000">LinguaVault Flashcard Hub</a>
    `.trim();

    const result = await telegramService.sendMessage(botToken, chatId, message);

    return {
      success: true,
      sent: true,
      totalDueCount,
      dueWords,
      result
    };
  },

  // 5. Check Progress & Send Evening Reminder If Incomplete
  checkAndSendDailyReminder: async (force = false) => {
    const db = getDb();
    
    // Check if Telegram notifications are enabled
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_enabled'").get();
    const isEnabled = enabledRow?.value === 'true' || enabledRow?.value === '1';

    if (!isEnabled && !force) {
      return { skipped: true, reason: 'Telegram notification disabled in settings' };
    }

    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();

    const botToken = tokenRow?.value;
    const chatId = chatRow?.value;

    if (!botToken || !chatId) {
      return { skipped: true, reason: 'Missing bot token or chat ID' };
    }

    const progress = telegramService.getDailyProgress();

    // If goal is already met, no need to alert
    if (progress.isGoalMet && !force) {
      return {
        success: true,
        sent: false,
        reason: 'Daily goal already met'
      };
    }

    // Include 2 sample due words if available
    let dueHint = '';
    if (progress.dueWords && progress.dueWords.length > 0) {
      const topWords = progress.dueWords.slice(0, 3).map(w => `• <b>${w.word}</b>: ${w.meaning_vi}`).join('\n');
      dueHint = `\n\n📌 <b>Từ cũ cần ôn gấp tối nay:</b>\n${topWords}`;
    }

    const message = `
⚠️ <b>CẢNH BÁO TIẾN ĐỘ HỌC TẬP • LINGUAVAULT</b>

⏰ Bạn ơi, hôm nay sắp hết ngày rồi mà mục tiêu học tập vẫn chưa đạt:
📊 <b>Tiến độ hôm nay:</b> <code>${progress.studiedToday} / ${progress.dailyGoal} từ</code>
⚡ <b>Còn thiếu:</b> <b>${progress.remaining} từ</b> nữa để hoàn thành!
🔥 <b>Chuỗi hiện tại:</b> <b>${progress.streak} ngày liên tục</b>${dueHint}

💡 <i>Dành 3 phút vào ôn tập Flashcard ngay để bảo vệ chuỗi Streak vàng nhé!</i>

👉 <b>Mở App ngay:</b> <a href="http://localhost:3000">LinguaVault Web Hub</a>
    `.trim();

    const result = await telegramService.sendMessage(botToken, chatId, message);

    return {
      success: true,
      sent: true,
      progress,
      result
    };
  },

  // 6. Send Late-Night Streak Saver Warning (22:30 / 23:00)
  sendStreakSaverWarning: async (force = false) => {
    const db = getDb();
    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
    const botToken = tokenRow?.value;
    const chatId = chatRow?.value;

    if (!botToken || !chatId) {
      return { skipped: true, reason: 'Missing bot token or chat ID' };
    }

    const progress = telegramService.getDailyProgress();
    if (progress.isGoalMet && !force) {
      return { skipped: true, reason: 'Goal already met tonight' };
    }

    const text = `
🔥🚨 <b>KHẨN CẤP • BẢO VỆ CHUỖI STREAK CỦA BẠN!</b> 🚨🔥

⏰ <b>Chỉ còn ít phút nữa là qua ngày mới!</b>
Ngọn lửa chuỗi <b>${progress.streak} ngày liên tục</b> của bạn đang có nguy cơ bị dập tắt:
📊 <b>Tiến độ hôm nay:</b> <code>${progress.studiedToday} / ${progress.dailyGoal} từ</code> (Còn thiếu <b>${progress.remaining} từ</b>)

⚡ <b>HÀNH ĐỘNG CỨU STREAK NGAY (30 GIÂY):</b>
Bấm nút bên dưới để giải nhanh 1 câu Quiz trắc nghiệm và giữ vững chuỗi ngày học tập chăm chỉ!
    `.trim();

    const buttons = [
      [{ text: '⚡ Giải 1 Câu Quiz Cứu Streak Ngay (30s)', callback_data: 'start_quiz_challenge' }],
      [{ text: '📊 Kiểm Tra Tiến Độ Hôm Nay', callback_data: 'check_status' }]
    ];

    const result = await telegramService.sendMessageWithButtons(botToken, chatId, text, buttons);
    return { success: true, sent: true, progress, result };
  },

  // 7. Send Bite-Sized Word of the Day (12:00 Lunchtime)
  sendWordOfTheDay: async (force = false) => {
    const db = getDb();
    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
    const botToken = tokenRow?.value;
    const chatId = chatRow?.value;

    if (!botToken || !chatId) {
      return { skipped: true, reason: 'Missing bot token or chat ID' };
    }

    // Pick a featured word (random from words table or fallback)
    const randomWordRow = db.prepare(`
      SELECT word, phonetic, part_of_speech, meaning_vi, meaning_en, examples, collocations, level
      FROM words 
      ORDER BY RANDOM() 
      LIMIT 1
    `).get();

    let featured = randomWordRow;
    if (!featured) {
      featured = {
        word: 'serendipity',
        phonetic: '/ˌser.ənˈdɪp.ə.ti/',
        part_of_speech: 'noun',
        meaning_vi: 'Sự may mắn tình cờ, duyên may bất ngờ',
        meaning_en: 'The occurrence and development of events by chance in a happy or beneficial way',
        examples: JSON.stringify(['Finding this incredible app was pure serendipity.']),
        collocations: JSON.stringify(['pure serendipity', 'a stroke of serendipity']),
        level: 'C1'
      };
    }

    const examplesList = Array.isArray(featured.examples) ? featured.examples : JSON.parse(featured.examples || '[]');
    const collocationsList = Array.isArray(featured.collocations) ? featured.collocations : JSON.parse(featured.collocations || '[]');
    const exampleStr = examplesList.length > 0 ? `\n💬 <i>"${examplesList[0]}"</i>` : '';
    const collocationsStr = collocationsList.length > 0 ? `\n🔗 <b>Collocation:</b> <code>${collocationsList.slice(0, 2).map(c => typeof c === 'string' ? c : c.phrase).join(', ')}</code>` : '';

    const text = `
✨☕ <b>TỪ VỰNG GIỜ NGHỈ TRƯA • WORD OF THE DAY</b> ☕✨

💎 <b>${featured.word.toUpperCase()}</b>  <code>${featured.phonetic || ''}</code>  [${featured.level || 'B2'}]
🏷️ <i>${featured.part_of_speech || 'noun'}</i>

🇻🇳 <b>Nghĩa:</b> ${featured.meaning_vi}
${featured.meaning_en ? `🇬🇧 <b>Definition:</b> ${featured.meaning_en}` : ''}${collocationsStr}${exampleStr}

━━━━━━━━━━━━━━━━━━━━
💡 <i>Dành 30 giây giờ nghỉ trưa nạp thêm 1 từ vựng tinh hoa mỗi ngày!</i>
    `.trim();

    const buttons = [
      [{ text: '🎯 Thử Thách Trắc Nghiệm Từ Này', callback_data: 'start_quiz_challenge' }]
    ];

    const result = await telegramService.sendMessageWithButtons(botToken, chatId, text, buttons);
    return { success: true, sent: true, word: featured.word, result };
  },

  // 8. Send Weekly Memory & Progress Digest (Sunday Morning)
  sendWeeklyDigest: async (force = false) => {
    const db = getDb();
    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
    const botToken = tokenRow?.value;
    const chatId = chatRow?.value;

    if (!botToken || !chatId) {
      return { skipped: true, reason: 'Missing bot token or chat ID' };
    }

    // Stats for past 7 days
    const weekLogs = db.prepare(`
      SELECT SUM(reviews_count) as total_reviews, SUM(new_words_count) as total_new
      FROM study_logs
      WHERE date >= date('now', '-7 days')
    `).get();

    const profileRow = db.prepare("SELECT total_xp, current_level, title FROM user_profile LIMIT 1").get();
    const totalXp = profileRow?.total_xp || 0;
    const currentLevel = profileRow?.current_level || 1;
    const userTitle = profileRow?.title || 'Novice Scholar 🌱';

    const totalWords = db.prepare("SELECT COUNT(*) as count FROM words").get()?.count || 0;
    const masteredWords = db.prepare("SELECT COUNT(*) as count FROM words WHERE repetition >= 5 OR interval >= 45").get()?.count || 0;
    const streakRow = db.prepare("SELECT value FROM settings WHERE key = 'streak'").get();
    const streak = streakRow ? parseInt(streakRow.value, 10) || 0 : 0;

    const totalReviews = weekLogs?.total_reviews || 0;
    const totalNew = weekLogs?.total_new || 0;

    // Top words reviewed
    const topWords = db.prepare(`
      SELECT word, meaning_vi, repetition
      FROM words
      ORDER BY repetition DESC, updated_at DESC
      LIMIT 3
    `).all();

    const topWordsText = topWords.map(w => `• <b>${w.word}</b>: ${w.meaning_vi} (Thuộc: ${w.repetition} lần)`).join('\n');

    const text = `
📈🏆 <b>BÁO CÁO TIẾN ĐỘ TUẦN QUA • LINGUAVAULT</b> 🏆📈

Chúc mừng bạn đã hoàn thành một tuần học tập bền bỉ! Dưới đây là bức tranh tổng thể về sự tiến bộ của bạn:

📊 <b>THỐNG KÊ 7 NGÀY QUA:</b>
• Từ mới đã nạp: <b>+${totalNew} từ</b>
• Lượt ôn tập Spaced Repetition: <b>${totalReviews} lượt</b>
• Kinh nghiệm tích lũy: <b>+${totalXp} XP</b>
• Chuỗi ngày Streak: 🔥 <b>${streak} ngày liên tục</b>

🧠 <b>ĐỘ PHÂN BỔ TRÍ NHỚ TỔNG QUAN:</b>
• Tổng kho từ: <b>${totalWords} từ</b>
• Đã thuộc vĩnh viễn (Mastered): <b>${masteredWords} từ</b> (${totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0}%)

📌 <b>TỪ VỰNG NỔI BẬT TUẦN QUA:</b>
${topWordsText || '• <i>Chưa có dữ liệu chi tiết</i>'}

━━━━━━━━━━━━━━━━━━━━
🚀 <i>Hãy tiếp tục duy trì phong độ xuất sắc trong tuần mới nhé!</i>
    `.trim();

    const result = await telegramService.sendMessage(botToken, chatId, text);
    return { success: true, sent: true, result };
  },

  // 9. Send Leech Words Alert (Từ hay quên / cần củng cố)
  sendLeechWordsAlert: async (force = false) => {
    const db = getDb();
    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
    const botToken = tokenRow?.value;
    const chatId = chatRow?.value;

    if (!botToken || !chatId) {
      return { skipped: true, reason: 'Missing bot token or chat ID' };
    }

    // Identify Leech words (repetition <= 1 and ease_factor <= 1.8)
    const leechWords = db.prepare(`
      SELECT word, phonetic, part_of_speech, meaning_vi, examples
      FROM words
      WHERE ease_factor <= 1.8 OR (repetition = 0 AND interval = 0)
      LIMIT 3
    `).all();

    if ((!leechWords || leechWords.length === 0) && !force) {
      return { skipped: true, reason: 'No leech words detected' };
    }

    const wordsText = (leechWords.length > 0 ? leechWords : [
      { word: 'reluctant', phonetic: '/rɪˈlʌk.tənt/', meaning_vi: 'Lưỡng lự, miễn cưỡng', examples: '["She was reluctant to leave."]' }
    ]).map((w, i) => {
      return `<b>${i + 1}. ${w.word.toUpperCase()}</b> <code>${w.phonetic || ''}</code>\n   🇻🇳 <i>${w.meaning_vi}</i>`;
    }).join('\n\n');

    const text = `
💡🧠 <b>BÁO ĐỘNG TỪ CỨNG ĐẦU • AI MNEMONIC HINT</b> 🧠💡

Hệ thống phát hiện một số từ vựng bạn <b>thường hay quên hoặc bấm lặp lại nhiều lần</b>:

${wordsText}

━━━━━━━━━━━━━━━━━━━━
🧠 <b>Mẹo nhớ siêu tốc (AI Association):</b>
• Hãy liên tưởng từ với một hình ảnh ngộ nghĩnh hoặc tình huống thực tế trong ngày.
• Đặt 1 câu văn cá nhân của chính bạn với từ này để ghim chặt vào bán cầu não phải.

👉 <b>Mở Quiz thực chiến ngay:</b>
    `.trim();

    const buttons = [
      [{ text: '⚡ Làm Quiz Củng Cố Ngay', callback_data: 'start_quiz_challenge' }]
    ];

    const result = await telegramService.sendMessageWithButtons(botToken, chatId, text, buttons);
    return { success: true, sent: true, count: leechWords.length, result };
  },

  // 10. Generate and Send Vault Backup JSON Document to Telegram
  sendBackupDocument: async (customToken = null, customChatId = null, userId = 'admin_master_user_id') => {
    const db = getDb();
    let userToken = null;
    let userChatId = null;
    try {
      const userSettingsRow = db.prepare("SELECT telegram_bot_token, telegram_chat_id FROM user_settings WHERE user_id = ?").get(userId);
      userToken = userSettingsRow?.telegram_bot_token;
      userChatId = userSettingsRow?.telegram_chat_id;
    } catch (e) {}

    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();

    const botToken = customToken || userToken || tokenRow?.value || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = customChatId || userChatId || chatRow?.value || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error('Chưa cấu hình Telegram Bot Token hoặc Chat ID. Vui lòng kiểm tra lại trong phần Cài đặt.');
    }

    // 1. Gather backup payload
    const backup = backupService.buildBackupPayload(userId);
    const jsonString = JSON.stringify(backup, null, 2);
    const sizeBytes = Buffer.byteLength(jsonString, 'utf8');
    const sizeKb = (sizeBytes / 1024).toFixed(1);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const filename = `lingua_vault_backup_${dateStr}_${hours}h${minutes}.json`;

    const wordsCount = backup.data?.words?.length || 0;
    const patternsCount = backup.data?.patterns?.length || 0;
    const notesCount = backup.data?.notes?.length || 0;
    const logsCount = backup.data?.study_logs?.length || 0;

    const caption = `
📦 <b>BẢN SAO LƯU DỮ LIỆU • LINGUAVAULT</b> 📦

📅 <b>Thời gian:</b> <code>${dateStr} ${hours}:${minutes}</code>
📊 <b>Thống kê kho dữ liệu:</b>
• 📚 Từ vựng: <b>${wordsCount} từ</b>
• 🧩 Mẫu câu: <b>${patternsCount} mẫu</b>
• 📝 Ghi chú: <b>${notesCount} bài</b>
• 📈 Lịch sử ôn tập: <b>${logsCount} ngày</b>
💾 <b>Kích thước file:</b> <code>${sizeKb} KB</code>

━━━━━━━━━━━━━━━━━━━━
🛡️ <i>File sao lưu được lưu trữ vĩnh viễn trên Telegram của bạn, bảo toàn dữ liệu ngay cả khi server restart!</i>
💡 <i>Để khôi phục: Vào Cài Đặt trên Web App ➔ Khôi Phục Dữ Liệu ➔ Chọn file JSON này.</i>
    `.trim();

    // 2. Post to Telegram sendDocument API
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    const blob = new Blob([jsonString], { type: 'application/json' });
    formData.append('document', blob, filename);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Lỗi gửi file sao lưu tới Telegram');
    }

    return {
      success: true,
      sent: true,
      filename,
      stats: {
        words: wordsCount,
        patterns: patternsCount,
        notes: notesCount,
        study_logs: logsCount,
        sizeKb
      },
      result
    };
  }
};

