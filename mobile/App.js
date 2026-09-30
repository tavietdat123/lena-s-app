import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Modal,
  Animated,
  Easing,
  KeyboardAvoidingView,
  RefreshControl,
  PanResponder,
  AppState,
  BackHandler } from
'react-native';
import * as Speech from 'expo-speech';
import { Audio as ExpoAudio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileApi, getServerUrl, setServerUrl } from './src/services/api';
import { API_ENDPOINT } from './src/config';
import {
  addAlarmNotificationListeners,
  cancelDailyAlarm,
  getInitialAlarmNotificationResponse,
  isValidAlarmTime,
  loadAlarmConfig,
  markAlarmChallengeCompleted,
  saveAlarmConfig,
  scheduleAlarmTest,
  scheduleDailyAlarm,
  setAlarmChallengeActive,
  shouldRestoreAlarmChallenge
} from './src/services/alarmService';
import {
  IconHome,
  IconZap,
  IconBookOpen,
  IconLayers,
  IconFileText,
  IconSparkles,
  IconPlus,
  IconSettings,
  IconVolume2,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconFlame,
  IconMenu,
  IconX,
  IconCheck,
  IconArrowRight,
  IconSun,
  IconMoon,
  IconTarget,
  IconBell,
  IconMic,
  IconAward,
  IconEdit,
  IconClose,
  IconMessageSquare,
  IconCopy,
  IconCheckCircle,
  IconTrophy,
  IconPuzzle,
  IconHeadphones,
  IconRotateCw,
  IconLightbulb,
  IconFolder,
  IconStar,
  IconDiamond,
  IconCircleDot,
  IconCheckCircle2,
  IconXCircle,
  IconKeyboard,
  IconBarChart,
  IconClock,
  IconPlay,
  IconPause,
  IconSquare,
  IconEye,
  IconEyeOff } from
'./src/components/VectorIcons';

const { width } = Dimensions.get('window');

// =========================================================================
// ON-DEVICE DEBUG LAYER
// A release IPA has no redbox and no Metro connection, and React error
// boundaries only catch errors thrown during render. A fatal error in an async
// callback, an event handler or a native module escapes the boundary and leaves
// a black screen. This layer captures those, shows them on the phone itself,
// and mirrors them to the server together with a breadcrumb trail.
// Set to false to restore stock crash behaviour.
// =========================================================================
const DEBUG_ON_DEVICE = true;

const debugServerBase = () => {
  try {
    return typeof getServerUrl === 'function' ? getServerUrl() : API_ENDPOINT;
  } catch (e) {
    return API_ENDPOINT;
  }
};

const postDebug = (route, payload) => {
  try {
    fetch(`${debugServerBase()}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, platform: Platform.OS, timestamp: new Date().toISOString() })
    }).catch(() => {});
  } catch (e) {}
};

// Breadcrumb: the last step that arrives on the server tells us where execution
// stopped, which is the only signal available when a native crash kills the JS.
const trace = (step, detail) => {
  if (!DEBUG_ON_DEVICE) return;
  console.log(`[TRACE] ${step}`, detail == null ? '' : detail);
  postDebug('/api/logs/client-trail', { step, detail: detail == null ? null : String(detail) });
};

const reportFatalToServer = (error, source, isFatal) => {
  postDebug('/api/logs/client-error', {
    error: error?.message || String(error),
    stack: error?.stack || '',
    source,
    isFatal: !!isFatal
  });
};

// Fatal error store — the overlay below subscribes so the error becomes readable
// on the device instead of turning the screen black.
let fatalListener = null;
let pendingFatal = null;
const publishFatal = (record) => {
  pendingFatal = record;
  if (fatalListener) fatalListener(record);
};
const subscribeFatal = (fn) => {
  fatalListener = fn;
  return () => {
    fatalListener = null;
  };
};

if (typeof ErrorUtils !== 'undefined' && ErrorUtils.setGlobalHandler) {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('[GLOBAL JS ERROR]', isFatal ? '(FATAL)' : '', error);
    reportFatalToServer(error, 'global-handler', isFatal);
    // Deliberately not delegating to the default handler: in a release build it
    // calls RCTFatal, which kills the app to a black screen before the error can
    // be read. Showing the overlay keeps the app inspectable on the device.
    if (DEBUG_ON_DEVICE) {
      publishFatal({
        message: error?.message || String(error),
        stack: error?.stack || '',
        isFatal: !!isFatal
      });
    }
  });
}

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('error', (e) => reportFatalToServer(e?.error || e?.message, 'window-onerror', true));
  window.addEventListener('unhandledrejection', (e) => reportFatalToServer(e?.reason, 'unhandled-rejection', false));
}

trace('bundle-loaded', Platform.OS);

// Themes Definition
const themes = {
  dark: {
    isDark: true,
    bg: '#070a13',
    card: '#111827',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    innerCard: '#0d1322',
    inputBg: '#0a0f1d',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    topBarBg: '#070a13',
    bottomBarBg: '#0a0f1d',
    drawerBg: '#0d1322',
    drawerCardBg: '#131b2e',
    statusBarStyle: 'light-content',
    accent: '#38bdf8',
    accentPill: 'rgba(56, 189, 248, 0.15)',
    accentPillBorder: 'rgba(56, 189, 248, 0.35)',
    btnPrimaryBg: '#0284c7',
    btnPrimaryText: '#ffffff',
    formulaBg: '#0a0f1d',
    exampleBg: 'rgba(56, 189, 248, 0.08)',
    exampleBorder: '#38bdf8',
    exampleText: '#e2e8f0'
  },
  light: {
    isDark: false,
    bg: '#f8fafc',
    card: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    innerCard: '#f1f5f9',
    inputBg: '#f8fafc',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    topBarBg: '#ffffff',
    bottomBarBg: '#ffffff',
    drawerBg: '#ffffff',
    drawerCardBg: '#f1f5f9',
    statusBarStyle: 'dark-content',
    accent: '#0284c7',
    accentPill: 'rgba(2, 132, 199, 0.1)',
    accentPillBorder: 'rgba(2, 132, 199, 0.25)',
    btnPrimaryBg: '#0284c7',
    btnPrimaryText: '#ffffff',
    formulaBg: '#f1f5f9',
    exampleBg: 'rgba(2, 132, 199, 0.06)',
    exampleBorder: '#0284c7',
    exampleText: '#1e293b'
  }
};

// Bảng Bậc Thang Cấp Độ Học Thuật & EXP 16 Cấp Độ Pro
export const MOBILE_LEVEL_LADDER = [
// 🥉 BRONZE TIER (Cơ Bản & Nhập Môn: A1 - A2)
{ level: 1, minXp: 0, maxXp: 300, title: 'Novice Scholar 🌱', tier: 'Bronze I', perk: 'Khởi đầu hành trình nạp vốn từ vựng cơ bản' },
{ level: 2, minXp: 300, maxXp: 800, title: 'Word Seeker 🔍', tier: 'Bronze II', perk: 'Nhận diện & bóc tách cấu trúc câu cơ bản' },
{ level: 3, minXp: 800, maxXp: 1500, title: 'Lexical Apprentice 🌿', tier: 'Bronze III', perk: 'Mở khóa phân tích sâu Collocations & Ngữ cảnh' },
{ level: 4, minXp: 1500, maxXp: 2500, title: 'Vocab Explorer 📘', tier: 'Bronze IV', perk: 'Kích hoạt thử thách Topic Quiz & Active Recall' },

// 🥈 SILVER TIER (Chuyên Cần & Mở Rộng: B1 - B2)
{ level: 5, minXp: 2500, maxXp: 4000, title: 'Memory Strategist ⚡', tier: 'Silver I', perk: 'Tối ưu hóa chu kỳ lặp lại ngắt quãng SM-2' },
{ level: 6, minXp: 4000, maxXp: 6000, title: 'Fluent Challenger 🎯', tier: 'Silver II', perk: 'Phản xạ trắc nghiệm tốc độ cao & cấu trúc câu' },
{ level: 7, minXp: 6000, maxXp: 8500, title: 'Articulate Speaker 🎙️', tier: 'Silver III', perk: 'Làm chủ phát âm & ngữ điệu trong AI Speaking Lab' },
{ level: 8, minXp: 8500, maxXp: 11500, title: 'Idiom Navigator 🧭', tier: 'Silver IV', perk: 'Thấu hiểu thành ngữ & cụm động từ tự nhiên' },

// 🥇 GOLD TIER (Thành Thạo & Chuyên Sâu: C1)
{ level: 9, minXp: 11500, maxXp: 15500, title: 'Vault Master 💎', tier: 'Gold I', perk: 'Làm chủ kho 1000+ từ vựng & cấu trúc nâng cao' },
{ level: 10, minXp: 15500, maxXp: 20500, title: 'Eloquent Orator 👑', tier: 'Gold II', perk: 'Chuyên gia phản xạ đối thoại lưu loát đa chủ đề' },
{ level: 11, minXp: 20500, maxXp: 26500, title: 'Rhetoric Architect 🏛️', tier: 'Gold III', perk: 'Kiến tạo câu văn học thuật & sắc thái nâng cao' },
{ level: 12, minXp: 26500, maxXp: 33500, title: 'Linguistic Sage 🔮', tier: 'Gold IV', perk: 'Cảm thụ tinh tế văn phong & ngữ nghĩa phức hợp' },

// 💎 DIAMOND & GRANDMASTER TIER (Bậc Thầy & Huyền Thoại: C2+)
{ level: 13, minXp: 33500, maxXp: 42000, title: 'Polyglot Champion ⚔️', tier: 'Diamond I', perk: 'Khả năng ghi nhớ siêu tốc không rào cản' },
{ level: 14, minXp: 42000, maxXp: 52000, title: 'Lexical Titan 🛡️', tier: 'Diamond II', perk: 'Tư duy trực tiếp hoàn toàn bằng tiếng Anh' },
{ level: 15, minXp: 52000, maxXp: 65000, title: 'Supreme Scholar 🌌', tier: 'Diamond III', perk: 'Bậc thầy ngôn ngữ, thấu triệt 100% văn cảnh' },
{ level: 16, minXp: 65000, maxXp: 999999, title: 'Linguistic Grandmaster 🏆', tier: 'Legendary', perk: 'Huyền Thoại Bậc Thầy Ngôn Ngữ Vô Song' }];


// Helper: Remove Vietnamese Tones for Accent-Insensitive Smart Search
export const removeVietnameseTones = (str) => {
  if (!str) return '';
  let s = String(str);
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  s = s.replace(/Đ/g, 'D');
  s = s.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '');
  s = s.replace(/\u02C6|\u0306|\u031B/g, '');
  return s;
};

// Dynamic Audio Player for Mobile with Granular Speed & Accent
let globalMobileSpeed = 0.9;
let globalMobileAccent = 'en-US';
let mobileCachedVoices = [];
let nativeCachedVoices = null;
let activeAudioElement = null;
let activeSoundObject = null;
const AUDIO_SPEED_STORAGE_KEY = 'linguavault_audio_speed';
const AUDIO_ACCENT_STORAGE_KEY = 'linguavault_audio_accent';

if (typeof window !== 'undefined' && window.speechSynthesis) {
  const loadVoices = () => {
    mobileCachedVoices = window.speechSynthesis.getVoices() || [];
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Global iOS Audio Session Configuration for Silent Mode Playback
if (Platform.OS !== 'web' && ExpoAudio && ExpoAudio.setAudioModeAsync) {
  ExpoAudio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false
  }).catch(() => {});
}

const sanitizeSpeechText = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let str = raw.trim();
  // Strip attached Vietnamese text in parens if any (e.g. '(Né tránh, tránh xa)')
  str = str.replace(/\s*\([^)]*[\u00C0-\u024F\u1EA0-\u1EF9][^)]*\)/gi, '');
  // Strip part of speech in brackets (e.g. '[noun]', '[verb]')
  str = str.replace(/\s*\[(noun|verb|adjective|adverb|adj|adv|idiom|collocation|phrasal verb)\]/gi, '');
  if (str.startsWith('/') && str.endsWith('/')) {
    str = str.slice(1, -1);
  }
  return str.trim();
};

const playMobileAudio = async (wordText, rate = null, lang = null) => {
  if (!wordText || typeof wordText !== 'string' || !wordText.trim()) return;
  const cleanText = sanitizeSpeechText(wordText) || wordText.trim();
  const speechText = /[.!?]$/.test(cleanText) ? cleanText : `${cleanText}.`;
  const isSingleWord = !cleanText.includes(' ');
  const targetRate = Math.max(0.5, Math.min(1.8, rate !== null ? parseFloat(rate) : (isSingleWord ? 0.92 : globalMobileSpeed)));
  const targetLang = lang || globalMobileAccent || 'en-US';
  const isUK = targetLang === 'en-GB';
  const baseUrl = mobileApi?.getBaseUrl ? mobileApi.getBaseUrl() : API_ENDPOINT;
  const ttsUrl = `${baseUrl}/api/audio/tts?text=${encodeURIComponent(cleanText.substring(0, 350))}&lang=${encodeURIComponent(targetLang)}`;
  const directGoogleTts = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(targetLang)}&client=tw-ob&q=${encodeURIComponent(cleanText.substring(0, 350))}`;

  // 1. MP3 Audio Stream Fallback (High-definition human audio via Server or Direct Google CDN)
  const playMobileMp3 = async () => {
    try {
      if (activeSoundObject) {
        const previousSound = activeSoundObject;
        activeSoundObject = null;
        await previousSound.stopAsync().catch(() => {});
        await previousSound.unloadAsync().catch(() => {});
      }

      // Ensure iOS audio mode plays even if the physical silent switch is flipped to mute
      if (Platform.OS !== 'web' && ExpoAudio && ExpoAudio.setAudioModeAsync) {
        await ExpoAudio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false
        }).catch(() => {});
      }

      const streamUrls = [ttsUrl, directGoogleTts];
      let loadedSound = null;

      for (const uri of streamUrls) {
        try {
          const res = await ExpoAudio.Sound.createAsync(
            { uri },
            {
              shouldPlay: true,
              rate: targetRate,
              shouldCorrectPitch: true,
              volume: 1.0
            }
          );
          if (res && res.sound) {
            loadedSound = res.sound;
            break;
          }
        } catch (soundErr) {
          console.warn('[TTS] MP3 stream URL failed:', uri, soundErr?.message);
        }
      }

      if (loadedSound) {
        activeSoundObject = loadedSound;
        loadedSound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded || !status.didJustFinish) return;
          if (activeSoundObject === loadedSound) activeSoundObject = null;
          loadedSound.unloadAsync().catch(() => {});
        });
      }
    } catch (e) {
      console.warn('[TTS] Mobile MP3 Stream fallback error:', e);
    }
  };

  // 2. Native iOS / Android: Direct Native High-Definition Speech Engine (AVSpeechSynthesizer)
  if (Platform.OS !== 'web') {
    let nativeSpeechStarted = false;
    try {
      if (Speech && typeof Speech.speak === 'function') {
        const isSpeaking = await Speech.isSpeakingAsync().catch(() => false);
        if (isSpeaking) {
          await Speech.stop().catch(() => {});
          await new Promise(r => setTimeout(r, 60));
        }

        Speech.speak(speechText, {
          language: targetLang,
          rate: Math.min(1.0, targetRate), // iOS normal rate is 1.0
          pitch: 1.0,
          onStart: () => {
            nativeSpeechStarted = true;
          },
          onError: (error) => {
            console.warn('[TTS] Native speech error, fallback to MP3:', error);
            playMobileMp3();
          }
        });

        // Watchdog for iOS: if AVSpeechSynthesizer doesn't start in 450ms, play MP3 fallback
        setTimeout(() => {
          if (!nativeSpeechStarted) {
            Speech.isSpeakingAsync().then(speaking => {
              if (!speaking) {
                console.warn('[TTS] iOS speech did not start, activating MP3 stream');
                playMobileMp3();
              }
            }).catch(() => playMobileMp3());
          }
        }, 450);
        return;
      }
    } catch (nativeVoiceError) {
      console.warn('[TTS] Native voice error:', nativeVoiceError);
    }

    // Fallback to MP3 stream if native Speech module is unavailable
    await playMobileMp3();
    return;
  }

  // 3. Web & Mobile Safari on iOS / Electron: Instant Natural Speech Synthesis + HTML5 Audio Fallback
  const playWebAudioFallback = () => {
    try {
      if (typeof Audio !== 'undefined') {
        const audio = new Audio(ttsUrl);
        audio.playbackRate = targetRate;
        audio.play().catch(() => {
          const backupAudio = new Audio(directGoogleTts);
          backupAudio.playbackRate = targetRate;
          backupAudio.play().catch(e => console.warn('[TTS] All web audio attempts failed:', e));
        });
      }
    } catch (e) {
      console.warn('[TTS] Web audio element error:', e);
    }
  };

  const speakSynthesis = () => {
    try {
      let webSynthStarted = false;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = targetLang;
        utterance.rate = targetRate;
        utterance.pitch = 1.0;

        if (mobileCachedVoices.length === 0) {
          mobileCachedVoices = window.speechSynthesis.getVoices() || [];
        }

        const ROBOTIC_VOICES = /alex|fred|victoria|ralph|zarvox|trinoids|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|junior|kathy|organ|princess|whisper|compact|espeak/i;
        
        let bestVoice = null;
        if (isUK) {
          bestVoice = mobileCachedVoices.find((v) => 
            (v.lang === 'en-GB' || v.lang === 'en_GB') && 
            !ROBOTIC_VOICES.test(v.name) && 
            (v.name.includes('Google UK') || v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Serena') || v.name.includes('Kate'))
          ) || mobileCachedVoices.find((v) => (v.lang === 'en-GB' || v.lang === 'en_GB') && !ROBOTIC_VOICES.test(v.name));
        } else {
          bestVoice = mobileCachedVoices.find((v) => 
            (v.lang === 'en-US' || v.lang === 'en_US') && 
            !ROBOTIC_VOICES.test(v.name) && 
            (v.name.includes('Google US') || v.name.includes('Samantha') || v.name.includes('Ava') || v.name.includes('Allison') || v.name.includes('Jenny') || v.name.includes('Aria'))
          ) || mobileCachedVoices.find((v) => (v.lang === 'en-US' || v.lang === 'en_US') && !ROBOTIC_VOICES.test(v.name));
        }

        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        utterance.onstart = () => {
          webSynthStarted = true;
        };

        utterance.onerror = (err) => {
          console.warn('[TTS] Web speech synthesis failed, triggering HTML5 audio fallback:', err);
          playWebAudioFallback();
        };

        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        // On iOS Safari, speechSynthesis often fails silently due to silent mode or webkit bug
        setTimeout(() => {
          if (!webSynthStarted && (!window.speechSynthesis.speaking || window.speechSynthesis.paused)) {
            console.warn('[TTS] iOS Safari speech synthesis stalled, activating HTML5 audio fallback');
            playWebAudioFallback();
          }
        }, 450);
      } else {
        playWebAudioFallback();
      }
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      playWebAudioFallback();
    }
  };

  speakSynthesis();
};

const DEFAULT_PATTERN_CATEGORIES = [
  { id: 'cause_effect', name: 'Nguyên nhân & Hệ quả', emoji: '⚡', color: '#f59e0b', description: 'Diễn giải nguyên nhân, căn nguyên, hệ quả và mối quan hệ nhân quả' },
  { id: 'purpose', name: 'Mục đích & Dự định', emoji: '🎯', color: '#10b981', description: 'Chỉ rõ mục đích hướng đến, dự định tương lai và hành động có chủ đích' },
  { id: 'condition', name: 'Điều kiện & Giả định', emoji: '⚠️', color: '#eab308', description: 'Giả định tình huống, câu điều kiện, thể giả định' },
  { id: 'concession', name: 'Nhượng bộ & Đối lập', emoji: '⚖️', color: '#3b82f6', description: 'Nêu sự tương phản bất chấp trở ngại hoặc nghịch cảnh' },
  { id: 'comparison', name: 'So sánh & Đối chiếu', emoji: '🔍', color: '#06b6d4', description: 'So sánh tương quan, mức độ, cấu trúc càng... càng' },
  { id: 'exception', name: 'Ngoại lệ & Giới hạn', emoji: '🚫', color: '#ef4444', description: 'Loại trừ, giới hạn phạm vi áp dụng hoặc nêu trường hợp cá biệt' },
  { id: 'emphasis', name: 'Nhấn mạnh & Đảo ngữ', emoji: '💥', color: '#8b5cf6', description: 'Làm nổi bật hành động, đảo ngữ, câu chẻ nhấn mạnh' },
  { id: 'advice', name: 'Khuyên bảo & Thúc giục', emoji: '⏰', color: '#ec4899', description: 'Khuyên răn, đề xuất giải pháp, đã đến lúc cần hành động' },
  { id: 'speculation', name: 'Phỏng đoán & Khả năng', emoji: '🔮', color: '#a855f7', description: 'Đánh giá xác suất, phỏng đoán tình huống dựa trên chứng cứ' },
  { id: 'opinion', name: 'Khẳng định Quan điểm', emoji: '💬', color: '#0ea5e9', description: 'Bày tỏ quan điểm cá nhân, nhận định chuyên môn' },
  { id: 'addition', name: 'Bổ sung & Phát triển ý', emoji: '➕', color: '#14b8a6', description: 'Thêm thông tin hỗ trợ, phát triển luận cứ và mở rộng ý tưởng' },
  { id: 'example', name: 'Ví dụ & Minh họa', emoji: '💡', color: '#f97316', description: 'Đưa ra dẫn chứng thực tế, số liệu hoặc trường hợp minh họa cụ thể' },
  { id: 'clarification', name: 'Làm rõ & Diễn giải lại', emoji: '✨', color: '#6366f1', description: 'Giải thích chi tiết hơn, diễn đạt lại bằng từ ngữ dễ hiểu' },
  { id: 'transition', name: 'Chuyển ý & Dẫn dắt', emoji: '🔄', color: '#64748b', description: 'Chuyển sang luận điểm mới, mở rộng phạm vi chủ đề' },
  { id: 'sequence', name: 'Thời gian & Trình tự', emoji: '⏳', color: '#d97706', description: 'Chuỗi sự kiện kế tiếp, mốc thời gian và hành động tức thì' },
  { id: 'conclusion', name: 'Tóm tắt & Kết luận', emoji: '🏁', color: '#059669', description: 'Tóm lược các ý chính, đưa ra kết luận hoặc bài học tổng thể' },
  { id: 'request', name: 'Yêu cầu & Đề nghị lịch sự', emoji: '🤝', color: '#2563eb', description: 'Đề nghị lịch sự, phản biện ngoại giao trong công việc' },
  { id: 'definition', name: 'Định nghĩa & Khái niệm', emoji: '📖', color: '#7c3aed', description: 'Định nghĩa thuật ngữ, giải thích bản chất khái niệm' }
];


class MobileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Mobile App Error Caught by Boundary:', error, errorInfo);

    // Auto-send error report to backend server for live debugging
    try {
      const serverBase = typeof getServerUrl === 'function' ? getServerUrl() : API_ENDPOINT;
      fetch(`${serverBase}/api/logs/client-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error?.message || String(error),
          stack: error?.stack || '',
          componentStack: errorInfo?.componentStack || '',
          platform: Platform.OS,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#090d16', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#111827', padding: 22, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', width: '100%', maxWidth: 440, alignItems: 'center' }}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>⚠️</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 6, textAlign: 'center' }}>
              Ứng Dụng Đã Khôi Phục An Toàn
            </Text>
            <Text style={{ fontSize: 13, color: '#f87171', fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
              {this.state.error?.message || 'Đã xảy ra sự cố hiển thị nhỏ'}
            </Text>

            {/* Error Details Collapsible View */}
            {Boolean(this.state.errorInfo?.componentStack || this.state.error?.stack) ?
            <View style={{ width: '100%', marginBottom: 14 }}>
                <TouchableOpacity
                onPress={() => this.setState({ showDetails: !this.state.showDetails })}
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', marginBottom: 8 }}>
                
                  <Text style={{ color: '#38bdf8', fontSize: 12, fontWeight: '700' }}>
                    {this.state.showDetails ? '▲ Ẩn Chi Tiết Debug' : '▼ 🔍 Xem Chi Tiết Vị Trí Lỗi (Debug)'}
                  </Text>
                </TouchableOpacity>

                {this.state.showDetails ?
              <ScrollView style={{ maxHeight: 220, backgroundColor: '#030712', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 14 }}>
                      <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>Component Stack:{"\n"}</Text>
                      {this.state.errorInfo?.componentStack || 'Chưa có thông tin stack component'}
                      {"\n\n"}
                      <Text style={{ color: '#fbbf24', fontWeight: 'bold' }}>Error Stack:{"\n"}</Text>
                      {this.state.error?.stack || ''}
                    </Text>
                  </ScrollView> :
              null}
              </View> : null
            }

            <TouchableOpacity
              onPress={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                if (typeof window !== 'undefined' && window.location) window.location.reload();
              }}
              style={{ backgroundColor: '#0284c7', paddingVertical: 13, paddingHorizontal: 24, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 10 }}>
              
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                🔄 Tải Lại Ứng Dụng
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                try {
                  const serverBase = typeof getServerUrl === 'function' ? getServerUrl() : API_ENDPOINT;
                  fetch(`${serverBase}/api/logs/client-error`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      error: this.state.error?.message,
                      stack: this.state.error?.stack,
                      componentStack: this.state.errorInfo?.componentStack,
                      platform: Platform.OS,
                      manual: true
                    })
                  }).then(() => Alert.alert('Đã Gửi Báo Cáo ✅', 'Thông tin lỗi đã được chuyển đến máy chủ để kỹ sư kiểm tra!'));
                } catch (e) {}
              }}
              style={{ paddingVertical: 8, alignItems: 'center' }}>
              
              <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '600' }}>
                📤 Gửi nhật ký lỗi về máy tính kỹ sư
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>);

    }
    return this.props.children;
  }
}

function MainApp() {
  // Theme State (Default: Light Theme)
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? themes.dark : themes.light;

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Navigation: 'home' | 'review' | 'vocab' | 'patterns' | 'reader' | 'ai-lab' | 'add' | 'settings'
  const [currentTab, setCurrentTab] = useState('home');
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [authUsername, setAuthUsername] = useState('admin');
  const [authPassword, setAuthPassword] = useState('123456');
  const [authShowPassword, setAuthShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editAvatar, setEditAvatar] = useState('🧑‍🎓');
  const [editCurrentPassword, setEditCurrentPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Data States
  const [stats, setStats] = useState(null);
  const [dueItems, setDueItems] = useState([]);
  const [words, setWords] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [patternCategories, setPatternCategories] = useState(DEFAULT_PATTERN_CATEGORIES);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // SRS Review State & Modes (Flashcard, Cloze, Audio)
  const [reviewScope, setReviewScope] = useState('all'); // 'all' | 'words' | 'patterns'
  const [reviewMode, setReviewMode] = useState('flashcard'); // 'flashcard' | 'cloze' | 'audio'
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [clozeInput, setClozeInput] = useState('');
  const [clozeChecked, setClozeChecked] = useState(false);
  const [clozeHintShown, setClozeHintShown] = useState(false);
  const [reviewSessionStats, setReviewSessionStats] = useState({
    reviewed: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
    earnedXp: 0
  });
  const flipAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(0)).current;
  const cardFadeAnim = useRef(new Animated.Value(1)).current;
  const tabFadeAnim = useRef(new Animated.Value(1)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;
  const [floatingXp, setFloatingXp] = useState(null);
  const xpAnim = useRef(new Animated.Value(0)).current;

  // Floating XP Popup Trigger
  const triggerXpAnimation = (amount = 15, label = 'EXP EARNED') => {
    setFloatingXp({ amount, label });
    xpAnim.setValue(0);
    Animated.sequence([
    Animated.spring(xpAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web'
    }),
    Animated.delay(1100),
    Animated.timing(xpAnim, {
      toValue: 2,
      duration: 350,
      easing: Easing.in(Easing.ease),
      useNativeDriver: Platform.OS !== 'web'
    })]
    ).start(() => {
      setFloatingXp(null);
    });
  };

  // 3D Card Flip Handler & State Reset
  const flipCard = () => {
    if (!isFlipped) {
      flipAnim.setValue(0);
      setIsFlipped(true);
      Animated.spring(flipAnim, {
        toValue: 180,
        friction: 8,
        tension: 20,
        useNativeDriver: Platform.OS !== 'web'
      }).start();
    } else {
      flipAnim.setValue(180);
      setIsFlipped(false);
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 20,
        useNativeDriver: Platform.OS !== 'web'
      }).start();
    }
  };

  const resetCardState = () => {
    setIsFlipped(false);
    flipAnim.setValue(0);
    cardSlideAnim.setValue(0);
    cardFadeAnim.setValue(1);
    setClozeInput('');
    setClozeChecked(false);
    setClozeHintShown(false);
  };

  // Vocab Filter & Topic State
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabFilter, setVocabFilter] = useState('all');
  const [vocabViewMode, setVocabViewMode] = useState('list'); // 'list' | 'grouped'
  const [collapsedTopicsMobile, setCollapsedTopicsMobile] = useState({});
  const [topics, setTopics] = useState([]);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('all');
  const [showTopicManagerModal, setShowTopicManagerModal] = useState(false);
  const [editingTopicData, setEditingTopicData] = useState(null);
  const [topicNameInput, setTopicNameInput] = useState('');
  const [topicEmojiInput, setTopicEmojiInput] = useState('📁');
  const [topicColorInput, setTopicColorInput] = useState('#0284c7');
  const [topicDescInput, setTopicDescInput] = useState('');
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  // Pattern Categories Manager State
  const [showPatternCategoryManagerModal, setShowPatternCategoryManagerModal] = useState(false);
  const [editingPatternCatData, setEditingPatternCatData] = useState(null);
  const [patternCatNameInput, setPatternCatNameInput] = useState('');
  const [patternCatEmojiInput, setPatternCatEmojiInput] = useState('🧩');
  const [patternCatColorInput, setPatternCatColorInput] = useState('#8b5cf6');
  const [patternCatDescInput, setPatternCatDescInput] = useState('');
  const [isSavingPatternCat, setIsSavingPatternCat] = useState(false);

  // Quick Add Word State (100% Synced with Web QuickAddModal)
  const [newWord, setNewWord] = useState('');
  const [newMeaningVi, setNewMeaningVi] = useState('');
  const [newMeaningEn, setNewMeaningEn] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [newPartOfSpeech, setNewPartOfSpeech] = useState('noun');
  const [newLevel, setNewLevel] = useState('B2');
  const [newWordTopic, setNewWordTopic] = useState('daily');
  const [newCollocations, setNewCollocations] = useState(['']);
  const [newExamples, setNewExamples] = useState(['']);
  const [quickAddCardFlipped, setQuickAddCardFlipped] = useState(false);
  const [quickAddSuccessMsg, setQuickAddSuccessMsg] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Patterns State (Synced with Web)
  const [patternSearchQuery, setPatternSearchQuery] = useState('');
  const [newPatternName, setNewPatternName] = useState('');
  const [newPatternCategory, setNewPatternCategory] = useState('emphasis');
  const [newPatternFormula, setNewPatternFormula] = useState('');
  const [newPatternMeaning, setNewPatternMeaning] = useState('');
  const [newPatternExplanation, setNewPatternExplanation] = useState('');
  const [newPatternExample, setNewPatternExample] = useState('');
  const [editingPattern, setEditingPattern] = useState(null);
  const [selectedMobilePatternCategory, setSelectedMobilePatternCategory] = useState('all');
  const [isAddingPattern, setIsAddingPattern] = useState(false);

  // Reader / Notes State (Full-Featured Smart Reader)
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTopic, setNewNoteTopic] = useState('General');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [readerSelectedWord, setReaderSelectedWord] = useState('');
  const [readerSelectedIpa, setReaderSelectedIpa] = useState('');
  const [readerSelectedPos, setReaderSelectedPos] = useState('');
  const [readerContextTranslation, setReaderContextTranslation] = useState(null);
  const [isTranslatingContext, setIsTranslatingContext] = useState(false);
  const [isSavingWordFromReader, setIsSavingWordFromReader] = useState(false);
  const readerClientCacheRef = useRef({});

  // AI Lab State
  const [aiSubTab, setAiSubTab] = useState('parse'); // 'parse' | 'paraphrase' | 'check' | 'collocations' | 'dialogue' | 'story'
  const [aiSentenceInput, setAiSentenceInput] = useState('The resilient engineering team managed to navigate the complex challenges effortlessly.');
  const [aiParseResult, setAiParseResult] = useState(null);
  const [aiTargetWord, setAiTargetWord] = useState('resilient');
  const [aiUserSentence, setAiUserSentence] = useState('She is a very resilient engineer who always overcomes difficult bugs.');
  const [aiCheckResult, setAiCheckResult] = useState(null);
  const [aiStoryResult, setAiStoryResult] = useState(null);
  const [aiParaphraseInput, setAiParaphraseInput] = useState('I cannot attend the meeting today because I have to fix a critical bug.');
  const [aiParaphraseTone, setAiParaphraseTone] = useState('business');
  const [aiParaphraseResult, setAiParaphraseResult] = useState(null);
  const [aiCollocationWord, setAiCollocationWord] = useState('leverage');
  const [aiCollocationResult, setAiCollocationResult] = useState(null);
  const [aiDialogueScenario, setAiDialogueScenario] = useState('job_interview');
  const [aiDialogueResult, setAiDialogueResult] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Settings, Audio & Telegram State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedAiModel, setSelectedAiModel] = useState('gemini-3.5-flash');
  const [savedPatternIndices, setSavedPatternIndices] = useState({});
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [mobileSpeed, setMobileSpeed] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = parseFloat(localStorage.getItem(AUDIO_SPEED_STORAGE_KEY));
      if (!isNaN(saved) && saved >= 0.4 && saved <= 2.0) {
        globalMobileSpeed = saved;
        return saved;
      }
    }
    globalMobileSpeed = 0.85;
    return 0.85;
  });
  const [mobileAccent, setMobileAccent] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(AUDIO_ACCENT_STORAGE_KEY);
      if (saved) {
        globalMobileAccent = saved;
        return saved;
      }
    }
    return 'en-US';
  });
  const [showAudioSpeedModal, setShowAudioSpeedModal] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    let isCancelled = false;
    AsyncStorage.multiGet([AUDIO_SPEED_STORAGE_KEY, AUDIO_ACCENT_STORAGE_KEY])
      .then((entries) => {
        if (isCancelled) return;
        const stored = Object.fromEntries(entries);
        const savedSpeed = parseFloat(stored[AUDIO_SPEED_STORAGE_KEY]);
        if (!isNaN(savedSpeed) && savedSpeed >= 0.4 && savedSpeed <= 2.0) {
          globalMobileSpeed = savedSpeed;
          setMobileSpeed(savedSpeed);
        }
        const savedAccent = stored[AUDIO_ACCENT_STORAGE_KEY];
        if (savedAccent === 'en-US' || savedAccent === 'en-GB') {
          globalMobileAccent = savedAccent;
          setMobileAccent(savedAccent);
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, []);

  const [alarmQuestionCount, setAlarmQuestionCount] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return parseInt(localStorage.getItem('linguavault_alarm_q_count') || '3', 10) || 3;
    }
    return 3;
  });

  const handleUpdateAlarmCount = (cnt) => {
    setAlarmQuestionCount(cnt);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('linguavault_alarm_q_count', cnt.toString());
      } catch (e) {}
    }
    saveAlarmConfig({ enabled: autoAlarmEnabled, time: reminderTime, questionCount: cnt }).catch(() => {});
  };

  const handleUpdateMobileSpeed = (val) => {
    const num = Math.round(parseFloat(val) * 100) / 100;
    setMobileSpeed(num);
    globalMobileSpeed = num;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(AUDIO_SPEED_STORAGE_KEY, num.toString());
      } catch (e) {}
    }
    AsyncStorage.setItem(AUDIO_SPEED_STORAGE_KEY, num.toString()).catch(() => {});
  };

  const handleUpdateMobileAccent = (acc) => {
    setMobileAccent(acc);
    globalMobileAccent = acc;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(AUDIO_ACCENT_STORAGE_KEY, acc);
      } catch (e) {}
    }
    AsyncStorage.setItem(AUDIO_ACCENT_STORAGE_KEY, acc).catch(() => {});
  };

  // Mobile Quiz State
  const [selectedQuizCategory, setSelectedQuizCategory] = useState('vocab'); // 'vocab' | 'pattern'
  const [quizTopics, setQuizTopics] = useState([]);
  const [quizDates, setQuizDates] = useState([]);
  const [selectedQuizDateScope, setSelectedQuizDateScope] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last_7_days' | 'specific'
  const [selectedQuizDates, setSelectedQuizDates] = useState([]);
  const [selectedQuizDate, setSelectedQuizDate] = useState('');
  const [selectedQuizTopics, setSelectedQuizTopics] = useState(['All']);
  const [selectedQuizPatternCategory, setSelectedQuizPatternCategory] = useState('all');
  const [selectedQuizLevel, setSelectedQuizLevel] = useState('all');
  const [selectedQuizMode, setSelectedQuizMode] = useState('mixed');
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [quizData, setQuizData] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizUserAnswers, setQuizUserAnswers] = useState([]);
  const [quizSelectedOption, setQuizSelectedOption] = useState(null);
  const [quizIsAnswered, setQuizIsAnswered] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizTab, setQuizTab] = useState('new'); // 'new' | 'history'
  const [quizHistory, setQuizHistory] = useState([]);
  const [quizHistoryFilter, setQuizHistoryFilter] = useState('all'); // 'all' | 'vocab' | 'pattern' | 'ai'

  // Mobile Speaking Lab State
  const [speakingPrompts, setSpeakingPrompts] = useState([]);
  const [speakingActiveMode, setSpeakingActiveMode] = useState('read-aloud');
  const [selectedSpeakingPrompt, setSelectedSpeakingPrompt] = useState(null);
  const [speakingSpokenText, setSpeakingSpokenText] = useState('');
  const [isAnalyzingSpeaking, setIsAnalyzingSpeaking] = useState(false);
  const [speakingReadResult, setSpeakingReadResult] = useState(null);
  const [speakingQAResult, setSpeakingQAResult] = useState(null);
  const [isSpeakingRecording, setIsSpeakingRecording] = useState(false);
  const [speakingRecordTimer, setSpeakingRecordTimer] = useState(0);
  const [userSpeakingAudioBlob, setUserSpeakingAudioBlob] = useState(null);
  const [userSpeakingAudioUrl, setUserSpeakingAudioUrl] = useState(null);
  const [userSpeakingAudioBase64, setUserSpeakingAudioBase64] = useState(null);
  const [isPlayingSpeakingAudio, setIsPlayingSpeakingAudio] = useState(false);

  // Audio Recording Refs
  const speakingMediaRecorderRef = useRef(null);
  const speakingAudioChunksRef = useRef([]);
  const speakingRecognitionRef = useRef(null);
  const speakingTimerRef = useRef(null);
  const speakingAudioPlayerRef = useRef(null);

  // Server URL Configuration State
  const [serverUrlState, setServerUrlState] = useState(getServerUrl());
  const [serverConnected, setServerConnected] = useState(true);
  const [showServerModal, setShowServerModal] = useState(false);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverTestResult, setServerTestResult] = useState('');

  // ⏰ Hardcore Alarm Challenge State & Continuous Sound Synthesizer
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmQuestions, setAlarmQuestions] = useState([]);
  const [alarmIndex, setAlarmIndex] = useState(0);
  const [alarmAnswered, setAlarmAnswered] = useState(false);
  const [alarmSelectedOpt, setAlarmSelectedOpt] = useState(null);
  const [alarmWrongOpts, setAlarmWrongOpts] = useState([]);
  const [alarmCompleted, setAlarmCompleted] = useState(false);
  const [isAlarmSoundPlaying, setIsAlarmSoundPlaying] = useState(false);
  const [alarmScheduleStatus, setAlarmScheduleStatus] = useState('idle');
  const [autoAlarmEnabled, setAutoAlarmEnabled] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('linguavault_auto_alarm_enabled') === 'true';
    }
    return false;
  });

  const showAlarmModalRef = useRef(false);
  const lastAlarmDateKeyRef = useRef('');
  const alarmAudioCtxRef = useRef(null);
  const alarmNativeSoundRef = useRef(null);
  const alarmLoopGenerationRef = useRef(0);
  const alarmLoopStartingRef = useRef(false);
  const alarmIntervalRef = useRef(null);
  const alarmTimeoutsRef = useRef([]);
  const alarmChallengeSourceRef = useRef('scheduled');
  const alarmRestoreCheckedRef = useRef(false);
  const startAlarmChallengeRef = useRef(null);

  // Gamification & AI Mastery Assessment State
  const [gamificationProfile, setGamificationProfile] = useState({ level: 1, totalXp: 180, title: 'Novice Scholar 🌱', progressPercent: 20 });
  const [showLevelLadderModal, setShowLevelLadderModal] = useState(false);
  const [showAIMasteryModal, setShowAIMasteryModal] = useState(false);
  const [aiMasteryReport, setAiMasteryReport] = useState(null);
  const [isLoadingAIMastery, setIsLoadingAIMastery] = useState(false);

  // Advanced Vocab Vault, Edit, Command Palette & Reader States
  const [selectedWordDetail, setSelectedWordDetail] = useState(null);
  const [editingWordData, setEditingWordData] = useState(null);
  const [isUpdatingWord, setIsUpdatingWord] = useState(false);
  const [vocabSortBy, setVocabSortBy] = useState('newest');
  const [vocabTagFilter, setVocabTagFilter] = useState('all');
  const [showCommandPaletteModal, setShowCommandPaletteModal] = useState(false);
  const [commandSearchQuery, setCommandSearchQuery] = useState('');
  const [readerContextSentence, setReaderContextSentence] = useState(null);

  const fetchMobileAIMasteryReport = async () => {
    setIsLoadingAIMastery(true);
    try {
      const res = await mobileApi.getAIMasteryReport();
      if (res?.success) {
        setAiMasteryReport(res);
      }
    } catch (e) {
      console.warn('AI report fetch error:', e);
    } finally {
      setIsLoadingAIMastery(false);
    }
  };

  useEffect(() => {
    showAlarmModalRef.current = showAlarmModal;
  }, [showAlarmModal]);

  const initMobileAlarmAudioCtx = () => {
    if (!alarmAudioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        alarmAudioCtxRef.current = new AudioCtx();
      }
    }
    if (alarmAudioCtxRef.current && alarmAudioCtxRef.current.state === 'suspended') {
      alarmAudioCtxRef.current.resume();
    }
  };

  const playSingleAlarmBeep = (freq = 980, duration = 0.09, type = 'sawtooth') => {
    try {
      initMobileAlarmAudioCtx();
      const ctx = alarmAudioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const startMobileAlarmLoop = async () => {
    if (alarmLoopStartingRef.current || alarmNativeSoundRef.current || alarmIntervalRef.current) return;
    const generation = alarmLoopGenerationRef.current + 1;
    alarmLoopGenerationRef.current = generation;
    alarmLoopStartingRef.current = true;
    await stopMobileAlarmLoop({ invalidatePendingStart: false });
    setIsAlarmSoundPlaying(true);

    if (Platform.OS !== 'web') {
      try {
        await ExpoAudio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false
        });
        const { sound } = await ExpoAudio.Sound.createAsync(
          require('./assets/alarm.wav'),
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        if (alarmLoopGenerationRef.current !== generation) {
          await sound.stopAsync().catch(() => {});
          await sound.unloadAsync().catch(() => {});
          return;
        }
        alarmNativeSoundRef.current = sound;
        return;
      } catch (error) {
        console.warn('[Alarm] Native looping sound failed:', error?.message || error);
      } finally {
        alarmLoopStartingRef.current = false;
      }
    }

    if (alarmLoopGenerationRef.current !== generation) return;
    initMobileAlarmAudioCtx();

    const playPattern = () => {
      const t1 = setTimeout(() => playSingleAlarmBeep(980, 0.08, 'sawtooth'), 0);
      const t2 = setTimeout(() => playSingleAlarmBeep(980, 0.08, 'sawtooth'), 120);
      const t3 = setTimeout(() => playSingleAlarmBeep(980, 0.08, 'sawtooth'), 240);
      const t4 = setTimeout(() => playSingleAlarmBeep(1200, 0.14, 'sawtooth'), 360);
      alarmTimeoutsRef.current.push(t1, t2, t3, t4);
    };

    playPattern();
    alarmIntervalRef.current = setInterval(playPattern, 1100);
    alarmLoopStartingRef.current = false;
  };

  const stopMobileAlarmLoop = async ({ invalidatePendingStart = true } = {}) => {
    if (invalidatePendingStart) alarmLoopGenerationRef.current += 1;
    setIsAlarmSoundPlaying(false);
    if (alarmNativeSoundRef.current) {
      const sound = alarmNativeSoundRef.current;
      alarmNativeSoundRef.current = null;
      try {
        await sound.stopAsync();
      } catch (e) {}
      try {
        await sound.unloadAsync();
      } catch (e) {}
    }
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (alarmTimeoutsRef.current && alarmTimeoutsRef.current.length > 0) {
      alarmTimeoutsRef.current.forEach((id) => clearTimeout(id));
      alarmTimeoutsRef.current = [];
    }
  };

  const playMobileTone = (freq = 980, duration = 0.1) => {
    try {
      playSingleAlarmBeep(freq, duration, 'sine');
    } catch (e) {}
  };

  const playCelebratoryVictory = () => {
    try {
      stopMobileAlarmLoop();
      initMobileAlarmAudioCtx();
      const ctx = alarmAudioCtxRef.current;
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          } catch (e) {}
        }, idx * 110);
      });
    } catch (e) {}
  };

  // 🎮 Quiz Sound Effects (Active Recall Gameplay)
  const playQuizTapSound = () => {
    try {
      initMobileAlarmAudioCtx();
      const ctx = alarmAudioCtxRef.current;
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

  const playQuizCorrectSound = () => {
    try {
      initMobileAlarmAudioCtx();
      const ctx = alarmAudioCtxRef.current;
      if (!ctx) return;
      const notes = [523.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.18);
          } catch (e) {}
        }, idx * 60);
      });
    } catch (e) {}
  };

  const playQuizWrongSound = () => {
    try {
      initMobileAlarmAudioCtx();
      const ctx = alarmAudioCtxRef.current;
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

  const playQuizVictorySound = () => {
    playCelebratoryVictory();
  };

  const startAlarmChallenge = ({ source = 'scheduled', questionCount = alarmQuestionCount } = {}) => {
    if (showAlarmModalRef.current) {
      startMobileAlarmLoop();
      return;
    }
    alarmChallengeSourceRef.current = source;
    const count = [3, 5, 10].includes(Number(questionCount)) ? Number(questionCount) : 3;
    if (source !== 'test') {
      setAlarmChallengeActive(true).catch(() => {});
    }

    const src = words && words.length >= count ? words : [
    { word: 'deliverable', meaning_vi: 'Sản phẩm / kết quả bàn giao của dự án' },
    { word: 'bottleneck', meaning_vi: 'Điểm nghẽn, nút thắt cổ chai gây đình trệ tiến độ' },
    { word: 'stakeholder', meaning_vi: 'Các bên liên quan (khách hàng, ban điều hành, đối tác)' },
    { word: 'resilient', meaning_vi: 'Kiên cường, phục hồi nhanh' },
    { word: 'articulate', meaning_vi: 'Ăn nói lưu loát, mạch lạc' },
    { word: 'meticulous', meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết' },
    { word: 'leverage', meaning_vi: 'Tận dụng, phát huy tối đa đòn bẩy' },
    { word: 'pragmatic', meaning_vi: 'Thực tế, thực dụng và hiệu quả' }];

    const shuffled = [...src].sort(() => 0.5 - Math.random()).slice(0, count);
    const qs = shuffled.map((w, idx) => {
      const others = src.filter((item) => item.word !== w.word).map((item) => item.meaning_vi).slice(0, 3);
      const opts = [...others, w.meaning_vi].sort(() => 0.5 - Math.random());
      return {
        word: w.word,
        correct: w.meaning_vi,
        options: opts
      };
    });

    setAlarmQuestions(qs);
    setAlarmIndex(0);
    setAlarmCompleted(false);
    setAlarmAnswered(false);
    setAlarmSelectedOpt(null);
    setAlarmWrongOpts([]);
    setShowAlarmModal(true);
    startMobileAlarmLoop();
  };
  startAlarmChallengeRef.current = startAlarmChallenge;

  const handleDismissAlarm = () => {
    // Strict Hardcore Mode: Only closes after completing questions
    if (!alarmCompleted) return;
    handleCompleteAlarm();
  };

  const handleCompleteAlarm = async () => {
    await stopMobileAlarmLoop();
    if (alarmChallengeSourceRef.current === 'test') {
      await markAlarmChallengeCompleted({ recordDailyCompletion: false }).catch(() => {});
    } else {
      await markAlarmChallengeCompleted().catch(() => {});
    }
    try {
      await mobileApi.addXp(30, 'Giải mã Báo Thức Kỷ Luật Thép');
    } catch (e) {}
    setShowAlarmModal(false);
    setAlarmCompleted(false);
    setAlarmAnswered(false);
    setAlarmIndex(0);

    // Save execution lock for this alarm time
    const now = new Date();
    const key = `${now.toISOString().split('T')[0]}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    lastAlarmDateKeyRef.current = key;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('linguavault_last_alarm_date', key);
    }
    alarmChallengeSourceRef.current = 'scheduled';
    loadData();
  };

  // Load All App Data
  const loadData = async () => {
    trace('loadData:start');
    try {
      const [cachedUser, storedAlarmConfig] = await Promise.all([
        mobileApi.auth.getCachedUser(),
        loadAlarmConfig()
      ]);
      if (cachedUser) setCurrentUser((existing) => existing || cachedUser);
      setAutoAlarmEnabled(storedAlarmConfig.enabled);
      setAlarmQuestionCount(storedAlarmConfig.questionCount);

      const health = await mobileApi.checkHealth();
      setServerConnected(health.success);
      setServerTestResult(health.success ? 'online' : 'offline');
      if (health.url) setServerUrlState(health.url);
      trace('loadData:health-ok', health.success);

      const [statsRes, dueRes, wordsRes, patternsRes, notesRes, settingsRes, telegramRes, topicsRes, promptsRes, gamificationRes, realTopicsRes, patternCatsRes, quizHistoryRes, quizDatesRes] = await Promise.all([
      mobileApi.getStats(),
      mobileApi.getDueItems(),
      mobileApi.getWords(),
      mobileApi.getPatterns(),
      mobileApi.getNotes(),
      mobileApi.getSettings(),
      mobileApi.getTelegramSettings(),
      mobileApi.getQuizTopics(),
      mobileApi.getSpeakingPrompts(),
      mobileApi.getGamificationProfile(),
      mobileApi.getTopics(),
      mobileApi.getPatternCategories(),
      mobileApi.getQuizHistory(),
      mobileApi.getQuizDates()]
      );

      if (statsRes?.success) setStats(statsRes.data);
      if (gamificationRes?.success && gamificationRes.data) setGamificationProfile(gamificationRes.data);
      if (realTopicsRes?.success) setTopics(realTopicsRes.data || []);
      if (patternCatsRes?.success) setPatternCategories(patternCatsRes.data || []);
      if (quizHistoryRes?.success) setQuizHistory(quizHistoryRes.data || []);
      if (quizDatesRes?.success && quizDatesRes.data) {
        setQuizDates(quizDatesRes.data || []);
        if (quizDatesRes.data.length > 0) setSelectedQuizDate(quizDatesRes.data[0].date);
      }
      if (dueRes?.success) {
        const combined = [
        ...(dueRes.data?.words || []),
        ...(dueRes.data?.patterns || [])];

        setDueItems(combined);
      }
      if (wordsRes?.success) setWords(wordsRes.data || []);
      if (patternsRes?.success) setPatterns(patternsRes.data || []);
      if (notesRes?.success) setNotes(notesRes.data || []);
      if (settingsRes?.success && settingsRes.data) {
        if (settingsRes.data.gemini_api_key) setApiKeyInput(settingsRes.data.gemini_api_key);
        if (settingsRes.data.gemini_model) setSelectedAiModel(settingsRes.data.gemini_model);
      }
      if (telegramRes?.success && telegramRes.data) {
        setDailyGoal(telegramRes.data.daily_word_goal || 10);
        setReminderTime(
          storedAlarmConfig.enabled
            ? storedAlarmConfig.time
            : telegramRes.data.telegram_reminder_time || '20:00'
        );
        setBotToken(telegramRes.data.telegram_bot_token || '');
        setChatId(telegramRes.data.telegram_chat_id || '');
        setTelegramEnabled(Boolean(telegramRes.data.telegram_enabled));
      }
      if (topicsRes?.success) {
        setQuizTopics(topicsRes.data || []);
      }
      if (promptsRes?.success && promptsRes.data) {
        setSpeakingPrompts(promptsRes.data);
        const first = promptsRes.data.find((p) => p.category === 'read-aloud');
        if (first) setSelectedSpeakingPrompt(first);
      }

      // Check current logged-in user
      try {
        const authRes = await mobileApi.auth.getMe();
        if (authRes?.success && authRes.data) {
          setCurrentUser(authRes.data);
        }
      } catch (err) {
        console.warn('getMe error:', err);
      }
    } catch (e) {
      console.warn('Load data error:', e);
      trace('loadData:error', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      trace('loadData:done');
    }
  };

  const handleAuthSubmit = async () => {
    setAuthError('');
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setAuthLoading(true);
    trace('login:submit', authUsername.trim());
    try {
      const res = await mobileApi.auth.login(authUsername.trim(), authPassword.trim());
      trace('login:response', res?.success);

      if (res && res.success && (res.data?.user || res.data)) {
        const user = res.data.user || res.data;
        setCurrentUser(user);
        setAuthUsername('');
        setAuthPassword('');
        setLoading(true);
        trace('login:currentUser-set');
        loadData();
      } else {
        setAuthError(res?.error || 'Tên đăng nhập hoặc mật khẩu không chính xác');
      }
    } catch (err) {
      trace('login:exception', err?.message);
      setAuthError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await mobileApi.auth.guestLogin();
      if (res && res.success && (res.data?.user || res.data)) {
        const user = res.data.user || res.data;
        setCurrentUser(user);
        Alert.alert('Chào Mừng 🎉', 'Đã vào ứng dụng với quyền Khách Trải Nghiệm!');
        loadData();
      } else {
        setAuthError(res?.error || 'Không thể đăng nhập khách');
      }
    } catch (e) {
      setAuthError(e.message || 'Lỗi kết nối máy chủ');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMobileLogout = async () => {
    await mobileApi.auth.logout();
    setCurrentUser(null);
    setIsNavDrawerOpen(false);
  };

  const handleOpenProfileEdit = () => {
    if (!currentUser) return;
    setEditFullName(currentUser.full_name || '');
    setEditAvatar(currentUser.avatar_url || '🧑‍🎓');
    setEditCurrentPassword('');
    setEditNewPassword('');
    setEditError('');
    setIsNavDrawerOpen(false);
    setIsProfileEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      setEditError('Họ và tên không được để trống');
      return;
    }
    if (editNewPassword && !editCurrentPassword) {
      setEditError('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu');
      return;
    }

    setEditLoading(true);
    setEditError('');
    try {
      const payload = {
        full_name: editFullName.trim(),
        avatar_url: editAvatar
      };
      if (editNewPassword) {
        payload.current_password = editCurrentPassword;
        payload.new_password = editNewPassword;
      }
      const res = await mobileApi.auth.updateProfile(payload);
      if (res && res.success) {
        setCurrentUser((prev) => ({ ...prev, ...res.data }));
        setIsProfileEditModalOpen(false);
        Alert.alert('Thành công 🎉', 'Đã cập nhật hồ sơ cá nhân!');
      } else {
        setEditError(res?.error || 'Cập nhật không thành công');
      }
    } catch (err) {
      setEditError(err.message || 'Lỗi kết nối');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    setIsTestingServer(true);
    const updated = setServerUrl(serverUrlState);
    const test = await mobileApi.checkHealth(updated);
    setIsTestingServer(false);
    if (test.success) {
      setServerConnected(true);
      setServerTestResult('online');
      Alert.alert('Thành công 🎉', `Đã kết nối thành công tới Server:\n${updated}`);
      setShowServerModal(false);
      setLoading(true);
      loadData();
    } else {
      setServerConnected(false);
      setServerTestResult('offline');
      Alert.alert(
        'Không thể kết nối 🔴',
        `Không tìm thấy Server tại:\n${updated}\n\n💡 Hãy kiểm tra kết nối Internet, chứng chỉ HTTPS và trạng thái máy chủ LinguaVault.`
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Breadcrumb: confirms the main UI actually committed after login. If the trail
  // stops at login:currentUser-set without this step, the crash is in the first
  // render of the authenticated tree.
  useEffect(() => {
    if (currentUser) trace('main-ui:mounted', currentTab);
  }, [currentUser]);

  // Native local notifications wake the device when the JS process is suspended or terminated.
  // The foreground/AppState checks restore the quiz lock when the user returns without tapping
  // the notification, or when the OS has reclaimed the process.
  useEffect(() => {
    let disposed = false;

    const restoreAlarmIfNeeded = async ({ force = false, questionCount = null, source = 'scheduled' } = {}) => {
      try {
        if (showAlarmModalRef.current) return;
        const shouldLaunch = force || await shouldRestoreAlarmChallenge();
        if (disposed || !shouldLaunch) return;
        const config = await loadAlarmConfig();
        startAlarmChallengeRef.current?.({
          source,
          questionCount: questionCount || config.questionCount
        });
      } catch (error) {
        console.warn('[Alarm] Restore check failed:', error?.message || error);
      }
    };

    const initializeAlarm = async () => {
      if (alarmRestoreCheckedRef.current) return;
      alarmRestoreCheckedRef.current = true;
      try {
        const config = await loadAlarmConfig();
        if (disposed) return;
        setAutoAlarmEnabled(config.enabled);
        setAlarmQuestionCount(config.questionCount);
        if (config.time) setReminderTime(config.time);

        if (config.enabled) {
          const scheduled = await scheduleDailyAlarm(config.time, config.questionCount);
          setAlarmScheduleStatus(scheduled.success ? 'scheduled' : scheduled.reason || 'error');
          if (!scheduled.success) {
            setAutoAlarmEnabled(false);
            await saveAlarmConfig({ ...config, enabled: false });
          }
        }

        const initialResponse = await getInitialAlarmNotificationResponse();
        if (initialResponse) {
          const data = initialResponse.notification?.request?.content?.data;
          await restoreAlarmIfNeeded({
            force: true,
            questionCount: data?.questionCount,
            source: data?.test ? 'test' : 'scheduled'
          });
        } else {
          await restoreAlarmIfNeeded();
        }
      } catch (error) {
        setAlarmScheduleStatus('error');
        console.warn('[Alarm] Initialization failed:', error?.message || error);
      }
    };

    const unsubscribeNotifications = addAlarmNotificationListeners({
      onReceive: (notification) => {
        const data = notification?.request?.content?.data;
        restoreAlarmIfNeeded({
          force: true,
          questionCount: data?.questionCount,
          source: data?.test ? 'test' : 'scheduled'
        });
      },
      onResponse: (response) => {
        const data = response?.notification?.request?.content?.data;
        restoreAlarmIfNeeded({
          force: true,
          questionCount: data?.questionCount,
          source: data?.test ? 'test' : 'scheduled'
        });
      }
    });
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') restoreAlarmIfNeeded();
    });
    const interval = setInterval(restoreAlarmIfNeeded, 15000);
    initializeAlarm();

    return () => {
      disposed = true;
      clearInterval(interval);
      unsubscribeNotifications();
      appStateSubscription.remove();
      stopMobileAlarmLoop();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const [tabHistory, setTabHistory] = useState(['home']);

  const switchTabDirectly = (tab, slideDir = 10) => {
    tabFadeAnim.setValue(0.2);
    tabSlideAnim.setValue(slideDir);
    setCurrentTab(tab);
    setIsNavDrawerOpen(false);
    if (tab === 'review') {
      setReviewIndex(0);
      resetCardState();
    }
    Animated.parallel([
    Animated.timing(tabFadeAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: Platform.OS !== 'web'
    }),
    Animated.timing(tabSlideAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: Platform.OS !== 'web'
    })]
    ).start();
  };

  const navigateTo = (tab) => {
    setTabHistory((prev) => prev[prev.length - 1] === tab ? prev : [...prev, tab]);
    switchTabDirectly(tab, 10);
  };

  const handleGoBack = () => {
    if (selectedWordDetail) {setSelectedWordDetail(null);return;}
    if (selectedNote) {setSelectedNote(null);return;}
    if (isProfileEditModalOpen) {setIsProfileEditModalOpen(false);return;}
    if (showAIMasteryModal) {setShowAIMasteryModal(false);return;}
    if (showLevelLadderModal) {setShowLevelLadderModal(false);return;}
    if (showAlarmModal) {
      startMobileAlarmLoop();
      return;
    }
    if (showTopicManagerModal) {setShowTopicManagerModal(false);return;}
    if (showPatternCategoryManagerModal) {setShowPatternCategoryManagerModal(false);return;}
    if (showCommandPaletteModal) {setShowCommandPaletteModal(false);return;}
    if (showServerModal) {setShowServerModal(false);return;}
    if (showAudioSpeedModal) {setShowAudioSpeedModal(false);return;}
    if (isNavDrawerOpen) {setIsNavDrawerOpen(false);return;}

    if (tabHistory.length > 1) {
      const prevStack = [...tabHistory];
      prevStack.pop();
      const prevTab = prevStack[prevStack.length - 1] || 'home';
      setTabHistory(prevStack);
      switchTabDirectly(prevTab, -10);
    } else if (currentTab !== 'home') {
      navigateTo('home');
    }
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showAlarmModalRef.current) {
        startMobileAlarmLoop();
        return true;
      }
      handleGoBack();
      return true;
    });
    return () => subscription.remove();
  }, [currentTab, tabHistory, selectedWordDetail, selectedNote, isProfileEditModalOpen, showAlarmModal]);

  const handleSwipeLeft = () => {
    if (currentTab === 'review') {
      handleReviewGrade('again');
      return;
    }
    const bottomTabs = ['home', 'vocab', 'review', 'add', 'ai-lab'];
    const idx = bottomTabs.indexOf(currentTab);
    if (idx !== -1 && idx < bottomTabs.length - 1) {
      navigateTo(bottomTabs[idx + 1]);
    }
  };

  const handleSwipeRight = () => {
    if (currentTab === 'review') {
      handleReviewGrade('good');
      return;
    }
    const bottomTabs = ['home', 'vocab', 'review', 'add', 'ai-lab'];
    const idx = bottomTabs.indexOf(currentTab);
    if (idx > 0) {
      navigateTo(bottomTabs[idx - 1]);
    } else {
      handleGoBack();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 40 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 60) {
          handleSwipeRight();
        } else if (gestureState.dx < -60) {
          handleSwipeLeft();
        }
      }
    })
  ).current;

  // SRS Review Rating (SM-2) with Card Slide-Out Animation
  const handleReviewGrade = async (rating) => {
    const activeDeck = reviewScope === 'words' ?
    dueItems.filter((i) => (i.type || 'word') === 'word') :
    reviewScope === 'patterns' ?
    dueItems.filter((i) => i.type === 'pattern') :
    dueItems;

    const currentItem = activeDeck[reviewIndex];
    if (!currentItem) return;

    try {
      if (rating === 'again') {
        playQuizWrongSound();
      } else {
        playQuizCorrectSound();
      }
    } catch (e) {}

    const xpMap = { again: 1, hard: 4, good: 7, easy: 10 };
    const xp = xpMap[rating] || 7;
    triggerXpAnimation(xp, `Ôn tập: +${xp} XP`);

    // Update Session Metrics
    setReviewSessionStats((prev) => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      againCount: rating === 'again' ? prev.againCount + 1 : prev.againCount,
      hardCount: rating === 'hard' ? prev.hardCount + 1 : prev.hardCount,
      goodCount: rating === 'good' ? prev.goodCount + 1 : prev.goodCount,
      easyCount: rating === 'easy' ? prev.easyCount + 1 : prev.easyCount,
      earnedXp: prev.earnedXp + xp
    }));

    // Slide out animation
    const slideDirection = rating === 'again' || rating === 'hard' ? -120 : 120;
    Animated.parallel([
    Animated.timing(cardSlideAnim, {
      toValue: slideDirection,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web'
    }),
    Animated.timing(cardFadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: Platform.OS !== 'web'
    })
  ]).start(() => {
      try {
        mobileApi.submitReview(currentItem.id, currentItem.type || 'word', rating).catch((err) => {
          console.error('Lỗi submit review mobile:', err);
        });
      } catch (err) {}

      setDueItems((prev) => prev.filter((item) => item.id !== currentItem?.id));

      if (reviewIndex + 1 < activeDeck.length) {
        const nextItem = activeDeck[reviewIndex + 1];
        setReviewIndex((prev) => prev + 1);
        setIsFlipped(false);
        setClozeInput('');
        setClozeChecked(false);
        setClozeHintShown(false);
        flipAnim.setValue(0);
        cardSlideAnim.setValue(35);
        cardFadeAnim.setValue(0);

        if (reviewMode === 'audio' && nextItem) {
          playMobileAudio(nextItem.word || nextItem.name, mobileSpeed, mobileAccent);
        }

        // Slide in from right/bottom
        Animated.parallel([
        Animated.spring(cardSlideAnim, {
          toValue: 0,
          friction: 7,
          tension: 25,
          useNativeDriver: Platform.OS !== 'web'
        }),
        Animated.timing(cardFadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: Platform.OS !== 'web'
        })]
        ).start();
      } else {
        playQuizVictorySound();
        triggerXpAnimation(30, 'Hoàn thành phiên ôn tập');
        loadData();
        navigateTo('home');
        setReviewIndex(0);
        setIsFlipped(false);
        flipAnim.setValue(0);
        cardSlideAnim.setValue(0);
        cardFadeAnim.setValue(1);
      }
    });
  };

  // 1-Click Auto Lookup Word
  const handleAutoLookup = async (sample = null) => {
    const target = (sample || newWord).trim();
    if (!target) {
      Alert.alert('Thông báo', 'Vui lòng nhập từ tiếng Anh trước nhé!');
      return;
    }

    if (sample) setNewWord(sample);
    setIsLookingUp(true);
    setQuickAddSuccessMsg('');

    try {
      const res = await mobileApi.autoLookup(target);
      if (res?.success && res.data) {
        const d = res.data;
        if (d.meaning_vi) setNewMeaningVi(d.meaning_vi);
        if (d.meaning_en) setNewMeaningEn(d.meaning_en);
        if (d.phonetic) setNewPhonetic(d.phonetic);
        if (d.audio_url) setNewAudioUrl(d.audio_url);
        if (d.part_of_speech) setNewPartOfSpeech(d.part_of_speech);
        if (d.topic_id) setNewWordTopic(d.topic_id);
        if (d.level) setNewLevel(d.level);
        if (d.collocations && d.collocations.length > 0) {
          setNewCollocations(d.collocations);
        }
        if (d.examples && d.examples.length > 0) {
          setNewExamples(d.examples);
        } else if (d.examples && typeof d.examples === 'string') {
          setNewExamples([d.examples]);
        }
        setQuickAddSuccessMsg('✓ Đã tự động điền: Nghĩa, IPA, Từ loại, Collocations & Ví dụ!');
        playMobileAudio(target, null, null);
      } else {
        Alert.alert('Từ điển', 'Không tìm thấy từ trong từ điển. Bạn có thể tự nhập nghĩa vào các ô bên dưới.');
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Save New Word (Full-Featured Multi-Field)
  const handleSaveWord = async () => {
    if (!newWord.trim() || !newMeaningVi.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Từ tiếng Anh và Nghĩa tiếng Việt.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        word: newWord.trim(),
        meaning_vi: newMeaningVi.trim(),
        meaning_en: newMeaningEn.trim(),
        phonetic: newPhonetic.trim(),
        audio_url: newAudioUrl.trim(),
        part_of_speech: newPartOfSpeech,
        level: newLevel,
        topic_id: newWordTopic || 'daily',
        collocations: newCollocations.filter((c) => c && c.trim() !== ''),
        examples: newExamples.filter((ex) => ex && ex.trim() !== ''),
        tags: []
      };

      const res = await mobileApi.createWord(payload);
      if (res?.success) {
        try {
          await mobileApi.addXp(10, `Thêm từ mới "${newWord}" vào kho`);
        } catch (e) {}
        triggerXpAnimation(10, 'Từ mới đã lưu');
        Alert.alert('Thành công', `Đã thêm từ "${newWord}" vào kho lưu trữ! (+10 XP)`);
        setNewWord('');
        setNewMeaningVi('');
        setNewMeaningEn('');
        setNewPhonetic('');
        setNewAudioUrl('');
        setNewCollocations(['']);
        setNewExamples(['']);
        setQuickAddSuccessMsg('');
        loadData();
        navigateTo('vocab');
      } else {
        Alert.alert('Lỗi', res?.error || 'Không thể lưu từ vựng');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update Word
  const handleUpdateWord = async () => {
    if (!editingWordData || !editingWordData.word.trim() || !editingWordData.meaning_vi.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền Từ tiếng Anh và Nghĩa tiếng Việt.');
      return;
    }

    setIsUpdatingWord(true);
    try {
      const payload = {
        ...editingWordData,
        word: editingWordData.word.trim(),
        meaning_vi: editingWordData.meaning_vi.trim(),
        collocations: Array.isArray(editingWordData.collocations) ? editingWordData.collocations.filter((c) => c && c.trim() !== '') : [],
        examples: Array.isArray(editingWordData.examples) ? editingWordData.examples.filter((ex) => ex && ex.trim() !== '') : []
      };
      const res = await mobileApi.updateWord(editingWordData.id, payload);
      if (res?.success) {
        Alert.alert('Thành công', `Đã cập nhật từ "${editingWordData.word}"!`);
        setEditingWordData(null);
        setSelectedWordDetail(null);
        loadData();
      } else {
        Alert.alert('Lỗi', res?.error || 'Không thể cập nhật từ vựng');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsUpdatingWord(false);
    }
  };

  // Delete Word
  const handleDeleteWord = (id, wordText) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa từ "${wordText}"?`, [
    { text: 'Hủy', style: 'cancel' },
    {
      text: 'Xóa',
      style: 'destructive',
      onPress: async () => {
        await mobileApi.deleteWord(id);
        loadData();
      }
    }]
    );
  };

  // Topic Management Handlers
  const handleStartCreateTopic = () => {
    setEditingTopicData(null);
    setTopicNameInput('');
    setTopicEmojiInput('📁');
    setTopicColorInput('#0284c7');
    setTopicDescInput('');
  };

  const handleStartEditTopic = (t) => {
    setEditingTopicData(t);
    setTopicNameInput(t.name);
    setTopicEmojiInput(t.emoji || '📁');
    setTopicColorInput(t.color || '#0284c7');
    setTopicDescInput(t.description || '');
  };

  const handleSaveTopic = async () => {
    if (!topicNameInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên chủ đề.');
      return;
    }
    setIsSavingTopic(true);
    try {
      const payload = {
        name: topicNameInput.trim(),
        emoji: topicEmojiInput || '📁',
        color: topicColorInput || '#0284c7',
        description: topicDescInput.trim()
      };
      let res;
      if (editingTopicData) {
        res = await mobileApi.updateTopic(editingTopicData.id, payload);
      } else {
        res = await mobileApi.createTopic(payload);
      }
      if (res?.success) {
        Alert.alert('Thành công', editingTopicData ? 'Đã cập nhật chủ đề!' : 'Đã tạo chủ đề mới!');
        handleStartCreateTopic();
        loadData();
      } else {
        Alert.alert('Lỗi', res?.error || 'Không thể lưu chủ đề');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSavingTopic(false);
    }
  };

  const handleDeleteTopic = (t) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa chủ đề "${t.name}"? Các từ vựng sẽ được chuyển về "Giao tiếp Hàng ngày".`, [
    { text: 'Hủy', style: 'cancel' },
    {
      text: 'Xóa',
      style: 'destructive',
      onPress: async () => {
        await mobileApi.deleteTopic(t.id);
        loadData();
      }
    }]
    );
  };

  // Save or Update Pattern (Synced with Web)
  const handleSavePattern = async () => {
    if (!newPatternName.trim() || !newPatternFormula.trim() || !newPatternMeaning.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền Tên mẫu câu, Công thức và Nghĩa tiếng Việt.');
      return;
    }

    try {
      const payload = {
        name: newPatternName.trim(),
        formula: newPatternFormula.trim(),
        explanation: newPatternExplanation.trim(),
        meaning_vi: newPatternMeaning.trim(),
        category: newPatternCategory || 'emphasis',
        examples: newPatternExample.trim() ? [newPatternExample.trim()] : [],
        tone: 'Formal',
        tags: ['Grammar', 'Mobile']
      };

      let res;
      if (editingPattern && editingPattern.id) {
        res = await mobileApi.updatePattern(editingPattern.id, payload);
      } else {
        res = await mobileApi.createPattern(payload);
      }

      if (res?.success) {
        Alert.alert('Thành công', editingPattern ? 'Đã cập nhật mẫu câu!' : 'Đã thêm mẫu câu mới!');
        setNewPatternName('');
        setNewPatternFormula('');
        setNewPatternMeaning('');
        setNewPatternExplanation('');
        setNewPatternExample('');
        setNewPatternCategory('emphasis');
        setEditingPattern(null);
        setIsAddingPattern(false);
        loadData();
      } else {
        Alert.alert('Lỗi', res?.error || 'Không thể lưu mẫu câu.');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const handleStartEditPattern = (p) => {
    setEditingPattern(p);
    setNewPatternName(p.name || '');
    setNewPatternCategory(p.category || 'emphasis');
    setNewPatternFormula(p.formula || '');
    setNewPatternMeaning(p.meaning_vi || '');
    setNewPatternExplanation(p.explanation || '');
    setNewPatternExample(p.examples?.[0] || '');
    setIsAddingPattern(true);
  };

  // Pattern Category Management Handlers (Mobile)
  const handleStartCreatePatternCategory = () => {
    setEditingPatternCatData(null);
    setPatternCatNameInput('');
    setPatternCatEmojiInput('🧩');
    setPatternCatColorInput('#8b5cf6');
    setPatternCatDescInput('');
  };

  const handleStartEditPatternCategory = (cat) => {
    setEditingPatternCatData(cat);
    setPatternCatNameInput(cat.name || '');
    setPatternCatEmojiInput(cat.emoji || '🧩');
    setPatternCatColorInput(cat.color || '#8b5cf6');
    setPatternCatDescInput(cat.description || '');
  };

  const handleSavePatternCategory = async () => {
    if (!patternCatNameInput.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên chức năng diễn đạt.');
      return;
    }

    setIsSavingPatternCat(true);
    try {
      const payload = {
        name: patternCatNameInput.trim(),
        emoji: patternCatEmojiInput.trim() || '🧩',
        color: patternCatColorInput || '#8b5cf6',
        description: patternCatDescInput.trim()
      };

      let res;
      if (editingPatternCatData) {
        res = await mobileApi.updatePatternCategory(editingPatternCatData.id, payload);
      } else {
        res = await mobileApi.createPatternCategory(payload);
      }

      if (res?.success) {
        Alert.alert('Thành công', editingPatternCatData ? 'Đã cập nhật chức năng!' : 'Đã tạo chức năng mới!');
        handleStartCreatePatternCategory();
        loadData();
      } else {
        Alert.alert('Lỗi', res?.error || 'Không thể lưu chức năng.');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSavingPatternCat(false);
    }
  };

  const handleDeletePatternCategory = (cat) => {
    Alert.alert(
      'Xóa Chức Năng',
      `Bạn có chắc muốn xóa chức năng "${cat.name}"? Các mẫu câu sẽ được chuyển về nhóm mặc định.`,
      [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await mobileApi.deletePatternCategory(cat.id);
            if (res?.success) {
              if (editingPatternCatData?.id === cat.id) handleStartCreatePatternCategory();
              loadData();
            } else {
              Alert.alert('Lỗi', res?.error || 'Không thể xóa chức năng.');
            }
          } catch (e) {
            Alert.alert('Lỗi', e.message);
          }
        }
      }]

    );
  };

  // Save Pattern extracted from AI Lab
  const handleSaveParsedPattern = async (p, idx) => {
    try {
      const res = await mobileApi.createPattern({
        name: p.name || 'Cấu trúc câu',
        formula: p.formula || '',
        meaning_vi: p.explanation || '',
        examples: [aiSentenceInput],
        tone: 'academic',
        tags: ['Grammar', 'AI-Lab']
      });
      if (res?.success) {
        setSavedPatternIndices((prev) => ({ ...prev, [idx]: true }));
        Alert.alert('Thành công', `Đã lưu mẫu câu "${p.name}" vào kho Mẫu Câu!`);
        loadData();
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  // Delete Pattern
  const handleDeletePattern = (id, name) => {
    Alert.alert('Xác nhận xóa', `Xóa mẫu câu "${name}"?`, [
    { text: 'Hủy', style: 'cancel' },
    {
      text: 'Xóa',
      style: 'destructive',
      onPress: async () => {
        await mobileApi.deletePattern(id);
        loadData();
      }
    }]
    );
  };

  // Smart Reader: Start Add Note
  const handleStartAddNote = () => {
    setEditingNote(null);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteTopic('General');
    setIsAddingNote(true);
  };

  // Smart Reader: Start Edit Note
  const handleStartEditNote = (note) => {
    setEditingNote(note);
    setNewNoteTitle(note.title || '');
    setNewNoteContent(note.content || '');
    setNewNoteTopic(note.topic || 'General');
    setIsAddingNote(true);
  };

  // Smart Reader: Save or Update Note
  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Tiêu đề và Nội dung bài đọc.');
      return;
    }

    try {
      let res;
      if (editingNote) {
        res = await mobileApi.updateNote(editingNote.id, {
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          topic: newNoteTopic.trim() || 'General'
        });
      } else {
        res = await mobileApi.createNote({
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          topic: newNoteTopic.trim() || 'General'
        });
      }

      if (res?.success) {
        Alert.alert('Thành công', editingNote ? 'Đã cập nhật bài đọc!' : 'Đã lưu bài đọc mới!');
        if (editingNote) {
          setSelectedNote({
            ...editingNote,
            title: newNoteTitle.trim(),
            content: newNoteContent.trim(),
            topic: newNoteTopic.trim() || 'General'
          });
        }
        setNewNoteTitle('');
        setNewNoteContent('');
        setEditingNote(null);
        setIsAddingNote(false);
        loadData();
      } else {
        Alert.alert('Lỗi', res?.error || 'Không thể lưu bài đọc');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  // Smart Reader: Delete Note
  const handleDeleteNote = (id, title) => {
    Alert.alert('Xác nhận xóa', `Xóa bài đọc "${title}"?`, [
    { text: 'Hủy', style: 'cancel' },
    {
      text: 'Xóa',
      style: 'destructive',
      onPress: async () => {
        await mobileApi.deleteNote(id);
        setSelectedNote(null);
        setReaderSelectedWord('');
        loadData();
      }
    }]
    );
  };

  // Smart Reader: Helper to get full sentence containing word
  const getSentenceContainingWord = (content, targetWord) => {
    if (!content || !targetWord) return targetWord || '';
    // Hermes (iOS/Android release engine) does not support regex lookbehind,
    // so match sentence + trailing punctuation instead of splitting on it.
    const sentences = content.match(/[^.?!]+[.?!]*\s*/g) || [content];
    const found = sentences.find((s) => s.toLowerCase().includes(targetWord.toLowerCase()));
    return found ? found.trim() : targetWord;
  };

  // Smart Reader: Select word, speak audio and fetch IPA immediately (0ms instant)
  const handleSelectWordInReader = async (rawWord) => {
    const cleanWord = (rawWord || '').replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (!cleanWord) return;

    setReaderSelectedWord(cleanWord);
    setIsTranslatingContext(false);

    // If already translated in this reading session, instant 0ms retrieval!
    const cached = readerClientCacheRef.current[cleanWord.toLowerCase()];
    if (cached) {
      setReaderContextTranslation(cached);
      setReaderSelectedIpa(cached.phonetic || '');
      setReaderSelectedPos(cached.partOfSpeech || '');
      playMobileAudio(cleanWord, mobileSpeed, mobileAccent);
      return;
    }

    setReaderContextTranslation(null);
    playMobileAudio(cleanWord, mobileSpeed, mobileAccent);

    // 1. Check if word exists in local Vocab Vault for instant 0ms IPA
    const inVault = words.find((w) => w.word?.toLowerCase() === cleanWord.toLowerCase());
    if (inVault && inVault.phonetic) {
      setReaderSelectedIpa(inVault.phonetic);
      setReaderSelectedPos(inVault.part_of_speech || 'noun');
      return;
    }

    // 2. Otherwise fast auto-lookup dictionary for instant IPA
    try {
      const lookup = await mobileApi.autoLookup(cleanWord);
      const ipa = lookup?.data?.phonetic || lookup?.phonetic || '';
      const pos = lookup?.data?.part_of_speech || lookup?.part_of_speech || '';
      if (ipa) {
        setReaderSelectedIpa(ipa);
      }
      if (pos) {
        setReaderSelectedPos(pos);
      }
    } catch (e) {



      // Keep existing IPA if present
    }}; // Smart Reader: Translate In Context using Gemini AI (Instant 0ms Cache + Optimistic Preview)
  const handleTranslateInContext = async (rawWord) => {
    const cleanWord = (rawWord || readerSelectedWord || '').replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (!cleanWord) return;

    // Check client cache first
    const cached = readerClientCacheRef.current[cleanWord.toLowerCase()];
    if (cached) {
      setReaderContextTranslation(cached);
      return;
    }

    // Optimistic Preview: If word exists in local vault, show basic meaning immediately without waiting!
    const inVault = words.find((w) => w.word?.toLowerCase() === cleanWord.toLowerCase());
    if (inVault && inVault.meaning_vi) {
      setReaderContextTranslation({
        targetText: cleanWord,
        phonetic: inVault.phonetic || readerSelectedIpa,
        partOfSpeech: inVault.part_of_speech || readerSelectedPos,
        contextualMeaningVi: inVault.meaning_vi,
        contextExplanation: '⚡ AI đang tinh chỉnh phân tích chuyên sâu theo bài đọc...',
        overallSentenceVi: '',
        collocations: inVault.collocations || [],
        level: inVault.level || 'B2',
        isOptimistic: true
      });
    }

    setIsTranslatingContext(true);
    const sentence = getSentenceContainingWord(selectedNote?.content || '', cleanWord);

    try {
      const res = await mobileApi.translateInContextAI({
        text: cleanWord,
        contextSentence: sentence,
        articleTitle: selectedNote?.title || '',
        articleTopic: selectedNote?.topic || 'General'
      });

      if (res?.success && res.data) {
        setReaderContextTranslation(res.data);
        readerClientCacheRef.current[cleanWord.toLowerCase()] = res.data;
        if (res.data.phonetic) setReaderSelectedIpa(res.data.phonetic);
        if (res.data.partOfSpeech) setReaderSelectedPos(res.data.partOfSpeech);
      } else {
        if (!inVault) Alert.alert('Không thể dịch', res?.error || 'Lỗi khi gọi AI phân tích ngữ cảnh');
      }
    } catch (e) {
      console.warn('Context translation error:', e);
      if (!inVault) Alert.alert('Lỗi kết nối', e.message || 'Không thể kết nối đến máy chủ AI');
    } finally {
      setIsTranslatingContext(false);
    }
  };

  // Smart Reader: 1-Click Save Word with Contextual Definition
  const handleSaveWordFromReader = async (rawWord) => {
    const cleanWord = (rawWord || '').replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (!cleanWord) return;

    setIsSavingWordFromReader(true);
    try {
      const sentence = getSentenceContainingWord(selectedNote?.content || '', cleanWord);
      let meaningVi = readerContextTranslation?.contextualMeaningVi;
      let phonetic = readerContextTranslation?.phonetic;
      let partOfSpeech = readerContextTranslation?.partOfSpeech;
      let level = readerContextTranslation?.level;
      let collocations = readerContextTranslation?.collocations || [];

      if (!meaningVi) {
        const lookup = await mobileApi.autoLookup(cleanWord);
        meaningVi = lookup?.meaning_vi || lookup?.definition_vi || 'Từ vựng trích xuất từ bài đọc';
        phonetic = lookup?.phonetic || '';
        partOfSpeech = lookup?.part_of_speech || 'noun';
        level = lookup?.level || 'B2';
        collocations = lookup?.collocations || [];
      }

      const payload = {
        word: cleanWord,
        phonetic: phonetic || '',
        part_of_speech: partOfSpeech || 'noun',
        meaning_vi: meaningVi,
        meaning_en: readerContextTranslation?.contextExplanation || '',
        examples: [
        sentence || (selectedNote?.title ? `Trích từ bài đọc: "${selectedNote.title}"` : '')].
        filter(Boolean),
        collocations,
        level: level || 'B2',
        topic: selectedNote?.topic || 'General'
      };

      const res = await mobileApi.createWord(payload);
      if (res?.success) {
        try {
          await mobileApi.addXp(10, `Lưu từ "${cleanWord}" theo ngữ cảnh bài đọc`);
        } catch (e) {}
        Alert.alert('✨ Đã Lưu Vào Kho Từ', `Đã thêm "${cleanWord}" (${phonetic || level}) với nghĩa theo ngữ cảnh bài đọc! (+10 XP)`);
        loadData();
      } else {
        Alert.alert('Thông báo', res?.error || 'Từ này có thể đã có trong kho từ của bạn.');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSavingWordFromReader(false);
    }
  };

  // Smart Reader: Send Text to AI Lab
  const handleSendReaderToAiLab = (text) => {
    if (!text) return;
    setAiSentenceInput(text);
    setAiSubTab('parse');
    setReaderSelectedWord('');
    setReaderContextTranslation(null);
    navigateTo('ai-lab');
  };

  // AI Sentence Parse
  const handleAiParse = async () => {
    if (!aiSentenceInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng dán câu tiếng Anh cần bóc tách.');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await mobileApi.parseSentenceAI(aiSentenceInput.trim());
      if (res?.success && res.data) {
        setAiParseResult(res.data);
      } else {
        Alert.alert('AI Lab', res?.error || 'Không thể phân tích câu');
      }
    } catch (e) {
      Alert.alert('Lỗi AI', e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Sentence Check
  const handleAiCheck = async () => {
    if (!aiUserSentence.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập câu tiếng Anh bạn tự đặt.');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await mobileApi.checkSentenceAI(aiTargetWord, aiUserSentence.trim());
      if (res?.success && res.data) {
        setAiCheckResult(res.data);
      } else {
        Alert.alert('AI Lab', res?.error || 'Không thể chấm câu');
      }
    } catch (e) {
      Alert.alert('Lỗi AI', e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Story Weaver
  const handleAiStory = async () => {
    setIsAiLoading(true);
    try {
      const wordList = words.slice(0, 4).map((w) => w.word);
      const res = await mobileApi.generateStoryAI(wordList);
      if (res?.success && res.data) {
        setAiStoryResult(res.data);
      } else {
        Alert.alert('AI Lab', res?.error || 'Không thể sáng tác truyện');
      }
    } catch (e) {
      Alert.alert('Lỗi AI', e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Paraphrase & Tone Polisher
  const handleAiParaphrase = async () => {
    if (!aiParaphraseInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập câu tiếng Anh cần viết lại.');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await mobileApi.paraphraseSentenceAI(aiParaphraseInput.trim(), aiParaphraseTone);
      if (res?.success && res.data) {
        setAiParaphraseResult(res.data);
      } else {
        Alert.alert('AI Lab', res?.error || 'Không thể viết lại câu');
      }
    } catch (e) {
      Alert.alert('Lỗi AI', e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Collocations Explorer
  const handleAiCollocations = async () => {
    if (!aiCollocationWord.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập từ vựng cần đào sâu.');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await mobileApi.exploreCollocationsAI(aiCollocationWord.trim());
      if (res?.success && res.data) {
        setAiCollocationResult(res.data);
      } else {
        Alert.alert('AI Lab', res?.error || 'Không thể khảo sát cụm từ');
      }
    } catch (e) {
      Alert.alert('Lỗi AI', e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Situational Dialogue Generator
  const handleAiDialogue = async () => {
    setIsAiLoading(true);
    try {
      const res = await mobileApi.generateDialogueAI(aiDialogueScenario);
      if (res?.success && res.data) {
        setAiDialogueResult(res.data);
      } else {
        Alert.alert('AI Lab', res?.error || 'Không thể tạo cuộc hội thoại');
      }
    } catch (e) {
      Alert.alert('Lỗi AI', e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save Settings API Key & AI Model
  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    try {
      const res = await mobileApi.saveSettings({
        gemini_api_key: apiKeyInput.trim(),
        gemini_model: selectedAiModel
      });
      if (res?.success) {
        Alert.alert('Thành công', 'Đã lưu Gemini API Key & Mô hình AI thành công!');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSavingKey(false);
    }
  };

  // Telegram Settings Save
  const handleSaveTelegram = async () => {
    if (!isValidAlarmTime(reminderTime)) {
      Alert.alert('Giờ không hợp lệ', 'Vui lòng nhập giờ theo định dạng HH:mm, ví dụ 20:00.');
      return;
    }
    setIsSavingTelegram(true);
    try {
      const res = await mobileApi.saveTelegramSettings({
        daily_word_goal: parseInt(dailyGoal, 10) || 10,
        telegram_reminder_time: reminderTime,
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim(),
        telegram_enabled: telegramEnabled
      });
      if (res?.success) {
        await saveAlarmConfig({
          enabled: autoAlarmEnabled,
          time: reminderTime,
          questionCount: alarmQuestionCount
        });
        if (autoAlarmEnabled) {
          const scheduled = await scheduleDailyAlarm(reminderTime, alarmQuestionCount);
          setAlarmScheduleStatus(scheduled.success ? 'scheduled' : scheduled.reason || 'error');
          if (!scheduled.success) {
            setAutoAlarmEnabled(false);
            await saveAlarmConfig({ enabled: false, time: reminderTime, questionCount: alarmQuestionCount });
            Alert.alert(
              'Đã lưu cài đặt, nhưng chưa bật báo thức',
              'Hãy cấp quyền Thông báo và Âm thanh trong Cài đặt hệ thống rồi bật lại Báo thức Kỷ luật thép.'
            );
            return;
          }
        }
        Alert.alert('Thành công', 'Đã lưu cấu hình Mục tiêu & Bot Telegram!');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleToggleAutoAlarm = async () => {
    const nextEnabled = !autoAlarmEnabled;
    if (nextEnabled && !isValidAlarmTime(reminderTime)) {
      Alert.alert('Giờ không hợp lệ', 'Vui lòng nhập giờ theo định dạng HH:mm, ví dụ 20:00.');
      return;
    }

    setAlarmScheduleStatus(nextEnabled ? 'scheduling' : 'idle');
    try {
      if (nextEnabled) {
        const scheduled = await scheduleDailyAlarm(reminderTime, alarmQuestionCount);
        if (!scheduled.success) {
          setAutoAlarmEnabled(false);
          setAlarmScheduleStatus(scheduled.reason || 'error');
          await saveAlarmConfig({ enabled: false, time: reminderTime, questionCount: alarmQuestionCount });
          Alert.alert(
            'Chưa cấp quyền thông báo',
            'LinguaVault cần quyền Thông báo và Âm thanh để báo thức hoạt động khi app đã đóng. Hãy bật quyền trong Cài đặt hệ thống rồi thử lại.'
          );
          return;
        }
        setAutoAlarmEnabled(true);
        setAlarmScheduleStatus('scheduled');
        await saveAlarmConfig({ enabled: true, time: reminderTime, questionCount: alarmQuestionCount });
        Alert.alert('Đã bật báo thức', `Thiết bị sẽ báo lúc ${reminderTime} mỗi ngày. Chạm thông báo để mở quiz bắt buộc.`);
      } else {
        await cancelDailyAlarm();
        await saveAlarmConfig({ enabled: false, time: reminderTime, questionCount: alarmQuestionCount });
        setAutoAlarmEnabled(false);
        setAlarmScheduleStatus('idle');
        Alert.alert('Đã tắt báo thức', 'Lịch báo thức native đã được hủy.');
      }
    } catch (error) {
      setAlarmScheduleStatus('error');
      Alert.alert('Không thể lên lịch báo thức', error?.message || 'Vui lòng kiểm tra quyền thông báo của ứng dụng.');
    }
  };

  const handleTestNativeAlarm = async () => {
    try {
      const scheduled = await scheduleAlarmTest(10, alarmQuestionCount);
      if (!scheduled.success) {
        Alert.alert('Chưa cấp quyền', 'Hãy bật quyền Thông báo và Âm thanh cho LinguaVault rồi thử lại.');
        return;
      }
      Alert.alert(
        'Đã lên lịch test 10 giây',
        'Hãy vuốt đóng LinguaVault ngay. Sau khoảng 10 giây, thiết bị phải phát âm báo; chạm thông báo sẽ mở quiz khóa.'
      );
    } catch (error) {
      Alert.alert('Test native thất bại', error?.message || 'Không thể lên lịch thông báo thử.');
    }
  };

  // Telegram Test Message
  const handleTestTelegram = async () => {
    if (!botToken || !chatId) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Telegram Bot Token và Chat ID trước!');
      return;
    }

    setIsTestingTelegram(true);
    try {
      const res = await mobileApi.sendTelegramTest({
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim()
      });
      if (res?.success) {
        Alert.alert('🎉 Thành công', 'Đã gửi tin nhắn test tới Telegram của bạn!');
      } else {
        Alert.alert('Lỗi gửi test', res?.error || 'Không thể kết nối Telegram bot');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Mobile Quiz Handlers
  const toggleMobileQuizTopic = (topicKey) => {
    if (topicKey === 'All' || topicKey === 'all') {
      setSelectedQuizTopics(['All']);
      return;
    }
    let updated = selectedQuizTopics.filter((t) => t !== 'All' && t !== 'all');
    if (updated.includes(topicKey)) {
      updated = updated.filter((t) => t !== topicKey);
      if (updated.length === 0) updated = ['All'];
    } else {
      updated.push(topicKey);
    }
    setSelectedQuizTopics(updated);
  };

  const toggleMobileQuizDate = (dateStr) => {
    let updated;
    if (selectedQuizDates.includes(dateStr)) {
      updated = selectedQuizDates.filter((d) => d !== dateStr);
    } else {
      updated = [...selectedQuizDates, dateStr];
    }
    setSelectedQuizDates(updated);
    if (updated.length > 0) {
      setSelectedQuizDateScope('specific');
    } else {
      setSelectedQuizDateScope('all');
    }
  };

  const handleStartMobileQuiz = async (useAi = false) => {
    setIsQuizLoading(true);
    try {
      let res;
      let targetDate = null;
      if (selectedQuizDateScope === 'specific') {
        targetDate = selectedQuizDates.length === 1 ? selectedQuizDates[0] : (selectedQuizDates.length > 1 ? selectedQuizDates : null);
        if (!targetDate) {
          Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 ngày học trong danh sách bên dưới.');
          setIsQuizLoading(false);
          return;
        }
      }

      if (selectedQuizCategory === 'pattern') {
        if (useAi) {
          res = await mobileApi.generateAIPatternQuiz({
            category: selectedQuizPatternCategory,
            count: quizQuestionCount,
            level: selectedQuizLevel,
            mode: selectedQuizMode,
            date_scope: selectedQuizDateScope,
            date: targetDate
          });
        } else {
          res = await mobileApi.generatePatternQuiz({
            category: selectedQuizPatternCategory,
            count: quizQuestionCount,
            mode: selectedQuizMode,
            level: selectedQuizLevel,
            date_scope: selectedQuizDateScope,
            date: targetDate
          });
        }
      } else {
        if (useAi) {
          res = await mobileApi.generateAIQuiz({
            topic: selectedQuizTopics,
            count: quizQuestionCount,
            level: selectedQuizLevel,
            mode: selectedQuizMode,
            date_scope: selectedQuizDateScope,
            date: targetDate
          });
        } else {
          res = await mobileApi.generateQuiz({
            topic: selectedQuizTopics,
            count: quizQuestionCount,
            mode: selectedQuizMode,
            level: selectedQuizLevel,
            date_scope: selectedQuizDateScope,
            date: targetDate
          });
        }
      }

      if (res?.success && res.data.questions?.length > 0) {
        setQuizData(res.data);
        setQuizIndex(0);
        setQuizUserAnswers([]);
        setQuizSelectedOption(null);
        setQuizIsAnswered(false);
        setQuizResult(null);

        mobileApi.getQuizHistory().then((hRes) => {
          if (hRes?.success) setQuizHistory(hRes.data || []);
        }).catch(() => {});

        if (res.data.questions[0].type === 'listening') {
          playMobileAudio(res.data.questions[0].word);
        }
      } else {
        Alert.alert('Thông báo', res?.error || 'Không đủ từ vựng để tạo bài Quiz.');
      }
    } catch (e) {
      Alert.alert('Lỗi tạo Quiz', e.message);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleRetakeCurrentMobileQuiz = () => {
    if (quizData && quizData.questions?.length > 0) {
      setQuizIndex(0);
      setQuizUserAnswers([]);
      setQuizSelectedOption(null);
      setQuizIsAnswered(false);
      setQuizResult(null);

      if (quizData.questions[0]?.type === 'listening') {
        playMobileAudio(quizData.questions[0].word);
      }
    } else {
      handleStartMobileQuiz(false);
    }
  };

  const handleSelectQuizOption = (option) => {
    if (quizIsAnswered || !quizData) return;

    setQuizSelectedOption(option);
    setQuizIsAnswered(true);

    const currentQ = quizData.questions[quizIndex];
    const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      playQuizCorrectSound();
    } else {
      playQuizWrongSound();
    }

    const answerItem = {
      id: currentQ.id,
      word: currentQ.word,
      questionText: currentQ.questionText,
      correctAnswer: currentQ.correctAnswer,
      userAnswer: option,
      explanation: currentQ.explanation,
      translation: currentQ.translation
    };

    setQuizUserAnswers((prev) => {
      const updated = [...prev];
      updated[quizIndex] = answerItem;
      return updated;
    });
  };

  const handleNextQuizQuestion = async () => {
    if (!quizData) return;

    playQuizTapSound();

    if (quizIndex + 1 < quizData.questions.length) {
      const nextIdx = quizIndex + 1;
      setQuizIndex(nextIdx);
      setQuizSelectedOption(null);
      setQuizIsAnswered(false);

      if (quizData.questions[nextIdx].type === 'listening') {
        playMobileAudio(quizData.questions[nextIdx].word);
      }
    } else {
      setIsQuizLoading(true);
      try {
        const answersToSubmit = quizData.questions.map((q, idx) => {
          if (quizUserAnswers[idx]) return quizUserAnswers[idx];
          if (idx === quizIndex && quizSelectedOption) {
            return {
              id: q.id,
              word: q.word,
              questionText: q.questionText,
              correctAnswer: q.correctAnswer,
              userAnswer: quizSelectedOption,
              explanation: q.explanation,
              translation: q.translation
            };
          }
          return {
            id: q.id,
            word: q.word,
            questionText: q.questionText,
            correctAnswer: q.correctAnswer,
            userAnswer: '',
            explanation: q.explanation,
            translation: q.translation
          };
        });

        const res = await mobileApi.submitQuiz(answersToSubmit, quizData?.history_id || null);
        if (res?.success) {
          playQuizVictorySound();
          const earnedXp = Math.max(20, (res.data.correctCount || 1) * 20);
          try {
            await mobileApi.addXp(earnedXp, `Hoàn thành Quiz (${res.data.correctCount || 1} câu đúng)`);
          } catch (e) {}
          triggerXpAnimation(earnedXp, 'Hoàn thành Quiz');
          setQuizResult(res.data);
          loadData();
        } else {
          Alert.alert('Lỗi nộp bài', res?.error || 'Vui lòng thử lại');
        }
      } catch (e) {
        Alert.alert('Lỗi nộp bài', e.message);
      } finally {
        setIsQuizLoading(false);
      }
    }
  };

  // Re-take saved Quiz from History
  const handleRetakeMobileQuiz = async (historyItem) => {
    setIsQuizLoading(true);
    try {
      const res = await mobileApi.getQuizHistoryById(historyItem.id);
      if (res?.success && res.data && res.data.questions?.length > 0) {
        setQuizData(res.data);
        setQuizIndex(0);
        setQuizUserAnswers([]);
        setQuizSelectedOption(null);
        setQuizIsAnswered(false);
        setQuizResult(null);

        if (res.data.questions[0].type === 'listening') {
          playMobileAudio(res.data.questions[0].word);
        }
      } else {
        Alert.alert('Thông báo', res?.error || 'Không thể nạp bộ đề này.');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsQuizLoading(false);
    }
  };

  // Delete saved Quiz from History
  const handleDeleteMobileQuizHistory = (id) => {
    Alert.alert(
      'Xóa Bộ Đề',
      'Bạn có chắc muốn xóa bộ đề này khỏi lịch sử đề thi?',
      [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await mobileApi.deleteQuizHistory(id);
            if (res?.success) {
              const historyRes = await mobileApi.getQuizHistory();
              if (historyRes?.success) setQuizHistory(historyRes.data || []);
            } else {
              Alert.alert('Lỗi', res?.error || 'Không thể xóa');
            }
          } catch (err) {
            Alert.alert('Lỗi', err.message);
          }
        }
      }]

    );
  };

  // Mobile Speaking Lab Handlers & Audio Recorder Engine
  const resetSpeakingAudioSession = () => {
    if (isSpeakingRecording) {
      stopMobileSpeakingRecording();
    }
    setSpeakingRecordTimer(0);
    setUserSpeakingAudioBlob(null);
    setUserSpeakingAudioUrl(null);
    setUserSpeakingAudioBase64(null);
    setIsPlayingSpeakingAudio(false);
    setSpeakingSpokenText('');
    setSpeakingReadResult(null);
    setSpeakingQAResult(null);
  };

  const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result ? reader.result.split(',')[1] : null;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startMobileSpeakingRecording = async () => {
    try {
      setSpeakingRecordTimer(0);
      setUserSpeakingAudioBlob(null);
      setUserSpeakingAudioUrl(null);
      setUserSpeakingAudioBase64(null);
      setSpeakingReadResult(null);
      setSpeakingQAResult(null);

      const mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices || navigator.webkitMediaDevices : null;
      if (!mediaDevices || !mediaDevices.getUserMedia) {
        Alert.alert('Microphone', 'Trình duyệt hoặc thiết bị chưa cấp quyền truy cập micro.');
        return;
      }

      const stream = await mediaDevices.getUserMedia({ audio: true });

      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ?
      'audio/webm;codecs=opus' :
      typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4') ?
      'audio/mp4' :
      'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      speakingAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          speakingAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const finalBlob = new Blob(speakingAudioChunksRef.current, { type: mimeType });
          setUserSpeakingAudioBlob(finalBlob);
          if (typeof URL !== 'undefined' && URL.createObjectURL) {
            const url = URL.createObjectURL(finalBlob);
            setUserSpeakingAudioUrl(url);
          }
          const base64 = await convertBlobToBase64(finalBlob);
          setUserSpeakingAudioBase64(base64);
        } catch (e) {
          console.warn('Error converting audio blob:', e);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      speakingMediaRecorderRef.current = mediaRecorder;

      // Realtime Speech Recognition for Subtitles
      const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = mobileAccent === 'en-GB' ? 'en-GB' : 'en-US';

          let accumulated = '';
          recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                accumulated += event.results[i][0].transcript + ' ';
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            setSpeakingSpokenText((accumulated + interim).trim());
          };
          recognition.start();
          speakingRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('SpeechRecognition unavailable:', e);
        }
      }

      setIsSpeakingRecording(true);

      if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = setInterval(() => {
        setSpeakingRecordTimer((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone access error:', err);
      Alert.alert('Lỗi Micro', 'Không thể khởi động micro: ' + err.message);
      setIsSpeakingRecording(false);
    }
  };

  const stopMobileSpeakingRecording = () => {
    if (speakingTimerRef.current) {
      clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }

    if (speakingMediaRecorderRef.current && speakingMediaRecorderRef.current.state !== 'inactive') {
      try {
        speakingMediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (speakingRecognitionRef.current) {
      try {
        speakingRecognitionRef.current.stop();
      } catch (e) {}
    }

    setIsSpeakingRecording(false);
  };

  const playUserSpeakingAudio = () => {
    if (!userSpeakingAudioUrl) return;
    try {
      if (isPlayingSpeakingAudio) {
        if (speakingAudioPlayerRef.current) {
          speakingAudioPlayerRef.current.pause();
          speakingAudioPlayerRef.current = null;
        }
        setIsPlayingSpeakingAudio(false);
        return;
      }

      const audio = new window.Audio(userSpeakingAudioUrl);
      speakingAudioPlayerRef.current = audio;
      setIsPlayingSpeakingAudio(true);
      audio.onended = () => {
        setIsPlayingSpeakingAudio(false);
        speakingAudioPlayerRef.current = null;
      };
      audio.onerror = () => {
        setIsPlayingSpeakingAudio(false);
        speakingAudioPlayerRef.current = null;
      };
      audio.play();
    } catch (e) {
      console.warn('Cannot play audio:', e);
      setIsPlayingSpeakingAudio(false);
    }
  };

  const handleAnalyzeSpeaking = async () => {
    if (!userSpeakingAudioBase64 && !speakingSpokenText.trim()) {
      Alert.alert('Chưa Có Bản Ghi Âm', 'Vui lòng bấm nút Micro để ghi âm câu nói tiếng Anh của bạn trước khi chấm điểm nhé!');
      return;
    }

    setIsAnalyzingSpeaking(true);
    try {
      const audioPayload = userSpeakingAudioBase64 ? {
        data: userSpeakingAudioBase64,
        mimeType: userSpeakingAudioBlob?.type || 'audio/webm'
      } : null;

      if (speakingActiveMode === 'read-aloud') {
        const res = await mobileApi.analyzeReadAloud({
          targetText: selectedSpeakingPrompt?.targetText || '',
          spokenText: speakingSpokenText,
          audioData: audioPayload,
          duration: speakingRecordTimer
        });
        if (res?.success) {
          try {
            await mobileApi.addXp(50, 'Luyện phát âm AI Speaking Lab');
          } catch (e) {}
          setSpeakingReadResult(res.data);
          loadData();
        } else {
          Alert.alert('Lỗi', res?.error || 'Không thể phân tích bài đọc');
        }
      } else {
        const res = await mobileApi.analyzeQASpeaking({
          question: selectedSpeakingPrompt?.question || '',
          topic: selectedSpeakingPrompt?.topic || 'General',
          spokenText: speakingSpokenText,
          audioData: audioPayload
        });
        if (res?.success) {
          try {
            await mobileApi.addXp(50, 'Luyện hội thoại AI Speaking Lab');
          } catch (e) {}
          setSpeakingQAResult(res.data);
          loadData();
        } else {
          Alert.alert('Lỗi', res?.error || 'Không thể chấm điểm câu trả lời');
        }
      }
    } catch (e) {
      Alert.alert('Lỗi chấm điểm', e.message);
    } finally {
      setIsAnalyzingSpeaking(false);
    }
  };

  // Metrics (100% Synced with Database)
  const totalDue = dueItems.length;
  const wordStats = stats?.words || {};
  const streak = stats?.streak || 0;
  const totalCount = words.length > 0 ? words.length : wordStats.total || 0;
  const masteredCount = words.length > 0 ?
  words.filter((w) => w.status === 'mastered' || w.interval >= 6 && (w.repetitions >= 3 || w.repetition >= 3)).length :
  wordStats.mastered || 0;
  const reviewingCount = words.length > 0 ?
  words.filter((w) => w.status === 'reviewing' || w.interval >= 2 && w.status !== 'mastered').length :
  wordStats.reviewing || 0;
  const learningCount = words.length > 0 ?
  words.filter((w) => w.status === 'learning' || w.repetition === 1 && w.status !== 'mastered' && w.status !== 'reviewing').length :
  wordStats.learning || 0;
  const newCount = words.length > 0 ?
  words.filter((w) => w.status === 'new' || !w.status && !w.repetition && !w.interval).length :
  wordStats.new || 0;

  let rank = 'Apprentice (Tập sự)';
  if (masteredCount >= 100) rank = 'Polyglot Master (Bậc thầy)';else
  if (masteredCount >= 30) rank = 'Fluent Scholar (Học giả)';else
  if (masteredCount >= 10) rank = 'Agile Learner (Chuyên cần)';

  // Filtered & Sorted Vocab List (Smart Multi-Field & Accent-Insensitive)
  const filteredWords = words.
  filter((w) => {
    const q = vocabSearch.toLowerCase().trim();
    if (q) {
      const qClean = removeVietnameseTones(q);
      const word = (w.word || '').toLowerCase();
      const meaningVi = (w.meaning_vi || '').toLowerCase();
      const meaningEn = (w.meaning_en || '').toLowerCase();
      const phonetic = (w.phonetic || '').toLowerCase();
      const pos = (w.part_of_speech || '').toLowerCase();
      const level = (w.level || '').toLowerCase();
      const topic = (w.topic_id || '').toLowerCase();
      const collocationsStr = Array.isArray(w.collocations) ? w.collocations.join(' ').toLowerCase() : (w.collocations || '').toLowerCase();
      const examplesStr = Array.isArray(w.examples) ? w.examples.join(' ').toLowerCase() : (w.examples || '').toLowerCase();
      const tagsStr = Array.isArray(w.tags) ? w.tags.join(' ').toLowerCase() : (w.tags || '').toLowerCase();

      const matchDirect =
      word.includes(q) ||
      meaningVi.includes(q) ||
      meaningEn.includes(q) ||
      phonetic.includes(q) ||
      pos.includes(q) ||
      level === q ||
      topic.includes(q) ||
      collocationsStr.includes(q) ||
      examplesStr.includes(q) ||
      tagsStr.includes(q);

      const matchUnaccented =
      removeVietnameseTones(meaningVi).includes(qClean) ||
      removeVietnameseTones(collocationsStr).includes(qClean) ||
      removeVietnameseTones(examplesStr).includes(qClean) ||
      removeVietnameseTones(topic).includes(qClean);

      if (!matchDirect && !matchUnaccented) return false;
    }

    // Filter by Topic
    if (selectedTopicFilter !== 'all') {
      const matchTopic = w.topic_id === selectedTopicFilter;
      if (!matchTopic) return false;
    }

    if (vocabFilter === 'mastered') return w.status === 'mastered' || w.interval >= 6 && w.repetitions >= 3;
    if (vocabFilter === 'learning') return w.status === 'learning' || w.status === 'new' || w.repetitions === 0;
    if (vocabFilter === 'due') return dueItems.some((d) => d.id === w.id);
    if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(vocabFilter)) {
      return (w.level || '').toUpperCase() === vocabFilter;
    }
    return true;
  }).
  sort((a, b) => {
    // Prioritize Relevance when search query is active
    if (vocabSearch.trim()) {
      const q = vocabSearch.toLowerCase().trim();
      const qClean = removeVietnameseTones(q);
      const score = (item) => {
        const w = (item.word || '').toLowerCase();
        const m = (item.meaning_vi || '').toLowerCase();
        const mClean = removeVietnameseTones(m);
        if (w === q) return 100;
        if (w.startsWith(q)) return 80;
        if (w.includes(q)) return 60;
        if (m.startsWith(q) || mClean.startsWith(qClean)) return 50;
        if (m.includes(q) || mClean.includes(qClean)) return 40;
        return 10;
      };
      const scoreA = score(a);
      const scoreB = score(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }

    if (vocabSortBy === 'az') return a.word.localeCompare(b.word);
    if (vocabSortBy === 'due') {
      const aDue = dueItems.some((d) => d.id === a.id) ? 1 : 0;
      const bDue = dueItems.some((d) => d.id === b.id) ? 1 : 0;
      if (aDue !== bDue) return bDue - aDue;
      return (a.interval || 0) - (b.interval || 0);
    }
    if (vocabSortBy === 'level') {
      const levels = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
      return (levels[b.level] || 0) - (levels[a.level] || 0);
    }
    // 'newest' default
    return (b.id || 0) - (a.id || 0);
  });

  // 1. Mobile Auth Gate: When user is not logged in, render dedicated standalone Auth Screen
  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.bg} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled">
            
            {/* Header Theme Switcher */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[styles.iconCircleBtn, { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder }]}>
                
                {isDark ? <IconSun size={18} color="#f59e0b" /> : <IconMoon size={18} color="#0284c7" />}
              </TouchableOpacity>
            </View>

            {/* Brand Logo & Title */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: theme.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}>
                <IconBookOpen size={32} color="#ffffff" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: theme.textPrimary, letterSpacing: -0.5 }}>
                LinguaVault Pro
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textMuted, marginTop: 4 }}>
                Personal English Knowledge Hub & SRS
              </Text>
            </View>

            {/* Card Container */}
            <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: theme.cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
              {/* Card Header Title */}
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary }}>
                  Đăng Nhập Hệ Thống
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                  Vui lòng đăng nhập tài khoản của bạn
                </Text>
              </View>

              {/* Error Box */}
              {authError ?
              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 14 }}>
                  <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>⚠️ {authError}</Text>
                </View> :
              null}

              {/* Username Input */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 6 }}>
                  TÊN ĐĂNG NHẬP
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 14
                  }}
                  placeholder="admin hoặc tên đăng nhập..."
                  placeholderTextColor={theme.textMuted}
                  value={authUsername}
                  onChangeText={setAuthUsername}
                  autoCapitalize="none"
                  autoCorrect={false} />
                
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 6 }}>
                  MẬT KHẨU
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={{
                      backgroundColor: theme.inputBg,
                      color: theme.textPrimary,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                      borderRadius: 12,
                      padding: 12,
                      paddingRight: 40,
                      fontSize: 14
                    }}
                    placeholder="123456 hoặc mật khẩu..."
                    placeholderTextColor={theme.textMuted}
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    secureTextEntry={!authShowPassword}
                    autoCapitalize="none" />
                  
                  <TouchableOpacity
                    onPress={() => setAuthShowPassword(!authShowPassword)}
                    style={{ position: 'absolute', right: 12, top: 14 }}>
                    
                    <Text style={{ fontSize: 16 }}>{authShowPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleAuthSubmit}
                disabled={authLoading}
                style={{
                  backgroundColor: theme.btnPrimaryBg,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  shadowColor: theme.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4
                }}>
                
                {authLoading ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>
                    Đăng Nhập Vào Hệ Thống
                  </Text>
                }
              </TouchableOpacity>
            </View>

            {/* Server IP Config Link */}
            <TouchableOpacity
              onPress={() => setShowServerModal(true)}
              style={{ marginTop: 20, alignItems: 'center' }}>
              
              <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '600' }}>
                ⚙️ IP Server: {serverUrlState} (Chạm để đổi)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Server Modal if opened from Auth screen */}
        <Modal
          visible={showServerModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowServerModal(false)}>{showServerModal ? <>
          
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 440, backgroundColor: theme.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: theme.cardBorder }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary }}>⚙️ Kết Nối Máy Chủ API</Text>
                <TouchableOpacity onPress={() => setShowServerModal(false)}>
                  <IconX size={22} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                  style={{
                    backgroundColor: theme.inputBg,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 12
                  }}
                  value={serverUrlState}
                  onChangeText={setServerUrlState}
                  autoCapitalize="none" />
              
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                    onPress={() => setShowServerModal(false)}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }}>
                  
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>Đóng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSaveServerUrl}
                    style={{ flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: theme.accent }}>
                  
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>Lưu & Kết Nối</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </> : null}</Modal>
      </SafeAreaView>);

  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.bg} />

      {/* 1. TOP APP BAR */}
      <View style={[styles.topBar, { backgroundColor: theme.topBarBg, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.brandContainer}>
          <TouchableOpacity
            style={[styles.hamburgerBtn, { backgroundColor: theme.drawerCardBg, borderColor: theme.accentPillBorder }]}
            onPress={() => setIsNavDrawerOpen(true)}
            activeOpacity={0.7}>
            
            <IconMenu size={18} color={theme.accent} />
          </TouchableOpacity>
          
          {/* QUICK ADD VOCABULARY BUTTON */}
          <TouchableOpacity
            onPress={() => navigateTo('add')}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.btnPrimaryBg,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              gap: 5,
              shadowColor: theme.btnPrimaryBg,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3
            }}>
            
            <IconPlus size={15} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>
              Thêm từ
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topRightActions}>
          {/* SEARCH & COMMAND PALETTE BUTTON */}
          <TouchableOpacity
            onPress={() => setShowCommandPaletteModal(true)}
            style={[styles.iconCircleBtn, { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder }]}
            activeOpacity={0.7}>
            
            <IconSearch size={15} color={theme.accent} />
          </TouchableOpacity>

          {/* GAMIFICATION LEVEL PILL */}
          <TouchableOpacity
            onPress={() => setShowLevelLadderModal(true)}
            activeOpacity={0.7}
            style={[styles.gamificationTopPill, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.12)', borderColor: theme.accent }]}>
            
            <IconAward size={12} color={theme.accent} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent }}>
              Lv.{gamificationProfile?.level || 1} • {gamificationProfile?.totalXp || 0} XP
            </Text>
          </TouchableOpacity>

          {/* STREAK PILL */}
          <View style={[styles.streakPill, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)' }]}>
            <IconFlame size={13} color="#f59e0b" />
            <Text style={styles.streakText}>{streak}d</Text>
          </View>
        </View>
      </View>

      {/* FLOATING XP TOAST NOTIFICATION */}
      {Boolean(floatingXp) ?
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 60,
          alignSelf: 'center',
          zIndex: 9999,
          backgroundColor: '#f59e0b',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          shadowColor: '#f59e0b',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 10,
          opacity: xpAnim.interpolate({
            inputRange: [0, 0.2, 1, 2],
            outputRange: [0, 1, 1, 0]
          }),
          transform: [
          {
            translateY: xpAnim.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [15, 0, -25]
            })
          },
          {
            scale: xpAnim.interpolate({
              inputRange: [0, 0.5, 1, 2],
              outputRange: [0.7, 1.15, 1, 0.9]
            })
          }]

        }}>
        
          <Text style={{ fontSize: 16 }}>⭐</Text>
          <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>
            +{floatingXp.amount} XP • {floatingXp.label}
          </Text>
        </Animated.View> : null
      }

      {/* 2. MAIN CONTENT BODY WITH SWIPE GESTURES */}
      <View style={styles.body} {...panResponder.panHandlers}>
        {loading ?
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang đồng bộ kho dữ liệu...</Text>
          </View> :

        <Animated.View style={{ flex: 1, opacity: tabFadeAnim, transform: [{ translateY: tabSlideAnim }] }}>
            {/* TAB 1: DASHBOARD / HOME */}
            {currentTab === 'home' ?
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent} />

            }>
            
                {/* HERO SRS ACTION CARD */}
                <View style={[styles.heroCard, totalDue > 0 ? styles.heroCardActive : styles.heroCardDone]}>
                  <View style={styles.heroHeaderPill}>
                    <IconZap size={13} color="#ffffff" />
                    <Text style={styles.heroHeaderPillText}>SPACED REPETITION (SM-2)</Text>
                  </View>

                  <Text style={styles.heroTitle}>
                    {totalDue > 0 ? `${totalDue} thẻ cần ôn tập hôm nay` : 'Tuyệt vời! Đã hoàn thành'}
                  </Text>
                  <Text style={styles.heroDesc}>
                    {totalDue > 0 ?
                'Dành 3 phút ôn đúng thời điểm vàng để chống lại đường cong lãng quên.' :
                'Mọi từ vựng đều nằm trong chu kỳ ghi nhớ an toàn.'}
                  </Text>

                  {totalDue > 0 ?
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => navigateTo('review')}>
                
                      <Text style={styles.heroBtnText}>Bắt Đầu Ôn Tập Ngay</Text>
                      <IconArrowRight size={18} color="#0284c7" />
                    </TouchableOpacity> :

              <TouchableOpacity
                style={styles.heroBtnSecondary}
                onPress={() => navigateTo('add')}>
                
                      <IconPlus size={16} color="#ffffff" />
                      <Text style={styles.heroBtnSecondaryText}>Thêm Từ Vựng Mới</Text>
                    </TouchableOpacity>
              }
                </View>

                {/* USER LEVEL & PROGRESS CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, gap: 10 }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardSectionLabel, { color: theme.accent }]}>
                      LEVEL {gamificationProfile?.level || 1} • {gamificationProfile?.totalXp || 0} XP
                    </Text>
                    <TouchableOpacity onPress={() => setShowLevelLadderModal(true)}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>Bảng Cấp Độ ↗</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginVertical: 2 }}>
                    {gamificationProfile?.title || 'Novice Scholar 🌱'}
                  </Text>

                  <View style={[styles.progressBarBg, { backgroundColor: theme.inputBg, height: 6, borderRadius: 3 }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: theme.accent, width: `${Math.min(100, Math.max(8, gamificationProfile?.progressPercent || 0))}%`, borderRadius: 3 }]} />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.mutedText, { color: theme.textMuted }]}>
                      Tiến độ lên Lv.{(gamificationProfile?.level || 1) + 1}: {gamificationProfile?.progressPercent || 0}%
                    </Text>
                    <Text style={[styles.mutedText, { color: theme.textMuted }]}>
                      Streak: 🔥 {streak} ngày
                    </Text>
                  </View>

                  {/* AI VOCABULARY REPORT BUTTON */}
                  <TouchableOpacity
                onPress={() => {
                  fetchMobileAIMasteryReport();
                  setShowAIMasteryModal(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                  borderWidth: 1,
                  borderColor: '#6366f1',
                  borderRadius: 12,
                  paddingVertical: 10,
                  gap: 6,
                  marginTop: 4
                }}>
                
                    <IconSparkles size={16} color="#6366f1" />
                    <Text style={{ color: '#6366f1', fontWeight: '800', fontSize: 13 }}>
                      📊 Báo Cáo Đánh Giá Năng Lực AI
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 4-GRID STATS */}
                <View style={styles.statsGrid}>
                  <TouchableOpacity onPress={() => navigateTo('vocab')} style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statBoxNum, { color: theme.textPrimary }]}>{totalCount}</Text>
                    <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Kho Từ Vựng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigateTo('vocab')} style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statBoxNum, { color: '#10b981' }]}>{masteredCount}</Text>
                    <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Thuần Thục</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigateTo('patterns')} style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statBoxNum, { color: '#a855f7' }]}>{patterns.length}</Text>
                    <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Mẫu Câu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigateTo('reader')} style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statBoxNum, { color: '#f59e0b' }]}>{notes.length}</Text>
                    <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Bài Đọc</Text>
                  </TouchableOpacity>
                </View>

                {/* 4b. MEMORY RETENTION STAGES CARD (CHỈ SỐ PHÂN BỔ TRÍ NHỚ PRO MAX) */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, padding: 16, borderRadius: 20, gap: 12, marginVertical: 6 }]}>
                  {/* Header Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14 }}>📈</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }} numberOfLines={1}>
                          Chỉ Số Phân Bổ Trí Nhớ
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textMuted }}>
                          Chu kỳ lặp lại ngắt quãng SM-2
                        </Text>
                      </View>
                    </View>

                    {/* Total Count Pill Badge */}
                    <View style={{
                  backgroundColor: theme.drawerCardBg,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  flexShrink: 0
                }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent }}>
                        {totalCount} <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textMuted }}>từ</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Multi-Segment Stacked Progress Bar */}
                  <View style={{
                flexDirection: 'row',
                height: 10,
                borderRadius: 5,
                overflow: 'hidden',
                backgroundColor: isDark ? '#1e293b' : '#e2e8f0'
              }}>
                    {totalCount > 0 ?
                <>
                        {masteredCount > 0 ? <View style={{ width: `${masteredCount / totalCount * 100}%`, backgroundColor: '#10b981' }} /> : null}
                        {reviewingCount > 0 ? <View style={{ width: `${reviewingCount / totalCount * 100}%`, backgroundColor: '#0284c7' }} /> : null}
                        {learningCount > 0 ? <View style={{ width: `${learningCount / totalCount * 100}%`, backgroundColor: '#f59e0b' }} /> : null}
                        {newCount > 0 ? <View style={{ width: `${newCount / totalCount * 100}%`, backgroundColor: '#94a3b8' }} /> : null}
                      </> :

                <View style={{ flex: 1, backgroundColor: theme.cardBorder }} />
                }
                  </View>

                  {/* 2x2 Grid of Micro Cards with Badges & Counts */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* Mastered */}
                    <View style={{
                  flex: 1,
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)',
                  borderRadius: 12,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(16, 185, 129, 0.25)',
                  gap: 4
                }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' }} />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981' }}>Mastered</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#10b981' }}>{masteredCount}</Text>
                      </View>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textMuted }}>Thuần thục</Text>
                    </View>

                    {/* Reviewing */}
                    <View style={{
                  flex: 1,
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.08)' : 'rgba(2, 132, 199, 0.06)',
                  borderRadius: 12,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(2, 132, 199, 0.25)',
                  gap: 4
                }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#0284c7' }} />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#0284c7' }}>Reviewing</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#0284c7' }}>{reviewingCount}</Text>
                      </View>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textMuted }}>Đang nhớ tốt</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* Learning */}
                    <View style={{
                  flex: 1,
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                  borderRadius: 12,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                  gap: 4
                }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#f59e0b' }} />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#f59e0b' }}>Learning</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#f59e0b' }}>{learningCount}</Text>
                      </View>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textMuted }}>Đang học</Text>
                    </View>

                    {/* New */}
                    <View style={{
                  flex: 1,
                  backgroundColor: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.06)',
                  borderRadius: 12,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.25)',
                  gap: 4
                }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#94a3b8' }} />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8' }}>New</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: theme.textPrimary }}>{newCount}</Text>
                      </View>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: theme.textMuted }}>Mới thêm</Text>
                    </View>
                  </View>
                </View>

                {/* 5. TOPIC EXPLORER CAROUSEL PRO */}
                <View style={{ marginTop: 6, marginBottom: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontSize: 15, marginBottom: 0 }]}>
                        Chủ Đề Từ Vựng
                      </Text>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: theme.accentPill }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent }}>{topics.length} chủ đề</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setShowTopicManagerModal(true)}>
                      <Text style={[styles.linkText, { color: theme.accent }]}>+ Quản lý ↗</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                    {topics.map((t) => {
                  const count = words.filter((w) => w.topic_id === t.id).length;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => {
                        setSelectedTopicFilter(t.id);
                        setVocabViewMode('grouped');
                        navigateTo('vocab');
                      }}
                      activeOpacity={0.75}
                      style={{
                        width: 140,
                        padding: 12,
                        borderRadius: 16,
                        backgroundColor: isDark ? `${t.color || '#0284c7'}15` : `${t.color || '#0284c7'}10`,
                        borderWidth: 1,
                        borderColor: `${t.color || '#0284c7'}35`,
                        justifyContent: 'space-between'
                      }}>
                      
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={{ fontSize: 24 }}>{t.emoji || '📁'}</Text>
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: `${t.color || '#0284c7'}25` }}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: t.color || '#0284c7' }}>{count} từ</Text>
                            </View>
                          </View>
                          <View style={{ marginTop: 10 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }} numberOfLines={1}>
                              {t.name}
                            </Text>
                            <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                              {t.description || 'Chạm để học theo chủ đề'}
                            </Text>
                          </View>
                        </TouchableOpacity>);

                })}
                  </ScrollView>
                </View>

                {/* QUICK ACTION ROW */}
                <View style={styles.quickActionRow}>
                  <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.card, borderColor: '#a855f7' }]}
                onPress={() => navigateTo('ai-lab')}>
                
                    <IconSparkles size={20} color="#a855f7" />
                    <Text style={[styles.quickActionTitle, { color: theme.textPrimary }]}>AI English Lab</Text>
                    <Text style={[styles.quickActionSub, { color: theme.textSecondary }]}>Bóc tách & Chấm câu</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: theme.card, borderColor: theme.accent }]}
                onPress={() => navigateTo('reader')}>
                
                    <IconFileText size={20} color={theme.accent} />
                    <Text style={[styles.quickActionTitle, { color: theme.textPrimary }]}>Smart Reader</Text>
                    <Text style={[styles.quickActionSub, { color: theme.textSecondary }]}>Ghi chú & Bài báo</Text>
                  </TouchableOpacity>
                </View>

                {/* RECENT WORDS PREVIEW */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Từ Vựng Gần Đây</Text>
                  <TouchableOpacity onPress={() => navigateTo('vocab')}>
                    <Text style={[styles.linkText, { color: theme.accent }]}>Xem tất cả ({words.length})</Text>
                  </TouchableOpacity>
                </View>

                {words.slice(0, 4).map((item) =>
            <View key={item.id} style={[styles.vocabListItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.vocabItemLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.vocabWordText, { color: theme.textPrimary }]}>{item.word}</Text>
                        <TouchableOpacity onPress={() => playMobileAudio(item.word)}>
                          <IconVolume2 size={16} color={theme.accent} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.vocabPhoneticText, { color: theme.textMuted }]}>{item.phonetic || ''}</Text>
                      <Text style={[styles.vocabMeaningText, { color: theme.accent }]}>{item.meaning_vi}</Text>
                    </View>
                    <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                      <Text style={[styles.levelPillText, { color: theme.accent }]}>{item.level || 'B2'}</Text>
                    </View>
                  </View>
            )}
              </ScrollView> : null
          }

            {/* TAB 2: SRS FLASHCARD REVIEW PRO MAX */}
            {currentTab === 'review' ? (() => {
            const activeDeck = reviewScope === 'words' ?
            dueItems.filter((i) => (i.type || 'word') === 'word') :
            reviewScope === 'patterns' ?
            dueItems.filter((i) => i.type === 'pattern') :
            dueItems;

            const wordsDueCount = dueItems.filter((i) => (i.type || 'word') === 'word').length;
            const patternsDueCount = dueItems.filter((i) => i.type === 'pattern').length;
            const curItem = activeDeck[reviewIndex];
            const isWord = curItem ? (curItem.type || 'word') === 'word' : true;
            const primaryExample = curItem?.examples?.[0] || '';
            const targetWord = isWord ? curItem?.word || '' : curItem?.name || '';

            // Helper for cloze sentences (safe against special characters)
            const getClozeSentenceMobile = (sentence, word) => {
              if (!sentence || !word) return sentence || '________';
              try {
                const clean = String(word).trim();
                const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
                if (regex.test(sentence)) {
                  return sentence.replace(regex, '________');
                }
                const simple = new RegExp(escaped, 'gi');
                return sentence.replace(simple, '________');
              } catch (e) {
                return String(sentence).replace(String(word), '________');
              }
            };

            // Case 1: Session completed after reviewing cards
            if (reviewSessionStats.reviewed > 0 && reviewIndex >= activeDeck.length) {
              return (
                <View style={[styles.centerContainer, { padding: 24 }]}>
                    <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    borderWidth: 2,
                    borderColor: '#f59e0b'
                  }}>
                      <IconTrophy size={48} color="#f59e0b" />
                    </View>
                    <Text style={[styles.celebrationTitle, { color: theme.textPrimary, fontSize: 22, textAlign: 'center' }]}>
                      Hoàn Thành Phiên Ôn Tập!
                    </Text>
                    <Text style={[styles.celebrationDesc, { color: theme.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
                      Bạn đã hoàn thành xuất sắc {reviewSessionStats.reviewed} lượt ôn tập SM-2+ hôm nay!
                    </Text>

                    {/* Stats Summary Card */}
                    <View style={{
                    width: '100%',
                    maxWidth: 320,
                    backgroundColor: theme.card,
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    marginBottom: 20,
                    gap: 10
                  }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Kinh nghiệm nhận được:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <IconStar size={13} color={theme.accent} fill={theme.accent} />
                          <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 13 }}>+{reviewSessionStats.earnedXp} XP</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Số thẻ nhớ tốt / dễ:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <IconCheckCircle2 size={13} color="#10b981" />
                          <Text style={{ color: '#10b981', fontWeight: '800', fontSize: 13 }}>{reviewSessionStats.goodCount + reviewSessionStats.easyCount} thẻ</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Số thẻ cần lặp lại:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <IconXCircle size={13} color="#ef4444" />
                          <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 13 }}>{reviewSessionStats.againCount} thẻ</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, width: '100%', maxWidth: 320 }]}
                    onPress={() => {
                      setReviewIndex(0);
                      setIsFlipped(false);
                      navigateTo('home');
                    }}>
                    
                      <Text style={styles.primaryActionBtnText}>Về Trang Chủ</Text>
                      <IconArrowRight size={18} color="#ffffff" />
                    </TouchableOpacity>
                  </View>);

            }

            return (
              <View style={styles.reviewContainer}>
                  {/* 1. TOP BAR: CATEGORY FILTER PILLS + COMPACT CLOSE BUTTON */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', backgroundColor: theme.drawerCardBg, padding: 3, borderRadius: 20, gap: 3, borderWidth: 1, borderColor: theme.cardBorder }}>
                      <TouchableOpacity
                      onPress={() => {resetCardState();setReviewScope('all');setReviewIndex(0);}}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 16,
                        backgroundColor: reviewScope === 'all' ? theme.accent : 'transparent'
                      }}>
                      
                        <Text style={{ fontSize: 11, fontWeight: '800', color: reviewScope === 'all' ? '#ffffff' : theme.textSecondary }}>
                          Tất cả ({dueItems.length})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                      onPress={() => {resetCardState();setReviewScope('words');setReviewIndex(0);}}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 16,
                        backgroundColor: reviewScope === 'words' ? theme.accent : 'transparent'
                      }}>
                      
                        <IconBookOpen size={12} color={reviewScope === 'words' ? '#ffffff' : theme.textSecondary} />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: reviewScope === 'words' ? '#ffffff' : theme.textSecondary }}>
                          Từ vựng ({wordsDueCount})
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                      onPress={() => {resetCardState();setReviewScope('patterns');setReviewIndex(0);}}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 16,
                        backgroundColor: reviewScope === 'patterns' ? theme.accent : 'transparent'
                      }}>
                      
                        <IconPuzzle size={12} color={reviewScope === 'patterns' ? '#ffffff' : theme.textSecondary} />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: reviewScope === 'patterns' ? '#ffffff' : theme.textSecondary }}>
                          Mẫu câu ({patternsDueCount})
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                    onPress={() => navigateTo('home')}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: theme.drawerCardBg,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Thoát ôn tập">
                    
                      <IconX size={14} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* 2. MODE SELECTOR SEGMENTED CONTROL */}
                  <View style={{ flexDirection: 'row', backgroundColor: theme.drawerCardBg, padding: 3, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 8 }}>
                    <TouchableOpacity
                    onPress={() => {resetCardState();setReviewMode('flashcard');}}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      paddingVertical: 6,
                      borderRadius: 11,
                      backgroundColor: reviewMode === 'flashcard' ? theme.card : 'transparent',
                      shadowColor: reviewMode === 'flashcard' ? '#000' : 'transparent',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: reviewMode === 'flashcard' ? 0.08 : 0,
                      shadowRadius: 3,
                      elevation: reviewMode === 'flashcard' ? 2 : 0
                    }}>
                    
                      <IconLayers size={13} color={reviewMode === 'flashcard' ? theme.accent : theme.textMuted} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: reviewMode === 'flashcard' ? theme.accent : theme.textMuted }}>
                        Flashcard
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={() => {resetCardState();setReviewMode('cloze');}}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      paddingVertical: 6,
                      borderRadius: 11,
                      backgroundColor: reviewMode === 'cloze' ? theme.card : 'transparent',
                      shadowColor: reviewMode === 'cloze' ? '#000' : 'transparent',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: reviewMode === 'cloze' ? 0.08 : 0,
                      shadowRadius: 3,
                      elevation: reviewMode === 'cloze' ? 2 : 0
                    }}>
                    
                      <IconEdit size={13} color={reviewMode === 'cloze' ? theme.accent : theme.textMuted} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: reviewMode === 'cloze' ? theme.accent : theme.textMuted }}>
                        Điền từ
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={() => {
                      resetCardState();
                      setReviewMode('audio');
                      if (curItem) playMobileAudio(curItem.word || curItem.name, mobileSpeed, mobileAccent);
                    }}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      paddingVertical: 6,
                      borderRadius: 11,
                      backgroundColor: reviewMode === 'audio' ? theme.card : 'transparent',
                      shadowColor: reviewMode === 'audio' ? '#000' : 'transparent',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: reviewMode === 'audio' ? 0.08 : 0,
                      shadowRadius: 3,
                      elevation: reviewMode === 'audio' ? 2 : 0
                    }}>
                    
                      <IconHeadphones size={13} color={reviewMode === 'audio' ? theme.accent : theme.textMuted} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: reviewMode === 'audio' ? theme.accent : theme.textMuted }}>
                        Nghe ẩn
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {activeDeck.length === 0 ?
                <View style={styles.centerContainer}>
                      <View style={{ marginBottom: 10 }}>
                        {reviewScope === 'patterns' ?
                    <IconPuzzle size={42} color={theme.accent} /> :

                    <IconBookOpen size={42} color={theme.accent} />
                    }
                      </View>
                      <Text style={[styles.celebrationTitle, { color: theme.textPrimary, marginTop: 4 }]}>
                        {dueItems.length === 0 ?
                    'Đã Hoành Thành!' :
                    reviewScope === 'patterns' ?
                    'Chưa Có Mẫu Câu Đến Hạn' :
                    'Chưa Có Từ Vựng Đến Hạn'}
                      </Text>
                      <Text style={[styles.celebrationDesc, { color: theme.textSecondary, marginBottom: 16 }]}>
                        {dueItems.length === 0 ?
                    'Không còn thẻ nào cần ôn tập hôm nay.' :
                    `Tất cả các ${reviewScope === 'patterns' ? 'mẫu câu' : 'từ vựng'} đang trong chu kỳ nhớ tốt.`}
                      </Text>
                      {dueItems.length > 0 ?
                  <View style={{ gap: 8, width: '100%', maxWidth: 280 }}>
                          <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg }]}
                      onPress={() => {resetCardState();setReviewScope('all');setReviewIndex(0);}}>
                      
                            <Text style={styles.primaryActionBtnText}>Xem Tất Cả ({dueItems.length} thẻ)</Text>
                          </TouchableOpacity>
                          {reviewScope !== 'words' && wordsDueCount > 0 ?
                    <TouchableOpacity
                      style={{ paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center' }}
                      onPress={() => {resetCardState();setReviewScope('words');setReviewIndex(0);}}>
                      
                              <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>Ôn Từ Vựng ({wordsDueCount})</Text>
                            </TouchableOpacity> : null
                    }
                        </View> :

                  <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg }]} onPress={() => navigateTo('home')}>
                          <Text style={styles.primaryActionBtnText}>Về Trang Chủ</Text>
                        </TouchableOpacity>
                  }
                    </View> :

                <>
                      {/* 3. PROGRESS BAR & REALTIME STATS CARD */}
                      <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: theme.card,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    marginBottom: 6
                  }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textPrimary, minWidth: 56 }}>
                            Thẻ {reviewIndex + 1}/{activeDeck.length}
                          </Text>
                          <View style={{ flex: 1, height: 5, backgroundColor: theme.drawerCardBg, borderRadius: 3, overflow: 'hidden' }}>
                            <View style={{
                          width: `${activeDeck.length > 0 ? Math.min(100, (reviewIndex + 1) / activeDeck.length * 100) : 0}%`,
                          height: '100%',
                          backgroundColor: theme.accent,
                          borderRadius: 3
                        }} />
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(2, 132, 199, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                            <IconStar size={10} color={theme.accent} fill={theme.accent} />
                            <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent }}>
                              +{reviewSessionStats.earnedXp}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                            <IconCheckCircle2 size={10} color="#10b981" />
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#10b981' }}>
                              {reviewSessionStats.goodCount + reviewSessionStats.easyCount}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                            <IconXCircle size={10} color="#ef4444" />
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#ef4444' }}>
                              {reviewSessionStats.againCount}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* 4. ANIMATED CARD CONTAINER WITH PRO MAX 3D FLIP DESIGN */}
                      <Animated.View
                    style={{
                      flex: 1,
                      width: '100%',
                      minHeight: 380,
                      marginVertical: 4,
                      opacity: cardFadeAnim,
                      transform: [
                      { translateX: cardSlideAnim },
                      {
                        scale: flipAnim.interpolate({
                          inputRange: [0, 90, 180],
                          outputRange: [1, 0.96, 1]
                        })
                      }]

                    }}>
                    
                        <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => (reviewMode === 'flashcard' || reviewMode === 'audio') && flipCard()}
                      style={{ flex: 1, width: '100%' }}>
                      
                          {!isFlipped ? (
                      /* FRONT FACE */
                      <View
                        style={[
                        styles.flashcard,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.cardBorder
                        }]
                        }>
                        
                              {/* Card Top Header */}
                              <View style={styles.cardFrontBadgeRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <View style={[styles.levelPill, { backgroundColor: theme.accentPill, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }]}>
                                    <Text style={[styles.levelPillText, { color: theme.accent, fontWeight: '900', fontSize: 11 }]}>
                                      {curItem?.type === 'pattern' ? 'MẪU CÂU' : curItem?.level || 'B2'}
                                    </Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                    <IconClock size={11} color={theme.textMuted} />
                                    <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '600' }}>
                                      Lặp lại: {curItem?.repetition || 0}
                                    </Text>
                                  </View>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <TouchableOpacity
                              onPress={() => setShowAudioSpeedModal(true)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 3,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 10,
                                backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
                                borderWidth: 1,
                                borderColor: theme.accent
                              }}>
                              
                                    <IconZap size={10} color={theme.accent} />
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent }}>
                                      {mobileSpeed.toFixed(2)}x
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                              onPress={() => playMobileAudio(curItem?.word || curItem?.name, mobileSpeed, mobileAccent)}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                              
                                    <IconVolume2 size={20} color={theme.accent} />
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {/* MODE 1: FLASHCARD FRONT - TRUE VERTICAL & HORIZONTAL CENTER */}
                              {reviewMode === 'flashcard' ?
                        <View style={styles.cardCenterBody}>
                                  <Text style={[styles.cardWordMain, { color: theme.textPrimary }]}>
                                    {curItem?.word || curItem?.name}
                                  </Text>
                                  {Boolean(curItem?.phonetic) ?
                          <View style={{
                            backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.08)',
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 12,
                            marginTop: 8
                          }}>
                                      <Text style={[styles.cardPhonetic, { color: theme.accent }]}>
                                        {curItem?.phonetic}
                                      </Text>
                                    </View> : null
                          }
                                  {Boolean(curItem?.formula) ?
                          <View style={{
                            backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.08)',
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 10,
                            marginTop: 8
                          }}>
                                      <Text style={{ color: '#ec4899', fontSize: 13, fontWeight: '700' }}>
                                        {curItem.formula}
                                      </Text>
                                    </View> : null
                          }
                                </View> : null
                        }

                              {/* MODE 2: CLOZE FRONT */}
                              {reviewMode === 'cloze' ?
                        <View style={{ width: '100%', flex: 1, justifyContent: 'center', paddingVertical: 12, gap: 12 }}>
                                  <View style={[styles.exampleBox, { backgroundColor: theme.exampleBg, borderLeftColor: theme.accent, marginTop: 0 }]}>
                                    <Text style={{ fontSize: 14, fontStyle: 'italic', color: theme.textPrimary, lineHeight: 22 }}>
                                      "{getClozeSentenceMobile(primaryExample || targetWord, targetWord)}"
                                    </Text>
                                  </View>

                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <IconLightbulb size={13} color="#f59e0b" />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.accent }}>
                                      Nghĩa: {curItem?.meaning_vi || curItem?.meaning || curItem?.description}
                                    </Text>
                                  </View>

                                  {Boolean(clozeHintShown) ?
                          <Text style={{ fontSize: 11, color: '#f59e0b', fontWeight: '700' }}>
                                      Gợi ý: {targetWord.slice(0, 2)}... ({targetWord.length} chữ cái)
                                    </Text> : null
                          }

                                  <TextInput
                            style={{
                              width: '100%',
                              height: 44,
                              borderRadius: 12,
                              borderWidth: 1.5,
                              borderColor: clozeChecked ?
                              clozeInput.trim().toLowerCase() === targetWord.toLowerCase() ? '#10b981' : '#ef4444' :
                              theme.cardBorder,
                              backgroundColor: theme.drawerCardBg,
                              color: theme.textPrimary,
                              paddingHorizontal: 14,
                              fontSize: 15,
                              fontWeight: '700'
                            }}
                            placeholder="Nhập từ còn thiếu..."
                            placeholderTextColor={theme.textMuted}
                            value={clozeInput}
                            onChangeText={setClozeInput}
                            autoCapitalize="none"
                            autoCorrect={false}
                            onSubmitEditing={() => {
                              setClozeChecked(true);
                              flipCard();
                            }} />
                          

                                  <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                              style={{
                                flex: 1,
                                paddingVertical: 10,
                                backgroundColor: theme.btnPrimaryBg,
                                borderRadius: 12,
                                alignItems: 'center'
                              }}
                              onPress={() => {
                                setClozeChecked(true);
                                flipCard();
                              }}>
                              
                                      <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>
                                        Kiểm Tra & Xem Đáp Án
                                      </Text>
                                    </TouchableOpacity>

                                    {Boolean(!clozeHintShown) ?
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#f59e0b',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onPress={() => setClozeHintShown(true)}>
                              
                                        <IconLightbulb size={12} color="#f59e0b" />
                                        <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 11 }}>
                                          Gợi Ý
                                        </Text>
                                      </TouchableOpacity> : null
                            }
                                  </View>
                                </View> : null
                        }

                              {/* MODE 3: AUDIO BLIND FRONT */}
                              {reviewMode === 'audio' ?
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 12 }}>
                                  <TouchableOpacity
                            onPress={() => playMobileAudio(targetWord, mobileSpeed, mobileAccent)}
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: 40,
                              backgroundColor: 'rgba(2, 132, 199, 0.15)',
                              borderWidth: 2,
                              borderColor: theme.accent,
                              alignItems: 'center',
                              justifyContent: 'center',
                              shadowColor: theme.accent,
                              shadowOffset: { width: 0, height: 6 },
                              shadowOpacity: 0.25,
                              shadowRadius: 12,
                              elevation: 6
                            }}>
                            
                                    <IconVolume2 size={38} color={theme.accent} />
                                  </TouchableOpacity>

                                  <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary, textAlign: 'center' }}>
                                    Lắng Nghe Phát Âm Studio
                                  </Text>
                                  <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center', maxWidth: 260 }}>
                                    Nghe kỹ âm thanh và tự nhớ lại từ vựng + nghĩa trước khi lật đáp án.
                                  </Text>
                                </View> : null
                        }

                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', marginTop: 'auto' }}>
                                <IconRotateCw size={12} color={theme.textMuted} />
                                <Text style={[styles.cardFooterHint, { color: theme.textMuted }]}>
                                  Chạm vào thẻ để lật xem đáp án
                                </Text>
                              </View>
                            </View>) : (

                      /* BACK FACE */
                      <View
                        style={[
                        styles.flashcard,
                        {
                          backgroundColor: theme.innerCard,
                          borderColor: theme.accent
                        }]
                        }>
                        
                              <ScrollView showsVerticalScrollIndicator={false} style={styles.cardBackScroll}>
                                <View style={styles.cardFrontBadgeRow}>
                                  <Text style={[styles.backWordTitle, { color: theme.textPrimary }]}>
                                    {curItem?.word || curItem?.name}
                                  </Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <TouchableOpacity
                                onPress={() => setShowAudioSpeedModal(true)}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 3,
                                  paddingHorizontal: 8,
                                  paddingVertical: 4,
                                  borderRadius: 10,
                                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
                                  borderWidth: 1,
                                  borderColor: theme.accent
                                }}>
                                
                                      <IconZap size={10} color={theme.accent} />
                                      <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent }}>
                                        {mobileSpeed.toFixed(2)}x
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                onPress={() => playMobileAudio(curItem?.word || curItem?.name, mobileSpeed, mobileAccent)}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 18,
                                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                
                                      <IconVolume2 size={20} color={theme.accent} />
                                    </TouchableOpacity>
                                  </View>
                                </View>

                                {reviewMode === 'cloze' ?
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            padding: 8,
                            borderRadius: 10,
                            backgroundColor: clozeInput.trim().toLowerCase() === targetWord.toLowerCase() ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            marginTop: 10
                          }}>
                                    {clozeInput.trim().toLowerCase() === targetWord.toLowerCase() ?
                            <IconCheckCircle2 size={14} color="#10b981" /> :

                            <IconXCircle size={14} color="#ef4444" />
                            }
                                    <Text style={{ fontSize: 11, fontWeight: '800', color: clozeInput.trim().toLowerCase() === targetWord.toLowerCase() ? '#10b981' : '#ef4444', flex: 1 }}>
                                      {clozeInput.trim().toLowerCase() === targetWord.toLowerCase() ?
                              'Chính xác! Bạn đã điền đúng từ này.' :
                              `Câu trả lời: "${clozeInput || '(trống)'}" • Đáp án: "${targetWord}"`}
                                    </Text>
                                  </View> : null
                          }

                                <View style={styles.backSectionBox}>
                                  <Text style={[styles.backSectionLabel, { color: theme.textSecondary }]}>Nghĩa Tiếng Việt:</Text>
                                  <Text style={[styles.backMeaningVi, { color: theme.accent }]}>
                                    {curItem?.meaning_vi || curItem?.meaning || curItem?.description}
                                  </Text>
                                </View>

                                {Boolean(curItem?.meaning_en) ?
                          <View style={styles.backSectionBox}>
                                    <Text style={[styles.backSectionLabel, { color: theme.textSecondary }]}>Định nghĩa tiếng Anh:</Text>
                                    <Text style={[styles.backMeaningEn, { color: theme.textSecondary }]}>
                                      {curItem?.meaning_en}
                                    </Text>
                                  </View> : null
                          }

                                {curItem?.collocations && curItem?.collocations.length > 0 ?
                          <View style={[styles.backSectionBox, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.08)', borderColor: 'rgba(168, 85, 247, 0.2)', padding: 10, borderRadius: 12 }]}>
                                    <Text style={[styles.backSectionLabel, { color: '#a855f7' }]}>Collocations:</Text>
                                    {curItem.collocations.map((c, i) =>
                            <Text key={i} style={{ fontSize: 12, color: theme.textPrimary, marginTop: 3 }}>
                                        • {typeof c === 'string' ? c : c.phrase}
                                      </Text>
                            )}
                                  </View> : null
                          }

                                {curItem?.examples && curItem?.examples.length > 0 ?
                          <View style={[styles.exampleBox, { backgroundColor: theme.exampleBg, borderLeftColor: theme.exampleBorder }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Text style={[styles.exampleText, { color: theme.exampleText, flex: 1, marginRight: 8 }]}>
                                        "{curItem?.examples[0]}"
                                      </Text>
                                      <TouchableOpacity onPress={() => playMobileAudio(curItem?.examples[0], mobileSpeed, mobileAccent)}>
                                        <IconVolume2 size={16} color={theme.accent} />
                                      </TouchableOpacity>
                                    </View>
                                  </View> : null
                          }
                              </ScrollView>
                            </View>)
                      }
                        </TouchableOpacity>
                      </Animated.View>

                      {/* 5. SUPERMEMO SM-2+ MULTI-MILESTONE RATING BUTTONS */}
                      <View style={{ marginTop: 8, marginBottom: 4 }}>
                        {isFlipped ?
                    <View style={styles.ratingBtnGrid}>
                            <TouchableOpacity
                        style={[styles.ratingBtn, { backgroundColor: '#ef4444' }]}
                        onPress={() => handleReviewGrade('again')}
                        activeOpacity={0.85}>
                        
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <IconXCircle size={13} color="#ffffff" />
                                <Text style={styles.ratingBtnText}>Quên</Text>
                              </View>
                              <Text style={styles.ratingBtnSub}>&lt; 10 phút</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                        style={[styles.ratingBtn, { backgroundColor: '#f59e0b' }]}
                        onPress={() => handleReviewGrade('hard')}
                        activeOpacity={0.85}>
                        
                              <Text style={styles.ratingBtnText}>Khó</Text>
                              <Text style={styles.ratingBtnSub}>{curItem?.previewIntervals?.hard?.text || '1 ngày'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                        style={[styles.ratingBtn, { backgroundColor: '#0284c7' }]}
                        onPress={() => handleReviewGrade('good')}
                        activeOpacity={0.85}>
                        
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <IconCheckCircle2 size={13} color="#ffffff" />
                                <Text style={styles.ratingBtnText}>Nhớ tốt</Text>
                              </View>
                              <Text style={styles.ratingBtnSub}>{curItem?.previewIntervals?.good?.text || '3 ngày'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                        style={[styles.ratingBtn, { backgroundColor: '#10b981' }]}
                        onPress={() => handleReviewGrade('easy')}
                        activeOpacity={0.85}>
                        
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <IconDiamond size={13} color="#ffffff" />
                                <Text style={styles.ratingBtnText}>Dễ</Text>
                              </View>
                              <Text style={styles.ratingBtnSub}>{curItem?.previewIntervals?.easy?.text || '7 ngày'}</Text>
                            </TouchableOpacity>
                          </View> :

                    <TouchableOpacity
                      style={[styles.tapToRevealBtn, { backgroundColor: theme.btnPrimaryBg }]}
                      onPress={flipCard}
                      activeOpacity={0.88}>
                      
                            <IconRotateCw size={17} color="#ffffff" />
                            <Text style={styles.tapToRevealBtnText}>Chạm Để Xem Đáp Án</Text>
                            <IconArrowRight size={18} color="#ffffff" />
                          </TouchableOpacity>
                    }
                      </View>
                    </>
                }
                </View>);

          })() : null}

            {/* TAB 3: VOCABULARY VAULT */}
            {currentTab === 'vocab' ?
          <View style={styles.tabContainer}>
                {/* 1. TOP HEADER: Search Bar & View Switcher in 1 Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={[styles.searchBox, { flex: 1, backgroundColor: theme.card, borderColor: theme.cardBorder, marginBottom: 0, height: 42, paddingHorizontal: 12 }]}>
                    <IconSearch size={16} color={theme.textMuted} />
                    <TextInput
                  style={[styles.searchInput, { color: theme.textPrimary, height: 40, fontSize: 13 }]}
                  placeholder="Tìm từ vựng, nghĩa, ví dụ..."
                  placeholderTextColor={theme.textMuted}
                  value={vocabSearch}
                  onChangeText={setVocabSearch} />
                
                    {vocabSearch.length > 0 ?
                <TouchableOpacity onPress={() => setVocabSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <IconX size={16} color={theme.textSecondary} />
                      </TouchableOpacity> : null
                }
                  </View>

                  {/* View Mode Toggle */}
                  <View style={{ flexDirection: 'row', backgroundColor: theme.drawerCardBg, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: theme.cardBorder, height: 42, alignItems: 'center' }}>
                    <TouchableOpacity
                  onPress={() => setVocabViewMode('list')}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 6,
                    borderRadius: 9,
                    backgroundColor: vocabViewMode === 'list' ? theme.btnPrimaryBg : 'transparent'
                  }}>
                  
                      <Text style={{ fontSize: 11, fontWeight: vocabViewMode === 'list' ? '800' : '600', color: vocabViewMode === 'list' ? '#ffffff' : theme.textMuted }}>
                        📄 Lưới
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                  onPress={() => setVocabViewMode('grouped')}
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 6,
                    borderRadius: 9,
                    backgroundColor: vocabViewMode === 'grouped' ? theme.btnPrimaryBg : 'transparent'
                  }}>
                  
                      <Text style={{ fontSize: 11, fontWeight: vocabViewMode === 'grouped' ? '800' : '600', color: vocabViewMode === 'grouped' ? '#ffffff' : theme.textMuted }}>
                        📂 Chủ Đề
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. DẢI CHỦ ĐỀ (TOPIC FILTER CAROUSEL) */}
                <View style={{ height: 36, marginBottom: 8 }}>
                  <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, alignItems: 'center', paddingHorizontal: 2 }}
                style={{ flexGrow: 0 }}>
                
                    <TouchableOpacity
                  onPress={() => setSelectedTopicFilter('all')}
                  style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedTopicFilter === 'all' ? theme.btnPrimaryBg : theme.card,
                    borderColor: selectedTopicFilter === 'all' ? theme.btnPrimaryBg : theme.cardBorder,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    height: 32
                  }]
                  }>
                  
                      <Text style={{ fontSize: 12, fontWeight: '800', color: selectedTopicFilter === 'all' ? '#ffffff' : theme.textSecondary }}>
                        ✨ Tất cả chủ đề ({words.length})
                      </Text>
                    </TouchableOpacity>

                    {topics.map((t) => {
                  const isSelected = selectedTopicFilter === t.id;
                  const topicCount = words.filter((w) => w.topic_id === t.id).length;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setSelectedTopicFilter(isSelected ? 'all' : t.id)}
                      style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? t.color || theme.accent : theme.card,
                        borderColor: isSelected ? t.color || theme.accent : theme.cardBorder,
                        paddingVertical: 6,
                        paddingHorizontal: 11,
                        height: 32
                      }]
                      }>
                      
                          <Text style={{ fontSize: 12, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#ffffff' : theme.textPrimary }}>
                            {t.emoji || '📁'} {t.name} ({topicCount})
                          </Text>
                        </TouchableOpacity>);

                })}

                    <TouchableOpacity
                  onPress={() => setShowTopicManagerModal(true)}
                  style={[
                  styles.filterChip,
                  {
                    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
                    borderColor: theme.accent,
                    paddingVertical: 6,
                    paddingHorizontal: 11,
                    height: 32
                  }]
                  }>
                  
                      <Text style={{ fontSize: 12, fontWeight: '800', color: theme.accent }}>
                        + Quản lý chủ đề
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* 3. DẢI TAB TRẠNG THÁI & CẤP ĐỘ (STATUS & LEVEL FILTER CAROUSEL) */}
                <View style={{ height: 34, marginBottom: 12 }}>
                  <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, alignItems: 'center', paddingHorizontal: 2 }}
                style={{ flexGrow: 0 }}>
                
                    {[
                { id: 'all', label: `Tất cả (${words.length})` },
                { id: 'learning', label: `🌱 Đang học (${totalCount - masteredCount})` },
                { id: 'mastered', label: `💎 Thuần thục (${masteredCount})` },
                { id: 'due', label: `⚡ Cần ôn (${totalDue})` },
                { id: 'B1', label: 'B1' },
                { id: 'B2', label: 'B2' },
                { id: 'C1', label: 'C1' },
                { id: 'C2', label: 'C2' }].
                map((tab) => {
                  const isSelected = vocabFilter === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      activeOpacity={0.7}
                      style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? theme.accentPill : theme.drawerCardBg,
                        borderColor: isSelected ? theme.accent : theme.cardBorder,
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        height: 30
                      }]
                      }
                      onPress={() => setVocabFilter(tab.id)}>
                      
                          <Text
                        style={[
                        styles.filterChipText,
                        {
                          color: isSelected ? theme.accent : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: 11
                        }]
                        }>
                        
                            {tab.label}
                          </Text>
                        </TouchableOpacity>);

                })}
                  </ScrollView>
                </View>

                {/* VOCAB LIST / GROUPED VIEW */}
                <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 110, gap: 10 }}
              refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.accent]}
                tintColor={theme.accent} />

              }>
              
                  {filteredWords.length === 0 ?
              vocabSearch.trim().length > 0 ?
              <View style={[styles.card, { padding: 18, alignItems: 'center', backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.06)', borderColor: theme.accent, borderWidth: 1.5, borderRadius: 16, marginVertical: 10 }]}>
                        <IconSparkles size={28} color={theme.accent} style={{ marginBottom: 8 }} />
                        <Text style={{ fontSize: 14.5, fontWeight: '800', color: theme.textPrimary, textAlign: 'center' }}>
                          Không tìm thấy "{vocabSearch.trim()}" trong kho từ
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 14, lineHeight: 16 }}>
                          Bạn muốn dùng AI tra cứu phiên âm, nghĩa tiếng Việt, câu ví dụ & thêm ngay từ này vào kho không?
                        </Text>
                        <TouchableOpacity
                  onPress={() => {
                    setNewWord(vocabSearch.trim());
                    navigateTo('add');
                    handleAutoLookup(vocabSearch.trim());
                  }}
                  style={[styles.btnPrimary, { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10 }]}>
                  
                          <IconPlus size={16} color="#ffffff" />
                          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Tra Cứu AI & Thêm Ngay (+10 XP)</Text>
                        </TouchableOpacity>
                      </View> :

              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                        <Text style={{ fontSize: 13, color: theme.textMuted }}>Không tìm thấy từ vựng nào phù hợp bộ lọc.</Text>
                      </View> :

              vocabViewMode === 'grouped' ? (
              /* GROUPED BY TOPIC ACCORDIONS */
              topics.map((t) => {
                const topicWords = filteredWords.filter((w) => w.topic_id === t.id);
                if (topicWords.length === 0 && selectedTopicFilter !== 'all') return null;
                const isCollapsed = !!collapsedTopicsMobile[t.id];

                return (
                  <View
                    key={t.id}
                    style={{
                      backgroundColor: theme.card,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                      overflow: 'hidden',
                      marginBottom: 6
                    }}>
                    
                          {/* Topic Accordion Header */}
                          <TouchableOpacity
                      onPress={() => {
                        setCollapsedTopicsMobile((prev) => ({
                          ...prev,
                          [t.id]: !prev[t.id]
                        }));
                      }}
                      activeOpacity={0.75}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 14,
                        backgroundColor: isDark ? `${t.color || '#0284c7'}12` : `${t.color || '#0284c7'}08`,
                        borderBottomWidth: isCollapsed ? 0 : 1,
                        borderBottomColor: theme.cardBorder
                      }}>
                      
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                              <Text style={{ fontSize: 22 }}>{t.emoji || '📁'}</Text>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }} numberOfLines={1}>
                                    {t.name}
                                  </Text>
                                  <View style={{ paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6, backgroundColor: `${t.color || '#0284c7'}25` }}>
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: t.color || '#0284c7' }}>
                                      {topicWords.length} từ
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                            <Text style={{ fontSize: 14, color: theme.textMuted, fontWeight: '700' }}>
                              {isCollapsed ? '▶' : '▼'}
                            </Text>
                          </TouchableOpacity>

                          {/* Words in Topic */}
                          {Boolean(!isCollapsed) ?
                    <View style={{ padding: 12, gap: 10 }}>
                              {topicWords.length === 0 ?
                      <Text style={{ fontSize: 12, color: theme.textMuted, fontStyle: 'italic', paddingVertical: 4 }}>
                                  Chưa có từ vựng nào trong chủ đề này.
                                </Text> :

                      topicWords.map((item) =>
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.vocabListItem, { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder, borderLeftWidth: 4, borderLeftColor: t.color || theme.accent, borderRadius: 16, padding: 14, marginBottom: 0 }]}
                        onPress={() => setSelectedWordDetail(item)}
                        activeOpacity={0.75}>
                        
                                    <View style={{ width: '100%' }}>
                                      {/* TOP: Word + Audio + Level (LEFT), Delete (RIGHT) */}
                                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                                          <Text style={[styles.vocabWordText, { color: theme.textPrimary, fontSize: 17 }]} numberOfLines={1}>
                                            {item.word}
                                          </Text>
                                          <TouchableOpacity onPress={() => playMobileAudio(item.word)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                            <IconVolume2 size={16} color={theme.accent} />
                                          </TouchableOpacity>
                                          <View style={[styles.levelPill, { backgroundColor: theme.accentPill, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }]}>
                                            <Text style={[styles.levelPillText, { color: theme.accent, fontSize: 10 }]}>{item.level || 'B2'}</Text>
                                          </View>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteWord(item.id, item.word)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
                                          <IconTrash size={15} color="#ef4444" />
                                        </TouchableOpacity>
                                      </View>

                                      {/* Phonetic */}
                                      {item.phonetic ?
                          <Text style={[styles.vocabPhoneticText, { color: theme.textMuted, fontSize: 12, marginBottom: 3 }]}>{item.phonetic}</Text> :
                          null}

                                      {/* Meaning */}
                                      <Text style={[styles.vocabMeaningText, { color: theme.accent, fontSize: 14, fontWeight: '700', marginBottom: item.examples?.length ? 4 : 0 }]}>
                                        {item.meaning_vi}
                                      </Text>

                                      {/* Example */}
                                      {item.examples && item.examples.length > 0 ?
                          <Text style={[styles.vocabExampleSub, { color: theme.textSecondary, fontSize: 12, fontStyle: 'italic' }]} numberOfLines={2}>
                                          "{item.examples[0]}"
                                        </Text> : null
                          }
                                    </View>
                                  </TouchableOpacity>
                      )
                      }
                            </View> : null
                    }
                        </View>);

              })) : (

              /* FLAT LIST (Clean & Spacious Layout with Topic at Footer) */
              filteredWords.map((item) => {
                const topic = topics.find((t) => t.id === item.topic_id) || { name: 'Giao tiếp Hàng ngày', emoji: '☕', color: '#10b981' };
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                    styles.vocabListItem,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                      borderLeftWidth: 4,
                      borderLeftColor: topic.color || theme.accent,
                      borderRadius: 18,
                      padding: 15,
                      marginBottom: 2
                    }]
                    }
                    onPress={() => setSelectedWordDetail(item)}
                    activeOpacity={0.75}>
                    
                          <View style={{ width: '100%' }}>
                            {/* ROW 1: Word Name + Speaker Audio + Level Badge (LEFT) & Delete Button (RIGHT) */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                                <Text style={[styles.vocabWordText, { color: theme.textPrimary, fontSize: 18 }]} numberOfLines={1}>
                                  {item.word}
                                </Text>
                                <TouchableOpacity onPress={() => playMobileAudio(item.word)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                  <IconVolume2 size={17} color={theme.accent} />
                                </TouchableOpacity>
                                <View style={[styles.levelPill, { backgroundColor: theme.accentPill, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }]}>
                                  <Text style={[styles.levelPillText, { color: theme.accent, fontSize: 10 }]}>{item.level || 'B2'}</Text>
                                </View>
                              </View>

                              <TouchableOpacity onPress={() => handleDeleteWord(item.id, item.word)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
                                <IconTrash size={16} color="#ef4444" />
                              </TouchableOpacity>
                            </View>

                            {/* ROW 2: Phonetic (if exists) */}
                            {item.phonetic ?
                      <Text style={[styles.vocabPhoneticText, { color: theme.textMuted, fontSize: 12, marginBottom: 4 }]}>
                                {item.phonetic}
                              </Text> :
                      null}

                            {/* ROW 3: Vietnamese Meaning (Prominent) */}
                            <Text style={[styles.vocabMeaningText, { color: theme.accent, fontSize: 15, fontWeight: '700', marginBottom: item.examples?.length ? 4 : 8 }]}>
                              {item.meaning_vi}
                            </Text>

                            {/* ROW 4: Examples or English Meaning */}
                            {item.examples && item.examples.length > 0 ?
                      <Text style={[styles.vocabExampleSub, { color: theme.textSecondary, fontSize: 12, fontStyle: 'italic', marginBottom: 8 }]} numberOfLines={2}>
                                "{item.examples[0]}"
                              </Text> :
                      null}

                            {/* ROW 5 (FOOTER): Topic Badge Pill (Spacious bottom placement) */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                              <View style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: `${topic.color || '#0284c7'}18`,
                          borderWidth: 1,
                          borderColor: `${topic.color || '#0284c7'}30`,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4
                        }}>
                                <Text style={{ fontSize: 11 }}>{topic.emoji || '📁'}</Text>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: topic.color || '#0284c7' }}>
                                  {topic.name}
                                </Text>
                              </View>

                              <Text style={{ fontSize: 11, color: theme.textMuted }}>
                                {item.status === 'mastered' ? '💎 Thuần thục' : item.interval > 0 ? `⚡ Ôn sau ${item.interval}d` : '🌱 Mới học'}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>);

              }))
              }
                </ScrollView>
              </View> : null
          }

            {/* TAB 4: PATTERNS HUB */}
            {currentTab === 'patterns' ?
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent} />

            }>
            
                {/* Header & Quick Action */}
                <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6,
              marginBottom: 4,
              gap: 8
            }}>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontSize: 16.5, fontWeight: '800' }]} numberOfLines={1}>
                      Mẫu Câu & Cấu Trúc
                    </Text>
                    <Text style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                      Phân loại ngữ pháp theo chức năng
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {/* Chức năng Button with Vector Icon */}
                    <TouchableOpacity
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: theme.innerCard,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onPress={() => setShowPatternCategoryManagerModal(true)}>
                  
                      <IconSettings size={13} color={theme.textSecondary} />
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: theme.textPrimary }}>Chức Năng</Text>
                    </TouchableOpacity>

                    {/* Thêm Mẫu Button */}
                    <TouchableOpacity
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: isAddingPattern ? '#ef4444' : theme.accent,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onPress={() => {
                    if (isAddingPattern) {
                      setIsAddingPattern(false);
                      setEditingPattern(null);
                    } else {
                      setEditingPattern(null);
                      setNewPatternName('');
                      setNewPatternCategory('emphasis');
                      setNewPatternFormula('');
                      setNewPatternMeaning('');
                      setNewPatternExplanation('');
                      setNewPatternExample('');
                      setIsAddingPattern(true);
                    }
                  }}>
                  
                      {isAddingPattern ?
                  <IconX size={13} color="#ffffff" /> :

                  <IconPlus size={13} color="#ffffff" />
                  }
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#ffffff' }}>
                        {isAddingPattern ? 'Đóng' : 'Thêm Mẫu'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Search Bar for Patterns */}
                <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.inputBg,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderWidth: 1,
              borderColor: theme.cardBorder,
              marginTop: 6,
              marginBottom: 4,
              gap: 8
            }}>
                  <IconSearch size={15} color={theme.textMuted} />
                  <TextInput
                style={{ flex: 1, color: theme.textPrimary, fontSize: 12.5, padding: 0 }}
                placeholder="Tìm mẫu câu, công thức, nghĩa..."
                placeholderTextColor={theme.textMuted}
                value={patternSearchQuery}
                onChangeText={setPatternSearchQuery} />
              
                  {patternSearchQuery ?
              <TouchableOpacity onPress={() => setPatternSearchQuery('')}>
                      <IconX size={15} color={theme.textMuted} />
                    </TouchableOpacity> :
              null}
                </View>

                {/* Filter Chips by Category */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 8 }}>
                  <TouchableOpacity
                style={[
                styles.filterChip,
                {
                  backgroundColor: selectedMobilePatternCategory === 'all' ? theme.accent : theme.innerCard,
                  borderColor: selectedMobilePatternCategory === 'all' ? theme.accent : theme.cardBorder
                }]
                }
                onPress={() => setSelectedMobilePatternCategory('all')}>
                
                    <Text style={[styles.filterChipText, { color: selectedMobilePatternCategory === 'all' ? '#ffffff' : theme.textSecondary, fontWeight: selectedMobilePatternCategory === 'all' ? '800' : '600' }]}>
                      🌟 Tất cả ({patterns.length})
                    </Text>
                  </TouchableOpacity>

                  {patternCategories.map((cat) => {
                const isSelected = selectedMobilePatternCategory === cat.id;
                const count = patterns.filter((p) => (p.category || 'emphasis') === cat.id).length;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? cat.color || theme.accent : theme.innerCard,
                      borderColor: isSelected ? cat.color || theme.accent : theme.cardBorder
                    }]
                    }
                    onPress={() => setSelectedMobilePatternCategory(cat.id)}>
                    
                        <Text style={[styles.filterChipText, { color: isSelected ? '#ffffff' : theme.textSecondary, fontWeight: isSelected ? '800' : '600' }]}>
                          {cat.emoji ? `${cat.emoji} ` : ''}{cat.name} ({count})
                        </Text>
                      </TouchableOpacity>);

              })}
                </ScrollView>

                {/* ADD / EDIT PATTERN FORM (SYNCED 100% WITH WEB) */}
                {Boolean(isAddingPattern) ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, borderWidth: 1.5, marginBottom: 16 }]}>
                    <Text style={[styles.formTitle, { color: theme.accent }]}>
                      {editingPattern ? '✏️ Chỉnh Sửa Mẫu Câu' : '✨ Thêm Mẫu Câu Mới'}
                    </Text>

                    {/* 1. Pattern Name */}
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11, marginTop: 8 }]}>Tên cấu trúc *</Text>
                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="Ví dụ: Had it not been for + Noun, Not only... but also..."
                placeholderTextColor={theme.textMuted}
                value={newPatternName}
                onChangeText={setNewPatternName} />
              

                    {/* 2. Category Picker (Horizontal Chips) */}
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11, marginTop: 10 }]}>Mục đích / Chức năng *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginVertical: 4 }}>
                      {patternCategories.map((cat) => {
                  const isSelected = newPatternCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: isSelected ? `${cat.color || theme.accent}20` : theme.inputBg,
                        borderWidth: 1.5,
                        borderColor: isSelected ? cat.color || theme.accent : theme.cardBorder,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                      }}
                      onPress={() => setNewPatternCategory(cat.id)}>
                      
                            <Text style={{ fontSize: 12 }}>{cat.emoji || '🧩'}</Text>
                            <Text style={{ fontSize: 12, fontWeight: isSelected ? '800' : '600', color: isSelected ? cat.color || theme.accent : theme.textSecondary }}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>);

                })}
                    </ScrollView>

                    {/* 3. Formula */}
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11, marginTop: 10 }]}>Công thức tổng quát *</Text>
                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, fontFamily: 'monospace' }]}
                placeholder="Ví dụ: Had it not been for + N, S + would have + V3/ed"
                placeholderTextColor={theme.textMuted}
                value={newPatternFormula}
                onChangeText={setNewPatternFormula} />
              

                    {/* 4. Meaning Vietnamese */}
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11, marginTop: 10 }]}>Nghĩa tiếng Việt *</Text>
                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="Ví dụ: Nếu không nhờ có... thì đã..."
                placeholderTextColor={theme.textMuted}
                value={newPatternMeaning}
                onChangeText={setNewPatternMeaning} />
              

                    {/* 5. Explanation */}
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11, marginTop: 10 }]}>Giải thích cách dùng & Lưu ý ngữ pháp</Text>
                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Ví dụ: Dùng trong ngữ cảnh học thuật IELTS Writing Task 2 để tăng tính học thuật..."
                placeholderTextColor={theme.textMuted}
                multiline={true}
                value={newPatternExplanation}
                onChangeText={setNewPatternExplanation} />
              

                    {/* 6. Example */}
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11, marginTop: 10 }]}>Ví dụ áp dụng thực tế</Text>
                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="Ví dụ: Had it not been for your support, I would not have succeeded."
                placeholderTextColor={theme.textMuted}
                value={newPatternExample}
                onChangeText={setNewPatternExample} />
              

                    {/* Action Buttons */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      <TouchableOpacity
                  style={[styles.secondaryActionBtn, { flex: 1 }]}
                  onPress={() => {
                    setIsAddingPattern(false);
                    setEditingPattern(null);
                  }}>
                  
                        <Text style={[styles.secondaryActionBtnText, { color: theme.textSecondary }]}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                  style={[styles.primaryActionBtn, { flex: 2, backgroundColor: theme.btnPrimaryBg }]}
                  onPress={handleSavePattern}>
                  
                        <Text style={styles.primaryActionBtnText}>
                          {editingPattern ? 'Lưu Thay Đổi' : 'Tạo Mẫu Câu'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View> : null
            }

                {/* PATTERN CARDS LIST */}
                {patterns.
            filter((p) => {
              if (selectedMobilePatternCategory !== 'all' && (p.category || 'emphasis') !== selectedMobilePatternCategory) {
                return false;
              }
              if (patternSearchQuery.trim()) {
                const q = patternSearchQuery.toLowerCase().trim();
                const qClean = removeVietnameseTones(q);
                const name = (p.name || '').toLowerCase();
                const formula = (p.formula || '').toLowerCase();
                const meaningVi = (p.meaning_vi || '').toLowerCase();
                const exp = (p.explanation || '').toLowerCase();
                const example = (p.example_en || '').toLowerCase();

                const matchDirect =
                name.includes(q) ||
                formula.includes(q) ||
                meaningVi.includes(q) ||
                exp.includes(q) ||
                example.includes(q);

                const matchUnaccented =
                removeVietnameseTones(name).includes(qClean) ||
                removeVietnameseTones(meaningVi).includes(qClean) ||
                removeVietnameseTones(exp).includes(qClean);

                if (!matchDirect && !matchUnaccented) return false;
              }
              return true;
            }).
            map((p) => {
              const catKey = p.category || 'emphasis';
              const catMeta = patternCategories.find((c) => c.id === catKey) || { name: 'Cấu trúc', emoji: '🧩', color: '#8b5cf6' };

              return (
                <View key={p.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginBottom: 12 }]}>
                        {/* Header: Name + Category + Actions */}
                        <View style={styles.cardHeaderRow}>
                          <Text style={[styles.vocabWordText, { color: theme.textPrimary, flex: 1, marginRight: 8, fontSize: 16 }]} numberOfLines={2}>
                            {p.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.levelPill, { backgroundColor: `${catMeta.color || '#8b5cf6'}18`, paddingHorizontal: 8, paddingVertical: 3 }]}>
                              <Text style={[styles.levelPillText, { color: catMeta.color || '#8b5cf6', fontSize: 11, fontWeight: '700' }]}>
                                {catMeta.emoji || '🧩'} {catMeta.name}
                              </Text>
                            </View>
                            <TouchableOpacity onPress={() => handleStartEditPattern(p)} style={{ padding: 4 }}>
                              <IconEdit size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeletePattern(p.id, p.name)} style={{ padding: 4 }}>
                              <IconTrash size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Formula Box */}
                        <View style={[styles.formulaBox, { backgroundColor: theme.formulaBg, marginVertical: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.cardBorder }]}>
                          <Text style={[styles.formulaText, { color: theme.textPrimary, fontFamily: 'monospace', fontSize: 13 }]}>
                            {p.formula}
                          </Text>
                        </View>

                        {/* Meaning Vietnamese */}
                        <Text style={[styles.vocabMeaningText, { color: theme.accent, fontSize: 15, fontWeight: '700', marginBottom: 4 }]}>
                          {p.meaning_vi}
                        </Text>

                        {/* Explanation (if exists) */}
                        {p.explanation ?
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8, lineHeight: 17 }}>
                            {p.explanation}
                          </Text> :
                  null}

                        {/* Examples with Audio Pronunciation */}
                        {p.examples && p.examples.length > 0 ?
                  <View style={[styles.exampleBox, { backgroundColor: theme.exampleBg, borderLeftColor: catMeta.color || theme.accent, marginTop: 4, padding: 8, borderRadius: 8 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={[styles.exampleText, { color: theme.exampleText, fontStyle: 'italic', flex: 1, marginRight: 8, fontSize: 13 }]}>
                                "{p.examples[0]}"
                              </Text>
                              <TouchableOpacity onPress={() => playMobileAudio(p.examples[0])} style={{ padding: 4 }}>
                                <IconVolume2 size={16} color={theme.accent} />
                              </TouchableOpacity>
                            </View>
                          </View> : null
                  }
                      </View>);

            })}
              </ScrollView> : null
          }

            {/* TAB: INTERACTIVE QUIZ HUB */}
            {currentTab === 'quiz' ?
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent} />

            }>
            
                {/* 1. QUIZ RESULT SCREEN */}
                {quizResult ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, alignItems: 'center', paddingVertical: 24 }]}>
                    <View style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: quizResult.score >= 80 ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                      <Text style={{ fontSize: 32, lineHeight: 38, textAlign: 'center', includeFontPadding: false }}>
                        {quizResult.score >= 80 ? '🏆' : '🎯'}
                      </Text>
                    </View>
                    <Text style={[styles.heroTitle, { color: theme.textPrimary, marginTop: 4, textAlign: 'center' }]}>
                      {quizResult.score >= 80 ? 'Xuất Sắc! Hoàn Thành' : 'Hoàn Thành Bài Tập!'}
                    </Text>
                    <Text style={[styles.heroSubtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
                      Bạn trả lời đúng {quizResult.correctCount} / {quizResult.totalQuestions} câu hỏi
                    </Text>

                    {/* Stats Row */}
                    <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 20 }}>
                      <View style={{
                  flex: 1,
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.08)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.2)',
                  borderWidth: 1,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Điểm Số
                        </Text>
                        <Text style={{ fontSize: 24, fontWeight: '900', color: theme.accent, marginTop: 4 }}>
                          {quizResult.score}%
                        </Text>
                      </View>

                      <View style={{
                  flex: 1,
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.2)',
                  borderWidth: 1,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Kinh Nghiệm
                        </Text>
                        <Text style={{ fontSize: 24, fontWeight: '900', color: '#f59e0b', marginTop: 4 }}>
                          +{quizResult.xpEarned} XP
                        </Text>
                      </View>
                    </View>

                    {/* Breakdown */}
                    <View style={{ width: '100%', marginTop: 24 }}>
                      <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontSize: 16, marginBottom: 12, fontWeight: '800' }]}>
                        Chi Tiết Câu Trả Lời:
                      </Text>
                      {quizResult.results.map((item, idx) =>
                <View
                  key={idx}
                  style={{
                    backgroundColor: theme.innerCard,
                    borderWidth: 1,
                    borderColor: item.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                    borderLeftColor: item.isCorrect ? '#10b981' : '#ef4444',
                    borderLeftWidth: 5,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: 'column',
                    gap: 6
                  }}>
                  
                          {/* Row 1: Word + Pronounce Button (Left) & Status Badge (Right) */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                              <Text style={{ fontWeight: '800', color: theme.textPrimary, fontSize: 16 }}>
                                {item.word}
                              </Text>
                              <TouchableOpacity onPress={() => playMobileAudio(item.word)} style={{ padding: 2 }}>
                                <IconVolume2 size={16} color={theme.accent} />
                              </TouchableOpacity>
                            </View>
                            <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                      backgroundColor: item.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                    }}>
                              <Text style={{ fontSize: 12, fontWeight: '800', color: item.isCorrect ? '#10b981' : '#ef4444' }}>
                                {item.isCorrect ? '✓ Đúng' : '✕ Chưa đúng'}
                              </Text>
                            </View>
                          </View>

                          {/* Row 2: User's Choice */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 2 }}>
                            <Text style={{ fontSize: 13, color: theme.textSecondary }}>Bạn chọn: </Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: item.isCorrect ? '#10b981' : '#ef4444', flex: 1 }}>
                              {item.userAnswer}
                            </Text>
                          </View>

                          {/* Row 3: Correct Answer (if wrong) */}
                          {Boolean(!item.isCorrect) ?
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                              <Text style={{ fontSize: 13, color: theme.textSecondary }}>Đáp án đúng: </Text>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: '#10b981', flex: 1 }}>
                                {item.correctAnswer}
                              </Text>
                            </View> : null
                          }

                          {/* Row 4: Explanation & Contextual translation */}
                          {Boolean(item.explanation || item.translation) ? (
                            <View style={{ backgroundColor: theme.innerCard, borderColor: theme.accent, borderLeftWidth: 3, padding: 8, borderRadius: 6, marginTop: 8 }}>
                              {Boolean(item.explanation) ? (
                                <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 16 }}>
                                  💡 <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Giải thích:</Text> {item.explanation}
                                </Text>
                              ) : null}
                              {Boolean(item.translation) ? (
                                <Text style={{ fontSize: 11, fontStyle: 'italic', color: theme.textMuted, marginTop: 3 }}>
                                  🌐 <Text style={{ fontWeight: '700' }}>Ngữ cảnh:</Text> "{item.translation}"
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                )}
                    </View>

                    {/* Action Buttons */}
                    <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
                      <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg }]}
                  onPress={handleRetakeCurrentMobileQuiz}>
                  
                        <Text style={styles.primaryActionBtnText}>🔄 Làm Lại Bài Này</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }]}
                  onPress={() => {setQuizData(null);setQuizResult(null);}}>
                  
                        <Text style={[styles.primaryActionBtnText, { color: theme.textPrimary }]}>📚 Chọn Topic Khác</Text>
                      </TouchableOpacity>
                    </View>
                  </View> :
            quizData ? (
            /* 2. PLAYING ACTIVE QUESTION */
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontWeight: '800', color: theme.accent, fontSize: 14 }}>
                          CÂU {quizIndex + 1} / {quizData.questions.length}
                        </Text>
                        {Boolean(quizData.questions[quizIndex]?.difficulty) && (
                          <View style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 8,
                            backgroundColor: quizData.questions[quizIndex].difficulty === 'easy' ? 'rgba(16, 185, 129, 0.2)' : quizData.questions[quizIndex].difficulty === 'hard' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'
                          }}>
                            <Text style={{
                              fontSize: 10,
                              fontWeight: '800',
                              color: quizData.questions[quizIndex].difficulty === 'easy' ? '#10b981' : quizData.questions[quizIndex].difficulty === 'hard' ? '#ef4444' : '#f59e0b'
                            }}>
                              {quizData.questions[quizIndex].difficulty === 'easy' ? '🟢 Dễ' : quizData.questions[quizIndex].difficulty === 'hard' ? '🔴 Khó' : '🟡 Trung Bình'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ backgroundColor: theme.innerCard, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>🏷️ {quizData.topic}</Text>
                      </View>
                    </View>

                    {/* Question Box */}
                    {(() => {
                const currentQ = quizData.questions[quizIndex];
                return (
                  <>
                          <View style={[styles.innerCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, alignItems: 'center', paddingVertical: 24 }]}>
                            <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, textAlign: 'center' }}>
                              {currentQ.promptSubtitle}
                            </Text>

                            {currentQ.type === 'listening' ?
                      <TouchableOpacity
                        style={{
                          width: 68,
                          height: 68,
                          borderRadius: 34,
                          backgroundColor: theme.accent,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginVertical: 10
                        }}
                        onPress={() => playMobileAudio(currentQ.word)}>
                        
                                <IconVolume2 size={32} color="#ffffff" />
                              </TouchableOpacity> :

                      <>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.textPrimary, textAlign: 'center', lineHeight: 30 }}>
                                  {currentQ.questionText}
                                </Text>
                                {Boolean(currentQ.phonetic) && currentQ.type !== 'reverse_en' &&
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                    <Text style={{ color: theme.textMuted, fontSize: 14, fontFamily: 'monospace' }}>{currentQ.phonetic}</Text>
                                    <TouchableOpacity onPress={() => playMobileAudio(currentQ.word)}>
                                      <IconVolume2 size={16} color={theme.accent} />
                                    </TouchableOpacity>
                                  </View>
                        }
                              </>
                      }
                          </View>

                          {/* 4 Options */}
                          <View style={{ gap: 10, marginTop: 16 }}>
                            {currentQ.options.map((option, idx) => {
                        const isSelected = option === quizSelectedOption;
                        const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

                        let btnBg = theme.innerCard;
                        let btnBorder = theme.cardBorder;
                        let textColor = theme.textPrimary;

                        if (quizIsAnswered) {
                          if (isCorrect) {
                            btnBg = 'rgba(16, 185, 129, 0.2)';
                            btnBorder = '#10b981';
                            textColor = '#10b981';
                          } else if (isSelected) {
                            btnBg = 'rgba(239, 68, 68, 0.2)';
                            btnBorder = '#ef4444';
                            textColor = '#ef4444';
                          }
                        }

                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[
                            styles.vocabListItem,
                            {
                              backgroundColor: btnBg,
                              borderColor: btnBorder,
                              borderWidth: 1.5,
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }]
                            }
                            onPress={() => handleSelectQuizOption(option)}
                            disabled={quizIsAnswered}>
                            
                                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor, flex: 1 }}>
                                    {option}
                                  </Text>
                                  {Boolean(quizIsAnswered && isCorrect) ?
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981' }}>✓</Text> : null
                            }
                                </TouchableOpacity>);

                      })}
                          </View>

                          {/* Explanation / Translation box if answered */}
                          {quizIsAnswered && Boolean(currentQ.explanation || currentQ.translation) &&
                    <View style={{ backgroundColor: theme.innerCard, borderColor: theme.accent, borderLeftWidth: 3, padding: 10, borderRadius: 8, marginTop: 12 }}>
                              {Boolean(currentQ.explanation) ?
                      <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>
                                  📖 <Text style={{ fontWeight: '700', color: theme.textPrimary }}>Giải thích:</Text> {currentQ.explanation}
                                </Text> : null
                      }
                              {Boolean(currentQ.translation) ?
                      <Text style={{ fontSize: 12, fontStyle: 'italic', color: theme.textMuted, marginTop: 4 }}>
                                  🌐 <Text style={{ fontWeight: '700' }}>Dịch câu:</Text> "{currentQ.translation}"
                                </Text> : null
                      }
                            </View>
                    }

                          {/* Pronounce Word Action Button after answering */}
                          {quizIsAnswered && Boolean(currentQ?.word || currentQ?.correctAnswer) && (
                            <TouchableOpacity
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.accentSoft || 'rgba(99, 102, 241, 0.12)',
                                borderWidth: 1.5,
                                borderColor: theme.accent,
                                borderRadius: 14,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                marginTop: 14,
                                gap: 8
                              }}
                              onPress={() => playMobileAudio(currentQ.word || currentQ.correctAnswer, mobileSpeed, mobileAccent)}>
                              <IconVolume2 size={20} color={theme.accent} />
                              <Text style={{ fontSize: 15, fontWeight: '800', color: theme.accent }}>
                                Phát âm: "{currentQ.word || currentQ.correctAnswer}" {currentQ.phonetic ? `(${currentQ.phonetic})` : ''} 🔊
                              </Text>
                            </TouchableOpacity>
                          )}

                          {/* Next Button */}
                          {quizIsAnswered &&
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, marginTop: 14 }]}
                      onPress={handleNextQuizQuestion}>
                      
                              <Text style={styles.primaryActionBtnText}>
                                {quizIndex + 1 < quizData.questions.length ? 'Câu Tiếp Theo ➔' : 'Xem Kết Quả 📊'}
                              </Text>
                            </TouchableOpacity>
                    }
                        </>);

              })()}
                  </View>) : (

            /* 3. LOBBY & HISTORY SCREEN */
            <View>
                    {/* Top Segmented Switcher: Create New vs History Archive */}
                    <View style={{ flexDirection: 'row', backgroundColor: theme.drawerCardBg, borderRadius: 24, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                      <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: quizTab === 'new' ? theme.btnPrimaryBg : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onPress={() => setQuizTab('new')}>
                  
                        <Text style={{ fontWeight: '800', color: quizTab === 'new' ? '#ffffff' : theme.textSecondary, fontSize: 13 }}>
                          ✨ Tạo Đề Mới
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: quizTab === 'history' ? '#8b5cf6' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6
                  }}
                  onPress={() => {
                    setQuizTab('history');
                    mobileApi.getQuizHistory().then((res) => {
                      if (res?.success) setQuizHistory(res.data || []);
                    });
                  }}>
                  
                        <Text style={{ fontWeight: '800', color: quizTab === 'history' ? '#ffffff' : theme.textSecondary, fontSize: 13 }}>
                          📜 Lịch Sử Đề
                        </Text>
                        {quizHistory.length > 0 ?
                  <View style={{ backgroundColor: quizTab === 'history' ? '#ffffff' : '#8b5cf6', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 }}>
                            <Text style={{ color: quizTab === 'history' ? '#8b5cf6' : '#ffffff', fontSize: 10, fontWeight: '800' }}>
                              {quizHistory.length}
                            </Text>
                          </View> : null
                  }
                      </TouchableOpacity>
                    </View>

                    {quizTab === 'history' ? (
              /* ================= MOBILE QUIZ HISTORY ================= */
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <View style={{ marginBottom: 12 }}>
                          <Text style={[styles.heroTitle, { color: theme.textPrimary, fontSize: 18, marginBottom: 4 }]}>
                            📜 Kho Đề Thi Đã Lưu
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                            Tất cả đề AI và đề tuỳ chỉnh đã lưu. Bấm "Làm Lại" để luyện tập ngay.
                          </Text>
                        </View>

                        {/* Filter Chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 14 }}>
                          {[
                  { id: 'all', label: `🌟 Tất Cả (${quizHistory.length})` },
                  { id: 'vocab', label: `📖 Từ Vựng (${quizHistory.filter((q) => q.type === 'vocab').length})` },
                  { id: 'pattern', label: `🧩 Mẫu Câu (${quizHistory.filter((q) => q.type === 'pattern').length})` },
                  { id: 'ai', label: `✨ Đề AI (${quizHistory.filter((q) => q.is_ai).length})` }].
                  map((f) => {
                    const isSelected = quizHistoryFilter === f.id;
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: isSelected ? `${theme.accent}20` : theme.innerCard,
                          borderWidth: 1,
                          borderColor: isSelected ? theme.accent : theme.cardBorder
                        }}
                        onPress={() => setQuizHistoryFilter(f.id)}>
                        
                                <Text style={{ fontSize: 12, fontWeight: isSelected ? '800' : '600', color: isSelected ? theme.accent : theme.textSecondary }}>
                                  {f.label}
                                </Text>
                              </TouchableOpacity>);

                  })}
                        </ScrollView>

                        {/* History Cards */}
                        {quizHistory.filter((item) => {
                  if (quizHistoryFilter === 'vocab') return item.type === 'vocab';
                  if (quizHistoryFilter === 'pattern') return item.type === 'pattern';
                  if (quizHistoryFilter === 'ai') return Boolean(item.is_ai);
                  return true;
                }).length === 0 ?
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                            <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary, marginBottom: 4 }}>
                              Chưa có bộ đề nào
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center', marginBottom: 14 }}>
                              Khi bạn tạo bài tập hoặc dùng AI, đề thi sẽ tự động được lưu tại đây.
                            </Text>
                            <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, paddingHorizontal: 16 }]}
                    onPress={() => setQuizTab('new')}>
                    
                              <Text style={styles.primaryActionBtnText}>✨ Tạo Đề Thi Mới</Text>
                            </TouchableOpacity>
                          </View> :

                <View style={{ gap: 10 }}>
                            {quizHistory.
                  filter((item) => {
                    if (quizHistoryFilter === 'vocab') return item.type === 'vocab';
                    if (quizHistoryFilter === 'pattern') return item.type === 'pattern';
                    if (quizHistoryFilter === 'ai') return Boolean(item.is_ai);
                    return true;
                  }).
                  map((item) => {
                    const isVocab = item.type === 'vocab';
                    return (
                      <View
                        key={item.id}
                        style={{
                          backgroundColor: theme.innerCard,
                          borderWidth: 1,
                          borderColor: theme.cardBorder,
                          borderLeftColor: item.is_ai ? '#8b5cf6' : isVocab ? theme.accent : '#ec4899',
                          borderLeftWidth: 4,
                          borderRadius: 14,
                          padding: 12,
                          gap: 6
                        }}>
                        
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <Text style={{ fontWeight: '800', color: theme.textPrimary, fontSize: 14, flex: 1, marginRight: 6 }}>
                                        {item.title}
                                      </Text>
                                      {Boolean(item.is_ai) ?
                          <View style={{ backgroundColor: '#8b5cf6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>✨ AI</Text>
                                        </View> :

                          <View style={{ backgroundColor: theme.drawerCardBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: theme.cardBorder }}>
                                          <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textSecondary }}>Offline</Text>
                                        </View>
                          }
                                    </View>

                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                      <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                                        📝 <Text style={{ fontWeight: '700' }}>{item.total_questions}</Text> câu
                                      </Text>
                                      <Text style={{ fontSize: 11, color: theme.textMuted }}>•</Text>
                                      <Text style={{ fontSize: 11, color: item.best_score !== null && item.best_score !== undefined ? item.best_score >= 80 ? '#10b981' : '#f59e0b' : theme.textSecondary, fontWeight: '700' }}>
                                        {item.best_score !== null && item.best_score !== undefined ? `🏆 Cao nhất: ${item.best_score}%` : '🌱 Chưa làm'}
                                      </Text>
                                      <Text style={{ fontSize: 11, color: theme.textMuted }}>•</Text>
                                      <Text style={{ fontSize: 11, color: theme.textMuted }}>
                                        🎯 {item.attempts_count || 0} lần
                                      </Text>
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.cardBorder }}>
                                      <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor: theme.btnPrimaryBg,
                              paddingVertical: 8,
                              borderRadius: 8,
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onPress={() => handleRetakeMobileQuiz(item)}
                            disabled={isQuizLoading}>
                            
                                        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12 }}>
                                          🚀 Làm Lại Đề Này
                                        </Text>
                                      </TouchableOpacity>

                                      <TouchableOpacity
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 8,
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              borderWidth: 1,
                              borderColor: 'rgba(239, 68, 68, 0.25)',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onPress={() => handleDeleteMobileQuizHistory(item.id)}>
                            
                                        <Text style={{ color: '#ef4444', fontSize: 12 }}>🗑️</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>);

                  })}
                          </View>
                }
                      </View>) : (

              /* ================= CREATE NEW QUIZ LOBBY ================= */
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <View style={{ alignItems: 'center', marginBottom: 16 }}>
                          <View style={[styles.heroBadge, { backgroundColor: theme.accentPill }]}>
                            <Text style={[styles.heroBadgeText, { color: theme.accent }]}>🎯 INTERACTIVE QUIZ HUB</Text>
                          </View>
                          <Text style={[styles.heroTitle, { color: theme.textPrimary, fontSize: 20, textAlign: 'center', marginTop: 8 }]}>
                            Luyện Quiz Trắc Nghiệm
                          </Text>
                          <Text style={[styles.heroSubtitle, { color: theme.textSecondary, textAlign: 'center', fontSize: 13 }]}>
                            Phản xạ từ vựng & cấu trúc ngữ pháp học thuật
                          </Text>
                        </View>

                        {/* Category Switcher: Vocab vs Pattern Cards */}
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                          <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: selectedQuizCategory === 'vocab' ? `${theme.accent}15` : theme.innerCard,
                      borderWidth: 2,
                      borderColor: selectedQuizCategory === 'vocab' ? theme.accent : theme.cardBorder,
                      gap: 10
                    }}
                    onPress={() => setSelectedQuizCategory('vocab')}>
                    
                            <Text style={{ fontSize: 22 }}>📖</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }}>
                                Quiz Từ Vựng
                              </Text>
                              <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                                Nghĩa & phản xạ
                              </Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: selectedQuizCategory === 'pattern' ? 'rgba(236, 72, 153, 0.15)' : theme.innerCard,
                      borderWidth: 2,
                      borderColor: selectedQuizCategory === 'pattern' ? '#ec4899' : theme.cardBorder,
                      gap: 10
                    }}
                    onPress={() => setSelectedQuizCategory('pattern')}>
                    
                            <Text style={{ fontSize: 22 }}>🧩</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }}>
                                Quiz Mẫu Câu
                              </Text>
                              <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                                Cấu trúc & đảo ngữ
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>

                        {/* Step 1: Date Scope Selector */}
                        <View style={{ marginBottom: 16 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={[styles.inputLabel, { color: theme.textPrimary, fontWeight: '800', marginBottom: 0 }]}>
                              📅 1. Phạm Vi Ngày Nạp Từ Vựng:
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '700' }}>
                              {selectedQuizDateScope === 'all' && '🌐 Toàn bộ kho từ'}
                              {selectedQuizDateScope === 'today' && '⚡ Hôm nay'}
                              {selectedQuizDateScope === 'yesterday' && '🕒 Hôm qua'}
                              {selectedQuizDateScope === 'last_7_days' && '🔥 7 ngày qua'}
                              {selectedQuizDateScope === 'specific' && (
                                selectedQuizDates.length === 1 
                                  ? `📅 ${selectedQuizDates[0]}` 
                                  : `📅 Đã chọn ${selectedQuizDates.length} ngày`
                              )}
                            </Text>
                          </View>

                          {/* Quick Presets */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                            {[
                              { id: 'all', label: 'Toàn bộ' },
                              { id: 'today', label: 'Hôm nay' },
                              { id: 'yesterday', label: 'Hôm qua' },
                              { id: 'last_7_days', label: '7 ngày qua' }
                            ].map((s) => {
                              const isSelected = selectedQuizDateScope === s.id && selectedQuizDates.length === 0;
                              return (
                                <TouchableOpacity
                                  key={s.id}
                                  style={[
                                    styles.filterChip,
                                    { backgroundColor: isSelected ? theme.accent : theme.innerCard, borderColor: isSelected ? theme.accent : theme.cardBorder, paddingVertical: 6, paddingHorizontal: 10 }
                                  ]}
                                  onPress={() => {
                                    setSelectedQuizDateScope(s.id);
                                    setSelectedQuizDates([]);
                                  }}
                                >
                                  <Text style={[styles.filterChipText, { color: isSelected ? '#ffffff' : theme.textSecondary, fontWeight: isSelected ? '800' : '600', fontSize: 11 }]}>
                                    {s.label}{isSelected ? ' ✓' : ''}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {/* Always Available Specific Date Chips */}
                          <View style={{ backgroundColor: theme.innerCard, borderWidth: selectedQuizDates.length > 0 ? 1.5 : 1, borderColor: selectedQuizDates.length > 0 ? theme.accent : theme.cardBorder, borderRadius: 14, padding: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textPrimary }}>
                                🎯 Chọn theo từng ngày học (Có thể chọn nhiều ngày):
                              </Text>
                              {selectedQuizDates.length > 0 && (
                                <TouchableOpacity onPress={() => { setSelectedQuizDates([]); setSelectedQuizDateScope('all'); }}>
                                  <Text style={{ fontSize: 10, color: theme.accent, fontWeight: '700' }}>Bỏ chọn</Text>
                                </TouchableOpacity>
                              )}
                            </View>

                            {quizDates.length === 0 ? (
                              <Text style={{ fontSize: 11, color: theme.textSecondary }}>Chưa có danh sách ngày nào.</Text>
                            ) : (
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {quizDates.map((qd) => {
                                  const isPicked = selectedQuizDates.includes(qd.date);
                                  return (
                                    <TouchableOpacity
                                      key={qd.date}
                                      style={{
                                        paddingVertical: 6,
                                        paddingHorizontal: 10,
                                        borderRadius: 10,
                                        backgroundColor: isPicked ? theme.accent : theme.cardBackground,
                                        borderWidth: 1.5,
                                        borderColor: isPicked ? theme.accent : theme.cardBorder,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4
                                      }}
                                      onPress={() => toggleMobileQuizDate(qd.date)}
                                    >
                                      <Text style={{ fontSize: 11, fontWeight: isPicked ? '800' : '600', color: isPicked ? '#ffffff' : theme.textPrimary }}>
                                        {qd.label} ({selectedQuizCategory === 'pattern' ? `${qd.patterns_count} câu` : `${qd.words_count} từ`})
                                      </Text>
                                      {isPicked && <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 11 }}>✓</Text>}
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Step 2: Choose Topic / Tone */}
                        {selectedQuizCategory === 'vocab' ?
                <>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <Text style={[styles.inputLabel, { color: theme.textPrimary, fontWeight: '800', marginBottom: 0 }]}>
                                2. Chọn Chủ Đề (Topic):
                              </Text>
                              <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '700' }}>
                                {selectedQuizTopics.includes('All') ? 'Tất cả (All)' : `${selectedQuizTopics.length} chủ đề`}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                              {(quizTopics.length > 0 ? quizTopics : [
                    { id: 'All', name: 'Tất cả (All)', emoji: '📚', count: words.length },
                    ...topics.map((t) => ({ id: t.id, name: t.name, emoji: t.emoji, count: words.filter((w) => w.topic_id === t.id).length }))]).
                    map((t) => {
                      const topicKey = t.id || t.name;
                      const isSelected = selectedQuizTopics.includes(topicKey) || topicKey.toLowerCase() === 'all' && selectedQuizTopics.includes('All');
                      return (
                        <TouchableOpacity
                          key={topicKey}
                          style={[
                          styles.filterChip,
                          { backgroundColor: isSelected ? theme.accent : theme.innerCard, borderColor: isSelected ? theme.accent : theme.cardBorder }]
                          }
                          onPress={() => toggleMobileQuizTopic(topicKey)}>
                          
                                    <Text style={[styles.filterChipText, { color: isSelected ? '#ffffff' : theme.textSecondary, fontWeight: isSelected ? '800' : '500' }]}>
                                      {t.emoji ? `${t.emoji} ` : ''}{t.name} ({t.count}){isSelected ? ' ✓' : ''}
                                    </Text>
                                  </TouchableOpacity>);

                    })}
                            </View>
                          </> :

                <>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <Text style={[styles.inputLabel, { color: theme.textPrimary, fontWeight: '800', marginBottom: 0 }]}>
                                2. Chọn Nhóm Chức Năng Câu:
                              </Text>
                              <Text style={{ fontSize: 11, color: '#ec4899', fontWeight: '700' }}>
                                7 nhóm chức năng
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                              {[
                    { id: 'all', name: 'Tất cả chức năng', emoji: '🌟' },
                    ...(patternCategories.length > 0 ? patternCategories : [
                    { id: 'emphasis', name: 'Nhấn mạnh & Đảo ngữ', emoji: '💥' },
                    { id: 'concession', name: 'Nhượng bộ & Đối lập', emoji: '⚖️' },
                    { id: 'purpose', name: 'Mục đích & Kết quả', emoji: '🎯' },
                    { id: 'condition', name: 'Điều kiện & Giả định', emoji: '⚠️' },
                    { id: 'opinion', name: 'Khẳng định Quan điểm', emoji: '💬' },
                    { id: 'sequence', name: 'Thời gian & Trình tự', emoji: '⏳' },
                    { id: 'advice', name: 'Khuyên bảo & Thúc giục', emoji: '⏰' }])].

                    map((t) => {
                      const isSelected = selectedQuizPatternCategory === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                          styles.filterChip,
                          { backgroundColor: isSelected ? '#ec4899' : theme.innerCard, borderColor: isSelected ? '#ec4899' : theme.cardBorder }]
                          }
                          onPress={() => setSelectedQuizPatternCategory(t.id)}>
                          
                                    <Text style={[styles.filterChipText, { color: isSelected ? '#ffffff' : theme.textSecondary, fontWeight: isSelected ? '800' : '500' }]}>
                                      {t.emoji ? `${t.emoji} ` : ''}{t.name}
                                      {t.patterns_count !== undefined ? ` (${t.patterns_count})` : ''}
                                      {isSelected ? ' ✓' : ''}
                                    </Text>
                                  </TouchableOpacity>);

                    })}
                            </View>
                          </>
                }

                        {/* Step 3: Difficulty Levels */}
                        <Text style={[styles.inputLabel, { color: theme.textPrimary, fontWeight: '800', marginBottom: 8 }]}>
                          3. Độ Khó Để Giải Câu Hỏi:
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                          {[
                  { id: 'all', label: '🌟 Mọi Độ Khó' },
                  { id: 'easy', label: '🟢 Dễ Giải (Có gợi ý)' },
                  { id: 'medium', label: '🟡 Trung Bình (Chuẩn)' },
                  { id: 'hard', label: '🔴 Khó (Đánh đố cao)' },
                  { id: 'ielts_4_5', label: '🥉 IELTS 4.0 - 5.0' },
                  { id: 'ielts_55_60', label: '🎖️ IELTS 5.5 - 6.0' },
                  { id: 'ielts_65_70', label: '🥈 IELTS 6.5 - 7.0' },
                  { id: 'ielts_75_80', label: '🥇 IELTS 7.5 - 8.0' },
                  { id: 'ielts_85_90', label: '👑 IELTS 8.5 - 9.0' }].
                  map((lvl) => {
                    const isSelected = selectedQuizLevel === lvl.id;
                    return (
                      <TouchableOpacity
                        key={lvl.id}
                        style={[
                        styles.filterChip,
                        { backgroundColor: isSelected ? theme.accent : theme.innerCard, borderColor: isSelected ? theme.accent : theme.cardBorder }]
                        }
                        onPress={() => setSelectedQuizLevel(lvl.id)}>
                        
                                <Text style={[styles.filterChipText, { color: isSelected ? '#ffffff' : theme.textSecondary, fontWeight: isSelected ? '800' : '500' }]}>
                                  {lvl.label}{isSelected ? ' ✓' : ''}
                                </Text>
                              </TouchableOpacity>);

                  })}
                        </View>

                        {/* Step 4: Question Count */}
                        <Text style={[styles.inputLabel, { color: theme.textPrimary, fontWeight: '800', marginBottom: 8 }]}>
                          4. Số Lượng Câu Hỏi:
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                          {[5, 10, 15].map((cnt) =>
                  <TouchableOpacity
                    key={cnt}
                    style={[
                    styles.filterChip,
                    { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: quizQuestionCount === cnt ? theme.accent : theme.innerCard, borderColor: quizQuestionCount === cnt ? theme.accent : theme.cardBorder }]
                    }
                    onPress={() => setQuizQuestionCount(cnt)}>
                    
                              <Text style={{ fontWeight: quizQuestionCount === cnt ? '800' : '600', color: quizQuestionCount === cnt ? '#ffffff' : theme.textPrimary, fontSize: 13 }}>
                                {cnt} câu
                              </Text>
                            </TouchableOpacity>
                  )}
                        </View>

                        {/* Step 5: Question Mode */}
                        <Text style={[styles.inputLabel, { color: theme.textPrimary, fontWeight: '800', marginBottom: 8 }]}>
                          5. Chế Độ Câu Hỏi:
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                          {[
                  { id: 'mixed', label: '🎲 Hỗn Hợp' },
                  { id: 'cloze_blank', label: '✍️ Điền Vào Câu' },
                  { id: 'meaning_vi', label: '🅰️ Chọn Nghĩa' },
                  { id: 'listening', label: '🔊 Luyện Nghe' }].
                  map((m) => {
                    const isSelected = selectedQuizMode === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                        styles.filterChip,
                        { width: '48.5%', paddingVertical: 10, alignItems: 'center', backgroundColor: isSelected ? theme.accentPill : theme.innerCard, borderColor: isSelected ? theme.accent : theme.cardBorder }]
                        }
                        onPress={() => setSelectedQuizMode(m.id)}>
                        
                                <Text style={{ fontWeight: isSelected ? '800' : '600', color: isSelected ? theme.accent : theme.textPrimary, fontSize: 13 }}>
                                  {m.label}
                                </Text>
                              </TouchableOpacity>);

                  })}
                        </View>

                        {/* Start Button Options */}
                        <View style={{ gap: 10 }}>
                          <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg }]}
                    onPress={() => handleStartMobileQuiz(false)}
                    disabled={isQuizLoading}>
                    
                            {isQuizLoading ?
                    <ActivityIndicator size="small" color="#ffffff" /> :

                    <Text style={styles.primaryActionBtnText}>⚡ Bắt Đầu Quiz Nhanh</Text>
                    }
                          </TouchableOpacity>

                          <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: '#8b5cf6' }]}
                    onPress={() => handleStartMobileQuiz(true)}
                    disabled={isQuizLoading}>
                    
                            {isQuizLoading ?
                    <ActivityIndicator size="small" color="#ffffff" /> :

                    <Text style={styles.primaryActionBtnText}>✨ Tạo Đề Thi Bằng AI</Text>
                    }
                          </TouchableOpacity>
                        </View>
                      </View>)
              }
                  </View>)
            }
              </ScrollView> : null
          }

            {/* TAB: AI SPEAKING & PRONUNCIATION LAB */}
            {currentTab === 'speaking' ?
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent} />

            }>
            
                {/* Mode Selector */}
                <View style={{ flexDirection: 'row', backgroundColor: theme.drawerCardBg, borderRadius: 12, padding: 4, marginBottom: 14 }}>
                  <TouchableOpacity
                style={[
                styles.filterChip,
                { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: speakingActiveMode === 'read-aloud' ? theme.btnPrimaryBg : 'transparent', borderWidth: 0 }]
                }
                onPress={() => {
                  setSpeakingActiveMode('read-aloud');
                  setSpeakingReadResult(null);
                  setSpeakingQAResult(null);
                  const m = speakingPrompts.find((p) => p.category === 'read-aloud');
                  if (m) setSelectedSpeakingPrompt(m);
                }}>
                
                    <Text style={{ fontWeight: '800', color: speakingActiveMode === 'read-aloud' ? '#ffffff' : theme.textSecondary, fontSize: 12 }}>
                      🗣️ Đọc Mẫu
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                style={[
                styles.filterChip,
                { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: speakingActiveMode === 'qa' ? theme.btnPrimaryBg : 'transparent', borderWidth: 0 }]
                }
                onPress={() => {
                  setSpeakingActiveMode('qa');
                  setSpeakingReadResult(null);
                  setSpeakingQAResult(null);
                  const m = speakingPrompts.find((p) => p.category === 'qa');
                  if (m) setSelectedSpeakingPrompt(m);
                }}>
                
                    <Text style={{ fontWeight: '800', color: speakingActiveMode === 'qa' ? '#ffffff' : theme.textSecondary, fontSize: 12 }}>
                      🎙️ Hỏi Đáp (Q&A)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Prompt Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {speakingPrompts.filter((p) => p.category === speakingActiveMode).map((p) =>
                <TouchableOpacity
                  key={p.id}
                  onPress={() => {
                    setSelectedSpeakingPrompt(p);
                    setSpeakingReadResult(null);
                    setSpeakingQAResult(null);
                  }}
                  style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedSpeakingPrompt?.id === p.id ? theme.accentPill : theme.card,
                    borderColor: selectedSpeakingPrompt?.id === p.id ? theme.accent : theme.cardBorder
                  }]
                  }>
                  
                        <Text style={{ fontWeight: '700', color: selectedSpeakingPrompt?.id === p.id ? theme.accent : theme.textPrimary, fontSize: 12 }}>
                          {p.topic}
                        </Text>
                      </TouchableOpacity>
                )}
                  </View>
                </ScrollView>

                {/* Target Prompt Box */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>
                      {speakingActiveMode === 'read-aloud' ? 'Văn Bản Mẫu' : 'Câu Hỏi Khảo Thí'}
                    </Text>
                    <TouchableOpacity
                  onPress={() => playMobileAudio(speakingActiveMode === 'read-aloud' ? selectedSpeakingPrompt?.targetText : selectedSpeakingPrompt?.question)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.accentPill, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  
                      <IconVolume2 size={13} color={theme.accent} />
                      <Text style={{ color: theme.accent, fontSize: 11.5, fontWeight: '700' }}>Nghe Mẫu</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary, lineHeight: 24 }}>
                    {speakingActiveMode === 'read-aloud' ? selectedSpeakingPrompt?.targetText : selectedSpeakingPrompt?.question}
                  </Text>

                  {selectedSpeakingPrompt?.tips && speakingActiveMode === 'read-aloud' ?
              <View style={{ backgroundColor: theme.innerCard, padding: 8, borderRadius: 8, marginTop: 10 }}>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>💡 {selectedSpeakingPrompt.tips}</Text>
                    </View> : null
              }
                </View>

                {/* 🎙️ PRO MAX AUDIO RECORDING STUDIO */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: isSpeakingRecording ? '#ef4444' : theme.cardBorder, borderWidth: isSpeakingRecording ? 2 : 1, marginTop: 12, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 14 }]}>
                  
                  {/* Status Label & Timer */}
                  <View style={{ alignItems: 'center', marginBottom: 14 }}>
                    {isSpeakingRecording ?
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ef4444' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
                        <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 12.5 }}>
                          Đang Ghi Âm: {String(Math.floor(speakingRecordTimer / 60)).padStart(2, '0')}:{String(speakingRecordTimer % 60).padStart(2, '0')}
                        </Text>
                      </View> :
                userSpeakingAudioBase64 ?
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: '#10b981' }}>
                        <IconCheckCircle size={13} color="#10b981" />
                        <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 12 }}>
                          Đã Thu Âm ({speakingRecordTimer}s) • Sẵn Sàng
                        </Text>
                      </View> :

                <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.textSecondary }}>
                        Chạm Micro để bắt đầu ghi âm
                      </Text>
                }
                  </View>

                  {/* Big Hero Microphone / Stop Action Circle */}
                  <TouchableOpacity
                onPress={isSpeakingRecording ? stopMobileSpeakingRecording : startMobileSpeakingRecording}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: isSpeakingRecording ? '#ef4444' : theme.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: isSpeakingRecording ? '#ef4444' : theme.accent,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.45,
                  shadowRadius: 16,
                  elevation: 8,
                  marginBottom: 12
                }}
                activeOpacity={0.85}>
                
                    {isSpeakingRecording ?
                <IconSquare size={26} color="#ffffff" fill="#ffffff" /> :

                <IconMic size={34} color="#ffffff" />
                }
                  </TouchableOpacity>

                  <Text style={{ fontSize: 11.5, color: theme.textMuted, textAlign: 'center', marginBottom: 12 }}>
                    {isSpeakingRecording ?
                'Nói to, rõ ràng và phát âm chuẩn các âm đuôi...' :
                userSpeakingAudioBase64 ?
                'Chạm Micro nếu muốn thu âm lại' :
                'Bấm micro ➔ Đọc to câu tiếng Anh ➔ Bấm dừng'}
                  </Text>

                  {/* Playback & Reset Controls (When audio is recorded) */}
                  {Boolean(userSpeakingAudioBase64 && !isSpeakingRecording) ?
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14, width: '100%' }}>
                      <TouchableOpacity
                  onPress={playUserSpeakingAudio}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: theme.innerCard,
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.cardBorder
                  }}>
                  
                        {isPlayingSpeakingAudio ?
                  <IconPause size={15} color={theme.accent} /> :

                  <IconPlay size={15} color={theme.accent} fill={theme.accent} />
                  }
                        <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.textPrimary }}>
                          {isPlayingSpeakingAudio ? 'Tạm Dừng' : 'Nghe Lại'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                  onPress={resetSpeakingAudioSession}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: theme.innerCard,
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.cardBorder
                  }}>
                  
                        <IconRotateCw size={14} color={theme.textSecondary} />
                        <Text style={{ fontSize: 12.5, fontWeight: '700', color: theme.textSecondary }}>
                          Thu Lại
                        </Text>
                      </TouchableOpacity>
                    </View> : null
              }

                  {/* Realtime Transcribed Subtitles */}
                  {speakingSpokenText ?
              <View style={{ width: '100%', backgroundColor: theme.innerCard, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 12 }}>
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: theme.textMuted, marginBottom: 3, textTransform: 'uppercase' }}>
                        📝 Lời nói (Transcript):
                      </Text>
                      <Text style={{ fontSize: 13, color: theme.textPrimary, fontStyle: 'italic', lineHeight: 18 }}>
                        "{speakingSpokenText}"
                      </Text>
                    </View> :
              null}

                  {/* Submit & Analyze with Gemini AI Button */}
                  <TouchableOpacity
                style={[
                styles.primaryActionBtn,
                {
                  width: '100%',
                  backgroundColor: userSpeakingAudioBase64 || speakingSpokenText.trim() ? theme.accent : 'rgba(2, 132, 199, 0.4)',
                  marginTop: 2,
                  paddingVertical: 12
                }]
                }
                onPress={handleAnalyzeSpeaking}
                disabled={isAnalyzingSpeaking || !userSpeakingAudioBase64 && !speakingSpokenText.trim()}>
                
                    {isAnalyzingSpeaking ?
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={[styles.primaryActionBtnText, { fontSize: 13 }]}>Đang Chấm Điểm...</Text>
                      </View> :

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                        <IconSparkles size={16} color="#ffffff" />
                        <Text style={[styles.primaryActionBtnText, { fontSize: 13 }]}>✨ Chấm Điểm (AI) ➔</Text>
                      </View>
                }
                  </TouchableOpacity>
                </View>

                {/* Results View: Read-Aloud */}
                {speakingReadResult && speakingActiveMode === 'read-aloud' ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 14 }]}>
                    <View style={{ alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '700' }}>TỔNG ĐIỂM PHÁT ÂM</Text>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: theme.accent, marginTop: 2 }}>
                        {speakingReadResult.overallScore}%
                      </Text>
                    </View>

                    {/* Criteria stats */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                      <View style={[styles.statBoxCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, flex: 1, padding: 8 }]}>
                        <Text style={{ fontSize: 10, color: theme.textMuted }}>Độ Chuẩn</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981' }}>{speakingReadResult.accuracyScore}%</Text>
                      </View>
                      <View style={[styles.statBoxCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, flex: 1, padding: 8 }]}>
                        <Text style={{ fontSize: 10, color: theme.textMuted }}>Trôi Chảy</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#f59e0b' }}>{speakingReadResult.fluencyScore}%</Text>
                      </View>
                      <View style={[styles.statBoxCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, flex: 1, padding: 8 }]}>
                        <Text style={{ fontSize: 10, color: theme.textMuted }}>Hoàn Chỉnh</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#a855f7' }}>{speakingReadResult.completenessScore}%</Text>
                      </View>
                    </View>

                    {/* Word-by-word diff */}
                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary, marginBottom: 8 }}>
                      🔍 Phân Tích Từng Từ (Chạm để nghe phát âm):
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {speakingReadResult.wordsAnalysis?.map((w, idx) => {
                  let badgeBg = 'rgba(16, 185, 129, 0.15)';
                  let textColor = '#10b981';
                  if (w.status === 'mispronounced') {
                    badgeBg = 'rgba(245, 158, 11, 0.15)';
                    textColor = '#f59e0b';
                  } else if (w.status === 'missing') {
                    badgeBg = 'rgba(239, 68, 68, 0.15)';
                    textColor = '#ef4444';
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => playMobileAudio(w.word)}
                      style={{ backgroundColor: badgeBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                      
                            <Text style={{ fontWeight: '700', fontSize: 13, color: textColor }}>{w.word}</Text>
                          </TouchableOpacity>);

                })}
                    </View>

                    {/* Phonetic Tips */}
                    {speakingReadResult.phoneticTips?.map((tip, idx) =>
              <Text key={idx} style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                        ✓ {tip}
                      </Text>
              )}
                  </View> : null
            }

                {/* Results View: Q&A Assessment */}
                {speakingQAResult && speakingActiveMode === 'qa' ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 14 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary }}>Kết Quả Phỏng Vấn</Text>
                      <View style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 14 }}>Band {speakingQAResult.overallBand}</Text>
                      </View>
                    </View>

                    {/* 4 criteria breakdown */}
                    <View style={{ gap: 8, marginBottom: 14 }}>
                      {Object.entries(speakingQAResult.criteria || {}).map(([k, v]) =>
                <View key={k} style={{ backgroundColor: theme.innerCard, padding: 10, borderRadius: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '800', fontSize: 12, color: theme.textPrimary, textTransform: 'capitalize' }}>{k}</Text>
                            <Text style={{ fontWeight: '800', fontSize: 12, color: theme.accent }}>Band {v.band}</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{v.feedback}</Text>
                        </View>
                )}
                    </View>

                    {/* Band 8.5 Model Answer */}
                    {Boolean(speakingQAResult.modelAnswerBand85) ?
              <View style={{ backgroundColor: theme.innerCard, padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: theme.accent }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ fontWeight: '800', color: theme.accent, fontSize: 13 }}>Câu Trả Lời Mẫu Band 8.5+:</Text>
                          <TouchableOpacity onPress={() => playMobileAudio(speakingQAResult.modelAnswerBand85)}>
                            <IconVolume2 size={16} color={theme.accent} />
                          </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 13, color: theme.textPrimary, fontStyle: 'italic', lineHeight: 18 }}>
                          "{speakingQAResult.modelAnswerBand85}"
                        </Text>
                      </View> : null
              }
                  </View> : null
            }
              </ScrollView> : null
          }

            {/* TAB 5: SMART READER (FULL TÍNH NĂNG TƯƠNG ĐƯƠNG WEB) */}
            {currentTab === 'reader' ?
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent} />

            }>
            
                {/* Header Row */}
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <IconFileText size={20} color={theme.accent} />
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Smart Reader & Bài Đọc</Text>
                  </View>
                  {Boolean(!isAddingNote) ?
              <TouchableOpacity
                onPress={handleStartAddNote}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.accentPill, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                
                      <IconPlus size={14} color={theme.accent} />
                      <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 12 }}>Bài Mới</Text>
                    </TouchableOpacity> : null
              }
                </View>

                {/* Add / Edit Article Form */}
                {Boolean(isAddingNote) ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.accent, borderWidth: 1.5, marginBottom: 14 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={[styles.formTitle, { color: theme.textPrimary }]}>
                        {editingNote ? '✏️ Chỉnh Sửa Bài Đọc' : '✨ Tạo Bài Đọc Mới'}
                      </Text>
                      <TouchableOpacity onPress={() => {setIsAddingNote(false);setEditingNote(null);}} style={{ padding: 4 }}>
                        <IconX size={18} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Tiêu đề bài viết:</Text>
                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 4 }]}
                placeholder="VD: Breakthrough in Quantum AI..."
                placeholderTextColor={theme.textMuted}
                value={newNoteTitle}
                onChangeText={setNewNoteTitle} />
              

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Chủ đề:</Text>
                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 4 }]}
                placeholder="Tech, IELTS, Business, Daily..."
                placeholderTextColor={theme.textMuted}
                value={newNoteTopic}
                onChangeText={setNewNoteTopic} />
              

                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Nội dung bài đọc tiếng Anh:</Text>
                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 4, height: 160, textAlignVertical: 'top' }]}
                placeholder="Dán hoặc nhập nội dung đoạn văn, bài báo tiếng Anh..."
                placeholderTextColor={theme.textMuted}
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                multiline />
              

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                      <TouchableOpacity
                  style={[styles.primaryActionBtn, { flex: 1, backgroundColor: theme.innerCard, borderWidth: 1, borderColor: theme.cardBorder }]}
                  onPress={() => {setIsAddingNote(false);setEditingNote(null);}}>
                  
                        <Text style={[styles.primaryActionBtnText, { color: theme.textPrimary }]}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                  style={[styles.primaryActionBtn, { flex: 2, backgroundColor: theme.btnPrimaryBg }]}
                  onPress={handleSaveNote}>
                  
                        <Text style={styles.primaryActionBtnText}>
                          {editingNote ? 'Cập Nhật Bài' : 'Lưu Bài Đọc'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View> : null
            }

                {/* ACTIVE READER VIEW (SELECTED NOTE) */}
                {selectedNote ? (() => {
              const wordCount = selectedNote.content ? selectedNote.content.split(/\s+/).filter((w) => w.length > 0).length : 0;
              const readingTime = Math.max(1, Math.ceil(wordCount / 180));
              const paragraphs = (selectedNote.content || '').split('\n').filter((p) => p.trim().length > 0);

              return (
                <View>
                      {/* Top Action Bar */}
                      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <TouchableOpacity
                        onPress={() => {setSelectedNote(null);setReaderSelectedWord('');}}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        
                            <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 13 }}>← Danh Sách</Text>
                          </TouchableOpacity>

                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            <TouchableOpacity
                          onPress={() => handleStartEditNote(selectedNote)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.innerCard, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: theme.cardBorder }}>
                          
                              <IconEdit size={13} color={theme.textPrimary} />
                              <Text style={{ color: theme.textPrimary, fontSize: 11.5, fontWeight: '700' }}>Sửa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                          onPress={() => handleSendReaderToAiLab(selectedNote.content)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(168, 85, 247, 0.15)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                          
                              <IconSparkles size={13} color="#a855f7" />
                              <Text style={{ color: '#a855f7', fontSize: 11.5, fontWeight: '700' }}>Bóc Tách AI</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                          onPress={() => handleDeleteNote(selectedNote.id, selectedNote.title)}
                          style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                          
                              <IconTrash size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Article Header Card */}
                      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginBottom: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                            <Text style={[styles.levelPillText, { color: theme.accent }]}>{selectedNote.topic || 'General'}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <IconClock size={12} color={theme.textMuted} />
                            <Text style={{ fontSize: 11.5, color: theme.textMuted }}>~{readingTime} phút đọc ({wordCount} từ)</Text>
                          </View>
                        </View>

                        <Text style={[styles.heroTitle, { color: theme.textPrimary, fontSize: 20, lineHeight: 26 }]}>
                          {selectedNote.title}
                        </Text>
                      </View>

                      {/* Smart Highlighter Banner */}
                      <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.08)',
                    borderColor: theme.accent,
                    borderWidth: 1,
                    padding: 10,
                    borderRadius: 12,
                    marginBottom: 14
                  }}>
                        <IconSparkles size={16} color={theme.accent} />
                        <Text style={{ color: theme.textPrimary, fontSize: 12, flex: 1, lineHeight: 16 }}>
                          <Text style={{ fontWeight: '800', color: theme.accent }}>Smart Highlighter:</Text> Chạm vào bất kỳ từ nào để nghe phát âm, lưu từ vựng hoặc bóc tách AI!
                        </Text>
                      </View>

                      {/* Floating / Sticky Interactive Contextual Translation Toolkit */}
                      {readerSelectedWord ? (() => {
                    const cleanSelectedWord = readerSelectedWord.replace(/^[^\w]+|[^\w]+$/g, '').trim();
                    const displayIpa = readerSelectedIpa || readerContextTranslation?.phonetic || '';
                    const displayPos = readerSelectedPos || readerContextTranslation?.partOfSpeech || '';

                    return (
                      <View style={{
                        backgroundColor: theme.card,
                        borderColor: theme.accent,
                        borderWidth: 1.5,
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 14,
                        shadowColor: theme.accent,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.25,
                        shadowRadius: 12,
                        elevation: 8
                      }}>
                            {/* Toolkit Header: Word, IPA, Level */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                                <View style={{ backgroundColor: theme.accentPill, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Text style={{ fontSize: 15, fontWeight: '900', color: theme.accent }}>
                                    "{cleanSelectedWord}"
                                  </Text>
                                  <TouchableOpacity onPress={() => playMobileAudio(cleanSelectedWord, mobileSpeed, mobileAccent)} style={{ padding: 2 }}>
                                    <IconVolume2 size={14} color={theme.accent} />
                                  </TouchableOpacity>
                                </View>

                                {/* Immediate IPA Pronunciation */}
                                {displayIpa ?
                            <View style={{ backgroundColor: theme.innerCard, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: theme.cardBorder }}>
                                    <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '700' }}>
                                      {displayIpa}
                                    </Text>
                                  </View> :
                            null}

                                {displayPos ?
                            <View style={{ backgroundColor: theme.drawerCardBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: theme.cardBorder }}>
                                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: theme.textSecondary }}>
                                      {displayPos}
                                    </Text>
                                  </View> :
                            null}

                                {readerContextTranslation?.level ?
                            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#10b981' }}>
                                      {readerContextTranslation.level}
                                    </Text>
                                  </View> :
                            null}
                              </View>

                              <TouchableOpacity onPress={() => {setReaderSelectedWord('');setReaderContextTranslation(null);}} style={{ padding: 4 }}>
                                <IconX size={16} color={theme.textMuted} />
                              </TouchableOpacity>
                            </View>

                            {/* Trigger Translate Button (When NOT yet translated) */}
                            {Boolean(!readerContextTranslation && !isTranslatingContext) ?
                        <TouchableOpacity
                          onPress={() => handleTranslateInContext(cleanSelectedWord)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
                            paddingVertical: 9,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: theme.accent,
                            marginBottom: 10
                          }}>
                          
                                <IconSparkles size={15} color={theme.accent} />
                                <Text style={{ fontSize: 12.5, fontWeight: '800', color: theme.accent }}>
                                  🌐 Bấm để dịch nghĩa theo ngữ cảnh bài đọc
                                </Text>
                              </TouchableOpacity> : null
                        }

                            {/* Contextual Translation Body */}
                            {isTranslatingContext ?
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, justifyContent: 'center' }}>
                                <ActivityIndicator size="small" color={theme.accent} />
                                <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '700' }}>
                                  ✨ AI đang phân tích nghĩa theo ngữ cảnh bài đọc...
                                </Text>
                              </View> :
                        readerContextTranslation ?
                        <View style={{ marginBottom: 12, gap: 5 }}>
                                {/* Meaning in Context */}
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: theme.accent }}>🎯 Nghĩa trong bài:</Text>
                                  <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary, flex: 1 }}>
                                    {readerContextTranslation.contextualMeaningVi}
                                  </Text>
                                </View>

                                {/* Context Nuance / Explanation */}
                                {readerContextTranslation.contextExplanation ?
                          <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 16 }}>
                                    💡 {readerContextTranslation.contextExplanation}
                                  </Text> :
                          null}

                                {/* Sentence Translation */}
                                {readerContextTranslation.overallSentenceVi ?
                          <View style={{ backgroundColor: theme.innerCard, padding: 8, borderRadius: 8, marginTop: 4, borderLeftWidth: 3, borderLeftColor: theme.accent }}>
                                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: theme.textMuted, marginBottom: 2 }}>
                                      🌐 BẢN DỊCH CẢ CÂU:
                                    </Text>
                                    <Text style={{ fontSize: 12, color: theme.textPrimary, fontStyle: 'italic', lineHeight: 17 }}>
                                      "{readerContextTranslation.overallSentenceVi}"
                                    </Text>
                                  </View> :
                          null}

                                {/* Collocations */}
                                {readerContextTranslation.collocations && readerContextTranslation.collocations.length > 0 ?
                          <Text style={{ fontSize: 11, color: '#8b5cf6', marginTop: 2 }}>
                                    📚 Cụm từ hay: {readerContextTranslation.collocations.join(' • ')}
                                  </Text> :
                          null}
                              </View> :
                        null}

                            {/* Quick Action Buttons */}
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <TouchableOpacity
                            onPress={() => handleSaveWordFromReader(cleanSelectedWord)}
                            disabled={isSavingWordFromReader}
                            style={{
                              flex: 1.4,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              backgroundColor: theme.btnPrimaryBg,
                              paddingVertical: 9,
                              borderRadius: 10
                            }}>
                            
                                {isSavingWordFromReader ?
                            <ActivityIndicator size="small" color="#ffffff" /> :

                            <>
                                    <IconPlus size={14} color="#ffffff" />
                                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>Lưu Vào Kho Từ</Text>
                                  </>
                            }
                              </TouchableOpacity>

                              <TouchableOpacity
                            onPress={() => {
                              const sentence = getSentenceContainingWord(selectedNote.content, cleanSelectedWord);
                              handleSendReaderToAiLab(sentence);
                            }}
                            style={{
                              flex: 1.2,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              backgroundColor: '#8b5cf6',
                              paddingVertical: 9,
                              borderRadius: 10
                            }}>
                            
                                <IconSparkles size={14} color="#ffffff" />
                                <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>Bóc Tách AI</Text>
                              </TouchableOpacity>
                            </View>
                          </View>);

                  })() : null}

                      {/* Interactive Highlightable Content Body */}
                      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, padding: 16 }]}>
                        {paragraphs.map((para, pIdx) => {
                      const words = para.split(/\s+/);
                      return (
                        <View key={pIdx} style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
                              {words.map((rawWord, wIdx) => {
                            const cleanWord = rawWord.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
                            const isCurrentSelected = readerSelectedWord && cleanWord && readerSelectedWord.toLowerCase() === cleanWord;

                            return (
                              <TouchableOpacity
                                key={wIdx}
                                onPress={() => {
                                  const wordOnly = rawWord.replace(/^[^\w]+|[^\w]+$/g, '').trim();
                                  if (wordOnly) {
                                    handleSelectWordInReader(wordOnly);
                                  }
                                }}
                                activeOpacity={0.7}
                                style={{
                                  backgroundColor: isCurrentSelected ? theme.accent : 'transparent',
                                  paddingHorizontal: isCurrentSelected ? 4 : 2,
                                  paddingVertical: 1,
                                  borderRadius: 4,
                                  marginRight: 4,
                                  marginBottom: 4
                                }}>
                                
                                    <Text style={{
                                  fontSize: 16,
                                  lineHeight: 24,
                                  color: isCurrentSelected ? '#ffffff' : theme.textPrimary,
                                  fontWeight: isCurrentSelected ? '800' : '400'
                                }}>
                                      {rawWord}
                                    </Text>
                                  </TouchableOpacity>);

                          })}
                            </View>);

                    })}
                      </View>
                    </View>);

            })() : (
            /* Articles List View */
            <View>
                    {/* Search Input Bar */}
                    <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.inputBg,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                marginBottom: 14,
                gap: 8
              }}>
                      <IconSearch size={16} color={theme.textMuted} />
                      <TextInput
                  style={{ flex: 1, color: theme.textPrimary, fontSize: 13, padding: 0 }}
                  placeholder="Tìm kiếm bài đọc, chủ đề..."
                  placeholderTextColor={theme.textMuted}
                  value={noteSearchQuery}
                  onChangeText={setNoteSearchQuery} />
                
                      {noteSearchQuery ?
                <TouchableOpacity onPress={() => setNoteSearchQuery('')}>
                          <IconX size={15} color={theme.textMuted} />
                        </TouchableOpacity> :
                null}
                    </View>

                    {/* Filtered Notes List */}
                    {notes.
              filter((n) => {
                if (!noteSearchQuery.trim()) return true;
                const q = noteSearchQuery.toLowerCase().trim();
                const qClean = removeVietnameseTones(q);
                const title = (n.title || '').toLowerCase();
                const topic = (n.topic || '').toLowerCase();
                const content = (n.content || '').toLowerCase();
                return (
                  title.includes(q) ||
                  topic.includes(q) ||
                  content.includes(q) ||
                  removeVietnameseTones(title).includes(qClean) ||
                  removeVietnameseTones(topic).includes(qClean) ||
                  removeVietnameseTones(content).includes(qClean));

              }).
              map((n) => {
                const wordCount = n.content ? n.content.split(/\s+/).filter((w) => w.length > 0).length : 0;
                const readingTime = Math.max(1, Math.ceil(wordCount / 180));

                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginBottom: 10 }]}
                    onPress={() => {setSelectedNote(n);setReaderSelectedWord('');}}
                    activeOpacity={0.8}>
                    
                            <View style={styles.cardHeaderRow}>
                              <Text style={[styles.vocabWordText, { color: theme.textPrimary, flex: 1, marginRight: 8 }]} numberOfLines={1}>
                                {n.title}
                              </Text>
                              <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                                <Text style={[styles.levelPillText, { color: theme.accent }]}>{n.topic || 'General'}</Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 8 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <IconClock size={11} color={theme.textMuted} />
                                <Text style={{ fontSize: 11, color: theme.textMuted }}>~{readingTime} phút đọc</Text>
                              </View>
                              <Text style={{ fontSize: 11, color: theme.textMuted }}>•</Text>
                              <Text style={{ fontSize: 11, color: theme.textMuted }}>{wordCount} từ</Text>
                            </View>

                            <Text style={[styles.vocabExampleSub, { color: theme.textSecondary, lineHeight: 18 }]} numberOfLines={2}>
                              {n.content}
                            </Text>
                          </TouchableOpacity>);

              })}

                    {notes.length === 0 ?
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, alignItems: 'center', paddingVertical: 32 }]}>
                        <IconBookOpen size={40} color={theme.textMuted} />
                        <Text style={[styles.heroTitle, { color: theme.textPrimary, marginTop: 10, fontSize: 16 }]}>
                          Chưa Có Bài Đọc Nào
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 14, maxWidth: 260 }}>
                          Tạo bài đọc mới hoặc dán bài báo tiếng Anh để luyện đọc và tra từ thông minh.
                        </Text>
                        <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, paddingHorizontal: 20 }]}
                  onPress={handleStartAddNote}>
                  
                          <Text style={styles.primaryActionBtnText}>+ Tạo Bài Đầu Tiên</Text>
                        </TouchableOpacity>
                      </View> : null
              }
                  </View>)
            }
              </ScrollView> : null
          }

            {/* TAB 6: AI ENGLISH LAB (NÂNG CẤP TOÀN DIỆN TƯƠNG ĐƯƠNG BẢN WEB) */}
            {currentTab === 'ai-lab' ?
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent} />

            }>
            
                {/* 1. HORIZONTAL SUBTABS CAROUSEL */}
                <View style={{ height: 38, marginBottom: 12 }}>
                  <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, alignItems: 'center', paddingHorizontal: 2 }}
                style={{ flexGrow: 0 }}>
                
                    {[
                { id: 'parse', label: 'Bóc Tách', icon: '✨' },
                { id: 'paraphrase', label: 'Nâng Cấp', icon: '🔄' },
                { id: 'check', label: 'Chấm Sửa', icon: '✍️' },
                { id: 'collocations', label: 'Cụm Từ', icon: '📚' },
                { id: 'dialogue', label: 'Hội Thoại', icon: '💬' },
                { id: 'story', label: 'Truyện SRS', icon: '📖' }].
                map((sub) => {
                  const isSubSelected = aiSubTab === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSubSelected ? theme.btnPrimaryBg : theme.card,
                        borderColor: isSubSelected ? theme.btnPrimaryBg : theme.cardBorder,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        height: 34
                      }]
                      }
                      onPress={() => setAiSubTab(sub.id)}>
                      
                          <Text style={{ fontSize: 12, fontWeight: isSubSelected ? '800' : '600', color: isSubSelected ? '#ffffff' : theme.textSecondary }}>
                            {sub.icon} {sub.label}
                          </Text>
                        </TouchableOpacity>);

                })}
                  </ScrollView>
                </View>

                {/* SUBTAB 1: BÓC TÁCH CÂU */}
                {aiSubTab === 'parse' ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>AI Bóc Tách Câu & Trích Xuất Từ Vựng</Text>
                    <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>Dán câu tiếng Anh để AI phân tích cấu trúc, dịch tự nhiên và trích xuất từ vựng hay.</Text>

                    {/* Quick Sample Chips */}
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 10, marginBottom: 4 }}>💡 Thử ngay câu mẫu:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                      {[
                { label: '💻 Tech Team', text: 'The resilient engineering team managed to navigate the complex infrastructure challenges effortlessly.' },
                { label: '💼 Business Deal', text: 'We need to leverage our strategic advantages to achieve a breakthrough in market share.' },
                { label: '🎓 Academic IELTS', text: 'The ubiquitous adoption of artificial intelligence has fundamentally transformed modern pedagogical methods.' }].
                map((item, idx) =>
                <TouchableOpacity
                  key={idx}
                  onPress={() => setAiSentenceInput(item.text)}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }}>
                  
                          <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600' }}>{item.label}</Text>
                        </TouchableOpacity>
                )}
                    </ScrollView>

                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, height: 75, textAlignVertical: 'top' }]}
                placeholder="Dán câu tiếng Anh..."
                placeholderTextColor={theme.textMuted}
                value={aiSentenceInput}
                onChangeText={setAiSentenceInput}
                multiline />
              
                    <TouchableOpacity
                style={[styles.primaryActionBtn, { marginTop: 12, backgroundColor: '#a855f7' }]}
                onPress={handleAiParse}
                disabled={isAiLoading}>
                
                      {isAiLoading ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconSparkles size={16} color="#ffffff" />
                          <Text style={styles.primaryActionBtnText}>Bóc Tách Câu Bằng AI</Text>
                        </View>
                }
                    </TouchableOpacity>

                    {Boolean(aiParseResult) ?
              <View style={{ marginTop: 16, gap: 10 }}>
                        {/* 1. Natural Translation */}
                        <View style={{ padding: 12, borderRadius: 12, backgroundColor: theme.drawerCardBg, borderLeftWidth: 4, borderLeftColor: theme.accent }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>Bản dịch tự nhiên:</Text>
                            <TouchableOpacity onPress={() => playMobileAudio(aiSentenceInput)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <IconVolume2 size={16} color={theme.accent} />
                            </TouchableOpacity>
                          </View>
                          <Text style={[styles.backMeaningVi, { color: theme.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 4 }]}>
                            {aiParseResult.translation || aiParseResult.translation_vi}
                          </Text>
                          {Boolean(aiParseResult.grammar_notes) ?
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 6, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 6 }}>
                              💡 {aiParseResult.grammar_notes}
                            </Text> : null
                  }
                        </View>

                        {/* 2. Sentence Syntax & Structure Breakdown */}
                        {Boolean(aiParseResult.sentence_structure) ?
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', borderWidth: 1, borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : '#bfdbfe', borderLeftWidth: 4, borderLeftColor: '#3b82f6' }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' }}>
                              📐 Bóc Tách Cấu Trúc Ngữ Pháp (Syntax Breakdown):
                            </Text>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textPrimary, marginTop: 5, lineHeight: 18 }}>
                              {aiParseResult.sentence_structure}
                            </Text>
                          </View> : null
                }

                        {/* 3. Core Sentence Patterns */}
                        {aiParseResult.patterns?.length > 0 ?
                <View>
                            <Text style={[styles.cardSectionLabel, { color: theme.textSecondary, marginBottom: 6 }]}>
                              Mẫu Câu & Cấu Trúc Trọng Tâm:
                            </Text>
                            {aiParseResult.patterns.map((p, pIdx) =>
                  <View key={pIdx} style={{ backgroundColor: theme.innerCard, borderRadius: 12, padding: 11, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 8, gap: 5 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text style={{ fontSize: 13, fontWeight: '800', color: theme.accent, flex: 1, marginRight: 8 }}>
                                    {p.name}
                                  </Text>
                                  <TouchableOpacity
                        style={[styles.levelPill, { backgroundColor: savedPatternIndices[pIdx] ? '#10b981' : theme.btnPrimaryBg, paddingHorizontal: 8, paddingVertical: 4 }]}
                        onPress={() => handleSaveParsedPattern(p, pIdx)}
                        disabled={savedPatternIndices[pIdx]}>
                        
                                    <Text style={[styles.levelPillText, { color: '#ffffff', fontSize: 11 }]}>
                                      {savedPatternIndices[pIdx] ? '✓ Đã Lưu' : '+ Lưu Mẫu Câu'}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                                {Boolean(p.formula) ?
                    <View style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                    <Text style={{ fontSize: 11, fontFamily: 'monospace', color: theme.accent, fontWeight: '700' }}>
                                      {p.formula}
                                    </Text>
                                  </View> : null
                    }
                                <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 16 }}>
                                  {p.explanation}
                                </Text>
                              </View>
                  )}
                          </View> : null
                }

                        {/* 4. Extracted Vocabulary */}
                        {aiParseResult.extracted_words?.length > 0 ?
                <View>
                            <Text style={[styles.cardSectionLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Từ vựng trích xuất:</Text>
                            {aiParseResult.extracted_words.map((w, idx) =>
                  <View key={idx} style={[styles.vocabListItem, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, marginBottom: 8, padding: 12 }]}>
                                <View style={styles.vocabItemLeft}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.vocabWordText, { color: theme.textPrimary, fontSize: 16 }]}>{w.word}</Text>
                                    <TouchableOpacity onPress={() => playMobileAudio(w.word)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                      <IconVolume2 size={15} color={theme.accent} />
                                    </TouchableOpacity>
                                  </View>
                                  <Text style={[styles.vocabMeaningText, { color: theme.accent, fontSize: 13, marginTop: 2 }]}>{w.meaning_vi}</Text>
                                  {Boolean(w.context_usage) ?
                      <Text style={[styles.vocabExampleSub, { color: theme.textSecondary, fontSize: 11, marginTop: 2 }]} numberOfLines={2}>
                                      {w.context_usage}
                                    </Text> : null
                      }
                                </View>
                                <TouchableOpacity
                      style={[styles.levelPill, { backgroundColor: theme.btnPrimaryBg, paddingHorizontal: 8, paddingVertical: 4 }]}
                      onPress={() => {
                        setNewWord(w.word);
                        setNewMeaningVi(w.meaning_vi);
                        navigateTo('add');
                      }}>
                      
                                  <Text style={[styles.levelPillText, { color: '#ffffff', fontSize: 11 }]}>+ Lưu</Text>
                                </TouchableOpacity>
                              </View>
                  )}
                          </View> : null
                }
                      </View> : null
              }
                  </View> : null
            }

                {/* SUBTAB 2: NÂNG CẤP VĂN PHONG (PARAPHRASER) */}
                {aiSubTab === 'paraphrase' ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>AI Nâng Cấp Văn Phong & Viết Lại</Text>
                    <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>Chuyển đổi câu tiếng Anh theo phong cách Business, Academic hoặc Natural Native.</Text>

                    {/* Quick Sample Chips */}
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 10, marginBottom: 4 }}>💡 Thử ngay câu mẫu:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                      {[
                { label: 'Họp bận', text: 'I cannot attend the sync meeting today because I have to fix a critical database bug.' },
                { label: 'Lùi deadline', text: 'We cannot deliver the feature on time due to technical debt and complex architecture.' },
                { label: 'Ý tưởng mới', text: 'I think we should try another approach to solve this scalability issue.' }].
                map((item, idx) =>
                <TouchableOpacity
                  key={idx}
                  onPress={() => setAiParaphraseInput(item.text)}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }}>
                  
                          <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600' }}>{item.label}</Text>
                        </TouchableOpacity>
                )}
                    </ScrollView>

                    {/* Tone Selector Carousel */}
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary, marginBottom: 6 }}>Chọn văn phong mục tiêu:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
                      {[
                { id: 'business', emoji: '💼', title: 'Business' },
                { id: 'academic', emoji: '🎓', title: 'IELTS 8.0+' },
                { id: 'casual', emoji: '☕', title: 'Native Daily' },
                { id: 'concise', emoji: '⚡', title: 'Concise' }].
                map((tone) => {
                  const isToneActive = aiParaphraseTone === tone.id;
                  return (
                    <TouchableOpacity
                      key={tone.id}
                      onPress={() => setAiParaphraseTone(tone.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: isToneActive ? theme.btnPrimaryBg : theme.drawerCardBg,
                        borderWidth: 1,
                        borderColor: isToneActive ? theme.btnPrimaryBg : theme.cardBorder,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                      }}>
                      
                            <Text style={{ fontSize: 12 }}>{tone.emoji}</Text>
                            <Text style={{ fontSize: 12, fontWeight: isToneActive ? '800' : '600', color: isToneActive ? '#ffffff' : theme.textSecondary }}>
                              {tone.title}
                            </Text>
                          </TouchableOpacity>);

                })}
                    </ScrollView>

                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, height: 75, textAlignVertical: 'top' }]}
                placeholder="Dán câu tiếng Anh muốn viết lại..."
                placeholderTextColor={theme.textMuted}
                value={aiParaphraseInput}
                onChangeText={setAiParaphraseInput}
                multiline />
              

                    <TouchableOpacity
                style={[styles.primaryActionBtn, { marginTop: 12, backgroundColor: '#a855f7' }]}
                onPress={handleAiParaphrase}
                disabled={isAiLoading}>
                
                      {isAiLoading ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconSparkles size={16} color="#ffffff" />
                          <Text style={styles.primaryActionBtnText}>Nâng Cấp Câu Bằng AI</Text>
                        </View>
                }
                    </TouchableOpacity>

                    {Boolean(aiParaphraseResult) ?
              <View style={{ marginTop: 16, gap: 10 }}>
                        <Text style={[styles.cardSectionLabel, { color: theme.textSecondary }]}>Các phiên bản viết lại xuất sắc:</Text>
                        {aiParaphraseResult.paraphrases?.map((p, idx) =>
                <View key={idx} style={{ backgroundColor: theme.drawerCardBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.cardBorder, borderLeftWidth: 4, borderLeftColor: theme.accent, gap: 6 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary, flex: 1, marginRight: 8 }}>
                                "{p.version}"
                              </Text>
                              <TouchableOpacity onPress={() => playMobileAudio(p.version)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <IconVolume2 size={16} color={theme.accent} />
                              </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 12, color: theme.textSecondary, fontStyle: 'italic' }}>
                              💡 {p.explanation_vi}
                            </Text>
                          </View>
                )}
                      </View> : null
              }
                  </View> : null
            }

                {/* SUBTAB 3: CHẤM & SỬA CÂU */}
                {aiSubTab === 'check' ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>AI Chấm & Sửa Câu Tự Đặt</Text>
                    <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>Viết câu với từ vựng để AI nhận xét ngữ pháp và gợi ý câu chuẩn bản xứ.</Text>

                    {/* Quick Word Chips */}
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 10, marginBottom: 4 }}>💡 Chọn từ mục tiêu mẫu:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                      {[
                { word: 'resilient', sentence: 'She is a very resilient engineer who always overcomes difficult bugs.' },
                { word: 'articulate', sentence: 'He can articulate his complex ideas clearly in front of international clients.' },
                { word: 'compromise', sentence: 'We should never compromise on software quality for a rushed deadline.' }].
                map((item, idx) =>
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setAiTargetWord(item.word);
                    setAiUserSentence(item.sentence);
                  }}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }}>
                  
                          <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '600' }}>{item.word}</Text>
                        </TouchableOpacity>
                )}
                    </ScrollView>

                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="Từ mục tiêu (ví dụ: resilient, articulate)"
                placeholderTextColor={theme.textMuted}
                value={aiTargetWord}
                onChangeText={setAiTargetWord} />
              
                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 10, height: 75, textAlignVertical: 'top' }]}
                placeholder="Câu tiếng Anh của bạn..."
                placeholderTextColor={theme.textMuted}
                value={aiUserSentence}
                onChangeText={setAiUserSentence}
                multiline />
              
                    <TouchableOpacity
                style={[styles.primaryActionBtn, { marginTop: 12, backgroundColor: '#a855f7' }]}
                onPress={handleAiCheck}
                disabled={isAiLoading}>
                
                      {isAiLoading ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconSparkles size={16} color="#ffffff" />
                          <Text style={styles.primaryActionBtnText}>Chấm & Sửa Câu</Text>
                        </View>
                }
                    </TouchableOpacity>

                    {Boolean(aiCheckResult) ?
              <View style={{ marginTop: 16, gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.statBoxNum, { color: aiCheckResult.score >= 80 ? '#10b981' : '#f59e0b' }]}>
                            Điểm: {aiCheckResult.score}/100
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: aiCheckResult.is_correct ? '#10b981' : '#f59e0b' }}>
                            {aiCheckResult.is_correct ? '✓ Chuẩn xác' : '⚠️ Cần cải thiện'}
                          </Text>
                        </View>
                        <Text style={[styles.backMeaningEn, { color: theme.textSecondary, fontSize: 13 }]}>
                          {aiCheckResult.feedback || aiCheckResult.feedback_vi}
                        </Text>
                        {aiCheckResult.native_alternatives?.length > 0 ?
                <View style={{ marginTop: 4 }}>
                            <Text style={[styles.cardSectionLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Cách diễn đạt bản xứ (Native):</Text>
                            {aiCheckResult.native_alternatives.map((alt, idx) =>
                  <View key={idx} style={[styles.exampleBox, { backgroundColor: theme.exampleBg, borderLeftColor: theme.accent, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }]}>
                                <Text style={[styles.exampleText, { color: theme.exampleText, flex: 1, marginRight: 6 }]}>"{alt}"</Text>
                                <TouchableOpacity onPress={() => playMobileAudio(alt)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                  <IconVolume2 size={15} color={theme.accent} />
                                </TouchableOpacity>
                              </View>
                  )}
                          </View> : null
                }
                      </View> : null
              }
                  </View> : null
            }

                {/* SUBTAB 4: CỤM TỪ & IDIOMS (COLLOCATIONS) */}
                {aiSubTab === 'collocations' ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Đào Sâu Cụm Từ & Thành Ngữ</Text>
                    <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>Khám phá các cụm từ kết hợp tự nhiên (Collocations) và cảnh báo lỗi sai thường gặp.</Text>

                    {/* Quick Word Tags */}
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginTop: 10, marginBottom: 4 }}>💡 Chọn từ vựng cần đào sâu:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                      {['leverage', 'compromise', 'resilient', 'articulate', 'ubiquitous', 'pragmatic'].map((w, idx) =>
                <TouchableOpacity
                  key={idx}
                  onPress={() => setAiCollocationWord(w)}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: aiCollocationWord === w ? theme.btnPrimaryBg : theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }}>
                  
                          <Text style={{ fontSize: 11, color: aiCollocationWord === w ? '#ffffff' : theme.accent, fontWeight: '600' }}>{w}</Text>
                        </TouchableOpacity>
                )}
                    </ScrollView>

                    <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                placeholder="Nhập từ vựng (ví dụ: leverage, compromise, resilient)"
                placeholderTextColor={theme.textMuted}
                value={aiCollocationWord}
                onChangeText={setAiCollocationWord} />
              

                    <TouchableOpacity
                style={[styles.primaryActionBtn, { marginTop: 12, backgroundColor: '#a855f7' }]}
                onPress={handleAiCollocations}
                disabled={isAiLoading}>
                
                      {isAiLoading ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconSparkles size={16} color="#ffffff" />
                          <Text style={styles.primaryActionBtnText}>Khảo Sát Cụm Từ Bằng AI</Text>
                        </View>
                }
                    </TouchableOpacity>

                    {Boolean(aiCollocationResult) ?
              <View style={{ marginTop: 16, gap: 10 }}>
                        <View style={{ padding: 12, borderRadius: 12, backgroundColor: theme.drawerCardBg, borderLeftWidth: 4, borderLeftColor: theme.accent }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.textPrimary }}>{aiCollocationResult.target_word}</Text>
                            <Text style={{ fontSize: 12, color: theme.textMuted }}>{aiCollocationResult.phonetic}</Text>
                            <TouchableOpacity onPress={() => playMobileAudio(aiCollocationResult.target_word)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <IconVolume2 size={16} color={theme.accent} />
                            </TouchableOpacity>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.accent, marginTop: 2 }}>{aiCollocationResult.core_meaning_vi}</Text>
                        </View>

                        {aiCollocationResult.collocations?.length > 0 ?
                <View>
                            <Text style={[styles.cardSectionLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Cụm từ tự nhiên hay đi cùng (Collocations):</Text>
                            {aiCollocationResult.collocations.map((c, idx) =>
                  <View key={idx} style={{ backgroundColor: theme.innerCard, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 6, gap: 4 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text style={{ fontSize: 14, fontWeight: '800', color: theme.accent }}>{c.collocation}</Text>
                                  <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: theme.drawerCardBg }}>
                                    <Text style={{ fontSize: 10, color: theme.textMuted }}>{c.pattern}</Text>
                                  </View>
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary }}>{c.meaning_vi}</Text>
                                <Text style={{ fontSize: 11, fontStyle: 'italic', color: theme.textSecondary }}>"{c.example_en}"</Text>
                              </View>
                  )}
                          </View> : null
                }
                      </View> : null
              }
                  </View> : null
            }

                {/* SUBTAB 5: HỘI THOẠI TÌNH HUỐNG (DIALOGUE) */}
                {aiSubTab === 'dialogue' ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Hội Thoại Tình Huống Giao Tiếp</Text>
                    <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>AI tạo cuộc đối thoại thực chiến lồng ghép từ vựng trong kho của bạn.</Text>

                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textPrimary, marginTop: 10, marginBottom: 6 }}>Chọn tình huống thực tế:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
                      {[
                { id: 'job_interview', emoji: '💼', title: 'Phỏng Vấn Tech' },
                { id: 'salary_negotiation', emoji: '💰', title: 'Đàm Phán Lương' },
                { id: 'tech_standup', emoji: '💻', title: 'Họp Standup' },
                { id: 'daily_casual', emoji: '☕', title: 'Cafe Đồng Nghiệp' },
                { id: 'travel_airport', emoji: '✈️', title: 'Sân Bay & Du Lịch' }].
                map((sc) => {
                  const isScActive = aiDialogueScenario === sc.id;
                  return (
                    <TouchableOpacity
                      key={sc.id}
                      onPress={() => setAiDialogueScenario(sc.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: isScActive ? theme.btnPrimaryBg : theme.drawerCardBg,
                        borderWidth: 1,
                        borderColor: isScActive ? theme.btnPrimaryBg : theme.cardBorder,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4
                      }}>
                      
                            <Text style={{ fontSize: 12 }}>{sc.emoji}</Text>
                            <Text style={{ fontSize: 12, fontWeight: isScActive ? '800' : '600', color: isScActive ? '#ffffff' : theme.textSecondary }}>
                              {sc.title}
                            </Text>
                          </TouchableOpacity>);

                })}
                    </ScrollView>

                    <TouchableOpacity
                style={[styles.primaryActionBtn, { marginTop: 4, backgroundColor: '#a855f7' }]}
                onPress={handleAiDialogue}
                disabled={isAiLoading}>
                
                      {isAiLoading ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconSparkles size={16} color="#ffffff" />
                          <Text style={styles.primaryActionBtnText}>Tạo Cuộc Hội Thoại Mới</Text>
                        </View>
                }
                    </TouchableOpacity>

                    {Boolean(aiDialogueResult) ?
              <View style={{ marginTop: 16, gap: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.accent }}>🎭 {aiDialogueResult.scenario_title}</Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>{aiDialogueResult.scenario_desc_vi}</Text>

                        {aiDialogueResult.dialogue?.map((turn, tIdx) => {
                  const isLeft = tIdx % 2 === 0;
                  return (
                    <View
                      key={tIdx}
                      style={{
                        alignSelf: isLeft ? 'flex-start' : 'flex-end',
                        maxWidth: '90%',
                        backgroundColor: isLeft ? theme.drawerCardBg : isDark ? 'rgba(2, 132, 199, 0.25)' : 'rgba(2, 132, 199, 0.12)',
                        padding: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                        gap: 3
                      }}>
                      
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: isLeft ? theme.textMuted : theme.accent }}>{turn.speaker}</Text>
                                <TouchableOpacity onPress={() => playMobileAudio(turn.text_en)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                  <IconVolume2 size={13} color={theme.accent} />
                                </TouchableOpacity>
                              </View>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>{turn.text_en}</Text>
                              <Text style={{ fontSize: 11, color: theme.textSecondary, fontStyle: 'italic' }}>{turn.text_vi}</Text>
                            </View>);

                })}
                      </View> : null
              }
                  </View> : null
            }

                {/* SUBTAB 6: SÁNG TÁC TRUYỆN (STORY WEAVER) */}
                {aiSubTab === 'story' ?
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Sáng Tác Truyện Ngắn Chống Quên</Text>
                    <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>AI tạo truyện 1 phút từ các từ bạn cần ôn hôm nay.</Text>
                    <TouchableOpacity
                style={[styles.primaryActionBtn, { marginTop: 12, backgroundColor: '#a855f7' }]}
                onPress={handleAiStory}
                disabled={isAiLoading}>
                
                      {isAiLoading ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconSparkles size={16} color="#ffffff" />
                          <Text style={styles.primaryActionBtnText}>Sáng Tác Truyện Mới</Text>
                        </View>
                }
                    </TouchableOpacity>

                    {Boolean(aiStoryResult) ?
              <View style={{ marginTop: 16, gap: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.heroTitle, { color: theme.textPrimary, fontSize: 16 }]}>{aiStoryResult.title}</Text>
                          <TouchableOpacity onPress={() => playMobileAudio(aiStoryResult.story_en)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <IconVolume2 size={18} color={theme.accent} />
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.backMeaningEn, { color: theme.textSecondary, fontSize: 14, lineHeight: 20 }]}>
                          {aiStoryResult.story_en}
                        </Text>
                        <Text style={[styles.cardSectionLabel, { color: theme.textSecondary, marginTop: 6 }]}>Bản dịch song ngữ:</Text>
                        <Text style={[styles.backMeaningVi, { color: theme.accent, fontSize: 13, fontWeight: '500' }]}>
                          {aiStoryResult.story_vi}
                        </Text>
                      </View> : null
              }
                  </View> : null
            }
              </ScrollView> : null
          }

            {/* TAB 7: SETTINGS */}
            {currentTab === 'settings' ?
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent} />

            }>
            
                {/* THEME MODE SETTING CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Giao Diện Ứng Dụng (Theme Mode)</Text>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Tùy chọn chế độ hiển thị Dark Mode (Tối mờ) hoặc Light Mode (Sáng thanh lịch).
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                  style={[
                  styles.themeOptionBtn,
                  { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder },
                  !isDark && { borderColor: '#0284c7', backgroundColor: 'rgba(2, 132, 199, 0.12)' }]
                  }
                  onPress={() => setIsDark(false)}>
                  
                      <IconSun size={20} color={!isDark ? '#0284c7' : theme.textSecondary} />
                      <Text style={[styles.themeOptionText, { color: !isDark ? '#0284c7' : theme.textSecondary }]}>
                        Light Mode (Sáng)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                  style={[
                  styles.themeOptionBtn,
                  { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder },
                  isDark && { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)' }]
                  }
                  onPress={() => setIsDark(true)}>
                  
                      <IconMoon size={20} color={isDark ? '#38bdf8' : theme.textSecondary} />
                      <Text style={[styles.themeOptionText, { color: isDark ? '#38bdf8' : theme.textSecondary }]}>
                        Dark Mode (Tối)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* DAILY GOAL & TELEGRAM BOT SETTING CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IconBell size={18} color={theme.accent} />
                    <Text style={[styles.formTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Mục Tiêu & Bot Telegram Cảnh Báo</Text>
                  </View>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Đặt mục tiêu tối thiểu mỗi ngày. Bot Telegram sẽ tự động gửi tin nhắn nhắc nhở bảo vệ chuỗi Streak 🔥 nếu chưa hoàn thành trước giờ hẹn!
                  </Text>

                  {/* Daily Goal Chips */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>🎯 Mục tiêu số từ mỗi ngày:</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    {[5, 10, 15, 20].map((cnt) =>
                <TouchableOpacity
                  key={cnt}
                  onPress={() => setDailyGoal(cnt)}
                  style={[
                  styles.filterChip,
                  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: dailyGoal === cnt ? theme.btnPrimaryBg : theme.drawerCardBg, borderColor: theme.cardBorder }]
                  }>
                  
                        <Text style={{ fontWeight: '800', color: dailyGoal === cnt ? '#ffffff' : theme.textPrimary, fontSize: 13 }}>
                          {cnt} từ
                        </Text>
                      </TouchableOpacity>
                )}
                  </View>

                  {/* Reminder Time */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>⏰ Giờ nhắc nhở mỗi ngày:</Text>
                  <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 4 }]}
                placeholder="20:00"
                placeholderTextColor={theme.textMuted}
                value={reminderTime}
                onChangeText={setReminderTime} />
              

                  {/* Bot Token */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>🔑 Telegram Bot Token (@BotFather):</Text>
                  <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 4 }]}
                placeholder="123456789:ABCdef..."
                placeholderTextColor={theme.textMuted}
                value={botToken}
                onChangeText={setBotToken}
                secureTextEntry />
              

                  {/* Chat ID */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>💬 Telegram Chat ID (@userinfobot):</Text>
                  <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 4 }]}
                placeholder="VD: 987654321"
                placeholderTextColor={theme.textMuted}
                value={chatId}
                onChangeText={setChatId} />
              

                  {/* Toggle Notification */}
                  <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}
                onPress={() => setTelegramEnabled(!telegramEnabled)}>
                
                    <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: telegramEnabled ? theme.accent : theme.cardBorder,
                  backgroundColor: telegramEnabled ? theme.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                      {Boolean(telegramEnabled) ? <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>✓</Text> : null}
                    </View>
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 14 }}>
                      Bật thông báo tự động qua Telegram
                    </Text>
                  </TouchableOpacity>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, flex: 1 }]}
                  onPress={handleTestTelegram}
                  disabled={isTestingTelegram}>
                  
                      {isTestingTelegram ?
                  <ActivityIndicator size="small" color={theme.accent} /> :

                  <Text style={[styles.primaryActionBtnText, { color: theme.accent, fontSize: 13 }]}>🔔 Gửi Test Thử</Text>
                  }
                    </TouchableOpacity>

                    <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, flex: 1.2 }]}
                  onPress={handleSaveTelegram}
                  disabled={isSavingTelegram}>
                  
                      {isSavingTelegram ?
                  <ActivityIndicator size="small" color="#ffffff" /> :

                  <Text style={[styles.primaryActionBtnText, { fontSize: 13 }]}>Lưu Cài Đặt</Text>
                  }
                    </TouchableOpacity>
                  </View>
                </View>

                {/* HARDCORE ALARM QUESTION COUNT SETTING */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <IconAward size={18} color="#ef4444" />
                      <Text style={[styles.formTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Báo Thức Kỷ Luật Thép</Text>
                    </View>
                    <TouchableOpacity
                  onPress={handleToggleAutoAlarm}
                  disabled={alarmScheduleStatus === 'scheduling'}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: autoAlarmEnabled ? '#ef4444' : theme.drawerCardBg,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: autoAlarmEnabled ? '#ef4444' : theme.cardBorder
                  }}>
                  
                      <Text style={{ fontSize: 11, fontWeight: '800', color: autoAlarmEnabled ? '#ffffff' : theme.textSecondary }}>
                        {alarmScheduleStatus === 'scheduling' ? 'Đang cấp quyền...' : autoAlarmEnabled ? '✓ Đang Bật' : '✕ Đang Tắt'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Báo thức native vẫn kích hoạt khi app bị đóng. Khi mở LinguaVault, chuông chỉ dừng sau khi giải đúng đủ số câu Quiz.
                  </Text>
                  {alarmScheduleStatus === 'scheduled' ?
                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '700', marginTop: 6 }}>
                      ✓ Đã lên lịch native lúc {reminderTime || '20:00'} mỗi ngày
                    </Text> : null}

                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                    🎯 Số câu hỏi thử thách: <Text style={{ color: '#ef4444', fontWeight: '800' }}>{alarmQuestionCount} câu</Text>
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    {[3, 5, 10].map((cnt) =>
                <TouchableOpacity
                  key={cnt}
                  onPress={() => handleUpdateAlarmCount(cnt)}
                  style={[
                  styles.filterChip,
                  {
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alarmQuestionCount === cnt ? '#ef4444' : theme.drawerCardBg,
                    borderColor: alarmQuestionCount === cnt ? '#ef4444' : theme.cardBorder,
                    paddingVertical: 10
                  }]
                  }>
                  
                        <Text style={{ fontWeight: '800', color: alarmQuestionCount === cnt ? '#ffffff' : theme.textPrimary, fontSize: 13 }}>
                          {cnt} câu
                        </Text>
                      </TouchableOpacity>
                )}
                  </View>

                  {/* Test Alarm Ring Button */}
                  <TouchableOpacity
                onPress={() => startAlarmChallenge({ source: 'test' })}
                style={{
                  marginTop: 12,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderWidth: 1,
                  borderColor: '#ef4444',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6
                }}>
                
                    <IconVolume2 size={16} color="#ef4444" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#ef4444' }}>🔔 Thử quiz + chuông trong app</Text>
                  </TouchableOpacity>

                  {Platform.OS !== 'web' ?
                    <TouchableOpacity
                      onPress={handleTestNativeAlarm}
                      style={{
                        marginTop: 8,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: theme.drawerCardBg,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                        alignItems: 'center'
                      }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }}>
                        📱 Test khi đóng app (sau 10 giây)
                      </Text>
                    </TouchableOpacity> : null}
                </View>

                {/* AUDIO SPEED & ACCENT SETTINGS CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IconVolume2 size={18} color={theme.accent} />
                    <Text style={[styles.formTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Âm Thanh & Tốc Độ Phát Âm</Text>
                  </View>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Tùy chỉnh tốc độ đọc chi tiết phù hợp với trình độ nghe hiểu và luyện Shadowing.
                  </Text>

                  {/* Speed Presets */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                    ⚡ Tốc độ hiện tại: <Text style={{ color: theme.accent, fontWeight: '800' }}>{mobileSpeed.toFixed(2)}x</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    {[0.6, 0.75, 0.85, 1.0, 1.25].map((spd) =>
                <TouchableOpacity
                  key={spd}
                  onPress={() => handleUpdateMobileSpeed(spd)}
                  style={[
                  styles.filterChip,
                  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Math.abs(mobileSpeed - spd) < 0.01 ? theme.btnPrimaryBg : theme.drawerCardBg, borderColor: theme.cardBorder }]
                  }>
                  
                        <Text style={{ fontWeight: '800', color: Math.abs(mobileSpeed - spd) < 0.01 ? '#ffffff' : theme.textPrimary, fontSize: 12 }}>
                          {spd}x
                        </Text>
                      </TouchableOpacity>
                )}
                  </View>

                  {/* Accent Selector */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>🗣️ Chất giọng phát âm:</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                  onPress={() => handleUpdateMobileAccent('en-US')}
                  style={[
                  styles.filterChip,
                  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: mobileAccent === 'en-US' ? theme.accentPill : theme.drawerCardBg, borderColor: mobileAccent === 'en-US' ? theme.accent : theme.cardBorder }]
                  }>
                  
                      <Text style={{ fontWeight: '700', color: mobileAccent === 'en-US' ? theme.accent : theme.textPrimary, fontSize: 13 }}>
                        🇺🇸 Anh - Mỹ (US)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                  onPress={() => handleUpdateMobileAccent('en-GB')}
                  style={[
                  styles.filterChip,
                  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: mobileAccent === 'en-GB' ? theme.accentPill : theme.drawerCardBg, borderColor: mobileAccent === 'en-GB' ? theme.accent : theme.cardBorder }]
                  }>
                  
                      <Text style={{ fontWeight: '700', color: mobileAccent === 'en-GB' ? theme.accent : theme.textPrimary, fontSize: 13 }}>
                        🇬🇧 Anh - Anh (UK)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Test Playback */}
                  <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, marginTop: 14 }]}
                onPress={() => playMobileAudio('LinguaVault empowers you to master English pronunciation.', mobileSpeed, mobileAccent)}>
                
                    <Text style={[styles.primaryActionBtnText, { color: theme.accent, fontSize: 13 }]}>
                      🔊 Nghe Thử Tốc Độ Này ({mobileSpeed.toFixed(2)}x)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 2. GEMINI AI KEY SETTINGS (ĐỒNG BỘ 100% VỚI WEB) */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Google Gemini API Key (Miễn phí 0đ)</Text>
                    <TouchableOpacity
                  onPress={() => {
                    if (typeof window !== 'undefined') window.open('https://aistudio.google.com/app/apikey', '_blank');
                  }}>
                  
                      <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '700' }}>Lấy key ↗</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.formSubtitle, { color: theme.textSecondary, marginTop: 4 }]}>
                    Mở khóa toàn bộ tính năng AI nâng cao (Bóc tách ngữ pháp, Sửa bài viết, Viết truyện). Key được lưu an toàn 100% trên máy của bạn.
                  </Text>

                  {/* API Key Input */}
                  <TextInput
                style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 10 }]}
                placeholder="Dán AI Studio Key (AIzaSy...)"
                placeholderTextColor={theme.textMuted}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                secureTextEntry />
              

                  {/* AI Model Selection */}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginTop: 12, marginBottom: 6 }}>
                    🤖 Chọn Mô Hình AI (Google Model):
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[
                { id: 'gemini-3.5-flash', name: '🚀 Gemini 3.5 Flash', desc: 'Tối ưu phản hồi & Ổn định (Khuyên dùng)' },
                { id: 'gemini-flash-latest', name: '✨ Gemini Flash Latest', desc: 'Tự động luân chuyển bản mới' },
                { id: 'gemini-3.7-flash', name: '🧠 Gemini 3.7 Flash', desc: 'Suy luận sâu & Ngữ cảnh' },
                { id: 'gemini-3.6-flash', name: '⚡ Gemini 3.6 Flash', desc: 'Mới nhất, độ chi tiết cao' }].
                map((m) => {
                  const isSelected = selectedAiModel === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setSelectedAiModel(m.id)}
                      style={{
                        width: '48.8%',
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                        backgroundColor: isSelected ? isDark ? 'rgba(168, 85, 247, 0.25)' : '#f3e8ff' : theme.drawerCardBg,
                        borderWidth: 1.5,
                        borderColor: isSelected ? theme.accent : theme.cardBorder,
                        justifyContent: 'center'
                      }}>
                      
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12, fontWeight: isSelected ? '800' : '700', color: isSelected ? theme.accent : theme.textPrimary }}>
                              {m.name}
                            </Text>
                            {Boolean(isSelected) ?
                        <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '900' }}>✓</Text> : null
                        }
                          </View>
                          <Text style={{ fontSize: 10, color: isSelected ? theme.accent : theme.textMuted, marginTop: 2 }} numberOfLines={1}>
                            {m.desc}
                          </Text>
                        </TouchableOpacity>);

                })}
                  </View>

                  <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, marginTop: 14 }]}
                onPress={handleSaveApiKey}
                disabled={isSavingKey}>
                
                    {isSavingKey ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <Text style={styles.primaryActionBtnText}>Lưu Cấu Hình</Text>
                }
                  </TouchableOpacity>
                </View>

                {/* BACKUP & RESTORE CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.formTitle, { color: theme.textPrimary }]}>📦 Sao Lưu & Khôi Phục Dữ Liệu</Text>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Xuất file sao lưu JSON hoặc khôi phục đồng bộ dữ liệu giữa Web và Thiết bị Di động.
                  </Text>
                  
                  {/* Export Button */}
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, marginTop: 12 }]}
                    onPress={() => {
                      const url = mobileApi.exportDataUrl();
                      if (typeof window !== 'undefined' && window.document) {
                        const a = window.document.createElement('a');
                        a.href = url;
                        a.download = `lingua_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
                        window.document.body.appendChild(a);
                        a.click();
                        a.remove();
                        Alert.alert('Thành công 🎉', 'Đang tải file sao lưu JSON về máy!');
                      } else {
                        Alert.alert('Sao Lưu', `Mở liên kết sau để tải file: ${url}`);
                      }
                    }}>
                    <Text style={[styles.primaryActionBtnText, { color: theme.accent, fontSize: 13 }]}>
                      💾 Xuất File Sao Lưu JSON (Local DB)
                    </Text>
                  </TouchableOpacity>

                  {/* Import / Restore Button */}
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)', marginTop: 10 }]}
                    onPress={() => {
                      if (typeof window !== 'undefined' && window.document) {
                        const input = window.document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json,application/json';
                        input.onchange = async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const text = await file.text();
                            const json = JSON.parse(text);
                            const res = await mobileApi.importData(json);
                            if (res.success) {
                              Alert.alert('Khôi Phục Thành Công 🎉', res.message || 'Đã khôi phục dữ liệu!');
                              handleRefresh();
                            } else {
                              Alert.alert('Lỗi Khôi Phục', res.error || 'Dữ liệu sao lưu không hợp lệ.');
                            }
                          } catch (err) {
                            Alert.alert('Lỗi File', 'File JSON không hợp lệ: ' + err.message);
                          }
                        };
                        input.click();
                      } else {
                        Alert.alert('Khôi Phục', 'Bạn có thể tải file sao lưu trực tiếp trên Web hoặc ứng dụng để khôi phục.');
                      }
                    }}>
                    <Text style={[styles.primaryActionBtnText, { color: '#10b981', fontSize: 13 }]}>
                      📥 Khôi Phục Dữ Liệu Từ File JSON
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.cardSectionLabel, { color: theme.textSecondary }]}>HỆ THỐNG LINGUAVAULT LOCAL-FIRST</Text>
                  <Text style={[styles.mutedText, { color: theme.textMuted, marginTop: 6, lineHeight: 18 }]}>
                    • Server API: {serverUrlState} ({serverConnected ? 'Online 🟢' : 'Offline 🔴'}){'\n'}
                    • Database: SQLite (Native, 0đ Cloud){'\n'}
                    • Spaced Repetition: SuperMemo SM-2 Engine{'\n'}
                    • AI Assistant: Google Gemini 2.0 Free Tier (0đ)
                  </Text>
                </View>
              </ScrollView> : null
          }

            {/* TAB 8: QUICK ADD WORD (SYNCED 100% WITH WEB QUICK ADD MODAL) */}
            {currentTab === 'add' ?
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent} />

            }>
            
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginBottom: 16 }]}>
                  {/* Header Title */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                    <View style={{ marginTop: 2, backgroundColor: theme.accentPill, padding: 6, borderRadius: 10 }}>
                      <IconSparkles size={20} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.formTitle, { color: theme.textPrimary, marginBottom: 3, fontSize: 16, fontWeight: '800' }]}>
                        Thêm Nhanh Từ Vựng (1-Click Auto-Fill)
                      </Text>
                      <Text style={[styles.formSubtitle, { color: theme.textSecondary, fontSize: 11.5, lineHeight: 16 }]}>
                        Nhập từ tiếng Anh rồi bấm Auto-Fill để tự động điền TOÀN BỘ phiên âm, nghĩa tiếng Việt, collocations, audio và ví dụ.
                      </Text>
                    </View>
                  </View>

                  {/* Success Alert Banner */}
                  {quickAddSuccessMsg ?
              <View style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderColor: '#10b981',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                marginBottom: 2
              }}>
                      <IconCheck size={16} color="#10b981" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#10b981', flex: 1 }}>
                        {quickAddSuccessMsg}
                      </Text>
                    </View> :
              null}

                  {/* 1. English Word & 1-Click Auto-Fill */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 }]}>
                      Từ tiếng Anh (Word / Phrase) *
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.inputBg,
                    borderColor: theme.cardBorder,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    height: 44
                  }}>
                        <TextInput
                      style={{
                        flex: 1,
                        color: theme.textPrimary,
                        fontWeight: '800',
                        fontSize: 15,
                        paddingVertical: 0
                      }}
                      placeholder="Ví dụ: articulate, resilient..."
                      placeholderTextColor={theme.textMuted}
                      value={newWord}
                      onChangeText={(val) => {
                        setNewWord(val);
                        if (quickAddSuccessMsg) setQuickAddSuccessMsg('');
                      }} />
                    
                        {newWord.trim().length > 0 ?
                    <TouchableOpacity
                      onPress={() => playMobileAudio(newWord)}
                      style={{ padding: 4 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      title="Nghe phát âm chuẩn">
                      
                            <IconVolume2 size={18} color={theme.accent} />
                          </TouchableOpacity> : null
                    }
                      </View>

                      <TouchableOpacity
                    style={{
                      backgroundColor: theme.btnPrimaryBg,
                      height: 44,
                      paddingHorizontal: 14,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5
                    }}
                    onPress={() => handleAutoLookup()}
                    disabled={isLookingUp}>
                    
                        {isLookingUp ?
                    <ActivityIndicator size="small" color="#ffffff" /> :

                    <>
                            <IconSparkles size={14} color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12.5 }}>Auto-Fill</Text>
                          </>
                    }
                      </TouchableOpacity>
                    </View>

                    {/* Sample Quick Chips */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '600' }}>Thử từ mẫu:</Text>
                      {['resilient', 'articulate', 'pragmatic', 'streamline', 'meticulous'].map((sample) =>
                  <TouchableOpacity
                    key={sample}
                    onPress={() => handleAutoLookup(sample)}
                    style={{
                      backgroundColor: theme.drawerCardBg,
                      borderColor: theme.cardBorder,
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8
                    }}>
                    
                          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '600' }}>+{sample}</Text>
                        </TouchableOpacity>
                  )}
                    </View>
                  </View>

                  {/* 2. Phonetic IPA & Speaker Audio Preview */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 }]}>
                      Phiên âm (IPA) & Audio
                    </Text>
                    <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.inputBg,
                  borderColor: theme.cardBorder,
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 42
                }}>
                      <TextInput
                    style={{
                      flex: 1,
                      color: theme.textPrimary,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      paddingVertical: 0
                    }}
                    placeholder="/.../"
                    placeholderTextColor={theme.textMuted}
                    value={newPhonetic}
                    onChangeText={setNewPhonetic} />
                  
                      {newWord.trim().length > 0 ?
                  <TouchableOpacity
                    onPress={() => playMobileAudio(newWord)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}>
                    
                          <IconVolume2 size={16} color={theme.accent} />
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: theme.accent }}>Nghe Thử</Text>
                        </TouchableOpacity> : null
                  }
                    </View>
                  </View>

                  {/* 3. Part of Speech (Từ Loại) Selector */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 }]}>
                      Từ loại (Part of Speech) *
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                      {[
                  { id: 'noun', label: 'Danh từ (noun)' },
                  { id: 'verb', label: 'Động từ (verb)' },
                  { id: 'adjective', label: 'Tính từ (adj)' },
                  { id: 'adverb', label: 'Trạng từ (adv)' },
                  { id: 'phrase', label: 'Cụm từ (phrase)' },
                  { id: 'phrasal_verb', label: 'Phrasal Verb' },
                  { id: 'idiom', label: 'Thành ngữ (idiom)' }].
                  map((pos) => {
                    const isSelected = newPartOfSpeech === pos.id;
                    return (
                      <TouchableOpacity
                        key={pos.id}
                        onPress={() => setNewPartOfSpeech(pos.id)}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 10,
                          backgroundColor: isSelected ? theme.btnPrimaryBg : theme.innerCard,
                          borderWidth: 1,
                          borderColor: isSelected ? theme.btnPrimaryBg : theme.cardBorder
                        }}>
                        
                            <Text style={{ fontSize: 11.5, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#ffffff' : theme.textPrimary }}>
                              {pos.label}
                            </Text>
                          </TouchableOpacity>);

                  })}
                    </ScrollView>
                  </View>

                  {/* 4. CEFR Level Selector Chips */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 4 }]}>
                      Trình độ CEFR Level *
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => {
                    const isSelected = (newLevel || 'B2').toUpperCase() === lvl;
                    return (
                      <TouchableOpacity
                        key={lvl}
                        onPress={() => setNewLevel(lvl)}
                        style={{
                          flex: 1,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: isSelected ? theme.btnPrimaryBg : theme.innerCard,
                          borderWidth: 1,
                          borderColor: isSelected ? theme.btnPrimaryBg : theme.cardBorder,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                        
                            <Text style={{ fontSize: 12, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#ffffff' : theme.textPrimary }}>
                              {lvl}
                            </Text>
                          </TouchableOpacity>);

                  })}
                    </View>
                  </View>

                  {/* 5. Topic Selector Chips */}
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 0 }]}>
                        Chủ đề (Topic) *
                      </Text>
                      <TouchableOpacity onPress={() => setShowTopicManagerModal(true)}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>+ Quản lý chủ đề</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                      {topics.map((t) => {
                    const isSelected = newWordTopic === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setNewWordTopic(t.id)}
                        style={[
                        styles.filterChip,
                        {
                          backgroundColor: isSelected ? t.color || theme.accent : theme.drawerCardBg,
                          borderColor: isSelected ? t.color || theme.accent : theme.cardBorder
                        }]
                        }>
                        
                            <Text style={{ fontSize: 11.5, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#ffffff' : theme.textPrimary }}>
                              {t.emoji || '📁'} {t.name}
                            </Text>
                          </TouchableOpacity>);

                  })}
                    </ScrollView>
                  </View>

                  {/* 6. Meaning Vietnamese */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 12, fontWeight: '700' }]}>
                      Nghĩa tiếng Việt * (Tự động điền)
                    </Text>
                    <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, fontWeight: '800', fontSize: 14 }]}
                  placeholder="Nghĩa ngắn gọn, sát ngữ cảnh..."
                  placeholderTextColor={theme.textMuted}
                  value={newMeaningVi}
                  onChangeText={setNewMeaningVi} />
                
                  </View>

                  {/* 7. English Definition */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 12, fontWeight: '700' }]}>
                      Định nghĩa tiếng Anh (English Definition)
                    </Text>
                    <TextInput
                  style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, minHeight: 52, fontSize: 12.5, lineHeight: 18 }]}
                  placeholder="Định nghĩa bằng tiếng Anh..."
                  placeholderTextColor={theme.textMuted}
                  value={newMeaningEn}
                  onChangeText={setNewMeaningEn}
                  multiline />
                
                  </View>

                  {/* 8. Collocations / Cụm từ hay (Dynamic Array with Add/Delete) */}
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 0 }]}>
                        Collocations / Cụm từ hay
                      </Text>
                      <TouchableOpacity
                    onPress={() => setNewCollocations([...newCollocations, ''])}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    
                        <IconPlus size={12} color={theme.accent} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>+ Thêm cụm từ</Text>
                      </TouchableOpacity>
                    </View>
                    {newCollocations.map((col, idx) =>
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, flex: 1, fontSize: 12.5, height: 38 }]}
                    placeholder="Ví dụ: articulate speaker, stay resilient..."
                    placeholderTextColor={theme.textMuted}
                    value={col}
                    onChangeText={(val) => {
                      const updated = [...newCollocations];
                      updated[idx] = val;
                      setNewCollocations(updated);
                    }} />
                  
                        {newCollocations.length > 1 ?
                  <TouchableOpacity
                    onPress={() => setNewCollocations(newCollocations.filter((_, i) => i !== idx))}
                    style={{ padding: 6 }}>
                    
                            <IconTrash size={15} color="#ef4444" />
                          </TouchableOpacity> : null
                  }
                      </View>
                )}
                  </View>

                  {/* 9. Examples (Dynamic Array with Add/Delete/Audio Preview) */}
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 0 }]}>
                        Câu ví dụ thực tế
                      </Text>
                      <TouchableOpacity
                    onPress={() => setNewExamples([...newExamples, ''])}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    
                        <IconPlus size={12} color={theme.accent} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>+ Thêm câu ví dụ</Text>
                      </TouchableOpacity>
                    </View>
                    {newExamples.map((ex, idx) =>
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, flex: 1, fontSize: 12.5, minHeight: 44, lineHeight: 17 }]}
                    placeholder="Nhập câu ví dụ thực tế..."
                    placeholderTextColor={theme.textMuted}
                    value={ex}
                    onChangeText={(val) => {
                      const updated = [...newExamples];
                      updated[idx] = val;
                      setNewExamples(updated);
                    }}
                    multiline />
                  
                        {ex.trim().length > 0 ?
                  <TouchableOpacity
                    onPress={() => playMobileAudio(ex)}
                    style={{ padding: 6 }}
                    title="Nghe câu ví dụ">
                    
                            <IconVolume2 size={15} color={theme.accent} />
                          </TouchableOpacity> : null
                  }
                        {newExamples.length > 1 ?
                  <TouchableOpacity
                    onPress={() => setNewExamples(newExamples.filter((_, i) => i !== idx))}
                    style={{ padding: 6 }}>
                    
                            <IconTrash size={15} color="#ef4444" />
                          </TouchableOpacity> : null
                  }
                      </View>
                )}
                  </View>

                  {/* 10. Live Flashcard Preview Card (Synced with Web) */}
                  <View style={{ marginTop: 18, borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Xem Trước Thẻ (Live Preview)
                      </Text>
                      <TouchableOpacity
                    onPress={() => setQuickAddCardFlipped(!quickAddCardFlipped)}
                    style={{
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: theme.innerCard,
                      borderWidth: 1,
                      borderColor: theme.cardBorder,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4
                    }}>
                    
                        <IconEye size={12} color={theme.accent} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>
                          {quickAddCardFlipped ? 'Xem Mặt Trước' : 'Xem Mặt Sau'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Preview Flashcard Box */}
                    <View style={{
                  backgroundColor: theme.innerCard,
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: theme.cardBorder,
                  padding: 16,
                  minHeight: 160,
                  justifyContent: 'space-between'
                }}>
                      {!quickAddCardFlipped ? (
                  /* Front Preview */
                  <View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <View style={[styles.levelPill, { backgroundColor: theme.accentPill, paddingHorizontal: 8, paddingVertical: 2 }]}>
                              <Text style={[styles.levelPillText, { color: theme.accent, fontSize: 10, fontWeight: '800' }]}>
                                {newLevel || 'B2'}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 11, fontStyle: 'italic', color: theme.textMuted }}>
                              {newPartOfSpeech || 'noun'}
                            </Text>
                          </View>

                          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.textPrimary }}>
                              {newWord || 'Từ tiếng Anh'}
                            </Text>
                            <Text style={{ fontFamily: 'monospace', fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                              {newPhonetic || '/.../'}
                            </Text>
                          </View>
                        </View>) : (

                  /* Back Preview */
                  <View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary }}>
                              {newWord || 'Từ tiếng Anh'}
                            </Text>
                            <View style={[styles.levelPill, { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2 }]}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: '#10b981' }}>Mastery</Text>
                            </View>
                          </View>

                          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.accent, marginBottom: 4 }}>
                            {newMeaningVi || 'Nghĩa tiếng Việt sẽ hiển thị ở đây'}
                          </Text>

                          {newMeaningEn ?
                    <Text style={{ fontSize: 11.5, color: theme.textSecondary, marginBottom: 6, lineHeight: 16 }}>
                              {newMeaningEn}
                            </Text> :
                    null}

                          {newExamples[0] && newExamples[0].trim() ?
                    <View style={{ backgroundColor: theme.card, padding: 8, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: theme.accent, marginTop: 4 }}>
                              <Text style={{ fontSize: 11.5, fontStyle: 'italic', color: theme.textSecondary }}>
                                "{newExamples[0]}"
                              </Text>
                            </View> :
                    null}
                        </View>)
                  }

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderTopWidth: 1, borderTopColor: theme.cardBorder, paddingTop: 8, marginTop: 10 }}>
                        <IconRotateCw size={11} color={theme.textMuted} />
                        <Text style={{ fontSize: 10.5, color: theme.textMuted }}>
                          Thẻ sẽ xuất hiện như thế này khi bạn ôn tập SRS
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, marginTop: 18 }]}
                onPress={handleSaveWord}
                disabled={isSaving}>
                
                    {isSaving ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <IconCheck size={18} color="#ffffff" />
                        <Text style={styles.primaryActionBtnText}>Lưu Vào Kho Từ (+10 XP)</Text>
                      </View>
                }
                  </TouchableOpacity>
                </View>
              </ScrollView> : null
          }
          </Animated.View>
        }
      </View>

      {/* 3. PRO MAX BOTTOM TAB BAR */}
      <View style={[styles.bottomTabBar, { backgroundColor: theme.bottomBarBg, borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTo('home')}>
          
          <IconHome size={20} color={currentTab === 'home' ? theme.accent : theme.textMuted} />
          <Text style={[styles.tabLabel, { color: currentTab === 'home' ? theme.accent : theme.textMuted }]}>Trang Chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTo('vocab')}>
          
          <IconBookOpen size={20} color={currentTab === 'vocab' ? theme.accent : theme.textMuted} />
          <Text style={[styles.tabLabel, { color: currentTab === 'vocab' ? theme.accent : theme.textMuted }]}>Kho Từ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTo('review')}>
          
          <View style={{ position: 'relative' }}>
            <IconZap size={20} color={currentTab === 'review' ? theme.accent : theme.textMuted} />
            {totalDue > 0 ?
            <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{totalDue}</Text>
              </View> : null
            }
          </View>
          <Text style={[styles.tabLabel, { color: currentTab === 'review' ? theme.accent : theme.textMuted }]}>Ôn Tập</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTo('add')}>
          
          <IconPlus size={20} color={currentTab === 'add' ? theme.accent : theme.textMuted} />
          <Text style={[styles.tabLabel, { color: currentTab === 'add' ? theme.accent : theme.textMuted }]}>Thêm Từ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTo('ai-lab')}>
          
          <IconSparkles size={20} color={currentTab === 'ai-lab' ? theme.accent : theme.textMuted} />
          <Text style={[styles.tabLabel, { color: currentTab === 'ai-lab' ? theme.accent : theme.textMuted }]}>AI Lab</Text>
        </TouchableOpacity>
      </View>

      {/* 4. ULTRA-PREMIUM PRO MAX SIDE DRAWER (APPLE-STYLE NAVIGATION HUB) */}
      <Modal
        visible={isNavDrawerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNavDrawerOpen(false)}>{isNavDrawerOpen ? <>
        
        <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setIsNavDrawerOpen(false)}>
          
          <View style={[styles.drawerSidebar, { backgroundColor: theme.drawerBg, borderRightColor: theme.cardBorder }]} onStartShouldSetResponder={() => true}>
            {/* Drawer Header with User Rank Banner */}
            <View style={[styles.drawerHeaderBox, { borderBottomColor: theme.cardBorder }]}>
              <TouchableOpacity
                  style={styles.drawerUserInfo}
                  onPress={handleOpenProfileEdit}
                  activeOpacity={0.7}>
                
                <View style={[styles.drawerAvatar, { backgroundColor: theme.accentPill, borderColor: theme.accent, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 20 }}>{currentUser?.avatar_url || '🧑‍🎓'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerUserName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {currentUser?.full_name || currentUser?.username}
                  </Text>
                  <Text style={[styles.drawerUserRank, { color: theme.accent }]}>
                    @{currentUser?.username} • Cấp {gamificationProfile?.level || 1}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                  onPress={() => setIsNavDrawerOpen(false)}
                  style={[styles.drawerCloseCircle, { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder }]}>
                
                <IconX size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick Add Action Button (Matching Web Sidebar CTA) */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
              <TouchableOpacity
                  style={{
                    backgroundColor: theme.accent,
                    borderRadius: 12,
                    paddingVertical: 11,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    shadowColor: theme.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 3
                  }}
                  onPress={() => {
                    setIsNavDrawerOpen(false);
                    navigateTo('add');
                  }}
                  activeOpacity={0.85}>
                
                <IconPlus size={18} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13.5 }}>Thêm Nhanh (1-Click)</Text>
              </TouchableOpacity>
            </View>

            {/* Main Navigation List (Matching Web Sidebar 8 items 1:1) */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.drawerScrollArea}>
              <Text style={[styles.drawerSectionTitle, { color: theme.textMuted, marginTop: 8, marginBottom: 8 }]}>ĐIỀU HƯỚNG CHÍNH</Text>

              {/* 1. Dashboard */}
              <TouchableOpacity
                  style={[styles.drawerItem, currentTab === 'home' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                  onPress={() => navigateTo('home')}>
                
                <View style={[styles.drawerItemIconBox, { backgroundColor: currentTab === 'home' ? theme.accentPill : theme.drawerCardBg }]}>
                  <IconHome size={18} color={currentTab === 'home' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemTitle, { color: currentTab === 'home' ? theme.accent : theme.textPrimary }]}>
                    Dashboard
                  </Text>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Tổng quan & tiến độ</Text>
                </View>
              </TouchableOpacity>

              {/* 2. Kho Từ Vựng */}
              <TouchableOpacity
                  style={[styles.drawerItem, currentTab === 'vocab' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                  onPress={() => navigateTo('vocab')}>
                
                <View style={[styles.drawerItemIconBox, { backgroundColor: currentTab === 'vocab' ? theme.accentPill : theme.drawerCardBg }]}>
                  <IconBookOpen size={18} color={currentTab === 'vocab' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'vocab' ? theme.accent : theme.textPrimary }]}>
                      Kho Từ Vựng
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }]}>
                      <Text style={[styles.levelPillText, { color: theme.textSecondary }]}>{totalCount}</Text>
                    </View>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Từ vựng & Collocations</Text>
                </View>
              </TouchableOpacity>

              {/* 3. Mẫu Câu & Cấu Trúc */}
              <TouchableOpacity
                  style={[styles.drawerItem, currentTab === 'patterns' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                  onPress={() => navigateTo('patterns')}>
                
                <View style={[styles.drawerItemIconBox, { backgroundColor: currentTab === 'patterns' ? theme.accentPill : theme.drawerCardBg }]}>
                  <IconLayers size={18} color={currentTab === 'patterns' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'patterns' ? theme.accent : theme.textPrimary }]}>
                      Mẫu Câu & Cấu Trúc
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }]}>
                      <Text style={[styles.levelPillText, { color: theme.textSecondary }]}>{patterns.length}</Text>
                    </View>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Phân loại theo chức năng</Text>
                </View>
              </TouchableOpacity>

              {/* 4. Quiz Theo Topic */}
              <TouchableOpacity
                  style={[styles.drawerItem, currentTab === 'quiz' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                  onPress={() => navigateTo('quiz')}>
                
                <View style={[styles.drawerItemIconBox, { backgroundColor: currentTab === 'quiz' ? theme.accentPill : theme.drawerCardBg }]}>
                  <IconTarget size={18} color={currentTab === 'quiz' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'quiz' ? theme.accent : theme.textPrimary }]}>
                      Quiz Theo Topic
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <Text style={[styles.levelPillText, { color: '#10b981' }]}>MỚI</Text>
                    </View>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Trắc nghiệm & điền từ</Text>
                </View>
              </TouchableOpacity>

              {/* 5. AI Speaking Lab */}
              <TouchableOpacity
                  style={[styles.drawerItem, currentTab === 'speaking' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                  onPress={() => navigateTo('speaking')}>
                
                <View style={[styles.drawerItemIconBox, { backgroundColor: currentTab === 'speaking' ? theme.accentPill : theme.drawerCardBg }]}>
                  <IconMic size={18} color={currentTab === 'speaking' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'speaking' ? theme.accent : theme.textPrimary }]}>
                      AI Speaking Lab
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: 'rgba(2, 132, 199, 0.2)' }]}>
                      <Text style={[styles.levelPillText, { color: theme.accent }]}>AI</Text>
                    </View>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Luyện nói & chấm điểm</Text>
                </View>
              </TouchableOpacity>

              {/* 6. Ghi Chú & Bài Đọc */}
              <TouchableOpacity
                  style={[styles.drawerItem, currentTab === 'reader' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                  onPress={() => navigateTo('reader')}>
                
                <View style={[styles.drawerItemIconBox, { backgroundColor: currentTab === 'reader' ? theme.accentPill : theme.drawerCardBg }]}>
                  <IconFileText size={18} color={currentTab === 'reader' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'reader' ? theme.accent : theme.textPrimary }]}>
                      Ghi Chú & Bài Đọc
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }]}>
                      <Text style={[styles.levelPillText, { color: theme.textSecondary }]}>{notes.length}</Text>
                    </View>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Đọc báo & lưu bài học</Text>
                </View>
              </TouchableOpacity>

              {/* 7. Ôn Tập SRS */}
              <TouchableOpacity
                  style={[styles.drawerItem, currentTab === 'review' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                  onPress={() => navigateTo('review')}>
                
                <View style={[styles.drawerItemIconBox, { backgroundColor: currentTab === 'review' ? theme.accentPill : theme.drawerCardBg }]}>
                  <IconZap size={18} color={currentTab === 'review' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'review' ? theme.accent : theme.textPrimary }]}>
                      Ôn Tập SRS
                    </Text>
                    {totalDue > 0 ?
                      <View style={[styles.levelPill, { backgroundColor: '#ef4444' }]}>
                        <Text style={[styles.levelPillText, { color: '#ffffff' }]}>{totalDue}</Text>
                      </View> : null
                      }
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Flashcard chống quên (SM-2)</Text>
                </View>
              </TouchableOpacity>

              {/* 8. AI English Lab */}
              <TouchableOpacity
                  style={[styles.drawerItem, currentTab === 'ai-lab' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                  onPress={() => navigateTo('ai-lab')}>
                
                <View style={[styles.drawerItemIconBox, { backgroundColor: currentTab === 'ai-lab' ? theme.accentPill : theme.drawerCardBg }]}>
                  <IconSparkles size={18} color={currentTab === 'ai-lab' ? theme.accent : '#a855f7'} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'ai-lab' ? theme.accent : theme.textPrimary }]}>
                      AI English Lab
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                      <Text style={[styles.levelPillText, { color: '#a855f7' }]}>AI ⚡</Text>
                    </View>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Bóc tách & chấm sửa câu</Text>
                </View>
              </TouchableOpacity>

              {/* Settings Nav Item */}
              <TouchableOpacity
                  style={[styles.drawerItem, currentTab === 'settings' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }, { marginTop: 4 }]}
                  onPress={() => navigateTo('settings')}>
                
                <View style={[styles.drawerItemIconBox, { backgroundColor: currentTab === 'settings' ? theme.accentPill : theme.drawerCardBg }]}>
                  <IconSettings size={18} color={currentTab === 'settings' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemTitle, { color: currentTab === 'settings' ? theme.accent : theme.textPrimary }]}>
                    Cài Đặt & Hệ Thống
                  </Text>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Telegram, AI Key & Báo Thức</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Compact Footer: Streak Pill + Quick Utility Tools */}
            <View style={{ borderTopWidth: 1, borderTopColor: theme.cardBorder, padding: 14, gap: 10 }}>
              {/* Daily Streak Pill */}
              <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: theme.drawerCardBg,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.cardBorder
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <IconFlame size={16} color="#f59e0b" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>Daily Streak</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#f59e0b' }}>{streak} ngày 🔥</Text>
              </View>

              {/* 3 Sleek Action Capsule Buttons */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Theme Toggle */}
                <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: theme.drawerCardBg,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: theme.cardBorder
                    }}
                    onPress={toggleTheme}>
                  
                  {isDark ? <IconSun size={14} color="#f59e0b" /> : <IconMoon size={14} color="#0284c7" />}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>
                    {isDark ? 'Sáng' : 'Tối'}
                  </Text>
                </TouchableOpacity>

                {/* Audio Speed */}
                <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: theme.drawerCardBg,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: theme.cardBorder
                    }}
                    onPress={() => {
                      setIsNavDrawerOpen(false);
                      setShowAudioSpeedModal(true);
                    }}>
                  
                  <IconVolume2 size={14} color={theme.accent} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>
                    {mobileSpeed.toFixed(1)}x
                  </Text>
                </TouchableOpacity>

                {/* Logout */}
                <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: 'rgba(239, 68, 68, 0.25)'
                    }}
                    onPress={handleMobileLogout}>
                  
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#ef4444' }}>Đăng xuất</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </> : null}</Modal>

      {/* SERVER URL CONFIGURATION MODAL */}
      <Modal
        visible={showServerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}>{showServerModal ? <>
        
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: theme.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: theme.cardBorder }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary }}>⚙️ Kết Nối Máy Chủ API</Text>
              <TouchableOpacity onPress={() => setShowServerModal(false)}>
                <IconX size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 14, lineHeight: 19 }}>
              Nhập địa chỉ IP máy tính đang chạy Server hoặc đường dẫn Cloud/ngrok để điện thoại kết nối và đồng bộ dữ liệu:
            </Text>

            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent, marginBottom: 6, letterSpacing: 0.5 }}>
              ĐỊA CHỈ SERVER (PORT 5001):
            </Text>
            <TextInput
                style={{
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 12
                }}
                placeholder={API_ENDPOINT}
                placeholderTextColor={theme.textMuted}
                value={serverUrlState}
                onChangeText={setServerUrlState}
                autoCapitalize="none"
                autoCorrect={false} />
            

            {/* Quick Suggestion IP Chips */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, marginBottom: 6 }}>
              GỢI Ý NHANH:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[API_ENDPOINT, 'http://localhost:5001', 'http://127.0.0.1:5001'].map((ip) =>
                <TouchableOpacity
                  key={ip}
                  onPress={() => setServerUrlState(ip)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: theme.drawerCardBg,
                    borderWidth: 1,
                    borderColor: serverUrlState === ip ? theme.accent : theme.cardBorder
                  }}>
                
                  <Text style={{ fontSize: 11, color: serverUrlState === ip ? theme.accent : theme.textSecondary, fontWeight: '600' }}>
                    {ip}
                  </Text>
                </TouchableOpacity>
                )}
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                  onPress={() => setShowServerModal(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: theme.drawerCardBg,
                    borderWidth: 1,
                    borderColor: theme.cardBorder
                  }}>
                
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                  onPress={handleSaveServerUrl}
                  disabled={isTestingServer}
                  style={{
                    flex: 2,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: theme.accent,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6
                  }}>
                
                {isTestingServer ?
                  <ActivityIndicator size="small" color="#ffffff" /> :

                  <IconCheck size={16} color="#ffffff" />
                  }
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>
                  {isTestingServer ? 'Đang Kiểm Tra...' : 'Lưu & Kết Nối'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </> : null}</Modal>

      {/* MOBILE PROFILE EDIT MODAL */}
      <Modal
        visible={isProfileEditModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsProfileEditModalOpen(false)}>{isProfileEditModalOpen ? <>
        
        <View style={{ flex: 1, backgroundColor: 'rgba(5, 10, 20, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: theme.cardBorder }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: theme.textPrimary }}>👤 Hồ Sơ Cá Nhân</Text>
              <TouchableOpacity onPress={() => setIsProfileEditModalOpen(false)}>
                <IconX size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {editError ?
              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 12 }}>
                <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>⚠️ {editError}</Text>
              </View> :
              null}

            {/* Avatar Selection */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>
              AVATAR ĐẠI DIỆN
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, backgroundColor: theme.inputBg, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 10 }}>
              {['🧑‍🎓', '👑', '🚀', '⚡', '💡', '🦁', '🦊', '🦉', '🌟', '🎯', '💻', '🎨'].map((emoji) =>
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setEditAvatar(emoji)}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: editAvatar === emoji ? theme.accentPill : 'transparent',
                    borderWidth: 1,
                    borderColor: editAvatar === emoji ? theme.accent : 'transparent'
                  }}>
                
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                </TouchableOpacity>
                )}
            </View>

            {/* Full Name Input */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, marginBottom: 4 }}>
              HỌ VÀ TÊN
            </Text>
            <TextInput
                style={{
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  borderRadius: 12,
                  padding: 10,
                  fontSize: 14,
                  marginBottom: 10
                }}
                value={editFullName}
                onChangeText={setEditFullName} />
            

            {/* Password Change Inputs */}
            <View style={{ backgroundColor: theme.inputBg, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent, marginBottom: 6 }}>
                🔑 ĐỔI MẬT KHẨU (TÙY CHỌN)
              </Text>
              <TextInput
                  style={{
                    backgroundColor: theme.card,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    borderRadius: 8,
                    padding: 8,
                    fontSize: 13,
                    marginBottom: 6
                  }}
                  placeholder="Mật khẩu hiện tại..."
                  placeholderTextColor={theme.textMuted}
                  value={editCurrentPassword}
                  onChangeText={setEditCurrentPassword}
                  secureTextEntry={true} />
              
              <TextInput
                  style={{
                    backgroundColor: theme.card,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    borderRadius: 8,
                    padding: 8,
                    fontSize: 13
                  }}
                  placeholder="Mật khẩu mới (tối thiểu 4 ký tự)..."
                  placeholderTextColor={theme.textMuted}
                  value={editNewPassword}
                  onChangeText={setEditNewPassword}
                  secureTextEntry={true} />
              
            </View>

            {/* Save Button */}
            <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={editLoading}
                style={{
                  backgroundColor: theme.btnPrimaryBg,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center'
                }}>
              
              {editLoading ?
                <ActivityIndicator size="small" color="#ffffff" /> :

                <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>Lưu Thay Đổi</Text>
                }
            </TouchableOpacity>

            {/* Direct Logout Button */}
            <TouchableOpacity
                onPress={() => {
                  setIsProfileEditModalOpen(false);
                  handleMobileLogout();
                }}
                style={{
                  marginTop: 8,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.3)'
                }}>
              
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#ef4444' }}>🚪 Đăng Xuất Tài Khoản</Text>
            </TouchableOpacity>
          </View>
        </View>
      </> : null}</Modal>

      {/* HARDCORE ALARM CHALLENGE MODAL ON MOBILE */}
      {showAlarmModal ?
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => startMobileAlarmLoop()}><>
        
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.card, borderRadius: 24, padding: 22, borderWidth: 2, borderColor: '#ef4444' }}>
            {/* Urgent Red Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconFlame size={20} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#ef4444' }}>🚨 BÁO THỨC KỶ LUẬT THÉP</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Bắt buộc giải đúng {alarmQuestions.length} câu Quiz để tắt chuông!</Text>
                </View>
              </View>

              {/* Strict No-Snooze Badge */}
              <View style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#ef4444'
                }}>
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#fef08a' }}>🔒 CẤM HOÃN</Text>
              </View>
            </View>

            {!alarmCompleted ?
              alarmQuestions.length > 0 && alarmQuestions[alarmIndex] ?
              <View style={{ gap: 12 }}>
                  {/* Progress Indicator */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444' }}>
                      CÂU HỎI {alarmIndex + 1} / {alarmQuestions.length}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {alarmQuestions.map((_, i) =>
                    <View
                      key={i}
                      style={{
                        width: 24,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: i < alarmIndex ? '#10b981' : i === alarmIndex ? '#ef4444' : theme.cardBorder
                      }} />

                    )}
                    </View>
                  </View>

                  {/* Word Card */}
                  <View style={{ backgroundColor: theme.drawerCardBg, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent, letterSpacing: 1 }}>TỪ VỰNG CẦN GIẢI MÃ</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: theme.textPrimary, marginVertical: 4 }}>
                      {alarmQuestions[alarmIndex].word.toUpperCase()}
                    </Text>
                  </View>

                  {/* Options */}
                  <View style={{ gap: 8 }}>
                    {alarmQuestions[alarmIndex].options.map((opt, idx) => {
                    const isSelected = alarmSelectedOpt === opt;
                    const isWrong = alarmWrongOpts.includes(opt);
                    const isRight = isSelected && opt === alarmQuestions[alarmIndex].correct;

                    let bg = theme.drawerCardBg;
                    let border = theme.cardBorder;
                    let textColor = theme.textPrimary;

                    if (isRight) {
                      bg = 'rgba(16, 185, 129, 0.2)';
                      border = '#10b981';
                      textColor = '#10b981';
                    } else if (isWrong) {
                      bg = 'rgba(239, 68, 68, 0.15)';
                      border = '#ef4444';
                      textColor = '#ef4444';
                    }

                    return (
                      <TouchableOpacity
                        key={idx}
                        disabled={alarmAnswered || isWrong}
                        onPress={() => {
                          if (alarmAnswered || isWrong) return;

                          const isCorrect = opt.trim().toLowerCase() === alarmQuestions[alarmIndex].correct.trim().toLowerCase();

                          if (isCorrect) {
                            setAlarmSelectedOpt(opt);
                            setAlarmAnswered(true);
                            playSingleAlarmBeep(1046.5, 0.15, 'sine');
                            setTimeout(() => {
                              if (alarmIndex + 1 < alarmQuestions.length) {
                                setAlarmIndex((prev) => prev + 1);
                                setAlarmAnswered(false);
                                setAlarmSelectedOpt(null);
                                setAlarmWrongOpts([]);
                              } else {
                                playCelebratoryVictory();
                                setAlarmCompleted(true);
                              }
                            }, 500);
                          } else {
                            playSingleAlarmBeep(220, 0.25, 'sawtooth');
                            setAlarmWrongOpts((prev) => [...prev, opt]);
                            setAlarmSelectedOpt(opt);
                            setAlarmAnswered(true);
                            setTimeout(() => {
                              setAlarmSelectedOpt(null);
                              setAlarmAnswered(false);
                            }, 500);
                          }
                        }}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          backgroundColor: bg,
                          borderWidth: 1.5,
                          borderColor: border,
                          opacity: isWrong ? 0.6 : 1
                        }}>
                      
                          <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>{opt}</Text>
                        </TouchableOpacity>);

                  })}
                  </View>
                </View> :
              null : (

              /* Success Screen */
              <View style={{ alignItems: 'center', paddingVertical: 10, gap: 12 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCheck size={32} color="#10b981" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, textAlign: 'center' }}>
                  🎉 CHÚC MỪNG BẠN ĐÃ GIẢI MÃ THÀNH CÔNG!
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', lineHeight: 17 }}>
                  Chuông báo thức đã được tắt. Chuỗi Streak 🔥 của bạn đã an toàn!
                </Text>
                <TouchableOpacity
                  onPress={handleCompleteAlarm}
                  style={{
                    width: '100%',
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: '#10b981',
                    alignItems: 'center',
                    marginTop: 6
                  }}>
                
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>✅ Tắt Báo Thức & Hoàn Thành (+30 XP)</Text>
                </TouchableOpacity>
              </View>)
              }
          </View>
        </View>
      </></Modal> : null}

      {/* 9. AI VOCABULARY MASTERY ASSESSMENT REPORT MODAL */}
      <Modal
        visible={showAIMasteryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAIMasteryModal(false)}>{showAIMasteryModal ? <>
        
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '88%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconSparkles size={18} color={theme.accent} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>Báo Cáo Đánh Giá AI</Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>Khảo thí CEFR & Trí nhớ SM-2</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                    onPress={fetchMobileAIMasteryReport}
                    disabled={isLoadingAIMastery}
                    style={{ padding: 6 }}>
                  
                  <IconRefresh size={16} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowAIMasteryModal(false)}
                    style={{ padding: 6 }}>
                  
                  <IconClose size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {isLoadingAIMastery ?
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center' }}>
                  Giám khảo AI đang phân tích toàn bộ kho từ vựng và chu kỳ trí nhớ của bạn...
                </Text>
              </View> :

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {/* 1. Score & Estimated CEFR Level */}
                <View style={{
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1.5,
                  borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : 'rgba(2, 132, 199, 0.2)',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>
                      TRÌNH ĐỘ CEFR ƯỚC TÍNH
                    </Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary, marginVertical: 2 }}>
                      {aiMasteryReport?.aiAssessment?.estimatedCefrLevel || 'B2 Upper-Intermediate'}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                      Đạt {totalCount} từ • Lv.{gamificationProfile?.level || 1} ({gamificationProfile?.title || 'Novice Scholar'})
                    </Text>
                  </View>

                  <View style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: theme.card,
                    borderWidth: 2.5,
                    borderColor: theme.accent,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: theme.accent }}>
                      {aiMasteryReport?.aiAssessment?.overallScore || 80}
                    </Text>
                    <Text style={{ fontSize: 8, fontWeight: '700', color: theme.textMuted }}>ĐIỂM AI</Text>
                  </View>
                </View>

                {/* 2. 3-Tier SM-2 Memory Matrix */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#10b981' }}>💎 MASTERED</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginTop: 2 }}>
                      {aiMasteryReport?.metrics?.masteredCount ?? masteredCount} từ
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.textMuted }}>Thuộc sâu</Text>
                  </View>

                  <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#38bdf8' }}>🌿 FAMILIAR</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginTop: 2 }}>
                      {aiMasteryReport?.metrics?.familiarCount ?? Math.max(0, totalCount - masteredCount)} từ
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.textMuted }}>Đang nhớ</Text>
                  </View>

                  <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#f59e0b' }}>🌱 LEARNING</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginTop: 2 }}>
                      {aiMasteryReport?.metrics?.learningCount ?? 0} từ
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.textMuted }}>Cần ôn</Text>
                  </View>
                </View>

                {/* 3. Qualitative AI Summary */}
                <View style={{ backgroundColor: theme.drawerCardBg, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder, gap: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>
                    📝 NHẬN XÉT CỦA GIÁM KHẢO AI:
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18, fontStyle: 'italic' }}>
                    "{aiMasteryReport?.aiAssessment?.evaluationSummary || `Vốn từ vựng của bạn đang phát triển vững chắc với ${totalCount} từ. Nền tảng CEFR B2 đầy tiềm năng!`}"
                  </Text>
                </View>

                {/* 4. Strengths & Action Plan */}
                {Boolean(aiMasteryReport?.aiAssessment?.actionPlan) ?
                <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.08)' : 'rgba(2, 132, 199, 0.05)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)', gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent }}>
                      🚀 LỘ TRÌNH 3 BƯỚC TIẾP THEO:
                    </Text>
                    {aiMasteryReport.aiAssessment.actionPlan.map((step, idx) =>
                  <Text key={idx} style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 16 }}>
                        <Text style={{ fontWeight: '700', color: theme.textPrimary }}>{idx + 1}. </Text>
                        {step}
                      </Text>
                  )}
                  </View> : null
                }

                <TouchableOpacity
                  onPress={() => setShowAIMasteryModal(false)}
                  style={{ backgroundColor: theme.accent, paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 4 }}>
                
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Đóng Báo Cáo</Text>
                </TouchableOpacity>
              </ScrollView>
              }
          </View>
        </View>
      </> : null}</Modal>

      {/* 10. LEVEL PROGRESSION LADDER MODAL */}
      <Modal
        visible={showLevelLadderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLevelLadderModal(false)}>{showLevelLadderModal ? <>
        
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '85%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconAward size={18} color={theme.accent} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>Bậc Thang Cấp Độ Học Thuật</Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>Hệ thống Gamification & Danh hiệu</Text>
                </View>
              </View>

              <TouchableOpacity
                  onPress={() => setShowLevelLadderModal(false)}
                  style={{ padding: 6 }}>
                
                <IconClose size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Current Highlight */}
            <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.08)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : 'rgba(2, 132, 199, 0.2)', marginBottom: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent }}>CẤP ĐỘ HIỆN TẠI</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginVertical: 2 }}>
                Level {gamificationProfile?.level || 1}: {gamificationProfile?.title || 'Novice Scholar 🌱'}
              </Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                Tổng tích lũy: <Text style={{ fontWeight: '800', color: theme.textPrimary }}>{gamificationProfile?.totalXp || 0} XP</Text> • Tiến độ: <Text style={{ fontWeight: '800', color: theme.accent }}>{gamificationProfile?.progressPercent || 0}%</Text>
              </Text>
            </View>

            {/* Ladder list */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {MOBILE_LEVEL_LADDER.map((item) => {
                  const isCurrent = item.level === (gamificationProfile?.level || 1);
                  const isUnlocked = (gamificationProfile?.totalXp || 0) >= item.minXp;

                  return (
                    <View
                      key={item.level}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        borderRadius: 12,
                        backgroundColor: isCurrent ? isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)' : theme.drawerCardBg,
                        borderWidth: isCurrent ? 1.5 : 1,
                        borderColor: isCurrent ? theme.accent : theme.cardBorder,
                        opacity: isUnlocked ? 1 : 0.6
                      }}>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isCurrent ? theme.accent : isUnlocked ? theme.inputBg : theme.drawerCardBg, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: isCurrent ? '#ffffff' : isUnlocked ? theme.accent : theme.textMuted }}>
                          {item.level}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
                          {item.title} {isCurrent ? '⭐' : ''}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textSecondary }} numberOfLines={1}>
                          {item.perk}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 11, fontWeight: '700', color: isUnlocked ? theme.textPrimary : theme.textMuted, marginLeft: 8 }}>
                      {item.minXp} XP
                    </Text>
                  </View>);

                })}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                    onPress={() => {
                      setShowLevelLadderModal(false);
                      fetchMobileAIMasteryReport();
                      setShowAIMasteryModal(true);
                    }}
                    style={{ flex: 1, backgroundColor: 'rgba(99, 102, 241, 0.12)', borderWidth: 1, borderColor: '#6366f1', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}>
                  
                  <Text style={{ color: '#6366f1', fontWeight: '800', fontSize: 13 }}>📊 Báo Cáo AI ↗</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setShowLevelLadderModal(false)}
                    style={{ flex: 1, backgroundColor: theme.accent, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}>
                  
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </> : null}</Modal>

      {/* 11. WORD DETAILS MODAL */}
      <Modal
        visible={!!selectedWordDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedWordDetail(null)}>{!!selectedWordDetail ? <>
        
        {selectedWordDetail ?
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '88%' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: theme.textPrimary }}>
                      {selectedWordDetail.word}
                    </Text>
                    <TouchableOpacity onPress={() => playMobileAudio(selectedWordDetail.word, mobileSpeed, mobileAccent)}>
                      <IconVolume2 size={20} color={theme.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                    onPress={() => setShowAudioSpeedModal(true)}
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
                      borderWidth: 1,
                      borderColor: theme.accent
                    }}>
                    
                      <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent }}>
                        ⚡ {mobileSpeed.toFixed(2)}x
                      </Text>
                    </TouchableOpacity>
                    <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                      <Text style={[styles.levelPillText, { color: theme.accent }]}>{selectedWordDetail.level || 'B2'}</Text>
                    </View>

                    {/* Topic Badge */}
                    {(() => {
                    const topic = topics.find((t) => t.id === selectedWordDetail.topic_id) || { name: 'Giao tiếp Hàng ngày', emoji: '☕', color: '#10b981' };
                    return (
                      <View style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 8,
                        backgroundColor: `${topic.color || '#0284c7'}18`,
                        borderWidth: 1,
                        borderColor: `${topic.color || '#0284c7'}30`,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3
                      }}>
                          <Text style={{ fontSize: 10 }}>{topic.emoji || '📁'}</Text>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: topic.color || '#0284c7' }}>
                            {topic.name}
                          </Text>
                        </View>);

                  })()}
                  </View>

                  <TouchableOpacity onPress={() => setSelectedWordDetail(null)} style={{ padding: 6 }}>
                    <IconClose size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {Boolean(selectedWordDetail.phonetic) ?
                <Text style={{ fontSize: 14, color: theme.textMuted, fontStyle: 'italic' }}>
                      {selectedWordDetail.phonetic} {selectedWordDetail.part_of_speech ? `• (${selectedWordDetail.part_of_speech})` : ''}
                    </Text> : null
                }

                  <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.08)', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: isDark ? 'rgba(2, 132, 199, 0.25)' : 'rgba(2, 132, 199, 0.15)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>NGHĨA TIẾNG VIỆT</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginTop: 2 }}>
                      {selectedWordDetail.meaning_vi}
                    </Text>
                    {selectedWordDetail.meaning_en ?
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                        {selectedWordDetail.meaning_en}
                      </Text> :
                  null}
                  </View>

                  {/* Collocations */}
                  {selectedWordDetail.collocations && selectedWordDetail.collocations.length > 0 ?
                <View style={{ backgroundColor: theme.drawerCardBg, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#a855f7', textTransform: 'uppercase', marginBottom: 6 }}>
                        ✨ CỤM TỪ ĐI KÈM (COLLOCATIONS)
                      </Text>
                      {selectedWordDetail.collocations.map((col, idx) =>
                  <Text key={idx} style={{ fontSize: 13, color: theme.textPrimary, marginVertical: 2 }}>
                          • <Text style={{ fontWeight: '700' }}>{typeof col === 'string' ? col : col.phrase}</Text> {typeof col === 'object' && col.meaning ? `— ${col.meaning}` : ''}
                        </Text>
                  )}
                    </View> : null
                }

                  {/* Examples */}
                  {selectedWordDetail.examples && selectedWordDetail.examples.length > 0 ?
                <View style={{ backgroundColor: theme.drawerCardBg, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent, textTransform: 'uppercase', marginBottom: 6 }}>
                        💬 CÂU VÍ DỤ THỰC TẾ
                      </Text>
                      {selectedWordDetail.examples.map((ex, idx) =>
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginVertical: 3 }}>
                          <TouchableOpacity onPress={() => playMobileAudio(ex)} style={{ marginTop: 2 }}>
                            <IconVolume2 size={14} color={theme.accent} />
                          </TouchableOpacity>
                          <Text style={{ fontSize: 13, color: theme.textPrimary, flex: 1, lineHeight: 18 }}>
                            "{ex}"
                          </Text>
                        </View>
                  )}
                    </View> : null
                }

                  {/* SM-2 Retention Metrics */}
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 9, color: theme.textMuted }}>KHOẢNG CÁCH</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: theme.accent }}>{selectedWordDetail.interval || 0} ngày</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 9, color: theme.textMuted }}>LẦN LẶP</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#10b981' }}>{selectedWordDetail.repetitions || 0}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 9, color: theme.textMuted }}>ĐỘ DỄ (EF)</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#f59e0b' }}>{selectedWordDetail.ease_factor || 2.5}</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                    onPress={() => {
                      setEditingWordData({ ...selectedWordDetail });
                      setSelectedWordDetail(null);
                    }}
                    style={{ flex: 1, backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}>
                    
                      <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 13 }}>✏️ Chỉnh Sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={() => {
                      const targetId = selectedWordDetail.id;
                      const targetWord = selectedWordDetail.word;
                      setSelectedWordDetail(null);
                      handleDeleteWord(targetId, targetWord);
                    }}
                    style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#ef4444', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}>
                    
                      <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>🗑️ Xóa Từ</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
          </View>
        </View> :
          null}
      </> : null}</Modal>

      {/* 12. EDIT WORD MODAL */}
      <Modal
        visible={!!editingWordData}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingWordData(null)}>{!!editingWordData ? <>
        
        {editingWordData ?
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '88%' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                    ✏️ Chỉnh Sửa: {editingWordData.word}
                  </Text>
                  <TouchableOpacity onPress={() => setEditingWordData(null)} style={{ padding: 6 }}>
                    <IconClose size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Từ tiếng Anh *</Text>
                    <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                    value={editingWordData.word}
                    onChangeText={(val) => setEditingWordData({ ...editingWordData, word: val })} />
                  
                  </View>

                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nghĩa tiếng Việt *</Text>
                    <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                    value={editingWordData.meaning_vi}
                    onChangeText={(val) => setEditingWordData({ ...editingWordData, meaning_vi: val })} />
                  
                  </View>

                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phiên âm (IPA)</Text>
                    <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                    value={editingWordData.phonetic || ''}
                    onChangeText={(val) => setEditingWordData({ ...editingWordData, phonetic: val })} />
                  
                  </View>

                  {/* Topic Selector in Edit Modal */}
                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 4 }]}>Chủ đề (Topic)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                      {topics.map((t) => {
                      const isSelected = (editingWordData.topic_id || 'daily') === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => setEditingWordData({ ...editingWordData, topic_id: t.id })}
                          style={[
                          styles.filterChip,
                          {
                            backgroundColor: isSelected ? t.color || theme.accent : theme.drawerCardBg,
                            borderColor: isSelected ? t.color || theme.accent : theme.cardBorder
                          }]
                          }>
                          
                            <Text style={{ fontSize: 11, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#ffffff' : theme.textPrimary }}>
                              {t.emoji || '📁'} {t.name}
                            </Text>
                          </TouchableOpacity>);

                    })}
                    </ScrollView>
                  </View>

                  {/* Level & Part of Speech Row */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Trình độ</Text>
                      <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                      value={editingWordData.level || 'B2'}
                      onChangeText={(val) => setEditingWordData({ ...editingWordData, level: val })} />
                    
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Từ loại</Text>
                      <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                      value={editingWordData.part_of_speech || 'noun'}
                      onChangeText={(val) => setEditingWordData({ ...editingWordData, part_of_speech: val })} />
                    
                    </View>
                  </View>

                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Định nghĩa tiếng Anh</Text>
                    <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, minHeight: 48, fontSize: 12.5 }]}
                    value={editingWordData.meaning_en || ''}
                    onChangeText={(val) => setEditingWordData({ ...editingWordData, meaning_en: val })}
                    multiline />
                  
                  </View>

                  {/* Collocations in Edit Modal */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Collocations / Cụm từ hay</Text>
                      <TouchableOpacity
                      onPress={() => {
                        const cols = Array.isArray(editingWordData.collocations) ? [...editingWordData.collocations, ''] : [''];
                        setEditingWordData({ ...editingWordData, collocations: cols });
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      
                        <IconPlus size={12} color={theme.accent} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>+ Thêm cụm từ</Text>
                      </TouchableOpacity>
                    </View>
                    {(Array.isArray(editingWordData.collocations) && editingWordData.collocations.length > 0 ? editingWordData.collocations : ['']).map((col, idx) =>
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, flex: 1, fontSize: 12.5, height: 36 }]}
                      placeholder="Cụm từ..."
                      placeholderTextColor={theme.textMuted}
                      value={col}
                      onChangeText={(val) => {
                        const updated = Array.isArray(editingWordData.collocations) ? [...editingWordData.collocations] : [''];
                        updated[idx] = val;
                        setEditingWordData({ ...editingWordData, collocations: updated });
                      }} />
                    
                        <TouchableOpacity
                      onPress={() => {
                        const updated = (editingWordData.collocations || []).filter((_, i) => i !== idx);
                        setEditingWordData({ ...editingWordData, collocations: updated.length > 0 ? updated : [''] });
                      }}
                      style={{ padding: 4 }}>
                      
                          <IconTrash size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                  )}
                  </View>

                  {/* Examples in Edit Modal */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary, marginBottom: 0 }]}>Câu ví dụ thực tế</Text>
                      <TouchableOpacity
                      onPress={() => {
                        const exs = Array.isArray(editingWordData.examples) ? [...editingWordData.examples, ''] : [''];
                        setEditingWordData({ ...editingWordData, examples: exs });
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      
                        <IconPlus size={12} color={theme.accent} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>+ Thêm câu ví dụ</Text>
                      </TouchableOpacity>
                    </View>
                    {(Array.isArray(editingWordData.examples) && editingWordData.examples.length > 0 ? editingWordData.examples : ['']).map((ex, idx) =>
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, flex: 1, fontSize: 12.5, minHeight: 40 }]}
                      placeholder="Câu ví dụ..."
                      placeholderTextColor={theme.textMuted}
                      value={ex}
                      onChangeText={(val) => {
                        const updated = Array.isArray(editingWordData.examples) ? [...editingWordData.examples] : [''];
                        updated[idx] = val;
                        setEditingWordData({ ...editingWordData, examples: updated });
                      }}
                      multiline />
                    
                        <TouchableOpacity
                      onPress={() => {
                        const updated = (editingWordData.examples || []).filter((_, i) => i !== idx);
                        setEditingWordData({ ...editingWordData, examples: updated.length > 0 ? updated : [''] });
                      }}
                      style={{ padding: 4 }}>
                      
                          <IconTrash size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                  )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                    onPress={() => setEditingWordData(null)}
                    style={{ flex: 1, backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}>
                    
                      <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    onPress={handleUpdateWord}
                    disabled={isUpdatingWord}
                    style={{ flex: 1.5, backgroundColor: theme.btnPrimaryBg, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}>
                    
                      {isUpdatingWord ?
                    <ActivityIndicator size="small" color="#ffffff" /> :

                    <Text style={{ color: '#ffffff', fontWeight: '800' }}>Lưu Thay Đổi</Text>
                    }
                    </TouchableOpacity>
                  </View>
                </ScrollView>
          </View>
        </View> :
          null}
      </> : null}</Modal>

      {/* 13. COMMAND PALETTE & GLOBAL SEARCH MODAL */}
      <Modal
        visible={showCommandPaletteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCommandPaletteModal(false)}>{showCommandPaletteModal ? <>
        
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10, marginBottom: 12 }}>
              <IconSearch size={18} color={theme.accent} />
              <TextInput
                  style={{ flex: 1, fontSize: 15, color: theme.textPrimary, fontWeight: '600' }}
                  placeholder="Tra cứu từ, cấu trúc, bài đọc, phím tắt..."
                  placeholderTextColor={theme.textMuted}
                  value={commandSearchQuery}
                  onChangeText={setCommandSearchQuery}
                  autoFocus />
              
              <TouchableOpacity onPress={() => setShowCommandPaletteModal(false)} style={{ padding: 4 }}>
                <IconClose size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {/* Quick Actions Shortcuts */}
              {Boolean(!commandSearchQuery) ?
                <View style={{ gap: 4, marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>PHÍM TẮT ĐIỀU HƯỚNG</Text>
                  <TouchableOpacity
                    style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    onPress={() => {setShowCommandPaletteModal(false);navigateTo('review');}}>
                  
                    <IconZap size={16} color={theme.accent} />
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 13 }}>Ôn tập Thẻ Spaced Repetition (SM-2)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    onPress={() => {setShowCommandPaletteModal(false);navigateTo('quiz');}}>
                  
                    <IconTarget size={16} color="#10b981" />
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 13 }}>Làm Bài Quiz Trắc Nghiệm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    onPress={() => {setShowCommandPaletteModal(false);navigateTo('speaking');}}>
                  
                    <IconSparkles size={16} color="#a855f7" />
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 13 }}>Luyện AI Speaking & Pronunciation</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    onPress={() => {setShowCommandPaletteModal(false);fetchMobileAIMasteryReport();setShowAIMasteryModal(true);}}>
                  
                    <IconAward size={16} color="#f59e0b" />
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 13 }}>Xem Báo Cáo Đánh Giá Năng Lực AI</Text>
                  </TouchableOpacity>
                </View> : null
                }

              {/* Matched Words */}
              {commandSearchQuery.trim() ?
                <>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>KHO TỪ VỰNG</Text>
                  {words.
                  filter((w) => w.word.toLowerCase().includes(commandSearchQuery.toLowerCase()) || w.meaning_vi && w.meaning_vi.toLowerCase().includes(commandSearchQuery.toLowerCase())).
                  slice(0, 5).
                  map((w) =>
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => {
                      setShowCommandPaletteModal(false);
                      setSelectedWordDetail(w);
                    }}
                    style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                        <View>
                          <Text style={{ fontWeight: '700', color: theme.textPrimary, fontSize: 14 }}>{w.word}</Text>
                          <Text style={{ fontSize: 11, color: theme.accent }}>{w.meaning_vi}</Text>
                        </View>
                        <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                          <Text style={[styles.levelPillText, { color: theme.accent, fontSize: 10 }]}>{w.level || 'B2'}</Text>
                        </View>
                      </TouchableOpacity>
                  )}
                </> :
                null}
            </ScrollView>
          </View>
        </View>
      </> : null}</Modal>

      {/* 13. AUDIO SPEED & ACCENT MODAL (UI/UX PRO MAX) */}
      <Modal
        visible={showAudioSpeedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAudioSpeedModal(false)}>{showAudioSpeedModal ? <>
        
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: theme.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.cardBorder }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconVolume2 size={18} color={theme.accent} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>Tốc Độ Đọc Mẫu</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Tùy chỉnh tốc độ phát âm từ vựng</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAudioSpeedModal(false)} style={{ padding: 6 }}>
                <IconClose size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Large Interactive Speed Display & Stepper */}
            <View style={{ backgroundColor: theme.drawerCardBg, borderRadius: 16, padding: 14, alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: theme.cardBorder }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.5 }}>TỐC ĐỘ PHÁT HIỆN TẠI</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6, marginBottom: 4 }}>
                <TouchableOpacity
                    onPress={() => handleUpdateMobileSpeed(Math.max(0.4, mobileSpeed - 0.05))}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                  
                  <Text style={{ fontSize: 20, fontWeight: '800', color: theme.textPrimary }}>−</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 32, fontWeight: '900', color: theme.accent, minWidth: 100, textAlign: 'center' }}>
                  {mobileSpeed.toFixed(2)}x
                </Text>

                <TouchableOpacity
                    onPress={() => handleUpdateMobileSpeed(Math.min(2.0, mobileSpeed + 0.05))}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                  
                  <Text style={{ fontSize: 20, fontWeight: '800', color: theme.textPrimary }}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: theme.accent, fontWeight: '700' }}>
                {mobileSpeed <= 0.65 ? '🐢 Rất chậm (Chi tiết từng âm vị)' :
                  mobileSpeed <= 0.8 ? '🚶 Chậm (Tập làm quen ngữ âm)' :
                  mobileSpeed <= 0.9 ? '🎯 Tối ưu Shadowing (Khuyên dùng)' :
                  mobileSpeed <= 1.1 ? '⚡ Chuẩn bản xứ (Tự nhiên)' :
                  mobileSpeed <= 1.35 ? '🚀 Nhanh (Luyện phản xạ nghe)' :
                  '🔥 Thử thách tốc độ cao'}
              </Text>
            </View>

            {/* Quick Speed Presets */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginTop: 8, marginBottom: 6 }}>
              Chọn nhanh tốc độ:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                { val: 0.5, label: '0.5x Rất chậm' },
                { val: 0.75, label: '0.75x Chậm' },
                { val: 0.85, label: '0.85x Shadowing' },
                { val: 1.0, label: '1.0x Tự nhiên' },
                { val: 1.25, label: '1.25x Nhanh' },
                { val: 1.5, label: '1.5x Thử thách' }].
                map((preset) => {
                  const isSelected = Math.abs(mobileSpeed - preset.val) < 0.03;
                  return (
                    <TouchableOpacity
                      key={preset.val}
                      onPress={() => handleUpdateMobileSpeed(preset.val)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderRadius: 12,
                        backgroundColor: isSelected ? theme.accent : theme.drawerCardBg,
                        borderWidth: 1,
                        borderColor: isSelected ? theme.accent : theme.cardBorder,
                        flexGrow: 1,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                    
                    <Text style={{ fontSize: 11, fontWeight: '800', color: isSelected ? '#ffffff' : theme.textPrimary }}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>);

                })}
            </View>

            {/* Accent Selector (US vs UK) */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary, marginTop: 12, marginBottom: 6 }}>
              Chất giọng phát âm:
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                  onPress={() => handleUpdateMobileAccent('en-US')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: mobileAccent === 'en-US' ? isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)' : theme.drawerCardBg,
                    borderWidth: 1,
                    borderColor: mobileAccent === 'en-US' ? theme.accent : theme.cardBorder,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                
                <Text style={{ fontSize: 13, fontWeight: '800', color: mobileAccent === 'en-US' ? theme.accent : theme.textPrimary }}>
                  🇺🇸 Giọng Mỹ (US)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                  onPress={() => handleUpdateMobileAccent('en-GB')}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: mobileAccent === 'en-GB' ? isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)' : theme.drawerCardBg,
                    borderWidth: 1,
                    borderColor: mobileAccent === 'en-GB' ? theme.accent : theme.cardBorder,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                
                <Text style={{ fontSize: 13, fontWeight: '800', color: mobileAccent === 'en-GB' ? theme.accent : theme.textPrimary }}>
                  🇬🇧 Giọng Anh (UK)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Live Playback Test Button */}
            <TouchableOpacity
                onPress={() => playMobileAudio('The resilient scholar articulates every word with crystal clarity.', mobileSpeed, mobileAccent)}
                style={{
                  marginTop: 14,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)',
                  borderWidth: 1,
                  borderColor: theme.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8
                }}>
              
              <IconVolume2 size={18} color={theme.accent} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: theme.accent }}>
                Nghe Thử Câu Mẫu ({mobileSpeed.toFixed(2)}x)
              </Text>
            </TouchableOpacity>

            {/* Done Button */}
            <TouchableOpacity
                onPress={() => setShowAudioSpeedModal(false)}
                style={{
                  marginTop: 8,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: theme.btnPrimaryBg,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
              
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>
                ✓ Xong & Áp Dụng
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </> : null}</Modal>

      {/* 14. TOPIC MANAGER MODAL (MOBILE APPLE UI/UX PRO MAX) */}
      <Modal
        visible={showTopicManagerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTopicManagerModal(false)}>{showTopicManagerModal ? <>
        
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 480, maxHeight: '85%', backgroundColor: theme.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.cardBorder }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>📂</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>Quản Lý Chủ Đề</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Phân loại & sắp xếp kho từ vựng</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowTopicManagerModal(false)} style={{ padding: 6 }}>
                <IconClose size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
              {/* Add / Edit Form Card */}
              <View style={{ backgroundColor: theme.drawerCardBg, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: theme.accent, marginBottom: 10 }}>
                  {editingTopicData ? '✏️ Chỉnh Sửa Chủ Đề' : '✨ Tạo Chủ Đề Mới'}
                </Text>

                {/* Emoji & Name Row */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <View style={{ width: 60 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>Icon</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, textAlign: 'center', fontSize: 18, paddingVertical: 6 }]}
                        value={topicEmojiInput}
                        onChangeText={setTopicEmojiInput}
                        maxLength={4} />
                    
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>Tên chủ đề *</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, fontSize: 13, paddingVertical: 8 }]}
                        placeholder="Ví dụ: Công nghệ & IT, Du lịch..."
                        placeholderTextColor={theme.textMuted}
                        value={topicNameInput}
                        onChangeText={setTopicNameInput} />
                    
                  </View>
                </View>

                {/* Quick Emoji Suggestions */}
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>Gợi ý icon:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {['💼', '💻', '🎓', '☕', '✈️', '🧠', '🏥', '🎨', '📚', '🗣️', '🌿', '🚀'].map((em) =>
                      <TouchableOpacity
                        key={em}
                        onPress={() => setTopicEmojiInput(em)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: topicEmojiInput === em ? theme.accentPill : theme.card,
                          borderWidth: 1,
                          borderColor: topicEmojiInput === em ? theme.accent : theme.cardBorder
                        }}>
                      
                        <Text style={{ fontSize: 14 }}>{em}</Text>
                      </TouchableOpacity>
                      )}
                  </ScrollView>
                </View>

                {/* Color Presets */}
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>Màu sắc đại diện</Text>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    {['#0284c7', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#e11d48', '#6366f1'].map((c) =>
                      <TouchableOpacity
                        key={c}
                        onPress={() => setTopicColorInput(c)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: c,
                          borderWidth: topicColorInput === c ? 3 : 0,
                          borderColor: '#ffffff',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                      
                        {topicColorInput === c ? <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>✓</Text> : null}
                      </TouchableOpacity>
                      )}
                  </View>
                </View>

                {/* Description */}
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>Mô tả ngắn</Text>
                  <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, fontSize: 12, paddingVertical: 6 }]}
                      placeholder="Mô tả phạm vi từ vựng..."
                      placeholderTextColor={theme.textMuted}
                      value={topicDescInput}
                      onChangeText={setTopicDescInput} />
                  
                </View>

                {/* Form Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                  {Boolean(editingTopicData) ?
                    <TouchableOpacity
                      onPress={handleStartCreateTopic}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder }}>
                    
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>Hủy</Text>
                    </TouchableOpacity> : null
                    }
                  <TouchableOpacity
                      onPress={handleSaveTopic}
                      disabled={isSavingTopic}
                      style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.btnPrimaryBg }}>
                    
                    {isSavingTopic ?
                      <ActivityIndicator size="small" color="#ffffff" /> :

                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>
                        {editingTopicData ? 'Cập Nhật' : 'Tạo Chủ Đề'}
                      </Text>
                      }
                  </TouchableOpacity>
                </View>
              </View>

              {/* Topics List Title */}
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textMuted, letterSpacing: 0.5, marginTop: 6, textTransform: 'uppercase' }}>
                DANH SÁCH CHỦ ĐỀ HIỆN CÓ ({topics.length})
              </Text>

              {/* Topics List Items */}
              {topics.map((t) => {
                  const count = words.filter((w) => w.topic_id === t.id).length;
                  return (
                    <View
                      key={t.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        backgroundColor: theme.card,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                        borderLeftWidth: 4,
                        borderLeftColor: t.color || theme.accent
                      }}>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Text style={{ fontSize: 20 }}>{t.emoji || '📁'}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }}>{t.name}</Text>
                          <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: `${t.color || '#0284c7'}20` }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: t.color || '#0284c7' }}>{count} từ</Text>
                          </View>
                        </View>
                        {t.description ?
                          <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                            {t.description}
                          </Text> :
                          null}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity onPress={() => handleStartEditTopic(t)} style={{ padding: 6 }}>
                        <IconEdit size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteTopic(t)} style={{ padding: 6 }}>
                        <IconTrash size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>);

                })}
            </ScrollView>

            {/* Modal Footer Close Button */}
            <TouchableOpacity
                onPress={() => setShowTopicManagerModal(false)}
                style={{ marginTop: 10, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.btnPrimaryBg, alignItems: 'center', justifyContent: 'center' }}>
              
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>
                ✓ Đóng & Lưu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </> : null}</Modal>

      {/* 15. PATTERN CATEGORY MANAGER MODAL (MOBILE UI/UX) */}
      <Modal
        visible={showPatternCategoryManagerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPatternCategoryManagerModal(false)}>{showPatternCategoryManagerModal ? <>
        
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 480, maxHeight: '85%', backgroundColor: theme.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.cardBorder }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>🧩</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>Quản Lý Chức Năng Mẫu Câu</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Phân loại cấu trúc theo mục đích diễn đạt</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowPatternCategoryManagerModal(false)} style={{ padding: 6 }}>
                <IconClose size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
              {/* Add / Edit Form Card */}
              <View style={{ backgroundColor: theme.drawerCardBg, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#ec4899', marginBottom: 10 }}>
                  {editingPatternCatData ? '✏️ Chỉnh Sửa Chức Năng' : '✨ Tạo Chức Năng Mới'}
                </Text>

                {/* Emoji & Name Row */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <View style={{ width: 60 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>Icon</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, textAlign: 'center', fontSize: 18, paddingVertical: 6 }]}
                        value={patternCatEmojiInput}
                        onChangeText={setPatternCatEmojiInput}
                        maxLength={4} />
                    
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>Tên chức năng diễn đạt *</Text>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, fontSize: 13, paddingVertical: 8 }]}
                        placeholder="Ví dụ: So sánh, Nhấn mạnh..."
                        placeholderTextColor={theme.textMuted}
                        value={patternCatNameInput}
                        onChangeText={setPatternCatNameInput} />
                    
                  </View>
                </View>

                {/* Quick Emoji Suggestions */}
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>Gợi ý biểu tượng:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {['💥', '⚖️', '🎯', '⚠️', '💬', '⏳', '⏰', '🎓', '💼', '☕', '🔥', '💡', '🧠', '📚', '🚀'].map((em) =>
                      <TouchableOpacity
                        key={em}
                        onPress={() => setPatternCatEmojiInput(em)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          backgroundColor: patternCatEmojiInput === em ? `${patternCatColorInput}25` : theme.card,
                          borderWidth: 1,
                          borderColor: patternCatEmojiInput === em ? patternCatColorInput : theme.cardBorder
                        }}>
                      
                        <Text style={{ fontSize: 14 }}>{em}</Text>
                      </TouchableOpacity>
                      )}
                  </ScrollView>
                </View>

                {/* Color Presets */}
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>Màu sắc đại diện</Text>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#f97316', '#ec4899', '#6366f1'].map((c) =>
                      <TouchableOpacity
                        key={c}
                        onPress={() => setPatternCatColorInput(c)}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: c,
                          borderWidth: patternCatColorInput === c ? 2 : 0,
                          borderColor: '#ffffff'
                        }} />

                      )}
                  </View>
                </View>

                {/* Description */}
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, fontSize: 11 }]}>Mô tả mục đích sử dụng</Text>
                  <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, fontSize: 12, minHeight: 45, textAlignVertical: 'top' }]}
                      placeholder="Mô tả khi nào nên dùng cấu trúc này..."
                      placeholderTextColor={theme.textMuted}
                      multiline={true}
                      value={patternCatDescInput}
                      onChangeText={setPatternCatDescInput} />
                  
                </View>

                {/* Form Buttons */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  {Boolean(editingPatternCatData) ?
                    <TouchableOpacity
                      style={[styles.secondaryActionBtn, { flex: 1, paddingVertical: 8 }]}
                      onPress={handleStartCreatePatternCategory}>
                    
                      <Text style={[styles.secondaryActionBtnText, { fontSize: 12 }]}>Hủy sửa</Text>
                    </TouchableOpacity> : null
                    }
                  <TouchableOpacity
                      style={[styles.primaryActionBtn, { flex: 2, backgroundColor: patternCatColorInput || theme.accent, paddingVertical: 8 }]}
                      onPress={handleSavePatternCategory}
                      disabled={isSavingPatternCat}>
                    
                    <Text style={[styles.primaryActionBtnText, { fontSize: 12 }]}>
                      {isSavingPatternCat ? 'Đang lưu...' : editingPatternCatData ? 'Lưu Thay Đổi' : 'Tạo Chức Năng'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Categories List */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: theme.textSecondary, marginTop: 4 }}>
                DANH SÁCH CHỨC NĂNG ({patternCategories.length})
              </Text>

              {patternCategories.map((cat) => {
                  const count = patterns.filter((p) => (p.category || 'emphasis') === cat.id).length;
                  return (
                    <View
                      key={cat.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: theme.card,
                        padding: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                        borderLeftWidth: 4,
                        borderLeftColor: cat.color || '#8b5cf6'
                      }}>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 20 }}>{cat.emoji || '🧩'}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary }} numberOfLines={1}>
                            {cat.name}
                          </Text>
                          <View style={[styles.levelPill, { backgroundColor: `${cat.color || '#8b5cf6'}20`, paddingHorizontal: 6, paddingVertical: 1 }]}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: cat.color || '#8b5cf6' }}>{count} câu</Text>
                          </View>
                        </View>
                        {cat.description ?
                          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }} numberOfLines={1}>
                            {cat.description}
                          </Text> :
                          null}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                          onPress={() => handleStartEditPatternCategory(cat)}
                          style={{ padding: 6, borderRadius: 8, backgroundColor: theme.innerCard }}>
                        
                        <IconEdit size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                          onPress={() => handleDeletePatternCategory(cat)}
                          style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        
                        <IconTrash size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>);

                })}
            </ScrollView>

            {/* Modal Footer Close Button */}
            <TouchableOpacity
                onPress={() => setShowPatternCategoryManagerModal(false)}
                style={{ marginTop: 10, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.btnPrimaryBg, alignItems: 'center', justifyContent: 'center' }}>
              
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>
                ✓ Đóng & Lưu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </> : null}</Modal>
    </SafeAreaView>);

}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  brandTitle: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.3
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600'
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20
  },
  gamificationTopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 3
  },
  streakText: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 12
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  body: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    gap: 14
  },
  tabContainer: {
    flex: 1,
    padding: 16
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14
  },

  // HERO CARD
  heroCard: {
    borderRadius: 22,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8
  },
  heroCardActive: {
    backgroundColor: '#0284c7'
  },
  heroCardDone: {
    backgroundColor: '#059669'
  },
  heroHeaderPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  heroHeaderPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18
  },
  heroBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4
  },
  heroBtnText: {
    color: '#0284c7',
    fontWeight: '800',
    fontSize: 15
  },
  heroBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4
  },
  heroBtnSecondaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },

  // CARD GENERIC
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  cardBadgeText: {
    fontSize: 13,
    fontWeight: '800'
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  rankFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  mutedText: {
    fontSize: 12
  },

  // STATS GRID
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  statBox: {
    width: (width - 42) / 2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1
  },
  statBoxNum: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '600'
  },

  // QUICK ACTIONS
  quickActionRow: {
    flexDirection: 'row',
    gap: 10
  },
  quickActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  quickActionSub: {
    fontSize: 11
  },

  // SECTION HEADER
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600'
  },

  // VOCAB LIST ITEM
  vocabListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10
  },
  vocabItemLeft: {
    flex: 1,
    paddingRight: 10
  },
  vocabWordText: {
    fontSize: 17,
    fontWeight: '800'
  },
  vocabPhoneticText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 2
  },
  vocabMeaningText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2
  },
  vocabExampleSub: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4
  },
  levelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '800'
  },

  // PATTERNS
  formulaBox: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7'
  },
  formulaText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13
  },

  // REVIEW SCREEN
  reviewContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: 'space-between'
  },
  reviewProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reviewProgressText: {
    fontSize: 12,
    fontWeight: '800'
  },
  reviewCloseBtn: {
    fontSize: 12,
    fontWeight: '700'
  },
  flashcard: {
    flex: 1,
    width: '100%',
    minHeight: 380,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6
  },
  cardFrontContent: {
    flex: 1,
    justifyContent: 'space-between'
  },
  cardFrontBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardCenterBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  cardWordMain: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.6
  },
  cardPhonetic: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  cardFooterHint: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  cardBackScroll: {
    flex: 1
  },
  backWordTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4
  },
  backSectionBox: {
    marginTop: 14
  },
  backSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  backMeaningVi: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3
  },
  backMeaningEn: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2
  },
  exampleBox: {
    borderLeftWidth: 3.5,
    padding: 12,
    borderRadius: 10,
    marginTop: 14
  },
  exampleText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20
  },
  tapToRevealBtn: {
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6
  },
  tapToRevealBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  ratingBtnGrid: {
    flexDirection: 'row',
    gap: 6
  },
  ratingBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  ratingBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  ratingBtnSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '700'
  },

  // CELEBRATION
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6
  },
  celebrationDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20
  },

  // SEARCH & FILTERS
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  filterChipText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center'
  },

  // FORM INPUTS
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2
  },
  formSubtitle: {
    fontSize: 12,
    lineHeight: 16
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6
  },
  inputWithBtnRow: {
    flexDirection: 'row',
    gap: 8
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14
  },
  autoFillBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  autoFillBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  sampleChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  sampleChipsLabel: {
    fontSize: 11
  },
  sampleChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: '600'
  },
  formRowTwo: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700'
  },

  // STREAMLINED BOTTOM TAB BAR
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600'
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff'
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11
  },

  // ULTRA-PREMIUM APPLE-STYLE SIDE DRAWER
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row'
  },
  drawerSidebar: {
    width: Math.min(320, width * 0.82),
    height: '100%',
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 20,
    paddingHorizontal: 18,
    justifyContent: 'space-between'
  },
  drawerHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1
  },
  drawerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  drawerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  drawerAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  drawerUserName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3
  },
  drawerUserRank: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1
  },
  drawerCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  drawerStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 14,
    borderWidth: 1
  },
  drawerStatCol: {
    alignItems: 'center'
  },
  drawerStatNum: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '800'
  },
  drawerStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2
  },
  drawerStatDivider: {
    width: 1,
    height: 20
  },
  drawerScrollArea: {
    flex: 1
  },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4
  },
  drawerItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  drawerItemTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  drawerItemDesc: {
    fontSize: 11,
    marginTop: 1
  },
  drawerItemCount: {
    fontSize: 12,
    fontWeight: '700'
  },
  drawerFooterBox: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'center'
  },
  drawerFooterText: {
    fontSize: 11,
    fontWeight: '600'
  }
});

// Renders any fatal error that escaped the error boundary, directly on the
// device, so a release build no longer fails silently to a black screen.
function FatalErrorOverlay() {
  const [fatal, setFatal] = useState(pendingFatal);

  useEffect(() => subscribeFatal(setFatal), []);

  if (!fatal) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3,7,18,0.97)', padding: 16, justifyContent: 'center' }}>
      <View style={{ backgroundColor: '#111827', borderRadius: 20, borderWidth: 1, borderColor: '#ef4444', padding: 16, maxHeight: '90%' }}>
        <Text style={{ color: '#f87171', fontSize: 15, fontWeight: '800', marginBottom: 4 }}>
          {fatal.isFatal ? '💥 LỖI FATAL (JS)' : '⚠️ LỖI JS (không fatal)'}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 11, marginBottom: 10 }}>
          Lỗi này nằm ngoài render nên ErrorBoundary không bắt được. Chụp màn hình này gửi lại là đủ để sửa.
        </Text>

        <Text selectable={true} style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
          {fatal.message || '(không có message)'}
        </Text>

        <ScrollView style={{ maxHeight: 260, backgroundColor: '#030712', borderRadius: 12, padding: 10 }}>
          <Text selectable={true} style={{ color: '#94a3b8', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 14 }}>
            {fatal.stack || '(không có stack trace)'}
          </Text>
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <TouchableOpacity
            onPress={() => {
              reportFatalToServer({ message: fatal.message, stack: fatal.stack }, 'manual-resend', fatal.isFatal);
              Alert.alert('Đã gửi ✅', 'Đã gửi lại báo cáo lỗi về máy chủ.');
            }}
            style={{ flex: 1, backgroundColor: '#0284c7', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>📤 Gửi lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              pendingFatal = null;
              setFatal(null);
            }}
            style={{ flex: 1, backgroundColor: '#1f2937', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 13 }}>Tiếp tục dùng app</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>);

}

export default function App() {
  useEffect(() => {
    trace('app-root-mounted');
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MobileErrorBoundary>
        <MainApp />
      </MobileErrorBoundary>
      <FatalErrorOverlay />
    </View>);

}
