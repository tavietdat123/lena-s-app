import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { hashPassword, verifyPassword, generateToken } from '../services/authService.js';
import { calculateUserStreak } from '../services/streakService.js';

export const authController = {
  // 1. Register new user
  register: (req, res) => {
    try {
      const { username, email, password, full_name, avatar_url, native_language, target_language } = req.body;

      if (!username || !password || !full_name) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và họ tên'
        });
      }

      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = (email || '').trim().toLowerCase() || null;
      const cleanName = full_name.trim();
      const cleanAvatar = avatar_url || '🧑‍🎓';
      const validNative = ['vi', 'en', 'ru'].includes(native_language) ? native_language : 'en';
      const hasExplicitTarget = Boolean(target_language && ['en', 'vi'].includes(target_language));
      const validTarget = hasExplicitTarget ? target_language : 'en';
      const isTargetLocked = hasExplicitTarget ? 1 : 0;

      if (cleanUsername.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Tên đăng nhập phải có ít nhất 3 ký tự'
        });
      }

      if (password.length < 4) {
        return res.status(400).json({
          success: false,
          error: 'Mật khẩu phải có ít nhất 4 ký tự'
        });
      }

      // Check if username or email already exists
      const existingUser = db.prepare(`
        SELECT id, username, email FROM users 
        WHERE username = ? OR (email IS NOT NULL AND email = ?)
      `).get(cleanUsername, cleanEmail);

      if (existingUser) {
        if (existingUser.username === cleanUsername) {
          return res.status(409).json({ success: false, error: 'Tên đăng nhập đã tồn tại, vui lòng chọn tên khác' });
        }
        return res.status(409).json({ success: false, error: 'Email đã được sử dụng' });
      }

      const { hash, salt } = hashPassword(password);
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Insert User
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, salt, full_name, avatar_url, role, native_language, target_language, target_language_locked, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'user', ?, ?, ?, ?, ?)
      `).run(userId, cleanUsername, cleanEmail, hash, salt, cleanName, cleanAvatar, validNative, validTarget, isTargetLocked, now, now);

      // Create initial Gamification User Profile
      db.prepare(`
        INSERT OR REPLACE INTO user_profile (id, user_id, total_xp, current_level, title, streak_record, updated_at)
        VALUES (?, ?, 100, 1, 'Novice Scholar 🌱', 1, ?)
      `).run(userId, userId, now);

      // Create initial User Settings
      db.prepare(`
        INSERT OR REPLACE INTO user_settings (user_id, gemini_model, daily_goal, alarm_time, telegram_enabled, telegram_due_reminder, updated_at)
        VALUES (?, 'gemini-3.6-flash', 10, '08:00', 0, 1, ?)
      `).run(userId, now);

      const user = {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        full_name: cleanName,
        avatar_url: cleanAvatar,
        role: 'user',
        native_language: validNative,
        target_language: validTarget,
        target_language_locked: isTargetLocked === 1,
        created_at: now
      };

      const token = generateToken({ 
        id: userId, 
        username: cleanUsername, 
        role: 'user',
        native_language: validNative,
        target_language: validTarget
      });

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: { user, token }
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Login
  login: (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng nhập tên đăng nhập và mật khẩu'
        });
      }

      const identifier = username.trim().toLowerCase();

      // Find user by username or email
      const user = db.prepare(`
        SELECT * FROM users 
        WHERE username = ? OR email = ?
      `).get(identifier, identifier);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Tên đăng nhập hoặc mật khẩu không chính xác'
        });
      }

      const isValid = verifyPassword(password, user.password_hash, user.salt);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Tên đăng nhập hoặc mật khẩu không chính xác'
        });
      }

      // Fetch Profile
      const profile = db.prepare(`
        SELECT * FROM user_profile 
        WHERE user_id = ? OR id = ? OR (id = 'default_user' AND ? = 'admin_master_user_id')
        ORDER BY CASE WHEN id = ? THEN 1 WHEN user_id = ? THEN 2 ELSE 3 END
        LIMIT 1
      `).get(user.id, user.id, user.id, user.id, user.id) || {
        total_xp: 150,
        current_level: 1,
        title: 'Novice Scholar 🌱',
        streak_record: 0
      };

      const streakInfo = calculateUserStreak(db, user.id);

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        native_language: user.native_language || 'en',
        target_language: user.target_language || 'en',
        target_language_locked: Boolean(user.target_language_locked),
        profile: {
          total_xp: profile.total_xp,
          current_level: profile.current_level,
          title: profile.title,
          streak_record: streakInfo.maxStreak,
          streak: streakInfo.currentStreak,
          current_streak: streakInfo.currentStreak,
          max_streak: streakInfo.maxStreak
        },
        created_at: user.created_at
      };

      const token = generateToken({ 
        id: user.id, 
        username: user.username, 
        role: user.role,
        native_language: user.native_language || 'en',
        target_language: user.target_language || 'en'
      });

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: { user: userResponse, token }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Guest / Demo Login (1-Click)
  guestLogin: (req, res) => {
    try {
      // Ensure master guest / demo user exists
      let guest = db.prepare("SELECT * FROM users WHERE username = 'demo_scholar' OR role = 'guest'").get();

      if (!guest) {
        const { hash, salt } = hashPassword('demo1234');
        const guestId = 'guest_demo_user_id';
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO users (id, username, email, password_hash, salt, full_name, avatar_url, role, native_language, target_language, created_at, updated_at)
          VALUES (?, 'demo_scholar', 'guest@linguavault.local', ?, ?, 'Demo Scholar (Khách)', '🚀', 'guest', 'en', 'en', ?, ?)
        `).run(guestId, hash, salt, now, now);

        db.prepare(`
          INSERT OR REPLACE INTO user_profile (id, user_id, total_xp, current_level, title, streak_record, updated_at)
          VALUES (?, ?, 250, 2, 'Curious Explorer 🚀', 3, ?)
        `).run(guestId, guestId, now);

        guest = db.prepare("SELECT * FROM users WHERE id = ?").get(guestId);
      }

      const profile = db.prepare(`
        SELECT * FROM user_profile WHERE user_id = ? OR id = ?
      `).get(guest.id, guest.id) || {
        total_xp: 250,
        current_level: 2,
        title: 'Curious Explorer 🚀',
        streak_record: 0
      };

      const streakInfo = calculateUserStreak(db, guest.id);

      const userResponse = {
        id: guest.id,
        username: guest.username,
        email: guest.email,
        full_name: guest.full_name,
        avatar_url: guest.avatar_url,
        role: guest.role,
        native_language: guest.native_language || 'en',
        target_language: guest.target_language || 'en',
        target_language_locked: true,
        profile: {
          total_xp: profile.total_xp,
          current_level: profile.current_level,
          title: profile.title,
          streak_record: streakInfo.maxStreak,
          streak: streakInfo.currentStreak,
          current_streak: streakInfo.currentStreak,
          max_streak: streakInfo.maxStreak
        },
        created_at: guest.created_at
      };

      const token = generateToken({ 
        id: guest.id, 
        username: guest.username, 
        role: guest.role,
        native_language: guest.native_language || 'en',
        target_language: guest.target_language || 'en'
      });

      res.json({
        success: true,
        message: 'Đăng nhập với tư cách Khách thành công',
        data: { user: userResponse, token }
      });
    } catch (err) {
      console.error('Guest login error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Get Current User (Me)
  getMe: (req, res) => {
    try {
      const authUser = req.user;
      if (!authUser || !authUser.id) {
        return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc phiên đã hết hạn' });
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(authUser.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
      }

      const profile = db.prepare(`
        SELECT * FROM user_profile 
        WHERE user_id = ? OR id = ? OR (id = 'default_user' AND ? = 'admin_master_user_id')
        ORDER BY CASE WHEN id = ? THEN 1 WHEN user_id = ? THEN 2 ELSE 3 END
        LIMIT 1
      `).get(user.id, user.id, user.id, user.id, user.id) || {
        total_xp: 150,
        current_level: 1,
        title: 'Novice Scholar 🌱',
        streak_record: 0
      };

      const streakInfo = calculateUserStreak(db, user.id);

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        native_language: user.native_language || 'en',
        target_language: user.target_language || 'en',
        target_language_locked: Boolean(user.target_language_locked),
        profile: {
          total_xp: profile.total_xp,
          current_level: profile.current_level,
          title: profile.title,
          streak_record: streakInfo.maxStreak,
          streak: streakInfo.currentStreak,
          current_streak: streakInfo.currentStreak,
          max_streak: streakInfo.maxStreak
        },
        created_at: user.created_at
      };

      res.json({ success: true, data: userResponse });
    } catch (err) {
      console.error('GetMe error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Update Profile
  updateProfile: (req, res) => {
    try {
      const authUser = req.user;
      if (!authUser || !authUser.id) {
        return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(authUser.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
      }

      const { full_name, avatar_url, current_password, new_password, native_language, target_language } = req.body;
      const now = new Date().toISOString();

      let newHash = user.password_hash;
      let newSalt = user.salt;

      // Handle password change if requested
      if (new_password) {
        if (!current_password) {
          return res.status(400).json({ success: false, error: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu' });
        }
        const isMatch = verifyPassword(current_password, user.password_hash, user.salt);
        if (!isMatch) {
          return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không đúng' });
        }
        if (new_password.length < 4) {
          return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có ít nhất 4 ký tự' });
        }
        const updatedCrypto = hashPassword(new_password);
        newHash = updatedCrypto.hash;
        newSalt = updatedCrypto.salt;
      }

      const updatedName = full_name !== undefined ? full_name.trim() : user.full_name;
      // Fluent / Native language is permanently locked upon account creation
      const updatedNative = user.native_language || 'en';

      // Target learning language lock enforcement:
      // If user hasn't locked target language yet (e.g. 2-step onboarding Step 2), allow setting it and lock it permanently.
      // If already locked, target_language CANNOT be modified.
      let updatedTarget = user.target_language || 'en';
      let targetLocked = user.target_language_locked ? 1 : 0;

      if (!targetLocked && target_language && ['en', 'vi'].includes(target_language)) {
        updatedTarget = target_language;
        targetLocked = 1;
      }

      db.prepare(`
        UPDATE users SET
          full_name = ?,
          avatar_url = ?,
          native_language = ?,
          target_language = ?,
          target_language_locked = ?,
          password_hash = ?,
          salt = ?,
          updated_at = ?
        WHERE id = ?
      `).run(updatedName, updatedAvatar, updatedNative, updatedTarget, targetLocked, newHash, newSalt, now, user.id);

      const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      res.json({
        success: true,
        message: 'Cập nhật thông tin thành công',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          avatar_url: updatedUser.avatar_url,
          role: updatedUser.role,
          native_language: updatedUser.native_language || 'en',
          target_language: updatedUser.target_language || 'en',
          target_language_locked: Boolean(updatedUser.target_language_locked)
        }
      });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 6. Logout
  logout: (req, res) => {
    res.json({ success: true, message: 'Đăng xuất thành công' });
  }
};
