import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { inlineScript } from '../src/photo-viewer/inline.js';

const source = fs.readFileSync(new URL('../src/photo-viewer/photo-viewer.js', import.meta.url), 'utf8');

test('the inlined script has no comments, no sample markup, and is small', () => {
  const code = inlineScript(source);
  assert.doesNotMatch(code, /^\s*\/\//m, 'a whole-line comment survived');
  assert.ok(!code.includes('<dialog') && !code.includes('<figure'), 'sample markup from the comments would land on every page');
  assert.ok(Buffer.byteLength(code) < 3500, `${Buffer.byteLength(code)} bytes`);
});

test('the inlined script is still valid JavaScript, and the source keeps no // inside strings', () => {
  assert.doesNotThrow(() => new Function(inlineScript(source)));
  const strings = source.match(/'[^'\n]*'|`[^`\n]*`/g) ?? [];
  assert.ok(!strings.some((s) => s.includes('//')), 'a string contains //, which the comment stripping would cut');
});
