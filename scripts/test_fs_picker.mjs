import puppeteer from 'puppeteer-core';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  const result = await page.evaluate(async () => {
    return {
      type: typeof window.showSaveFilePicker,
      isSecureContext: window.isSecureContext
    };
  });
  console.log('Result:', result);
  await browser.close();
}

test();
