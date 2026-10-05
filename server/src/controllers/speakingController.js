import { 
  SPEAKING_PROMPTS, 
  analyzeReadAloud, 
  analyzeQASpeaking 
} from '../services/speakingService.js';
import { gamificationService } from '../services/gamificationService.js';
import { db } from '../db/database.js';
import crypto from 'node:crypto';

export const speakingController = {
  // GET /api/speaking/prompts
  getPrompts: async (req, res) => {
    try {
      const { category, target_language } = req.query;
      const targetLang = target_language || req.user?.target_language || 'en';
      let data = SPEAKING_PROMPTS.filter(p => (p.target_language || 'en') === targetLang);
      if (category) {
        data = data.filter(p => p.category === category);
      }
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/speaking/analyze-read-aloud
  analyzeReadAloud: async (req, res) => {
    try {
      const { targetText, spokenText, audioData, duration } = req.body;
      const result = await analyzeReadAloud({ targetText, spokenText, audioData, duration });
      const userId = req.user?.id || 'admin_master_user_id';
      
      // Save to speaking_history
      try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO speaking_history (id, user_id, type, prompt_title, target_text, spoken_text, score, feedback_json, created_at)
          VALUES (?, ?, 'read_aloud', 'Luyện đọc mẫu AI', ?, ?, ?, ?, ?)
        `).run(id, userId, targetText || '', spokenText || '', result?.score || 0, JSON.stringify(result || {}), now);
      } catch (e) {
        console.warn('Could not record speaking history:', e.message);
      }

      let gamification = null;
      try {
        gamification = gamificationService.addXp(userId, 20, 'Luyện phát âm AI Speaking');
      } catch (e) {}

      res.json({ success: true, data: result, gamification });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // POST /api/speaking/analyze-qa
  analyzeQA: async (req, res) => {
    try {
      const { question, topic, spokenText, audioData } = req.body;
      const result = await analyzeQASpeaking({ question, topic, spokenText, audioData });
      const userId = req.user?.id || 'admin_master_user_id';

      // Save to speaking_history
      try {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO speaking_history (id, user_id, type, prompt_title, target_text, spoken_text, score, feedback_json, created_at)
          VALUES (?, ?, 'qa', ?, ?, ?, ?, ?, ?)
        `).run(id, userId, topic ? `Chủ đề: ${topic}` : 'Phản xạ Speaking AI', question || '', spokenText || '', result?.overallBand || 7, JSON.stringify(result || {}), now);
      } catch (e) {
        console.warn('Could not record QA speaking history:', e.message);
      }

      let gamification = null;
      try {
        gamification = gamificationService.addXp(userId, 25, 'Đối thoại phản xạ Speaking AI');
      } catch (e) {}

      res.json({ success: true, data: result, gamification });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
};
