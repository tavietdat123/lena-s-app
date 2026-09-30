import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flame,
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  TrendingUp,
  Award,
  Clock,
  Target,
  Share2,
  Copy,
  Check,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  Brain,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import ActivityHistoryChart from '../common/ActivityHistoryChart';

export default function PublicStatsPage({ isDark, toggleTheme }) {
  const { username } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getPublicStats(username || '')
      .then(res => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setStatsData(res.data);
        } else {
          setError(res.error || 'Không tìm thấy hồ sơ học tập công khai này.');
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message || 'Lỗi kết nối máy chủ.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [username]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '46px',
            height: '46px',
            margin: '0 auto 1.25rem',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Đang tải Bảng Thống Kê Công Khai...</p>
        </div>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '2rem'
      }}>
        <div className="card" style={{ maxWidth: '500px', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Chưa Có Dữ Liệu Công Khai</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {error || 'Không thể tìm thấy thông tin thống kê người dùng này.'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}
          >
            Quay Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  const { user, summary, retentionBreakdown, levelsBreakdown, activityDistribution, recentLogs, topWords } = statsData;

  const totalWords = summary.totalWords || 0;
  const masteredCount = retentionBreakdown.mastered || 0;
  const reviewingCount = retentionBreakdown.reviewing || 0;
  const learningCount = retentionBreakdown.learning || 0;
  const newCount = retentionBreakdown.newWords || 0;

  const masteredPct = totalWords > 0 ? (masteredCount / totalWords) * 100 : 0;
  const reviewingPct = totalWords > 0 ? (reviewingCount / totalWords) * 100 : 0;
  const learningPct = totalWords > 0 ? (learningCount / totalWords) * 100 : 0;
  const newPct = totalWords > 0 ? (newCount / totalWords) * 100 : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      paddingBottom: '4rem'
    }}>
      {/* 1. TOP NAVBAR */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.85rem 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Brand Logo */}
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                LinguaVault
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
                PUBLIC LEARNING PORTFOLIO
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleCopyLink}
              className="glow-hover"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: copied ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-tertiary)',
                color: copied ? '#16a34a' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copied ? 'Đã sao chép link!' : 'Chia sẻ bảng này'}</span>
            </button>

            {toggleTheme && (
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}

            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>Vào Học Ngay</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main style={{ maxWidth: '1100px', margin: '2rem auto 0 auto', padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* HERO PROFILE CARD */}
        <div style={{
          background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #38bdf8 100%)',
          borderRadius: '24px',
          padding: '2.5rem',
          color: '#ffffff',
          boxShadow: '0 20px 40px rgba(2, 132, 199, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle decoration circle */}
          <div style={{
            position: 'absolute',
            right: '-60px',
            top: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none'
          }} />

          {/* User Identity info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 1 }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.75rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }}>
              {user.avatarUrl || '⚡'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>
                  {user.displayName}
                </h1>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'rgba(255,255,255,0.25)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}>
                  <ShieldCheck size={14} />
                  <span>VERIFIED LEARNER</span>
                </span>
              </div>

              <div style={{ fontSize: '1.05rem', fontWeight: 700, opacity: 0.95, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{user.title}</span>
                <span>•</span>
                <span style={{ opacity: 0.85, fontSize: '0.9rem' }}>Tham gia từ {user.memberSince}</span>
              </div>
            </div>
          </div>

          {/* Badges / Highlights */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', zIndex: 1 }}>
            {/* Streak Badge */}
            <div style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              padding: '0.85rem 1.25rem',
              borderRadius: '18px',
              border: '1px solid rgba(255,255,255,0.3)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#fef08a', fontWeight: 900, fontSize: '1.3rem' }}>
                <Flame size={22} fill="currentColor" />
                <span>{user.currentStreak} Ngày</span>
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px', fontWeight: 600 }}>
                Chuỗi Streak liên tục 🔥
              </div>
            </div>

            {/* Level & XP Badge */}
            <div style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              padding: '0.85rem 1.25rem',
              borderRadius: '18px',
              border: '1px solid rgba(255,255,255,0.3)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: '#ffffff', fontWeight: 900, fontSize: '1.3rem' }}>
                <Award size={22} />
                <span>Lv.{user.level}</span>
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px', fontWeight: 600 }}>
                {user.totalXp.toLocaleString()} XP tích lũy
              </div>
            </div>
          </div>
        </div>

        {/* 3. 4 KEY PERFORMANCE INDICATORS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Total Words */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', padding: '1.5rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(2, 132, 199, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <BookOpen size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>Tổng Từ Vựng</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1.1, marginTop: '2px' }}>
                {summary.totalWords} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>từ</span>
              </div>
            </div>
          </div>

          {/* Mastered Words */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', padding: '1.5rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>Đã Thuộc Vĩnh Viễn</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1.1, marginTop: '2px' }}>
                {summary.masteredWords} <span style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 700 }}>({summary.retentionRate}%)</span>
              </div>
            </div>
          </div>

          {/* Patterns & Categories */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', padding: '1.5rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Layers size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>Cấu Trúc Giao Tiếp</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1.1, marginTop: '2px' }}>
                {summary.totalPatterns} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>cấu trúc</span>
              </div>
            </div>
          </div>

          {/* Focused Hours */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', padding: '1.5rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>Thời Gian Tập Trung</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1.1, marginTop: '2px' }}>
                {summary.totalStudyHours} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>giờ</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. MEMORY RETENTION STAGES (SPACED REPETITION SM-2) */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <TrendingUp size={22} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Thang Phân Bổ Trí Nhớ (Spaced Repetition SM-2)
              </h3>
            </div>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              Tổng kho: {totalWords} từ vựng
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div style={{
            display: 'flex',
            height: '16px',
            borderRadius: '999px',
            overflow: 'hidden',
            background: 'var(--bg-tertiary)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ width: `${masteredPct}%`, background: '#22c55e', transition: 'width 0.6s ease' }} title={`Thuộc vĩnh viễn: ${masteredCount} từ`} />
            <div style={{ width: `${reviewingPct}%`, background: '#0284c7', transition: 'width 0.6s ease' }} title={`Đang ghi nhớ: ${reviewingCount} từ`} />
            <div style={{ width: `${learningPct}%`, background: '#f59e0b', transition: 'width 0.6s ease' }} title={`Mới nạp lại: ${learningCount} từ`} />
            <div style={{ width: `${newPct}%`, background: '#94a3b8', transition: 'width 0.6s ease' }} title={`Từ mới: ${newCount} từ`} />
          </div>

          {/* 4 Legend Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>THUỘC VĨNH VIỄN</div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{masteredCount} từ ({Math.round(masteredPct)}%)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0284c7' }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>ĐANG ÔN TẬP ĐỀU</div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{reviewingCount} từ ({Math.round(reviewingPct)}%)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>MỚI NẠP LẠI (LEARNING)</div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{learningCount} từ ({Math.round(learningPct)}%)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#94a3b8' }} />
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>TỪ MỚI CHỜ ÔN</div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{newCount} từ ({Math.round(newPct)}%)</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4.5 MULTI-PERIOD INTERACTIVE ACTIVITY CHART (Tuần này, Tháng này, 30 ngày, Tổng thời gian) */}
        {statsData.periodsData && (
          <ActivityHistoryChart 
            periodsData={statsData.periodsData} 
            defaultPeriod="all"
            title="Biểu Đồ Tiến Trình Học Tập (Lịch Sử Toàn Diện)"
          />
        )}

        {/* 5. CEFR LEVEL BREAKDOWN & ACTIVITY DISTRIBUTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* CEFR Level distribution */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Trình Độ Chuẩn CEFR Phân Bổ</span>
            </h4>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => {
                const count = levelsBreakdown[lvl] || 0;
                return (
                  <div
                    key={lvl}
                    style={{
                      flex: '1 1 calc(33.333% - 0.65rem)',
                      background: 'var(--bg-tertiary)',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{lvl}</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, marginTop: '2px' }}>{count}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>từ vựng</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Study Activity Distribution */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Cơ Cấu Hoạt Động Rèn Luyện
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activityDistribution.map(act => (
                <div
                  key={act.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{act.emoji}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{act.label}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {act.sessions} phiên ({Math.round(act.seconds / 60)} phút)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. SHOWCASE TOP WORDS MASTERED */}
        {topWords && topWords.length > 0 && (
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: '#eab308' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Từ Vựng Tiêu Biểu Đã Chinh Phục
                </h3>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                (Lặp lại ngắt quãng &gt; 3 lần)
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem'
            }}>
              {topWords.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    padding: '1rem 1.15rem',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {w.word}
                      </span>
                      {w.level && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: 'var(--accent-primary-light)',
                          color: 'var(--accent-primary)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px'
                        }}>
                          {w.level}
                        </span>
                      )}
                    </div>
                    {w.phonetic && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.35rem' }}>
                        {w.phonetic}
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {w.meaning_vi}
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                    ✓ Đã thuộc: {w.repetition} lần lặp lại
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. INSPIRATIONAL CALL TO ACTION FOOTER */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 900, marginBottom: '0.65rem' }}>
            Bạn Cũng Muốn Xây Dựng Kho Kiến Thức Bền Vững Như Thế Này?
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.98rem', maxWidth: '640px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            LinguaVault kết hợp thuật toán lặp lại ngắt quãng SuperMemo SM-2, AI phân tích phát âm và đồng hồ bấm giờ Pomodoro chuyên sâu để giúp bạn học kiên trì mỗi ngày.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary glow-hover"
            style={{
              padding: '0.9rem 2rem',
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>Bắt Đầu Hành Trình Ngay (Miễn Phí)</span>
            <ArrowRight size={18} />
          </button>
        </div>

      </main>
    </div>
  );
}
