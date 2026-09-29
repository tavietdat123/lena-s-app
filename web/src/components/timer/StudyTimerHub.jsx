import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Award, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  BarChart3, 
  Timer, 
  Bell, 
  BookOpen, 
  Layers, 
  FileText, 
  Target, 
  Mic, 
  Info,
  Check,
  X,
  Volume2,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../../services/api';
import { useStudyTimer } from '../../context/StudyTimerContext';

const ACTIVITIES = [
  { id: 'vocab', label: 'Học Từ Vựng Mới', emoji: '📚', color: '#0284c7', icon: BookOpen },
  { id: 'flashcard', label: 'Ôn Tập Flashcards (SRS)', emoji: '🎴', color: '#8b5cf6', icon: Layers },
  { id: 'reader', label: 'Đọc Hiểu & Ghi Chú', emoji: '📖', color: '#10b981', icon: FileText },
  { id: 'quiz', label: 'Luyện Đề Quiz Trắc Nghiệm', emoji: '🎯', color: '#f59e0b', icon: Target },
  { id: 'speaking', label: 'Luyện Nói & Speaking', emoji: '🎙️', color: '#ec4899', icon: Mic },
  { id: 'general', label: 'Tự Học & Tổng Hợp', emoji: '💡', color: '#06b6d4', icon: Sparkles }
];

const POMODORO_PRESETS = [
  { label: '5m', tag: 'Khởi động', fullLabel: '5 phút (Khởi động nhanh)', seconds: 5 * 60 },
  { label: '10m', tag: 'Cấp tốc', fullLabel: '10 phút (Ôn 10 từ cấp tốc)', seconds: 10 * 60 },
  { label: '15m', tag: 'Ôn thẻ', fullLabel: '15 phút (Ôn flashcards)', seconds: 15 * 60 },
  { label: '20m', tag: 'Luyện nghe', fullLabel: '20 phút (Luyện nghe / nói)', seconds: 20 * 60 },
  { label: '25m', tag: 'Chuẩn 🍅', fullLabel: '25 phút (Pomodoro Tiêu chuẩn)', seconds: 25 * 60 },
  { label: '30m', tag: 'Làm Quiz', fullLabel: '30 phút (Làm bài tập Quiz)', seconds: 30 * 60 },
  { label: '45m', tag: 'Tập trung', fullLabel: '45 phút (Tập trung chuyên sâu)', seconds: 45 * 60 },
  { label: '50m', tag: '50/10', fullLabel: '50 phút (Phương pháp học 50/10)', seconds: 50 * 60 },
  { label: '60m', tag: '1 Tiếng', fullLabel: '60 phút (1 giờ học đầy đủ)', seconds: 60 * 60 },
  { label: '90m', tag: 'Sóng não', fullLabel: '90 phút (Chu kỳ sinh học Ultradian)', seconds: 90 * 60 },
  { label: '120m', tag: '2 Tiếng', fullLabel: '120 phút (Thi thử & Luyện đề lớn)', seconds: 120 * 60 }
];

const MOTIVATIONAL_QUOTES = [
  { quote: "Consistency is what transforms average into excellence.", author: "Tony Robbins" },
  { quote: "Every minute you spend learning is an investment in your global future.", author: "LinguaVault" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Focus on the process, and the fluency will follow.", author: "James Clear" }
];

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDurationHuman(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h} giờ ${m} phút`;
  }
  if (m > 0) {
    return `${m} phút ${s > 0 ? `${s}s` : ''}`;
  }
  return `${s} giây`;
}

// Simple Web Audio API Chime
function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.2, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  } catch (e) {}
}

export default function StudyTimerHub({ onSessionFinished, onAddToast }) {
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'stats'
  
  // Consume Global Persistent Timer Context
  const {
    timerMode,
    setTimerMode,
    selectedActivity,
    setSelectedActivity,
    isRunning,
    liveSeconds,
    pomodoroTarget,
    setPomodoroTarget,
    sessionStartedAt,
    soundEnabled,
    setSoundEnabled,
    startTimer,
    pauseTimer,
    resetTimer,
    clearSessionAfterSave
  } = useStudyTimer();

  const elapsedSeconds = liveSeconds;
  const pomodoroRemaining = Math.max(0, pomodoroTarget - liveSeconds);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [customMinutesInput, setCustomMinutesInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Statistics & History state
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [randomQuote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  const loadStatsAndHistory = async () => {
    setIsLoadingStats(true);
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        api.getStudyTimerStats(),
        api.getStudyTimerSessions({ limit: 50, activity_type: historyFilter })
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (sessionsRes.success && sessionsRes.data) {
        setSessions(sessionsRes.data);
        setTotalSessionsCount(sessionsRes.total || sessionsRes.data.length);
      }
    } catch (err) {
      console.error('Failed to load study timer stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStatsAndHistory();
  }, [historyFilter]);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStatsAndHistory();
    }
  }, [activeTab]);

  const handleStartTimer = () => {
    startTimer();
  };

  const handlePauseTimer = () => {
    pauseTimer();
  };

  const handleResetTimer = () => {
    if (liveSeconds > 0 && !window.confirm('Bạn có chắc chắn muốn đặt lại đồng hồ về 0?')) {
      return;
    }
    resetTimer();
  };

  const handleOpenFinishModal = () => {
    if (liveSeconds < 5) {
      alert('Phiên học quá ngắn (dưới 5 giây). Hãy học thêm trước khi lưu nhé!');
      return;
    }
    pauseTimer();
    setIsSaveModalOpen(true);
  };

  const handleSaveSession = async () => {
    if (liveSeconds < 1) return;
    setIsSaving(true);
    try {
      const act = ACTIVITIES.find(a => a.id === selectedActivity) || ACTIVITIES[0];
      const now = new Date();
      const startIso = sessionStartedAt || new Date(now.getTime() - liveSeconds * 1000).toISOString();

      const res = await api.saveStudySession({
        activity_type: selectedActivity,
        activity_title: act.label,
        duration_seconds: liveSeconds,
        mode: timerMode,
        target_seconds: timerMode === 'pomodoro' ? pomodoroTarget : 0,
        notes: sessionNotes.trim(),
        started_at: startIso,
        ended_at: now.toISOString()
      });

      if (res.success) {
        const xpEarned = res.xpEarned || 20;
        if (onAddToast) {
          onAddToast(`🎉 Đã lưu phiên học ${formatDurationHuman(liveSeconds)}! (+${xpEarned} XP)`);
        }
        if (onSessionFinished) onSessionFinished(res);

        clearSessionAfterSave();
        setSessionNotes('');
        setIsSaveModalOpen(false);
        loadStatsAndHistory();
      } else {
        alert('Lỗi lưu phiên học: ' + (res.error || 'Thao tác thất bại'));
      }
    } catch (err) {
      alert('Lỗi lưu phiên học: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi phiên học này?')) return;
    try {
      const res = await api.deleteStudySession(id);
      if (res.success) {
        if (onAddToast) onAddToast('Đã xóa phiên học.');
        loadStatsAndHistory();
      }
    } catch (err) {
      alert('Lỗi xóa phiên học: ' + err.message);
    }
  };

  const currentActivity = ACTIVITIES.find(a => a.id === selectedActivity) || ACTIVITIES[0];
  const displayTimeSeconds = timerMode === 'pomodoro' ? pomodoroRemaining : elapsedSeconds;

  // Calculate Pomodoro Progress percentage
  const pomodoroProgressPercent = timerMode === 'pomodoro' 
    ? Math.min(100, Math.round(((pomodoroTarget - pomodoroRemaining) / pomodoroTarget) * 100)) 
    : 0;

  return (
    <div className="study-timer-container animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* 1. Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(2, 132, 199, 0.28)'
          }}>
            <Timer size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Đồng Hồ Bấm Giờ Học & Thống Kê
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              Bấm giờ chủ động, kiểm soát kỷ luật Pomodoro và theo dõi biểu đồ thời gian học.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          padding: '0.3rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActiveTab('timer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'timer' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'timer' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Clock size={16} />
            <span>Bấm Giờ Học</span>
            {isRunning && (
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulse 1.5s infinite'
              }} />
            )}
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'stats' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'stats' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart3 size={16} />
            <span>Bảng Thống Kê</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: ACTIVE STUDY STOPWATCH & POMODORO TIMER */}
      {activeTab === 'timer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Main Stopwatch Stage Card */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '24px',
            border: isRunning ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
            boxShadow: isRunning ? '0 12px 35px rgba(2, 132, 199, 0.16)' : 'var(--shadow-md)',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border 0.3s ease, box-shadow 0.3s ease'
          }}>
            {/* Ambient Background Aura when running */}
            {isRunning && (
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '500px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
            )}

            {/* Top Controls: Mode Switcher & Sound Toggle */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              maxWidth: '520px',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                background: 'var(--bg-tertiary)',
                padding: '0.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isRunning && timerMode !== 'stopwatch') {
                      if (!window.confirm('Đang bấm giờ. Chuyển chế độ sẽ đặt lại thời gian, bạn có muốn đổi không?')) return;
                      setIsRunning(false);
                      setElapsedSeconds(0);
                    }
                    setTimerMode('stopwatch');
                  }}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: timerMode === 'stopwatch' ? 'var(--accent-primary)' : 'transparent',
                    color: timerMode === 'stopwatch' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  ⏱️ Bấm Giờ Tự Do
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isRunning && timerMode !== 'pomodoro') {
                      if (!window.confirm('Đang bấm giờ. Chuyển chế độ sẽ đặt lại thời gian, bạn có muốn đổi không?')) return;
                      setIsRunning(false);
                      setElapsedSeconds(0);
                    }
                    setTimerMode('pomodoro');
                    setPomodoroRemaining(pomodoroTarget);
                  }}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: timerMode === 'pomodoro' ? '#ef4444' : 'transparent',
                    color: timerMode === 'pomodoro' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  🍅 Pomodoro Đếm Ngược
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Chuông thông báo: BẬT' : 'Chuông thông báo: TẮT'}
                className="btn-icon"
                style={{
                  color: soundEnabled ? 'var(--accent-primary)' : 'var(--text-muted)',
                  background: 'var(--bg-tertiary)',
                  width: '34px',
                  height: '34px'
                }}
              >
                <Volume2 size={16} />
              </button>
            </div>

            {/* Pomodoro Preset Chips & Custom Time if Pomodoro mode */}
            {timerMode === 'pomodoro' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                maxWidth: '680px',
                marginBottom: '1.25rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.35rem',
                  flexWrap: 'wrap'
                }}>
                  {POMODORO_PRESETS.map(p => {
                    const isSelected = pomodoroTarget === p.seconds;
                    return (
                      <button
                        key={p.seconds}
                        type="button"
                        disabled={isRunning}
                        title={p.fullLabel}
                        onClick={() => {
                          setPomodoroTarget(p.seconds);
                          setPomodoroRemaining(p.seconds);
                          setElapsedSeconds(0);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          border: '1px solid',
                          borderColor: isSelected ? '#ef4444' : 'var(--border-color)',
                          background: isSelected ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-tertiary)',
                          color: isSelected ? '#ef4444' : 'var(--text-secondary)',
                          cursor: isRunning ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{p.label}</span>
                        {p.tag && (
                          <span style={{
                            fontSize: '0.65rem',
                            opacity: isSelected ? 1 : 0.65,
                            fontWeight: isSelected ? 800 : 500,
                            background: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px'
                          }}>
                            {p.tag}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Custom Minutes Button */}
                  <button
                    type="button"
                    disabled={isRunning}
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: (!POMODORO_PRESETS.some(p => p.seconds === pomodoroTarget) || showCustomInput) ? '#ef4444' : 'var(--border-color)',
                      background: (!POMODORO_PRESETS.some(p => p.seconds === pomodoroTarget) || showCustomInput) ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-tertiary)',
                      color: (!POMODORO_PRESETS.some(p => p.seconds === pomodoroTarget) || showCustomInput) ? '#ef4444' : 'var(--text-secondary)',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Tùy chỉnh số phút đếm ngược bất kỳ"
                  >
                    <SlidersHorizontal size={13} />
                    <span>
                      {!POMODORO_PRESETS.some(p => p.seconds === pomodoroTarget)
                        ? `${Math.round(pomodoroTarget / 60)}p (Tự chọn)`
                        : 'Tùy chọn phút...'}
                    </span>
                  </button>
                </div>

                {/* Inline Custom Minutes Input Form */}
                {showCustomInput && !isRunning && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const mins = parseInt(customMinutesInput, 10);
                      if (isNaN(mins) || mins <= 0 || mins > 360) {
                        if (onAddToast) onAddToast('⚠️ Vui lòng nhập số phút hợp lệ (từ 1 đến 360 phút)');
                        return;
                      }
                      const sec = mins * 60;
                      setPomodoroTarget(sec);
                      setPomodoroRemaining(sec);
                      setElapsedSeconds(0);
                      setShowCustomInput(false);
                      setCustomMinutesInput('');
                      if (onAddToast) onAddToast(`⏱️ Đã đặt đếm ngược: ${mins} phút`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: 'var(--bg-tertiary)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #ef4444',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Thời gian đếm ngược:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="360"
                      autoFocus
                      placeholder="Số phút"
                      value={customMinutesInput}
                      onChange={(e) => setCustomMinutesInput(e.target.value)}
                      style={{
                        width: '75px',
                        padding: '0.25rem 0.4rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>phút</span>
                    <button
                      type="submit"
                      style={{
                        padding: '0.3rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Áp dụng
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      style={{
                        padding: '0.3rem 0.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      Đóng
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Giant Digital Time Display */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '0.5rem 0 1.5rem 0'
            }}>
              <div style={{
                fontSize: 'clamp(3.5rem, 8vw, 5.5rem)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: isRunning ? 'var(--text-primary)' : 'var(--text-secondary)',
                textShadow: isRunning ? '0 0 35px rgba(2, 132, 199, 0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}>
                {formatTime(displayTimeSeconds)}
              </div>

              {/* Status pill under time */}
              <div style={{
                marginTop: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 700,
                background: isRunning ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-tertiary)',
                color: isRunning ? '#16a34a' : 'var(--text-muted)'
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isRunning ? '#22c55e' : 'var(--text-muted)'
                }} />
                <span>
                  {isRunning 
                    ? (timerMode === 'pomodoro' ? 'Đang tập trung Pomodoro...' : 'Đang bấm giờ học...')
                    : (elapsedSeconds > 0 ? 'Đang tạm dừng' : 'Sẵn sàng bắt đầu')}
                </span>
                {timerMode === 'pomodoro' && isRunning && (
                  <span style={{ marginLeft: '4px', opacity: 0.85 }}>({pomodoroProgressPercent}%)</span>
                )}
              </div>
            </div>

            {/* Main Action Buttons Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              {!isRunning ? (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="btn-primary glow-hover"
                  style={{
                    padding: '0.85rem 2rem',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #0284c7, #0ea5e9)'
                  }}
                >
                  <Play size={20} fill="currentColor" />
                  <span>{elapsedSeconds > 0 ? 'Tiếp Tục Học' : 'Bắt Đầu Học'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseTimer}
                  className="btn-secondary"
                  style={{
                    padding: '0.85rem 1.75rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.4)'
                  }}
                >
                  <Pause size={20} fill="currentColor" />
                  <span>Tạm Dừng</span>
                </button>
              )}

              {/* Finish & Save Session Button */}
              {elapsedSeconds > 0 && (
                <button
                  type="button"
                  onClick={handleOpenFinishModal}
                  className="btn-primary"
                  style={{
                    padding: '0.85rem 1.6rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: '16px',
                    background: '#10b981',
                    borderColor: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckCircle2 size={19} />
                  <span>Hoàn Thành & Lưu</span>
                </button>
              )}

              {/* Reset Button */}
              {elapsedSeconds > 0 && (
                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="btn-secondary"
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: '16px',
                    color: 'var(--text-muted)'
                  }}
                  title="Đặt lại đồng hồ"
                >
                  <RotateCcw size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Activity Selector Row */}
          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem' }}>
              🎯 Bạn đang học nội dung gì? (Chọn hoạt động để phân loại thống kê):
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.6rem'
            }}>
              {ACTIVITIES.map(act => {
                const isSelected = selectedActivity === act.id;
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setSelectedActivity(act.id)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '14px',
                      border: '1px solid',
                      borderColor: isSelected ? act.color : 'var(--border-color)',
                      background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isSelected ? `0 4px 14px ${act.color}25` : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${act.color}18`,
                      color: act.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {act.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Motivation Quote Card */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            padding: '1rem 1.25rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <div style={{ fontSize: '1.4rem' }}>💡</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                "{randomQuote.quote}"
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '2px' }}>
                — {randomQuote.author}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: STUDY TIME ANALYTICS & STATISTICS DASHBOARD */}
      {activeTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Live running timer notification banner on stats tab */}
          {(liveSeconds > 0 || isRunning) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              background: isRunning ? 'rgba(2, 132, 199, 0.1)' : 'var(--bg-secondary)',
              border: isRunning ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
              boxShadow: isRunning ? '0 4px 20px rgba(2, 132, 199, 0.15)' : 'none',
              animation: 'fadeInUp 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{currentActivity.emoji}</span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isRunning ? '#22c55e' : '#f59e0b',
                      animation: isRunning ? 'pulse 1.5s infinite' : 'none'
                    }} />
                    <span>Đồng hồ đang {isRunning ? 'chạy' : 'tạm dừng'}: {currentActivity.label}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Thời gian hiện tại: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>{formatTime(displayTimeSeconds)}</strong> ({timerMode === 'pomodoro' ? 'Pomodoro đếm ngược' : 'Bấm giờ đếm xuôi'})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={isRunning ? pauseTimer : startTimer}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: isRunning ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                    color: isRunning ? 'var(--text-primary)' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  <span>{isRunning ? 'Tạm dừng' : 'Tiếp tục'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('timer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>Xem đồng hồ lớn</span>
                </button>
              </div>
            </div>
          )}
          {/* 4 Summary KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            {/* Total Study Time */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '1.25rem',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(2, 132, 199, 0.12)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Tổng Thời Gian Tích Lũy
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {formatDurationHuman(stats?.totalSeconds || 0)}
                </div>
              </div>
            </div>

            {/* Today */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '1.25rem',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Flame size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Thời Gian Hôm Nay
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ef4444' }}>
                  {formatDurationHuman(stats?.todaySeconds || 0)}
                </div>
              </div>
            </div>

            {/* This Week */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '1.25rem',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  7 Ngày Gần Nhất
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981' }}>
                  {formatDurationHuman(stats?.thisWeekSeconds || 0)}
                </div>
              </div>
            </div>

            {/* Total Sessions */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '1.25rem',
              borderRadius: '18px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Award size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Số Phiên Học Đã Lưu
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#8b5cf6' }}>
                  {stats?.totalSessions || 0} phiên
                </div>
              </div>
            </div>
          </div>

          {/* 14-Day Visual Activity Bar Chart */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                  📈 Biểu Đồ Thời Gian Học 14 Ngày Gần Nhất
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Thời lượng học chủ động mỗi ngày (tính theo phút)
                </span>
              </div>
              {stats?.streakDays > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  fontSize: '0.82rem',
                  fontWeight: 800
                }}>
                  <Flame size={15} />
                  <span>Chuỗi: {stats.streakDays} ngày liên tục</span>
                </div>
              )}
            </div>

            {/* Custom Interactive SVG/CSS Bar Chart */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem',
              height: '180px',
              paddingTop: '1.5rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              {stats?.dailyHistory?.map((day, idx) => {
                const maxMinutes = Math.max(60, ...stats.dailyHistory.map(d => d.duration_minutes));
                const heightPercent = maxMinutes > 0 ? Math.max(4, Math.round((day.duration_minutes / maxMinutes) * 100)) : 4;
                const hasMinutes = day.duration_minutes > 0;

                return (
                  <div
                    key={day.date}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative'
                    }}
                    title={`${day.label}: ${day.duration_minutes} phút (${day.count} phiên)`}
                  >
                    {/* Tooltip on bar */}
                    {hasMinutes && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: day.isToday ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        marginBottom: '4px'
                      }}>
                        {day.duration_minutes}'
                      </span>
                    )}

                    {/* Bar Pill */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '28px',
                        height: `${heightPercent}%`,
                        borderRadius: '6px 6px 2px 2px',
                        background: day.isToday 
                          ? 'linear-gradient(180deg, #0284c7, #38bdf8)' 
                          : (hasMinutes ? 'linear-gradient(180deg, #8b5cf6, #a78bfa)' : 'var(--bg-tertiary)'),
                        transition: 'all 0.3s ease',
                        boxShadow: day.isToday && hasMinutes ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
                      }}
                    />

                    {/* Day label */}
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: day.isToday ? 800 : 500,
                      color: day.isToday ? 'var(--accent-primary)' : 'var(--text-muted)',
                      marginTop: '6px',
                      whiteSpace: 'nowrap'
                    }}>
                      {day.shortDate}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Breakdown Progress Bars */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
              📊 Phân Bổ Thời Gian Theo Hoạt Động
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {stats?.activityBreakdown?.map(item => (
                <div key={item.type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <b>{item.total_minutes} phút</b> ({item.percent}%) • {item.count} phiên
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sessions History Table */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                  📜 Lịch Sử Các Phiên Bấm Giờ Học
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Tổng cộng: {totalSessionsCount} phiên đã lưu
                </span>
              </div>

              {/* Filter by Activity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lọc:</span>
                <select
                  className="input-control"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', width: 'auto' }}
                >
                  <option value="all">Tất cả hoạt động</option>
                  {ACTIVITIES.map(a => (
                    <option key={a.id} value={a.id}>{a.emoji} {a.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: 'var(--text-muted)'
              }}>
                <Clock size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Chưa có phiên học nào được ghi nhận.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('timer')}
                  className="btn-primary"
                  style={{ marginTop: '0.85rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Bắt Đầu Phiên Học Đầu Tiên
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Thời Gian</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Hoạt Động</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Chế Độ</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Thời Lượng</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Ghi Chú</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => {
                      const act = ACTIVITIES.find(a => a.id === s.activity_type) || ACTIVITIES[0];
                      const dateObj = new Date(s.started_at);
                      const dateFormatted = `${dateObj.getDate()}/${dateObj.getMonth() + 1} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {dateFormatted}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '8px',
                              background: `${act.color}15`,
                              color: act.color,
                              fontWeight: 700,
                              fontSize: '0.78rem'
                            }}>
                              <span>{act.emoji}</span>
                              <span>{act.label}</span>
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                            {s.mode === 'pomodoro' ? '🍅 Pomodoro' : '⏱️ Tự do'}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {formatDurationHuman(s.duration_seconds)}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)', maxWidth: '250px' }}>
                            {s.notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có</span>}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(s.id)}
                              className="btn-icon"
                              style={{ color: '#ef4444', width: '28px', height: '28px' }}
                              title="Xóa phiên học này"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. FINISH & SAVE SESSION MODAL */}
      {isSaveModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsSaveModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--accent-success)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Lưu Phiên Học Của Bạn</h3>
              </div>
              <button onClick={() => setIsSaveModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Summary Stats Box */}
              <div style={{
                background: 'var(--bg-tertiary)',
                borderRadius: '16px',
                padding: '1.25rem',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Thời lượng bạn đã học:</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-primary)', margin: '4px 0' }}>
                  {formatDurationHuman(elapsedSeconds)}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: currentActivity.color,
                  marginTop: '4px'
                }}>
                  <span>{currentActivity.emoji}</span>
                  <span>{currentActivity.label}</span>
                </div>
              </div>

              {/* XP Reward Preview */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: '#d97706'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Award size={16} />
                  <span>Điểm Kinh Nghiệm Nhận Được:</span>
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 900 }}>
                  +{Math.min(100, Math.max(10, 10 + Math.floor(elapsedSeconds / 60) * 2))} XP
                </span>
              </div>

              {/* Session Note Input */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
                  📝 Ghi chú về buổi học (Tùy chọn):
                </label>
                <textarea
                  className="input-control"
                  rows={3}
                  placeholder="Ví dụ: Đã học xong 15 từ vựng chủ đề Kinh tế, giải được 2 bài đọc..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 1.1rem' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveSession}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.5rem', background: '#10b981', borderColor: '#10b981' }}
                >
                  {isSaving ? 'Đang lưu...' : 'Xác Nhận & Lưu Phiên Học'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
