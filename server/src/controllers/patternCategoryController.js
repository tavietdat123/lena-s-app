import { db, ensureDefaultPatternCategories, defaultPatternCategories } from "../db/database.js";
import crypto from "node:crypto";

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .slice(0, 32);
}

export const patternCategoryController = {
  // 1. Get all pattern categories with dynamic patterns count
  getAllCategories: (req, res) => {
    try {
      let categories = db.prepare("SELECT * FROM pattern_categories ORDER BY created_at ASC").all();

      // Auto-heal / seed if empty (crucial for production DBs initialized before categories were added)
      if (!categories || categories.length === 0) {
        ensureDefaultPatternCategories(db);
        categories = db.prepare("SELECT * FROM pattern_categories ORDER BY created_at ASC").all();
      }

      const countStmt = db.prepare(`
        SELECT category, COUNT(*) as count 
        FROM patterns 
        GROUP BY category
      `);
      const counts = countStmt.all();
      const countMap = {};
      counts.forEach(c => {
        if (c.category) countMap[c.category] = c.count;
      });

      const enriched = (categories || []).map(c => ({
        ...c,
        patterns_count: countMap[c.id] || 0
      }));

      res.json({ success: true, data: enriched });
    } catch (err) {
      console.error('getAllCategories error:', err);
      // Resilient fallback: return default categories with 0 count rather than breaking the UI
      res.json({
        success: true,
        data: defaultPatternCategories.map(c => ({ ...c, patterns_count: 0 }))
      });
    }
  },

  // 2. Create new category
  createCategory: (req, res) => {
    try {
      const { name, emoji = "🧩", color = "#8b5cf6", description = "" } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: "Tên chức năng là bắt buộc" });
      }

      let cleanSlug = slugify(name);
      if (!cleanSlug || cleanSlug.replace(/_/g, '').length === 0) {
        cleanSlug = 'cat_' + crypto.randomUUID().slice(0, 8);
      }

      let id = cleanSlug;
      const existingId = db.prepare("SELECT id FROM pattern_categories WHERE id = ?").get(id);
      if (existingId) {
        id = `${cleanSlug}_${crypto.randomUUID().slice(0, 4)}`;
      }

      const existingName = db.prepare("SELECT id FROM pattern_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))").get(name.trim());
      if (existingName) {
        return res.status(400).json({ success: false, error: "Chức năng với tên này đã tồn tại" });
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO pattern_categories (id, name, emoji, color, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, name.trim(), emoji || "🧩", color || "#8b5cf6", description ? description.trim() : "", now, now);

      res.status(201).json({
        success: true,
        message: "Tạo chức năng diễn đạt thành công",
        data: { id, name: name.trim(), emoji: emoji || "🧩", color: color || "#8b5cf6", description: description ? description.trim() : "", patterns_count: 0 }
      });
    } catch (err) {
      console.error('createCategory error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Update category
  updateCategory: (req, res) => {
    try {
      const { id } = req.params;
      const { name, emoji, color, description } = req.body;

      const category = db.prepare("SELECT * FROM pattern_categories WHERE id = ?").get(id);
      if (!category) {
        return res.status(404).json({ success: false, error: "Không tìm thấy chức năng" });
      }

      if (name && name.trim()) {
        const duplicate = db.prepare("SELECT id FROM pattern_categories WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?").get(name.trim(), id);
        if (duplicate) {
          return res.status(400).json({ success: false, error: "Tên chức năng này đã được sử dụng" });
        }
      }

      const now = new Date().toISOString();
      const updatedName = name && name.trim() ? name.trim() : category.name;
      const updatedEmoji = emoji !== undefined ? emoji : category.emoji;
      const updatedColor = color !== undefined ? color : category.color;
      const updatedDesc = description !== undefined ? description.trim() : category.description;

      const stmt = db.prepare(`
        UPDATE pattern_categories SET
          name = ?,
          emoji = ?,
          color = ?,
          description = ?,
          updated_at = ?
        WHERE id = ?
      `);

      stmt.run(updatedName, updatedEmoji, updatedColor, updatedDesc, now, id);

      res.json({
        success: true,
        message: "Cập nhật chức năng thành công",
        data: { id, name: updatedName, emoji: updatedEmoji, color: updatedColor, description: updatedDesc }
      });
    } catch (err) {
      console.error('updateCategory error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Delete category
  deleteCategory: (req, res) => {
    try {
      const { id } = req.params;

      const category = db.prepare("SELECT * FROM pattern_categories WHERE id = ?").get(id);
      if (!category) {
        return res.status(404).json({ success: false, error: "Không tìm thấy chức năng" });
      }

      // Reassign patterns to fallback 'emphasis' category (FIX: using 'emphasis' single quotes literal)
      db.prepare("UPDATE patterns SET category = 'emphasis' WHERE category = ?").run(id);

      db.prepare("DELETE FROM pattern_categories WHERE id = ?").run(id);

      res.json({ success: true, message: "Đã xóa chức năng diễn đạt và cập nhật mẫu câu liên quan" });
    } catch (err) {
      console.error('deleteCategory error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Reset to default categories
  resetToDefaults: (req, res) => {
    try {
      ensureDefaultPatternCategories(db);
      const categories = db.prepare("SELECT * FROM pattern_categories ORDER BY created_at ASC").all();
      res.json({
        success: true,
        message: "Đã khôi phục toàn bộ danh mục chức năng mặc định",
        data: categories
      });
    } catch (err) {
      console.error('resetToDefaults error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
