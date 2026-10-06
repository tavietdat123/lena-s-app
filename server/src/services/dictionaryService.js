/**
 * Smart AI & Pedagogical Lexicon Dictionary Service
 * Powered by Google Gemini AI (0đ) + Oxford/Cambridge Learner Standards + High-Yield Curated Lexicon
 */

import { db } from '../db/database.js';
import { callGemini, getEffectiveApiKey } from './aiService.js';

// Helper: Detect Vietnamese Tone
export function detectVietnameseTone(word) {
  if (!word) return 'Ngang';
  const w = word.toLowerCase();
  if (/[áắấéếíóốớúứý]/.test(w)) return 'Sắc';
  if (/[àằầèềìòồờùừỳ]/.test(w)) return 'Huyền';
  if (/[ảẳẩẻểỉỏổởủửỷ]/.test(w)) return 'Hỏi';
  if (/[ãẵẫẽễĩõỗỡũữỹ]/.test(w)) return 'Ngã';
  if (/[ạặậẹệịọộợụựỵ]/.test(w)) return 'Nặng';
  return 'Ngang';
}

// Topic Identifier Mapping Helper
export function inferTopic(word, partOfSpeech = '', meaningVi = '') {
  const w = (word || '').toLowerCase();
  const m = (meaningVi || '').toLowerCase();

  // 1. AI & Machine Learning
  if (/^(ai|llm|gpt|neural|tensor|prompt|transformer|model|embedding|inference|hallucination|agentic|rag|deep learning)/i.test(w) ||
      /(trí tuệ nhân tạo|học máy|học sâu|mô hình ngôn ngữ|mạng nơ-ron|thị giác máy tính|prompt)/i.test(m)) {
    return 'ai';
  }

  // 2. Cybersecurity
  if (/^(cyber|security|firewall|vulnerability|exploit|penetration|pentest|zero trust|encryption|decrypt|malware|ransomware|phishing|token|auth)/i.test(w) ||
      /(an ninh mạng|bảo mật|lỗ hổng|mật mã|tường lửa|mã độc|tấn công mạng|xác thực)/i.test(m)) {
    return 'cybersecurity';
  }

  // 3. Cloud & DevOps
  if (/^(cloud|devops|docker|kubernetes|k8s|container|ci|cd|pipeline|deploy|aws|azure|gcp|iac|terraform|ansible|cluster|microservice)/i.test(w) ||
      /(đám mây|hạ tầng|triển khai|vận hành|vùng chứa|tự động hóa hạ tầng)/i.test(m)) {
    return 'devops';
  }

  // 4. Data & Analytics
  if (/^(data|warehouse|lakehouse|etl|sql|analytics|spark|hadoop|bi|metric|visualization|query|aggregate)/i.test(w) ||
      /(dữ liệu lớn|kho dữ liệu|truy vấn|phân tích dữ liệu|trực quan hóa|thống kê)/i.test(m)) {
    return 'data';
  }

  // 5. Database Systems
  if (/^(database|postgres|mysql|nosql|mongodb|redis|indexing|transaction|acid|sharding|replication|deadlock)/i.test(w) ||
      /(cơ sở dữ liệu|chỉ mục|giao dịch|bảng dữ liệu|khóa chính|khóa ngoại)/i.test(m)) {
    return 'database_systems';
  }

  // 6. Web & Frontend
  if (/^(web|frontend|react|vue|angular|html|css|dom|responsive|nextjs|tailwind|ui|ux|component|bundle)/i.test(w) ||
      /(lập trình web|giao diện|trang web|thành phần giao diện|hiển thị|thiết kế web)/i.test(m)) {
    return 'web_dev';
  }

  // 7. Mobile Development
  if (/^(mobile|android|ios|swift|kotlin|flutter|react native|touch|gesture|app store|play store)/i.test(w) ||
      /(ứng dụng di động|điện thoại|cảm ứng|hệ điều hành di động)/i.test(m)) {
    return 'mobile_dev';
  }

  // 8. Blockchain & Web3
  if (/^(blockchain|web3|crypto|bitcoin|ethereum|smart contract|solidity|defi|ledger|consensus|mint|nft)/i.test(w) ||
      /(chuỗi khối|tiền mã hóa|hợp đồng thông minh|sổ cái|phi tập trung)/i.test(m)) {
    return 'blockchain';
  }

  // 9. QA & Software Testing
  if (/^(qa|testing|assertion|mock|stub|unit test|integration test|selenium|cypress|regression|bug|defect)/i.test(w) ||
      /(kiểm thử|đảm bảo chất lượng|quản lý lỗi|tự động hóa kiểm thử)/i.test(m)) {
    return 'qa_testing';
  }

  // 10. Software Engineering & Architecture
  if (/^(code|refactor|design pattern|architecture|oop|class|inheritance|polymorphism|interface|clean code|algorithm|async|sync|concurrency|mutex)/i.test(w) ||
      /(kỹ nghệ phần mềm|kiến trúc phần mềm|tái cấu trúc|thuật toán|lập trình hướng đối tượng|đa luồng)/i.test(m)) {
    return 'software_eng';
  }

  // 11. B2 Topics (Debate, Negotiation, Global Issues)
  if (/^(debate|persuade|convince|counter|rebuttal|dispute|consensus|compromise)/i.test(w) ||
      /(tranh biện|thuyết phục|phản biện|lập luận)/i.test(m)) {
    return 'b2_debate_persuasion';
  }
  if (/^(negotiate|concession|bargain|leverage|settlement|terms|clause)/i.test(w) ||
      /(đàm phán|thương thuyết|nhượng bộ|thỏa hiệp)/i.test(m)) {
    return 'b2_business_negotiation';
  }

  // 12. B1 Topics (Workplace, Daily Life, Travel)
  if (/^(colleague|office|schedule|routine|task|meeting|boss|cubicle|shift)/i.test(w) ||
      /(đồng nghiệp|văn phòng|lịch trình|ca làm|cuộc họp công sở)/i.test(m)) {
    return 'b1_workplace';
  }
  if (/^(rent|house|apartment|chore|furniture|appliance|bill|utility|grocery)/i.test(w) ||
      /(thuê nhà|việc nhà|nội thất|hóa đơn điện nước|sinh hoạt)/i.test(m)) {
    return 'b1_daily_life';
  }

  // 13. General Tech
  if (/^(tech|software|api|server|network|pipeline)/i.test(w) ||
      /(công nghệ|máy tính|hệ thống|mạng)/i.test(m)) {
    return 'tech';
  }

  // 14. Work & Career
  if (/^(work|job|career|business|market|lead|manage|leverage|streamline|delegate|prioritize|collaborate|facilitate|synergy|benchmark|deliverable|stakeholder|bottleneck|deadline|bandwidth|optimize|implement|revenue|executive)/i.test(w) ||
      /(công việc|sự nghiệp|kinh doanh|doanh nghiệp|lãnh đạo|quản lý|dự án|khách hàng|hợp đồng)/i.test(m)) {
    return 'work';
  }

  // 15. Academic & IELTS
  if (/^(academic|ielts|essay|scrutiny|paradigm|cogent|esoteric|ubiquitous|procrastinate|conundrum|ameliorate|mitigate|eloquent|superfluous|versatile|vulnerable|ambiguous|comprehensive|indispensable|inevitable|feasible|prevalent|ephemeral|phenomenon|hypothesis)/i.test(w) ||
      /(học thuật|nghiên cứu|luận văn|khảo sát|giả thuyết|phân tích sâu|hiện tượng|chứng minh)/i.test(m)) {
    return 'ielts';
  }

  // 16. Mindset & Psychology
  if (/^(mindset|psych|resilient|serendipity|mindful|stoic|grit|growth|discipline|cognitive|perseverance|empathy|emotion|habit|lucid|introspection|philosophy)/i.test(w) ||
      /(tư duy|tâm lý|cảm xúc|kiên cường|phát triển bản thân|thói quen|nhận thức|triết học|tinh thần)/i.test(m)) {
    return 'mindset';
  }

  // 17. Travel & Culture
  if (/^(travel|trip|tour|itinerary|wanderlust|hospitality|breathtaking|picturesque|souvenir|destination|excursion|heritage|flight|hotel|explore)/i.test(w) ||
      /(du lịch|khách sạn|chuyến bay|văn hóa|thắng cảnh|ẩm thực|hành trình|khám phá)/i.test(m)) {
    return 'travel';
  }

  return 'daily';
}

// High-Yield Curated Learner's Lexicon for Instant, Flawless Results
const CURATED_LEXICON = {
  resilient: {
    word: 'resilient',
    phonetic: '/rɪˈzɪl.i.ənt/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/resilient-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Kiên cường, bền bỉ (khả năng phục hồi nhanh sau khó khăn, biến cố)',
    meaning_en: 'Able to withstand or recover quickly from difficult conditions.',
    collocations: [
      'resilient mindset (tư duy kiên cường)',
      'stay resilient (giữ vững tinh thần)',
      'highly resilient (cực kỳ kiên cường)',
      'resilient economy (nền kinh tế có sức chống chịu cao)'
    ],
    examples: [
      'The team remained remarkably resilient despite facing unexpected project delays. (Cả nhóm vẫn kiên cường đáng nể dù gặp phải những trì hoãn bất ngờ trong dự án.)',
      'Developing a resilient mindset is essential for long-term career success. (Rèn luyện tư duy kiên cường là điều cốt yếu để thành công lâu dài trong sự nghiệp.)'
    ],
    level: 'B2',
    topic_id: 'mindset'
  },
  articulate: {
    word: 'articulate',
    phonetic: '/ɑːrˈtɪk.jə.lət/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/articulate-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Ăn nói lưu loát, diễn đạt ý tưởng gãy gọn, mạch lạc và thuyết phục',
    meaning_en: 'Able to express thoughts, ideas, and feelings clearly and effectively in speech or writing.',
    collocations: [
      'articulate speaker (người diễn thuyết lưu loát)',
      'articulate an idea (diễn đạt một ý tưởng rõ ràng)',
      'highly articulate (ăn nói rất gãy gọn)',
      'clear and articulate (rõ ràng và mạch lạc)'
    ],
    examples: [
      'She gave an articulate and persuasive presentation to the executive board. (Cô ấy đã có một bài thuyết trình lưu loát và đầy thuyết phục trước ban giám đốc.)',
      'Engineers must learn to articulate technical trade-offs to non-technical stakeholders. (Kỹ sư cần học cách diễn đạt gãy gọn các bài toán đánh đổi kỹ thuật cho các bên liên quan.)'
    ],
    level: 'C1',
    topic_id: 'work'
  },
  meticulous: {
    word: 'meticulous',
    phonetic: '/məˈtɪk.jə.ləs/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/meticulous-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Tỉ mỉ, cẩn trọng, chu đáo đến từng chi tiết nhỏ',
    meaning_en: 'Showing great attention to detail; very careful and precise.',
    collocations: [
      'meticulous planning (kế hoạch tỉ mỉ, chu toàn)',
      'meticulous attention to detail (sự chú ý tỉ mỉ đến từng chi tiết)',
      'meticulous research (nghiên cứu kỹ lưỡng)',
      'meticulous craftsmanship (tay nghề tinh xảo)'
    ],
    examples: [
      'The database migration was executed with meticulous care without any downtime. (Quá trình chuyển đổi cơ sở dữ liệu đã được thực hiện với sự cẩn trọng tỉ mỉ mà không gây gián đoạn hệ thống.)',
      'His meticulous code reviews helped the engineering team prevent critical bugs. (Những lần rà soát mã nguồn tỉ mỉ của anh ấy đã giúp đội ngũ kỹ thuật ngăn chặn các lỗi nghiêm trọng.)'
    ],
    level: 'C1',
    topic_id: 'work'
  },
  pragmatic: {
    word: 'pragmatic',
    phonetic: '/præɡˈmæt.ɪk/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/pragmatic-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Thực tế, thực dụng (tập trung vào giải pháp hiệu quả thực tế hơn là lý thuyết)',
    meaning_en: 'Solving problems in a sensible way that suits the conditions that really exist, rather than obeying fixed theories.',
    collocations: [
      'pragmatic approach (cách tiếp cận thực tế)',
      'pragmatic solution (giải pháp thực tiễn)',
      'pragmatic decision (quyết định mang tính thực tế)',
      'pragmatic mindset (tư duy thực tiễn)'
    ],
    examples: [
      'We took a pragmatic approach to launch the minimum viable product within two weeks. (Chúng tôi đã áp dụng cách tiếp cận thực tế để ra mắt sản phẩm khả dụng tối thiểu trong vòng hai tuần.)',
      'Good software architecture requires pragmatic trade-offs over academic perfection. (Kiến trúc phần mềm tốt đòi hỏi những thỏa hiệp thực tế thay vì sự hoàn hảo trên lý thuyết.)'
    ],
    level: 'C1',
    topic_id: 'work'
  },
  leverage: {
    word: 'leverage',
    phonetic: '/ˈlev.ər.ɪdʒ/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/leverage-us.mp3',
    part_of_speech: 'verb',
    meaning_vi: 'Tận dụng, phát huy tối đa lợi thế / tiềm năng / đòn bẩy sẵn có',
    meaning_en: 'To use something to maximum advantage.',
    collocations: [
      'leverage AI tools (tận dụng các công cụ AI)',
      'leverage resources (tận dụng tối đa nguồn lực)',
      'gain leverage (có được lợi thế đòn bẩy)',
      'leverage technology (ứng dụng đòn bẩy công nghệ)'
    ],
    examples: [
      'Startups can leverage modern cloud infrastructure to scale rapidly at low cost. (Các công ty khởi nghiệp có thể tận dụng hạ tầng đám mây hiện đại để mở rộng nhanh với chi phí thấp.)',
      'The company leveraged its brand reputation to expand into international markets. (Công ty đã phát huy tối đa danh tiếng thương hiệu để mở rộng ra thị trường quốc tế.)'
    ],
    level: 'B2',
    topic_id: 'work'
  },
  streamline: {
    word: 'streamline',
    phonetic: '/ˈstriːm.laɪn/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/streamline-us.mp3',
    part_of_speech: 'verb',
    meaning_vi: 'Tinh giản, tối ưu hóa quy trình để vận hành nhanh và hiệu quả hơn',
    meaning_en: 'To make a system, business, or process more efficient and effective by simplifying it.',
    collocations: [
      'streamline the workflow (tinh giản luồng làm việc)',
      'streamline operations (tối ưu hóa hoạt động vận hành)',
      'streamline communication (tinh giản kênh liên lạc)',
      'streamline the process (đơn giản hóa quy trình)'
    ],
    examples: [
      'The automated CI/CD pipeline streamlined our software release cycle significantly. (Quy trình tự động hóa CI/CD đã tinh giản chu kỳ phát hành phần mềm của chúng tôi một cách đáng kể.)',
      'We need to streamline customer support to resolve inquiries within minutes. (Chúng ta cần tinh giản quy trình hỗ trợ khách hàng để xử lý các yêu cầu chỉ trong vài phút.)'
    ],
    level: 'B2',
    topic_id: 'work'
  },
  ubiquitous: {
    word: 'ubiquitous',
    phonetic: '/juːˈbɪk.wə.təs/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/ubiquitous-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Phổ biến khắp nơi, có mặt ở mọi nơi (nhan nhản, thịnh hành)',
    meaning_en: 'Present, appearing, or found everywhere at the same time.',
    collocations: [
      'become ubiquitous (trở nên phổ biến khắp nơi)',
      'ubiquitous presence (sự hiện diện ở khắp mọi nơi)',
      'ubiquitous technology (công nghệ hiện diện khắp nơi)'
    ],
    examples: [
      'Smartphones have become ubiquitous in modern society. (Điện thoại thông minh đã trở nên phổ biến ở khắp mọi ngõ ngách của xã hội hiện đại.)',
      'High-speed internet is now a ubiquitous utility in urban areas. (Internet tốc độ cao giờ đây là tiện ích có mặt khắp nơi tại các khu đô thị.)'
    ],
    level: 'C1',
    topic_id: 'tech'
  },
  lucid: {
    word: 'lucid',
    phonetic: '/ˈluː.sɪd/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/lucid-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Rõ ràng, minh bạch, dễ hiểu; (đầu óc) tỉnh táo, sáng suốt',
    meaning_en: 'Clearly expressed and easy to understand; able to think clearly.',
    collocations: [
      'lucid explanation (lời giải thích rõ ràng, sáng rõ)',
      'lucid style (phong cách viết mạch lạc)',
      'remain lucid (giữ đầu óc tỉnh táo)'
    ],
    examples: [
      'The author provided a lucid explanation of complex quantum physics concepts. (Tác giả đã đưa ra một lời giải thích cực kỳ sáng rõ về các khái niệm vật lý lượng tử phức tạp.)',
      'Even in stressful situations, she maintained a lucid and composed perspective. (Ngay cả trong những tình huống áp lực, cô ấy vẫn giữ được cái nhìn sáng suốt và bình tĩnh.)'
    ],
    level: 'C1',
    topic_id: 'mindset'
  },
  serendipity: {
    word: 'serendipity',
    phonetic: '/ˌser.ənˈdɪp.ə.t̬i/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/serendipity-us.mp3',
    part_of_speech: 'noun',
    meaning_vi: 'Sự tình cờ may mắn (cơ duyên tìm thấy điều tốt đẹp bất ngờ)',
    meaning_en: 'The occurrence and development of events by chance in a happy or beneficial way.',
    collocations: [
      'pure serendipity (hoàn toàn là sự tình cờ may mắn)',
      'moment of serendipity (khoảnh khắc may mắn tình cờ)',
      'serendipity and fate (duyên may và định mệnh)'
    ],
    examples: [
      'Discovering penicillin was a famous example of scientific serendipity. (Việc phát hiện ra penicillin là một ví dụ nổi tiếng về sự tình cờ may mắn trong khoa học.)',
      'They met by pure serendipity at an airport terminal in Tokyo. (Họ đã gặp nhau hoàn toàn do sự tình cờ may mắn tại nhà ga sân bay ở Tokyo.)'
    ],
    level: 'C2',
    topic_id: 'mindset'
  },
  procrastinate: {
    word: 'procrastinate',
    phonetic: '/prəˈkræs.tə.neɪt/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/procrastinate-us.mp3',
    part_of_speech: 'verb',
    meaning_vi: 'Trì hoãn, chần chừ (thói quen lần lữa công việc đến phút chót)',
    meaning_en: 'To delay doing something that you should do, often because it is unpleasant or boring.',
    collocations: [
      'tend to procrastinate (có xu hướng trì hoãn)',
      'procrastinate on tasks (trì hoãn nhiệm vụ)',
      'stop procrastinating (ngừng chần chừ)'
    ],
    examples: [
      'I tend to procrastinate whenever I have to write a lengthy report. (Tôi thường có xu hướng trì hoãn mỗi khi phải viết một bản báo cáo dài dòng.)',
      'Do not procrastinate on important decisions that shape your career. (Đừng lần lữa trước những quyết định quan trọng định hình sự nghiệp của bạn.)'
    ],
    level: 'B2',
    topic_id: 'mindset'
  },
  ephemeral: {
    word: 'ephemeral',
    phonetic: '/əˈfem.ər.əl/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/ephemeral-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Phù du, ngắn ngủi, chóng tàn (chỉ tồn tại trong thoáng chốc)',
    meaning_en: 'Lasting for a very short time.',
    collocations: [
      'ephemeral pleasure (niềm vui thoáng qua)',
      'ephemeral nature (bản chất phù du)',
      'ephemeral fame (danh tiếng nhất thời)'
    ],
    examples: [
      'Fame on social media is often ephemeral and fades quickly. (Sự nổi tiếng trên mạng xã hội thường chỉ là phù du và phai tàn rất nhanh.)',
      'The beauty of cherry blossoms is ephemeral yet deeply cherished. (Vẻ đẹp của hoa anh đào tuy ngắn ngủi nhưng lại được vô cùng trân quý.)'
    ],
    level: 'C2',
    topic_id: 'ielts'
  },
  'take for granted': {
    word: 'take for granted',
    phonetic: '/teɪk fɔːr ˈɡræn.tɪd/',
    audio_url: '',
    part_of_speech: 'phrase',
    meaning_vi: 'Coi điều gì đó là hiển nhiên (không biết trân trọng giá trị sẵn có)',
    meaning_en: 'To fail to properly appreciate someone or something, especially as a result of overfamiliarity.',
    collocations: [
      'take things for granted (coi mọi thứ là điều hiển nhiên)',
      'take someone for granted (không trân trọng một ai đó)',
      'never take it for granted (không bao giờ coi đó là hiển nhiên)'
    ],
    examples: [
      'We often take good health for granted until we fall seriously ill. (Chúng ta thường coi sức khỏe tốt là điều hiển nhiên cho đến khi đổ bệnh nặng.)',
      'Never take the support of your loyal colleagues for granted. (Đừng bao giờ xem nhẹ và coi sự ủng hộ của các đồng nghiệp trung thành là điều hiển nhiên.)'
    ],
    level: 'B2',
    topic_id: 'daily'
  },
  sustainable: {
    word: 'sustainable',
    phonetic: '/səˈsteɪ.nə.bəl/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/sustainable-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Bền vững (có thể duy trì lâu dài mà không gây cạn kiệt tài nguyên)',
    meaning_en: 'Able to be maintained at a certain rate or level without exhausting resources.',
    collocations: [
      'sustainable development (phát triển bền vững)',
      'sustainable energy (năng lượng bền vững)',
      'sustainable practice (thực tiễn bền vững)',
      'sustainable growth (tăng trưởng bền vững)'
    ],
    examples: [
      'Companies must adopt sustainable business practices to protect the environment. (Các công ty phải áp dụng các phương thức kinh doanh bền vững để bảo vệ môi trường.)',
      'Sustainable economic growth benefits both the current and future generations. (Tăng trưởng kinh tế bền vững mang lại lợi ích cho cả thế hệ hiện tại và tương lai.)'
    ],
    level: 'B2',
    topic_id: 'work'
  },
  scalable: {
    word: 'scalable',
    phonetic: '/ˈskeɪ.lə.bəl/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/scalable-us.mp3',
    part_of_speech: 'adjective',
    meaning_vi: 'Có khả năng mở rộng (hệ thống có thể tải lớn mà không suy giảm hiệu năng)',
    meaning_en: 'Able to be changed in size or scale; able to handle a growing amount of work or customers.',
    collocations: [
      'scalable architecture (kiến trúc có khả năng mở rộng)',
      'scalable solution (giải pháp có thể mở rộng)',
      'highly scalable (khả năng mở rộng rất cao)',
      'scalable infrastructure (hạ tầng có khả năng mở rộng)'
    ],
    examples: [
      'We built a scalable microservices backend capable of serving millions of concurrent requests. (Chúng tôi đã xây dựng hạ tầng microservices có khả năng mở rộng để phục vụ hàng triệu yêu cầu đồng thời.)',
      'Cloud technology provides businesses with flexible, scalable computing resources. (Công nghệ đám mây cung cấp cho doanh nghiệp nguồn tài nguyên máy tính linh hoạt và có khả năng mở rộng.)'
    ],
    level: 'B2',
    topic_id: 'tech'
  },
  mindfulness: {
    word: 'mindfulness',
    phonetic: '/ˈmaɪnd.fəl.nəs/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/mindfulness-us.mp3',
    part_of_speech: 'noun',
    meaning_vi: 'Chánh niệm, sự tỉnh thức (trạng thái nhận biết trọn vẹn hiện tại)',
    meaning_en: 'The practice of maintaining a nonjudgmental state of heightened or complete awareness of one’s thoughts, emotions, or experiences on a moment-to-moment basis.',
    collocations: [
      'practice mindfulness (thực hành chánh niệm)',
      'mindfulness meditation (thiền chánh niệm)',
      'mindfulness in daily life (chánh niệm trong đời sống)'
    ],
    examples: [
      'Practicing mindfulness for ten minutes every morning can reduce stress noticeably. (Thực hành chánh niệm mười phút mỗi sáng có thể giúp giảm căng thẳng rõ rệt.)',
      'Mindfulness allows professionals to stay calm and focused under intense pressure. (Sự tỉnh thức giúp các chuyên gia giữ được bình tĩnh và tập trung dưới áp lực cao.)'
    ],
    level: 'B2',
    topic_id: 'mindset'
  },
  itinerary: {
    word: 'itinerary',
    phonetic: '/aɪˈtɪn.ə.rer.i/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/itinerary-us.mp3',
    part_of_speech: 'noun',
    meaning_vi: 'Lịch trình, hành trình chi tiết (kế hoạch chuyến đi theo từng ngày)',
    meaning_en: 'A planned route or journey with a detailed list of places to visit and times.',
    collocations: [
      'travel itinerary (lịch trình du lịch)',
      'plan an itinerary (lên lịch trình)',
      'detailed itinerary (lịch trình chi tiết)',
      'flexible itinerary (lịch trình linh hoạt)'
    ],
    examples: [
      'We followed a detailed itinerary covering five major cities in Japan over ten days. (Chúng tôi đã đi theo một lịch trình chi tiết khám phá năm thành phố lớn tại Nhật Bản trong mười ngày.)',
      'The tour guide handed out the official itinerary to all travelers at the airport. (Hướng dẫn viên du lịch đã phát lịch trình chính thức cho tất cả du khách tại sân bay.)'
    ],
    level: 'B2',
    topic_id: 'travel'
  },
  wanderlust: {
    word: 'wanderlust',
    phonetic: '/ˈwɑːn.dɚ.lʌst/',
    audio_url: 'https://api.dictionaryapi.dev/media/pronunciations/en/wanderlust-us.mp3',
    part_of_speech: 'noun',
    meaning_vi: 'Niềm đam mê xê dịch, khát khao đi du lịch khám phá khắp thế giới',
    meaning_en: 'A strong desire to travel and explore the world.',
    collocations: [
      'filled with wanderlust (tràn ngập niềm đam mê xê dịch)',
      'cure one’s wanderlust (thỏa mãn khát khao du lịch)',
      'sense of wanderlust (cảm giác muốn xách balo lên và đi)'
    ],
    examples: [
      'Her deep sense of wanderlust led her to backpack across Southeast Asia for a whole year. (Niềm đam mê xê dịch sâu sắc đã thôi thúc cô ấy đi du lịch bụi khắp Đông Nam Á trong suốt một năm.)',
      'Seeing photos of remote mountain ranges always sparks my wanderlust. (Nhìn ngắm những bức ảnh về các dãy núi hoang sơ luôn khơi dậy trong tôi niềm đam mê khám phá thế giới.)'
    ],
    level: 'C1',
    topic_id: 'travel'
  }
};

export async function lookupDictionary(word, targetLang = 'en', nativeLang = 'en') {
  if (!word || !word.trim()) {
    throw new Error('Vui lòng nhập từ hoặc cụm từ cần tra cứu');
  }

  const cleanWord = word.trim();
  const lowerWord = cleanWord.toLowerCase();
  const hasVietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(cleanWord);
  const isTargetVi = targetLang === 'vi' || hasVietnameseChars;

  // 1. Check if word exists in Curated High-Yield Lexicon (for English)
  if (!isTargetVi && CURATED_LEXICON[lowerWord]) {
    const item = CURATED_LEXICON[lowerWord];
    return {
      ...item,
      topic_id: item.topic_id || inferTopic(item.word, item.part_of_speech, item.meaning_vi)
    };
  }

  // 2. Check if Gemini API Key is configured
  const geminiKey = getEffectiveApiKey();

  // 3. If Gemini API Key exists -> Use Google Gemini AI (Pedagogical Excellence)
  if (geminiKey) {
    try {
      let topicListPrompt = '';
      try {
        const langFilter = isTargetVi ? "WHERE target_language IN ('vi', 'all') OR target_language IS NULL" : "WHERE target_language IN ('en', 'all') OR target_language IS NULL";
        const activeTopics = db.prepare(`SELECT id, name, description FROM topics ${langFilter} ORDER BY created_at ASC`).all();
        if (activeTopics.length > 0) {
          topicListPrompt = activeTopics.map(t => `   - "${t.id}" (${t.name}: ${t.description || ''})`).join('\n');
        }
      } catch (e) {}

      if (!topicListPrompt) {
        topicListPrompt = `   - "daily" (Đời sống & Giao tiếp)\n   - "social" (Gia đình & Quan hệ)\n   - "food" (Ẩm thực & Ăn uống)\n   - "travel" (Du lịch & Văn hóa)\n   - "work" (Công việc & Sự nghiệp)\n   - "education" (Giáo dục & Học vấn)\n   - "health" (Sức khỏe & Thể chất)\n   - "tech" (Công nghệ & Đời sống Số)`;
      }

      let prompt = '';
      if (isTargetVi) {
        const nativeName = nativeLang === 'ru' ? 'Russian (Tiếng Nga)' : 'English (Tiếng Anh)';
        prompt = `
Bạn là một Chuyên gia Ngôn ngữ học Tiếng Việt và Sư phạm Ngôn ngữ Quốc tế (chuẩn Khung 6 Bậc VSL).
Hãy biên soạn phân tích từ vựng tiếng Việt CHUẨN XÁC, DỄ HIỂU NHẤT dành cho người học tiếng Việt (người nước ngoài có ngôn ngữ mẹ đẻ là "${nativeName}") đối với từ/cụm từ: "${cleanWord}".

LƯU Ý QUAN TRỌNG VỀ ĐẶC THÙ TIẾNG VIỆT:
- Tiếng Việt KHÔNG CÓ PHIÊN ÂM IPA như tiếng Anh. Tuyệt đối để "phonetic": null.

YÊU CẦU BIÊN SOẠN CHUẨN XÁC:
1. "phonetic": null (Tuyệt đối không điền IPA).
2. "meaning_vi": Giải thích nghĩa bằng tiếng Việt đơn giản, súc tích, tự nhiên, dễ hiểu.
3. "meaning_en": Bản dịch nghĩa chuẩn xác, dễ hiểu bằng ${nativeLang === 'ru' ? 'tiếng Nga (kèm tiếng Anh)' : 'tiếng Anh'}.
4. "part_of_speech": Từ loại chuẩn tiếng Việt (chọn 1 trong: noun, verb, adjective, adverb, classifier, phrase, idiom). Với các từ chỉ loại như "con, cái, chiếc, bức, ngôi, quyển...", hãy chọn "classifier".
5. "collocations": 3-4 cụm từ / collocation tự nhiên đi kèm với từ này (MỖI CỤM KÈM NGHĨA DỊCH TRONG NGOẶC).
6. "examples": Đúng 2 câu ví dụ thực tế tiếng Việt (MỖI CÂU KÈM BẢN DỊCH NGHĨA TRONG NGOẶC).
7. "level": Đánh giá cấp độ chuẩn Khung VSL (A1: Bậc 1, A2: Bậc 2, B1: Bậc 3, B2: Bậc 4, C1: Bậc 5, C2: Bậc 6).
8. "topic_id": Hãy chọn ĐÚNG 1 mã "id" chủ đề phù hợp nhất:
${topicListPrompt}

Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json ngoài JSON):
{
  "word": "${cleanWord}",
  "phonetic": null,
  "part_of_speech": "verb",
  "meaning_vi": "Giải thích tiếng Việt ngắn gọn, dễ nhớ",
  "meaning_en": "Accurate definition in learner's language",
  "collocations": [
    "cụm 1 (nghĩa)",
    "cụm 2 (nghĩa)"
  ],
  "examples": [
    "Câu ví dụ tiếng Việt 1. (Bản dịch nghĩa 1.)",
    "Câu ví dụ tiếng Việt 2. (Bản dịch nghĩa 2.)"
  ],
  "level": "A1",
  "topic_id": "daily"
}
`.trim();
      } else {
        prompt = `
Bạn là một Chuyên gia Khảo thí Ngôn ngữ Học thuật Quốc tế và Từ điển học Tiếng Anh cao cấp (theo chuẩn Cambridge & Oxford Advanced Learner's Dictionary).
Hãy biên soạn phân tích từ vựng CHUẨN MỰC, DỄ HIỂU NHẤT dành cho người học tiếng Anh đối với từ/cụm từ: "${lowerWord}".

YÊU CẦU BIÊN SOẠN CHUẨN XÁC:
1. "meaning_vi": Nghĩa tiếng Việt PHẢI chuẩn xác, súc tích, tự nhiên, truyền tải đúng sắc thái cốt lõi của từ (kèm giải thích ngắn trong ngoặc nếu cần làm rõ ngữ cảnh). KHÔNG dịch máy thô sơ.
2. "meaning_en": Định nghĩa bằng tiếng Anh súc tích, dễ hiểu theo phong cách Oxford/Cambridge Learner (dùng từ vựng giải thích đơn giản, rõ ràng).
3. "phonetic": Phiên âm chuẩn quốc tế IPA (Anh - Mỹ) có đánh dấu trọng âm chuẩn (ví dụ: /ˈæp.əl/ hoặc /rɪˈzɪl.i.ənt/).
4. "part_of_speech": Từ loại chuẩn (chỉ chọn 1 trong: noun, verb, adjective, adverb, phrasal_verb, idiom, phrase).
5. "collocations": 3-4 cụm từ / collocation tự nhiên, phổ biến nhất đi kèm với từ này. MỖI CỤM PHẢI KÈM NGHĨA TIẾNG VIỆT TRONG NGOẶC (Ví dụ: "resilient mindset (tư duy kiên cường)").
6. "examples": Đúng 2 câu ví dụ thực tế trong đời sống/công việc/học thuật. MỖI CÂU VÍ DỤ PHẢI KÈM BẢN DỊCH TIẾNG VIỆT TỰ NHIÊN TRONG NGOẶC ĐƠN (Ví dụ: "She gave a lucid explanation. (Cô ấy đã đưa ra một lời giải thích sáng rõ.)").
7. "level": Đánh giá cấp độ CEFR chuẩn xác (A1, A2, B1, B2, C1, hoặc C2).
8. "topic_id": Hãy chọn ĐÚNG 1 mã "id" chủ đề phù hợp nhất trong danh sách các chủ đề của hệ thống dưới đây:
${topicListPrompt}

Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json ngoài JSON):
{
  "word": "${lowerWord}",
  "phonetic": "/.../",
  "part_of_speech": "noun/verb/adjective/adverb/phrasal_verb",
  "meaning_vi": "Nghĩa tiếng Việt chuẩn, tự nhiên và dễ nhớ",
  "meaning_en": "Clear and learner-friendly English definition",
  "collocations": [
    "cụm 1 (nghĩa tiếng Việt)",
    "cụm 2 (nghĩa tiếng Việt)",
    "cụm 3 (nghĩa tiếng Việt)"
  ],
  "examples": [
    "English sentence 1. (Dịch nghĩa tiếng Việt 1.)",
    "English sentence 2. (Dịch nghĩa tiếng Việt 2.)"
  ],
  "level": "B2",
  "topic_id": "work"
}
`.trim();
      }

      const aiResponse = await callGemini(prompt, geminiKey);
      const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const aiData = JSON.parse(cleaned);

      // Fetch audio URL: TTS proxy for Vietnamese, or Dictionary API for English
      let audioUrl = '';
      if (isTargetVi) {
        audioUrl = `/api/audio/tts?text=${encodeURIComponent(cleanWord)}&lang=vi-VN`;
      } else {
        try {
          const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lowerWord)}`);
          if (dictRes.ok) {
            const dictData = await dictRes.json();
            if (Array.isArray(dictData) && dictData[0]?.phonetics) {
              for (const p of dictData[0].phonetics) {
                if (p.audio && p.audio.trim()) {
                  audioUrl = p.audio.startsWith('//') ? `https:${p.audio}` : p.audio;
                  if (p.audio.includes('-us.mp3') || p.audio.includes('-uk.mp3')) {
                    break;
                  }
                }
              }
            }
          }
        } catch (e) {}
      }

      return {
        ...aiData,
        audio_url: audioUrl || (isTargetVi ? `/api/audio/tts?text=${encodeURIComponent(cleanWord)}&lang=vi-VN` : ''),
        topic_id: aiData.topic_id || inferTopic(aiData.word, aiData.part_of_speech, aiData.meaning_vi)
      };
    } catch (err) {
      console.warn('⚠️ Gemini AI lookup fallback to dictionary:', err.message);
    }
  }

  // 4. Robust Fallback (Free Dictionary API + Smart Translation + Authentic Contextual Synthesis)
  let phonetic = '';
  let audioUrl = '';
  let partOfSpeech = 'noun';
  let meaningEn = '';
  let examples = [];
  let collocations = [];
  let meaningVi = '';

  try {
    const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`;
    const dictRes = await fetch(dictUrl);
    if (dictRes.ok) {
      const dictData = await dictRes.json();
      if (Array.isArray(dictData) && dictData.length > 0) {
        const entry = dictData[0];
        phonetic = entry.phonetic || '';

        if (entry.phonetics && Array.isArray(entry.phonetics)) {
          for (const p of entry.phonetics) {
            if (!phonetic && p.text) phonetic = p.text;
            if (p.audio && p.audio.trim()) {
              audioUrl = p.audio.startsWith('//') ? `https:${p.audio}` : p.audio;
              if (p.audio.includes('-us.mp3') || p.audio.includes('-uk.mp3')) {
                break;
              }
            }
          }
        }

        if (entry.meanings && Array.isArray(entry.meanings)) {
          if (entry.meanings.length > 0) {
            partOfSpeech = entry.meanings[0].partOfSpeech || 'noun';
          }

          for (const m of entry.meanings) {
            if (m.definitions && Array.isArray(m.definitions)) {
              for (const def of m.definitions) {
                if (!meaningEn && def.definition) {
                  meaningEn = def.definition;
                }
                if (def.example && def.example.trim() && examples.length < 2) {
                  examples.push(def.example.trim());
                }
              }
            }
            if (m.synonyms && Array.isArray(m.synonyms) && collocations.length < 3) {
              m.synonyms.slice(0, 3).forEach(s => {
                const phrase = `${cleanWord} and ${s}`;
                if (!collocations.includes(phrase)) collocations.push(phrase);
              });
            }
          }
        }
      }
    }
  } catch (e) {}

  // Secondary Fallback: Use Datamuse API for IPA pronunciation & English definitions if needed
  if (!phonetic || !meaningEn) {
    try {
      const dmRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&qe=sp&md=dprf&ipa=1`);
      if (dmRes.ok) {
        const dmData = await dmRes.json();
        if (Array.isArray(dmData) && dmData.length > 0) {
          const item = dmData[0];
          if (!phonetic && item.tags) {
            const ipaTag = item.tags.find(t => t.startsWith('ipa_pron:'));
            if (ipaTag) phonetic = `/${ipaTag.replace('ipa_pron:', '')}/`;
          }
          if (partOfSpeech === 'noun' && item.tags) {
            if (item.tags.includes('v') && !item.tags.includes('n')) partOfSpeech = 'verb';
            else if (item.tags.includes('adj')) partOfSpeech = 'adjective';
            else if (item.tags.includes('adv')) partOfSpeech = 'adverb';
          }
          if (!meaningEn && item.defs && item.defs.length > 0) {
            const firstDef = item.defs[0].replace(/^[a-z]+\t/, '').trim();
            if (firstDef) meaningEn = firstDef;
          }
        }
      }
    } catch (e) {}
  }

  // Fetch Vietnamese translation via Google GTX or MyMemory
  try {
    const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanWord)}`;
    const transRes = await fetch(transUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (transRes.ok) {
      const transData = await transRes.json();
      if (transData && transData[0] && transData[0][0] && transData[0][0][0]) {
        meaningVi = transData[0][0][0];
      }
    }
  } catch (e) {}

  if (!meaningVi) {
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`;
      const mmRes = await fetch(myMemoryUrl);
      if (mmRes.ok) {
        const mmData = await mmRes.json();
        if (mmData?.responseData?.translatedText) {
          meaningVi = mmData.responseData.translatedText;
        }
      }
    } catch (e) {}
  }

  // Translate example sentences to Vietnamese if present
  const formattedExamples = [];
  if (examples.length > 0) {
    for (const ex of examples) {
      try {
        const transUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(ex)}`;
        const transRes = await fetch(transUrl);
        if (transRes.ok) {
          const transData = await transRes.json();
          const transVi = transData?.[0]?.[0]?.[0] || '';
          if (transVi) {
            formattedExamples.push(`${ex} (${transVi})`);
            continue;
          }
        }
      } catch (e) {}
      formattedExamples.push(ex);
    }
  } else {
    // Generate clean grammatical example matching part of speech
    if (partOfSpeech === 'verb') {
      formattedExamples.push(`They decided to ${cleanWord} the whole project. (Họ quyết định thực hiện ${cleanWord} toàn bộ dự án.)`);
      formattedExamples.push(`Learning how to ${cleanWord} effectively takes practice. (Học cách ${cleanWord} hiệu quả đòi hỏi sự luyện tập.)`);
    } else if (partOfSpeech === 'adjective') {
      formattedExamples.push(`The presentation was very ${cleanWord} and clear. (Bài thuyết trình rất ${cleanWord} và rõ ràng.)`);
      formattedExamples.push(`He maintained a ${cleanWord} attitude throughout the day. (Anh ấy giữ một thái độ ${cleanWord} suốt cả ngày.)`);
    } else {
      formattedExamples.push(`The concept of ${cleanWord} is frequently discussed in literature and law. (Khái niệm ${cleanWord} thường được thảo luận trong văn học và pháp luật.)`);
      formattedExamples.push(`Understanding ${cleanWord} helps avoid misunderstandings in formal texts. (Hiểu rõ nghĩa của ${cleanWord} giúp tránh nhầm lẫn trong các văn bản trang trọng.)`);
    }
  }

  // Realistic CEFR Level Estimation based on vocabulary complexity
  let level = 'B1';
  const a1Words = ['apple', 'book', 'car', 'dog', 'eat', 'friend', 'good', 'happy', 'house', 'water', 'time', 'work', 'day', 'man', 'life'];
  const a2Words = ['travel', 'simple', 'decide', 'family', 'future', 'health', 'money', 'reason', 'season', 'weather', 'information'];
  const c1Words = ['meticulous', 'articulate', 'pragmatic', 'ubiquitous', 'lucid', 'scrutiny', 'paradigm', 'ephemeral', 'cogent', 'esoteric'];

  if (a1Words.includes(cleanWord)) level = 'A1';
  else if (a2Words.includes(cleanWord)) level = 'A2';
  else if (c1Words.includes(cleanWord) || cleanWord.endsWith('tion') && cleanWord.length > 10 || cleanWord.endsWith('ous') || cleanWord.endsWith('ic')) level = 'B2';
  if (cleanWord.length >= 11) level = 'C1';

  const finalMeaningVi = meaningVi ? (meaningVi.charAt(0).toUpperCase() + meaningVi.slice(1)) : 'Tra cứu thêm để cập nhật nghĩa';
  const inferredTopic = inferTopic(cleanWord, partOfSpeech, finalMeaningVi);

  return {
    word: cleanWord,
    phonetic: isTargetVi ? null : (phonetic || `/${cleanWord}/`),
    tone: null,
    sino_vietnamese: null,
    audio_url: audioUrl,
    part_of_speech: partOfSpeech,
    meaning_vi: finalMeaningVi,
    meaning_en: meaningEn || `Definition and common usage of ${cleanWord}`,
    examples: formattedExamples.slice(0, 2),
    collocations: collocations.length > 0 ? collocations : [`use ${cleanWord}`, `apply ${cleanWord}`],
    level,
    topic_id: inferredTopic
  };
}
