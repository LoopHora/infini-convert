import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function testVisualGlitch() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173/convert/pptx-to-png', { waitUntil: 'networkidle0' });

    const input = await page.$('input[type="file"]');
    await input.uploadFile(path.resolve('test-fixtures/sample-deck.pptx'));

    await new Promise(r => setTimeout(r, 800));

    // Start extraction
    const btn = await page.$('button.btn-primary.btn-lg');
    await btn.click();

    // Take screenshot during / immediately after to verify no background slide artifact
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: 'extraction_midway_check.png' });
    console.log('Saved extraction_midway_check.png');

    await page.waitForSelector('a[download]', { timeout: 15000 });
    await page.screenshot({ path: 'extraction_complete_check.png' });
    console.log('Saved extraction_complete_check.png');

  } finally {
    await browser.close();
  }
}

testVisualGlitch().catch(console.error);
