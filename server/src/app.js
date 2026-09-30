import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { attachUser, requireAuth, requireRole, requestId } from './middleware/auth.js';
import { rateLimit } from './middleware/rateLimit.js';
import { securityHeaders, corsOptions } from './middleware/security.js';
import { asyncHandler, apiNotFound, errorHandler } from './middleware/errorHandler.js';
import { validateBody, rules } from './middleware/validate.js';

import { seedWorkProjectData } from './db/seedData.js';
import { vocabController } from './controllers/vocabController.js';
import { patternController } from './controllers/patternController.js';
import { noteController } from './controllers/noteController.js';
import { srsController } from './controllers/srsController.js';
import { aiController } from './controllers/aiController.js';
import { backupController } from './controllers/backupController.js';
import { quizController } from './controllers/quizController.js';
import { telegramController } from './controllers/telegramController.js';
import { speakingController } from './controllers/speakingController.js';
import { gamificationController } from './controllers/gamificationController.js';
import { topicController } from './controllers/topicController.js';
import { patternCategoryController } from './controllers/patternCategoryController.js';
import { authController } from './controllers/authController.js';
import { studyTimerController } from './controllers/studyTimerController.js';
import { publicStatsController } from './controllers/publicStatsController.js';
import { systemAlarmService } from './services/systemAlarmService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDistPath = path.join(__dirname, '../../web/dist');
const mobileDistPath = path.join(__dirname, '../../mobile/dist');
const clientErrorLogPath = path.join(__dirname, '../data/client-errors.log');
const clientTrailLogPath = path.join(__dirname, '../data/client-trail.log');

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.disable('x-powered-by');

  // 1. Core middleware
  app.use(requestId);
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(attachUser);

  const authLimiter = rateLimit({
    name: 'auth',
    max: config.rateLimit.authMax,
    windowMs: config.rateLimit.authWindowMs
  });
  const apiLimiter = rateLimit({
    name: 'api',
    max: config.rateLimit.apiMax,
    windowMs: config.rateLimit.apiWindowMs
  });

  mountStaticClients(app);
  mountPublicRoutes(app, authLimiter);
  if (config.debugLogsEnabled) mountDebugLogRoutes(app);
  app.use('/api', apiLimiter, buildProtectedRouter());

  // Unknown API paths must not fall through to the SPA shell.
  app.use('/api', apiNotFound);
  mountSpaFallback(app);
  app.use(errorHandler);

  return app;
}

/**
 * Serves the built web SPA plus the Expo web export of the mobile app.
 * The mobile bundle is served with no-cache headers so a rebuild is picked up
 * immediately during device testing.
 */
function mountStaticClients(app) {
  if (fs.existsSync(webDistPath)) {
    app.use(express.static(webDistPath));
  }

  if (!fs.existsSync(mobileDistPath)) return;

  const sendFreshMobileIndex = (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(mobileDistPath, 'index.html'));
  };

  app.get('/mobile', sendFreshMobileIndex);
  app.use('/mobile', express.static(mobileDistPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || filePath.endsWith('.json')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  app.use('/_expo', express.static(path.join(mobileDistPath, '_expo'), { maxAge: '1h' }));
  app.get('/mobile/*', sendFreshMobileIndex);
}

function mountSpaFallback(app) {
  if (!fs.existsSync(webDistPath)) return;
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/mobile') || req.path.startsWith('/_expo')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

/**
 * Routes that must work without a token: health, the three ways to obtain a
 * token, and the TTS proxy (audio elements cannot send an Authorization
 * header). Everything here is rate limited.
 */
function mountPublicRoutes(app, authLimiter) {
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'LinguaVault Backend Server',
      env: config.env,
      timestamp: new Date().toISOString()
    });
  });

  app.post(
    '/api/auth/register',
    authLimiter,
    validateBody({ username: rules.username, password: rules.password, full_name: rules.fullName }),
    authController.register
  );
  app.post(
    '/api/auth/login',
    authLimiter,
    validateBody({ username: { type: 'string', required: true, max: 64, label: 'Tên đăng nhập' }, password: { type: 'string', required: true, max: 128, label: 'Mật khẩu' } }),
    authController.login
  );
  app.post('/api/auth/guest-login', authLimiter, authController.guestLogin);

  // Stateless tokens: logging out is a client-side discard, so this stays
  // reachable even with an expired token.
  app.post('/api/auth/logout', authController.logout);

  // Public Learning Statistics & Supervision (Guest accessible)
  app.get('/api/public/stats', rateLimit({ name: 'public-stats', max: 60, windowMs: 60_000 }), asyncHandler(publicStatsController.getPublicStats));
  app.get('/api/public/stats/:username', rateLimit({ name: 'public-stats', max: 60, windowMs: 60_000 }), asyncHandler(publicStatsController.getPublicStats));
  app.get('/api/public/sessions', rateLimit({ name: 'public-sessions', max: 60, windowMs: 60_000 }), asyncHandler(publicStatsController.getPublicSessions));
  app.get('/api/public/sessions/:username', rateLimit({ name: 'public-sessions', max: 60, windowMs: 60_000 }), asyncHandler(publicStatsController.getPublicSessions));
  app.post('/api/public/supervisor-feedback', rateLimit({ name: 'supervisor-feedback', max: 30, windowMs: 60_000 }), asyncHandler(publicStatsController.postSupervisorFeedback));

  app.get('/api/audio/tts', rateLimit({ name: 'tts', max: 240, windowMs: 60_000 }), asyncHandler(streamTts));
}

const ttsMemoryCache = new Map();

async function streamTts(req, res) {
  const text = String(req.query.text || '');
  const lang = String(req.query.lang || 'en-US');
  if (!text.trim()) {
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', error: 'Text is required' });
  }

  const cleanText = text.substring(0, 350).trim();
  const cacheKey = `${lang}:${cleanText.toLowerCase()}`;

  // 1. Check in-memory cache for instant < 1ms response
  if (ttsMemoryCache.has(cacheKey)) {
    const cachedBuffer = ttsMemoryCache.get(cacheKey);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    return res.send(cachedBuffer);
  }

  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const audioRes = await fetch(ttsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/'
      }
    });
    clearTimeout(timeoutId);

    if (!audioRes.ok) {
      return res.status(502).json({ success: false, code: 'UPSTREAM_ERROR', error: 'TTS upstream error' });
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cache up to 2000 frequent words in memory
    if (ttsMemoryCache.size > 2000) {
      const firstKey = ttsMemoryCache.keys().next().value;
      ttsMemoryCache.delete(firstKey);
    }
    ttsMemoryCache.set(cacheKey, buffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(buffer);
  } catch (err) {
    return res.status(504).json({ success: false, code: 'TIMEOUT', error: 'TTS upstream timeout' });
  }
}

/**
 * Crash and breadcrumb ingest for release builds on a real device, which have
 * no Metro connection and no redbox. Unauthenticated on purpose: a crash can
 * happen before login. Disabled when DEBUG_LOGS_ENABLED is off (the default in
 * production) because it is an unauthenticated writer and reader.
 */
function mountDebugLogRoutes(app) {
  const limiter = rateLimit({ name: 'logs', max: 240, windowMs: 60_000 });

  const readLog = (filePath, limit, newestFirst) => {
    if (!fs.existsSync(filePath)) return { data: [], total: 0 };
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    const slice = lines.slice(-limit);
    const rows = (newestFirst ? slice.reverse() : slice).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line };
      }
    });
    return { data: rows, total: lines.length };
  };

  const append = (filePath, record) => {
    try {
      fs.appendFileSync(filePath, JSON.stringify(record) + '\n', 'utf8');
    } catch (e) {
      console.error('Failed to persist client log:', e.message);
    }
  };

  app.post('/api/logs/client-error', limiter, (req, res) => {
    const { error, stack, componentStack, platform, userAgent, timestamp, source, isFatal } = req.body || {};
    const at = timestamp || new Date().toISOString();
    console.log('\n========================================================');
    console.log('🚨 [MOBILE CLIENT ERROR REPORTED]');
    console.log('⏰ Time:', at);
    console.log('📱 Platform:', platform || 'unknown');
    console.log('🎯 Source:', source || 'error-boundary', isFatal ? '(FATAL)' : '');
    console.log('❌ Error:', error);
    if (stack) console.log('📜 Stack Trace:\n', stack);
    if (componentStack) console.log('🧩 Component Hierarchy Stack:\n', componentStack);
    console.log('========================================================\n');

    append(clientErrorLogPath, {
      at,
      platform: platform || 'unknown',
      source: source || 'error-boundary',
      isFatal: !!isFatal,
      error,
      stack,
      componentStack,
      userAgent
    });
    res.json({ success: true, message: 'Logged successfully' });
  });

  app.get('/api/logs/client-error', (req, res) => {
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 200);
    res.json({ success: true, ...readLog(clientErrorLogPath, limit, true) });
  });

  app.post('/api/logs/client-trail', limiter, (req, res) => {
    const { step, detail, platform, timestamp } = req.body || {};
    const at = timestamp || new Date().toISOString();
    console.log(`🧭 [TRAIL] ${at} ${platform || '?'} → ${step}${detail ? ` :: ${detail}` : ''}`);
    append(clientTrailLogPath, { at, platform: platform || '?', step, detail });
    res.json({ success: true });
  });

  app.get('/api/logs/client-trail', (req, res) => {
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 50, 500);
    res.json({ success: true, ...readLog(clientTrailLogPath, limit, false) });
  });

  app.delete('/api/logs/clear', (req, res) => {
    for (const p of [clientErrorLogPath, clientTrailLogPath]) {
      if (fs.existsSync(p)) fs.writeFileSync(p, '', 'utf8');
    }
    res.json({ success: true, message: 'Đã xoá toàn bộ log debug' });
  });
}

/**
 * Every data route. The router requires a valid token up front, so no handler
 * has to decide for itself who the caller is.
 */
function buildProtectedRouter() {
  const api = express.Router();
  api.use(requireAuth);

  // Account
  api.get('/auth/me', authController.getMe);
  api.put('/auth/profile', authController.updateProfile);

  // Vocabulary
  api.get('/vocab', vocabController.getAllWords);
  api.get('/vocab/lookup', vocabController.autoLookup);
  api.get('/vocab/stats/overview', srsController.getStats);
  api.post('/vocab/seed-work', requireRole('admin'), (req, res) => {
    res.json(seedWorkProjectData(true));
  });
  api.get('/vocab/:id', vocabController.getWordById);
  api.post('/vocab', validateBody({
    word: { type: 'string', required: true, max: 120, label: 'Từ vựng' },
    meaning_vi: { type: 'string', required: true, max: 2000, label: 'Nghĩa tiếng Việt' }
  }), vocabController.createWord);
  api.put('/vocab/:id', vocabController.updateWord);
  api.delete('/vocab/:id', vocabController.deleteWord);

  // Topics & categories
  api.get('/topics', topicController.getAllTopics);
  api.post('/topics', validateBody({ name: { type: 'string', required: true, max: 120, label: 'Tên chủ đề' } }), topicController.createTopic);
  api.put('/topics/:id', topicController.updateTopic);
  api.delete('/topics/:id', topicController.deleteTopic);
  api.post('/topics/assign', topicController.assignWordTopic);

  // Sentence patterns
  api.get('/patterns', patternController.getAllPatterns);
  api.get('/patterns/:id', patternController.getPatternById);
  api.post('/patterns', validateBody({
    name: { type: 'string', required: true, max: 160, label: 'Tên mẫu câu' },
    formula: { type: 'string', required: true, max: 400, label: 'Công thức' },
    meaning_vi: { type: 'string', required: true, max: 2000, label: 'Nghĩa tiếng Việt' }
  }), patternController.createPattern);
  api.put('/patterns/:id', patternController.updatePattern);
  api.delete('/patterns/:id', patternController.deletePattern);

  api.get('/pattern-categories', patternCategoryController.getAllCategories);
  api.post('/pattern-categories', validateBody({ name: { type: 'string', required: true, max: 120, label: 'Tên nhóm' } }), patternCategoryController.createCategory);
  api.post('/pattern-categories/reset-defaults', patternCategoryController.resetToDefaults);
  api.put('/pattern-categories/:id', patternCategoryController.updateCategory);
  api.delete('/pattern-categories/:id', patternCategoryController.deleteCategory);

  // Notes & smart reader
  api.get('/notes', noteController.getAllNotes);
  api.get('/notes/:id', noteController.getNoteById);
  api.post('/notes', validateBody({
    title: { type: 'string', required: true, max: 300, label: 'Tiêu đề' },
    content: { type: 'string', required: true, label: 'Nội dung' }
  }), noteController.createNote);
  api.put('/notes/:id', noteController.updateNote);
  api.delete('/notes/:id', noteController.deleteNote);

  // SRS & dashboard
  api.get('/srs/due', srsController.getDueItems);
  api.post('/srs/review', srsController.submitReview);
  api.get('/srs/stats', srsController.getStats);
  api.get('/dashboard/stats', srsController.getStats);
  api.get('/stats', srsController.getStats);

  // AI
  api.post('/ai/parse-sentence', aiController.parseSentence);
  api.post('/ai/check-sentence', aiController.checkSentence);
  api.post('/ai/generate-story', aiController.generateStory);
  api.post('/ai/paraphrase', aiController.paraphraseSentence);
  api.post('/ai/collocations', aiController.exploreCollocations);
  api.post('/ai/dialogue', aiController.generateDialogue);
  api.post('/ai/translate-in-context', aiController.translateInContext);
  api.get('/ai/mastery-report', gamificationController.getAIMasteryReport);
  api.get('/settings', aiController.getSettings);
  api.post('/settings', aiController.saveSettings);

  // Backup & restore
  api.get('/backup/export', backupController.exportData);
  api.post('/backup/import', backupController.importData);

  // Quiz
  api.get('/quiz/topics', quizController.getTopics);
  api.get('/quiz/dates', quizController.getDates);
  api.post('/quiz/generate', quizController.generateQuiz);
  api.post('/quiz/generate-ai', quizController.generateAIQuiz);
  api.post('/quiz/generate-pattern', quizController.generatePatternQuiz);
  api.post('/quiz/generate-pattern-ai', quizController.generateAIPatternQuiz);
  api.post('/quiz/submit', quizController.submitQuiz);
  api.get('/quiz/history', quizController.getHistory);
  api.get('/quiz/history/:id', quizController.getQuizHistoryById);
  api.delete('/quiz/history/:id', quizController.deleteQuizHistory);

  // Telegram bot & daily goal
  api.get('/telegram/settings', telegramController.getSettings);
  api.post('/telegram/settings', telegramController.saveSettings);
  api.post('/telegram/test', telegramController.sendTest);
  api.get('/telegram/progress', telegramController.getProgress);
  api.post('/telegram/trigger-reminder', telegramController.triggerReminder);
  api.post('/telegram/trigger-alarm', telegramController.triggerAlarm);
  api.post('/telegram/trigger-due-reminder', telegramController.triggerDueReminder);
  api.post('/telegram/trigger-streak-saver', telegramController.triggerStreakSaver);
  api.post('/telegram/trigger-word-of-day', telegramController.triggerWordOfDay);
  api.post('/telegram/trigger-weekly-digest', telegramController.triggerWeeklyDigest);
  api.post('/telegram/trigger-leech-alert', telegramController.triggerLeechAlert);
  api.post('/telegram/trigger-backup', telegramController.triggerBackup);

  // Speaking lab
  api.get('/speaking/prompts', speakingController.getPrompts);
  api.post('/speaking/analyze-read-aloud', speakingController.analyzeReadAloud);
  api.post('/speaking/analyze-qa', speakingController.analyzeQA);

  // Gamification
  api.get('/gamification/profile', gamificationController.getProfile);
  api.post('/gamification/add-xp', gamificationController.addXp);

  // Study timer & active stopwatch tracking
  api.get('/study-timer/stats', studyTimerController.getStats);
  api.get('/study-timer/sessions', studyTimerController.getSessions);
  api.post('/study-timer/sessions', studyTimerController.saveSession);
  api.delete('/study-timer/sessions/:id', studyTimerController.deleteSession);
  api.get('/study-timer/schedules', studyTimerController.getSchedules);
  api.post('/study-timer/schedules', studyTimerController.saveSchedule);
  api.put('/study-timer/schedules/:id', studyTimerController.saveSchedule);
  api.delete('/study-timer/schedules/:id', studyTimerController.deleteSchedule);

  // OS-level alarm. These shell out on the host, so they are admin-only.
  api.post('/alarm/trigger', requireRole('admin'), (req, res) => {
    systemAlarmService.startAlarm();
    res.json({ success: true, message: 'Đã kích hoạt chuông báo thức hệ thống!' });
  });
  api.post('/alarm/stop', requireRole('admin'), (req, res) => {
    systemAlarmService.stopAlarm();
    res.json({ success: true, message: 'Đã tắt chuông báo thức hệ thống!' });
  });
  api.get('/alarm/status', (req, res) => {
    res.json({ success: true, data: systemAlarmService.getStatus() });
  });

  return api;
}
