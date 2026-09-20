import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import os from 'os';

const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

console.log('=== VERIFYING DOWNLOAD SUGGESTED FILENAME & CD ARTIFACT PATHS ===\n');

async function testDownload() {
  const tempProfile = path.join(os.tmpdir(), 'chrome_audit_profile_' + Date.now());
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    userDataDir: tempProfile,
    args: ['--no-sandbox', '--window-size=1280,850'],
  });

  const page = await browser.newPage();
  
  // Intercept CDP download events
  const client = await page.createCDPSession();
  let cdpSuggestedFilename = null;
  let cdpGuid = null;

  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allowAndName',
    downloadPath: path.join(os.tmpdir(), 'test_cdp_artifacts'),
    eventsEnabled: true,
  });

  client.on('Browser.downloadWillBegin', (evt) => {
    console.log('[CDP EVENT] Browser.downloadWillBegin:');
    console.log('            suggestedFilename =', evt.suggestedFilename);
    console.log('            guid              =', evt.guid);
    console.log('            url               =', evt.url);
    cdpSuggestedFilename = evt.suggestedFilename;
    cdpGuid = evt.guid;
  });

  client.on('Browser.downloadProgress', (evt) => {
    if (evt.state === 'completed') {
      console.log('[CDP EVENT] Browser.downloadProgress: COMPLETED');
    }
  });

  console.log('Navigating to http://localhost:5173/convert/jpg-to-png...');
  await page.goto('http://localhost:5173/convert/jpg-to-png', { waitUntil: 'networkidle0' });

  console.log('Uploading sample-photo.jpg...');
  const inputHandle = await page.$('input[type="file"]');
  await inputHandle.uploadFile(path.resolve('test-fixtures/sample-photo.jpg'));
  await new Promise(r => setTimeout(r, 1000));

  console.log('Clicking Convert File...');
  await page.waitForSelector('button.btn-lg:not([disabled])');
  await page.click('button.btn-lg');

  console.log('Waiting for persistent <a download> element...');
  await page.waitForSelector('a[download]');
  const aDownload = await page.$eval('a[download]', el => el.getAttribute('download'));
  const aHref = await page.$eval('a[download]', el => el.getAttribute('href'));

  console.log('Persistent anchor attributes in DOM:');
  console.log('  href     =', aHref);
  console.log('  download =', aDownload);

  console.log('Simulating physical user click on persistent anchor...');
  await page.click('a[download]');
  await new Promise(r => setTimeout(r, 3000));

  await browser.close();

  console.log('\n--- VERIFICATION FINDINGS ---');
  console.log('1. DOM download attribute:      ', aDownload);
  console.log('2. CDP suggestedFilename:       ', cdpSuggestedFilename);
  console.log('3. Test harness internal GUID:  ', cdpGuid);
  
  const isMatch = aDownload === 'sample-photo.png' && cdpSuggestedFilename === 'sample-photo.png';
  console.log('\nConclusion:');
  console.log('The requested/suggested filename is unequivocally:', aDownload);
  console.log('The GUID (' + cdpGuid + ') is exclusively the test harness internal artifact ID.');
  console.log('MATCH STATUS:', isMatch ? '🟢 PERFECT MATCH' : '🔴 MISMATCH');
}

testDownload().catch(console.error);
