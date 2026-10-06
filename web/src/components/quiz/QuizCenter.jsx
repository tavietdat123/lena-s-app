import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { audioService } from '../../services/audioService';
import { 
  Trophy, 
  Target, 
  CheckCircle, 
  XCircle, 
  Volume2, 
  RotateCcw, 
  BookOpen, 
  Zap, 
  Tag, 
  Flame, 
  Sparkles, 
  History, 
  Plus, 
  RefreshCw, 
  Layers, 
  Puzzle, 
  CheckCircle2, 
  FileText,
  Clock,
  Shuffle,
  Headphones,
  Edit3,
  ArrowRight,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getTopicDisplayName } from '../../constants/topicMeta';
import { getCategoryLabel } from '../../constants/patternCategories';
import { getDisplayPos } from '../../constants/posAdapter';

// Helper to render contextual sentence with bold target words or interactive blanks
const renderQuestionText = (text) => {
  if (!text) return '';
  const str = String(text);
  if (!str.includes('**') && !str.includes('_______')) {
    return str;
  }
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|_______)/g;
  let match;
  let lastIdx = 0;
  let keyIdx = 0;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(<span key={`t_${keyIdx++}`}>{str.substring(lastIdx, match.index)}</span>);
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      parts.push(
        <strong
          key={`b_${keyIdx++}`}
          style={{
            color: 'var(--accent-primary)',
            textDecoration: 'underline',
            textUnderlineOffset: '5px',
            textDecorationColor: 'rgba(99, 102, 241, 0.45)',
            fontWeight: 800,
            padding: '0 2px'
          }}
        >
          {inner}
        </strong>
      );
    } else if (token === '_______') {
      parts.push(
        <span
          key={`blank_${keyIdx++}`}
          style={{
            display: 'inline-block',
            borderBottom: '3px solid var(--accent-primary)',
            minWidth: '85px',
            color: 'var(--accent-primary)',
            fontWeight: 800,
            textAlign: 'center',
            letterSpacing: '2px',
            margin: '0 6px',
            verticalAlign: 'bottom'
          }}
        >
          _____
        </span>
      );
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < str.length) {
    parts.push(<span key={`end_${keyIdx++}`}>{str.substring(lastIdx)}</span>);
  }
  return parts;
};

// Helper to render structured pedagogical explanation
const renderExplanationContent = (explanationText) => {
  if (!explanationText) return null;
  const blocks = String(explanationText).split(/\n\n+/).filter(Boolean);

  return blocks.map((block, bIdx) => {
    const trimmed = block.trim();
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let match;
    let lastIdx = 0;
    let pIdx = 0;

    while ((match = regex.exec(trimmed)) !== null) {
      if (match.index > lastIdx) {
        parts.push(<span key={`e_${bIdx}_${pIdx++}`}>{trimmed.substring(lastIdx, match.index)}</span>);
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={`eb_${bIdx}_${pIdx++}`} style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={`ec_${bIdx}_${pIdx++}`} style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--accent-primary)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.84rem',
            margin: '0 3px',
            fontWeight: 700
          }}>
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < trimmed.length) {
      parts.push(<span key={`ee_${bIdx}_${pIdx++}`}>{trimmed.substring(lastIdx)}</span>);
    }

    return (
      <div
        key={`block_${bIdx}`}
        style={{
          marginBottom: bIdx < blocks.length - 1 ? '0.55rem' : 0,
          lineHeight: 1.6,
          fontSize: '0.88rem',
          color: 'var(--text-secondary)'
        }}
      >
        {parts}
      </div>
    );
  });
};

export default function QuizCenter({ onOpenReview }) {
  const { t, uiLang, targetLanguage, isVietnameseTrack, fluentLanguage, getTopicName } = useLanguage();
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [quizCategory, setQuizCategory] = useState('vocab'); // 'vocab' | 'pattern'
  const [topics, setTopics] = useState([]);
  const [patternCategories, setPatternCategories] = useState([]);
  const [quizDates, setQuizDates] = useState([]);
  const [dateScope, setDateScope] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last_7_days' | 'specific' | 'range'
  const [selectedDates, setSelectedDates] = useState([]);
  const [customCalendarDate, setCustomCalendarDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTopics, setSelectedTopics] = useState(['All']);
  const [selectedPatternCategory, setSelectedPatternCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedContextLevels, setSelectedContextLevels] = useState(['all']);
  const [questionCount, setQuestionCount] = useState(5);
  const [quizMode, setQuizMode] = useState('mixed');
  const [loading, setLoading] = useState(false);

  // History State
  const [quizHistory, setQuizHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'vocab' | 'pattern'

  // Active Quiz State
  const [quizData, setQuizData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Result State
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    loadTopics();
    loadPatternCategories();
    loadQuizDates();
    loadQuizHistory();
  }, [targetLanguage]);

  const loadTopics = async () => {
    const res = await api.getQuizTopics({ target_language: targetLanguage });
    if (res.success) {
      setTopics(res.data || []);
    }
  };

  const loadPatternCategories = async () => {
    const res = await api.getPatternCategories();
    if (res.success) {
      setPatternCategories(res.data || []);
    }
  };

  const loadQuizDates = async () => {
    const res = await api.getQuizDates({ target_language: targetLanguage });
    if (res.success && res.data) {
      setQuizDates(res.data || []);
      if (res.data.length > 0 && !selectedDate) {
        setSelectedDate(res.data[0].date);
      }
    }
  };

  const loadQuizHistory = async () => {
    const res = await api.getQuizHistory();
    if (res.success) {
      setQuizHistory(res.data || []);
    }
  };

  const handleRetakeQuiz = async (historyItem) => {
    setLoading(true);
    try {
      const res = await api.getQuizHistoryById(historyItem.id);
      if (res.success && res.data && res.data.questions?.length > 0) {
        // Guarantee no duplicates when retaking historical quiz (strictly by questionText)
        const seenTexts = new Set();
        const filteredQuestions = res.data.questions.filter((q) => {
          const t = String(q.questionText || '').trim().toLowerCase();
          if (t && seenTexts.has(t)) return false;
          if (t) seenTexts.add(t);
          return true;
        });

        const finalQuizData = {
          ...res.data,
          totalQuestions: filteredQuestions.length,
          questions: filteredQuestions
        };

        setQuizData(finalQuizData);
        setCurrentIndex(0);
        setUserAnswers([]);
        setSelectedOption(null);
        setIsAnswered(false);
        setStreakCount(0);
        setQuizResult(null);
      } else {
        alert((t?.quiz?.loadError || "Failed to load quiz") + ': ' + (res.error || ''));
      }
    } catch (e) {
      alert((t?.quiz?.loadError || "Failed to load quiz") + ': ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(t?.quiz?.deleteQuizConfirm || "Delete this quiz?")) return;
    try {
      const res = await api.deleteQuizHistory(id);
      if (res.success) {
        loadQuizHistory();
      } else {
        alert(res.error || (t?.common?.error || "Error"));
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    }
  };

  const toggleTopic = (topicKey) => {
    if (topicKey === 'All' || topicKey === 'all') {
      setSelectedTopics(['All']);
      return;
    }

    let updated = selectedTopics.filter(t => t !== 'All' && t !== 'all');
    if (updated.includes(topicKey)) {
      updated = updated.filter(t => t !== topicKey);
      if (updated.length === 0) updated = ['All'];
    } else {
      updated.push(topicKey);
    }
    setSelectedTopics(updated);
  };

  const toggleContextLevel = (lvlId) => {
    if (lvlId === 'all') {
      setSelectedContextLevels(['all']);
      return;
    }
    let updated = selectedContextLevels.filter(l => l !== 'all');
    if (updated.includes(lvlId)) {
      updated = updated.filter(l => l !== lvlId);
      if (updated.length === 0) updated = ['all'];
    } else {
      updated.push(lvlId);
    }
    setSelectedContextLevels(updated);
  };

  const toggleDate = (dateStr) => {
    if (dateStr === 'all') {
      setDateScope('all');
      setSelectedDates([]);
      return;
    }

    let updated;
    if (selectedDates.includes(dateStr)) {
      updated = selectedDates.filter(d => d !== dateStr);
    } else {
      updated = [...selectedDates, dateStr];
    }
    setSelectedDates(updated);
    if (updated.length > 0) {
      setDateScope('specific');
    } else {
      setDateScope('all');
    }
  };

  const handleCustomCalendarChange = (val) => {
    setCustomCalendarDate(val);
    if (val) {
      setSelectedDates([val]);
      setDateScope('specific');
    }
  };

  const handleStartQuiz = async (useAi = false) => {
    setLoading(true);
    try {
      let res;
      let targetDate = null;
      if (dateScope === 'specific') {
        targetDate = selectedDates.length === 1 ? selectedDates[0] : (selectedDates.length > 1 ? selectedDates : null);
        if (!targetDate) {
          alert(t?.quiz?.selectDateAlert || "Please select a date");
          setLoading(false);
          return;
        }
      }

      const queryParams = {
        count: questionCount,
        level: selectedLevel,
        context_levels: selectedContextLevels,
        mode: quizMode,
        date_scope: dateScope,
        date: targetDate,
        start_date: dateScope === 'range' ? startDate : null,
        end_date: dateScope === 'range' ? endDate : null,
        target_language: targetLanguage,
        fluent_language: fluentLanguage
      };

      if (quizCategory === 'pattern') {
        if (useAi) {
          res = await api.generateAIPatternQuiz({
            category: selectedPatternCategory,
            ...queryParams
          });
        } else {
          res = await api.generatePatternQuiz({
            category: selectedPatternCategory,
            ...queryParams
          });
        }
      } else {
        if (useAi) {
          res = await api.generateAIQuiz({
            topic: selectedTopics,
            ...queryParams
          });
        } else {
          res = await api.generateQuiz({
            topic: selectedTopics,
            ...queryParams
          });
        }
      }

      if (res.success && res.data.questions?.length > 0) {
        // Guarantee no duplicate questions on client side as an extra safeguard (strictly by questionText)
        const seenTexts = new Set();
        const filteredQuestions = res.data.questions.filter((q) => {
          const t = String(q.questionText || '').trim().toLowerCase();
          if (t && seenTexts.has(t)) return false;
          if (t) seenTexts.add(t);
          return true;
        });

        const finalQuizData = {
          ...res.data,
          totalQuestions: filteredQuestions.length,
          questions: filteredQuestions
        };

        setQuizData(finalQuizData);
        setCurrentIndex(0);
        setUserAnswers([]);
        setSelectedOption(null);
        setIsAnswered(false);
        setStreakCount(0);
        setQuizResult(null);
        loadQuizHistory();

        // Auto-play audio if first question is listening
        if (res.data.questions[0].type === 'listening') {
          audioService.speak(res.data.questions[0].word);
        }
      } else {
        alert(res.error || (t?.quiz?.insufficientDataAlert || "Not enough words to generate quiz"));
      }
    } catch (err) {
      alert((t?.quiz?.loadError || "Failed to load quiz") + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeCurrentQuiz = () => {
    if (quizData && quizData.questions?.length > 0) {
      setCurrentIndex(0);
      setUserAnswers([]);
      setSelectedOption(null);
      setIsAnswered(false);
      setStreakCount(0);
      setQuizResult(null);

      // Auto-play audio if first question is listening
      if (quizData.questions[0]?.type === 'listening') {
        audioService.speak(quizData.questions[0].word);
      }
    } else {
      handleStartQuiz(false);
    }
  };

  const handleSelectOption = (option) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const currentQ = quizData.questions[currentIndex];
    const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);
      if (nextStreak >= 3) {
        audioService.playStreakSound(nextStreak);
      } else {
        audioService.playCorrectSound();
      }
    } else {
      setStreakCount(0);
      audioService.playWrongSound();
    }

    // Save answer at current question index
    const answerItem = {
      id: currentQ.id,
      word: currentQ.word,
      questionText: currentQ.questionText,
      correctAnswer: currentQ.correctAnswer,
      userAnswer: option,
      explanation: currentQ.explanation,
      translation: currentQ.translation
    };

    setUserAnswers(prev => {
      const updated = [...prev];
      updated[currentIndex] = answerItem;
      return updated;
    });
  };

  const handleNextQuestion = async () => {
    audioService.playTapSound();

    if (currentIndex + 1 < quizData.questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);

      if (quizData.questions[nextIdx].type === 'listening') {
        audioService.speak(quizData.questions[nextIdx].word);
      }
    } else {
      // Ensure all answers across all questions are aggregated
      setLoading(true);
      try {
        const answersToSubmit = quizData.questions.map((q, idx) => {
          if (userAnswers[idx]) return userAnswers[idx];
          if (idx === currentIndex && selectedOption) {
            return {
              id: q.id,
              word: q.word,
              questionText: q.questionText,
              correctAnswer: q.correctAnswer,
              userAnswer: selectedOption,
              explanation: q.explanation,
              translation: q.translation
            };
          }
          return {
            id: q.id,
            word: q.word,
            questionText: q.questionText,
            correctAnswer: q.correctAnswer,
            userAnswer: '',
            explanation: q.explanation,
            translation: q.translation
          };
        });

        const res = await api.submitQuiz(answersToSubmit, quizData?.history_id || null);
        if (res.success && res.data) {
          audioService.playVictorySound();
          setQuizResult(res.data);
          loadQuizHistory();
        } else {
          alert((t?.quiz?.submitError || "Failed to submit quiz") + ': ' + (res.error || ''));
        }
      } catch (err) {
        alert((t?.quiz?.submitError || "Failed to submit quiz") + ': ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Keyboard shortcut listener (1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!quizData || isAnswered || quizResult) return;
      const currentQ = quizData.questions[currentIndex];
      if (!currentQ) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= currentQ.options.length) {
        handleSelectOption(currentQ.options[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizData, currentIndex, isAnswered, quizResult]);

  // ================= 1. RESULT SCREEN =================
  if (quizResult) {
    const isGreat = quizResult.score >= 80;
    return (
      <div className="quiz-center-container">
        <div className="quiz-result-card">
          <div className="result-header">
            <div className={`result-badge-icon ${isGreat ? 'success' : 'warning'}`}>
              {isGreat ? <Trophy size={42} /> : <Target size={42} />}
            </div>
            <h2>{isGreat ? (uiLang === 'ru' ? 'Отлично! Тест завершён' : uiLang === 'en' ? 'Excellent! Quiz Completed' : 'Xuất Sắc! Hoàn Thành Bài Quiz') : (t?.quiz?.completedTitle || "Quiz Completed!")}</h2>
            <p className="result-subtitle">
              {uiLang === 'ru' ? 'Вы правильно ответили на ' : uiLang === 'en' ? 'You correctly answered ' : 'Bạn đã trả lời đúng '}<b>{quizResult.correctCount} / {quizResult.totalQuestions}</b> {uiLang === 'ru' ? 'вопросов' : uiLang === 'en' ? 'questions' : 'câu hỏi'}
            </p>
          </div>

          <div className="result-stats-row">
            <div className="result-stat-box">
              <span className="stat-label">{t?.quiz?.scoreStat || "SCORE"}</span>
              <span className="stat-val score">{quizResult.score}%</span>
            </div>
            <div className="result-stat-box">
              <span className="stat-label">{t?.quiz?.xpStat || "XP EARNED"}</span>
              <span className="stat-val xp">+{quizResult.xpEarned} XP</span>
            </div>
            <div className="result-stat-box">
              <span className="stat-label">{t?.quiz?.accuracyStat || "ACCURACY"}</span>
              <span className="stat-val accuracy">{quizResult.isPerfect ? (t?.quiz?.perfectStat || "100% Perfect") : `${quizResult.correctCount}/${quizResult.totalQuestions}`}</span>
            </div>
          </div>

          <div className="result-breakdown">
            <h3>{t?.quiz?.answerDetailsTitle || "Answer Details"}</h3>
            <div className="breakdown-list">
              {quizResult.results.map((item, idx) => (
                <div key={idx} className={`breakdown-item ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="item-status-icon">
                    {item.isCorrect ? <CheckCircle size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                  </div>
                  <div className="item-details">
                    <div className="item-word" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <b>{item.word}</b>
                      <button 
                        className="mini-audio-btn" 
                        onClick={() => audioService.speak(item.word)}
                        title={t?.quiz?.pronounceWordLabel || "Audio:"}
                      >
                        <Volume2 size={14} />
                      </button>
                      {Boolean(item.context_level) && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(14, 165, 233, 0.12)',
                          color: '#0ea5e9',
                          border: '1px solid rgba(14, 165, 233, 0.25)'
                        }}>
                          🎓 {uiLang === 'ru' ? 'Контекст: ' : uiLang === 'en' ? 'Context: ' : 'Bối cảnh: '}{item.context_level}
                        </span>
                      )}
                    </div>
                    <div className="item-answers">
                      <span>{t?.quiz?.youSelected || "You chose:"} <i className={item.isCorrect ? 'text-green' : 'text-red'}>{item.userAnswer}</i></span>
                      {!item.isCorrect && (
                        <span> • {t?.quiz?.correctAnswerLabel || "Correct answer:"} <b className="text-green">{item.correctAnswer}</b></span>
                      )}
                    </div>
                    {Boolean(item.explanation || item.translation) && (
                      <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.85rem', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.82rem', lineHeight: 1.5, borderLeft: '3px solid var(--accent-primary)' }}>
                        {Boolean(item.explanation) && (
                          <div style={{ color: 'var(--text-primary)', marginBottom: item.translation ? '0.35rem' : 0 }}>
                            {renderExplanationContent(item.explanation)}
                          </div>
                        )}
                        {Boolean(item.translation) && (
                          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem', marginTop: '4px' }}>
                            <span style={{ fontWeight: 700, fontStyle: 'normal' }}>{t?.quiz?.contextTranslationLabel || "Translation:"}</span>
                            "{item.translation}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="result-actions">
            <button className="btn btn-primary" onClick={handleRetakeCurrentQuiz} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={16} />
              <span>{t?.quiz?.retakeQuizBtn || "Retake Quiz"}</span>
            </button>
            <button className="btn btn-secondary" onClick={() => { setQuizData(null); setQuizResult(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} />
              <span>{t?.quiz?.selectOtherTopicBtn || "Pick Other Topic"}</span>
            </button>
            {onOpenReview && (
              <button className="btn btn-secondary" onClick={onOpenReview} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} />
                <span>{t?.quiz?.enterSRSReviewBtn || "Go to SRS Review"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. ACTIVE QUIZ PLAY SCREEN =================
  if (quizData && quizData.questions.length > 0) {
    const currentQ = quizData.questions[currentIndex];
    const progressPercent = ((currentIndex + 1) / quizData.questions.length) * 100;
    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
      <div className="quiz-center-container">
        <div className="quiz-active-card">
          {/* 1. TOP PROGRESS & STATUS BAR */}
          <div className="quiz-top-bar">
            <div className="quiz-progress-info">
              <span className="question-counter-badge">
                {t?.quiz?.questionWord || "Target word:"} {currentIndex + 1} <span style={{ opacity: 0.6 }}>/ {quizData.questions.length}</span>
              </span>
              {currentQ.difficulty && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: currentQ.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.15)' : currentQ.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: currentQ.difficulty === 'easy' ? '#10b981' : currentQ.difficulty === 'hard' ? '#ef4444' : '#f59e0b',
                  border: `1px solid ${currentQ.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.3)' : currentQ.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}>
                  {currentQ.difficulty === 'easy' ? '🟢 Easy' : currentQ.difficulty === 'hard' ? '🔴 Hard' : '🟡 Medium'}
                </span>
              )}
              <span className="quiz-topic-pill">
                <Tag size={13} />
                <span>{quizData.topic ? getTopicName(quizData.topic) : ''}</span>
              </span>
              {streakCount > 1 && (
                <span className="quiz-streak-pill">
                  <Flame size={14} color="#f59e0b" />
                  <span>Combo x{streakCount} 🔥</span>
                </span>
              )}
            </div>
            <button 
              className="quiz-exit-btn"
              onClick={() => {
                if (confirm('Exit current quiz?')) {
                  setQuizData(null);
                }
              }}
              title={t?.quiz?.exitBtn || "Exit"}
            >
              ✕ {t?.quiz?.exitBtn || "Exit"}
            </button>
          </div>

          {/* Smooth Progress Bar */}
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>

          {/* 2. QUESTION PROMPT HERO BOX */}
          <div className="quiz-question-box">
            <div className="prompt-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="prompt-type-badge">
                  {currentQ.type === 'meaning_vi' && (t?.quiz?.typeMeaningVi || "Pick Meaning")}
                  {currentQ.type === 'reverse_en' && (t?.quiz?.typeReverseEn || "Find English Word")}
                  {currentQ.type === 'cloze_blank' && (t?.quiz?.typeClozeBlank || "Fill Blank")}
                  {currentQ.type === 'listening' && (t?.quiz?.typeListening || "Listening")}
                  {currentQ.type === 'fill_clause' && (t?.quiz?.typeFillClause || "Fill Clause")}
                  {currentQ.type === 'meaning_usage' && (t?.quiz?.typeMeaningUsage || "Pattern Usage")}
                  {currentQ.type === 'formula_check' && (t?.quiz?.typeFormulaCheck || "Grammar Formula")}
                  {currentQ.type === 'pattern_context' && (t?.quiz?.typePatternContext || "Context Pattern")}
                </span>
                {currentQ.part_of_speech && (
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--accent-primary)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🏷️ {getDisplayPos(currentQ.part_of_speech, targetLanguage, uiLang)}
                  </span>
                )}
                {currentQ.context_level && (
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: '#0ea5e9',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🎓 {uiLang === 'ru' ? 'Контекст: ' : uiLang === 'en' ? 'Context: ' : 'Bối cảnh: '}{currentQ.context_level}
                  </span>
                )}
              </div>
              {currentQ.promptSubtitle && (
                <span className="prompt-subtitle">{currentQ.promptSubtitle}</span>
              )}
            </div>

            <div className="question-main-content">
              {currentQ.type === 'listening' ? (
                <div className="listening-prompt-card">
                  <button 
                    className="big-speaker-btn" 
                    onClick={() => audioService.speak(currentQ.word)}
                    title={t?.quiz?.pronounceWordLabel || "Audio:"}
                  >
                    <Volume2 size={36} />
                  </button>
                  <div className="listening-hint-box">
                    <span className="listening-hint">{t?.quiz?.listenAudioPrompt || "Tap speaker to hear audio"}</span>
                    <span className="listening-subhint">{t?.quiz?.listenAudioRepeat || "(Can replay)"}</span>
                  </div>
                </div>
              ) : (
                <div className="text-prompt-display">
                  <h2 className="question-text" style={{
                    fontSize: (currentQ.questionText || '').length > 45 ? '1.35rem' : '1.85rem',
                    lineHeight: 1.55,
                    fontWeight: 700
                  }}>
                    {renderQuestionText(currentQ.questionText)}
                  </h2>
                  {currentQ.formula && (
                    <div className="quiz-formula-tag">
                      {currentQ.formula}
                    </div>
                  )}
                  {currentQ.phonetic && currentQ.type !== 'reverse_en' && (
                    <div className="phonetic-audio-row">
                      <span className="phonetic-text">{currentQ.phonetic}</span>
                      <button 
                        className="mini-audio-btn" 
                        onClick={() => audioService.speak(currentQ.word)}
                        title={t?.quiz?.pronounceWordLabel || "Audio:"}
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. PRO MAX 4 OPTIONS GRID */}
          <div className="quiz-options-grid">
            {currentQ.options.map((opt, idx) => {
              const optStr = String(opt || '');
              const correctStr = String(currentQ?.correctAnswer || '');
              const isCorrect = isAnswered && optStr.trim().toLowerCase() === correctStr.trim().toLowerCase();
              const isSelected = selectedOption === opt;
              const isWrong = isAnswered && isSelected && !isCorrect;
              const isDimmed = isAnswered && !isCorrect && !isSelected;

              let btnClass = 'quiz-option-btn';
              if (isCorrect) btnClass += ' correct-option';
              else if (isWrong) btnClass += ' incorrect-option';
              else if (isDimmed) btnClass += ' dimmed-option';
              else if (isSelected) btnClass += ' selected';

              return (
                <button
                  key={idx}
                  className={btnClass}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isAnswered}
                >
                  <span className="option-key-badge">{optionLabels[idx] || idx + 1}</span>
                  <span className="option-text">{opt}</span>
                  {isCorrect && (
                    <span className="option-status-icon success">
                      <CheckCircle2 size={20} />
                    </span>
                  )}
                  {isWrong && (
                    <span className="option-status-icon danger">
                      <XCircle size={20} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 4. ANSWER FEEDBACK & NEXT ACTION BAR */}
          {isAnswered && (
            <div className={`answer-feedback-card ${String(selectedOption || '').trim().toLowerCase() === String(currentQ?.correctAnswer || '').trim().toLowerCase() ? 'feedback-correct' : 'feedback-incorrect'}`}>
              <div className="feedback-message">
                {String(selectedOption || '').trim().toLowerCase() === String(currentQ?.correctAnswer || '').trim().toLowerCase() ? (
                  <div className="feedback-inner-row">
                    <div className="feedback-icon-wrap correct">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <div className="feedback-title correct">{t?.quiz?.feedbackCorrectTitle || "Correct! 🎉"}</div>
                      <div className="feedback-desc">
                        {typeof t.quiz?.feedbackCorrectDesc === 'function'
                          ? t.quiz.feedbackCorrectDesc(currentQ.correctAnswer)
                          : `${uiLang === 'ru' ? 'Вы выбрали правильно: ' : uiLang === 'en' ? 'You selected correctly: ' : 'Bạn đã chọn đúng đáp án: '} ${currentQ.correctAnswer}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="feedback-inner-row">
                    <div className="feedback-icon-wrap incorrect">
                      <XCircle size={22} />
                    </div>
                    <div>
                      <div className="feedback-title incorrect">{t?.quiz?.feedbackIncorrectTitle || "Not quite!"}</div>
                      <div className="feedback-desc">
                        {typeof t.quiz?.feedbackIncorrectDesc === 'function'
                          ? t.quiz.feedbackIncorrectDesc(currentQ.correctAnswer)
                          : `${uiLang === 'ru' ? 'Правильный ответ: ' : uiLang === 'en' ? 'The correct answer is: ' : 'Đáp án đúng là: '} ${currentQ.correctAnswer}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Explanation / Reasoning of Why this is correct */}
                {Boolean(currentQ.explanation || currentQ.translation) && (
                  <div style={{
                    marginTop: '0.85rem',
                    padding: '0.85rem 1.15rem',
                    background: 'var(--bg-secondary)',
                    borderLeft: '4px solid var(--accent-primary)',
                    borderRadius: '12px',
                    textAlign: 'left'
                  }}>
                    {Boolean(currentQ.explanation) && (
                      <div style={{ color: 'var(--text-primary)', marginBottom: currentQ.translation ? '0.6rem' : 0 }}>
                        {renderExplanationContent(currentQ.explanation)}
                      </div>
                    )}
                    {Boolean(currentQ.translation) && (
                      <div style={{
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                        background: 'rgba(0, 0, 0, 0.03)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        borderLeft: '2px solid rgba(99, 102, 241, 0.4)'
                      }}>
                        <span style={{ fontWeight: 700, fontStyle: 'normal' }}>{t?.quiz?.contextTranslationLabel || "Translation:"}</span>
                        "{currentQ.translation}"
                      </div>
                    )}
                  </div>
                )}

                {/* Pronounce Word Action Button */}
                {Boolean(currentQ?.word || currentQ?.correctAnswer) && (
                  <div style={{ marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary quiz-feedback-pronounce-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--accent-primary)',
                        border: '1.5px solid var(--accent-primary)',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => audioService.speak(currentQ?.word || currentQ?.correctAnswer)}
                      title={t?.quiz?.pronounceWordLabel || "Audio:"}>
                      <Volume2 size={18} />
                      <span>{t?.quiz?.pronounceWordLabel || "Audio:"} <strong style={{ color: 'var(--text-primary)' }}>{currentQ?.word || currentQ?.correctAnswer}</strong> {currentQ?.phonetic ? <span style={{ fontFamily: 'monospace', opacity: 0.85 }}>({currentQ.phonetic})</span> : ''} 🔊</span>
                    </button>
                  </div>
                )}
              </div>
              <button className="btn btn-primary next-quiz-btn" onClick={handleNextQuestion}>
                <span>{currentIndex + 1 < quizData.questions.length ? (t?.quiz?.nextQuestionBtn || "Next Question") : (t?.quiz?.viewSummaryBtn || "View Results")}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= 3. TOPIC SELECTION LOBBY & HISTORY =================
  const filteredHistory = quizHistory.filter(item => {
    if (historyFilter === 'vocab') return item.type === 'vocab';
    if (historyFilter === 'pattern') return item.type === 'pattern';
    if (historyFilter === 'ai') return Boolean(item.is_ai);
    return true;
  });

  return (
    <div className="quiz-center-container">
      <div className="quiz-lobby-header">
        <div className="lobby-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Target size={14} />
          <span>INTERACTIVE QUIZ HUB</span>
        </div>
        <h1>{t?.quiz?.title || "Smart Quiz Center"}</h1>
        <p>{t?.quiz?.subtitle || "Strengthen vocabulary and grammar reflexes"}</p>
      </div>

      {/* Unified Level-1 Main Segmented Tabs */}
      <div className="quiz-main-tabs-container">
        <button
          className={`quiz-main-tab-btn tab-new ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
        >
          <Sparkles size={16} />
          <span>{t?.quiz?.tabNew || "New Quiz"}</span>
        </button>
        <button
          className={`quiz-main-tab-btn tab-history ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); loadQuizHistory(); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
        >
          <History size={16} />
          <span>{t?.quiz?.tabHistory || "History"}</span>
          {quizHistory.length > 0 && (
            <span className="tab-badge">{quizHistory.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'history' ? (
        /* ================= HISTORY LIST TAB ================= */
        <div className="quiz-setup-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} color="var(--accent-primary)" />
                <span>{t?.quiz?.historyTitle || "Quiz History"}</span>
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {t?.quiz?.historyDesc || "All stored AI and custom quizzes."}
              </p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={loadQuizHistory} 
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <RefreshCw size={13} />
              <span>{t?.quiz?.refreshBtn || "Refresh"}</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `${t?.quiz?.filterAll || "All"} (${quizHistory.length})` },
              { id: 'vocab', label: `${t?.quiz?.filterVocab || "Vocab"} (${quizHistory.filter(q => q.type === 'vocab').length})` },
              { id: 'pattern', label: `${t?.quiz?.filterPattern || "Patterns"} (${quizHistory.filter(q => q.type === 'pattern').length})` },
              { id: 'ai', label: `${t?.quiz?.filterAi || "AI Quizzes"} (${quizHistory.filter(q => q.is_ai).length})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setHistoryFilter(f.id)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: historyFilter === f.id ? 800 : 600,
                  border: historyFilter === f.id ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: historyFilter === f.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                  color: historyFilter === f.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List of Saved Quizzes */}
          {filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.8rem' }}>📭</div>
              <h3 style={{ margin: '0 0 0.4rem 0' }}>{t?.quiz?.emptyHistory || "No quizzes yet"}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 1.2rem 0' }}>
                {t?.quiz?.emptyHistorySub || "Click 'Generate AI Quiz' to build one."}
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('new')}>
                {t?.quiz?.createQuizNowBtn || "Create Quiz Now"}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.9rem' }}>
              {filteredHistory.map(item => {
                const isVocab = item.type === 'vocab';
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `5px solid ${item.is_ai ? '#8b5cf6' : isVocab ? 'var(--accent-primary)' : '#ec4899'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem 1.2rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      transition: 'transform 0.15s ease, border-color 0.15s ease'
                    }}
                  >
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{item.title}</h4>
                        {Boolean(item.is_ai) ? (
                          <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                            ✨ AI
                          </span>
                        ) : (
                          <span style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                            Offline
                          </span>
                        )}
                        <span style={{ background: isVocab ? 'rgba(99, 102, 241, 0.15)' : 'rgba(236, 72, 153, 0.15)', color: isVocab ? 'var(--accent-primary)' : '#ec4899', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {isVocab ? `📖 ${item.topic}` : `🧩 ${item.category}`}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>📝 <b>{item.total_questions}</b> {t.quiz?.numQuestions ? t.quiz.numQuestions.replace(':', '').trim() : 'questions'}</span>
                        <span>•</span>
                        <span>
                          {item.best_score !== null && item.best_score !== undefined ? (
                            <span style={{ color: item.best_score >= 80 ? '#10b981' : '#f59e0b', fontWeight: 800 }}>
                              {typeof t.quiz?.highestScore === 'function' ? t.quiz.highestScore(item.best_score) : `🏆 ${uiLang === 'ru' ? 'Лучший' : uiLang === 'en' ? 'Highest' : 'Cao nhất'}: ${item.best_score}%`}
                            </span>
                          ) : (
                            <span>{t?.quiz?.notAttempted || "Not attempted"}</span>
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          {typeof t.quiz?.attemptedTimes === 'function'
                            ? t.quiz.attemptedTimes(item.attempts_count || 0)
                            : `🎯 ${uiLang === 'ru' ? 'Пройдено' : uiLang === 'en' ? 'Attempted' : 'Đã làm'} ${item.attempts_count || 0} ${uiLang === 'ru' ? 'раз' : uiLang === 'en' ? 'times' : 'lần'}`}
                        </span>
                        <span>•</span>
                        <span style={{ opacity: 0.8 }}>
                          📅 {new Date(item.created_at).toLocaleDateString(uiLang === 'vi' ? 'vi-VN' : uiLang === 'ru' ? 'ru-RU' : 'en-US')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRetakeQuiz(item)}
                        disabled={loading}
                        style={{
                          padding: '0.55rem 1.1rem',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          borderRadius: 'var(--radius-md)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>{t?.quiz?.retakeHistoryBtn || "Retake"}</span>
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        title={t?.quiz?.deleteQuizTooltip || "Delete this quiz"}
                        style={{
                          padding: '0.55rem 0.8rem',
                          fontSize: '0.88rem',
                          borderRadius: 'var(--radius-md)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= CREATE NEW QUIZ TAB ================= */
        <div className="quiz-setup-card">
          {/* Card-Integrated Category Selector */}
          <div className="quiz-category-card-selector">
            <button
              className={`category-select-card vocab ${quizCategory === 'vocab' ? 'active' : ''}`}
              onClick={() => setQuizCategory('vocab')}
            >
              <div className="cat-icon-box">
                <BookOpen size={24} color="var(--accent-primary)" />
              </div>
              <div className="cat-text-box">
                <span className="cat-title">{t?.quiz?.vocabCardTitle || "Vocabulary"}</span>
                <span className="cat-desc">{t?.quiz?.vocabCardDesc || "Vocab reflex quiz"}</span>
              </div>
              <div className="cat-radio">
                {quizCategory === 'vocab' && <div className="cat-radio-inner" />}
              </div>
            </button>

            <button
              className={`category-select-card pattern ${quizCategory === 'pattern' ? 'active' : ''}`}
              onClick={() => setQuizCategory('pattern')}
            >
              <div className="cat-icon-box pattern">
                <Puzzle size={24} color="#ec4899" />
              </div>
              <div className="cat-text-box">
                <span className="cat-title">{t?.quiz?.patternCardTitle || "Patterns"}</span>
                <span className="cat-desc">{t?.quiz?.patternCardDesc || "Grammar structure quiz"}</span>
              </div>
              <div className="cat-radio">
                {quizCategory === 'pattern' && <div className="cat-radio-inner" />}
              </div>
            </button>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0 0.5rem 0' }} />

          {/* Step 1: Daily Date Range / Scope Selector */}
          <div className="setup-section" style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--accent-primary)" />
                <span>{t?.quiz?.stepDate || "1. Pick study date"}</span>
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: '700' }}>
                {dateScope === 'all' && (t.quiz?.allTimeScope ? '🌐 ' + t.quiz.allTimeScope : '🌐 All Vault Words')}
                {dateScope === 'today' && (t.quiz?.todayScope ? '⚡ ' + t.quiz.todayScope : '⚡ Today’s Words')}
                {dateScope === 'yesterday' && (t.quiz?.yesterdayScope ? '🕒 ' + t.quiz.yesterdayScope : '🕒 Yesterday’s Words')}
                {dateScope === 'last_7_days' && (t.quiz?.last7DaysScope ? '🔥 ' + t.quiz.last7DaysScope : '🔥 Last 7 Days')}
                {dateScope === 'range' && `🗓️ ${t?.quiz?.fromDate || "From:"} ${startDate || '...'} ${t?.quiz?.toDate || "To:"} ${endDate || '...'}`}
                {dateScope === 'specific' && (
                  selectedDates.length === 1 
                    ? `📅 ${selectedDates[0]}` 
                    : `📅 ${selectedDates.length} ${uiLang === 'ru' ? 'дней' : uiLang === 'vi' ? 'ngày' : 'days'} (${selectedDates.map(d => { try { const [y,m,day]=d.split('-'); return `${day}/${m}`; } catch(e){return d;} }).join(', ')})`
                )}
              </span>
            </div>

            {/* Quick Scope Presets */}
            <div className="count-selector-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '0.85rem' }}>
              {[
                { id: 'all', label: t?.quiz?.allTimeScope || "All Vault Words", icon: Sparkles, desc: t?.quiz?.allWordsDesc || "All vocabulary" },
                { id: 'today', label: t?.quiz?.todayScope || "Today’s Words", icon: Clock, desc: t?.quiz?.todayWordsDesc || "Learned today" },
                { id: 'yesterday', label: t?.quiz?.yesterdayScope || "Yesterday’s Words", icon: Clock, desc: t?.quiz?.yesterdayWordsDesc || "Learned yesterday" },
                { id: 'last_7_days', label: t?.quiz?.last7DaysScope || "Last 7 Days", icon: Flame, desc: t?.quiz?.last7DaysDesc || "Past 1 week" },
                { id: 'range', label: t?.quiz?.rangeScope || "Date Range", icon: Calendar, desc: t?.quiz?.rangeWordsDesc || "From date to date" }
              ].map(scope => {
                const isSelected = dateScope === scope.id && (scope.id !== 'all' || selectedDates.length === 0);
                const IconComp = scope.icon;
                return (
                  <button
                    key={scope.id}
                    className={`count-pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setDateScope(scope.id);
                      if (scope.id !== 'specific') setSelectedDates([]);
                    }}
                    style={{ textAlign: 'left', padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconComp size={14} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                      <b>{scope.label}</b>
                    </div>
                    <small style={{ opacity: 0.85 }}>{scope.desc}</small>
                  </button>
                );
              })}
            </div>

            {/* Date Range Mode Inputs */}
            {dateScope === 'range' && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t?.quiz?.fromDate || "From:"}</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t?.quiz?.toDate || "To:"}</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>
            )}

            {/* Direct Specific Dates Selector Card */}
            <div style={{
              background: 'var(--bg-secondary)',
              border: selectedDates.length > 0 ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t?.quiz?.pickDatesPrompt || "Pick specific study dates:"}
                  </span>
                  {selectedDates.length > 0 && (
                    <button
                      onClick={() => { setSelectedDates([]); setDateScope('all'); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {t?.quiz?.clearDatesBtn || "Clear"}
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t?.quiz?.pickAnyDate || "Pick any date:"}</span>
                  <input
                    type="date"
                    value={customCalendarDate}
                    onChange={(e) => handleCustomCalendarChange(e.target.value)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              {quizDates.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t?.quiz?.noDateRecords || "No dates available."}</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {quizDates.map(qd => {
                    const isPicked = selectedDates.includes(qd.date);
                    return (
                      <button
                        key={qd.date}
                        onClick={() => toggleDate(qd.date)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '12px',
                          border: isPicked ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isPicked ? 'var(--accent-primary)' : 'var(--bg-card)',
                          color: isPicked ? '#ffffff' : 'var(--text-primary)',
                          fontSize: '0.85rem',
                          fontWeight: isPicked ? 800 : 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                          boxShadow: isPicked ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
                        }}
                      >
                        <span>{qd.label}</span>
                        <span style={{
                          background: isPicked ? 'rgba(255,255,255,0.25)' : 'var(--bg-tertiary)',
                          color: isPicked ? '#ffffff' : 'var(--text-secondary)',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {quizCategory === 'pattern' ? `${qd.patterns_count} ${t?.patterns?.patternsCount || (uiLang === 'ru' ? 'фраз' : uiLang === 'vi' ? 'câu' : 'patterns')}` : `${qd.words_count} ${t?.dashboard?.cardCount || 'words'}`}
                        </span>
                        {isPicked && <span style={{ fontWeight: 900, color: '#ffffff' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0 0.5rem 0' }} />

          {/* Step 2: Choose Topic / Tone */}
          {quizCategory === 'vocab' ? (
            <div className="setup-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h3 style={{ margin: 0 }}>{t?.quiz?.stepTopic || "2. Pick topic"}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                  {selectedTopics.includes('All') ? (t?.vocab?.allTopics || "All Topics") : `${selectedTopics.length} ${t?.common?.tags || "Tags"}`}
                </span>
              </div>
                <div className="topics-chip-grid">
                  {topics.map(topItem => {
                    const topicKey = topItem.id || topItem.name;
                    const isSelected = selectedTopics.includes(topicKey) || (topicKey.toLowerCase() === 'all' && selectedTopics.includes('All'));
                    return (
                      <button
                        key={topicKey}
                        className={`topic-chip-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleTopic(topicKey)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span className="topic-name">{getTopicName(topItem)}</span>
                        <span className="topic-count">{topItem.count} {t?.dashboard?.cardCount || "words"}</span>
                        {isSelected && <span style={{ fontWeight: '900', color: '#10b981' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="setup-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <h3 style={{ margin: 0 }}>{t?.quiz?.stepPatternCategory || "2. Pick category"}</h3>
                  <span style={{ fontSize: '0.82rem', color: '#ec4899', fontWeight: '600' }}>
                    {t?.patterns?.title || "Pattern Hub"}
                  </span>
                </div>
                <div className="topics-chip-grid">
                  {[
                    { id: 'all', name: t?.patterns?.allCategories || "All Categories" },
                    ...(patternCategories.length > 0 ? patternCategories : [
                      { id: 'cause_effect', name: 'Cause & Effect' },
                      { id: 'purpose', name: 'Purpose & Goal' },
                      { id: 'condition', name: 'Condition' },
                      { id: 'concession', name: 'Contrast & Concession' },
                      { id: 'comparison', name: 'Comparison' },
                      { id: 'emphasis', name: 'Emphasis & Inversion' }
                    ])
                  ].map(catItem => {
                    const isSelected = selectedPatternCategory === catItem.id;
                    const catTitle = catItem.id === 'all' 
                      ? (t?.patterns?.allCategories || "All Categories")
                      : getCategoryLabel(catItem, fluentLanguage);
                    return (
                      <button
                        key={catItem.id}
                        className={`topic-chip-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedPatternCategory(catItem.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderColor: isSelected ? '#ec4899' : '' }}
                      >
                        <span className="topic-name">{catTitle}</span>
                        {catItem.patterns_count !== undefined && <span className="topic-count">{catItem.patterns_count}</span>}
                        {isSelected && <span style={{ fontWeight: '900', color: '#ec4899' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Difficulty & IELTS Level Tier */}
            <div className="setup-section" style={{ marginTop: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>{t?.quiz?.solvingDiffTitle || "3. Select difficulty"}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: '700' }}>
                  {selectedLevel === 'all' && (t?.quiz?.diffAll || "All Difficulties")}
                  {selectedLevel === 'easy' && (t?.quiz?.diffEasy || "Easy (Hints)")}
                  {selectedLevel === 'medium' && (t?.quiz?.diffMedium || "Medium")}
                  {selectedLevel === 'hard' && (t?.quiz?.diffHard || "Hard (Tricky)")}
                  {selectedLevel.startsWith('ielts') && `🎯 ${selectedLevel.replace('ielts_', 'Band ').replace('_', '.')}`}
                </span>
              </div>

              {/* Core 3 Difficulty Levels + All */}
              <div className="count-selector-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
                {[
                  { id: 'all', label: t?.quiz?.diffAll || "All Difficulties", desc: t?.quiz?.diffAllDesc || "Balanced mix of questions" },
                  { id: 'easy', label: t?.quiz?.diffEasy || "Easy (Hints)", desc: t?.quiz?.diffEasyDesc || "Visual hints included" },
                  { id: 'medium', label: t?.quiz?.diffMedium || "Medium", desc: t?.quiz?.diffMediumDesc || "Standard context questions" },
                  { id: 'hard', label: t?.quiz?.diffHard || "Hard (Tricky)", desc: t?.quiz?.diffHardDesc || "Word forms and synonyms" }
                ].map(lvl => (
                  <button
                    key={lvl.id}
                    className={`count-pill-btn ${selectedLevel === lvl.id ? 'active' : ''}`}
                    onClick={() => setSelectedLevel(lvl.id)}
                    style={{ textAlign: 'left', padding: '0.65rem 0.85rem' }}
                  >
                    <b>{lvl.label}</b>
                    <small style={{ display: 'block', marginTop: '2px', opacity: 0.85 }}>{lvl.desc}</small>
                  </button>
                ))}
              </div>

              {/* Granular Level Tier Selection (VSL 6 Bậc for Vietnamese vs IELTS for English) */}
              <details style={{ marginTop: '0.4rem', fontSize: '0.82rem' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 0' }}>
                  {isVietnameseTrack 
                    ? (uiLang === 'vi' ? "🇻🇳 Tùy chọn Khung 6 Bậc VSL" : uiLang === 'ru' ? "🇻🇳 Опции уровней VSL (1–6)" : "🇻🇳 VSL 6-Level Options")
                    : (t?.quiz?.ieltsOptionTitle || "IELTS Band Options")}
                </summary>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginTop: '0.6rem' }}>
                  {(isVietnameseTrack ? [
                    { id: 'vsl_1', label: uiLang === 'vi' ? '🌱 VSL Bậc 1' : uiLang === 'ru' ? '🌱 VSL Ур. 1' : '🌱 VSL Level 1', desc: uiLang === 'vi' ? 'Sơ cấp 1 (A1)' : uiLang === 'ru' ? 'Базовый 1 (A1)' : 'Elementary 1 (A1)' },
                    { id: 'vsl_2', label: uiLang === 'vi' ? '🌿 VSL Bậc 2' : uiLang === 'ru' ? '🌿 VSL Ур. 2' : '🌿 VSL Level 2', desc: uiLang === 'vi' ? 'Sơ cấp 2 (A2)' : uiLang === 'ru' ? 'Базовый 2 (A2)' : 'Elementary 2 (A2)' },
                    { id: 'vsl_3', label: uiLang === 'vi' ? '🥉 VSL Bậc 3' : uiLang === 'ru' ? '🥉 VSL Ур. 3' : '🥉 VSL Level 3', desc: uiLang === 'vi' ? 'Trung cấp 1 (B1)' : uiLang === 'ru' ? 'Средний 1 (B1)' : 'Intermediate 1 (B1)' },
                    { id: 'vsl_4', label: uiLang === 'vi' ? '🥈 VSL Bậc 4' : uiLang === 'ru' ? '🥈 VSL Ур. 4' : '🥈 VSL Level 4', desc: uiLang === 'vi' ? 'Trung cấp 2 (B2)' : uiLang === 'ru' ? 'Средний 2 (B2)' : 'Intermediate 2 (B2)' },
                    { id: 'vsl_5', label: uiLang === 'vi' ? '🥇 VSL Bậc 5' : uiLang === 'ru' ? '🥇 VSL Ур. 5' : '🥇 VSL Level 5', desc: uiLang === 'vi' ? 'Cao cấp 1 (C1)' : uiLang === 'ru' ? 'Продвинутый 1 (C1)' : 'Advanced 1 (C1)' },
                    { id: 'vsl_6', label: uiLang === 'vi' ? '👑 VSL Bậc 6' : uiLang === 'ru' ? '👑 VSL Ур. 6' : '👑 VSL Level 6', desc: uiLang === 'vi' ? 'Cao cấp 2 (C2)' : uiLang === 'ru' ? 'Владение (C2)' : 'Mastery 2 (C2)' }
                  ] : [
                    { id: 'ielts_4_5', label: '🥉 IELTS 4.0 - 5.0', desc: 'A2 - B1' },
                    { id: 'ielts_55_60', label: '🎖️ IELTS 5.5 - 6.0', desc: 'B1 - B2' },
                    { id: 'ielts_65_70', label: '🥈 IELTS 6.5 - 7.0', desc: 'B2 - C1' },
                    { id: 'ielts_75_80', label: '🥇 IELTS 7.5 - 8.0', desc: 'C1 Mastery' },
                    { id: 'ielts_85_90', label: '👑 IELTS 8.5 - 9.0', desc: 'C2 Native' }
                  ]).map(lvl => (
                    <button
                      key={lvl.id}
                      className={`count-pill-btn ${selectedLevel === lvl.id ? 'active' : ''}`}
                      onClick={() => setSelectedLevel(lvl.id)}
                      style={{ textAlign: 'left', padding: '0.5rem 0.7rem' }}
                    >
                      <b>{lvl.label}</b>
                      <small style={{ display: 'block', marginTop: '2px', opacity: 0.85 }}>{lvl.desc}</small>
                    </button>
                  ))}
                </div>
              </details>
            </div>

            {/* Step 4: Context Proficiency Level (Multi-select) */}
            <div className="setup-section" style={{ marginTop: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={18} color="var(--accent-primary)" />
                  <span>{isVietnameseTrack 
                    ? (uiLang === 'vi' ? "Bối Cảnh Khung Năng Lực VSL" : uiLang === 'ru' ? "Контекст уровней VSL" : "VSL Context Proficiency Level")
                    : (t?.quiz?.contextProficiencyTitle || "Context Proficiency Level")}</span>
                  <small style={{ fontWeight: 'normal', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t?.quiz?.contextProficiencyNote || "Multiple levels selectable"}</small>
                </h3>
                <span style={{ fontSize: '0.82rem', color: '#0ea5e9', fontWeight: '700' }}>
                  {selectedContextLevels.includes('all')
                    ? (t?.quiz?.contextAll || "All Levels")
                    : `🎯 (${selectedContextLevels.map(l => l.toUpperCase().replace('_', '-')).join(', ')})`}
                </span>
              </div>

              <div className="count-selector-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.6rem', marginBottom: '0.6rem' }}>
                {(isVietnameseTrack ? [
                  { 
                    id: 'all', 
                    label: uiLang === 'vi' ? 'Tất cả các bậc' : uiLang === 'ru' ? 'Все уровни VSL' : 'All VSL Levels', 
                    desc: uiLang === 'vi' ? 'Linh hoạt Bậc 1 đến Bậc 6' : uiLang === 'ru' ? 'От Ур. 1 до Ур. 6' : 'Flexible from Level 1 to 6' 
                  },
                  { 
                    id: 'a1_a2', 
                    label: uiLang === 'vi' ? 'Bậc 1 - 2 (Sơ cấp)' : uiLang === 'ru' ? 'Ур. 1 - 2 (Базовый)' : 'Level 1 - 2 (Elementary)', 
                    desc: uiLang === 'vi' ? 'Giao tiếp đời sống & xưng hô' : uiLang === 'ru' ? 'Повседневное общение' : 'Daily life & greetings' 
                  },
                  { 
                    id: 'b1', 
                    label: uiLang === 'vi' ? 'Bậc 3 (Trung cấp 1)' : uiLang === 'ru' ? 'Ур. 3 (Средний 1)' : 'Level 3 (Intermediate 1)', 
                    desc: uiLang === 'vi' ? 'Công sở & liên từ quan hệ' : uiLang === 'ru' ? 'Деловое общение' : 'Workplace & connectors' 
                  },
                  { 
                    id: 'b2', 
                    label: uiLang === 'vi' ? 'Bậc 4 (Trung cấp 2)' : uiLang === 'ru' ? 'Ур. 4 (Средний 2)' : 'Level 4 (Intermediate 2)', 
                    desc: uiLang === 'vi' ? 'Từ láy & biểu đạt ngữ cảnh' : uiLang === 'ru' ? 'Контекстные выражения' : 'Nuances & expressions' 
                  },
                  { 
                    id: 'c1', 
                    label: uiLang === 'vi' ? 'Bậc 5 (Cao cấp 1)' : uiLang === 'ru' ? 'Ур. 5 (Продвинутый 1)' : 'Level 5 (Advanced 1)', 
                    desc: uiLang === 'vi' ? 'Từ Hán-Việt & báo chí chính luận' : uiLang === 'ru' ? 'Публицистика и Хань-Вьет' : 'Sino-Vietnamese & press' 
                  },
                  { 
                    id: 'c2', 
                    label: uiLang === 'vi' ? 'Bậc 6 (Cao cấp 2)' : uiLang === 'ru' ? 'Ур. 6 (Владение)' : 'Level 6 (Mastery 2)', 
                    desc: uiLang === 'vi' ? 'Thành ngữ & tu từ học thuật' : uiLang === 'ru' ? 'Идиомы и стилистика' : 'Idioms & literature nuance' 
                  }
                ] : [
                  { id: 'all', label: t?.quiz?.contextAll || "All Levels", desc: t?.quiz?.contextAllDesc || "Flexible from A1 to C2" },
                  { id: 'a1_a2', label: t?.quiz?.contextA1A2 || "A1 - A2 (Basic)", desc: t?.quiz?.contextA1A2Desc || "Short daily conversations" },
                  { id: 'b1', label: t?.quiz?.contextB1 || "B1 (Intermediate)", desc: t?.quiz?.contextB1Desc || "Workplace and everyday talk" },
                  { id: 'b2', label: t?.quiz?.contextB2 || "B2 (Upper Intermediate)", desc: t?.quiz?.contextB2Desc || "Professional scenarios" },
                  { id: 'c1', label: t?.quiz?.contextC1 || "C1 (Advanced)", desc: t?.quiz?.contextC1Desc || "Academic IELTS 7.0 - 8.0" },
                  { id: 'c2', label: t?.quiz?.contextC2 || "C2 (Mastery)", desc: t?.quiz?.contextC2Desc || "Native IELTS 8.5 - 9.0" }
                ]).map(lvl => {
                  const isPicked = selectedContextLevels.includes(lvl.id);
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      className={`count-pill-btn ${isPicked ? 'active' : ''}`}
                      onClick={() => toggleContextLevel(lvl.id)}
                      style={{
                        textAlign: 'left',
                        padding: '0.65rem 0.85rem',
                        position: 'relative',
                        border: isPicked ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: isPicked ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b>{lvl.label}</b>
                        {isPicked && <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>}
                      </div>
                      <small style={{ display: 'block', marginTop: '2px', opacity: 0.85 }}>{lvl.desc}</small>
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💡</span>
                <span>{t?.quiz?.contextMultiSelectTip || "Select multiple levels at once."}</span>
              </div>
            </div>

            {/* Step 5 & 6: Question Count & Mode */}
            <div className="setup-grid-row">
              <div className="setup-section">
                <h3>{t?.quiz?.questionCountTitle || "Question count"}</h3>
                <div className="count-selector-row">
                  {[5, 10, 15].map(cnt => (
                    <button
                      key={cnt}
                      className={`count-pill-btn ${questionCount === cnt ? 'active' : ''}`}
                      onClick={() => setQuestionCount(cnt)}
                    >
                      <b>{cnt} {t.quiz?.numQuestions ? t.quiz.numQuestions.replace(':', '').trim() : (uiLang === 'ru' ? 'вопросов' : uiLang === 'vi' ? 'câu' : 'questions')}</b>
                      <small>{cnt === 5 ? (uiLang === 'ru' ? 'Быстро (2м)' : uiLang === 'en' ? 'Quick (2m)' : 'Nhanh (2p)') : cnt === 10 ? (uiLang === 'ru' ? 'Стандарт (5м)' : uiLang === 'en' ? 'Standard (5m)' : 'Chuẩn (5p)') : (uiLang === 'ru' ? 'Глубокий (8м)' : uiLang === 'en' ? 'Deep (8m)' : 'Chuyên sâu (8p)')}</small>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🛡️</span>
                  <span>{t?.quiz?.questionUniqueNotice || "100% unique words per question."}</span>
                </div>
              </div>

              <div className="setup-section">
                <h3>{t?.quiz?.questionModeTitle || "Question mode"}</h3>
                <div className="mode-selector-row">
                  {[
                    { id: 'mixed', label: t?.quiz?.modeMixed || "Mixed", icon: Shuffle },
                    { id: 'meaning_vi', label: t?.quiz?.modeMeaningVi || "Pick Meaning", icon: FileText },
                    { id: 'cloze_blank', label: t?.quiz?.modeCloze || "Fill Blank", icon: Edit3 },
                    { id: 'listening', label: t?.quiz?.modeListening || "Listening", icon: Headphones }
                  ].map(m => {
                    const IconComp = m.icon;
                    return (
                      <button
                        key={m.id}
                        className={`mode-pill-btn ${quizMode === m.id ? 'active' : ''}`}
                        onClick={() => setQuizMode(m.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <IconComp size={14} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Start Button Options */}
            <div className="lobby-submit-row" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary start-quiz-big-btn"
                onClick={() => handleStartQuiz(false)}
                disabled={loading}
                style={{ flex: 1, minWidth: '220px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Zap size={18} />
                <span>{loading ? (t?.common?.loading || "Loading...") : (t?.quiz?.instantQuizBtn || "Start Quiz Now")}</span>
              </button>
              <button 
                className="btn btn-secondary start-quiz-big-btn"
                onClick={() => handleStartQuiz(true)}
                disabled={loading}
                style={{ flex: 1, minWidth: '220px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Sparkles size={18} />
                <span>{loading ? (t?.common?.loading || "Loading...") : (t?.quiz?.aiQuizBtn || "Generate AI Quiz")}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
}
