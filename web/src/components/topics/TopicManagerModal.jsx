import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Folder, Sparkles, Check, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const COLOR_PRESETS = [
  '#0284c7', // Sky Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#e11d48', // Rose
  '#6366f1'  // Indigo
];

const EMOJI_SUGGESTIONS = ['💼', '💻', '🎓', '☕', '✈️', '🧠', '🏥', '🎨', '⚽', '🍔', '🎵', '🌿', '🚀', '⭐', '📚', '🗣️'];

export default function TopicManagerModal({ isOpen, topics = [], onClose, onTopicChange }) {
  const { t } = useLanguage();
  const [editingTopic, setEditingTopic] = useState(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [color, setColor] = useState('#0284c7');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingTopic(null);
    setName('');
    setEmoji('📁');
    setColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
    setDescription('');
    setErrorMsg('');
    setShowAddForm(true);
  };

  const handleStartEdit = (topic) => {
    setEditingTopic(topic);
    setName(topic.name);
    setEmoji(topic.emoji || '📁');
    setColor(topic.color || '#0284c7');
    setDescription(topic.description || '');
    setErrorMsg('');
    setShowAddForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(t.topicsModal?.errNameRequired || 'Vui lòng nhập tên chủ đề');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const payload = {
      name: name.trim(),
      emoji: emoji || '📁',
      color: color || '#0284c7',
      description: description.trim()
    };

    try {
      let res;
      if (editingTopic) {
        res = await api.updateTopic(editingTopic.id, payload);
      } else {
        res = await api.createTopic(payload);
      }

      if (res.success) {
        setShowAddForm(false);
        setEditingTopic(null);
        if (onTopicChange) onTopicChange();
      } else {
        setErrorMsg(res.error || 'Không thể lưu chủ đề');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (topic) => {
    const confirmText = typeof t.topicsModal?.deleteConfirm === 'function'
      ? t.topicsModal.deleteConfirm(topic.name)
      : `Bạn có chắc chắn muốn xóa chủ đề "${topic.name}"?`;
    if (!window.confirm(confirmText)) {
      return;
    }

    try {
      const res = await api.deleteTopic(topic.id);
      if (res.success) {
        if (onTopicChange) onTopicChange();
      } else {
        alert(res.error || 'Không thể xóa chủ đề');
      }
    } catch (err) {
      alert(err.message || 'Lỗi kết nối');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Folder size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {t.topicsModal?.title || 'Quản Lý Chủ Đề Từ Vựng'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t.topicsModal?.subtitle || 'Phân loại kho từ vựng theo từng ngữ cảnh học tập'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" style={{ padding: '0.45rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '72vh', overflowY: 'auto' }}>
          {errorMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Add / Edit Topic Form */}
          {showAddForm ? (
            <form onSubmit={handleSave} style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingTopic ? (t.topicsModal?.editTopic || 'Chỉnh Sửa Chủ Đề') : (t.topicsModal?.newTopic || 'Tạo Chủ Đề Mới')}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {t.topicsModal?.cancelBtn || t.common?.cancel || 'Hủy'}
                </button>
              </div>

              {/* Name & Emoji Row */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '70px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Icon</label>
                  <input
                    type="text"
                    className="input-control"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '1.2rem', padding: '0.5rem 0' }}
                    maxLength={4}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    {t.topicsModal?.topicNameLabel || 'Tên chủ đề *'}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder={t.topicsModal?.topicNamePlaceholder || 'Ví dụ: Công nghệ & IT, Y tế, IELTS...'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Emoji quick suggestions */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  {t.topicsModal?.iconHint || 'Gợi ý icon:'}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {EMOJI_SUGGESTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      style={{
                        background: emoji === em ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                        border: `1px solid ${emoji === em ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  {t.topicsModal?.colorLabel || 'Màu sắc đại diện'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: color === c ? '3px solid #ffffff' : 'none',
                        boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {color === c && <Check size={14} color="#ffffff" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  {t.topicsModal?.descLabel || 'Mô tả ngắn'}
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder={t.topicsModal?.descPlaceholder || 'Mô tả phạm vi từ vựng của chủ đề này...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  {t.topicsModal?.cancelBtn || t.common?.cancel || 'Hủy'}
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  {isSaving ? (t.topicsModal?.saving || 'Đang lưu...') : (editingTopic ? (t.topicsModal?.updateBtn || 'Cập Nhật') : (t.topicsModal?.saveBtn || 'Tạo Chủ Đề'))}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={handleStartCreate}
              style={{
                width: '100%',
                padding: '0.85rem',
                border: '1.5px dashed var(--border-color)',
                borderRadius: '16px',
                backgroundColor: 'transparent',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Plus size={18} />
              <span>+ {t.topicsModal?.newTopic || 'Thêm Chủ Đề Mới'}</span>
            </button>
          )}

          {/* Topics List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t.topicsModal?.currentTopics || 'DANH SÁCH CHỦ ĐỀ HIỆN TẠI'} ({topics.length})
            </span>

            {topics.map(tItem => (
              <div
                key={tItem.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: `${tItem.color || '#0284c7'}18`,
                    border: `1px solid ${tItem.color || '#0284c7'}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}>
                    {tItem.emoji || '📁'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {tItem.name}
                      </h4>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        backgroundColor: `${tItem.color || '#0284c7'}20`,
                        color: tItem.color || '#0284c7'
                      }}>
                        {tItem.words_count || 0} {t.topicsModal?.wordsCount || 'từ'}
                      </span>
                    </div>
                    {tItem.description ? (
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {tItem.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => handleStartEdit(tItem)}
                    className="btn-icon"
                    title={t.topicsModal?.editTooltip || 'Chỉnh sửa chủ đề'}
                    style={{ padding: '0.4rem' }}
                  >
                    <Edit2 size={15} color="var(--text-secondary)" />
                  </button>
                  <button
                    onClick={() => handleDelete(tItem)}
                    className="btn-icon"
                    title={t.topicsModal?.deleteTooltip || 'Xóa chủ đề'}
                    style={{ padding: '0.4rem', color: '#ef4444' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
            {t.topicsModal?.closeSave || '✓ Đóng & Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
