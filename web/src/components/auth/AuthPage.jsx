import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Brain, 
  ShieldCheck, 
  BookOpen, 
  Mic, 
  Sun, 
  Moon, 
  AlertCircle,
  Sparkles,
  Check,
  Globe2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const NATIVE_LANG_OPTIONS = [
  { code: 'vi', nameVi: 'Tiếng Việt', nameEn: 'Vietnamese', nameRu: 'Вьетнамский', flag: '🇻🇳', descVi: 'Bản ngữ Việt Nam', descEn: 'Native Vietnamese', descRu: 'Носитель языка' },
  { code: 'en', nameVi: 'English', nameEn: 'English', nameRu: 'Английский', flag: '🇬🇧', descVi: 'Bản ngữ Tiếng Anh', descEn: 'Native English', descRu: 'Носитель языка' },
  { code: 'ru', nameVi: 'Русский', nameEn: 'Russian', nameRu: 'Русский', flag: '🇷🇺', descVi: 'Bản ngữ Tiếng Nga', descEn: 'Native Russian', descRu: 'Носитель языка' }
];

const TARGET_LANG_OPTIONS = [
  { code: 'en', nameVi: 'Tiếng Anh', nameEn: 'English', nameRu: 'Английский', flag: '🇬🇧', descVi: 'Lộ trình Tiếng Anh', descEn: 'English track', descRu: 'Курс английского' },
  { code: 'vi', nameVi: 'Tiếng Việt', nameEn: 'Vietnamese', nameRu: 'Вьетнамский', flag: '🇻🇳', descVi: 'Lộ trình Tiếng Việt', descEn: 'Vietnamese track', descRu: 'Курс вьетнамского' }
];

export default function AuthPage({ onAuthSuccess, isDark, toggleTheme }) {
  const { uiLang, setUiLang, t: rootT } = useLanguage();
  const t = rootT.auth || {};

  const handleToggleUiLang = (lang) => {
    setUiLang(lang);
  };

  // Mode: 'login' | 'register' | 'language_setup'
  const [mode, setMode] = useState('login');

  // Form Fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Language Setup State (Chosen after registration succeeds)
  const [nativeLanguage, setNativeLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [registeredUser, setRegisteredUser] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle switching Native Language with smart default for Target Language
  // User requested: "chọn lộ trình từ nước nào thì ngôn ngữ nước giao diện hiển thị nước đó"
  const handleSelectNative = (code) => {
    setNativeLanguage(code);
    if (code === 'vi') {
      setTargetLanguage('en');
    } else {
      setTargetLanguage('vi');
    }
    handleToggleUiLang(code);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError(t.errEmptyLogin);
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.login(username.trim(), password);
      if (res && res.success && res.data?.user) {
        onAuthSuccess(res.data.user);
      } else {
        setError(res?.error || t.errLoginFailed);
      }
    } catch (err) {
      setError(err.message || t.errServer);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Register account -> On success, transition to Step 2 (Language Setup screen)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanUsername || !cleanName || !password.trim()) {
      setError(t.errEmptyRegister);
      return;
    }

    if (cleanUsername.length < 3) {
      setError(t.errUsernameShort);
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
      setError(t.errUsernameFormat);
      return;
    }

    if (password.length < 4) {
      setError(t.errPasswordShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.errPasswordMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.register({
        username: cleanUsername,
        full_name: cleanName,
        password
      });

      if (res && res.success && res.data?.user) {
        setRegisteredUser(res.data.user);
        // Seamlessly advance to Step 2: Language Selection Onboarding Screen
        setMode('language_setup');
        setError('');
      } else {
        setError(res?.error || t.errRegisterFailed);
      }
    } catch (err) {
      setError(err.message || t.errServer);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm selected language path and enter app
  const handleConfirmLanguageSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.auth.updateProfile({
        native_language: nativeLanguage,
        target_language: targetLanguage
      });

      const fullUser = {
        ...(registeredUser || {}),
        ...(res?.data || {}),
        native_language: nativeLanguage,
        target_language: targetLanguage
      };
      onAuthSuccess(fullUser);
    } catch (err) {
      onAuthSuccess({
        ...(registeredUser || {}),
        native_language: nativeLanguage,
        target_language: targetLanguage
      });
    } finally {
      setLoading(false);
    }
  };

  const currentNativeObj = NATIVE_LANG_OPTIONS.find(l => l.code === nativeLanguage) || NATIVE_LANG_OPTIONS[0];
  const currentTargetObj = TARGET_LANG_OPTIONS.find(l => l.code === targetLanguage) || TARGET_LANG_OPTIONS[0];

  return (
    <div className="auth-root" style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Top Bar Controls: Language Switcher (VI | EN) and Dark/Light Mode */}
      <div className="auth-top-controls" style={{
        position: 'absolute',
        top: '1.25rem',
        right: '1.5rem',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem'
      }}>
        {/* Language Switcher Pill (VI 🇻🇳 | EN 🇬🇧) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-full)',
          padding: '0.2rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            type="button"
            onClick={() => handleToggleUiLang('vi')}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: uiLang === 'vi' ? 'var(--accent-primary)' : 'transparent',
              color: uiLang === 'vi' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: uiLang === 'vi' ? 800 : 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease'
            }}
            title="Giao diện Tiếng Việt"
          >
            <span>🇻🇳</span>
            <span>Tiếng Việt</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleUiLang('en')}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: uiLang === 'en' ? 'var(--accent-primary)' : 'transparent',
              color: uiLang === 'en' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: uiLang === 'en' ? 800 : 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease'
            }}
            title="English Interface"
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleUiLang('ru')}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: uiLang === 'ru' ? 'var(--accent-primary)' : 'transparent',
              color: uiLang === 'ru' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: uiLang === 'ru' ? 800 : 600,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease'
            }}
            title="Русский интерфейс"
          >
            <span>🇷🇺</span>
            <span>Русский</span>
          </button>
        </div>

        {/* Theme Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          title={isDark ? (t?.header?.themeLight || "Light Theme") : (t?.header?.themeDark || "Dark Theme")}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '0.55rem',
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isDark ? <Sun size={18} style={{ color: '#fbbf24' }} /> : <Moon size={18} style={{ color: '#0284c7' }} />}
        </button>
      </div>

      {/* LEFT SHOWCASE HERO BANNER (Desktop View) */}
      <div style={{
        flex: 1.1,
        background: 'linear-gradient(145deg, rgba(2, 132, 199, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(139, 92, 246, 0.12) 100%)',
        borderRight: '1px solid var(--border-color)',
        padding: '3.5rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }} className="auth-hero-banner">
        {/* Brand Logo & Tagline */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.35)'
            }}>
              <BookOpen size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '900', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #0284c7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                LinguaVault
              </h1>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                MULTI-LANGUAGE KNOWLEDGE HUB
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            {t.heroTitle}
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '520px', marginBottom: '2.5rem' }}>
            {t.heroSubtitle}
          </p>

          {/* Feature Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', maxWidth: '560px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', flexShrink: 0 }}>
                <Globe2 size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{t.feature1Title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{t.feature1Desc}</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <Mic size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{t.feature2Title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{t.feature2Desc}</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                <Brain size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{t.feature3Title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{t.feature3Desc}</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{t.feature4Title}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{t.feature4Desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '2rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {t.heroFooter}
          </span>
        </div>
      </div>

      {/* RIGHT AUTH FORM CONTAINER */}
      <div className="auth-form-container" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        overflowY: 'auto'
      }}>
        <div className="auth-card" style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-xl)',
          position: 'relative'
        }}>
          {/* Mobile-only Brand Header (Hidden on desktop) */}
          <div className="auth-mobile-brand">
            <div className="auth-mobile-logo">
              <BookOpen size={24} color="#ffffff" />
            </div>
            <h1 className="auth-mobile-title">LinguaVault</h1>
            <span className="auth-mobile-badge">MULTI-LANGUAGE HUB</span>
            <p className="auth-mobile-tagline">
              {uiLang === 'en' 
                ? 'Master languages with Smart AI & Spaced Repetition (SM-2)' 
                : 'Nền tảng học ngoại ngữ thông minh với AI & Thuật toán SM-2'}
            </p>
          </div>

          {/* Mode Switcher Tabs (Only shown during Login or initial Register step) */}
          {mode !== 'language_setup' && (
            <div style={{
              display: 'flex',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-xl)',
              padding: '0.35rem',
              marginBottom: '1.75rem',
              border: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
                  color: mode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: mode === 'login' ? 800 : 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {t.tabLogin || t.loginTab || (uiLang === 'vi' ? 'Đăng Nhập' : uiLang === 'ru' ? 'Вход' : 'Sign In')}
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  background: mode === 'register' ? 'var(--bg-card)' : 'transparent',
                  color: mode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: mode === 'register' ? 800 : 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {t.tabRegister || t.registerTab || (uiLang === 'vi' ? 'Đăng Ký' : uiLang === 'ru' ? 'Регистрация' : 'Sign Up')}
              </button>
            </div>
          )}

          {/* Error Message Box */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.84rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <>
              {/* Form Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.15))',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  fontSize: '1.6rem',
                  marginBottom: '0.75rem',
                  boxShadow: '0 8px 20px rgba(2, 132, 199, 0.2)'
                }}>
                  🔐
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {t.loginTitle}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {t.loginSubtitle}
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                    {t.usernameLabel}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder={t.usernamePlaceholder}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                    {t.passwordLabel}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={t.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.6rem 0.75rem 2.5rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.9rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.85rem',
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.2s ease',
                    marginTop: '0.5rem'
                  }}
                  className="hover-card"
                >
                  {loading ? (
                    <span>{t.loginLoading || t.loggingIn || (uiLang === 'vi' ? 'Đang đăng nhập...' : uiLang === 'ru' ? 'Вход...' : 'Signing in...')}</span>
                  ) : (
                    <>
                      <span>{t.loginBtn || (uiLang === 'vi' ? 'Đăng Nhập Ngay' : uiLang === 'ru' ? 'Войти' : 'Sign In Now')}</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {t.noAccountPrompt || t.noAccount || (uiLang === 'vi' ? 'Chưa có tài khoản? ' : uiLang === 'ru' ? 'Нет аккаунта? ' : "Don't have an account? ")}
                    <button
                      type="button"
                      onClick={() => { setMode('register'); setError(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {t.registerNow || (uiLang === 'vi' ? 'Đăng ký ngay' : uiLang === 'ru' ? 'Создать сейчас' : 'Sign up now')}
                    </button>
                  </span>
                </div>
              </form>
            </>
          )}

          {/* 2. REGISTER FORM (Step 1: Account Info) */}
          {mode === 'register' && (
            <>
              {/* Form Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(99, 102, 241, 0.15))',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  fontSize: '1.6rem',
                  marginBottom: '0.75rem',
                  boxShadow: '0 8px 20px rgba(2, 132, 199, 0.2)'
                }}>
                  📝
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {t.registerTitle}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {t.registerSubtitle}
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* Username & Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                    {t.usernameRegisterLabel}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder={t.usernameRegisterPlaceholder}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                    {t.fullNameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Password & Confirm Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                    {t.passwordRegisterLabel}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={t.passwordRegisterPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 2.6rem 0.75rem 2.5rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.92rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.9rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                    {t.confirmPasswordLabel}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={t.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.85rem',
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.2s ease',
                    marginTop: '0.5rem'
                  }}
                  className="hover-card"
                >
                  {loading ? (
                    <span>{t.registerLoading || t.registering || (uiLang === 'vi' ? 'Đang tạo tài khoản...' : uiLang === 'ru' ? 'Регистрация...' : 'Creating account...')}</span>
                  ) : (
                    <>
                      <span>{t.registerBtn || (uiLang === 'vi' ? 'Tạo Tài Khoản' : uiLang === 'ru' ? 'Зарегистрироваться' : 'Create Account')}</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    {t.hasAccountPrompt || t.haveAccount || (uiLang === 'vi' ? 'Đã có tài khoản? ' : uiLang === 'ru' ? 'Уже есть аккаунт? ' : "Already have an account? ")}
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {t.loginNow || (uiLang === 'vi' ? 'Đăng nhập ngay' : uiLang === 'ru' ? 'Войти' : 'Sign in now')}
                    </button>
                  </span>
                </div>
              </form>
            </>
          )}

          {/* 3. STEP 2: ONBOARDING SCREEN - CHỌN NGÔN NGỮ HỌC TẬP */}
          {mode === 'language_setup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Success Badge & Header */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginBottom: '1rem'
                }}>
                  <CheckCircle2 size={15} />
                  <span>{t.step2Badge}</span>
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {t.step2Welcome}, {registeredUser?.full_name || fullName}! 🎉
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                  {t.step2Subtitle}
                </p>
              </div>

              {/* 1. Ngôn ngữ thành thạo (Native Language) */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  <span>{t.nativeSection}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                    {uiLang === 'ru' ? currentNativeObj.nameRu : uiLang === 'en' ? currentNativeObj.nameEn : currentNativeObj.nameVi}
                  </span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  {NATIVE_LANG_OPTIONS.map((item) => {
                    const isSelected = nativeLanguage === item.code;
                    const displayName = uiLang === 'ru' ? item.nameRu : uiLang === 'en' ? item.nameEn : item.nameVi;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleSelectNative(item.code)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.85rem 0.4rem',
                          borderRadius: 'var(--radius-xl)',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(2, 132, 199, 0.14)' : 'var(--bg-input)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.2)' : 'none'
                        }}
                        className="hover-card"
                      >
                        <span style={{ fontSize: '1.7rem', lineHeight: 1.2 }}>{item.flag}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', marginTop: '0.35rem' }}>
                          {displayName}
                        </span>
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Check size={11} color="#fff" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Ngôn ngữ muốn học (Target Language) */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  <span>{t.targetSection}</span>
                  <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                    {uiLang === 'ru' ? currentTargetObj.nameRu : uiLang === 'en' ? currentTargetObj.nameEn : currentTargetObj.nameVi}
                  </span>
                </label>
                <div className="target-lang-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                  {TARGET_LANG_OPTIONS.map((item) => {
                    const isSelected = targetLanguage === item.code;
                    const displayName = uiLang === 'ru' ? item.nameRu : uiLang === 'en' ? item.nameEn : item.nameVi;
                    const displayDesc = uiLang === 'ru' ? item.descRu : uiLang === 'en' ? item.descEn : item.descVi;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setTargetLanguage(item.code)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.85rem 0.95rem',
                          borderRadius: 'var(--radius-xl)',
                          border: isSelected ? '2px solid #10b981' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(16, 185, 129, 0.14)' : 'var(--bg-input)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                          boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
                        }}
                        className="hover-card"
                      >
                        <span style={{ fontSize: '1.7rem' }}>{item.flag}</span>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#10b981' : 'var(--text-primary)' }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            {displayDesc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Roadmap Preview Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.84rem'
              }}>
                <Sparkles size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {t.roadmapLabel} {currentNativeObj.flag} {uiLang === 'ru' ? currentNativeObj.nameRu : uiLang === 'en' ? currentNativeObj.nameEn : currentNativeObj.nameVi} ➔ {currentTargetObj.flag} {uiLang === 'ru' ? currentTargetObj.nameRu : uiLang === 'en' ? currentTargetObj.nameEn : currentTargetObj.nameVi}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {targetLanguage === 'vi' ? t.roadmapViDesc : t.roadmapEnDesc}
                  </div>
                </div>
              </div>

              {/* Confirm & Launch Button */}
              <button
                type="button"
                onClick={handleConfirmLanguageSetup}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.95rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s ease',
                  marginTop: '0.35rem'
                }}
                className="hover-card"
              >
                {loading ? (
                  <span>{t.confirmLoading || (uiLang === 'vi' ? 'Đang khởi tạo lộ trình...' : uiLang === 'ru' ? 'Настройка курса...' : 'Setting up your track...')}</span>
                ) : (
                  <>
                    <span>{t.confirmBtn || t.continueBtn || (uiLang === 'vi' ? 'Bắt Đầu Học Ngay 🚀' : uiLang === 'ru' ? 'Начать обучение 🚀' : 'Start Learning Now 🚀')}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
