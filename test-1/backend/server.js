import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = resolve(ROOT, 'dist');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.API_PORT || 8787);
const ALLOW_LOCAL_TARGETS = process.env.ALLOW_LOCAL_TARGETS === '1';
const MAX_BODY = 15 * 1024 * 1024;
const MAX_FILES = 250;
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(body);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('Request is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 });
  }
}

function isPrivateIp(address) {
  const family = net.isIP(address);
  if (family === 4) {
    const p = address.split('.').map(Number);
    return p[0] === 0 || p[0] === 10 || p[0] === 127 ||
      (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      (p[0] === 192 && p[1] === 0 && p[2] === 0) ||
      (p[0] === 198 && (p[1] === 18 || p[1] === 19)) ||
      p[0] >= 224;
  }
  if (family === 6) {
    const a = address.toLowerCase();
    if (a.startsWith('::ffff:')) {
      const mapped = a.slice(7);
      return net.isIP(mapped) === 4 ? isPrivateIp(mapped) : true;
    }
    return a === '::' || a === '::1' || a.startsWith('fc') ||
      a.startsWith('fd') || a.startsWith('fe80:') || a.startsWith('ff');
  }
  return true;
}

async function validateTarget(url) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS website URLs are supported.');
  if (url.username || url.password) throw new Error('Do not include a username or password in the website URL.');
  if (url.hash) url.hash = '';
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const localName = hostname === 'localhost' || hostname.endsWith('.localhost');
  const localIp = net.isIP(hostname) && isPrivateIp(hostname);
  const isLocal = localName || localIp;
  if (isLocal && !ALLOW_LOCAL_TARGETS) {
    throw new Error('Local/private network targets are disabled on this server. Use the bundled local development command for your own local demo.');
  }
  if (!isLocal && url.port && !['80', '443'].includes(url.port)) {
    throw new Error('For safety, public website checks use only standard HTTP/HTTPS ports.');
  }
  if (!net.isIP(hostname) && !localName) {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(item => isPrivateIp(item.address))) {
      throw new Error('The website hostname resolves to a private or non-public network address, so it was not scanned.');
    }
  } else if (net.isIP(hostname) && !isLocal && isPrivateIp(hostname)) {
    throw new Error('Private network addresses are not scanned.');
  }
}

function addCheck(checks, id, title, status, detail) {
  checks.push({ id, title, status, detail });
}

function addFinding(findings, item) {
  findings.push({
    id: item.id,
    title: item.title,
    severity: item.severity,
    category: item.category,
    location: item.location || 'Website response',
    evidence: item.evidence || '',
    explanation: item.explanation,
    recommendation: item.recommendation
  });
}

async function inspectWebsite(rawUrl) {
  let current;
  try {
    current = new URL(rawUrl);
  } catch {
    throw new Error('Enter a valid website URL, including its domain name.');
  }

  let response;
  let redirects = 0;
  const originalUrl = current.toString();
  while (redirects <= 3) {
    await validateTarget(current);
    response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'user-agent': 'CanTheySeeIt-SafeCheck/1.0',
        'range': 'bytes=0-0'
      },
      signal: AbortSignal.timeout(8000)
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel().catch(() => {});
      if (!location) break;
      if (redirects === 3) throw new Error('The website redirected too many times; the check was stopped.');
      current = new URL(location, current);
      redirects += 1;
      continue;
    }
    break;
  }
  if (!response) throw new Error('The website did not return a response.');
  const headers = response.headers;
  await response.body?.cancel().catch(() => {});

  const checks = [];
  const findings = [];
  const isHttps = current.protocol === 'https:';
  addCheck(checks, 'reachability', 'Website responds', response.status < 500 ? 'pass' : 'warn',
    'Received HTTP ' + response.status + ' from ' + current.hostname + '.');
  if (response.status >= 500) {
    addFinding(findings, {
      id: 'WEBSITE_SERVER_ERROR', title: 'Website returned a server error', severity: 'medium', category: 'Availability',
      evidence: 'HTTP ' + response.status, explanation: 'The homepage returned a 5xx response during this check.',
      recommendation: 'Review application and hosting logs to identify the failing request.'
    });
  }

  addCheck(checks, 'https', 'HTTPS connection', isHttps ? 'pass' : 'warn',
    isHttps ? 'The final response used HTTPS.' : 'The website did not end on HTTPS.');
  if (!isHttps) addFinding(findings, {
    id: 'HTTPS_NOT_ENFORCED', title: 'Website is not using HTTPS', severity: 'high', category: 'Transport security',
    evidence: current.protocol + ' URL', explanation: 'Traffic to this page may be exposed or modified in transit.',
    recommendation: 'Enable a valid TLS certificate and redirect HTTP traffic to HTTPS.'
  });

  const csp = headers.get('content-security-policy');
  addCheck(checks, 'csp', 'Content Security Policy', csp ? 'pass' : 'warn',
    csp ? 'A Content-Security-Policy response header was found.' : 'No Content-Security-Policy header was observed.');
  if (!csp) addFinding(findings, {
    id: 'MISSING_CSP', title: 'Content Security Policy header is missing', severity: 'medium', category: 'Browser protection',
    explanation: 'A CSP can reduce the impact of some cross-site scripting and content-injection issues.',
    recommendation: 'Define a restrictive Content-Security-Policy and test it in report-only mode before enforcement.'
  });

  const hsts = headers.get('strict-transport-security');
  addCheck(checks, 'hsts', 'HTTP Strict Transport Security', isHttps && hsts ? 'pass' : (isHttps ? 'warn' : 'info'),
    isHttps ? (hsts ? 'Strict-Transport-Security was found.' : 'No HSTS header was observed.') : 'HSTS is evaluated only after HTTPS is enabled.');
  if (isHttps && !hsts) addFinding(findings, {
    id: 'MISSING_HSTS', title: 'HSTS header is missing', severity: 'medium', category: 'Transport security',
    explanation: 'Browsers are not being instructed to prefer HTTPS for future visits to this host.',
    recommendation: 'After confirming HTTPS works across the site, add a suitable Strict-Transport-Security header.'
  });

  const nosniff = headers.get('x-content-type-options');
  addCheck(checks, 'nosniff', 'MIME-sniffing protection', nosniff && nosniff.toLowerCase() === 'nosniff' ? 'pass' : 'warn',
    nosniff || 'No X-Content-Type-Options header was observed.');
  if (!nosniff || nosniff.toLowerCase() !== 'nosniff') addFinding(findings, {
    id: 'MISSING_NOSNIFF', title: 'MIME-sniffing protection is missing', severity: 'low', category: 'Browser protection',
    explanation: 'The response does not explicitly tell browsers to avoid MIME-type sniffing.',
    recommendation: 'Set X-Content-Type-Options: nosniff.'
  });

  const frame = headers.get('x-frame-options');
  const framePolicy = csp && /frame-ancestors/i.test(csp);
  addCheck(checks, 'framing', 'Clickjacking protection', (frame || framePolicy) ? 'pass' : 'warn',
    frame ? 'X-Frame-Options was found.' : framePolicy ? 'CSP frame-ancestors was found.' : 'No frame restriction was observed.');
  if (!frame && !framePolicy) addFinding(findings, {
    id: 'MISSING_FRAME_GUARD', title: 'No clickjacking frame restriction was observed', severity: 'medium', category: 'Browser protection',
    explanation: 'The response does not expose X-Frame-Options or CSP frame-ancestors.',
    recommendation: 'Set an appropriate frame-ancestors CSP directive or X-Frame-Options header.'
  });

  const referrer = headers.get('referrer-policy');
  addCheck(checks, 'referrer', 'Referrer-Policy', referrer ? 'pass' : 'warn', referrer || 'No Referrer-Policy header was observed.');
  if (!referrer) addFinding(findings, {
    id: 'MISSING_REFERRER_POLICY', title: 'Referrer-Policy header is missing', severity: 'low', category: 'Privacy',
    explanation: 'The browser has no explicit site-wide referrer policy from this response.',
    recommendation: 'Set a policy such as strict-origin-when-cross-origin, based on the application requirements.'
  });

  const permissionsPolicy = headers.get('permissions-policy');
  addCheck(checks, 'permissions-policy', 'Permissions-Policy', permissionsPolicy ? 'pass' : 'info',
    permissionsPolicy || 'No Permissions-Policy header was observed.');
  if (!permissionsPolicy) addFinding(findings, {
    id: 'MISSING_PERMISSIONS_POLICY', title: 'Permissions-Policy header is missing', severity: 'info', category: 'Browser protection',
    explanation: 'The response does not declare browser feature restrictions.',
    recommendation: 'Consider restricting browser features such as camera, microphone and geolocation to the features your site actually needs.'
  });

  const xPowered = headers.get('x-powered-by');
  const server = headers.get('server');
  addCheck(checks, 'tech-disclosure', 'Technology banner disclosure', (!xPowered && !server) ? 'pass' : 'info',
    [xPowered ? 'X-Powered-By: ' + xPowered : '', server ? 'Server: ' + server : ''].filter(Boolean).join(' · ') || 'No technology banner was observed.');
  if (xPowered || (server && /\d/.test(server))) addFinding(findings, {
    id: 'TECH_BANNER_DISCLOSURE', title: 'Server technology details are exposed', severity: 'info', category: 'Information disclosure',
    evidence: [xPowered, server].filter(Boolean).join(' / '),
    explanation: 'The response reveals implementation or server details that may help fingerprint the stack.',
    recommendation: 'Remove unnecessary X-Powered-By and version details where practical.'
  });

  const setCookie = headers.get('set-cookie');
  if (setCookie) {
    const cookieFlags = [
      { name: 'Secure', present: /;\s*secure\b/i.test(setCookie) },
      { name: 'HttpOnly', present: /;\s*httponly\b/i.test(setCookie) },
      { name: 'SameSite', present: /;\s*samesite=/i.test(setCookie) }
    ];
    const missing = cookieFlags.filter(flag => !flag.present).map(flag => flag.name);
    addCheck(checks, 'cookie-flags', 'Observed cookie flags', missing.length ? 'warn' : 'pass',
      missing.length ? 'The observed Set-Cookie header did not show: ' + missing.join(', ') + '.' : 'The observed Set-Cookie header includes Secure, HttpOnly and SameSite.');
    if (missing.length) addFinding(findings, {
      id: 'COOKIE_FLAGS', title: 'An observed cookie may be missing security flags', severity: 'medium', category: 'Session security',
      evidence: 'Missing flags: ' + missing.join(', '),
      explanation: 'At least one cookie in the sampled response did not show all common session-cookie protections. Not every cookie necessarily requires every flag.',
      recommendation: 'Review each session cookie and set Secure, HttpOnly and an appropriate SameSite value where applicable.'
    });
  } else {
    addCheck(checks, 'cookie-flags', 'Observed cookie flags', 'info', 'The homepage did not send a Set-Cookie header, so cookie flags were not assessed.');
  }

  return {
    finalUrl: current.toString(),
    originalUrl,
    statusCode: response.status,
    checks,
    findings
  };
}

function findLine(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function sourceFinding(findings, file, source, offset, item) {
  const line = findLine(source, offset);
  const lines = source.split('\n');
  const evidence = (lines[line - 1] || '').trim().slice(0, 220);
  addFinding(findings, {
    ...item,
    location: file + ':' + line,
    evidence: evidence || item.evidence || ''
  });
}

function inspectSource(files) {
  const checks = [];
  const findings = [];
  const routePattern = /(?:app|router)\s*\.\s*(get|post|put|patch|delete)\s*\(\s*(['"])([^'"]+)\2/gi;
  let analyzedFiles = 0;
  let totalBytes = 0;

  for (const file of files) {
    if (!file || typeof file.path !== 'string' || typeof file.content !== 'string') continue;
    const path = file.path.replace(/\\/g, '/');
    if (path.startsWith('/') || path.split('/').includes('..')) continue;
    const source = file.content;
    totalBytes += Buffer.byteLength(source, 'utf8');
    if (totalBytes > MAX_SOURCE_BYTES) throw Object.assign(new Error('Source code exceeds the 12 MB analysis limit.'), { status: 413 });
    analyzedFiles += 1;

    const pricePattern = /(?:req|request)\s*\.\s*body\s*\.\s*(?:unitPrice|price)|(?:body|payload)\s*\.\s*(?:unitPrice|price)/i;
    const priceMatch = pricePattern.exec(source);
    if (priceMatch && /(checkout|payment|subtotal|total|order)/i.test(source.slice(Math.max(0, priceMatch.index - 700), priceMatch.index + 900))) {
      sourceFinding(findings, path, source, priceMatch.index, {
        id: 'CLIENT_CONTROLLED_PRICE',
        title: 'Checkout logic may trust a price supplied by the browser',
        severity: 'high',
        category: 'Business logic',
        explanation: 'A request-body price value appears near checkout or order-total logic. Browser-supplied prices can be changed by the customer.',
        recommendation: 'Look up product prices from trusted server-side data and calculate totals on the server. Treat client totals as display-only.'
      });
    }

    routePattern.lastIndex = 0;
    let match;
    while ((match = routePattern.exec(source)) !== null) {
      const method = match[1].toLowerCase();
      const route = match[3];
      const tail = source.slice(routePattern.lastIndex);
      const nextRoute = tail.search(/\n\s*(?:app|router)\s*\.\s*(?:get|post|put|patch|delete)\s*\(/i);
      const block = tail.slice(0, nextRoute >= 0 ? nextRoute : 1800);
      const idBasedRecordRoute = /\/(?:orders?|invoices?|profiles?|users?|records?|tickets?)\/:([a-z_]*id)\b/i.test(route);
      if (idBasedRecordRoute) {
        const ownershipCheck = /(?:ownerId|userId|customerId|createdBy|\.user\.id|req\.user\.id)[\s\S]{0,100}(?:===|==|!==|!=)|(?:===|==|!==|!=)[\s\S]{0,100}(?:ownerId|userId|customerId|createdBy|\.user\.id)/i.test(block);
        if (!ownershipCheck) sourceFinding(findings, path, source, match.index, {
          id: 'POSSIBLE_IDOR',
          title: 'Record-by-ID route may be missing an ownership check',
          severity: 'high',
          category: 'Access control',
          explanation: 'A route reads a user-related record by an ID in the URL, but the nearby handler did not show a clear record-owner comparison. This is a heuristic and needs manual verification.',
          recommendation: 'After loading the record, verify on the server that the authenticated user is allowed to access that specific record. Do not rely only on being logged in.'
        });
      }

      const mutating = ['post', 'put', 'patch', 'delete'].includes(method);
      const sensitiveRoute = /\/(?:admin|products?|users?|settings|payments?|inventory|orders?)\b/i.test(route);
      const hasRoleGuard = /(?:requireRole|authorize|hasPermission|isAdmin|checkRole|canAccess|assertPermission|role\s*===|permissions?\s*\.|accessControl)/i.test(match[0] + block);
      if (mutating && sensitiveRoute && !hasRoleGuard) sourceFinding(findings, path, source, match.index, {
        id: 'POSSIBLE_MISSING_ROLE_GUARD',
        title: 'Sensitive write route may lack a role or permission guard',
        severity: 'medium',
        category: 'Access control',
        explanation: 'A route that changes business data was found, but no common role/permission guard name was visible in its nearby handler. A guard may exist elsewhere, so verify the full middleware chain.',
        recommendation: 'Enforce authorization on the server for every write action. Check both the user role and whether that role can perform this exact operation.'
      });
    }

    const sqlMatch = /(?:SELECT|UPDATE|DELETE|INSERT)[\s\S]{0,180}(?:\$\{[^}]+\}|'\s*\+\s*(?:req|request)\.)/i.exec(source);
    if (sqlMatch) sourceFinding(findings, path, source, sqlMatch.index, {
      id: 'POSSIBLE_SQL_INJECTION',
      title: 'SQL query may be built using string interpolation or concatenation',
      severity: 'high',
      category: 'Input handling',
      explanation: 'A SQL statement appears to include dynamically concatenated or interpolated input.',
      recommendation: 'Use parameterized queries or a safely bound ORM query instead of building SQL with user-controlled strings.'
    });
  }

  addCheck(checks, 'source-files', 'Source files analysed', analyzedFiles ? 'pass' : 'warn',
    analyzedFiles + ' supported source file(s) reviewed; ' + Math.round(totalBytes / 1024) + ' KB of text processed.');
  addCheck(checks, 'source-scope', 'Static analysis only', 'info',
    'Files were inspected as text. CanTheySeeIt did not execute the project, install its dependencies or run its code.');
  addCheck(checks, 'source-limits', 'Heuristic coverage', findings.length ? 'warn' : 'info',
    findings.length ? 'Potential patterns were identified. Confirm each one in the application before treating it as a vulnerability.' : 'No configured pattern matched. This does not prove the application is secure.');
  return { checks, findings, analyzedFiles };
}

function inspectPermissions(permissions) {
  const checks = [];
  const findings = [];
  const enabled = Array.isArray(permissions) ? permissions.filter(item => item && item.enabled === true) : [];
  let reviewed = 0;
  const riskyWords = /\b(other|another|all customers|all users|all students|payroll|bank details|payout|manage all accounts|security settings|change everyone|all records)\b/i;

  for (const permission of enabled) {
    const role = String(permission.role || '').toLowerCase();
    const text = String(permission.title || '') + ' ' + String(permission.description || '');
    reviewed += 1;
    if (['owner', 'admin'].includes(role)) continue;
    if (riskyWords.test(text)) addFinding(findings, {
      id: 'RISKY_PERMISSION_GRANT',
      title: 'Sensitive permission is enabled for a non-owner role',
      severity: permission.risk === 'Critical' ? 'high' : 'medium',
      category: 'Permission policy',
      location: 'Role: ' + (permission.role || 'unknown') + ' · ' + (permission.title || 'Permission'),
      explanation: 'The enabled permission description suggests access to other users’ information, broad account control or sensitive business data.',
      recommendation: 'Confirm this access is required for the role. Prefer limiting it to assigned records or requiring owner approval.'
    });
  }

  addCheck(checks, 'permission-matrix', 'Configured permissions reviewed', 'pass',
    reviewed + ' enabled permission(s) checked across the configured roles.');
  addCheck(checks, 'permission-risk', 'Broad sensitive grants', findings.length ? 'warn' : 'pass',
    findings.length ? findings.length + ' potentially broad grant(s) need owner review.' : 'No broad sensitive grant matched the configured review rules.');
  return { checks, findings };
}

function calculateScore(findings) {
  const points = { critical: 35, high: 22, medium: 12, low: 5, info: 0 };
  const raw = findings.reduce((sum, finding) => sum + (points[finding.severity] || 0), 0);
  return Math.min(100, raw);
}

function makeSummary(findings, checks) {
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const finding of findings) bySeverity[finding.severity] = (bySeverity[finding.severity] || 0) + 1;
  return {
    findings: findings.length,
    highOrCritical: bySeverity.high + bySeverity.critical,
    score: calculateScore(findings),
    severity: bySeverity,
    checksPassed: checks.filter(item => item.status === 'pass').length,
    checksReviewed: checks.length
  };
}

async function runScan(payload) {
  if (!payload || payload.authorized !== true) throw Object.assign(new Error('Confirm that you own this project or have explicit permission to assess it.'), { status: 403 });
  const findings = [];
  const checks = [];
  let target = null;
  let sourceStats = null;

  if (payload.targetKind === 'website') {
    if (typeof payload.url !== 'string' || !payload.url.trim()) throw Object.assign(new Error('A website URL is required.'), { status: 400 });
    target = await inspectWebsite(payload.url.trim());
    checks.push(...target.checks);
    findings.push(...target.findings);
  } else if (payload.targetKind === 'source') {
    const files = Array.isArray(payload.sourceFiles) ? payload.sourceFiles : [];
    if (!files.length) throw Object.assign(new Error('No source files were sent. Re-open the project and import its files again.'), { status: 400 });
    if (files.length > MAX_FILES) throw Object.assign(new Error('Too many source files. The limit is ' + MAX_FILES + '.'), { status: 413 });
    sourceStats = inspectSource(files);
    checks.push(...sourceStats.checks);
    findings.push(...sourceStats.findings);
  } else {
    throw Object.assign(new Error('Unknown project type.'), { status: 400 });
  }

  const permissionReview = inspectPermissions(payload.permissions);
  checks.push(...permissionReview.checks);
  findings.push(...permissionReview.findings);

  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  return {
    scanId: 'scan-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    projectName: String(payload.projectName || 'Untitled project').slice(0, 120),
    scenario: String(payload.scenario || 'General review').slice(0, 100),
    targetKind: payload.targetKind,
    scannedAt: new Date().toISOString(),
    target: target ? { originalUrl: target.originalUrl, finalUrl: target.finalUrl, statusCode: target.statusCode } : null,
    source: sourceStats ? { analyzedFiles: sourceStats.analyzedFiles } : null,
    summary: makeSummary(findings, checks),
    checks,
    findings,
    limitations: [
      'This is a first-pass security review, not a certification or proof that the application is secure.',
      'Website mode checks the supplied homepage response and headers only. It does not crawl pages, log in, or test protected API actions.',
      'Source-code findings are rule-based hints. Confirm them manually; the scanner does not execute the uploaded code.',
      'Real role-by-role API tests require test accounts and explicit endpoint mappings, which are a separate integration step.'
    ]
  };
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2'
};

async function serveStatic(req, res) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  let requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let file = resolve(DIST, requested);
  if (!file.startsWith(DIST + sep) && file !== resolve(DIST, 'index.html')) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': mime[extname(file)] || 'application/octet-stream',
      'x-content-type-options': 'nosniff'
    });
    res.end(body);
  } catch {
    try {
      const body = await readFile(resolve(DIST, 'index.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Frontend build not found. Run npm run build first, or use npm run dev.');
    }
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'CanTheySeeIt scan engine', mode: 'local-first', version: '0.1.0' });
    return;
  }
  if (req.method === 'POST' && req.url === '/api/scan') {
    try {
      const payload = await readJson(req);
      const result = await runScan(payload);
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, error.status || 500, {
        error: error instanceof Error ? error.message : 'The scan could not be completed.'
      });
    }
    return;
  }
  if (req.url.startsWith('/api/')) {
    sendJson(res, 404, { error: 'API route not found.' });
    return;
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (req.method === 'HEAD') { res.writeHead(200); res.end(); return; }
    await serveStatic(req, res);
    return;
  }
  sendJson(res, 405, { error: 'Method not allowed.' });
});

server.listen(PORT, HOST, () => {
  process.stdout.write('CanTheySeeIt backend listening on http://' + HOST + ':' + PORT + '\n');
  process.stdout.write('Local network targets: ' + (ALLOW_LOCAL_TARGETS ? 'enabled for local demo' : 'disabled') + '\n');
});
