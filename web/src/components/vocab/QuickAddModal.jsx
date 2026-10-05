import React, { useState, useEffect } from 'react';
import { X, Sparkles, Volume2, Plus, Trash2, Loader2, Check, Eye, RotateCw } from 'lucide-react';
import { api } from '../../services/api';
import { playAudio } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';

export default function QuickAddModal({ initialData = null, topics = [], currentUser = null, onClose, onSaved }) {
  const { uiLang, t } = useLanguage();
  const isLearningVi = currentUser?.target_language === 'vi';
  const [word, setWord] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('noun');
  const [topicId, setTopicId] = useState('daily');
  const [meaningVi, setMeaningVi] = useState('');
  const [meaningEn, setMeaningEn] = useState('');
  const [collocations, setCollocations] = useState(['']);
  const [examples, setExamples] = useState(['']);
  const [level, setLevel] = useState('B2');
  
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [lookupSuccess, setLookupSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      setWord(initialData.word || '');
      setPhonetic(initialData.phonetic || '');
      setAudioUrl(initialData.audio_url || '');
      setPartOfSpeech(initialData.part_of_speech || 'noun');
      setTopicId(initialData.topic_id || 'daily');
      setMeaningVi(initialData.meaning_vi || '');
      setMeaningEn(initialData.meaning_en || '');
      setCollocations(initialData.collocations?.length > 0 ? initialData.collocations : ['']);
      setExamples(initialData.examples?.length > 0 ? initialData.examples : ['']);
      setLevel(initialData.level || 'B2');

      if (initialData.word && !initialData.id && !initialData.meaning_vi) {
        handleAutoLookup(initialData.word);
      }
    }
  }, [initialData]);

  // 1-Click Auto Lookup: Fills ALL fields (Meaning VI, Meaning EN, IPA, Audio, Examples, Collocations, Level)
  const handleAutoLookup = async (targetWord = word) => {
    const clean = (targetWord || '').trim();
    if (!clean) {
      setErrorMsg(t.quickAdd?.errInputWord || 'Vui lòng gõ từ vào ô trên rồi bấm Auto-Fill nhé!');
      return;
    }

    setIsLookingUp(true);
    setErrorMsg('');
    setLookupSuccess(false);

    try {
      const res = await api.autoLookup(clean);
      if (res.success && res.data) {
        const d = res.data;
        if (d.phonetic) setPhonetic(d.phonetic);
        if (d.audio_url) setAudioUrl(d.audio_url);
        if (d.part_of_speech) setPartOfSpeech(d.part_of_speech);
        if (d.topic_id) setTopicId(d.topic_id);
        if (d.meaning_vi) setMeaningVi(d.meaning_vi);
        if (d.meaning_en) setMeaningEn(d.meaning_en);
        if (d.level) setLevel(d.level);
        if (d.examples && d.examples.length > 0) {
          setExamples(d.examples);
        }
        if (d.collocations && d.collocations.length > 0) {
          setCollocations(d.collocations);
        }

        setLookupSuccess(true);
        setTimeout(() => setLookupSuccess(false), 3000);

        // Auto play sound preview
        playAudio(d.word || clean, d.audio_url);
      } else {
        setErrorMsg(t.quickAdd?.errNotFound || 'Không tìm thấy từ trong từ điển. Bạn vẫn có thể tự điền nghĩa bên dưới.');
      }
    } catch (err) {
      console.error('Auto lookup error:', err);
      setErrorMsg((t.common?.error || 'Lỗi: ') + err.message);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Quick sample word picker
  const handlePickSample = (sampleWord) => {
    setWord(sampleWord);
    handleAutoLookup(sampleWord);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!word.trim() || !meaningVi.trim()) {
      setErrorMsg(t.quickAdd?.errRequired || 'Vui lòng nhập Từ và Nghĩa');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const payload = {
      word: word.trim(),
      phonetic: phonetic.trim(),
      audio_url: audioUrl.trim(),
      part_of_speech: partOfSpeech,
      meaning_vi: meaningVi.trim(),
      meaning_en: meaningEn.trim(),
      collocations: collocations.filter(c => c.trim() !== ''),
      examples: examples.filter(ex => ex.trim() !== ''),
      level,
      topic_id: topicId || 'daily'
    };

    try {
      let res;
      if (initialData && initialData.id) {
        res = await api.updateWord(initialData.id, payload);
      } else {
        res = await api.createWord(payload);
      }

      if (res.success) {
        onSaved();
        onClose();
      } else {
        setErrorMsg(res.error || 'Có lỗi xảy ra khi lưu từ vựng');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối tới máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '980px' }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={22} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {initialData?.id ? t.quickAdd.titleEdit : t.quickAdd.titleNew}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t.quickAdd.subtitleNew}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* 2-Column Grid: Form on Left + Live 3D Preview on Right */}
        <div className="quick-add-grid" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.5rem', padding: '1.5rem' }}>
          {/* LEFT: Input Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
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

            {lookupSuccess && (
              <div style={{
                background: 'var(--accent-success-light)',
                color: 'var(--accent-success)',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Check size={16} />
                <span>✓ {t.common.success}!</span>
              </div>
            )}

            {/* 1. Word / Phrase & 1-Click Lookup */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {isLearningVi ? t.quickAdd.wordLabelVi : t.quickAdd.wordLabelEn}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder={isLearningVi ? t.quickAdd.wordPlaceholderVi : t.quickAdd.wordPlaceholderEn}
                  value={word}
                  onChange={(e) => {
                    setWord(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAutoLookup(word);
                    }
                  }}
                  autoFocus
                  required
                  style={{ fontSize: '1.05rem', fontWeight: 700 }}
                />
                <button
                  type="button"
                  onClick={() => handleAutoLookup(word)}
                  disabled={isLookingUp}
                  className="btn-primary"
                  style={{ flexShrink: 0, padding: '0.65rem 1.25rem' }}
                  title="Auto-Fill"
                >
                  {isLookingUp ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>{isLookingUp ? t.quickAdd.autoFillLoading : t.quickAdd.autoFillBtn}</span>
                </button>
              </div>

              {/* Sample Quick Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.quickAdd.samplePrompt}</span>
                {(isLearningVi 
                  ? ['kiên trì', 'sáng tạo', 'bền vững', 'thành công', 'tự tin'] 
                  : ['resilient', 'articulate', 'pragmatic', 'streamline', 'meticulous']
                ).map(sample => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handlePickSample(sample)}
                    style={{
                      padding: '0.15rem 0.5rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      color: 'var(--accent-primary)',
                      fontWeight: 600
                    }}
                  >
                    +{sample}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Phonetic, Part of Speech, Level, Topic */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.3fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {t.quickAdd?.phoneticLabel || 'Phiên âm (IPA)'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="/.../"
                    value={phonetic}
                    onChange={(e) => setPhonetic(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => playAudio(word, audioUrl)}
                    className="btn-icon"
                    style={{ color: 'var(--accent-primary)', padding: '0.4rem' }}
                    title={t.speaking?.listenReference || 'Nghe thử âm thanh'}
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {t.quickAdd?.partOfSpeech || 'Từ loại'}
                </label>
                <select
                  className="input-control"
                  value={partOfSpeech}
                  onChange={(e) => setPartOfSpeech(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="noun">{t.quickAdd?.posNoun || 'Noun (Danh từ)'}</option>
                  <option value="verb">{t.quickAdd?.posVerb || 'Verb (Động từ)'}</option>
                  <option value="adjective">{t.quickAdd?.posAdj || 'Adjective (Tính từ)'}</option>
                  <option value="adverb">{t.quickAdd?.posAdv || 'Adverb (Trạng từ)'}</option>
                  <option value="phrase">Phrase / Collocation</option>
                  <option value="phrasal_verb">Phrasal Verb</option>
                  <option value="idiom">Idiom</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {t.quickAdd?.levelLabel || 'Trình độ'}
                </label>
                <select
                  className="input-control"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="A1">A1 ({t.vocab?.levelA1 || 'Sơ cấp'})</option>
                  <option value="A2">A2 ({t.vocab?.levelA2 || 'Cơ bản'})</option>
                  <option value="B1">B1 ({t.vocab?.levelB1 || 'Trung cấp'})</option>
                  <option value="B2">B2 ({t.vocab?.levelB2 || 'Khá'})</option>
                  <option value="C1">C1 ({t.vocab?.levelC1 || 'Nâng cao'})</option>
                  <option value="C2">C2 ({t.vocab?.levelC2 || 'Bản ngữ'})</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {t.quickAdd?.topicLabel || 'Chủ đề (Topic)'}
                </label>
                <select
                  className="input-control"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  style={{ fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {topics.length > 0 ? (
                    topics.map(tItem => (
                      <option key={tItem.id} value={tItem.id}>{tItem.emoji || '📁'} {tItem.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="work">{t.quickAdd?.topicWork || '💼 Công việc & Sự nghiệp'}</option>
                      <option value="tech">{t.quickAdd?.topicTech || '💻 Công nghệ & Kỹ thuật'}</option>
                      <option value="ielts">{t.quickAdd?.topicIelts || '🎓 Học thuật & IELTS'}</option>
                      <option value="daily">{t.quickAdd?.topicDaily || '☕ Giao tiếp Hàng ngày'}</option>
                      <option value="travel">{t.quickAdd?.topicTravel || '✈️ Du lịch & Văn hóa'}</option>
                      <option value="mindset">{t.quickAdd?.topicMindset || '🧠 Tâm lý & Tư duy'}</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* 3. Meaning & Explanations */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                {t.quickAdd.meaningLabel}
              </label>
              <input
                type="text"
                className="input-control"
                placeholder={t.quickAdd.meaningPlaceholder}
                value={meaningVi}
                onChange={(e) => setMeaningVi(e.target.value)}
                required
                style={{ fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                {isLearningVi 
                  ? (t.quickAdd?.contextDefinitionLabel || 'Ghi chú ngữ cảnh / Định nghĩa mở rộng') 
                  : (t.quickAdd?.englishDefinitionLabel || 'Định nghĩa tiếng Anh (English Definition)')}
              </label>
              <textarea
                className="input-control"
                rows={2}
                placeholder={isLearningVi 
                  ? (t.quickAdd?.contextPlaceholder || "Ví dụ cách dùng, tình huống giao tiếp phù hợp...") 
                  : (t.quickAdd?.englishDefinitionPlaceholder || "Định nghĩa bằng tiếng Anh...")}
                value={meaningEn}
                onChange={(e) => setMeaningEn(e.target.value)}
                style={{ resize: 'vertical', fontSize: '0.85rem' }}
              />
            </div>

            {/* 4. Collocations */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.quickAdd?.collocationsLabel || 'Collocations / Cụm từ hay'}</label>
                <button
                  type="button"
                  onClick={() => setCollocations([...collocations, ''])}
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                >
                  {t.quickAdd?.addCollocation || '+ Thêm cụm từ'}
                </button>
              </div>
              {collocations.map((col, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder={t.quickAdd?.collocationPlaceholder || 'Ví dụ: articulate speaker, stay resilient...'}
                    value={col}
                    onChange={(e) => {
                      const updated = [...collocations];
                      updated[idx] = e.target.value;
                      setCollocations(updated);
                    }}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
                  />
                  {collocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCollocations(collocations.filter((_, i) => i !== idx))}
                      className="btn-icon"
                      style={{ color: 'var(--accent-danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 5. Examples */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.quickAdd?.examplesLabel || 'Câu ví dụ thực tế'}</label>
                <button
                  type="button"
                  onClick={() => setExamples([...examples, ''])}
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                >
                  {t.quickAdd?.addExample || '+ Thêm câu ví dụ'}
                </button>
              </div>
              {examples.map((ex, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder={t.quickAdd?.examplePlaceholder || 'Nhập câu ví dụ thực tế...'}
                    value={ex}
                    onChange={(e) => {
                      const updated = [...examples];
                      updated[idx] = e.target.value;
                      setExamples(updated);
                    }}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
                  />
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setExamples(examples.filter((_, i) => i !== idx))}
                      className="btn-icon"
                      style={{ color: 'var(--accent-danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              marginTop: '0.5rem'
            }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                {t.quickAdd.cancelBtn}
              </button>
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                <span>{isSaving ? t.quickAdd.savingBtn : (initialData?.id ? t.common.save : t.quickAdd.saveBtn)}</span>
              </button>
            </div>
          </form>

          {/* RIGHT: Live Flashcard Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {t.quickAdd?.livePreview || 'Xem Trước Thẻ (Live Preview)'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewFlipped(!previewFlipped)}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
              >
                <Eye size={13} />
                <span>{previewFlipped ? (t.quickAdd?.viewFront || 'Xem Mặt Trước') : (t.quickAdd?.viewBack || 'Xem Mặt Sau')}</span>
              </button>
            </div>

            {/* Live Card */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              minHeight: '340px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-md)',
              position: 'relative'
            }}>
              {!previewFlipped ? (
                /* Card Front Preview */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <span className="badge badge-blue">{level || 'B2'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{partOfSpeech}</span>
                  </div>

                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {word || (t.vocab?.addNewWordBtn || 'Từ vựng')}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {phonetic || '/.../'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Card Back Preview */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{word}</h4>
                    <span className="badge badge-green">Mastery</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.review?.meaningLabel || 'Nghĩa:'}</span>
                      <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                        {meaningVi || (t.quickAdd?.meaningFrontPreview || 'Nghĩa sẽ hiển thị ở đây')}
                      </p>
                    </div>

                    {meaningEn && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {meaningEn}
                      </p>
                    )}

                    {examples[0] && (
                      <div style={{
                        background: 'var(--bg-tertiary)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontStyle: 'italic',
                        color: 'var(--text-secondary)'
                      }}>
                        "{examples[0]}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <RotateCw size={12} />
                <span>{t.quickAdd?.previewHint || 'Thẻ sẽ xuất hiện như thế này khi bạn ôn tập SRS'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
