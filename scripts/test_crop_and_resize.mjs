import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function testCropAndResize() {
  console.log('=== Starting E2E Verification: Resize & Draggable Free Crop ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
    });
    page.on('pageerror', (err) => console.log('PAGE UNCAUGHT ERROR:', err.message));

    // 1. Navigate to /resize/image
    console.log('\nStep 1: Navigating to http://localhost:5173/resize/image');
    await page.goto('http://localhost:5173/resize/image', { waitUntil: 'networkidle0' });

    // 2. Upload test image
    console.log('Step 2: Uploading test-fixtures/test-800x600.png');
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) throw new Error('File input not found');
    await fileInput.uploadFile('test-fixtures/test-800x600.png');

    // 3. Verify Preview is rendered
    console.log('Step 3: Checking image preview rendered');
    await page.waitForSelector('img[alt="Preview source"]', { timeout: 6000 });
    const previewSrc = await page.$eval('img[alt="Preview source"]', (el) => el.getAttribute('src'));
    console.log('Preview image loaded with src:', previewSrc?.slice(0, 30) + '...');

    // 4. Test Resize flow using 50% preset button
    console.log('Step 4: Testing 50% percentage preset button for Resize');
    const btn50 = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent?.trim() === '50%');
    });
    if (btn50) {
      await btn50.click();
    }

    const inputVals = await page.evaluate(() => {
      const wInput = document.querySelector('input[placeholder="Width"]');
      const hInput = document.querySelector('input[placeholder="Height"]');
      return { w: wInput?.value, h: hInput?.value };
    });
    console.log('Dimensions after 50% preset:', inputVals);

    // 5. Click Resize Image
    console.log('Step 5: Clicking Resize File');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Resize') && !b.textContent?.includes('Dimensions')
      );
      btn?.click();
    });

    await page.waitForSelector('a[download]', { timeout: 6000 });
    const resizeResult = await page.evaluate(() => {
      const dl = document.querySelector('a[download]');
      const card = document.querySelector('.card-panel')?.innerText;
      return {
        downloadAttr: dl?.getAttribute('download'),
        cardText: card,
      };
    });
    console.log('Resize Result:', resizeResult);

    if (!resizeResult.downloadAttr?.includes('resized.png')) {
      throw new Error(`Unexpected resize download filename: ${resizeResult.downloadAttr}`);
    }
    if (!resizeResult.cardText?.includes('400 × 300px')) {
      throw new Error(`Unexpected resize dimensions: ${resizeResult.cardText}`);
    }
    console.log('✓ Resize flow PASSED with exact dimensions 400 × 300px and semantic filename!');

    // 6. Click "Adjust Settings" to return to workspace
    console.log('\nStep 6: Clicking Adjust Settings to test Free Crop');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Adjust Settings')
      );
      btn?.click();
    });

    await page.waitForSelector('img[alt="Preview source"]', { timeout: 5000 });

    // 7. Switch to Free Crop Mode
    console.log('Step 7: Switching to Free Crop mode');
    await page.evaluate(() => {
      const cropTab = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Free Crop')
      );
      cropTab?.click();
    });

    await page.waitForSelector('[title*="handle to crop"]', { timeout: 5000 });
    const handleCount = await page.$$eval('[title*="handle to crop"]', (els) => els.length);
    console.log(`Found ${handleCount} interactive drag handles on crop box`);

    const selectionPill = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('div'));
      return pills.find((p) => p.textContent?.includes('Selection:'))?.innerText;
    });
    console.log('Initial Crop Selection Pill:', selectionPill);

    // 8. Test Aspect Ratio Preset (e.g. 1:1 Square)
    console.log('Step 8: Clicking 1:1 Square aspect ratio preset');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('1:1 Square')
      );
      btn?.click();
    });

    const squarePill = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('div'));
      return pills.find((p) => p.textContent?.includes('Selection:'))?.innerText;
    });
    console.log('Square Crop Selection Pill:', squarePill);

    // 9. Test dragging the SE handle with mouse pointer
    console.log('Step 9: Testing interactive drag on SE corner handle');
    const seHandle = await page.$('[title*="SE handle"]');
    if (seHandle) {
      const box = await seHandle.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        // Drag inward
        await page.mouse.move(box.x - 40, box.y - 40, { steps: 5 });
        await page.mouse.up();
      }
    }

    const draggedPill = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('div'));
      return pills.find((p) => p.textContent?.includes('Selection:'))?.innerText;
    });
    console.log('After Drag Crop Selection Pill:', draggedPill);

    // 10. Click Crop & Download Selection
    console.log('Step 10: Clicking Crop & Download Selection');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Crop & Download')
      );
      btn?.click();
    });

    await page.waitForSelector('a[download]', { timeout: 6000 });
    const cropResult = await page.evaluate(() => {
      const dl = document.querySelector('a[download]');
      const card = document.querySelector('.card-panel')?.innerText;
      return {
        downloadAttr: dl?.getAttribute('download'),
        cardText: card,
      };
    });
    console.log('Crop Result:', cropResult);

    if (!cropResult.downloadAttr?.includes('cropped.png')) {
      throw new Error(`Unexpected crop download filename: ${cropResult.downloadAttr}`);
    }
    console.log('✓ Free Crop flow PASSED with semantic filename:', cropResult.downloadAttr);
    console.log('✓ Output Dimensions in Result Card:', cropResult.cardText?.match(/Dimensions: [^\n]+/)?.[0]);

    // Take screenshot of the result card for user presentation
    await page.screenshot({ path: 'scripts/crop_and_resize_proof.png' });
    console.log('Screenshot saved to scripts/crop_and_resize_proof.png');

    console.log('\n=== ALL E2E VERIFICATION CHECKS PASSED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
  }
}

testCropAndResize().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
