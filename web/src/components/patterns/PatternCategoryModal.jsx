import React, { useState } from "react";
import { X, Plus, Edit2, Trash2, Layers, Check, AlertCircle, RotateCcw } from "lucide-react";
import { api } from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";
import { getCategoryLabel } from "../../constants/patternCategories";

const COLOR_PRESETS = [
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#ec4899", // Pink
  "#6366f1"  // Indigo
];

const EMOJI_SUGGESTIONS = ["💥", "⚖️", "🎯", "⚠️", "💬", "⏳", "⏰", "🎓", "💼", "☕", "🔥", "💡", "🧠", "✨", "📚", "🚀"];

export default function PatternCategoryModal({ isOpen, categories = [], onClose, onCategoriesChange }) {
  const { t, uiLang, fluentLanguage } = useLanguage();
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧩");
  const [color, setColor] = useState("#8b5cf6");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingCategory(null);
    setName("");
    setEmoji("🧩");
    setColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
    setDescription("");
    setErrorMsg("");
    setShowAddForm(true);
  };

  const handleStartEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setEmoji(cat.emoji || "🧩");
    setColor(cat.color || "#8b5cf6");
    setDescription(cat.description || "");
    setErrorMsg("");
    setShowAddForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(t.patterns?.categoryNameLabel ? `${t.patterns.categoryNameLabel.replace('*', '').trim()}` : "Vui lòng nhập tên chức năng");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      name: name.trim(),
      emoji: emoji || "🧩",
      color: color || "#8b5cf6",
      description: description.trim()
    };

    try {
      let res;
      if (editingCategory) {
        res = await api.updatePatternCategory(editingCategory.id, payload);
      } else {
        res = await api.createPatternCategory(payload);
      }

      if (res.success) {
        setShowAddForm(false);
        setEditingCategory(null);
        if (onCategoriesChange) onCategoriesChange();
      } else {
        setErrorMsg(res.error || (t?.common?.error || "Error"));
      }
    } catch (err) {
      setErrorMsg(err.message || (t?.common?.error || "Error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const confirmText = typeof t.patterns?.deleteCategoryConfirm === 'function'
      ? t.patterns.deleteCategoryConfirm(cat.name)
      : `Delete category "${cat.name}"?`;
    if (!window.confirm(confirmText)) {
      return;
    }

    try {
      const res = await api.deletePatternCategory(cat.id);
      if (res.success) {
        if (onCategoriesChange) onCategoriesChange();
      } else {
        alert(res.error || (t?.common?.error || "Error"));
      }
    } catch (err) {
      alert((t?.common?.error || "Error") + err.message);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm(t?.patterns?.reset18ConfirmPrompt || "Reset to 18 default categories?")) return;
    setIsResetting(true);
    setErrorMsg("");
    try {
      const res = await api.resetPatternCategories();
      if (res.success) {
        if (onCategoriesChange) onCategoriesChange();
      } else {
        setErrorMsg(res.error || (t?.common?.error || "Error"));
      }
    } catch (err) {
      setErrorMsg(err.message || (t?.common?.error || "Error"));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: "680px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Modal Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "rgba(236, 72, 153, 0.15)",
              color: "#ec4899",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                {t?.patterns?.manageCategoriesBtn || "Manage Categories"}
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {t?.patterns?.subtitle || "Functional grammar structures in context"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ padding: "0.45rem" }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.25rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Top Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              {categories.length} {t.patterns?.patternsCountUnit || t?.common?.tags || "Tags"}
            </span>
            {!showAddForm && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button 
                  type="button" 
                  onClick={handleResetDefaults} 
                  disabled={isResetting} 
                  className="btn-secondary" 
                  style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  title="Reset"
                >
                  <RotateCcw size={14} className={isResetting ? "animate-spin" : ""} />
                  <span>{isResetting ? (t?.common?.loading || "Loading...") : (t?.common?.reset || "Reset")}</span>
                </button>
                <button onClick={handleStartCreate} className="btn-primary" style={{ padding: "0.45rem 0.9rem", fontSize: "0.85rem" }}>
                  <Plus size={16} />
                  <span>{t?.common?.new || "NEW"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Add / Edit Form */}
          {showAddForm && (
            <form 
              onSubmit={handleSave} 
              style={{
                background: "var(--bg-secondary)",
                padding: "1.25rem",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-color)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent-primary)" }}>
                  {editingCategory ? (t?.common?.edit || "Edit") : (t?.common?.new || "NEW")}
                </h4>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none" }}
                >
                  {t?.common?.cancel || "Cancel"}
                </button>
              </div>

              {errorMsg && (
                <div style={{ padding: "0.6rem 0.8rem", borderRadius: "var(--radius-md)", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Name & Emoji */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    {t?.patterns?.categoryIconLabel || "Icon:"}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    style={{ textAlign: "center", fontSize: "1.2rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    {t?.patterns?.categoryNameLabel || "Category Name:"}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder={t?.patterns?.categoryNamePlaceholder || "e.g. Emphasis & Inversion..."}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Emoji quick pick */}
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                  {t?.patterns?.categoryIconHint || "Suggested: ⚡, 🎯, ⚠️, ⚖️, 📊"}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {EMOJI_SUGGESTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      style={{
                        padding: "0.3rem 0.5rem",
                        borderRadius: "var(--radius-md)",
                        border: emoji === em ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)",
                        background: emoji === em ? "var(--accent-primary-light)" : "var(--bg-tertiary)",
                        cursor: "pointer",
                        fontSize: "1rem"
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                  {t?.patterns?.categoryColorLabel || "Color:"}
                </label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: c,
                        border: color === c ? "3px solid #ffffff" : "2px solid transparent",
                        boxShadow: color === c ? "0 0 0 2px " + c : "none",
                        cursor: "pointer"
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                  {t?.patterns?.categoryDescLabel || "Description:"}
                </label>
                <textarea
                  className="input-control"
                  rows={2}
                  placeholder={t?.patterns?.categoryDescPlaceholder || "Short description..."}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}>
                  {t?.common?.cancel || "Cancel"}
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving} style={{ padding: "0.45rem 1.25rem", fontSize: "0.85rem" }}>
                  {isSaving ? (t?.common?.loading || "Loading...") : editingCategory ? (t?.common?.save || "Save") : (t?.common?.new || "NEW")}
                </button>
              </div>
            </form>
          )}

          {/* Categories List */}
          {categories.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "2.5rem 1.5rem",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border-color)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <Layers size={36} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                  {t?.patterns?.emptyCategoriesTitle || "No categories yet"}
                </h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {t?.patterns?.emptyCategoriesDesc || "Create a new category or load defaults."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={isResetting}
                className="btn-primary"
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <RotateCcw size={15} className={isResetting ? "animate-spin" : ""} />
                <span>{t?.patterns?.reset18CategoriesBtn || "Load 18 Defaults"}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {categories.map(cat => (
              <div
                key={cat.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.85rem 1rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-color)",
                  gap: "1rem"
                }}
              >
                {/* Left info */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flex: 1 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--radius-md)",
                    background: (cat.color || "#8b5cf6") + "18",
                    color: cat.color || "#8b5cf6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    flexShrink: 0
                  }}>
                    {cat.emoji || "🧩"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: 0 }}>{getCategoryLabel(cat, fluentLanguage)}</h4>
                      <span style={{
                        padding: "0.15rem 0.5rem",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: (cat.color || "#8b5cf6") + "15",
                        color: cat.color || "#8b5cf6"
                      }}>
                        {cat.patterns_count || 0} {t?.patterns?.patternsCountUnit || "patterns"}
                      </span>
                    </div>
                    {cat.description && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.2rem 0 0 0", lineHeight: 1.3 }}>
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  {cat.is_system ? (
                    <span style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--bg-tertiary)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      🔒 {uiLang === 'vi' ? 'Cố định' : 'Fixed'}
                    </span>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleStartEdit(cat)} 
                        className="btn-icon" 
                        title={t?.patterns?.editPatternTooltip || "Edit pattern"}
                        style={{ padding: "0.4rem" }}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cat)} 
                        className="btn-icon" 
                        title={t?.patterns?.deletePatternTooltip || "Delete pattern"}
                        style={{ padding: "0.4rem", color: "var(--accent-danger)" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: "0.5rem 1.25rem" }}>
            {t?.common?.close || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
