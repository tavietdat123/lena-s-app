import { getDb } from '../db/database.js';
import { resolveTopics, filterItemsByDate, quizService } from './quizService.js';

export function getEffectiveApiKey(apiKey = null) {
  if (apiKey && typeof apiKey === 'string' && apiKey.trim()) return apiKey.trim();
  try {
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
    if (row && row.value && row.value.trim()) return row.value.trim();
  } catch (e) {}
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  return null;
}

export function getSelectedModel() {
  try {
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get('gemini_model');
    if (row && row.value && row.value.trim() && !row.value.includes('2.0') && !row.value.includes('1.5') && !row.value.includes('2.5') && row.value !== 'gemini-3.6-flash') {
      return row.value;
    }
  } catch (e) {}
  return 'gemini-flash-lite-latest';
}

export function safeParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') return {};
  let cleaned = rawText.trim();
  
  // Extract content inside ```json ... ``` block if present anywhere in the text
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 1. Direct standard parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  // 2. Extract from first { to last }, or [ to ]
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (eBrace) {}
  }

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = cleaned.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch (eBracket) {}
  }

  // 3. Sanitize control characters
  try {
    const target = firstBrace !== -1 && lastBrace > firstBrace 
      ? cleaned.substring(firstBrace, lastBrace + 1) 
      : (firstBracket !== -1 && lastBracket > firstBracket ? cleaned.substring(firstBracket, lastBracket + 1) : cleaned);
    const sanitizedControl = target.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
      if (c === '\n') return '\\n';
      if (c === '\r') return '\\r';
      if (c === '\t') return '\\t';
      return '';
    });
    return JSON.parse(sanitizedControl);
  } catch (eControl) {}

  // 4. Auto-repair cut-off / truncated JSON
  if (firstBrace !== -1) {
    let sub = cleaned.substring(firstBrace);
    let inString = false;
    for (let i = 0; i < sub.length; i++) {
      if (sub[i] === '"' && (i === 0 || sub[i - 1] !== '\\')) {
        inString = !inString;
      }
    }
    if (inString) sub += '"';

    let openCurly = 0, openSquare = 0;
    let inStr = false;
    for (let i = 0; i < sub.length; i++) {
      if (sub[i] === '"' && (i === 0 || sub[i - 1] !== '\\')) inStr = !inStr;
      if (!inStr) {
        if (sub[i] === '{') openCurly++;
        else if (sub[i] === '}') openCurly--;
        else if (sub[i] === '[') openSquare++;
        else if (sub[i] === ']') openSquare--;
      }
    }
    while (openSquare > 0) { sub += ']'; openSquare--; }
    while (openCurly > 0) { sub += '}'; openCurly--; }

    try {
      const fixed = sub.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed);
    } catch (errRepaired) {}
  }

  console.warn('[safeParseJson] Parse failed. Snippet:', rawText?.slice?.(0, 300));
  throw new Error(`Không thể phân tích dữ liệu phản hồi từ AI.`);
}

export function normalizeAndRandomizeQuestions(parsed, defaultPrefix = 'ai_q') {
  if (!parsed) return [];
  
  let list = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (Array.isArray(parsed.questions)) {
    list = parsed.questions;
  } else if (Array.isArray(parsed.quiz)) {
    list = parsed.quiz;
  } else if (Array.isArray(parsed.data)) {
    list = parsed.data;
  } else if (Array.isArray(parsed.items)) {
    list = parsed.items;
  } else if (Array.isArray(parsed.questionList)) {
    list = parsed.questionList;
  } else if (Array.isArray(parsed.questions_list)) {
    list = parsed.questions_list;
  } else if (parsed.quiz && Array.isArray(parsed.quiz.questions)) {
    list = parsed.quiz.questions;
  } else if (parsed.data && Array.isArray(parsed.data.questions)) {
    list = parsed.data.questions;
  } else if (parsed.questions && typeof parsed.questions === 'object') {
    list = Object.values(parsed.questions);
  } else if (parsed.quiz && typeof parsed.quiz === 'object') {
    list = Object.values(parsed.quiz);
  } else if (typeof parsed === 'object') {
    const arrKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]) && parsed[k].length > 0);
    if (arrKey) {
      list = parsed[arrKey];
    }
  }

  // Deduplicate items from AI response (guarantee unique question texts without dropping questions)
  const seenTexts = new Map();
  const uniqueList = [];

  for (const q of list) {
    if (!q || typeof q !== 'object') continue;
    let t = String(q.questionText || '').trim();
    if (!t) {
      t = `Câu hỏi ôn tập: ${q.word || 'Vocabulary'}`;
    }
    const lowerKey = t.toLowerCase();
    const count = (seenTexts.get(lowerKey) || 0) + 1;
    seenTexts.set(lowerKey, count);

    if (count > 1) {
      q.questionText = `${t} [Lượt ${count}]`;
    } else {
      q.questionText = t;
    }
    uniqueList.push(q);
  }

  return uniqueList.map((q, idx) => {
    let rawOptions = [];
    if (Array.isArray(q.options)) {
      rawOptions = [...q.options];
    } else if (q.options && typeof q.options === 'object') {
      rawOptions = Object.values(q.options);
    } else if (Array.isArray(q.choices)) {
      rawOptions = [...q.choices];
    } else if (q.choices && typeof q.choices === 'object') {
      rawOptions = Object.values(q.choices);
    } else if (Array.isArray(q.answers)) {
      rawOptions = [...q.answers];
    }

    const correct = String(q.correctAnswer || q.answer || q.correct_answer || q.correct || rawOptions[0] || '').trim();

    // Ensure correct answer is in options
    if (correct && !rawOptions.some(o => String(o).trim().toLowerCase() === correct.toLowerCase())) {
      if (rawOptions.length >= 4) {
        rawOptions[0] = correct;
      } else {
        rawOptions.push(correct);
      }
    }

    let cleanOpts = rawOptions.map(o => String(o).trim()).filter(Boolean);
    if (cleanOpts.length < 2 && correct) {
      cleanOpts = [correct, 'None of the above', 'All of the above', 'Other option'];
    }

    // Fisher-Yates shuffle
    for (let i = cleanOpts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cleanOpts[i], cleanOpts[j]] = [cleanOpts[j], cleanOpts[i]];
    }

    let qDifficulty = q.difficulty || 'medium';
    if (q.level && ['A1', 'A2', 'B1'].includes(String(q.level).toUpperCase())) {
      qDifficulty = 'easy';
    } else if (q.level && ['C1', 'C2'].includes(String(q.level).toUpperCase())) {
      qDifficulty = 'hard';
    }

    return {
      id: q.id || `${defaultPrefix}_${idx + 1}`,
      type: q.type || 'cloze_blank',
      word: q.word || q.targetWord || q.term || 'Vocabulary',
      difficulty: qDifficulty,
      level: q.level || (qDifficulty === 'easy' ? 'B1' : qDifficulty === 'hard' ? 'C1' : 'B2'),
      context_level: (q.context_level || q.contextLevel || q.level || 'B2').toUpperCase().replace('_', ' - '),
      questionText: q.questionText || q.question || q.prompt || q.text || 'Question text',
      promptSubtitle: q.promptSubtitle || q.subtitle || q.instruction || 'Chọn đáp án chính xác:',
      options: cleanOpts,
      correctAnswer: correct || cleanOpts[0],
      explanation: q.explanation || q.explain || '',
      translation: q.translation || q.vietnamese || ''
    };
  });
}

export async function callGemini(prompt, apiKey = null, audioData = null, customModel = null, isJson = true) {
  const key = getEffectiveApiKey(apiKey);
  if (!key) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng nhập API Key miễn phí trong mục Cài đặt.');
  }

  const primaryModel = customModel && customModel !== 'gemini-3.6-flash' ? customModel : getSelectedModel();
  const modelsToTry = [primaryModel, 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.5-flash'].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );

  const parts = [];
  if (audioData && audioData.data) {
    parts.push({
      inline_data: {
        mime_type: audioData.mimeType || 'audio/webm',
        data: audioData.data
      }
    });
  }
  parts.push({ text: prompt });

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.15,
      topK: 16,
      topP: 0.9,
      maxOutputTokens: 8192,
      ...(isJson ? { response_mime_type: 'application/json' } : {})
    }
  };

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return text;
      }

      const errorText = await response.text();
      lastError = new Error(`Lỗi kết nối Gemini API [${model}] (${response.status}): ${errorText}`);
      console.warn(`[Gemini Failover] Model ${model} returned ${response.status}. Trying next available model...`);
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Failover] Error on model ${model}:`, err.message);
    }
  }

  throw lastError || new Error('Không thể kết nối đến máy chủ Gemini API.');
}

export function getLanguageName(code) {
  const map = {
    vi: 'Tiếng Việt (Vietnamese)',
    en: 'Tiếng Anh (English)',
    ja: 'Tiếng Nhật (Japanese)',
    ko: 'Tiếng Hàn (Korean)',
    zh: 'Tiếng Trung (Chinese)',
    fr: 'Tiếng Pháp (French)',
    de: 'Tiếng Đức (German)',
    es: 'Tiếng Tây Ban Nha (Spanish)',
    ru: 'Tiếng Nga (Russian)'
  };
  return map[code] || code || 'Tiếng Anh (English)';
}

/**
 * 1. Smart Sentence Parser & Vocab Extractor
 */
export async function parseSentenceAI(sentence, apiKey = null, { targetLang = 'en', fluentLang = 'vi' } = {}) {
  const effectiveKey = getEffectiveApiKey(apiKey);
  const targetLangName = getLanguageName(targetLang);
  const fluentLangName = getLanguageName(fluentLang);

  if (!effectiveKey) {
    // Smart Offline Rule-based Parser Fallback
    const words = sentence
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 4);

    const offlinePatterns = [];
    const lower = sentence.toLowerCase();
    if (lower.includes('although') || lower.includes('despite') || lower.includes('tuy') || lower.includes('mặc dù')) {
      offlinePatterns.push({
        name: targetLang === 'vi' ? 'Tuy / Mặc dù (Nhượng bộ & Đối lập)' : 'Although / Despite (Concession & Contrast)',
        formula: targetLang === 'vi' ? 'Tuy / Mặc dù + Mệnh đề, nhưng + Mệnh đề chính' : 'Although + Clause, Main Clause',
        explanation: fluentLang === 'en' ? 'Expresses concession and contrast between two clauses.' : 'Diễn tả sự nhượng bộ, tương phản giữa hai mệnh đề.',
        category: 'concession',
        tone: 'Formal'
      });
    } else if (lower.includes('because') || lower.includes('due to') || lower.includes('vì') || lower.includes('do')) {
      offlinePatterns.push({
        name: targetLang === 'vi' ? 'Vì / Do... nên... (Nguyên nhân & Hệ quả)' : 'Due to / Cause & Effect',
        formula: targetLang === 'vi' ? 'Vì / Do + Nguyên nhân, nên + Kết quả' : 'Due to / As a result of + Noun Phrase, S + V',
        explanation: fluentLang === 'en' ? 'Indicates a direct cause-and-effect relationship.' : 'Chỉ mối quan hệ nguyên nhân - hệ quả trực tiếp.',
        category: 'cause_effect',
        tone: 'Daily'
      });
    }

    return {
      translation: `[${fluentLangName}] ${sentence}`,
      extracted_words: words.map(w => ({
        word: w.toLowerCase(),
        meaning: fluentLang === 'en' ? 'Look up dictionary for details' : 'Tra cứu thêm để cập nhật nghĩa',
        meaning_vi: fluentLang === 'en' ? 'Look up dictionary for details' : 'Tra cứu thêm để cập nhật nghĩa',
        part_of_speech: 'word',
        context_usage: `Context: "${sentence}"`
      })),
      patterns: offlinePatterns,
      grammar_notes: fluentLang === 'en'
        ? 'Add your Gemini API Key in Settings for deep AI pedagogical analysis.'
        : 'Hãy thêm Gemini API Key trong Cài đặt để AI bóc tách sâu hơn và tự động gợi ý ngữ pháp chuẩn bản xứ.'
    };
  }

  const prompt = `
Bạn là một chuyên gia ngôn ngữ học và sư phạm giảng dạy ngôn ngữ quốc tế.
Học viên đang theo học NGÔN NGỮ MỤC TIÊU: ${targetLangName} (Target Language).
Ngôn ngữ mẹ đẻ / thông thạo của học viên để giải nghĩa là: ${fluentLangName} (Native / Fluent Language).

Nhiệm vụ: Phân tích súc tích, chuẩn xác câu sau cho người học:
"${sentence}"

QUY TẮC BẮT BUỘC (TUÂN THỦ 100%):
1. ĐỊNH HƯỚNG BẢN DỊCH (translation):
   - Cung cấp bản dịch câu văn tự nhiên nhất sang ${fluentLangName}.
2. CẤU TRÚC CÂU (sentence_structure):
   - Tóm tắt cấu trúc ngữ pháp chính của câu, diễn giải bằng ${fluentLangName} (ví dụ: [S (ẩn)] + [V] + [O] + [Mệnh đề phụ...]).
3. MẪU CÂU TRỌNG TÂM (patterns):
   - "name": Tên mẫu câu / cấu trúc.
   - "formula": CÔNG THỨC MẪU CÂU BẮT BUỘC PHẢI DỰA TRÊN NGÔN NGỮ MỤC TIÊU (${targetLangName})!
     + Nếu đang học tiếng Việt: công thức phải là tiếng Việt (ví dụ: "Cảm ơn + [Người nhận] + vì đã + [Hành động]"), TUYỆT ĐỐI KHÔNG dùng công thức tiếng Anh như "Thank + for"!
     + Nếu đang học tiếng Anh: công thức là tiếng Anh (ví dụ: "Thank + [Object] + for + [V-ing / Noun]").
   - "explanation": Giải thích ngắn gọn cách dùng và ý nghĩa BẰNG ${fluentLangName}.
   - "category": Mã chức năng câu (chọn 1 trong các mã chuẩn hệ thống sau): cause_effect, concession, comparison, emphasis, purpose, condition, opinion, example, addition, conclusion, sequence, advice, clarification, exception, speculation, definition, request, transition.
   - "tone": Văn phong (Formal / Academic / Business / Daily / Neutral).
4. TỪ VỰNG TIÊU BIỂU (extracted_words):
   - "word": Từ vựng BẰNG NGÔN NGỮ MỤC TIÊU (${targetLangName}) lấy từ chính câu trên. Nếu học tiếng Việt, từ vựng phải là tiếng Việt (như "cảm ơn", "giúp đỡ"), KHÔNG ĐƯỢC đảo thành từ tiếng Anh ("thank", "help")!
   - "meaning": Nghĩa chuẩn xác của từ đó BẰNG ${fluentLangName}.
   - "part_of_speech": Từ loại (noun / verb / adjective / adverb / phrase...).
   - "context_usage": Cách dùng ngắn gọn trong câu bằng ${fluentLangName}.
5. LƯU Ý NGỮ PHÁP (grammar_notes):
   - Tóm tắt 1-2 điểm lưu ý ngữ pháp đặc trưng quan trọng nhất của câu BẰNG ${fluentLangName}.

Trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng:
{
  "translation": "Bản dịch tự nhiên sang ${fluentLangName}",
  "sentence_structure": "Tóm tắt cấu trúc ngữ pháp",
  "patterns": [
    {
      "name": "Tên cấu trúc",
      "formula": "Công thức chuẩn của ${targetLangName}",
      "explanation": "Giải thích cách dùng bằng ${fluentLangName}",
      "category": "cause_effect",
      "tone": "Daily"
    }
  ],
  "extracted_words": [
    {
      "word": "từ vựng ${targetLangName}",
      "meaning": "nghĩa bằng ${fluentLangName}",
      "part_of_speech": "verb",
      "context_usage": "cách dùng trong câu"
    }
  ],
  "grammar_notes": "Điểm lưu ý ngữ pháp bằng ${fluentLangName}"
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    const parsed = safeParseJson(rawResponse);
    if (parsed && Array.isArray(parsed.extracted_words)) {
      parsed.extracted_words = parsed.extracted_words.map(w => ({
        ...w,
        meaning_vi: w.meaning || w.meaning_vi || '',
        meaning_en: w.meaning || w.meaning_en || ''
      }));
    }
    return parsed;
  } catch (err) {
    console.error('AI parse error:', err.message);
    throw err;
  }
}


/**
 * 2. Check and Correct User's Custom Sentence
 */
export async function checkSentenceAI({ targetItem, userSentence }, apiKey = null, { targetLang = 'en', fluentLang = 'vi' } = {}) {
  const effectiveKey = getEffectiveApiKey(apiKey);
  const targetLangName = getLanguageName(targetLang);
  const fluentLangName = getLanguageName(fluentLang);

  if (!effectiveKey) {
    return {
      is_correct: true,
      score: 85,
      feedback: fluentLang === 'en'
        ? 'Your sentence looks quite solid. Add your Gemini API Key in Settings for deep native nuance feedback.'
        : 'Câu của bạn nghe khá ổn. Hãy thêm Gemini API Key để nhận nhận xét ngữ pháp và cách dùng từ bản xứ chuyên sâu.',
      corrections: [],
      native_alternatives: [
        userSentence
      ]
    };
  }

  const prompt = `
Bạn là chuyên gia khảo thí và biên tập viên ngôn ngữ ${targetLangName}.
Học viên đang thực hành viết câu bằng ${targetLangName} với từ/cấu trúc: "${targetItem}".
Ngôn ngữ mẹ đẻ / giải thích cho học viên là: ${fluentLangName}.

Câu do học viên tự viết: "${userSentence}"

Nhiệm vụ: Đánh giá độ chính xác ngữ pháp, ngữ nghĩa, mức độ tự nhiên của câu đối với ${targetLangName}.
MỌI nhận xét, giải thích lý do lỗi sai phải được viết bằng ${fluentLangName} để học viên hiểu rõ.
Các câu gợi ý tự nhiên hơn (native_alternatives) PHẢI được viết bằng ${targetLangName}.

Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json):
{
  "is_correct": true hoặc false,
  "score": 0-100 (điểm độ chính xác và độ tự nhiên),
  "feedback": "Nhận xét súc tích bằng ${fluentLangName} về ngữ pháp, sắc thái từ",
  "corrections": [
    {
      "error": "phần sai (nếu có)",
      "correction": "cách sửa chuẩn bằng ${targetLangName}",
      "reason": "giải thích lý do bằng ${fluentLangName}"
    }
  ],
  "native_alternatives": [
    "Cách viết 1 tự nhiên chuẩn bản xứ bằng ${targetLangName}",
    "Cách viết 2 trang trọng / tinh tế hơn bằng ${targetLangName}"
  ]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    return safeParseJson(rawResponse);
  } catch (err) {
    console.error('AI check sentence error:', err.message);
    throw err;
  }
}

/**
 * 3. Daily Story Weaver (SRS Retention Story)
 */
export async function generateStoryAI(wordsList = [], apiKey = null, { targetLang = 'en', fluentLang = 'vi' } = {}) {
  const targetLangName = getLanguageName(targetLang);
  const fluentLangName = getLanguageName(fluentLang);

  if (wordsList.length === 0) {
    return {
      title: fluentLang === 'en' ? 'No words due for review right now' : 'Hôm nay chưa có từ nào cần ôn tập',
      story_target: fluentLang === 'en' ? 'You have no words due for review right now. Keep up the good work!' : 'Bạn không có từ nào cần ôn lúc này. Tiếp tục phát huy nhé!',
      story_fluent: fluentLang === 'en' ? 'You have no words due for review right now. Keep up the good work!' : 'Bạn không có từ nào cần ôn lúc này. Tiếp tục phát huy nhé!',
      story_en: 'You have no words due for review right now. Keep up the good work!',
      story_vi: 'Bạn không có từ nào cần ôn lúc này. Tiếp tục phát huy nhé!',
      highlighted_words: []
    };
  }

  const wordsStr = wordsList.map(w => w.word || w).join(', ');
  const effectiveKey = getEffectiveApiKey(apiKey);

  if (!effectiveKey) {
    return {
      title: fluentLang === 'en' ? 'Spaced Memory Daily Story (Demo)' : 'Câu chuyện ôn tập hàng ngày (Bản demo)',
      story_target: `[${targetLangName}] Today let's review: ${wordsStr}.`,
      story_fluent: `[${fluentLangName}] Practice makes perfect with: ${wordsStr}.`,
      story_en: `Today, let's review these important words: ${wordsStr}.`,
      story_vi: `Hôm nay, hãy cùng ôn lại các từ: ${wordsStr}. (Thêm Gemini API Key trong Cài đặt để AI tự động sáng tác truyện cực hay).`,
      highlighted_words: wordsList.map(w => w.word || w)
    };
  }

  const prompt = `
Bạn là nhà văn và chuyên gia ghi nhớ ngắt quãng (Spaced Repetition).
Hãy sáng tác một câu chuyện ngắn hoặc đoạn văn lôi cuốn (khoảng 80-120 từ) BẰNG NGÔN NGỮ MỤC TIÊU: ${targetLangName}.
Đoạn văn PHẢI khéo léo lồng ghép các từ vựng sau đây của người học:
[${wordsStr}]

Hãy bọc các từ vựng này trong thẻ <b>từ_vựng</b> trong câu chuyện ${targetLangName}.
Cung cấp bản dịch đầy đủ sang ${fluentLangName} cho người học.

Trả về JSON với cấu trúc:
{
  "title": "Tiêu đề ngắn gọn của câu chuyện bằng ${fluentLangName}",
  "story_target": "Nội dung câu chuyện bằng ${targetLangName} có chứa các từ được bọc trong <b>...</b>",
  "story_fluent": "Bản dịch tự nhiên sang ${fluentLangName}",
  "highlighted_words": ["danh sách các từ đã dùng"]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    const parsed = safeParseJson(rawResponse);
    if (parsed) {
      parsed.story_en = targetLang === 'en' ? (parsed.story_target || parsed.story_en) : (parsed.story_fluent || parsed.story_en);
      parsed.story_vi = targetLang === 'vi' ? (parsed.story_target || parsed.story_vi) : (parsed.story_fluent || parsed.story_vi);
    }
    return parsed;
  } catch (err) {
    console.error('AI story generation error:', err.message);
    throw err;
  }
}

/**
 * 4. AI Paraphraser & Tone Polisher
 */
export async function paraphraseSentenceAI({ sentence, tone = 'business' }, apiKey = null, { targetLang = 'en', fluentLang = 'vi' } = {}) {
  const toneDescriptions = {
    business: 'Trang trọng, chuyên nghiệp, chuẩn mực công sở (Business Corporate)',
    academic: 'Học thuật, từ vựng nâng cao, mệnh đề phức và liên từ chuẩn mực (Academic)',
    casual: 'Tự nhiên, đời thường, lưu loát như người bản xứ (Natural Daily Conversation)',
    concise: 'Ngắn gọn, súc tích, lược bỏ từ thừa, đi thẳng vào trọng tâm (Concise & Direct)'
  };

  const selectedToneDesc = toneDescriptions[tone] || toneDescriptions.business;
  const effectiveKey = getEffectiveApiKey(apiKey);
  const targetLangName = getLanguageName(targetLang);
  const fluentLangName = getLanguageName(fluentLang);

  if (!effectiveKey) {
    return {
      original: sentence,
      tone,
      paraphrases: [
        {
          version: `[${selectedToneDesc}] ${sentence}`,
          explanation: fluentLang === 'en' ? 'Demo paraphrase version' : 'Cách diễn đạt mẫu',
          explanation_vi: 'Cách diễn đạt mẫu',
          key_phrases: [{ phrase: sentence, meaning: sentence, meaning_vi: sentence }]
        }
      ]
    };
  }

  const prompt = `
Bạn là chuyên gia ngôn ngữ học ${targetLangName} hàng đầu.
Người học có ngôn ngữ mẹ đẻ là ${fluentLangName}.
Hãy viết lại (paraphrase) câu sau BẰNG ${targetLangName} theo phong cách / văn phong: "${selectedToneDesc}".
Câu gốc: "${sentence}"

Cung cấp 3 phiên bản viết lại xuất sắc nhất từ tự nhiên đến nâng cao.
Mọi giải thích lý do hay và giải nghĩa cụm từ đắt giá PHẢI được viết BẰNG ${fluentLangName}.

Trả về JSON với cấu trúc:
{
  "original": "${sentence}",
  "tone": "${tone}",
  "paraphrases": [
    {
      "version": "Câu viết lại phiên bản 1 bằng ${targetLangName}",
      "explanation": "Giải thích ngắn gọn lý do tại sao phiên bản này hay bằng ${fluentLangName}",
      "explanation_vi": "Giải thích bằng ${fluentLangName}",
      "key_phrases": [
        {
          "phrase": "cụm từ hay được nâng cấp bằng ${targetLangName}",
          "meaning": "nghĩa bằng ${fluentLangName}",
          "meaning_vi": "nghĩa bằng ${fluentLangName}"
        }
      ]
    },
    {
      "version": "Câu viết lại phiên bản 2 bằng ${targetLangName}",
      "explanation": "Giải thích ngắn gọn bằng ${fluentLangName}",
      "explanation_vi": "Giải thích bằng ${fluentLangName}",
      "key_phrases": [
        {
          "phrase": "cụm từ hay bằng ${targetLangName}",
          "meaning": "nghĩa bằng ${fluentLangName}",
          "meaning_vi": "nghĩa bằng ${fluentLangName}"
        }
      ]
    },
    {
      "version": "Câu viết lại phiên bản 3 bằng ${targetLangName}",
      "explanation": "Giải thích ngắn gọn bằng ${fluentLangName}",
      "explanation_vi": "Giải thích bằng ${fluentLangName}",
      "key_phrases": [
        {
          "phrase": "cụm từ hay bằng ${targetLangName}",
          "meaning": "nghĩa bằng ${fluentLangName}",
          "meaning_vi": "nghĩa bằng ${fluentLangName}"
        }
      ]
    }
  ]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    return safeParseJson(rawResponse);
  } catch (err) {
    console.error('AI paraphrase error:', err.message);
    throw err;
  }
}

/**
 * 5. AI Collocation & Deep Idiom Explorer
 */
export async function exploreCollocationsAI(word, apiKey = null, { targetLang = 'en', fluentLang = 'vi' } = {}) {
  const effectiveKey = getEffectiveApiKey(apiKey);
  const targetLangName = getLanguageName(targetLang);
  const fluentLangName = getLanguageName(fluentLang);

  if (!effectiveKey) {
    return {
      target_word: word,
      phonetic: '/.../',
      word_type: targetLang === 'vi' ? 'từ vựng' : 'word',
      core_meaning: `Ý nghĩa chính của từ ${word}`,
      core_meaning_vi: `Ý nghĩa chính của từ ${word}`,
      collocations: [
        {
          pattern: 'Collocation Pattern',
          collocation: `${word}`,
          meaning: `${word}`,
          meaning_vi: `${word}`,
          example_target: `Ví dụ với ${word}`,
          example_fluent: `Dịch ví dụ của ${word}`,
          example_en: `Example with ${word}`,
          example_vi: `Ví dụ với ${word}`
        }
      ],
      idioms_and_phrasal_verbs: [],
      common_mistakes: []
    };
  }

  const prompt = `
Bạn là chuyên gia ngữ liệu học (Corpus Linguistics) và từ điển sống của ${targetLangName}.
Người học có ngôn ngữ mẹ đẻ / giải nghĩa là ${fluentLangName}.
Hãy phân tích chuyên sâu từ vựng: "${word}" (${targetLangName}).

Bóc tách các cụm từ kết hợp tự nhiên (Collocations), Thành ngữ / Quán ngữ cố định (Idioms / Set phrases) và các Lỗi sai người học hay mắc.
Mọi giải thích, nghĩa của từ và dịch ví dụ phải viết BẰNG ${fluentLangName}.

Trả về JSON với cấu trúc:
{
  "target_word": "${word}",
  "phonetic": "Phiên âm IPA hoặc ký âm phát âm của ${targetLangName}",
  "word_type": "Từ loại (danh từ, động từ...) bằng ${fluentLangName}",
  "core_meaning": "Nghĩa chuẩn xác bằng ${fluentLangName}",
  "core_meaning_vi": "Nghĩa chuẩn xác bằng ${fluentLangName}",
  "collocations": [
    {
      "pattern": "Mẫu kết hợp (ví dụ: Verb + Noun, Tính từ + Danh từ...)",
      "collocation": "cụm từ bằng ${targetLangName}",
      "meaning": "nghĩa của cả cụm bằng ${fluentLangName}",
      "meaning_vi": "nghĩa của cả cụm bằng ${fluentLangName}",
      "example_target": "Câu ví dụ thực tế sử dụng cụm này bằng ${targetLangName}",
      "example_fluent": "Dịch nghĩa câu ví dụ sang ${fluentLangName}",
      "example_en": "Câu ví dụ",
      "example_vi": "Dịch câu ví dụ"
    },
    {
      "pattern": "Mẫu kết hợp 2",
      "collocation": "cụm từ 2 bằng ${targetLangName}",
      "meaning": "nghĩa bằng ${fluentLangName}",
      "meaning_vi": "nghĩa bằng ${fluentLangName}",
      "example_target": "Câu ví dụ bằng ${targetLangName}",
      "example_fluent": "Dịch sang ${fluentLangName}",
      "example_en": "Câu ví dụ",
      "example_vi": "Dịch câu ví dụ"
    },
    {
      "pattern": "Mẫu kết hợp 3",
      "collocation": "cụm từ 3 bằng ${targetLangName}",
      "meaning": "nghĩa bằng ${fluentLangName}",
      "meaning_vi": "nghĩa bằng ${fluentLangName}",
      "example_target": "Câu ví dụ bằng ${targetLangName}",
      "example_fluent": "Dịch sang ${fluentLangName}",
      "example_en": "Câu ví dụ",
      "example_vi": "Dịch câu ví dụ"
    }
  ],
  "idioms_and_phrasal_verbs": [
    {
      "phrase": "thành ngữ / quán ngữ bằng ${targetLangName}",
      "meaning": "nghĩa bằng ${fluentLangName}",
      "meaning_vi": "nghĩa bằng ${fluentLangName}",
      "example_target": "Câu ví dụ sinh động bằng ${targetLangName}",
      "example_fluent": "Dịch câu ví dụ sang ${fluentLangName}",
      "example_en": "Câu ví dụ",
      "example_vi": "Dịch câu ví dụ"
    }
  ],
  "common_mistakes": [
    {
      "incorrect": "Cách dùng sai hoặc dịch thô người học hay mắc",
      "correct": "Cách diễn đạt chuẩn của người bản xứ ${targetLangName}",
      "explanation": "Giải thích vì sao sai bằng ${fluentLangName}",
      "explanation_vi": "Giải thích vì sao sai bằng ${fluentLangName}"
    }
  ]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    return safeParseJson(rawResponse);
  } catch (err) {
    console.error('AI collocation error:', err.message);
    throw err;
  }
}

/**
 * 6. AI Situational Dialogue & Roleplay Generator
 */
export async function generateSituationalDialogueAI({ scenario = 'job_interview', userWords = [] }, apiKey = null, { targetLang = 'en', fluentLang = 'vi' } = {}) {
  const scenarioNames = {
    job_interview: targetLang === 'vi' ? 'Phỏng vấn tuyển dụng công ty (Job Interview)' : 'Corporate Job Interview',
    salary_negotiation: targetLang === 'vi' ? 'Đàm phán lương thưởng & quyền lợi' : 'Salary & Compensation Negotiation',
    tech_standup: targetLang === 'vi' ? 'Họp công việc hàng ngày (Daily Standup)' : 'Agile Engineering Standup',
    business_meeting: targetLang === 'vi' ? 'Gặp gỡ và làm việc với đối tác' : 'Client Partnership Meeting',
    daily_casual: targetLang === 'vi' ? 'Trò chuyện cafe đời thường bạn bè' : 'Casual Coffee Chat with Colleague',
    travel_airport: targetLang === 'vi' ? 'Hỏi đường, du lịch & mua sắm' : 'Airport & Travel Emergency'
  };

  const scenarioTitle = scenarioNames[scenario] || scenario;
  const wordsStr = userWords.length > 0 ? userWords.join(', ') : (targetLang === 'vi' ? 'cảm ơn, giúp đỡ, hài lòng, phát triển' : 'resilient, eloquent, leverage, ubiquitous');
  const effectiveKey = getEffectiveApiKey(apiKey);
  const targetLangName = getLanguageName(targetLang);
  const fluentLangName = getLanguageName(fluentLang);

  if (!effectiveKey) {
    return {
      scenario_title: scenarioTitle,
      scenario_desc: `Bối cảnh: ${scenarioTitle}`,
      scenario_desc_vi: `Bối cảnh: ${scenarioTitle}`,
      roles: ['Speaker A', 'Speaker B'],
      integrated_words: userWords.slice(0, 2),
      dialogue: [
        {
          speaker: 'Speaker A',
          text_target: `[${targetLangName}] Hello! How are you today?`,
          text_fluent: `[${fluentLangName}] Xin chào! Bạn hôm nay thế nào?`,
          text_en: `Hello! How are you today?`,
          text_vi: `Xin chào! Bạn hôm nay thế nào?`,
          highlighted_word: userWords[0] || null
        }
      ],
      key_takeaways: []
    };
  }

  const prompt = `
Bạn là biên kịch và chuyên gia sư phạm giao tiếp ứng dụng ${targetLangName}.
Người học có ngôn ngữ mẹ đẻ / giải nghĩa là ${fluentLangName}.
Hãy tạo một đoạn hội thoại 2 chiều thực tế, tự nhiên và lôi cuốn (khoảng 4-6 lượt thoại) trong tình huống: "${scenarioTitle}".
Toàn bộ lời thoại giao tiếp PHẢI được viết BẰNG ${targetLangName}.
Kèm theo bản dịch nghĩa tự nhiên sang ${fluentLangName}.
Yêu cầu ĐẶC BIỆT: Hãy khéo léo lồng ghép các từ vựng sau đây của người học vào câu thoại: [${wordsStr}].

Trả về JSON với cấu trúc:
{
  "scenario_title": "${scenarioTitle}",
  "scenario_desc": "Mô tả ngắn gọn bối cảnh tình huống bằng ${fluentLangName}",
  "scenario_desc_vi": "Mô tả ngắn gọn bối cảnh tình huống bằng ${fluentLangName}",
  "roles": ["Người hỏi / Vai 1", "Người trả lời / Vai 2"],
  "integrated_words": ["danh sách các từ trong danh sách trên đã được lồng ghép"],
  "dialogue": [
    {
      "speaker": "Tên người nói",
      "text_target": "Câu thoại tự nhiên bằng ${targetLangName}",
      "text_fluent": "Bản dịch nghĩa tự nhiên sang ${fluentLangName}",
      "text_en": "Câu thoại bằng ${targetLangName}",
      "text_vi": "Bản dịch sang ${fluentLangName}",
      "highlighted_word": "từ vựng được lồng ghép trong câu này (nếu có, không có thì null)"
    }
  ],
  "key_takeaways": [
    {
      "phrase": "cụm từ hoặc mẫu câu giao tiếp đắt giá bằng ${targetLangName}",
      "meaning": "giải thích ý nghĩa bằng ${fluentLangName}",
      "meaning_vi": "giải thích ý nghĩa bằng ${fluentLangName}"
    }
  ]
}
`;

  try {
    const rawResponse = await callGemini(prompt, effectiveKey, null, null, true);
    const parsed = safeParseJson(rawResponse);
    if (parsed && Array.isArray(parsed.dialogue)) {
      parsed.dialogue = parsed.dialogue.map(d => ({
        ...d,
        text_en: targetLang === 'en' ? (d.text_target || d.text_en) : (d.text_fluent || d.text_en),
        text_vi: targetLang === 'vi' ? (d.text_target || d.text_vi) : (d.text_fluent || d.text_vi)
      }));
    }
    return parsed;
  } catch (err) {
    console.error('AI dialogue error:', err.message);
    throw err;
  }
}

/**
 * 8. AI Smart Contextual Quiz Generator (Biên soạn bài trắc nghiệm ngữ cảnh thực tế theo cấp độ IELTS)
 */
/**
 * 8. AI Smart Contextual Quiz Generator (Language-adaptive for English CEFR & Vietnamese VSL)
 */
export async function generateAIQuiz({ topic = 'All', count = 5, words = [], level = 'all', context_levels = null, mode = 'mixed', date_scope = 'all', date = null, start_date = null, end_date = null, userId = null, target_language = 'en', native_language = 'vi' }, apiKey = null) {
  const db = getDb();
  let candidateWords = [];
  let topicDisplay = 'Tất cả (All)';
  let allWords = [];

  const targetLang = target_language || 'en';
  const fluentLang = native_language || (targetLang === 'vi' ? 'en' : 'vi');
  const targetLangName = getLanguageName(targetLang);
  const fluentLangName = getLanguageName(fluentLang);

  if (words && words.length > 0) {
    candidateWords = words;
    allWords = words;
  } else {
    let q = 'SELECT id, word, meaning_vi, meaning_en, part_of_speech, examples, level, topic_id, created_at, user_id FROM words WHERE 1=1';
    const params = [];
    if (userId && userId !== 'admin_master_user_id') {
      q += ' AND user_id = ?';
      params.push(userId);
    }
    allWords = db.prepare(q).all(...params);
    const dateFiltered = filterItemsByDate(allWords, date_scope, date, start_date, end_date);
    const resolved = resolveTopics(db, topic);
    if (!resolved.isAll) {
      topicDisplay = resolved.displayNames.join(' + ');
      candidateWords = dateFiltered.filter(w => {
        const wTopicId = (w.topic_id || '').toLowerCase();
        return resolved.targetIds.includes(wTopicId);
      });
    } else {
      candidateWords = dateFiltered;
    }
    if (candidateWords.length === 0 && dateFiltered.length > 0) {
      candidateWords = dateFiltered;
    }
  }

  if (candidateWords.length === 0) {
    if (targetLang === 'vi') {
      candidateWords = [
        { id: 'sample_vi_1', word: 'xin chào', meaning_vi: 'Chào hỏi lịch sự', meaning_en: 'Hello / Greetings', level: 'A1', topic_id: 'vsl_tones' },
        { id: 'sample_vi_2', word: 'cảm ơn', meaning_vi: 'Bày tỏ lòng biết ơn', meaning_en: 'Thank you', level: 'A1', topic_id: 'vsl_tones' },
        { id: 'sample_vi_3', word: 'đồng nghiệp', meaning_vi: 'Người cùng làm việc', meaning_en: 'Colleague', level: 'B1', topic_id: 'vsl_workplace' },
        { id: 'sample_vi_4', word: 'tối ưu hóa', meaning_vi: 'Làm cho đạt hiệu quả cao nhất', meaning_en: 'Optimize', level: 'B2', topic_id: 'vsl_sino_vietnamese' },
        { id: 'sample_vi_5', word: 'bền bỉ', meaning_vi: 'Kiên trì lâu dài', meaning_en: 'Resilient / Persistent', level: 'B2', topic_id: 'vsl_workplace' }
      ];
    } else {
      candidateWords = [
        { id: 'sample_1', word: 'ubiquitous', meaning_vi: 'Có mặt ở khắp nơi', meaning_en: 'Present everywhere', level: 'C1', topic_id: 'daily' },
        { id: 'sample_2', word: 'resilience', meaning_vi: 'Sự kiên cường, phục hồi', meaning_en: 'Ability to recover', level: 'B2', topic_id: 'daily' },
        { id: 'sample_3', word: 'eloquent', meaning_vi: 'Lưu loát, có tài hùng biện', meaning_en: 'Fluent or persuasive', level: 'C2', topic_id: 'ielts' },
        { id: 'sample_4', word: 'pragmatic', meaning_vi: 'Thực tế, thực dụng', meaning_en: 'Dealing with things sensibly', level: 'B2', topic_id: 'daily' },
        { id: 'sample_5', word: 'meticulous', meaning_vi: 'Tỉ mỉ, trau chuốt', meaning_en: 'Showing great attention to detail', level: 'C1', topic_id: 'daily' }
      ];
    }
  }

  // Filter candidate words by Granular IELTS / VSL tier ONLY if explicitly requested
  if (level && level.startsWith('ielts_')) {
    const tierMap = {
      'ielts_4_5': ['A1', 'A2', 'B1'],
      'ielts_55_60': ['B1', 'B2'],
      'ielts_65_70': ['B2'],
      'ielts_75_80': ['B2', 'C1'],
      'ielts_85_90': ['C1', 'C2']
    };
    const allowed = tierMap[level] || [];
    const levelFiltered = candidateWords.filter(w => allowed.includes((w.level || '').toUpperCase()));
    if (levelFiltered.length > 0) {
      candidateWords = levelFiltered;
    }
  }

  const targetCount = Math.max(1, parseInt(count, 10) || 5);

  // Deduplicate candidate words by normalized word text
  const seenCandidate = new Set();
  const uniqueCandidates = [];
  for (const w of candidateWords) {
    const norm = (w.word || '').trim().toLowerCase();
    if (norm && !seenCandidate.has(norm)) {
      seenCandidate.add(norm);
      uniqueCandidates.push(w);
    }
  }

  const shuffled = [...uniqueCandidates].sort(() => 0.5 - Math.random());
  let selected = [];

  if (shuffled.length >= targetCount) {
    selected = shuffled.slice(0, targetCount);
  } else {
    selected = [...shuffled];
    while (selected.length < targetCount && uniqueCandidates.length > 0) {
      const nextRound = [...uniqueCandidates].sort(() => 0.5 - Math.random());
      for (const w of nextRound) {
        if (selected.length >= targetCount) break;
        selected.push(w);
      }
    }
  }

  // Parse multi-option context proficiency levels
  let activeContextLevels = [];
  if (Array.isArray(context_levels) && context_levels.length > 0) {
    activeContextLevels = context_levels.map(l => String(l).toLowerCase().trim()).filter(l => l && l !== 'all');
  } else if (typeof context_levels === 'string' && context_levels && context_levels !== 'all') {
    activeContextLevels = context_levels.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
  }
  if (activeContextLevels.length === 0) {
    activeContextLevels = ['a1_a2', 'b1', 'b2', 'c1_c2'];
  }

  const wordsInput = selected.map((w, idx) => {
    const posInfo = w.part_of_speech ? ` | Từ loại: ${w.part_of_speech}` : '';
    const meaningText = fluentLang === 'en' ? (w.meaning_en || w.meaning_vi || '') : (w.meaning_vi || w.meaning_en || '');
    return `Câu ${idx + 1}: Mục tiêu từ "${w.word}" (Nghĩa: ${meaningText}${posInfo})`;
  }).join('\n');

  const prompt = targetLang === 'vi' ? `
Bạn là Trưởng ban Khảo thí Tiếng Việt Quốc tế (VSL - Vietnamese as a Second Language Senior Examiner).
Học viên đang học Tiếng Việt (${targetLangName}), với ngôn ngữ mẹ đẻ là: ${fluentLangName}.
Hãy tạo đúng chính xác ${targetCount} câu hỏi trắc nghiệm tiếng Việt thông minh cho chủ đề "${topicDisplay}".

QUY TẮC BẮT BUỘC (TUÂN THỦ 100%):
1. VĂN BẢN CÂU HỎI:
   - Các câu hỏi phải là các câu văn tiếng Việt chuẩn mực, tự nhiên trong đời sống, văn hóa, công sở Việt Nam.
   - Dạng cloze_blank: Câu tiếng Việt có chỗ trống "_______" ở vị trí từ mục tiêu. 4 lựa chọn là các từ tiếng Việt cùng từ loại.
   - Dạng meaning_vi: Câu tiếng Việt hoàn chỉnh in đậm **từ vựng**, 4 lựa chọn là các nghĩa bằng ${fluentLangName}.
   - Dạng reverse_en: Câu tiếng Việt có chỗ trống "_______", prompt gợi ý nghĩa bằng ${fluentLangName}, 4 lựa chọn bằng tiếng Việt.
   - Dạng listening: Nghe phát âm từ tiếng Việt, 4 lựa chọn nghĩa bằng ${fluentLangName}.
2. MỌI GIẢI THÍCH (explanation) và BẢN DỊCH NGHĨA CÂU (translation) PHẢI ĐƯỢC VIẾT BẰNG ${fluentLangName} để học viên hiểu tường tận.
3. Tuyệt đối không tạo câu hỏi trùng lặp, câu văn phải đúng ngữ cảnh tự nhiên của tiếng Việt.

Danh sách mục tiêu từng câu:
${wordsInput}

Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ:
{
  "topic": "${topicDisplay}",
  "level": "${level}",
  "mode": "${mode}",
  "context_levels": ${JSON.stringify(activeContextLevels)},
  "questions": [
    {
      "id": "q1",
      "type": "cloze_blank",
      "word": "từ vựng mục tiêu",
      "context_level": "B1",
      "questionText": "Câu văn tiếng Việt có chỗ trống _______",
      "promptSubtitle": "Tiêu đề hướng dẫn",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option đúng",
      "explanation": "Giải thích chi tiết bằng ${fluentLangName}",
      "translation": "Bản dịch nghĩa câu sang ${fluentLangName}"
    }
  ]
}
` : `
Bạn là chuyên gia khảo thí tiếng Anh (IELTS/ETS Senior Examiner).
Học viên đang học Tiếng Anh (${targetLangName}), ngôn ngữ mẹ đẻ là: ${fluentLangName}.
Hãy tạo đúng chính xác ${targetCount} câu hỏi trắc nghiệm tiếng Anh thông minh cho chủ đề "${topicDisplay}".

Danh sách mục tiêu từng câu:
${wordsInput}

YÊU CẦU:
1. Mọi câu hỏi đều là câu văn tiếng Anh học thuật / thực tế chuẩn mực.
2. Dạng cloze_blank: câu tiếng Anh có chỗ trống _______, 4 lựa chọn tiếng Anh cùng từ loại.
3. Dạng meaning_vi: câu tiếng Anh in đậm **từ vựng**, 4 lựa chọn nghĩa bằng ${fluentLangName}.
4. Mọi giải thích ngữ pháp (explanation) và bản dịch câu (translation) viết bằng ${fluentLangName}.

Trả về JSON với cấu trúc:
{
  "topic": "${topicDisplay}",
  "level": "${level}",
  "mode": "${mode}",
  "context_levels": ${JSON.stringify(activeContextLevels)},
  "questions": [
    {
      "id": "q1",
      "type": "cloze_blank",
      "word": "từ vựng mục tiêu",
      "context_level": "B1",
      "questionText": "Câu văn tiếng Anh có chỗ trống _______",
      "promptSubtitle": "Tiêu đề hướng dẫn",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option đúng",
      "explanation": "Giải thích chi tiết bằng ${fluentLangName}",
      "translation": "Bản dịch nghĩa câu sang ${fluentLangName}"
    }
  ]
}
`;

  const startTime = Date.now();
  try {
    const rawResponse = await callGemini(prompt, apiKey, null, null, true);
    const parsed = safeParseJson(rawResponse);
    let randomizedQuestions = normalizeAndRandomizeQuestions(parsed, 'ai_vocab');
    const generationTimeMs = Date.now() - startTime;

    if (randomizedQuestions.length < targetCount) {
      const needed = targetCount - randomizedQuestions.length;
      try {
        const backfill = quizService.generateQuiz({
          topic,
          count: needed,
          mode,
          level,
          context_levels,
          date_scope,
          date,
          start_date,
          end_date,
          userId,
          target_language: targetLang
        });
        if (backfill && Array.isArray(backfill.questions)) {
          const existingIds = new Set(randomizedQuestions.map(q => q.id));
          for (const bq of backfill.questions) {
            if (randomizedQuestions.length >= targetCount) break;
            const newId = existingIds.has(bq.id) ? `ai_backfill_${randomizedQuestions.length + 1}` : bq.id;
            randomizedQuestions.push({
              ...bq,
              id: newId
            });
          }
        }
      } catch (backfillErr) {
        console.warn('[AI Quiz Backfill Warning]:', backfillErr.message);
      }
    }

    if (randomizedQuestions.length > targetCount) {
      randomizedQuestions = randomizedQuestions.slice(0, targetCount);
    }

    if (randomizedQuestions && randomizedQuestions.length > 0) {
      return {
        topic: (parsed && parsed.topic) || topicDisplay || 'AI Smart Quiz',
        level: (parsed && parsed.level) || level || 'all',
        mode: (parsed && parsed.mode) || mode || 'mixed',
        isAiGenerated: true,
        generationTimeMs,
        totalQuestions: randomizedQuestions.length,
        questions: randomizedQuestions
      };
    }
    throw new Error('Dữ liệu câu hỏi từ AI không đúng cấu trúc.');
  } catch (err) {
    console.error('AI Quiz error:', err.message);
    throw err;
  }
}

/**
 * 9. AI Smart Pattern Quiz Generator (Biên soạn bài trắc nghiệm mẫu câu & cấu trúc chuyên sâu bằng AI)
 */
export async function generateAIPatternQuiz({ category = 'all', tone = 'all', count = 5, level = 'all', mode = 'mixed', date_scope = 'all', date = null, userId = null, target_language = 'en', native_language = 'vi' }, apiKey = null) {
  const db = getDb();
  const targetLang = target_language || 'en';
  const fluentLang = native_language || (targetLang === 'vi' ? 'en' : 'vi');
  const targetLangName = getLanguageName(targetLang);
  const fluentLangName = getLanguageName(fluentLang);

  let q = 'SELECT id, name, formula, explanation, meaning_vi, category, tone, examples, created_at, user_id FROM patterns WHERE 1=1';
  const params = [];
  if (userId && userId !== 'admin_master_user_id') {
    q += ' AND user_id = ?';
    params.push(userId);
  }
  let patterns = db.prepare(q).all(...params);

  if (patterns.length === 0) {
    // If user patterns empty, load system patterns for target track
    patterns = db.prepare('SELECT id, name, formula, explanation, meaning_vi, category, tone, examples, created_at FROM patterns').all();
  }

  if (patterns.length === 0) {
    throw new Error('Kho mẫu câu đang trống. Vui lòng thêm mẫu câu trước khi tạo Quiz AI!');
  }

  patterns = filterItemsByDate(patterns, date_scope, date);
  if (patterns.length === 0) {
    throw new Error('Không có mẫu câu nào trong phạm vi ngày đã chọn!');
  }

  const targetCount = Math.max(1, parseInt(count, 10) || 5);
  const filterTarget = (category && category !== 'all') ? category : tone;
  let candidatePatterns = patterns;
  if (filterTarget && filterTarget !== 'all') {
    const filtered = patterns.filter(p => 
      (p.category || '').toLowerCase() === filterTarget.toLowerCase() ||
      (p.tone || '').toLowerCase().includes(filterTarget.toLowerCase())
    );
    if (filtered.length > 0) candidatePatterns = filtered;
  }

  // Deduplicate candidate patterns by normalized name
  const seenCandidatePatterns = new Set();
  const uniqueCandidatePatterns = [];
  for (const p of candidatePatterns) {
    const norm = (p.name || '').trim().toLowerCase();
    if (norm && !seenCandidatePatterns.has(norm)) {
      seenCandidatePatterns.add(norm);
      uniqueCandidatePatterns.push(p);
    }
  }

  let selected = [];
  const shuffled = [...uniqueCandidatePatterns].sort(() => 0.5 - Math.random());
  if (shuffled.length >= targetCount) {
    selected = shuffled.slice(0, targetCount);
  } else {
    selected = [...shuffled];
    const seenSelected = new Set(selected.map(p => (p.name || '').trim().toLowerCase()));
    const otherPatterns = patterns.filter(p => {
      const norm = (p.name || '').trim().toLowerCase();
      return norm && !seenSelected.has(norm);
    });
    const uniqueOther = [];
    for (const p of otherPatterns) {
      const norm = (p.name || '').trim().toLowerCase();
      if (norm && !seenSelected.has(norm)) {
        seenSelected.add(norm);
        uniqueOther.push(p);
      }
    }
    uniqueOther.sort(() => 0.5 - Math.random());
    const needed = targetCount - selected.length;
    selected.push(...uniqueOther.slice(0, needed));
  }

  const patternsInput = selected.map((p, idx) => `Câu ${idx + 1}: Mẫu câu "${p.name}" (Công thức: ${p.formula} | Nghĩa/Giải thích: ${p.explanation || p.meaning_vi || ''} | Chức năng: ${p.category})`).join('\n');

  const prompt = targetLang === 'vi' ? `
Bạn là chuyên gia sư phạm & khảo thí Ngữ pháp Tiếng Việt Quốc tế.
Học viên đang học mẫu câu Tiếng Việt (${targetLangName}), ngôn ngữ mẹ đẻ là: ${fluentLangName}.
Hãy tạo đúng chính xác ${targetCount} câu hỏi trắc nghiệm chuyên sâu về MẪU CÂU & CẤU TRÚC NGỮ PHÁP TIẾNG VIỆT (Sentence Patterns & Structures).

Danh sách mẫu câu mục tiêu từng câu:
${patternsInput}

YÊU CẦU:
1. Mỗi câu hỏi kiểm tra cách ứng dụng thực tế của mẫu câu trong câu văn tiếng Việt hoàn chỉnh.
2. Tạo chỗ trống "_______" ở vị trí từ nối / cặp liên từ / hư từ đặc trưng của mẫu câu tiếng Việt.
3. Cung cấp 4 lựa chọn (options) bằng tiếng Việt: 1 đáp án chuẩn xác và 3 đáp án gây nhiễu hợp lý.
4. Cung cấp giải thích chi tiết quy tắc ngữ pháp (explanation) và dịch nghĩa cả câu (translation) BẰNG ${fluentLangName}.

Trả về JSON:
{
  "topic": "🧩 Quiz Cấu Trúc Câu Tiếng Việt (AI)",
  "isPatternQuiz": true,
  "level": "${level}",
  "questions": [
    {
      "id": "pq1",
      "type": "pattern_context",
      "isPattern": true,
      "word": "Tên mẫu câu",
      "questionText": "Câu văn tiếng Việt có chỗ trống _______",
      "promptSubtitle": "Điền cấu trúc ngữ pháp chuẩn xác vào ngữ cảnh:",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option đúng",
      "explanation": "Giải thích chi tiết bằng ${fluentLangName}",
      "translation": "Bản dịch nghĩa câu sang ${fluentLangName}"
    }
  ]
}
` : `
Bạn là chuyên gia luyện thi ngữ pháp & viết luận tiếng Anh (IELTS Academic / GRE / Cambridge).
Học viên đang học Tiếng Anh (${targetLangName}), ngôn ngữ mẹ đẻ là: ${fluentLangName}.
Hãy tạo đúng chính xác ${targetCount} câu hỏi trắc nghiệm chuyên sâu về MẪU CÂU & CẤU TRÚC NGỮ PHÁP TIẾNG ANH.

Danh sách mẫu câu mục tiêu từng câu:
${patternsInput}

YÊU CẦU:
1. Mỗi câu hỏi kiểm tra cách ứng dụng thực tế của mẫu câu trong câu văn tiếng Anh học thuật.
2. Tạo chỗ trống "_______" ở vị trí vế đảo ngữ / liên từ / dạng chia động từ đặc trưng của mẫu câu.
3. Cung cấp 4 lựa chọn tiếng Anh: 1 đáp án chuẩn ngữ pháp và 3 đáp án gây nhiễu.
4. Cung cấp giải thích chi tiết (explanation) và dịch nghĩa câu (translation) BẰNG ${fluentLangName}.

Trả về JSON:
{
  "topic": "🧩 Quiz Cấu Trúc Câu Chuyên Sâu (AI)",
  "isPatternQuiz": true,
  "level": "${level}",
  "questions": [
    {
      "id": "pq1",
      "type": "pattern_context",
      "isPattern": true,
      "word": "Tên mẫu câu",
      "questionText": "Câu văn tiếng Anh học thuật có chỗ trống _______",
      "promptSubtitle": "Điền cấu trúc ngữ pháp chuẩn xác vào ngữ cảnh:",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option đúng",
      "explanation": "Giải thích chi tiết bằng ${fluentLangName}",
      "translation": "Bản dịch nghĩa câu sang ${fluentLangName}"
    }
  ]
}
`;

  const startTime = Date.now();
  try {
    const rawResponse = await callGemini(prompt, apiKey, null, null, true);
    const parsed = safeParseJson(rawResponse);
    let randomizedQuestions = normalizeAndRandomizeQuestions(parsed, 'ai_pattern');
    const generationTimeMs = Date.now() - startTime;

    if (randomizedQuestions.length < targetCount) {
      const needed = targetCount - randomizedQuestions.length;
      try {
        const backfill = quizService.generatePatternQuiz({
          category,
          tone,
          count: needed,
          level,
          mode,
          date_scope,
          date
        });
        if (backfill && Array.isArray(backfill.questions)) {
          const existingIds = new Set(randomizedQuestions.map(q => q.id));
          for (const bq of backfill.questions) {
            if (randomizedQuestions.length >= targetCount) break;
            const newId = existingIds.has(bq.id) ? `ai_pattern_backfill_${randomizedQuestions.length + 1}` : bq.id;
            randomizedQuestions.push({
              ...bq,
              id: newId
            });
          }
        }
      } catch (backfillErr) {
        console.warn('[AI Pattern Quiz Backfill Warning]:', backfillErr.message);
      }
    }

    if (randomizedQuestions.length > targetCount) {
      randomizedQuestions = randomizedQuestions.slice(0, targetCount);
    }

    if (randomizedQuestions && randomizedQuestions.length > 0) {
      return {
        topic: (parsed && parsed.topic) || '🧩 Quiz Cấu Trúc Câu Chuyên Sâu (AI)',
        isPatternQuiz: true,
        level: (parsed && parsed.level) || level || 'all',
        mode: (parsed && parsed.mode) || mode || 'mixed',
        isAiGenerated: true,
        generationTimeMs,
        totalQuestions: randomizedQuestions.length,
        questions: randomizedQuestions
      };
    }
    throw new Error('Dữ liệu câu hỏi cấu trúc từ AI không đúng cấu trúc.');
  } catch (err) {
    console.error('AI Pattern Quiz error:', err.message);
    throw err;
  }
}

// High-Speed In-Memory Cache for Contextual Translations (0ms instant hits)
const contextTranslationCache = new Map();
const MAX_CONTEXT_CACHE_SIZE = 2000;

export async function translateInContextAI({ text, contextSentence = '', articleTitle = '', articleTopic = 'General', targetLang = 'en', fluentLang = 'vi' }, apiKey = null) {
  const cleanWord = (text || '').trim();
  const cleanSentence = (contextSentence || '').trim();
  const targetLangName = getLanguageName(targetLang);
  const fluentLangName = getLanguageName(fluentLang);
  const cacheKey = `${targetLang}:::${fluentLang}:::${cleanWord.toLowerCase()}:::${cleanSentence.toLowerCase()}:::${(articleTopic || '').toLowerCase()}`;

  // 1. Check in-memory cache for 0ms instant response
  if (contextTranslationCache.has(cacheKey)) {
    return contextTranslationCache.get(cacheKey);
  }

  const prompt = `
Bạn là từ điển ngữ cảnh và chuyên gia phân tích từ vựng ngôn ngữ ${targetLangName}.
Người đọc đang học ${targetLangName}, và cần dịch / giải nghĩa bằng ${fluentLangName}.

Từ cần tra: "${cleanWord}" (${targetLangName})
Câu văn chứa từ: "${cleanSentence || cleanWord}"
Chủ đề bài đọc: "${articleTopic || 'General'}" - "${articleTitle || ''}"

Trả về DUY NHẤT một chuỗi JSON hợp lệ:
{
  "targetText": "${cleanWord}",
  "phonetic": "/.../",
  "partOfSpeech": "verb | noun | adjective | adverb | idiom | phrase",
  "contextualMeaning": "Nghĩa chuẩn xác trong câu này bằng ${fluentLangName}",
  "contextExplanation": "Giải thích ngắn gọn sắc thái hoặc ngữ cảnh bằng ${fluentLangName}",
  "overallSentence": "Bản dịch tự nhiên của cả câu chứa từ sang ${fluentLangName}",
  "collocations": ["cụm từ 1", "cụm từ 2"],
  "synonyms": ["từ đồng nghĩa 1", "từ đồng nghĩa 2"],
  "level": "B1 | B2 | C1 | C2"
}`;

  try {
    const rawResponse = await callGemini(prompt, apiKey, null, 'gemini-2.5-flash', true);
    const parsed = safeParseJson(rawResponse);
    if (parsed && (parsed.contextualMeaning || parsed.contextualMeaningVi || parsed.overallSentence || parsed.overallSentenceVi)) {
      const result = {
        targetText: parsed.targetText || cleanWord,
        phonetic: parsed.phonetic || '',
        partOfSpeech: parsed.partOfSpeech || parsed.part_of_speech || 'noun',
        contextualMeaning: parsed.contextualMeaning || parsed.contextualMeaningVi || 'Nghĩa ngữ cảnh',
        contextualMeaningVi: parsed.contextualMeaning || parsed.contextualMeaningVi || 'Nghĩa ngữ cảnh',
        contextExplanation: parsed.contextExplanation || parsed.explanation || '',
        overallSentence: parsed.overallSentence || parsed.overallSentenceVi || '',
        overallSentenceVi: parsed.overallSentence || parsed.overallSentenceVi || '',
        collocations: parsed.collocations || [],
        synonyms: parsed.synonyms || [],
        level: parsed.level || 'B2'
      };

      if (contextTranslationCache.size >= MAX_CONTEXT_CACHE_SIZE) {
        const firstKey = contextTranslationCache.keys().next().value;
        contextTranslationCache.delete(firstKey);
      }
      contextTranslationCache.set(cacheKey, result);

      return result;
    }
    throw new Error('Không thể phân tích ngữ cảnh từ');
  } catch (err) {
    console.error('Translate In Context AI Error:', err.message);
    throw err;
  }
}




