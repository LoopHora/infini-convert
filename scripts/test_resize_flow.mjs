import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function testResize() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('RESIZE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('RESIZE PAGE ERROR:', err.message));

    console.log('\n--- 1. Navigating to /resize ---');
    await page.goto('http://localhost:5173/resize', { waitUntil: 'networkidle0' });

    console.log('--- 2. Uploading test-800x600.png ---');
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      console.error('No file input found on /resize!');
      return;
    }
    await fileInput.uploadFile('test-fixtures/test-800x600.png');

    await page.waitForSelector('input[placeholder="Width"]', { timeout: 5000 });

    const state1 = await page.evaluate(() => {
      const widthInput = document.querySelector('input[placeholder="Width"]');
      const heightInput = document.querySelector('input[placeholder="Height"]');
      return { w: widthInput.value, h: heightInput.value };
    });
    console.log('Initial dimensions in inputs:', state1);

    // Change width to 400
    console.log('--- 3. Changing width to 400 ---');
    await page.click('input[placeholder="Width"]', { clickCount: 3 });
    await page.type('input[placeholder="Width"]', '400');

    const state2 = await page.evaluate(() => {
      const widthInput = document.querySelector('input[placeholder="Width"]');
      const heightInput = document.querySelector('input[placeholder="Height"]');
      return { w: widthInput.value, h: heightInput.value };
    });
    console.log('Updated dimensions in inputs:', state2);

    // Click Resize
    console.log('--- 4. Clicking Resize File ---');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Resize'));
      btn?.click();
    });

    await page.waitForSelector('a[download]', { timeout: 5000 });

    const resultState = await page.evaluate(() => {
      const downloadBtn = document.querySelector('a[download]');
      return {
        downloadAttr: downloadBtn?.getAttribute('download'),
        text: document.querySelector('.card-panel')?.innerText
      };
    });
    console.log('Result state:', resultState);

  } finally {
    await browser.close();
  }
}

testResize().catch(console.error);
