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

export const TEMPLATE_BANK_BY_LEVEL = {
  a1_a2: {
    label: 'A1 - A2',
    verb: [
      {
        full: (w) => `She decided to ${w} early in the morning.`,
        trans: (m) => `Cô ấy quyết định ${m} vào sáng sớm.`
      },
      {
        full: (w) => `They try to ${w} whenever they have free time.`,
        trans: (m) => `Họ cố gắng ${m} bất cứ khi nào có thời gian rảnh.`
      },
      {
        full: (w) => `You need to ${w} carefully before making any choice.`,
        trans: (m) => `Bạn cần ${m} cẩn thận trước khi đưa ra bất kỳ lựa chọn nào.`
      },
      {
        full: (w) => `My friend wants to ${w} with us tomorrow.`,
        trans: (m) => `Bạn tôi muốn ${m} cùng chúng tôi vào ngày mai.`
      },
      {
        full: (w) => `It is always helpful to ${w} when you start something new.`,
        trans: (m) => `Luôn luôn hữu ích khi ${m} lúc bạn bắt đầu một điều gì đó mới.`
      },
      {
        full: (w) => `We are happy to ${w} together every weekend.`,
        trans: (m) => `Chúng tôi rất vui khi được ${m} cùng nhau vào mỗi cuối tuần.`
      }
    ],
    adj: [
      {
        full: (w) => `She felt very ${w} after hearing the good news.`,
        trans: (m) => `Cô ấy cảm thấy rất ${m} sau khi nghe tin tốt lành.`
      },
      {
        full: (w) => `His answer was quite ${w} and easy to understand.`,
        trans: (m) => `Câu trả lời của anh ấy khá ${m} và dễ hiểu.`
      },
      {
        full: (w) => `They had a truly ${w} experience during the trip.`,
        trans: (m) => `Họ đã có một trải nghiệm thực sự ${m} trong suốt chuyến đi.`
      },
      {
        full: (w) => `It is important to stay ${w} when talking to others.`,
        trans: (m) => `Điều quan trọng là phải giữ thái độ ${m} khi nói chuyện với người khác.`
      },
      {
        full: (w) => `Everyone was pleased with the ${w} outcome of the project.`,
        trans: (m) => `Mọi người đều hài lòng với kết quả ${m} của dự án.`
      },
      {
        full: (w) => `The room was warm and ${w}, making visitors feel at home.`,
        trans: (m) => `Căn phòng ấm cúng và ${m}, khiến khách cảm thấy như ở nhà.`
      }
    ],
    noun: [
      {
        full: (w) => `She shared a wonderful ${w} during our conversation.`,
        trans: (m) => `Cô ấy đã chia sẻ một ${m} tuyệt vời trong cuộc trò chuyện của chúng tôi.`
      },
      {
        full: (w) => `We are looking forward to the next ${w} this week.`,
        trans: (m) => `Chúng tôi đang mong chờ ${m} tiếp theo trong tuần này.`
      },
      {
        full: (w) => `He found a helpful ${w} that solved his daily problem.`,
        trans: (m) => `Anh ấy đã tìm thấy một ${m} hữu ích giúp giải quyết vấn đề hàng ngày.`
      },
      {
        full: (w) => `Having a clear ${w} makes daily tasks much easier.`,
        trans: (m) => `Có một ${m} rõ ràng giúp các công việc hàng ngày trở nên dễ dàng hơn nhiều.`
      },
      {
        full: (w) => `They celebrated this special ${w} with their close friends.`,
        trans: (m) => `Họ đã kỷ niệm ${m} đặc biệt này cùng những người bạn thân thiết.`
      },
      {
        full: (w) => `This simple ${w} brought a lot of joy to everyone.`,
        trans: (m) => `${m} đơn giản này đã mang lại nhiều niềm vui cho mọi người.`
      }
    ],
    adv: [
      {
        full: (w) => `She smiled ${w} when she saw her family.`,
        trans: (m) => `Cô ấy mỉm cười một cách ${m} khi nhìn thấy gia đình mình.`
      },
      {
        full: (w) => `The children played ${w} in the garden all afternoon.`,
        trans: (m) => `Lũ trẻ chơi đùa một cách ${m} trong vườn suốt buổi chiều.`
      },
      {
        full: (w) => `He explained the story ${w} so that everyone understood.`,
        trans: (m) => `Anh ấy giải thích câu chuyện một cách ${m} để mọi người đều hiểu.`
      },
      {
        full: (w) => `We walked ${w} along the quiet street near the park.`,
        trans: (m) => `Chúng tôi đi dạo một cách ${m} dọc theo con phố yên tĩnh gần công viên.`
      },
      {
        full: (w) => `The train arrived ${w} at the station on time.`,
        trans: (m) => `Chuyến tàu đã đến nhà ga một cách ${m} đúng giờ.`
      }
    ],
    phrase: [
      {
        full: (w) => `In daily life, it is always great to ${w} with family.`,
        trans: (m) => `Trong cuộc sống hàng ngày, thật tuyệt vời khi luôn ${m} cùng gia đình.`
      },
      {
        full: (w) => `My teacher advised us to ${w} whenever we have free time.`,
        trans: (m) => `Thầy cô khuyên chúng tôi nên ${m} bất cứ khi nào có thời gian rảnh.`
      },
      {
        full: (w) => `When you travel to new places, try to ${w} and relax.`,
        trans: (m) => `Khi bạn đi du lịch đến những vùng đất mới, hãy cố gắng ${m} và thư giãn.`
      },
      {
        full: (w) => `It is always helpful to ${w} before starting a new journey.`,
        trans: (m) => `Luôn rất hữu ích khi ${m} trước khi bắt đầu một hành trình mới.`
      }
    ]
  },
  b1: {
    label: 'B1',
    verb: [
      {
        full: (w) => `To improve team productivity, we should ${w} on a regular basis.`,
        trans: (m) => `Để nâng cao năng suất nhóm, chúng ta nên ${m} thường xuyên.`
      },
      {
        full: (w) => `The supervisor advised everyone to ${w} before the upcoming deadline.`,
        trans: (m) => `Người giám sát khuyên mọi người nên ${m} trước hạn chót sắp tới.`
      },
      {
        full: (w) => `Our team planned to ${w} step by step to avoid unnecessary mistakes.`,
        trans: (m) => `Đội ngũ của chúng tôi dự định ${m} từng bước để tránh những sai sót không đáng có.`
      },
      {
        full: (w) => `Employees are encouraged to ${w} whenever workplace challenges arise.`,
        trans: (m) => `Nhân viên được khuyến khích ${m} bất cứ khi nào xuất hiện khó khăn trong công việc.`
      },
      {
        full: (w) => `During the weekly meeting, they agreed to ${w} more effectively.`,
        trans: (m) => `Trong buổi họp hàng tuần, họ đã đồng ý ${m} hiệu quả hơn.`
      },
      {
        full: (w) => `She took the initiative to ${w} across several project tasks.`,
        trans: (m) => `Cô ấy đã chủ động ${m} qua nhiều nhiệm vụ của dự án.`
      }
    ],
    adj: [
      {
        full: (w) => `The manager appreciated her ${w} feedback during the performance review.`,
        trans: (m) => `Người quản lý đánh giá cao phản hồi ${m} của cô ấy trong buổi đánh giá hiệu suất.`
      },
      {
        full: (w) => `We noticed a remarkably ${w} improvement in team collaboration this month.`,
        trans: (m) => `Chúng tôi nhận thấy sự cải thiện rõ rệt mang tính ${m} trong việc hợp tác nhóm tháng này.`
      },
      {
        full: (w) => `Maintaining a ${w} habit helps you stay organized throughout the workday.`,
        trans: (m) => `Duy trì một thói quen ${m} giúp bạn luôn ngăn nắp trong suốt ngày làm việc.`
      },
      {
        full: (w) => `His presentation was clear and ${w}, which impressed all attendees.`,
        trans: (m) => `Bài thuyết trình của anh ấy rất rõ ràng và ${m}, gây ấn tượng với mọi người tham dự.`
      },
      {
        full: (w) => `The project required a ${w} solution to meet client expectations on time.`,
        trans: (m) => `Dự án đòi hỏi một giải pháp ${m} để đáp ứng kỳ vọng của khách hàng đúng hạn.`
      },
      {
        full: (w) => `Working in a ${w} environment boosts overall team motivation and morale.`,
        trans: (m) => `Làm việc trong một môi trường ${m} thúc đẩy tinh thần và động lực chung của cả nhóm.`
      }
    ],
    noun: [
      {
        full: (w) => `Reaching this practical ${w} helped the team gain confidence for future sprints.`,
        trans: (m) => `Đạt được ${m} thực tế này đã giúp cả nhóm tự tin hơn cho các chặng tiếp theo.`
      },
      {
        full: (w) => `The department discussed an urgent ${w} during the morning standup.`,
        trans: (m) => `Phòng ban đã thảo luận về một ${m} cấp bách trong buổi họp sáng.`
      },
      {
        full: (w) => `Setting a realistic ${w} prevents unnecessary stress for everyone on the team.`,
        trans: (m) => `Đặt ra một ${m} thực tế giúp tránh áp lực không cần thiết cho mọi người trong nhóm.`
      },
      {
        full: (w) => `Every member contributed a useful ${w} to the quarterly planning discussion.`,
        trans: (m) => `Mỗi thành viên đã đóng góp một ${m} hữu ích vào buổi thảo luận kế hoạch quý.`
      },
      {
        full: (w) => `They resolved a difficult ${w} through open and honest communication.`,
        trans: (m) => `Họ đã giải quyết một ${m} khó khăn nhờ giao tiếp cởi mở và chân thành.`
      },
      {
        full: (w) => `This new ${w} significantly improved our day-to-day work routine.`,
        trans: (m) => `${m} mới này đã cải thiện đáng kể quy trình công việc hàng ngày của chúng tôi.`
      }
    ],
    adv: [
      {
        full: (w) => `She handled customer inquiries ${w} and professionally.`,
        trans: (m) => `Cô ấy đã xử lý các yêu cầu của khách hàng một cách ${m} và chuyên nghiệp.`
      },
      {
        full: (w) => `The team communicated ${w} to resolve the issue before the release.`,
        trans: (m) => `Cả nhóm đã trao đổi một cách ${m} để xử lý vấn đề trước khi phát hành.`
      },
      {
        full: (w) => `He prepared the quarterly report ${w} before the executive review.`,
        trans: (m) => `Anh ấy đã chuẩn bị báo cáo quý một cách ${m} trước buổi họp ban giám đốc.`
      },
      {
        full: (w) => `The system operated ${w} throughout the entire testing phase.`,
        trans: (m) => `Hệ thống đã vận hành một cách ${m} trong suốt giai đoạn thử nghiệm.`
      },
      {
        full: (w) => `We adapted ${w} to the updated project schedule.`,
        trans: (m) => `Chúng tôi đã thích nghi một cách ${m} với tiến độ dự án mới được cập nhật.`
      }
    ],
    phrase: [
      {
        full: (w) => `In a collaborative office, coworkers often ${w} to stay aligned on goals.`,
        trans: (m) => `Trong văn phòng hợp tác, đồng nghiệp thường xuyên ${m} để đồng thuận về mục tiêu.`
      },
      {
        full: (w) => `When facing unexpected difficulties, it is important to ${w} calmly.`,
        trans: (m) => `Khi đối mặt với khó khăn bất ngờ, điều quan trọng là phải ${m} một cách bình tĩnh.`
      },
      {
        full: (w) => `Our team lead suggested that we ${w} before proceeding with deployment.`,
        trans: (m) => `Trưởng nhóm gợi ý chúng tôi nên ${m} trước khi tiến hành triển khai.`
      },
      {
        full: (w) => `During intensive projects, team members learn how to ${w} effectively.`,
        trans: (m) => `Trong các dự án bận rộn, các thành viên học cách ${m} một cách hiệu quả.`
      }
    ]
  },
  b2: {
    label: 'B2',
    verb: [
      {
        full: (w) => `The specialist was asked to ${w} before the committee as scheduled.`,
        trans: (m) => `Chuyên gia đã được yêu cầu ${m} trước hội đồng theo đúng lịch trình.`
      },
      {
        full: (w) => `Experienced senior engineers strive to ${w} to maintain high productivity.`,
        trans: (m) => `Các kỹ sư giàu kinh nghiệm luôn nỗ lực ${m} để duy trì năng suất cao.`
      },
      {
        full: (w) => `In the previous sprint, leadership decided to ${w} and reallocate resources across teams.`,
        trans: (m) => `Trong đợt làm việc vừa qua, ban lãnh đạo đã quyết định ${m} và phân bổ lại nguồn lực giữa các nhóm.`
      },
      {
        full: (w) => `Cross-functional collaboration encourages every member to ${w} when challenges emerge.`,
        trans: (m) => `Sự hợp tác liên phòng ban khuyến khích mỗi thành viên ${m} khi xuất hiện thách thức.`
      },
      {
        full: (w) => `The department director requested all leads to ${w} without unnecessary delay.`,
        trans: (m) => `Giám đốc bộ phận yêu cầu tất cả các trưởng nhóm ${m} mà không trì hoãn vô cớ.`
      },
      {
        full: (w) => `To navigate challenging market conditions, organizations must learn to ${w} resiliently.`,
        trans: (m) => `Để vượt qua điều kiện thị trường đầy thử thách, các tổ chức phải học cách ${m} một cách kiên cường.`
      }
    ],
    adj: [
      {
        full: (w) => `The specialist remained exceptionally ${w} even under demanding circumstances.`,
        trans: (m) => `Chuyên gia vẫn giữ được trạng thái đặc biệt ${m} ngay cả trong những hoàn cảnh khắt khe.`
      },
      {
        full: (w) => `Throughout the project retrospective, everyone felt genuinely ${w} for the team's support.`,
        trans: (m) => `Suốt buổi đánh giá dự án, mọi người đều cảm thấy thực sự ${m} trước sự hỗ trợ của cả nhóm.`
      },
      {
        full: (w) => `Feedback from the committee was remarkably ${w}, reflecting the team's diligent efforts.`,
        trans: (m) => `Phản hồi từ hội đồng hết sức ${m}, phản ánh nỗ lực chăm chỉ của toàn đội ngũ.`
      },
      {
        full: (w) => `The executive director was deeply ${w} upon reviewing the project's milestones.`,
        trans: (m) => `Giám đốc điều hành vô cùng ${m} khi xem xét các cột mốc đã đạt được của dự án.`
      },
      {
        full: (w) => `To overcome unforeseen bottlenecks, members must stay ${w} and maintain clear focus.`,
        trans: (m) => `Để vượt qua các điểm nghẽn bất ngờ, các thành viên phải luôn ${m} và giữ vững sự tập trung.`
      },
      {
        full: (w) => `Her contribution to the consultation was recognized as truly ${w} by all stakeholders.`,
        trans: (m) => `Đóng góp của cô ấy cho buổi tư vấn được tất cả các bên liên quan công nhận là thực sự ${m}.`
      }
    ],
    noun: [
      {
        full: (w) => `Achieving this strategic ${w} was a decisive factor in our long-term roadmap.`,
        trans: (m) => `Đạt được ${m} chiến lược này là yếu tố quyết định trong lộ trình dài hạn của chúng tôi.`
      },
      {
        full: (w) => `The project manager identified an unexpected ${w} during sprint retrospective.`,
        trans: (m) => `Quản lý dự án đã phát hiện ra một ${m} bất ngờ trong buổi họp đánh giá chặng vừa qua.`
      },
      {
        full: (w) => `Establishing a clear and transparent ${w} ensures consistent alignment across departments.`,
        trans: (m) => `Việc thiết lập một ${m} rõ ràng và minh bạch đảm bảo sự thống nhất giữa các phòng ban.`
      },
      {
        full: (w) => `Every specialist contributed significantly to the successful execution of this ${w}.`,
        trans: (m) => `Mỗi chuyên gia đều đóng góp đáng kể vào việc thực hiện thành công ${m} này.`
      },
      {
        full: (w) => `Effective risk management requires addressing any potential ${w} at an early stage.`,
        trans: (m) => `Quản lý rủi ro hiệu quả đòi hỏi phải giải quyết bất kỳ ${m} tiềm ẩn nào từ giai đoạn sớm.`
      },
      {
        full: (w) => `The executive committee emphasized the vital importance of this ${w} for sustainable growth.`,
        trans: (m) => `Ủy ban điều hành nhấn mạnh tầm quan trọng thiết yếu của ${m} này đối với sự phát triển bền vững.`
      }
    ],
    adv: [
      {
        full: (w) => `She analyzed the complex architecture ${w} before presenting recommendations.`,
        trans: (m) => `Cô ấy đã phân tích kiến trúc phức tạp một cách ${m} trước khi đưa ra đề xuất.`
      },
      {
        full: (w) => `The engineering division resolved the server incident ${w} and calmly.`,
        trans: (m) => `Bộ phận kỹ thuật đã xử lý sự cố máy chủ một cách ${m} và điềm tĩnh.`
      },
      {
        full: (w) => `All team members worked ${w} to meet the stringent product quality standards.`,
        trans: (m) => `Tất cả thành viên trong nhóm đã làm việc một cách ${m} để đáp ứng tiêu chuẩn chất lượng sản phẩm nghiêm ngặt.`
      },
      {
        full: (w) => `He presented the quarterly performance metrics ${w} to the executive stakeholders.`,
        trans: (m) => `Anh ấy đã trình bày các chỉ số hiệu suất quý một cách ${m} cho các bên liên quan cấp cao.`
      },
      {
        full: (w) => `The cloud infrastructure adapted ${w} even during peak traffic conditions.`,
        trans: (m) => `Hạ tầng đám mây đã thích ứng một cách ${m} ngay cả trong điều kiện lưu lượng truy cập cao điểm.`
      }
    ],
    phrase: [
      {
        full: (w) => `In professional environments, experienced team members always ${w} to ensure collaboration.`,
        trans: (m) => `Trong môi trường chuyên nghiệp, các thành viên giàu kinh nghiệm luôn ${m} để đảm bảo sự hợp tác.`
      },
      {
        full: (w) => `When handling critical business communications, it is crucial to ${w} proactively.`,
        trans: (m) => `Khi xử lý các thông tin liên lạc kinh doanh quan trọng, điều cốt yếu là phải ${m} một cách chủ động.`
      },
      {
        full: (w) => `Successful team leads advise their colleagues never to ${w} under pressure.`,
        trans: (m) => `Các trưởng nhóm thành công khuyên đồng nghiệp của họ không bao giờ ${m} dưới áp lực.`
      },
      {
        full: (w) => `During strategic sprint planning, engineers agreed to ${w} to keep project momentum.`,
        trans: (m) => `Trong buổi lập kế hoạch chiến lược, các kỹ sư đã đồng ý ${m} để giữ vững đà tiến độ dự án.`
      }
    ]
  },
  c1_c2: {
    label: 'C1 - C2',
    verb: [
      {
        full: (w) => `Empirical research demonstrates that visionary leaders consistently seek to ${w} during structural transitions.`,
        trans: (m) => `Nghiên cứu thực nghiệm chứng minh rằng các nhà lãnh đạo có tầm nhìn luôn nỗ lực ${m} trong các giai đoạn chuyển đổi cấu trúc.`
      },
      {
        full: (w) => `To mitigate macroeconomic volatility, enterprises must strategically prepare to ${w} in turbulent markets.`,
        trans: (m) => `Để giảm thiểu biến động kinh tế vĩ mô, các doanh nghiệp phải chuẩn bị một cách chiến lược để ${m} trên các thị trường đầy biến động.`
      },
      {
        full: (w) => `Scholars argue that cognitive flexibility enables individuals to seamlessly ${w} across multidisciplinary environments.`,
        trans: (m) => `Các học giả cho rằng sự linh hoạt nhận thức giúp các cá nhân có thể ${m} một cách liền mạch trong các môi trường đa ngành.`
      },
      {
        full: (w) => `The commission urged institutional stakeholders to decisively ${w} before systemic disparities escalate.`,
        trans: (m) => `Ủy ban kêu gọi các bên liên quan thể chế phải dứt khoát ${m} trước khi những bất bình đẳng mang tính hệ thống leo thang.`
      },
      {
        full: (w) => `Pioneering researchers strive to ${w} with rigorous empirical discipline.`,
        trans: (m) => `Các nhà nghiên cứu tiên phong nỗ lực ${m} với kỷ luật thực nghiệm nghiêm ngặt.`
      },
      {
        full: (w) => `Navigating geopolitical complexities necessitates that policymakers strategically ${w} on international platforms.`,
        trans: (m) => `Việc chèo lái qua các phức tạp địa chính trị đòi hỏi các nhà hoạch định chính sách phải ${m} một cách chiến lược trên các diễn đàn quốc tế.`
      }
    ],
    adj: [
      {
        full: (w) => `The committee members remained intensely ${w} throughout the protracted deliberation.`,
        trans: (m) => `Các thành viên ủy ban vẫn giữ được tinh thần hết sức ${m} trong suốt cuộc thảo luận kéo dài.`
      },
      {
        full: (w) => `Scholarly observers considered the methodology to be exceptionally ${w} and intellectually rigorous.`,
        trans: (m) => `Các nhà quan sát học thuật đánh giá phương pháp luận là đặc biệt ${m} và chuẩn mực về mặt trí tuệ.`
      },
      {
        full: (w) => `The principal investigator was undeniably ${w} upon the peer review's favorable verdict.`,
        trans: (m) => `Chủ nhiệm đề tài nghiên cứu không thể phủ nhận cảm xúc ${m} trước phán quyết thuận lợi của hội đồng bình duyệt.`
      },
      {
        full: (w) => `Sustaining academic excellence requires scholars to remain steadfastly ${w} in their inquiry.`,
        trans: (m) => `Duy trì sự xuất sắc trong học thuật đòi hỏi các học giả phải kiên định giữ vững thái độ ${m} trong công trình nghiên cứu của mình.`
      },
      {
        full: (w) => `The thesis offered an exposition that was profoundly ${w} yet accessible to specialists.`,
        trans: (m) => `Luận án đã mang đến một sự trình bày sâu sắc mang tính ${m} nhưng vẫn dễ tiếp cận đối với các chuyên gia.`
      },
      {
        full: (w) => `Critics described her intellectual disposition as remarkably ${w} under rigorous scrutiny.`,
        trans: (m) => `Các nhà phê bình miêu tả phẩm chất trí tuệ của cô ấy là vô cùng ${m} ngay cả khi chịu sự giám sát nghiêm ngặt.`
      }
    ],
    noun: [
      {
        full: (w) => `The publication of this landmark treatise marked a transformative ${w} in modern historiography.`,
        trans: (m) => `Việc xuất bản chuyên luận mang tính bước ngoặt này đánh dấu một ${m} chuyển biến trong ngành sử học hiện đại.`
      },
      {
        full: (w) => `Addressing this pervasive ${w} remains paramount for achieving sustainable and equitable development.`,
        trans: (m) => `Giải quyết ${m} lan rộng này vẫn là điều tối quan trọng để đạt được sự phát triển bền vững và công bằng.`
      },
      {
        full: (w) => `The symposium catalyzed a paradigm shift, establishing a new conceptual ${w} for cognitive science.`,
        trans: (m) => `Hội nghị chuyên đề đã thúc đẩy sự chuyển dịch mô hình, thiết lập một ${m} khái niệm mới cho khoa học nhận thức.`
      },
      {
        full: (w) => `Peer reviewers commended the manuscript for elucidating an intriguing ${w} previously overlooked.`,
        trans: (m) => `Các chuyên gia bình duyệt khen ngợi bản thảo vì đã làm sáng tỏ một ${m} thú vị từng bị bỏ qua.`
      },
      {
        full: (w) => `Scholarly discourse continually grapples with the ethical ${w} arising from technological acceleration.`,
        trans: (m) => `Diễn ngôn học thuật liên tục vật lộn với ${m} đạo đức phát sinh từ sự tăng tốc công nghệ.`
      },
      {
        full: (w) => `The empirical data provided a compelling ${w} that substantiated the initial hypothesis.`,
        trans: (m) => `Dữ liệu thực nghiệm đã cung cấp một ${m} thuyết phục củng cố cho giả thuyết ban đầu.`
      }
    ],
    adv: [
      {
        full: (w) => `The research committee scrutinized the preliminary findings ${w} prior to publication.`,
        trans: (m) => `Ủy ban nghiên cứu đã xem xét kỹ lưỡng các phát hiện sơ bộ một cách ${m} trước khi công bố.`
      },
      {
        full: (w) => `The econometric model predicted market fluctuations ${w} with unparalleled accuracy.`,
        trans: (m) => `Mô hình kinh tế lượng đã dự báo những biến động thị trường một cách ${m} với độ chuẩn xác vô song.`
      },
      {
        full: (w) => `Distinguished scholars articulated their theoretical arguments ${w} during the plenary session.`,
        trans: (m) => `Các học giả xuất chúng đã diễn đạt lập luận lý thuyết của họ một cách ${m} trong phiên toàn thể.`
      },
      {
        full: (w) => `The administrative framework was restructured ${w} to ensure regulatory compliance.`,
        trans: (m) => `Khung quản trị đã được tái cấu trúc một cách ${m} nhằm đảm bảo tính tuân thủ quy định.`
      },
      {
        full: (w) => `The empirical evidence corroborated the central thesis ${w} across diverse cohorts.`,
        trans: (m) => `Bằng chứng thực nghiệm đã chứng minh luận điểm trung tâm một cách ${m} trên các nhóm đối tượng đa dạng.`
      }
    ],
    phrase: [
      {
        full: (w) => `Eminent scholars caution against attempting to ${w} without rigorous empirical justification.`,
        trans: (m) => `Các học giả lỗi lạc cảnh báo không nên cố gắng ${m} mà thiếu đi sự biện minh thực nghiệm nghiêm ngặt.`
      },
      {
        full: (w) => `In high-level diplomatic deliberations, negotiators invariably ${w} to maintain strategic equilibrium.`,
        trans: (m) => `Trong các cuộc đàm phán ngoại giao cấp cao, các nhà thương thuyết luôn luôn ${m} để duy trì thế cân bằng chiến lược.`
      },
      {
        full: (w) => `Leading intellectuals argue that modern institutions must learn to ${w} in an era of rapid transition.`,
        trans: (m) => `Các trí thức hàng đầu lập luận rằng các thể chế hiện đại phải học cách ${m} trong thời kỳ chuyển đổi nhanh chóng.`
      },
      {
        full: (w) => `Theoretical consensus dictates that researchers should ${w} when evaluating contested paradigms.`,
        trans: (m) => `Sự đồng thuận lý thuyết chỉ ra rằng các nhà nghiên cứu nên ${m} khi đánh giá các mô hình còn tranh cãi.`
      }
    ]
  }
};

export function getAuthenticContextSentence(targetWord, pos = 'noun', occurrenceIndex = 0, usedSentences = new Set(), requestedLevel = 'all') {
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

  // 1. Gather all authentic example matches from DB
  const matchedFromExamples = [];
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
          matchedFromExamples.push({
            fullSentence: englishText,
            boldedSentence,
            blankSentence,
            matchedForm: form,
            sentenceTranslation: sentenceTranslation || (targetWord.meaning_vi ? `Dịch câu: ${targetWord.meaning_vi}` : '')
          });
          break;
        }
      }
    }
  }

  // Helper to check if DB example level matches requested level
  const isLevelMatch = (wordLevel, reqLevel) => {
    if (!reqLevel || reqLevel === 'all') return true;
    if (!wordLevel) return false;
    const wl = String(wordLevel).toLowerCase().trim();
    const rl = String(reqLevel).toLowerCase().trim();
    if (rl === 'a1_a2' || rl === 'a1' || rl === 'a2') return wl === 'a1' || wl === 'a2';
    if (rl === 'b1') return wl === 'b1';
    if (rl === 'b2') return wl === 'b2';
    if (rl === 'c1_c2' || rl === 'c1' || rl === 'c2') return wl === 'c1' || wl === 'c2';
    return wl === rl;
  };

  // Check if any matched example is not yet used AND matches the requested level
  if (isLevelMatch(targetWord.level, requestedLevel)) {
    for (let i = 0; i < matchedFromExamples.length; i++) {
      const candidateIdx = (occurrenceIndex + i) % matchedFromExamples.length;
      const candidate = matchedFromExamples[candidateIdx];
      if (!usedSentences.has(candidate.boldedSentence) && !usedSentences.has(candidate.blankSentence)) {
        usedSentences.add(candidate.boldedSentence);
        usedSentences.add(candidate.blankSentence);
        return {
          ...candidate,
          contextLevel: (targetWord.level ? targetWord.level.toUpperCase() : (requestedLevel && requestedLevel !== 'all' ? requestedLevel.toUpperCase() : 'B2')).replace('_', ' - ')
        };
      }
    }
  }

  // 2. Rich multi-level templates bank (CEFR A1-A2, B1, B2, C1-C2)
  const meaning = targetWord.meaning_vi || 'từ vựng này';

  let levelKey = 'b2';
  const normReq = String(requestedLevel || 'all').toLowerCase().trim();
  if (normReq === 'a1_a2' || normReq === 'a1' || normReq === 'a2') {
    levelKey = 'a1_a2';
  } else if (normReq === 'b1') {
    levelKey = 'b1';
  } else if (normReq === 'b2') {
    levelKey = 'b2';
  } else if (normReq === 'c1' || normReq === 'c2' || normReq === 'c1_c2') {
    levelKey = 'c1_c2';
  } else {
    // 'all' -> cycle across all 4 tiers based on occurrenceIndex
    const tiers = ['a1_a2', 'b1', 'b2', 'c1_c2'];
    levelKey = tiers[occurrenceIndex % tiers.length];
  }

  const levelBank = TEMPLATE_BANK_BY_LEVEL[levelKey] || TEMPLATE_BANK_BY_LEVEL.b2;
  const templates = levelBank[pos] || levelBank.noun;

  for (let k = 0; k < templates.length; k++) {
    const candidateTpl = templates[(occurrenceIndex + k) % templates.length];
    const fullText = candidateTpl.full(rawWord);
    const regex = new RegExp(`\\b${escapeRegExp(rawWord)}\\b`, 'i');
    const boldText = regex.test(fullText) ? fullText.replace(regex, `**${rawWord}**`) : `**${rawWord}** - ${fullText}`;
    const blankText = regex.test(fullText) ? fullText.replace(regex, '_______') : `_______ - ${fullText}`;
    const transText = candidateTpl.trans(meaning.toLowerCase());

    if (!usedSentences.has(boldText) && !usedSentences.has(blankText)) {
      usedSentences.add(boldText);
      usedSentences.add(blankText);
      return {
        fullSentence: fullText,
        boldedSentence: boldText,
        blankSentence: blankText,
        matchedForm: rawWord,
        sentenceTranslation: transText,
        contextLevel: levelBank.label
      };
    }
  }

  // Fallback if all standard templates used: generate distinct round variant
  const baseTpl = templates[occurrenceIndex % templates.length];
  const roundNum = Math.floor(occurrenceIndex / templates.length) + 1;
  const baseFull = baseTpl.full(rawWord);
  const regex = new RegExp(`\\b${escapeRegExp(rawWord)}\\b`, 'i');
  const baseBold = regex.test(baseFull) ? baseFull.replace(regex, `**${rawWord}**`) : `**${rawWord}** - ${baseFull}`;
  const baseBlank = regex.test(baseFull) ? baseFull.replace(regex, '_______') : `_______ - ${baseFull}`;
  const uniqueBold = roundNum > 1 ? `[Ngữ cảnh #${roundNum}] ${baseBold}` : baseBold;
  const uniqueBlank = roundNum > 1 ? `[Ngữ cảnh #${roundNum}] ${baseBlank}` : baseBlank;
  usedSentences.add(uniqueBold);
  usedSentences.add(uniqueBlank);
  return {
    fullSentence: roundNum > 1 ? `[Ngữ cảnh #${roundNum}] ${baseFull}` : baseFull,
    boldedSentence: uniqueBold,
    blankSentence: uniqueBlank,
    matchedForm: rawWord,
    sentenceTranslation: baseTpl.trans(meaning.toLowerCase()),
    contextLevel: levelBank.label
  };
}

export function getSamePosDistractors({ targetWord, pos, candidateWords = [], allWords = [], count = 3, difficulty = 'medium' }) {
  const targetNorm = (targetWord.word || '').trim().toLowerCase();

  // 1. Prioritize other words with exact same POS from filtered candidate words first
  const samePosCandidateWords = (candidateWords || []).filter(w => {
    const wNorm = (w.word || '').trim().toLowerCase();
    if (wNorm === targetNorm) return false;
    if (!w.meaning_vi || w.meaning_vi.includes('Tra cứu thêm')) return false;
    return getWordPos(w) === pos;
  });

  // 2. Gather other words with exact same POS from all user library words
  const samePosUserWords = (allWords || []).filter(w => {
    const wNorm = (w.word || '').trim().toLowerCase();
    if (wNorm === targetNorm) return false;
    if (!w.meaning_vi || w.meaning_vi.includes('Tra cứu thêm')) return false;
    return getWordPos(w) === pos;
  });

  // 3. Gather curated items for this POS
  const curatedItems = (CURATED_POS_DISTRACTORS[pos] || []).filter(d => d.word.toLowerCase() !== targetNorm);

  const combined = [];
  const seen = new Set();
  seen.add(targetNorm);

  // Shuffle candidate words first
  const shuffledCandidate = [...samePosCandidateWords].sort(() => 0.5 - Math.random());
  for (const item of shuffledCandidate) {
    const key = item.word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push({
        word: item.word,
        meaning_vi: cleanMeaningText(item.meaning_vi, item.meaning_en, item.word)
      });
    }
  }

  // Shuffle user words next
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
  generateQuiz: ({ topic = 'All', count = 5, mode = 'mixed', level = 'all', context_levels = null, date_scope = 'all', date = null, start_date = null, end_date = null, userId = 'admin_master_user_id' }) => {
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

    // 3. Quy tắc chọn từ mục tiêu (TUYỆT ĐỐI KHÔNG TỰ SINH TỪ NGOÀI KHO TỪ/BỘ LỌC):
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

    if (uniqueCandidates.length === 0) {
      throw new Error('Không có từ vựng hợp lệ nào trong bộ lọc đã chọn!');
    }

    // Xây dựng hàng đợi câu hỏi mục tiêu (selectedQueue):
    // Quy tắc:
    // 1. Tuyệt đối không tự sinh từ vựng mới hoặc lấy từ ngoài bộ lọc/kho từ đã chọn.
    // 2. Lượt 1: Tạo đủ tất cả các từ trong bộ lọc, mỗi từ ít nhất 1 lần (Round 1).
    // 3. Lượt 2+: Nếu targetCount > uniqueCandidates.length, tiếp tục random xoay vòng từ candidateWords cho đủ số câu.
    // 4. Các câu hỏi cho cùng một từ TUYỆT ĐỐI KHÔNG ĐƯỢC GIỐNG NHAU (khác type, khác mẫu câu, khác ngữ pháp).
    const selectedQueue = [];
    const round1 = [...uniqueCandidates].sort(() => 0.5 - Math.random());
    const wordOccurrenceCounter = new Map();

    for (let i = 0; i < round1.length; i++) {
      if (selectedQueue.length >= targetCount) break;
      const w = round1[i];
      const norm = (w.word || '').trim().toLowerCase();
      wordOccurrenceCounter.set(norm, 0);
      selectedQueue.push({
        wordObj: w,
        occurrenceIndex: 0,
        wordIdx: i
      });
    }

    while (selectedQueue.length < targetCount && uniqueCandidates.length > 0) {
      const nextRound = [...uniqueCandidates].sort(() => 0.5 - Math.random());
      for (const w of nextRound) {
        if (selectedQueue.length >= targetCount) break;
        const norm = (w.word || '').trim().toLowerCase();
        const countOcc = (wordOccurrenceCounter.get(norm) || 0) + 1;
        wordOccurrenceCounter.set(norm, countOcc);
        const originalIdx = round1.findIndex(r => (r.word || '').trim().toLowerCase() === norm);
        selectedQueue.push({
          wordObj: w,
          occurrenceIndex: countOcc,
          wordIdx: originalIdx >= 0 ? originalIdx : selectedQueue.length
        });
      }
    }

    // Question types: 'meaning_vi', 'reverse_en', 'cloze_blank', 'listening'
    const questionTypes = ['meaning_vi', 'reverse_en', 'cloze_blank', 'listening'];
    const usedQuestionTexts = new Set();
    const usedSentences = new Set();

    const questions = selectedQueue.map((item, index) => {
      const targetWord = item.wordObj;
      const occurrenceIndex = item.occurrenceIndex;
      const wordIdx = item.wordIdx;

      // Trong mixed mode: Xoay tua dạng câu hỏi theo (wordIdx + occurrenceIndex)
      // Đảm bảo cùng 1 từ khi lặp lại sẽ đổi dạng câu hỏi khác nhau liên tục!
      const qType = mode === 'mixed' 
        ? questionTypes[(wordIdx + occurrenceIndex) % questionTypes.length]
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
        qDifficulty = diffCycle[(index + occurrenceIndex) % diffCycle.length];
      }

      let questionText = '';
      let promptSubtitle = '';
      let correctAnswer = '';
      let options = [];
      let explanation = '';
      let translation = '';

      const pos = getWordPos(targetWord);
      const posLabel = POS_LABELS[pos] || 'Từ vựng';
      const qTargetLevel = activeContextLevels[(index + occurrenceIndex) % activeContextLevels.length];
      const context = getAuthenticContextSentence(targetWord, pos, occurrenceIndex, usedSentences, qTargetLevel);

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
          candidateWords,
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
          const samePos = getSamePosDistractors({ targetWord, pos, candidateWords, allWords: words, count: 3, difficulty: qDifficulty });
          distractors = [...wordFamily.slice(0, 1), ...samePos.map(d => d.word)];
        } else {
          const samePos = getSamePosDistractors({ targetWord, pos, candidateWords, allWords: words, count: 3, difficulty: qDifficulty });
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
          questionIndex: index + occurrenceIndex,
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
        const phoneticStr = targetWord.phonetic ? ` /${targetWord.phonetic.replace(/\//g, '')}/` : '';
        if (occurrenceIndex === 0) {
          questionText = targetWord.word;
          promptSubtitle = qDifficulty === 'easy'
            ? `[Luyện nghe phản xạ] Nghe phát âm chuẩn và chọn nghĩa tiếng Việt [${posLabel}]${phoneticStr}:`
            : qDifficulty === 'hard'
            ? `[Nghe & Phân biệt sắc thái] Nghe phát âm và chọn nghĩa tiếng Việt chuẩn xác nhất [${posLabel}]${phoneticStr}:`
            : `[Luyện nghe] Nghe phát âm chuẩn và chọn nghĩa tiếng Việt tương ứng [${posLabel}]${phoneticStr}:`;
        } else {
          questionText = `${targetWord.word} [Luyện nghe #${occurrenceIndex + 1}]`;
          promptSubtitle = `[Luyện nghe nâng cao #${occurrenceIndex + 1}] Nghe phát âm và nhận diện nghĩa chính xác của từ [${posLabel}]${phoneticStr}:`;
        }

        correctAnswer = validTargetMeaning;

        const distractors = getSamePosDistractors({
          targetWord,
          pos,
          candidateWords,
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

      // Safeguard: Tuyệt đối không trùng lặp questionText
      let finalQuestionText = questionText;
      const lowerText = finalQuestionText.trim().toLowerCase();
      if (usedQuestionTexts.has(lowerText)) {
        finalQuestionText = `${finalQuestionText} [Lượt ${occurrenceIndex + 1}]`;
      }
      usedQuestionTexts.add(finalQuestionText.trim().toLowerCase());

      return {
        id: `${targetWord.id}_q${index + 1}_occ${occurrenceIndex}`,
        type: qType,
        word: targetWord.word,
        phonetic: targetWord.phonetic,
        difficulty: qDifficulty,
        level: targetWord.level || (qDifficulty === 'easy' ? 'A2' : qDifficulty === 'hard' ? 'C1' : 'B2'),
        context_level: context.contextLevel || (qTargetLevel ? qTargetLevel.toUpperCase().replace('_', ' - ') : 'B1'),
        meaning_vi: validTargetMeaning,
        meaning_en: targetWord.meaning_en,
        part_of_speech: targetWord.part_of_speech || posLabel,
        pos_code: pos,
        questionText: finalQuestionText,
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
      context_levels: activeContextLevels,
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
        context_level: item.context_level || item.contextLevel || null,
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
