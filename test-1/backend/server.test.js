import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const serverFile = fileURLToPath(new URL('./server.js', import.meta.url));
const port = 18787 + Math.floor(Math.random() * 500);
const apiUrl = 'http://127.0.0.1:' + port;
let backend;
let targetServer;

async function waitForBackend() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(apiUrl + '/api/health');
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Backend did not become ready in time.');
}

test('local scan engine checks source code, website headers and request authorization', async t => {
  backend = spawn(process.execPath, [serverFile], {
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      API_PORT: String(port),
      ALLOW_LOCAL_TARGETS: '1'
    },
    stdio: 'ignore'
  });
  t.after(() => {
    if (backend && !backend.killed) backend.kill('SIGTERM');
    if (targetServer) targetServer.close();
  });

  await waitForBackend();

  const sourceFiles = [{
    path: 'server.js',
    size: 420,
    content: [
      "const url = new URL(req.url, 'http://localhost');",
      "if (req.method === 'GET' && url.pathname.startsWith('/api/orders/')) {",
      '  const id = url.pathname.split(\'/\').pop();',
      '  const order = orders.find(item => item.id === id);',
      '  sendJson(res, 200, order);',
      '}',
      "if (req.method === 'POST' && url.pathname === '/api/products/1/update') {",
      '  const body = await readBody(req);',
      '  product.price = body.price;',
      '}',
      "if (req.method === 'POST' && url.pathname === '/api/checkout') {",
      '  const body = await readBody(req);',
      '  const total = body.unitPrice * body.quantity;',
      '  sendJson(res, 200, { total });',
      '}'
    ].join('\n')
  }];

  const sourceResponse = await fetch(apiUrl + '/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      authorized: true,
      projectName: 'Demo dress shop',
      scenario: 'Small business',
      targetKind: 'source',
      sourceFiles,
      permissions: [{
        role: 'customer',
        title: 'View other customers’ orders',
        description: 'Access other customers’ purchase records.',
        enabled: true,
        risk: 'Critical'
      }]
    })
  });
  assert.equal(sourceResponse.status, 200);
  const sourceResult = await sourceResponse.json();
  const findingIds = sourceResult.findings.map(item => item.id);
  assert.ok(findingIds.includes('POSSIBLE_IDOR'), 'expected IDOR-style route hint');
  assert.ok(findingIds.includes('CLIENT_CONTROLLED_PRICE'), 'expected client-controlled price hint');
  assert.ok(findingIds.includes('RISKY_PERMISSION_GRANT'), 'expected risky customer permission hint');

  const deniedResponse = await fetch(apiUrl + '/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ authorized: false, targetKind: 'source', sourceFiles })
  });
  assert.equal(deniedResponse.status, 403);

  const crossOriginResponse = await fetch(apiUrl + '/api/scan', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://not-your-local-app.example'
    },
    body: JSON.stringify({ authorized: true, targetKind: 'source', sourceFiles })
  });
  assert.equal(crossOriginResponse.status, 403);

  targetServer = createServer((req, res) => {
    res.writeHead(200, {
      'content-type': 'text/html',
      'content-security-policy': "default-src 'self'",
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff'
    });
    res.end('local test page');
  });
  await new Promise(resolve => targetServer.listen(0, '127.0.0.1', resolve));
  const targetPort = targetServer.address().port;
  const websiteResponse = await fetch(apiUrl + '/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      authorized: true,
      projectName: 'Local website fixture',
      scenario: 'Small business',
      targetKind: 'website',
      url: 'http://127.0.0.1:' + targetPort,
      permissions: []
    })
  });
  assert.equal(websiteResponse.status, 200);
  const websiteResult = await websiteResponse.json();
  assert.equal(websiteResult.target.statusCode, 200);
  assert.ok(websiteResult.checks.some(item => item.id === 'reachability' && item.status === 'pass'));
  assert.ok(websiteResult.findings.some(item => item.id === 'HTTPS_NOT_ENFORCED'));
});
