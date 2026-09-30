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
  ExternalLink,
  Eye,
  AlertTriangle,
  MessageSquare,
  Send,
  ThumbsUp,
  History,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import ActivityHistoryChart from '../common/ActivityHistoryChart';

export default function PublicStatsPage({ isDark, toggleTheme, currentUser }) {
  const { username } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Supervisor Feedback Form State
  const [supervisorName, setSupervisorName] = useState('');
  const [feedbackType, setFeedbackType] = useState('cheer'); // 'cheer' | 'nudge' | 'warning'
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSuccessNotice, setFeedbackSuccessNotice] = useState('');

  // Audit Sessions Pagination State
  const [sessions, setSessions] = useState([]);
  const [sessionsPagination, setSessionsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [loadingSessions, setLoadingSessions] = useState(false);

  // CEFR & Activity Daily Breakdown Filter State
  const todayStr = (() => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  const [selectedBreakdownDate, setSelectedBreakdownDate] = useState(todayStr);
  const [selectedDatePreset, setSelectedDatePreset] = useState('today'); // 'today' | 'yesterday' | 'custom' | 'all'
  const [breakdownData, setBreakdownData] = useState({
    date: todayStr,
    isAll: false,
    totalWords: 0,
    totalSessions: 0,
    totalMinutes: 0,
    levelsBreakdown: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
    activityDistribution: []
  });
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  const hasAuth = !!currentUser || !!localStorage.getItem('token');

  const resolveTargetUsername = () => {
    let target = (username || '').trim();
    if (['monitor', 'giam-sat', 'supervisor', 'public', 'null', 'undefined'].includes(target.toLowerCase())) {
      target = '';
    }
    return target;
  };

  const fetchDailyBreakdown = async (dateVal, preset = 'custom') => {
    setSelectedDatePreset(preset);
    setSelectedBreakdownDate(dateVal);
    setLoadingBreakdown(true);
    const target = resolveTargetUsername();
    try {
      const res = await api.getPublicDailyBreakdown(target, dateVal);
      if (res.success && res.data) {
        setBreakdownData(res.data);
      }
    } catch (err) {
      console.error('Error fetching daily breakdown:', err);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const formatDateVi = (dateStr) => {
    if (!dateStr || dateStr === 'all') return 'Toàn bộ thời gian';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const handleFetchChartPeriod = async (periodKey) => {
    const target = resolveTargetUsername();
    try {
      const res = await api.getPublicActivityChart(target, periodKey);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.error('Error fetching activity chart period:', err);
    }
    return null;
  };

  const loadData = () => {
    setLoading(true);
    setError(null);
    const target = resolveTargetUsername();

    api.getPublicStats(target)
      .then(res => {
        if (res.success && res.data) {
          setStatsData(res.data);
          setSessions(res.data.recentSessions || []);
          if (res.data.dailyBreakdown) {
            setBreakdownData(res.data.dailyBreakdown);
          } else {
            setBreakdownData({
              date: todayStr,
              isAll: false,
              totalWords: 0,
              totalSessions: 0,
              totalMinutes: 0,
              levelsBreakdown: res.data.levelsBreakdown || { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
              activityDistribution: res.data.activityDistribution || []
            });
          }
          if (res.data.sessionsPagination) {
            setSessionsPagination(res.data.sessionsPagination);
          } else {
            setSessionsPagination({
              page: 1,
              limit: 10,
              total: res.data.recentSessions?.length || 0,
              totalPages: Math.ceil((res.data.recentSessions?.length || 0) / 10) || 1
            });
          }
        } else {
          setError(res.error || 'Không tìm thấy hồ sơ học tập công khai này.');
        }
      })
      .catch(err => {
        setError(err.message || 'Lỗi kết nối máy chủ.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSessionsPageChange = async (newPage) => {
    if (newPage < 1 || newPage > sessionsPagination.totalPages || newPage === sessionsPagination.page || loadingSessions) return;
    setLoadingSessions(true);
    const target = resolveTargetUsername();
    try {
      const res = await api.getPublicSessions(target, newPage, sessionsPagination.limit);
      if (res.success && res.data) {
        setSessions(res.data.sessions || []);
        setSessionsPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching sessions page:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSessionsLimitChange = async (newLimit) => {
    if (newLimit === sessionsPagination.limit || loadingSessions) return;
    setLoadingSessions(true);
    const target = resolveTargetUsername();
    try {
      const res = await api.getPublicSessions(target, 1, newLimit);
      if (res.success && res.data) {
        setSessions(res.data.sessions || []);
        setSessionsPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error changing sessions limit:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [username]);

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const target = resolveTargetUsername();
    const cleanUrl = (target && target.toLowerCase() !== 'admin')
      ? `${origin}/giam-sat/${encodeURIComponent(target)}`
      : `${origin}/giam-sat`;

    navigator.clipboard.writeText(cleanUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setIsSendingFeedback(true);
    setFeedbackSuccessNotice('');
    const target = resolveTargetUsername();

    try {
      const res = await api.postSupervisorFeedback({
        username: target || statsData?.user?.username || 'admin',
        supervisor_name: supervisorName.trim() || 'Người Giám Sát',
        type: feedbackType,
        message: feedbackMessage.trim()
      });

      if (res.success) {
        setFeedbackSuccessNotice('Đã gửi lời nhắc/động viên tới học viên thành công! 🎉');
        setFeedbackMessage('');
        // Reload data to show updated feedback
        api.getPublicStats(target).then(r => {
          if (r.success && r.data) setStatsData(r.data);
        });
        setTimeout(() => setFeedbackSuccessNotice(''), 4000);
      } else {
        alert(res.error || 'Lỗi gửi phản hồi');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const quickNudgeTemplates = [
    { type: 'cheer', text: '👏 Hôm nay học rất chăm chỉ và đúng giờ, tiếp tục phát huy nhé!' },
    { type: 'nudge', text: '⚠️ Nhắc nhở: Hôm nay bạn chưa hoàn thành đủ thời gian học, vào học ngay nhé!' },
    { type: 'cheer', text: '🔥 Chuỗi ngày học liên tục rất ấn tượng, đừng để bị đứt streak!' },
    { type: 'warning', text: '⏱️ Đã gần hết ngày rồi, hãy dành ra 15 phút ôn tập thẻ flashcards nhé!' }
  ];

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
          <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Đang tải Cổng Giám Sát Học Tập...</p>
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Không Tìm Thấy Hồ Sơ Giám Sát</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {error || 'Không thể tìm thấy thông tin giám sát người dùng này.'}
          </p>
          <button
            onClick={() => navigate(hasAuth ? '/dashboard' : '/login')}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}
          >
            {hasAuth ? 'Quay Về Không Gian Học' : 'Quay Về Trang Chủ'}
          </button>
        </div>
      </div>
    );
  }

  const { 
    user, 
    todayAccountability, 
    recentSessions = [], 
    supervisorFeedbacks = [], 
    levelsBreakdown, 
    activityDistribution, 
    periodsData 
  } = statsData;

  const formatSessionTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${hours}:${mins} • ${day}/${month}`;
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      paddingBottom: '5rem'
    }}>
      {/* 1. TOP NAVBAR (SUPERVISOR BRAND BAR) */}
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
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Brand Logo & Supervision Tag */}
          <div
            onClick={() => navigate(hasAuth ? '/dashboard' : '/login')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            title={hasAuth ? 'Quay về không gian học tập' : 'Về trang chủ'}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  LinguaVault
                </span>
                <span style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#16a34a',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                  <span>TRỰC TIẾP</span>
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.3px' }}>
                CỔNG GIÁM SÁT HỌC TẬP & BÁO CÁO KỶ LUẬT
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Sao chép link trang giám sát này"
            >
              {copied ? <Check size={15} /> : <Share2 size={15} />}
              <span>{copied ? 'Đã sao chép link!' : 'Chia sẻ link giám sát'}</span>
            </button>

            {toggleTheme && (
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                style={{
                  width: '36px',
                  height: '36px',
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
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            )}

            {hasAuth ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary glow-hover"
                style={{
                  padding: '0.5rem 1.1rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                  cursor: 'pointer'
                }}
              >
                <span>← Quay Về Không Gian Học</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <span>Vào App Học</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main style={{ maxWidth: '1100px', margin: '2rem auto 0 auto', padding: '0 1.25rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* HERO LEARNER CARD UNDER SUPERVISION */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
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
                  <Eye size={13} />
                  <span>HỒ SƠ ĐANG GIÁM SÁT</span>
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
                Chuỗi học liên tục 🔥
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontWeight: 900, fontSize: '1.3rem' }}>
                <Award size={22} />
                <span>Lv.{user.level}</span>
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px', fontWeight: 600 }}>
                {user.totalXp} XP tích lũy
              </div>
            </div>
          </div>
        </div>

        {/* 3. TODAY'S ACCOUNTABILITY & SUPERVISION BANNER (Trọng tâm giám sát ngày hôm nay) */}
        {todayAccountability && (
          <div style={{
            background: todayAccountability.overallStatus === 'completed'
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)'
              : (todayAccountability.overallStatus === 'in_progress'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.05) 100%)'),
            borderRadius: '24px',
            border: `1.5px solid ${todayAccountability.statusColor}`,
            padding: '1.75rem 2rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {/* Top Status Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  {todayAccountability.overallStatus === 'completed' && <CheckCircle size={24} style={{ color: '#22c55e' }} />}
                  {todayAccountability.overallStatus === 'in_progress' && <Clock size={24} style={{ color: '#f59e0b' }} />}
                  {todayAccountability.overallStatus === 'not_started' && <AlertTriangle size={24} style={{ color: '#ef4444' }} />}
                  
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: todayAccountability.statusColor, margin: 0 }}>
                    HÔM NAY: {todayAccountability.statusLabel.toUpperCase()}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {todayAccountability.statusMessage}
                </p>
              </div>

              {todayAccountability.lastActiveAt && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  Hoạt động gần nhất: <b style={{ color: 'var(--text-primary)' }}>{formatSessionTime(todayAccountability.lastActiveAt)}</b>
                </div>
              )}
            </div>

            {/* 3 Metric Progress Targets */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              paddingTop: '0.5rem'
            }}>
              {/* Target 1: Study Time */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '1.15rem',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>⏱️ Thời Gian Học Hôm Nay</span>
                  <b style={{ color: todayAccountability.isTimeGoalMet ? '#22c55e' : 'var(--text-primary)' }}>
                    {todayAccountability.todayMinutes} / {todayAccountability.targetGoalMinutes} phút
                  </b>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((todayAccountability.todayMinutes / todayAccountability.targetGoalMinutes) * 100))}%`,
                    height: '100%',
                    background: todayAccountability.isTimeGoalMet ? '#22c55e' : '#0284c7',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {todayAccountability.isTimeGoalMet ? '✓ Đạt chỉ tiêu thời lượng ngày' : 'Cần học thêm để đủ mục tiêu'}
                </div>
              </div>

              {/* Target 2: Flashcards Reviewed */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '1.15rem',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>🎴 Thẻ Flashcards Đã Ôn</span>
                  <b style={{ color: todayAccountability.isReviewsGoalMet ? '#22c55e' : 'var(--text-primary)' }}>
                    {todayAccountability.todayReviews} / {todayAccountability.targetGoalReviews} thẻ
                  </b>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round((todayAccountability.todayReviews / todayAccountability.targetGoalReviews) * 100))}%`,
                    height: '100%',
                    background: todayAccountability.isReviewsGoalMet ? '#22c55e' : '#8b5cf6',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {todayAccountability.todayReviews > 0 ? `Đã ôn ${todayAccountability.todayReviews} lượt lặp ngắt quãng` : 'Hôm nay chưa thực hiện phiên ôn thẻ nào'}
                </div>
              </div>

              {/* Target 3: Sessions Count */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '1.15rem',
                borderRadius: '16px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>🎯 Số Phiên Bấm Giờ</span>
                  <b style={{ color: 'var(--accent-primary)' }}>
                    {todayAccountability.todaySessionsCount} phiên
                  </b>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, todayAccountability.todaySessionsCount * 25)}%`,
                    height: '100%',
                    background: '#f59e0b',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {todayAccountability.todaySessionsCount > 0 ? 'Đã ghi nhận dữ liệu bấm giờ Pomodoro' : 'Chưa có phiên bấm giờ nào hôm nay'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SUPERVISOR INTERACTIVE BOX: GỬI LỜI NHẮC / ĐỘNG VIÊN HỌC VIÊN */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={18} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              Gửi Lời Động Viên & Nhắc Nhở Học Viên (Dành Cho Người Giám Sát)
            </h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Bạn đang giám sát học viên <b>{user.displayName}</b>. Hãy gửi lời khen hoặc nhắc nhở kỷ luật; lời nhắn sẽ hiển thị trực tiếp trên Dashboard của người học!
          </p>

          {feedbackSuccessNotice && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid #22c55e',
              color: '#16a34a',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.88rem',
              marginBottom: '1rem'
            }}>
              {feedbackSuccessNotice}
            </div>
          )}

          {/* Quick Nudge Templates */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {quickNudgeTemplates.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setFeedbackType(tpl.type);
                  setFeedbackMessage(tpl.text);
                }}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {tpl.text}
              </button>
            ))}
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Tên người giám sát (VD: Bố/Mẹ, Thầy Hoàng, Bạn học...)"
                value={supervisorName}
                onChange={e => setSupervisorName(e.target.value)}
                style={{
                  flex: '1 1 240px',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setFeedbackType('cheer')}
                  style={{
                    padding: '0.55rem 0.95rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: feedbackType === 'cheer' ? '#22c55e' : 'var(--bg-tertiary)',
                    color: feedbackType === 'cheer' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  👏 Khen Ngợi
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType('nudge')}
                  style={{
                    padding: '0.55rem 0.95rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: feedbackType === 'nudge' ? '#f59e0b' : 'var(--bg-tertiary)',
                    color: feedbackType === 'nudge' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  ⚠️ Nhắc Nhở
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType('warning')}
                  style={{
                    padding: '0.55rem 0.95rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: feedbackType === 'warning' ? '#ef4444' : 'var(--bg-tertiary)',
                    color: feedbackType === 'warning' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  🚨 Cảnh Báo
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              placeholder="Nhập nội dung lời nhắn hoặc bấm các mẫu gợi ý phía trên..."
              value={feedbackMessage}
              onChange={e => setFeedbackMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isSendingFeedback || !feedbackMessage.trim()}
                className="btn-primary glow-hover"
                style={{
                  padding: '0.65rem 1.35rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isSendingFeedback ? 'not-allowed' : 'pointer',
                  opacity: (!feedbackMessage.trim() || isSendingFeedback) ? 0.6 : 1
                }}
              >
                <Send size={16} />
                <span>{isSendingFeedback ? 'Đang gửi...' : 'Gửi Lời Nhắc Đến Học Viên'}</span>
              </button>
            </div>
          </form>

          {/* Recent Supervisor Messages Stream */}
          {supervisorFeedbacks && supervisorFeedbacks.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                LỜI NHẮN ĐÃ GỬI GẦN ĐÂY ({supervisorFeedbacks.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {supervisorFeedbacks.slice(0, 4).map(fb => (
                  <div
                    key={fb.id}
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderLeft: `4px solid ${fb.type === 'warning' ? '#ef4444' : (fb.type === 'nudge' ? '#f59e0b' : '#22c55e')}`,
                      padding: '0.65rem 1rem',
                      borderRadius: '0 12px 12px 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {fb.supervisor_name}:
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                        "{fb.message}"
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {formatSessionTime(fb.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. MULTI-PERIOD INTERACTIVE ACTIVITY CHART (Mặc định Tuần này, gọi data theo tab khi bấm) */}
        {periodsData && (
          <ActivityHistoryChart 
            periodsData={periodsData} 
            defaultPeriod="week"
            title="Biểu Đồ Tiến Trình Học Tập & Lịch Sử Toàn Diện"
            onFetchPeriod={handleFetchChartPeriod}
          />
        )}

        {/* 6. RECENT STUDY SESSIONS AUDIT LOG (Kiểm tra thực tế các phiên học) */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <History size={20} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Nhật Ký Các Phiên Học Gần Nhất (Audit Trail)
              </h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Ghi nhận từ đồng hồ bấm giờ Pomodoro & Stopwatch
            </span>
          </div>

          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Chưa có phiên học nào được ghi lại trong hệ thống.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', position: 'relative' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.88rem',
                  opacity: loadingSessions ? 0.4 : 1,
                  transition: 'opacity 0.2s ease'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Thời Gian</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Nội Dung Hoạt Động</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Thời Lượng</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Chế Độ</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Ghi Chú Phiên Học</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => (
                      <tr key={session.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {formatSessionTime(session.started_at)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {session.activity_title}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                          {session.duration_minutes} phút
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: session.mode === 'pomodoro' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                            color: session.mode === 'pomodoro' ? '#ef4444' : 'var(--accent-primary)'
                          }}>
                            {session.mode === 'pomodoro' ? '🍅 Pomodoro' : '⏱️ Bấm giờ'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontStyle: session.notes ? 'normal' : 'italic' }}>
                          {session.notes || 'Không có ghi chú'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {sessionsPagination.total > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  {/* Left: Summary text & Limit selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Hiển thị <strong style={{ color: 'var(--text-primary)' }}>
                        {(sessionsPagination.page - 1) * sessionsPagination.limit + 1} - {Math.min(sessionsPagination.page * sessionsPagination.limit, sessionsPagination.total)}
                      </strong> trên <strong style={{ color: 'var(--text-primary)' }}>{sessionsPagination.total}</strong> phiên học
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span>Mỗi trang:</span>
                      {[5, 10, 20].map(lim => (
                        <button
                          key={lim}
                          onClick={() => handleSessionsLimitChange(lim)}
                          disabled={loadingSessions}
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            border: '1px solid var(--border-color)',
                            background: sessionsPagination.limit === lim ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            color: sessionsPagination.limit === lim ? '#ffffff' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {lim}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Page Navigation Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={() => handleSessionsPageChange(sessionsPagination.page - 1)}
                      disabled={sessionsPagination.page <= 1 || loadingSessions}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        color: sessionsPagination.page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                        cursor: sessionsPagination.page <= 1 ? 'not-allowed' : 'pointer',
                        opacity: sessionsPagination.page <= 1 ? 0.5 : 1
                      }}
                    >
                      <ChevronLeft size={16} />
                      <span>Trước</span>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: sessionsPagination.totalPages }, (_, i) => i + 1)
                      .filter(p => {
                        return p === 1 || p === sessionsPagination.totalPages || Math.abs(p - sessionsPagination.page) <= 1;
                      })
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && p - prev > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span style={{ padding: '0 0.3rem', color: 'var(--text-muted)' }}>...</span>}
                            <button
                              onClick={() => handleSessionsPageChange(p)}
                              disabled={loadingSessions}
                              style={{
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                border: '1px solid var(--border-color)',
                                background: sessionsPagination.page === p ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: sessionsPagination.page === p ? '#ffffff' : 'var(--text-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })
                    }

                    <button
                      onClick={() => handleSessionsPageChange(sessionsPagination.page + 1)}
                      disabled={sessionsPagination.page >= sessionsPagination.totalPages || loadingSessions}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-tertiary)',
                        color: sessionsPagination.page >= sessionsPagination.totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                        cursor: sessionsPagination.page >= sessionsPagination.totalPages ? 'not-allowed' : 'pointer',
                        opacity: sessionsPagination.page >= sessionsPagination.totalPages ? 0.5 : 1
                      }}
                    >
                      <span>Sau</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 7. CEFR LEVEL BREAKDOWN & ACTIVITY BREAKDOWN WITH DATE FILTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Date Filter Toolbar */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>Bộ Lọc Ngày: Phân Bổ CEFR & Hoạt Động Rèn Luyện</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {selectedDatePreset === 'all'
                  ? 'Đang hiển thị toàn bộ dữ liệu tích lũy từ trước đến nay'
                  : `Đang lọc dữ liệu ngày: ${selectedBreakdownDate === todayStr ? 'Hôm nay (' + formatDateVi(selectedBreakdownDate) + ')' : formatDateVi(selectedBreakdownDate)}`}
              </div>
            </div>

            {/* Filter Buttons & Date Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fetchDailyBreakdown(todayStr, 'today')}
                disabled={loadingBreakdown}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: selectedDatePreset === 'today' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: selectedDatePreset === 'today' ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Hôm nay
              </button>

              <button
                type="button"
                onClick={() => fetchDailyBreakdown(yesterdayStr, 'yesterday')}
                disabled={loadingBreakdown}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: selectedDatePreset === 'yesterday' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: selectedDatePreset === 'yesterday' ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Hôm qua
              </button>

              {/* Date Input */}
              <input
                type="date"
                value={selectedBreakdownDate !== 'all' ? selectedBreakdownDate : todayStr}
                max={todayStr}
                disabled={loadingBreakdown}
                onChange={(e) => {
                  if (e.target.value) {
                    const mode = e.target.value === todayStr ? 'today' : (e.target.value === yesterdayStr ? 'yesterday' : 'custom');
                    fetchDailyBreakdown(e.target.value, mode);
                  }
                }}
                style={{
                  padding: '0.42rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: selectedDatePreset === 'custom'
                    ? 'rgba(2, 132, 199, 0.12)'
                    : 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              />

              <button
                type="button"
                onClick={() => fetchDailyBreakdown('all', 'all')}
                disabled={loadingBreakdown}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: selectedDatePreset === 'all' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: selectedDatePreset === 'all' ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Tất cả thời gian
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            opacity: loadingBreakdown ? 0.4 : 1,
            transition: 'opacity 0.2s ease',
            position: 'relative'
          }}>
            {/* CEFR Level distribution */}
            <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Trình Độ Chuẩn CEFR Phân Bổ</span>
                  </h4>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--border-color)'
                  }}>
                    {breakdownData.isAll 
                      ? `${breakdownData.totalWords} từ vựng`
                      : (breakdownData.totalWords > 0 ? `${breakdownData.totalWords} từ tương tác` : '0 từ tương tác')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => {
                    const count = breakdownData.levelsBreakdown?.[lvl] || 0;
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

              <div style={{
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>
                  {breakdownData.isAll
                    ? '📊 Toàn bộ từ vựng đã lưu trong kho'
                    : `📅 Từ vựng nạp mới hoặc ôn tập ngày ${formatDateVi(breakdownData.date)}`}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Tổng: {breakdownData.totalWords} từ
                </span>
              </div>
            </div>

            {/* Study Activity Distribution */}
            <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                    Cơ Cấu Hoạt Động Rèn Luyện
                  </h4>
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--border-color)'
                  }}>
                    {breakdownData.totalSessions} phiên • {breakdownData.totalMinutes} phút
                  </span>
                </div>

                {breakdownData.totalSessions === 0 && !breakdownData.isAll ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem 1rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '14px',
                    color: 'var(--text-muted)',
                    fontSize: '0.86rem'
                  }}>
                    Chưa có phiên học nào được ghi nhận trong ngày này.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(breakdownData.activityDistribution || []).map(act => (
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
                          {act.sessions} phiên ({Math.round((act.seconds || 0) / 60)} phút)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>
                  {breakdownData.isAll
                    ? '⏱️ Toàn bộ thời lượng rèn luyện tích lũy'
                    : `⏱️ Phiên học ghi nhận ngày ${formatDateVi(breakdownData.date)}`}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Tổng: {breakdownData.totalMinutes} phút
                </span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
