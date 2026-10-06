import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Volume2, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Tag, 
  Calendar,
  Layers,
  Filter,
  Folder,
  FolderPlus,
  LayoutGrid,
  ListFilter,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { playAudio } from '../../services/audioService';
import { useLanguage } from '../../context/LanguageContext';
import { getTopicDisplayName } from '../../constants/topicMeta';
import { getDisplayLevel } from '../../constants/levelAdapter';
import { getDisplayPos } from '../../constants/posAdapter';

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

export default function VocabVault({ 
  words = [], 
  topics = [], 
  onAddWord, 
  onEditWord, 
  onDeleteWord, 
  onOpenTopicManager 
}) {
  const { uiLang, t, targetLanguage, isVietnameseTrack, fluentLanguage, getWordMeaning, getTopicName } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grouped'
  const [collapsedTopics, setCollapsedTopics] = useState({});

  // Smart Multi-Field & Accent-Insensitive Filter
  const filteredWords = words
    .filter(w => {
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const qClean = removeVietnameseTones(q);
        const word = (w.word || '').toLowerCase();
        const meaningVi = (w.meaning_vi || '').toLowerCase();
        const meaningEn = (w.meaning_en || '').toLowerCase();
        const phonetic = (w.phonetic || '').toLowerCase();
        const pos = (w.part_of_speech || '').toLowerCase();
        const level = (w.level || '').toLowerCase();
        const topic = (w.topic_id || '').toLowerCase();
        const collocationsStr = Array.isArray(w.collocations) ? w.collocations.join(' ').toLowerCase() : (w.collocations || '').toLowerCase();
        const examplesStr = Array.isArray(w.examples) ? w.examples.join(' ').toLowerCase() : (w.examples || '').toLowerCase();
        const tagsStr = Array.isArray(w.tags) ? w.tags.join(' ').toLowerCase() : (w.tags || '').toLowerCase();

        const matchDirect = 
          word.includes(q) ||
          meaningVi.includes(q) ||
          meaningEn.includes(q) ||
          phonetic.includes(q) ||
          pos.includes(q) ||
          level === q ||
          topic.includes(q) ||
          collocationsStr.includes(q) ||
          examplesStr.includes(q) ||
          tagsStr.includes(q);

        const matchUnaccented =
          removeVietnameseTones(meaningVi).includes(qClean) ||
          removeVietnameseTones(collocationsStr).includes(qClean) ||
          removeVietnameseTones(examplesStr).includes(qClean) ||
          removeVietnameseTones(topic).includes(qClean);

        if (!matchDirect && !matchUnaccented) return false;
      }

      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      const matchesLevel = levelFilter === 'all' || w.level === levelFilter;
      const matchesTopic = selectedTopic === 'all' || w.topic_id === selectedTopic;

      return matchesStatus && matchesLevel && matchesTopic;
    })
    .sort((a, b) => {
      // Relevance score when searching
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const qClean = removeVietnameseTones(q);
        const score = (item) => {
          const w = (item.word || '').toLowerCase();
          const m = (item.meaning_vi || '').toLowerCase();
          const mClean = removeVietnameseTones(m);
          if (w === q) return 100;
          if (w.startsWith(q)) return 80;
          if (w.includes(q)) return 60;
          if (m.startsWith(q) || mClean.startsWith(qClean)) return 50;
          if (m.includes(q) || mClean.includes(qClean)) return 40;
          return 10;
        };
        const scoreA = score(a);
        const scoreB = score(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      return (b.id || 0) - (a.id || 0);
    });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'mastered':
        return <span className="badge badge-green">{t?.dashboard?.stageMastered || "Mastered"}</span>;
      case 'reviewing':
        return <span className="badge badge-blue">{t?.dashboard?.stageReviewing || "Reviewing"}</span>;
      case 'learning':
        return <span className="badge badge-amber">{t?.dashboard?.stageLearning || "Learning"}</span>;
      default:
        return <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{t?.dashboard?.stageNew || "New"}</span>;
    }
  };

  const getTopicInfo = (topicId) => {
    const found = topics.find(t => t.id === topicId);
    if (found) return found;
    return { id: 'daily', name: uiLang === 'ru' ? 'Общение' : uiLang === 'vi' ? 'Giao tiếp' : 'Daily', emoji: '☕', color: '#10b981' };
  };

  const toggleTopicCollapse = (topicId) => {
    setCollapsedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  // Render a Single Word Card
  const renderWordCard = (w) => {
    const topic = getTopicInfo(w.topic_id);
    return (
      <div
        key={w.id}
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '0.85rem',
          position: 'relative',
          transition: 'all 0.2s ease',
          borderLeft: `4px solid ${topic.color || '#0284c7'}`
        }}
      >
        <div>
          {/* Header: Word + IPA + Audio + Topic & Status Badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>{w.word}</h4>
                <button
                  onClick={() => playAudio(w.word, w.audio_url)}
                  className="btn-icon"
                  style={{ color: 'var(--accent-primary)', padding: '0.25rem' }}
                  title={t?.vocab?.pronounceStandardTooltip || "Listen audio"}
                >
                  <Volume2 size={17} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                {!isVietnameseTrack && w.phonetic && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {w.phonetic}
                  </span>
                )}
                {w.part_of_speech && (
                  <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    • {getDisplayPos(w.part_of_speech, targetLanguage, uiLang)}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                  {getDisplayLevel(w.level || 'B2', targetLanguage, uiLang, true)}
                </span>
                {getStatusBadge(w.status)}
              </div>
              
              {/* Topic Pill */}
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.12rem 0.5rem',
                borderRadius: '12px',
                backgroundColor: `${topic.color || '#0284c7'}15`,
                color: topic.color || '#0284c7',
                border: `1px solid ${topic.color || '#0284c7'}30`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span>{topic.emoji || '📁'}</span>
                <span>{getTopicName(topic)}</span>
              </span>
            </div>
          </div>

          {/* Meaning strictly adapted to fluent language */}
          <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0.4rem 0 0.25rem 0' }}>
            {getWordMeaning(w)}
          </p>

          {((fluentLanguage === 'en' && w.meaning_vi && w.meaning_vi !== w.meaning_en) || 
            (fluentLanguage === 'ru' && (w.meaning_en || w.meaning_vi) && (w.meaning_ru ? (w.meaning_en || w.meaning_vi) !== w.meaning_ru : true)) || 
            (fluentLanguage === 'vi' && w.meaning_en && w.meaning_en !== w.meaning_vi)) && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 0.65rem 0', lineHeight: 1.4 }}>
              {fluentLanguage === 'en' ? w.meaning_vi : fluentLanguage === 'ru' ? (w.meaning_en || w.meaning_vi) : w.meaning_en}
            </p>
          )}

          {/* Collocations */}
          {w.collocations && w.collocations.length > 0 && (
            <div style={{ marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Collocations:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                {w.collocations.map((c, i) => (
                  <span key={i} className="tag-pill" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', fontSize: '0.75rem' }}>
                    {typeof c === 'string' ? c : c.phrase}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Examples */}
          {w.examples && w.examples.length > 0 && (
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              borderLeft: `3px solid ${topic.color || 'var(--accent-primary)'}`
            }}>
              "{w.examples[0]}"
            </div>
          )}
        </div>

        {/* Footer: Tags & Due Date & Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Calendar size={13} />
            <span>{t.vocab?.dueInLabel || t?.vocab?.dueIn || "Due in:"} {w.due_date ? (w.due_date.includes('T') ? (t?.vocab?.dueInTenMinutes || "< 10 min") : w.due_date) : (t?.vocab?.dueToday || "Today")}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => onEditWord(w)}
              className="btn-icon"
              title={t?.vocab?.editWordTooltip || "Edit word"}
              style={{ padding: '0.35rem' }}
            >
              <Edit3 size={15} />
            </button>
            <button
              onClick={() => onDeleteWord(w.id)}
              className="btn-icon"
              title={t?.vocab?.deleteWordTooltip || "Delete word"}
              style={{ padding: '0.35rem', color: 'var(--accent-danger)' }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. TOP BAR: SEARCH & FILTERS & ADD BUTTON */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        background: 'var(--bg-secondary)',
        padding: '1.15rem 1.25rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Top Row: Search Box (Left) + Add Word Button (Right) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '220px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-control"
              placeholder={t?.vocab?.searchPlaceholder || "Search words, meanings, topics..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.75rem', width: '100%' }}
            />
          </div>

          {/* Add Word Button (Primary CTA - Full height, prominent, never squeezed) */}
          <button 
            onClick={onAddWord} 
            className="btn-primary glow-hover" 
            style={{ 
              minHeight: '44px',
              padding: '0.7rem 1.35rem', 
              fontSize: '0.92rem', 
              fontWeight: 700, 
              borderRadius: 'var(--radius-lg)',
              whiteSpace: 'nowrap', 
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={19} />
            <span>{t?.vocab?.addNewWordBtn || "Add Word"}</span>
          </button>
        </div>

        {/* Bottom Row: Status Filter, Level Filter & View Modes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
            {/* Status Filter */}
            <select
              className="input-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="all">{t?.vocab?.allStatus || "All Status"}</option>
              <option value="new">{t?.vocab?.statusNew || "New"}</option>
              <option value="learning">{t?.vocab?.statusLearning || "Learning"}</option>
              <option value="reviewing">{t?.vocab?.statusReviewing || "Reviewing"}</option>
              <option value="mastered">{t?.vocab?.statusMastered || "Mastered"}</option>
            </select>

            {/* Level Filter */}
            <select
              className="input-control"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="all">{t?.vocab?.allLevels || "All Levels"}</option>
              {isVietnameseTrack ? (
                <>
                  <option value="A1">{getDisplayLevel('A1', 'vi', uiLang, true)}</option>
                  <option value="A2">{getDisplayLevel('A2', 'vi', uiLang, true)}</option>
                  <option value="B1">{getDisplayLevel('B1', 'vi', uiLang, true)}</option>
                  <option value="B2">{getDisplayLevel('B2', 'vi', uiLang, true)}</option>
                  <option value="C1">{getDisplayLevel('C1', 'vi', uiLang, true)}</option>
                  <option value="C2">{getDisplayLevel('C2', 'vi', uiLang, true)}</option>
                </>
              ) : (
                <>
                  <option value="A1">{t?.vocab?.levelA1 || "A1 - Beginner"}</option>
                  <option value="A2">{t?.vocab?.levelA2 || "A2 - Elementary"}</option>
                  <option value="B1">{t?.vocab?.levelB1 || "B1 - Intermediate"}</option>
                  <option value="B2">{t?.vocab?.levelB2 || "B2 - Upper Intermediate"}</option>
                  <option value="C1">{t?.vocab?.levelC1 || "C1 - Advanced"}</option>
                  <option value="C2">{t?.vocab?.levelC2 || "C2 - Mastery"}</option>
                </>
              )}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            flexShrink: 0
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.38rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'list' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: viewMode === 'list' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
              title={t?.vocab?.flatViewTooltip || "Flat list"}
            >
              <LayoutGrid size={15} />
              <span>{t?.vocab?.gridMode || "Grid view"}</span>
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.38rem 0.65rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: viewMode === 'grouped' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === 'grouped' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: viewMode === 'grouped' ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'grouped' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
              title={t?.vocab?.groupByTopicTooltip || "Group by topic"}
            >
              <Folder size={15} />
              <span>{t?.vocab?.topicGroupMode || "Group by topic"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOPICS FILTER BAR & MANAGER BUTTON */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.35rem',
        whiteSpace: 'nowrap',
        flexWrap: 'nowrap',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', flexShrink: 0, paddingRight: '0.2rem' }}>
          <Folder size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t?.quickAdd?.topicLabel || "Topic:"}:</span>
        </div>

        {/* All Topics Pill */}
        <button
          onClick={() => setSelectedTopic('all')}
          style={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
            padding: '0.4rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 700,
            border: selectedTopic === 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
            background: selectedTopic === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            color: selectedTopic === 'all' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: selectedTopic === 'all' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
          }}
        >
          ✨ {t?.vocab?.allTopics || "All Topics"} ({words.length})
        </button>

        {/* Dynamic Topic Pills */}
        {topics.map(topItem => {
          const isSelected = selectedTopic === topItem.id;
          const topicWordsCount = words.filter(w => w.topic_id === topItem.id).length;
          return (
            <button
              key={topItem.id}
              onClick={() => setSelectedTopic(topItem.id)}
              style={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 800 : 600,
                border: `1px solid ${isSelected ? (topItem.color || 'var(--accent-primary)') : 'var(--border-color)'}`,
                background: isSelected ? (topItem.color || 'var(--accent-primary)') : 'var(--bg-secondary)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 2px 8px ${topItem.color || 'var(--accent-primary)'}40` : 'none'
              }}
            >
              <span>{topItem.emoji || '📁'}</span>
              <span>{getTopicName(topItem)}</span>
              <span style={{
                fontSize: '0.72rem',
                opacity: isSelected ? 0.9 : 0.65,
                fontWeight: 700
              }}>
                ({topicWordsCount})
              </span>
            </button>
          );
        })}
      </div>



      {/* 4. WORDS LIST / GROUPED VIEW */}
      {filteredWords.length === 0 ? (
        searchTerm.trim() ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px solid var(--accent-primary)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <Sparkles size={42} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {uiLang === 'ru' ? `"${searchTerm.trim()}" не найдено` : uiLang === 'en' ? `"${searchTerm.trim()}" not found` : `Không tìm thấy "${searchTerm.trim()}"`}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem', marginBottom: '1.25rem', maxWidth: '480px', marginInline: 'auto' }}>
              {uiLang === 'ru' ? 'Создать карточку с IPA, переводом и аудио с помощью AI?' : uiLang === 'en' ? 'Create card with AI (IPA, meaning & audio)?' : 'Tạo thẻ tự động với AI (IPA, nghĩa & audio)?'}
            </p>
            <button 
              onClick={() => onAddWord({ word: searchTerm.trim() })} 
              className="btn-primary"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.92rem', fontWeight: 800, margin: '0 auto' }}
            >
              <Sparkles size={16} />
              <span>{uiLang === 'ru' ? 'AI автопоиск (+10 XP)' : uiLang === 'en' ? 'AI Lookup & Add (+10 XP)' : 'Tra cứu AI (+10 XP)'}</span>
            </button>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-color)'
          }}>
            <Layers size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto', opacity: 0.6 }} />
            <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t?.vocab?.emptySearch || "No words matched search"}</h4>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
              {t?.vocab?.tryOtherTopic || "Pick another topic"}
            </p>
            <button onClick={onAddWord} className="btn-primary">
              <Plus size={18} />
              <span>{t?.vocab?.addNewWordBtn || "Add Word"}</span>
            </button>
          </div>
        )
      ) : viewMode === 'grouped' ? (
        /* GROUPED BY TOPIC ACCORDION VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {topics.map(tItem => {
            const topicWords = filteredWords.filter(w => w.topic_id === tItem.id);
            if (topicWords.length === 0 && selectedTopic !== 'all') return null;
            const isCollapsed = !!collapsedTopics[tItem.id];

            return (
              <div
                key={tItem.id}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '18px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden'
                }}
              >
                {/* Topic Group Header */}
                <div
                  onClick={() => toggleTopicCollapse(tItem.id)}
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: `${tItem.color || '#0284c7'}10`,
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.35rem' }}>{tItem.emoji || '📁'}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {getTopicName(tItem)}
                        </h3>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          backgroundColor: `${tItem.color || '#0284c7'}20`,
                          color: tItem.color || '#0284c7'
                        }}>
                          {topicWords.length} {t?.vocab?.wordsCountUnit || "words"}
                        </span>
                      </div>
                      {tItem.description ? (
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {tItem.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-muted)' }}>
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Words in Topic */}
                {!isCollapsed && (
                  <div style={{ padding: '1.25rem' }}>
                    {topicWords.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {t?.vocab?.emptyTopicWordsNotice || "No words in this topic yet"}
                      </p>
                    ) : (
                      <div className="vocab-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1rem' }}>
                        {topicWords.map(w => renderWordCard(w))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD FLAT GRID VIEW */
        <div className="vocab-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.25rem' }}>
          {filteredWords.map(w => renderWordCard(w))}
        </div>
      )}
    </div>
  );
}
