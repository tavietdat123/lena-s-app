import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
=====================================================
🚀 KHỞI ĐỘNG HỆ THỐNG LINGUAVAULT V2 (SERVER + WEB)
   • Server API: http://localhost:5002
   • Web Client: http://localhost:3001
   • DB:         server/data/lingua_vault_v2.db
=====================================================
`);

// 1. Start Server API (Port 5002)
const server = spawn('node', ['src/index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5002' }
});

// 2. Start Vite Web Client (Port 3001)
const web = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'web'),
  stdio: 'inherit',
  shell: true
});

// Graceful shutdown
const cleanup = () => {
  console.log('\n🛑 Đang dừng toàn bộ dịch vụ LinguaVault v2...');
  server.kill('SIGINT');
  web.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
