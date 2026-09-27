import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = 'http://127.0.0.1:8179';
let server, browser;

before(async () => {
  server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '8179' }, stdio: ['ignore', 'pipe', 'inherit'] });
  await once(server.stdout, 'data');
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
});

after(async () => { await browser?.close(); server?.kill(); });

async function withPage(run, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Basemap availability must not affect the app's data or interactions.
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  try { await run(page, context); assert.deepEqual(errors, [], 'No uncaught JavaScript errors'); }
  finally { await context.close(); }
}

async function visit(page, route = '/html/chart.html') {
  await page.goto(`${baseURL}${route}`);
  await page.waitForFunction(() => document.querySelector('.results-panel')?.getAttribute('aria-busy') === 'false');
}

test('home page has working subject routes and fits desktop, tablet, and narrow screens', async () => withPage(async page => {
  await page.goto(baseURL);
  assert.equal(await page.locator('.subject-card').count(), 6);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow at ${width}px`);
  }
  await page.locator('.subject-card').nth(2).click();
  await page.waitForSelector('.ranking-table');
  assert.equal(await page.locator('#select-subject').inputValue(), 'engineering_and_technology');
}));

test('rankings load immediately, preserve source scores, and open an accessible details dialog', async () => withPage(async page => {
  await visit(page);
  assert.equal(await page.locator('tbody tr').count(), 50);
  assert.equal(await page.locator('.score-cell strong').first().textContent(), '96.3');
  await page.locator('.university-name').first().click();
  assert.equal(await page.locator('dialog').evaluate(dialog => dialog.open), true);
  assert.match(await page.locator('#dialog-title').textContent(), /Massachusetts/);
  assert.equal(await page.locator('.metric-row strong').first().textContent(), '96.3');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').evaluate(dialog => dialog.open), false);
  assert.equal(await page.locator('.university-name').first().evaluate(button => button === document.activeElement), true);
}));

test('filters, empty states, reset, and rank validation behave consistently', async () => withPage(async page => {
  await visit(page);
  await page.selectOption('#select-country', 'Singapore');
  assert.equal(await page.locator('tbody tr').count(), 2);
  await page.selectOption('#select-region', 'europe');
  assert.equal(await page.locator('tbody tr').count(), 0);
  assert.match(await page.locator('.empty-state').textContent(), /No universities found/);
  await page.locator('.empty-state [data-action="reset"]').click();
  assert.equal(await page.locator('tbody tr').count(), 50);
  await page.fill('#select-rank-s', '40');
  await page.fill('#select-rank-e', '10');
  await page.locator('#select-rank-e').press('Tab');
  assert.equal(await page.locator('#rank-error').isVisible(), true);
  await page.locator('[data-action="rank"][data-max="10"]').click();
  assert.equal(await page.locator('#rank-error').isVisible(), false);
  assert.ok(await page.locator('tbody tr').count() <= 10);
  await page.fill('#university-search', 'Harvard');
  assert.equal(await page.locator('tbody tr').count(), 1);
}));

test('shared filters survive map navigation, and the map works without basemap tiles', async () => withPage(async page => {
  await visit(page, '/html/chart.html?subject=engineering_and_technology&country=Singapore');
  await page.locator('.main-nav [data-view="map"]').click();
  await page.waitForSelector('.university-marker');
  assert.equal(await page.locator('.map-result').count(), 2);
  assert.equal(await page.locator('.university-marker').count(), 2);
  assert.equal(await page.locator('#select-country').inputValue(), 'Singapore');
  await page.locator('[data-action="locate"]').first().click();
  assert.equal(await page.locator('.map-popup').isVisible(), true);
  await page.locator('.map-popup [data-action="detail"]').click();
  assert.equal(await page.locator('.metric-row').count(), 5);
  await page.keyboard.press('Escape');
  await page.locator('.main-nav [data-view="chart"]').click();
  await page.waitForSelector('.ranking-table');
  assert.equal(await page.locator('tbody tr').count(), 2);
}));

test('saved universities persist across reloads and can be removed from the shortlist', async () => withPage(async page => {
  await visit(page);
  await page.locator('.save-button').first().click();
  await page.reload();
  await page.waitForSelector('.ranking-table');
  assert.equal(await page.locator('#saved-count').textContent(), '1');
  await page.locator('.header-saved').click();
  await page.waitForSelector('.ranking-table');
  assert.equal(await page.locator('tbody tr').count(), 1);
  await page.locator('.save-button').click();
  assert.equal(await page.locator('.empty-state').isVisible(), true);
}));

test('comparison is limited to three, shows source metrics, and resets for a new subject', async () => withPage(async page => {
  await visit(page);
  for (let i = 0; i < 4; i++) await page.locator('.compare-checkbox').nth(i).click();
  assert.equal(await page.locator('.compare-checkbox:checked').count(), 3);
  assert.match(await page.locator('#toast').textContent(), /up to 3/);
  await page.locator('[data-action="open-compare"]').click();
  assert.equal(await page.locator('.comparison-table thead th').count(), 4);
  assert.equal(await page.locator('.comparison-table tbody tr').count(), 5);
  assert.equal(await page.locator('.comparison-table tbody td strong').first().textContent(), '96.3');
  await page.keyboard.press('Escape');
  await page.selectOption('#select-subject', 'natural_sciences');
  assert.equal(await page.locator('#compare-tray').isVisible(), false);
}));

test('CSV download reflects the current filtered results', async () => withPage(async page => {
  await visit(page, '/html/chart.html?country=Singapore');
  const downloaded = page.waitForEvent('download');
  await page.locator('[data-action="export"]').click();
  const download = await downloaded;
  const csv = await readFile(await download.path(), 'utf8');
  assert.equal(csv.split('\r\n').length, 3);
  assert.match(csv, /Nanyang Technological/);
  assert.match(csv, /National University of Singapore/);
  assert.match(download.suggestedFilename(), /uniseek-2021-overall\.csv/);
}));

test('mobile filters open, apply, and collapse without horizontal overflow', async () => withPage(async page => {
  await visit(page);
  assert.equal(await page.locator('#filter-form').isVisible(), false);
  await page.locator('.filter-toggle').click();
  await page.selectOption('#select-country', 'Singapore');
  await page.locator('.mobile-apply').click();
  assert.equal(await page.locator('#filter-form').isVisible(), false);
  assert.equal(await page.locator('tbody tr').count(), 2);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('.main-nav [data-view="map"]').click();
  await page.waitForSelector('.map-result');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
}, { width: 390, height: 844 }));

test('data load failures offer a working retry', async () => withPage(async page => {
  await page.route('**/qs_2021_with_latlng.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await visit(page);
  assert.equal(await page.locator('#retry-load').isVisible(), true);
  await page.unroute('**/qs_2021_with_latlng.json');
  await page.locator('#retry-load').click();
  await page.waitForSelector('.ranking-table');
  assert.equal(await page.locator('tbody tr').count(), 50);
}));

test('blocked storage does not prevent filtering or session bookmarks', async () => withPage(async page => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } }));
  await visit(page);
  await page.locator('.save-button').first().click();
  assert.equal(await page.locator('#saved-count').textContent(), '1');
  assert.match(await page.locator('#toast').textContent(), /this session/);
  await page.locator('#saved-only').check();
  assert.equal(await page.locator('tbody tr').count(), 1);
}));
