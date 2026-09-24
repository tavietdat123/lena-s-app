import { backupService } from '../services/backupService.js';

export const backupController = {
  // 1. Export entire Vault to JSON for specific account
  exportData: (req, res) => {
    try {
      const userId = req.user?.id || req.query.userId || 'admin_master_user_id';
      const backup = backupService.buildBackupPayload(userId);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="lingua_vault_backup_${new Date().toISOString().split('T')[0]}.json"`);
      return res.json(backup);
    } catch (err) {
      console.error('[Backup Export Error]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Import and restore data from JSON for specific account
  importData: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const raw = req.body?.data || req.body;
      const result = backupService.restoreBackupPayload(raw, userId);
      return res.json(result);
    } catch (err) {
      console.error('[Backup Import Error]', err);
      return res.status(400).json({ success: false, error: 'Lỗi khôi phục: ' + err.message });
    }
  }
};
