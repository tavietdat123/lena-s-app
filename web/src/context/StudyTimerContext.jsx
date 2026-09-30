import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const StudyTimerContext = createContext(null);
const STORAGE_KEY = 'linguavault_active_timer';
const SOUND_KEY = 'linguavault_timer_sound';

export const SOUND_OPTIONS = [
  { id: 'melodic', label: 'Chuông Ngân Vang', emoji: '🔔', desc: 'Giai điệu 5 nốt tươi vui, thanh lịch' },
  { id: 'alarm', label: 'Báo Thức Dứt Khoát', emoji: '⏰', desc: 'Tiếng beep-beep đôi 3 lần rõ ràng, dễ nghe từ xa' },
  { id: 'zen', label: 'Chuông Thiền Zen', emoji: '🧘', desc: 'Âm thanh bát xoay Tây Tạng ngân dài, tĩnh tâm' },
  { id: 'fanfare', label: 'Kèn Khải Hoàn', emoji: '🎺', desc: 'Hợp âm chiến thắng mừng hoàn thành phiên' }
];

export const ACTIVITIES = [
  { id: 'coding', label: 'Lập Trình & Học Code', emoji: '💻', color: '#6366f1' },
  { id: 'work', label: 'Công Việc & Dự Án', emoji: '💼', color: '#059669' },
  { id: 'vocab', label: 'Học Từ Vựng Mới', emoji: '📚', color: '#0284c7' },
  { id: 'flashcard', label: 'Ôn Flashcards (SRS)', emoji: '🎴', color: '#8b5cf6' },
  { id: 'reader', label: 'Đọc Hiểu & Ghi Chú', emoji: '📖', color: '#10b981' },
  { id: 'quiz', label: 'Luyện Đề Quiz Trắc Nghiệm', emoji: '🎯', color: '#f59e0b' },
  { id: 'speaking', label: 'Luyện Phát Âm & Nói', emoji: '🎙️', color: '#ec4899' },
  { id: 'deepwork', label: 'Deep Work Tập Trung', emoji: '🧠', color: '#d97706' },
  { id: 'writing', label: 'Viết Lách & Dịch Thuật', emoji: '✍️', color: '#0ea5e9' },
  { id: 'general', label: 'Tự Học & Khác', emoji: '💡', color: '#06b6d4' },
  { id: 'custom', label: 'Tự Đặt Tên...', emoji: '⚡', color: '#8b5cf6' }
];

export function getActivityMeta(activityId, customTitle = '') {
  const found = ACTIVITIES.find(a => a.id === activityId);
  if (found) {
    if (activityId === 'custom' && customTitle) {
      return { ...found, label: customTitle };
    }
    return found;
  }
  return {
    id: activityId || 'custom',
    label: customTitle || activityId || 'Công việc tự do',
    emoji: '⚡',
    color: '#6366f1'
  };
}

// High-Fidelity Web Audio Sound Synthesizer
export function playChime(soundType = 'melodic') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (soundType === 'alarm') {
      // 3 double-beeps: pip-pip, pip-pip, pip-pip
      [0, 0.35, 0.7].forEach((groupOffset) => {
        [0, 0.12].forEach((subOffset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now + groupOffset + subOffset);
          gain.gain.setValueAtTime(0.28, now + groupOffset + subOffset);
          gain.gain.setValueAtTime(0, now + groupOffset + subOffset + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + groupOffset + subOffset);
          osc.stop(now + groupOffset + subOffset + 0.08);
        });
      });
    } else if (soundType === 'zen') {
      // Tibetan singing bowl resonant harmonic decay
      const freqs = [216, 432, 648, 864];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        const amp = 0.3 / (idx + 1);
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3.0);
      });
    } else if (soundType === 'fanfare') {
      // Victory Fanfare (G4, C5, E5, G5)
      const notes = [
        { f: 392.00, t: 0, d: 0.14 },
        { f: 523.25, t: 0.15, d: 0.14 },
        { f: 659.25, t: 0.3, d: 0.2 },
        { f: 783.99, t: 0.52, d: 0.9 }
      ];
      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.32, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d);
      });
    } else {
      // Melodic Chime (5 harmonious notes: C5, E5, G5, B5, C6)
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.13);
        gain.gain.setValueAtTime(0.28, now + i * 0.13);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + i * 0.13 + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.13);
        osc.stop(now + i * 0.13 + 0.65);
      });
    }
  } catch (e) {
    console.warn('Web Audio playback error:', e);
  }
}

export function StudyTimerProvider({ children, onAddToast }) {
  const [timerMode, setTimerMode] = useState('stopwatch'); // 'stopwatch' | 'pomodoro'
  const [timerPhase, setTimerPhase] = useState('study'); // 'study' | 'break'
  const [selectedActivity, setSelectedActivity] = useState('coding');
  const [customActivityTitle, setCustomActivityTitle] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [runStartTime, setRunStartTime] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [pomodoroTarget, setPomodoroTargetState] = useState(25 * 60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) || 'melodic';
    } catch (e) {
      return 'melodic';
    }
  });
  const [liveSeconds, setLiveSeconds] = useState(0);

  // Active Long-Term Schedule Cycle State
  const [scheduleCycle, setScheduleCycle] = useState(null);

  const setSoundTypePersisted = (type) => {
    setSoundType(type);
    try {
      localStorage.setItem(SOUND_KEY, type);
    } catch (e) {}
  };

  const previewSound = (type = soundType) => {
    playChime(type);
  };

  // 1. Restore state from localStorage once on app boot
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setTimerMode(parsed.timerMode || 'stopwatch');
          setTimerPhase(parsed.timerPhase || 'study');
          setSelectedActivity(parsed.selectedActivity || 'coding');
          setCustomActivityTitle(parsed.customActivityTitle || '');
          setPomodoroTargetState(parsed.pomodoroTarget || 25 * 60);
          setSessionStartedAt(parsed.sessionStartedAt || null);
          setScheduleCycle(parsed.scheduleCycle || null);

          const acc = Number(parsed.accumulatedSeconds) || 0;
          if (parsed.isRunning && parsed.runStartTime) {
            const now = Date.now();
            const elapsed = Math.max(0, Math.floor((now - Number(parsed.runStartTime)) / 1000));
            const total = acc + elapsed;
            setAccumulatedSeconds(total);
            setLiveSeconds(total);
            setRunStartTime(now);
            setIsRunning(true);
          } else {
            setAccumulatedSeconds(acc);
            setLiveSeconds(acc);
            setIsRunning(false);
            setRunStartTime(null);
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore active timer:', e);
    }
  }, []);

  // 2. Persist state to localStorage whenever changed
  useEffect(() => {
    try {
      if (liveSeconds > 0 || isRunning || scheduleCycle) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          timerMode,
          timerPhase,
          selectedActivity,
          customActivityTitle,
          isRunning,
          accumulatedSeconds,
          runStartTime,
          sessionStartedAt,
          pomodoroTarget,
          scheduleCycle
        }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }, [timerMode, timerPhase, selectedActivity, customActivityTitle, isRunning, accumulatedSeconds, runStartTime, sessionStartedAt, pomodoroTarget, liveSeconds, scheduleCycle]);

  // 3. High-precision ticker based on Date.now() - immune to tab throttle
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      const updateTick = () => {
        const segment = runStartTime ? Math.max(0, Math.floor((Date.now() - runStartTime) / 1000)) : 0;
        const total = accumulatedSeconds + segment;
        setLiveSeconds(total);

        // Pomodoro target check
        if (timerMode === 'pomodoro' && total >= pomodoroTarget) {
          if (soundEnabled) playChime(soundType);

          if (timerPhase === 'study') {
            // Study phase completed
            if (scheduleCycle) {
              // Transition to break phase
              const isLongBreak = (scheduleCycle.currentCycle % scheduleCycle.cyclesBeforeLongBreak) === 0;
              const breakMins = isLongBreak ? scheduleCycle.longBreakMinutes : scheduleCycle.breakDurationMinutes;
              const breakSec = breakMins * 60;

              setTimerPhase('break');
              setAccumulatedSeconds(0);
              setLiveSeconds(0);
              setPomodoroTargetState(breakSec);

              if (scheduleCycle.autoStartBreaks) {
                const now = Date.now();
                setRunStartTime(now);
                setIsRunning(true);
                if (onAddToast) onAddToast(`☕ Hoàn thành hiệp ${scheduleCycle.currentCycle}! Bắt đầu nghỉ giải lao ${breakMins} phút.`);
              } else {
                setIsRunning(false);
                setRunStartTime(null);
                if (onAddToast) onAddToast(`☕ Hoàn thành hiệp ${scheduleCycle.currentCycle}! Hãy bấm bắt đầu ${breakMins} phút nghỉ giải lao.`);
              }
            } else {
              // Standard Pomodoro completed
              setIsRunning(false);
              setAccumulatedSeconds(pomodoroTarget);
              setLiveSeconds(pomodoroTarget);
              setRunStartTime(null);
              if (onAddToast) onAddToast('🍅 Chúc mừng bạn đã hoàn thành phiên Pomodoro!');
            }
          } else {
            // Break phase completed
            if (scheduleCycle) {
              const nextCycle = scheduleCycle.currentCycle + 1;
              if (nextCycle <= scheduleCycle.totalCycles) {
                // Next study cycle
                setScheduleCycle(prev => ({ ...prev, currentCycle: nextCycle }));
                setTimerPhase('study');
                setAccumulatedSeconds(0);
                setLiveSeconds(0);
                setPomodoroTargetState(scheduleCycle.studyDurationMinutes * 60);

                if (scheduleCycle.autoStartNextSession) {
                  const now = Date.now();
                  setRunStartTime(now);
                  setIsRunning(true);
                  if (onAddToast) onAddToast(`🔔 Hết giờ nghỉ giữa giờ! Tự động bắt đầu hiệp ${nextCycle}/${scheduleCycle.totalCycles}.`);
                } else {
                  setIsRunning(false);
                  setRunStartTime(null);
                  if (onAddToast) onAddToast(`🔔 Hết giờ nghỉ giữa giờ! Bấm Bắt Đầu để vào hiệp ${nextCycle}/${scheduleCycle.totalCycles}.`);
                }
              } else {
                // Completed whole schedule
                setIsRunning(false);
                setRunStartTime(null);
                setAccumulatedSeconds(0);
                setLiveSeconds(0);
                setScheduleCycle(null);
                setTimerPhase('study');
                if (onAddToast) onAddToast(`🎉 Chúc mừng bạn đã hoàn thành xuất sắc toàn bộ ca học (${scheduleCycle.totalCycles} hiệp)!`);
              }
            } else {
              setTimerPhase('study');
              setIsRunning(false);
              setRunStartTime(null);
              setAccumulatedSeconds(0);
              setLiveSeconds(0);
              if (onAddToast) onAddToast('🔔 Hết giờ nghỉ giải lao!');
            }
          }
        }
      };

      updateTick();
      interval = setInterval(updateTick, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, runStartTime, accumulatedSeconds, timerMode, timerPhase, pomodoroTarget, soundEnabled, soundType, scheduleCycle, onAddToast]);

  const startTimer = () => {
    const now = Date.now();
    if (!sessionStartedAt && timerPhase === 'study') {
      setSessionStartedAt(new Date(now).toISOString());
    }
    setRunStartTime(now);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    if (isRunning && runStartTime) {
      const segment = Math.max(0, Math.floor((Date.now() - runStartTime) / 1000));
      const total = accumulatedSeconds + segment;
      setAccumulatedSeconds(total);
      setLiveSeconds(total);
    }
    setIsRunning(false);
    setRunStartTime(null);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRunStartTime(null);
    setAccumulatedSeconds(0);
    setLiveSeconds(0);
    setSessionStartedAt(null);
    setTimerPhase('study');
    setScheduleCycle(null);
    setCustomActivityTitle('');
    localStorage.removeItem(STORAGE_KEY);
  };

  const setPomodoroTarget = (seconds) => {
    if (isRunning) return;
    setPomodoroTargetState(seconds);
    setAccumulatedSeconds(0);
    setLiveSeconds(0);
  };

  const clearSessionAfterSave = () => {
    setIsRunning(false);
    setRunStartTime(null);
    setAccumulatedSeconds(0);
    setLiveSeconds(0);
    setSessionStartedAt(null);
    setTimerPhase('study');
    setCustomActivityTitle('');
    localStorage.removeItem(STORAGE_KEY);
  };

  // Launch structured study & break cycle from long-term schedule
  const startScheduleCycle = (schedule) => {
    const studyMins = Number(schedule.study_duration_minutes) || 25;
    const breakMins = Number(schedule.break_duration_minutes) || 5;
    const longBreakMins = Number(schedule.long_break_minutes) || 15;
    const cycleMins = studyMins + breakMins;

    // Calculate total duration between start_time and end_time (e.g. 20:00 -> 22:30 = 150m)
    let totalMinutes = 120;
    try {
      const [sh, sm] = (schedule.start_time || '20:00').split(':').map(Number);
      const [eh, em] = (schedule.end_time || '22:30').split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff <= 0) diff += 24 * 60; // Cross midnight
      if (diff > 0) totalMinutes = diff;
    } catch (e) {}

    const totalCycles = Math.max(1, Math.floor(totalMinutes / cycleMins));

    const cycleData = {
      scheduleId: schedule.id,
      title: schedule.title,
      activityType: schedule.activity_type || 'general',
      currentCycle: 1,
      totalCycles,
      studyDurationMinutes: studyMins,
      breakDurationMinutes: breakMins,
      longBreakMinutes: longBreakMins,
      cyclesBeforeLongBreak: Number(schedule.cycles_before_long_break) || 4,
      autoStartBreaks: schedule.auto_start_breaks !== false,
      autoStartNextSession: false
    };

    setScheduleCycle(cycleData);
    setTimerMode('pomodoro');
    setTimerPhase('study');
    setPomodoroTargetState(studyMins * 60);
    setAccumulatedSeconds(0);
    setLiveSeconds(0);
    if (schedule.sound_type) {
      setSoundTypePersisted(schedule.sound_type);
    }
    if (schedule.activity_type) {
      setSelectedActivity(schedule.activity_type);
    }
    const now = Date.now();
    setSessionStartedAt(new Date(now).toISOString());
    setRunStartTime(now);
    setIsRunning(true);

    if (onAddToast) {
      onAddToast(`🚀 Bắt đầu ca học "${schedule.title}": Hiệp 1/${totalCycles} (${studyMins}p học, nghỉ giữa giờ ${breakMins}p)`);
    }
  };

  const stopScheduleCycle = () => {
    setScheduleCycle(null);
    setTimerPhase('study');
    pauseTimer();
  };

  const skipBreak = () => {
    if (timerPhase !== 'break' || !scheduleCycle) return;
    const nextCycle = scheduleCycle.currentCycle + 1;
    if (nextCycle <= scheduleCycle.totalCycles) {
      setScheduleCycle(prev => ({ ...prev, currentCycle: nextCycle }));
      setTimerPhase('study');
      setAccumulatedSeconds(0);
      setLiveSeconds(0);
      setPomodoroTargetState(scheduleCycle.studyDurationMinutes * 60);
      const now = Date.now();
      setRunStartTime(now);
      setIsRunning(true);
      if (onAddToast) onAddToast(`⏩ Đã bỏ qua nghỉ giữa giờ, bắt đầu hiệp ${nextCycle}/${scheduleCycle.totalCycles}!`);
    } else {
      stopScheduleCycle();
      resetTimer();
      if (onAddToast) onAddToast('🎉 Đã hoàn thành toàn bộ ca học!');
    }
  };

  return (
    <StudyTimerContext.Provider value={{
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
      setSoundType: setSoundTypePersisted,
      previewSound,
      scheduleCycle,
      startScheduleCycle,
      stopScheduleCycle,
      skipBreak,
      startTimer,
      pauseTimer,
      resetTimer,
      clearSessionAfterSave
    }}>
      {children}
    </StudyTimerContext.Provider>
  );
}

export function useStudyTimer() {
  const context = useContext(StudyTimerContext);
  if (!context) {
    throw new Error('useStudyTimer must be used within a StudyTimerProvider');
  }
  return context;
}
