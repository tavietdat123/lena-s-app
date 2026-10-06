/**
 * Curated High-Yield Vietnamese Language Learning Data (VSL 6 Bậc)
 * For LinguaVault V2 Vietnamese Track (VSL Curriculum)
 */

import { db } from './database.js';
import crypto from 'node:crypto';

export const VSL_TOPICS = [
  {
    id: 'vsl_tones',
    name: 'Ngữ âm & 6 Thanh điệu',
    emoji: '🎶',
    color: '#f59e0b',
    description: 'Học 6 thanh điệu (Ngang, Huyền, Sắc, Hỏi, Ngã, Nặng) và quy tắc đánh vần tiếng Việt',
    target_language: 'vi'
  },
  {
    id: 'vsl_pronouns',
    name: 'Đại từ Xưng hô & Tôn ti',
    emoji: '🤝',
    color: '#3b82f6',
    description: 'Hệ thống xưng hô gia đình và xã hội: Tôi, Bạn, Anh, Chị, Em, Bác, Chú, Cô',
    target_language: 'vi'
  },
  {
    id: 'vsl_cuisine',
    name: 'Ẩm thực & Gọi món Việt',
    emoji: '🍜',
    color: '#10b981',
    description: 'Từ vựng các món ăn truyền thống, gia vị, hương vị và mẫu câu gọi món tại quán',
    target_language: 'vi'
  },
  {
    id: 'vsl_bargaining',
    name: 'Chợ truyền thống & Mua sắm',
    emoji: '🛒',
    color: '#06b6d4',
    description: 'Số đếm, đơn vị tiền tệ, cách hỏi giá và nghệ thuật mặc cả thân thiện',
    target_language: 'vi'
  },
  {
    id: 'vsl_workplace',
    name: 'Giao tiếp Công sở & Đàm phán',
    emoji: '💼',
    color: '#8b5cf6',
    description: 'Email công việc, trao đổi với đồng nghiệp, đàm phán hợp đồng thương mại',
    target_language: 'vi'
  },
  {
    id: 'vsl_reduplication',
    name: 'Từ láy Tượng thanh & Tượng hình',
    emoji: '✨',
    color: '#ec4899',
    description: 'Các từ láy giàu hình ảnh và cảm xúc: thoang thoảng, róc rách, lấp lánh, bồi hồi',
    target_language: 'vi'
  },
  {
    id: 'vsl_sino_vietnamese',
    name: 'Từ Hán - Việt Học thuật',
    emoji: '📜',
    color: '#dc2626',
    description: 'Vốn từ Hán-Việt chuyên sâu trong kinh tế, công nghệ, pháp lý và báo chí chính luận',
    target_language: 'vi'
  },
  {
    id: 'vsl_idioms',
    name: 'Thành ngữ & Tục ngữ Việt',
    emoji: '🎋',
    color: '#059669',
    description: 'Kho tàng tục ngữ, thành ngữ đúc kết kinh nghiệm sống và triết lý dân gian',
    target_language: 'vi'
  }
];

export const VSL_WORDS = [
  // --- BẬC 1 (A1 - Sơ cấp 1) ---
  {
    word: 'xin chào',
    phonetic: '[sin caːw˨˩]',
    part_of_speech: 'phrase',
    meaning_vi: 'Lời chào xã giao lịch sự khi gặp mặt',
    meaning_en: 'Hello / Greetings (polite greeting to anyone).',
    meaning_ru: 'Здравствуйте / Привет (вежливое приветствие).',
    tone: 'Ngang - Huyền',
    sino_vietnamese: '',
    vsl_level: 'BAC_1',
    level: 'A1',
    topic_id: 'vsl_tones',
    collocations: ['xin chào quý khách (welcome guest)', 'xin chào các bạn (hello friends)'],
    examples: [
      'Xin chào! Rất vui được gặp bạn hôm nay. (Hello! Nice to meet you today.)',
      'Xin chào quý khách, em có thể giúp gì ạ? (Hello guest, how can I help you?)'
    ]
  },
  {
    word: 'cảm ơn',
    phonetic: '[kaːm˧˩˨ ʔəːn]',
    part_of_speech: 'phrase',
    meaning_vi: 'Bày tỏ lòng biết ơn khi nhận được sự giúp đỡ',
    meaning_en: 'Thank you / Thanks (expressing gratitude).',
    meaning_ru: 'Спасибо / Благодарю.',
    tone: 'Hỏi - Ngang',
    sino_vietnamese: '感恩 (Cảm ân)',
    vsl_level: 'BAC_1',
    level: 'A1',
    topic_id: 'vsl_tones',
    collocations: ['cảm ơn nhiều (thank you so much)', 'chân thành cảm ơn (sincerely thank)'],
    examples: [
      'Cảm ơn bạn rất nhiều vì đã giúp tôi dọn phòng. (Thank you so much for helping me clean the room.)',
      'Em xin cảm ơn thầy cô đã chỉ dẫn tận tình. (I thank the teachers for guiding me enthusiastically.)'
    ]
  },
  {
    word: 'tạm biệt',
    phonetic: '[taːm˧˨ʔ biət˧˨ʔ]',
    part_of_speech: 'phrase',
    meaning_vi: 'Lời chào khi chia tay hoặc rời đi',
    meaning_en: 'Goodbye / See you later.',
    meaning_ru: 'До свидания / Пока.',
    tone: 'Nặng - Nặng',
    sino_vietnamese: '暫別 (Tạm biệt)',
    vsl_level: 'BAC_1',
    level: 'A1',
    topic_id: 'vsl_tones',
    collocations: ['nói lời tạm biệt (say goodbye)', 'hẹn gặp lại (see you again)'],
    examples: [
      'Tạm biệt nhé, hẹn gặp lại bạn vào ngày mai! (Goodbye, see you tomorrow!)',
      'Chúng tôi vẫy tay tạm biệt nhau tại sân bay. (We waved goodbye to each other at the airport.)'
    ]
  },
  {
    word: 'ngon',
    phonetic: '[ŋɔn]',
    part_of_speech: 'adjective',
    meaning_vi: 'Có hương vị hợp khẩu vị, thích thú khi ăn uống',
    meaning_en: 'Delicious / Tasty / Yummy.',
    meaning_ru: 'Вкусный / Аппетитный.',
    tone: 'Ngang',
    sino_vietnamese: '',
    vsl_level: 'BAC_1',
    level: 'A1',
    topic_id: 'vsl_cuisine',
    collocations: ['rất ngon (very delicious)', 'ngon tuyệt vời (super tasty)', 'ăn ngon miệng (eat deliciously)'],
    examples: [
      'Món phở này nước dùng rất ngọt và ngon. (This pho broth is very sweet and delicious.)',
      'Chúc mọi người ăn trưa thật ngon miệng nhé! (Wish everyone a very delicious lunch!)'
    ]
  },

  // --- BẬC 2 (A2 - Sơ cấp 2) ---
  {
    word: 'bao nhiêu',
    phonetic: '[baːw ɲiəw]',
    part_of_speech: 'phrase',
    meaning_vi: 'Từ để hỏi về số lượng hoặc giá cả hàng hóa',
    meaning_en: 'How much / How many (asking about price or quantity).',
    meaning_ru: 'Сколько (о цене или количестве).',
    tone: 'Ngang - Ngang',
    sino_vietnamese: '',
    vsl_level: 'BAC_2',
    level: 'A2',
    topic_id: 'vsl_bargaining',
    collocations: ['bao nhiêu tiền (how much money)', 'hết bao nhiêu (how much in total)'],
    examples: [
      'Cho tôi hỏi cái áo thun này giá bao nhiêu tiền? (Excuse me, how much is this t-shirt?)',
      'Bạn đã học tiếng Việt được bao nhiêu tháng rồi? (How many months have you been learning Vietnamese?)'
    ]
  },
  {
    word: 'tính tiền',
    phonetic: '[tiŋ˦ˀ˥ tiən˨˩]',
    part_of_speech: 'verb',
    meaning_vi: 'Yêu cầu thanh toán tiền sau khi ăn uống hoặc mua hàng',
    meaning_en: 'Check, please! / Bill, please (asking for the bill).',
    meaning_ru: 'Посчитайте, пожалуйста / Счёт (в ресторане).',
    tone: 'Sắc - Huyền',
    sino_vietnamese: '',
    vsl_level: 'BAC_2',
    level: 'A2',
    topic_id: 'vsl_cuisine',
    collocations: ['cho em tính tiền (check please)', 'tính tiền bàn này (bill for this table)'],
    examples: [
      'Em ơi, cho bàn số năm tính tiền nhé! (Excuse me, check please for table number five!)',
      'Tôi muốn tính tiền bằng thẻ tín dụng được không? (Can I pay the bill with a credit card?)'
    ]
  },
  {
    word: 'đồng nghiệp',
    phonetic: '[ɗəwŋ˨˩ ŋiəp˧˨ʔ]',
    part_of_speech: 'noun',
    meaning_vi: 'Người cùng làm việc trong một cơ quan, công ty',
    meaning_en: 'Colleague / Coworker.',
    meaning_ru: 'Коллега / Сотрудник.',
    tone: 'Huyền - Nặng',
    sino_vietnamese: '同業 (Đồng nghiệp)',
    vsl_level: 'BAC_2',
    level: 'A2',
    topic_id: 'vsl_workplace',
    collocations: ['đồng nghiệp thân thiện (friendly colleague)', 'quan hệ đồng nghiệp (colleague relations)'],
    examples: [
      'Các đồng nghiệp trong nhóm luôn nhiệt tình hỗ trợ tôi. (Colleagues in the team always enthusiastically support me.)',
      'Chúng tôi tổ chức tiệc sinh nhật cho một đồng nghiệp mới. (We organized a birthday party for a new coworker.)'
    ]
  },

  // --- BẬC 3 (B1 - Trung cấp 1) ---
  {
    word: 'hợp đồng',
    phonetic: '[həːp˧˨ʔ ɗəwŋ˨˩]',
    part_of_speech: 'noun',
    meaning_vi: 'Văn bản thỏa thuận có giá trị pháp lý giữa hai bên',
    meaning_en: 'Contract / Legal Agreement.',
    meaning_ru: 'Контракт / Договор.',
    tone: 'Nặng - Huyền',
    sino_vietnamese: '合同 (Hợp đồng)',
    vsl_level: 'BAC_3',
    level: 'B1',
    topic_id: 'vsl_workplace',
    collocations: ['ký kết hợp đồng (sign contract)', 'điều khoản hợp đồng (contract terms)', 'gia hạn hợp đồng (renew contract)'],
    examples: [
      'Hai giám đốc đã đồng ý ký kết hợp đồng thương mại sáng nay. (The two directors agreed to sign the commercial contract this morning.)',
      'Vui lòng đọc kỹ các điều khoản trong hợp đồng trước khi đặt bút ký. (Please read the terms in the contract carefully before signing.)'
    ]
  },
  {
    word: 'ảnh hưởng',
    phonetic: '[ʔaːjŋ˧˩˨ hɨəŋ˧˩˨]',
    part_of_speech: 'verb',
    meaning_vi: 'Tác động làm thay đổi người hoặc sự việc khác',
    meaning_en: 'Affect / Influence / Impact.',
    meaning_ru: 'Влиять / Оказывать воздействие.',
    tone: 'Hỏi - Hỏi',
    sino_vietnamese: '影響 (Ảnh hưởng)',
    vsl_level: 'BAC_3',
    level: 'B1',
    topic_id: 'vsl_workplace',
    collocations: ['ảnh hưởng tích cực (positive impact)', 'chịu ảnh hưởng lớn (heavily influenced)'],
    examples: [
      'Công nghệ mới ảnh hưởng tích cực đến hiệu suất làm việc của chúng tôi. (New technology positively impacts our work performance.)',
      'Thời tiết xấu đã ảnh hưởng nghiêm trọng đến tiến độ chuyến bay. (Bad weather seriously affected the flight schedule.)'
    ]
  },
  {
    word: 'hài lòng',
    phonetic: '[haːj˨˩ lawŋ˨˩]',
    part_of_speech: 'adjective',
    meaning_vi: 'Cảm thấy vừa ý, toại nguyện với kết quả đạt được',
    meaning_en: 'Satisfied / Pleased / Content.',
    meaning_ru: 'Довольный / Удовлетворённый.',
    tone: 'Huyền - Huyền',
    sino_vietnamese: '',
    vsl_level: 'BAC_3',
    level: 'B1',
    topic_id: 'vsl_workplace',
    collocations: ['rất hài lòng (very satisfied)', 'mức độ hài lòng (satisfaction rate)', 'hoàn toàn hài lòng (fully pleased)'],
    examples: [
      'Khách hàng hoàn toàn hài lòng với chất lượng dịch vụ của công ty. (Customers are fully satisfied with the company’s service quality.)',
      'Tôi rất hài lòng về kết quả bài kiểm tra năng lực vừa rồi. (I am very pleased with the result of my recent proficiency test.)'
    ]
  },

  // --- BẬC 4 (B2 - Trung cấp 2) ---
  {
    word: 'thoang thoảng',
    phonetic: '[tʰwaːŋ tʰwaːŋ˧˩˨]',
    part_of_speech: 'adjective',
    meaning_vi: 'Mùi hương nhẹ nhàng, phảng phất trong không gian',
    meaning_en: 'Faint / Delicate scent / Subtle fragrance (sensory reduplication).',
    meaning_ru: 'Тонкий / Едва уловимый аромат.',
    tone: 'Ngang - Hỏi',
    sino_vietnamese: '',
    vsl_level: 'BAC_4',
    level: 'B2',
    topic_id: 'vsl_reduplication',
    collocations: ['hương thơm thoang thoảng (faint fragrance)', 'mùi hoa thoang thoảng (subtle flower scent)'],
    examples: [
      'Gió thu mang theo mùi hoa sữa thoang thoảng khắp phố phường Hà Nội. (Autumn breeze brings a subtle scent of milk flowers across Hanoi streets.)',
      'Căn phòng thoang thoảng mùi tinh dầu sả chanh tạo cảm giác thư giãn. (The room has a faint lemongrass essential oil scent creating relaxation.)'
    ]
  },
  {
    word: 'lấp lánh',
    phonetic: '[ləp˦ˀ˥ laːɲ˦ˀ˥]',
    part_of_speech: 'adjective',
    meaning_vi: 'Ánh sáng phản chiếu lung linh, nhấp nháy bắt mắt',
    meaning_en: 'Sparkling / Glittering / Shimmering (visual reduplication).',
    meaning_ru: 'Сверкающий / Искрящийся.',
    tone: 'Sắc - Sắc',
    sino_vietnamese: '',
    vsl_level: 'BAC_4',
    level: 'B2',
    topic_id: 'vsl_reduplication',
    collocations: ['ánh sao lấp lánh (sparkling stars)', 'mặt nước lấp lánh (glittering water surface)'],
    examples: [
      'Mặt hồ Tây lấp lánh ánh vàng dưới ánh hoàng hôn chiều muộn. (West Lake surface sparkles with golden light under the late afternoon sunset.)',
      'Chiếc nhẫn đính kim cương lấp lánh khiến mọi người chú ý. (The ring with diamonds sparkles, attracting everyone’s attention.)'
    ]
  },
  {
    word: 'chiến lược',
    phonetic: '[ciən˦ˀ˥ lɨək˧˨ʔ]',
    part_of_speech: 'noun',
    meaning_vi: 'Phương hướng và kế hoạch hành động dài hạn mang tính quyết định',
    meaning_en: 'Strategy / Strategic plan.',
    meaning_ru: 'Стратегия / Стратегический план.',
    tone: 'Sắc - Nặng',
    sino_vietnamese: '戰略 (Chiến lược)',
    vsl_level: 'BAC_4',
    level: 'B2',
    topic_id: 'vsl_sino_vietnamese',
    collocations: ['chiến lược kinh doanh (business strategy)', 'tầm nhìn chiến lược (strategic vision)', 'đối tác chiến lược (strategic partner)'],
    examples: [
      'Công ty đã đề ra chiến lược chuyển đổi số toàn diện trong năm năm tới. (The company set out a comprehensive digital transformation strategy for the next 5 years.)',
      'Tầm nhìn chiến lược sáng suốt giúp doanh nghiệp vượt qua giai đoạn khó khăn. (Wise strategic vision helped the enterprise overcome the difficult period.)'
    ]
  },

  // --- BẬC 5 (C1 - Cao cấp 1) ---
  {
    word: 'phát triển bền vững',
    phonetic: '[faːt˦ˀ˥ ciən˧˩˨ ɓen˨˩ vɨŋ˦ˀ˥]',
    part_of_speech: 'phrase',
    meaning_vi: 'Sự tăng trưởng đáp ứng nhu cầu hiện tại mà không làm tổn hại tương lai',
    meaning_en: 'Sustainable development.',
    meaning_ru: 'Устойчивое развитие.',
    tone: 'Sắc - Hỏi - Huyền - Ngã',
    sino_vietnamese: '發展 (Phát triển) + Bền vững',
    vsl_level: 'BAC_5',
    level: 'C1',
    topic_id: 'vsl_sino_vietnamese',
    collocations: ['mục tiêu phát triển bền vững (sustainable development goals)', 'định hướng bền vững (sustainable orientation)'],
    examples: [
      'Chính phủ cam kết thúc đẩy phát triển bền vững song song với bảo vệ môi trường. (The government is committed to promoting sustainable development alongside environmental protection.)',
      'Mô hình kinh tế tuần hoàn là chìa khóa then chốt cho sự phát triển bền vững. (The circular economy model is a key cornerstone for sustainable development.)'
    ]
  },
  {
    word: 'tối ưu hóa',
    phonetic: '[toj˦ˀ˥ ʔiəw hwaː˦ˀ˥]',
    part_of_speech: 'verb',
    meaning_vi: 'Làm cho đạt được hiệu quả cao nhất với chi phí hoặc nguồn lực thấp nhất',
    meaning_en: 'Optimize / Optimization.',
    meaning_ru: 'Оптимизировать / Оптимизация.',
    tone: 'Sắc - Ngang - Sắc',
    sino_vietnamese: '最優化 (Tối ưu hóa)',
    vsl_level: 'BAC_5',
    level: 'C1',
    topic_id: 'vsl_sino_vietnamese',
    collocations: ['tối ưu hóa quy trình (process optimization)', 'tối ưu hóa chi phí (cost optimization)'],
    examples: [
      'Các kỹ sư đang nỗ lực tối ưu hóa cơ sở dữ liệu để giảm thời gian phản hồi. (Engineers are striving to optimize the database to reduce response latency.)',
      'Áp dụng AI giúp doanh nghiệp tối ưu hóa chuỗi cung ứng logistics. (Applying AI helps enterprises optimize logistics supply chains.)'
    ]
  },

  // --- BẬC 6 (C2 - Cao cấp 2) ---
  {
    word: 'nước đến chân mới nhảy',
    phonetic: '[nɨək˦ˀ˥ ɗeːn˦ˀ˥ cən mɤj˦ˀ˥ ɲaːj˧˩˨]',
    part_of_speech: 'idiom',
    meaning_vi: 'Chờ đến lúc việc xảy ra gấp rút, không kịp trở tay mới bắt đầu làm',
    meaning_en: 'Procrastinate until the last minute / wait until crisis strikes before acting.',
    meaning_ru: 'Тянуть до последнего момента / хватиться, когда уже поздно.',
    tone: 'Thành ngữ',
    sino_vietnamese: '',
    vsl_level: 'BAC_6',
    level: 'C2',
    topic_id: 'vsl_idioms',
    collocations: ['tính ỷ lại (complacency)', 'nước đến chân mới nhảy (leave it to the last second)'],
    examples: [
      'Đừng đợi nước đến chân mới nhảy, hãy chuẩn bị ôn thi thật kỹ ngay từ đầu kỳ! (Don’t leave it until the last minute, prepare for exams thoroughly right from the semester start!)',
      'Thói quen nước đến chân mới nhảy thường dẫn đến những sai sót không đáng có. (The habit of procrastinating often leads to avoidable mistakes.)'
    ]
  },
  {
    word: 'có công mài sắt có ngày nên kim',
    phonetic: '[kɔ˦ˀ˥ kawŋ maːj˨˩ saːt˦ˀ˥ kɔ˦ˀ˥ ŋaj˨˩ nen kim]',
    part_of_speech: 'idiom',
    meaning_vi: 'Kiên trì, nhẫn nại nỗ lực làm việc thì chắc chắn sẽ gặt hái thành công lớn',
    meaning_en: 'Perseverance leads to success / Practice makes perfect / Little strokes fell great oaks.',
    meaning_ru: 'Терпение и труд всё перетрут.',
    tone: 'Tục ngữ',
    sino_vietnamese: '',
    vsl_level: 'BAC_6',
    level: 'C2',
    topic_id: 'vsl_idioms',
    collocations: ['lòng kiên trì (perseverance)', 'rèn luyện không ngừng (continuous practice)'],
    examples: [
      'Học ngoại ngữ đòi hỏi sự kiên nhẫn bền bỉ, đúng như câu tục ngữ: có công mài sắt có ngày nên kim. (Learning languages requires persistent patience, just as the proverb says: perseverance leads to success.)',
      'Sau bao năm miệt mài nghiên cứu, anh ấy đã thành công mỹ mãn - đúng là có công mài sắt có ngày nên kim. (After years of relentless research, he succeeded brilliantly - perseverance truly pays off.)'
    ]
  }
];

export const VSL_PATTERNS = [
  {
    name: 'Cấu trúc Điều kiện: Nếu... thì...',
    formula: 'Nếu [Điều kiện/Giả định] thì [Kết quả/Hệ quả]',
    explanation: 'Dùng để diễn tả mối quan hệ nhân quả - giả định. "Nếu" nêu điều kiện tiền đề, "thì" nêu kết quả tương ứng.',
    meaning_vi: 'Nếu làm điều này thì điều kia sẽ xảy ra (If... then...)',
    category: 'condition',
    tone: 'Neutral',
    target_language: 'vi',
    examples: [
      'Nếu ngày mai trời mưa thì chúng tôi sẽ hoãn chuyến dã ngoại.',
      'Nếu bạn kiên trì luyện tập mỗi ngày thì khả năng phát âm sẽ tiến bộ vượt bậc.'
    ]
  },
  {
    name: 'Cấu trúc Nguyên nhân: Vì... nên...',
    formula: 'Vì [Nguyên nhân] nên [Kết quả]',
    explanation: 'Diễn tả mối quan hệ nhân quả xác định. "Vì" chỉ nguồn cơn lý do, "nên" chỉ kết cục dẫn tới.',
    meaning_vi: 'Vì lý do này nên dẫn đến kết quả kia (Because... therefore...)',
    category: 'cause_effect',
    tone: 'Neutral',
    target_language: 'vi',
    examples: [
      'Vì đường sá bị ngập lụt nên tôi đã đến văn phòng muộn mười lăm phút.',
      'Vì dự án đạt hiệu quả xuất sắc nên cả nhóm được ban giám đốc khen thưởng.'
    ]
  },
  {
    name: 'Cấu trúc Nhượng bộ: Tuy... nhưng...',
    formula: 'Tuy [Thực tế/Khó khăn] nhưng [Kết quả trái ngược/Bất ngờ]',
    explanation: 'Nhấn mạnh sự tương phản, đối lập giữa hai vế câu. Dù vế đầu khó khăn nhưng vế sau vẫn đạt kết quả tốt.',
    meaning_vi: 'Tuy thế này nhưng lại thế khác (Although... but...)',
    category: 'contrast',
    tone: 'Neutral',
    target_language: 'vi',
    examples: [
      'Tuy bài kiểm tra rất khó nhưng hầu hết các bạn học viên đều đạt điểm cao.',
      'Tuy thời tiết mùa đông Hà Nội rất lạnh nhưng mọi người vẫn ra phố đón năm mới náo nhiệt.'
    ]
  },
  {
    name: 'Sắc thái Thụ động: Bị vs. Được',
    formula: '[Chủ ngữ] + Được (điều tốt) / Bị (điều xấu) + [Hành động]',
    explanation: 'Tiếng Việt phân biệt rạch ròi trạng thái bị động mang ý nghĩa tích cực (dùng "Được") hay tiêu cực/bất lợi (dùng "Bị").',
    meaning_vi: 'Phân biệt thể bị động tích cực (Được) và bất lợi (Bị)',
    category: 'clarification',
    tone: 'Formal',
    target_language: 'vi',
    examples: [
      'Anh ấy được thăng chức giám đốc bộ phận sau hai năm nỗ lực. (Tích cực - dùng ĐƯỢC)',
      'Chiếc xe máy của tôi bị thủng lốp trên đường đi làm sáng nay. (Bất lợi - dùng BỊ)'
    ]
  },
  {
    name: 'Cấu trúc Tăng tiến: Càng... càng...',
    formula: '[Chủ ngữ] + Càng [A] thì càng [B]',
    explanation: 'Diễn tả mức độ tăng tiến tương hỗ: mức độ của hành động/tính chất A tăng lên làm mức độ B tăng theo.',
    meaning_vi: 'Mức độ này tăng khiến mức độ kia tăng theo (The more... the more...)',
    category: 'comparison',
    tone: 'Neutral',
    target_language: 'vi',
    examples: [
      'Bạn càng chăm chỉ thực hành giao tiếp thì phản xạ nói tiếng Việt càng tự nhiên.',
      'Thời tiết về đêm càng khuya thì nhiệt độ càng giảm sâu.'
    ]
  }
];

export function seedVSLData() {
  console.log('🌱 Checking and seeding Vietnamese VSL Curriculum data...');

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // 1. Seed Topics
  const topicInsert = db.prepare(`
    INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at, target_language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  VSL_TOPICS.forEach(t => {
    topicInsert.run(t.id, t.name, t.emoji, t.color, t.description, now, now, t.target_language || 'vi');
  });

  // 2. Seed Words
  const wordCheck = db.prepare('SELECT id FROM words WHERE word = ? AND target_language = ?');
  const wordInsert = db.prepare(`
    INSERT INTO words (
      id, word, phonetic, audio_url, part_of_speech, meaning_vi, meaning_en,
      collocations, examples, tags, level, repetition, interval, ease_factor,
      due_date, status, created_at, updated_at, topic_id, user_id,
      target_language, tone, sino_vietnamese, vsl_level
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, 0, 0, 2.5,
      ?, 'new', ?, ?, ?, 'admin_master_user_id',
      'vi', ?, ?, ?
    )
  `);

  let addedWords = 0;
  VSL_WORDS.forEach(w => {
    const exists = wordCheck.get(w.word, 'vi');
    if (!exists) {
      const id = crypto.randomUUID();
      wordInsert.run(
        id,
        w.word,
        w.phonetic || '',
        w.audio_url || '',
        w.part_of_speech || 'noun',
        w.meaning_vi,
        w.meaning_en,
        JSON.stringify(w.collocations || []),
        JSON.stringify(w.examples || []),
        JSON.stringify(['VSL', w.vsl_level, w.level]),
        w.level,
        today,
        now,
        now,
        w.topic_id || 'vsl_tones',
        w.tone || '',
        w.sino_vietnamese || '',
        w.vsl_level || 'BAC_1'
      );
      addedWords++;
    }
  });

  // 3. Seed Patterns
  const patternCheck = db.prepare('SELECT id FROM patterns WHERE name = ? AND target_language = ?');
  const patternInsert = db.prepare(`
    INSERT INTO patterns (
      id, name, formula, explanation, meaning_vi, category, tone,
      examples, tags, repetition, interval, ease_factor, due_date, status,
      created_at, updated_at, user_id, target_language
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, 0, 0, 2.5, ?, 'new',
      ?, ?, 'admin_master_user_id', 'vi'
    )
  `);

  let addedPatterns = 0;
  VSL_PATTERNS.forEach(p => {
    const exists = patternCheck.get(p.name, 'vi');
    if (!exists) {
      const id = crypto.randomUUID();
      patternInsert.run(
        id,
        p.name,
        p.formula,
        p.explanation,
        p.meaning_vi,
        p.category || 'contrast',
        p.tone || 'Neutral',
        JSON.stringify(p.examples || []),
        JSON.stringify(['VSL', p.category]),
        today,
        now,
        now
      );
      addedPatterns++;
    }
  });

  // 4. Seed Vietnamese Smart Reader Articles
  const noteCheck = db.prepare('SELECT id FROM notes WHERE title = ? AND target_language = ?');
  const noteInsert = db.prepare(`
    INSERT INTO notes (
      id, title, content, topic, tags, linked_words,
      created_at, updated_at, user_id, target_language
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, 'admin_master_user_id', 'vi'
    )
  `);

  let addedNotes = 0;
  VSL_NOTES.forEach(n => {
    const exists = noteCheck.get(n.title, 'vi');
    if (!exists) {
      const id = crypto.randomUUID();
      noteInsert.run(
        id,
        n.title,
        n.content,
        n.topic,
        JSON.stringify(n.tags || []),
        JSON.stringify(n.linked_words || []),
        now,
        now
      );
      addedNotes++;
    }
  });

  console.log(`✅ VSL Seed Completed: ${addedWords} words, ${addedPatterns} patterns, and ${addedNotes} articles added.`);
}

export const VSL_NOTES = [
  {
    title: 'Nghệ Thuật Giao Tiếp và Ứng Xử Trong Văn Hóa Việt Nam',
    topic: 'vsl_pronouns',
    tags: ['Giao tiếp', 'Văn hóa', 'Đời sống'],
    linked_words: ['xin chào', 'cảm ơn', 'xin lỗi', 'tôn trọng', 'lắng nghe', 'chân thành', 'thấu hiểu', 'khiêm tốn'],
    content: `Giao tiếp trong văn hóa Việt Nam không chỉ là việc trao đổi thông tin, mà còn là một nghệ thuật ứng xử tinh tế thể hiện sự tôn trọng và chân thành.

Trong đời sống thường nhật, việc xưng hô đúng mực theo thứ bậc gia đình và xã hội như "anh, chị, em, cô, chú, bác" thể hiện nét đẹp kính trên nhường dưới. Lời "cảm ơn" chân thành khi nhận được sự giúp đỡ và lời "xin lỗi" đúng lúc luôn giúp hóa giải mọi bất đồng, xây dựng mối quan hệ gắn kết bền chặt.

Không những thế, người Việt còn rất coi trọng đức tính khiêm tốn và biết lắng nghe. Dù bạn làm việc trong môi trường công sở hay trò chuyện cùng bạn bè, sự thấu hiểu và cách ứng xử nhã nhặn luôn là chiếc chìa khóa vàng mở lối thành công.`
  },
  {
    title: 'Nét Đẹp Tinh Tế Của Ẩm Thực Đường Phố Hà Nội',
    topic: 'vsl_cuisine',
    tags: ['Ẩm thực', 'Hà Nội', 'Du lịch', 'Món ăn'],
    linked_words: ['phở bò', 'bánh mì', 'cà phê', 'đậm đà', 'hấp dẫn', 'thoang thoảng', 'hương vị', 'tinh tế'],
    content: `Ẩm thực Hà Nội từ lâu đã làm say lòng biết bao du khách bởi sự thanh tao, hài hòa và đậm đà bản sắc truyền thống.

Buổi sớm mai trên những con phố cổ, mùi nước dùng phở bò thoang thoảng hương quế và hồi lan tỏa trong không khí se lạnh. Bát phở nóng hổi với bánh phở mềm mượt, thịt bò thơm ngon và hành hoa xanh mướt là khởi đầu hoàn hảo cho một ngày mới tràn đầy năng lượng.

Bên cạnh phở, chiếc bánh mì giòn rụm với pa-tê béo ngậy hay ly cà phê trứng sóng sánh vàng ươm cũng là những trải nghiệm khó quên. Ẩm thực đường phố không đơn thuần là món ăn, mà còn là câu chuyện về nếp sống, sự tỉ mỉ và lòng hiếu khách của người dân thủ đô.`
  },
  {
    title: 'Bí Quyết Chinh Phục Tiếng Việt: Từ Thanh Điệu Đến Phản Xạ Tự Nhiên',
    topic: 'vsl_tones',
    tags: ['Học tiếng Việt', 'Thanh điệu', 'Phương pháp', 'SRS'],
    linked_words: ['kiên trì', 'thanh điệu', 'phát âm', 'phản xạ', 'luyện tập', 'tiến bộ', 'ngữ điệu'],
    content: `Học tiếng Việt là một hành trình thú vị mở ra cánh cửa thấu hiểu con người và văn hóa Việt Nam sâu sắc.

Thách thức đầu tiên của người học thường là sáu thanh điệu đặc trưng: Ngang, Huyền, Sắc, Hỏi, Ngã và Nặng. Mỗi thanh điệu mang lại một cao độ và sắc thái âm nhạc riêng biệt. Để nắm vững ngữ điệu, người học cần kiên trì luyện nghe và phát âm chuẩn từng từ mỗi ngày.

Thay vì học dồn ép hàng giờ liền rồi nhanh chóng quên đi, phương pháp lặp lại ngắt quãng (SRS) kết hợp luyện nói tương tác giúp người học ghi nhớ sâu và phản xạ tự nhiên. Chỉ cần bạn duy trì thói quen luyện tập mười phút mỗi ngày với sự kiên định, sự tiến bộ vượt bậc chắc chắn sẽ đến.`
  }
];
