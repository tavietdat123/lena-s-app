import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, Maximize2, X } from 'lucide-react';
import { useStudyTimer } from '../../context/StudyTimerContext';

const ACTIVITIES = [
  { id: 'vocab', label: 'Học Từ Vựng', emoji: '📚', color: '#0284c7' },
  { id: 'flashcard', label: 'Flashcards', emoji: '🎴', color: '#8b5cf6' },
  { id: 'reader', label: 'Đọc Hiểu', emoji: '📖', color: '#10b981' },
  { id: 'quiz', label: 'Quiz', emoji: '🎯', color: '#f59e0b' },
  { id: 'speaking', label: 'Speaking', emoji: '🎙️', color: '#ec4899' },
  { id: 'general', label: 'Tự Học', emoji: '💡', color: '#06b6d4' }
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

export default function GlobalTimerBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  const {
    timerMode,
    selectedActivity,
    isRunning,
    liveSeconds,
    pomodoroTarget,
    startTimer,
    pauseTimer
  } = useStudyTimer();

  // If user is already on the /timer page, or timer is 0 and not running, or minimized: don't show
  if (location.pathname === '/timer' || (liveSeconds === 0 && !isRunning) || isMinimized) {
    return null;
  }

  const act = ACTIVITIES.find(a => a.id === selectedActivity) || ACTIVITIES[0];
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
        border: '1px solid var(--border-color)',
        borderRadius: '50px',
        padding: '0.45rem 0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.22)',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        animation: 'fadeInUp 0.3s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Activity badge */}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.78rem',
        fontWeight: 800,
        color: act.color,
        background: `${act.color}15`,
        padding: '0.2rem 0.5rem',
        borderRadius: '20px'
      }}>
        <span>{act.emoji}</span>
        <span>{act.label}</span>
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
          background: isRunning ? '#22c55e' : '#f59e0b',
          animation: isRunning ? 'pulse 1.5s infinite' : 'none'
        }} />
        <span>{formatTime(displaySeconds)}</span>
      </div>

      {/* Action buttons inside pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={handleTogglePlay}
          className="btn-icon"
          style={{ width: '28px', height: '28px', background: 'var(--bg-tertiary)', borderRadius: '50%' }}
          title={isRunning ? 'Tạm dừng' : 'Tiếp tục'}
        >
          {isRunning ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
        </button>

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
