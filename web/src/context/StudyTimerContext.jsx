import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const StudyTimerContext = createContext(null);
const STORAGE_KEY = 'linguavault_active_timer';

// Web Audio API Chime
export function playChime() {
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

export function StudyTimerProvider({ children, onAddToast }) {
  const [timerMode, setTimerMode] = useState('stopwatch'); // 'stopwatch' | 'pomodoro'
  const [selectedActivity, setSelectedActivity] = useState('vocab');
  const [isRunning, setIsRunning] = useState(false);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [runStartTime, setRunStartTime] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [pomodoroTarget, setPomodoroTargetState] = useState(25 * 60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveSeconds, setLiveSeconds] = useState(0);

  // 1. Restore state from localStorage once on boot
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setTimerMode(parsed.timerMode || 'stopwatch');
          setSelectedActivity(parsed.selectedActivity || 'vocab');
          setPomodoroTargetState(parsed.pomodoroTarget || 25 * 60);
          setSessionStartedAt(parsed.sessionStartedAt || null);

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
      if (liveSeconds > 0 || isRunning) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          timerMode,
          selectedActivity,
          isRunning,
          accumulatedSeconds,
          runStartTime,
          sessionStartedAt,
          pomodoroTarget
        }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }, [timerMode, selectedActivity, isRunning, accumulatedSeconds, runStartTime, sessionStartedAt, pomodoroTarget, liveSeconds]);

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
          setIsRunning(false);
          setAccumulatedSeconds(pomodoroTarget);
          setLiveSeconds(pomodoroTarget);
          setRunStartTime(null);
          if (soundEnabled) playChime();
          if (onAddToast) onAddToast('🍅 Chúc mừng bạn đã hoàn thành phiên Pomodoro!');
        }
      };

      updateTick();
      interval = setInterval(updateTick, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, runStartTime, accumulatedSeconds, timerMode, pomodoroTarget, soundEnabled, onAddToast]);

  const startTimer = () => {
    const now = Date.now();
    if (!sessionStartedAt) {
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
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <StudyTimerContext.Provider value={{
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
