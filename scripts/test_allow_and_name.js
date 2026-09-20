import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const testDir = path.resolve('test_allow_and_name');
if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
fs.mkdirSync(testDir, { recursive: true });

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', {
    behavior: 'allowAndName',
    downloadPath: testDir,
    eventsEnabled: true,
  });

  client.on('Browser.downloadWillBegin', (evt) => {
    console.log('EVENT Browser.downloadWillBegin:', evt.guid, evt.suggestedFilename);
  });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body>
        <a id="blob" href="blob:none" download="from-blob.png">Blob</a>
        <a id="data" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" download="from-data.png">Data</a>
        <script>
          const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
          document.getElementById('blob').href = URL.createObjectURL(blob);
        </script>
      </body>
    </html>
  `);

  console.log('Clicking blob link under allowAndName...');
  await page.click('#blob');
  await new Promise(r => setTimeout(r, 1500));
  console.log('Files in testDir after blob:', fs.readdirSync(testDir));

  console.log('Clicking data link under allowAndName...');
  await page.click('#data');
  await new Promise(r => setTimeout(r, 1500));
  console.log('Files in testDir after data:', fs.readdirSync(testDir));

  await browser.close();
}

main().catch(console.error);
