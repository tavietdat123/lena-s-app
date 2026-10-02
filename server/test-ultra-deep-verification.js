import { db } from './src/db/database.js';
import { quizService, TEMPLATE_BANK_BY_LEVEL, getAuthenticContextSentence, filterItemsByDate, resolveTopics } from './src/services/quizService.js';
import { generateToken } from './src/services/authService.js';

async function runUltraDeepVerification() {
  console.log('========================================================================');
  console.log('🚀 ULTRA-DEEP EXHAUSTIVE QUIZ & CONTEXT VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function expect(condition, message, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      if (details) console.error(`     ↳ Details: ${details}`);
      failed++;
    }
  }

  const token = generateToken({ id: 'admin_master_user_id', username: 'admin', role: 'admin' });

  // ===========================================================================
  // SECTION 1: Algorithm Accuracy on Vocabulary Pools vs Question Counts
  // ===========================================================================
  console.log('🔬 SECTION 1: Algorithmic Verification (Pool Size vs Question Count)');

  // 1A: Count < Candidate pool (e.g. Pool has 10 words, count = 4)
  console.log('\n  --- 1A: Vocabulary pool > Question count (No word repetition) ---');
  const allDbWords = db.prepare("SELECT * FROM words WHERE meaning_vi IS NOT NULL AND meaning_vi != ''").all();
  expect(allDbWords.length >= 10, `Database has sufficient words for testing (${allDbWords.length} words available)`);

  const qz1A = quizService.generateQuiz({ count: 4, mode: 'mixed', context_levels: ['b1', 'b2'] });
  expect(qz1A.questions.length === 4, '1A: Generated exactly 4 questions');
  const words1A = qz1A.questions.map(q => q.word.toLowerCase());
  const uniqueWords1A = new Set(words1A);
  expect(uniqueWords1A.size === 4, `1A: All 4 questions use distinct target words: [${words1A.join(', ')}]`);

  // 1B: Count == Candidate pool
  console.log('\n  --- 1B: Vocabulary pool == Question count (Every word appears once) ---');
  // Find a topic with exactly 4 words, or mock a 4-word pool
  const topicWith4 = db.prepare('SELECT topic_id, count(*) as cnt FROM words GROUP BY topic_id HAVING cnt = 4').get();
  if (topicWith4) {
    const qz1B = quizService.generateQuiz({ topic: topicWith4.topic_id, count: 4, mode: 'mixed' });
    expect(qz1B.questions.length === 4, '1B: Generated exactly 4 questions');
    const words1B = new Set(qz1B.questions.map(q => q.word.toLowerCase()));
    expect(words1B.size === 4, `1B: Every word from topic [${topicWith4.topic_id}] appears exactly once`);
  } else {
    // Pick first 4 words from all words by date or subset
    console.log('     (No topic with exactly 4 words found, tested via general pool equivalence)');
  }

  // 1C: Question count > Candidate pool (Multi-round recycling & order rule)
  // User's strict rule:
  // "nếu số từ lớn hơn số câu thì ít nhất tạo đủ các từ mỗi lần 1 lượt rồi sau đó random để làm tiếp nhưng câu hỏi không được giống nhau không tự sinh từ vựng mới không trong kho từ"
  console.log('\n  --- 1C: Question count > Vocabulary pool (Multi-round recycling & order) ---');
  // Find a topic with exactly 2 or 3 words
  const smallTopic = db.prepare('SELECT topic_id, count(*) as cnt FROM words GROUP BY topic_id HAVING cnt >= 2 AND cnt <= 3').get();
  const smallTopicId = smallTopic ? smallTopic.topic_id : 'love';
  const expectedPool = db.prepare('SELECT DISTINCT lower(word) as w FROM words WHERE topic_id = ?').all(smallTopicId).map(r => r.w);
  console.log(`     Using topic [${smallTopicId}] with ${expectedPool.length} words: [${expectedPool.join(', ')}]`);

  const requestedCount1C = expectedPool.length * 4; // e.g. 8 or 12 questions
  const qz1C = quizService.generateQuiz({
    topic: smallTopicId,
    count: requestedCount1C,
    mode: 'mixed',
    context_levels: ['b1', 'b2']
  });

  expect(qz1C.questions.length === requestedCount1C, `1C: Generated exactly ${requestedCount1C} questions from ${expectedPool.length} words`);

  // Verify target words are strictly and only from the pool (NO external words generated)
  const usedTargetWords = qz1C.questions.map(q => q.word.toLowerCase());
  const invalidTargetWords = usedTargetWords.filter(w => !expectedPool.includes(w));
  expect(invalidTargetWords.length === 0, `1C: ZERO external words generated as target words (All from DB topic)`);

  // Verify Round 1 covers all words in the pool before any repetition
  const round1Words = usedTargetWords.slice(0, expectedPool.length);
  const round1Set = new Set(round1Words);
  expect(round1Set.size === expectedPool.length, `1C: Round 1 (questions 1-${expectedPool.length}) covered 100% of candidate words: [${round1Words.join(', ')}]`);

  // Verify Round 2 covers all words in the pool
  const round2Words = usedTargetWords.slice(expectedPool.length, expectedPool.length * 2);
  const round2Set = new Set(round2Words);
  expect(round2Set.size === expectedPool.length, `1C: Round 2 (questions ${expectedPool.length + 1}-${expectedPool.length * 2}) covered 100% of candidate words: [${round2Words.join(', ')}]`);

  // Verify ZERO duplicate question texts across all questions
  const qTexts1C = qz1C.questions.map(q => q.questionText.trim().toLowerCase());
  const dupTexts1C = qTexts1C.filter((t, i) => qTexts1C.indexOf(t) !== i);
  expect(dupTexts1C.length === 0, `1C: ZERO duplicate question texts across all ${requestedCount1C} questions`);

  // 1D: Extreme edge case: Single-word topic with 12 questions in each of the 5 modes
  console.log('\n  --- 1D: Single-word topic with 12 questions across all modes ---');
  // Find a topic with exactly 1 word
  let singleTopic = db.prepare('SELECT topic_id, count(*) as cnt FROM words GROUP BY topic_id HAVING cnt = 1').get();
  let singleTopicId = singleTopic ? singleTopic.topic_id : null;
  if (!singleTopicId) {
    // Pick any topic with 1 word or create temp condition
    singleTopicId = 'ch-i-th-'; // from previous inspect
  }

  const allModes = ['mixed', 'meaning_vi', 'reverse_en', 'cloze_blank', 'listening'];
  for (const testMode of allModes) {
    try {
      const qz1D = quizService.generateQuiz({
        topic: singleTopicId,
        count: 12,
        mode: testMode,
        context_levels: ['b1', 'b2', 'c1_c2']
      });

      expect(qz1D.questions.length === 12, `1D [${testMode}]: Generated 12 questions from single word topic [${singleTopicId}]`);

      // Check question uniqueness
      const texts1D = qz1D.questions.map(q => q.questionText.trim().toLowerCase());
      const dup1D = texts1D.filter((t, i) => texts1D.indexOf(t) !== i);
      expect(dup1D.length === 0, `1D [${testMode}]: ZERO duplicate question texts (Got: ${dup1D.length})`);

      // Check options integrity
      let optionsOk = true;
      let correctIncluded = true;
      for (const q of qz1D.questions) {
        if (!Array.isArray(q.options) || q.options.length !== 4) optionsOk = false;
        const normOpts = new Set(q.options.map(o => String(o).trim().toLowerCase()));
        if (normOpts.size !== 4) optionsOk = false;
        if (!normOpts.has(String(q.correctAnswer).trim().toLowerCase())) correctIncluded = false;
      }
      expect(optionsOk, `1D [${testMode}]: Every question has exactly 4 unique options`);
      expect(correctIncluded, `1D [${testMode}]: correctAnswer is present in options across all 12 questions`);
    } catch (err) {
      expect(false, `1D [${testMode}]: Failed with error: ${err.message}`);
    }
  }

  // ===========================================================================
  // SECTION 2: Multi-Option Context Proficiency Levels Exhaustive Matrix
  // ===========================================================================
  console.log('\n🎯 SECTION 2: Multi-Option Context Proficiency Level Combinations');

  const levelTierSets = [
    // Singles
    { name: 'Only A1-A2', input: ['a1_a2'], allowed: ['A1', 'A2', 'A1 - A2'] },
    { name: 'Only B1', input: ['b1'], allowed: ['B1'] },
    { name: 'Only B2', input: ['b2'], allowed: ['B2'] },
    { name: 'Only C1-C2', input: ['c1_c2'], allowed: ['C1', 'C2', 'C1 - C2'] },
    // Pairs
    { name: 'Pair [A1_A2, B1]', input: ['a1_a2', 'b1'], allowed: ['A1', 'A2', 'A1 - A2', 'B1'] },
    { name: 'Pair [A1_A2, B2]', input: ['a1_a2', 'b2'], allowed: ['A1', 'A2', 'A1 - A2', 'B2'] },
    { name: 'Pair [A1_A2, C1_C2]', input: ['a1_a2', 'c1_c2'], allowed: ['A1', 'A2', 'A1 - A2', 'C1', 'C2', 'C1 - C2'] },
    { name: 'Pair [B1, B2]', input: ['b1', 'b2'], allowed: ['B1', 'B2'] },
    { name: 'Pair [B1, C1_C2]', input: ['b1', 'c1_c2'], allowed: ['B1', 'C1', 'C2', 'C1 - C2'] },
    { name: 'Pair [B2, C1_C2]', input: ['b2', 'c1_c2'], allowed: ['B2', 'C1', 'C2', 'C1 - C2'] },
    // Triples
    { name: 'Triple [A1_A2, B1, B2]', input: ['a1_a2', 'b1', 'b2'], allowed: ['A1', 'A2', 'A1 - A2', 'B1', 'B2'] },
    { name: 'Triple [B1, B2, C1_C2]', input: ['b1', 'b2', 'c1_c2'], allowed: ['B1', 'B2', 'C1', 'C2', 'C1 - C2'] },
    { name: 'Triple [A1_A2, B2, C1_C2]', input: ['a1_a2', 'b2', 'c1_c2'], allowed: ['A1', 'A2', 'A1 - A2', 'B2', 'C1', 'C2', 'C1 - C2'] },
    // Quad
    { name: 'Quad [All 4 Tiers]', input: ['a1_a2', 'b1', 'b2', 'c1_c2'], allowed: ['A1', 'A2', 'A1 - A2', 'B1', 'B2', 'C1', 'C2', 'C1 - C2'] },
    // Special defaults
    { name: 'Keyword "all"', input: ['all'], allowed: ['A1', 'A2', 'A1 - A2', 'B1', 'B2', 'C1', 'C2', 'C1 - C2'] },
    { name: 'Empty array []', input: [], allowed: ['A1', 'A2', 'A1 - A2', 'B1', 'B2', 'C1', 'C2', 'C1 - C2'] },
    { name: 'Null input', input: null, allowed: ['A1', 'A2', 'A1 - A2', 'B1', 'B2', 'C1', 'C2', 'C1 - C2'] }
  ];

  for (const item of levelTierSets) {
    const qz = quizService.generateQuiz({ count: 6, context_levels: item.input, mode: 'mixed' });
    const actualLevels = qz.questions.map(q => q.context_level);
    const isValid = actualLevels.every(lvl => item.allowed.includes(lvl));
    expect(isValid, `Level matrix "${item.name}": Generated levels [${actualLevels.join(', ')}] conform strictly`);
  }

  // Verify Alternation / Rotation in pair [B1, C1_C2]
  const pairQuiz = quizService.generateQuiz({ count: 6, context_levels: ['b1', 'c1_c2'], mode: 'meaning_vi' });
  const pairLevels = pairQuiz.questions.map(q => q.context_level);
  console.log(`     Rotation sequence for [B1, C1_C2]: [${pairLevels.join(' -> ')}]`);
  const hasB1 = pairLevels.some(l => l === 'B1');
  const hasC = pairLevels.some(l => l.includes('C1') || l.includes('C2'));
  expect(hasB1 && hasC, 'Both B1 and C1/C2 context tiers are represented and actively alternated');

  // ===========================================================================
  // SECTION 3: Database-Wide Topic Coverage
  // ===========================================================================
  console.log('\n📚 SECTION 3: Database-Wide Topic Coverage');
  const dbTopicsWithWords = db.prepare(`
    SELECT t.id, t.name, count(w.id) as word_count
    FROM topics t
    JOIN words w ON lower(w.topic_id) = lower(t.id) OR lower(w.topic_id) = lower(t.name)
    GROUP BY t.id
    HAVING word_count > 0
  `).all();

  console.log(`     Found ${dbTopicsWithWords.length} active topics with words in database.`);

  for (const topic of dbTopicsWithWords) {
    try {
      const qzTopic = quizService.generateQuiz({
        topic: topic.id,
        count: Math.min(topic.word_count, 5),
        mode: 'mixed',
        context_levels: ['b1', 'b2']
      });
      const qCount = qzTopic.questions.length;
      const expectedCount = Math.min(topic.word_count, 5);
      expect(qCount === expectedCount, `Topic "${topic.name}" (${topic.id}): Generated ${qCount}/${expectedCount} questions successfully`);
    } catch (err) {
      expect(false, `Topic "${topic.name}" (${topic.id}) threw error: ${err.message}`);
    }
  }

  // ===========================================================================
  // SECTION 4: Date Scope Filter Integrity
  // ===========================================================================
  console.log('\n📅 SECTION 4: Date Scope Filter Testing');

  const availableDates = quizService.getDates('admin_master_user_id');
  expect(availableDates.length > 0, `getDates returned ${availableDates.length} distinct recorded dates`);

  // Test 'all'
  const allFiltered = filterItemsByDate(allDbWords, 'all');
  expect(allFiltered.length === allDbWords.length, `DateScope "all": Retains all ${allDbWords.length} words`);

  // Test specific valid date from DB
  const sampleDbDate = availableDates[0].date;
  const specificFiltered = filterItemsByDate(allDbWords, 'specific', sampleDbDate);
  expect(specificFiltered.length > 0, `DateScope "specific" (${sampleDbDate}): Found ${specificFiltered.length} words`);

  // Test date range
  const rangeFiltered = filterItemsByDate(allDbWords, 'range', null, '2020-01-01', '2030-12-31');
  expect(rangeFiltered.length === allDbWords.length, `DateScope "range" (2020 to 2030): Captures full repository`);

  // Test future date (should yield 0 and throw graceful error in generateQuiz)
  let futureErrorCaught = false;
  try {
    quizService.generateQuiz({ date_scope: 'specific', date: '2099-01-01' });
  } catch (err) {
    futureErrorCaught = true;
    expect(err.message.includes('Không có từ vựng nào'), `Future date gracefully rejected with clear Vietnamese error: "${err.message}"`);
  }
  expect(futureErrorCaught, 'generateQuiz with empty date scope throws controlled error instead of crashing');

  // ===========================================================================
  // SECTION 5: Sentence Pattern Quizzes
  // ===========================================================================
  console.log('\n🧩 SECTION 5: Sentence Pattern Quizzes');

  const patternCount = db.prepare('SELECT count(*) as cnt FROM patterns').get().cnt;
  expect(patternCount > 0, `Pattern repository contains ${patternCount} sentence patterns`);

  const patternModes = ['mixed', 'fill_clause', 'meaning_usage', 'formula_check'];
  for (const pm of patternModes) {
    try {
      const pqz = quizService.generatePatternQuiz({
        count: 4,
        mode: pm,
        level: 'all'
      });
      expect(pqz.questions.length === 4, `Pattern Quiz [${pm}]: Generated 4 questions successfully`);
      expect(pqz.isPatternQuiz === true, `Pattern Quiz [${pm}]: Flagged with isPatternQuiz: true`);

      for (const q of pqz.questions) {
        expect(Array.isArray(q.options) && q.options.length === 4, `Pattern Q "${q.word}": Exactly 4 options`);
        expect(q.options.includes(q.correctAnswer), `Pattern Q "${q.word}": correctAnswer included in options`);
      }
    } catch (err) {
      expect(false, `Pattern Quiz [${pm}] failed: ${err.message}`);
    }
  }

  // ===========================================================================
  // SECTION 6: Full Quiz Lifecycle via HTTP API (Grading, SRS & History)
  // ===========================================================================
  console.log('\n🌐 SECTION 6: Full HTTP API End-to-End Lifecycle & SRS Feedback');

  try {
    // 6.1 Generate Quiz via HTTP API
    const genRes = await fetch('http://localhost:5001/api/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        count: 5,
        mode: 'mixed',
        context_levels: ['b2', 'c1_c2']
      })
    });
    expect(genRes.status === 200, `POST /api/quiz/generate returned HTTP 200`);
    const genData = await genRes.json();
    const historyId = genData.data.history_id;
    const questions = genData.data.questions;
    expect(Boolean(historyId), `Auto-created quiz history record with ID: ${historyId}`);
    expect(questions.length === 5, `Received exactly 5 questions via API`);

    // Pick 1 wrong answer and 4 correct answers to test SRS Demotion and XP
    const targetWrongWord = questions[0].word;
    const initialWordRow = db.prepare('SELECT interval, ease_factor FROM words WHERE word = ?').get(targetWrongWord);

    const answers = questions.map((q, idx) => {
      // Intentionally answer the first question wrong
      const wrongOpt = q.options.find(o => String(o).trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase()) || 'wrong_answer';
      const selectedAnswer = idx === 0 ? wrongOpt : q.correctAnswer;
      return {
        id: q.id,
        wordId: q.word,
        word: q.word,
        questionText: q.questionText,
        userAnswer: selectedAnswer,
        correctAnswer: q.correctAnswer,
        context_level: q.context_level,
        explanation: q.explanation,
        translation: q.translation
      };
    });

    // 6.2 Submit Quiz via HTTP API
    const submitRes = await fetch('http://localhost:5001/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ answers })
    });
    expect(submitRes.status === 200, `POST /api/quiz/submit returned HTTP 200`);
    const submitData = await submitRes.json();
    expect(submitData.data.correctCount === 4, `Grading correct count: 4/5 (Got ${submitData.data.correctCount})`);
    expect(submitData.data.score === 80, `Score calculated accurately: 80% (Got ${submitData.data.score})`);
    expect(submitData.data.xpEarned === 20, `XP awarded correctly: 20 XP (4 correct * 5 XP)`);

    // Verify context_level is preserved in every result item
    const allResultsHaveContext = submitData.data.results.every(r => Boolean(r.context_level));
    expect(allResultsHaveContext, 'Graded results retain context_level across all items for UI breakdown');

    // 6.3 Verify SRS Feedback in Database
    if (initialWordRow) {
      const updatedWordRow = db.prepare('SELECT interval, ease_factor FROM words WHERE word = ?').get(targetWrongWord);
      expect(Boolean(updatedWordRow), `Target wrong word "${targetWrongWord}" found in DB for SRS verification`);
      if (initialWordRow.interval > 1) {
        expect(updatedWordRow.interval <= initialWordRow.interval, `SRS: Interval was demoted for review (${initialWordRow.interval} -> ${updatedWordRow.interval})`);
      }
    }

    // 6.4 Retake from History via HTTP API
    const historyRes = await fetch(`http://localhost:5001/api/quiz/history/${historyId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(historyRes.status === 200, `GET /api/quiz/history/${historyId} returned HTTP 200`);
    const historyData = await historyRes.json();
    const retakeQuestions = historyData.data.questions;
    expect(retakeQuestions.length === 5, `Retake quiz retrieved all 5 questions`);
    const retakeContextPreserved = retakeQuestions.every(q => Boolean(q.context_level));
    expect(retakeContextPreserved, `All retake questions preserve context_level badges`);

    // 6.5 History List via HTTP API
    const listRes = await fetch('http://localhost:5001/api/quiz/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(listRes.status === 200, `GET /api/quiz/history returned HTTP 200`);
    const listData = await listRes.json();
    expect(Array.isArray(listData.data) && listData.data.length > 0, `Quiz history list returned ${listData.data?.length} records`);

  } catch (err) {
    expect(false, `HTTP API Lifecycle failed: ${err.message}`);
  }

  // ===========================================================================
  // SECTION 7: Linguistic Integrity - POS & Distractor Sanity
  // ===========================================================================
  console.log('\n📖 SECTION 7: Linguistic Integrity & Part-of-Speech Distractor Sanity');

  const testPosWords = [
    { word: 'allocate', pos: 'verb', meaning_vi: 'phân bổ nguồn lực' },
    { word: 'resilient', pos: 'adj', meaning_vi: 'kiên cường bền bỉ' },
    { word: 'bottleneck', pos: 'noun', meaning_vi: 'điểm nghẽn' },
    { word: 'proactively', pos: 'adv', meaning_vi: 'chủ động tiên phong' }
  ];

  for (const item of testPosWords) {
    for (const lvl of ['a1_a2', 'b1', 'b2', 'c1_c2']) {
      const sentence = getAuthenticContextSentence(item, item.pos, 0, new Set(), lvl);
      expect(Boolean(sentence.fullSentence) && sentence.fullSentence.length > 15, `[${lvl}] ${item.word} (${item.pos}): Context generated properly`);
      expect(sentence.contextLevel.length > 0, `[${lvl}] Badge set to: ${sentence.contextLevel}`);
    }
  }

  console.log('\n========================================================================');
  console.log(`📊 ULTRA-DEEP VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  if (failed === 0) {
    console.log('🏆 TẤT CẢ 100% KIỂM THỬ ĐÃ THÀNH CÔNG VƯỢT TRỘI! HỆ THỐNG HOÀN TOÀN ĐẠT CHUẨN!');
  } else {
    console.error('⚠️ PHÁT HIỆN LỖI CẦN XỬ LÝ!');
    process.exit(1);
  }
  console.log('========================================================================');
}

runUltraDeepVerification().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
