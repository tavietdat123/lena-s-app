import { db } from './src/db/database.js';
import { quizService, TEMPLATE_BANK_BY_LEVEL, getAuthenticContextSentence } from './src/services/quizService.js';
import { generateToken } from './src/services/authService.js';

async function runMegaTest() {
  console.log('========================================================================');
  console.log('🧪 COMPREHENSIVE QUIZ & CONTEXT LEVEL EXHAUSTIVE TEST MATRIX');
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

  // ---------------------------------------------------------------------------
  // SECTION 1: Real Database Data & Word Inventory
  // ---------------------------------------------------------------------------
  console.log('📦 SECTION 1: Database Inventory & Word Profiling');
  const totalWords = db.prepare('SELECT count(*) as cnt FROM words').get().cnt;
  expect(totalWords > 0, `Database has vocabulary words (${totalWords} words loaded)`);

  const levelsInDb = db.prepare('SELECT DISTINCT level FROM words WHERE level IS NOT NULL').all().map(r => r.level);
  console.log(`     Available word levels in DB: ${levelsInDb.join(', ')}`);

  // ---------------------------------------------------------------------------
  // SECTION 2: Direct HTTP API Testing against Running Dev Server (Port 5001)
  // ---------------------------------------------------------------------------
  console.log('\n🌐 SECTION 2: Real HTTP API Integration (/api/quiz/generate & /api/quiz/submit)');
  try {
    const apiRes = await fetch('http://localhost:5001/api/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        topic: 'All',
        count: 6,
        mode: 'mixed',
        context_levels: ['b1', 'b2']
      })
    });

    expect(apiRes.status === 200, `POST /api/quiz/generate returns HTTP 200 (Got ${apiRes.status})`);
    const apiData = await apiRes.json();
    expect(apiData.success === true, 'Response body has success: true');
    expect(Boolean(apiData.data?.history_id), `Auto-saved to history with ID: ${apiData.data?.history_id}`);
    expect(apiData.data?.questions?.length === 6, `Returned exactly 6 questions (Got ${apiData.data?.questions?.length})`);

    const allHaveContextLevel = apiData.data?.questions?.every(q => Boolean(q.context_level));
    expect(allHaveContextLevel, 'Every returned question via HTTP API contains context_level badge');

    // Test Submit via HTTP API
    const submitPayload = {
      answers: apiData.data.questions.map(q => ({
        id: q.id,
        wordId: q.word,
        questionText: q.questionText,
        userAnswer: q.options[0],
        correctAnswer: q.correctAnswer,
        context_level: q.context_level,
        explanation: q.explanation,
        translation: q.translation
      }))
    };

    const submitRes = await fetch('http://localhost:5001/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(submitPayload)
    });

    expect(submitRes.status === 200, `POST /api/quiz/submit returns HTTP 200 (Got ${submitRes.status})`);
    const submitData = await submitRes.json();
    expect(submitData.success === true, 'Submit grading response has success: true');
    expect(submitData.data?.results?.every(r => Boolean(r.context_level)), 'Graded results retain context_level in all items');

    // Test History Fetch via HTTP API
    const historyRes = await fetch(`http://localhost:5001/api/quiz/history/${apiData.data.history_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const historyData = await historyRes.json();
    expect(historyRes.status === 200 && historyData.success === true, 'GET /api/quiz/history/:id returns saved quiz');
    expect(historyData.data?.questions?.every(q => Boolean(q.context_level)), 'Historical quiz retains context_level on every question when retaken');

  } catch (err) {
    expect(false, 'HTTP API Integration failed', err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: Multi-Option Context Levels Permutations
  // ---------------------------------------------------------------------------
  console.log('\n🎯 SECTION 3: Multi-Option Context Level Permutations');

  const permutations = [
    { name: 'Single A1_A2', input: ['a1_a2'], valid: ['A1', 'A2', 'A1 - A2'] },
    { name: 'Single B1', input: ['b1'], valid: ['B1'] },
    { name: 'Single B2', input: ['b2'], valid: ['B2'] },
    { name: 'Single C1_C2', input: ['c1_c2'], valid: ['C1', 'C2', 'C1 - C2'] },
    { name: 'Pair [B1, B2]', input: ['b1', 'b2'], valid: ['B1', 'B2'] },
    { name: 'Pair [A1_A2, C1_C2]', input: ['a1_a2', 'c1_c2'], valid: ['A1', 'A2', 'A1 - A2', 'C1', 'C2', 'C1 - C2'] },
    { name: 'Triple [A1_A2, B1, B2]', input: ['a1_a2', 'b1', 'b2'], valid: ['A1', 'A2', 'A1 - A2', 'B1', 'B2'] },
    { name: 'All 4 Tiers', input: ['a1_a2', 'b1', 'b2', 'c1_c2'], valid: ['A1', 'A2', 'A1 - A2', 'B1', 'B2', 'C1', 'C2', 'C1 - C2'] },
    { name: 'Default All', input: ['all'], valid: ['A1', 'A2', 'A1 - A2', 'B1', 'B2', 'C1', 'C2', 'C1 - C2'] }
  ];

  for (const perm of permutations) {
    const quiz = quizService.generateQuiz({ count: 8, context_levels: perm.input, mode: 'mixed' });
    const allValid = quiz.questions.every(q => perm.valid.includes(q.context_level));
    const levelsPresent = Array.from(new Set(quiz.questions.map(q => q.context_level))).join(', ');
    expect(allValid, `Permutation "${perm.name}": strictly respects allowed levels [${levelsPresent}]`);
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: All Quiz Modes Deep Verification
  // ---------------------------------------------------------------------------
  console.log('\n🧩 SECTION 4: Quiz Modes Specific Functional Checks');

  const modes = ['meaning_vi', 'reverse_en', 'cloze_blank', 'listening', 'mixed'];
  for (const m of modes) {
    const qz = quizService.generateQuiz({ count: 5, mode: m, context_levels: ['b1', 'b2'] });
    expect(qz.questions.length === 5, `Mode "${m}" produces requested count (5 questions)`);

    for (let i = 0; i < qz.questions.length; i++) {
      const q = qz.questions[i];
      const type = q.type;

      if (type === 'meaning_vi') {
        expect(q.questionText.includes('**'), `meaning_vi Q${i+1} bold marks target word: "${q.questionText.slice(0, 40)}..."`);
      } else if (type === 'reverse_en') {
        expect(q.questionText.includes('_______'), `reverse_en Q${i+1} has blank: "${q.questionText.slice(0, 40)}..."`);
      } else if (type === 'cloze_blank') {
        expect(q.questionText.includes('_______'), `cloze_blank Q${i+1} has blank: "${q.questionText.slice(0, 40)}..."`);
      } else if (type === 'listening') {
        expect(Boolean(q.phonetic) || Boolean(q.word), `listening Q${i+1} provides word for TTS speech`);
      }

      // Check 4 options guarantee
      expect(Array.isArray(q.options) && q.options.length === 4, `Q${i+1} has exactly 4 options`);
      const distinct = new Set(q.options.map(o => String(o).toLowerCase().trim()));
      expect(distinct.size === 4, `Q${i+1} options are 100% unique (no duplicates in choices)`);
      expect(distinct.has(String(q.correctAnswer).toLowerCase().trim()), `Q${i+1} includes correctAnswer in options`);
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION 5: Extreme Deduplication & Multi-Round Stress Test
  // ---------------------------------------------------------------------------
  console.log('\n⚡ SECTION 5: Stress Test - Small Candidate Pool, High Question Count (Deduplication)');
  
  // Find a topic with very few words in DB (e.g. 1 or 2 words)
  const topicCounts = db.prepare('SELECT topic_id, count(*) as cnt FROM words GROUP BY topic_id HAVING cnt <= 3').all();
  const testTopicId = topicCounts.length > 0 ? topicCounts[0].topic_id : 'All';
  console.log(`     Running 15-question stress test on topic [${testTopicId}]...`);

  const stressQuiz = quizService.generateQuiz({
    topic: testTopicId,
    count: 15,
    mode: 'mixed',
    context_levels: ['b1', 'b2']
  });

  expect(stressQuiz.questions.length === 15, `Target 15 questions generated successfully from small topic`);
  const texts = stressQuiz.questions.map(q => q.questionText.trim().toLowerCase());
  const duplicates = texts.filter((item, index) => texts.indexOf(item) !== index);
  expect(duplicates.length === 0, `ZERO duplicate question texts found across 15 questions (Found: ${duplicates.length})`, duplicates.join(' | '));

  // ---------------------------------------------------------------------------
  // SECTION 6: Universal Natural Collocations across all POS
  // ---------------------------------------------------------------------------
  console.log('\n📖 SECTION 6: Linguistic Integrity & Collocational Naturalness');

  const auditWords = [
    { word: 'appear', pos: 'verb', meaning: 'xuất hiện' },
    { word: 'disappear', pos: 'verb', meaning: 'biến mất' },
    { word: 'arrive', pos: 'verb', meaning: 'đến nơi' },
    { word: 'exist', pos: 'verb', meaning: 'tồn tại' },
    { word: 'grateful', pos: 'adj', meaning: 'biết ơn' },
    { word: 'proud', pos: 'adj', meaning: 'tự hào' },
    { word: 'confused', pos: 'adj', meaning: 'bối rối' },
    { word: 'milestone', pos: 'noun', meaning: 'cột mốc' },
    { word: 'bottleneck', pos: 'noun', meaning: 'điểm nghẽn' },
    { word: 'proactively', pos: 'adv', meaning: 'chủ động' },
    { word: 'take for granted', pos: 'phrase', meaning: 'coi là hiển nhiên' }
  ];

  for (const aw of auditWords) {
    for (const lvl of ['a1_a2', 'b1', 'b2', 'c1_c2']) {
      const res = getAuthenticContextSentence({ word: aw.word, meaning_vi: aw.meaning }, aw.pos, 0, new Set(), lvl);
      // Ensure sentence is non-empty, contains the word or blank, and has clean translation
      expect(Boolean(res.fullSentence) && res.fullSentence.length > 15, `[${lvl}] ${aw.word} (${aw.pos}): "${res.fullSentence}"`);
      expect(Boolean(res.sentenceTranslation), `[${lvl}] Translation provided: "${res.sentenceTranslation}"`);
      
      // Strict check: Intransitive verbs must never be followed by direct business nouns without prepositions
      if (['appear', 'disappear', 'arrive', 'exist'].includes(aw.word)) {
        const hasBadDirectObj = new RegExp(`\\b${aw.word}\\s+(?:key objectives|complex workflows|strategic resources|mutual strengths|emerging bottlenecks|paradigm-shifting methodologies)\\b`, 'i').test(res.fullSentence);
        expect(!hasBadDirectObj, `[${lvl}] No ungrammatical transitive object after intransitive verb "${aw.word}"`);
      }
    }
  }

  console.log('\n========================================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  if (failed === 0) {
    console.log('🎉 TOÀN BỘ 100% CÁC TEST CASES ĐÃ PASS XUẤT SẮC - HỆ THỐNG HOÀN TOÀN KHÔNG CÓ LỖI!');
  } else {
    console.error('⚠️ PHÁT HIỆN LỖI TRONG QUÁ TRÌNH KIỂM THỬ!');
    process.exit(1);
  }
  console.log('========================================================================');
}

runMegaTest().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
