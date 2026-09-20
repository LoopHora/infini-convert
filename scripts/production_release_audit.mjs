import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4173';

async function runProductionReleaseAudit() {
  console.log('================================================================');
  console.log('       INFINI-CONVERT: PRE-PRODUCTION RELEASE AUDIT             ');
  console.log('         Running against Production Build (dist/) on ' + BASE_URL);
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const auditReport = {
    routing: [],
    networkPrivacy: {
      outboundDataRequests: 0,
      externalEndpoints: new Set(),
      localAssetRequests: 0,
    },
    features: {},
    mobileResponsiveness: {},
  };

  try {
    const page = await browser.newPage();

    // -------------------------------------------------------------
    // SECTION 1: NETWORK & PRIVACY MONITORING
    // -------------------------------------------------------------
    page.on('request', (req) => {
      const url = req.url();
      const method = req.method();
      const postData = req.postData();

      if (url.startsWith('http://localhost:4173')) {
        auditReport.networkPrivacy.localAssetRequests++;
      } else if (url.startsWith('blob:') || url.startsWith('data:')) {
        // internal in-memory blob
      } else {
        auditReport.networkPrivacy.externalEndpoints.add(url);
      }

      // Check if any request is sending user payload to an external server
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        if (!url.startsWith('http://localhost:4173')) {
          console.warn(`[PRIVACY VIOLATION DETECTED] Outbound data to ${url}`);
          auditReport.networkPrivacy.outboundDataRequests++;
        }
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`[PROD BROWSER ERROR]: ${msg.text()}`);
      }
    });

    // -------------------------------------------------------------
    // SECTION 2: SPA ROUTING & DEEP-LINK AUDIT
    // -------------------------------------------------------------
    console.log('--- 1. AUDITING SPA ROUTING & DEEP LINKS ---');
    const routesToTest = [
      '/',
      '/convert/jpg-to-png',
      '/convert/image-to-pdf',
      '/compress/image',
      '/resize/image',
      '/resize/image?mode=crop',
      '/crop',
      '/powerpoint',
      '/privacy',
      '/about'
    ];

    for (const route of routesToTest) {
      const targetUrl = `${BASE_URL}${route}`;
      const res = await page.goto(targetUrl, { waitUntil: 'networkidle0' });
      const status = res?.status() || 0;
      const title = await page.title();
      const hasRoot = await page.$('#root');

      const pass = status === 200 && Boolean(hasRoot) && title.includes('Infini-Convert');
      console.log(`  [Route Audit] ${route.padEnd(26)} -> Status: ${status} | Title: "${title}" | Pass: ${pass ? 'YES' : 'NO'}`);
      auditReport.routing.push({ route, status, pass });
    }

    // -------------------------------------------------------------
    // SECTION 3: CORE FEATURE CONVERSION & DOWNLOAD TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. AUDITING CORE FEATURES (PROD BUNDLE) ---');

    // A. Image Format Conversion (JPG -> PNG)
    console.log('  Testing Feature: Image Conversion (JPG -> PNG)...');
    await page.goto(`${BASE_URL}/convert/jpg-to-png`, { waitUntil: 'networkidle0' });
    let fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('test-fixtures/sample-photo.jpg');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('Convert')));
    
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Convert'));
      btn?.click();
    });

    await page.waitForSelector('a[download]', { timeout: 6000 });
    const convertFilename = await page.$eval('a[download]', el => el.getAttribute('download'));
    console.log(`    Convert Download Name: ${convertFilename}`);
    auditReport.features.convert = {
      filename: convertFilename,
      pass: convertFilename === 'sample-photo.png'
    };

    // B. Image Resize
    console.log('  Testing Feature: Image Resize (800x600 -> 400x300)...');
    await page.goto(`${BASE_URL}/resize/image`, { waitUntil: 'networkidle0' });
    fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('test-fixtures/test-800x600.png');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => b.textContent?.trim() === '50%'));
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '50%');
      btn?.click();
    });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Resize') && !b.textContent?.includes('Dimensions'));
      btn?.click();
    });
    await page.waitForSelector('a[download]', { timeout: 6000 });
    const resizeFilename = await page.$eval('a[download]', el => el.getAttribute('download'));
    const resizeDimensions = await page.$eval('.card-panel', el => el.innerText.match(/Dimensions: [^\n]+/)?.[0]);
    console.log(`    Resize Download Name: ${resizeFilename} | ${resizeDimensions}`);
    auditReport.features.resize = {
      filename: resizeFilename,
      dimensions: resizeDimensions,
      pass: resizeFilename === 'test-800x600-resized.png' && resizeDimensions?.includes('400 × 300px')
    };

    // C. Free Crop
    console.log('  Testing Feature: Draggable Free Crop (1:1 Square Preset)...');
    await page.goto(`${BASE_URL}/resize/image?mode=crop`, { waitUntil: 'networkidle0' });
    fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('test-fixtures/test-800x600.png');
    await page.waitForSelector('[title*="handle to crop"]', { timeout: 6000 });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('1:1 Square'));
      btn?.click();
    });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Crop & Download'));
      btn?.click();
    });
    await page.waitForSelector('a[download]', { timeout: 6000 });
    const cropFilename = await page.$eval('a[download]', el => el.getAttribute('download'));
    const cropDimensions = await page.$eval('.card-panel', el => el.innerText.match(/Dimensions: [^\n]+/)?.[0]);
    console.log(`    Crop Download Name: ${cropFilename} | ${cropDimensions}`);
    auditReport.features.crop = {
      filename: cropFilename,
      dimensions: cropDimensions,
      pass: cropFilename === 'test-800x600-cropped.png' && cropDimensions?.includes('600 × 600px')
    };

    // D. Image to PDF
    console.log('  Testing Feature: Image to PDF...');
    await page.goto(`${BASE_URL}/convert/image-to-pdf`, { waitUntil: 'networkidle0' });
    fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('test-fixtures/test-800x600.png');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('Generate PDF')));
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Generate PDF'));
      btn?.click();
    });
    await page.waitForSelector('a[download]', { timeout: 8000 });
    const pdfFilename = await page.$eval('a[download]', el => el.getAttribute('download'));
    console.log(`    PDF Download Name: ${pdfFilename}`);
    auditReport.features.pdf = {
      filename: pdfFilename,
      pass: pdfFilename === 'test-800x600.pdf'
    };

    // E. PowerPoint to PDF
    console.log('  Testing Feature: PowerPoint to PDF...');
    await page.goto(`${BASE_URL}/powerpoint`, { waitUntil: 'networkidle0' });
    fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('test-fixtures/sample-deck.pptx');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => b.textContent?.trim() === 'Convert to PDF'), { timeout: 10000 });
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Convert to PDF');
      btn?.click();
    });
    await page.waitForSelector('a[download]', { timeout: 15000 });
    const pptxDownloadName = await page.$eval('a[download]', el => el.getAttribute('download'));
    console.log(`    PPTX Download Name: ${pptxDownloadName}`);
    auditReport.features.pptx = {
      filename: pptxDownloadName,
      pass: Boolean(pptxDownloadName?.includes('sample-deck'))
    };

    // -------------------------------------------------------------
    // SECTION 4: MOBILE VIEWPORT & RESPONSIVE AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 3. AUDITING MOBILE RESPONSIVENESS (iPhone 15 Pro) ---');
    await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const noHorizontalOverflow = scrollWidth <= clientWidth;
    console.log(`  Mobile Viewport: 393px | Body Scroll Width: ${scrollWidth}px | Overflow Pass: ${noHorizontalOverflow ? 'YES' : 'NO'}`);

    auditReport.mobileResponsiveness = {
      viewport: '393x852',
      scrollWidth,
      clientWidth,
      noHorizontalOverflow
    };

    // -------------------------------------------------------------
    // SECTION 5: FINAL PRIVACY EVALUATION
    // -------------------------------------------------------------
    console.log('\n--- 4. AUDITING PRIVACY & ZERO-UPLOAD GUARANTEE ---');
    console.log(`  Total Local Asset Requests: ${auditReport.networkPrivacy.localAssetRequests}`);
    console.log(`  Total Outbound POST/PUT Requests: ${auditReport.networkPrivacy.outboundDataRequests}`);
    console.log(`  External Domains Contacted: ${Array.from(auditReport.networkPrivacy.externalEndpoints).join(', ') || 'None (100% Local)'}`);

    const privacyPassed = auditReport.networkPrivacy.outboundDataRequests === 0;
    console.log(`  Privacy Guarantee Verified: ${privacyPassed ? 'PASSED (Zero Uploads)' : 'FAILED'}`);

    console.log('\n================================================================');
    console.log('              AUDIT RUN COMPLETED SUCCESSFULLY                  ');
    console.log('================================================================\n');

    fs.writeFileSync('dist_audit_report.json', JSON.stringify({
      ...auditReport,
      networkPrivacy: {
        ...auditReport.networkPrivacy,
        externalEndpoints: Array.from(auditReport.networkPrivacy.externalEndpoints)
      }
    }, null, 2));

  } finally {
    await browser.close();
  }
}

runProductionReleaseAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
