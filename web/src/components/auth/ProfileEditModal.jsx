import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Save, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const AVATARS = ['🧑‍🎓', '👑', '🚀', '⚡', '💡', '🦁', '🦊', '🦉', '🌟', '🎯', '💻', '🎨'];

export default function ProfileEditModal({ isOpen, onClose, user, onProfileUpdated }) {
  const { uiLang, setUiLang, t } = useLanguage();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || '🧑‍🎓');
  const [appLanguage, setAppLanguage] = useState(uiLang || user?.native_language || 'en');
  const targetLanguage = user?.target_language || 'en'; // Permanently locked upon registration
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setSelectedAvatar(user.avatar_url || '🧑‍🎓');
      setAppLanguage(uiLang || user.native_language || 'en');
      setCurrentPassword('');
      setNewPassword('');
      setError('');
      setSuccessMsg('');
    }
  }, [user, isOpen, uiLang]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setError(uiLang === 'ru' ? 'Имя не может быть пустым' : uiLang === 'en' ? 'Full name cannot be empty' : 'Họ và tên không được để trống');
      return;
    }

    if (newPassword && !currentPassword) {
      setError(uiLang === 'ru' ? 'Введите текущий пароль для смены пароля' : uiLang === 'en' ? 'Please enter current password to set a new password' : 'Vui lòng nhập mật khẩu hiện tại để đổi sang mật khẩu mới');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        avatar_url: selectedAvatar,
        native_language: appLanguage,
        target_language: targetLanguage
      };

      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await api.auth.updateProfile(payload);
      if (res.success) {
        setSuccessMsg(t.profileModal.successMsg);
        // Switch UI language immediately to the chosen app language
        setUiLang(appLanguage);
        setCurrentPassword('');
        setNewPassword('');
        setTimeout(() => {
          onProfileUpdated(res.data);
          onClose();
        }, 500);
      } else {
        setError(res.error || (uiLang === 'ru' ? 'Ошибка обновления' : uiLang === 'en' ? 'Update failed' : 'Cập nhật không thành công'));
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 10, 20, 0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem'
    }} onClick={onClose}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '470px',
          maxHeight: 'calc(100vh - 3rem)',
          overflowY: 'auto',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-2xl)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
        className="modal-pop custom-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-full)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          className="hover-card"
        >
          <X size={16} />
        </button>

        {/* Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>👤</span>
            <span>{t.profileModal.title}</span>
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {t.profileModal.subtitle}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            fontSize: '0.84rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#10b981',
            fontSize: '0.84rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Avatar Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
              {t.profileModal.avatarLabel}
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '0.45rem',
              background: 'var(--bg-input)',
              padding: '0.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)'
            }}>
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  style={{
                    fontSize: '1.3rem',
                    padding: '0.35rem 0',
                    borderRadius: 'var(--radius-md)',
                    border: selectedAvatar === emoji ? '2px solid var(--accent-primary)' : '1px solid transparent',
                    background: selectedAvatar === emoji ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              {t.profileModal.fullNameLabel}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t.profileModal.fullNamePlaceholder}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Username (Disabled) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              {t.profileModal.usernameLabel}
            </label>
            <input
              type="text"
              disabled
              value={`@${user.username}`}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                opacity: 0.7,
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* Language Preferences */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🌐</span>
              <span>{t.profileModal.langSectionTitle}</span>
            </div>

            {/* 1. App Interface Language Selection (Cho phép đổi ngôn ngữ của app) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                {t.profileModal.appLangLabel}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                {[
                  { code: 'vi', label: '🇻🇳 Tiếng Việt' },
                  { code: 'en', label: '🇬🇧 English' },
                  { code: 'ru', label: '🇷🇺 Русский' }
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setAppLanguage(item.code);
                      setUiLang(item.code);
                    }}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: 'var(--radius-md)',
                      border: appLanguage === item.code ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: appLanguage === item.code ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-card)',
                      color: appLanguage === item.code ? 'var(--accent-primary)' : 'var(--text-primary)',
                      fontSize: '0.78rem',
                      fontWeight: appLanguage === item.code ? 800 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Target Learning Language (Đã đăng ký rồi thì CỐ ĐỊNH, không cho chọn lại) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t.profileModal.targetLockedLabel}
                </label>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: 'var(--accent-warning)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  padding: '0.12rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  🔒 {uiLang === 'ru' ? 'Закреплено' : uiLang === 'en' ? 'Locked' : 'Cố định'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.84rem' }}>
                  <span>{targetLanguage === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
                  <span>{targetLanguage === 'vi' 
                    ? (uiLang === 'ru' ? 'Вьетнамский (Tiếng Việt)' : uiLang === 'en' ? 'Vietnamese (Tiếng Việt)' : 'Tiếng Việt (Vietnamese)') 
                    : (uiLang === 'ru' ? 'Английский (English)' : uiLang === 'en' ? 'English (Tiếng Anh)' : 'Tiếng Anh (English)')}</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.4px' }}>
                  {targetLanguage === 'vi' ? 'VIETNAMESE VAULT' : 'ENGLISH VAULT'}
                </span>
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.35, marginBottom: 0 }}>
                {t.profileModal.targetLockedNote}
              </p>
            </div>
          </div>

          {/* Change Password Section */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              <KeyRound size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>{t.profileModal.securityTitle}</span>
            </div>

            <div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t.profileModal.currentPasswordPlaceholder}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t.profileModal.newPasswordPlaceholder}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.25rem',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.25)'
            }}
            className="hover-card"
          >
            <Save size={16} />
            <span>{loading ? t.profileModal.savingBtn : t.profileModal.saveBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
