import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  FileText, 
  Sparkles, 
  BrainCircuit, 
  Settings, 
  Flame, 
  Plus, 
  Command, 
  TrendingUp, 
  Target, 
  Mic, 
  Timer, 
  Globe, 
  ShieldCheck, 
  Eye, 
  X,
  Brain,
  Award,
  Volume2
} from 'lucide-react';
import AudioSpeedPopover from './AudioSpeedPopover';
import { useLanguage } from '../../context/LanguageContext';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  stats, 
  onOpenQuickAdd, 
  onOpenSettings, 
  onOpenCommandPalette, 
  onSharePublicStats, 
  onOpenSupervisorPortal,
  isOpenMobile,
  onCloseMobile,
  gamificationProfile,
  onOpenAIMasteryReport,
  audioSpeed,
  onAudioSpeedChange,
  currentUser
}) {
  const { uiLang, t } = useLanguage();

  const navItems = [
    { id: 'dashboard', path: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { 
      id: 'vocab', 
      path: '/vocab',
      label: t.nav.vocab, 
      icon: BookOpen, 
      count: stats?.words?.total || 0 
    },
    { 
      id: 'patterns', 
      path: '/patterns',
      label: t.nav.patterns, 
      icon: Layers, 
      count: stats?.patterns?.total || 0 
    },
    { 
      id: 'quiz', 
      path: '/quiz',
      label: t.nav.quiz, 
      icon: Target,
      isNew: true
    },
    { 
      id: 'speaking', 
      path: '/speaking',
      label: t.nav.speaking, 
      icon: Mic,
      isNew: true
    },
    { 
      id: 'reader', 
      path: '/reader',
      label: t.nav.reader, 
      icon: FileText, 
      count: stats?.notes?.total || 0 
    },
    { 
      id: 'review', 
      path: '/review',
      label: t.nav.review, 
      icon: Sparkles, 
      dueCount: stats?.total_due_today || 0,
      highlight: true
    },
    { 
      id: 'timer', 
      path: '/timer',
      label: t.nav.timer, 
      icon: Timer,
      isNew: true
    },
    { 
      id: 'ai-lab', 
      path: '/ai-lab',
      label: t.nav.aiLab, 
      icon: BrainCircuit,
      isAi: true
    }
  ];

  const streak = stats?.streak || 0;
  const mastered = stats?.words?.mastered || 0;

  const handleItemClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div 
          className="sidebar-overlay" 
          onClick={onCloseMobile} 
          aria-hidden="true" 
        />
      )}
      <aside className={`app-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}>
        {/* Brand Header & Mobile Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.2rem' }}>
          <NavLink 
            to="/" 
            onClick={handleItemClick}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ 
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)', 
              width: '40px', 
              height: '40px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 6px 16px rgba(56, 189, 248, 0.35)'
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                LinguaVault
              </h1>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pro Max Hub</span>
            </div>
          </NavLink>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="sidebar-mobile-close-btn"
              style={{
                padding: '0.45rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title={t.common?.close || "Close"}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Quick Add Action Button (Primary CTA - Full height, prominent, not squished) */}
        <button 
          onClick={() => { onOpenQuickAdd(); handleItemClick(); }}
          className="btn-primary glow-hover" 
          style={{ 
            width: '100%', 
            minHeight: '44px',
            justifyContent: 'center', 
            padding: '0.8rem 1.15rem', 
            fontSize: '0.95rem', 
            fontWeight: 700,
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Plus size={19} />
          <span>{t.nav.quickAdd}</span>
        </button>

        {/* Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'dashboard' && currentTab === '');

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={handleItemClick}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.95rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: isActive ? 'var(--accent-primary-light)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.92rem',
                  transition: 'all var(--transition-fast)',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                  textDecoration: 'none'
                }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={19} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                <span>{item.label}</span>
              </div>

              {item.dueCount > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '22px',
                    height: '20px',
                    padding: '0 6px',
                    background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    lineHeight: 1,
                    boxShadow: '0 2px 8px rgba(225, 29, 72, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    letterSpacing: '-0.2px'
                  }}
                >
                  {item.dueCount}
                </span>
              )}

              {item.count !== undefined && !item.dueCount && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '18px',
                    padding: '0 6px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {item.count}
                </span>
              )}

              {item.isNew && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.25))',
                    color: '#10b981',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    lineHeight: 1
                  }}
                >
                  {t.common.new}
                </span>
              )}

              {item.isAi && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.25))',
                    color: '#a855f7',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    lineHeight: 1
                  }}
                >
                  {t.common.ai}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info, XP Bar & Settings */}
      <div style={{ 
        borderTop: '1px solid var(--border-color)', 
        paddingTop: '0.65rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.45rem',
        flexShrink: 0
      }}>
        {/* Gamification Level & AI Evaluation Widget (responsive / overflow fallback) */}
        {gamificationProfile && (
          <div className="sidebar-gamification-widget" style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.55rem 0.7rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.72rem', padding: '0.12rem 0.45rem' }}>
                  Lv.{gamificationProfile.level || 1}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '135px' }}>
                  {gamificationProfile.title || 'Novice Scholar 🌱'}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {gamificationProfile.totalXp || 0} {t.common.xp}
              </span>
            </div>

            {/* XP Progress Bar */}
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.max(5, gamificationProfile.progressPercent || 0))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                borderRadius: '2px',
                transition: 'width 0.4s ease'
              }} />
            </div>

            {/* AI Evaluation Button */}
            {onOpenAIMasteryReport && (
              <button
                type="button"
                onClick={() => { onOpenAIMasteryReport(); handleItemClick(); }}
                className="btn-secondary glow-hover"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.35rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-primary)',
                  borderColor: 'rgba(2, 132, 199, 0.3)',
                  background: 'var(--bg-card)'
                }}
              >
                <Brain size={13} />
                <span>{t.nav.aiReportBtn}</span>
              </button>
            )}
          </div>
        )}

        {/* Combined Streak & Audio Speed in a compact row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div style={{ 
            flex: 1,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)',
            padding: '0.45rem 0.65rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Flame size={16} style={{ color: 'var(--accent-warning)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{t.nav.dailyStreak}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
              {streak} {streak === 1 ? t.common.day : t.common.days}
            </span>
          </div>

          {onAudioSpeedChange && (
            <div style={{ flexShrink: 0 }}>
              <AudioSpeedPopover
                audioSpeed={audioSpeed}
                onSpeedChange={onAudioSpeedChange}
              />
            </div>
          )}
        </div>

        {/* Command Palette Trigger in Sidebar */}
        <button 
          onClick={() => { onOpenCommandPalette(); handleItemClick(); }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.45rem 0.65rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-muted)',
            fontSize: '0.78rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Command size={13} />
            <span>{t.nav.quickSearch}</span>
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            <span className="kbd-pill" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>⌘</span>
            <span className="kbd-pill" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>K</span>
          </div>
        </button>

        {/* Supervisor Portal */}
        <button 
          onClick={() => {
            if (onOpenSupervisorPortal) {
              onOpenSupervisorPortal();
            } else {
              const url = `${window.location.origin}/giam-sat`;
              window.open(url, '_blank');
            }
            handleItemClick();
          }}
          className="btn-secondary glow-hover" 
          style={{ 
            width: '100%', 
            justifyContent: 'flex-start', 
            padding: '0.45rem 0.65rem',
            fontSize: '0.8rem',
            borderRadius: 'var(--radius-md)',
            borderColor: 'rgba(2, 132, 199, 0.35)',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(56, 189, 248, 0.08) 100%)'
          }}
          title={t.nav?.supervisorLink || "Supervisor"}
        >
          <ShieldCheck size={15} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 700 }}>{t.nav.supervisorPortal}</span>
        </button>

        {/* Settings button */}
        <button 
          onClick={() => { onOpenSettings(); handleItemClick(); }}
          className="btn-secondary" 
          style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.65rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)' }}
        >
          <Settings size={15} />
          <span>{t.nav.settings}</span>
        </button>
      </div>
    </aside>
    </>
  );
}
