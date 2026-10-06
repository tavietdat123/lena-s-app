import React, { useState, useEffect } from 'react';
import { X, Sparkles, Volume2, Plus, Trash2, Loader2, Check, Eye, RotateCw } from 'lucide-react';
import { api } from '../../services/api';
import { playAudio } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';
import { getTopicDisplayName } from '../../constants/topicMeta';
import { getDisplayLevel } from '../../constants/levelAdapter';
import { getDisplayPos, getPosOptions } from '../../constants/posAdapter';

export default function QuickAddModal({ initialData = null, topics = [], currentUser = null, onClose, onSaved }) {
  const { uiLang, t, targetLanguage, isVietnameseTrack, fluentLanguage } = useLanguage();
  const fluentLang = currentUser?.native_language || fluentLanguage || (isVietnameseTrack ? 'en' : 'vi');
  const isLearningVi = isVietnameseTrack || currentUser?.target_language === 'vi';
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
      setErrorMsg(t?.quickAdd?.errInputWord || "Please enter a word");
      return;
    }

    setIsLookingUp(true);
    setErrorMsg('');
    setLookupSuccess(false);

    try {
      const lookupTargetLang = isLearningVi ? 'vi' : 'en';
      const res = await api.autoLookup(clean, lookupTargetLang, fluentLang);
      if (res.success && res.data) {
        const d = res.data;
        if (d.phonetic && !isLearningVi) setPhonetic(d.phonetic);
        else if (isLearningVi) setPhonetic('');
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
        setErrorMsg(t?.quickAdd?.errNotFound || "Not found");
      }
    } catch (err) {
      console.error('Auto lookup error:', err);
      setErrorMsg((t?.common?.error || "Error") + err.message);
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
    const finalVi = (meaningVi || '').trim() || (meaningEn || '').trim();
    const finalEn = (meaningEn || '').trim() || (meaningVi || '').trim();

    if (!word.trim() || (!finalVi && !finalEn)) {
      setErrorMsg(t?.quickAdd?.errRequired || "Required");
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const payload = {
      word: word.trim(),
      phonetic: isLearningVi ? null : phonetic.trim(),
      audio_url: audioUrl.trim(),
      part_of_speech: partOfSpeech,
      meaning_vi: finalVi,
      meaning_en: finalEn,
      collocations: collocations.filter(c => c.trim() !== ''),
      examples: examples.filter(ex => ex.trim() !== ''),
      level,
      topic_id: topicId || 'daily',
      target_language: initialData?.target_language || targetLanguage || 'en'
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
        setErrorMsg(res.error || (t?.common?.error || "Error"));
      }
    } catch (err) {
      setErrorMsg(err.message || (t?.common?.error || "Error"));
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
                  onClick={() => playAudio(word, audioUrl)}
                  className="btn-icon"
                  style={{
                    flexShrink: 0,
                    padding: '0.65rem 0.85rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--accent-primary)'
                  }}
                  title={t?.speaking?.listenReference || "Listen reference audio"}
                >
                  <Volume2 size={18} />
                </button>
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

            {/* 2. Main Metadata Row: Phonetic for EN, Part of Speech, Level, Topic */}
            <div style={{ display: 'grid', gridTemplateColumns: isLearningVi ? '1fr 1.25fr 1.25fr' : '1.2fr 1fr 1fr 1.3fr', gap: '0.65rem' }}>
              {!isLearningVi && (
                /* English Track: Phonetic (IPA) */
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    {t?.quickAdd?.phoneticLabel || "Phonetic (IPA):"}
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
                      title={t?.speaking?.listenReference || "Listen reference audio"}
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {t?.quickAdd?.partOfSpeech || "Part of Speech:"}
                </label>
                <select
                  className="input-control"
                  value={partOfSpeech}
                  onChange={(e) => setPartOfSpeech(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  {getPosOptions(isLearningVi ? 'vi' : 'en', uiLang).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {t?.quickAdd?.levelLabel || "Level:"}
                </label>
                <select
                  className="input-control"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  {isLearningVi ? (
                    <>
                      <option value="A1">{getDisplayLevel('A1', 'vi', uiLang, false)}</option>
                      <option value="A2">{getDisplayLevel('A2', 'vi', uiLang, false)}</option>
                      <option value="B1">{getDisplayLevel('B1', 'vi', uiLang, false)}</option>
                      <option value="B2">{getDisplayLevel('B2', 'vi', uiLang, false)}</option>
                      <option value="C1">{getDisplayLevel('C1', 'vi', uiLang, false)}</option>
                      <option value="C2">{getDisplayLevel('C2', 'vi', uiLang, false)}</option>
                    </>
                  ) : (
                    <>
                      <option value="A1">A1 ({t?.vocab?.levelA1 || "Beginner"})</option>
                      <option value="A2">A2 ({t?.vocab?.levelA2 || "Elementary"})</option>
                      <option value="B1">B1 ({t?.vocab?.levelB1 || "Intermediate"})</option>
                      <option value="B2">B2 ({t?.vocab?.levelB2 || "Upper Intermediate"})</option>
                      <option value="C1">C1 ({t?.vocab?.levelC1 || "Advanced"})</option>
                      <option value="C2">C2 ({t?.vocab?.levelC2 || "Mastery"})</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  {t?.quickAdd?.topicLabel || "Topic:"}
                </label>
                <select
                  className="input-control"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  style={{ fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {topics.length > 0 ? (
                    topics.map(tItem => (
                      <option key={tItem.id} value={tItem.id}>{tItem.emoji || '📁'} {getTopicDisplayName(tItem, fluentLang)}</option>
                    ))
                  ) : (
                    <>
                      <option value="daily">☕ {getTopicDisplayName('daily', fluentLang)}</option>
                      <option value="social">🤝 {getTopicDisplayName('social', fluentLang)}</option>
                      <option value="food">🍽️ {getTopicDisplayName('food', fluentLang)}</option>
                      <option value="travel">✈️ {getTopicDisplayName('travel', fluentLang)}</option>
                      <option value="work">💼 {getTopicDisplayName('work', fluentLang)}</option>
                      <option value="education">📚 {getTopicDisplayName('education', fluentLang)}</option>
                      <option value="health">🩺 {getTopicDisplayName('health', fluentLang)}</option>
                      <option value="tech">💻 {getTopicDisplayName('tech', fluentLang)}</option>
                      <option value="mindset">🧠 {getTopicDisplayName('mindset', fluentLang)}</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* 3. Meaning & Explanations (Strictly ordered by Fluent Language) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                {fluentLang === 'en'
                  ? (uiLang === 'vi' ? 'Nghĩa tiếng Anh (Ngôn ngữ thành thạo):' : 'Meaning in English (Fluent Language):')
                  : fluentLang === 'ru'
                  ? (uiLang === 'vi' ? 'Nghĩa tiếng Nga / Anh (Ngôn ngữ thành thạo):' : uiLang === 'ru' ? 'Значение (Свободный язык):' : 'Russian/English Meaning (Fluent):')
                  : (uiLang === 'en' ? 'Meaning in Vietnamese (Fluent Language):' : 'Nghĩa tiếng Việt (Ngôn ngữ thành thạo):')}
              </label>
              <input
                type="text"
                className="input-control"
                placeholder={fluentLang === 'en' ? 'e.g. persistent, persevering...' : 'VD: kiên trì, không bỏ cuộc...'}
                value={fluentLang === 'en' ? meaningEn : meaningVi}
                onChange={(e) => {
                  if (fluentLang === 'en') setMeaningEn(e.target.value);
                  else setMeaningVi(e.target.value);
                }}
                required
                style={{ fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                {fluentLang === 'en'
                  ? (uiLang === 'vi' ? 'Ngữ cảnh / Giải thích tiếng Việt (Context):' : 'Vietnamese Context / Extended Definition:')
                  : (uiLang === 'vi' ? 'Định nghĩa tiếng Anh / Ngữ cảnh:' : 'English Context / Extended Definition:')}
              </label>
              <textarea
                className="input-control"
                rows={2}
                placeholder={fluentLang === 'en' ? 'Giải thích nghĩa trong ngữ cảnh tiếng Việt...' : 'Usage in context or English definition...'}
                value={fluentLang === 'en' ? meaningVi : meaningEn}
                onChange={(e) => {
                  if (fluentLang === 'en') setMeaningVi(e.target.value);
                  else setMeaningEn(e.target.value);
                }}
                style={{ resize: 'vertical', fontSize: '0.85rem' }}
              />
            </div>

            {/* 4. Collocations */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t?.quickAdd?.collocationsLabel || "Collocations & Phrases:"}</label>
                <button
                  type="button"
                  onClick={() => setCollocations([...collocations, ''])}
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                >
                  {t?.quickAdd?.addCollocation || "+ Add Collocation"}
                </button>
              </div>
              {collocations.map((col, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder={t?.quickAdd?.collocationPlaceholder || "e.g. stay resilient..."}
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
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t?.quickAdd?.examplesLabel || "Example Sentences:"}</label>
                <button
                  type="button"
                  onClick={() => setExamples([...examples, ''])}
                  style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                >
                  {t?.quickAdd?.addExample || "+ Add Example"}
                </button>
              </div>
              {examples.map((ex, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <input
                    type="text"
                    className="input-control"
                    placeholder={t?.quickAdd?.examplePlaceholder || "Enter example sentence..."}
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
                {t?.quickAdd?.livePreview || "Card Preview"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewFlipped(!previewFlipped)}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
              >
                <Eye size={13} />
                <span>{previewFlipped ? (t?.quickAdd?.viewFront || "Front Side") : (t?.quickAdd?.viewBack || "Back Side")}</span>
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
                    <span className="badge badge-blue">
                      {getDisplayLevel(level || (isLearningVi ? 'A1' : 'B2'), isLearningVi ? 'vi' : 'en', uiLang, true)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {getDisplayPos(partOfSpeech, isLearningVi ? 'vi' : 'en', uiLang)}
                    </span>
                  </div>

                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {word || (t?.vocab?.addNewWordBtn || "Add Word")}
                      </h3>
                      {word && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); playAudio(word, audioUrl); }}
                          className="btn-icon"
                          style={{ color: 'var(--accent-primary)', padding: '0.25rem' }}
                          title={t?.speaking?.listenReference || "Listen"}
                        >
                          <Volume2 size={20} />
                        </button>
                      )}
                    </div>
                    {!isLearningVi && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {phonetic || '/.../'}
                      </p>
                    )}
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
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t?.review?.meaningLabel || "Meaning:"}</span>
                      <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                        {(fluentLang === 'en' ? (meaningEn || meaningVi) : (meaningVi || meaningEn)) || (t?.quickAdd?.meaningFrontPreview || "Meaning will appear here")}
                      </p>
                    </div>

                    {(fluentLang === 'en' ? meaningVi : meaningEn) && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {fluentLang === 'en' ? meaningVi : meaningEn}
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
                <span>{t?.quickAdd?.previewHint || "How this card looks in SRS review"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
