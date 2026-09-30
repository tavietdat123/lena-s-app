import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  BookPlus, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Volume2, 
  BookOpen, 
  Feather,
  Copy,
  Check,
  RefreshCw,
  Layers,
  MessagesSquare,
  BookmarkPlus,
  Send,
  Zap,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Lightbulb,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { api } from '../../services/api';
import { playAudio } from '../../services/audioService';
import PatternCategoryModal from '../patterns/PatternCategoryModal';

export default function AILab({ initialSentence = '', onSaveExtractedWord }) {
  const [activeTab, setActiveTab] = useState('parser'); // 'parser' | 'paraphrase' | 'writer' | 'collocations' | 'dialogue' | 'story'

  // Tab 1: Parser State
  const [sentenceInput, setSentenceInput] = useState(initialSentence || '');
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [savedWordIndex, setSavedWordIndex] = useState({});
  const [savedPatternIndex, setSavedPatternIndex] = useState({});
  const [patternCategories, setPatternCategories] = useState([]);
  const [selectedPatternCategories, setSelectedPatternCategories] = useState({});
  const [selectedPatternTones, setSelectedPatternTones] = useState({});
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Tab 2: Paraphrase State
  const [paraphraseInput, setParaphraseInput] = useState('');
  const [paraphraseTone, setParaphraseTone] = useState('business');
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [paraphraseResult, setParaphraseResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Tab 3: Writer State
  const [targetItem, setTargetItem] = useState('resilient');
  const [userSentence, setUserSentence] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // Tab 4: Collocations State
  const [collocationWord, setCollocationWord] = useState('leverage');
  const [isExploringCollocations, setIsExploringCollocations] = useState(false);
  const [collocationResult, setCollocationResult] = useState(null);
  const [savedCollocationIndex, setSavedCollocationIndex] = useState({});

  // Tab 5: Situational Dialogue State
  const [dialogueScenario, setDialogueScenario] = useState('job_interview');
  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState(false);
  const [dialogueResult, setDialogueResult] = useState(null);

  // Tab 6: Story Weaver State
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyResult, setStoryResult] = useState(null);

  const loadPatternCategories = async () => {
    try {
      const res = await api.getPatternCategories();
      if (res.success && Array.isArray(res.data)) {
        setPatternCategories(res.data);
      }
    } catch (e) {
      console.error('Failed to load pattern categories in AILab:', e);
    }
  };

  useEffect(() => {
    loadPatternCategories();
  }, []);

  const detectPatternCategory = (pattern, categories = []) => {
    if (pattern.category && categories.some(c => c.id === pattern.category)) {
      return pattern.category;
    }
    const text = `${pattern.name || ''} ${pattern.formula || ''} ${pattern.explanation || ''}`.toLowerCase();
    if (text.includes('because') || text.includes('due to') || text.includes('as a result') || text.includes('lead to') || text.includes('attribute to') || text.includes('nguyên nhân') || text.includes('hệ quả')) return 'cause_effect';
    if (text.includes('although') || text.includes('despite') || text.includes('in spite') || text.includes('whereas') || text.includes('nhượng bộ') || text.includes('tương phản')) return 'concession';
    if (text.includes('compare') || text.includes('contrast') || text.includes('so sánh') || text.includes('the more') || text.includes('superior') || text.includes('inferior')) return 'comparison';
    if (text.includes('so as to') || text.includes('in order') || text.includes('with a view') || text.includes('aim to') || text.includes('mục đích')) return 'purpose';
    if (text.includes('unless') || text.includes('provided') || text.includes('had it not') || text.includes('were it not') || text.includes('điều kiện') || text.includes('giả định')) return 'condition';
    if (text.includes('not only') || text.includes('hardly') || text.includes('it is') || text.includes('no sooner') || text.includes('đảo ngữ') || text.includes('nhấn mạnh')) return 'emphasis';
    if (text.includes('high time') || text.includes('advisable') || text.includes('should') || text.includes('khuyên') || text.includes('thúc giục')) return 'advice';
    if (text.includes('for instance') || text.includes('such as') || text.includes('ví dụ') || text.includes('minh họa')) return 'example';
    if (text.includes('furthermore') || text.includes('moreover') || text.includes('in addition') || text.includes('bổ sung')) return 'addition';
    if (text.includes('in conclusion') || text.includes('to sum up') || text.includes('tóm lại') || text.includes('kết luận')) return 'conclusion';
    if (text.includes('in other words') || text.includes('that is to say') || text.includes('làm rõ') || text.includes('diễn giải')) return 'clarification';
    if (text.includes('except') || text.includes('ngoại lệ') || text.includes('loại trừ')) return 'exception';
    if (text.includes('likely') || text.includes('probability') || text.includes('phỏng đoán') || text.includes('khả năng')) return 'speculation';
    if (text.includes('defined as') || text.includes('refers to') || text.includes('định nghĩa')) return 'definition';
    if (text.includes('would you mind') || text.includes('appreciate it if') || text.includes('yêu cầu') || text.includes('đề nghị')) return 'request';
    if (text.includes('in terms of') || text.includes('regarding') || text.includes('chuyển ý') || text.includes('dẫn dắt')) return 'transition';
    if (text.includes('no sooner') || text.includes('prior to') || text.includes('trình tự') || text.includes('thời gian')) return 'sequence';
    if (text.includes('perspective') || text.includes('undeniable') || text.includes('quan điểm')) return 'opinion';
    return categories[0]?.id || 'emphasis';
  };

  useEffect(() => {
    if (initialSentence) {
      setSentenceInput(initialSentence);
      setActiveTab('parser');
    }
  }, [initialSentence]);

  // Handle Parse Sentence
  const handleParseSentence = async (e) => {
    e.preventDefault();
    if (!sentenceInput.trim()) return;

    setIsParsing(true);
    setParseResult(null);

    try {
      const res = await api.parseSentenceAI(sentenceInput.trim());
      if (res.success && res.data) {
        setParseResult(res.data);
        const initialCats = {};
        const initialTones = {};
        (res.data.patterns || []).forEach((p, idx) => {
          initialCats[idx] = detectPatternCategory(p, patternCategories);
          initialTones[idx] = p.tone || 'Formal';
        });
        setSelectedPatternCategories(initialCats);
        setSelectedPatternTones(initialTones);
      }
    } catch (err) {
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Paraphrase
  const handleParaphrase = async (e) => {
    e.preventDefault();
    if (!paraphraseInput.trim()) return;

    setIsParaphrasing(true);
    setParaphraseResult(null);

    try {
      const res = await api.paraphraseSentenceAI(paraphraseInput.trim(), paraphraseTone);
      if (res.success && res.data) {
        setParaphraseResult(res.data);
      }
    } catch (err) {
      console.error('Paraphrase error:', err);
    } finally {
      setIsParaphrasing(false);
    }
  };

  // Handle Check User's Sentence
  const handleCheckSentence = async (e) => {
    e.preventDefault();
    if (!targetItem.trim() || !userSentence.trim()) return;

    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await api.checkSentenceAI(targetItem.trim(), userSentence.trim());
      if (res.success && res.data) {
        setCheckResult(res.data);
      }
    } catch (err) {
      console.error('Check sentence error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle Explore Collocations
  const handleExploreCollocations = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!collocationWord.trim()) return;

    setIsExploringCollocations(true);
    setCollocationResult(null);
    setSavedCollocationIndex({});

    try {
      const res = await api.exploreCollocationsAI(collocationWord.trim());
      if (res.success && res.data) {
        setCollocationResult(res.data);
      }
    } catch (err) {
      console.error('Collocation error:', err);
    } finally {
      setIsExploringCollocations(false);
    }
  };

  // Handle Generate Dialogue
  const handleGenerateDialogue = async () => {
    setIsGeneratingDialogue(true);
    setDialogueResult(null);

    try {
      const res = await api.generateDialogueAI(dialogueScenario);
      if (res.success && res.data) {
        setDialogueResult(res.data);
      }
    } catch (err) {
      console.error('Dialogue error:', err);
    } finally {
      setIsGeneratingDialogue(false);
    }
  };

  // Handle Generate Story
  const handleGenerateStory = async () => {
    setIsGeneratingStory(true);
    setStoryResult(null);

    try {
      const res = await api.generateStoryAI();
      if (res.success && res.data) {
        setStoryResult(res.data);
      }
    } catch (err) {
      console.error('Story generation error:', err);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. TOP TAB SELECTOR */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        background: 'var(--bg-secondary)',
        padding: '0.4rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('parser')}
          style={{
            flex: 1,
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            background: activeTab === 'parser' ? 'var(--accent-primary-light)' : 'transparent',
            color: activeTab === 'parser' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={16} />
          <span>1. Bóc Tách Câu</span>
        </button>

        <button
          onClick={() => setActiveTab('paraphrase')}
          style={{
            flex: 1,
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            background: activeTab === 'paraphrase' ? 'var(--accent-primary-light)' : 'transparent',
            color: activeTab === 'paraphrase' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          <RefreshCw size={16} />
          <span>2. Nâng Cấp Văn Phong</span>
        </button>

        <button
          onClick={() => setActiveTab('writer')}
          style={{
            flex: 1,
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            background: activeTab === 'writer' ? 'var(--accent-primary-light)' : 'transparent',
            color: activeTab === 'writer' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          <Feather size={16} />
          <span>3. Chấm & Sửa Câu</span>
        </button>

        <button
          onClick={() => setActiveTab('collocations')}
          style={{
            flex: 1,
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            background: activeTab === 'collocations' ? 'var(--accent-primary-light)' : 'transparent',
            color: activeTab === 'collocations' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          <Layers size={16} />
          <span>4. Cụm Từ & Thành Ngữ</span>
        </button>

        <button
          onClick={() => setActiveTab('dialogue')}
          style={{
            flex: 1,
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            background: activeTab === 'dialogue' ? 'var(--accent-primary-light)' : 'transparent',
            color: activeTab === 'dialogue' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          <MessagesSquare size={16} />
          <span>5. Hội Thoại Tình Huống</span>
        </button>

        <button
          onClick={() => setActiveTab('story')}
          style={{
            flex: 1,
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            background: activeTab === 'story' ? 'var(--accent-primary-light)' : 'transparent',
            color: activeTab === 'story' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          <BookOpen size={16} />
          <span>6. Truyện SRS</span>
        </button>
      </div>

      {/* TAB 1: PARSER */}
      {activeTab === 'parser' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Dán câu tiếng Anh phức tạp hoặc đoạn văn bạn muốn phân tích
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              AI sẽ bóc tách từ vựng hay, nhận diện cấu trúc ngữ pháp và dịch nghĩa tự nhiên theo đúng ngữ cảnh.
            </p>

            <form onSubmit={handleParseSentence} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea
                className="input-control"
                rows={3}
                placeholder="Ví dụ: Although the startup faced unprecedented headwinds, the team remained resilient and successfully articulated their vision to investors."
                value={sentenceInput}
                onChange={(e) => setSentenceInput(e.target.value)}
                style={{ fontSize: '1rem', lineHeight: 1.6 }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isParsing || !sentenceInput.trim()} className="btn-primary">
                  {isParsing ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                  <span>Phân Tích Bằng AI</span>
                </button>
              </div>
            </form>
          </div>

          {/* Parse Results */}
          {parseResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                    Bản dịch tiếng Việt chuẩn ngữ cảnh:
                  </span>
                  <button onClick={() => playAudio(sentenceInput)} className="btn-icon" style={{ color: 'var(--accent-primary)' }}>
                    <Volume2 size={16} />
                  </button>
                </div>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.35rem', color: 'var(--text-primary)' }}>
                  {parseResult.translation}
                </p>
              </div>

              {/* 2. Syntax & Sentence Structure Breakdown */}
              {parseResult.sentence_structure && (
                <div className="card" style={{ background: 'rgba(59, 130, 246, 0.08)', borderLeft: '4px solid #3b82f6' }}>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6', marginBottom: '0.4rem' }}>
                    📐 Bóc Tách Cấu Trúc Ngữ Pháp (Syntax Breakdown):
                  </h5>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {parseResult.sentence_structure}
                  </p>
                </div>
              )}

              {/* 3. Core Sentence Patterns */}
              {parseResult.patterns && parseResult.patterns.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                        Mẫu Câu & Cấu Trúc Trọng Tâm:
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        Tự động nhận diện cấu trúc ngữ pháp. Bạn có thể chọn lại nhóm chức năng diễn đạt phù hợp trước khi lưu.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Quản lý và thêm mới các nhóm chức năng câu"
                    >
                      <Layers size={14} />
                      <span>Quản Lý Chức Năng ({patternCategories.length})</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {parseResult.patterns.map((item, idx) => {
                      const currentCatId = selectedPatternCategories[idx] || item.category || 'emphasis';
                      const currentCat = patternCategories.find(c => c.id === currentCatId) || {
                        id: currentCatId,
                        name: 'Nhấn mạnh & Đảo ngữ',
                        emoji: '💥',
                        color: '#8b5cf6'
                      };
                      const currentTone = selectedPatternTones[idx] || item.tone || 'Formal';

                      return (
                        <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.85rem' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                              <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)', margin: 0 }}>
                                {item.name}
                              </h5>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                background: `${currentCat.color || '#8b5cf6'}18`,
                                color: currentCat.color || '#8b5cf6',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                flexShrink: 0
                              }}>
                                <span>{currentCat.emoji}</span>
                                <span>{currentCat.name}</span>
                              </span>
                            </div>

                            {item.formula && (
                              <div style={{
                                background: 'var(--bg-tertiary)',
                                padding: '0.4rem 0.6rem',
                                borderRadius: 'var(--radius-sm)',
                                margin: '0.4rem 0',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                color: 'var(--accent-primary)',
                                fontWeight: 700
                              }}>
                                {item.formula}
                              </div>
                            )}

                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                              {item.explanation}
                            </p>

                            {/* Sentence Function (Chức năng câu) & Tone Selector Box */}
                            <div style={{
                              marginTop: '0.75rem',
                              padding: '0.7rem 0.85rem',
                              borderRadius: '12px',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.45rem'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <Layers size={13} style={{ color: currentCat.color || 'var(--accent-primary)' }} />
                                  <span>Chọn chức năng câu:</span>
                                </label>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {patternCategories.length} nhóm có sẵn
                                </span>
                              </div>

                              <select
                                className="input-control"
                                value={currentCatId}
                                onChange={(e) => setSelectedPatternCategories(prev => ({ ...prev, [idx]: e.target.value }))}
                                style={{
                                  padding: '0.45rem 0.65rem',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  borderRadius: '8px',
                                  border: `1.5px solid ${currentCat.color || 'var(--border-color)'}`,
                                  background: 'var(--bg-secondary)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer'
                                }}
                              >
                                {patternCategories.map(cat => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.emoji} {cat.name}
                                  </option>
                                ))}
                              </select>

                              {currentCat.description && (
                                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.4, fontStyle: 'italic' }}>
                                  💡 {currentCat.description}
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-color)', marginTop: '0.15rem' }}>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Văn phong:</span>
                                <select
                                  value={currentTone}
                                  onChange={(e) => setSelectedPatternTones(prev => ({ ...prev, [idx]: e.target.value }))}
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)'
                                  }}
                                >
                                  <option value="Formal">Formal (Trang trọng)</option>
                                  <option value="Academic">Academic (Học thuật)</option>
                                  <option value="Business">Business (Công việc)</option>
                                  <option value="Daily">Daily (Hàng ngày)</option>
                                  <option value="Neutral">Neutral (Trung tính)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={async () => {
                              try {
                                await api.createPattern({
                                  name: item.name,
                                  formula: item.formula || '',
                                  explanation: item.explanation || '',
                                  meaning_vi: item.explanation || item.name,
                                  category: currentCatId,
                                  tone: currentTone,
                                  examples: [sentenceInput],
                                  tags: ['Grammar', 'AI-Lab']
                                });
                                setSavedPatternIndex(prev => ({ ...prev, [idx]: true }));
                              } catch (e) {
                                console.error(e);
                                alert('Lỗi khi lưu mẫu câu: ' + e.message);
                              }
                            }}
                            disabled={savedPatternIndex[idx]}
                            className={savedPatternIndex[idx] ? 'btn-secondary' : 'btn-primary'}
                            style={{ width: '100%', justifyContent: 'center', padding: '0.55rem', fontSize: '0.85rem' }}
                          >
                            {savedPatternIndex[idx] ? (
                              <>
                                <Check size={16} style={{ color: 'var(--accent-success)' }} />
                                <span>Đã Lưu Mẫu Câu ({currentCat.name})</span>
                              </>
                            ) : (
                              <>
                                <BookPlus size={16} />
                                <span>Lưu Mẫu Câu Này Vào Kho</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Extracted Words */}
              {parseResult.extracted_words && parseResult.extracted_words.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                    Từ Vựng & Cụm Từ Nổi Bật Được Trích Xuất:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {parseResult.extracted_words.map((item, idx) => (
                      <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h5 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{item.word}</h5>
                              <button onClick={() => playAudio(item.word)} className="btn-icon" style={{ padding: '0.2rem', color: 'var(--accent-primary)' }}>
                                <Volume2 size={16} />
                              </button>
                            </div>
                            <span className="badge badge-blue">{item.part_of_speech || 'word'}</span>
                          </div>

                          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                            {item.meaning_vi}
                          </p>

                          {item.context_usage && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                              {item.context_usage}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (onSaveExtractedWord) {
                              onSaveExtractedWord({
                                word: item.word,
                                meaning_vi: item.meaning_vi,
                                part_of_speech: item.part_of_speech || 'noun',
                                examples: [sentenceInput]
                              });
                            }
                            setSavedWordIndex(prev => ({ ...prev, [idx]: true }));
                          }}
                          disabled={savedWordIndex[idx]}
                          className={savedWordIndex[idx] ? 'btn-secondary' : 'btn-primary'}
                          style={{ width: '100%', justifyContent: 'center', padding: '0.5rem', fontSize: '0.85rem' }}
                        >
                          {savedWordIndex[idx] ? (
                            <>
                              <Check size={16} style={{ color: 'var(--accent-success)' }} />
                              <span>Đã Lưu Vào Kho</span>
                            </>
                          ) : (
                            <>
                              <BookPlus size={16} />
                              <span>Lưu Từ Này Vào Kho</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Grammar Notes */}
              {parseResult.grammar_notes && (
                <div className="card" style={{ background: 'var(--bg-tertiary)' }}>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Lightbulb size={16} color="var(--accent-warning)" />
                    <span>Phân tích Ngữ pháp & Điểm lưu ý:</span>
                  </h5>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {parseResult.grammar_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PARAPHRASER & TONE POLISHER */}
      {activeTab === 'paraphrase' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              AI Viết Lại & Nâng Cấp Câu (Paraphraser & Tone Polisher)
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Chuyển đổi câu hoặc đoạn văn sang các văn phong chuyên nghiệp: Business, Academic IELTS 8.0+, Natural Native, hoặc Concise.
            </p>

            <form onSubmit={handleParaphrase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Chọn Văn Phong Mục Tiêu:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { id: 'business', emoji: '💼', title: 'Business Corporate', desc: 'Trang trọng, đàm phán, email công sở' },
                    { id: 'academic', emoji: '🎓', title: 'Academic / IELTS 8.0+', desc: 'Từ vựng C1/C2, cấu trúc câu phức' },
                    { id: 'casual', emoji: '☕', title: 'Natural Native Daily', desc: 'Tự nhiên như người bản xứ Mỹ/Anh' },
                    { id: 'concise', emoji: '⚡', title: 'Concise & Direct', desc: 'Súc tích, cô đọng, đi thẳng vào ý' }
                  ].map(tone => (
                    <div
                      key={tone.id}
                      onClick={() => setParaphraseTone(tone.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: paraphraseTone === tone.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: paraphraseTone === tone.id ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.9rem' }}>
                        <span>{tone.emoji}</span>
                        <span>{tone.title}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{tone.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Câu tiếng Anh hoặc Đoạn văn muốn viết lại:
                </label>
                <textarea
                  className="input-control"
                  rows={3}
                  placeholder="Ví dụ: I want to tell you that we cannot finish the project on time because we have some problems."
                  value={paraphraseInput}
                  onChange={(e) => setParaphraseInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isParaphrasing || !paraphraseInput.trim()} className="btn-primary">
                  {isParaphrasing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  <span>Viết Lại Bằng AI</span>
                </button>
              </div>
            </form>
          </div>

          {/* Paraphrase Results */}
          {paraphraseResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                Các Phiên Bản Viết Lại Xuất Sắc:
              </h4>

              {paraphraseResult.paraphrases?.map((item, idx) => (
                <div key={idx} className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, flex: 1 }}>
                      "{item.version}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <button onClick={() => playAudio(item.version)} className="btn-icon" style={{ color: 'var(--accent-primary)' }}>
                        <Volume2 size={16} />
                      </button>
                      <button onClick={() => copyToClipboard(item.version, idx)} className="btn-icon" style={{ color: copiedIndex === idx ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                        {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Lightbulb size={13} color="var(--accent-warning)" />
                    <span>{item.explanation_vi}</span>
                  </p>

                  {item.key_phrases && item.key_phrases.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-color)' }}>
                      {item.key_phrases.map((kp, kIdx) => (
                        <div key={kIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-tertiary)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{kp.phrase}:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{kp.meaning_vi}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WRITER CHECKER */}
      {activeTab === 'writer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Luyện Viết & Đặt Câu Cá Nhân Hóa
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Tự đặt câu với từ vựng bạn đang học. AI sẽ chấm độ tự nhiên, phát hiện lỗi ngữ pháp và gợi ý câu chuẩn người bản xứ.
            </p>

            <form onSubmit={handleCheckSentence} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Từ vựng hoặc Cấu trúc muốn luyện tập
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ví dụ: articulate, resilient, take for granted..."
                  value={targetItem}
                  onChange={(e) => setTargetItem(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Câu tiếng Anh do bạn tự viết
                </label>
                <textarea
                  className="input-control"
                  rows={3}
                  placeholder="Ví dụ: She is very articulate when she talk with her boss in the meeting."
                  value={userSentence}
                  onChange={(e) => setUserSentence(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isChecking || !userSentence.trim()} className="btn-primary">
                  {isChecking ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  <span>Chấm & Sửa Câu</span>
                </button>
              </div>
            </form>
          </div>

          {/* Check Results */}
          {checkResult && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {checkResult.is_correct ? (
                    <CheckCircle2 size={24} style={{ color: 'var(--accent-success)' }} />
                  ) : (
                    <AlertCircle size={24} style={{ color: 'var(--accent-warning)' }} />
                  )}
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {checkResult.is_correct ? 'Câu Ngữ Pháp Chính Xác!' : 'Có Một Số Điểm Cần Cải Thiện'}
                  </h4>
                </div>

                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  Điểm: {checkResult.score || 80}/100
                </span>
              </div>

              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {checkResult.feedback}
              </p>

              {/* Native Alternatives */}
              {checkResult.native_alternatives && checkResult.native_alternatives.length > 0 && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                    Cách diễn đạt chuẩn bản xứ tự nhiên hơn (Native Alternatives):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {checkResult.native_alternatives.map((alt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>"{alt}"</span>
                        <button onClick={() => playAudio(alt)} className="btn-icon" style={{ color: 'var(--accent-primary)', padding: '0.2rem' }}>
                          <Volume2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COLLOCATIONS & IDIOMS */}
      {activeTab === 'collocations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Đào Sâu Cụm Từ Cố Định & Thành Ngữ (Collocation & Idiom Explorer)
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Khám phá các cách kết hợp từ tự nhiên (Verb+Noun, Adj+Noun) và các lỗi sai người Việt hay mắc phải.
            </p>

            <form onSubmit={handleExploreCollocations} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Nhập từ vựng: leverage, compromise, sustainable, viable..."
                value={collocationWord}
                onChange={(e) => setCollocationWord(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button type="submit" disabled={isExploringCollocations || !collocationWord.trim()} className="btn-primary" style={{ flexShrink: 0 }}>
                {isExploringCollocations ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                <span>Khảo Sát Cụm Từ</span>
              </button>
            </form>
          </div>

          {/* Collocation Results */}
          {collocationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Core Word Info */}
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{collocationResult.target_word}</h3>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{collocationResult.phonetic}</span>
                    <button onClick={() => playAudio(collocationResult.target_word)} className="btn-icon" style={{ color: 'var(--accent-primary)' }}>
                      <Volume2 size={18} />
                    </button>
                  </div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                    {collocationResult.core_meaning_vi}
                  </p>
                </div>
                <span className="badge badge-blue">{collocationResult.word_type || 'word'}</span>
              </div>

              {/* Collocations Grid */}
              {collocationResult.collocations && (
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                    🌟 Cụm Từ Tự Nhiên Hay Đi Cùng (Collocations):
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {collocationResult.collocations.map((col, cIdx) => (
                      <div key={cIdx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.6rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{col.collocation}</h5>
                            <span className="badge badge-gray">{col.pattern}</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                            {col.meaning_vi}
                          </p>
                          <div style={{ marginTop: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>"{col.example_en}"</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{col.example_vi}</p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => playAudio(col.example_en)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }}>
                            <Volume2 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (onSaveExtractedWord) {
                                onSaveExtractedWord({
                                  word: col.collocation,
                                  meaning_vi: col.meaning_vi,
                                  part_of_speech: 'phrase',
                                  examples: [col.example_en]
                                });
                              }
                              setSavedCollocationIndex(prev => ({ ...prev, [cIdx]: true }));
                            }}
                            disabled={savedCollocationIndex[cIdx]}
                            className={savedCollocationIndex[cIdx] ? 'btn-secondary' : 'btn-primary'}
                            style={{ flex: 1, justifyContent: 'center', padding: '0.4rem', fontSize: '0.8rem' }}
                          >
                            {savedCollocationIndex[cIdx] ? '✓ Đã Lưu' : '+ Lưu Cụm Này'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {collocationResult.common_mistakes && collocationResult.common_mistakes.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid var(--accent-warning)', background: 'var(--bg-secondary)' }}>
                  <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-warning)', marginBottom: '0.6rem' }}>
                    ⚠️ Lỗi Sai Người Việt Hay Mắc Phải (Common Pitfalls):
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {collocationResult.common_mistakes.map((mis, mIdx) => (
                      <div key={mIdx} style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.9rem', fontWeight: 700 }}>
                          <XCircle size={15} />
                          <span>Sai:</span>
                          <span style={{ textDecoration: 'line-through' }}>{mis.incorrect}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.9rem', fontWeight: 700, marginTop: '0.2rem' }}>
                          <CheckCircle size={15} />
                          <span>Đúng:</span>
                          <span>{mis.correct}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Lightbulb size={13} color="var(--accent-warning)" />
                          <span>{mis.explanation_vi}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SITUATIONAL DIALOGUE */}
      {activeTab === 'dialogue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Tạo Hội Thoại Giao Tiếp Tình Huống Thực Tế (Roleplay Dialogue)
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              AI sẽ tạo cuộc hội thoại 2 chiều thực chiến và lồng ghép các từ vựng trong kho của bạn để bạn luyện tập phản xạ.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Chọn Tình Huống Giao Tiếp:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { id: 'job_interview', emoji: '💼', title: 'Phỏng Vấn Xin Việc Tech' },
                    { id: 'salary_negotiation', emoji: '💰', title: 'Đàm Phán Lương Thưởng' },
                    { id: 'tech_standup', emoji: '💻', title: 'Họp Agile Standup Dự Án' },
                    { id: 'business_meeting', emoji: '🤝', title: 'Đàm Phán Đối Tác Hợp Đồng' },
                    { id: 'daily_casual', emoji: '☕', title: 'Trò Chuyện Cafe Đồng Nghiệp' },
                    { id: 'travel_airport', emoji: '✈️', title: 'Check-in Sân Bay & Du Lịch' }
                  ].map(sc => (
                    <div
                      key={sc.id}
                      onClick={() => setDialogueScenario(sc.id)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: dialogueScenario === sc.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: dialogueScenario === sc.id ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span>{sc.emoji}</span>
                      <span>{sc.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleGenerateDialogue}
                  disabled={isGeneratingDialogue}
                  className="btn-primary"
                >
                  {isGeneratingDialogue ? <Loader2 size={18} className="animate-spin" /> : <MessagesSquare size={18} />}
                  <span>Tạo Cuộc Hội Thoại Ngay</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dialogue Results */}
          {dialogueResult && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  🎭 {dialogueResult.scenario_title}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {dialogueResult.scenario_desc_vi}
                </p>
              </div>

              {/* Chat Stream */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                {dialogueResult.dialogue?.map((turn, tIdx) => {
                  const isLeft = tIdx % 2 === 0;
                  return (
                    <div
                      key={tIdx}
                      style={{
                        alignSelf: isLeft ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        background: isLeft ? 'var(--bg-secondary)' : 'var(--accent-primary-light)',
                        border: '1px solid var(--border-color)',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isLeft ? 'var(--text-muted)' : 'var(--accent-primary)' }}>
                          {turn.speaker}
                        </span>
                        <button onClick={() => playAudio(turn.text_en)} className="btn-icon" style={{ padding: '0.1rem', color: 'var(--accent-primary)' }}>
                          <Volume2 size={14} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {turn.text_en}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {turn.text_vi}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Key Takeaways */}
              {dialogueResult.key_takeaways && (
                <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.4rem' }}>
                    💎 Cụm từ & Mẫu câu đắt giá trong hội thoại:
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {dialogueResult.key_takeaways.map((kt, kIdx) => (
                      <div key={kIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>• {kt.phrase}:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{kt.meaning_vi}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: STORY WEAVER */}
      {activeTab === 'story' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <Sparkles size={40} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.75rem auto' }} />
            <h4 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Sáng Tác Truyện Ngắn Chống Quên (Story Weaver)
            </h4>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: '0.5rem auto 1.5rem auto', fontSize: '0.95rem' }}>
              AI sẽ tự động gom các từ vựng bạn sắp quên trong ngày hôm nay và viết thành một câu chuyện ngắn lôi cuốn trong 1 phút để bạn ghi nhớ toàn bộ trong ngữ cảnh.
            </p>

            <button
              onClick={handleGenerateStory}
              disabled={isGeneratingStory}
              className="btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', margin: '0 auto' }}
            >
              {isGeneratingStory ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              <span>{isGeneratingStory ? 'AI Đang Sáng Tác...' : 'Sáng Tác Câu Chuyện Ngay'}</span>
            </button>
          </div>

          {/* Story Result */}
          {storyResult && (
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  📖 {storyResult.title}
                </h4>
                <button onClick={() => playAudio(storyResult.story_en)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <Volume2 size={16} />
                  <span>Nghe Đọc Truyện</span>
                </button>
              </div>

              <div
                style={{
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  color: 'var(--text-primary)',
                  background: 'var(--bg-tertiary)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: '4px solid var(--accent-primary)'
                }}
                dangerouslySetInnerHTML={{ __html: storyResult.story_en }}
              />

              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Bản dịch tiếng Việt:
                </span>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.6 }}>
                  {storyResult.story_vi}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pattern Category Management Modal */}
      <PatternCategoryModal
        isOpen={isCategoryModalOpen}
        categories={patternCategories}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoriesChange={() => loadPatternCategories()}
      />
    </div>
  );
}

