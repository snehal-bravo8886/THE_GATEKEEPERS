import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const read=p=>readFile(resolve(root,p),'utf8');
test('studio light theme is last and the original security workflow remains present',async()=>{
  const [html,css]=await Promise.all([read('dashboard/index.html'),read('dashboard/studio-light.css')]);
  assert.ok(html.indexOf('href="/studio-light.css"')>html.indexOf('href="/soft-light.css"'));
  assert.match(css,/font-family:\s*var\(--studio-serif\)/);
  assert.match(css,/"DM Sans"/);
  assert.match(css,/"Lora"/);
  assert.match(css,/\.experience-hero-art[^\n]*display:\s*none/);
  for(const id of ['workspace-sector-cards','workspace-sector-features','workspace-core-rules','workspace-mode-zip','workspace-mode-link','workspace-results','workspace-run']){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  assert.match(css,/@media \(max-width: 760px\)/);
  assert.match(css,/prefers-reduced-motion/);
});
