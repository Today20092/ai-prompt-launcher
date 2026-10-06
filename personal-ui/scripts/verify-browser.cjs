// Optional workstation check: point PLAYWRIGHT_MODULE at an existing installation.
// All contexts are isolated, content synthetic, and external navigation intercepted.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = process.env.PROMPTROOM_URL || 'http://127.0.0.1:4329/';
const output = process.env.BROWSER_EVIDENCE_DIR || '.scratch/browser-evidence';

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
      const context = await browser.newContext({ viewport, acceptDownloads: true });
      const errors = [];
      await context.route('**/*', route => {
        const url = route.request().url();
        return url.startsWith(new URL(base).origin) || url.startsWith('data:') || url.startsWith('blob:') ? route.continue() : route.abort();
      });
      const page = await context.newPage();
      page.on('pageerror', () => errors.push('pageerror'));
      try {
        await page.goto(base);
        await page.getByRole('button', { name: 'New prompt', exact: true }).click();
        await page.getByLabel('Name', { exact: true }).fill(`Synthetic ${name}`);
        await page.getByLabel('Template', { exact: true }).fill('Synthetic exact text:\n{{text}}');
        await page.getByRole('button', { name: 'Save template', exact: true }).click();
        const temporary = '  Synthetic 🐱 &?#%+\nsecond line  ';
        await page.getByLabel('Your text').fill(temporary);
        await page.reload();
        await page.getByRole('heading', { name: `Synthetic ${name}`, exact: true }).waitFor();
        assert.equal(await page.getByLabel('Your text').inputValue(), '');
        const saved = await page.evaluate(() => localStorage.getItem('promptroom.workspace'));
        assert(!saved.includes('second line'));
        await page.getByRole('button', { name: 'Preferences', exact: true }).click();
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Export backup', exact: true }).click();
        const downloaded = await downloadPromise;
        const raw = await fs.readFile(await downloaded.path(), 'utf8');
        const incoming = JSON.parse(raw);
        incoming.workspace.templates.push({ id: `incoming-${name}`, title: `Imported ${name}`, description: '', body: 'Imported synthetic template' });
        const file = { name: 'synthetic-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(incoming)) };
        await page.getByRole('button', { name: 'Import backup', exact: true }).click();
        await page.getByLabel('JSON backup').setInputFiles(file);
        await page.getByRole('button', { name: 'Apply import', exact: true }).waitFor();
        await page.getByText(`Imported ${name}`, { exact: true }).waitFor();
        assert.equal(await page.evaluate(() => localStorage.getItem('promptroom.workspace')), saved);
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        assert.equal(await page.evaluate(() => localStorage.getItem('promptroom.workspace')), saved);
        await page.getByRole('button', { name: 'Import backup', exact: true }).click();
        await page.getByLabel('JSON backup').setInputFiles(file);
        await page.getByText(`Imported ${name}`, { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Apply import', exact: true }).click();
        await page.getByText(/Backup imported/).waitFor();
        await page.getByRole('button', { name: 'Done', exact: true }).click();
        const applied = JSON.parse(await page.evaluate(() => localStorage.getItem('promptroom.workspace')));
        assert(applied.templates.some(item => item.id === `incoming-${name}`));
        await page.getByLabel('Your text').fill(temporary);
        await page.getByRole('button', { name: 'Share', exact: true }).click();
        await page.getByText('View link and snapshot data', { exact: true }).click();
        let snapshot = JSON.parse(await page.getByLabel('Exact snapshot data').inputValue());
        assert.equal(snapshot.values, undefined);
        await page.getByLabel('Include text', { exact: true }).check();
        snapshot = JSON.parse(await page.getByLabel('Exact snapshot data').inputValue());
        assert.equal(snapshot.values.text, temporary);
        const link = await page.getByLabel('Link to copy or share').inputValue();
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        const beforeReceipt = await page.evaluate(() => localStorage.getItem('promptroom.workspace'));
        await page.goto('about:blank');
        await page.goto(link);
        await page.getByRole('button', { name: 'Save a copy', exact: true }).waitFor();
        assert.equal(await page.getByLabel('Your text').inputValue(), temporary);
        assert.equal(await page.evaluate(() => localStorage.getItem('promptroom.workspace')), beforeReceipt);
        await page.getByRole('button', { name: 'Save a copy', exact: true }).click();
        await page.getByText(/Independent template copy saved/).waitFor();
        const afterCopy = JSON.parse(await page.evaluate(() => localStorage.getItem('promptroom.workspace')));
        const beforeCopy = JSON.parse(beforeReceipt);
        assert.equal(afterCopy.lastUsedPrompt, beforeCopy.lastUsedPrompt);
        assert.equal(afterCopy.preferredApp, beforeCopy.preferredApp);
        assert.equal(afterCopy.templates.length, beforeCopy.templates.length + 1);
        assert(!JSON.stringify(afterCopy).includes('second line'));
        assert(!beforeCopy.templates.some(item => item.id === afterCopy.templates.at(-1).id));
        await page.getByRole('button', { name: 'Return to saved workspace', exact: true }).click();
        const cdp = await context.newCDPSession(page);
        const { targetInfo } = await cdp.send('Target.getTargetInfo');
        await cdp.send('Browser.setPermission', { permission: { name: 'clipboard-write' }, setting: 'denied', origin: new URL(base).origin, browserContextId: targetInfo.browserContextId });
        assert.equal(await page.evaluate(async () => (await navigator.permissions.query({ name: 'clipboard-write' })).state), 'denied');
        await page.getByLabel('Your text').fill(temporary);
        await page.getByRole('button', { name: 'Copy prompt', exact: true }).click();
        await page.getByText(/Clipboard access failed/).waitFor();
        assert((await page.getByLabel('Complete prompt').textContent()).includes(temporary));
        await page.getByLabel('Your text').fill('Synthetic long prompt\n'.repeat(300));
        const popup = page.waitForEvent('popup');
        await page.getByRole('button', { name: 'Open in T3 Chat', exact: true }).click();
        const destination = await popup;
        if (!destination.isClosed()) await destination.waitForEvent('close');
        await page.getByText(/Clipboard access failed/).waitFor();
        // Controlled popup blocking is distinct from a real browser popup policy.
        await page.evaluate(() => { window.open = () => null; });
        await page.getByRole('button', { name: 'Open in T3 Chat', exact: true }).click();
        await page.getByText(/Your browser blocked the new tab/).waitFor();
        await page.getByText('Preview complete prompt', { exact: true }).click();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
        await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
        assert.deepEqual(errors, []);
        let legacyRedirect = 'not requested';
        if (process.env.VERIFY_LEGACY === '1') {
          await page.goto(base + '?prompt=Synthetic%20redirect#marker=synthetic');
          await page.waitForURL(url => url.pathname.endsWith('/legacy/') && url.search === '?prompt=Synthetic%20redirect' && url.hash === '#marker=synthetic');
          assert.equal(await page.title(), 'AI Prompt Launcher');
          legacyRedirect = 'passed; query/hash preserved, legacy document staged';
        }
        results.push({ viewport: name, saveReload: 'passed', backupExportReviewCancelApply: 'passed', temporaryShareReceiptIndependentSave: 'passed', actualChromiumDeniedClipboard: 'passed', actualFallbackPopupCleanup: 'passed', controlledPopupBlockGuidance: 'passed', legacyRedirect, physicalDeviceSharing: 'not tested', signedInT3Delivery: 'not tested' });
        console.log(`${name}: all synthetic browser checks passed`);
      } finally { await context.close(); }
    }
    await fs.writeFile(path.join(output, 'results.json'), JSON.stringify({ browser: 'installed Playwright Chromium, isolated headless contexts', providerNavigation: 'intercepted', results }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
