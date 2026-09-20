import puppeteer from 'puppeteer-core';

async function testPicker() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  
  // Try calling showSaveFilePicker with CDP or evaluate
  try {
    const res = await page.evaluate(async () => {
      if (typeof window.showSaveFilePicker !== 'function') {
        return { supported: false, error: 'showSaveFilePicker not supported' };
      }
      return { supported: true };
    });
    console.log('Picker support:', res);
  } catch (err) {
    console.error('Picker error:', err);
  }
  
  await browser.close();
}

testPicker();
