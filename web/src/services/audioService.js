/**
 * Smart Audio pronunciation service with Granular Speed Control (0.5x - 1.5x)
 * Supports Native MP3 + Web Speech Synthesis API (US / UK Accents)
 */

const AUDIO_SPEED_KEY = 'linguavault_audio_speed';
const AUDIO_ACCENT_KEY = 'linguavault_audio_accent';
const AUDIO_ENGINE_VERSION_KEY = 'linguavault_audio_engine_version';
const AUDIO_ENGINE_VERSION = 'natural-web-v2';

const storedAudioSpeed = parseFloat(localStorage.getItem(AUDIO_SPEED_KEY));
const storedEngineIsCurrent = localStorage.getItem(AUDIO_ENGINE_VERSION_KEY) === AUDIO_ENGINE_VERSION;
let globalAudioSpeed = storedEngineIsCurrent && !isNaN(storedAudioSpeed) ? storedAudioSpeed : 1.0;
let globalAudioAccent = localStorage.getItem(AUDIO_ACCENT_KEY) || 'en-US';

if (!storedEngineIsCurrent) {
  localStorage.setItem(AUDIO_SPEED_KEY, '1');
  localStorage.setItem(AUDIO_ENGINE_VERSION_KEY, AUDIO_ENGINE_VERSION);
}

let availableVoices = [];
let currentActiveAudio = null;
let currentSpeechUtterance = null;

// Preload and cache voices with continuous detection
const loadVoices = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length > 0) {
        availableVoices = voices;
      }
    } catch (e) {}
  }
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
  if (availableVoices.length === 0) {
    const timer = setInterval(() => {
      loadVoices();
      if (availableVoices.length > 0) clearInterval(timer);
    }, 150);
    setTimeout(() => clearInterval(timer), 3000);
  }
}

export const setGlobalAudioSpeed = (speed) => {
  const num = parseFloat(speed);
  if (!isNaN(num) && num >= 0.4 && num <= 2.0) {
    globalAudioSpeed = Math.round(num * 100) / 100;
    localStorage.setItem(AUDIO_SPEED_KEY, globalAudioSpeed.toString());
    localStorage.setItem(AUDIO_ENGINE_VERSION_KEY, AUDIO_ENGINE_VERSION);
  }
  return globalAudioSpeed;
};

export const getGlobalAudioSpeed = () => globalAudioSpeed;

export const setGlobalAudioAccent = (accent) => {
  if (accent === 'en-US' || accent === 'en-GB') {
    globalAudioAccent = accent;
    localStorage.setItem(AUDIO_ACCENT_KEY, accent);
  }
  return globalAudioAccent;
};

export const getGlobalAudioAccent = () => globalAudioAccent;

let globalTargetLanguage = 'en';

export const setGlobalTargetLanguage = (targetLang) => {
  if (targetLang === 'vi' || targetLang === 'en') {
    globalTargetLanguage = targetLang;
  }
  return globalTargetLanguage;
};

export const getGlobalTargetLanguage = () => globalTargetLanguage;

/**
 * Disqualifies outdated/robotic/novelty macOS & Windows voices
 * such as Alex, Fred, Victoria, Ralph, Zarvox, Trinoids, etc.
 */
const ROBOTIC_VOICE_REGEX = /alex|fred|victoria|ralph|zarvox|trinoids|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|junior|kathy|organ|princess|whisper|compact|espeak/i;

/**
 * Get the best matching natural/studio voice for the given accent
 */
const getVoiceForAccent = (targetLang) => {
  if (availableVoices.length === 0) {
    loadVoices();
  }

  const normalizedTarget = (targetLang || 'en-US').replace('_', '-').toLowerCase();

  // 1. Vietnamese Voice Matching (vi-VN)
  if (normalizedTarget.startsWith('vi')) {
    const viVoices = availableVoices.filter((voice) =>
      String(voice.lang || '').replace('_', '-').toLowerCase().startsWith('vi')
    );
    if (viVoices.length > 0) {
      const best = viVoices.find(v => /google|linh|mai|an|natural|premium/i.test(`${v.name} ${v.voiceURI}`)) || viVoices[0];
      return best;
    }
    return null;
  }

  // 2. Russian Voice Matching (ru-RU)
  if (normalizedTarget.startsWith('ru')) {
    const ruVoices = availableVoices.filter((voice) =>
      String(voice.lang || '').replace('_', '-').toLowerCase().startsWith('ru')
    );
    if (ruVoices.length > 0) {
      return ruVoices[0];
    }
    return null;
  }

  // 3. English Natural Voice Matching (en-US / en-GB)
  const isUK = normalizedTarget === 'en-gb';

  // High-fidelity natural voices
  const topTierRegex = isUK
    ? /google uk|daniel \(enhanced\)|oliver|serena|sonia|stephanie|kate|hazel|george|libby/i
    : /google us|samantha \(enhanced\)|ava \(premium\)|ava|jenny|aria|guy|allison|samantha|joanna|kendra|zoe|tom/i;

  const scoreVoice = (voice) => {
    const normalizedLang = String(voice.lang || '').replace('_', '-').toLowerCase();
    if (!normalizedLang.startsWith('en')) return -2000;
    
    const descriptor = `${voice.name || ''} ${voice.voiceURI || ''}`;
    
    // Penalize robotic/mechanical voices heavily
    if (ROBOTIC_VOICE_REGEX.test(descriptor)) return -1000;

    let score = 0;
    if (normalizedLang === normalizedTarget) score += 150;
    else if (normalizedLang.startsWith('en')) score += 30;

    if (topTierRegex.test(descriptor)) score += 100;
    if (/natural|premium|enhanced|neural/i.test(descriptor)) score += 80;
    if (/google/i.test(descriptor)) score += 60;
    if (voice.localService) score += 15;
    if (voice.default) score += 5;

    return score;
  };

  const englishVoices = availableVoices.filter((voice) =>
    String(voice.lang || '').toLowerCase().startsWith('en')
  );

  if (englishVoices.length === 0) return null;

  return englishVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
};

let globalPlaybackSessionId = 0;

const stopCurrentPlayback = () => {
  globalPlaybackSessionId++;
  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
      currentActiveAudio.src = '';
    } catch (e) {}
    currentActiveAudio = null;
  }
  currentSpeechUtterance = null;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
};

const playHtmlAudio = (sourceUrl, rate, onFailure = null) => {
  const sessionId = globalPlaybackSessionId;
  let started = false;
  let failed = false;
  
  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.src = '';
    } catch (e) {}
    currentActiveAudio = null;
  }

  const audio = new Audio();
  currentActiveAudio = audio;
  audio.preload = 'auto';
  audio.playbackRate = rate;

  const fail = () => {
    if (sessionId !== globalPlaybackSessionId) return;
    if (started || failed) return;
    failed = true;
    clearTimeout(startTimeout);
    try { audio.pause(); audio.src = ''; } catch (e) {}
    if (currentActiveAudio === audio) currentActiveAudio = null;
    if (onFailure) onFailure();
  };
  
  // 900ms max waiting for network stream
  const startTimeout = setTimeout(fail, 900);

  audio.onplaying = () => {
    if (sessionId !== globalPlaybackSessionId) {
      try { audio.pause(); audio.src = ''; } catch (e) {}
      return;
    }
    started = true;
    clearTimeout(startTimeout);
  };
  audio.onerror = fail;
  audio.onended = () => {
    clearTimeout(startTimeout);
    if (currentActiveAudio === audio) currentActiveAudio = null;
  };
  audio.src = sourceUrl;
  audio.play().catch(fail);
};

const playFreeServerTts = (text, targetLang, targetRate) => {
  if (!text) return;
  const ttsUrl = `/api/audio/tts?text=${encodeURIComponent(text.substring(0, 350))}&lang=${encodeURIComponent(targetLang)}`;
  playHtmlAudio(ttsUrl, targetRate);
};

export const speakText = (text, lang = null, rate = null, onFailure = null) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return false;

  const sessionId = globalPlaybackSessionId;
  const rawText = String(text || '').trim();
  if (!rawText) return false;

  const isSingleWord = !rawText.includes(' ');
  const targetRate = rate !== null ? parseFloat(rate) : globalAudioSpeed;
  
  // 1. Phân loại theo cấu trúc ngữ pháp để tối ưu phát âm:
  // - Từ đơn: tốc độ 0.92x (nếu user đặt 1.0x) + dấu chấm ngắt câu để mở rộng bộ đệm âm vị, bung trọn âm bật/âm gió kết thúc (/d/, /t/, /s/, /z/, /k/, /v/, /θ/)
  // - Câu / Đoạn văn: giữ nguyên tốc độ tự nhiên 1.0x (hoặc theo thanh trượt của người dùng), giữ trọn vẹn ngữ điệu lên/xuống giọng bản xứ
  const safeRate = !isNaN(targetRate)
    ? (isSingleWord && targetRate === 1.0 ? 0.92 : Math.max(0.5, Math.min(1.8, targetRate)))
    : 0.92;

  // Xử lý dấu kết thúc thông minh (tránh double period '..')
  let speechText = rawText;
  if (isSingleWord) {
    speechText = /[.!?]$/.test(rawText) ? rawText : `${rawText}.`;
  }

  const targetLang = lang || globalAudioAccent;
  const matchedVoice = getVoiceForAccent(targetLang);

  // 2. Chia nhỏ đoạn văn dài (> 180 ký tự) để chống lỗi đứng hình 15s kinh điển của Web Speech API
  const splitSentences = (longStr) => {
    if (longStr.length <= 180) return [longStr];
    const matches = longStr.match(/[^.!?\n]+[.!?\n]*/g);
    return matches && matches.length > 0 ? matches.map(s => s.trim()).filter(Boolean) : [longStr];
  };

  const chunks = splitSentences(speechText);

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    let chunkIndex = 0;

    const playNextChunk = () => {
      if (chunkIndex >= chunks.length || sessionId !== globalPlaybackSessionId) {
        currentSpeechUtterance = null;
        return;
      }

      const chunkText = chunks[chunkIndex];
      chunkIndex++;

      const utterance = new SpeechSynthesisUtterance(chunkText);
      currentSpeechUtterance = utterance;
      utterance.lang = matchedVoice?.lang || targetLang;
      utterance.rate = safeRate;
      utterance.pitch = 1.0;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        if (sessionId === globalPlaybackSessionId) {
          playNextChunk();
        }
      };

      utterance.onerror = (e) => {
        if (sessionId === globalPlaybackSessionId && chunkIndex === 1 && onFailure) {
          onFailure();
        }
      };

      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    };

    playNextChunk();
    return true;
  } catch (error) {
    currentSpeechUtterance = null;
    return false;
  }
};

export const playAudio = (text, audioUrl = null, lang = null, rate = null) => {
  if (!text && !audioUrl) return;

  const parsedRate = rate !== null ? parseFloat(rate) : globalAudioSpeed;
  const targetRate = !isNaN(parsedRate) ? Math.max(0.5, Math.min(1.8, parsedRate)) : 1.0;
  const defaultLang = globalTargetLanguage === 'vi' ? 'vi-VN' : globalAudioAccent;
  const targetLang = lang || defaultLang;
  const cleanText = (text || '').trim();

  // Atomically cancel any active sound before starting the new one
  stopCurrentPlayback();
  const currentSession = globalPlaybackSessionId;

  // 1. Instant Natural Browser Speech Synthesis
  if (cleanText && typeof window !== 'undefined' && window.speechSynthesis) {
    const started = speakText(cleanText, targetLang, targetRate, () => {
      if (currentSession !== globalPlaybackSessionId) return;
      playFreeServerTts(cleanText, targetLang, targetRate);
    });
    if (started) return;
  }

  // 2. Fallback: Server HD Studio Audio
  if (cleanText) {
    playFreeServerTts(cleanText, targetLang, targetRate);
    return;
  }

  // 3. Fallback: Raw audioUrl if provided
  if (audioUrl && audioUrl.trim()) {
    playHtmlAudio(audioUrl, targetRate);
  }
};

// ==========================================
// 🎮 Web Audio Synthesizer Sound Effects (Game & Quiz)
// ==========================================
let sfxAudioCtx = null;

const getSfxAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sfxAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      sfxAudioCtx = new AudioContext();
    }
  }
  if (sfxAudioCtx && sfxAudioCtx.state === 'suspended') {
    sfxAudioCtx.resume();
  }
  return sfxAudioCtx;
};

export const playTapSound = () => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
};

export const playCorrectSound = () => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const notes = [523.25, 783.99, 1046.50]; // C5 -> G5 -> C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.28, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        } catch (e) {}
      }, idx * 65);
    });
  } catch (e) {}
};

export const playWrongSound = () => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
};

export const playStreakSound = (combo = 3) => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const baseNotes = [440, 554.37, 659.25, 880]; // A major arpeggio
    baseNotes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.32, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.28);
        } catch (e) {}
      }, idx * 60);
    });
  } catch (e) {}
};

export const playVictorySound = () => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    fanfare.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch (e) {}
      }, idx * 100);
    });
  } catch (e) {}
};

export const audioService = {
  play: (text, audioUrl, lang, rate) => playAudio(text, audioUrl, lang, rate),
  speak: (text, lang, rate) => playAudio(text, null, lang, rate),
  playAudio,
  speakText,
  stop: stopCurrentPlayback,
  stopPlayback: stopCurrentPlayback,
  playTapSound,
  playCorrectSound,
  playWrongSound,
  playStreakSound,
  playVictorySound,
  setSpeed: setGlobalAudioSpeed,
  getSpeed: getGlobalAudioSpeed,
  setAccent: setGlobalAudioAccent,
  getAccent: getGlobalAudioAccent,
  setTargetLanguage: setGlobalTargetLanguage,
  getTargetLanguage: getGlobalTargetLanguage
};

export const stopPlayback = stopCurrentPlayback;
export default audioService;
