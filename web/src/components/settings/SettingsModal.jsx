import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Download, 
  Upload, 
  Check, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Server,
  Bell,
  Target,
  Send,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function SettingsModal({ onClose, onDataRestored }) {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  // Telegram & Daily Goal State
  const [dailyGoal, setDailyGoal] = useState(10);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [morningReminderTime, setMorningReminderTime] = useState('08:30');
  const [disciplineMode, setDisciplineMode] = useState('standard');
  const [alarmQuestionsCount, setAlarmQuestionsCount] = useState(() => {
    return parseInt(localStorage.getItem('linguavault_alarm_q_count') || '3', 10);
  });
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramAutoBackup, setTelegramAutoBackup] = useState(true);
  const [telegramBackupTime, setTelegramBackupTime] = useState('23:00');
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [telegramSaveSuccess, setTelegramSaveSuccess] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isTriggeringAlarm, setIsTriggeringAlarm] = useState(false);
  const [isTriggeringDue, setIsTriggeringDue] = useState(false);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);
  const [telegramBackupResult, setTelegramBackupResult] = useState('');
  const [testResult, setTestResult] = useState('');
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  useEffect(() => {
    // Load existing Gemini settings
    api.getSettings().then(res => {
      if (res.success && res.data) {
        if (res.data.gemini_api_key) setApiKey(res.data.gemini_api_key);
        if (res.data.gemini_model) setSelectedModel(res.data.gemini_model);
      }
    }).catch(err => console.error(err));

    // Load Telegram & Goal settings
    api.getTelegramSettings().then(res => {
      if (res.success && res.data) {
        setDailyGoal(res.data.daily_word_goal || 10);
        setReminderTime(res.data.telegram_reminder_time || '20:00');
        setMorningReminderTime(res.data.telegram_morning_time || '08:30');
        setDisciplineMode(res.data.discipline_mode || 'standard');
        setBotToken(res.data.telegram_bot_token || '');
        setChatId(res.data.telegram_chat_id || '');
        setTelegramEnabled(Boolean(res.data.telegram_enabled));
        if (res.data.telegram_auto_backup !== undefined) {
          setTelegramAutoBackup(Boolean(res.data.telegram_auto_backup));
        }
        if (res.data.telegram_backup_time) {
          setTelegramBackupTime(res.data.telegram_backup_time);
        }
      }
    }).catch(err => console.error(err));
  }, []);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setIsSavingKey(true);
    setSaveSuccess(false);

    try {
      const res = await api.saveSettings({ 
        gemini_api_key: apiKey.trim(),
        gemini_model: selectedModel
      });
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSaveTelegram = async (e) => {
    e.preventDefault();
    setIsSavingTelegram(true);
    setTelegramSaveSuccess(false);
    setTestResult('');

    try {
      localStorage.setItem('linguavault_alarm_q_count', String(alarmQuestionsCount));
      localStorage.setItem('linguavault_alarm_time', reminderTime);
      localStorage.setItem('linguavault_auto_alarm_enabled', 'true');
      const res = await api.saveTelegramSettings({
        daily_word_goal: parseInt(dailyGoal, 10) || 10,
        telegram_reminder_time: reminderTime,
        telegram_morning_time: morningReminderTime,
        discipline_mode: disciplineMode,
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim(),
        telegram_enabled: telegramEnabled,
        telegram_auto_backup: telegramAutoBackup,
        telegram_backup_time: telegramBackupTime
      });

      if (res.success) {
        setTelegramSaveSuccess(true);
        setTimeout(() => setTelegramSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTriggerTelegramBackup = async () => {
    setIsTriggeringBackup(true);
    setTelegramBackupResult('');
    try {
      const res = await api.triggerTelegramBackup();
      if (res.success) {
        setTelegramBackupResult(`✓ Đã gửi file sao lưu (${res.data?.stats?.words || 0} từ) về Telegram!`);
        setTimeout(() => setTelegramBackupResult(''), 6000);
      } else {
        alert(res.error || (t?.common?.error || "Error"));
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    } finally {
      setIsTriggeringBackup(false);
    }
  };

  const handleTestAlarm = async () => {
    setIsTriggeringAlarm(true);
    try {
      const res = await api.triggerTelegramAlarm();
      if (res.success) {
        alert('🚨 Test alarm notification sent to Telegram!');
      } else {
        alert((t?.common?.error || "Error") + (res.error || res.reason));
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    } finally {
      setIsTriggeringAlarm(false);
    }
  };

  const handleTestDueReminder = async () => {
    setIsTriggeringDue(true);
    try {
      const res = await api.triggerTelegramDueReminder();
      if (res.success) {
        alert('🧠 Flashcard reminder sent to Telegram!');
      } else {
        alert((t?.common?.error || "Error") + (res.error || res.reason));
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    } finally {
      setIsTriggeringDue(false);
    }
  };

  const handleTestStreakSaver = async () => {
    try {
      const res = await api.triggerStreakSaver();
      if (res.success) {
        alert('🔥 Streak alert sent to Telegram!');
      } else {
        alert((t?.common?.error || "Error") + (res.error || res.reason));
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    }
  };

  const handleTestWordOfDay = async () => {
    try {
      const res = await api.triggerWordOfDay();
      if (res.success) {
        alert('☕ Lunch review sent to Telegram!');
      } else {
        alert((t?.common?.error || "Error") + (res.error || res.reason));
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    }
  };

  const handleTestWeeklyDigest = async () => {
    try {
      const res = await api.triggerWeeklyDigest();
      if (res.success) {
        alert('📈 Weekly report sent to Telegram!');
      } else {
        alert((t?.common?.error || "Error") + (res.error || res.reason));
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    }
  };

  const handleTestLeechAlert = async () => {
    try {
      const res = await api.triggerLeechAlert();
      if (res.success) {
        alert('💡 Mnemonic reminder sent to Telegram!');
      } else {
        alert((t?.common?.error || "Error") + (res.error || res.reason));
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    }
  };

  const handleTestTelegram = async () => {
    if (!botToken || !chatId) {
      alert('Please enter Telegram Bot Token and Chat ID first!');
      return;
    }

    setIsTestingTelegram(true);
    setTestResult('');

    try {
      const res = await api.sendTelegramTest({
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim()
      });

      if (res.success) {
        setTestResult('success');
      } else {
        setTestResult('error: ' + (res.error || 'Không gửi được tin nhắn'));
      }
    } catch (err) {
      setTestResult('error: ' + err.message);
    } finally {
      setIsTestingTelegram(false);
    }
  };

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
    } catch (err) {
      console.warn('Blob download failed, trying direct link:', err);
      try {
        window.open(api.exportDataUrl(), '_blank');
      } catch (e2) {
        alert((t?.common?.error || "Error") + err.message);
      }
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage('');

    try {
      const text = await file.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('Invalid JSON format: ' + parseErr.message);
      }

      const res = await api.importData(json);
      if (res.success) {
        setImportMessage('✓ ' + (res.message || 'Khôi phục dữ liệu thành công!'));
        if (onDataRestored) onDataRestored();
      } else {
        setImportMessage('❌ Lỗi khôi phục: ' + (res.error || 'Thất bại'));
      }
    } catch (err) {
      setImportMessage('❌ Lỗi khôi phục: ' + err.message);
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-secondary)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {t?.settings?.title || "Settings"}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* 1. Daily Goal & Telegram Notification Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {t?.settings?.telegramSectionTitle || "Daily Goals & Telegram Bot"}
                </h4>
              </div>
              <button 
                type="button"
                onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <HelpCircle size={14} />
                <span>{t?.common?.options || "Options"}</span>
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t?.settings?.subtitle || "Goals, Telegram bot and personal data"}
            </p>

            {/* Step-by-step Guide Accordion */}
            {showTelegramGuide && (
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                border: '1px solid var(--border-color)'
              }}>
                <b>{t?.settings?.tokenChatIdHelp || "How to get Token & Chat ID:"}</b>
                <ol style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                  <li>{t?.settings?.botStep1 || "Find @BotFather on Telegram ➔ Send /newbot for Token."}</li>
                  <li>{t?.settings?.botStep2 || "Find @userinfobot ➔ Tap Start to get your Chat ID."}</li>
                  <li>{t?.settings?.botStep3 || "Send any message to your bot to activate it."}</li>
                </ol>
              </div>
            )}

            <form onSubmit={handleSaveTelegram} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Daily Goal & Dual Reminder Times */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '0.35rem' }}>
                    <Target size={14} color="var(--accent-primary)" />
                    <span>{t?.settings?.dailyGoalLabel || "Daily word goal:"}</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {[5, 10, 15, 20].map(cnt => (
                      <button
                        type="button"
                        key={cnt}
                        onClick={() => setDailyGoal(cnt)}
                        style={{
                          flex: 1,
                          padding: '0.35rem 0.2rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          background: dailyGoal === cnt ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                          color: dailyGoal === cnt ? '#ffffff' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t?.settings?.morningVocabReminder || "Morning reminder:"}
                  </label>
                  <input
                    type="time"
                    className="input-control"
                    value={morningReminderTime}
                    onChange={(e) => setMorningReminderTime(e.target.value)}
                    style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    {t?.settings?.eveningAlarmTime || "Evening alarm:"}
                  </label>
                  <input
                    type="time"
                    className="input-control"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* 🚨 HARDCORE DISCIPLINE MODE SELECTOR */}
              <div style={{
                background: disciplineMode === 'hardcore' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-tertiary)',
                border: disciplineMode === 'hardcore' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-color)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {disciplineMode === 'hardcore' ? (t?.settings?.disciplineModeHardcore || "Hardcore") : (t?.settings?.disciplineModeTitle || "Discipline mode:")}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setDisciplineMode('standard')}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid var(--border-color)',
                        background: disciplineMode === 'standard' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: disciplineMode === 'standard' ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {t?.settings?.disciplineModeStandard || "Standard"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisciplineMode('hardcore')}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: disciplineMode === 'hardcore' ? '#ef4444' : 'var(--bg-secondary)',
                        color: disciplineMode === 'hardcore' ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {t?.settings?.disciplineModeHardcore || "Hardcore"}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {disciplineMode === 'hardcore'
                    ? (t?.settings?.disciplineHardcoreDesc || "Repeated alerts every 10 mins until goal is met!")
                    : (t?.settings?.disciplineStandardDesc || "One gentle reminder at 20:00.")}
                </p>

                {disciplineMode === 'hardcore' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.4rem', paddingTop: '0.6rem', borderTop: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Target size={13} color="#ef4444" />
                      <span>{t?.settings?.requiredQuizCountLabel || "Quizzes required to dismiss:"}</span>
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {[3, 5, 10].map(num => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setAlarmQuestionsCount(num)}
                          style={{
                            padding: '0.25rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            border: '1px solid var(--border-color)',
                            background: alarmQuestionsCount === num ? '#ef4444' : 'var(--bg-secondary)',
                            color: alarmQuestionsCount === num ? '#ffffff' : 'var(--text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          {num} {t?.common?.quiz || "Quiz"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bot Token & Chat ID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    🔑 Telegram Bot Token:
                  </label>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="123456789:ABCdef..."
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                    💬 Telegram Chat ID:
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="VD: 987654321"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Enable Toggle & Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={telegramEnabled}
                    onChange={(e) => setTelegramEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                  <span>{t?.settings?.enableTelegramNotifs || "Enable automatic Telegram alerts"}</span>
                </label>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram}
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {isTestingTelegram ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>{t?.settings?.testConnectionBtn || "Test Connection"}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingTelegram}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                  >
                    {isSavingTelegram ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>{t?.settings?.saveSettingsBtn || "Save Settings"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Notification Test Triggers */}
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {t?.settings?.smartTelegramNotifsTitle || "Send Test Notifications:"}
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={handleTestStreakSaver}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                    title={t?.settings?.rescueStreakBtn || "Streak Rescue (22:30)"}
                  >
                    {t?.settings?.rescueStreakBtn || "Streak Rescue (22:30)"}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestWordOfDay}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--accent-primary)', borderColor: 'rgba(2, 132, 199, 0.4)' }}
                    title={t?.settings?.lunchVocabBtn || "Lunch Vocab (12:00)"}
                  >
                    {t?.settings?.lunchVocabBtn || "Lunch Vocab (12:00)"}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestWeeklyDigest}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    title={t?.settings?.weeklyReportBtn || "Weekly Report (Sun)"}
                  >
                    {t?.settings?.weeklyReportBtn || "Weekly Report (Sun)"}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestLeechAlert}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#a855f7', borderColor: 'rgba(168, 85, 247, 0.4)' }}
                    title={t?.settings?.stubbornVocabBtn || "Stubborn Words (AI)"}
                  >
                    {t?.settings?.stubbornVocabBtn || "Stubborn Words (AI)"}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestDueReminder}
                    disabled={isTriggeringDue}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--accent-primary)' }}
                    title={t?.settings?.dueVocabBtn || "Due Words (08:30)"}
                  >
                    {isTriggeringDue ? <Loader2 size={12} className="animate-spin" /> : (t?.settings?.dueVocabBtn || "Due Words (08:30)")}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestAlarm}
                    disabled={isTriggeringAlarm}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    title={t?.settings?.alarmBtn || "Hardcore Alarm (20:00)"}
                  >
                    {isTriggeringAlarm ? <Loader2 size={12} className="animate-spin" /> : (t?.settings?.alarmBtn || "Hardcore Alarm (20:00)")}
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerTelegramBackup}
                    disabled={isTriggeringBackup}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.4)' }}
                    title={t?.settings?.backupBtn || "Backup (.json)"}
                  >
                    {isTriggeringBackup ? <Loader2 size={12} className="animate-spin" /> : (t?.settings?.backupBtn || "Backup (.json)")}
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              {telegramSaveSuccess && (
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                  ✓ Đã lưu cấu hình Mục tiêu & Telegram thành công!
                </span>
              )}
              {testResult === 'success' && (
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                  ✓ Đã gửi tin nhắn thử nghiệm tới Telegram của bạn! Hãy kiểm tra app Telegram.
                </span>
              )}
              {testResult.startsWith('error') && (
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
                  ✕ {testResult}
                </span>
              )}
            </form>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          {/* 2. Gemini AI Key Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{t?.settings?.geminiKeyLabel || "Gemini API Key:"}</h4>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
              >
                <span>AI Studio</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t?.settings?.geminiKeyPlaceholder || "Enter Google Gemini API Key..."}
            </p>

            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="password"
                  className="input-control"
                  placeholder="AI Studio Key (AIzaSy...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ fontSize: '0.9rem' }}
                />
                <button type="submit" disabled={isSavingKey} className="btn-primary" style={{ flexShrink: 0 }}>
                  {isSavingKey ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{t?.settings?.saveBtn || "Save Config"}</span>
                </button>
              </div>

              {/* Model Choice Chips */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  🤖 {t?.settings?.geminiModelLabel || "Google Model:"}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { id: 'gemini-3.5-flash', name: '🚀 Gemini 3.5 Flash', desc: 'Recommended' },
                    { id: 'gemini-flash-latest', name: '✨ Gemini Flash Latest', desc: 'Auto-rotating' },
                    { id: 'gemini-3.7-flash', name: '🧠 Gemini 3.7 Flash', desc: 'Deep reasoning' },
                    { id: 'gemini-3.6-flash', name: '⚡ Gemini 3.6 Flash', desc: 'High detail' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      style={{
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-md)',
                        background: selectedModel === m.id ? 'var(--accent-primary-light)' : 'var(--bg-tertiary)',
                        border: '1px solid',
                        borderColor: selectedModel === m.id ? 'var(--accent-primary)' : 'var(--border-color)',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: selectedModel === m.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {m.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {saveSuccess && (
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)', fontWeight: 600 }}>
                ✓ {t?.settings?.successMsg || "Settings saved successfully!"}
              </span>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          {/* 3. Backup & Restore Data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-success)' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                {t?.settings?.backupSectionTitle || "Backup & Restore"}
              </h4>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Toàn bộ từ vựng, mẫu câu, ghi chú và lịch sử chu kỳ ôn tập SRS của bạn có thể được xuất ra file JSON.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Telegram Instant Backup Button */}
              <button
                type="button"
                onClick={handleTriggerTelegramBackup}
                disabled={isTriggeringBackup}
                className="btn-primary"
                style={{ padding: '0.75rem 1.25rem', background: '#0284c7', borderColor: '#0284c7' }}
              >
                {isTriggeringBackup ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>Telegram Backup</span>
              </button>

              {/* Export Button */}
              <button type="button" onClick={handleExportBackup} className="btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
                <Download size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>{t?.settings?.exportBtn || "Download JSON"}</span>
              </button>

              {/* Import Button */}
              <label className="btn-secondary" style={{ padding: '0.75rem 1.25rem', cursor: 'pointer' }}>
                <Upload size={18} style={{ color: 'var(--accent-success)' }} />
                <span>{isImporting ? (t?.common?.loading || "Loading...") : (t?.settings?.importBtn || "Restore JSON")}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Auto Backup to Telegram Scheduler Card */}
            <div style={{
              background: 'var(--bg-tertiary)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={telegramAutoBackup}
                    onChange={(e) => setTelegramAutoBackup(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                  />
                  <span>{t?.settings?.autoBackupDaily || "Automatically send daily backup to Telegram"}</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t?.settings?.runTimeLabel || "Run time:"}</span>
                  <input
                    type="time"
                    className="input-control"
                    value={telegramBackupTime}
                    onChange={(e) => setTelegramBackupTime(e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {t?.settings?.backupSecurityTip || "Your data is backed up safely to your Telegram chat."}
              </p>
            </div>

            {telegramBackupResult && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-success)'
              }}>
                {telegramBackupResult}
              </div>
            )}

            {importMessage && (
              <div style={{
                background: 'var(--bg-tertiary)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--accent-primary)'
              }}>
                {importMessage}
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          {/* 4. Server Info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Server size={14} />
              <span>Backend Server: Node.js SQLite (Port 5001)</span>
            </div>
            <span>LinguaVault v1.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

