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
  Globe
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, stats, onOpenQuickAdd, onOpenSettings, onOpenCommandPalette, onSharePublicStats }) {
  const navItems = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'vocab', 
      path: '/vocab',
      label: 'Kho Từ Vựng', 
      icon: BookOpen, 
      count: stats?.words?.total || 0 
    },
    { 
      id: 'patterns', 
      path: '/patterns',
      label: 'Mẫu Câu & Cấu Trúc', 
      icon: Layers, 
      count: stats?.patterns?.total || 0 
    },
    { 
      id: 'quiz', 
      path: '/quiz',
      label: 'Quiz Theo Topic', 
      icon: Target,
      isNew: true
    },
    { 
      id: 'speaking', 
      path: '/speaking',
      label: 'AI Speaking Lab', 
      icon: Mic,
      isNew: true
    },
    { 
      id: 'reader', 
      path: '/reader',
      label: 'Ghi Chú & Bài Đọc', 
      icon: FileText, 
      count: stats?.notes?.total || 0 
    },
    { 
      id: 'review', 
      path: '/review',
      label: 'Ôn Tập SRS', 
      icon: Sparkles, 
      dueCount: stats?.total_due_today || 0,
      highlight: true
    },
    { 
      id: 'timer', 
      path: '/timer',
      label: 'Bấm Giờ & Thống Kê', 
      icon: Timer,
      isNew: true
    },
    { 
      id: 'ai-lab', 
      path: '/ai-lab',
      label: 'AI English Lab', 
      icon: BrainCircuit,
      isAi: true
    }
  ];

  const streak = stats?.streak || 0;
  const mastered = stats?.words?.mastered || 0;

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <NavLink 
        to="/" 
        style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0 0.4rem', textDecoration: 'none', color: 'inherit' }}
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

      {/* Quick Add Action Button */}
      <button 
        onClick={onOpenQuickAdd}
        className="btn-primary glow-hover" 
        style={{ width: '100%', justifyContent: 'center', padding: '0.85rem 1rem', fontSize: '0.95rem' }}
      >
        <Plus size={19} />
        <span>Thêm Nhanh (1-Click)</span>
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
                  MỚI
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
                  AI ⚡
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info, XP Bar & Settings */}
      <div style={{ 
        borderTop: '1px solid var(--border-color)', 
        paddingTop: '1.1rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.85rem' 
      }}>
        {/* Streak Pill */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'var(--bg-tertiary)',
          padding: '0.65rem 0.9rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={19} style={{ color: 'var(--accent-warning)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Daily Streak</span>
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
            {streak} ngày
          </span>
        </div>

        {/* Command Palette Trigger in Sidebar */}
        <button 
          onClick={onOpenCommandPalette}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Command size={14} />
            <span>Tìm kiếm nhanh</span>
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            <span className="kbd-pill">⌘</span>
            <span className="kbd-pill">K</span>
          </div>
        </button>

        {/* Public stats portfolio share button */}
        {onSharePublicStats && (
          <button 
            onClick={onSharePublicStats}
            className="btn-secondary" 
            style={{ 
              width: '100%', 
              justifyContent: 'flex-start', 
              padding: '0.65rem 0.95rem',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)'
            }}
            title="Sao chép link bảng thống kê công khai"
          >
            <Globe size={17} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Thống Kê Public</span>
          </button>
        )}

        {/* Settings button */}
        <button 
          onClick={onOpenSettings}
          className="btn-secondary" 
          style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 0.95rem' }}
        >
          <Settings size={17} />
          <span style={{ fontSize: '0.88rem' }}>Cài đặt & Sao lưu</span>
        </button>
      </div>
    </aside>
  );
}
