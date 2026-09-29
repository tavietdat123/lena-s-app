import React, { useState, useEffect } from 'react';
import { X, Clock, Coffee, BellRing, Calendar, Sparkles, Check, Volume2 } from 'lucide-react';
import { SOUND_OPTIONS, playChime } from '../../context/StudyTimerContext';

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'T2', name: 'Thứ 2' },
  { id: 'tue', label: 'T3', name: 'Thứ 3' },
  { id: 'wed', label: 'T4', name: 'Thứ 4' },
  { id: 'thu', label: 'T5', name: 'Thứ 5' },
  { id: 'fri', label: 'T6', name: 'Thứ 6' },
  { id: 'sat', label: 'T7', name: 'Thứ 7' },
  { id: 'sun', label: 'CN', name: 'Chủ Nhật' }
];

export default function StudyScheduleModal({ isOpen, onClose, onSave, schedule }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('22:30');
  const [studyMins, setStudyMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [longBreakMins, setLongBreakMins] = useState(15);
  const [selectedDays, setSelectedDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [soundType, setSoundType] = useState('melodic');
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (schedule) {
      setTitle(schedule.title || '');
      setStartTime(schedule.start_time || '20:00');
      setEndTime(schedule.end_time || '22:30');
      setStudyMins(schedule.study_duration_minutes || 25);
      setBreakMins(schedule.break_duration_minutes || 5);
      setLongBreakMins(schedule.long_break_minutes || 15);
      setSelectedDays(Array.isArray(schedule.days_of_week) ? schedule.days_of_week : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
      setSoundType(schedule.sound_type || 'melodic');
      setAutoStartBreaks(schedule.auto_start_breaks !== false);
    } else {
      setTitle('Ca Học Tối Kỷ Luật');
      setStartTime('20:00');
      setEndTime('22:30');
      setStudyMins(25);
      setBreakMins(5);
      setLongBreakMins(15);
      setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
      setSoundType('melodic');
      setAutoStartBreaks(true);
    }
  }, [schedule, isOpen]);

  if (!isOpen) return null;

  // Calculate cycle summary
  const calculateSummary = () => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff <= 0) diff += 24 * 60; // Next day
      const cycleMins = studyMins + breakMins;
      const cycles = Math.max(1, Math.floor(diff / cycleMins));
      const totalStudy = cycles * studyMins;
      const totalBreak = (cycles - 1) * breakMins;
      return { totalMinutes: diff, cycles, totalStudy, totalBreak };
    } catch (e) {
      return { totalMinutes: 150, cycles: 5, totalStudy: 125, totalBreak: 20 };
    }
  };

  const summary = calculateSummary();

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên ca học.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        id: schedule?.id,
        title: title.trim(),
        start_time: startTime,
        end_time: endTime,
        study_duration_minutes: Number(studyMins) || 25,
        break_duration_minutes: Number(breakMins) || 5,
        long_break_minutes: Number(longBreakMins) || 15,
        cycles_before_long_break: 4,
        days_of_week: selectedDays,
        sound_type: soundType,
        auto_start_breaks: autoStartBreaks
      });
      onClose();
    } catch (err) {
      alert('Lỗi lưu lịch học: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        animation: 'fadeInUp 0.25s ease'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Clock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {schedule ? 'Chỉnh Sửa Lịch Học Dài Hạn' : 'Thiết Lập Lịch Học Dài Hạn & Nghỉ Giữa Giờ'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Định hình khung giờ từ bao giờ đến bao giờ và thời gian nghỉ giữa giờ.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon" style={{ borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* 1. Schedule Name */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              📌 Tên Lịch Học / Ca Học:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Ca học tối kỷ luật, Luyện thi IELTS sáng..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* 2. From What Time to What Time */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '1rem',
            borderRadius: '14px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)' }}>
              <Clock size={15} />
              <span>Khung giờ học (Từ bao giờ đến bao giờ):</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Bắt đầu từ:</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>

              <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 800, paddingTop: '1rem' }}>➔</div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Kết thúc lúc:</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
              ⏱️ Tổng thời lượng ca học: <strong>{Math.floor(summary.totalMinutes / 60)} giờ {summary.totalMinutes % 60 > 0 ? `${summary.totalMinutes % 60} phút` : ''}</strong> ({summary.totalMinutes} phút)
            </div>
          </div>

          {/* 3. Study Duration & Break Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Study block */}
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: '0.85rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <span>📚 Học mỗi hiệp:</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <select
                  value={studyMins}
                  onChange={(e) => setStudyMins(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}
                >
                  <option value={15}>15 phút</option>
                  <option value={20}>20 phút</option>
                  <option value={25}>25 phút (Chuẩn 🍅)</option>
                  <option value={30}>30 phút</option>
                  <option value={45}>45 phút (Tập trung)</option>
                  <option value={50}>50 phút (50/10)</option>
                  <option value={60}>60 phút (1 Tiếng)</option>
                </select>
              </div>
            </div>

            {/* Break block */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              padding: '0.85rem',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                <Coffee size={14} />
                <span>Nghỉ giữa giờ:</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <select
                  value={breakMins}
                  onChange={(e) => setBreakMins(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}
                >
                  <option value={3}>3 phút (Nghỉ chớp mắt)</option>
                  <option value={5}>5 phút (Chuẩn Pomodoro)</option>
                  <option value={10}>10 phút (Thư giãn)</option>
                  <option value={15}>15 phút (Nghỉ sâu)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Days of week selector */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              📅 Các ngày áp dụng trong tuần:
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {DAYS_OF_WEEK.map(d => {
                const isSelected = selectedDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    style={{
                      padding: '0.4rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                      background: isSelected ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-tertiary)',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Sound ringtone selection with test button */}
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '0.85rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BellRing size={14} color="var(--accent-primary)" />
                <span>Nhạc chuông báo hết giờ:</span>
              </label>
              <button
                type="button"
                onClick={() => playChime(soundType)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Volume2 size={13} />
                <span>Nghe thử</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              {SOUND_OPTIONS.map(opt => {
                const isSelected = soundType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSoundType(opt.id);
                      playChime(opt.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                      background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-secondary)',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Summary Breakdown Box */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(16, 185, 129, 0.08))',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              💡 Tóm Tắt Chu Kỳ Ca Học Tự Động:
            </div>
            Trong khung <strong>{startTime} – {endTime}</strong> ({summary.totalMinutes} phút): Hệ thống sẽ tự động dẫn dắt bạn qua <strong>{summary.cycles} hiệp học</strong> (tổng {summary.totalStudy} phút học) xen kẽ <strong>{summary.cycles - 1} lần nghỉ giữa giờ</strong> (tổng {summary.totalBreak} phút nghỉ ngơi).
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '0.6rem 1.25rem', borderRadius: '10px' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                fontWeight: 700
              }}
            >
              {isSubmitting ? 'Đang lưu...' : (schedule ? 'Cập Nhật Lịch' : 'Tạo Lịch Học')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
