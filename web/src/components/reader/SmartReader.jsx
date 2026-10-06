import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Volume2, 
  Sparkles, 
  BookPlus, 
  BrainCircuit, 
  Check, 
  X,
  Search,
  Tag,
  Clock,
  BookOpen,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import { playAudio } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

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

export default function SmartReader({ 
  notes = [], 
  words = [], 
  onSaveNote, 
  onDeleteNote, 
  onSaveWordFromSelection, 
  onSendToAiLab 
}) {
  const { t, targetLanguage, fluentLanguage, getWordMeaning, isVietnameseTrack } = useLanguage();
  const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTopic, setEditTopic] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');

  // Floating Selection Popup State
  const [selectionPopup, setSelectionPopup] = useState({
    visible: false,
    text: '',
    x: 0,
    y: 0
  });
  const [contextTranslation, setContextTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const contentRef = useRef(null);

  const selectedNote = notes.find(n => n.id === selectedNoteId) || notes[0];

  useEffect(() => {
    if (selectedNote && !isEditing) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTopic(selectedNote.topic || 'General');
    }
  }, [selectedNote, isEditing]);

  const [selectedIpa, setSelectedIpa] = useState('');
  const [translationError, setTranslationError] = useState('');
  const clientCacheRef = useRef({});

  // Handle Text Selection Popup: Fetch IPA immediately without triggering slow translation
  const handleMouseUp = async () => {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';

    if (text && text.length > 0 && text.length < 300) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionPopup({
        visible: true,
        text,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });

      const cleanWord = text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();

      // Check if already translated in this reading session -> Instant 0ms!
      const cached = clientCacheRef.current[cleanWord.toLowerCase()];
      if (cached) {
        setContextTranslation(cached);
        if (cached.phonetic) setSelectedIpa(cached.phonetic);
        setIsTranslating(false);
        setTranslationError('');
        return;
      }

      setContextTranslation(null);
      setIsTranslating(false);
      setTranslationError('');

      const inVault = words.find(w => w.word?.toLowerCase() === cleanWord.toLowerCase());
      if (inVault && inVault.phonetic) {
        setSelectedIpa(inVault.phonetic);
      } else if (cleanWord) {
        try {
          const lookup = await api.autoLookup(cleanWord, targetLanguage, fluentLanguage);
          const ipa = lookup?.data?.phonetic || lookup?.phonetic || '';
          if (ipa) setSelectedIpa(ipa);
        } catch (e) {
          // Keep existing IPA if present
        }
      }
    } else {
      setSelectionPopup(prev => ({ ...prev, visible: false }));
      setContextTranslation(null);
      setSelectedIpa('');
      setTranslationError('');
    }
  };

  // Trigger Contextual AI Translation on demand (with Instant Optimistic Preview & 0ms Cache)
  const handleTranslateContextual = async () => {
    const cleanWord = selectionPopup.text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim();
    if (!cleanWord || !selectedNote?.content) return;

    // Check client cache first
    const cached = clientCacheRef.current[cleanWord.toLowerCase()];
    if (cached) {
      setContextTranslation(cached);
      return;
    }

    // Optimistic Preview: If word is in Vault, display immediate definition
    const inVault = words.find(w => w.word?.toLowerCase() === cleanWord.toLowerCase());
    if (inVault) {
      const vaultMeaning = getWordMeaning ? getWordMeaning(inVault) : (inVault.meaning_vi || inVault.meaning_en || inVault.meaning);
      if (vaultMeaning) {
        setContextTranslation({
          targetText: cleanWord,
          phonetic: inVault.phonetic || selectedIpa,
          partOfSpeech: inVault.part_of_speech || 'noun',
          contextualMeaning: vaultMeaning,
          contextualMeaningVi: vaultMeaning,
          contextExplanation: '⚡ ' + (t?.reader?.aiTranslatingContext || "AI translating..."),
          overallSentence: '',
          overallSentenceVi: '',
          collocations: inVault.collocations || []
        });
      }
    }

    setIsTranslating(true);
    setTranslationError('');
    try {
      const sentences = selectedNote.content.split(/(?<=[.?!])\s+/);
      const foundSentence = sentences.find(s => s.toLowerCase().includes(cleanWord.toLowerCase())) || selectionPopup.text;
      const res = await api.translateInContextAI({
        text: cleanWord,
        contextSentence: foundSentence,
        articleTitle: selectedNote.title || '',
        articleTopic: selectedNote.topic || 'General',
        target_language: targetLanguage,
        fluent_language: fluentLanguage
      });
      if (res?.success && res.data) {
        setContextTranslation(res.data);
        clientCacheRef.current[cleanWord.toLowerCase()] = res.data;
        if (res.data.phonetic) setSelectedIpa(res.data.phonetic);
      } else {
        if (!inVault) setTranslationError(res?.error || (t?.common?.error || "Error"));
      }
    } catch (e) {
      console.warn('Context translation error:', e);
      if (!inVault) setTranslationError(e.message || (t?.common?.error || "Error"));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleStartNewNote = () => {
    setIsEditing(true);
    setSelectedNoteId(null);
    setEditTitle('');
    setEditContent('');
    setEditTopic('General');
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;

    await onSaveNote({
      id: selectedNoteId,
      title: editTitle.trim(),
      content: editContent.trim(),
      topic: editTopic.trim()
    });

    setIsEditing(false);
  };

  const filteredNotes = notes.filter(n => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const qClean = removeVietnameseTones(q);
    const title = (n.title || '').toLowerCase();
    const topic = (n.topic || '').toLowerCase();
    const content = (n.content || '').toLowerCase();
    return (
      title.includes(q) ||
      topic.includes(q) ||
      content.includes(q) ||
      removeVietnameseTones(title).includes(qClean) ||
      removeVietnameseTones(topic).includes(qClean) ||
      removeVietnameseTones(content).includes(qClean)
    );
  });

  // Calculate reading stats
  const wordCount = selectedNote?.content ? selectedNote.content.split(/\s+/).filter(w => w.length > 0).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', minHeight: '700px' }}>
      {/* 1. LEFT COLUMN: NOTES LIST */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Header & Add Button */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={18} style={{ color: 'var(--accent-primary)' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {t?.reader?.articlesList || "Articles List"}
              </h4>
            </div>
            <button onClick={handleStartNewNote} className="btn-primary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
              <Plus size={16} />
              <span>{t?.reader?.newNoteBtn || "New Article"}</span>
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-control"
              placeholder={t?.reader?.searchPlaceholder || "Search articles..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '0.85rem', padding: '0.55rem 0.85rem 0.55rem 2.5rem' }}
            />
          </div>
        </div>

        {/* Notes Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {filteredNotes.map(n => {
            const isSelected = n.id === selectedNoteId;
            return (
              <div
                key={n.id}
                onClick={() => {
                  setSelectedNoteId(n.id);
                  setIsEditing(false);
                }}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-primary-light)' : 'transparent',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  transition: 'all var(--transition-fast)'
                }}
                className="glow-hover"
              >
                <h5 style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  marginBottom: '0.3rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {n.title}
                </h5>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                    {n.topic || 'General'}
                  </span>
                  <span>{n.created_at?.split('T')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. RIGHT COLUMN: INTERACTIVE READER / EDITOR */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        padding: '2.25rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {isEditing ? (
          /* Editor View */
          <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                {selectedNoteId ? (t?.common?.edit || "Edit") : (t?.reader?.newNoteBtn || "New Article")}
              </h3>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                  <X size={16} />
                  <span>{t?.common?.cancel || "Cancel"}</span>
                </button>
                <button type="submit" className="btn-primary">
                  <Check size={16} />
                  <span>{t?.reader?.saveNoteBtn || "Save Article"}</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
              <input
                type="text"
                className="input-control"
                placeholder={t?.reader?.titlePlaceholder || "Title..."}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ fontSize: '1.15rem', fontWeight: 700 }}
                required
              />
              <input
                type="text"
                className="input-control"
                placeholder="Topic (Tech, IELTS, Podcast...)"
                value={editTopic}
                onChange={(e) => setEditTopic(e.target.value)}
              />
            </div>

            <textarea
              className="input-control"
              placeholder={t?.reader?.contentPlaceholder || "Paste or write article content here..."}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ flex: 1, minHeight: '450px', resize: 'vertical', lineHeight: 1.8, fontSize: '1.05rem' }}
              required
            />
          </form>
        ) : selectedNote ? (
          /* Reader View with Smart Text Highlighter */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <span className="badge badge-blue">{selectedNote.topic || 'General'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} />
                    <span>~{readingTime} min ({wordCount} words)</span>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {selectedNote.title}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                >
                  <Edit3 size={15} />
                  <span>{t?.common?.edit || "Edit"}</span>
                </button>
                <button
                  onClick={() => onDeleteNote(selectedNote.id)}
                  className="btn-icon"
                  style={{ color: 'var(--accent-danger)' }}
                  title={t?.common?.delete || "Delete"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Smart Highlight Hint Pro Max */}
            <div style={{
              background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-card) 100%)',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              border: '1px solid var(--border-color)'
            }}>
              <Sparkles size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>
                {t?.reader?.tipHighlight || "💡 Highlight text to look up and save cards instantly."}
              </span>
            </div>

            {/* Article Content Area */}
            <div
              ref={contentRef}
              onMouseUp={handleMouseUp}
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.85,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-line',
                flex: 1,
                userSelect: 'text'
              }}
            >
              {selectedNote.content}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', margin: 'auto', padding: '3rem' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {t?.reader?.noArticleSelectedTitle || "No article selected"}
            </h4>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              {t?.reader?.noArticleSelectedDesc || "Select an article on the left or create one."}
            </p>
            <button onClick={handleStartNewNote} className="btn-primary">
              <Plus size={16} />
              <span>{t?.reader?.createFirstArticleBtn || "Create First Article"}</span>
            </button>
          </div>
        )}

        {/* 3. FLOATING POPUP TOOLBAR ON TEXT SELECTION PRO MAX */}
        {selectionPopup.visible && (
          <div
            style={{
              position: 'fixed',
              top: `${selectionPopup.y}px`,
              left: `${selectionPopup.x}px`,
              transform: 'translate(-50%, -100%)',
              background: 'var(--bg-card)',
              border: '1.5px solid var(--accent-primary)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 16px 36px rgba(0,0,0,0.45), var(--shadow-glow)',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              zIndex: 1000,
              backdropFilter: 'blur(20px)',
              maxWidth: '380px',
              animation: 'modalPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Top Info: Word and IPA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
                  "{selectionPopup.text}"
                </span>
                {(selectedIpa || contextTranslation?.phonetic) && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {selectedIpa || contextTranslation?.phonetic}
                  </span>
                )}
              </div>
              <button
                onClick={() => playAudio(selectionPopup.text, null, isVietnameseTrack ? 'vi-VN' : undefined)}
                className="btn-icon"
                style={{ padding: '0.2rem', color: 'var(--accent-primary)' }}
                title={t?.reader?.pronounceWordTitle || "Pronounce"}
              >
                <Volume2 size={15} />
              </button>
            </div>

            {/* Trigger Translate Button if NOT yet translated */}
            {!contextTranslation && !isTranslating && (
              <button
                onClick={handleTranslateContextual}
                className="btn-secondary"
                style={{
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.8rem',
                  justifyContent: 'center',
                  background: 'var(--accent-primary-light)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  fontWeight: 700
                }}
              >
                <Sparkles size={14} />
                <span>{t?.reader?.clickToTranslateContext || "Highlight to translate"}</span>
              </button>
            )}

            {translationError ? (
              <div style={{ fontSize: '0.75rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-md)' }}>
                ⚠️ {translationError}
              </div>
            ) : null}

            {/* Contextual Translation Header / Body if loading or ready */}
            {isTranslating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-primary)', padding: '0.2rem 0.4rem' }}>
                <Loader2 size={14} className="animate-spin" />
                <span>{t?.reader?.aiTranslatingContext || "AI translating..."}</span>
              </div>
            ) : contextTranslation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    🎯 {contextTranslation.contextualMeaning || contextTranslation.contextualMeaningVi}
                  </span>
                </div>
                {contextTranslation.contextExplanation && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    💡 {contextTranslation.contextExplanation}
                  </p>
                )}
                {(contextTranslation.overallSentence || contextTranslation.overallSentenceVi) && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                    🌐 "{contextTranslation.overallSentence || contextTranslation.overallSentenceVi}"
                  </p>
                )}
              </div>
            ) : null}

            {/* Quick Action Buttons Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {/* Pronounce audio button */}
              <button
                onClick={() => playAudio(selectionPopup.text, null, isVietnameseTrack ? 'vi-VN' : undefined)}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                title="Pronounce"
              >
                <Volume2 size={15} style={{ color: 'var(--accent-primary)' }} />
                <span>{t?.common?.listen || "Listen"}</span>
              </button>

              {/* Save to Vocab Vault */}
              <button
                onClick={() => {
                  onSaveWordFromSelection(selectionPopup.text, contextTranslation);
                  setSelectionPopup(prev => ({ ...prev, visible: false }));
                }}
                className="btn-primary"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
              >
                <BookPlus size={15} />
                <span>{t?.reader?.saveToVault || "Save to Vault"}</span>
              </button>

              {/* Send to AI Lab */}
              <button
                onClick={() => {
                  onSendToAiLab(selectionPopup.text);
                  setSelectionPopup(prev => ({ ...prev, visible: false }));
                }}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                title="AI Analysis"
              >
                <BrainCircuit size={15} style={{ color: '#a855f7' }} />
                <span>{t?.reader?.sendToAiLab || "Send to AI Lab"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
