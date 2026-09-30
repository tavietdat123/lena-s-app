import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import CommandPalette from './components/layout/CommandPalette';
import Toast from './components/common/Toast';
import Dashboard from './components/dashboard/Dashboard';
import VocabVault from './components/vocab/VocabVault';
import QuickAddModal from './components/vocab/QuickAddModal';
import PatternHub from './components/patterns/PatternHub';
import PatternModal from './components/patterns/PatternModal';
import SmartReader from './components/reader/SmartReader';
import SRSReviewCenter from './components/review/SRSReviewCenter';
import QuizCenter from './components/quiz/QuizCenter';
import SpeakingLab from './components/speaking/SpeakingLab';
import AILab from './components/ai/AILab';
import StudyTimerHub from './components/timer/StudyTimerHub';
import GlobalTimerBar from './components/timer/GlobalTimerBar';
import { StudyTimerProvider } from './context/StudyTimerContext';
import SettingsModal from './components/settings/SettingsModal';
import AlarmModal from './components/alarm/AlarmModal';
import LevelUpModal from './components/gamification/LevelUpModal';
import AIMasteryReportModal from './components/gamification/AIMasteryReportModal';
import TopicManagerModal from './components/topics/TopicManagerModal';
import AuthPage from './components/auth/AuthPage';
import ProfileEditModal from './components/auth/ProfileEditModal';
import PublicStatsPage from './components/public/PublicStatsPage';
import { api } from './services/api';
import { audioService } from './services/audioService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[LinguaVault ErrorBoundary]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: '580px', margin: '3rem auto', padding: '2.5rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto', fontSize: '1.8rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Đã xảy ra sự cố hiển thị</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{this.state.error?.message || 'Vui lòng bấm tải lại.'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
            🔄 Thử Lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive currentTab from URL path (e.g. /vocab -> 'vocab', / -> 'dashboard')
  const path = location.pathname.replace(/^\//, '');
  const currentTab = path || 'dashboard';

  const [isDark, setIsDark] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(audioService.getSpeed());

  // User Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  // Data States
  const [words, setWords] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [notes, setNotes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [stats, setStats] = useState(null);
  const [dueItems, setDueItems] = useState([]);

  // Modal States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);

  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [isTopicManagerOpen, setIsTopicManagerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAIMasteryReportOpen, setIsAIMasteryReportOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [gamificationProfile, setGamificationProfile] = useState(null);
  const [aiLabSentence, setAiLabSentence] = useState('');

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  const handleNavigate = (tab) => {
    navigate(tab === 'dashboard' ? '/' : `/${tab}`);
  };

  const handleAudioSpeedChange = (newSpeed) => {
    const updated = audioService.setSpeed(newSpeed);
    setAudioSpeed(updated);
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load Theme (Default: Light)
  useEffect(() => {
    const savedTheme = localStorage.getItem('linguavault_theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.body.className = 'theme-dark';
    } else {
      setIsDark(false);
      document.body.className = 'theme-light';
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.body.className = nextDark ? 'theme-dark' : 'theme-light';
    localStorage.setItem('linguavault_theme', nextDark ? 'dark' : 'light');
    addToast(nextDark ? 'Đã chuyển sang Giao diện Tối' : 'Đã chuyển sang Giao diện Sáng', 'info');
  };

  // Load All App Data
  const refreshAllData = async () => {
    try {
      const [wordsRes, patternsRes, notesRes, statsRes, dueRes, gamificationRes, topicsRes] = await Promise.all([
        api.getWords(),
        api.getPatterns(),
        api.getNotes(),
        api.getStats(),
        api.getDueItems(),
        api.getGamificationProfile(),
        api.getTopics()
      ]);

      if (wordsRes.success) setWords(wordsRes.data || []);
      if (patternsRes.success) setPatterns(patternsRes.data || []);
      if (notesRes.success) setNotes(notesRes.data || []);
      if (statsRes.success) setStats(statsRes.data || null);
      if (topicsRes && topicsRes.success) setTopics(topicsRes.data || []);
      if (dueRes.success) {
        const combinedDue = [
          ...(dueRes.data?.words || []),
          ...(dueRes.data?.patterns || [])
        ];
        setDueItems(combinedDue);
      }
      if (gamificationRes && gamificationRes.success) {
        const newProf = gamificationRes.data;
        if (gamificationProfile && newProf.level > gamificationProfile.level) {
          setLevelUpData({
            newLevel: newProf.level,
            title: newProf.title,
            perk: newProf.perk,
            totalXp: newProf.totalXp
          });
        }
        setGamificationProfile(newProf);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Load Current Authenticated User on Mount
  const loadCurrentUser = async () => {
    setAuthChecking(true);
    try {
      const res = await api.auth.getMe();
      if (res.success && res.data && res.data.role !== 'guest') {
        setCurrentUser(res.data);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      setCurrentUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser]);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    addToast(`Chào mừng trở lại, ${user.full_name || user.username}! 👋`, 'success');
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setCurrentUser(null);
    navigate('/login', { replace: true });
    addToast('Đã đăng xuất tài khoản', 'info');
  };

  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
    addToast('Đã cập nhật hồ sơ cá nhân thành công!', 'success');
  };

  const getSupervisorUrl = () => {
    const username = currentUser?.username || '';
    if (!username || username === 'admin') {
      return `${window.location.origin}/giam-sat`;
    }
    return `${window.location.origin}/giam-sat/${encodeURIComponent(username)}`;
  };

  const handleOpenSupervisorPortal = () => {
    const url = getSupervisorUrl();
    window.open(url, '_blank');
  };

  const handleSharePublicStats = () => {
    const url = getSupervisorUrl();
    navigator.clipboard.writeText(url).then(() => {
      addToast('Đã sao chép link Cổng Giám Sát Học Tập! 🛡️ Bạn có thể gửi cho người khác để họ giám sát bạn.', 'success');
    }).catch(() => {
      window.open(url, '_blank');
    });
  };

  // ⏰ AUTOMATIC ALARM WATCHER (Checks every 15s and fires alarm only once at designated time)
  const isAlarmModalOpenRef = useRef(false);
  const lastAlarmDateKeyRef = useRef('');

  useEffect(() => {
    isAlarmModalOpenRef.current = isAlarmModalOpen;
  }, [isAlarmModalOpen]);

  useEffect(() => {
    const checkAutoAlarm = () => {
      try {
        if (isAlarmModalOpenRef.current) return;

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const currentHH = String(now.getHours()).padStart(2, '0');
        const currentMM = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHH}:${currentMM}`;
        const currentDateMinuteKey = `${yyyy}-${mm}-${dd}-${currentTimeStr}`;

        const isAlarmEnabled = localStorage.getItem('linguavault_auto_alarm_enabled') === 'true';
        const targetAlarmTime = localStorage.getItem('linguavault_alarm_time') || '20:00';
        const savedLastTrigger = localStorage.getItem('linguavault_last_alarm_date') || '';

        if (
          isAlarmEnabled &&
          currentTimeStr === targetAlarmTime &&
          lastAlarmDateKeyRef.current !== currentDateMinuteKey &&
          savedLastTrigger !== currentDateMinuteKey
        ) {
          lastAlarmDateKeyRef.current = currentDateMinuteKey;
          localStorage.setItem('linguavault_last_alarm_date', currentDateMinuteKey);
          setIsAlarmModalOpen(true);
        }
      } catch (e) {}
    };

    const interval = setInterval(checkAutoAlarm, 15000);
    checkAutoAlarm();

    return () => clearInterval(interval);
  }, []);

  // Handlers for Words
  const handleAddWord = () => {
    setEditingWord(null);
    setIsQuickAddOpen(true);
  };

  const handleEditWord = (word) => {
    setEditingWord(word);
    setIsQuickAddOpen(true);
  };

  const handleDeleteWord = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa từ vựng này không?')) return;
    try {
      await api.deleteWord(id);
      addToast('Đã xóa từ vựng khỏi kho lưu trữ', 'info');
      refreshAllData();
    } catch (err) {
      addToast('Lỗi xóa từ: ' + err.message, 'error');
    }
  };

  // Handlers for Patterns
  const handleAddPattern = () => {
    setEditingPattern(null);
    setIsPatternModalOpen(true);
  };

  const handleEditPattern = (pattern) => {
    setEditingPattern(pattern);
    setIsPatternModalOpen(true);
  };

  const handleDeletePattern = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mẫu câu này không?')) return;
    try {
      await api.deletePattern(id);
      addToast('Đã xóa mẫu câu', 'info');
      refreshAllData();
    } catch (err) {
      addToast('Lỗi xóa mẫu câu: ' + err.message, 'error');
    }
  };

  // Handlers for Notes
  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) {
        await api.updateNote(noteData.id, noteData);
        addToast('Đã cập nhật bài viết thành công');
      } else {
        await api.createNote(noteData);
        addToast('Đã tạo bài viết mới thành công');
      }
      refreshAllData();
    } catch (err) {
      addToast('Lỗi lưu bài viết: ' + err.message, 'error');
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đọc/ghi chú này không?')) return;
    try {
      await api.deleteNote(id);
      addToast('Đã xóa bài viết', 'info');
      refreshAllData();
    } catch (err) {
      addToast('Lỗi: ' + err.message, 'error');
    }
  };

  // Smart Reader Highlight -> Quick Add with Context
  const handleSaveWordFromSelection = (text, contextTranslation = null) => {
    if (contextTranslation) {
      setEditingWord({
        word: text,
        phonetic: contextTranslation.phonetic || '',
        meaning_vi: contextTranslation.contextualMeaningVi || '',
        meaning_en: contextTranslation.contextExplanation || '',
        part_of_speech: contextTranslation.partOfSpeech || 'noun',
        examples: contextTranslation.overallSentenceVi ? [contextTranslation.overallSentenceVi] : [],
        collocations: contextTranslation.collocations || [],
        level: contextTranslation.level || 'B2'
      });
    } else {
      setEditingWord({ word: text });
    }
    setIsQuickAddOpen(true);
  };

  // Smart Reader Highlight -> AI Lab
  const handleSendToAiLab = (text) => {
    setAiLabSentence(text);
    handleNavigate('ai-lab');
  };

  // SRS Review Submit
  const handleReviewSubmit = async (id, type, rating) => {
    try {
      await api.submitReview(id, type, rating);
      setDueItems(prev => prev.filter(item => item.id !== id));
      const statsRes = await api.getStats();
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Export backup trigger
  const handleExportBackup = async () => {
    try {
      const blob = await api.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lingua_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Đã xuất file sao lưu JSON thành công!');
    } catch (err) {
      addToast('Lỗi xuất dữ liệu: ' + err.message, 'error');
    }
  };

  // 1. Loading screen while verifying token
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '42px', height: '42px', margin: '0 auto 1.25rem', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 700 }}>Đang khởi tạo LinguaVault...</p>
        </div>
      </div>
    );
  }

  // 2. Full-Screen Standalone Supervisor & Public Monitoring Routes
  // Must render standalone full-screen (without sidebar or app header),
  // for both logged-in users and outside guests/supervisors!
  const currentPath = (location.pathname || '').toLowerCase();
  const normalizedPath = currentPath.replace(/\/+$/, '') || '/';
  const isPublicStandalone = [
    '/giam-sat',
    '/monitor',
    '/supervisor',
    '/public/stats',
    '/share/stats'
  ].some(base => normalizedPath === base || normalizedPath.startsWith(base + '/'));

  if (isPublicStandalone) {
    return (
      <Routes>
        <Route path="/giam-sat" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
        <Route path="/giam-sat/:username" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
        <Route path="/monitor" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
        <Route path="/monitor/:username" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
        <Route path="/supervisor" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
        <Route path="/supervisor/:username" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
        <Route path="/public/stats" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
        <Route path="/public/stats/:username" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
        <Route path="/share/stats" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
        {/* Fallback for any trailing slash or subpaths under supervisor routes */}
        <Route path="*" element={<PublicStatsPage isDark={isDark} toggleTheme={toggleTheme} currentUser={currentUser} />} />
      </Routes>
    );
  }

  // 3. Full-Screen Standalone Auth Page at route /login
  if (!currentUser) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <AuthPage
              onAuthSuccess={(user) => {
                handleAuthSuccess(user);
                navigate('/dashboard', { replace: true });
              }}
              isDark={isDark}
              toggleTheme={toggleTheme}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 3. Authenticated App Workspace Shell
  return (
    <StudyTimerProvider onAddToast={addToast}>
      <div className="app-container">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        stats={stats}
        onOpenQuickAdd={handleAddWord}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onSharePublicStats={handleSharePublicStats}
        onOpenSupervisorPortal={handleOpenSupervisorPortal}
      />

      {/* 2. Main Content Area */}
      <main className="app-main">
        <Header
          currentTab={currentTab}
          isDark={isDark}
          toggleTheme={toggleTheme}
          stats={stats}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          audioSpeed={audioSpeed}
          onAudioSpeedChange={handleAudioSpeedChange}
          gamificationProfile={gamificationProfile}
          onOpenAIMasteryReport={() => setIsAIMasteryReportOpen(true)}
          currentUser={currentUser}
          onOpenProfileEdit={() => setIsProfileEditOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
        />

        <div className="app-content">
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/" 
                element={
                  <Dashboard
                    stats={stats}
                    recentWords={words}
                    onStartReview={() => handleNavigate('review')}
                    onNavigate={handleNavigate}
                    audioSpeed={audioSpeed}
                    gamificationProfile={gamificationProfile}
                    onOpenAIMasteryReport={() => setIsAIMasteryReportOpen(true)}
                    onSharePublicStats={handleSharePublicStats}
                    onOpenSupervisorPortal={handleOpenSupervisorPortal}
                  />
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard
                    stats={stats}
                    recentWords={words}
                    onStartReview={() => handleNavigate('review')}
                    onNavigate={handleNavigate}
                    audioSpeed={audioSpeed}
                    gamificationProfile={gamificationProfile}
                    onOpenAIMasteryReport={() => setIsAIMasteryReportOpen(true)}
                    onSharePublicStats={handleSharePublicStats}
                    onOpenSupervisorPortal={handleOpenSupervisorPortal}
                  />
                } 
              />
              <Route 
                path="/vocab" 
                element={
                  <VocabVault
                    words={words}
                    topics={topics}
                    onAddWord={handleAddWord}
                    onEditWord={handleEditWord}
                    onDeleteWord={handleDeleteWord}
                    onOpenTopicManager={() => setIsTopicManagerOpen(true)}
                  />
                } 
              />
              <Route 
                path="/patterns" 
                element={
                  <PatternHub
                    patterns={patterns}
                    onAddPattern={handleAddPattern}
                    onEditPattern={handleEditPattern}
                    onDeletePattern={handleDeletePattern}
                  />
                } 
              />
              <Route 
                path="/quiz" 
                element={
                  <QuizCenter
                    onOpenReview={() => handleNavigate('review')}
                  />
                } 
              />
              <Route 
                path="/speaking" 
                element={
                  <SpeakingLab
                    onSaveWord={handleAddWord}
                  />
                } 
              />
              <Route 
                path="/reader" 
                element={
                  <SmartReader
                    notes={notes}
                    words={words}
                    onSaveNote={handleSaveNote}
                    onDeleteNote={handleDeleteNote}
                    onSaveWordFromSelection={handleSaveWordFromSelection}
                    onSendToAiLab={handleSendToAiLab}
                  />
                } 
              />
              <Route 
                path="/review" 
                element={
                  <SRSReviewCenter
                    dueItems={dueItems}
                    allWords={words}
                    allPatterns={patterns}
                    onAddWord={handleAddWord}
                    onReviewSubmit={handleReviewSubmit}
                    onFinishSession={() => {
                      refreshAllData();
                      handleNavigate('dashboard');
                      addToast('Chúc mừng bạn đã hoàn thành phiên ôn tập hôm nay!');
                    }}
                  />
                } 
              />
              <Route 
                path="/ai-lab" 
                element={
                  <AILab
                    initialSentence={aiLabSentence}
                    onSaveExtractedWord={(item) => {
                      setEditingWord(item);
                      setIsQuickAddOpen(true);
                    }}
                  />
                } 
              />
              <Route 
                path="/timer" 
                element={
                  <StudyTimerHub
                    onSessionFinished={() => {
                      refreshAllData();
                    }}
                    onAddToast={addToast}
                  />
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>

      {/* Persistent Floating Active Study Timer Bar */}
      <GlobalTimerBar />

      {/* 3. Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        words={words}
        patterns={patterns}
        notes={notes}
        onNavigate={handleNavigate}
        onOpenQuickAdd={handleAddWord}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        onExportBackup={handleExportBackup}
      />

      {/* 4. Modals */}
      {isQuickAddOpen && (
        <QuickAddModal
          initialData={editingWord}
          topics={topics}
          onClose={() => setIsQuickAddOpen(false)}
          onSaved={() => {
            refreshAllData();
            addToast(editingWord?.id ? 'Đã cập nhật từ vựng' : 'Đã thêm từ vựng mới vào kho');
          }}
        />
      )}

      {/* 4a. Topic Management Modal */}
      <TopicManagerModal
        isOpen={isTopicManagerOpen}
        topics={topics}
        onClose={() => setIsTopicManagerOpen(false)}
        onTopicChange={() => {
          refreshAllData();
          addToast('Đã cập nhật danh sách chủ đề');
        }}
      />

      {isPatternModalOpen && (
        <PatternModal
          initialData={editingPattern}
          onClose={() => setIsPatternModalOpen(false)}
          onSaved={() => {
            refreshAllData();
            addToast(editingPattern?.id ? 'Đã cập nhật mẫu câu' : 'Đã thêm mẫu câu mới vào kho');
          }}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onDataRestored={() => {
            refreshAllData();
            addToast('Đã khôi phục dữ liệu từ bản sao lưu!');
          }}
        />
      )}

      {/* 4b. Urgent Ringing Alarm Clock Modal (Solve Quiz Questions to Silence) */}
      <AlarmModal
        isOpen={isAlarmModalOpen}
        onClose={() => {
          setIsAlarmModalOpen(false);
          const now = new Date();
          const key = `${now.toISOString().split('T')[0]}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          lastAlarmDateKeyRef.current = key;
          localStorage.setItem('linguavault_last_alarm_date', key);
        }}
        words={words}
        onChallengeCompleted={async () => {
          setIsAlarmModalOpen(false);
          const now = new Date();
          const key = `${now.toISOString().split('T')[0]}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          lastAlarmDateKeyRef.current = key;
          localStorage.setItem('linguavault_last_alarm_date', key);
          try {
            await api.addXp(30, 'Giải mã Báo Thức Kỷ Luật Thép');
          } catch (e) {}
          refreshAllData();
          addToast('🎉 Xuất sắc! Bạn đã giải mã thành công & tắt chuông báo thức! (+30 XP)', 'success');
        }}
      />

      {/* 4c. AI Vocabulary Mastery Assessment Report Modal */}
      <AIMasteryReportModal
        isOpen={isAIMasteryReportOpen}
        onClose={() => setIsAIMasteryReportOpen(false)}
      />

      {/* 4d. Level Up Celebration Modal */}
      <LevelUpModal
        isOpen={!!levelUpData}
        onClose={() => setLevelUpData(null)}
        levelData={levelUpData}
      />

      {/* 4e. User Profile & Password Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        user={currentUser}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* 5. Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  </StudyTimerProvider>
  );
}
