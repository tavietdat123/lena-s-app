import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Trash2, Loader2, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function PatternModal({ initialData = null, onClose, onSaved }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [explanation, setExplanation] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [category, setCategory] = useState('emphasis');
  const [categories, setCategories] = useState([]);
  const [tone, setTone] = useState('Formal');
  const [examples, setExamples] = useState(['']);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.getPatternCategories().then(res => {
      if (res.success && res.data) {
        setCategories(res.data);
      }
    });

    if (initialData) {
      setName(initialData.name || '');
      setFormula(initialData.formula || '');
      setExplanation(initialData.explanation || '');
      setMeaningVi(initialData.meaning_vi || '');
      setCategory(initialData.category || 'emphasis');
      setTone(initialData.tone || 'Formal');
      setExamples(initialData.examples?.length > 0 ? initialData.examples : ['']);
    }
  }, [initialData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !formula.trim() || !meaningVi.trim()) {
      setErrorMsg('Vui lòng nhập Tên mẫu câu, Công thức và Nghĩa tiếng Việt');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const payload = {
      name: name.trim(),
      formula: formula.trim(),
      explanation: explanation.trim(),
      meaning_vi: meaningVi.trim(),
      category,
      tone,
      examples: examples.filter(ex => ex.trim() !== ''),
      tags: []
    };

    try {
      let res;
      if (initialData && initialData.id) {
        res = await api.updatePattern(initialData.id, payload);
      } else {
        res = await api.createPattern(payload);
      }

      if (res.success) {
        onSaved();
        onClose();
      } else {
        setErrorMsg(res.error || 'Có lỗi xảy ra khi lưu mẫu câu');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối tới máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {initialData?.id ? (t.common?.edit || 'Chỉnh Sửa Mẫu Câu') : (t.patterns?.addPatternBtn || 'Thêm Mẫu Câu / Cấu Trúc Ngữ Pháp Mới')}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMsg && (
            <div style={{
              background: 'var(--accent-danger-light)',
              color: 'var(--accent-danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 600
            }}>
              {errorMsg}
            </div>
          )}

          {/* 1. Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                {t.patterns?.title || 'Tên cấu trúc (Pattern Name)'} *
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ví dụ: It goes without saying that..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                {t.common?.tags || 'Mục đích / Chức năng'} *
              </label>
              <select
                className="input-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.length > 0 ? (
                  categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.emoji ? `${c.emoji} ` : ''}{c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="cause_effect">⚡ Cause & Effect</option>
                    <option value="purpose">🎯 Purpose</option>
                    <option value="condition">⚠️ Condition</option>
                    <option value="concession">⚖️ Concession</option>
                    <option value="emphasis">💥 Emphasis</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* 2. Formula */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              {t.patterns?.formula || 'Công thức tổng quát (Formula)'} *
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="Ví dụ: It is high time + S + V(past simple)"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
              required
            />
          </div>

          {/* 3. Meaning */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              {t.patterns?.meaning || 'Ý nghĩa:'} *
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="Ví dụ: Hiển nhiên là..., Đã đến lúc phải..."
              value={meaningVi}
              onChange={(e) => setMeaningVi(e.target.value)}
              required
            />
          </div>

          {/* 4. Explanation */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              {t.patterns?.explanation || 'Giải thích cách dùng & lưu ý ngữ pháp'}
            </label>
            <textarea
              className="input-control"
              rows={2}
              placeholder="Dùng khi muốn nhấn mạnh điều gì, hay đi với giới từ nào..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>

          {/* 5. Examples */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.patterns?.examples || 'Câu ví dụ thực tế'}</label>
              <button
                type="button"
                onClick={() => setExamples([...examples, ''])}
                style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}
              >
                + {t.common?.new || 'Thêm'}
              </button>
            </div>
            {examples.map((ex, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ví dụ thực tế..."
                  value={ex}
                  onChange={(e) => {
                    const updated = [...examples];
                    updated[idx] = e.target.value;
                    setExamples(updated);
                  }}
                  style={{ fontSize: '0.85rem' }}
                />
                {examples.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setExamples(examples.filter((_, i) => i !== idx))}
                    className="btn-icon"
                    style={{ color: 'var(--accent-danger)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            marginTop: '0.5rem'
          }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              {t.common?.cancel || 'Hủy bỏ'}
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              <span>{initialData?.id ? (t.common?.save || 'Lưu Thay Đổi') : (t.common?.save || 'Lưu Mẫu Câu')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
