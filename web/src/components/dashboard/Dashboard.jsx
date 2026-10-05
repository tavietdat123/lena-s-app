import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Volume2, 
  ArrowRight,
  TrendingUp,
  Brain,
  Award,
  Clock,
  Target,
  Share2,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { playAudio } from '../../services/audioService';
import ActivityHistoryChart from '../common/ActivityHistoryChart';
import { useLanguage } from '../../context/LanguageContext';

export default function Dashboard({ 
  stats, 
  recentWords = [], 
  onStartReview, 
  onNavigate, 
  audioSpeed = 1.0, 
  gamificationProfile,
  onOpenAIMasteryReport,
  onSharePublicStats,
  onOpenSupervisorPortal
}) {
  const { uiLang, t } = useLanguage();
  const [playingWordId, setPlayingWordId] = useState(null);

  const totalDue = stats?.total_due_today || 0;
  const wordStats = stats?.words || {};
  const streak = stats?.streak || 0;

  const currentLevel = gamificationProfile?.level || 1;
  const currentTitle = gamificationProfile?.title || 'Novice Scholar 🌱';
  const totalXp = gamificationProfile?.totalXp || 0;
  const progressPercent = gamificationProfile?.progressPercent || 0;
  const nextLevel = gamificationProfile?.nextLevel || 2;

  const handlePlayAudio = (w) => {
    setPlayingWordId(w.id);
    playAudio(w.word, w.audio_url, null, audioSpeed);
    setTimeout(() => setPlayingWordId(null), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. HERO SRS REVIEW CALL-TO-ACTION PRO MAX */}
      <div className="dashboard-hero-card" style={{
        background: totalDue > 0 
          ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)'
          : 'linear-gradient(135deg, #10b981 0%, #047857 50%, #064e3b 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Background Glow */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          bottom: '-50px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.85rem',
            letterSpacing: '0.04em'
          }}>
            <Sparkles size={15} />
            <span>SPACED REPETITION ENGINE (SM-2)</span>
          </div>

          <h3 style={{ fontSize: '2.1rem', fontWeight: '800', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '0.65rem' }}>
            {totalDue > 0 
              ? (uiLang === 'ru' ? `Сегодня у вас ${totalDue} карточек для повторения` : uiLang === 'en' ? `You have ${totalDue} cards due for review today` : `Hôm nay bạn có ${totalDue} thẻ cần ôn tập`)
              : (uiLang === 'ru' ? 'Отлично! Вы завершили все цели на сегодня' : uiLang === 'en' ? 'Awesome! You have completed all reviews for today' : 'Tuyệt vời! Bạn đã hoàn thành hết mục tiêu hôm nay')}
          </h3>

          <p style={{ opacity: 0.92, fontSize: '1rem', lineHeight: 1.5 }}>
            {totalDue > 0
              ? (uiLang === 'ru' ? 'Повторите карточки вовремя, чтобы защитить память от кривой забывания.' : uiLang === 'en' ? 'Spend 3-5 minutes reviewing at the golden moment to fight the forgetting curve.' : 'Dành 3-5 phút ôn lại đúng thời điểm vàng để chống lại đường cong lãng quên (Forgetting Curve).')
              : (uiLang === 'ru' ? 'Все слова и грамматические структуры находятся в безопасном цикле долговременной памяти.' : uiLang === 'en' ? 'All words and structures are safely retained in long-term memory.' : 'Mọi từ vựng và cấu trúc đều đang nằm trong chu kỳ ghi nhớ dài hạn an toàn.')}
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {totalDue > 0 ? (
            <button
              onClick={onStartReview}
              style={{
                background: '#ffffff',
                color: '#0369a1',
                padding: '1rem 1.75rem',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 800,
                fontSize: '1.05rem',
                boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                transition: 'all var(--transition-bounce)'
              }}
              className="glow-hover"
            >
              <span>{t.dashboard.startReviewBtn}</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('vocab')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                padding: '0.9rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                backdropFilter: 'blur(10px)'
              }}
            >
              <span>{t.dashboard.addWordBtn}</span>
              <ArrowRight size={18} />
            </button>
          )}

          <button
            onClick={() => onNavigate('quiz')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              padding: '0.9rem 1.35rem',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.35)'
            }}
            className="glow-hover"
          >
            <Target size={18} />
            <span>{uiLang === 'ru' ? 'Викторина' : uiLang === 'en' ? 'Topic Quiz' : 'Làm Quiz'}</span>
          </button>

          <button
            onClick={() => onNavigate('speaking')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              padding: '0.9rem 1.35rem',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.35)'
            }}
            className="glow-hover"
          >
            <Sparkles size={18} />
            <span>{uiLang === 'ru' ? 'Тренировка речи' : uiLang === 'en' ? 'Speaking Lab' : 'Luyện Speaking AI'}</span>
          </button>

          {onOpenAIMasteryReport && (
            <button
              onClick={onOpenAIMasteryReport}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                padding: '0.9rem 1.35rem',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.35)',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
              }}
              className="glow-hover"
            >
              <Brain size={18} />
              <span>{t.nav.aiReportBtn}</span>
            </button>
          )}

          {/* Button 1: Open Supervisor UI in a new tab immediately */}
          <button
            onClick={onOpenSupervisorPortal || (() => {
              const url = `${window.location.origin}/giam-sat`;
              window.open(url, '_blank');
            })}
            style={{
              background: 'rgba(255,255,255,0.22)',
              color: '#ffffff',
              padding: '0.9rem 1.35rem',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.45)',
              cursor: 'pointer'
            }}
            className="glow-hover"
            title={t.dashboard.supervisorPortalBtn || "Mở giao diện Cổng Giám Sát"}
          >
            <Eye size={18} />
            <span>{t.dashboard.supervisorPortalBtn || 'Xem Cổng Giám Sát'}</span>
          </button>

          {/* Button 2: Copy Supervisor Link */}
          <button
            onClick={() => {
              if (onSharePublicStats) {
                onSharePublicStats();
              } else {
                const url = `${window.location.origin}/giam-sat`;
                navigator.clipboard.writeText(url);
                window.open(url, '_blank');
              }
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer'
            }}
            className="glow-hover"
            title={t.dashboard.supervisorLinkBtn || "Sao chép link Cổng Giám Sát"}
          >
            <Share2 size={17} />
            <span>{t.dashboard.supervisorLinkBtn || 'Link Người Giám Sát'}</span>
          </button>
        </div>
      </div>

      {/* SUPERVISOR RECENT MESSAGE BANNER */}
      {stats?.supervisorFeedbacks && stats.supervisorFeedbacks.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '1rem 1.5rem',
          border: '1.5px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📢</span>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t.dashboard.supervisorMessageTitle || 'Lời Nhắn Mới Từ Người Giám Sát'} ({stats.supervisorFeedbacks[0].supervisor_name}):
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                "{stats.supervisorFeedbacks[0].message}"
              </div>
            </div>
          </div>
          <button
            onClick={onOpenSupervisorPortal || (() => {
              const url = `${window.location.origin}/giam-sat`;
              window.open(url, '_blank');
            })}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', borderRadius: '10px' }}
          >
            <span>{t.dashboard.openSupervisorBtn || 'Mở Cổng Giám Sát'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 2. PRO MAX STATS & LEVEL CARD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {/* Streak & Gamification Level Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                LEVEL {currentLevel} • {totalXp} XP
              </span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--text-primary)' }}>
                {currentTitle}
              </h4>
            </div>
            <div style={{ background: 'var(--accent-primary-light)', padding: '0.6rem', borderRadius: 'var(--radius-lg)', color: 'var(--accent-primary)' }}>
              <Award size={22} />
            </div>
          </div>

          {/* XP Progress Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{t.dashboard.levelProgress ? t.dashboard.levelProgress(nextLevel) : `Tiến độ lên Lv.${nextLevel}`}</span>
              <b>{progressPercent}%</b>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.max(5, progressPercent))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                borderRadius: '3px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t.dashboard.dailyStreak || 'Daily Streak:'}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
                🔥 {t.dashboard.daysInRow ? t.dashboard.daysInRow(streak) : `${streak} ngày liên tục`}
              </span>
              {stats?.max_streak > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {t.dashboard.recordStreak ? t.dashboard.recordStreak(stats.max_streak) : `(Kỷ lục: ${stats.max_streak})`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Words Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'var(--accent-primary-light)', padding: '1rem', borderRadius: 'var(--radius-xl)', color: 'var(--accent-primary)' }}>
            <BookOpen size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.dashboard.totalWords}</span>
            <h4 style={{ fontSize: '1.85rem', fontWeight: '800', lineHeight: 1.1, marginTop: '0.2rem' }}>
              {wordStats.total || 0}
            </h4>
          </div>
        </div>

        {/* Mastered Words Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'var(--accent-success-light)', padding: '1rem', borderRadius: 'var(--radius-xl)', color: 'var(--accent-success)' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.dashboard.masteredWords}</span>
            <h4 style={{ fontSize: '1.85rem', fontWeight: '800', lineHeight: 1.1, marginTop: '0.2rem' }}>
              {wordStats.mastered || 0}
            </h4>
          </div>
        </div>

        {/* Patterns Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'var(--accent-purple-light)', padding: '1rem', borderRadius: 'var(--radius-xl)', color: 'var(--accent-purple)' }}>
            <Layers size={28} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.nav.patterns}</span>
            <h4 style={{ fontSize: '1.85rem', fontWeight: '800', lineHeight: 1.1, marginTop: '0.2rem' }}>
              {stats?.patterns?.total || 0}
            </h4>
          </div>
        </div>
      </div>

      {/* 3. RETENTION PROGRESS BAR PRO MAX */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-primary)' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{t.dashboard.retentionStagesTitle || 'Chỉ Số Phân Bổ Trí Nhớ (Memory Retention Stages)'}</h4>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t.dashboard.totalItems ? t.dashboard.totalItems(wordStats.total || 0) : `Tổng cộng: ${wordStats.total || 0} mục`}
          </span>
        </div>

        {/* Progress bar stack */}
        <div style={{
          display: 'flex',
          height: '14px',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          background: 'var(--bg-tertiary)',
          marginBottom: '1.35rem'
        }}>
          {wordStats.total > 0 && (
            <>
              <div 
                style={{ 
                  width: `${((wordStats.mastered || 0) / wordStats.total) * 100}%`, 
                  background: 'var(--accent-success)',
                  transition: 'width 0.5s ease'
                }} 
                title={`Mastered: ${wordStats.mastered}`}
              />
              <div 
                style={{ 
                  width: `${((wordStats.reviewing || 0) / wordStats.total) * 100}%`, 
                  background: 'var(--accent-primary)',
                  transition: 'width 0.5s ease'
                }} 
                title={`Reviewing: ${wordStats.reviewing}`}
              />
              <div 
                style={{ 
                  width: `${((wordStats.learning || 0) / wordStats.total) * 100}%`, 
                  background: 'var(--accent-warning)',
                  transition: 'width 0.5s ease'
                }} 
                title={`Learning: ${wordStats.learning}`}
              />
              <div 
                style={{ 
                  width: `${((wordStats.new || 0) / wordStats.total) * 100}%`, 
                  background: 'var(--text-muted)',
                  transition: 'width 0.5s ease'
                }} 
                title={`New: ${wordStats.new}`}
              />
            </>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.75rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-success)' }} />
            <span>{t.dashboard.stageMastered || 'Mastered'}: <b>{wordStats.mastered || 0}</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
            <span>{t.dashboard.stageReviewing || 'Reviewing'}: <b>{wordStats.reviewing || 0}</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-warning)' }} />
            <span>{t.dashboard.stageLearning || 'Learning'}: <b>{wordStats.learning || 0}</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-muted)' }} />
            <span>{t.dashboard.stageNew || 'New'}: <b>{wordStats.new || 0}</b></span>
          </div>
        </div>
      </div>

      {/* 3.5 MULTI-PERIOD INTERACTIVE ACTIVITY CHART */}
      {stats?.periodsData && (
        <ActivityHistoryChart 
          periodsData={stats.periodsData} 
          defaultPeriod="all"
          title={uiLang === 'ru' ? 'График учебного процесса' : uiLang === 'en' ? 'Study Activity Progress Chart' : 'Biểu Đồ Tiến Trình Học Tập'}
        />
      )}

      {/* 4. RECENT VOCABULARY SECTION WITH AUDIO VISUALIZER */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t.dashboard.recentWordsTitle || 'Từ Vựng & Cụm Từ Nổi Bật Gần Đây'}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{uiLang === 'ru' ? 'Нажмите на динамик для прослушивания' : uiLang === 'en' ? 'Tap audio icon to hear native pronunciation' : 'Chạm biểu tượng loa để nghe phát âm tự nhiên'}</p>
          </div>
          <button 
            onClick={() => onNavigate('vocab')} 
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <span>{t.dashboard.viewAll || 'Xem tất cả'}</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {recentWords.slice(0, 6).map(w => {
            const isPlaying = playingWordId === w.id;

            return (
              <div key={w.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h5 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{w.word}</h5>
                      <button 
                        onClick={() => handlePlayAudio(w)}
                        className="btn-icon"
                        style={{ padding: '0.3rem', color: 'var(--accent-primary)' }}
                        title="Nghe phát âm chuẩn"
                      >
                        {isPlaying ? (
                          <div className="sound-wave">
                            <span /><span /><span /><span />
                          </div>
                        ) : (
                          <Volume2 size={18} />
                        )}
                      </button>
                    </div>
                    {w.phonetic && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {w.phonetic}
                      </span>
                    )}
                  </div>

                  <span className="badge badge-blue">{w.level || 'B2'}</span>
                </div>

                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {w.meaning_vi}
                </p>

                {w.examples && w.examples.length > 0 && (
                  <div style={{ 
                    background: 'var(--bg-tertiary)', 
                    padding: '0.65rem 0.85rem', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    borderLeft: '3px solid var(--accent-primary)'
                  }}>
                    "{w.examples[0]}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
