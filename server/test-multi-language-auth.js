import { createApp } from './src/app.js';
import { initializeDatabase, getDb } from './src/db/database.js';
import assert from 'node:assert';

console.log('🧪 Starting Multi-Language Auth & Registration Verification...\n');

// 1. Initialize DB and App
initializeDatabase();
const app = createApp();

let server;
const PORT = 5098;

async function runTests() {
  server = app.listen(PORT);
  const BASE_URL = `http://127.0.0.1:${PORT}/api`;

  try {
    // -------------------------------------------------------------
    // TEST 1: Admin user backward compatibility
    // -------------------------------------------------------------
    console.log('Test 1: Admin user backwards compatibility');
    const db = getDb();
    const adminInDb = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    assert(adminInDb, 'Admin user must exist');
    assert.strictEqual(adminInDb.native_language, 'en', 'Admin native_language must default to "en"');
    assert.strictEqual(adminInDb.target_language, 'en', 'Admin target_language must default to "en"');
    console.log('  ✅ Admin user verified with native=en, target=en');

    // Admin login check
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '123456' })
    });
    const adminLoginJson = await adminLoginRes.json();
    assert(adminLoginJson.success, 'Admin login should succeed');
    assert.strictEqual(adminLoginJson.data.user.native_language, 'en');
    assert.strictEqual(adminLoginJson.data.user.target_language, 'en');
    const adminToken = adminLoginJson.data.token;
    console.log('  ✅ Admin login returns native=en, target=en');

    // -------------------------------------------------------------
    // TEST 2: Register User 1: Russian speaker learning Vietnamese (ru -> vi)
    // -------------------------------------------------------------
    // TEST 2: 2-Step Registration Flow:
    //   Step 1: Register credentials only (username, password, full_name)
    //   Step 2: Choose Language Path on Onboarding screen (ru -> vi)
    // -------------------------------------------------------------
    console.log('\nTest 2: 2-Step Registration & Language Setup Flow (ru -> vi)');
    const user1Username = `ivan_rus_${Date.now()}`;
    // Step 1: Register credentials only
    const regRes1 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user1Username,
        password: 'password123',
        full_name: 'Иван Петров'
      })
    });
    const regJson1 = await regRes1.json();
    assert(regJson1.success, `Registration 1 should succeed: ${regJson1.error}`);
    const token1 = regJson1.data.token;
    console.log('  ✅ Step 1: Account registered successfully with credentials only');

    // Step 2: Language Selection Onboarding Screen sets native=ru, target=vi
    const langSetupRes1 = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        native_language: 'ru',
        target_language: 'vi'
      })
    });
    const langSetupJson1 = await langSetupRes1.json();
    assert(langSetupJson1.success, 'Language setup should succeed');
    assert.strictEqual(langSetupJson1.data.native_language, 'ru');
    assert.strictEqual(langSetupJson1.data.target_language, 'vi');
    console.log('  ✅ Step 2: Onboarding screen successfully configured language path: ru -> vi');

    // Verify User 1 via /api/auth/me
    const meRes1 = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const meJson1 = await meRes1.json();
    assert(meJson1.success, 'GetMe 1 should succeed');
    assert.strictEqual(meJson1.data.native_language, 'ru');
    assert.strictEqual(meJson1.data.target_language, 'vi');
    assert.strictEqual(meJson1.data.full_name, 'Иван Петров');
    console.log('  ✅ User 1 /api/auth/me returns native=ru, target=vi');

    // -------------------------------------------------------------
    // TEST 3: Register User 2: English speaker learning Vietnamese (en -> vi)
    // -------------------------------------------------------------
    console.log('\nTest 3: Register User 2: English speaker learning Vietnamese (en -> vi)');
    const user2Username = `alex_en_${Date.now()}`;
    const regRes2 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user2Username,
        password: 'password123',
        full_name: 'Alex Johnson',
        native_language: 'en',
        target_language: 'vi'
      })
    });
    const regJson2 = await regRes2.json();
    assert(regJson2.success, `Registration 2 should succeed: ${regJson2.error}`);
    assert.strictEqual(regJson2.data.user.native_language, 'en');
    assert.strictEqual(regJson2.data.user.target_language, 'vi');
    console.log('  ✅ User 2 successfully registered with native=en, target=vi');

    // -------------------------------------------------------------
    // TEST 4: Register User 3: Vietnamese speaker learning English (vi -> en)
    // -------------------------------------------------------------
    console.log('\nTest 4: Register User 3: Vietnamese speaker learning English (vi -> en)');
    const user3Username = `minh_vi_${Date.now()}`;
    const regRes3 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user3Username,
        password: 'password123',
        full_name: 'Nguyễn Văn Minh',
        native_language: 'vi',
        target_language: 'en'
      })
    });
    const regJson3 = await regRes3.json();
    assert(regJson3.success, `Registration 3 should succeed: ${regJson3.error}`);
    assert.strictEqual(regJson3.data.user.native_language, 'vi');
    assert.strictEqual(regJson3.data.user.target_language, 'en');
    console.log('  ✅ User 3 successfully registered with native=vi, target=en');

    // -------------------------------------------------------------
    // TEST 5: Strict Multi-Tenant Data Isolation
    // -------------------------------------------------------------
    console.log('\nTest 5: Multi-Tenant Data Isolation');
    // User 1 fetches vocabulary - should be 0 words initially
    const wordsRes1 = await fetch(`${BASE_URL}/vocab`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const wordsJson1 = await wordsRes1.json();
    assert(wordsJson1.success);
    assert.strictEqual(wordsJson1.data.length, 0, 'New user must start with 0 words');
    console.log('  ✅ User 1 starts with clean 0 words (does NOT see admin words)');

    // User 1 adds a Vietnamese word to learn: "kiên trì"
    const addWordRes1 = await fetch(`${BASE_URL}/vocab`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        word: 'kiên trì',
        phonetic: '/kiən1 tʃi2/',
        part_of_speech: 'adjective',
        meaning_vi: 'настойчивость, упорство (perseverance)',
        meaning_en: 'Continuing to do something despite difficulties',
        examples: ['Anh ấy kiên trì học tập mỗi ngày.'],
        collocations: ['rất kiên trì', 'kiên trì bền bỉ'],
        level: 'B1'
      })
    });
    const addWordJson1 = await addWordRes1.json();
    assert(addWordJson1.success, `Adding word should succeed: ${addWordJson1.error}`);
    const addedWordId = addWordJson1.data.id;
    console.log('  ✅ User 1 added Vietnamese word: "kiên trì"');

    // User 1 fetches words now - should have exactly 1 word
    const wordsAfterRes1 = await fetch(`${BASE_URL}/vocab`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const wordsAfterJson1 = await wordsAfterRes1.json();
    assert.strictEqual(wordsAfterJson1.data.length, 1);
    assert.strictEqual(wordsAfterJson1.data[0].word, 'kiên trì');
    console.log('  ✅ User 1 sees their Vietnamese word');

    // Admin fetches words - should NOT see User 1's "kiên trì"
    const adminWordsRes = await fetch(`${BASE_URL}/vocab`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminWordsJson = await adminWordsRes.json();
    const hasWord = adminWordsJson.data.some(w => w.id === addedWordId);
    assert(!hasWord, 'Admin must NOT see User 1 private word');
    console.log('  ✅ Admin data is completely isolated from User 1');

    // -------------------------------------------------------------
    // TEST 6: Update Profile (Changing Languages)
    // -------------------------------------------------------------
    console.log('\nTest 6: Update Profile with Language Preferences');
    const updateRes1 = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        full_name: 'Иван Петров (Обновлено)',
        native_language: 'ru',
        target_language: 'vi'
      })
    });
    const updateJson1 = await updateRes1.json();
    assert(updateJson1.success);
    assert.strictEqual(updateJson1.data.full_name, 'Иван Петров (Обновлено)');
    assert.strictEqual(updateJson1.data.native_language, 'ru');
    assert.strictEqual(updateJson1.data.target_language, 'vi');
    assert.strictEqual(updateJson1.data.target_language_locked, true);
    console.log('  ✅ User 1 successfully updated profile with language preferences');

    // TEST 6b: Attempting to change target_language (from vi to en) MUST be blocked/ignored!
    // But changing native_language (app interface language, e.g. ru to en) MUST succeed.
    console.log('\nTest 6b: Verify target_language is locked & only app language can change');
    const lockTestRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({
        native_language: 'en',
        target_language: 'en' // illegal attempt to change learning language
      })
    });
    const lockTestJson = await lockTestRes.json();
    assert(lockTestJson.success);
    assert.strictEqual(lockTestJson.data.native_language, 'en', 'App UI language should change to en');
    assert.strictEqual(lockTestJson.data.target_language, 'vi', 'Target learning language MUST stay locked to vi!');
    assert.strictEqual(lockTestJson.data.target_language_locked, true);
    console.log('  ✅ Target language is permanently locked (remained "vi"), only app language changed to "en"');

    // -------------------------------------------------------------
    // TEST 7: Audio TTS with Vietnamese Text
    // -------------------------------------------------------------
    console.log('\nTest 7: Audio TTS Proxy with vi-VN');
    const ttsRes = await fetch(`${BASE_URL}/audio/tts?lang=vi-VN&text=${encodeURIComponent('xin chào các bạn')}`);
    assert(ttsRes.ok, `TTS response should be OK: ${ttsRes.status}`);
    const contentType = ttsRes.headers.get('content-type');
    assert(contentType && contentType.includes('audio'), `Content-Type should be audio: ${contentType}`);
    const audioBuffer = await ttsRes.arrayBuffer();
    assert(audioBuffer.byteLength > 100, `Audio buffer should contain bytes: ${audioBuffer.byteLength}`);
    console.log(`  ✅ Audio TTS proxy for Vietnamese (vi-VN) returned ${audioBuffer.byteLength} bytes`);

    console.log('\n======================================================');
    console.log('🎉 ALL MULTI-LANGUAGE AUTH & LEARNING TESTS PASSED 100%!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  if (server) server.close();
  process.exit(1);
});
