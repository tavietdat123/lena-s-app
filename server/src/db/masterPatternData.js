/**
 * Master Communicative Sentence Pattern Taxonomy & Curated Formulas
 * 24 Functional Categories & 80+ Standard Communicative Patterns
 */

export const MASTER_PATTERN_CATEGORIES = [
  {
    id: 'cause_effect',
    name: 'Nguyên nhân & Hệ quả',
    emoji: '⚡',
    color: '#f59e0b',
    description: 'Diễn giải nguyên nhân, căn nguyên, hệ quả và mối quan hệ nhân quả (Due to, Lead to, As a result, Attribute to)'
  },
  {
    id: 'purpose',
    name: 'Mục đích & Dự định',
    emoji: '🎯',
    color: '#10b981',
    description: 'Chỉ rõ mục đích hướng đến, dự định tương lai và hành động có chủ đích (In order that, With a view to, So as to)'
  },
  {
    id: 'condition',
    name: 'Điều kiện & Giả định',
    emoji: '⚠️',
    color: '#eab308',
    description: 'Giả định tình huống, câu điều kiện đảo ngữ, thể giả định thức cấp bách (Provided that, Unless, Had it not been for)'
  },
  {
    id: 'concession',
    name: 'Nhượng bộ & Đối lập',
    emoji: '⚖️',
    color: '#3b82f6',
    description: 'Nêu sự tương phản bất chấp trở ngại hoặc điều kiện nghịch cảnh (Although, Despite, In spite of, Regardless of)'
  },
  {
    id: 'comparison',
    name: 'So sánh & Đối chiếu',
    emoji: '🔍',
    color: '#06b6d4',
    description: 'So sánh tương quan, mức độ, cấu trúc càng... càng (The more... the more, In contrast to, Far superior to)'
  },
  {
    id: 'exception',
    name: 'Ngoại lệ & Giới hạn',
    emoji: '🚫',
    color: '#ef4444',
    description: 'Loại trừ, giới hạn phạm vi hoặc chỉ định ngoại lệ cụ thể (Except for, With the exception of, Insofar as)'
  },
  {
    id: 'emphasis',
    name: 'Nhấn mạnh & Đảo ngữ',
    emoji: '💥',
    color: '#8b5cf6',
    description: 'Đảo ngữ trợ động từ, câu chẻ nhấn mạnh hành động hoặc đối tượng (Not only... but also, It is... that, Only by)'
  },
  {
    id: 'advice',
    name: 'Khuyên bảo & Thúc giục',
    emoji: '⏰',
    color: '#ec4899',
    description: 'Nhắc nhở, khuyên can cấp thiết hoặc nhấn mạnh đã đến lúc hành động (It is high time, It is advisable that)'
  },
  {
    id: 'speculation',
    name: 'Phỏng đoán & Khả năng',
    emoji: '🔮',
    color: '#a855f7',
    description: 'Đánh giá xác suất, phỏng đoán quá khứ hoặc khả năng xảy ra (It is likely that, Bound to, High probability of)'
  },
  {
    id: 'opinion',
    name: 'Khẳng định Quan điểm',
    emoji: '💬',
    color: '#0ea5e9',
    description: 'Khẳng định lập trường, nêu chính kiến và sự thật hiển nhiên (From my perspective, It is argued that, There is no denying)'
  },
  {
    id: 'addition',
    name: 'Bổ sung & Phát triển ý',
    emoji: '➕',
    color: '#14b8a6',
    description: 'Thêm thông tin hỗ trợ, phát triển luận cứ và mở rộng ý tưởng (Furthermore, In addition to, Not to mention, Coupled with)'
  },
  {
    id: 'example',
    name: 'Ví dụ & Minh họa',
    emoji: '💡',
    color: '#f97316',
    description: 'Đưa ra dẫn chứng thực tế, số liệu hoặc trường hợp minh họa cụ thể (For instance, Such as, To illustrate this point)'
  },
  {
    id: 'clarification',
    name: 'Làm rõ & Diễn giải lại',
    emoji: '✨',
    color: '#6366f1',
    description: 'Giải thích chi tiết hơn, diễn đạt lại bằng từ ngữ dễ hiểu (In other words, That is to say, Namely, To put it simply)'
  },
  {
    id: 'transition',
    name: 'Chuyển ý & Dẫn dắt',
    emoji: '🔄',
    color: '#64748b',
    description: 'Chuyển sang luận điểm mới, mở rộng phạm vi chủ đề (Moving on to, In terms of, Regarding, As far as ... is concerned)'
  },
  {
    id: 'sequence',
    name: 'Thời gian & Trình tự',
    emoji: '⏳',
    color: '#d97706',
    description: 'Chuỗi sự kiện kế tiếp, mốc thời gian và hành động tức thì (No sooner... than, Prior to, In the meantime, Following)'
  },
  {
    id: 'conclusion',
    name: 'Tóm tắt & Kết luận',
    emoji: '🏁',
    color: '#059669',
    description: 'Tóm lược các ý chính, đưa ra kết luận hoặc bài học tổng thể (In conclusion, To sum up, All things considered, Ultimately)'
  },
  {
    id: 'request',
    name: 'Yêu cầu & Đề nghị lịch sự',
    emoji: '🤝',
    color: '#2563eb',
    description: 'Đề nghị lịch sự, phản biện ngoại giao trong công việc (Would you mind, I would appreciate it if, With all due respect)'
  },
  {
    id: 'definition',
    name: 'Định nghĩa & Khái niệm',
    emoji: '📖',
    color: '#7c3aed',
    description: 'Định nghĩa thuật ngữ, giải thích bản chất khái niệm (Is defined as, Refers to, Constitutes, Characterized by)'
  },
  {
    id: 'counter_argument',
    name: 'Phản bác & Phản đề',
    emoji: '🛡️',
    color: '#e11d48',
    description: 'Bác bỏ lập luận đối phương, vạch ra thiếu sót và đưa ra lý lẽ phản biện (Contrary to popular belief, It is misleading to claim, While it is often argued that)'
  },
  {
    id: 'agreement',
    name: 'Đồng thuận & Tán thành',
    emoji: '✅',
    color: '#10b981',
    description: 'Bày tỏ sự đồng tình hoàn toàn hoặc một phần với luận điểm (I am in full agreement with, There is widespread consensus, Echoes the viewpoint)'
  },
  {
    id: 'disagreement',
    name: 'Bất đồng & Nghi vấn',
    emoji: '❌',
    color: '#f43f5e',
    description: 'Thể hiện sự không đồng ý một cách khéo léo hoặc trực tiếp (I respectfully beg to differ, That is not necessarily the case, Cast doubt on)'
  },
  {
    id: 'problem_solution',
    name: 'Vấn đề & Giải pháp',
    emoji: '🛠️',
    color: '#0284c7',
    description: 'Nêu thực trạng nan giải và đề xuất phương án xử lý, khắc phục (A viable solution lies in, Urgent measures must be taken, To mitigate the impact)'
  },
  {
    id: 'evaluation',
    name: 'Đánh giá & Tầm quan trọng',
    emoji: '🌟',
    color: '#8b5cf6',
    description: 'Đánh giá tính hiệu quả, tầm quan trọng hoặc mức độ tác động (Plays a pivotal role in, Is of paramount importance, Profound implications)'
  },
  {
    id: 'degree_extent',
    name: 'Mức độ & Phạm vi',
    emoji: '📏',
    color: '#0d9488',
    description: 'Chỉ rõ mức độ ảnh hưởng, biên độ hoặc phạm vi áp dụng (To a significant extent, Far outweighs, In large measure due to)'
  }
];

export const MASTER_PATTERNS = [
  // ================= 1. NGUYÊN NHÂN & HỆ QUẢ (cause_effect) =================
  {
    id: 'pat_ce_01',
    name: 'Due to the fact that',
    formula: 'Due to the fact that + [Clause], [Main Clause]',
    meaning_vi: 'Do thực tế là..., Bởi vì sự thật là...',
    explanation: 'Dùng trong văn phong học thuật hoặc trang trọng để giải thích nguyên nhân một cách khách quan dựa trên sự thật đã được kiểm chứng.',
    category: 'cause_effect',
    tone: 'Formal / Academic',
    examples: [
      'Due to the fact that customer traffic increased tenfold, we scaled our cloud infrastructure immediately.',
      'Due to the fact that automation reduced operational costs, the company reported record profits.'
    ],
    tags: ['Academic', 'Writing', 'IELTS 7.0+']
  },
  {
    id: 'pat_ce_02',
    name: 'Stem from / Rooted in',
    formula: '[Problem / Phenomenon] + stems from / is deeply rooted in + [Noun / V-ing]',
    meaning_vi: 'Bắt nguồn từ..., Có căn nguyên sâu xa từ...',
    explanation: 'Chỉ ra nguồn gốc cốt lõi gây ra vấn đề hoặc hiện tượng xã hội, kỹ thuật.',
    category: 'cause_effect',
    tone: 'Formal',
    examples: [
      'Most software regressions stem from inadequate unit test coverage during fast sprints.',
      'His reluctance to speak English in public is deeply rooted in fear of making grammar mistakes.'
    ],
    tags: ['Tech', 'Psychology', 'Speaking']
  },
  {
    id: 'pat_ce_03',
    name: 'Give rise to / Trigger',
    formula: '[Action / Catalyst] + gave rise to / triggered + [Noun Phrase]',
    meaning_vi: 'Làm dấy lên..., Dẫn đến sự xuất hiện của...',
    explanation: 'Dùng khi một sự kiện hoặc phát kiến châm ngòi dẫn tới một chuỗi phản ứng hoặc phong trào lớn.',
    category: 'cause_effect',
    tone: 'Academic',
    examples: [
      'The sudden release of ChatGPT gave rise to intense competition in generative artificial intelligence.',
      'Rapid urbanization without adequate planning has given rise to severe traffic congestion in metropolitan areas.'
    ],
    tags: ['AI', 'Society', 'Essay']
  },
  {
    id: 'pat_ce_04',
    name: 'On the grounds that',
    formula: '[Main Clause] + on the grounds that + [Clause]',
    meaning_vi: 'Với lý do là..., Căn cứ trên cơ sở rằng...',
    explanation: 'Cấu trúc pháp lý hoặc công sở trang trọng để biện minh cho một quyết định, phê chuẩn hoặc bác bỏ.',
    category: 'cause_effect',
    tone: 'Formal / Legal',
    examples: [
      'The board rejected the merger proposal on the grounds that regulatory compliance risks were unacceptable.',
      'The security team revoked the developer API token on the grounds that unusual login spikes were detected.'
    ],
    tags: ['Business', 'Legal', 'Work']
  },

  // ================= 2. MỤC ĐÍCH & DỰ ĐỊNH (purpose) =================
  {
    id: 'pat_pur_01',
    name: 'With a view to + V-ing',
    formula: '[Subject] + [Verb] + with a view to + [V-ing / Noun Phrase]',
    meaning_vi: 'Với mục tiêu / nhằm mục đích làm việc gì trong tương lai...',
    explanation: 'Cấu trúc rất cao cấp trong IELTS Writing & Business Proposal để thể hiện chủ đích chiến lược dài hạn. Chú ý sau "with a view to" luôn là động từ dạng V-ing.',
    category: 'purpose',
    tone: 'Formal / Business',
    examples: [
      'We redesigned the entire onboarding workflow with a view to minimizing user churn within the first week.',
      'The government invested heavily in renewable energy with a view to achieving net-zero emissions by 2040.'
    ],
    tags: ['IELTS', 'Business', 'Strategy']
  },
  {
    id: 'pat_pur_02',
    name: 'In an effort to / In an attempt to',
    formula: 'In an effort to + [V-inf], [Subject] + [Verb]',
    meaning_vi: 'Trong nỗ lực / nhằm nỗ lực làm gì...',
    explanation: 'Thường đứng đầu câu để nhấn mạnh ý chí và hành động quyết liệt vượt qua thách thức.',
    category: 'purpose',
    tone: 'Professional',
    examples: [
      'In an effort to accelerate build times, the engineering team migrated the codebase to Vite and TurboPack.',
      'In an attempt to master conversational English, he dedicated 45 minutes every morning to shadowing audio clips.'
    ],
    tags: ['Productivity', 'Tech', 'Work']
  },
  {
    id: 'pat_pur_03',
    name: 'So that / In order that',
    formula: '[Action Clause] + so that / in order that + [Subject] + can/may/might + [V-inf]',
    meaning_vi: 'Để mà, cốt để cho ai đó có thể làm gì...',
    explanation: 'Mệnh đề chỉ mục đích chỉ rõ kết quả kỳ vọng mà người thực hiện hướng tới.',
    category: 'purpose',
    tone: 'Neutral',
    examples: [
      'Engineers cache database queries in Redis so that response latency remains below 50 milliseconds.',
      'Please document all edge cases thoroughly in order that junior developers may onboard smoothly.'
    ],
    tags: ['Daily', 'Engineering', 'Work']
  },

  // ================= 3. ĐIỀU KIỆN & GIẢ ĐỊNH (condition) =================
  {
    id: 'pat_cond_01',
    name: 'Had it not been for (Đảo ngữ ĐK 3)',
    formula: 'Had it not been for + [Noun Phrase], [Subject] + would/could have + [V3/ed]',
    meaning_vi: 'Nếu không vì / Nếu không có..., thì đã...',
    explanation: 'Cấu trúc đảo ngữ điều kiện loại 3 dùng để diễn đạt sự biết ơn hoặc giả định về một yếu tố quyết định cứu vãn tình thế trong quá khứ.',
    category: 'condition',
    tone: 'Formal / Advanced',
    examples: [
      'Had it not been for your prompt code review, that critical vulnerability would have been deployed to production.',
      'Had it not been for her persistent mentorship, he would never have attained his IELTS 8.0 certificate.'
    ],
    tags: ['IELTS 8.0+', 'Grammar', 'Speaking']
  },
  {
    id: 'pat_cond_02',
    name: 'Provided that / Providing that',
    formula: '[Main Clause] + provided that / as long as + [Clause: Present Simple]',
    meaning_vi: 'Miễn là, với điều kiện là...',
    explanation: 'Tương đương với "If" nhưng mang tính ràng buộc điều kiện và điều khoản hợp đồng/thỏa thuận rõ rệt hơn.',
    category: 'condition',
    tone: 'Formal / Contract',
    examples: [
      'Employees are permitted to work remotely full-time, provided that all sprint deadlines and quality metrics are met.',
      'You can easily master 1,000 new technical words, provided that you review with spaced repetition consistently.'
    ],
    tags: ['Contract', 'Learning', 'Work']
  },
  {
    id: 'pat_cond_03',
    name: 'Unless otherwise specified',
    formula: 'Unless otherwise specified / stated, [Main Clause]',
    meaning_vi: 'Trừ khi có quy định hoặc hướng dẫn cụ thể khác...',
    explanation: 'Cụm từ tiêu chuẩn vàng trong tài liệu kỹ thuật, thỏa thuận dịch vụ (SLA) và hợp đồng.',
    category: 'condition',
    tone: 'Professional',
    examples: [
      'Unless otherwise specified, all API endpoints require an active Bearer JWT token in the authorization header.',
      'Unless otherwise stated, all weekly team sync meetings take place on Google Meet every Monday at 9:00 AM.'
    ],
    tags: ['API', 'Documentation', 'Policy']
  },

  // ================= 4. NHƯỢNG BỘ & ĐỐI LẬP (concession) =================
  {
    id: 'pat_conc_01',
    name: 'Notwithstanding + Noun Phrase',
    formula: 'Notwithstanding + [Noun Phrase / the fact that Clause], [Main Clause]',
    meaning_vi: 'Mặc dù, bất chấp việc...',
    explanation: 'Từ nối nhượng bộ trang trọng bậc nhất trong văn viết báo cáo, học thuật hoặc thỏa thuận pháp lý (tương tự Despite nhưng học thuật hơn).',
    category: 'concession',
    tone: 'Academic / Legal',
    examples: [
      'Notwithstanding initial macroeconomic headwinds, the tech startup achieved profitability within 18 months.',
      'Notwithstanding the complexity of the distributed database architecture, the user interface remains delightfully simple.'
    ],
    tags: ['Academic', 'IELTS 8.0+', 'Essay']
  },
  {
    id: 'pat_conc_02',
    name: 'Adj/Adv + as/though + S + Verb',
    formula: '[Adjective / Adverb] + as / though + [Subject] + may be / appear, [Main Clause]',
    meaning_vi: 'Dù cho có... đến thế nào đi chăng nữa, thì...',
    explanation: 'Đảo tính từ lên đầu câu để nhấn mạnh mức độ thử thách hoặc tính chất đối lập trước khi nêu kết quả.',
    category: 'concession',
    tone: 'Advanced / Literary',
    examples: [
      'Difficult as English pronunciation may seem initially, steady phonetics practice will unlock natural fluency.',
      'Lucrative though the offer appeared, she chose to stay with her mission-driven open-source project.'
    ],
    tags: ['Inversion', 'Writing', 'Stylistic']
  },
  {
    id: 'pat_conc_03',
    name: 'Be that as it may',
    formula: '[Statement 1]. Be that as it may, [Counter-balancing Statement]',
    meaning_vi: 'Dẫu biết là như vậy..., Cho dù thế nào đi nữa...',
    explanation: 'Cụm thành ngữ chuyển ý đối lập dùng khi thừa nhận lập luận của đối phương nhưng vẫn kiên định với giải pháp của mình.',
    category: 'concession',
    tone: 'Diplomatic / Formal',
    examples: [
      'Implementing automated testing requires high initial effort. Be that as it may, the long-term stability is priceless.',
      'Upgrading legacy servers incurs temporary downtime. Be that as it may, security vulnerabilities cannot be ignored.'
    ],
    tags: ['Meeting', 'Debate', 'Speaking']
  },

  // ================= 5. SO SÁNH & ĐỐI CHIẾU (comparison) =================
  {
    id: 'pat_comp_01',
    name: 'The more..., the more... (Càng... càng...)',
    formula: 'The + [Comparative Adj/Adv] + [S + V], the + [Comparative Adj/Adv] + [S + V]',
    meaning_vi: 'Càng... thì lại càng...',
    explanation: 'Cấu trúc so sánh kép tương quan tỉ lệ thuận/nghịch cực kỳ mạnh mẽ để biểu thị mối liên hệ trực tiếp giữa hai đại lượng.',
    category: 'comparison',
    tone: 'Versatile',
    examples: [
      'The more frequently you retrieve vocabulary from active memory, the stronger your brain synapses become.',
      'The more modular your software architecture is, the easier it becomes to deploy independent microservices.'
    ],
    tags: ['Daily', 'Productivity', 'Grammar']
  },
  {
    id: 'pat_comp_02',
    name: 'In stark contrast to',
    formula: 'In stark contrast to + [Noun Phrase], [Main Clause]',
    meaning_vi: 'Trái ngược hoàn toàn với..., Khác hẳn với...',
    explanation: 'Dùng khi muốn vẽ nên bức tranh đối lập 180 độ giữa hai phương pháp, thế hệ hoặc sản phẩm.',
    category: 'comparison',
    tone: 'Formal / Analytical',
    examples: [
      'In stark contrast to traditional monolithic systems, our event-driven architecture handles high traffic smoothly.',
      'In stark contrast to rote memorization, contextual language learning leads to long-lasting retention.'
    ],
    tags: ['Tech', 'Analysis', 'Essay']
  },
  {
    id: 'pat_comp_03',
    name: 'Pales in comparison with',
    formula: '[Subject] + pales in comparison with / to + [Noun Phrase]',
    meaning_vi: 'Trở nên mờ nhạt / Không đáng kể khi đem so với...',
    explanation: 'Thành ngữ dùng để chỉ ra sự vượt trội áp đảo của một đối tượng so với đối tượng còn lại.',
    category: 'comparison',
    tone: 'Expressive',
    examples: [
      'The speed of traditional manual QA testing pales in comparison with automated parallel regression pipelines.',
      'The cost of software licensing pales in comparison with the potential losses caused by a severe data breach.'
    ],
    tags: ['Business', 'Comparison', 'IELTS']
  },

  // ================= 6. NGOẠI LỆ & GIỚI HẠN (exception) =================
  {
    id: 'pat_exc_01',
    name: 'With the exception of',
    formula: 'With the exception of + [Noun Phrase], [Main Clause]',
    meaning_vi: 'Ngoại trừ..., Trừ trường hợp...',
    explanation: 'Dùng để nêu ra một hoặc vài ngoại lệ duy nhất trong một tập hợp chung.',
    category: 'exception',
    tone: 'Professional / Formal',
    examples: [
      'With the exception of a brief scheduled maintenance window at midnight, our cloud services maintain 99.99% uptime.',
      'With the exception of sensitive API keys, the entire application source code is publicly accessible on GitHub.'
    ],
    tags: ['Tech', 'Policy', 'Writing']
  },
  {
    id: 'pat_exc_02',
    name: 'Barring any unforeseen circumstances',
    formula: 'Barring + [Noun Phrase: unexpected delays / circumstances], [Main Clause]',
    meaning_vi: 'Ngoại trừ nếu có sự cố ngoài dự kiến, Nếu không có gì bất thường...',
    explanation: 'Cụm từ kinh điển trong quản lý dự án (Project Management) và đàm phán hợp đồng để cam kết tiến độ có điều kiện.',
    category: 'exception',
    tone: 'Business / Agile',
    examples: [
      'Barring any unforeseen deployment blockers, the new mobile feature will roll out to all users this Friday.',
      'Barring unexpected weather conditions, the international flight will arrive precisely on schedule.'
    ],
    tags: ['Project', 'Sprint', 'Management']
  },
  {
    id: 'pat_exc_03',
    name: 'Insofar as ... is concerned',
    formula: 'Insofar as + [Subject / Dimension] + is concerned, [Clause]',
    meaning_vi: 'Trong chừng mực liên quan đến..., Xét riêng về mặt...',
    explanation: 'Giới hạn phạm vi xem xét của lập luận vào một khía cạnh cụ thể, tránh việc bị quy chụp toàn bộ.',
    category: 'exception',
    tone: 'Academic',
    examples: [
      'Insofar as memory consumption is concerned, native SQLite performs noticeably better than heavy ORMs.',
      'Insofar as personal privacy is concerned, users must retain absolute ownership over their exported data.'
    ],
    tags: ['Analysis', 'Debate', 'Precision']
  },

  // ================= 7. NHẤN MẠNH & ĐẢO NGỮ (emphasis) =================
  {
    id: 'pat_emph_01',
    name: 'Not only ... but also (Đảo ngữ)',
    formula: 'Not only + [Auxiliary Verb] + [Subject] + [Verb], but [Subject] also + [Verb]',
    meaning_vi: 'Không những... mà còn...',
    explanation: 'Đảo trợ động từ lên trước chủ ngữ ở vế đầu để tăng cường tính biểu cảm và sức nặng của thông điệp.',
    category: 'emphasis',
    tone: 'Advanced / Persuasive',
    examples: [
      'Not only does regular spaced review enhance vocabulary recall, but it also elevates your reading comprehension speed.',
      'Not only did the team ship the major release ahead of schedule, but they also fixed twenty legacy security bugs.'
    ],
    tags: ['Inversion', 'IELTS 7.5+', 'Writing']
  },
  {
    id: 'pat_emph_02',
    name: 'It is ... that (Câu chẻ Cleft sentence)',
    formula: 'It is / was + [Emphasized Subject / Object / Adverb] + that + [Remaining Sentence]',
    meaning_vi: 'Chính là... người/cái mà...',
    explanation: 'Tách câu thành hai vế để dồn toàn bộ sự chú ý của người đọc/nghe vào thành phần nằm giữa "It is" và "that".',
    category: 'emphasis',
    tone: 'Formal',
    examples: [
      'It is through disciplined daily deliberate practice that true linguistic fluency is forged.',
      'It was our comprehensive automated test suite that prevented the production outage yesterday.'
    ],
    tags: ['Cleft Sentence', 'Fluency', 'Emphasis']
  },
  {
    id: 'pat_emph_03',
    name: 'Only by + V-ing + Inversion',
    formula: 'Only by + [V-ing / Noun] + [Auxiliary: can / will / do] + [Subject] + [V-inf]',
    meaning_vi: 'Chỉ bằng cách... thì ai đó mới có thể...',
    explanation: 'Nhấn mạnh con đường hoặc phương tiện duy nhất để đạt được kết quả mong đợi.',
    category: 'emphasis',
    tone: 'Inspirational / Advanced',
    examples: [
      'Only by stepping outside your comfort zone and conversing with native speakers can you overcome hesitation.',
      'Only by decoupling business logic from external database adapters can software achieve true maintainability.'
    ],
    tags: ['Speaking', 'Tech', 'Inversion']
  },
  {
    id: 'pat_emph_04',
    name: 'Under no circumstances should',
    formula: 'Under no circumstances + should / must / can + [Subject] + [V-inf]',
    meaning_vi: 'Tuyệt đối trong bất kỳ hoàn cảnh nào cũng không được...',
    explanation: 'Mức độ cảnh báo cấm chỉ tuyệt đối, dùng trong an ninh mạng, quy chuẩn sản phẩm hoặc nguyên tắc đạo đức.',
    category: 'emphasis',
    tone: 'Formal / Directive',
    examples: [
      'Under no circumstances should production database credentials be committed into public Git repositories.',
      'Under no circumstances should users share their two-factor authentication recovery codes with strangers.'
    ],
    tags: ['Security', 'DevOps', 'Compliance']
  },

  // ================= 8. KHUYÊN BẢO & THÚC GIỤC (advice) =================
  {
    id: 'pat_adv_01',
    name: 'It is high time + S + V-past',
    formula: 'It is high time / about time + [Subject] + [Past Simple Verb]',
    meaning_vi: 'Đã đến lúc cấp bách phải làm gì (lẽ ra phải làm từ trước)...',
    explanation: 'Dùng thì quá khứ đơn (Past Subjunctive) sau "It is high time" để thể hiện tính cấp bách và thúc giục hành động ngay lập tức.',
    category: 'advice',
    tone: 'Persuasive / Urgent',
    examples: [
      'It is high time educational institutions embraced interactive AI tools to personalize language instruction.',
      'It is high time you retired your manual flashcards and switched to an intelligent algorithmic review system.'
    ],
    tags: ['Urgency', 'Subjunctive', 'Advice']
  },
  {
    id: 'pat_adv_02',
    name: 'It is advisable that + S + (should) + V-inf',
    formula: 'It is highly advisable that + [Subject] + (should) + [V-inf]',
    meaning_vi: 'Thiết nghĩ / Rất khuyến khích ai đó nên làm gì...',
    explanation: 'Thể giả định thức (Subjunctive) trang trọng, dùng động từ nguyên mẫu không chia cho mọi ngôi.',
    category: 'advice',
    tone: 'Professional / Consultation',
    examples: [
      'It is highly advisable that candidates familiarize themselves with common academic discourse markers before the exam.',
      'It is advisable that the server configuration be audited by an independent security specialist before public launch.'
    ],
    tags: ['Subjunctive', 'Consulting', 'Email']
  },
  {
    id: 'pat_adv_03',
    name: 'Would be well advised to',
    formula: '[Subject] + would be well advised to + [V-inf]',
    meaning_vi: 'Sẽ là một quyết định khôn ngoan nếu... nên làm gì...',
    explanation: 'Cách khuyên răn lịch thiệp, gián tiếp trong giao tiếp đối tác hoặc thư tư vấn chuyên gia.',
    category: 'advice',
    tone: 'Diplomatic / Professional',
    examples: [
      'Software developers would be well advised to deepen their understanding of prompt engineering principles.',
      'First-time investors would be well advised to diversify their assets rather than chasing speculative trends.'
    ],
    tags: ['Career', 'Investment', 'Diplomatic']
  },

  // ================= 9. PHỎNG ĐOÁN & KHẢ NĂNG (speculation) =================
  {
    id: 'pat_spec_01',
    name: 'It is highly likely that',
    formula: 'It is highly likely / improbable that + [Clause]',
    meaning_vi: 'Rất có khả năng là..., Gần như chắc chắn rằng...',
    explanation: 'Dùng trong dự báo xu hướng công nghệ, phân tích thị trường hoặc suy đoán có căn cứ vững chắc.',
    category: 'speculation',
    tone: 'Analytical',
    examples: [
      'It is highly likely that autonomous coding agents will augment daily developer workflows within the next two years.',
      'It is highly improbable that legacy monolithic software can withstand the throughput of modern streaming workloads.'
    ],
    tags: ['Forecasting', 'Tech', 'Essay']
  },
  {
    id: 'pat_spec_02',
    name: 'Be bound to + V-inf',
    formula: '[Subject] + is / are bound to + [V-inf]',
    meaning_vi: 'Chắc chắn sẽ xảy ra (tất yếu theo quy luật)...',
    explanation: 'Diễn tả một kết quả không thể tránh khỏi dựa trên kinh nghiệm hoặc quy luật tự nhiên.',
    category: 'speculation',
    tone: 'Conversational / Business',
    examples: [
      'If you review vocabulary with spaced repetition every day, your speaking confidence is bound to skyrocket.',
      'A system that lacks comprehensive error boundaries is bound to encounter unexpected production crashes.'
    ],
    tags: ['Confidence', 'Speaking', 'Mindset']
  },
  {
    id: 'pat_spec_03',
    name: 'Must have + V3/ed',
    formula: '[Subject] + must have + [Past Participle V3/ed]',
    meaning_vi: 'Chắc hẳn là đã... (suy đoán quá khứ gần như chắc chắn)',
    explanation: 'Dùng để đưa ra suy luận logic về một hành động trong quá khứ khi đã có bằng chứng rõ ràng trước mắt.',
    category: 'speculation',
    tone: 'Analytical / Daily',
    examples: [
      'The database query latency dropped from 400ms to 8ms; the developer must have added a compound index.',
      'She answered all advanced technical interview questions effortlessly; she must have prepared thoroughly.'
    ],
    tags: ['Grammar', 'Modal Verbs', 'Reasoning']
  },

  // ================= 10. KHẲNG ĐỊNH QUAN ĐIỂM (opinion) =================
  {
    id: 'pat_op_01',
    name: 'There is no denying that',
    formula: 'There is no denying that + [Clause]',
    meaning_vi: 'Không thể phủ nhận một sự thật rằng...',
    explanation: 'Khẳng định một chân lý hoặc một sự thật hiển nhiên được công nhận rộng rãi trước khi phát triển luận điểm.',
    category: 'opinion',
    tone: 'Formal / IELTS Writing',
    examples: [
      'There is no denying that English proficiency opens up unprecedented international career opportunities.',
      'There is no denying that artificial intelligence is reshaping the fundamental landscape of creative industries.'
    ],
    tags: ['IELTS', 'Opinion', 'Writing']
  },
  {
    id: 'pat_op_02',
    name: 'I am firmly of the opinion that',
    formula: 'I am firmly of the opinion that + [Clause]',
    meaning_vi: 'Tôi kiên định giữ vững quan điểm rằng...',
    explanation: 'Thay thế cực tốt cho cụm từ nhàm chán "I think / In my opinion" trong các bài thi IELTS Task 2 hoặc tranh biện.',
    category: 'opinion',
    tone: 'Academic / Debate',
    examples: [
      'I am firmly of the opinion that hands-on project building accelerates language learning faster than passive listening.',
      'I am firmly of the opinion that code readability should always take precedence over clever micro-optimizations.'
    ],
    tags: ['IELTS 8.0', 'Task 2', 'Persuasion']
  },
  {
    id: 'pat_op_03',
    name: 'It goes without saying that',
    formula: 'It goes without saying that + [Clause]',
    meaning_vi: 'Hiển nhiên là..., Rõ ràng ai cũng biết rằng...',
    explanation: 'Dùng khi muốn nêu ra một nguyên tắc cơ bản mà không cần phải giải thích dông dài.',
    category: 'opinion',
    tone: 'Conversational / Business',
    examples: [
      'It goes without saying that data privacy and encryption are non-negotiable for medical applications.',
      'It goes without saying that hard work paired with intelligent spaced repetition yields exceptional results.'
    ],
    tags: ['Expression', 'Daily', 'Fluency']
  },

  // ================= 11. BỔ SUNG & PHÁT TRIỂN Ý (addition) =================
  {
    id: 'pat_add_01',
    name: 'Not to mention',
    formula: '[Main Statement], not to mention + [Noun Phrase / V-ing]',
    meaning_vi: 'Chưa kể đến..., Huống hồ là...',
    explanation: 'Dùng để bổ sung thêm một yếu tố nặng ký làm tăng sức thuyết phục cho lập luận chính.',
    category: 'addition',
    tone: 'Versatile',
    examples: [
      'Microservices increase deployment complexity, not to mention the operational overhead of distributed tracing.',
      'Learning in small daily increments reduces mental burnout, not to mention strengthening long-term memory.'
    ],
    tags: ['Speaking', 'Writing', 'Flow']
  },
  {
    id: 'pat_add_02',
    name: 'Coupled with',
    formula: '[Factor 1], coupled with + [Factor 2], + [Verb: leads to / creates]',
    meaning_vi: 'Kết hợp cùng với..., Đi đôi với...',
    explanation: 'Mô tả hai tác nhân cộng hưởng cùng nhau để tạo ra một kết quả hoặc thay đổi to lớn.',
    category: 'addition',
    tone: 'Academic / Professional',
    examples: [
      'A rigorous spaced repetition algorithm, coupled with engaging audio examples, guarantees swift fluency.',
      'High network bandwidth, coupled with modern edge computing, enables real-time collaborative applications.'
    ],
    tags: ['Synthesis', 'Writing', 'Advanced']
  },
  {
    id: 'pat_add_03',
    name: 'In addition to + V-ing',
    formula: 'In addition to + [Noun Phrase / V-ing], [Main Clause]',
    meaning_vi: 'Bên cạnh việc..., Ngoài việc...',
    explanation: 'Đứng đầu câu để liệt kê thêm lợi ích hoặc chức năng mà không làm ngắt mạch văn.',
    category: 'addition',
    tone: 'Formal',
    examples: [
      'In addition to saving thousands of vocabulary items, LinguaVault provides AI-powered speech pronunciation grading.',
      'In addition to running unit tests, our CI pipeline automatically scans dependencies for open CVE vulnerabilities.'
    ],
    tags: ['Cohesion', 'Email', 'Presentation']
  },

  // ================= 12. VÍ DỤ & MINH HỌA (example) =================
  {
    id: 'pat_ex_01',
    name: 'To illustrate this point',
    formula: 'To illustrate this point, [Example / Case Study Clause]',
    meaning_vi: 'Để minh họa cụ thể cho điểm này,...',
    explanation: 'Lời dẫn dắt kinh điển trong thuyết trình hoặc viết luận trước khi đưa ra ví dụ thực tế hoặc số liệu.',
    category: 'example',
    tone: 'Academic / Presentation',
    examples: [
      'To illustrate this point, consider how flashcard users remember 80% more words after thirty days of active retrieval.',
      'To illustrate this point, let us examine how Netflix transitioned its architecture from physical datacenters to AWS.'
    ],
    tags: ['Presentation', 'Writing', 'Case Study']
  },
  {
    id: 'pat_ex_02',
    name: 'A case in point is',
    formula: 'A prime case in point is + [Noun Phrase / Sentence]',
    meaning_vi: 'Một ví dụ điển hình chứng minh là...',
    explanation: 'Nâng cấp từ "For example", mang sắc thái học thuật và phân tích chuyên sâu.',
    category: 'example',
    tone: 'Formal / Analytical',
    examples: [
      'A prime case in point is the rapid adoption of TypeScript across virtually all modern web application frameworks.',
      'A case in point is how spaced repetition transformed language acquisition for medical and law students.'
    ],
    tags: ['IELTS 7.5+', 'Essay', 'Evidence']
  },
  {
    id: 'pat_ex_03',
    name: 'Take ... as an example',
    formula: 'Take + [Case / Subject] + as an example: [Explanation]',
    meaning_vi: 'Hãy lấy... làm ví dụ:',
    explanation: 'Rất tự nhiên trong giao tiếp nói, hội thảo kỹ thuật hoặc bài viết blog chia sẻ kiến thức.',
    category: 'example',
    tone: 'Conversational / Technical',
    examples: [
      'Take SQLite as an example: despite its simplicity, it powers billions of mobile phones and edge devices globally.',
      'Take daily shadowing as an example: just ten minutes each morning dramatically sharpens your spoken intonation.'
    ],
    tags: ['Speaking', 'Tech', 'Simplicity']
  },

  // ================= 13. LÀM RÕ & DIỄN GIẢI LẠI (clarification) =================
  {
    id: 'pat_clar_01',
    name: 'In other words',
    formula: '[Complex Idea]. In other words, [Simplified / Clarified Statement]',
    meaning_vi: 'Nói một cách khác..., Diễn giải lại là...',
    explanation: 'Giúp người nghe/đọc hiểu ngay bản chất cốt lõi sau khi bạn vừa trình bày một thuật ngữ phức tạp.',
    category: 'clarification',
    tone: 'Educational / Versatile',
    examples: [
      'The algorithm utilizes an exponential decay interval. In other words, words you know well appear much less frequently.',
      'The function is idempotent. In other words, invoking it multiple times produces the exact same outcome without side effects.'
    ],
    tags: ['Communication', 'Explaining', 'Tech']
  },
  {
    id: 'pat_clar_02',
    name: 'That is to say',
    formula: '[Statement], that is to say, [Exact Specification]',
    meaning_vi: 'Tức là..., Điều đó đồng nghĩa với việc...',
    explanation: 'Dùng để làm rõ nghĩa chính xác của một mệnh đề nhằm tránh sự hiểu lầm hoặc đa nghĩa.',
    category: 'clarification',
    tone: 'Formal / Academic',
    examples: [
      'The company embraces an asynchronous work culture; that is to say, teammates communicate through written docs rather than impromptu meetings.',
      'The license is perpetual; that is to say, you retain rights to use the software indefinitely without monthly renewal.'
    ],
    tags: ['Clarity', 'Work', 'Policy']
  },
  {
    id: 'pat_clar_03',
    name: 'To put it simply',
    formula: 'To put it simply, [Straightforward Clause]',
    meaning_vi: 'Nói một cách đơn giản, Tóm lại một cách dễ hiểu...',
    explanation: 'Rất hữu ích khi thuyết trình cho đối tượng khán giả đại chúng hoặc người mới bắt đầu.',
    category: 'clarification',
    tone: 'Conversational',
    examples: [
      'To put it simply, machine learning is about finding statistical patterns in large volumes of historical data.',
      'To put it simply, spaced repetition ensures you review a word right at the moment you are about to forget it.'
    ],
    tags: ['Speaking', 'Teaching', 'Daily']
  },

  // ================= 14. CHUYỂN Ý & DẪN DẮT (transition) =================
  {
    id: 'pat_trans_01',
    name: 'As far as ... is concerned',
    formula: 'As far as + [Topic / Aspect] + is concerned, [Clause]',
    meaning_vi: 'Xét về khía cạnh..., Riêng đối với...',
    explanation: 'Chuyển hướng thảo luận sang một chủ đề hoặc đối tượng cụ thể một cách mạch lạc.',
    category: 'transition',
    tone: 'Professional / Speaking',
    examples: [
      'As far as runtime performance is concerned, native compiled languages consistently outperform interpreted scripts.',
      'As far as data portability is concerned, exporting your full backup as a readable JSON file is the gold standard.'
    ],
    tags: ['Speaking', 'Transition', 'IELTS']
  },
  {
    id: 'pat_trans_02',
    name: 'With regard to / In terms of',
    formula: 'With regard to + [Noun Phrase], [Main Clause]',
    meaning_vi: 'Liên quan đến..., Xét về mặt...',
    explanation: 'Cụm từ chuyển tiếp chuyên nghiệp hàng đầu trong email công việc và báo cáo dự án.',
    category: 'transition',
    tone: 'Business / Formal',
    examples: [
      'With regard to the upcoming product release, all core authentication features have successfully passed QA testing.',
      'In terms of user experience, single-click backup restoration eliminates hours of tedious manual data entry.'
    ],
    tags: ['Business', 'Email', 'Reporting']
  },
  {
    id: 'pat_trans_03',
    name: 'Turning now to the question of',
    formula: 'Turning now to the question of + [Noun / How to...], [Clause]',
    meaning_vi: 'Bây giờ xin chuyển sang vấn đề..., Quay trở lại câu hỏi...',
    explanation: 'Thích hợp cho phần chuyển giao giữa các phần trong bài thuyết trình hoặc cấu trúc bài luận nhiều đoạn.',
    category: 'transition',
    tone: 'Presentation / Academic',
    examples: [
      'Turning now to the question of long-term scalability, we must consider sharding our database across multiple regions.',
      'Turning now to the question of pronunciation accuracy, let us explore how real-time pitch feedback accelerates progress.'
    ],
    tags: ['Presentation', 'Structure', 'Speech']
  },

  // ================= 15. THỜI GIAN & TRÌNH TỰ (sequence) =================
  {
    id: 'pat_seq_01',
    name: 'No sooner ... than (Đảo ngữ)',
    formula: 'No sooner had + [Subject] + [V3/ed] + than + [Subject] + [V-past]',
    meaning_vi: 'Vừa mới... thì đã ngay lập tức...',
    explanation: 'Cấu trúc đảo ngữ thời gian cực kỳ ấn tượng để mô tả hai hành động diễn ra nối tiếp nhau trong tích tắc.',
    category: 'sequence',
    tone: 'Advanced / Literary',
    examples: [
      'No sooner had the patch been deployed than server CPU utilization dropped back to healthy levels.',
      'No sooner had she landed at London Heathrow than she received a notification for her final job interview.'
    ],
    tags: ['Inversion', 'Grammar', 'IELTS 8.0']
  },
  {
    id: 'pat_seq_02',
    name: 'Prior to + V-ing / Noun',
    formula: 'Prior to + [Noun Phrase / V-ing], [Main Clause]',
    meaning_vi: 'Trước khi diễn ra sự việc gì...',
    explanation: 'Trang trọng hơn từ "Before", thường thấy trong quy trình làm việc, hướng dẫn sử dụng và kiểm thử phần mềm.',
    category: 'sequence',
    tone: 'Professional / Formal',
    examples: [
      'Prior to migrating production databases, engineers must always verify that cold backups are intact and restorable.',
      'Prior to sitting for the IELTS speaking exam, candidates should spend at least fifteen minutes warming up their vocal cords.'
    ],
    tags: ['Process', 'Tech', 'Preparation']
  },
  {
    id: 'pat_seq_03',
    name: 'In the wake of',
    formula: 'In the wake of + [Event / Crisis / Breakthrough], [Main Clause]',
    meaning_vi: 'Ngay sau khi / Tiếp sau hệ quả của sự kiện...',
    explanation: 'Mô tả những biến chuyển, thay đổi xảy ra sau một cột mốc hoặc khủng hoảng đáng nhớ.',
    category: 'sequence',
    tone: 'Journalistic / Academic',
    examples: [
      'In the wake of the severe security breach, tech giants mandated hardware security keys for all staff.',
      'In the wake of recent advances in transformer neural networks, NLP applications have evolved exponentially.'
    ],
    tags: ['Current Affairs', 'Tech', 'Essay']
  },

  // ================= 16. TÓM TẮT & KẾT LUẬN (conclusion) =================
  {
    id: 'pat_conc_fin_01',
    name: 'All things considered',
    formula: 'All things considered, [Evaluative Conclusion]',
    meaning_vi: 'Sau khi cân nhắc mọi khía cạnh, Đánh giá toàn diện thì...',
    explanation: 'Dùng ở đoạn kết bài hoặc lời tổng kết cuộc họp khi đã phân tích đầy đủ ưu và nhược điểm.',
    category: 'conclusion',
    tone: 'Balanced / Professional',
    examples: [
      'All things considered, investing thirty minutes in daily language habits yields vastly higher returns than sporadic weekend cramming.',
      'All things considered, adopting native SQLite for this local application delivered unbeatable responsiveness and simplicity.'
    ],
    tags: ['IELTS', 'Conclusion', 'Summary']
  },
  {
    id: 'pat_conc_fin_02',
    name: 'In the final analysis',
    formula: 'In the final analysis, [Definitive Conclusion]',
    meaning_vi: 'Đánh giá sau cùng thì..., Xét đến cùng thì...',
    explanation: 'Đưa ra nhận định có tính chất đúc kết cốt lõi, thường dùng ở câu cuối cùng của bài luận học thuật.',
    category: 'conclusion',
    tone: 'Academic / Philosophical',
    examples: [
      'In the final analysis, technology is merely an amplifier; the true catalyst for fluency is personal curiosity and consistency.',
      'In the final analysis, software architecture should serve business velocity rather than dogmatic theoretical ideals.'
    ],
    tags: ['Academic', 'Philosophy', 'Essay']
  },
  {
    id: 'pat_conc_fin_03',
    name: 'By and large',
    formula: 'By and large, [General Verdict / Summary]',
    meaning_vi: 'Nhìn chung, Về mặt tổng thể...',
    explanation: 'Khái quát hóa một bức tranh tổng quan mà không để các chi tiết ngoại lệ nhỏ làm sai lệch nhận định chung.',
    category: 'conclusion',
    tone: 'Conversational / Business',
    examples: [
      'By and large, user feedback on the new spaced repetition interface has been overwhelmingly positive.',
      'By and large, the initial sprint accomplished all core deliverables despite the team working across four different time zones.'
    ],
    tags: ['Review', 'Speaking', 'Summary']
  },

  // ================= 17. YÊU CẦU & ĐỀ NGHỊ LỊCH SỰ (request) =================
  {
    id: 'pat_req_01',
    name: 'I would be most grateful if you could',
    formula: 'I would be most grateful if you could + [V-inf]',
    meaning_vi: 'Tôi sẽ vô cùng cảm kích / biết ơn nếu bạn có thể...',
    explanation: 'Cấu trúc yêu cầu lịch thiệp và tôn trọng bậc nhất trong văn hóa viết email công sở quốc tế.',
    category: 'request',
    tone: 'Diplomatic / Formal Email',
    examples: [
      'I would be most grateful if you could review the attached architectural RFC before our team sync tomorrow.',
      'I would be most grateful if you could export your current data backup and share it for seamless synchronization.'
    ],
    tags: ['Email', 'Politeness', 'Work']
  },
  {
    id: 'pat_req_02',
    name: 'Would you mind + V-ing',
    formula: 'Would you mind + [V-ing] / Would you mind if I + [V-past]?',
    meaning_vi: 'Bạn có phiền lòng nếu làm giúp tôi / nếu tôi làm...',
    explanation: 'Dùng để nhờ vả một cách nhã nhặn. Lưu ý nếu đồng ý giúp, người bản xứ thường trả lời "Not at all" hoặc "Sure, no problem".',
    category: 'request',
    tone: 'Courteous / Daily',
    examples: [
      'Would you mind taking a quick look at this pull request when you have a spare moment?',
      'Would you mind sharing your screen so we can troubleshoot the database connection together?'
    ],
    tags: ['Daily', 'Pair Programming', 'Polite']
  },
  {
    id: 'pat_req_03',
    name: 'With all due respect, I propose that',
    formula: 'With all due respect, I propose / suggest that + [Clause]',
    meaning_vi: 'Với tất cả sự tôn trọng, tôi xin đề xuất rằng...',
    explanation: 'Cấu trúc ngoại giao kinh điển dùng khi bạn muốn phản biện ý kiến của cấp trên hoặc đối tác mà không gây cảm giác công kích cá nhân.',
    category: 'request',
    tone: 'Diplomatic / Negotiation',
    examples: [
      'With all due respect, I propose that we delay the public release by two days to ensure zero memory leaks.',
      'With all due respect, our current server resources cannot sustain that sudden spike without load balancing.'
    ],
    tags: ['Negotiation', 'Meeting', 'Diplomacy']
  },

  // ================= 18. ĐỊNH NGHĨA & KHÁI NIỆM (definition) =================
  {
    id: 'pat_def_01',
    name: 'Can be broadly defined as',
    formula: '[Concept / Term] + can be broadly defined as + [Noun Phrase / the process of V-ing]',
    meaning_vi: 'Có thể được định nghĩa một cách khái quát là...',
    explanation: 'Dùng khi mở đầu định nghĩa một khái niệm học thuật hoặc thuật ngữ chuyên ngành trong bài viết hoặc bài giảng.',
    category: 'definition',
    tone: 'Academic',
    examples: [
      'Spaced repetition can be broadly defined as a learning technique that incorporates increasing intervals of time between subsequent review.',
      'Microservices can be broadly defined as an architectural style that structures an application as a collection of loosely coupled services.'
    ],
    tags: ['Academic', 'Definition', 'Teaching']
  },
  {
    id: 'pat_def_02',
    name: 'Constitutes a cornerstone of',
    formula: '[Practice / Principle] + constitutes a cornerstone of + [Domain / Discipline]',
    meaning_vi: 'Đóng vai trò là nền tảng cốt lõi / viên đá tảng của...',
    explanation: 'Nhấn mạnh một nguyên lý hoặc thói quen có tính chất quyết định sự tồn tại và phát triển của cả hệ thống.',
    category: 'definition',
    tone: 'Formal / Advanced',
    examples: [
      'Active recall constitutes a cornerstone of modern cognitive science and high-yield medical education.',
      'Continuous automated integration constitutes a cornerstone of modern agile software engineering.'
    ],
    tags: ['Importance', 'IELTS 8.0+', 'Academic']
  },
  {
    id: 'pat_def_03',
    name: 'Is characterized by',
    formula: '[Phenomenon / Paradigm] + is characterized by + [Noun Phrase / Key Features]',
    meaning_vi: 'Được đặc trưng bởi..., Có thuộc tính nhận diện là...',
    explanation: 'Liệt kê các phẩm chất hoặc đặc điểm nổi bật để phân biệt một đối tượng với các đối tượng khác.',
    category: 'definition',
    tone: 'Technical / Analytical',
    examples: [
      'Idiomatic English is characterized by fluent collocation usage and natural rhythmic sentence stress.',
      'Event-driven systems are characterized by asynchronous message passing and high fault isolation.'
    ],
    tags: ['Tech', 'Characteristics', 'Analysis']
  },

  // ================= 19. PHẢN BÁC & PHẢN ĐỀ (counter_argument) =================
  {
    id: 'pat_cntr_01',
    name: 'Contrary to popular belief',
    formula: 'Contrary to popular belief, [Surprising Truth / Reality]',
    meaning_vi: 'Trái ngược với quan niệm phổ biến của số đông,...',
    explanation: 'Mở đầu luận điểm phản bác bằng cách đập tan một định kiến sai lầm mà đa số mọi người vẫn tưởng là đúng.',
    category: 'counter_argument',
    tone: 'Persuasive / Academic',
    examples: [
      'Contrary to popular belief, learning a language does not require innate talent; it requires systematic daily retrieval habits.',
      'Contrary to popular belief, relational databases like SQLite can effortlessly handle hundreds of thousands of read requests per second.'
    ],
    tags: ['IELTS Task 2', 'Persuasion', 'Debate']
  },
  {
    id: 'pat_cntr_02',
    name: 'While it is often argued that..., the reality is',
    formula: 'While it is often argued that + [Opponent Claim], the reality is that + [Counter Fact]',
    meaning_vi: 'Dù người ta thường cho rằng..., nhưng thực tế lại là...',
    explanation: 'Cấu trúc tương phản đối chiếu đỉnh cao để ghi điểm ngữ pháp phức tạp trong phần thi viết luận IELTS Task 2.',
    category: 'counter_argument',
    tone: 'IELTS 8.0 / Debate',
    examples: [
      'While it is often argued that adult brains cannot acquire accent fluency, the reality is that focused shadowing overcomes phonetic hurdles.',
      'While it is often argued that building native features takes longer, the reality is that performance gains outlast temporary development speed.'
    ],
    tags: ['Debate', 'IELTS 8.0', 'Task 2']
  },
  {
    id: 'pat_cntr_03',
    name: 'Fails to take into account',
    formula: 'However, this argument fails to take into account + [Crucial Nuance / Factor]',
    meaning_vi: 'Tuy nhiên, lập luận này đã bỏ qua không tính đến...',
    explanation: 'Vạch trần lỗ hổng lập luận của đối phương một cách học thuật, sắc sảo mà không cần dùng từ ngữ gay gắt.',
    category: 'counter_argument',
    tone: 'Critical / Analytical',
    examples: [
      'However, this argument fails to take into account the immense cognitive fatigue caused by endless unstructured flashcard review.',
      'However, critics fail to take into account that offline-first applications protect user privacy far better than centralized clouds.'
    ],
    tags: ['Critical Thinking', 'Review', 'Analysis']
  },

  // ================= 20. ĐỒNG THUẬN & TÁN THÀNH (agreement) =================
  {
    id: 'pat_agr_01',
    name: 'I am in full agreement with the notion that',
    formula: 'I am in full agreement with the notion that + [Clause]',
    meaning_vi: 'Tôi hoàn toàn đồng thuận với quan điểm cho rằng...',
    explanation: 'Khẳng định sự tán thành dứt khoát 100% trong bài viết nghị luận xã hội hoặc cuộc họp chiến lược.',
    category: 'agreement',
    tone: 'Formal / Assertive',
    examples: [
      'I am in full agreement with the notion that daily micro-habits compound into extraordinary mastery over time.',
      'I am in full agreement with the engineering proposal that data integrity must always take precedence over UI aesthetics.'
    ],
    tags: ['IELTS', 'Consensus', 'Formal']
  },
  {
    id: 'pat_agr_02',
    name: 'There is widespread consensus that',
    formula: 'There is widespread consensus among [Experts / Scholars] that + [Clause]',
    meaning_vi: 'Có sự đồng thuận rộng rãi trong giới chuyên môn rằng...',
    explanation: 'Viện dẫn sự nhất trí của cộng đồng chuyên gia để tăng tính tin cậy tuyệt đối cho luận điểm của bạn.',
    category: 'agreement',
    tone: 'Academic / Authoritative',
    examples: [
      'There is widespread consensus among cognitive psychologists that spaced retrieval is the most effective memory technique.',
      'There is widespread consensus that automated regression test suites are essential for continuous deployment.'
    ],
    tags: ['Authority', 'Science', 'Research']
  },
  {
    id: 'pat_agr_03',
    name: 'Strongly resonates with',
    formula: '[Idea / Viewpoint] + strongly resonates with + [Audience / Experience]',
    meaning_vi: 'Hoàn toàn tương đồng / Tạo nên sự đồng cảm sâu sắc với...',
    explanation: 'Cách diễn đạt cảm xúc đồng tình vừa chuyên nghiệp vừa giàu tính kết nối con người.',
    category: 'agreement',
    tone: 'Engaging / Professional',
    examples: [
      'His perspective on overcoming the fear of speaking English strongly resonates with millions of adult language learners.',
      'The philosophy of keeping user data strictly local and private strongly resonates with security-conscious software engineers.'
    ],
    tags: ['Speaking', 'Empathy', 'Values']
  },

  // ================= 21. BẤT ĐỒNG & NGHI VẤN (disagreement) =================
  {
    id: 'pat_disagr_01',
    name: 'I respectfully beg to differ',
    formula: 'I respectfully beg to differ with the assertion that + [Clause]',
    meaning_vi: 'Tôi xin phép được bày tỏ quan điểm bất đồng với nhận định rằng...',
    explanation: 'Lời bất đồng mẫu mực trong giao tiếp chuyên nghiệp kiểu Anh - Mỹ: lịch sự, nhã nhặn nhưng kiên định.',
    category: 'disagreement',
    tone: 'Diplomatic / Professional',
    examples: [
      'I respectfully beg to differ with the assertion that rote grammar memorization alone creates fluent speakers.',
      'I respectfully beg to differ with the idea that moving all micro-services to a single cloud provider reduces operational risk.'
    ],
    tags: ['Diplomatic', 'Meeting', 'Speaking']
  },
  {
    id: 'pat_disagr_02',
    name: 'That is not necessarily the case',
    formula: 'While [Premise] seems intuitive, that is not necessarily the case because [Reason]',
    meaning_vi: 'Điều đó chưa hẳn đã chính xác trong thực tế vì...',
    explanation: 'Làm giảm bớt tính tuyệt đối hóa trong lập luận của đối phương mà không làm họ cảm thấy bị xúc phạm.',
    category: 'disagreement',
    tone: 'Objective / Conversational',
    examples: [
      'Many assume that living abroad automatically guarantees fluency; however, that is not necessarily the case without active immersion.',
      'It is easy to believe more lines of code mean higher productivity; that is not necessarily the case in clean architecture.'
    ],
    tags: ['Nuance', 'Debate', 'Speaking']
  },
  {
    id: 'pat_disagr_03',
    name: 'Cast serious doubt on the validity of',
    formula: '[New Evidence / Findings] + cast serious doubt on the validity of + [Hypothesis / Claim]',
    meaning_vi: 'Gieo nghi ngờ nghiêm trọng về tính xác thực của...',
    explanation: 'Dùng khi có bằng chứng hoặc số liệu mới làm lung lay giả thuyết cũ.',
    category: 'disagreement',
    tone: 'Academic / Research',
    examples: [
      'Recent longitudinal studies cast serious doubt on the validity of traditional cramming methods before exams.',
      'The sudden production benchmark failures cast serious doubt on the vendor\'s claims of zero-latency sync.'
    ],
    tags: ['Research', 'Evidence', 'Critique']
  },

  // ================= 22. VẤN ĐỀ & GIẢI PHÁP (problem_solution) =================
  {
    id: 'pat_prob_01',
    name: 'A viable solution lies in',
    formula: 'A viable / pragmatic solution to [Problem] lies in + [Noun Phrase / V-ing]',
    meaning_vi: 'Một giải pháp khả thi cho vấn đề này nằm ở việc...',
    explanation: 'Đề xuất giải pháp mang tính thực tế cao trong bài toán kinh doanh hoặc bài thi IELTS Problem-Solution.',
    category: 'problem_solution',
    tone: 'Pragmatic / Academic',
    examples: [
      'A viable solution to vocabulary forgetting lies in automating personalized spaced repetition schedules.',
      'A pragmatic solution to backend bottlenecks lies in caching hot database rows directly in an in-memory layer.'
    ],
    tags: ['Problem-Solution', 'IELTS', 'Strategy']
  },
  {
    id: 'pat_prob_02',
    name: 'Urgent measures must be taken to',
    formula: 'Urgent measures must be taken to + [V-inf] before + [Consequence Clause]',
    meaning_vi: 'Các biện pháp khẩn cấp cần phải được thực thi ngay để...',
    explanation: 'Kêu gọi hành động dứt khoát trước khi tình hình trở nên không thể cứu vãn.',
    category: 'problem_solution',
    tone: 'Formal / Urgent',
    examples: [
      'Urgent measures must be taken to secure database endpoints before our user base expands globally.',
      'Urgent measures must be taken to curb plastic pollution before irreparable damage is inflicted upon marine ecosystems.'
    ],
    tags: ['Call to Action', 'Policy', 'IELTS']
  },
  {
    id: 'pat_prob_03',
    name: 'In order to mitigate the impact of',
    formula: 'In order to mitigate the adverse impact of + [Problem], [Subject] + should / must + [Solution]',
    meaning_vi: 'Nhằm mục đích giảm thiểu tác động tiêu cực của..., cần phải...',
    explanation: '"Mitigate" là động từ học thuật Band 8.0 cực kỳ đắt giá khi thảo luận về quản trị rủi ro và giải quyết khủng hoảng.',
    category: 'problem_solution',
    tone: 'Professional / Band 8.0',
    examples: [
      'In order to mitigate the adverse impact of unexpected data loss, LinguaVault provides atomic JSON backup and restore capabilities.',
      'In order to mitigate the impact of sudden market fluctuations, founders maintain a lean operational budget.'
    ],
    tags: ['Risk', 'IELTS 8.0', 'Management']
  },

  // ================= 23. ĐÁNH GIÁ & TẦM QUAN TRỌNG (evaluation) =================
  {
    id: 'pat_eval_01',
    name: 'Plays a pivotal / instrumental role in',
    formula: '[Factor / Subject] + plays a pivotal / instrumental role in + [Noun Phrase / V-ing]',
    meaning_vi: 'Đóng vai trò then chốt / mang tính quyết định trong...',
    explanation: 'Cụm collocation kinh điển để khẳng định tầm quan trọng sống còn của một nhân tố.',
    category: 'evaluation',
    tone: 'Academic / High Impact',
    examples: [
      'Consistent daily habit tracking plays an instrumental role in maintaining long-term language learning motivation.',
      'Low query latency plays a pivotal role in delivering an exceptional user experience on interactive mobile apps.'
    ],
    tags: ['Impact', 'Evaluation', 'IELTS 8.0']
  },
  {
    id: 'pat_eval_02',
    name: 'Is of paramount importance',
    formula: '[Action / Value] + is of paramount importance to + [Target Domain]',
    meaning_vi: 'Có tầm quan trọng tối thượng / là ưu tiên số một đối với...',
    explanation: 'Nâng cấp từ "is very important" lên tầm cao học thuật và văn phong lãnh đạo.',
    category: 'evaluation',
    tone: 'Formal / Leadership',
    examples: [
      'Protecting user data sovereignty and offline privacy is of paramount importance to our core design philosophy.',
      'Active auditory shadowing is of paramount importance to any non-native speaker aspiring to natural English cadence.'
    ],
    tags: ['Leadership', 'Priority', 'Values']
  },
  {
    id: 'pat_eval_03',
    name: 'Has profound implications for',
    formula: '[Breakthrough / Trend] + has profound implications for + [Field / Future]',
    meaning_vi: 'Có những hàm ý và tác động sâu sắc đối với tương lai của...',
    explanation: 'Đánh giá mức độ ảnh hưởng sâu rộng của một cuộc cách mạng công nghệ hoặc chính sách mới.',
    category: 'evaluation',
    tone: 'Academic / Visionary',
    examples: [
      'The emergence of multimodal language models has profound implications for the future of personalized education.',
      'Local-first software architecture has profound implications for how developers build robust and resilient applications.'
    ],
    tags: ['Future', 'AI', 'Vision']
  },

  // ================= 24. MỨC ĐỘ & PHẠM VI (degree_extent) =================
  {
    id: 'pat_deg_01',
    name: 'To a significant extent',
    formula: 'To a significant / great extent, [Main Clause]',
    meaning_vi: 'Ở một mức độ đáng kể, Phần lớn...',
    explanation: 'Đặt ở đầu câu để định lượng mức độ chính xác của một kết luận mà không khẳng định một cách phiến diện.',
    category: 'degree_extent',
    tone: 'Nuanced / Academic',
    examples: [
      'To a significant extent, your English speaking confidence depends on the automated retrieval speed of your core vocabulary.',
      'To a great extent, the reliability of a modern web application reflects the discipline of its automated test suite.'
    ],
    tags: ['Nuance', 'Precision', 'IELTS']
  },
  {
    id: 'pat_deg_02',
    name: 'Far outweighs',
    formula: 'The [benefits / advantages] of [Option A] far outweigh the [drawbacks / costs] of [Option B]',
    meaning_vi: 'Lợi ích của... vượt trội hơn hẳn so với bất lợi của...',
    explanation: 'Cấu trúc so sánh trọng lượng kinh điển trong câu trả lời câu hỏi "Do advantages outweigh disadvantages?" của IELTS Writing.',
    category: 'degree_extent',
    tone: 'Academic / Decisive',
    examples: [
      'The long-term cognitive benefits of bilingualism far outweigh the temporary struggle of learning grammar rules.',
      'The security benefits of local SQLite data storage far outweigh the minor inconvenience of managing file backups.'
    ],
    tags: ['IELTS Task 2', 'Decision', 'Weighing']
  },
  {
    id: 'pat_deg_03',
    name: 'In large measure due to',
    formula: '[Success / Outcome] + was in large measure due to + [Key Driver / Effort]',
    meaning_vi: 'Phần lớn là nhờ vào..., Được tạo nên chủ yếu bởi...',
    explanation: 'Chỉ ra tỷ trọng đóng góp lớn nhất dẫn đến thành công hay thất bại của một dự án.',
    category: 'degree_extent',
    tone: 'Reflective / Professional',
    examples: [
      'The swift resolution of the production outage was in large measure due to our automated canary deployment alerts.',
      'His meteoric score leap from IELTS 6.0 to 8.0 was in large measure due to ruthless daily spaced repetition sessions.'
    ],
    tags: ['Achievement', 'Analysis', 'Story']
  }
];
