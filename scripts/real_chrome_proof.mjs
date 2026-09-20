/**
 * DEFINITIVE PROOF: Real Chrome Download Test
 * ============================================
 * Opens a real standalone Chrome window (NOT the IDE's embedded browser),
 * performs a conversion, clicks the download link, and checks what file
 * actually lands in the Windows Downloads folder.
 */
import puppeteer from 'puppeteer-core';
import path from 'path';
import os from 'os';
import fs from 'fs';

const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const downloadDir = path.join(os.homedir(), 'Downloads');

async function main() {
  const tempProfile = path.join(os.tmpdir(), 'real_chrome_proof_' + Date.now());
  
  console.log('=== DEFINITIVE PROOF: REAL CHROME DOWNLOAD TEST ===\n');
  console.log('Download directory:', downloadDir);
  
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    userDataDir: tempProfile,
    args: ['--no-sandbox', '--window-size=1280,850'],
  });

  const page = await browser.newPage();
  
  // Set downloads to go to the REAL Downloads folder
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir,
  });

  // Listen for download events
  let suggestedFilename = null;
  client.on('Browser.downloadWillBegin', (evt) => {
    suggestedFilename = evt.suggestedFilename;
    console.log('[CDP] suggestedFilename:', evt.suggestedFilename);
    console.log('[CDP] url:', evt.url.substring(0, 60));
  });
  
  client.on('Browser.downloadProgress', (evt) => {
    if (evt.state === 'completed') {
      console.log('[CDP] Download state: COMPLETED');
    }
  });

  // Navigate to JPG-to-PNG page
  console.log('\n1. Navigating to http://localhost:5173/convert/jpg-to-png...');
  await page.goto('http://localhost:5173/convert/jpg-to-png', { waitUntil: 'networkidle0' });

  // Upload test fixture
  console.log('2. Uploading sample-photo.jpg...');
  const input = await page.$('input[type="file"]');
  await input.uploadFile(path.resolve('test-fixtures/sample-photo.jpg'));
  await new Promise(r => setTimeout(r, 1500));

  // Click Convert
  console.log('3. Clicking Convert File...');
  await page.waitForSelector('button.btn-lg:not([disabled])');
  await page.click('button.btn-lg');
  
  // Wait for result
  console.log('4. Waiting for <a download> to appear...');
  await page.waitForSelector('a[download]', { timeout: 15000 });
  
  // Read the download attribute
  const downloadAttr = await page.$eval('a[download]', el => el.getAttribute('download'));
  const hrefAttr = await page.$eval('a[download]', el => el.getAttribute('href'));
  console.log('\n   DOM <a> download attribute:', downloadAttr);
  console.log('   DOM <a> href:', hrefAttr.substring(0, 70));
  
  // Snapshot: files in Downloads before clicking
  const beforeFiles = new Set(fs.readdirSync(downloadDir));
  
  // Click the real download link
  console.log('\n5. Clicking Download File link...');
  await page.click('a[download]');
  
  // Wait for download to complete
  await new Promise(r => setTimeout(r, 5000));
  
  // Check what NEW files landed in Downloads folder
  const afterFiles = fs.readdirSync(downloadDir);
  const newFiles = afterFiles
    .filter(f => !beforeFiles.has(f))
    .map(f => {
      const stat = fs.statSync(path.join(downloadDir, f));
      return { name: f, size: stat.size, mtime: stat.mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);

  // Also check recently modified files (in case of name collision)
  const recentFiles = afterFiles
    .map(f => {
      const stat = fs.statSync(path.join(downloadDir, f));
      return { name: f, size: stat.size, mtime: stat.mtime };
    })
    .filter(f => f.mtime > new Date(Date.now() - 15000))
    .sort((a, b) => b.mtime - a.mtime);
  
  console.log('\n=== RESULTS ===\n');
  
  console.log('NEW files in Downloads folder:');
  if (newFiles.length === 0) {
    console.log('  (none - file may have overwritten existing)');
  }
  for (const f of newFiles) {
    console.log(`  ${f.name} (${f.size} bytes)`);
  }
  
  console.log('\nRecently modified files (last 15s):');
  for (const f of recentFiles) {
    console.log(`  ${f.name} (${f.size} bytes, ${f.mtime.toISOString()})`);
  }
  
  const actualFilename = recentFiles.length > 0 ? recentFiles[0].name : (newFiles.length > 0 ? newFiles[0].name : 'UNKNOWN');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(actualFilename);
  
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║              DEFINITIVE VERDICT                  ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║ DOM download attr:     ${downloadAttr.padEnd(25)}║`);
  console.log(`║ CDP suggestedFilename: ${(suggestedFilename || 'N/A').padEnd(25)}║`);
  console.log(`║ Actual file on disk:   ${actualFilename.padEnd(25)}║`);
  console.log(`║ UUID filename?         ${(isUuid ? 'YES ❌ BUG!' : 'NO ✅ CORRECT').padEnd(25)}║`);
  console.log('╚══════════════════════════════════════════════════╝');
  
  // Check Playwright artifacts dir too
  const pwDir = 'C:\\Users\\user\\AppData\\Local\\Temp\\playwright-artifacts-b1qpgA';
  if (fs.existsSync(pwDir)) {
    const pwFiles = fs.readdirSync(pwDir)
      .map(f => ({ name: f, stat: fs.statSync(path.join(pwDir, f)) }))
      .filter(f => f.stat.mtime > new Date(Date.now() - 15000));
    
    console.log('\nPlaywright artifacts created in last 15s:', pwFiles.length === 0 ? 'NONE (good!)' : '');
    for (const f of pwFiles) {
      console.log(`  ${f.name} (${f.stat.size} bytes) ← THIS IS IDE ARTIFACT, NOT APP`);
    }
  }
  
  await browser.close();
}

main().catch(console.error);
