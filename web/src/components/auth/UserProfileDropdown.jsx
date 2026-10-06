import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogIn, 
  LogOut, 
  Key, 
  Settings, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  Crown,
  Edit3
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function UserProfileDropdown({ 
  user, 
  gamificationProfile,
  onOpenProfileEdit, 
  onOpenSettings,
  onLogout 
}) {
  const { uiLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const currentLevel = gamificationProfile?.level ?? user?.profile?.current_level ?? 1;
  const currentXp = gamificationProfile?.totalXp ?? user?.profile?.total_xp ?? 0;
  const currentTitle = gamificationProfile?.title ?? user?.profile?.title ?? 'Novice Scholar 🌱';

  const nativeLabel = user.native_language === 'ru' 
    ? (uiLang === 'ru' ? '🇷🇺 Россия' : uiLang === 'en' ? '🇷🇺 Russian' : '🇷🇺 Nga')
    : user.native_language === 'en' 
      ? '🇬🇧 English' 
      : '🇻🇳 Việt';

  const targetLabel = user.target_language === 'vi'
    ? (uiLang === 'ru' ? '🇻🇳 Вьетнам' : uiLang === 'en' ? '🇻🇳 Vietnamese' : '🇻🇳 Việt')
    : '🇬🇧 English';

  const roleText = user.role === 'admin' ? t.userMenu.admin : user.role === 'guest' ? t.userMenu.guest : t.userMenu.member;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          padding: '0.35rem 0.75rem 0.35rem 0.45rem',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease'
        }}
        className="hover-card"
      >
        {/* Avatar Circle */}
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem'
        }}>
          {user.avatar_url || '🧑‍🎓'}
        </div>

        {/* User Info Text */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.full_name || user.username}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1, maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            @{user.username}
          </span>
        </div>

        <ChevronDown size={13} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '240px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '0.6rem',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 100,
          backdropFilter: 'blur(16px)'
        }} className="modal-pop">
          {/* Header Card inside dropdown */}
          <div style={{
            padding: '0.75rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '0.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{user.avatar_url || '🧑‍🎓'}</span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {roleText}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              marginTop: '0.45rem',
              paddingTop: '0.45rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <span>{t.common.level} {currentLevel} • {currentTitle}</span>
              <span>{currentXp} {t.common.xp}</span>
            </div>

            {/* Language Pair Badge */}
            <div style={{
              marginTop: '0.45rem',
              padding: '0.35rem 0.55rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.73rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{t.userMenu.routeLabel}</span>
              <span style={{ fontWeight: 800, color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                {nativeLabel} ➔ {targetLabel} <span title={t?.profileModal?.targetLockedNote || "Track is locked to account"} style={{ fontSize: '0.65rem' }}>🔒</span>
              </span>
            </div>

            {/* Quick App UI Language Switcher */}
            <div style={{
              marginTop: '0.45rem',
              padding: '0.35rem 0.55rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t?.userMenu?.appLang || "App Language:"}
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[
                  { code: 'vi', flag: '🇻🇳' },
                  { code: 'en', flag: '🇬🇧' },
                  { code: 'ru', flag: '🇷🇺' }
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={async () => {
                      setUiLang(item.code);
                    }}
                    style={{
                      padding: '0.15rem 0.35rem',
                      borderRadius: '5px',
                      border: uiLang === item.code ? '1px solid var(--accent-primary)' : '1px solid transparent',
                      background: uiLang === item.code ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                    title={item.code.toUpperCase()}
                  >
                    {item.flag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenProfileEdit();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: 'none',
                background: 'transparent',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              className="hover-card"
            >
              <Edit3 size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>{t.userMenu.editProfile}</span>
            </button>

            {onOpenSettings && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                className="hover-card"
              >
                <Settings size={15} style={{ color: 'var(--text-muted)' }} />
                <span>{t.userMenu.settings}</span>
              </button>
            )}

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.3rem 0' }} />

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                width: '100%',
                padding: '0.6rem 0.75rem',
                border: 'none',
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: 'var(--radius-md)',
                color: '#ef4444',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              className="hover-card"
            >
              <LogOut size={15} />
              <span>{t.userMenu.logout}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
