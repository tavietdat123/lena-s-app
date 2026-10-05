import React, { useState, useRef, useEffect } from 'react';
import { 
  Flame, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  Layers, 
  BarChart3, 
  CalendarDays,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ActivityHistoryChart({ 
  periodsData, 
  defaultPeriod = 'week', 
  title = null,
  showMetricsToggle = true,
  onFetchPeriod = null
}) {
  const { t, uiLang } = useLanguage();
  const [localPeriodsData, setLocalPeriodsData] = useState(periodsData || {});
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [fetchingPeriodKey, setFetchingPeriodKey] = useState(null);
  const [metricMode, setMetricMode] = useState('duration'); // 'duration' (minutes) | 'reviews' (cards) | 'combined'
  const [hoveredDay, setHoveredDay] = useState(null);
  const scrollContainerRef = useRef(null);

  // Sync incoming periodsData into local cache
  useEffect(() => {
    if (periodsData) {
      setLocalPeriodsData(prev => ({ ...prev, ...periodsData }));
    }
  }, [periodsData]);

  // If defaultPeriod changes from parent
  useEffect(() => {
    if (defaultPeriod) {
      setSelectedPeriod(defaultPeriod);
    }
  }, [defaultPeriod]);

  // Handle switching periods (loads on-demand if not already cached)
  const handlePeriodChange = async (key) => {
    if (selectedPeriod === key || loadingPeriod) return;

    // If we already have the data locally, switch instantly
    if (localPeriodsData && localPeriodsData[key]) {
      setSelectedPeriod(key);
      return;
    }

    // If not cached and onFetchPeriod callback provided, fetch on-demand
    if (onFetchPeriod) {
      setLoadingPeriod(true);
      setFetchingPeriodKey(key);
      try {
        const data = await onFetchPeriod(key);
        if (data) {
          setLocalPeriodsData(prev => ({
            ...prev,
            [key]: data
          }));
        }
        setSelectedPeriod(key);
      } catch (err) {
        console.error('Failed to load period data:', err);
      } finally {
        setLoadingPeriod(false);
        setFetchingPeriodKey(null);
      }
    } else {
      setSelectedPeriod(key);
    }
  };

  // Available periods from localPeriodsData
  const currentPeriodData = localPeriodsData?.[selectedPeriod] || localPeriodsData?.week || localPeriodsData?.all || null;
  const days = currentPeriodData?.days || [];
  const summary = currentPeriodData?.summary || {};

  // Auto-scroll to latest active day on period change
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            left: scrollContainerRef.current.scrollWidth,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [selectedPeriod]);

  if (!localPeriodsData || Object.keys(localPeriodsData).length === 0) {
    return null;
  }

  // Calculate max metric value for dynamic bar scaling
  const maxMinutes = Math.max(30, ...days.map(d => d.duration_minutes || 0));
  const maxReviews = Math.max(10, ...days.map(d => d.reviews_count || 0));

  const formatHoursAndMins = (minutes) => {
    if (!minutes || minutes <= 0) return '0 phút';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return `${h} giờ ${m > 0 ? `${m} phút` : ''}`.trim();
    }
    return `${m} phút`;
  };

  const periodOptions = [
    { key: 'week', label: t.activityChart?.thisWeek || 'Tuần Này', badge: t.activityChart?.thisWeekBadge || '7 ngày', icon: CalendarDays },
    { key: 'month', label: t.activityChart?.thisMonth || 'Tháng Này', badge: t.activityChart?.thisMonthBadge || 'Tháng hiện tại', icon: Calendar },
    { key: 'last30', label: t.activityChart?.last30Days || '30 Ngày Qua', badge: t.activityChart?.last30Badge || '30 ngày', icon: TrendingUp },
    { key: 'all', label: t.activityChart?.allTime || 'Tổng Thời Gian', badge: t.activityChart?.allTimeBadge || 'Từ trước đến giờ', icon: Flame }
  ];

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: '24px',
      border: '1px solid var(--border-color)',
      padding: '1.75rem',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* 1. Header with Title and Period Filter Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}>
              <BarChart3 size={20} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {title || t.activityChart?.title || 'Biểu Đồ Hoạt Động & Thời Gian Học'}
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', margin: 0 }}>
            {currentPeriodData?.description || 'Theo dõi chuỗi học tập và phân bổ thời lượng rèn luyện.'}
          </p>
        </div>

        {/* Multi-Period Filter Buttons (Tuần này, Tháng này, 30 ngày qua, Tổng thời gian) */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-tertiary)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {periodOptions.map(p => {
            const isSelected = selectedPeriod === p.key;
            const isFetchingThis = loadingPeriod && fetchingPeriodKey === p.key;
            const Icon = p.icon;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePeriodChange(p.key)}
                disabled={loadingPeriod}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSelected 
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                    : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: loadingPeriod ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                  opacity: (loadingPeriod && !isFetchingThis && !isSelected) ? 0.6 : 1
                }}
              >
                {isFetchingThis ? (
                  <span style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: isSelected ? '#ffffff' : 'var(--accent-primary)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                ) : (
                  <Icon size={14} />
                )}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Milestone Summary KPI Cards for Selected Period */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem',
        opacity: loadingPeriod ? 0.45 : 1,
        transition: 'opacity 0.2s ease'
      }}>
        {/* KPI 1: Total Study Time */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '1rem 1.15rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(2, 132, 199, 0.12)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              TỔNG THỜI LƯỢNG
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {formatHoursAndMins(summary.total_minutes || 0)}
            </div>
          </div>
        </div>

        {/* KPI 2: Active Days */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '1rem 1.15rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Flame size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              NGÀY HOẠT ĐỘNG
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1.2 }}>
              {summary.active_days || 0} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {summary.total_days || days.length} ngày</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Daily Average */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '1rem 1.15rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              TRUNG BÌNH MỖI NGÀY
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', lineHeight: 1.2 }}>
              {summary.avg_minutes || 0} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>phút / ngày</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Reviews & Sessions */}
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '1rem 1.15rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.12)',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              ÔN TẬP & PHIÊN HỌC
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#8b5cf6', lineHeight: 1.2 }}>
              {summary.reviews_count || 0} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>lượt ({summary.sessions_count || 0} phiên)</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Peak Day (Kỷ lục ngày cao nhất) */}
        {summary.peak_day && (
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '1rem 1.15rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.12)',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                NGÀY KỶ LỤC ({summary.peak_day.shortDate})
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ec4899', lineHeight: 1.2 }}>
                {summary.peak_day.minutes > 0 ? `${summary.peak_day.minutes} phút` : `${summary.peak_day.reviews} lượt ôn`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Metric Toggle (Thời Gian Học vs Lượt Ôn Tập) */}
      {showMetricsToggle && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '1px dashed var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>Hiển thị cột biểu đồ theo:</span>
          </div>

          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-primary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setMetricMode('duration')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: metricMode === 'duration' ? 'var(--accent-primary)' : 'transparent',
                color: metricMode === 'duration' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.activityChart?.durationMetric ? `⏱️ ${t.activityChart.durationMetric}` : '⏱️ Thời Lượng Học (Phút)'}
            </button>

            <button
              type="button"
              onClick={() => setMetricMode('reviews')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: metricMode === 'reviews' ? '#8b5cf6' : 'transparent',
                color: metricMode === 'reviews' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.activityChart?.reviewsMetric ? `🎴 ${t.activityChart.reviewsMetric}` : '🎴 Lượt Ôn Flashcards'}
            </button>
          </div>
        </div>
      )}

      {/* 4. Interactive Horizontal Scrollable SVG/CSS Bar Chart */}
      <div 
        ref={scrollContainerRef}
        style={{
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          paddingTop: '1rem',
          scrollbarWidth: 'thin',
          opacity: loadingPeriod ? 0.45 : 1,
          transition: 'opacity 0.2s ease'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: days.length > 25 ? '0.35rem' : '0.65rem',
          minWidth: days.length > 14 ? `${days.length * (days.length > 25 ? 32 : 46)}px` : '100%',
          height: '210px',
          paddingTop: '2.5rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          position: 'relative'
        }}>
          {days.map((day) => {
            const minutes = day.duration_minutes || 0;
            const reviews = day.reviews_count || 0;
            
            // Determine bar height based on active metric mode
            let heightPercent = 4;
            if (metricMode === 'duration') {
              heightPercent = maxMinutes > 0 ? Math.max(4, Math.round((minutes / maxMinutes) * 100)) : 4;
            } else {
              heightPercent = maxReviews > 0 ? Math.max(4, Math.round((reviews / maxReviews) * 100)) : 4;
            }

            const hasActivity = minutes > 0 || reviews > 0;
            const isToday = day.isToday;
            const isFuture = day.isFuture;

            // Bar background gradient styling
            let barBackground = 'var(--bg-tertiary)';
            if (isToday) {
              barBackground = 'linear-gradient(180deg, #0284c7 0%, #38bdf8 100%)';
            } else if (hasActivity) {
              barBackground = metricMode === 'duration' 
                ? (minutes > 0 ? 'linear-gradient(180deg, #6366f1 0%, #818cf8 100%)' : 'rgba(99, 102, 241, 0.25)')
                : (reviews > 0 ? 'linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%)' : 'rgba(139, 92, 246, 0.25)');
            } else if (isFuture) {
              barBackground = 'transparent';
            }

            return (
              <div
                key={day.date}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  cursor: hasActivity ? 'pointer' : 'default',
                  opacity: isFuture ? 0.35 : 1
                }}
              >
                {/* Metric value indicator on top of bar */}
                {hasActivity && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: isToday 
                      ? 'var(--accent-primary)' 
                      : (metricMode === 'duration' ? '#6366f1' : '#8b5cf6'),
                    marginBottom: '4px',
                    whiteSpace: 'nowrap'
                  }}>
                    {metricMode === 'duration' 
                      ? (minutes > 0 ? `${minutes}'` : (reviews > 0 ? `🎴${reviews}` : ''))
                      : (reviews > 0 ? reviews : `${minutes}'`)}
                  </span>
                )}

                {/* The Visual Bar */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: days.length > 25 ? '24px' : '36px',
                    height: isFuture ? '6px' : `${heightPercent}%`,
                    borderRadius: '8px 8px 3px 3px',
                    background: barBackground,
                    border: isFuture ? '1px dashed var(--border-color)' : (isToday ? '1px solid #38bdf8' : 'none'),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isToday && hasActivity 
                      ? '0 4px 14px rgba(2, 132, 199, 0.45)' 
                      : (hasActivity ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none'),
                    transform: hoveredDay?.date === day.date ? 'scaleY(1.05)' : 'none'
                  }}
                />

                {/* Date Label */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginTop: '6px'
                }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: isToday ? 900 : 700,
                    color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap'
                  }}>
                    {day.shortDate}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    color: isToday ? 'var(--accent-primary)' : 'var(--text-muted)'
                  }}>
                    {day.weekday}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Rich Hover Tooltip Banner (or persistent active day insight) */}
      <div style={{
        background: 'var(--bg-tertiary)',
        padding: '0.85rem 1.25rem',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.85rem'
      }}>
        {hoveredDay ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: hoveredDay.isToday ? '#0284c7' : '#8b5cf6'
              }} />
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                {hoveredDay.label} {hoveredDay.isToday ? '• Hôm Nay ⚡' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontWeight: 600 }}>
              <span>
                ⏱️ Thời gian học: <b style={{ color: 'var(--text-primary)' }}>{formatHoursAndMins(hoveredDay.duration_minutes)}</b>
              </span>
              <span>
                🎴 Thẻ ôn tập: <b style={{ color: '#8b5cf6' }}>{hoveredDay.reviews_count || 0} lượt</b>
              </span>
              <span>
                🎯 Số phiên: <b style={{ color: 'var(--accent-primary)' }}>{hoveredDay.sessions_count || 0} phiên</b>
              </span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <Info size={16} />
            <span>Rê chuột hoặc chạm vào từng cột trên biểu đồ để xem chi tiết thời lượng và số thẻ đã ôn.</span>
          </div>
        )}
      </div>
    </div>
  );
}
