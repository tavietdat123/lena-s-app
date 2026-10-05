import React, { useEffect } from 'react';
import { Trophy, Sparkles, Award, Star, ArrowRight } from 'lucide-react';
import { alarmAudio } from '../../services/alarmAudio.js';
import { useLanguage } from '../../context/LanguageContext';

export default function LevelUpModal({ isOpen, onClose, levelData }) {
  const { t } = useLanguage();
  useEffect(() => {
    if (isOpen) {
      // Play celebratory chime
      try {
        alarmAudio.playSuccessSound();
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen || !levelData) return null;

  const {
    newLevel = 2,
    title = 'Lexical Apprentice 🌿',
    perk = 'Mở khóa phân tích sâu Collocations',
    totalXp = 200
  } = levelData;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      zIndex: 99999
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '28px',
        border: '2px solid var(--accent-primary)',
        boxShadow: '0 0 50px rgba(2, 132, 199, 0.35)',
        overflow: 'hidden',
        textAlign: 'center',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        animation: 'scaleIn 0.3s ease'
      }}>
        {/* Animated Trophy Icon */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-primary-light)',
          border: '2px solid var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
          position: 'relative'
        }}>
          <Trophy size={48} />
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: '#fbbf24',
            color: '#78350f',
            borderRadius: '50%',
            padding: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}>
            <Sparkles size={16} />
          </div>
        </div>

        {/* Title & Level */}
        <div>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'var(--accent-primary)',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            {t.levelUp?.congrats || '🎉 CHÚC MỪNG BẠN ĐÃ THĂNG CẤP!'}
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.4rem 0 0.2rem 0', color: 'var(--text-primary)' }}>
            {t.levelUp?.levelLabel || 'LEVEL'} {newLevel}
          </h2>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)', margin: 0 }}>
            {title}
          </h3>
        </div>

        {/* Perks Card */}
        <div style={{
          width: '100%',
          backgroundColor: 'var(--bg-tertiary)',
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {t.levelUp?.perkUnlocked || 'QUYỀN LỢI & DANH HIỆU MỚI'}
          </span>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            ✨ {perk}
          </p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Tổng tích lũy hiện tại: <b>{totalXp} XP</b>
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '16px',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span>{t.levelUp?.continueBtn || 'Tiếp Tục Rèn Luyện 🚀'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
