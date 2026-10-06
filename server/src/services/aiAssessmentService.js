import { getDb } from '../db/database.js';
import { callGemini, getEffectiveApiKey, getLanguageName } from './aiService.js';
import { gamificationService } from './gamificationService.js';

export const aiAssessmentService = {
  generateMasteryReport: async (apiKey = null, userId = 'admin_master_user_id', targetLanguage = 'en', fluentLanguage = 'vi') => {
    const db = getDb();
    const effectiveKey = getEffectiveApiKey(apiKey);
    const isEnFluent = fluentLanguage === 'en';
    const isViTrack = targetLanguage === 'vi';
    const fluentName = getLanguageName(fluentLanguage);
    const targetName = getLanguageName(targetLanguage);

    // 1. Fetch raw data from SQLite for specific user & targetLanguage
    let wordsQuery = `
      SELECT * FROM words 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `;
    const wordsParams = [userId, userId, userId];
    if (targetLanguage === 'vi') {
      wordsQuery += ' AND target_language = ?';
      wordsParams.push('vi');
    } else {
      wordsQuery += ' AND (target_language = ? OR target_language IS NULL)';
      wordsParams.push('en');
    }
    const words = db.prepare(wordsQuery).all(...wordsParams);
    
    let patternsQuery = `
      SELECT * FROM patterns 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `;
    const patternsParams = [userId, userId, userId];
    if (targetLanguage === 'vi') {
      patternsQuery += ' AND target_language = ?';
      patternsParams.push('vi');
    } else {
      patternsQuery += ' AND (target_language = ? OR target_language IS NULL)';
      patternsParams.push('en');
    }
    const patterns = db.prepare(patternsQuery).all(...patternsParams);

    const studyLogs = db.prepare(`
      SELECT * FROM study_logs 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
      ORDER BY date DESC LIMIT 30
    `).all(userId, userId, userId);

    const profile = gamificationService.getProfile(userId);

    const totalWords = words.length;
    const totalPatterns = patterns.length;

    // 2. Classify Memory Retention Depth via Strict SM-2 metrics
    const masteredWords = words.filter(w => 
      w.status === 'mastered' || 
      ((w.repetition || 0) >= 4 && (w.interval || 0) >= 10)
    );
    const familiarWords = words.filter(w => 
      !masteredWords.some(m => m.id === w.id) && 
      (w.status === 'reviewing' || (w.repetition || 0) >= 2)
    );
    const learningWords = words.filter(w => 
      !masteredWords.some(m => m.id === w.id) && 
      !familiarWords.some(f => f.id === w.id)
    );

    // 3. Exact CEFR / VSL Level Distribution & Strict Weighted Index
    const cefrDistribution = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    let weightedCefrSum = 0;
    const cefrWeights = { A1: 1, A2: 1.8, B1: 2.8, B2: 3.8, C1: 4.8, C2: 6 };

    words.forEach(w => {
      const rawLvl = (w.level || 'B1').toUpperCase().trim();
      const lvl = cefrDistribution[rawLvl] !== undefined ? rawLvl : 'B1';
      cefrDistribution[lvl]++;
      weightedCefrSum += cefrWeights[lvl] || 2.8;
    });

    const avgCefrWeight = totalWords > 0 ? (weightedCefrSum / totalWords) : 1;

    // Determine estimated Level based on real breadth & depth (CEFR or VSL)
    let estimatedCefrLevel = isEnFluent ? 'A1 Starter' : 'A1 Starter (Khởi đầu)';
    if (isViTrack) {
      if (totalWords < 5) {
        estimatedCefrLevel = isEnFluent ? 'Tier 1 - Elementary (Getting familiar with 6 tones & basic vocabulary)' : 'Bậc 1 - Sơ cấp (Đang làm quen thanh điệu & từ vựng)';
      } else if (totalWords >= 500 && (cefrDistribution.C1 + cefrDistribution.C2) >= 100 && avgCefrWeight >= 5.0) {
        estimatedCefrLevel = isEnFluent ? 'Tier 6 - Mastery (Command of Vietnamese idioms & rhetorical devices)' : 'Bậc 6 - Thành thạo (Làm chủ thành ngữ & tu từ tiếng Việt)';
      } else if (totalWords >= 200 && (cefrDistribution.C1 + cefrDistribution.C2) >= 30 && avgCefrWeight >= 4.2) {
        estimatedCefrLevel = isEnFluent ? 'Tier 5 - Advanced (Sino-Vietnamese lexicon & journalistic texts)' : 'Bậc 5 - Cao cấp (Vốn từ Hán-Việt & báo chí chính luận)';
      } else if (totalWords >= 80 && (cefrDistribution.B2 + cefrDistribution.C1) >= 20 && avgCefrWeight >= 3.3) {
        estimatedCefrLevel = isEnFluent ? 'Tier 4 - Upper-Intermediate (Workplace communication & expressive reduplications)' : 'Bậc 4 - Trung cấp Cao (Giao tiếp công sở & từ láy tinh tế)';
      } else if (totalWords >= 30 && (cefrDistribution.B1 + cefrDistribution.B2) >= 10 && avgCefrWeight >= 2.3) {
        estimatedCefrLevel = isEnFluent ? 'Tier 3 - Intermediate (Tense particles & paired conjunctions)' : 'Bậc 3 - Trung cấp (Hư từ thời gian & liên từ đôi)';
      } else if (totalWords >= 10 && avgCefrWeight >= 1.4) {
        estimatedCefrLevel = isEnFluent ? 'Tier 2 - Upper-Elementary (Daily life, food & kinship pronouns)' : 'Bậc 2 - Sơ cấp Nâng cao (Đời sống, ẩm thực & xưng hô)';
      } else {
        estimatedCefrLevel = isEnFluent ? 'Tier 1 - Elementary (Phonetics, 6 tones & greetings)' : 'Bậc 1 - Sơ cấp Cơ bản (Ngữ âm, 6 thanh điệu & chào hỏi)';
      }
    } else {
      if (totalWords < 5) {
        estimatedCefrLevel = 'A1- Beginner (Vốn từ sơ cấp đang tích lũy)';
      } else if (totalWords >= 500 && (cefrDistribution.C1 + cefrDistribution.C2) >= 100 && avgCefrWeight >= 5.0) {
        estimatedCefrLevel = 'C2 Mastery (Bậc thầy Ngôn ngữ)';
      } else if (totalWords >= 200 && (cefrDistribution.C1 + cefrDistribution.C2) >= 30 && avgCefrWeight >= 4.2) {
        estimatedCefrLevel = 'C1 Advanced (Cao cấp Chuyên sâu)';
      } else if (totalWords >= 80 && (cefrDistribution.B2 + cefrDistribution.C1) >= 20 && avgCefrWeight >= 3.3) {
        estimatedCefrLevel = 'B2 Upper-Intermediate (Trung cấp Cao)';
      } else if (totalWords >= 30 && (cefrDistribution.B1 + cefrDistribution.B2) >= 10 && avgCefrWeight >= 2.3) {
        estimatedCefrLevel = 'B1 Intermediate (Trung cấp Thực hành)';
      } else if (totalWords >= 10 && avgCefrWeight >= 1.4) {
        estimatedCefrLevel = 'A2 Elementary (Sơ cấp Tiền đề)';
      } else {
        estimatedCefrLevel = 'A1 Starter (Cơ bản Bắt đầu)';
      }
    }

    // 4. Calculate Strict Mathematical Mastery & Realistic Retention Score (0 - 100)
    const totalReviews = studyLogs.reduce((acc, log) => acc + (log.reviews_count || 0), 0);
    
    // Retention Rate: Mastered = 100%, Familiar = 50%, Learning = 15%
    const retentionRate = totalWords > 0 
      ? Math.round(((masteredWords.length * 1.0 + familiarWords.length * 0.5 + learningWords.length * 0.15) / totalWords) * 100)
      : 0;

    // Strict Score Breakdown (Total 100 pts)
    const volumeScore = Math.min(30, (totalWords / 100) * 30);
    const cefrScore = Math.min(25, (avgCefrWeight / 5.5) * 25);
    const retentionScore = (retentionRate / 100) * 30;
    const consistencyScore = Math.min(15, (profile.streakRecord || 1) * 1.5 + (profile.level * 0.75));
    
    const computedOverallScore = totalWords > 0
      ? Math.min(98, Math.max(15, Math.round(volumeScore + cefrScore + retentionScore + consistencyScore)))
      : 10;

    const baseMetrics = {
      totalWords,
      totalPatterns,
      masteredCount: masteredWords.length,
      familiarCount: familiarWords.length,
      learningCount: learningWords.length,
      masteryPercentage: retentionRate,
      retentionRate,
      cefrDistribution,
      avgCefrWeight: Math.round(avgCefrWeight * 10) / 10,
      totalReviews,
      userLevel: profile.level,
      userTitle: profile.title,
      totalXp: profile.totalXp,
      streakRecord: profile.streakRecord
    };

    // 5. If Gemini API Key is available, invoke AI for rigorous evaluation
    if (effectiveKey) {
      const sampleWordsList = words.slice(0, 20).map(w => ({
        word: w.word,
        level: w.level,
        meaning: w.meaning_vi || w.meaning_en || w.meaning,
        interval: w.interval,
        repetition: w.repetition,
        status: w.status
      }));

      const promptRole = isViTrack
        ? `Bạn là Trưởng ban Khảo thí Năng lực Tiếng Việt cho Người Nước Ngoài (Senior VSL Examiner - Khung năng lực tiếng Việt 6 bậc ban hành theo Thông tư 17/2015/TT-BGDĐT).`
        : `Bạn là Trưởng ban Khảo thí Ngôn ngữ Học thuật Quốc tế & Giám khảo Cấp cao Khung Tham chiếu CEFR Châu Âu (Senior Academic CEFR & IELTS Examiner).`;

      const prompt = `
${promptRole}
Hãy áp dụng TIÊU CHÍ ĐÁNH GIÁ CỰC KỲ KHẮT KHE, HỌC THUẬT, KHÔNG NƯƠNG TAY để mổ xẻ dữ liệu học tập và kho từ vựng của thí sinh.

THÔNG TIN NGÔN NGỮ QUAN TRỌNG:
- Học viên đang học: ${targetName}
- Ngôn ngữ thành thạo / mẹ đẻ của học viên: ${fluentName}

DỮ LIỆU THỰC TẾ TRONG DATABASE:
- Tổng số từ vựng: ${totalWords} từ
- Tổng số mẫu câu cấu trúc: ${totalPatterns} mẫu
- Phân bổ cấp độ: A1: ${cefrDistribution.A1}, A2: ${cefrDistribution.A2}, B1: ${cefrDistribution.B1}, B2: ${cefrDistribution.B2}, C1: ${cefrDistribution.C1}, C2: ${cefrDistribution.C2}
- Số từ đã làm chủ vững vàng (Mastered >= 4 lần nhớ đúng, chu kỳ >= 10 ngày): ${masteredWords.length} từ
- Số từ đang củng cố (Familiar): ${familiarWords.length} từ
- Số từ mới nạp / có nguy cơ rơi rụng (Learning): ${learningWords.length} từ
- Tỷ lệ làm chủ trí nhớ (Mastery Rate): ${retentionRate}%
- Điểm đánh giá chuẩn hóa: ${computedOverallScore}/100
- Cấp độ hiện tại: Level ${profile.level} - "${profile.title}" (${profile.totalXp} XP, Streak: ${profile.streakRecord} ngày)
- Danh sách từ vựng tiêu biểu: ${JSON.stringify(sampleWordsList)}

QUY TẮC KHẢO THÍ KHẮT KHE:
1. Đánh giá thẳng thắn, sắc bén, không dùng lời khen sáo rỗng hoặc quá dễ dãi.
2. Vạch rõ "Lỗ hổng từ vựng" (Lexical Blindspots) và nguy cơ rơi vào đường cong lãng quên Ebbinghaus.
3. Đề xuất chiến lược nâng cấp từ vựng cụ thể theo mục tiêu thực tế.
4. BẮT BUỘC: Toàn bộ nội dung trả về ("evaluationSummary", "lexicalStrengths", "growthAreas", "actionPlan", "aiPraiseQuote") PHẢI ĐƯỢC VIẾT BẰNG ${fluentName} để học viên hiểu rõ!

HÃY TRẢ VỀ DUY NHẤT MỘT ĐỊNH DẠNG JSON (không có markdown backticks ngoài JSON):
{
  "estimatedCefrLevel": "${estimatedCefrLevel}",
  "overallScore": ${computedOverallScore},
  "evaluationSummary": "Bản nhận xét đánh giá học thuật chuyên sâu (viết bằng ${fluentName}, 2-3 câu ngắn gọn).",
  "lexicalStrengths": [
    "Điểm mạnh học thuật 1 dựa trên số liệu thực (viết bằng ${fluentName})",
    "Điểm mạnh học thuật 2 (viết bằng ${fluentName})"
  ],
  "growthAreas": [
    "Lỗ hổng từ vựng cụ thể hoặc rủi ro quên lãng (viết bằng ${fluentName})",
    "Lỗ hổng từ vựng 2 (viết bằng ${fluentName})"
  ],
  "actionPlan": [
    "Nhiệm vụ kỷ luật 1 trong tuần (viết bằng ${fluentName})",
    "Nhiệm vụ kỷ luật 2 (viết bằng ${fluentName})",
    "Nhiệm vụ kỷ luật 3 (viết bằng ${fluentName})"
  ],
  "aiPraiseQuote": "Một lời khuyên đắt giá mang tính rèn giũa kỷ luật học thuật cao (viết bằng ${fluentName})."
}
`.trim();

      try {
        const aiResponse = await callGemini(prompt, effectiveKey);
        const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedAi = JSON.parse(cleaned);

        return {
          success: true,
          metrics: baseMetrics,
          aiAssessment: parsedAi,
          evaluatedAt: new Date().toISOString()
        };
      } catch (err) {
        console.warn('⚠️ Gemini AI Assessment error, using statistical engine:', err.message);
      }
    }

    // 6. High-Precision Statistical Assessment Engine (Guaranteed 100% Accurate to Real Database Data)
    const topLevels = [];
    if (cefrDistribution.C1 + cefrDistribution.C2 > 0) topLevels.push(`${cefrDistribution.C1 + cefrDistribution.C2} ${isEnFluent ? 'C1-C2 words' : 'từ C1-C2'}`);
    if (cefrDistribution.B2 > 0) topLevels.push(`${cefrDistribution.B2} ${isEnFluent ? 'B2 words' : 'từ B2'}`);
    if (cefrDistribution.B1 > 0) topLevels.push(`${cefrDistribution.B1} ${isEnFluent ? 'B1 words' : 'từ B1'}`);
    if (cefrDistribution.A1 + cefrDistribution.A2 > 0) topLevels.push(`${cefrDistribution.A1 + cefrDistribution.A2} ${isEnFluent ? 'A1-A2 words' : 'từ A1-A2'}`);

    const levelSummaryText = topLevels.length > 0 
      ? topLevels.join(', ') 
      : (isEnFluent ? 'Initializing' : 'Đang khởi tạo');

    if (isEnFluent) {
      return {
        success: true,
        metrics: baseMetrics,
        aiAssessment: {
          estimatedCefrLevel,
          overallScore: computedOverallScore,
          evaluationSummary: totalWords > 0
            ? `Your vocabulary vault contains ${totalWords} words (${levelSummaryText}), maintaining a retention rate of ${retentionRate}%. Estimated actual proficiency is ${estimatedCefrLevel}.`
            : 'No vocabulary words recorded yet. Start adding words to your vault for detailed AI proficiency analysis!',
          lexicalStrengths: [
            `Recorded ${masteredWords.length} mastered words and ${familiarWords.length} words in solid retention intervals`,
            `Structured multi-tier pattern bank with ${totalPatterns} sentence patterns and ${profile.streakRecord || 1} day learning streak`,
            `Proficiency distribution coverage: ${levelSummaryText}`
          ],
          growthAreas: [
            learningWords.length > 0 
              ? `Prioritize reviewing ${learningWords.length} consolidating words to transition them to Mastered status`
              : 'Expand into higher-level academic expressions or domain-specific vocabulary',
            'Connect vocabulary words with Smart Reader reading sessions and AI Speaking Lab dialogues'
          ],
          actionPlan: [
            'Complete all daily SRS flashcards at optimal memory intervals',
            'Practice pronunciation and intonation with AI Speaking Lab',
            'Add 3-5 high-yield words each day to advance along the proficiency scale'
          ],
          aiPraiseQuote: 'Consistency is the mother of mastery. Every single word you learn builds your linguistic empire!'
        },
        evaluatedAt: new Date().toISOString()
      };
    }

    return {
      success: true,
      metrics: baseMetrics,
      aiAssessment: {
        estimatedCefrLevel,
        overallScore: computedOverallScore,
        evaluationSummary: totalWords > 0
          ? `Kho từ vựng của bạn hiện có ${totalWords} từ (${levelSummaryText}), đạt tỷ lệ duy trì trí nhớ ${retentionRate}%. Trình độ từ vựng thực tế được ước tính ở mức ${estimatedCefrLevel}.`
          : 'Bạn chưa thêm từ vựng nào vào kho lưu trữ. Hãy bắt đầu thêm các từ mới để Giám khảo AI tiến hành khảo thí năng lực chi tiết!',
        lexicalStrengths: [
          `Đã ghi nhận ${masteredWords.length} từ đạt mức thuần thục và ${familiarWords.length} từ trong chu kỳ ghi nhớ tốt`,
          `Hệ thống cấu trúc đa tầng với ${totalPatterns} mẫu câu và ${profile.streakRecord || 1} ngày học liên tục`,
          `Độ bao phủ cấp độ ngôn ngữ: ${levelSummaryText}`
        ],
        growthAreas: [
          learningWords.length > 0 
            ? `Cần tập trung ôn tập ${learningWords.length} từ ở giai đoạn củng cố để chuyển hóa sang nhóm Thuần thục`
            : 'Mở rộng thêm các từ vựng chuyên ngành hoặc cụm từ học thuật C1-C2',
          'Tăng cường liên kết từ vựng vào bài đọc Smart Reader và hội thoại AI Speaking Lab'
        ],
        actionPlan: [
          'Hoàn thành đầy đủ các thẻ ôn tập SRS đúng thời điểm vàng mỗi ngày',
          'Sử dụng tính năng AI Speaking Lab để luyện phát âm chuẩn xác các từ vựng trong kho',
          'Bổ sung thêm 3-5 từ vựng mới mỗi ngày để nâng cao thang điểm CEFR'
        ],
        aiPraiseQuote: 'Consistency is the mother of mastery. Every single word you learn builds your linguistic empire!'
      },
      evaluatedAt: new Date().toISOString()
    };
  }
};
