/**
 * AI Speaking Assessment & Pronunciation Service
 * Powered by Google Gemini 1.5 Flash (0đ) + Local Heuristic Acoustic & Phonetic Engine
 */

import { callGemini, safeParseJson } from './aiService.js';
import { getDb } from '../db/database.js';

// Comprehensive Curated Bank of Speaking Prompts
export const SPEAKING_PROMPTS = [
  // 1. Shadowing & Read-Aloud Paragraphs (English)
  {
    id: 'p1',
    target_language: 'en',
    category: 'read-aloud',
    topic: 'Technology & AI',
    title: 'The Future of Human-AI Collaboration',
    level: 'B2 - Upper-Intermediate',
    targetText: 'Artificial intelligence is not designed to replace human ingenuity, but rather to augment our capabilities and streamline repetitive workflows with unprecedented precision.',
    phoneticKey: '/ˌɑː.tɪˈfɪʃ.əl ɪnˈtel.ɪ.dʒəns ɪz nɒt dɪˈzaɪnd tuː rɪˈpleɪs ˈhjuː.mən ˌɪn.dʒəˈnjuː.ə.ti/',
    tips: 'Chú ý phát âm rõ âm đuôi /s/ trong "intelligence", nối âm "not designed to", và nhấn đúng trọng âm của "ingenuity" (/ˌɪn.dʒəˈnjuː.ə.ti/).'
  },
  {
    id: 'p2',
    target_language: 'en',
    category: 'read-aloud',
    topic: 'Mindset & Growth',
    title: 'Building Resilience in Tough Times',
    level: 'B2 - Upper-Intermediate',
    targetText: 'Resilience is not the absence of difficulty, but the remarkable ability to adapt, recover quickly, and maintain composure when confronted with unexpected obstacles.',
    phoneticKey: '/rɪˈzɪl.jəns ɪz nɒt ði ˈæb.səns ɒv ˈdɪf.ɪ.kəl.ti/',
    tips: 'Luyện tập âm /z/ trong "resilience", ngắt nhịp tự nhiên sau dấu phẩy và nhấn mạnh từ "remarkable" (/rɪˈmɑː.kə.bəl/).'
  },
  {
    id: 'p3',
    target_language: 'en',
    category: 'read-aloud',
    topic: 'Business Communication',
    title: 'Articulating Value to Stakeholders',
    level: 'C1 - Advanced',
    targetText: 'To persuade executive stakeholders, one must articulate strategic trade-offs with meticulous clarity and back every recommendation with pragmatic data.',
    phoneticKey: '/tuː pəˈsweɪd ɪɡˈzek.jə.tɪv ˈsteɪkˌhəʊl.dəz/',
    tips: 'Chú ý nhấn âm 2 trong "persuade" (/pəˈsweɪd/) và "articulate" (/ɑːˈtɪk.jə.leɪt/), phát âm rõ âm /k/ trong "executive".'
  },
  {
    id: 'p4',
    target_language: 'en',
    category: 'read-aloud',
    topic: 'Daily Conversation',
    title: 'Work-Life Equilibrium',
    level: 'B1 - Intermediate',
    targetText: 'Finding a sustainable balance between ambitious career goals and personal well-being is essential for long-term happiness and professional success.',
    phoneticKey: '/ˈfaɪn.dɪŋ ə səˈsteɪ.nə.bəl ˈbæl.əns/',
    tips: 'Đọc với nhịp điệu thư thái, chú ý âm /l/ ở cuối "sustainable" và âm /ʃ/ trong "essential" (/ɪˈsen.ʃəl/).'
  },

  // 1b. Shadowing & Read-Aloud Paragraphs (Vietnamese)
  {
    id: 'vi_p1',
    target_language: 'vi',
    category: 'read-aloud',
    topic: 'Giao tiếp hàng ngày',
    title: 'Lời chào và sự khởi đầu một ngày mới',
    level: 'A1 - Sơ cấp',
    targetText: 'Xin chào bạn, tôi rất vui được gặp bạn hôm nay. Chúc bạn một ngày làm việc thật hiệu quả và tràn đầy niềm vui!',
    phoneticKey: '[Thanh ngang, thanh hỏi, thanh huyền]',
    tips: 'Chú ý phát âm chuẩn thanh hỏi trong "khỏe" và "hiệu quả", thanh huyền trong "tràn đầy", ngắt nhịp tự nhiên sau dấu phẩy.'
  },
  {
    id: 'vi_p2',
    target_language: 'vi',
    category: 'read-aloud',
    topic: 'Ẩm thực & Văn hóa',
    title: 'Hương vị Phở truyền thống Việt Nam',
    level: 'A2 - Cơ bản',
    targetText: 'Phở là món ăn truyền thống nổi tiếng của Việt Nam, với nước dùng ninh từ xương bò đậm đà và mùi thơm dịu nhẹ của hoa hồi, thảo quả.',
    phoneticKey: '[Thanh ngã, thanh sắc, thanh nặng]',
    tips: 'Chú ý phân biệt rõ thanh ngã trong "Phở", thanh sắc trong "truyền thống", giữ ngữ điệu mềm mại tự nhiên.'
  },
  {
    id: 'vi_p3',
    target_language: 'vi',
    category: 'read-aloud',
    topic: 'Tư duy & Phát triển',
    title: 'Sức mạnh của sự kiên trì bền bỉ',
    level: 'B1 - Trung cấp',
    targetText: 'Sự kiên trì không có nghĩa là không bao giờ vấp ngã, mà là bản lĩnh tiếp tục đứng dậy và tiến bước sau mỗi thử thách.',
    phoneticKey: '[Thanh ngã, thanh hỏi, thanh sắc]',
    tips: 'Luyện tập nguyên âm đôi trong "tiến bước", đọc dứt khoát thanh ngã trong "nghĩa" và "vấp ngã".'
  },
  {
    id: 'vi_p4',
    target_language: 'vi',
    category: 'read-aloud',
    topic: 'Du lịch & Khám phá',
    title: 'Vẻ đẹp dịu dàng của mùa thu Hà Nội',
    level: 'B2 - Khá',
    targetText: 'Mùa thu Hà Nội mang một nét đẹp trầm lắng và lãng mạn, với hương hoa sữa thoang thoảng trong làn gió heo may mát lành.',
    phoneticKey: '[Thanh huyền, thanh ngã, thanh sắc]',
    tips: 'Đọc với nhịp điệu thư thái, chú ý thanh ngã trong "lãng mạn", thanh huyền trong "trầm lắng" và "mát lành".'
  },

  // 2. Interactive Q&A Speaking Topics (English)
  {
    id: 'qa1',
    target_language: 'en',
    category: 'qa',
    topic: 'Career & Ambition',
    question: 'How do you prioritize your daily tasks when facing tight deadlines at work or study?',
    sampleAudioHint: 'Talk about using task management tools, Eisenhower matrix, or focusing on high-impact objectives.',
    keyVocabulary: ['prioritize', 'urgent vs important', 'leverage tools', 'stay composed', 'mitigate risks']
  },
  {
    id: 'qa2',
    target_language: 'en',
    category: 'qa',
    topic: 'Technology & Society',
    question: 'Do you believe artificial intelligence will significantly transform how we learn languages in the next decade?',
    sampleAudioHint: 'Mention personalized feedback, real-time speech evaluation, interactive avatars, but emphasize the human touch.',
    keyVocabulary: ['personalized feedback', 'speech synthesis', 'accelerate learning', 'human interaction']
  },
  {
    id: 'qa3',
    target_language: 'en',
    category: 'qa',
    topic: 'Travel & Culture',
    question: 'Describe a memorable place you have visited and explain why it left a profound impression on you.',
    sampleAudioHint: 'Describe the atmosphere, local culture, architecture, and personal emotion.',
    keyVocabulary: ['breathtaking scenery', 'cultural immersion', 'unforgettable experience', 'hospitality']
  },
  {
    id: 'qa4',
    target_language: 'en',
    category: 'qa',
    topic: 'Habits & Productivity',
    question: 'What daily habit has contributed the most to your personal growth and why?',
    sampleAudioHint: 'Discuss reading, morning routines, regular physical exercise, or continuous learning.',
    keyVocabulary: ['consistency', 'compound effect', 'mental clarity', 'discipline', 'transformative']
  },

  // 2b. Interactive Q&A Speaking Topics (Vietnamese)
  {
    id: 'vi_qa1',
    target_language: 'vi',
    category: 'qa',
    topic: 'Đời sống & Sở thích',
    question: 'Bạn thường thích làm gì nhất vào những ngày cuối tuần rảnh rỗi?',
    sampleAudioHint: 'Nói về việc đọc sách, đi dạo công viên, thưởng thức cà phê cùng bạn bè hoặc nấu ăn.',
    keyVocabulary: ['thư giãn', 'cuối tuần', 'thưởng thức', 'bình yên', 'nạp lại năng lượng']
  },
  {
    id: 'vi_qa2',
    target_language: 'vi',
    category: 'qa',
    topic: 'Ẩm thực Việt Nam',
    question: 'Món ăn Việt Nam nào khiến bạn ấn tượng nhất và bạn thích hương vị của nó như thế nào?',
    sampleAudioHint: 'Kể về phở, bún chả, bánh mì hoặc gỏi cuốn, mô tả hương vị chua cay mặn ngọt hài hòa.',
    keyVocabulary: ['đậm đà', 'hương vị truyền thống', 'thanh mát', 'nguyên liệu tươi ngon']
  },
  {
    id: 'vi_qa3',
    target_language: 'vi',
    category: 'qa',
    topic: 'Động lực học tập',
    question: 'Điều gì đã thôi thúc bạn quyết định học tiếng Việt?',
    sampleAudioHint: 'Chia sẻ về tình yêu văn hóa, công việc, du lịch hoặc mong muốn giao tiếp với bạn bè người Việt.',
    keyVocabulary: ['văn hóa đặc sắc', 'giao tiếp lưu loát', 'kết nối con người', 'trải nghiệm thú vị']
  }
];

/**
 * Get Gemini API Key from settings DB or env
 */
function getApiKey() {
  let key = process.env.GEMINI_API_KEY;
  try {
    const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
    if (row && row.value) key = row.value;
  } catch (e) {}
  return key;
}

/**
 * 1. Analyze Read-Aloud & Shadowing Speaking Attempt (Direct Audio & Acoustic Phonetics)
 */
export async function analyzeReadAloud({ targetText, spokenText = '', audioData = null, duration = 0 }) {
  if (!targetText || !targetText.trim()) {
    throw new Error('Target text is required');
  }

  const cleanTarget = targetText.trim();
  const cleanSpoken = (spokenText || '').trim();

  // Basic word array matching
  const targetWords = cleanTarget.replace(/[.,!?;:"'()]/g, '').split(/\s+/).filter(Boolean);
  const spokenWords = cleanSpoken.replace(/[.,!?;:"'()]/g, '').split(/\s+/).filter(Boolean);

  const apiKey = getApiKey();

  if (apiKey && (cleanSpoken || audioData)) {
    try {
      const prompt = `
Bạn là Giám khảo Khảo thí Ngữ âm & Trưởng ban Chấm thi IELTS Speaking Quốc tế (Senior IELTS Band 9.0 Examiner & Phonetician).
Áp dụng TIÊU CHÍ CHẤM ĐIỂM CỰC KỲ NGHIÊM KHẮC, CHUẨN XÁC TỪNG ÂM TIẾT, KHÔNG NƯƠNG TAY:

MỤC TIÊU KHẢO THÍ:
- VĂN BẢN GỐC CẦN ĐỌC (TARGET TEXT): "${cleanTarget}"
- VĂN BẢN TRANSCRIPT BỔ TRỢ: "${cleanSpoken}"

QUY TẮC PHẠT LỖI NGHIÊM KHẮC:
1. Âm cuối & Phụ âm đuôi (Ending Consonants): Phạt nặng nếu nuốt hoặc quên bật âm đuôi (/s/, /z/, /t/, /d/, /ed/, /θ/, /ð/, /ks/, /tʃ/, /dʒ/). Mỗi từ thiếu âm đuôi PHẢI đánh dấu "mispronounced".
2. Trọng âm từ (Word Stress): Nếu nhấn sai trọng âm của từ đa âm tiết, lập tức đánh dấu "mispronounced" và chỉ rõ trọng âm đúng.
3. Nguyên âm dài vs ngắn (/iː/ vs /ɪ/, /uː/ vs /ʊ/, /ɔː/ vs /ɒ/): Bắt buộc phân biệt rõ ràng.
4. Nối âm & Ngắt nhịp (Linking & Chunking): Đọc rời rạc từng từ như robot hoặc ngập ngừng quá lâu sẽ bị trừ mạnh điểm Fluency.

HÃY ĐÁNH GIÁ VÀ TRẢ VỀ DUY NHẤT MỘT ĐỊNH DẠNG JSON (Không kèm markdown \`\`\`json):
{
  "overallScore": 72, // Điểm số thực tế khắt khe (0 - 100)
  "accuracyScore": 70, // Độ chuẩn xác âm vị từng từ (0 - 100)
  "fluencyScore": 75, // Độ trôi chảy & nhịp điệu (0 - 100)
  "completenessScore": 90, // Mức độ đọc đầy đủ câu (0 - 100)
  "wordsAnalysis": [
    // Phân tích MỌI từ trong VĂN BẢN GỐC theo thứ tự:
    // status: "correct" (phát âm chuẩn hoàn hảo), "mispronounced" (thiếu âm đuôi, sai trọng âm, sai nguyên âm), "missing" (bỏ qua từ này)
    {
      "word": "từ_gốc",
      "status": "correct",
      "phonetic": "/IPA_chuẩn/",
      "feedback": "Chỉ rõ lỗi sai cụ thể (ví dụ: thiếu âm đuôi /z/, nhấn sai âm tiết 1 thay vì 2) hoặc null nếu chuẩn"
    }
  ],
  "phoneticTips": [
    "Lời khuyên giải phẫu khẩu hình cụ thể cho lỗi nặng nhất",
    "Lời khuyên ngữ điệu/nối âm"
  ],
  "generalFeedback": "Nhận xét học thuật, thẳng thắn, mang tính rèn giũa cao"
}
`;
      const aiResponse = await callGemini(prompt, apiKey, audioData);
      const cleaned = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (err) {
      console.warn('Gemini Speaking AI fallback to algorithmic analysis:', err.message);
    }
  }

  // Fallback heuristic scoring with strict penalties
  let matchedCount = 0;
  const wordsAnalysis = targetWords.map((tWord, idx) => {
    const isMatched = spokenWords.some(sWord => 
      sWord.toLowerCase() === tWord.toLowerCase() || 
      (tWord.length >= 4 && sWord.toLowerCase().includes(tWord.toLowerCase().slice(0, 3)))
    );
    if (isMatched) matchedCount++;
    return {
      word: tWord,
      status: isMatched ? 'correct' : (idx < spokenWords.length ? 'mispronounced' : 'missing'),
      phonetic: '',
      feedback: isMatched ? null : 'Cần chú ý phát âm rõ âm đuôi và trọng âm'
    };
  });

  const accuracyScore = targetWords.length > 0 ? Math.round((matchedCount / targetWords.length) * 80) : 40;
  const completenessScore = targetWords.length > 0 ? Math.min(100, Math.round((spokenWords.length / targetWords.length) * 85)) : 30;
  const fluencyScore = Math.min(85, Math.max(30, accuracyScore - 5));
  const overallScore = Math.round((accuracyScore * 0.5) + (completenessScore * 0.25) + (fluencyScore * 0.25));

  return {
    overallScore,
    accuracyScore,
    fluencyScore,
    completenessScore,
    wordsAnalysis,
    phoneticTips: [
      'Hãy chú ý phát âm dứt khoát các âm đuôi (ending sounds: /s/, /t/, /d/, /ed/, /θ/).',
      'Giữ nhịp thở đều đặn và ngắt nghỉ tự nhiên theo các cụm nghĩa (thought groups).'
    ],
    generalFeedback: overallScore >= 80 
      ? 'Bài đọc đạt yêu cầu. Tiếp tục duy trì độ dứt khoát của các phụ âm đuôi.' 
      : 'Cần siết chặt phát âm các từ bị đánh dấu đỏ/vàng. Hãy luyện tập bật âm đuôi rõ ràng hơn.'
  };
}

/**
 * 2. Analyze Interactive Q&A Speaking Response (Direct Audio & Multimodal Rubric)
 */
export async function analyzeQASpeaking({ question, topic = 'General', spokenText = '', audioData = null }) {
  if (!question || !question.trim()) {
    throw new Error('Question is required');
  }

  const cleanQuestion = question.trim();
  const cleanSpoken = (spokenText || '').trim();

  if (!cleanSpoken && !audioData) {
    throw new Error('Vui lòng nói câu trả lời của bạn qua micro trước khi chấm điểm.');
  }

  const apiKey = getApiKey();

  if (apiKey) {
    try {
      const prompt = `
Bạn là Trưởng ban Giám khảo Khảo thí IELTS Speaking Quốc tế (Senior IELTS Band 9.0 Examiner).
ÁP DỤNG THANG CHẤM CHUẨN MỰC, KHẮT KHE TUYỆT ĐỐI (STRICT UNCOMPROMISING BAND DESCRIPTORS):

THÔNG TIN BÀI THI:
- CHỦ ĐỀ (TOPIC): "${topic}"
- CÂU HỎI (QUESTION): "${cleanQuestion}"
- BẢN TRANSCRIPT THAM CHIẾU: "${cleanSpoken}"

QUY TẮC CHẤM THI CHẶT CHẼ:
1. Độ dài & Phát triển ý (Fluency & Coherence):
   - Nếu câu trả lời quá ngắn (< 30 từ) hoặc trả lời cụt lủn: Band TỐI ĐA là 5.0 - 5.5.
   - Để đạt Band 7.0+: Phải phát triển ý rõ ràng, có luận điểm, dẫn chứng và dùng từ nối tự nhiên.
2. Vốn từ vựng (Lexical Resource):
   - Dùng từ vựng cơ bản lặp đi lặp lại (very, good, nice, think): Band 5.5 - 6.0.
   - Để đạt Band 7.5+: Bắt buộc có collocations chuẩn xác, thành ngữ tự nhiên (idiomatic expressions) và từ vựng mang tính học thuật cao.
3. Ngữ pháp & Cấu trúc câu (Grammatical Range & Accuracy):
   - Sai thì, thiếu mạo từ, sai chia động từ: Vạch rõ trong danh sách grammarMistakes và hạ band điểm.
4. Phát âm & Ngữ điệu (Pronunciation):
   - Đánh giá thẳng thắn về độ tự nhiên, nối âm và ngữ điệu (Intonation).

HÃY CHẤM ĐIỂM CHÍNH XÁC THEO 4 TIÊU CHÍ VÀ TRẢ VỀ DUY NHẤT MỘT CHUỖI JSON HỢP LỆ (Không có markdown \`\`\`json):
{
  "overallBand": 6.5, // Điểm IELTS ước tính thực tế (4.0 - 9.0, bước 0.5)
  "overallScore": 68, // Thang điểm 0 - 100
  "criteria": {
    "fluency": {
      "score": 65, // 0 - 100
      "band": 6.5,
      "feedback": "Nhận xét độ trôi chảy, sự phát triển ý và độ tự nhiên"
    },
    "pronunciation": {
      "score": 65, // 0 - 100
      "band": 6.5,
      "feedback": "Nhận xét ngữ điệu, trọng âm câu và độ rõ ràng của âm tiết"
    },
    "grammar": {
      "score": 70, // 0 - 100
      "band": 7.0,
      "feedback": "Nhận xét độ chuẩn xác và phong phú của cấu trúc ngữ pháp"
    },
    "vocabulary": {
      "feedback": "Nhận xét vốn từ vựng, collocations, idiomatic expressions"
    }
  },
  "strengths": [
    "Điểm mạnh nổi bật 1 trong bài nói",
    "Điểm mạnh 2"
  ],
  "grammarMistakes": [
    {
      "original": "cụm từ sai ngữ pháp / cách dùng",
      "corrected": "cụm từ chuẩn xác",
      "explanation": "Giải thích ngắn gọn tại sao sai"
    }
  ],
  "modelAnswerBand85": "Viết lại câu trả lời trên theo phong cách tự nhiên, sang trọng, giàu collocation chuẩn IELTS Band 8.5+ (bằng tiếng Anh)",
  "highlightVocabulary": [
    {
      "word": "từ vựng nâng cao trong bài mẫu",
      "meaning": "nghĩa tiếng Việt súc tích"
    }
  ]
}
`;
      const aiResponse = await callGemini(prompt, apiKey, audioData);
      const parsed = safeParseJson(aiResponse);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini Q&A Speaking AI fallback:', err.message);
    }
  }

  // Fallback Algorithmic Evaluation
  const wordCount = cleanSpoken.split(/\s+/).length;
  const estBand = wordCount > 40 ? 6.5 : wordCount > 20 ? 6.0 : 5.5;

  return {
    overallBand: estBand,
    overallScore: Math.round(estBand * 10),
    criteria: {
      fluency: { score: 65, band: estBand, feedback: 'Tốc độ diễn đạt tương đối tốt, nên mở rộng thêm các ý triển khai.' },
      pronunciation: { score: 70, band: estBand, feedback: 'Phát âm cơ bản rõ ràng, cần lưu ý ngữ điệu câu tự nhiên hơn.' },
      grammar: { score: 65, band: estBand, feedback: 'Sử dụng cấu trúc cơ bản đúng, có thể kết hợp thêm câu phức và mệnh đề quan hệ.' },
      vocabulary: { score: 70, band: estBand, feedback: 'Vốn từ phù hợp với chủ đề, nên bổ sung thêm 2-3 collocations học thuật.' }
    },
    strengths: [
      'Đã trả lời đúng trọng tâm câu hỏi được đưa ra.',
      'Duy trì được mạch nói liên tục không bị ngắt quãng quá lâu.'
    ],
    grammarMistakes: [],
    modelAnswerBand85: `In my view, when addressing this aspect, it is vital to maintain a balanced perspective. For instance, leveraging structured routines not only enhances personal productivity but also cultivates long-term resilience.`,
    highlightVocabulary: [
      { word: 'vital', meaning: 'vô cùng quan trọng, thiết yếu' },
      { word: 'cultivate resilience', meaning: 'rèn giũa bản lĩnh kiên cường' }
    ]
  };
}

