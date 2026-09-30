import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, Maximize2, X, Check } from 'lucide-react';
import { useStudyTimer, getActivityMeta, formatTime } from '../../context/StudyTimerContext';

export default function GlobalTimerBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  const {
    timerMode,
    timerPhase,
    scheduleCycle,
    selectedActivity,
    customActivityTitle,
    isRunning,
    liveSeconds,
    pomodoroTarget,
    isCompletedAutoSaved,
    lastSavedSession,
    startTimer,
    pauseTimer
  } = useStudyTimer();

  // If user is already on the /timer page, or timer is 0 and not running and not auto-saved, or minimized: don't show
  const isPomodoroCompleted = timerMode === 'pomodoro' && isCompletedAutoSaved;
  if (location.pathname === '/timer' || isMinimized || (liveSeconds === 0 && !isRunning && !isPomodoroCompleted)) {
    return null;
  }

  const isBreak = timerPhase === 'break';
  const meta = getActivityMeta(selectedActivity, customActivityTitle);
  const badgeLabel = isPomodoroCompleted
    ? 'Đã tự động lưu'
    : (isBreak 
        ? (scheduleCycle ? `Nghỉ (Hiệp ${scheduleCycle.currentCycle})` : 'Nghỉ giữa giờ') 
        : (customActivityTitle?.trim() || meta.label));
  const badgeEmoji = isPomodoroCompleted ? '✅' : (isBreak ? '☕' : meta.emoji);
  const badgeColor = isPomodoroCompleted ? '#16a34a' : (isBreak ? '#10b981' : meta.color);

  const displaySeconds = timerMode === 'pomodoro'
    ? Math.max(0, pomodoroTarget - liveSeconds)
    : liveSeconds;

  const handleTogglePlay = (e) => {
    e.stopPropagation();
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  return (
    <div
      onClick={() => navigate('/timer')}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: 'var(--bg-secondary)',
        border: isPomodoroCompleted ? '1.5px solid #22c55e' : '1px solid var(--border-color)',
        borderRadius: '50px',
        padding: '0.45rem 0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        boxShadow: isPomodoroCompleted ? '0 8px 30px rgba(34, 197, 94, 0.28)' : '0 8px 30px rgba(0, 0, 0, 0.22)',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        animation: 'fadeInUp 0.3s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Activity / Break / Auto-saved badge */}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.78rem',
        fontWeight: 800,
        color: badgeColor,
        background: `${badgeColor}20`,
        padding: '0.2rem 0.55rem',
        borderRadius: '20px',
        border: isBreak || isPomodoroCompleted ? `1px solid ${badgeColor}40` : 'none'
      }}>
        <span>{badgeEmoji}</span>
        <span>{badgeLabel}</span>
      </span>

      {/* Timer clock with blinking dot */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: '0.95rem',
        fontWeight: 900,
        color: 'var(--text-primary)'
      }}>
        <span style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: isPomodoroCompleted ? '#22c55e' : (isRunning ? '#22c55e' : '#f59e0b'),
          animation: isRunning ? 'pulse 1.5s infinite' : 'none'
        }} />
        <span>{isPomodoroCompleted ? `+${lastSavedSession?.xpEarned || 20} XP` : formatTime(displaySeconds)}</span>
      </div>

      {/* Action buttons inside pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={(e) => e.stopPropagation()}>
        {!isPomodoroCompleted && (
          <button
            type="button"
            onClick={handleTogglePlay}
            className="btn-icon"
            style={{ width: '28px', height: '28px', background: 'var(--bg-tertiary)', borderRadius: '50%' }}
            title={isRunning ? 'Tạm dừng' : 'Tiếp tục'}
          >
            {isRunning ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/timer')}
          className="btn-icon"
          style={{ width: '28px', height: '28px', background: 'var(--bg-tertiary)', borderRadius: '50%' }}
          title="Mở đồng hồ bấm giờ"
        >
          <Maximize2 size={13} />
        </button>

        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="btn-icon"
          style={{ width: '24px', height: '24px', color: 'var(--text-muted)' }}
          title="Ẩn thanh bấm giờ"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
