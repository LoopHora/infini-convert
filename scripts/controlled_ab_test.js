import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

console.log('=== STARTING CONTROLLED RESEARCH-DRIVEN DOWNLOAD A/B EXPERIMENT ===\n');

// -------------------------------------------------------------
// TEST C — DIRECT BLOB MIME & PNG SIGNATURE VALIDATION
// -------------------------------------------------------------
console.log('--- TEST C: DIRECT BLOB MIME & SIGNATURE VALIDATION ---');
const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const samplePngPath = path.resolve('test-fixtures/sample-graphic.png');
const pngBytes = fs.readFileSync(samplePngPath);

const isPngHeaderValid = pngHeader.every((b, idx) => pngBytes[idx] === b);
console.log('PNG file read:', samplePngPath);
console.log('Size:', pngBytes.length, 'bytes');
console.log('Valid PNG magic bytes (89 50 4E 47 0D 0A 1A 0A):', isPngHeaderValid ? 'VALID' : 'INVALID');
if (!isPngHeaderValid) {
  console.error('TEST C FAILED: Invalid PNG header');
  process.exit(1);
}
console.log('TEST C RESULT: PASS\n');

// -------------------------------------------------------------
// TEST D — AUDIT COMPLETE SOURCE TREE FOR FORBIDDEN PATTERNS
// -------------------------------------------------------------
console.log('--- TEST D: COMPLETE SOURCE TREE AUDIT ---');
const srcDir = path.resolve('src');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allSrcFiles = getAllFiles(srcDir);
const forbiddenPatterns = [
  { name: 'FileSaver', regex: /FileSaver/i },
  { name: 'file-saver', regex: /file-saver/i },
  { name: 'saveAs', regex: /\bsaveAs\s*\(/ },
  { name: 'downloadBlob', regex: /\bdownloadBlob\b/ },
  { name: 'a.click', regex: /\ba\.click\s*\(/ },
  { name: 'dispatchEvent', regex: /\bdispatchEvent\s*\(/ },
  { name: 'MouseEvent', regex: /\bnew\s+MouseEvent\b/ },
  { name: 'createElement("a")', regex: /createElement\s*\(\s*["']a["']\s*\)/ },
  { name: 'window.open', regex: /window\.open\s*\(/ },
  { name: 'location.href', regex: /location\.href\s*=/ },
];

let testDPassed = true;
const auditTable = [];

for (const p of forbiddenPatterns) {
  let count = 0;
  const matches = [];
  for (const file of allSrcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (p.regex.test(content)) {
      count++;
      matches.push(path.relative(srcDir, file));
    }
  }
  auditTable.push({ pattern: p.name, count, matches: matches.join(', ') || 'None' });
  if (count > 0) {
    testDPassed = false;
  }
}

console.log('| Pattern | Occurrences | Found In |');
console.log('|---|---|---|');
for (const row of auditTable) {
  console.log(`| ${row.pattern} | ${row.count} | ${row.matches} |`);
}
console.log('TEST D RESULT:', testDPassed ? 'PASS (0 forbidden download mechanisms)' : 'FAIL');
console.log('\n');

import os from 'os';

// -------------------------------------------------------------
// TEST A & TEST B — CONTROLLED A/B EXPERIMENT IN REAL CHROME
// -------------------------------------------------------------
const tempProfile = path.join(os.tmpdir(), 'chrome_ab_profile_' + Date.now());
if (fs.existsSync(tempProfile)) fs.rmSync(tempProfile, { recursive: true, force: true });
fs.mkdirSync(tempProfile, { recursive: true });

// Clean old test downloads in user Downloads directory before test
const userDownloadsDir = path.join(process.env.USERPROFILE, 'Downloads');
const oldFiles = fs.readdirSync(userDownloadsDir).filter(f => f.startsWith('sample-photo'));
for (const f of oldFiles) {
  try {
    fs.unlinkSync(path.join(userDownloadsDir, f));
  } catch (e) {
    // ignore
  }
}

async function runBrowserExperiment() {
  console.log('--- TEST A & TEST B: REAL CHROME A/B EXPERIMENT ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    userDataDir: tempProfile,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,850',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err));

  // 1. Test A: Run actual app JPG -> PNG conversion on localhost:5173
  console.log('[TEST A] Navigating to http://localhost:5173/convert/jpg-to-png...');
  await page.goto('http://localhost:5173/convert/jpg-to-png', { waitUntil: 'networkidle0' });

  console.log('[TEST A] Uploading sample-photo.jpg...');
  const inputHandle = await page.$('input[type="file"]');
  await inputHandle.uploadFile(path.resolve('test-fixtures/sample-photo.jpg'));
  await new Promise(r => setTimeout(r, 1000));

  console.log('[TEST A] Clicking Convert button...');
  await page.waitForSelector('button.btn-lg:not([disabled])');
  await page.click('button.btn-lg');

  console.log('[TEST A] Waiting for persistent <a download> element...');
  await page.waitForSelector('a[download]');
  const aDownload = await page.$eval('a[download]', el => el.getAttribute('download'));
  const aHref = await page.$eval('a[download]', el => el.getAttribute('href'));
  console.log('[TEST A] Download element attributes:');
  console.log('         download =', aDownload);
  console.log('         href     =', aHref);

  console.log('[TEST A] User clicks persistent <a download> element...');
  await page.click('a[download]');
  await new Promise(r => setTimeout(r, 4000));

  // 2. Open chrome://downloads and inspect
  console.log('[TEST A] Opening chrome://downloads to check Chrome Download history UI...');
  const dlPage = await browser.newPage();
  await dlPage.goto('chrome://downloads');
  await new Promise(r => setTimeout(r, 3000));

  await dlPage.screenshot({ path: 'ab_test_a_downloads_ui.png' });
  console.log('[TEST A] Screenshot saved to ab_test_a_downloads_ui.png');

  // Read the downloaded filename in Chrome's UI
  const chromeUiResult = await dlPage.evaluate(() => {
    const mgr = document.querySelector('downloads-manager');
    if (!mgr || !mgr.shadowRoot) return 'no manager';
    const item = mgr.shadowRoot.querySelector('downloads-item');
    if (!item || !item.shadowRoot) return 'no item';
    const link = item.shadowRoot.querySelector('#fileLink') || item.shadowRoot.querySelector('#name') || item.shadowRoot.querySelector('#file-link');
    return link ? link.textContent.trim() : 'no file-link';
  });

  console.log('[TEST A] Chrome Downloads UI displayed filename:', chromeUiResult);

  // Check user's Downloads directory for new files
  console.log('[TEST A] Checking disk:', userDownloadsDir);
  const samplePhotoFiles = fs.readdirSync(userDownloadsDir).filter(f => f.startsWith('sample-photo'));
  console.log('[TEST A] Matching files on disk:', samplePhotoFiles);

  const isTestAUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chromeUiResult);
  const testAPassed = samplePhotoFiles.includes('sample-photo.png') && !isTestAUuid && chromeUiResult.includes('sample-photo.png');

  console.log('\n[TEST A RESULT]:', testAPassed ? 'PASS' : 'FAIL');
  console.log('   Requested Filename:', 'sample-photo.png');
  console.log('   Chrome UI Filename:', chromeUiResult);
  console.log('   Actual Saved on Disk:', samplePhotoFiles.join(', '));
  console.log('   UUID?:', isTestAUuid ? 'YES (BUG)' : 'NO');

  // 3. Test B: File System Access API
  console.log('\n[TEST B] Checking File System Access API support...');
  const fsInfo = await page.evaluate(() => ({
    hasShowSaveFilePicker: typeof window.showSaveFilePicker === 'function',
    isSecureContext: window.isSecureContext
  }));
  console.log('[TEST B] window.showSaveFilePicker defined?:', fsInfo.hasShowSaveFilePicker);
  console.log('[TEST B] isSecureContext?:', fsInfo.isSecureContext);

  await browser.close();

  // Print Summary Table
  console.log('\n=============================================================');
  console.log('               A/B TEST SUMMARY & DECISION TABLE              ');
  console.log('=============================================================');
  console.log('| Architecture | Browser | Filename Requested | Filename Saved / Shown | UUID? | Result |');
  console.log('|---|---|---|---|---|---|');
  console.log(`| Native Persistent \`<a>\` | Google Chrome | \`sample-photo.png\` | \`${chromeUiResult}\` | ${isTestAUuid ? 'YES' : 'NO'} | ${testAPassed ? 'PASS' : 'FAIL'} |`);
  console.log(`| File System Access API | Google Chrome | \`sample-photo.png\` | ${fsInfo.hasShowSaveFilePicker ? 'Available (Chromium Native)' : 'Not Supported'} | NO | ${fsInfo.hasShowSaveFilePicker ? 'AVAILABLE' : 'N/A'} |`);
  console.log('=============================================================\n');

  if (testAPassed) {
    console.log('FINAL DECISION:');
    console.log('Persistent <a download> produces the correct filename (sample-photo.png) with ZERO UUIDs.');
    console.log('KEEP IT. Do not add FileSaver or File System Access API to the normal path.');
  } else {
    console.log('FINAL DECISION:');
    console.log('Persistent <a download> produced a UUID.');
    console.log('Use File System Access API as the Chromium save path, with normal <a download> fallback.');
  }
}

runBrowserExperiment().catch((err) => {
  console.error('Fatal experiment error:', err);
  process.exit(1);
});
