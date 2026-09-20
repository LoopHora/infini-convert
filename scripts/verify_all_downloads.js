import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const downloadDir = path.resolve('actual_downloads');

function cleanDownloadDir() {
  if (fs.existsSync(downloadDir)) {
    fs.rmSync(downloadDir, { recursive: true, force: true });
  }
  fs.mkdirSync(downloadDir, { recursive: true });
}

async function waitForDownload(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 200));
    if (fs.existsSync(downloadDir)) {
      const files = fs.readdirSync(downloadDir).filter(f => !f.endsWith('.crdownload') && !f.endsWith('.tmp'));
      if (files.length > 0) {
        return files[0];
      }
    }
  }
  throw new Error('Download timed out');
}

const isUuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

async function runVerification() {
  console.log('Starting REAL BROWSER DOWNLOAD VERIFICATION via Chrome...\n');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir,
  });

  const results = [];

  async function testPath({
    stepNumber,
    operation,
    inputNames,
    route,
    buttonMatcher,
    expectedFilename,
    customAction,
    downloadSelector = 'a[download]',
  }) {
    cleanDownloadDir();
    console.log(`[${stepNumber}/14] Testing: ${operation} (${inputNames.join(', ')}) -> Expected: ${expectedFilename}`);
    
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle0' });

    // Handle file upload
    const inputHandle = await page.$('input[type="file"]');
    if (!inputHandle) throw new Error(`File input not found on ${route}`);

    const filePaths = inputNames.map(n => path.resolve('test-fixtures', n));
    await inputHandle.uploadFile(...filePaths);

    // If custom action needed before clicking button
    if (customAction) {
      await customAction(page);
    }

    // Wait and click action button (primary execute button is button.btn-lg across all tools)
    await page.waitForSelector('button.btn-lg:not([disabled])', { timeout: 15000 });
    const actionBtn = await page.$('button.btn-lg');
    if (!actionBtn) throw new Error('Action button button.btn-lg not found');
    await actionBtn.click();

    // Wait for the download element
    await page.waitForSelector(downloadSelector, { timeout: 15000 });

    const downloadAttr = await page.$eval(downloadSelector, el => el.getAttribute('download'));
    const hrefAttr = await page.$eval(downloadSelector, el => el.getAttribute('href'));

    // Click the real persistent download link
    await page.click(downloadSelector);

    // Wait for actual file on disk
    const actualBrowserFilename = await waitForDownload();

    const hasUuid = isUuidRegex.test(actualBrowserFilename);
    const pass = (actualBrowserFilename === expectedFilename) && !hasUuid;

    console.log(`   -> Download attribute: "${downloadAttr}"`);
    console.log(`   -> Blob URL: "${hrefAttr}"`);
    console.log(`   -> Actual file saved on disk by Chrome: "${actualBrowserFilename}"`);
    console.log(`   -> UUID in filename: ${hasUuid ? 'YES' : 'NO'}`);
    console.log(`   -> Result: ${pass ? 'PASS' : 'FAIL'}\n`);

    results.push({
      operation,
      input: inputNames.join(', '),
      actualBrowserFilename,
      hasUuid: hasUuid ? 'YES (BUG)' : 'NO',
      pass: pass ? 'PASS' : 'FAIL',
      expectedFilename,
    });
  }

  try {
    // 1. JPG -> PNG
    await testPath({
      stepNumber: 1,
      operation: 'JPG → PNG',
      inputNames: ['sample-photo.jpg'],
      route: '/convert/jpg-to-png',
      buttonMatcher: 'Convert',
      expectedFilename: 'sample-photo.png',
    });

    // 2. JPG -> WebP
    await testPath({
      stepNumber: 2,
      operation: 'JPG → WebP',
      inputNames: ['sample-photo.jpg'],
      route: '/convert/jpg-to-webp',
      buttonMatcher: 'Convert',
      expectedFilename: 'sample-photo.webp',
    });

    // 3. JPG -> Compression
    await testPath({
      stepNumber: 3,
      operation: 'JPG → Compression',
      inputNames: ['sample-photo.jpg'],
      route: '/compress/image',
      buttonMatcher: 'Compress',
      expectedFilename: 'sample-photo-compressed.jpg',
    });

    // 4. JPG -> Resize
    await testPath({
      stepNumber: 4,
      operation: 'JPG → Resize',
      inputNames: ['sample-photo.jpg'],
      route: '/resize/image',
      buttonMatcher: 'Resize',
      expectedFilename: 'sample-photo-resized.jpg',
    });

    // 5. JPG -> PDF
    await testPath({
      stepNumber: 5,
      operation: 'JPG → PDF',
      inputNames: ['sample-photo.jpg'],
      route: '/convert/image-to-pdf',
      buttonMatcher: 'Generate PDF',
      expectedFilename: 'sample-photo.pdf',
    });

    // 6. HEIC -> JPG
    await testPath({
      stepNumber: 6,
      operation: 'HEIC → JPG',
      inputNames: ['sample-iphone.heic'],
      route: '/convert/heic-to-jpg',
      buttonMatcher: 'Convert',
      expectedFilename: 'sample-iphone.jpg',
    });

    // 7. PDF -> JPG
    await testPath({
      stepNumber: 7,
      operation: 'PDF → JPG',
      inputNames: ['sample-doc.pdf'],
      route: '/convert/pdf-to-jpg',
      buttonMatcher: 'Extract',
      expectedFilename: 'sample-doc-page-1.jpg',
    });

    // 8. PDF -> PNG
    await testPath({
      stepNumber: 8,
      operation: 'PDF → PNG',
      inputNames: ['sample-doc.pdf'],
      route: '/convert/pdf-to-png',
      buttonMatcher: 'Extract',
      expectedFilename: 'sample-doc-page-1.png',
    });

    // 9. PPTX -> PDF
    await testPath({
      stepNumber: 9,
      operation: 'PPTX → PDF',
      inputNames: ['sample-deck.pptx'],
      route: '/convert/pptx-to-pdf',
      buttonMatcher: 'Convert to PDF',
      expectedFilename: 'sample-deck.pdf',
    });

    // 10. PPTX -> PNG
    await testPath({
      stepNumber: 10,
      operation: 'PPTX → PNG',
      inputNames: ['sample-deck.pptx'],
      route: '/convert/pptx-to-png',
      buttonMatcher: 'Export All Slides as PNG',
      expectedFilename: 'sample-deck-slide-1.png',
    });

    // 11. PPTX -> JPG
    await testPath({
      stepNumber: 11,
      operation: 'PPTX → JPG',
      inputNames: ['sample-deck.pptx'],
      route: '/convert/pptx-to-jpg',
      buttonMatcher: 'Export All Slides as JPG',
      expectedFilename: 'sample-deck-slide-1.jpg',
    });

    // 12. PPTX -> TXT
    await testPath({
      stepNumber: 12,
      operation: 'PPTX → TXT',
      inputNames: ['sample-deck.pptx'],
      route: '/convert/pptx-to-text',
      buttonMatcher: 'Extract Text Content',
      expectedFilename: 'sample-deck.txt',
      downloadSelector: 'a[download="sample-deck.txt"]',
    });

    // 13. PPTX -> MD
    await testPath({
      stepNumber: 13,
      operation: 'PPTX → MD',
      inputNames: ['sample-deck.pptx'],
      route: '/convert/pptx-to-text',
      buttonMatcher: 'Extract Text Content',
      expectedFilename: 'sample-deck.md',
      downloadSelector: 'a[download="sample-deck.md"]',
    });

    // 14. Batch ZIP
    await testPath({
      stepNumber: 14,
      operation: 'Batch ZIP',
      inputNames: ['sample-photo-1.jpg', 'sample-photo-2.jpg'],
      route: '/convert/jpg-to-png',
      buttonMatcher: 'Convert 2 Files',
      expectedFilename: 'infini-convert-batch.zip',
      downloadSelector: 'a[download="infini-convert-batch.zip"]',
    });

  } finally {
    await browser.close();
  }

  console.log('\n================ FINAL VERIFICATION TABLE ================');
  console.log('| Operation | Input | Actual Browser Filename | UUID? | PASS/FAIL |');
  console.log('|---|---|---|---|---|');
  for (const r of results) {
    console.log(`| ${r.operation} | ${r.input} | \`${r.actualBrowserFilename}\` | ${r.hasUuid} | ${r.pass} |`);
  }
  console.log('==========================================================\n');

  const allPassed = results.length === 14 && results.every(r => r.pass === 'PASS');
  if (!allPassed) {
    console.error('FAILED: Not all download paths passed verification.');
    process.exit(1);
  } else {
    console.log('ALL 14 DOWNLOAD PATHS VERIFIED PASS IN REAL BROWSER!');
  }
}

runVerification().catch((err) => {
  console.error('Fatal error during download verification:', err);
  process.exit(1);
});
