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
  SlidersHorizontal, 
  Coffee, 
  Music, 
  BellRing, 
  CalendarDays, 
  SkipForward, 
  Edit2, 
  Plus,
  Code,
  Briefcase,
  Brain,
  PenTool,
  Zap,
  Laptop
} from 'lucide-react';
import { api } from '../../services/api';
import { useStudyTimer, SOUND_OPTIONS, ACTIVITIES, getActivityMeta } from '../../context/StudyTimerContext';
import StudyScheduleModal from './StudyScheduleModal';
import ActivityHistoryChart from '../common/ActivityHistoryChart';

const ACTIVITY_ICONS = {
  coding: Code,
  work: Briefcase,
  vocab: BookOpen,
  flashcard: Layers,
  reader: FileText,
  quiz: Target,
  speaking: Mic,
  deepwork: Brain,
  writing: PenTool,
  general: Sparkles,
  custom: Zap
};

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
    timerPhase,
    setTimerPhase,
    selectedActivity,
    setSelectedActivity,
    customActivityTitle,
    setCustomActivityTitle,
    isRunning,
    liveSeconds,
    pomodoroTarget,
    setPomodoroTarget,
    sessionStartedAt,
    soundEnabled,
    setSoundEnabled,
    soundType,
    setSoundType,
    previewSound,
    scheduleCycle,
    startScheduleCycle,
    stopScheduleCycle,
    skipBreak,
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

  // Long-term Schedules state
  const [schedules, setSchedules] = useState([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isSoundPickerOpen, setIsSoundPickerOpen] = useState(false);

  // Statistics & History state
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [randomQuote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  const loadSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const res = await api.getStudySchedules();
      if (res.success && Array.isArray(res.data)) {
        setSchedules(res.data);
      }
    } catch (e) {
      console.error('Failed to load study schedules:', e);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    if (activeTab === 'schedules') {
      loadSchedules();
    }
  }, [activeTab]);

  const handleSaveSchedule = async (scheduleData) => {
    const res = await api.saveStudySchedule(scheduleData);
    if (res.success) {
      if (onAddToast) onAddToast(scheduleData.id ? 'Đã cập nhật lịch học!' : 'Đã tạo lịch học mới!');
      loadSchedules();
    } else {
      throw new Error(res.error || 'Thao tác thất bại');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch học này?')) return;
    try {
      const res = await api.deleteStudySchedule(id);
      if (res.success) {
        if (onAddToast) onAddToast('Đã xóa lịch học.');
        loadSchedules();
      }
    } catch (e) {
      alert('Lỗi xóa lịch học: ' + e.message);
    }
  };

  const handleToggleScheduleActive = async (schedule) => {
    try {
      const updated = { ...schedule, is_active: !schedule.is_active };
      const res = await api.saveStudySchedule(updated);
      if (res.success) {
        if (onAddToast) onAddToast(updated.is_active ? 'Đã bật lịch học!' : 'Đã tắt lịch học.');
        loadSchedules();
      }
    } catch (e) {}
  };

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
      const actMeta = getActivityMeta(selectedActivity, customActivityTitle);
      const resolvedTitle = customActivityTitle?.trim() || actMeta.label;
      const now = new Date();
      const startIso = sessionStartedAt || new Date(now.getTime() - liveSeconds * 1000).toISOString();

      const res = await api.saveStudySession({
        activity_type: selectedActivity,
        activity_title: resolvedTitle,
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
          onAddToast(`🎉 Đã lưu ${resolvedTitle} (${formatDurationHuman(liveSeconds)})! (+${xpEarned} XP)`);
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
    } catch (e) {
      alert('Lỗi xóa phiên học: ' + err.message);
    }
  };

  const currentActivity = getActivityMeta(selectedActivity, customActivityTitle);
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
          border: '1px solid var(--border-color)',
          gap: '0.25rem'
        }}>
          <button
            type="button"
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
                background: timerPhase === 'break' ? '#10b981' : '#22c55e',
                animation: 'pulse 1.5s infinite'
              }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'schedules' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'schedules' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <CalendarDays size={16} />
            <span>Lịch Học & Nghỉ Giữa Giờ</span>
            {scheduleCycle && (
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#0284c7',
                animation: 'pulse 1.5s infinite'
              }} />
            )}
          </button>

          <button
            type="button"
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
                background: timerPhase === 'break'
                  ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
            )}

            {/* Active Long-Term Schedule Cycle Banner */}
            {scheduleCycle && (
              <div style={{
                width: '100%',
                maxWidth: '540px',
                marginBottom: '1.25rem',
                padding: '0.85rem 1rem',
                borderRadius: '16px',
                background: timerPhase === 'break' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(2, 132, 199, 0.1)',
                border: `1.5px solid ${timerPhase === 'break' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(2, 132, 199, 0.35)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: timerPhase === 'break' ? '#10b981' : 'var(--accent-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    flexShrink: 0
                  }}>
                    {timerPhase === 'break' ? <Coffee size={18} /> : <CalendarDays size={18} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {scheduleCycle.title} • Hiệp {scheduleCycle.currentCycle}/{scheduleCycle.totalCycles}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: timerPhase === 'break' ? '#10b981' : 'var(--accent-primary)', fontWeight: 700 }}>
                      {timerPhase === 'break'
                        ? `☕ Giờ nghỉ giữa giờ (${scheduleCycle.breakDurationMinutes} phút)`
                        : `📚 Đang học hiệp ${scheduleCycle.currentCycle} (${scheduleCycle.studyDurationMinutes} phút)`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {timerPhase === 'break' && (
                    <button
                      type="button"
                      onClick={skipBreak}
                      className="btn-primary"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        background: '#10b981',
                        borderColor: '#10b981',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <SkipForward size={13} />
                      <span>Vào học ngay</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Bạn có muốn dừng ca học theo lịch này không?')) {
                        stopScheduleCycle();
                      }
                    }}
                    className="btn-secondary"
                    style={{
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    Dừng ca
                  </button>
                </div>
              </div>
            )}

            {/* Top Controls: Mode Switcher & Sound Ringtone Picker */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              maxWidth: '540px',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
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
                      resetTimer();
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
                      resetTimer();
                    }
                    setTimerMode('pomodoro');
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

              {/* Sound Ringtone Picker with Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsSoundPickerOpen(!isSoundPickerOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: 'var(--bg-tertiary)',
                    color: soundEnabled ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                  title="Cài đặt nhạc chuông báo hết giờ"
                >
                  <BellRing size={14} color={soundEnabled ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                  <span>{SOUND_OPTIONS.find(s => s.id === soundType)?.label || 'Chuông'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => previewSound(soundType)}
                  title="Nghe thử nhạc chuông"
                  style={{
                    padding: '0.35rem 0.6rem',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Volume2 size={13} />
                  <span>Nghe thử</span>
                </button>

                {isSoundPickerOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    zIndex: 100,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    padding: '0.75rem',
                    width: '270px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>🔔 Nhạc Chuông Báo Giờ</span>
                      <button
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: soundEnabled ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-tertiary)',
                          color: soundEnabled ? '#16a34a' : 'var(--text-muted)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {soundEnabled ? 'BẬT' : 'TẮT'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {SOUND_OPTIONS.map(s => {
                        const isSelected = soundType === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSoundType(s.id);
                              previewSound(s.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.45rem 0.6rem',
                              borderRadius: '8px',
                              background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                              cursor: 'pointer',
                              border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{s.emoji}</span>
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                  {s.label}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                previewSound(s.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                              title="Nghe thử"
                            >
                              <Volume2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pomodoro Preset Chips & Custom Time if Pomodoro mode */}
            {timerMode === 'pomodoro' && timerPhase === 'study' && (
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
                color: timerPhase === 'break' 
                  ? '#10b981' 
                  : (isRunning ? 'var(--text-primary)' : 'var(--text-secondary)'),
                textShadow: isRunning 
                  ? (timerPhase === 'break' ? '0 0 35px rgba(16, 185, 129, 0.3)' : '0 0 35px rgba(2, 132, 199, 0.25)') 
                  : 'none',
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
                background: timerPhase === 'break'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : (isRunning ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-tertiary)'),
                color: timerPhase === 'break'
                  ? '#10b981'
                  : (isRunning ? '#16a34a' : 'var(--text-muted)')
              }}>
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: timerPhase === 'break' ? '#10b981' : (isRunning ? '#22c55e' : 'var(--text-muted)')
                }} />
                <span>
                  {timerPhase === 'break'
                    ? `☕ Đang nghỉ giữa giờ (Hiệp ${scheduleCycle?.currentCycle || 1})`
                    : (isRunning 
                        ? (customActivityTitle ? `Đang thực hiện: ${customActivityTitle}` : `Đang ${currentActivity.label}...`)
                        : (elapsedSeconds > 0 ? 'Đang tạm dừng' : `Sẵn sàng: ${customActivityTitle || currentActivity.label}`))}
                </span>
                {timerMode === 'pomodoro' && isRunning && (
                  <span style={{ marginLeft: '4px', opacity: 0.85 }}>({pomodoroProgressPercent}%)</span>
                )}
              </div>

              {/* Relaxation Advice Box during break phase */}
              {timerPhase === 'break' && (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '0.6rem 1.1rem',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#10b981',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textAlign: 'center',
                  maxWidth: '480px'
                }}>
                  <span>💧</span>
                  <span>Hãy uống một ngụm nước, vươn vai thư giãn hoặc phóng tầm mắt ra xa để đôi mắt được nghỉ ngơi!</span>
                </div>
              )}
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
                    background: timerPhase === 'break'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #0284c7, #0ea5e9)'
                  }}
                >
                  <Play size={20} fill="currentColor" />
                  <span>
                    {timerPhase === 'break'
                      ? 'Tiếp Tục Nghỉ'
                      : (elapsedSeconds > 0 ? 'Tiếp Tục Học' : 'Bắt Đầu Học')}
                  </span>
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

              {/* During Break Phase: Skip Break Button */}
              {timerPhase === 'break' && (
                <button
                  type="button"
                  onClick={skipBreak}
                  className="btn-primary"
                  style={{
                    padding: '0.85rem 1.6rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: '16px',
                    background: '#0284c7',
                    borderColor: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <SkipForward size={18} />
                  <span>Vào Học Hiệp Kế Tiếp</span>
                </button>
              )}

              {/* Finish & Save Session Button (During Study Phase) */}
              {timerPhase === 'study' && elapsedSeconds > 0 && (
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
              {(elapsedSeconds > 0 || timerPhase === 'break') && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                🎯 Bạn đang làm gì? (Chọn loại công việc & học tập để phân loại):
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Hỗ trợ cày code, làm việc, ngoại ngữ & deep work
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.6rem'
            }}>
              {ACTIVITIES.map(act => {
                const isSelected = selectedActivity === act.id;
                const Icon = ACTIVITY_ICONS[act.id] || Sparkles;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setSelectedActivity(act.id)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '14px',
                      border: '1.5px solid',
                      borderColor: isSelected ? act.color : 'var(--border-color)',
                      background: isSelected ? `${act.color}15` : 'var(--bg-tertiary)',
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
                      background: `${act.color}20`,
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

            {/* Custom Task / Goal Input & Quick Chips */}
            <div style={{
              marginTop: '0.85rem',
              background: 'var(--bg-secondary)',
              padding: '0.9rem 1.1rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>✏️ Tên công việc / mục tiêu cụ thể:</span>
                  {customActivityTitle && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                      «{customActivityTitle}»
                    </span>
                  )}
                </label>
                {customActivityTitle && (
                  <button
                    type="button"
                    onClick={() => setCustomActivityTitle('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    ✕ Xóa tên cụ thể
                  </button>
                )}
              </div>

              <input
                type="text"
                value={customActivityTitle}
                onChange={(e) => setCustomActivityTitle(e.target.value)}
                placeholder={
                  selectedActivity === 'coding'
                    ? 'VD: Code backend API, Fix bug giỏ hàng, Luyện thuật toán LeetCode...'
                    : selectedActivity === 'work'
                    ? 'VD: Soạn báo cáo dự án, Xử lý email khách hàng, Lên kế hoạch tuần...'
                    : selectedActivity === 'deepwork'
                    ? 'VD: Nghiên cứu kiến trúc hệ thống, Đọc tài liệu RFC...'
                    : selectedActivity === 'writing'
                    ? 'VD: Viết bài blog kỹ thuật, Soạn tài liệu API...'
                    : 'VD: Nhập tên công việc cụ thể bạn muốn hiển thị trên đồng hồ...'
                }
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              />

              {/* Quick Suggestion Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 700 }}>Gợi ý nhanh:</span>
                {(selectedActivity === 'coding' ? [
                  '💻 Code Backend API',
                  '🐛 Fix Bug Thanh Toán',
                  '🚀 Giải Thuật LeetCode',
                  '🎨 Thiết Kế Giao Diện UI',
                  '📖 Đọc Tài Liệu Kỹ Thuật'
                ] : selectedActivity === 'work' ? [
                  '💼 Xử Lý Task Dự Án',
                  '📑 Soạn Báo Cáo',
                  '📬 Trả Lời Khách Hàng',
                  '📊 Lập Kế Hoạch Sprint'
                ] : selectedActivity === 'deepwork' ? [
                  '🧠 Deep Work Không Điện Thoại',
                  '🔥 Tối Ưu Hiệu Năng DB',
                  '🎯 Sprint Tập Trung 60p'
                ] : selectedActivity === 'writing' ? [
                  '✍️ Viết Bài Chia Sẻ',
                  '📑 Soạn Tài Liệu Kỹ Thuật',
                  '🌐 Dịch Thuật Bài Viết'
                ] : [
                  '💻 Lập Trình & Code',
                  '💼 Xử Lý Công Việc',
                  '📚 Học 20 Từ Vựng Mới',
                  '🎴 Ôn 50 Flashcards',
                  '🎯 Giải Đề Kiểm Tra'
                ]).map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCustomActivityTitle(chip)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '8px',
                      background: customActivityTitle === chip ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: customActivityTitle === chip ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
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

      {/* 3. TAB 2: LONG-TERM STUDY SCHEDULES & BREAK PLANNER */}
      {activeTab === 'schedules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Live running timer notification banner on schedules tab */}
          {(liveSeconds > 0 || isRunning) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              background: isRunning ? (timerPhase === 'break' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 132, 199, 0.1)') : 'var(--bg-secondary)',
              border: isRunning ? (timerPhase === 'break' ? '1.5px solid #10b981' : '1.5px solid var(--accent-primary)') : '1px solid var(--border-color)',
              boxShadow: isRunning ? '0 4px 20px rgba(0, 0, 0, 0.05)' : 'none',
              animation: 'fadeInUp 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{timerPhase === 'break' ? '☕' : currentActivity.emoji}</span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: timerPhase === 'break' ? '#10b981' : (isRunning ? '#22c55e' : '#f59e0b'),
                      animation: isRunning ? 'pulse 1.5s infinite' : 'none'
                    }} />
                    <span>
                      {timerPhase === 'break'
                        ? `Đang trong giờ nghỉ giữa giờ: ${formatTime(displayTimeSeconds)}`
                        : `Đồng hồ đang ${isRunning ? 'chạy' : 'tạm dừng'}: ${currentActivity.label} (${formatTime(displayTimeSeconds)})`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {scheduleCycle ? `Ca học: "${scheduleCycle.title}" • Hiệp ${scheduleCycle.currentCycle}/${scheduleCycle.totalCycles}` : 'Phiên học tự do'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('timer')}
                className="btn-primary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              >
                <span>Xem đồng hồ</span>
              </button>
            </div>
          )}

          {/* Intro & Create Schedule Banner */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <CalendarDays size={22} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Kế Hoạch Ca Học Dài Hạn & Nghỉ Giữa Giờ
                </h3>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
                Tạo các ca học cố định (Ví dụ: Từ <b>20:00</b> đến <b>22:30</b>). Hệ thống sẽ tự động dẫn dắt bạn qua các hiệp học (VD: 25 phút) xen kẽ chu kỳ nghỉ giữa giờ (VD: 5 phút), kèm chuông báo thức tỉnh tự động.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSchedule(null);
                setIsScheduleModalOpen(true);
              }}
              className="btn-primary glow-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.75rem 1.4rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                background: 'linear-gradient(135deg, #0284c7, #0ea5e9)'
              }}
            >
              <Plus size={18} />
              <span>Tạo Lịch Học Dài Hạn Mới</span>
            </button>
          </div>

          {/* Empty State */}
          {schedules.length === 0 && !isLoadingSchedules && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '20px',
              border: '1px dashed var(--border-color)',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(2, 132, 199, 0.1)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CalendarDays size={32} />
              </div>
              <div style={{ maxWidth: '440px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
                  Chưa có lịch học dài hạn nào
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Hãy thiết lập ca học đầu tiên của bạn (Ví dụ: 20:00 - 22:30 mỗi tối) để ứng dụng tự động kiểm soát chu kỳ học và nghỉ giữa giờ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingSchedule(null);
                  setIsScheduleModalOpen(true);
                }}
                className="btn-primary"
                style={{
                  padding: '0.65rem 1.3rem',
                  fontSize: '0.88rem',
                  borderRadius: '10px'
                }}
              >
                ➕ Thiết Lập Lịch Học Ngay
              </button>
            </div>
          )}

          {/* Schedule Cards Grid */}
          {schedules.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem'
            }}>
              {schedules.map(sch => {
                const isCurrentActive = scheduleCycle?.scheduleId === sch.id;
                const soundMeta = SOUND_OPTIONS.find(s => s.id === sch.sound_type) || SOUND_OPTIONS[0];

                let totalMins = 150;
                try {
                  const [sh, sm] = (sch.start_time || '20:00').split(':').map(Number);
                  const [eh, em] = (sch.end_time || '22:30').split(':').map(Number);
                  let diff = (eh * 60 + em) - (sh * 60 + sm);
                  if (diff <= 0) diff += 24 * 60;
                  totalMins = diff;
                } catch (e) {}

                const cycleMins = (sch.study_duration_minutes || 25) + (sch.break_duration_minutes || 5);
                const cyclesCount = Math.max(1, Math.floor(totalMins / cycleMins));

                const allDays = [
                  { id: 'mon', label: 'T2' },
                  { id: 'tue', label: 'T3' },
                  { id: 'wed', label: 'T4' },
                  { id: 'thu', label: 'T5' },
                  { id: 'fri', label: 'T6' },
                  { id: 'sat', label: 'T7' },
                  { id: 'sun', label: 'CN' }
                ];
                const activeDays = Array.isArray(sch.days_of_week) ? sch.days_of_week : [];

                return (
                  <div
                    key={sch.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '20px',
                      border: isCurrentActive 
                        ? '2px solid var(--accent-primary)' 
                        : (sch.is_active ? '1px solid var(--border-color)' : '1px dashed var(--border-color)'),
                      opacity: sch.is_active ? 1 : 0.75,
                      boxShadow: isCurrentActive ? '0 8px 25px rgba(2, 132, 199, 0.2)' : 'var(--shadow-sm)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Card Header: Title & Switch */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                              {sch.title}
                            </h4>
                            {sch.activity_type && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '6px',
                                background: `${getActivityMeta(sch.activity_type).color}15`,
                                color: getActivityMeta(sch.activity_type).color,
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}>
                                <span>{getActivityMeta(sch.activity_type).emoji}</span>
                                <span>{getActivityMeta(sch.activity_type).label}</span>
                              </span>
                            )}
                            {isCurrentActive && (
                              <span style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '6px',
                                background: 'rgba(2, 132, 199, 0.15)',
                                color: 'var(--accent-primary)',
                                fontSize: '0.68rem',
                                fontWeight: 800
                              }}>
                                Đang chạy
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Tổng ca: {Math.floor(totalMins / 60)}h{totalMins % 60 > 0 ? `${totalMins % 60}p` : ''} ({cyclesCount} hiệp học)
                          </span>
                        </div>

                        {/* Active toggle button */}
                        <button
                          type="button"
                          onClick={() => handleToggleScheduleActive(sch)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '20px',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: sch.is_active ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-tertiary)',
                            color: sch.is_active ? '#16a34a' : 'var(--text-muted)'
                          }}
                          title={sch.is_active ? 'Nhấn để tạm tắt lịch này' : 'Nhấn để bật lịch này'}
                        >
                          {sch.is_active ? '✓ Đang bật' : '✕ Đang tắt'}
                        </button>
                      </div>

                      {/* Time Frame Display */}
                      <div style={{
                        background: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={16} color="var(--accent-primary)" />
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace' }}>
                            {sch.start_time || '20:00'} ➔ {sch.end_time || '22:30'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {totalMins} phút
                        </span>
                      </div>

                      {/* Study vs Break Pill Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
                        <div style={{
                          padding: '0.5rem 0.65rem',
                          borderRadius: '10px',
                          background: 'rgba(2, 132, 199, 0.08)',
                          border: '1px solid rgba(2, 132, 199, 0.18)',
                          fontSize: '0.78rem'
                        }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Học mỗi hiệp:</span>
                          <strong style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
                            📚 {sch.study_duration_minutes} phút
                          </strong>
                        </div>

                        <div style={{
                          padding: '0.5rem 0.65rem',
                          borderRadius: '10px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontSize: '0.78rem'
                        }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Nghỉ giữa giờ:</span>
                          <strong style={{ color: '#10b981', fontSize: '0.9rem' }}>
                            ☕ {sch.break_duration_minutes} phút
                          </strong>
                        </div>
                      </div>

                      {/* Days of week display */}
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.85rem' }}>
                        {allDays.map(d => {
                          const isActive = activeDays.includes(d.id);
                          return (
                            <span
                              key={d.id}
                              style={{
                                width: '28px',
                                height: '24px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: isActive ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-tertiary)',
                                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                                border: `1px solid ${isActive ? 'rgba(2, 132, 199, 0.3)' : 'transparent'}`
                              }}
                            >
                              {d.label}
                            </span>
                          );
                        })}
                      </div>

                      {/* Sound info tag */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.74rem',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-tertiary)',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        marginBottom: '1rem'
                      }}>
                        <span>{soundMeta.emoji}</span>
                        <span>Chuông: {soundMeta.label}</span>
                        <button
                          type="button"
                          onClick={() => previewSound(sch.sound_type || 'melodic')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                          title="Nghe thử chuông này"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSchedule(sch);
                            setIsScheduleModalOpen(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Chỉnh sửa lịch học"
                        >
                          <Edit2 size={13} />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(sch.id)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', color: '#ef4444' }}
                          title="Xóa lịch học này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {isCurrentActive ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab('timer')}
                          className="btn-primary"
                          style={{
                            padding: '0.45rem 1rem',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: '#10b981',
                            borderColor: '#10b981'
                          }}
                        >
                          <span>Đang chạy ➔ Xem</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            startScheduleCycle(sch);
                            setActiveTab('timer');
                          }}
                          className="btn-primary glow-hover"
                          style={{
                            padding: '0.45rem 1rem',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Play size={14} fill="currentColor" />
                          <span>Bắt Đầu Ca Học</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 3: STUDY TIME ANALYTICS & STATISTICS DASHBOARD */}
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

          {/* Multi-Period Activity Chart (Tuần này, Tháng này, 30 ngày qua, Tổng thời gian) */}
          {stats?.periodsData ? (
            <ActivityHistoryChart 
              periodsData={stats.periodsData} 
              defaultPeriod="all"
              title="Biểu Đồ Thời Gian Học & Hoạt Động"
            />
          ) : (
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
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.5rem',
                height: '180px',
                paddingTop: '1.5rem',
                borderBottom: '1px solid var(--border-color)'
              }}>
                {stats?.dailyHistory?.map((day) => {
                  const maxMinutes = Math.max(60, ...stats.dailyHistory.map(d => d.duration_minutes));
                  const heightPercent = maxMinutes > 0 ? Math.max(4, Math.round((day.duration_minutes / maxMinutes) * 100)) : 4;
                  return (
                    <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', maxWidth: '28px', height: `${heightPercent}%`, borderRadius: '6px 6px 2px 2px', background: day.isToday ? 'linear-gradient(180deg, #0284c7, #38bdf8)' : 'var(--bg-tertiary)' }} />
                      <span style={{ fontSize: '0.7rem', marginTop: '6px' }}>{day.shortDate}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                      const act = getActivityMeta(s.activity_type, s.activity_title);
                      const displayTitle = s.activity_title || act.label;
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
                              gap: '0.35rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '8px',
                              background: `${act.color}15`,
                              color: act.color,
                              fontWeight: 700,
                              fontSize: '0.78rem'
                            }}>
                              <span>{act.emoji}</span>
                              <span>{displayTitle}</span>
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
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: currentActivity.color,
                  marginTop: '4px'
                }}>
                  <span>{currentActivity.emoji}</span>
                  <span>{customActivityTitle ? `${customActivityTitle} • ${currentActivity.label}` : currentActivity.label}</span>
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

      {/* 5. STUDY SCHEDULE SETUP & EDIT MODAL */}
      <StudyScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
        schedule={editingSchedule}
      />
    </div>
  );
}
