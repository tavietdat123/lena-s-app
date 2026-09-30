import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Volume2, 
  Sparkles, 
  Tag, 
  CheckCircle2,
  Settings
} from 'lucide-react';
import { playAudio } from '../../services/audioService';
import { api } from '../../services/api';
import PatternCategoryModal from './PatternCategoryModal';
import { DEFAULT_PATTERN_CATEGORIES } from '../../constants/patternCategories';

// Helper: Remove Vietnamese Tones for Accent-Insensitive Smart Search
const removeVietnameseTones = (str) => {
  if (!str) return '';
  let s = String(str);
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  s = s.replace(/Đ/g, 'D');
  s = s.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '');
  s = s.replace(/\u02C6|\u0306|\u031B/g, '');
  return s;
};

export default function PatternHub({ patterns = [], onAddPattern, onEditPattern, onDeletePattern }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState(DEFAULT_PATTERN_CATEGORIES);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.getPatternCategories();
      if (res.success && res.data && res.data.length > 0) {
        setCategories(res.data);
      }
    } catch (e) {
      console.warn('Failed to load categories:', e);
    }
  };

  const filteredPatterns = patterns.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      const qClean = removeVietnameseTones(q);
      const name = (p.name || '').toLowerCase();
      const formula = (p.formula || '').toLowerCase();
      const meaningVi = (p.meaning_vi || '').toLowerCase();
      const exp = (p.explanation || '').toLowerCase();
      const example = (p.example_en || '').toLowerCase();

      const matchDirect = 
        name.includes(q) ||
        formula.includes(q) ||
        meaningVi.includes(q) ||
        exp.includes(q) ||
        example.includes(q);

      const matchUnaccented =
        removeVietnameseTones(name).includes(qClean) ||
        removeVietnameseTones(meaningVi).includes(qClean) ||
        removeVietnameseTones(exp).includes(qClean);

      if (!matchDirect && !matchUnaccented) return false;
    }

    const pCat = p.category || 'emphasis';
    const matchesCategory = categoryFilter === 'all' || pCat === categoryFilter;

    return matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. TOP BAR */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Tìm kiếm mẫu câu, công thức, giải thích..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="input-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: 'auto', fontWeight: 600 }}
          >
            <option value="all">🌟 Tất cả chức năng (All)</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.emoji ? `${c.emoji} ` : ''}{c.name}
              </option>
            ))}
          </select>

          <button 
            onClick={() => setIsCategoryModalOpen(true)} 
            className="btn-secondary"
            title="Quản lý các nhóm chức năng diễn đạt"
          >
            <Settings size={17} />
            <span>Quản Lý Chức Năng</span>
          </button>

          <button onClick={onAddPattern} className="btn-primary">
            <Plus size={18} />
            <span>Thêm Mẫu Câu Mới</span>
          </button>
        </div>
      </div>

      {/* 2. PATTERNS GRID */}
      {filteredPatterns.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-color)'
        }}>
          <Layers size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto', opacity: 0.6 }} />
          <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Chưa có mẫu câu nào phù hợp</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            Lưu các mẫu câu và công thức ngữ pháp để xây dựng phản xạ viết và nói tự nhiên.
          </p>
          <button onClick={onAddPattern} className="btn-primary">
            <Plus size={18} />
            <span>Thêm Mẫu Câu Đầu Tiên</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {filteredPatterns.map(p => {
            const catInfo = categories.find(c => c.id === p.category) || { name: 'Chức năng', emoji: '🧩', color: '#8b5cf6' };
            return (
              <div
                key={p.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  {/* Header: Name + Category */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '8px' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                      {p.name}
                    </h4>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: `${catInfo.color || '#8b5cf6'}15`,
                      color: catInfo.color || '#8b5cf6',
                      whiteSpace: 'nowrap'
                    }}>
                      {catInfo.emoji || '🧩'} {catInfo.name}
                    </span>
                  </div>

                {/* Formula Box */}
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                  border: '1px dashed var(--border-color)'
                }}>
                  {p.formula}
                </div>

                {/* Meaning & Explanation */}
                <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  {p.meaning_vi}
                </p>

                {p.explanation && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
                    {p.explanation}
                  </p>
                )}

                {/* Examples with Audio */}
                {p.examples && p.examples.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Ví dụ áp dụng:
                    </span>
                    {p.examples.map((ex, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          background: 'var(--bg-secondary)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.85rem',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <span style={{ fontStyle: 'italic', flex: 1 }}>"{ex}"</span>
                        <button
                          onClick={() => playAudio(ex)}
                          className="btn-icon"
                          style={{ padding: '0.15rem', color: 'var(--accent-primary)', flexShrink: 0 }}
                          title="Nghe phát âm cả câu"
                        >
                          <Volume2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer: Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => onEditPattern(p)}
                    className="btn-icon"
                    title="Chỉnh sửa mẫu câu"
                    style={{ padding: '0.4rem' }}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => onDeletePattern(p.id)}
                    className="btn-icon"
                    title="Xóa mẫu câu"
                    style={{ padding: '0.4rem', color: 'var(--accent-danger)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Category Manager Modal */}
      <PatternCategoryModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChange={() => {
          loadCategories();
        }}
      />
    </div>
  );
}
