import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const file = (p) => readFile(resolve(root, p), 'utf8');
test('soft light theme loads last and preserves existing dashboard files', async () => {
  const [html, css] = await Promise.all([file('dashboard/index.html'), file('dashboard/soft-light.css')]);
  assert.ok(html.includes('href="/styles.css"'));
  assert.ok(html.includes('href="/experience.css"'));
  assert.ok(html.includes('href="/soft-light.css"'));
  assert.ok(html.indexOf('/soft-light.css') > html.indexOf('/experience.css'));
  assert.match(css, /font-family:\s*"Segoe UI Variable Text"/);
  assert.match(css, /\.sidebar\s*\{/);
  assert.match(css, /\.experience-hero\s*\{/);
  assert.match(css, /\.sector-choice\.selected/);
  assert.match(css, /\.experience-result-summary\.FAIL/);
  assert.match(css, /prefers-reduced-motion/);
});
