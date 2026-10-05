import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ChevronRight, 
  BookOpen, 
  Layers, 
  Sliders, 
  TrendingUp, 
  Brain,
  MessageSquare,
  Ear,
  Play,
  Pause,
  Radio,
  Target,
  Edit3,
  Lightbulb
} from 'lucide-react';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

export default function SpeakingLab({ onSaveWord, currentUser = null }) {
  const { t } = useLanguage();
  const isTargetVi = currentUser?.target_language === 'vi';

  // Modes: 'read-aloud' (Đọc theo mẫu) | 'qa' (Hỏi đáp đối thoại)
  const [activeMode, setActiveMode] = useState('read-aloud');
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [customText, setCustomText] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Raw Audio Recording & Web Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimer, setRecordTimer] = useState(0);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [userAudioBlob, setUserAudioBlob] = useState(null);
  const [userAudioUrl, setUserAudioUrl] = useState(null);
  const [userAudioBase64, setUserAudioBase64] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Audio Playback
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [isPlayingReference, setIsPlayingReference] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(audioService.getSpeed());
  const [audioAccent, setAudioAccent] = useState(audioService.getAccent());

  // Results State
  const [readAloudResult, setReadAloudResult] = useState(null);
  const [qaResult, setQaResult] = useState(null);
  const [activeWordTip, setActiveWordTip] = useState(null);

  // Refs
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const userAudioPlayerRef = useRef(null);

  // Load Prompts Bank
  useEffect(() => {
    const targetLang = currentUser?.target_language || 'en';
    api.getSpeakingPrompts(null, targetLang).then(res => {
      if (res.success && res.data) {
        setPrompts(res.data);
        const first = res.data.find(p => p.category === activeMode);
        if (first) setSelectedPrompt(first);
      }
    }).catch(err => console.error(err));
  }, [currentUser?.target_language]);

  // When activeMode changes, select default prompt
  useEffect(() => {
    if (prompts.length > 0) {
      const match = prompts.find(p => p.category === activeMode);
      if (match) setSelectedPrompt(match);
    }
    resetSession();
  }, [activeMode]);

  // Timer tick during recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordTimer(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const resetSession = () => {
    if (isRecording) stopRecording();
    setRecordTimer(0);
    setSpokenTranscript('');
    setUserAudioBlob(null);
    setUserAudioUrl(null);
    setUserAudioBase64(null);
    setReadAloudResult(null);
    setQaResult(null);
    setActiveWordTip(null);
    setIsPlayingUserAudio(false);
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Start Raw Audio Recording with Live Canvas Soundwave
  const startRecording = async () => {
    resetSession();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 1. Setup MediaRecorder for Raw Audio File
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? { mimeType: 'audio/mp4' }
          : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = options.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setUserAudioBlob(blob);
        setUserAudioUrl(URL.createObjectURL(blob));

        const base64 = await blobToBase64(blob);
        setUserAudioBase64(base64);

        // Stop all tracks in stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // 200ms chunk slices
      mediaRecorderRef.current = mediaRecorder;

      // 2. Setup Web Audio API Waveform Visualizer
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const canvas = canvasRef.current;
        if (canvas) {
          const canvasCtx = canvas.getContext('2d');
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 1.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              const barHeight = (dataArray[i] / 255) * canvas.height;
              canvasCtx.fillStyle = '#0284c7';
              canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
              x += barWidth + 1;
            }
          };
          draw();
        }
      } catch (e) {
        console.warn('AudioContext visualizer not supported:', e);
      }

      // 3. Setup Web Speech Recognition for Live Transcript Display
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = isTargetVi ? 'vi-VN' : (audioAccent === 'en-GB' ? 'en-GB' : 'en-US');

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
            setSpokenTranscript((accumulated + interim).trim());
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {}
      }

      setIsRecording(true);
    } catch (err) {
      alert((t.speaking?.errMic || 'Không thể truy cập Microphone: ') + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }

    setIsRecording(false);
  };

  // Submit and Analyze with AI (Multimodal Audio Understanding)
  const handleAnalyze = async () => {
    if (!userAudioBase64 && !spokenTranscript.trim()) {
      alert(t.speaking?.errNoAudio || 'Chưa có file thu âm giọng nói. Vui lòng bấm micro và nói vào mic nhé!');
      return;
    }

    setIsAnalyzing(true);
    try {
      const audioPayload = userAudioBase64 ? {
        data: userAudioBase64,
        mimeType: userAudioBlob?.type || 'audio/webm'
      } : null;

      if (activeMode === 'read-aloud') {
        const target = isCustomMode ? customText : (selectedPrompt?.targetText || '');
        const res = await api.analyzeReadAloud({
          targetText: target,
          spokenText: spokenTranscript,
          audioData: audioPayload,
          duration: recordTimer
        });
        if (res.success) {
          setReadAloudResult(res.data);
        }
      } else {
        const res = await api.analyzeQASpeaking({
          question: selectedPrompt?.question || '',
          topic: selectedPrompt?.topic || 'General',
          spokenText: spokenTranscript,
          audioData: audioPayload
        });
        if (res.success) {
          setQaResult(res.data);
        }
      }
    } catch (err) {
      alert((t.speaking?.errScoring || 'Lỗi chấm điểm: ') + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Play Reference Native Audio
  const handlePlayReference = (textToPlay) => {
    if (isPlayingUserAudio && userAudioPlayerRef.current) {
      try {
        userAudioPlayerRef.current.pause();
        userAudioPlayerRef.current.currentTime = 0;
      } catch (e) {}
      setIsPlayingUserAudio(false);
    }
    setIsPlayingReference(true);
    audioService.speak(textToPlay, isTargetVi ? 'vi-VN' : audioAccent, audioSpeed);
    setTimeout(() => setIsPlayingReference(false), 3500);
  };

  // Play User's Own Recorded Audio
  const togglePlayUserAudio = () => {
    if (!userAudioUrl) return;
    if (isPlayingUserAudio) {
      if (userAudioPlayerRef.current) {
        try {
          userAudioPlayerRef.current.pause();
          userAudioPlayerRef.current.currentTime = 0;
        } catch (e) {}
      }
      setIsPlayingUserAudio(false);
    } else {
      // Immediately cancel any active reference TTS speech
      audioService.stop();
      setIsPlayingReference(false);

      if (userAudioPlayerRef.current) {
        try {
          userAudioPlayerRef.current.pause();
          userAudioPlayerRef.current.currentTime = 0;
        } catch (e) {}
        userAudioPlayerRef.current = null;
      }
      const player = new Audio(userAudioUrl);
      userAudioPlayerRef.current = player;
      player.onended = () => setIsPlayingUserAudio(false);
      player.onerror = () => setIsPlayingUserAudio(false);
      player.play().catch(() => setIsPlayingUserAudio(false));
      setIsPlayingUserAudio(true);
    }
  };

  const currentCategoryPrompts = prompts.filter(p => p.category === activeMode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '980px', margin: '0 auto' }}>
      {/* 1. HERO HEADER & MODE TABS */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        padding: '2.25rem',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255,255,255,0.2)',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              marginBottom: '0.5rem'
            }}>
              <Radio size={14} />
              <span>MULTIMODAL ACOUSTIC PHONETICS ENGINE</span>
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {t.speaking?.title || 'Chấm Điểm Phát Âm & Speaking Chuẩn Xác'}
            </h2>
            <p style={{ opacity: 0.9, fontSize: '0.95rem', marginTop: '0.3rem' }}>
              {t.speaking?.subtitle || 'Lắng nghe trực tiếp file âm thanh micro: Soi kỹ từng phụ âm đuôi (/s/, /t/, /d/), nguyên âm IPA và ngữ điệu câu.'}
            </p>
          </div>

          {/* Mode Switcher Pill */}
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.25)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            backdropFilter: 'blur(10px)'
          }}>
            <button
              onClick={() => setActiveMode('read-aloud')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background: activeMode === 'read-aloud' ? '#ffffff' : 'transparent',
                color: activeMode === 'read-aloud' ? '#0369a1' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Ear size={16} />
              <span>{t.speaking?.tabReadAloud || '1. Đọc Đoạn Văn Mẫu'}</span>
            </button>

            <button
              onClick={() => setActiveMode('qa')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background: activeMode === 'qa' ? '#ffffff' : 'transparent',
                color: activeMode === 'qa' ? '#0369a1' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <MessageSquare size={16} />
              <span>{t.speaking?.tabQA || '2. Hỏi Đáp Đối Thoại'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PROMPT SELECTOR ROW */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {activeMode === 'read-aloud' ? (
              <>
                <BookOpen size={16} color="var(--accent-primary)" />
                <span>{t.speaking?.selectPromptTitle || 'Chọn Đoạn Văn Luyện Đọc:'}</span>
              </>
            ) : (
              <>
                <Target size={16} color="var(--accent-primary)" />
                <span>{t.speaking?.selectQATitle || 'Chọn Chủ Đề Câu Hỏi Speaking:'}</span>
              </>
            )}
          </h4>
          {activeMode === 'read-aloud' && (
            <button
              onClick={() => { setIsCustomMode(!isCustomMode); resetSession(); }}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              {isCustomMode ? (
                <>
                  <BookOpen size={13} />
                  <span>{t.speaking?.sampleTextBtn || 'Xem đoạn văn mẫu'}</span>
                </>
              ) : (
                <>
                  <Edit3 size={13} />
                  <span>{t.speaking?.customTextBtn || 'Tự nhập văn bản của bạn'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {!isCustomMode ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {currentCategoryPrompts.map(p => {
              const isSelected = selectedPrompt?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPrompt(p); resetSession(); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.85rem 1rem',
                    background: isSelected ? 'var(--accent-primary-light)' : 'var(--bg-card)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                    {p.topic}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {p.title || p.question.substring(0, 38) + '...'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={t.speaking?.customPlaceholder || "Dán câu hoặc đoạn văn tiếng Anh bạn muốn luyện phát âm vào đây..."}
              style={{
                width: '100%',
                minHeight: '80px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                padding: '0.75rem',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* 3. MAIN WORKSPACE CARD */}
      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* TARGET PROMPT BOX */}
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--accent-primary)',
              background: 'var(--accent-primary-light)',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase'
            }}>
              {activeMode === 'read-aloud' ? (t.speaking?.standardTextHeader || 'Văn Bản Chuẩn Cần Đọc') : (t.speaking?.examQuestionHeader || 'Câu Hỏi Khảo Thí')}
            </span>

            {/* Reference Audio Player */}
            <button
              onClick={() => handlePlayReference(isCustomMode ? customText : (activeMode === 'read-aloud' ? selectedPrompt?.targetText : selectedPrompt?.question))}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', fontWeight: 700, gap: '0.4rem' }}
              title={t.speaking?.listenReference || "Nghe audio người bản xứ đọc mẫu"}
            >
              <Volume2 size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>{isPlayingReference ? (t.speaking?.readingModel || 'Đang đọc mẫu...') : (t.speaking?.listenModelVoice || 'Nghe Giọng Mẫu 🔊')}</span>
            </button>
          </div>

          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em'
          }}>
            {isCustomMode ? (customText || t.speaking?.customPromptPlaceholder || 'Hãy nhập văn bản tùy ý vào ô phía trên...') : (activeMode === 'read-aloud' ? selectedPrompt?.targetText : selectedPrompt?.question)}
          </h3>

          {selectedPrompt?.tips && activeMode === 'read-aloud' && !isCustomMode && (
            <div style={{
              marginTop: '1rem',
              padding: '0.65rem 0.85rem',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              borderLeft: '3px solid var(--accent-warning)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Lightbulb size={16} color="var(--accent-warning)" />
              <span><b>{t.speaking?.pronunciationTipsPrefix || 'Mẹo phát âm:'}</b> {selectedPrompt.tips}</span>
            </div>
          )}
        </div>

        {/* RECORDING CONTROLS & LIVE ACOUSTIC SOUNDWAVE */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.75rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)',
          position: 'relative'
        }}>
          {/* Live Soundwave Canvas */}
          <canvas
            ref={canvasRef}
            width={260}
            height={36}
            style={{
              display: isRecording ? 'block' : 'none',
              borderRadius: 'var(--radius-md)',
              opacity: 0.85
            }}
          />

          {/* Timer */}
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: isRecording ? 'var(--accent-danger)' : 'var(--text-muted)'
          }}>
            {String(Math.floor(recordTimer / 60)).padStart(2, '0')}:{String(recordTimer % 60).padStart(2, '0')}
          </div>

          {/* Big Mic Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: isRecording ? '#ef4444' : 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRecording ? '0 0 28px rgba(239, 68, 68, 0.5)' : '0 8px 24px var(--accent-primary-glow)',
              transition: 'all var(--transition-bounce)',
              transform: isRecording ? 'scale(1.08)' : 'scale(1)'
            }}
          >
            {isRecording ? <Square size={32} /> : <Mic size={36} />}
          </button>

          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isRecording ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
            {isRecording ? (t.speaking?.recordingState || '🔴 Đang lắng nghe... Nói đi bạn!') : (t.speaking?.startRecord || 'Bắt Đầu Nói (Record)')}
          </span>

          {/* User Audio Playback Bar */}
          {userAudioUrl && !isRecording && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              width: '100%',
              maxWidth: '480px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  onClick={togglePlayUserAudio}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isPlayingUserAudio ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {typeof t.speaking?.reListenRecording === 'function' ? t.speaking.reListenRecording(recordTimer) : `🎧 Nghe Lại Bản Thu Của Bạn (${recordTimer}s)`}
                </span>
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {t.speaking?.audioRecordedBadge || 'ĐÃ THU ÂM FILE'}
              </span>
            </div>
          )}

          {/* Real-time speech transcript box */}
          {spokenTranscript && (
            <div style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem 1.25rem',
              marginTop: '0.5rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                {t.speaking?.recognizedSpeech || 'Nhận diện giọng nói tham chiếu:'}
              </span>
              <p style={{ fontSize: '1rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{spokenTranscript}"
              </p>
            </div>
          )}

          {/* Analyze CTA button */}
          {(userAudioBase64 || spokenTranscript) && !isRecording && (
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              <button
                onClick={resetSession}
                className="btn-secondary"
                style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}
              >
                <RotateCcw size={16} />
                <span>{t.speaking?.reRecordBtn || 'Thu âm lại'}</span>
              </button>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="btn-primary glow-hover"
                style={{ padding: '0.75rem 2rem', fontWeight: 800, fontSize: '1rem' }}
              >
                <Sparkles size={18} />
                <span>{isAnalyzing ? (t.speaking?.evaluatingAudioBtn || 'AI Đang Phân Tích Audio Gốc...') : (t.speaking?.accurateScoreBtn || 'Chấm Điểm Chuẩn Xác ➔')}</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. RESULTS SECTION - MODE 1: READ ALOUD BREAKDOWN */}
        {readAloudResult && activeMode === 'read-aloud' && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* Score Header Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div className="card" style={{ textAlign: 'center', padding: '1.25rem', background: 'var(--bg-tertiary)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t.speaking?.scoreTotal || 'TỔNG ĐIỂM'}</span>
                <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                  {readAloudResult.overallScore}%
                </h3>
              </div>

              <div className="card" style={{ textAlign: 'center', padding: '1.25rem', background: 'var(--bg-tertiary)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t.speaking?.scorePhoneme || 'ĐỘ CHUẨN ÂM VỊ'}</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                  {readAloudResult.accuracyScore}%
                </h3>
              </div>

              <div className="card" style={{ textAlign: 'center', padding: '1.25rem', background: 'var(--bg-tertiary)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t.speaking?.scoreFluency || 'ĐỘ TRÔI CHẢY'}</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
                  {readAloudResult.fluencyScore}%
                </h3>
              </div>

              <div className="card" style={{ textAlign: 'center', padding: '1.25rem', background: 'var(--bg-tertiary)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t.speaking?.scoreCompleteness || 'HOÀN CHỈNH CÂU'}</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7', marginTop: '0.2rem' }}>
                  {readAloudResult.completenessScore}%
                </h3>
              </div>
            </div>

            {/* Word-by-word interactive colored chips */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {t.speaking?.inspectBreakdown || '🔍 Soi Chi Tiết Từng Từ (Bấm vào từ để nghe phát âm & xem IPA):'}
                </h4>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ color: '#10b981' }}>{t.speaking?.phonemeAccurate || '🟢 Chuẩn xác'}</span>
                  <span style={{ color: '#f59e0b' }}>{t.speaking?.phonemeDeviant || '🟡 Nuốt âm / Lệch'}</span>
                  <span style={{ color: '#ef4444' }}>{t.speaking?.phonemeWrong || '🔴 Sai / Bỏ sót'}</span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                background: 'var(--bg-tertiary)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                lineHeight: 1.8
              }}>
                {readAloudResult.wordsAnalysis?.map((item, idx) => {
                  let bg = 'rgba(16, 185, 129, 0.15)';
                  let border = '#10b981';
                  let textColor = '#10b981';

                  if (item.status === 'mispronounced') {
                    bg = 'rgba(245, 158, 11, 0.15)';
                    border = '#f59e0b';
                    textColor = '#f59e0b';
                  } else if (item.status === 'missing') {
                    bg = 'rgba(239, 68, 68, 0.15)';
                    border = '#ef4444';
                    textColor = '#ef4444';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveWordTip(item);
                        audioService.speak(item.word);
                      }}
                      style={{
                        padding: '0.35rem 0.7rem',
                        borderRadius: 'var(--radius-md)',
                        background: bg,
                        border: `1px solid ${border}`,
                        color: textColor,
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      title={t.speaking?.listenReference || "Bấm để nghe phát âm chuẩn"}
                    >
                      <span>{item.word}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active word phonetic popover */}
              {activeWordTip && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{activeWordTip.word}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{activeWordTip.phonetic}</span>
                    {activeWordTip.feedback && (
                      <p style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.2rem' }}>⚠️ {activeWordTip.feedback}</p>
                    )}
                  </div>
                  <button
                    onClick={() => audioService.speak(activeWordTip.word)}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    <Volume2 size={15} />
                    <span>{t.speaking?.listenAgainBtn || 'Nghe lại'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Phonetic Tips & General Feedback */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={16} color="var(--accent-warning)" />
                <span>{t.speaking?.pronunciationAdvice || 'Lời Khuyên Cải Thiện Phát Âm:'}</span>
              </h4>
              {readAloudResult.phoneticTips?.map((tip, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. RESULTS SECTION - MODE 2: Q&A ASSESSMENT */}
        {qaResult && activeMode === 'qa' && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* Band Score Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t.speaking?.speakingInterviewTitle || 'ĐÁNH GIÁ PHẢN XẠ NÓI'}</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {t.speaking?.speakingInterviewTitle || 'Kết Quả Phỏng Vấn Speaking'}
                </h3>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #10b981, #047857)',
                color: '#ffffff',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-xl)',
                textAlign: 'center',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.9 }}>IELTS Estimated Band</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{qaResult.overallBand}</div>
              </div>
            </div>

            {/* 4 Criteria Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {Object.entries(qaResult.criteria || {}).map(([key, val]) => {
                const labels = {
                  fluency: t.speaking?.fluencyCriterion || 'Độ Trôi Chảy & Mạch Lạc',
                  pronunciation: t.speaking?.pronunciationCriterion || 'Phát Âm & Ngữ Điệu',
                  grammar: t.speaking?.grammarCriterion || 'Ngữ Pháp & Cấu Trúc',
                  vocabulary: t.speaking?.vocabCriterion || 'Vốn Từ & Collocations'
                };

                return (
                  <div key={key} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{labels[key] || key}</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-primary)' }}>Band {val.band}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{val.feedback}</p>
                  </div>
                );
              })}
            </div>

            {/* Model Answer Band 8.5+ with Audio Playback */}
            {qaResult.modelAnswerBand85 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(2, 132, 199, 0.05))',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={18} style={{ color: 'var(--accent-primary)' }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {t.speaking?.upgradeSampleAnswer || 'Câu Trả Lời Mẫu Nâng Cấp (Native Band 8.5+):'}
                    </h4>
                  </div>
                  <button
                    onClick={() => handlePlayReference(qaResult.modelAnswerBand85)}
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <Volume2 size={15} />
                    <span>{t.speaking?.listenUpgradeModel || 'Luyện Nghe Mẫu 🔊'}</span>
                  </button>
                </div>

                <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{qaResult.modelAnswerBand85}"
                </p>

                {/* Highlight Vocabulary Chips */}
                {qaResult.highlightVocabulary?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                    {qaResult.highlightVocabulary.map((item, idx) => (
                      <span key={idx} className="badge badge-blue" style={{ fontSize: '0.82rem', padding: '0.3rem 0.65rem' }}>
                        <b>{item.word}:</b> {item.meaning}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
