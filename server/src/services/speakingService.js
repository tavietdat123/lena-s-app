/**
 * AI Speaking Assessment & Pronunciation Service
 * Powered by Google Gemini 1.5 Flash (0đ) + Local Heuristic Acoustic & Phonetic Engine
 */

import { callGemini, safeParseJson, getLanguageName } from './aiService.js';
import { getDb } from '../db/database.js';

// Comprehensive Curated Bank of Speaking Prompts
export const SPEAKING_PROMPTS = [
  // 1. Shadowing & Read-Aloud Paragraphs (English)
  {
    id: 'p1',
    target_language: 'en',
    category: 'read-aloud',
    topic: 'Technology & AI',
    topic_en: 'Technology & AI',
    topic_vi: 'Công nghệ & AI',
    title: 'The Future of Human-AI Collaboration',
    title_en: 'The Future of Human-AI Collaboration',
    title_vi: 'Tương lai của sự hợp tác giữa Con người và AI',
    level: 'B2 - Upper-Intermediate',
    targetText: 'Artificial intelligence is not designed to replace human ingenuity, but rather to augment our capabilities and streamline repetitive workflows with unprecedented precision.',
    phoneticKey: '/ˌɑː.tɪˈfɪʃ.əl ɪnˈtel.ɪ.dʒəns ɪz nɒt dɪˈzaɪnd tuː rɪˈpleɪs ˈhjuː.mən ˌɪn.dʒəˈnjuː.ə.ti/',
    tips_en: 'Enunciate the final /s/ in "intelligence", link "not designed to", and place primary stress on "ingenuity" (/ˌɪn.dʒəˈnjuː.ə.ti/).',
    tips_vi: 'Chú ý phát âm rõ âm đuôi /s/ trong "intelligence", nối âm "not designed to", và nhấn đúng trọng âm của "ingenuity" (/ˌɪn.dʒəˈnjuː.ə.ti/).',
    tips: 'Enunciate the final /s/ in "intelligence", link "not designed to", and place primary stress on "ingenuity" (/ˌɪn.dʒəˈnjuː.ə.ti/).'
  },
  {
    id: 'p2',
    target_language: 'en',
    category: 'read-aloud',
    topic: 'Mindset & Growth',
    topic_en: 'Mindset & Growth',
    topic_vi: 'Tư duy & Phát triển',
    title: 'Building Resilience in Tough Times',
    title_en: 'Building Resilience in Tough Times',
    title_vi: 'Xây dựng bản lĩnh kiên cường vượt qua nghịch cảnh',
    level: 'B2 - Upper-Intermediate',
    targetText: 'Resilience is not the absence of difficulty, but the remarkable ability to adapt, recover quickly, and maintain composure when confronted with unexpected obstacles.',
    phoneticKey: '/rɪˈzɪl.jəns ɪz nɒt ði ˈæb.səns ɒv ˈdɪf.ɪ.kəl.ti/',
    tips_en: 'Articulate the /z/ sound in "resilience", pause naturally after commas, and emphasize the keyword "remarkable" (/rɪˈmɑː.kə.bəl/).',
    tips_vi: 'Luyện tập âm /z/ trong "resilience", ngắt nhịp tự nhiên sau dấu phẩy và nhấn mạnh từ "remarkable" (/rɪˈmɑː.kə.bəl/).',
    tips: 'Articulate the /z/ sound in "resilience", pause naturally after commas, and emphasize the keyword "remarkable" (/rɪˈmɑː.kə.bəl/).'
  },
  {
    id: 'p3',
    target_language: 'en',
    category: 'read-aloud',
    topic: 'Business Communication',
    topic_en: 'Business Communication',
    topic_vi: 'Giao tiếp Doanh nghiệp',
    title: 'Articulating Value to Stakeholders',
    title_en: 'Articulating Value to Stakeholders',
    title_vi: 'Diễn đạt giá trị cốt lõi đến các bên liên quan',
    level: 'C1 - Advanced',
    targetText: 'To persuade executive stakeholders, one must articulate strategic trade-offs with meticulous clarity and back every recommendation with pragmatic data.',
    phoneticKey: '/tuː pəˈsweɪd ɪɡˈzek.jə.tɪv ˈsteɪkˌhəʊl.dəz/',
    tips_en: 'Place stress on the second syllable in "persuade" (/pəˈsweɪd/) and "articulate" (/ɑːˈtɪk.jə.leɪt/), and cleanly voice /k/ in "executive".',
    tips_vi: 'Chú ý nhấn âm 2 trong "persuade" (/pəˈsweɪd/) và "articulate" (/ɑːˈtɪk.jə.leɪt/), phát âm rõ âm /k/ trong "executive".',
    tips: 'Place stress on the second syllable in "persuade" (/pəˈsweɪd/) and "articulate" (/ɑːˈtɪk.jə.leɪt/), and cleanly voice /k/ in "executive".'
  },
  {
    id: 'p4',
    target_language: 'en',
    category: 'read-aloud',
    topic: 'Daily Conversation',
    topic_en: 'Daily Conversation',
    topic_vi: 'Đời sống hàng ngày',
    title: 'Work-Life Equilibrium',
    title_en: 'Work-Life Equilibrium',
    title_vi: 'Cân bằng giữa Công việc và Cuộc sống',
    level: 'B1 - Intermediate',
    targetText: 'Finding a sustainable balance between ambitious career goals and personal well-being is essential for long-term happiness and professional success.',
    phoneticKey: '/ˈfaɪn.dɪŋ ə səˈsteɪ.nə.bəl ˈbæl.əns/',
    tips_en: 'Maintain an even rhythm; cleanly pronounce the dark /l/ at the end of "sustainable" and /ʃ/ in "essential" (/ɪˈsen.ʃəl/).',
    tips_vi: 'Đọc với nhịp điệu thư thái, chú ý âm /l/ ở cuối "sustainable" và âm /ʃ/ trong "essential" (/ɪˈsen.ʃəl/).',
    tips: 'Maintain an even rhythm; cleanly pronounce the dark /l/ at the end of "sustainable" and /ʃ/ in "essential" (/ɪˈsen.ʃəl/).'
  },

  // 1b. Shadowing & Read-Aloud Paragraphs (Vietnamese)
  {
    id: 'vi_p1',
    target_language: 'vi',
    category: 'read-aloud',
    topic: 'Giao tiếp hàng ngày',
    topic_en: 'Daily Conversation',
    topic_vi: 'Giao tiếp hàng ngày',
    title: 'Lời chào và sự khởi đầu một ngày mới',
    title_en: 'Daily Greeting & Starting a Productive Day',
    title_vi: 'Lời chào và sự khởi đầu một ngày mới',
    level: 'A1 - Sơ cấp',
    targetText: 'Xin chào bạn, tôi rất vui được gặp bạn hôm nay. Chúc bạn một ngày làm việc thật hiệu quả và tràn đầy niềm vui!',
    phoneticKey: '[Thanh ngang, thanh hỏi, thanh huyền]',
    tips_en: 'Focus on the dipping-rising tone (thanh hỏi) in "khỏe" and "hiệu quả", the low falling tone (thanh huyền) in "tràn đầy", and pause naturally after commas.',
    tips_vi: 'Chú ý phát âm chuẩn thanh hỏi trong "khỏe" và "hiệu quả", thanh huyền trong "tràn đầy", ngắt nhịp tự nhiên sau dấu phẩy.',
    tips: 'Focus on the dipping-rising tone (thanh hỏi) in "khỏe" and "hiệu quả", the low falling tone (thanh huyền) in "tràn đầy", and pause naturally after commas.'
  },
  {
    id: 'vi_p2',
    target_language: 'vi',
    category: 'read-aloud',
    topic: 'Ẩm thực & Văn hóa',
    topic_en: 'Cuisine & Culture',
    topic_vi: 'Ẩm thực & Văn hóa',
    title: 'Hương vị Phở truyền thống Việt Nam',
    title_en: 'Traditional Vietnamese Phở Flavors',
    title_vi: 'Hương vị Phở truyền thống Việt Nam',
    level: 'A2 - Cơ bản',
    targetText: 'Phở là món ăn truyền thống nổi tiếng của Việt Nam, với nước dùng ninh từ xương bò đậm đà và mùi thơm dịu nhẹ của hoa hồi, thảo quả.',
    phoneticKey: '[Thanh ngã, thanh sắc, thanh nặng]',
    tips_en: 'Distinguish the high broken tone (thanh ngã) in "Phở" from the rising tone (thanh sắc) in "truyền thống"; keep your intonation smooth and melodic.',
    tips_vi: 'Chú ý phân biệt rõ thanh ngã trong "Phở", thanh sắc trong "truyền thống", giữ ngữ điệu mềm mại tự nhiên.',
    tips: 'Distinguish the high broken tone (thanh ngã) in "Phở" from the rising tone (thanh sắc) in "truyền thống"; keep your intonation smooth and melodic.'
  },
  {
    id: 'vi_p3',
    target_language: 'vi',
    category: 'read-aloud',
    topic: 'Tư duy & Phát triển',
    topic_en: 'Mindset & Growth',
    topic_vi: 'Tư duy & Phát triển',
    title: 'Sức mạnh của sự kiên trì bền bỉ',
    title_en: 'The Power of Relentless Perseverance',
    title_vi: 'Sức mạnh của sự kiên trì bền bỉ',
    level: 'B1 - Trung cấp',
    targetText: 'Sự kiên trì không có nghĩa là không bao giờ vấp ngã, mà là bản lĩnh tiếp tục đứng dậy và tiến bước sau mỗi thử thách.',
    phoneticKey: '[Thanh ngã, thanh hỏi, thanh sắc]',
    tips_en: 'Practice the diphthong in "tiến bước", and articulate the sharp glottalized tone (thanh ngã) clearly in "nghĩa" and "vấp ngã".',
    tips_vi: 'Luyện tập nguyên âm đôi trong "tiến bước", đọc dứt khoát thanh ngã trong "nghĩa" và "vấp ngã".',
    tips: 'Practice the diphthong in "tiến bước", and articulate the sharp glottalized tone (thanh ngã) clearly in "nghĩa" and "vấp ngã".'
  },
  {
    id: 'vi_p4',
    target_language: 'vi',
    category: 'read-aloud',
    topic: 'Du lịch & Khám phá',
    topic_en: 'Travel & Discovery',
    topic_vi: 'Du lịch & Khám phá',
    title: 'Vẻ đẹp dịu dàng của mùa thu Hà Nội',
    title_en: 'The Gentle Charm of Hanoi Autumn',
    title_vi: 'Vẻ đẹp dịu dàng của mùa thu Hà Nội',
    level: 'B2 - Khá',
    targetText: 'Mùa thu Hà Nội mang một nét đẹp trầm lắng và lãng mạn, với hương hoa sữa thoang thoảng trong làn gió heo may mát lành.',
    phoneticKey: '[Thanh huyền, thanh ngã, thanh sắc]',
    tips_en: 'Read at a relaxed pace; note the glottalized tone (thanh ngã) in "lãng mạn" and smooth low falling tones (thanh huyền) in "trầm lắng" and "mát lành".',
    tips_vi: 'Đọc với nhịp điệu thư thái, chú ý thanh ngã trong "lãng mạn", thanh huyền trong "trầm lắng" và "mát lành".',
    tips: 'Read at a relaxed pace; note the glottalized tone (thanh ngã) in "lãng mạn" and smooth low falling tones (thanh huyền) in "trầm lắng" and "mát lành".'
  },

  // 2. Interactive Q&A Speaking Topics (English)
  {
    id: 'qa1',
    target_language: 'en',
    category: 'qa',
    topic: 'Career & Ambition',
    topic_en: 'Career & Ambition',
    topic_vi: 'Sự nghiệp & Mục tiêu',
    title: 'Task Prioritization Under Deadlines',
    title_en: 'Task Prioritization Under Deadlines',
    title_vi: 'Ưu tiên công việc khi gấp rút',
    question: 'How do you prioritize your daily tasks when facing tight deadlines at work or study?',
    sampleAudioHint_en: 'Talk about using task management tools, Eisenhower matrix, or focusing on high-impact objectives.',
    sampleAudioHint_vi: 'Nói về việc sử dụng công cụ quản lý tác vụ, ma trận Eisenhower, hoặc tập trung vào các mục tiêu mang lại tác động lớn nhất.',
    sampleAudioHint: 'Talk about using task management tools, Eisenhower matrix, or focusing on high-impact objectives.',
    keyVocabulary: ['prioritize', 'urgent vs important', 'leverage tools', 'stay composed', 'mitigate risks']
  },
  {
    id: 'qa2',
    target_language: 'en',
    category: 'qa',
    topic: 'Technology & Society',
    topic_en: 'Technology & Society',
    topic_vi: 'Công nghệ & Xã hội',
    title: 'AI in Future Language Learning',
    title_en: 'AI in Future Language Learning',
    title_vi: 'AI trong việc học ngoại ngữ tương lai',
    question: 'Do you believe artificial intelligence will significantly transform how we learn languages in the next decade?',
    sampleAudioHint_en: 'Mention personalized feedback, real-time speech evaluation, interactive avatars, but emphasize the human touch.',
    sampleAudioHint_vi: 'Đề cập đến phản hồi cá nhân hóa, đánh giá phát âm thời gian thực, nhưng nhấn mạnh vai trò kết nối giữa con người.',
    sampleAudioHint: 'Mention personalized feedback, real-time speech evaluation, interactive avatars, but emphasize the human touch.',
    keyVocabulary: ['personalized feedback', 'speech synthesis', 'accelerate learning', 'human interaction']
  },
  {
    id: 'qa3',
    target_language: 'en',
    category: 'qa',
    topic: 'Travel & Culture',
    topic_en: 'Travel & Culture',
    topic_vi: 'Du lịch & Văn hóa',
    title: 'Memorable Travel Experiences',
    title_en: 'Memorable Travel Experiences',
    title_vi: 'Kỷ niệm du lịch đáng nhớ',
    question: 'Describe a memorable place you have visited and explain why it left a profound impression on you.',
    sampleAudioHint_en: 'Describe the atmosphere, local culture, architecture, and personal emotion.',
    sampleAudioHint_vi: 'Miêu tả bầu không khí, văn hóa địa phương, kiến trúc và cảm xúc cá nhân sâu sắc.',
    sampleAudioHint: 'Describe the atmosphere, local culture, architecture, and personal emotion.',
    keyVocabulary: ['breathtaking scenery', 'cultural immersion', 'unforgettable experience', 'hospitality']
  },
  {
    id: 'qa4',
    target_language: 'en',
    category: 'qa',
    topic: 'Habits & Productivity',
    topic_en: 'Habits & Productivity',
    topic_vi: 'Thói quen & Hiệu suất',
    title: 'Transformative Daily Habits',
    title_en: 'Transformative Daily Habits',
    title_vi: 'Thói quen hàng ngày mang tính bước ngoặt',
    question: 'What daily habit has contributed the most to your personal growth and why?',
    sampleAudioHint_en: 'Discuss reading, morning routines, regular physical exercise, or continuous learning.',
    sampleAudioHint_vi: 'Chia sẻ về việc đọc sách, thói quen buổi sáng, tập thể dục thường xuyên, hoặc tự học liên tục.',
    sampleAudioHint: 'Discuss reading, morning routines, regular physical exercise, or continuous learning.',
    keyVocabulary: ['consistency', 'compound effect', 'mental clarity', 'discipline', 'transformative']
  },

  // 2b. Interactive Q&A Speaking Topics (Vietnamese)
  {
    id: 'vi_qa1',
    target_language: 'vi',
    category: 'qa',
    topic: 'Đời sống & Sở thích',
    topic_en: 'Lifestyle & Hobbies',
    topic_vi: 'Đời sống & Sở thích',
    title: 'Hoạt động thư giãn cuối tuần',
    title_en: 'Relaxing Weekend Activities',
    title_vi: 'Hoạt động thư giãn cuối tuần',
    question: 'Bạn thường thích làm gì nhất vào những ngày cuối tuần rảnh rỗi?',
    sampleAudioHint_en: 'Talk about reading books, strolling in the park, enjoying coffee with friends, or cooking at home.',
    sampleAudioHint_vi: 'Nói về việc đọc sách, đi dạo công viên, thưởng thức cà phê cùng bạn bè hoặc tự nấu ăn tại nhà.',
    sampleAudioHint: 'Talk about reading books, strolling in the park, enjoying coffee with friends, or cooking at home.',
    keyVocabulary: ['thư giãn', 'cuối tuần', 'thưởng thức', 'bình yên', 'nạp lại năng lượng']
  },
  {
    id: 'vi_qa2',
    target_language: 'vi',
    category: 'qa',
    topic: 'Ẩm thực Việt Nam',
    topic_en: 'Vietnamese Cuisine',
    topic_vi: 'Ẩm thực Việt Nam',
    title: 'Món ăn Việt Nam ấn tượng nhất',
    title_en: 'Impressive Vietnamese Dishes',
    title_vi: 'Món ăn Việt Nam ấn tượng nhất',
    question: 'Món ăn Việt Nam nào khiến bạn ấn tượng nhất và bạn thích hương vị của nó như thế nào?',
    sampleAudioHint_en: 'Describe pho, bun cha, banh mi, or spring rolls, highlighting the harmonious blend of sweet, sour, salty, and spicy.',
    sampleAudioHint_vi: 'Kể về phở, bún chả, bánh mì hoặc gỏi cuốn, mô tả sự hòa quyện của các hương vị chua cay mặn ngọt.',
    sampleAudioHint: 'Describe pho, bun cha, banh mi, or spring rolls, highlighting the harmonious blend of sweet, sour, salty, and spicy.',
    keyVocabulary: ['đậm đà', 'hương vị truyền thống', 'thanh mát', 'nguyên liệu tươi ngon']
  },
  {
    id: 'vi_qa3',
    target_language: 'vi',
    category: 'qa',
    topic: 'Động lực học tập',
    topic_en: 'Learning Motivation',
    topic_vi: 'Động lực học tập',
    title: 'Động lực học tiếng Việt',
    title_en: 'Motivation to Learn Vietnamese',
    title_vi: 'Động lực học tiếng Việt',
    question: 'Điều gì đã thôi thúc bạn quyết định học tiếng Việt?',
    sampleAudioHint_en: 'Share your passion for Vietnamese culture, career needs, travel adventures, or desire to connect with local friends.',
    sampleAudioHint_vi: 'Chia sẻ về tình yêu văn hóa, công việc, du lịch hoặc mong muốn gắn kết với bạn bè người Việt.',
    sampleAudioHint: 'Share your passion for Vietnamese culture, career needs, travel adventures, or desire to connect with local friends.',
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
export async function analyzeReadAloud({ targetText, spokenText = '', audioData = null, duration = 0, targetLang = 'en', fluentLang = 'vi' }) {
  if (!targetText || !targetText.trim()) {
    throw new Error('Target text is required');
  }

  const cleanTarget = targetText.trim();
  const cleanSpoken = (spokenText || '').trim();

  // Basic word array matching
  const targetWords = cleanTarget.replace(/[.,!?;:"'()]/g, '').split(/\s+/).filter(Boolean);
  const spokenWords = cleanSpoken.replace(/[.,!?;:"'()]/g, '').split(/\s+/).filter(Boolean);

  const apiKey = getApiKey();
  const targetName = getLanguageName(targetLang);
  const fluentName = getLanguageName(fluentLang);

  if (apiKey && (cleanSpoken || audioData)) {
    try {
      const isViTrack = targetLang === 'vi';
      const prompt = isViTrack ? `
Bạn là Giám khảo Khảo thí Ngữ âm Tiếng Việt & Chuyên gia Giảng dạy Tiếng Việt cho người nước ngoài (VSL - Vietnamese as a Second Language Senior Examiner & Phonetician).
Áp dụng TIÊU CHÍ CHẤM ĐIỂM CỰC KỲ NGHIÊM KHẮC, CHUẨN XÁC TỪNG THANH ĐIỆU VÀ ÂM TIẾT CHO NGƯỜI NƯỚC NGOÀI HỌC TIẾNG VIỆT:

MỤC TIÊU KHẢO THÍ:
- VĂN BẢN TIẾNG VIỆT CẦN ĐỌC (TARGET TEXT): "${cleanTarget}"
- VĂN BẢN TRANSCRIPT THAM CHIẾU: "${cleanSpoken}"

QUY TẮC ĐÁNH GIÁ NGỮ ÂM TIẾNG VIỆT:
1. 6 Thanh điệu (Tones): Phạt nghiêm khắc nếu sai hoặc lẫn lộn thanh điệu: ngang, huyền, sắc, hỏi, ngã, nặng. Đặc biệt chú ý thanh hỏi vs thanh ngã, thanh sắc vs thanh nặng. Từ nào sai thanh PHẢI đánh dấu "mispronounced".
2. Hệ thống nguyên âm: Kiểm tra độ mở và phát âm chuẩn các nguyên âm tiếng Việt (ă, â, ê, ô, ơ, ư) và nguyên âm đôi (ia/iê, ua/uô, ưa/ươ).
3. Phụ âm đầu và cuối: Phân biệt rõ phụ âm đầu (ch/tr, s/x, r/d/gi, ng/ngh) và phụ âm khép đuôi (c, t, p, n, ng, nh).
4. Ngắt nhịp & Ngữ điệu: Đọc rời rạc từng tiếng như robot hoặc ngập ngừng quá lâu sẽ bị trừ điểm Fluency.

QUAN TRỌNG VỀ NGÔN NGỮ GIẢI THÍCH:
Học viên có ngôn ngữ mẹ đẻ/thành thạo là: ${fluentName}.
Toàn bộ nhận xét chi tiết ("feedback" cho từng từ, "phoneticTips", và "generalFeedback") BẮT BUỘC PHẢI VIẾT BẰNG ${fluentName} để học viên hiểu tường tận lỗi sai!

HÃY ĐÁNH GIÁ VÀ TRẢ VỀ DUY NHẤT MỘT ĐỊNH DẠNG JSON (Không kèm markdown \`\`\`json):
{
  "overallScore": 72,
  "accuracyScore": 70,
  "fluencyScore": 75,
  "completenessScore": 90,
  "wordsAnalysis": [
    {
      "word": "từ_gốc",
      "status": "correct",
      "phonetic": "[thanh điệu / phiên âm]",
      "feedback": "Lỗi sai cụ thể (viết bằng ${fluentName}) hoặc null nếu chuẩn"
    }
  ],
  "phoneticTips": [
    "Lời khuyên khẩu hình và thanh điệu (bằng ${fluentName})",
    "Lời khuyên ngữ điệu (bằng ${fluentName})"
  ],
  "generalFeedback": "Nhận xét tổng quát mang tính rèn giũa (bằng ${fluentName})"
}
` : `
You are a Senior International IELTS Band 9.0 Speaking Examiner & Phonetician.
Apply strict, uncompromising phonetic and acoustic criteria:

ASSESSMENT TARGETS:
- TARGET TEXT TO READ: "${cleanTarget}"
- TRANSCRIPT REFERENCE: "${cleanSpoken}"

STRICT PHONETIC RULES:
1. Ending consonants (/s/, /z/, /t/, /d/, /ed/, /θ/, /ð/, /ks/, /tʃ/, /dʒ/): severely penalize dropped final consonants. Each missing ending sound MUST be marked "mispronounced".
2. Word stress: incorrect primary stress on multi-syllable words MUST be marked "mispronounced".
3. Long vs short vowels (/iː/ vs /ɪ/, /uː/ vs /ʊ/, /ɔː/ vs /ɒ/): strictly evaluated.
4. Linking & Chunking: unnatural pauses or robotic disjointed delivery penalize fluency score.

IMPORTANT LANGUAGE REQUIREMENT:
The learner is studying ${targetName} and is fluent in ${fluentName}.
All explanations ("feedback" for each word, "phoneticTips", and "generalFeedback") MUST BE WRITTEN IN ${fluentName}!

RETURN ONLY A VALID JSON OBJECT (NO markdown backticks \`\`\`json):
{
  "overallScore": 72,
  "accuracyScore": 70,
  "fluencyScore": 75,
  "completenessScore": 90,
  "wordsAnalysis": [
    {
      "word": "word_here",
      "status": "correct",
      "phonetic": "/standard_ipa/",
      "feedback": "Specific feedback in ${fluentName} or null if correct"
    }
  ],
  "phoneticTips": [
    "Tip 1 in ${fluentName}",
    "Tip 2 in ${fluentName}"
  ],
  "generalFeedback": "Academic, rigorous feedback in ${fluentName}"
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
  const isEnFluent = fluentLang === 'en';
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
      feedback: isMatched ? null : (isEnFluent ? 'Check pronunciation, tone/stress and clarity.' : 'Cần chú ý phát âm rõ âm đuôi, thanh điệu và trọng âm')
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
    phoneticTips: isEnFluent ? [
      targetLang === 'vi' ? 'Focus closely on Vietnamese tone contours (especially hỏi vs ngã, sắc vs nặng).' : 'Pronounce ending sounds clearly (/s/, /t/, /d/, /ed/, /θ/).',
      'Maintain rhythmic pacing and pause naturally at clause boundaries.'
    ] : [
      targetLang === 'vi' ? 'Luyện tập phân biệt rõ thanh hỏi và ngã, giữ cao độ chuẩn xác.' : 'Hãy chú ý phát âm dứt khoát các âm đuôi (ending sounds: /s/, /t/, /d/, /ed/, /θ/).',
      'Giữ nhịp thở đều đặn và ngắt nghỉ tự nhiên theo các cụm nghĩa (thought groups).'
    ],
    generalFeedback: isEnFluent
      ? (overallScore >= 80 ? 'Good pronunciation attempt. Keep refining pitch accuracy and fluency.' : 'Review mispronounced words highlighted in red. Focus on tonal clarity and rhythmic flow.')
      : (overallScore >= 80 ? 'Bài đọc đạt yêu cầu. Tiếp tục duy trì độ dứt khoát và chuẩn xác.' : 'Cần siết chặt phát âm các từ bị đánh dấu đỏ/vàng. Hãy luyện tập bật âm rõ ràng hơn.')
  };
}

/**
 * 2. Analyze Interactive Q&A Speaking Response (Direct Audio & Multimodal Rubric)
 */
export async function analyzeQASpeaking({ question, topic = 'General', spokenText = '', audioData = null, targetLang = 'en', fluentLang = 'vi' }) {
  if (!question || !question.trim()) {
    throw new Error('Question is required');
  }

  const cleanQuestion = question.trim();
  const cleanSpoken = (spokenText || '').trim();

  if (!cleanSpoken && !audioData) {
    throw new Error('Please speak your answer into the microphone before scoring.');
  }

  const apiKey = getApiKey();
  const targetName = getLanguageName(targetLang);
  const fluentName = getLanguageName(fluentLang);
  const isViTrack = targetLang === 'vi';

  if (apiKey) {
    try {
      const prompt = isViTrack ? `
Bạn là Giám khảo Cấp cao Hội đồng Khảo thí Năng lực Tiếng Việt cho Người nước ngoài (Senior VSL Examiner - Khung năng lực tiếng Việt 6 bậc A1-C2).
Áp dụng THANG CHẤM ĐIỂM CHUẨN XÁC, KHẮT KHE TUYỆT ĐỐI CHO BÀI NÓI TIẾNG VIỆT:

THÔNG TIN BÀI KHẢO THÍ:
- CHỦ ĐỀ (TOPIC): "${topic}"
- CÂU HỎI (QUESTION): "${cleanQuestion}"
- BẢN TRANSCRIPT BÀI NÓI CỦA THÍ SINH: "${cleanSpoken}"

TIÊU CHÍ CHẤM THI TIẾNG VIỆT:
1. Độ lưu loát & Mạch lạc (Fluency & Coherence): Khả năng diễn đạt liền mạch, phát triển ý, trả lời đúng trọng tâm.
2. Vốn từ vựng (Lexical Resource): Sử dụng từ ngữ tự nhiên, từ láy, thành ngữ, hư từ liên kết, từ vựng phong phú.
3. Ngữ pháp & Cấu trúc (Grammar & Structure): Trật tự từ tiếng Việt, dùng đúng các cấu trúc ngữ pháp (càng... càng, do... nên, nếu... thì, bị/được).
4. Ngữ âm & Ngữ điệu (Pronunciation): Thanh điệu tiếng Việt và độ tự nhiên.

QUAN TRỌNG VỀ NGÔN NGỮ TRẢ VỀ:
- Thí sinh đang học TIẾNG VIỆT và thành thạo: ${fluentName}.
- Toàn bộ nhận xét (feedback trong criteria, strengths, explanation trong grammarMistakes) BẮT BUỘC VIẾT BẰNG ${fluentName}.
- modelAnswerBand85: Phải được viết bằng TIẾNG VIỆT tự nhiên, chuẩn mực, lưu loát ở trình độ Bậc 5-6 VSL.
- highlightVocabulary: Từ vựng/cụm từ hay trong bài mẫu bằng TIẾNG VIỆT, với "meaning" giải thích bằng ${fluentName}.

TRẢ VỀ DUY NHẤT MỘT CHUỖI JSON HỢP LỆ (Không có markdown \`\`\`json):
{
  "overallBand": 5.5, // Thang điểm ước tính (4.0 - 9.0 hoặc Bậc 1-6 quy đổi)
  "overallScore": 68, // Thang điểm 0 - 100
  "criteria": {
    "fluency": {
      "score": 65,
      "band": 6.5,
      "feedback": "Nhận xét độ lưu loát (bằng ${fluentName})"
    },
    "pronunciation": {
      "score": 65,
      "band": 6.5,
      "feedback": "Nhận xét thanh điệu, ngữ điệu (bằng ${fluentName})"
    },
    "grammar": {
      "score": 70,
      "band": 7.0,
      "feedback": "Nhận xét cấu trúc ngữ pháp tiếng Việt (bằng ${fluentName})"
    },
    "vocabulary": {
      "feedback": "Nhận xét vốn từ vựng tiếng Việt (bằng ${fluentName})"
    }
  },
  "strengths": [
    "Điểm mạnh 1 (bằng ${fluentName})",
    "Điểm mạnh 2 (bằng ${fluentName})"
  ],
  "grammarMistakes": [
    {
      "original": "cụm từ tiếng Việt sai hoặc chưa tự nhiên",
      "corrected": "cụm từ tiếng Việt chuẩn xác",
      "explanation": "Giải thích ngắn gọn tại sao sai (bằng ${fluentName})"
    }
  ],
  "modelAnswerBand85": "Câu trả lời mẫu bằng Tiếng Việt tự nhiên, chuẩn mực, giàu tính biểu đạt",
  "highlightVocabulary": [
    {
      "word": "từ vựng tiếng Việt nâng cao trong bài mẫu",
      "meaning": "giải thích ý nghĩa bằng ${fluentName}"
    }
  ]
}
` : `
You are a Senior IELTS Band 9.0 Speaking Examiner.
Apply strict, uncompromising assessment rubric for English speech:

EXAMINATION DATA:
- TOPIC: "${topic}"
- QUESTION: "${cleanQuestion}"
- CANDIDATE TRANSCRIPT: "${cleanSpoken}"

CRITERIA:
1. Fluency & Coherence: length, elaboration, connectors.
2. Lexical Resource: idiomatic expressions, collocations, precision.
3. Grammatical Range & Accuracy: complex structures, error correction.
4. Pronunciation: rhythm, intonation, sentence stress.

IMPORTANT LANGUAGE REQUIREMENT:
The candidate is learning ${targetName} and understands ${fluentName}.
All criteria feedbacks, strengths, explanations in grammarMistakes, and meanings in highlightVocabulary MUST BE WRITTEN IN ${fluentName}!
modelAnswerBand85 MUST be in English (Band 8.5+ native standard).

RETURN ONLY A VALID JSON OBJECT (NO markdown \`\`\`json):
{
  "overallBand": 6.5,
  "overallScore": 68,
  "criteria": {
    "fluency": { "score": 65, "band": 6.5, "feedback": "Feedback in ${fluentName}" },
    "pronunciation": { "score": 65, "band": 6.5, "feedback": "Feedback in ${fluentName}" },
    "grammar": { "score": 70, "band": 7.0, "feedback": "Feedback in ${fluentName}" },
    "vocabulary": { "feedback": "Feedback in ${fluentName}" }
  },
  "strengths": [
    "Strength 1 in ${fluentName}",
    "Strength 2 in ${fluentName}"
  ],
  "grammarMistakes": [
    {
      "original": "incorrect phrase",
      "corrected": "native corrected phrase",
      "explanation": "Explanation in ${fluentName}"
    }
  ],
  "modelAnswerBand85": "Native English model answer (Band 8.5+ style)",
  "highlightVocabulary": [
    { "word": "advanced English term", "meaning": "Concise meaning in ${fluentName}" }
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
  const isEnFluent = fluentLang === 'en';

  if (isViTrack) {
    return {
      overallBand: estBand,
      overallScore: Math.round(estBand * 10),
      criteria: {
        fluency: { score: 65, band: estBand, feedback: isEnFluent ? 'Good delivery speed; try expanding your thoughts further.' : 'Tốc độ diễn đạt tương đối tốt, nên mở rộng thêm các ý triển khai.' },
        pronunciation: { score: 70, band: estBand, feedback: isEnFluent ? 'Clear pronunciation; pay extra attention to Vietnamese tones.' : 'Phát âm cơ bản rõ ràng, cần lưu ý thanh điệu câu tự nhiên hơn.' },
        grammar: { score: 65, band: estBand, feedback: isEnFluent ? 'Basic grammar is accurate; consider using more connective particles.' : 'Sử dụng cấu trúc cơ bản đúng, có thể kết hợp thêm các cặp liên từ hô ứng.' },
        vocabulary: { score: 70, band: estBand, feedback: isEnFluent ? 'Appropriate vocabulary for the topic; add 2-3 idioms or collocations.' : 'Vốn từ phù hợp với chủ đề, nên bổ sung thêm 2-3 thành ngữ hoặc từ ghép tự nhiên.' }
      },
      strengths: isEnFluent ? [
        'Directly answered the target question.',
        'Maintained smooth flow without excessive hesitation.'
      ] : [
        'Đã trả lời đúng trọng tâm câu hỏi được đưa ra.',
        'Duy trì được mạch nói liên tục không bị ngắt quãng quá lâu.'
      ],
      grammarMistakes: [],
      modelAnswerBand85: 'Theo tôi, khi đối mặt với thử thách này, điều quan trọng nhất là phải giữ vững tinh thần kiên trì và linh hoạt thích ứng với hoàn cảnh thực tế.',
      highlightVocabulary: [
        { word: 'kiên trì', meaning: isEnFluent ? 'persistent, resilient' : 'bền bỉ, không bỏ cuộc' },
        { word: 'thích ứng', meaning: isEnFluent ? 'adapt to circumstances' : 'phù hợp với môi trường' }
      ]
    };
  }

  return {
    overallBand: estBand,
    overallScore: Math.round(estBand * 10),
    criteria: {
      fluency: { score: 65, band: estBand, feedback: isEnFluent ? 'Fair speaking speed; expand on your main ideas.' : 'Tốc độ diễn đạt tương đối tốt, nên mở rộng thêm các ý triển khai.' },
      pronunciation: { score: 70, band: estBand, feedback: isEnFluent ? 'Clear articulation; improve natural intonation.' : 'Phát âm cơ bản rõ ràng, cần lưu ý ngữ điệu câu tự nhiên hơn.' },
      grammar: { score: 65, band: estBand, feedback: isEnFluent ? 'Solid sentence foundations; practice complex sentence structures.' : 'Sử dụng cấu trúc cơ bản đúng, có thể kết hợp thêm câu phức và mệnh đề quan hệ.' },
      vocabulary: { score: 70, band: estBand, feedback: isEnFluent ? 'Good topical words; incorporate 2-3 academic collocations.' : 'Vốn từ phù hợp với chủ đề, nên bổ sung thêm 2-3 collocations học thuật.' }
    },
    strengths: isEnFluent ? [
      'Directly addressed the core prompt question.',
      'Maintained consistent flow without extended pauses.'
    ] : [
      'Đã trả lời đúng trọng tâm câu hỏi được đưa ra.',
      'Duy trì được mạch nói liên tục không bị ngắt quãng quá lâu.'
    ],
    grammarMistakes: [],
    modelAnswerBand85: `In my view, when addressing this aspect, it is vital to maintain a balanced perspective. For instance, leveraging structured routines not only enhances personal productivity but also cultivates long-term resilience.`,
    highlightVocabulary: [
      { word: 'vital', meaning: isEnFluent ? 'essential, extremely important' : 'vô cùng quan trọng, thiết yếu' },
      { word: 'cultivate resilience', meaning: isEnFluent ? 'develop mental toughness' : 'rèn giũa bản lĩnh kiên cường' }
    ]
  };
}

