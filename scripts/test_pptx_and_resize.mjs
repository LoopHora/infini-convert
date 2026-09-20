import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function testPptx() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:5173/powerpoint', { waitUntil: 'networkidle0' });

    const testResult = await page.evaluate(async () => {
      try {
        const pptxModule = await import('/src/engine/pptx/index.ts');

        const res = await fetch('/test-fixtures/sample-deck.pptx');
        const blob = await res.blob();
        const file = new File([blob], 'sample-deck.pptx', {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        });

        console.log('Calling renderPptxSlides...');
        const slides = await pptxModule.renderPptxSlides(file, { format: 'png' });
        console.log('renderPptxSlides done. Slides:', slides.length);

        const slideInfo = [];
        for (const s of slides) {
          const buf = await s.blob.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(buf);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          slideInfo.push({
            slideNumber: s.slideNumber,
            width: s.width,
            height: s.height,
            byteSize: buf.byteLength,
            base64: btoa(binary)
          });
        }

        console.log('Calling pptxToPdf...');
        const pdfBlob = await pptxModule.pptxToPdf(file);
        const pdfBuf = await pdfBlob.arrayBuffer();
        let pdfBinary = '';
        const pdfBytes = new Uint8Array(pdfBuf);
        for (let i = 0; i < pdfBytes.byteLength; i++) {
          pdfBinary += String.fromCharCode(pdfBytes[i]);
        }

        return {
          success: true,
          slides: slideInfo,
          pdfByteSize: pdfBuf.byteLength,
          pdfBase64: btoa(pdfBinary)
        };
      } catch (e) {
        return { error: e.message, stack: e.stack };
      }
    });

    if (testResult.error) {
      console.error('ERROR in evaluate:', testResult.error, testResult.stack);
    } else {
      console.log('Success! Slide count:', testResult.slides.length, 'PDF size:', testResult.pdfByteSize);
      if (testResult.slides.length > 0) {
        fs.writeFileSync('temp_slide1.png', Buffer.from(testResult.slides[0].base64, 'base64'));
        console.log('Saved temp_slide1.png, size:', fs.statSync('temp_slide1.png').size);
      }
      if (testResult.pdfBase64) {
        fs.writeFileSync('temp_deck.pdf', Buffer.from(testResult.pdfBase64, 'base64'));
        console.log('Saved temp_deck.pdf, size:', fs.statSync('temp_deck.pdf').size);
      }
    }

  } finally {
    await browser.close();
  }
}

testPptx().catch(console.error);
