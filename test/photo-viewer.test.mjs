// Drives examples/plain.html in Chromium: mouse, keyboard and real touch events (CDP), including
// the regression that started this file — the first tap after a swipe losing its click.
// Needs Playwright with its Chromium: `yarn test` puts a global install on NODE_PATH.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
let server, base, browser;

before(async () => {
  server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/examples/plain.html`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

const state = (p) => p.evaluate(() => {
  const d = document.querySelector('dialog[data-links=".photos a"]');
  return { open: d.open, count: d.querySelector('[data-pv-count]').textContent, src: d.querySelector('[data-pv-image]').getAttribute('src'),
    caption: d.querySelector('[data-pv-caption]').textContent, alt: d.querySelector('[data-pv-image]').alt, locked: document.documentElement.classList.contains('pv-open') };
});

test('a click opens the viewer on that photo, with its count, alt and caption', async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base);
  await p.locator('.photos a').nth(0).click();
  const s = await state(p);
  assert.ok(s.src.endsWith('/examples/img/1.svg'), `the full-size image: ${s.src}`);
  assert.deepEqual([s.open, s.count, s.alt, s.caption, s.locked], [true, '1 of 4', 'One, landscape', 'The first photo', true]);
  await p.close();
});

test('arrow keys page and wrap; Esc closes, unlocks scrolling and returns focus to the link', async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base);
  await p.locator('.photos a').nth(2).click();
  assert.equal((await state(p)).caption, 'A caption from data-caption');
  await p.keyboard.press('ArrowRight'); assert.equal((await state(p)).count, '4 of 4');
  await p.keyboard.press('ArrowRight'); assert.equal((await state(p)).count, '1 of 4', 'wraps forward');
  await p.keyboard.press('ArrowLeft'); assert.equal((await state(p)).count, '4 of 4', 'wraps back');
  await p.keyboard.press('Escape');
  // The dialog's close event (which unlocks scrolling and moves focus) fires just after the key.
  await p.waitForFunction(() => !document.documentElement.classList.contains('pv-open'), null, { timeout: 2000 });
  const s = await state(p);
  assert.equal(s.open, false); assert.equal(s.locked, false);
  assert.equal(await p.evaluate(() => document.activeElement.getAttribute('href')), 'img/4.svg', 'focus goes back to the photo you were on');
  await p.close();
});

test('the buttons work, a click on the dark area closes, a click on the photo does not', async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base);
  await p.locator('.photos a').nth(0).click();
  await p.click('[data-links=".photos a"] .pv-next'); assert.equal((await state(p)).count, '2 of 4');
  await p.click('[data-links=".photos a"] .pv-prev'); assert.equal((await state(p)).count, '1 of 4');
  await p.click('[data-links=".photos a"] [data-pv-image]'); assert.equal((await state(p)).open, true, 'clicking the photo keeps it open');
  await p.mouse.click(640, 20); assert.equal((await state(p)).open, false, 'clicking the dark area closes');
  await p.locator('.photos a').nth(0).click();
  await p.click('[data-links=".photos a"] .pv-close'); assert.equal((await state(p)).open, false);
  await p.close();
});

test('a ctrl-click is left alone, so opening the photo in a new tab still works', async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base);
  const prevented = await p.evaluate(() => {
    const a = document.querySelector('.photos a');
    const e = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    a.addEventListener('click', (ev) => ev.preventDefault(), { once: true }); // keep the test page in place
    a.dispatchEvent(e);
    return document.querySelector('dialog[data-links=".photos a"]').open;
  });
  assert.equal(prevented, false, 'the viewer opened on a ctrl-click');
  await p.close();
});

test('touch: swipes page, taps work right after a swipe, and a tap on the dark area closes', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  const touch = async (points) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: points[0][0], y: points[0][1] }] });
    for (const [x, y] of points.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(250);
  };
  await p.goto(base);
  await p.locator('.photos a').nth(1).tap();
  assert.equal((await state(p)).count, '2 of 4');
  await touch([[320, 420], [240, 420], [160, 420], [80, 420]]); assert.equal((await state(p)).count, '3 of 4', 'swipe left goes forward');
  const next = await p.locator('[data-links=".photos a"] .pv-next').boundingBox();
  await touch([[next.x + next.width / 2, next.y + next.height / 2]]);
  assert.equal((await state(p)).count, '4 of 4', 'the first tap after a swipe still works');
  await touch([[80, 420], [200, 420], [320, 420]]); assert.equal((await state(p)).count, '3 of 4', 'swipe right goes back');
  await touch([[195, 30]]); assert.equal((await state(p)).open, false, 'a tap on the dark area closes');
  await ctx.close();
});

test('one photo: no previous/next, no count, and arrows do nothing', async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base);
  await p.click('a.solo');
  const solo = await p.evaluate(() => {
    const d = document.getElementById('solo-viewer');
    return { open: d.open, single: d.classList.contains('pv-single'), count: d.querySelector('[data-pv-count]').textContent,
      next: getComputedStyle(d.querySelector('.pv-next')).display };
  });
  assert.deepEqual(solo, { open: true, single: true, count: '', next: 'none' });
  await p.close();
});

test('justified rows: photos in a row share one height and fill the width', async () => {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(base);
  const boxes = await p.evaluate(() => [...document.querySelectorAll('.photos img')].map((i) => { const r = i.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), right: Math.round(r.right) }; }));
  const firstRow = boxes.filter((b) => b.top === boxes[0].top);
  assert.ok(firstRow.length > 1, 'more than one photo shares the first row');
  assert.ok(new Set(firstRow.map((b) => b.h)).size === 1, `one height per row: ${JSON.stringify(firstRow)}`);
  const width = await p.evaluate(() => document.querySelector('.photos').getBoundingClientRect().right);
  assert.ok(Math.abs(firstRow.at(-1).right - width) <= 2, 'the first row reaches the right edge');
  await p.close();
});
