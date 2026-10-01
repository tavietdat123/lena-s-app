import { getDb } from '../db/database.js';
import { gamificationService } from './gamificationService.js';

// Helper to resolve single or multiple topics
export function resolveTopics(db, topicInput) {
  let list = [];
  if (Array.isArray(topicInput)) {
    list = topicInput;
  } else if (typeof topicInput === 'string') {
    list = topicInput.split(',').map(s => s.trim()).filter(Boolean);
  }

  const isAll = list.length === 0 || list.some(t => t.toLowerCase() === 'all');
  if (isAll) {
    return { isAll: true, targetIds: [], displayNames: ['Tất cả (All)'] };
  }

  let masterTopics = [];
  try {
    masterTopics = db.prepare('SELECT * FROM topics').all();
  } catch (e) {
    masterTopics = [];
  }

  const targetIds = [];
  const displayNames = [];

  list.forEach(item => {
    const matched = masterTopics.find(mt => 
      mt.id.toLowerCase() === item.toLowerCase() || 
      mt.name.toLowerCase() === item.toLowerCase()
    );
    if (matched) {
      if (!targetIds.includes(matched.id.toLowerCase())) {
        targetIds.push(matched.id.toLowerCase());
        displayNames.push(`${matched.emoji || '🏷️'} ${matched.name}`);
      }
    } else {
      if (!targetIds.includes(item.toLowerCase())) {
        targetIds.push(item.toLowerCase());
        displayNames.push(item);
      }
    }
  });

  return {
    isAll: false,
    targetIds,
    displayNames
  };
}

// Helper to filter items by Date Scope (Single date, Array of dates, or Date range)
export function filterItemsByDate(items, dateScope = 'all', specificDate = null, startDate = null, endDate = null) {
  if (!items || items.length === 0) return [];
  if (!dateScope || dateScope === 'all') return items;

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().substring(0, 10);

  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 7);
  const d7Str = d7.toISOString().substring(0, 10);

  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);
  const d30Str = d30.toISOString().substring(0, 10);

  if (dateScope === 'today') {
    return items.filter(i => (i.created_at || '').substring(0, 10) === todayStr);
  }
  if (dateScope === 'yesterday') {
    return items.filter(i => (i.created_at || '').substring(0, 10) === yesterdayStr);
  }
  if (dateScope === 'last_7_days') {
    return items.filter(i => (i.created_at || '').substring(0, 10) >= d7Str);
  }
  if (dateScope === 'last_30_days') {
    return items.filter(i => (i.created_at || '').substring(0, 10) >= d30Str);
  }
  if (dateScope === 'range' && (startDate || endDate)) {
    return items.filter(i => {
      const d = (i.created_at || '').substring(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }
  if (dateScope === 'custom' || dateScope === 'specific' || Array.isArray(specificDate) || (typeof specificDate === 'string' && specificDate.length > 0)) {
    const datesArray = Array.isArray(specificDate) 
      ? specificDate.filter(Boolean)
      : (specificDate && specificDate.includes(',') ? specificDate.split(',').map(s => s.trim()).filter(Boolean) : (specificDate ? [specificDate] : []));
    if (datesArray.length > 0) {
      return items.filter(i => datesArray.includes((i.created_at || '').substring(0, 10)));
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateScope)) {
    return items.filter(i => (i.created_at || '').substring(0, 10) === dateScope);
  }

  return items;
}

export const CURATED_POS_DISTRACTORS = {
  adj: [
    { word: 'meticulous', meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ' },
    { word: 'resilient', meaning_vi: 'Kiên cường, bền bỉ trước khó khăn' },
    { word: 'articulate', meaning_vi: 'Lưu loát, diễn đạt mạch lạc rõ ràng' },
    { word: 'eloquent', meaning_vi: 'Hùng biện, có sức thuyết phục cao' },
    { word: 'proactive', meaning_vi: 'Chủ động tiên phong trong hành động' },
    { word: 'versatile', meaning_vi: 'Đa năng, linh hoạt thích ứng' },
    { word: 'feasible', meaning_vi: 'Khả thi, có thể triển khai thực tế' },
    { word: 'comprehensive', meaning_vi: 'Toàn diện, bao quát mọi khía cạnh' },
    { word: 'rigorous', meaning_vi: 'Nghiêm ngặt, chặt chẽ và chuẩn xác' },
    { word: 'ambiguous', meaning_vi: 'Mơ hồ, nước đôi, đa nghĩa' },
    { word: 'skeptical', meaning_vi: 'Hoài nghi, thận trọng đánh giá' },
    { word: 'sustainable', meaning_vi: 'Bền vững, duy trì ổn định lâu dài' },
    { word: 'pragmatic', meaning_vi: 'Thực tế, coi trọng hiệu quả ứng dụng' },
    { word: 'compatible', meaning_vi: 'Tương thích, phù hợp nhịp nhàng' },
    { word: 'obsolete', meaning_vi: 'Lỗi thời, không còn phù hợp' },
    { word: 'profound', meaning_vi: 'Sâu sắc, thâm thúy, có tầm ảnh hưởng lớn' },
    { word: 'vulnerable', meaning_vi: 'Dễ bị tổn thương, có điểm sơ hở' },
    { word: 'unanimous', meaning_vi: 'Nhất trí, đồng thuận 100%' },
    { word: 'indispensable', meaning_vi: 'Không thể thiếu, tối quan trọng' },
    { word: 'subtle', meaning_vi: 'Tinh tế, khó nhận thấy nếu không chú ý' },
    { word: 'authentic', meaning_vi: 'Chân thực, đáng tin cậy, nguyên bản' },
    { word: 'dynamic', meaning_vi: 'Năng động, biến đổi linh hoạt' },
    { word: 'competent', meaning_vi: 'Có năng lực, thành thạo công việc' },
    { word: 'plausible', meaning_vi: 'Hợp lý, đáng tin cậy về mặt logic' },
    { word: 'coherent', meaning_vi: 'Mạch lạc, liên kết logic chặt chẽ' }
  ],
  verb: [
    { word: 'avoid', meaning_vi: 'Tránh, né tránh rủi ro hoặc tác động' },
    { word: 'delegate', meaning_vi: 'Ủy quyền, giao phó nhiệm vụ' },
    { word: 'leverage', meaning_vi: 'Tận dụng tối đa đòn bẩy / thế mạnh' },
    { word: 'pivot', meaning_vi: 'Chuyển hướng chiến lược linh hoạt' },
    { word: 'escalate', meaning_vi: 'Chuyển tiếp lên cấp thẩm quyền cao hơn' },
    { word: 'prioritize', meaning_vi: 'Sắp xếp thứ tự ưu tiên quan trọng' },
    { word: 'facilitate', meaning_vi: 'Tạo điều kiện thuận lợi, điều phối' },
    { word: 'implement', meaning_vi: 'Triển khai thực thi kế hoạch' },
    { word: 'optimize', meaning_vi: 'Tối ưu hóa quy trình và hiệu năng' },
    { word: 'coordinate', meaning_vi: 'Điều phối, phối hợp nhịp nhàng' },
    { word: 'mitigate', meaning_vi: 'Giảm nhẹ mức độ rủi ro / tổn thất' },
    { word: 'articulate', meaning_vi: 'Diễn đạt rõ ràng quan điểm' },
    { word: 'reconcile', meaning_vi: 'Đối soát, hòa giải sự bất đồng' },
    { word: 'consolidate', meaning_vi: 'Hợp nhất, củng cố vị thế vững chắc' },
    { word: 'cultivate', meaning_vi: 'Nuôi dưỡng, vun đắp mối quan hệ/kỹ năng' },
    { word: 'streamline', meaning_vi: 'Tinh gọn quy trình làm việc' },
    { word: 'harness', meaning_vi: 'Khai thác và làm chủ tiềm năng' },
    { word: 'negotiate', meaning_vi: 'Đàm phán, thương lượng thỏa thuận' },
    { word: 'differentiate', meaning_vi: 'Tạo sự khác biệt, phân biệt rõ ràng' },
    { word: 'synthesize', meaning_vi: 'Tổng hợp và đúc kết thông tin' },
    { word: 'initiate', meaning_vi: 'Khởi xướng, bắt đầu tiến trình' },
    { word: 'accelerate', meaning_vi: 'Đẩy nhanh tiến độ và tốc độ tăng trưởng' },
    { word: 'advocate', meaning_vi: 'Ủng hộ mạnh mẽ, chủ trương đề xuất' },
    { word: 'substantiate', meaning_vi: 'Chứng minh bằng bằng chứng xác thực' },
    { word: 'reiterate', meaning_vi: 'Nhắc lại, nhấn mạnh lại quan điểm' }
  ],
  noun: [
    { word: 'milestone', meaning_vi: 'Cột mốc tiến độ quan trọng' },
    { word: 'deliverable', meaning_vi: 'Kết quả bàn giao của dự án' },
    { word: 'priority', meaning_vi: 'Mục tiêu ưu tiên hàng đầu' },
    { word: 'bottleneck', meaning_vi: 'Điểm nghẽn gây chậm trễ quy trình' },
    { word: 'stakeholder', meaning_vi: 'Bên liên quan trực tiếp đến dự án' },
    { word: 'strategy', meaning_vi: 'Chiến lược phát triển dài hạn' },
    { word: 'decision', meaning_vi: 'Quyết định mang tính bước ngoặt' },
    { word: 'resource', meaning_vi: 'Nguồn lực nhân sự và tài chính' },
    { word: 'schedule', meaning_vi: 'Lịch trình, tiến độ triển khai' },
    { word: 'constraint', meaning_vi: 'Ràng buộc hoặc giới hạn thực tế' },
    { word: 'contingency', meaning_vi: 'Phương án dự phòng rủi ro phát sinh' },
    { word: 'feasibility', meaning_vi: 'Tính khả thi của đề án' },
    { word: 'transparency', meaning_vi: 'Tính minh bạch và rõ ràng' },
    { word: 'incentive', meaning_vi: 'Động lực hoặc chính sách khen thưởng' },
    { word: 'dilemma', meaning_vi: 'Tình thế tiến thoái lưỡng nan' },
    { word: 'discrepancy', meaning_vi: 'Sự chênh lệch, sai số giữa các dữ liệu' },
    { word: 'initiative', meaning_vi: 'Sáng kiến cải tiến mang tính chủ động' },
    { word: 'consensus', meaning_vi: 'Sự đồng thuận chung của cả tập thể' },
    { word: 'resilience', meaning_vi: 'Khả năng phục hồi và chống chịu khó khăn' },
    { word: 'bandwidth', meaning_vi: 'Năng lực xử lý hoặc dung lượng tải công việc' },
    { word: 'competence', meaning_vi: 'Năng lực chuyên môn vững vàng' },
    { word: 'nuance', meaning_vi: 'Sắc thái tinh tế, khác biệt nhỏ' },
    { word: 'paradigm', meaning_vi: 'Mô hình chuẩn mực hoặc hệ tư duy' },
    { word: 'rationale', meaning_vi: 'Lý do căn bản, cơ sở lý luận' },
    { word: 'benchmark', meaning_vi: 'Tiêu chuẩn đánh giá chuẩn đối sánh' }
  ],
  adv: [
    { word: 'meticulously', meaning_vi: 'Một cách tỉ mỉ, cẩn trọng từng chi tiết' },
    { word: 'resiliently', meaning_vi: 'Một cách kiên cường, bền bỉ vượt khó' },
    { word: 'articulately', meaning_vi: 'Một cách mạch lạc, lưu loát, rõ ràng' },
    { word: 'proactively', meaning_vi: 'Một cách chủ động, tiên phong xử lý' },
    { word: 'pragmatically', meaning_vi: 'Một cách thực tế, chú trọng hiệu quả' },
    { word: 'rigorously', meaning_vi: 'Một cách nghiêm ngặt, chuẩn xác' },
    { word: 'comprehensively', meaning_vi: 'Một cách toàn diện, bao quát' },
    { word: 'consistently', meaning_vi: 'Một cách nhất quán, liên tục đều đặn' },
    { word: 'substantially', meaning_vi: 'Một cách đáng kể, căn bản' },
    { word: 'inadvertently', meaning_vi: 'Một cách vô tình, sơ ý ngoài ý muốn' },
    { word: 'seamlessly', meaning_vi: 'Một cách mượt mà, liền mạch' },
    { word: 'tentatively', meaning_vi: 'Một cách dè dặt, thăm dò, dự kiến' },
    { word: 'inherently', meaning_vi: 'Vốn dĩ, mang tính bản chất tự nhiên' },
    { word: 'inevitably', meaning_vi: 'Tất yếu, chắc chắn sẽ xảy ra' },
    { word: 'exclusively', meaning_vi: 'Duy nhất, độc quyền, chỉ dành riêng' }
  ],
  phrase: [
    { word: 'take for granted', meaning_vi: 'Xem điều gì là hiển nhiên (không trân trọng)' },
    { word: 'bear in mind', meaning_vi: 'Ghi nhớ kỹ trong tâm trí' },
    { word: 'touch base', meaning_vi: 'Trao đổi nhanh, liên lạc để cập nhật tình hình' },
    { word: 'get the ball rolling', meaning_vi: 'Bắt đầu khởi động công việc' },
    { word: 'think outside the box', meaning_vi: 'Tư duy sáng tạo, đột phá, vượt khuôn khổ' },
    { word: 'come up with', meaning_vi: 'Nảy ra ý tưởng hoặc giải pháp mới' },
    { word: 'put up with', meaning_vi: 'Chịu đựng, nhẫn nại trước điều khó chịu' },
    { word: 'call it a day', meaning_vi: 'Kết thúc công việc trong ngày' },
    { word: 'play it by ear', meaning_vi: 'Tùy cơ ứng biến theo diễn biến thực tế' },
    { word: 'keep an eye on', meaning_vi: 'Để mắt, theo dõi sát sao tiến độ' },
    { word: 'ahead of the curve', meaning_vi: 'Đi trước đón đầu xu hướng' },
    { word: 'on the fence', meaning_vi: 'Còn phân vân, chưa thể đưa ra quyết định' }
  ]
};

export const POS_LABELS = {
  adj: 'Tính từ (Adjective)',
  verb: 'Động từ (Verb)',
  noun: 'Danh từ (Noun)',
  adv: 'Trạng từ (Adverb)',
  phrase: 'Cụm từ / Thành ngữ (Phrase)'
};

export function escapeRegExp(string) {
  return String(string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getWordPos(wordObj) {
  if (!wordObj) return 'noun';
  const rawPos = String(wordObj.part_of_speech || '').toLowerCase().trim();
  const word = String(wordObj.word || '').toLowerCase().trim();

  if (rawPos.includes('adj') || rawPos.includes('tính')) return 'adj';
  if (rawPos.includes('verb') || rawPos.includes('động') || rawPos.includes('v.')) return 'verb';
  if (rawPos.includes('noun') || rawPos.includes('danh') || rawPos.includes('n.')) return 'noun';
  if (rawPos.includes('adv') || rawPos.includes('trạng')) return 'adv';
  if (rawPos.includes('phrase') || rawPos.includes('idiom') || rawPos.includes('cụm') || word.includes(' ')) return 'phrase';

  if (word.endsWith('ly') && !['friendly', 'lovely', 'lonely', 'early', 'deadly', 'lively'].includes(word)) return 'adv';
  if (/(?:tion|ment|ness|ity|ance|ence|ship|ism|ist|or|er|ure|hood|dom)$/.test(word)) return 'noun';
  if (/(?:able|ible|ful|less|ous|ive|ic|al|ant|ent|ish)$/.test(word)) return 'adj';
  if (/(?:ize|ise|ate|ify)$/.test(word)) return 'verb';

  for (const pos of ['adj', 'verb', 'noun', 'adv', 'phrase']) {
    if (CURATED_POS_DISTRACTORS[pos]?.some(d => d.word.toLowerCase() === word)) {
      return pos;
    }
  }

  return 'noun';
}

export const IRREGULAR_VERBS = {
  be: { s: 'is', past: 'was', pp: 'been', ing: 'being' },
  have: { s: 'has', past: 'had', pp: 'had', ing: 'having' },
  do: { s: 'does', past: 'did', pp: 'done', ing: 'doing' },
  go: { s: 'goes', past: 'went', pp: 'gone', ing: 'going' },
  make: { s: 'makes', past: 'made', pp: 'made', ing: 'making' },
  take: { s: 'takes', past: 'took', pp: 'taken', ing: 'taking' },
  give: { s: 'gives', past: 'gave', pp: 'given', ing: 'giving' },
  lead: { s: 'leads', past: 'led', pp: 'led', ing: 'leading' },
  build: { s: 'builds', past: 'built', pp: 'built', ing: 'building' },
  understand: { s: 'understands', past: 'understood', pp: 'understood', ing: 'understanding' },
  choose: { s: 'chooses', past: 'chose', pp: 'chosen', ing: 'choosing' },
  speak: { s: 'speaks', past: 'spoke', pp: 'spoken', ing: 'speaking' },
  find: { s: 'finds', past: 'found', pp: 'found', ing: 'finding' },
  bring: { s: 'brings', past: 'brought', pp: 'brought', ing: 'bringing' },
  keep: { s: 'keeps', past: 'kept', pp: 'kept', ing: 'keeping' },
  set: { s: 'sets', past: 'set', pp: 'set', ing: 'setting' },
  think: { s: 'thinks', past: 'thought', pp: 'thought', ing: 'thinking' },
  seek: { s: 'seeks', past: 'sought', pp: 'sought', ing: 'seeking' },
  run: { s: 'runs', past: 'ran', pp: 'run', ing: 'running' },
  become: { s: 'becomes', past: 'became', pp: 'become', ing: 'becoming' },
  begin: { s: 'begins', past: 'began', pp: 'begun', ing: 'beginning' }
};

export const IRREGULAR_NOUNS = {
  criterion: 'criteria',
  analysis: 'analyses',
  hypothesis: 'hypotheses',
  thesis: 'theses',
  phenomenon: 'phenomena',
  datum: 'data',
  person: 'people',
  child: 'children',
  man: 'men',
  woman: 'women'
};

export function inflectEnglishWord(word, partOfSpeech = '') {
  const raw = (word || '').toLowerCase().trim();
  const parts = raw.split(/\s+/);
  const mainWord = parts[0];
  const rest = parts.slice(1).join(' ');
  const suffix = rest ? ' ' + rest : '';

  const irregularV = IRREGULAR_VERBS[mainWord];
  const irregularN = IRREGULAR_NOUNS[mainWord];

  // 1. Third-person singular (-s / -es / -ies)
  let sForm = '';
  if (irregularV) {
    sForm = irregularV.s + suffix;
  } else if (/(?:s|sh|ch|x|z|o)$/.test(mainWord)) {
    sForm = mainWord + 'es' + suffix;
  } else if (/[^aeiou]y$/.test(mainWord)) {
    sForm = mainWord.slice(0, -1) + 'ies' + suffix;
  } else {
    sForm = mainWord + 's' + suffix;
  }

  // 2. Past tense & past participle (-ed / -d / -ied / irregular)
  let edForm = '';
  if (irregularV) {
    edForm = irregularV.past + suffix;
  } else if (mainWord.endsWith('e')) {
    edForm = mainWord + 'd' + suffix;
  } else if (/[^aeiou]y$/.test(mainWord)) {
    edForm = mainWord.slice(0, -1) + 'ied' + suffix;
  } else if (/[^aeiou][aeiou][^aeiouwxy]$/.test(mainWord) && mainWord.length <= 5) {
    edForm = mainWord + mainWord.slice(-1) + 'ed' + suffix;
  } else {
    edForm = mainWord + 'ed' + suffix;
  }

  // 3. Gerund / Present participle (-ing)
  let ingForm = '';
  if (irregularV) {
    ingForm = irregularV.ing + suffix;
  } else if (mainWord.endsWith('ie')) {
    ingForm = mainWord.slice(0, -2) + 'ying' + suffix;
  } else if (mainWord.endsWith('e') && !mainWord.endsWith('ee')) {
    ingForm = mainWord.slice(0, -1) + 'ing' + suffix;
  } else if (/[^aeiou][aeiou][^aeiouwxy]$/.test(mainWord) && mainWord.length <= 5) {
    ingForm = mainWord + mainWord.slice(-1) + 'ing' + suffix;
  } else {
    ingForm = mainWord + 'ing' + suffix;
  }

  // 4. Plural form for nouns (e.g. 'contingency plan' -> 'contingency plans', 'scope creep' -> 'scope creeps')
  let plural = '';
  if (parts.length > 1 && (partOfSpeech.includes('noun') || !partOfSpeech.includes('verb'))) {
    const lastWord = parts[parts.length - 1];
    const irregularLastN = IRREGULAR_NOUNS[lastWord];
    let lastPlural = irregularLastN || (/(?:s|sh|ch|x|z)$/.test(lastWord) ? lastWord + 'es' : (/[^aeiou]y$/.test(lastWord) ? lastWord.slice(0, -1) + 'ies' : lastWord + 's'));
    plural = [...parts.slice(0, -1), lastPlural].join(' ');
  } else {
    plural = irregularN ? irregularN + suffix : sForm;
  }

  // 5. Adverb form for adjectives
  let advForm = '';
  if (mainWord.endsWith('ic')) {
    advForm = mainWord + 'ally' + suffix;
  } else if (mainWord.endsWith('le')) {
    advForm = mainWord.slice(0, -1) + 'y' + suffix;
  } else if (mainWord.endsWith('y')) {
    advForm = mainWord.slice(0, -1) + 'ily' + suffix;
  } else if (!mainWord.endsWith('ly')) {
    advForm = mainWord + 'ly' + suffix;
  }

  return {
    base: raw,
    sForm,
    edForm,
    ingForm,
    plural,
    advForm
  };
}

export function generateGrammarClozeQuestion({
  targetWord,
  validTargetMeaning,
  examples = [],
  qDifficulty = 'medium',
  questionIndex = 0,
  otherWords = [],
  usedQuestionTexts = new Set()
}) {
  const pos = (targetWord.part_of_speech || '').toLowerCase();
  const forms = inflectEnglishWord(targetWord.word, pos);
  const isVerb = pos.includes('verb') || ['avoid', 'delegate', 'leverage', 'implement', 'facilitate', 'mitigate', 'articulate', 'pivot', 'escalate', 'reach', 'prioritize', 'benchmark'].includes(targetWord.word.toLowerCase());
  const isNoun = pos.includes('noun') || ['milestone', 'deliverable', 'constraint', 'strategy', 'criterion', 'analysis', 'contingency plan', 'bandwidth', 'bottleneck', 'priority'].includes(targetWord.word.toLowerCase());
  const isAdj = pos.includes('adj') || ['resilient', 'meticulous', 'articulate', 'eloquent', 'ubiquitous', 'innovative', 'adaptable', 'rude'].includes(targetWord.word.toLowerCase());

  let questionText = '';
  let promptSubtitle = '';
  let correctAnswer = targetWord.word;
  let explanation = '';

  // Helper to pick an unused template from a rich pool
  const pickUnusedTemplate = (templateList) => {
    for (let k = 0; k < templateList.length; k++) {
      const idx = (questionIndex + k) % templateList.length;
      const candidate = templateList[idx];
      if (!usedQuestionTexts.has(candidate)) {
        usedQuestionTexts.add(candidate);
        return candidate;
      }
    }
    const base = templateList[questionIndex % templateList.length];
    const uniqueTpl = `[Q${questionIndex + 1}] ${base}`;
    usedQuestionTexts.add(uniqueTpl);
    return uniqueTpl;
  };

  // =========================================================================
  // ƯU TIÊN 1: Trích xuất câu từ ví dụ thực tế của chính từ đó (Authentic Context)
  // =========================================================================
  let matchedSentence = '';
  let matchedWord = '';

  const candidateForms = [
    forms.base,
    forms.sForm,
    forms.edForm,
    forms.ingForm,
    forms.plural,
    forms.advForm,
    forms.past,
    forms.pp
  ].filter(Boolean);

  if (Array.isArray(examples) && examples.length > 0) {
    for (const ex of examples) {
      const raw = typeof ex === 'string' ? ex : (ex?.en || ex?.sentence || '');
      if (!raw) continue;
      // Loại bỏ phần dịch nghĩa tiếng Việt trong ngoặc đơn nếu có
      const englishOnly = raw.replace(/\s*\([^)]*\)\s*$/, '').trim();

      for (const form of candidateForms) {
        const regex = new RegExp(`\\b${form}\\b`, 'i');
        if (regex.test(englishOnly)) {
          const candidateSentence = englishOnly.replace(regex, '_______');
          if (!usedQuestionTexts.has(candidateSentence)) {
            matchedSentence = candidateSentence;
            matchedWord = form;
            usedQuestionTexts.add(matchedSentence);
            break;
          }
        }
      }
      if (matchedSentence) break;
    }
  }

  if (matchedSentence) {
    questionText = matchedSentence;
    correctAnswer = matchedWord;

    if (correctAnswer === forms.sForm && forms.sForm !== forms.base) {
      promptSubtitle = qDifficulty === 'easy'
        ? `Chia động từ ở thì Hiện tại đơn - Ngôi thứ 3 số ít (${validTargetMeaning} - Thêm -s/-es):`
        : `Chia động từ ở thì Hiện tại đơn (Chủ ngữ ngôi thứ 3 số ít +s/es):`;
      explanation = `Chủ ngữ ngôi thứ 3 số ít ở thì Hiện tại đơn đòi hỏi động từ thêm đuôi "-s/-es" ➔ Đáp án chính xác là "${correctAnswer}".`;
    } else if ((correctAnswer === forms.edForm || correctAnswer === forms.past) && correctAnswer !== forms.base) {
      promptSubtitle = qDifficulty === 'easy'
        ? `Chia động từ ở thì Quá khứ đơn (${validTargetMeaning} - Dạng quá khứ):`
        : `Chia động từ ở thì Quá khứ đơn (-ed / V2):`;
      explanation = `Ngữ cảnh diễn ra trong quá khứ đòi hỏi động từ chia ở thì Quá khứ đơn (V-ed / V2) ➔ Đáp án chính xác là "${correctAnswer}".`;
    } else if (correctAnswer === forms.ingForm && forms.ingForm !== forms.base) {
      promptSubtitle = `Chọn dạng danh động từ thích hợp (${validTargetMeaning} - V-ing):`;
      explanation = `Vị trí sau giới từ hoặc làm chủ ngữ đòi hỏi dạng danh động từ (Gerund V-ing) ➔ Đáp án chính xác là "${correctAnswer}".`;
    } else if (correctAnswer === forms.plural && forms.plural !== forms.base) {
      promptSubtitle = `Chọn dạng danh từ số nhiều thích hợp (${validTargetMeaning} - Thêm -s/-es):`;
      explanation = `Ngữ cảnh số nhiều đòi hỏi danh từ đếm được ở dạng số nhiều (-s/-es) ➔ Đáp án chính xác là "${correctAnswer}".`;
    } else if (correctAnswer === forms.advForm && forms.advForm !== forms.base) {
      promptSubtitle = `Chọn trạng từ (-ly) thích hợp để bổ nghĩa (${validTargetMeaning}):`;
      explanation = `Vị trí bổ nghĩa cho động từ/tính từ đòi hỏi trạng từ (Adverb -ly) ➔ Đáp án chính xác là "${correctAnswer}".`;
    } else {
      promptSubtitle = qDifficulty === 'easy'
        ? `Điền từ thích hợp vào chỗ trống (${validTargetMeaning}):`
        : `Điền từ thích hợp vào ngữ cảnh câu:`;
      explanation = `Điền từ "${correctAnswer}" (${validTargetMeaning}) để hoàn chỉnh câu: "${questionText.replace(/_______/g, correctAnswer)}".`;
    }
  } else {
    // =========================================================================
    // ƯU TIÊN 2 (FALLBACK): Khi không có ví dụ mẫu, dùng các mẫu câu phong phú đa dạng
    // =========================================================================
    if (isVerb) {
      const verbCycle = questionIndex % 3;
      if (verbCycle === 0) {
        correctAnswer = forms.sForm;
        const templates = [
          `She consistently _______ to ensure the best outcome for the entire team.`,
          `Our manager carefully _______ each request before making a final decision.`,
          `Every specialist regularly _______ all important steps to guarantee quality.`,
          `A proficient engineer frequently _______ complex systems to eliminate bottlenecks.`,
          `The department head actively _______ emerging challenges during daily standup meetings.`,
          `In our project workflow, each member _______ tasks responsibly to keep momentum.`,
          `The coordinator diligently _______ all relevant details prior to final deployment.`,
          `A dedicated mentor continuously _______ the growth and independence of learners.`
        ];
        questionText = pickUnusedTemplate(templates);
        promptSubtitle = qDifficulty === 'easy'
          ? `Chia động từ ở thì Hiện tại đơn - Ngôi thứ 3 số ít (${validTargetMeaning} - Thêm -s/-es):`
          : `Chia động từ ở thì Hiện tại đơn (Chủ ngữ ngôi thứ 3 số ít "She / He / Manager" + V-s/es):`;
        explanation = `Chủ ngữ "She / Our manager" là ngôi thứ 3 số ít ở thì Hiện tại đơn, do đó động từ bắt buộc phải thêm đuôi "-s/-es" ➔ Đáp án chính xác là "${correctAnswer}".`;
      } else if (verbCycle === 1) {
        correctAnswer = forms.edForm;
        const templates = [
          `During yesterday's meeting, she _______ her perspective with great clarity.`,
          `Last week, the team successfully _______ all pending action items.`,
          `In the previous session, the committee _______ the revised proposal.`,
          `Two days ago, the technical director _______ an innovative solution to the problem.`,
          `Earlier this morning, our specialists _______ all core configurations before release.`,
          `At the annual conference, the keynote speaker _______ key findings with the audience.`,
          `During the last sprint, they _______ critical milestones ahead of schedule.`,
          `Following the incident, the support team _______ the resolution immediately.`
        ];
        questionText = pickUnusedTemplate(templates);
        promptSubtitle = qDifficulty === 'easy'
          ? `Chia động từ ở thì Quá khứ đơn (${validTargetMeaning} - Thêm -ed / V2):`
          : `Chia động từ ở thì Quá khứ đơn (Dấu hiệu "Yesterday / Last week"):`;
        explanation = `Trạng từ thời gian trong quá khứ ("Yesterday / Last week") đòi hỏi động từ chia ở thì Quá khứ đơn (V-ed / V2) ➔ Đáp án chính xác là "${correctAnswer}".`;
      } else {
        correctAnswer = forms.ingForm;
        const templates = [
          `They achieved excellent results by _______ the most effective method early.`,
          `She improved productivity by _______ routine tasks in an organized way.`,
          `After _______ the situation thoroughly, everyone reached a mutual agreement.`,
          `Before _______ new features, the team conducted thorough performance tests.`,
          `Success in this field requires _______ consistent effort and continuous dedication.`,
          `By _______ proactive measures, they prevented potential security vulnerabilities.`,
          `Without _______ the underlying causes, resolving the issue permanently is difficult.`,
          `In addition to _______ daily responsibilities, she devoted time to professional learning.`
        ];
        questionText = pickUnusedTemplate(templates);
        promptSubtitle = `Chọn dạng danh động từ thích hợp sau giới từ ("By / After" + V-ing - ${validTargetMeaning}):`;
        explanation = `Đứng sau các giới từ như "By", "After", "Without", động từ phải ở dạng danh động từ (Gerund V-ing) ➔ Đáp án chính xác là "${correctAnswer}".`;
      }
    } else if (isNoun) {
      const nounCycle = questionIndex % 2;
      if (nounCycle === 0) {
        correctAnswer = forms.plural;
        const templates = [
          `The committee evaluated several important _______ before granting final approval.`,
          `There are multiple strategic _______ that the team must achieve by the end of this month.`,
          `Several critical _______ were reviewed carefully during the planning phase.`,
          `The organization introduced clear _______ to measure ongoing productivity.`,
          `All designated _______ must be verified and confirmed prior to final release.`,
          `The report highlighted various _______ that could influence our project roadmap.`,
          `Effective organizations analyze different _______ to adapt to changing environments.`,
          `Management assessed numerous _______ submitted during the consultation process.`
        ];
        questionText = pickUnusedTemplate(templates);
        promptSubtitle = `Chọn dạng danh từ số nhiều thích hợp sau lượng từ ("several / multiple" - ${validTargetMeaning}):`;
        explanation = `Các từ chỉ số lượng ("several / multiple") đòi hỏi danh từ đếm được phải ở dạng số nhiều (-s/-es) ➔ Đáp án chính xác là "${correctAnswer}".`;
      } else {
        correctAnswer = forms.base;
        const templates = [
          `Achieving this objective represents an essential _______ for our long-term plan.`,
          `The coordinator identified an unexpected _______ during the review process.`,
          `Establishing a clear _______ is critical for maintaining alignment across departments.`,
          `The company achieved a major _______ by launching the platform ahead of time.`,
          `Each team member contributed a significant _______ to the overall success of the project.`,
          `Maintaining an appropriate _______ helps prevent burnout during intensive periods.`,
          `The new policy provides a strong _______ for ensuring operational excellence.`,
          `She provided an insightful _______ that clarified the central issue under discussion.`
        ];
        questionText = pickUnusedTemplate(templates);
        promptSubtitle = `Điền danh từ thích hợp vào chỗ trống (sau mạo từ "a / an" - ${validTargetMeaning}):`;
        explanation = `Vị trí sau mạo từ "a / an" đòi hỏi danh từ đếm được ở dạng số ít ➔ Đáp án chính xác là "${correctAnswer}".`;
      }
    } else if (isAdj) {
      const adjCycle = questionIndex % 2;
      if (adjCycle === 0) {
        correctAnswer = targetWord.word;
        const templates = [
          `It is important to avoid being _______ when communicating with colleagues or clients.`,
          `Her response was considered quite _______ by everyone present in the room.`,
          `The speaker gave a very _______ presentation that kept the entire audience engaged.`,
          `Maintaining a _______ approach to problem-solving helps overcome unexpected obstacles.`,
          `The team adopted a remarkably _______ strategy that maximized operational efficiency.`,
          `His explanations were exceptionally _______, making complex concepts easy to understand.`,
          `Creating an inclusive and _______ environment encourages active collaboration.`,
          `They demonstrated an extraordinarily _______ attitude throughout demanding circumstances.`
        ];
        questionText = pickUnusedTemplate(templates);
        promptSubtitle = qDifficulty === 'easy'
          ? `Chọn tính từ thích hợp bổ nghĩa cho ngữ cảnh câu (${validTargetMeaning}):`
          : `Chọn tính từ phù hợp với ngữ cảnh câu:`;
        explanation = `Vị trí sau "being / quite / very" đòi hỏi một tính từ (Adjective) để bổ nghĩa ➔ "${correctAnswer}".`;
      } else {
        correctAnswer = forms.advForm || (targetWord.word + 'ly');
        const templates = [
          `The team handled the unexpected inquiry _______ and professionally.`,
          `She addressed the audience's concerns _______ during the session.`,
          `The engineer analyzed the system performance _______ to identify the root cause.`,
          `All members worked _______ to ensure deliverables met rigorous quality standards.`,
          `He presented his findings _______, preventing any possible misunderstandings.`,
          `The service responded _______ even under peak traffic conditions.`,
          `She adapted _______ to the new workflow and delivered immediate results.`,
          `They evaluated all available alternatives _______ before reaching a conclusion.`
        ];
        questionText = pickUnusedTemplate(templates);
        promptSubtitle = `Chọn trạng từ (-ly) thích hợp bổ nghĩa cho động từ (${validTargetMeaning}):`;
        explanation = `Vị trí bổ nghĩa cho động từ đòi hỏi một trạng từ (Adverb -ly) ➔ Đáp án chính xác là "${correctAnswer}".`;
      }
    } else {
      correctAnswer = targetWord.word;
      const templates = [
        `In everyday professional communication, it is helpful to _______ in a clear and constructive manner.`,
        `Effective collaboration requires individuals to _______ with empathy and mutual respect.`,
        `To achieve long-term excellence, one must learn how to _______ effectively across varied situations.`,
        `A robust plan enables the organization to _______ smoothly during times of change.`,
        `Practicing deliberate habits makes it easier to _______ consistently toward ambitious goals.`
      ];
      questionText = pickUnusedTemplate(templates);
      promptSubtitle = `Điền từ vựng thích hợp vào ngữ cảnh câu (${validTargetMeaning}):`;
      explanation = `Điền từ "${targetWord.word}" (${validTargetMeaning}) để hoàn chỉnh câu chuẩn xác.`;
    }
  }

  // =========================================================================
  // XÂY DỰNG PHƯƠNG ÁN TRẮC NGHIỆM (4 OPTIONS) CHUẨN NGỮ PHÁP CÙNG TỪ LOẠI
  // =========================================================================
  const tricky = generateTrickyWordFamily(targetWord.word);
  let options = [correctAnswer];

  if (isVerb) {
    options.push(forms.base, forms.sForm, forms.edForm, forms.ingForm);
  } else if (isAdj) {
    options.push(forms.base, forms.advForm || (targetWord.word + 'ly'), ...tricky);
  } else if (isNoun) {
    options.push(forms.base, forms.plural);
  }

  options = [...new Set(options.filter(Boolean))];

  // Bổ sung các phương án gây nhiễu cùng từ loại (Same Part of Speech Distractors)
  const posKey = isAdj ? 'adj' : (isVerb ? 'verb' : (isNoun ? 'noun' : null));
  const samePosFromWords = otherWords
    .filter(w => {
      const wPos = (w.part_of_speech || '').toLowerCase();
      if (isAdj) return wPos.includes('adj');
      if (isVerb) return wPos.includes('verb');
      if (isNoun) return wPos.includes('noun');
      return false;
    })
    .map(w => w.word);

  const curatedPosPool = (posKey && CURATED_POS_DISTRACTORS[posKey]) ? CURATED_POS_DISTRACTORS[posKey].map(d => d.word) : [];
  const candidatePool = [...samePosFromWords, ...curatedPosPool];

  for (const item of candidatePool) {
    if (options.length >= 4) break;
    if (item && !options.includes(item) && item.toLowerCase() !== correctAnswer.toLowerCase()) {
      options.push(item);
    }
  }

  // Fallback to curated same POS pool if still < 4
  const fallbackPosPool = (posKey && CURATED_POS_DISTRACTORS[posKey]) ? CURATED_POS_DISTRACTORS[posKey].map(d => d.word) : (CURATED_POS_DISTRACTORS.noun.map(d => d.word));
  for (const item of fallbackPosPool) {
    if (options.length >= 4) break;
    if (item && !options.includes(item) && item.toLowerCase() !== correctAnswer.toLowerCase()) {
      options.push(item);
    }
  }

  options = options.slice(0, 4).sort(() => 0.5 - Math.random());

  return {
    questionText,
    promptSubtitle,
    correctAnswer,
    options,
    explanation
  };
}

export function generateTrickyWordFamily(word) {
  const w = (word || '').toLowerCase().trim();
  const forms = new Set();
  if (w.endsWith('tion')) {
    forms.add(w.slice(0, -4) + 'te');
    forms.add(w.slice(0, -4) + 'tive');
    forms.add(w.slice(0, -4) + 'tively');
  } else if (w.endsWith('able') || w.endsWith('ible')) {
    forms.add(w.slice(0, -4) + 'ability');
    forms.add(w.slice(0, -4) + 'ably');
  } else if (w.endsWith('ent')) {
    forms.add(w.slice(0, -3) + 'ence');
    forms.add(w.slice(0, -3) + 'ently');
  } else if (w.endsWith('ant')) {
    forms.add(w.slice(0, -3) + 'ance');
    forms.add(w.slice(0, -3) + 'antly');
  } else if (w.endsWith('ly')) {
    forms.add(w.slice(0, -2));
  } else if (w.endsWith('ive')) {
    forms.add(w.slice(0, -3) + 'ion');
    forms.add(w.slice(0, -3) + 'ively');
  } else {
    if (w.endsWith('e')) {
      forms.add(w + 'ness');
      forms.add(w + 'ly');
      forms.add(w + 'r');
    } else {
      forms.add(w + 'ness');
      forms.add(w + 'ly');
      forms.add(w + 'ing');
      forms.add(w + 'ed');
    }
  }
  return [...forms].filter(f => f !== w && f.length > 2);
}

const HIGH_QUALITY_DISTRACTORS = [
  { word: 'resilient', meaning_vi: 'Kiên cường, có khả năng phục hồi nhanh' },
  { word: 'articulate', meaning_vi: 'Ăn nói lưu loát, diễn đạt mạch lạc rõ ràng' },
  { word: 'meticulous', meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ' },
  { word: 'leverage', meaning_vi: 'Tận dụng, phát huy tối đa lợi thế / thế mạnh' },
  { word: 'innovative', meaning_vi: 'Đổi mới, có tính sáng tạo và đột phá' },
  { word: 'adaptable', meaning_vi: 'Thích ứng linh hoạt với mọi hoàn cảnh' },
  { word: 'proactive', meaning_vi: 'Chủ động tiên phong trong công việc' },
  { word: 'ubiquitous', meaning_vi: 'Phổ biến, có mặt ở khắp mọi nơi' },
  { word: 'sustainable', meaning_vi: 'Bền vững, có khả năng duy trì lâu dài' },
  { word: 'comprehensive', meaning_vi: 'Toàn diện, bao quát mọi khía cạnh' },
  { word: 'pragmatic', meaning_vi: 'Thực tế, coi trọng tính hiệu quả ứng dụng' },
  { word: 'collaborative', meaning_vi: 'Có tinh thần hợp tác, làm việc nhóm' }
];

const CORE_VOCABULARY_DICTIONARY = {
  love: 'Tình cảm yêu thương, sự yêu mến gắn bó sâu sắc',
  pain: 'Nỗi đau đớn, sự tổn thương về thể xác hoặc tinh thần',
  hope: 'Niềm hy vọng, sự trông đợi vào điều tốt đẹp',
  life: 'Cuộc sống, sự sinh tồn và trải nghiệm nhân sinh',
  work: 'Công việc, nhiệm vụ hoặc hoạt động lao động',
  time: 'Thời gian, khoảnh khắc diễn ra sự việc',
  dream: 'Ước mơ, hoài bão hoặc giấc chiêm bao',
  peace: 'Sự bình yên, hòa bình và thanh thản trong tâm hồn',
  focus: 'Sự tập trung, chú ý cao độ vào mục tiêu',
  habit: 'Thói quen, hành vi lặp đi lặp lại thường nhật',
  truth: 'Sự thật, chân lý khách quan',
  courage: 'Lòng dũng cảm, sự can đảm đối mặt thử thách',
  freedom: 'Sự tự do, quyền tự quyết không bị ràng buộc',
  wisdom: 'Sự thông thái, trí tuệ và hiểu biết sâu rộng'
};

const cleanMeaningText = (meaningVi, meaningEn, word) => {
  const wKey = (word || '').toLowerCase().trim();
  if (CORE_VOCABULARY_DICTIONARY[wKey]) {
    return CORE_VOCABULARY_DICTIONARY[wKey];
  }
  if (!meaningVi || typeof meaningVi !== 'string' || meaningVi.includes('Tra cứu thêm')) {
    // Check CURATED_POS_DISTRACTORS across all parts of speech
    for (const posKey of Object.keys(CURATED_POS_DISTRACTORS)) {
      const match = CURATED_POS_DISTRACTORS[posKey].find(d => d.word.toLowerCase() === wKey);
      if (match) return match.meaning_vi;
    }
    const found = HIGH_QUALITY_DISTRACTORS.find(d => d.word.toLowerCase() === wKey);
    if (found) return found.meaning_vi;
    if (meaningEn && typeof meaningEn === 'string' && !meaningEn.includes('Definition and') && !meaningEn.includes('Definition of')) {
      return meaningEn.trim();
    }
    return 'Khái niệm, trạng thái hoặc hành động này';
  }
  return meaningVi.trim();
};

export function extractCollocations(targetWord) {
  let list = [];
  if (targetWord && targetWord.collocations) {
    try {
      const parsed = typeof targetWord.collocations === 'string' ? JSON.parse(targetWord.collocations) : targetWord.collocations;
      if (Array.isArray(parsed)) {
        list = parsed.map(c => typeof c === 'string' ? c : (c?.collocation || c?.phrase || '')).filter(Boolean);
      }
    } catch (e) {}
  }
  return list.slice(0, 3);
}

export function getAuthenticContextSentence(targetWord, pos = 'noun') {
  let examples = [];
  try {
    examples = typeof targetWord.examples === 'string' ? JSON.parse(targetWord.examples || '[]') : (targetWord.examples || []);
  } catch (e) {
    examples = [];
  }

  const rawWord = (targetWord.word || '').trim();
  const forms = inflectEnglishWord(rawWord, pos);
  const candidateForms = [
    rawWord,
    forms.sForm,
    forms.edForm,
    forms.ingForm,
    forms.plural,
    forms.advForm
  ].filter(Boolean);

  if (Array.isArray(examples) && examples.length > 0) {
    for (const ex of examples) {
      const rawText = typeof ex === 'string' ? ex : (ex?.en || ex?.sentence || '');
      if (!rawText) continue;

      let englishText = rawText;
      let sentenceTranslation = '';
      const viMatch = rawText.match(/\((?:Dịch|Nghĩa|dịch|nghĩa)?\s*:?\s*([^)]+)\)\s*$/i);
      if (viMatch) {
        sentenceTranslation = viMatch[1].trim();
        englishText = rawText.replace(/\s*\([^)]*\)\s*$/, '').trim();
      }

      for (const form of candidateForms) {
        const regex = new RegExp(`\\b${escapeRegExp(form)}\\b`, 'i');
        if (regex.test(englishText)) {
          const boldedSentence = englishText.replace(regex, `**${form}**`);
          const blankSentence = englishText.replace(regex, '_______');
          return {
            fullSentence: englishText,
            boldedSentence,
            blankSentence,
            matchedForm: form,
            sentenceTranslation: sentenceTranslation || (targetWord.meaning_vi ? `Dịch câu: ${targetWord.meaning_vi}` : '')
          };
        }
      }
    }
  }

  // Fallback high-quality Cambridge / IELTS contextual sentences
  const meaning = targetWord.meaning_vi || 'từ vựng này';
  let defaultFull = '';
  let defaultBold = '';
  let defaultBlank = '';
  let defaultTranslation = '';

  if (pos === 'verb') {
    defaultFull = `To ensure project success, our team must ${rawWord} key objectives proactively.`;
    defaultBold = `To ensure project success, our team must **${rawWord}** key objectives proactively.`;
    defaultBlank = `To ensure project success, our team must _______ key objectives proactively.`;
    defaultTranslation = `Để đảm bảo thành công cho dự án, đội ngũ của chúng ta phải ${meaning.toLowerCase()} các mục tiêu then chốt một cách chủ động.`;
  } else if (pos === 'adj') {
    defaultFull = `The leadership praised the specialist for maintaining a ${rawWord} attitude under pressure.`;
    defaultBold = `The leadership praised the specialist for maintaining a **${rawWord}** attitude under pressure.`;
    defaultBlank = `The leadership praised the specialist for maintaining a _______ attitude under pressure.`;
    defaultTranslation = `Ban lãnh đạo khen ngợi chuyên gia vì luôn duy trì thái độ ${meaning.toLowerCase()} dưới áp lực.`;
  } else if (pos === 'noun') {
    defaultFull = `Achieving this strategic ${rawWord} was a decisive factor in our long-term roadmap.`;
    defaultBold = `Achieving this strategic **${rawWord}** was a decisive factor in our long-term roadmap.`;
    defaultBlank = `Achieving this strategic _______ was a decisive factor in our long-term roadmap.`;
    defaultTranslation = `Đạt được ${meaning.toLowerCase()} chiến lược này là yếu tố quyết định trong lộ trình dài hạn của chúng tôi.`;
  } else if (pos === 'adv') {
    defaultFull = `She analyzed the complex architecture ${rawWord} before presenting recommendations.`;
    defaultBold = `She analyzed the complex architecture **${rawWord}** before presenting recommendations.`;
    defaultBlank = `She analyzed the complex architecture _______ before presenting recommendations.`;
    defaultTranslation = `Cô ấy đã phân tích kiến trúc phức tạp ${meaning.toLowerCase()} trước khi đưa ra đề xuất.`;
  } else {
    defaultFull = `In professional environments, experienced team members always ${rawWord} to ensure collaboration.`;
    defaultBold = `In professional environments, experienced team members always **${rawWord}** to ensure collaboration.`;
    defaultBlank = `In professional environments, experienced team members always _______ to ensure collaboration.`;
    defaultTranslation = `Trong môi trường chuyên nghiệp, các thành viên giàu kinh nghiệm luôn ${meaning.toLowerCase()} để đảm bảo sự hợp tác.`;
  }

  return {
    fullSentence: defaultFull,
    boldedSentence: defaultBold,
    blankSentence: defaultBlank,
    matchedForm: rawWord,
    sentenceTranslation: defaultTranslation
  };
}

export function getSamePosDistractors({ targetWord, pos, allWords = [], count = 3, difficulty = 'medium' }) {
  const targetNorm = (targetWord.word || '').trim().toLowerCase();

  // 1. Gather other words with exact same POS from user library
  const samePosUserWords = (allWords || []).filter(w => {
    const wNorm = (w.word || '').trim().toLowerCase();
    if (wNorm === targetNorm) return false;
    if (!w.meaning_vi || w.meaning_vi.includes('Tra cứu thêm')) return false;
    return getWordPos(w) === pos;
  });

  // 2. Gather curated items for this POS
  const curatedItems = (CURATED_POS_DISTRACTORS[pos] || []).filter(d => d.word.toLowerCase() !== targetNorm);

  const combined = [];
  const seen = new Set();
  seen.add(targetNorm);

  // Shuffle user words first
  const shuffledUser = [...samePosUserWords].sort(() => 0.5 - Math.random());
  for (const item of shuffledUser) {
    const key = item.word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push({
        word: item.word,
        meaning_vi: cleanMeaningText(item.meaning_vi, item.meaning_en, item.word)
      });
    }
  }

  // Then add curated items
  const shuffledCurated = [...curatedItems].sort(() => 0.5 - Math.random());
  for (const item of shuffledCurated) {
    const key = item.word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  // Emergency fallback if pool < count
  if (combined.length < count) {
    for (const poolKey of Object.keys(CURATED_POS_DISTRACTORS)) {
      for (const item of CURATED_POS_DISTRACTORS[poolKey]) {
        const key = item.word.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
          if (combined.length >= count) break;
        }
      }
      if (combined.length >= count) break;
    }
  }

  return combined.slice(0, count);
}

export function buildPedagogicalExplanation({
  targetWord,
  pos,
  correctAnswer,
  qType,
  contextSentence = '',
  completedSentence = '',
  translation = '',
  grammarRule = '',
  userDifficulty = 'medium'
}) {
  const parts = [];
  const posLabel = POS_LABELS[pos] || 'Từ vựng';
  const cleanMeaning = cleanMeaningText(targetWord.meaning_vi, targetWord.meaning_en, targetWord.word);

  // 1. Phân tích cốt lõi (Core Grammar & Meaning)
  if (grammarRule) {
    parts.push(`💡 **Lý do đáp án đúng**: ${grammarRule}`);
  } else if (qType === 'meaning_vi' || qType === 'listening') {
    parts.push(`💡 **Phân tích ngữ cảnh**: Trong câu trên, từ "${targetWord.word}" đóng vai trò là [${posLabel}], mang ý nghĩa chuẩn xác là: "${cleanMeaning}".`);
  } else if (qType === 'reverse_en') {
    parts.push(`💡 **Phân tích từ vựng**: Để diễn đạt ý nghĩa "${cleanMeaning}" trong ngữ cảnh trên, từ vựng học thuật chuẩn xác là "${correctAnswer}" [${posLabel}].`);
  } else {
    parts.push(`💡 **Giải thích**: Điền "${correctAnswer}" (${cleanMeaning}) để tạo thành câu hoàn chỉnh đúng ngữ pháp và ngữ nghĩa.`);
  }

  // 2. Collocations thực chiến (High-Yield Collocations)
  const collocations = extractCollocations(targetWord);
  if (collocations.length > 0) {
    parts.push(`⚡ **Cụm từ vàng (Collocations)**: ${collocations.map(c => `\`${c}\``).join(', ')}.`);
  }

  // 3. Sắc thái & Lưu ý (Nuance / Register / Pitfall)
  if (targetWord.meaning_en && !targetWord.meaning_en.includes('Definition of')) {
    parts.push(`🎯 **Định nghĩa Oxford/Cambridge**: "${targetWord.meaning_en}"`);
  }

  return parts.join('\n\n');
};

export const quizService = {
  // 1. Get all available topics / tags with counts from master data topics table for specific user
  getTopics: (userId = 'admin_master_user_id') => {
    const db = getDb();
    const allWords = db.prepare(`
      SELECT id, word, topic_id, tags, level FROM words 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);
    const totalWords = allWords.length;

    let masterTopics = [];
    try {
      masterTopics = db.prepare('SELECT * FROM topics ORDER BY created_at ASC').all();
    } catch (e) {
      masterTopics = [];
    }

    const topicItems = [
      {
        id: 'All',
        name: 'Tất cả (All)',
        emoji: '📚',
        color: '#6366f1',
        count: totalWords
      }
    ];

    masterTopics.forEach(t => {
      const matchedWords = allWords.filter(w => {
        return w.topic_id && (w.topic_id.toLowerCase() === t.id.toLowerCase() || w.topic_id.toLowerCase() === t.name.toLowerCase());
      });

      topicItems.push({
        id: t.id,
        name: t.name,
        emoji: t.emoji || '📁',
        color: t.color || '#0284c7',
        description: t.description || '',
        count: matchedWords.length
      });
    });

    return topicItems;
  },

  // 1b. Get all available dates with counts of words and patterns created on each day
  getDates: (userId = 'admin_master_user_id') => {
    const db = getDb();
    const wordDates = db.prepare(`
      SELECT substr(created_at, 1, 10) as date, count(*) as count
      FROM words
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
        AND created_at IS NOT NULL
      GROUP BY substr(created_at, 1, 10)
      ORDER BY date DESC
    `).all(userId, userId, userId);

    const patternDates = db.prepare(`
      SELECT substr(created_at, 1, 10) as date, count(*) as count
      FROM patterns
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
        AND created_at IS NOT NULL
      GROUP BY substr(created_at, 1, 10)
      ORDER BY date DESC
    `).all(userId, userId, userId);

    const dateMap = new Map();
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    wordDates.forEach(r => {
      if (!r.date) return;
      const existing = dateMap.get(r.date) || { date: r.date, words_count: 0, patterns_count: 0, total_count: 0 };
      existing.words_count += r.count;
      existing.total_count += r.count;
      dateMap.set(r.date, existing);
    });

    patternDates.forEach(r => {
      if (!r.date) return;
      const existing = dateMap.get(r.date) || { date: r.date, words_count: 0, patterns_count: 0, total_count: 0 };
      existing.patterns_count += r.count;
      existing.total_count += r.count;
      dateMap.set(r.date, existing);
    });

    const sortedDates = Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    return sortedDates.map(item => {
      let label = item.date;
      try {
        const [y, m, d] = item.date.split('-');
        label = `${d}/${m}/${y}`;
      } catch (e) {}

      if (item.date === todayStr) {
        label = `Hôm nay (${label})`;
      } else if (item.date === yesterdayStr) {
        label = `Hôm qua (${label})`;
      }

      return {
        ...item,
        label
      };
    });
  },

  // 2. Generate a Quiz based on Topics, Date Scope, Count and IELTS Level
  generateQuiz: ({ topic = 'All', count = 5, mode = 'mixed', level = 'all', date_scope = 'all', date = null, start_date = null, end_date = null, userId = 'admin_master_user_id' }) => {
    const db = getDb();
    let words = db.prepare(`
      SELECT * FROM words 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);

    if (words.length === 0) {
      throw new Error('Kho từ vựng đang trống. Vui lòng thêm từ vựng trước khi tạo bài Quiz!');
    }

    const targetCount = Math.max(1, parseInt(count, 10) || 5);

    // 1. Filter by Date Scope if specified
    let candidateWords = filterItemsByDate(words, date_scope, date, start_date, end_date);
    if (candidateWords.length === 0) {
      let dateLabel = date_scope;
      if (date_scope === 'today') dateLabel = 'Hôm nay';
      else if (date_scope === 'yesterday') dateLabel = 'Hôm qua';
      else if (date_scope === 'last_7_days') dateLabel = '7 ngày gần nhất';
      else if (date_scope === 'last_30_days') dateLabel = '30 ngày gần nhất';
      else if (date_scope === 'range' && (start_date || end_date)) {
        dateLabel = `Từ ${start_date || '...'} đến ${end_date || '...'}`;
      } else if (Array.isArray(date) && date.length > 0) {
        dateLabel = date.map(d => {
          try {
            const [y, m, day] = d.split('-');
            return `${day}/${m}`;
          } catch(e) { return d; }
        }).join(', ');
      } else if (date) {
        try {
          const [y, m, d] = String(date).split('-');
          dateLabel = `Ngày ${d}/${m}/${y}`;
        } catch (e) {
          dateLabel = `Ngày ${date}`;
        }
      }
      throw new Error(`Không có từ vựng nào được thêm vào trong phạm vi [${dateLabel}]. Vui lòng chọn ngày khác hoặc chọn [Toàn bộ]!`);
    }

    // 2. Filter by Single or Multiple Topics
    let topicDisplay = 'Tất cả (All)';

    const resolved = resolveTopics(db, topic);
    if (!resolved.isAll) {
      topicDisplay = resolved.displayNames.join(' + ');
      const topicFiltered = candidateWords.filter(w => {
        const wTopicId = (w.topic_id || '').toLowerCase();
        return resolved.targetIds.includes(wTopicId);
      });

      if (topicFiltered.length === 0) {
        throw new Error(`Các chủ đề đã chọn (${topicDisplay}) chưa có từ vựng nào trong phạm vi ngày đã chọn. Vui lòng chọn chủ đề khác hoặc chọn [Tất cả]!`);
      }
      candidateWords = topicFiltered;
    }

    // 2. Filter by Granular IELTS Level Tier ONLY if explicitly requested (e.g. ielts_4_5)
    // NOTE: 'easy', 'medium', 'hard' represent QUESTION SOLVING DIFFICULTY, NOT vocabulary level!
    if (level && level.startsWith('ielts_')) {
      const tierMap = {
        'ielts_4_5': ['A1', 'A2', 'B1'],
        'ielts_55_60': ['B1', 'B2'],
        'ielts_65_70': ['B2'],
        'ielts_75_80': ['B2', 'C1'],
        'ielts_85_90': ['C1', 'C2']
      };
      const allowedLevels = tierMap[level] || [];
      if (allowedLevels.length > 0) {
        const levelFiltered = candidateWords.filter(w => allowedLevels.includes((w.level || '').toUpperCase()));
        if (levelFiltered.length > 0) {
          candidateWords = levelFiltered;
        }
      }
    }

    const questionDifficulty = ['easy', 'medium', 'hard'].includes(level) ? level : 'all';

    // 3. Quy tắc chọn từ mục tiêu (TUYỆT ĐỐI KHÔNG TRÙNG LẶP):
    // - Lọc bỏ từ trùng lặp trong candidateWords theo từ chuẩn hóa
    const seenCandidateWords = new Set();
    const uniqueCandidates = [];
    for (const w of candidateWords) {
      const norm = (w.word || '').trim().toLowerCase();
      if (norm && !seenCandidateWords.has(norm)) {
        seenCandidateWords.add(norm);
        uniqueCandidates.push(w);
      }
    }

    const shuffledCandidates = [...uniqueCandidates].sort(() => 0.5 - Math.random());
    let selectedWords = [];

    if (shuffledCandidates.length >= targetCount) {
      selectedWords = shuffledCandidates.slice(0, targetCount);
    } else {
      // Ưu tiên toàn bộ các từ ứng viên thuộc phạm vi bộ lọc đã chọn
      selectedWords = [...shuffledCandidates];

      // Bổ sung các từ vựng khác từ kho từ vựng của người dùng để đủ targetCount mà TUYỆT ĐỐI KHÔNG TRÙNG
      const seenSelected = new Set(selectedWords.map(w => (w.word || '').trim().toLowerCase()));
      const otherWords = words.filter(w => {
        const norm = (w.word || '').trim().toLowerCase();
        return norm && !seenSelected.has(norm);
      });

      const uniqueOtherWords = [];
      for (const w of otherWords) {
        const norm = (w.word || '').trim().toLowerCase();
        if (norm && !seenSelected.has(norm)) {
          seenSelected.add(norm);
          uniqueOtherWords.push(w);
        }
      }

      uniqueOtherWords.sort(() => 0.5 - Math.random());
      const needed = targetCount - selectedWords.length;
      const supplement = uniqueOtherWords.slice(0, needed);
      selectedWords.push(...supplement);
    }

    // Question types: 'meaning_vi', 'reverse_en', 'cloze_blank', 'listening'
    const questionTypes = ['meaning_vi', 'reverse_en', 'cloze_blank', 'listening'];
    const usedQuestionTexts = new Set();

    const questions = selectedWords.map((targetWord, index) => {
      const qType = mode === 'mixed' 
        ? questionTypes[index % questionTypes.length]
        : mode;

      let examples = [];
      try {
        examples = JSON.parse(targetWord.examples || '[]');
      } catch (e) {
        examples = [];
      }

      const validTargetMeaning = cleanMeaningText(targetWord.meaning_vi, targetWord.meaning_en, targetWord.word);

      // Determine question solving difficulty: easy, medium, hard
      let qDifficulty = questionDifficulty;
      if (qDifficulty === 'all') {
        const diffCycle = ['easy', 'medium', 'hard'];
        qDifficulty = diffCycle[index % diffCycle.length];
      }

      let questionText = '';
      let promptSubtitle = '';
      let correctAnswer = '';
      let options = [];
      let explanation = '';
      let translation = '';

      const pos = getWordPos(targetWord);
      const posLabel = POS_LABELS[pos] || 'Từ vựng';
      const context = getAuthenticContextSentence(targetWord, pos);

      if (qType === 'meaning_vi') {
        // === 1. ĐỌC HIỂU NGỮ CẢNH & PHÂN BIỆT SẮC THÁI NGHĨA ===
        questionText = context.boldedSentence;
        promptSubtitle = qDifficulty === 'easy'
          ? `[${posLabel}] Dựa vào ngữ cảnh câu trên, từ '**${context.matchedForm || targetWord.word}**' mang ý nghĩa nào:`
          : qDifficulty === 'hard'
          ? `[${posLabel} - Nâng cao] Phân tích ngữ cảnh câu trên để chọn nghĩa & sắc thái chuẩn xác nhất của '**${context.matchedForm || targetWord.word}**':`
          : `[${posLabel}] Đọc câu trên và chọn nghĩa tiếng Việt chính xác nhất của từ in đậm '**${context.matchedForm || targetWord.word}**':`;

        correctAnswer = validTargetMeaning;

        const distractors = getSamePosDistractors({
          targetWord,
          pos,
          allWords: words,
          count: 3,
          difficulty: qDifficulty
        });

        const rawOpts = [validTargetMeaning, ...distractors.map(d => d.meaning_vi)];
        options = [...new Set(rawOpts)].sort(() => 0.5 - Math.random());

        explanation = buildPedagogicalExplanation({
          targetWord,
          pos,
          correctAnswer,
          qType,
          contextSentence: context.fullSentence,
          completedSentence: context.fullSentence,
          translation: context.sentenceTranslation,
          userDifficulty: qDifficulty
        });
        translation = context.sentenceTranslation || `Dịch câu: ${context.fullSentence}`;
      } else if (qType === 'reverse_en') {
        // === 2. ỨNG DỤNG TỪ VỰNG VÀO CÂU THỰC TẾ (REVERSE ENGLISH) ===
        questionText = context.blankSentence;
        promptSubtitle = qDifficulty === 'easy'
          ? `[${posLabel}] Chọn từ tiếng Anh hoàn chỉnh câu trên (Nghĩa: "${validTargetMeaning}"):`
          : qDifficulty === 'hard'
          ? `[${posLabel} - Bẫy từ vựng] Chọn từ tiếng Anh chuẩn xác nhất hoàn thành câu (Nghĩa: "${validTargetMeaning}"):`
          : `[${posLabel}] Chọn từ vựng tiếng Anh thích hợp nhất điền vào chỗ trống (Nghĩa: "${validTargetMeaning}"):`;

        correctAnswer = context.matchedForm || targetWord.word;

        let distractors = [];
        if (qDifficulty === 'hard') {
          const wordFamily = generateTrickyWordFamily(targetWord.word);
          const samePos = getSamePosDistractors({ targetWord, pos, allWords: words, count: 3, difficulty: qDifficulty });
          distractors = [...wordFamily.slice(0, 1), ...samePos.map(d => d.word)];
        } else {
          const samePos = getSamePosDistractors({ targetWord, pos, allWords: words, count: 3, difficulty: qDifficulty });
          distractors = samePos.map(d => d.word);
        }

        const rawOpts = [correctAnswer, ...distractors.filter(w => w.toLowerCase() !== correctAnswer.toLowerCase())];
        options = [...new Set(rawOpts)].slice(0, 4).sort(() => 0.5 - Math.random());

        explanation = buildPedagogicalExplanation({
          targetWord,
          pos,
          correctAnswer,
          qType,
          contextSentence: context.blankSentence,
          completedSentence: context.fullSentence,
          translation: context.sentenceTranslation,
          userDifficulty: qDifficulty
        });
        translation = context.sentenceTranslation || `Dịch câu: ${context.fullSentence}`;
      } else if (qType === 'cloze_blank') {
        // === 3. NGỮ PHÁP, BIẾN CÁCH & VỊ TRÍ TỪ LOẠI (CLOZE BLANK) ===
        const grammarQ = generateGrammarClozeQuestion({
          targetWord,
          validTargetMeaning,
          examples,
          qDifficulty,
          questionIndex: index,
          otherWords: words,
          usedQuestionTexts
        });

        questionText = grammarQ.questionText;
        promptSubtitle = grammarQ.promptSubtitle;
        correctAnswer = grammarQ.correctAnswer;
        options = grammarQ.options;

        const completedSent = questionText.replace(/_______/g, correctAnswer);
        explanation = buildPedagogicalExplanation({
          targetWord,
          pos,
          correctAnswer,
          qType,
          contextSentence: questionText,
          completedSentence: completedSent,
          grammarRule: grammarQ.explanation,
          translation: context.sentenceTranslation,
          userDifficulty: qDifficulty
        });
        translation = context.sentenceTranslation || `Câu hoàn chỉnh: "${completedSent}"`;
      } else if (qType === 'listening') {
        // === 4. PHẢN XẠ NGHE & ÂM VỊ HỌC (LISTENING & PHONOLOGY) ===
        questionText = targetWord.word;
        const phoneticStr = targetWord.phonetic ? ` /${targetWord.phonetic.replace(/\//g, '')}/` : '';
        promptSubtitle = qDifficulty === 'easy'
          ? `[Luyện nghe phản xạ] Nghe phát âm chuẩn và chọn nghĩa tiếng Việt [${posLabel}]${phoneticStr}:`
          : qDifficulty === 'hard'
          ? `[Nghe & Phân biệt sắc thái] Nghe phát âm và chọn nghĩa tiếng Việt chuẩn xác nhất [${posLabel}]${phoneticStr}:`
          : `[Luyện nghe] Nghe phát âm chuẩn và chọn nghĩa tiếng Việt tương ứng [${posLabel}]${phoneticStr}:`;

        correctAnswer = validTargetMeaning;

        const distractors = getSamePosDistractors({
          targetWord,
          pos,
          allWords: words,
          count: 3,
          difficulty: qDifficulty
        });

        const rawOpts = [validTargetMeaning, ...distractors.map(d => d.meaning_vi)];
        options = [...new Set(rawOpts)].sort(() => 0.5 - Math.random());

        explanation = buildPedagogicalExplanation({
          targetWord,
          pos,
          correctAnswer,
          qType,
          contextSentence: context.fullSentence,
          completedSentence: context.fullSentence,
          translation: context.sentenceTranslation,
          userDifficulty: qDifficulty
        });
        translation = `Phát âm: ${targetWord.word} ${phoneticStr} ➔ ${validTargetMeaning}`;
      }

      // Ensure 4 distinct options always exist (fail-safe strictly drawing from same POS pool)
      const samePosEmergency = CURATED_POS_DISTRACTORS[pos] || CURATED_POS_DISTRACTORS.noun;
      let emergencyIdx = 0;
      while (options.length < 4 && emergencyIdx < samePosEmergency.length) {
        const item = samePosEmergency[emergencyIdx++];
        const optVal = (qType === 'reverse_en' || qType === 'cloze_blank') ? item.word : item.meaning_vi;
        if (!options.includes(optVal) && optVal.toLowerCase() !== correctAnswer.toLowerCase()) {
          options.push(optVal);
        }
      }
      options = options.slice(0, 4);

      return {
        id: `${targetWord.id}_q${index + 1}`,
        type: qType,
        word: targetWord.word,
        phonetic: targetWord.phonetic,
        difficulty: qDifficulty,
        level: targetWord.level || (qDifficulty === 'easy' ? 'A2' : qDifficulty === 'hard' ? 'C1' : 'B2'),
        meaning_vi: validTargetMeaning,
        meaning_en: targetWord.meaning_en,
        part_of_speech: targetWord.part_of_speech || posLabel,
        pos_code: pos,
        questionText,
        promptSubtitle,
        correctAnswer,
        options,
        explanation,
        translation,
        audio_url: targetWord.audio_url,
        examples,
        collocations: extractCollocations(targetWord)
      };
    });

    return {
      topic: topicDisplay,
      mode,
      level,
      totalQuestions: questions.length,
      questions
    };
  },

  // 3. Submit and Grade Quiz
  submitQuiz: ({ answers = [], userId = 'admin_master_user_id' }) => {
    const db = getDb();
    if (!Array.isArray(answers) || answers.length === 0) {
      return {
        totalQuestions: 0,
        correctCount: 0,
        score: 0,
        xpEarned: 0,
        isPerfect: false,
        results: [],
        gamification: null
      };
    }

    let correctCount = 0;
    const results = [];
    const wrongWordIds = [];

    for (const item of answers) {
      const isCorrect = String(item.userAnswer || '').trim().toLowerCase() === String(item.correctAnswer || '').trim().toLowerCase();
      if (isCorrect) {
        correctCount++;
      } else if (item.wordId) {
        wrongWordIds.push(item.wordId);
      }

      results.push({
        id: item.id || item.wordId,
        word: item.word || item.id,
        questionText: item.questionText,
        userAnswer: item.userAnswer,
        correctAnswer: item.correctAnswer,
        isCorrect,
        explanation: item.explanation,
        translation: item.translation
      });
    }

    const total = answers.length;
    const score = Math.round((correctCount / total) * 100);
    // Base 5 XP per correct answer + 10 XP bonus for perfect score
    const xpEarned = (correctCount * 5) + (score === 100 ? 10 : 0);

    // If there are wrong words, update their SRS state in DB (demote slightly for review)
    if (wrongWordIds.length > 0) {
      const placeholders = wrongWordIds.map(() => '?').join(',');
      try {
        // Decrease interval slightly for reinforcement
        db.prepare(`
          UPDATE words 
          SET interval = CASE WHEN interval > 1 THEN interval - 1 ELSE 1 END,
              ease_factor = CASE WHEN ease_factor > 1.4 THEN ease_factor - 0.1 ELSE 1.3 END,
              updated_at = CURRENT_TIMESTAMP
          WHERE id IN (${placeholders})
        `).run(...wrongWordIds);
      } catch (e) {
        console.warn('SRS update on quiz wrong answers:', e);
      }
    }

    // Gamification: Add XP for Quiz Completion
    let xpResult = null;
    try {
      xpResult = gamificationService.addXp(userId, xpEarned, `Quiz: Đúng ${correctCount}/${total} câu`);
    } catch (e) {}

    return {
      totalQuestions: total,
      correctCount,
      score,
      xpEarned,
      isPerfect: score === 100,
      results,
      gamification: xpResult
    };
  },

  // 4. Generate Sentence Pattern Quiz
  generatePatternQuiz: ({ category = 'all', tone = 'all', count = 5, mode = 'mixed', level = 'all', date_scope = 'all', date = null, start_date = null, end_date = null, userId = 'admin_master_user_id' }) => {
    const db = getDb();
    let patterns = db.prepare(`
      SELECT * FROM patterns 
      WHERE (user_id = ? OR (user_id IS NULL AND ? = 'admin_master_user_id') OR (user_id = 'admin_master_user_id' AND ? = 'admin_master_user_id'))
    `).all(userId, userId, userId);

    if (patterns.length === 0) {
      throw new Error('Kho mẫu câu & cấu trúc đang trống. Vui lòng thêm mẫu câu trước khi tạo Quiz!');
    }

    const targetCount = Math.max(1, parseInt(count, 10) || 5);

    // Filter by Date Scope if specified
    let candidatePatterns = filterItemsByDate(patterns, date_scope, date, start_date, end_date);
    if (candidatePatterns.length === 0) {
      let dateLabel = date_scope;
      if (date_scope === 'today') dateLabel = 'Hôm nay';
      else if (date_scope === 'yesterday') dateLabel = 'Hôm qua';
      else if (date_scope === 'last_7_days') dateLabel = '7 ngày gần nhất';
      else if (date_scope === 'last_30_days') dateLabel = '30 ngày gần nhất';
      else if (date_scope === 'range' && (start_date || end_date)) {
        dateLabel = `Từ ${start_date || '...'} đến ${end_date || '...'}`;
      } else if (Array.isArray(date) && date.length > 0) {
        dateLabel = date.map(d => {
          try {
            const [y, m, day] = d.split('-');
            return `${day}/${m}`;
          } catch(e) { return d; }
        }).join(', ');
      } else if (date) {
        try {
          const [y, m, d] = String(date).split('-');
          dateLabel = `Ngày ${d}/${m}/${y}`;
        } catch (e) {
          dateLabel = `Ngày ${date}`;
        }
      }
      throw new Error(`Không có mẫu câu nào được thêm vào trong phạm vi [${dateLabel}]. Vui lòng chọn ngày khác!`);
    }

    const filterTarget = (category && category !== 'all') ? category : tone;
    if (filterTarget && filterTarget !== 'all') {
      const filtered = candidatePatterns.filter(p => 
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

    let selectedPatterns = [];
    const shuffled = [...uniqueCandidatePatterns].sort(() => 0.5 - Math.random());
    if (shuffled.length >= targetCount) {
      selectedPatterns = shuffled.slice(0, targetCount);
    } else {
      // Ưu tiên toàn bộ mẫu câu ứng viên thuộc bộ lọc
      selectedPatterns = [...shuffled];

      // Bổ sung các mẫu câu khác từ kho mẫu câu mà TUYỆT ĐỐI KHÔNG TRÙNG
      const seenSelected = new Set(selectedPatterns.map(p => (p.name || '').trim().toLowerCase()));
      const otherPatterns = patterns.filter(p => {
        const norm = (p.name || '').trim().toLowerCase();
        return norm && !seenSelected.has(norm);
      });

      const uniqueOtherPatterns = [];
      for (const p of otherPatterns) {
        const norm = (p.name || '').trim().toLowerCase();
        if (norm && !seenSelected.has(norm)) {
          seenSelected.add(norm);
          uniqueOtherPatterns.push(p);
        }
      }

      uniqueOtherPatterns.sort(() => 0.5 - Math.random());
      const needed = targetCount - selectedPatterns.length;
      selectedPatterns.push(...uniqueOtherPatterns.slice(0, needed));
    }

    const questions = selectedPatterns.map((pat, idx) => {
      let examples = [];
      try {
        examples = JSON.parse(pat.examples || '[]');
      } catch (e) { examples = []; }

      let cleanEx = examples[0] || `It is essential to understand how to apply ${pat.name} in writing.`;
      const keyPhrase = pat.name.split('(')[0].split('+')[0].trim();

      const pTypes = ['fill_clause', 'meaning_usage', 'formula_check'];
      const qType = pTypes[idx % pTypes.length];

      const otherPatterns = patterns.filter(p => p.id !== pat.id);
      const shuffledOthers = [...otherPatterns].sort(() => 0.5 - Math.random());

      let questionText = '';
      let promptSubtitle = '';
      let correctAnswer = '';
      let options = [];
      let explanation = pat.explanation || `Cấu trúc: ${pat.formula} - Nghĩa: ${pat.meaning_vi}`;

      if (qType === 'fill_clause' && cleanEx) {
        let clozeSentence = cleanEx;
        if (new RegExp(keyPhrase, 'i').test(cleanEx)) {
          clozeSentence = cleanEx.replace(new RegExp(keyPhrase, 'gi'), '_______');
        } else {
          clozeSentence = `_______, ${cleanEx.replace(/^[^,]+,\s*/, '')}`;
        }
        questionText = clozeSentence;
        promptSubtitle = `Điền mẫu câu / cấu trúc thích hợp vào ngữ cảnh (${pat.meaning_vi}):`;
        correctAnswer = keyPhrase;

        const rawOptions = [
          keyPhrase,
          ...shuffledOthers.slice(0, 3).map(p => p.name.split('(')[0].split('+')[0].trim())
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else if (qType === 'meaning_usage') {
        questionText = `Mẫu câu / cấu trúc nào sau đây dùng để diễn tả: "${pat.meaning_vi}"?`;
        promptSubtitle = `Chọn cấu trúc ngữ pháp có nghĩa và sắc thái phù hợp:`;
        correctAnswer = pat.name;

        const rawOptions = [
          pat.name,
          ...shuffledOthers.slice(0, 3).map(p => p.name)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      } else {
        questionText = `Công thức ngữ pháp chuẩn xác của mẫu câu "${pat.name}" là gì?`;
        promptSubtitle = `Chọn công thức cấu trúc câu chính xác:`;
        correctAnswer = pat.formula;

        const rawOptions = [
          pat.formula,
          ...shuffledOthers.slice(0, 3).map(p => p.formula)
        ];
        options = [...new Set(rawOptions)].sort(() => 0.5 - Math.random());
      }

      while (options.length < 4) {
        const fallbacks = [
          'Regardless of + Noun / V-ing',
          'Not only... but also (Inversion)',
          'It is high time + S + V2/ed',
          'Had it not been for + Noun'
        ];
        for (const fb of fallbacks) {
          if (!options.includes(fb)) {
            options.push(fb);
            if (options.length === 4) break;
          }
        }
      }

      let qDifficulty = 'medium';
      if (level === 'easy' || (pat.level || '').toUpperCase() === 'A2' || (pat.level || '').toUpperCase() === 'B1') {
        qDifficulty = 'easy';
      } else if (level === 'hard' || (pat.level || '').toUpperCase() === 'C1' || (pat.level || '').toUpperCase() === 'C2') {
        qDifficulty = 'hard';
      }

      return {
        id: `pq-${idx + 1}`,
        type: qType,
        isPattern: true,
        word: pat.name,
        formula: pat.formula,
        tone: pat.tone,
        difficulty: qDifficulty,
        level: pat.level || (qDifficulty === 'easy' ? 'B1' : qDifficulty === 'hard' ? 'C1' : 'B2'),
        questionText,
        promptSubtitle,
        options,
        correctAnswer,
        explanation
      };
    });

    return {
      topic: '🧩 Mẫu Câu & Cấu Trúc Ngữ Pháp',
      isPatternQuiz: true,
      level,
      totalQuestions: questions.length,
      questions
    };
  }
};
