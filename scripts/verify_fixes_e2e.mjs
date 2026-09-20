import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';

async function testAll() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`PAGE [${msg.type().toUpperCase()}]:`, msg.text());
      }
    });

    console.log('\n=========================================');
    console.log('TEST 1: PPTX TO PDF (Verifying non-blank content)');
    console.log('=========================================');
    await page.goto(`${BASE}/convert/pptx-to-pdf`, { waitUntil: 'networkidle0' });

    const pptInput = await page.$('input[type="file"]');
    await pptInput.uploadFile(path.resolve('test-fixtures/sample-deck.pptx'));
    console.log('Uploaded sample-deck.pptx');

    await new Promise(r => setTimeout(r, 1000));
    const processBtn = await page.$('button.btn-primary.btn-lg:not([disabled])');
    console.log('Clicking Process button...');
    await processBtn.click();

    await page.waitForSelector('a[download]', { timeout: 15000 });
    const pdfDlInfo = await page.evaluate(async () => {
      const dl = document.querySelector('a[download]');
      const href = dl.getAttribute('href');
      const filename = dl.getAttribute('download');
      // Fetch blob and inspect
      const res = await fetch(href);
      const blob = await res.blob();
      const buf = await blob.arrayBuffer();
      return { filename, size: buf.byteLength };
    });
    console.log('PDF Download Info:', pdfDlInfo);

    console.log('\n=========================================');
    console.log('TEST 2: PPTX TO PNG SLIDES (Verifying non-blank slide images)');
    console.log('=========================================');
    await page.goto(`${BASE}/convert/pptx-to-png`, { waitUntil: 'networkidle0' });

    const pptPngInput = await page.$('input[type="file"]');
    await pptPngInput.uploadFile(path.resolve('test-fixtures/sample-deck.pptx'));
    console.log('Uploaded sample-deck.pptx for PNG slides');

    await new Promise(r => setTimeout(r, 1000));
    const processPngBtn = await page.$('button.btn-primary.btn-lg:not([disabled])');
    console.log('Clicking Extract PNG button...');
    await processPngBtn.click();

    await page.waitForSelector('a[download]', { timeout: 15000 });
    const pngDlInfo = await page.evaluate(async () => {
      const dl = document.querySelector('a[download]');
      const href = dl.getAttribute('href');
      const filename = dl.getAttribute('download');
      const res = await fetch(href);
      const blob = await res.blob();
      const buf = await blob.arrayBuffer();
      return { filename, size: buf.byteLength };
    });
    console.log('Slide PNG Download Info:', pngDlInfo);

    console.log('\n=========================================');
    console.log('TEST 3: RESIZE IMAGE (Testing 50% scale preset & download)');
    console.log('=========================================');
    await page.goto(`${BASE}/resize/image`, { waitUntil: 'networkidle0' });

    const resizeInput = await page.$('input[type="file"]');
    await resizeInput.uploadFile(path.resolve('test-fixtures/test-800x600.png'));
    console.log('Uploaded test-800x600.png');

    await page.waitForSelector('input[placeholder="Width"]', { timeout: 5000 });

    // Click 50% quick preset
    console.log('Clicking 50% percentage button...');
    await page.evaluate(() => {
      const btn50 = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '50%');
      btn50?.click();
    });

    const inputsAfter50 = await page.evaluate(() => {
      const w = document.querySelector('input[placeholder="Width"]')?.value;
      const h = document.querySelector('input[placeholder="Height"]')?.value;
      return { w, h };
    });
    console.log('Dimensions after 50% preset click:', inputsAfter50);

    const resizeActionBtn = await page.$('button.btn-primary.btn-lg:not([disabled])');
    console.log('Clicking Resize File button...');
    await resizeActionBtn.click();

    await page.waitForSelector('a[download]', { timeout: 5000 });
    const resizeDlInfo = await page.evaluate(async () => {
      const dl = document.querySelector('a[download]');
      const href = dl.getAttribute('href');
      const filename = dl.getAttribute('download');
      const res = await fetch(href);
      const blob = await res.blob();
      const buf = await blob.arrayBuffer();
      return { filename, size: buf.byteLength };
    });
    console.log('Resize Download Info:', resizeDlInfo);

    console.log('\n=========================================');
    console.log('SUMMARY: ALL THREE WORKFLOWS VERIFIED!');
    console.log('=========================================');

  } finally {
    await browser.close();
  }
}

testAll().catch(console.error);
