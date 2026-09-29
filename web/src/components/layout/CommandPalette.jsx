import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Layers, 
  FileText, 
  Plus, 
  Moon, 
  Sun, 
  Download, 
  BrainCircuit,
  ArrowRight,
  Command,
  Timer
} from 'lucide-react';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  words = [], 
  patterns = [], 
  notes = [], 
  onNavigate, 
  onOpenQuickAdd, 
  onToggleTheme, 
  isDark,
  onExportBackup
}) {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Cmd/Ctrl + K or Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter items
  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(query.toLowerCase()) ||
    w.meaning_vi.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  const filteredPatterns = patterns.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.meaning_vi.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  const actions = [
    {
      id: 'add-word',
      title: 'Thêm nhanh từ vựng mới (1-Click Auto-Fill)',
      icon: Plus,
      action: () => { onClose(); onOpenQuickAdd(); }
    },
    {
      id: 'start-review',
      title: 'Bắt đầu ôn tập Spaced Repetition hôm nay',
      icon: Sparkles,
      action: () => { onClose(); onNavigate('review'); }
    },
    {
      id: 'ai-lab',
      title: 'Mở AI English Lab (Bóc tách câu & Sửa lỗi)',
      icon: BrainCircuit,
      action: () => { onClose(); onNavigate('ai-lab'); }
    },
    {
      id: 'study-timer',
      title: 'Bấm giờ học chủ động & Xem bảng thống kê thời gian',
      icon: Timer,
      action: () => { onClose(); onNavigate('timer'); }
    },
    {
      id: 'toggle-theme',
      title: isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối',
      icon: isDark ? Sun : Moon,
      action: () => { onToggleTheme(); }
    },
    {
      id: 'export-backup',
      title: 'Sao lưu toàn bộ dữ liệu ra file JSON',
      icon: Download,
      action: () => { onClose(); onExportBackup(); }
    }
  ];

  const filteredActions = actions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}
      >
        {/* Search Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-card)'
        }}>
          <Search size={20} style={{ color: 'var(--accent-primary)' }} />
          <input
            type="text"
            placeholder="Tìm từ vựng, mẫu câu, bài đọc hoặc lệnh hành động... (Esc để đóng)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}
          />
          <span className="kbd-pill">ESC</span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem' }}>
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 0.5rem' }}>
                Hành Động Nhanh
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
                {filteredActions.map(a => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.id}
                      onClick={a.action}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                      className="glow-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <Icon size={17} style={{ color: 'var(--accent-primary)' }} />
                        <span>{a.title}</span>
                      </div>
                      <ArrowRight size={15} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Words Results */}
          {filteredWords.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 0.5rem' }}>
                Từ Vựng
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
                {filteredWords.map(w => (
                  <button
                    key={w.id}
                    onClick={() => {
                      onClose();
                      onNavigate('vocab');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-tertiary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontWeight: 800 }}>{w.word}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>• {w.meaning_vi}</span>
                    </div>
                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{w.level}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Patterns Results */}
          {filteredPatterns.length > 0 && (
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 0.5rem' }}>
                Mẫu Câu
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
                {filteredPatterns.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onNavigate('patterns');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-tertiary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Layers size={16} style={{ color: 'var(--accent-warning)' }} />
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>• {p.meaning_vi}</span>
                    </div>
                    <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>{p.tone}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '0.75rem 1.25rem',
          background: 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>Mẹo: Nhấn <b>⌘ + K</b> (hoặc Ctrl + K) bất cứ lúc nào để tìm kiếm</span>
          <span>LinguaVault Pro Max</span>
        </div>
      </div>
    </div>
  );
}
