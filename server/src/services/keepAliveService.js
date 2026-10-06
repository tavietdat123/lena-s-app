import { config } from '../config.js';

let keepAliveTimer = null;

export const keepAliveService = {
  start: () => {
    // Priority: process.env.KEEP_ALIVE_URL > process.env.RENDER_EXTERNAL_URL
    const targetUrl = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL;

    if (!targetUrl) {
      console.log('💤 [KeepAlive] No KEEP_ALIVE_URL or RENDER_EXTERNAL_URL found. Self-ping idle (local mode).');
      return;
    }

    const cleanBaseUrl = targetUrl.replace(/\/+$/, '');
    const healthUrl = cleanBaseUrl.endsWith('/api/health') 
      ? cleanBaseUrl 
      : `${cleanBaseUrl}/api/health`;

    console.log(`🛡️ [KeepAlive] Anti-Sleep Engine activated! Targeting: ${healthUrl}`);

    // Ping 30 seconds after boot
    setTimeout(() => {
      pingHealth(healthUrl);
    }, 30_000);

    // Ping every 12 minutes (Render free tier spins down after 15m of inactivity)
    const INTERVAL_MS = 12 * 60 * 1000;
    keepAliveTimer = setInterval(() => {
      pingHealth(healthUrl);
    }, INTERVAL_MS);
  },

  stop: () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  }
};

async function pingHealth(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'LinguaVault-KeepAlive/2.0'
      }
    });
    if (res.ok) {
      console.log(`⏱️ [KeepAlive] Ping OK: ${url} (HTTP ${res.status}) - Render sleep timer reset!`);
    } else {
      console.warn(`⚠️ [KeepAlive] Ping returned status: ${res.status}`);
    }
  } catch (err) {
    console.warn(`⚠️ [KeepAlive] Failed to ping ${url}:`, err.message);
  }
}
