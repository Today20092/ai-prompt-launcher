// Optional live-relay check. Uses isolated browser storage and synthetic prompts only.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.PROMPTROOM_URL || 'http://127.0.0.1:4329/';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE });
  try {
    const receiver = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const sender = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const a = await receiver.newPage(), b = await sender.newPage();
    const errors = [];
    for (const page of [a, b]) { page.setDefaultTimeout(90_000); page.on('pageerror', error => errors.push(error.message)); }
    try {
    await Promise.all([a.goto(base), b.goto(base)]);
    console.log('Isolated receiver and sender loaded.');
    await b.getByRole('button', { name: 'New prompt', exact: true }).click();
    await b.getByLabel('Name', { exact: true }).fill('Synthetic tailcat transfer');
    await b.getByLabel('Template', { exact: true }).fill('Synthetic exact 🐱\n{{text}} &?#%+');
    await b.getByRole('button', { name: 'Save template', exact: true }).click();
    console.log('Synthetic sender prompt saved.');
    console.log('Receiver controls:', await a.getByRole('button').allTextContents(), 'Errors:', errors);
    await b.getByLabel('Your text').fill('Synthetic private input must stay here');
    await a.getByRole('button', { name: 'Transfer between devices', exact: true }).click();
    await a.getByRole('button', { name: 'Receive library', exact: true }).click();
    console.log('Receiving session requested.');
    const invitation = a.getByLabel('Single-use invitation link', { exact: true });
    await invitation.waitFor();
    const link = await invitation.inputValue();
    assert(link.includes('#transfer=tc'));
    await a.getByAltText('Scan invitation on the sending device').waitFor();
    assert(await a.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    console.log('Receiver ready with QR invitation; connecting through live relay.');
    await b.goto(link);
    await b.getByRole('button', { name: 'Send saved library', exact: true }).click();
    const approveA = a.getByRole('button', { name: 'Codes match', exact: true });
    const approveB = b.getByRole('button', { name: 'Codes match', exact: true });
    await Promise.all([approveA.waitFor(), approveB.waitFor()]);
    assert.equal(await a.getByLabel(/^Pairing code /).textContent(), await b.getByLabel(/^Pairing code /).textContent());
    assert(!(await a.evaluate(() => localStorage.getItem('promptroom.workspace'))).includes('Synthetic tailcat transfer'));
    await approveB.click();
    await approveA.click();
    await a.getByText('Synthetic tailcat transfer', { exact: true }).waitFor();
    assert(!(await a.evaluate(() => localStorage.getItem('promptroom.workspace'))).includes('Synthetic tailcat transfer'));
    await a.getByRole('button', { name: 'Apply transfer', exact: true }).click();
    await b.getByText('Transfer complete. The other device confirmed its import.', { exact: true }).waitFor();
    const saved = await a.evaluate(() => localStorage.getItem('promptroom.workspace'));
    assert(saved.includes('Synthetic tailcat transfer'));
    assert(!saved.includes('Synthetic private input must stay here'));
    const prompt = JSON.parse(saved).templates.find(item => item.title === 'Synthetic tailcat transfer');
    assert.equal(prompt.body, 'Synthetic exact 🐱\n{{text}} &?#%+');
    assert.deepEqual(errors, []);
    console.log('PASS: live tailcat relay, matching pairing, review-before-save, exact Unicode, input exclusion, committed acknowledgement, mobile overflow. Physical devices not tested.');
    } catch (error) {
      console.log('Browser errors:', errors);
      for (const page of [a, b]) console.log('Controls:', await page.getByRole('button').allTextContents(), 'Status:', await page.getByRole('status').allTextContents());
      throw error;
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
