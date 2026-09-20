import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function captureCropUI() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 }
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/resize/image?mode=crop', { waitUntil: 'networkidle0' });

    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('test-fixtures/test-800x600.png');

    await page.waitForSelector('[title*="handle to crop"]', { timeout: 6000 });

    // Click 16:9 Widescreen
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('16:9 Widescreen')
      );
      btn?.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // Copy to artifact directory
    const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\a583726d-90bd-4675-a3bd-e5a9bad1aa83';
    await page.screenshot({ path: `${artifactDir}/crop_interactive_preview.png`, fullPage: false });
    console.log('Saved crop_interactive_preview.png');
  } finally {
    await browser.close();
  }
}

captureCropUI().catch(console.error);
