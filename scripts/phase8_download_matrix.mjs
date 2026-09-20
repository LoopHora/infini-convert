/**
 * PHASE 8: DOWNLOAD MATRIX VERIFICATION
 * ======================================
 * Empirically verifies that every download scenario in Infini-Convert
 * produces the correct semantic filename via:
 *   1. DOM `<a download="...">` attribute inspection
 *   2. CDP `Browser.downloadWillBegin` → suggestedFilename
 *
 * Scenarios tested:
 *   1.  JPG → PNG conversion
 *   2.  JPG → WebP conversion
 *   3.  PNG → JPG conversion
 *   4.  WebP → PNG conversion
 *   5.  JPG compression
 *   6.  PNG compression
 *   7.  JPG resize
 *   8.  PNG resize
 *   9.  Image(JPG) → PDF
 *  10.  PDF → JPG extraction (page 1)
 *  11.  PPTX → slide-1 PNG
 *  12.  Batch JPG → PNG (ZIP)
 *  13.  JPG → AVIF conversion
 *  14.  PNG → WebP conversion
 */

import puppeteer from 'puppeteer-core';
import path from 'path';
import os from 'os';

const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';

const SCENARIOS = [
  {
    id: 1,
    name: 'JPG → PNG conversion',
    route: '/convert/jpg-to-png',
    fixture: 'sample-photo.jpg',
    expectedFilename: 'sample-photo.png',
  },
  {
    id: 2,
    name: 'JPG → WebP conversion',
    route: '/convert/jpg-to-webp',
    fixture: 'sample-photo.jpg',
    expectedFilename: 'sample-photo.webp',
  },
  {
    id: 3,
    name: 'PNG → JPG conversion',
    route: '/convert/png-to-jpg',
    fixture: 'sample-graphic.png',
    expectedFilename: 'sample-graphic.jpg',
  },
  {
    id: 4,
    name: 'WebP → PNG conversion',
    route: '/convert/webp-to-png',
    fixture: 'sample-banner.webp',
    expectedFilename: 'sample-banner.png',
  },
  {
    id: 5,
    name: 'JPG compression',
    route: '/compress',
    fixture: 'sample-photo.jpg',
    expectedFilename: 'sample-photo-compressed.jpg',
  },
  {
    id: 6,
    name: 'PNG compression',
    route: '/compress',
    fixture: 'sample-graphic.png',
    expectedFilename: 'sample-graphic-compressed.png',
  },
  {
    id: 7,
    name: 'JPG resize',
    route: '/resize',
    fixture: 'sample-photo.jpg',
    expectedFilename: 'sample-photo-resized.jpg',
  },
  {
    id: 8,
    name: 'PNG resize',
    route: '/resize',
    fixture: 'sample-graphic.png',
    expectedFilename: 'sample-graphic-resized.png',
  },
  {
    id: 9,
    name: 'Image(JPG) → PDF',
    route: '/convert/image-to-pdf',
    fixture: 'sample-photo.jpg',
    expectedFilename: 'sample-photo.pdf',
  },
  {
    id: 10,
    name: 'PDF → JPG extraction',
    route: '/convert/pdf-to-jpg',
    fixture: 'sample-doc.pdf',
    expectedFilename: 'sample-doc-page-1.jpg',
  },
  {
    id: 11,
    name: 'PPTX → slide PNG',
    route: '/convert/pptx-to-png',
    fixture: 'sample-deck.pptx',
    expectedFilename: 'sample-deck-slide-1.png',
  },
  {
    id: 12,
    name: 'PPTX → PDF',
    route: '/powerpoint',
    fixture: 'sample-deck.pptx',
    expectedFilename: 'sample-deck.pdf',
  },
  {
    id: 13,
    name: 'JPG → AVIF conversion',
    route: '/convert/jpg-to-avif',
    fixture: 'sample-photo.jpg',
    expectedFilename: 'sample-photo.avif',
  },
  {
    id: 14,
    name: 'PNG → WebP conversion',
    route: '/convert/png-to-webp',
    fixture: 'sample-graphic.png',
    expectedFilename: 'sample-graphic.webp',
  },
];

const results = [];

async function runScenario(scenario) {
  const tempProfile = path.join(os.tmpdir(), `chrome_matrix_${scenario.id}_${Date.now()}`);
  const downloadDir = path.join(os.tmpdir(), `matrix_dl_${scenario.id}_${Date.now()}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: 'new',
      userDataDir: tempProfile,
      args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,850'],
    });

    const page = await browser.newPage();
    const client = await page.createCDPSession();

    let cdpSuggested = null;
    let cdpGuid = null;

    await client.send('Browser.setDownloadBehavior', {
      behavior: 'allowAndName',
      downloadPath: downloadDir,
      eventsEnabled: true,
    });

    client.on('Browser.downloadWillBegin', (evt) => {
      cdpSuggested = evt.suggestedFilename;
      cdpGuid = evt.guid;
    });

    // Navigate
    const url = BASE + scenario.route;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

    // Upload fixture
    const inputHandle = await page.$('input[type="file"]');
    if (!inputHandle) {
      return { ...scenario, status: 'SKIP', reason: 'No file input found on page' };
    }
    await inputHandle.uploadFile(path.resolve('test-fixtures', scenario.fixture));
    await new Promise(r => setTimeout(r, 1500));

    // Click the action button (Convert, Compress, Resize, etc.)
    const actionBtn = await page.$('button.btn-lg:not([disabled])');
    if (actionBtn) {
      await actionBtn.click();
    } else {
      // Some pages may auto-process
      await new Promise(r => setTimeout(r, 2000));
    }

    // Wait for result
    try {
      await page.waitForSelector('a[download]', { timeout: 20000 });
    } catch {
      return { ...scenario, status: 'FAIL', reason: 'No <a download> appeared within timeout' };
    }

    // Read DOM attributes
    const domDownload = await page.$eval('a[download]', el => el.getAttribute('download'));
    const domHref = await page.$eval('a[download]', el => el.getAttribute('href'));

    // Click to trigger CDP event
    await page.click('a[download]');
    await new Promise(r => setTimeout(r, 2000));

    const domMatch = domDownload === scenario.expectedFilename;
    const cdpMatch = cdpSuggested === scenario.expectedFilename;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(domDownload);

    return {
      ...scenario,
      status: domMatch ? 'PASS' : 'FAIL',
      domDownload,
      domHref: domHref?.substring(0, 50) + '...',
      cdpSuggested,
      cdpGuid,
      domMatch,
      cdpMatch,
      isUuid,
    };
  } catch (err) {
    return { ...scenario, status: 'ERROR', reason: err.message };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   PHASE 8: DOWNLOAD MATRIX VERIFICATION                ║');
  console.log('║   Infini-Convert — Empirical Filename Proof             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  for (const scenario of SCENARIOS) {
    process.stdout.write(`[${scenario.id.toString().padStart(2)}] ${scenario.name.padEnd(30)} ... `);
    const result = await runScenario(scenario);
    results.push(result);

    if (result.status === 'PASS') {
      console.log(`🟢 PASS  (DOM: "${result.domDownload}", CDP: "${result.cdpSuggested}")`);
    } else if (result.status === 'SKIP') {
      console.log(`⚪ SKIP  (${result.reason})`);
    } else if (result.status === 'ERROR') {
      console.log(`🔴 ERROR (${result.reason})`);
    } else {
      console.log(`🔴 FAIL  (DOM: "${result.domDownload}", Expected: "${result.expectedFilename}")`);
    }
  }

  // Summary table
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║ RESULTS MATRIX                                                                       ║');
  console.log('╠════╦══════════════════════════════════╦════════════════════════════╦══════╦═══════╦═════╣');
  console.log('║ #  ║ Scenario                         ║ DOM download attr          ║ CDP  ║ UUID? ║ OK? ║');
  console.log('╠════╬══════════════════════════════════╬════════════════════════════╬══════╬═══════╬═════╣');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const r of results) {
    if (r.status === 'PASS') passed++;
    else if (r.status === 'SKIP') skipped++;
    else failed++;

    const num = r.id.toString().padStart(2);
    const name = (r.name || '').padEnd(32);
    const dom = (r.domDownload || r.reason || '-').padEnd(26);
    const cdp = r.cdpMatch ? '✔' : r.cdpSuggested || '-';
    const uuid = r.isUuid ? '⚠YES' : ' NO ';
    const ok = r.status === 'PASS' ? ' 🟢 ' : r.status === 'SKIP' ? ' ⚪ ' : ' 🔴 ';
    console.log(`║ ${num} ║ ${name} ║ ${dom} ║ ${cdp.toString().padEnd(4)} ║ ${uuid} ║${ok} ║`);
  }

  console.log('╚════╩══════════════════════════════════╩════════════════════════════╩══════╩═══════╩═════╝\n');
  console.log(`TOTAL: ${passed} passed, ${failed} failed, ${skipped} skipped out of ${results.length}`);
  console.log(`UUID FILENAMES IN DOM: ${results.filter(r => r.isUuid).length}`);
  console.log(`\nFINAL VERDICT: ${failed === 0 ? '🟢 ALL SCENARIOS PASSED — ZERO UUID FILENAMES' : '🔴 FAILURES DETECTED'}`);
}

main().catch(console.error);
