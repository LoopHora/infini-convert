import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 4175;
const BASE_URL = `http://localhost:${PORT}`;

async function runE2eTest() {
  console.log('================================================================');
  console.log('     INFINI-CONVERT: PDF SIZE COMPRESSION (4K & CUSTOM) E2E     ');
  console.log('================================================================\n');

  // 1. Launch Vite preview server
  console.log(`Starting Vite preview server on port ${PORT}...`);
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    shell: true,
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  // Wait for server to be ready
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Preview server timeout')), 10000);
    previewProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('http://localhost:') || msg.includes('Local:')) {
        clearTimeout(timeout);
        resolve(true);
      }
    });
    previewProcess.stderr.on('data', (data) => {
      console.log('Preview stderr:', data.toString());
    });
  });
  console.log('Preview server ready.\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const testReport = {
    dedicatedRoute: false,
    preset4k: false,
    customMode: false,
    targetMode: false,
    autoDetect: false,
    zeroOutboundPrivacy: true,
  };

  try {
    const page = await browser.newPage();

    // Privacy monitor: track any outbound requests
    page.on('request', (req) => {
      const method = req.method();
      const url = req.url();
      if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && !url.startsWith(BASE_URL)) {
        console.warn(`[PRIVACY VIOLATION] ${method} to ${url}`);
        testReport.zeroOutboundPrivacy = false;
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR]: ${msg.text()}`);
      }
    });

    // -------------------------------------------------------------
    // TEST 1: Dedicated /compress/pdf route
    // -------------------------------------------------------------
    console.log('--- TEST 1: Direct Navigation to /compress/pdf ---');
    const res = await page.goto(`${BASE_URL}/compress/pdf`, { waitUntil: 'networkidle0' });
    const status = res?.status();
    const title = await page.title();
    console.log(`  Route /compress/pdf status: ${status} | Title: "${title}"`);

    const hasHeader = await page.$eval('h1', el => el.textContent?.includes('Compress PDF'));
    console.log(`  Page Header contains "Compress PDF": ${hasHeader}`);
    testReport.dedicatedRoute = status === 200 && Boolean(hasHeader) && title.includes('Compress PDF');

    // -------------------------------------------------------------
    // TEST 2: Upload PDF & Test Controls (4K, Custom, Target)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Uploading PDF & Verifying 4K / Custom Controls ---');
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(path.resolve('test-fixtures/large-sample.pdf'));
    await page.waitForSelector('.card-panel', { timeout: 5000 });

    // Verify 4K Ultra-HD button exists
    const has4kButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent?.includes('4K Ultra-HD'));
    });
    console.log(`  "4K Ultra-HD" Quality Preset button visible: ${has4kButton}`);

    // Switch to Custom mode and verify Resolution tier controls
    console.log('  Testing Custom Mode & Resolution Tiers...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim().toLowerCase() === 'custom');
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const hasCustomControls = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Quality Slider') && text.includes('Resolution & Sharpness Tier') && text.includes('4K Ultra-HD (300 DPI)');
    });
    console.log(`  Custom Quality Slider & Resolution Tiers present: ${hasCustomControls}`);
    testReport.customMode = Boolean(hasCustomControls);

    // Switch to Target Size mode
    console.log('  Testing Target Size Mode...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim().toLowerCase().includes('target'));
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const hasTargetControls = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Target File Size') && text.includes('Custom Target Size (KB)');
    });
    console.log(`  Target Size controls present: ${hasTargetControls}`);
    testReport.targetMode = Boolean(hasTargetControls);

    // Switch back to Preset mode -> 4K Ultra-HD
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim().toLowerCase() === 'preset');
      btn?.click();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('4K Ultra-HD'));
      btn?.click();
    });

    // Click "Compress File"
    console.log('  Executing Compression with 4K Ultra-HD preset...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Compress File'));
      btn?.click();
    });

    // Wait for ResultCard with download link
    await page.waitForSelector('a[download]', { timeout: 15000 });
    const downloadInfo = await page.evaluate(async () => {
      const dl = document.querySelector('a[download]');
      const href = dl?.getAttribute('href') || '';
      const filename = dl?.getAttribute('download') || '';
      const res = await fetch(href);
      const blob = await res.blob();
      const buf = await blob.arrayBuffer();
      const uint8 = new Uint8Array(buf);
      const header = String.fromCharCode(...uint8.slice(0, 5));
      return {
        filename,
        size: buf.byteLength,
        header,
        type: blob.type,
      };
    });

    console.log(`  Download Filename: "${downloadInfo.filename}"`);
    console.log(`  Output Size: ${downloadInfo.size} bytes`);
    console.log(`  File Header: "${downloadInfo.header}" (Valid PDF signature: %PDF-)`);
    console.log(`  MIME Type: "${downloadInfo.type}"`);

    const validPdf = downloadInfo.header.startsWith('%PDF-');
    const validName = downloadInfo.filename === 'large-sample-compressed.pdf';
    testReport.preset4k = validPdf && validName && downloadInfo.size > 0;
    console.log(`  4K Ultra-HD PDF Compression Test: ${testReport.preset4k ? 'PASSED' : 'FAILED'}`);

    // -------------------------------------------------------------
    // TEST 3: Auto-Detect on Home Page with PDF
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Home Page Auto-Detect with PDF File ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    const homeFileInput = await page.$('input[type="file"]');
    await homeFileInput.uploadFile(path.resolve('test-fixtures/large-sample.pdf'));

    // Wait for AutoDetect Workspace to appear
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Compress PDF');
    }, { timeout: 10000 });

    const autoDetectHasCompressPdf = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('div, span, button'));
      return elements.some(e => e.textContent?.includes('Compress PDF'));
    });
    console.log(`  Auto-Detect identifies PDF and presents "Compress PDF": ${autoDetectHasCompressPdf}`);

    // Click "Run Compress PDF" button
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('Run Compress PDF'));
    }, { timeout: 10000 });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Run Compress PDF'));
      btn?.click();
    });

    await page.waitForSelector('a[download]', { timeout: 15000 });
    const autoDetectDl = await page.$eval('a[download]', el => el.getAttribute('download'));
    console.log(`  Auto-Detect Result Download Filename: "${autoDetectDl}"`);
    testReport.autoDetect = autoDetectDl === 'large-sample-compressed.pdf';

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log('                     E2E AUDIT SUMMARY                          ');
    console.log('================================================================');
    console.log(`  Dedicated Route (/compress/pdf):  ${testReport.dedicatedRoute ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  4K Ultra-HD Quality Preset:       ${testReport.preset4k ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Custom Mode (Slider & Sharpness): ${testReport.customMode ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Target Size Mode:                 ${testReport.targetMode ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Auto-Detect Integration:          ${testReport.autoDetect ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Zero-Upload Privacy Guarantee:    ${testReport.zeroOutboundPrivacy ? '✅ PASS' : '❌ FAIL'}`);
    console.log('================================================================\n');

    const allPassed = Object.values(testReport).every(Boolean);
    if (!allPassed) {
      throw new Error('One or more E2E tests failed');
    }
    console.log('All PDF Compression E2E tests PASSED successfully!\n');

  } finally {
    await browser.close();
    previewProcess.kill();
  }
}

runE2eTest().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
