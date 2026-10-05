import React from 'react';
import { Moon, Sun, Search, Sparkles, Flame, Volume2, Command, Brain, Menu } from 'lucide-react';
import AudioSpeedPopover from './AudioSpeedPopover';
import LevelPill from '../gamification/LevelPill';
import UserProfileDropdown from '../auth/UserProfileDropdown';
import { useLanguage } from '../../context/LanguageContext';

export default function Header({ 
  currentTab, 
  isDark, 
  toggleTheme, 
  stats, 
  onOpenCommandPalette,
  audioSpeed = 0.9,
  onAudioSpeedChange,
  gamificationProfile,
  onOpenAIMasteryReport,
  currentUser,
  onOpenProfileEdit,
  onOpenSettings,
  onLogout,
  onToggleMobileMenu
}) {
  const { uiLang, t } = useLanguage();

  const current = t.header.titles[currentTab] || { title: 'LinguaVault Pro Max', desc: 'Personal Knowledge Hub' };

  // Component control nodes (shared across desktop and mobile views)
  const levelPillNode = (
    <LevelPill 
      profile={gamificationProfile} 
      onOpenReport={onOpenAIMasteryReport} 
    />
  );

  const aiReportNode = onOpenAIMasteryReport && (
    <button
      onClick={onOpenAIMasteryReport}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
        border: '1px solid rgba(2, 132, 199, 0.3)',
        padding: '0.45rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        color: 'var(--accent-primary)',
        fontSize: '0.8rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}
      className="hover-card header-ai-report-btn"
      title={t.header.aiReportTooltip}
    >
      <Brain size={14} />
      <span>{t.header.aiReportBtn}</span>
    </button>
  );

  const searchNode = (
    <button
      onClick={onOpenCommandPalette}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '0.45rem 0.75rem',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}
      className="glow-hover header-search-btn"
    >
      <Search size={15} style={{ color: 'var(--accent-primary)' }} />
      <span className="header-search-text">{t.header.searchBtn}</span>
      <span className="kbd-pill" style={{ padding: '0.1rem 0.35rem', fontSize: '0.7rem' }}>⌘K</span>
    </button>
  );

  const audioSpeedNode = (
    <AudioSpeedPopover
      audioSpeed={audioSpeed}
      onSpeedChange={onAudioSpeedChange}
    />
  );

  const themeBtnNode = (
    <button
      onClick={toggleTheme}
      className="btn-icon"
      title={isDark ? t.header.themeLight : t.header.themeDark}
      style={{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        padding: '0.45rem',
        cursor: 'pointer',
        flexShrink: 0
      }}
    >
      {isDark ? <Sun size={17} style={{ color: '#fbbf24' }} /> : <Moon size={17} style={{ color: '#0284c7' }} />}
    </button>
  );

  const nativeName = currentUser?.native_language === 'ru' 
    ? (uiLang === 'ru' ? 'Русский' : uiLang === 'en' ? 'Russian' : 'Tiếng Nga')
    : currentUser?.native_language === 'en'
      ? (uiLang === 'ru' ? 'Английский' : uiLang === 'en' ? 'English' : 'Tiếng Anh')
      : (uiLang === 'ru' ? 'Вьетнамский' : uiLang === 'en' ? 'Vietnamese' : 'Tiếng Việt');

  const targetName = currentUser?.target_language === 'vi'
    ? (uiLang === 'ru' ? 'Вьетнамский' : uiLang === 'en' ? 'Vietnamese' : 'Tiếng Việt')
    : (uiLang === 'ru' ? 'Английский' : uiLang === 'en' ? 'English' : 'Tiếng Anh');

  const languageRouteNode = currentUser && (
    <div
      onClick={onOpenProfileEdit}
      title={t.header.routeTooltip(nativeName, targetName)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.35rem 0.65rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        boxShadow: 'var(--shadow-sm)',
        flexShrink: 0,
        cursor: 'pointer'
      }}
      className="hover-card"
    >
      <span>{currentUser.native_language === 'ru' ? '🇷🇺' : currentUser.native_language === 'en' ? '🇬🇧' : '🇻🇳'}</span>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>➔</span>
      <span>{currentUser.target_language === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
    </div>
  );

  const userProfileNode = (
    <UserProfileDropdown
      user={currentUser}
      gamificationProfile={gamificationProfile}
      onOpenProfileEdit={onOpenProfileEdit}
      onOpenSettings={onOpenSettings}
      onLogout={onLogout}
    />
  );

  return (
    <header className="app-header">
      {/* 1. DESKTOP SINGLE ROW VIEW (screens > 868px) - 100% Identical to Desktop Screenshot */}
      <div className="header-desktop-row">
        {/* Title */}
        <div className="header-title-container">
          <h2 className="header-title-text">{current.title}</h2>
          <p className="header-desc-text">{current.desc}</p>
        </div>

        {/* Desktop Controls: Clean, spacious, uncluttered */}
        <div className="header-actions-desktop">
          <div className="header-item-search">{searchNode}</div>
          {themeBtnNode}
          <div className="header-divider" />
          {languageRouteNode}
          {userProfileNode}
        </div>
      </div>

      {/* 2. MOBILE & TABLET 1-ROW VIEW (screens <= 868px) - Clean, fast, compact */}
      <div className="header-mobile-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="header-mobile-toggle"
              title="Mở menu điều hướng"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          )}
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <h2 className="header-title-text" style={{ fontSize: '1.1rem', margin: 0 }}>
              {current.title}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          {languageRouteNode}
          {themeBtnNode}
          {userProfileNode}
        </div>
      </div>
    </header>
  );
}
