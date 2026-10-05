import React, { useState, useEffect, useRef } from 'react';
import { Bell, Lock, CheckCircle2, AlertCircle, ShieldAlert, Trophy, XCircle } from 'lucide-react';
import { alarmAudio } from '../../services/alarmAudio.js';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext';

export default function AlarmModal({ isOpen, onClose, onChallengeCompleted, words = [], questionCount = 3 }) {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [wrongOptions, setWrongOptions] = useState([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Store words reference to prevent re-triggering during active session
  const wordsRef = useRef(words);
  wordsRef.current = words;

  // Initialize Questions and Start Alarm Sound ONLY when isOpen transitions to true
  useEffect(() => {
    if (isOpen) {
      // Get target question count (default 3, max 10)
      const count = parseInt(localStorage.getItem('linguavault_alarm_q_count') || questionCount, 10) || 3;
      const currentWords = wordsRef.current && wordsRef.current.length >= count ? wordsRef.current : [
        { word: 'deliverable', meaning_vi: 'Sản phẩm / kết quả bàn giao của dự án' },
        { word: 'bottleneck', meaning_vi: 'Điểm nghẽn, nút thắt cổ chai gây đình trệ tiến độ' },
        { word: 'stakeholder', meaning_vi: 'Các bên liên quan (khách hàng, ban điều hành, đối tác)' },
        { word: 'resilient', meaning_vi: 'Kiên cường, có khả năng phục hồi nhanh sau khó khăn' },
        { word: 'articulate', meaning_vi: 'Ăn nói lưu loát, diễn đạt mạch lạc rõ ràng' },
        { word: 'meticulous', meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ' },
        { word: 'leverage', meaning_vi: 'Tận dụng, phát huy tối đa đòn bẩy / thế mạnh' },
        { word: 'pragmatic', meaning_vi: 'Thực tế, thực dụng và hiệu quả' }
      ];

      // Shuffle & pick required count
      const shuffled = [...currentWords].sort(() => 0.5 - Math.random()).slice(0, count);
      const generated = shuffled.map((w, idx) => {
        const otherMeanings = currentWords
          .filter(item => item.word !== w.word)
          .map(item => item.meaning_vi)
          .slice(0, 3);

        const options = [...otherMeanings, w.meaning_vi].sort(() => 0.5 - Math.random());

        return {
          id: idx,
          word: w.word,
          phonetic: w.phonetic || '',
          questionText: `Nghĩa tiếng Việt chuẩn xác của từ "${w.word.toUpperCase()}" là gì?`,
          correctAnswer: w.meaning_vi,
          options
        };
      });

      setQuestions(generated);
      setCurrentIndex(0);
      setScore(0);
      setIsCompleted(false);
      setSelectedOption(null);
      setWrongOptions([]);
      setIsAnswered(false);
      setIsCorrect(null);

      // Start ringing alarm continuously at Web Audio and OS level
      alarmAudio.startAlarmSound();
      try {
        api.triggerSystemAlarm();
      } catch (e) {}
    } else {
      alarmAudio.stopAlarmSound();
    }

    return () => {
      alarmAudio.stopAlarmSound();
    };
  }, [isOpen]);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt) => {
    if (isAnswered || wrongOptions.includes(opt)) return;

    const correct = opt.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (correct) {
      setSelectedOption(opt);
      setIsAnswered(true);
      setIsCorrect(true);
      setScore(prev => prev + 1);

      // Final Question: Stop audio immediately!
      if (currentIndex + 1 >= questions.length) {
        alarmAudio.stopAlarmSound();
        try {
          api.stopSystemAlarm();
        } catch (e) {}
        alarmAudio.playSuccessSound();

        setTimeout(() => {
          setIsCompleted(true);
          if (onChallengeCompleted) onChallengeCompleted();
        }, 400);
      } else {
        alarmAudio.playBeep(1046.5, 0.15, 'sine', true);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
          setWrongOptions([]);
          setIsAnswered(false);
          setIsCorrect(null);
        }, 600);
      }
    } else {
      // Wrong option: Play error sound, mark this option as wrong, DO NOT reveal correct answer!
      alarmAudio.playErrorSound();
      setWrongOptions(prev => [...prev, opt]);
      setSelectedOption(opt);
      setIsAnswered(true);
      setIsCorrect(false);

      setTimeout(() => {
        // Unlock immediately so user can pick other options on the same question
        setSelectedOption(null);
        setIsAnswered(false);
        setIsCorrect(null);
      }, 500);
    }
  };

  const handleForceDismiss = () => {
    alarmAudio.stopAlarmSound();
    if (onClose) onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.96)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      zIndex: 99999
    }}>
      <div style={{
        width: '100%',
        maxWidth: '540px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        border: '2px solid #ef4444',
        boxShadow: '0 0 50px rgba(239, 68, 68, 0.45)',
        overflow: 'hidden',
        animation: 'pulse 1.5s infinite'
      }}>
        {/* Urgent Header */}
        <div style={{
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 1s infinite'
            }}>
              <Bell size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
                🚨 BÁO THỨC KỶ LUẬT THÉP
              </h3>
              <p style={{ fontSize: '0.78rem', margin: 0, opacity: 0.9 }}>
                Bắt buộc giải đúng {questions.length} câu trắc nghiệm để tắt chuông!
              </p>
            </div>
          </div>

          {/* Hardcore Zero Snooze Badge */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            padding: '0.4rem 0.75rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Lock size={13} color="#fef08a" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fef08a', letterSpacing: '0.5px' }}>
              {t.alarmChallenge?.noSnooze || 'KHÔNG CHO HOÃN'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isCompleted ? (
            <>
              {/* Progress Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldAlert size={16} />
                  <span>{t.alarmChallenge?.challenge || 'THỬ THÁCH GIẢI MÃ: CÂU'} {currentIndex + 1} / {questions.length}</span>
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '28px',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: i < currentIndex ? '#10b981' : i === currentIndex ? '#ef4444' : 'var(--border-color)'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Question Card */}
              <div style={{
                backgroundColor: 'var(--bg-tertiary)',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  {t.alarmChallenge?.wordToSolve || 'TỪ VỰNG CẦN GIẢI MÃ'}
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0.2rem 0', color: 'var(--text-primary)' }}>
                  {currentQ.word.toUpperCase()}
                </h2>
                {currentQ.phonetic && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {currentQ.phonetic}
                  </span>
                )}
              </div>

              {/* Options Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === opt;
                  const isWrong = wrongOptions.includes(opt) || (isSelected && isCorrect === false);
                  const isRight = isSelected && isCorrect === true;

                  let btnBg = 'var(--bg-tertiary)';
                  let btnBorder = 'var(--border-color)';
                  let btnColor = 'var(--text-primary)';

                  if (isRight) {
                    btnBg = 'rgba(16, 185, 129, 0.2)';
                    btnBorder = '#10b981';
                    btnColor = '#10b981';
                  } else if (isWrong) {
                    btnBg = 'rgba(239, 68, 68, 0.15)';
                    btnBorder = '#ef4444';
                    btnColor = '#ef4444';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isAnswered || isWrong}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        backgroundColor: btnBg,
                        border: `1.5px solid ${btnBorder}`,
                        color: btnColor,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: isWrong ? 'not-allowed' : (isAnswered ? 'default' : 'pointer'),
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: isWrong ? 0.6 : 1
                      }}
                    >
                      <span>{opt}</span>
                      {isRight && <CheckCircle2 size={18} color="#10b981" />}
                      {isWrong && <XCircle size={18} color="#ef4444" />}
                    </button>
                  );
                })}
              </div>

              {/* Wrong Answer Hint Banner */}
              {isCorrect === false && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}>
                  <AlertCircle size={16} />
                  <span>{t.alarmChallenge?.incorrectHint || 'Chưa chính xác! Hãy chọn đáp án khác cho đến khi đúng.'}</span>
                </div>
              )}
            </>
          ) : (
            /* Success Screen */
            <div style={{ textAlign: 'center', padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <Trophy size={40} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem 0' }}>
                  {t.alarmChallenge?.successTitle || '🎉 CHÚC MỪNG BẠN ĐÃ GIẢI MÃ THÀNH CÔNG!'}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {t.alarmChallenge?.successDesc || 'Chuông báo thức đã được TẮT hoàn toàn. Chuỗi ngày học Streak 🔥 của bạn đã được bảo vệ an toàn!'}
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>{t.alarmChallenge?.bonusXp || '+30 XP Thưởng'}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>•</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{questions.length}/{questions.length} {t.alarmChallenge?.wordsReviewed || 'Từ Vựng Đã Ôn'}</span>
              </div>

              <button
                onClick={handleForceDismiss}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  borderRadius: '14px',
                  marginTop: '0.5rem',
                  backgroundColor: '#10b981',
                  cursor: 'pointer'
                }}
              >
                {t.alarmChallenge?.startStudyingBtn || 'Vào Học Ngay Bây Giờ 🚀'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
