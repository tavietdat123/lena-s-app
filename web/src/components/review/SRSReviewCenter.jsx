import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Volume2, 
  RotateCw, 
  CheckCircle2, 
  ArrowRight, 
  Award,
  BookOpen,
  Headphones,
  FileText,
  Keyboard,
  Trophy,
  Puzzle,
  Sparkles,
  Diamond,
  XCircle,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playAudio, audioService } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';
import { getDisplayLevel } from '../../constants/levelAdapter';
import { getDisplayPos } from '../../constants/posAdapter';

// Escape regex special characters safely
function escapeRegExp(string) {
  return String(string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Format dynamic interval label (SM-2+ multi-milestone)
function getPreviewLabel(item, grade, lang = 'vi') {
  if (item?.previewIntervals?.[grade]?.text) {
    return item.previewIntervals[grade].text;
  }
  const isIntra = item?.isIntraDay || item?.repetition === 0 || item?.interval === 0;
  const rep = isIntra ? 0 : (item?.repetition || 0);
  const units = {
    vi: { min: '< 10 phút', d: 'ngày' },
    en: { min: '< 10 min', d: 'days' },
    ru: { min: '< 10 мин', d: 'дн.' }
  }[lang] || { min: '< 10 phút', d: 'ngày' };

  if (grade === 'again') return units.min;
  if (grade === 'hard') return `${rep === 0 ? 1 : rep === 1 ? 2 : rep === 2 ? 4 : 8} ${units.d}`;
  if (grade === 'good') return `${rep === 0 ? 3 : rep === 1 ? 7 : rep === 2 ? 14 : 30} ${units.d}`;
  if (grade === 'easy') return `${rep === 0 ? 7 : rep === 1 ? 14 : rep === 2 ? 30 : 60} ${units.d}`;
  return `3 ${units.d}`;
}

export default function SRSReviewCenter({ 
  dueItems = [], 
  allWords = [], 
  allPatterns = [], 
  onAddWord, 
  onReviewSubmit, 
  onFinishSession 
}) {
  const { t, uiLang, targetLanguage, isVietnameseTrack, fluentLanguage, getWordMeaning } = useLanguage();
  const currentLang = uiLang || 'vi';
  // 1. Cramming Mode: review all cards even when 0 due
  const [isCramming, setIsCramming] = useState(false);

  // 2. Deck Filter: 'all' | 'words' | 'patterns'
  const [filterScope, setFilterScope] = useState('all');

  // 3. Active Recall Mode: 'flashcard' | 'cloze' | 'audio'
  const [reviewMode, setReviewMode] = useState('flashcard');

  // Active items pool (either due items or cramming all items)
  const activeItemsPool = useMemo(() => {
    if (isCramming) {
      const wordsList = (allWords || []).map(w => ({ ...w, type: 'word' }));
      const patternsList = (allPatterns || []).map(p => ({ ...p, type: 'pattern' }));
      return [...wordsList, ...patternsList];
    }
    return Array.isArray(dueItems) ? dueItems : [];
  }, [isCramming, dueItems, allWords, allPatterns]);

  // Session & Card State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
    earnedXp: 0,
  });

  // Calculate filtered counts for badge display
  const wordsCount = useMemo(() => activeItemsPool.filter(i => (i?.type || 'word') === 'word').length, [activeItemsPool]);
  const patternsCount = useMemo(() => activeItemsPool.filter(i => i?.type === 'pattern').length, [activeItemsPool]);

  // Base items pool based on filter
  const baseDeck = useMemo(() => {
    if (filterScope === 'words') return activeItemsPool.filter(i => (i?.type || 'word') === 'word');
    if (filterScope === 'patterns') return activeItemsPool.filter(i => i?.type === 'pattern');
    return activeItemsPool;
  }, [activeItemsPool, filterScope]);

  // Session deck queue that dynamically re-queues cards graded 'again'
  const [sessionDeck, setSessionDeck] = useState(baseDeck);

  // Sync sessionDeck with baseDeck when starting or when base pool updates before reviews begin
  useEffect(() => {
    if (sessionStats.reviewed === 0) {
      setSessionDeck(baseDeck);
    }
  }, [baseDeck, sessionStats.reviewed]);

  // Reset index safely if filter changes or deck is smaller than currentIndex
  useEffect(() => {
    if (!isCompleted && currentIndex >= sessionDeck.length && sessionDeck.length > 0) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setUserAnswer('');
      setIsAnswerChecked(false);
    }
  }, [sessionDeck.length, currentIndex, isCompleted]);

  const handleFilterChange = (scope) => {
    setFilterScope(scope);
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserAnswer('');
    setIsAnswerChecked(false);
    let newDeck = activeItemsPool;
    if (scope === 'words') newDeck = activeItemsPool.filter(i => (i?.type || 'word') === 'word');
    else if (scope === 'patterns') newDeck = activeItemsPool.filter(i => i?.type === 'pattern');
    setSessionDeck(newDeck);
  };

  const filteredCategoryDeck = sessionDeck;
  const currentItem = sessionDeck[currentIndex] || null;
  const isWord = (currentItem?.type || 'word') === 'word';

  const primaryExample = useMemo(() => {
    if (!currentItem) return '';
    if (Array.isArray(currentItem.examples) && currentItem.examples.length > 0) {
      const ex = currentItem.examples[0];
      return typeof ex === 'string' ? ex : (ex?.en || ex?.vi || ex?.sentence || '');
    }
    if (typeof currentItem.examples === 'string') {
      try {
        const parsed = JSON.parse(currentItem.examples);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ex = parsed[0];
          return typeof ex === 'string' ? ex : (ex?.en || ex?.vi || ex?.sentence || '');
        }
      } catch (e) {
        return currentItem.examples;
      }
    }
    return '';
  }, [currentItem]);

  const safeCollocations = useMemo(() => {
    if (!currentItem?.collocations) return [];
    if (Array.isArray(currentItem.collocations)) return currentItem.collocations;
    if (typeof currentItem.collocations === 'string') {
      try {
        const parsed = JSON.parse(currentItem.collocations);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  }, [currentItem]);

  // Confetti on session completion
  useEffect(() => {
    if (isCompleted && sessionStats.reviewed > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    }
  }, [isCompleted, sessionStats.reviewed]);

  // Autoplay audio on audio mode (debounced with lastPlayedKeyRef to eliminate double play)
  const lastPlayedKeyRef = useRef('');
  useEffect(() => {
    if (reviewMode === 'audio' && currentItem && !isFlipped && !isCompleted) {
      const itemKey = `${currentIndex}:${currentItem.id || currentItem.word || currentItem.name}`;
      if (lastPlayedKeyRef.current !== itemKey) {
        lastPlayedKeyRef.current = itemKey;
        playAudio(currentItem.word || currentItem.name, currentItem.audio_url);
      }
    }
  }, [currentIndex, reviewMode, isFlipped, isCompleted, currentItem]);

  // Keyboard Shortcuts (Space to flip, 1/2/3/4 to grade)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (isCompleted || !currentItem) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade('again');
        if (e.key === '2') handleGrade('hard');
        if (e.key === '3') handleGrade('good');
        if (e.key === '4') handleGrade('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, isCompleted, currentItem]);

  // Handle Rating Submission
  const handleGrade = (rating) => {
    if (!currentItem) return;

    try {
      if (rating === 'again') {
        audioService.playWrongSound();
      } else {
        audioService.playCorrectSound();
      }
    } catch (e) {
      console.warn('Audio warning:', e);
    }

    // XP calculation
    const xpMap = { again: 1, hard: 4, good: 7, easy: 10 };
    const xp = xpMap[rating] || 5;

    // Optimistically submit in background so UI transitions instantly with zero freeze
    if (onReviewSubmit) {
      try {
        Promise.resolve(onReviewSubmit(currentItem.id, currentItem.type || 'word', rating)).catch(err => {
          console.error('Lỗi khi submit review:', err);
        });
      } catch (err) {
        console.error('Submit review error:', err);
      }
    }

    // Update Session Metrics
    setSessionStats(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      againCount: rating === 'again' ? prev.againCount + 1 : prev.againCount,
      hardCount: rating === 'hard' ? prev.hardCount + 1 : prev.hardCount,
      goodCount: rating === 'good' ? prev.goodCount + 1 : prev.goodCount,
      easyCount: rating === 'easy' ? prev.easyCount + 1 : prev.easyCount,
      earnedXp: prev.earnedXp + xp
    }));

    if (currentIndex + 1 < sessionDeck.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setUserAnswer('');
      setIsAnswerChecked(false);
    } else {
      try {
        audioService.playVictorySound();
      } catch (e) {}
      setIsCompleted(true);
    }
  };

  const getClozeSentence = (sentence, word) => {
    if (!sentence || !word) return sentence || '';
    try {
      const cleanTarget = String(word).trim();
      const escaped = escapeRegExp(cleanTarget);
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      if (regex.test(sentence)) {
        return sentence.replace(regex, '________');
      }
      const simpleRegex = new RegExp(escaped, 'gi');
      return sentence.replace(simpleRegex, '________');
    } catch (e) {
      return String(sentence).replace(String(word), '________');
    }
  };

  // Case 1: Session actually completed after reviewing cards
  if (isCompleted && sessionStats.reviewed > 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', maxWidth: '680px', margin: '2rem auto', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)' }}>
        <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)' }}>
          <Trophy size={42} />
        </div>
        <h3 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {t?.review?.completeTitle || "Session Completed!"}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
          {typeof t.review?.reviewedSummary === 'function' 
            ? t.review.reviewedSummary(sessionStats.reviewed)
            : `Bạn đã rèn giũa ${sessionStats.reviewed} lượt ôn tập với thuật toán SuperMemo SM-2+. Toàn bộ chu kỳ vàng của trí nhớ đã được dời lịch tự động!`}
        </p>

        {/* Breakdown Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', maxWidth: '480px', margin: '0 auto 1.75rem auto' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t?.review?.statRemembered || "REMEMBERED"}</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
              {sessionStats.goodCount + sessionStats.easyCount + sessionStats.hardCount}
            </div>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t?.review?.statAgain || "AGAIN"}</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '0.2rem' }}>
              {sessionStats.againCount}
            </div>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t?.review?.statXp || "XP EARNED"}</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
              +{sessionStats.earnedXp} XP
            </div>
          </div>
        </div>

        {sessionStats.againCount > 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.75rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.65rem 1rem', borderRadius: '12px', display: 'inline-block' }}>
            ℹ️ {sessionStats.againCount} {t?.review?.again || "Again (1)"}
          </p>
        )}

        <button onClick={onFinishSession} className="btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem', margin: '0 auto', borderRadius: '14px' }}>
          <span>{t?.review?.backDashboardBtn || "Back to Dashboard"}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // Case 2: Zero active items (only if user has not reviewed anything yet)
  if (activeItemsPool.length === 0 && sessionStats.reviewed === 0) {
    const totalVaultItems = (allWords?.length || 0) + (allPatterns?.length || 0);

    if (totalVaultItems > 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', maxWidth: '640px', margin: '2rem auto', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <CheckCircle2 size={38} />
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {t?.review?.allDueFinished || "Due cards completed!"}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 2rem auto' }}>
            {t?.review?.allDueFinishedDesc || "All cards are scheduled for future dates."}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => { setIsCramming(true); setCurrentIndex(0); setIsFlipped(false); }} 
              className="btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.85rem 1.8rem', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 800 }}
            >
              <Sparkles size={16} />
              <span>{t?.review?.freeReview || "Free Review"} ({totalVaultItems} {t?.review?.card || "Card"})</span>
            </button>
            <button 
              onClick={onFinishSession} 
              className="btn-secondary" 
              style={{ padding: '0.85rem 1.5rem', borderRadius: '14px', fontSize: '0.95rem' }}
            >
              {t?.review?.backDashboardBtn || "Back to Dashboard"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', maxWidth: '600px', margin: '2rem auto', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
          <BookOpen size={36} />
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          {t?.review?.emptyDeckTitle || "Your deck is empty"}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          {t?.review?.emptyDeckDesc || "Add words to start spaced repetition."}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
          {onAddWord && (
            <button onClick={onAddWord} className="btn-primary" style={{ padding: '0.8rem 1.8rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>➕ {t?.review?.addFirstWord || "Add first word"}</span>
            </button>
          )}
          <button onClick={onFinishSession} className="btn-secondary" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px' }}>
            {t?.review?.backDashboardBtn || "Back to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '780px', margin: '0 auto' }}>
      
      {/* 1. TOP BAR: CATEGORY FILTER PILLS & MODE SWITCHER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '0.85rem 1.25rem', borderRadius: '18px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={() => handleFilterChange('all')} style={{ padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: filterScope === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: filterScope === 'all' ? '#ffffff' : 'var(--text-secondary)', transition: 'all 0.2s ease' }}>
            {t?.review?.allFilter || "All"} ({activeItemsPool.length})
          </button>
          <button onClick={() => handleFilterChange('words')} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: filterScope === 'words' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: filterScope === 'words' ? '#ffffff' : 'var(--text-secondary)', transition: 'all 0.2s ease' }}>
            <BookOpen size={13} />
            <span>{t?.review?.wordsFilter || "Words"} ({wordsCount})</span>
          </button>
          <button onClick={() => handleFilterChange('patterns')} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: filterScope === 'patterns' ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: filterScope === 'patterns' ? '#ffffff' : 'var(--text-secondary)', transition: 'all 0.2s ease' }}>
            <Puzzle size={13} />
            <span>{t?.review?.patternsFilter || "Patterns"} ({patternsCount})</span>
          </button>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '12px', gap: '2px' }}>
          <button onClick={() => { setReviewMode('flashcard'); setIsFlipped(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: reviewMode === 'flashcard' ? 'var(--bg-card)' : 'transparent', color: reviewMode === 'flashcard' ? 'var(--accent-primary)' : 'var(--text-muted)', boxShadow: reviewMode === 'flashcard' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s ease' }}>
            <BookOpen size={14} />
            <span>{t?.review?.flashcardMode || "Card Mode"}</span>
          </button>
          <button onClick={() => { setReviewMode('cloze'); setIsFlipped(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: reviewMode === 'cloze' ? 'var(--bg-card)' : 'transparent', color: reviewMode === 'cloze' ? 'var(--accent-primary)' : 'var(--text-muted)', boxShadow: reviewMode === 'cloze' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s ease' }}>
            <FileText size={14} />
            <span>{t?.review?.clozeMode || "Fill blank"}</span>
          </button>
          <button onClick={() => { setReviewMode('audio'); setIsFlipped(false); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: reviewMode === 'audio' ? 'var(--bg-card)' : 'transparent', color: reviewMode === 'audio' ? 'var(--accent-primary)' : 'var(--text-muted)', boxShadow: reviewMode === 'audio' ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s ease' }}>
            <Headphones size={14} />
            <span>{t?.review?.audioMode || "Audio only"}</span>
          </button>
        </div>
      </div>

      {/* Case 3: Empty state specifically for filtered category */}
      {filteredCategoryDeck.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            {filterScope === 'patterns' ? (
              <Puzzle size={44} color="var(--accent-primary)" />
            ) : (
              <BookOpen size={44} color="var(--accent-primary)" />
            )}
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {filterScope === 'patterns' ? (t?.review?.noDuePatterns || "No due patterns!") : (t?.review?.noDueWords || "No due words!")}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
            {t?.review?.allDueFinishedDesc || "All cards are scheduled for future dates."}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button onClick={() => setFilterScope('all')} className="btn-primary" style={{ padding: '0.65rem 1.35rem', borderRadius: '12px' }}>
              {t?.review?.reviewAllDue || "Review All Due Cards"} ({dueItems.length})
            </button>
            {filterScope !== 'words' && wordsCount > 0 && (
              <button onClick={() => setFilterScope('words')} className="btn-secondary" style={{ padding: '0.65rem 1.35rem', borderRadius: '12px' }}>
                {t?.review?.reviewWordsOnly || "Review Words Only"} ({wordsCount})
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 2. PROGRESS BAR & REALTIME STATS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t?.review?.card || "Card"} {currentIndex + 1} / {sessionDeck.length}
              </span>
              <div style={{ width: '140px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, ((currentIndex + 1) / sessionDeck.length) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-primary)' }}>
                <Award size={14} /> +{sessionStats.earnedXp} XP
              </span>
              <span>•</span>
              <span style={{ color: '#10b981' }}>✓ {sessionStats.goodCount + sessionStats.easyCount}</span>
              <span style={{ color: '#ef4444' }}>✗ {sessionStats.againCount}</span>
            </div>
          </div>

          {/* 3. 3D FLASHCARD DISPLAY CONTAINER */}
          <div 
            key={`${currentItem?.id || currentIndex}-${currentIndex}`} 
            className="flashcard-container" 
            onClick={() => (reviewMode === 'flashcard' || reviewMode === 'audio') && setIsFlipped(!isFlipped)}
          >
            <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
              
              {/* FRONT FACE */}
              <div className="flashcard-face">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${isWord ? 'badge-blue' : 'badge-purple'}`} style={{ fontWeight: 800, padding: '0.25rem 0.65rem' }}>
                      {isWord ? getDisplayLevel(currentItem?.level || 'B2', targetLanguage, uiLang, true) : (t?.review?.patternTag || "PATTERN")}
                    </span>
                    {isWord && currentItem?.part_of_speech && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        {getDisplayPos(currentItem.part_of_speech, targetLanguage, uiLang)}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    ⏱ {t?.review?.repetition || "Repetition"}: {currentItem?.repetition || 0} {t?.review?.times || "times"}
                  </span>
                </div>

                <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
                  {reviewMode === 'flashcard' && (
                    <>
                      <h3 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                        {isWord ? currentItem?.word : currentItem?.name}
                      </h3>
                      {isWord && !isVietnameseTrack && currentItem?.phonetic && (
                        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>
                          {currentItem.phonetic}
                        </p>
                      )}
                      {!isWord && currentItem?.formula && (
                        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
                          {currentItem.formula}
                        </p>
                      )}
                    </>
                  )}

                  {reviewMode === 'cloze' && (
                    <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {primaryExample ? (
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                          "{getClozeSentence(primaryExample, isWord ? currentItem?.word : currentItem?.name)}"
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {t?.review?.clozeRecallPrompt || "Điền từ mục tiêu phù hợp với ngữ nghĩa dưới đây:"}
                          </span>
                          <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--accent-primary)' }}>
                            ________
                          </span>
                        </div>
                      )}
                      <span style={{ fontSize: '0.88rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                        {t?.review?.meaningLabel || "Meaning:"} {getWordMeaning(currentItem) || currentItem?.meaning_vi || currentItem?.meaning}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              setIsAnswerChecked(true);
                              setIsFlipped(true);
                            }
                          }}
                          onClick={(e) => e.stopPropagation() }
                          placeholder={t?.review?.clozePlaceholder || "Type missing word..."}
                          className="input-control"
                          style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}
                          autoFocus
                        />
                        <button onClick={(e) => { e.stopPropagation(); setIsAnswerChecked(true); setIsFlipped(true); }} className="btn-primary" style={{ padding: '0 1.25rem', borderRadius: '12px', flexShrink: 0 }}>
                          {t?.review?.checkBtn || "Check"}
                        </button>
                      </div>
                    </div>
                  )}

                  {reviewMode === 'audio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); playAudio(currentItem?.word || currentItem?.name, currentItem?.audio_url, isVietnameseTrack ? 'vi-VN' : undefined); }} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px var(--accent-primary-glow)' }}>
                        <Volume2 size={36} />
                      </button>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {t?.review?.audioHint || "Listen audio before flipping"}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <RotateCw size={14} />
                  <span>{t?.review?.flipPrompt || "Tap or press [Space] to flip"}</span>
                </div>
              </div>

              {/* BACK FACE */}
              <div className="flashcard-face flashcard-back">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isWord ? currentItem?.word : currentItem?.name}
                    </h4>
                    <button onClick={(e) => { e.stopPropagation(); playAudio(currentItem?.word || currentItem?.name, currentItem?.audio_url, isVietnameseTrack ? 'vi-VN' : undefined); }} className="btn-icon" style={{ color: 'var(--accent-primary)', width: '32px', height: '32px' }}>
                      <Volume2 size={18} />
                    </button>
                  </div>
                  {isWord && !isVietnameseTrack && currentItem?.phonetic && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                      {currentItem.phonetic}
                    </span>
                  )}
                </div>

                <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '0.9rem', textAlign: 'left' }}>
                  {reviewMode === 'cloze' && isAnswerChecked && (
                    <div style={{
                      padding: '0.65rem 0.95rem',
                      borderRadius: '12px',
                      background: userAnswer.trim().toLowerCase() === (isWord ? currentItem?.word : currentItem?.name)?.trim().toLowerCase() 
                        ? 'rgba(16, 185, 129, 0.12)' 
                        : 'rgba(239, 68, 68, 0.12)',
                      border: `1.5px solid ${userAnswer.trim().toLowerCase() === (isWord ? currentItem?.word : currentItem?.name)?.trim().toLowerCase() ? '#10b981' : '#ef4444'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.88rem',
                      fontWeight: 700
                    }}>
                      {userAnswer.trim().toLowerCase() === (isWord ? currentItem?.word : currentItem?.name)?.trim().toLowerCase() ? (
                        <>
                          <CheckCircle2 size={18} color="#10b981" />
                          <span style={{ color: '#10b981' }}>{t?.review?.clozeCorrect || "Exact Match!"} ({userAnswer})</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={18} color="#ef4444" />
                          <span style={{ color: '#ef4444' }}>{t?.review?.clozeYourAnswer || "Your input"}: "{userAnswer || '---'}"</span>
                        </>
                      )}
                    </div>
                  )}
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {t?.review?.meaningLabel || "Meaning:"}
                    </span>
                    <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.15rem' }}>
                      {getWordMeaning(currentItem) || currentItem?.meaning || currentItem?.description}
                    </p>
                  </div>
                  {((fluentLanguage === 'en' && currentItem?.meaning_vi && currentItem?.meaning_vi !== currentItem?.meaning_en) ||
                    (fluentLanguage === 'vi' && currentItem?.meaning_en && currentItem?.meaning_en !== currentItem?.meaning_vi)) && (
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {fluentLanguage === 'en' ? currentItem.meaning_vi : currentItem.meaning_en}
                    </p>
                  )}
                  {safeCollocations.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {safeCollocations.map((c, i) => (
                        <span key={i} className="tag-pill" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                          ⚡ {typeof c === 'string' ? c : c?.phrase || c?.text || ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {primaryExample && (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-primary)' }}>
                      "{primaryExample}"
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {t?.review?.selectMemoryLevel || "Select memory level to reschedule:"}
                </div>
              </div>
            </div>
          </div>

          {/* 4. SUPERMEMO SM-2+ MULTI-MILESTONE RATING BUTTONS */}
          {isFlipped ? (
            <div className="srs-rating-buttons" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginTop: '1.25rem', position: 'relative', zIndex: 10 }}>
              <button onClick={(e) => { e.stopPropagation(); handleGrade('again'); }} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1.5px solid #ef4444', padding: '1rem 0.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.15s ease', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)' }}>
                <span style={{ fontSize: '0.98rem' }}>🔴 {t?.review?.again || "Again (1)"}</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 700 }}>{t?.review?.milestone || "Next:"} {currentLang === 'en' ? '< 10 min' : currentLang === 'ru' ? '< 10 мин' : '< 10 phút'}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>[1]</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleGrade('hard'); }} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1.5px solid #f59e0b', padding: '1rem 0.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.15s ease', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)' }}>
                <span style={{ fontSize: '0.98rem' }}>🟡 {t?.review?.hard || "Hard (2)"}</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 700 }}>{t?.review?.milestone || "Next:"} {getPreviewLabel(currentItem, 'hard', currentLang)}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>[2]</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleGrade('good'); }} style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: '1.5px solid #0284c7', padding: '1rem 0.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.15s ease', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)' }}>
                <span style={{ fontSize: '0.98rem' }}>🟢 {t?.review?.good || "Good (3)"}</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 700 }}>{t?.review?.milestone || "Next:"} {getPreviewLabel(currentItem, 'good', currentLang)}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>[3]</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleGrade('easy'); }} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1.5px solid #10b981', padding: '1rem 0.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.15s ease', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
                <span style={{ fontSize: '0.98rem' }}>💎 {t?.review?.easy || "Easy (4)"}</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.9, fontWeight: 700 }}>{t?.review?.milestone || "Next:"} {getPreviewLabel(currentItem, 'easy', currentLang)}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>[4]</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setIsFlipped(true)} className="btn-primary" style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', fontWeight: 800, borderRadius: '16px', marginTop: '1.25rem' }}>
              <RotateCw size={18} />
              <span>{t?.review?.showAnswerBtn || "Show Answer (Space)"}</span>
            </button>
          )}

          {/* Bottom Hint */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <Keyboard size={13} />
            <span>{t?.review?.keyHint || "[Space] Flip • [1] Again • [2] Hard • [3] Good • [4] Easy"}</span>
          </div>
        </>
      )}
    </div>
  );
}
