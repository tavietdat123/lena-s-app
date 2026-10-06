import React, { useState, useEffect } from 'react';
import { X, Clock, Coffee, BellRing, Calendar, Sparkles, Check, Volume2 } from 'lucide-react';
import { SOUND_OPTIONS, ACTIVITIES, playChime, getSoundMeta, getActivityMeta } from '../../context/StudyTimerContext';
import { useLanguage } from '../../context/LanguageContext';

function getDaysOfWeek(t) {
  return [
    { id: 'mon', label: t?.scheduleModal?.dayMonShort || "Mon", name: t?.scheduleModal?.dayMon || "Monday" },
    { id: 'tue', label: t?.scheduleModal?.dayTueShort || "Tue", name: t?.scheduleModal?.dayTue || "Tuesday" },
    { id: 'wed', label: t?.scheduleModal?.dayWedShort || "Wed", name: t?.scheduleModal?.dayWed || "Wednesday" },
    { id: 'thu', label: t?.scheduleModal?.dayThuShort || "Thu", name: t?.scheduleModal?.dayThu || "Thursday" },
    { id: 'fri', label: t?.scheduleModal?.dayFriShort || "Fri", name: t?.scheduleModal?.dayFri || "Friday" },
    { id: 'sat', label: t?.scheduleModal?.daySatShort || "Sat", name: t?.scheduleModal?.daySat || "Saturday" },
    { id: 'sun', label: t?.scheduleModal?.daySunShort || "Sun", name: t?.scheduleModal?.daySun || "Sunday" }
  ];
}

export default function StudyScheduleModal({ isOpen, onClose, onSave, schedule }) {
  const { t, uiLang } = useLanguage();
  const daysOfWeek = getDaysOfWeek(t);
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState('coding');
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
      setActivityType(schedule.activity_type || 'coding');
      setStartTime(schedule.start_time || '20:00');
      setEndTime(schedule.end_time || '22:30');
      setStudyMins(schedule.study_duration_minutes || 25);
      setBreakMins(schedule.break_duration_minutes || 5);
      setLongBreakMins(schedule.long_break_minutes || 15);
      setSelectedDays(Array.isArray(schedule.days_of_week) ? schedule.days_of_week : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
      setSoundType(schedule.sound_type || 'melodic');
      setAutoStartBreaks(schedule.auto_start_breaks !== false);
    } else {
      setTitle(t?.timer?.activityCoding || "Coding & Dev");
      setActivityType('coding');
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
      alert(t?.scheduleModal?.errNameRequired || "Name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        id: schedule?.id,
        title: title.trim(),
        activity_type: activityType,
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
      alert((t?.common?.error || "Error") + err.message);
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
                {schedule ? (t?.scheduleModal?.editTitle || "Edit Study Schedule") : (t?.scheduleModal?.createTitle || "Create Study Schedule")}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                {t?.scheduleModal?.subtitle || "Define shift hours, study rounds and break periods."}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-icon" style={{ borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* 1. Activity Type Selection */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
              {t?.scheduleModal?.activityTypeLabel || "Activity type:"}
            </label>
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              flexWrap: 'wrap'
            }}>
              {ACTIVITIES.map(act => {
                const isSelected = activityType === act.id;
                const localizedLabel = getActivityMeta(act.id, '', t).label;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setActivityType(act.id);
                      if (!schedule) {
                        if (act.id === 'coding') setTitle(t?.timer?.activityCoding || "Coding & Dev");
                        else if (act.id === 'work') setTitle(t?.timer?.activityWork || "Work & Tasks");
                        else if (act.id === 'deepwork') setTitle(t?.timer?.activityDeepwork || "Deep Work");
                        else if (act.id === 'writing') setTitle(t?.timer?.activityWriting || "Writing");
                        else if (act.id === 'vocab') setTitle(t?.timer?.activityVocab || "Vocab");
                        else if (act.id === 'flashcard') setTitle(t?.timer?.activityFlashcard || "Flashcards");
                      }
                    }}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: '1.5px solid',
                      borderColor: isSelected ? act.color : 'var(--border-color)',
                      background: isSelected ? `${act.color}1c` : 'var(--bg-tertiary)',
                      color: isSelected ? act.color : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{act.emoji}</span>
                    <span>{localizedLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Schedule Name */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              {t?.scheduleModal?.nameLabel || "Schedule name:"}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t?.scheduleModal?.namePlaceholder || "e.g. Evening Coding Shift..."}
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
              <span>{t?.scheduleModal?.timeRangeLabel || "Shift hours:"}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{t?.scheduleModal?.startTimeLabel || "Start time:"}</span>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{t?.scheduleModal?.endTimeLabel || "End time:"}</span>
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
              {typeof t.scheduleModal?.shiftDurationSummary === 'function'
                ? t.scheduleModal.shiftDurationSummary(Math.floor(summary.totalMinutes / 60), summary.totalMinutes % 60)
                : `⏱️ ${Math.floor(summary.totalMinutes / 60)}h ${summary.totalMinutes % 60}m (${summary.totalMinutes}m)`}
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
                <span>{t?.scheduleModal?.studyMinsLabel || "Study per round:"}</span>
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
                  <option value={15}>15 {t?.timer?.minutesUnit || "min"}</option>
                  <option value={20}>20 {t?.timer?.minutesUnit || "min"}</option>
                  <option value={25}>25 {t?.timer?.minutesUnit || "min"} (Pomodoro 🍅)</option>
                  <option value={30}>30 {t?.timer?.minutesUnit || "min"}</option>
                  <option value={45}>45 {t?.timer?.minutesUnit || "min"}</option>
                  <option value={50}>50 {t?.timer?.minutesUnit || "min"} (50/10)</option>
                  <option value={60}>60 {t?.timer?.minutesUnit || "min"}</option>
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
                <span>{t?.scheduleModal?.breakMinsLabel || "Break per round:"}</span>
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
                  <option value={3}>3 {t?.timer?.minutesUnit || "min"}</option>
                  <option value={5}>5 {t?.timer?.minutesUnit || "min"} (Pomodoro)</option>
                  <option value={10}>10 {t?.timer?.minutesUnit || "min"}</option>
                  <option value={15}>15 {t?.timer?.minutesUnit || "min"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Days of week selector */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
              {t?.scheduleModal?.daysLabel || "Active days:"}
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {daysOfWeek.map(d => {
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
                <span>{t?.scheduleModal?.soundLabel || "Alarm sound:"}</span>
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
                <span>{t?.timer?.testSound || "Test Sound"}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              {SOUND_OPTIONS.map(opt => {
                const sMeta = getSoundMeta(opt.id, t);
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
                    <span>{sMeta.label}</span>
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
              {t?.scheduleModal?.shiftCycleSummaryTitle || "Shift Summary:"}
            </div>
            {typeof t.scheduleModal?.shiftCycleSummaryDesc === 'function'
              ? t.scheduleModal.shiftCycleSummaryDesc(startTime, endTime, summary.totalMinutes, studyMins, breakMins, summary.cycles)
              : `${startTime} – ${endTime} (${summary.totalMinutes}m): ${summary.cycles} cycles (${summary.totalStudy}m study, ${summary.totalBreak}m break)`}
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '0.6rem 1.25rem', borderRadius: '10px' }}
            >
              {t?.common?.cancel || "Cancel"}
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
              {isSubmitting ? (t?.common?.loading || "Loading...") : (schedule ? (t?.common?.save || "Save") : (t?.scheduleModal?.saveBtn || "Save Schedule"))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
