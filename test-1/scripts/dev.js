import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const api = spawn(process.execPath, [resolve(root, 'backend/server.js')], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    HOST: '127.0.0.1',
    API_PORT: process.env.API_PORT || '8787',
    ALLOW_LOCAL_TARGETS: process.env.ALLOW_LOCAL_TARGETS || '1'
  }
});
const vite = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill('SIGTERM');
  vite.kill('SIGTERM');
  process.exitCode = code;
}
api.on('error', error => {
  process.stderr.write('Could not start the scan backend: ' + error.message + '\n');
  stop(1);
});
vite.on('error', error => {
  process.stderr.write('Could not start Vite: ' + error.message + '\n');
  stop(1);
});
api.on('exit', code => {
  if (!stopping) {
    process.stderr.write('The scan backend stopped.\n');
    stop(code || 1);
  }
});
vite.on('exit', code => {
  if (!stopping) stop(code || 0);
});
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
