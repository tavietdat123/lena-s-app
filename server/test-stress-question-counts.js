import { db } from './src/db/database.js';
import { quizService } from './src/services/quizService.js';
import { generateAIQuiz, generateAIPatternQuiz } from './src/services/aiService.js';
import { generateToken } from './src/services/authService.js';

async function runQuestionCountStressTest() {
  console.log('========================================================================');
  console.log('🛡️ STRESS TEST: EXACT QUESTION COUNT GUARANTEE & LIFECYCLE AUDIT');
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
  // SECTION 1: Offline Quiz Engine - Low Candidates vs High Counts
  // ---------------------------------------------------------------------------
  console.log('⚙️ SECTION 1: Offline Engine (Exact Count Guarantee & Round Robin)');

  const offlineCases = [
    { label: '1 word in DB topic -> count 15 (mixed)', topic: 'ch-i-th-', count: 15, mode: 'mixed' },
    { label: '1 word in DB topic -> count 15 (listening)', topic: 'ch-i-th-', count: 15, mode: 'listening' },
    { label: '1 word in DB topic -> count 15 (cloze_blank)', topic: 'ch-i-th-', count: 15, mode: 'cloze_blank' },
    { label: '1 word in DB topic -> count 15 (reverse_en)', topic: 'ch-i-th-', count: 15, mode: 'reverse_en' },
    { label: '1 word in DB topic -> count 15 (meaning_vi)', topic: 'ch-i-th-', count: 15, mode: 'meaning_vi' },
    { label: '4 words (2026-09-04) -> count 15', date_scope: 'specific', date: '2026-09-04', count: 15, mode: 'mixed' },
    { label: '4 words (2026-09-04) -> count 20', date_scope: 'specific', date: '2026-09-04', count: 20, mode: 'mixed' },
    { label: '30+ words -> count 15', topic: 'All', count: 15, mode: 'mixed' }
  ];

  for (const c of offlineCases) {
    const qz = quizService.generateQuiz({
      topic: c.topic || 'All',
      date_scope: c.date_scope || 'all',
      date: c.date || null,
      count: c.count,
      mode: c.mode,
      context_levels: ['b1', 'b2']
    });

    expect(qz.questions.length === c.count, `[Offline] ${c.label}: Exactly ${c.count}/${qz.questions.length} questions`);

    // Verify zero duplicate question texts
    const texts = qz.questions.map(q => q.questionText.trim().toLowerCase());
    const dups = texts.filter((t, i) => texts.indexOf(t) !== i);
    expect(dups.length === 0, `[Offline] ${c.label}: ZERO duplicate question texts across all ${c.count} questions`);

    // Verify all 4 options exist and are unique
    let allOptsValid = true;
    for (const q of qz.questions) {
      if (!Array.isArray(q.options) || q.options.length !== 4) allOptsValid = false;
      const set = new Set(q.options.map(o => String(o).trim().toLowerCase()));
      if (set.size !== 4) allOptsValid = false;
    }
    expect(allOptsValid, `[Offline] ${c.label}: Every question has strictly 4 unique options`);
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: AI Quiz Engine - Exact Count Guarantee (Live Gemini + Backfill)
  // ---------------------------------------------------------------------------
  console.log('\n🤖 SECTION 2: AI Quiz Engine (Live Gemini AI + Backfill Guarantee)');

  const aiCases = [
    { label: '4 words (2026-09-04) -> count 15 (User Exact Scenario)', date_scope: 'specific', date: '2026-09-04', count: 15, mode: 'mixed' },
    { label: '4 words (2026-09-04) -> count 20 (High Multi-round)', date_scope: 'specific', date: '2026-09-04', count: 20, mode: 'mixed' },
    { label: 'Topic "work" -> count 10', topic: 'work', count: 10, mode: 'mixed' }
  ];

  for (const c of aiCases) {
    try {
      console.log(`     Running AI generation for [${c.label}]...`);
      const aiQz = await generateAIQuiz({
        topic: c.topic || 'All',
        date_scope: c.date_scope || 'all',
        date: c.date || null,
        count: c.count,
        mode: c.mode,
        context_levels: ['b1', 'b2', 'c1_c2']
      });

      expect(aiQz.questions.length === c.count, `[AI] ${c.label}: Returned EXACTLY ${c.count}/${aiQz.questions.length} questions`);
      expect(aiQz.totalQuestions === c.count, `[AI] ${c.label}: totalQuestions metadata equals ${c.count}`);

      // Verify zero duplicate question texts
      const texts = aiQz.questions.map(q => q.questionText.trim().toLowerCase());
      const dups = texts.filter((t, i) => texts.indexOf(t) !== i);
      expect(dups.length === 0, `[AI] ${c.label}: ZERO duplicate question texts across all ${c.count} questions`);

      // Verify options
      let allOptsValid = true;
      for (const q of aiQz.questions) {
        if (!Array.isArray(q.options) || q.options.length < 2) allOptsValid = false;
        if (!q.options.some(o => String(o).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase())) {
          allOptsValid = false;
        }
      }
      expect(allOptsValid, `[AI] ${c.label}: All questions have valid options with correctAnswer`);
    } catch (err) {
      expect(false, `[AI] ${c.label} failed with error: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: Sentence Pattern Quiz Engine (Offline & AI)
  // ---------------------------------------------------------------------------
  console.log('\n🧩 SECTION 3: Sentence Pattern Quiz Engine (Low Patterns vs High Counts)');

  // Offline Pattern cases
  const patCases = [5, 10, 15];
  for (const cnt of patCases) {
    const pq = quizService.generatePatternQuiz({ count: cnt, mode: 'mixed' });
    expect(pq.questions.length === cnt, `[Pattern Offline] Requested ${cnt} -> Got EXACTLY ${pq.questions.length} questions`);
    const texts = pq.questions.map(q => q.questionText.trim().toLowerCase());
    const dups = texts.filter((t, i) => texts.indexOf(t) !== i);
    expect(dups.length === 0, `[Pattern Offline] Requested ${cnt} -> ZERO duplicate question texts`);
  }

  // AI Pattern Quiz case
  try {
    console.log('     Running AI Pattern Quiz generation for count = 6...');
    const aiPatQz = await generateAIPatternQuiz({ count: 6, mode: 'mixed' });
    expect(aiPatQz.questions.length === 6, `[Pattern AI] Requested 6 -> Got EXACTLY ${aiPatQz.questions.length} questions`);
    expect(aiPatQz.totalQuestions === 6, `[Pattern AI] totalQuestions equals 6`);
  } catch (err) {
    expect(false, `[Pattern AI] failed: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: Live HTTP API End-to-End Test (15 Questions AI Quiz)
  // ---------------------------------------------------------------------------
  console.log('\n🌐 SECTION 4: Live HTTP API End-to-End Verification');

  try {
    const apiRes = await fetch('http://localhost:5001/api/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        topic: 'All',
        date_scope: 'specific',
        date: '2026-09-04',
        count: 15,
        mode: 'mixed',
        use_ai: true,
        context_levels: ['b1', 'b2']
      })
    });

    expect(apiRes.status === 200, `POST /api/quiz/generate (use_ai: true, count: 15) returned HTTP 200`);
    const apiData = await apiRes.json();
    expect(apiData.success === true, 'Response has success: true');
    expect(apiData.data?.questions?.length === 15, `Returned EXACTLY 15 questions via API (Got: ${apiData.data?.questions?.length})`);
    expect(apiData.data?.totalQuestions === 15, `totalQuestions metadata is 15`);
    
    const historyId = apiData.data?.history_id;
    expect(Boolean(historyId), `History record auto-saved with ID: ${historyId}`);

    // Verify DB record directly
    const historyRow = db.prepare('SELECT total_questions, title, questions FROM quiz_history WHERE id = ?').get(historyId);
    expect(historyRow.total_questions === 15, `DB quiz_history.total_questions is 15 (Got: ${historyRow.total_questions})`);
    expect(historyRow.title.includes('(15 câu)'), `DB quiz_history.title is "${historyRow.title}"`);
    const savedQuestions = JSON.parse(historyRow.questions);
    expect(savedQuestions.length === 15, `DB quiz_history.questions JSON contains EXACTLY 15 questions`);

    // Verify Retake API Endpoint
    const retakeRes = await fetch(`http://localhost:5001/api/quiz/history/${historyId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const retakeData = await retakeRes.json();
    expect(retakeRes.status === 200 && retakeData.data?.questions?.length === 15, `GET /api/quiz/history/:id returns all 15 questions for retake`);

  } catch (err) {
    expect(false, `HTTP API verification failed: ${err.message}`);
  }

  console.log('\n========================================================================');
  console.log(`📊 STRESS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  if (failed === 0) {
    console.log('🎉 100% KIỂM THỬ SỐ LƯỢNG CÂU HỎI & VÒNG ĐỜI QUIZ ĐẠT CHUẨN HOÀN HẢO!');
  } else {
    console.error('⚠️ PHÁT HIỆN LỖI TRONG QUÁ TRÌNH KIỂM THỬ SỐ LƯỢNG CÂU!');
    process.exit(1);
  }
  console.log('========================================================================');
}

runQuestionCountStressTest().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
