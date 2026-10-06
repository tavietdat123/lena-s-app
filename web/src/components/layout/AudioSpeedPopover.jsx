import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, Sliders, Play, Check, ChevronDown, Sparkles, Zap, Search, Target, FastForward } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

export default function AudioSpeedPopover({ audioSpeed, onSpeedChange }) {
  const { t, isVietnameseTrack } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [accent, setAccent] = useState('en-US');
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const triggerRef = useRef(null);
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ top: 'auto', bottom: 'auto', left: '12px', width: '320px' });

  useEffect(() => {
    setAccent(audioService.getAccent());
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth - 24);
    const popoverHeight = 440;

    // Horizontally:
    // If the trigger button is on the right half of the screen (e.g. in Header), align to right edge
    // If on the left half (e.g. in Sidebar), align to left edge so it expands into open space
    let left;
    const rightAlignedLeft = rect.right - popoverWidth;
    if (rect.right > window.innerWidth / 2 && rightAlignedLeft >= 12) {
      left = rightAlignedLeft;
    } else {
      left = rect.left;
    }

    // Clamp horizontally to stay inside viewport
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    // Vertically:
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top = 'auto';
    let bottom = 'auto';

    if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
      // Pop open upwards above the trigger button
      bottom = `${Math.max(12, window.innerHeight - rect.top + 8)}px`;
    } else {
      // Pop open downwards below the trigger button
      top = `${Math.max(12, rect.bottom + 8)}px`;
    }

    setCoords({ top, bottom, left: `${left}px`, width: `${popoverWidth}px` });
  }, []);

  // Update position & handle click outside
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    function handleClickOutside(e) {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      if (cardRef.current && cardRef.current.contains(e.target)) return;
      setIsOpen(false);
    }

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    onSpeedChange(val);
  };

  const handlePresetSelect = (val) => {
    onSpeedChange(val);
  };

  const handleAccentChange = (acc) => {
    setAccent(acc);
    audioService.setAccent(acc);
  };

  const handleTestAudio = () => {
    setIsPlayingSample(true);
    if (isVietnameseTrack) {
      const sample = 'LinguaVault giúp bạn ghi nhớ từ vựng và tự tin giao tiếp tiếng Việt mỗi ngày.';
      audioService.speak(sample, 'vi-VN', audioSpeed);
    } else {
      const sample = accent === 'en-GB' 
        ? 'LinguaVault enables you to articulate English with remarkable confidence and precision.'
        : 'LinguaVault empowers you to master vocabulary and speak English with natural fluency.';
      audioService.speak(sample, accent, audioSpeed);
    }
    setTimeout(() => setIsPlayingSample(false), 2400);
  };

  // Speed description tag
  let speedTag = { label: t?.audioSpeed?.naturalTag || "Natural", color: 'var(--accent-primary)', icon: Zap };
  if (audioSpeed <= 0.65) {
    speedTag = { label: t?.audioSpeed?.verySlowTag || "Very Slow", color: 'var(--accent-warning)', icon: Search };
  } else if (audioSpeed <= 0.85) {
    speedTag = { label: t?.audioSpeed?.slowTag || "Slow", color: 'var(--accent-success)', icon: Target };
  } else if (audioSpeed >= 1.15) {
    speedTag = { label: t?.audioSpeed?.fastTag || "Fast", color: 'var(--accent-purple)', icon: FastForward };
  }

  const TagIcon = speedTag.icon;

  const presets = [0.6, 0.75, 0.85, 1.0, 1.25];

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary glow-hover"
        style={{
          padding: '0.55rem 0.85rem',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-color)',
          background: isOpen ? 'var(--accent-primary-light)' : 'var(--bg-card)'
        }}
        title={t?.audioSpeed?.triggerTooltip || "Audio speed"}
      >
        <Volume2 size={16} style={{ color: 'var(--accent-primary)' }} />
        <span>{audioSpeed.toFixed(2).replace(/\.?0+$/, '')}x</span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>

      {/* Popover Card rendered via portal to prevent sidebar overflow-x: hidden clipping */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={cardRef}
          style={{
            position: 'fixed',
            top: coords.top,
            bottom: coords.bottom,
            left: coords.left,
            width: coords.width,
            maxWidth: 'calc(100vw - 24px)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 1px 1px var(--border-color)',
            zIndex: 99999,
            animation: 'fadeIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={16} style={{ color: 'var(--accent-primary)' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t?.audioSpeed?.title || "Audio Speed"}
              </h4>
            </div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-tertiary)',
              color: speedTag.color,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <TagIcon size={12} color={speedTag.color} />
              <span>{speedTag.label}</span>
            </span>
          </div>

          {/* Granular Slider & Live Value */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t?.audioSpeed?.granularLabel || "Fine-tune speed:"}</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {audioSpeed.toFixed(2)}x
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={audioSpeed}
              onChange={handleSliderChange}
              style={{
                width: '100%',
                accentColor: 'var(--accent-primary)',
                cursor: 'pointer',
                height: '6px',
                borderRadius: '3px',
                background: 'var(--bg-tertiary)'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600 }}>
              <span>{t?.audioSpeed?.sliderSlow || "0.5x (Slow)"}</span>
              <span>{t?.audioSpeed?.sliderNormal || "1.0x (Normal)"}</span>
              <span>{t?.audioSpeed?.sliderFast || "1.5x (Fast)"}</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.45rem' }}>
              {t?.audioSpeed?.suggestedLabel || "Presets:"}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => handlePresetSelect(p)}
                  style={{
                    padding: '0.4rem 0.2rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: Math.abs(audioSpeed - p) < 0.01 ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: Math.abs(audioSpeed - p) < 0.01 ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                    color: Math.abs(audioSpeed - p) < 0.01 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {p}x
                </button>
              ))}
            </div>
          </div>

          {/* Accent Selection */}
          {isVietnameseTrack ? (
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.45rem' }}>
                {t?.audioSpeed?.accentLabel || "Voice Accent:"}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary-light)',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                <span>🇻🇳 Giọng Tiếng Việt chuẩn (Tự nhiên)</span>
                <Check size={14} style={{ marginLeft: 'auto' }} />
              </div>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.45rem' }}>
                {t?.audioSpeed?.accentLabel || "Accent:"}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  onClick={() => handleAccentChange('en-US')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: accent === 'en-US' ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: accent === 'en-US' ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                    color: accent === 'en-US' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>🇺🇸 {t?.audioSpeed?.accentUS || "US English"}</span>
                  {accent === 'en-US' && <Check size={14} />}
                </button>

                <button
                  onClick={() => handleAccentChange('en-GB')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: accent === 'en-GB' ? 'var(--accent-primary)' : 'var(--border-color)',
                    background: accent === 'en-GB' ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                    color: accent === 'en-GB' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>🇬🇧 {t?.audioSpeed?.accentUK || "UK English"}</span>
                  {accent === 'en-GB' && <Check size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Test Sample Playback */}
          <button
            onClick={handleTestAudio}
            disabled={isPlayingSample}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.65rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              gap: '0.5rem'
            }}
          >
            <Play size={15} />
            <span>{isPlayingSample ? (t?.audioSpeed?.playingSample || "Playing sample...") : (t?.audioSpeed?.testBtn || "Test This Speed")}</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
