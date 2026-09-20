import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/powerpoint');

  const result = await page.evaluate(async () => {
    const pptxModule = await import('/src/engine/pptx/index.ts');
    const htmlToImage = await import('html-to-image');

    const res = await fetch('/test-fixtures/sample-deck.pptx');
    const blob = await res.blob();
    const file = new File([blob], 'sample-deck.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });

    const JSZip = (await import('jszip')).default;
    const { parseZip, buildPresentation, RECOMMENDED_ZIP_LIMITS, renderSlide } = await import('@aiden0z/pptx-renderer');
    const buffer = await file.arrayBuffer();
    const zipFiles = await parseZip(buffer, RECOMMENDED_ZIP_LIMITS);
    const presentation = buildPresentation(zipFiles);
    const slide = presentation.slides[0];

    const testApproaches = [
      {
        name: 'Approach 1: Off-screen wrapper (left: -99999px) with relative container',
        setup: () => {
          const wrapper = document.createElement('div');
          wrapper.style.position = 'fixed';
          wrapper.style.left = '-99999px';
          wrapper.style.top = '-99999px';
          wrapper.style.width = '1200px';
          wrapper.style.height = '800px';
          wrapper.style.overflow = 'hidden';
          document.body.appendChild(wrapper);

          const container = document.createElement('div');
          container.style.position = 'relative';
          container.style.left = '0px';
          container.style.top = '0px';
          container.style.width = '960px';
          container.style.height = '540px';
          container.style.backgroundColor = '#ffffff';
          wrapper.appendChild(container);
          return { wrapper, container };
        }
      },
      {
        name: 'Approach 2: Zero-size overflow-hidden wrapper at (0,0)',
        setup: () => {
          const wrapper = document.createElement('div');
          wrapper.style.position = 'fixed';
          wrapper.style.left = '0px';
          wrapper.style.top = '0px';
          wrapper.style.width = '0px';
          wrapper.style.height = '0px';
          wrapper.style.overflow = 'hidden';
          wrapper.style.pointerEvents = 'none';
          document.body.appendChild(wrapper);

          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.left = '0px';
          container.style.top = '0px';
          container.style.width = '960px';
          container.style.height = '540px';
          container.style.backgroundColor = '#ffffff';
          wrapper.appendChild(container);
          return { wrapper, container };
        }
      },
      {
        name: 'Approach 3: Clip-path inset(100%) on wrapper',
        setup: () => {
          const wrapper = document.createElement('div');
          wrapper.style.position = 'fixed';
          wrapper.style.left = '0px';
          wrapper.style.top = '0px';
          wrapper.style.width = '960px';
          wrapper.style.height = '540px';
          wrapper.style.clipPath = 'inset(100%)';
          wrapper.style.pointerEvents = 'none';
          document.body.appendChild(wrapper);

          const container = document.createElement('div');
          container.style.position = 'relative';
          container.style.width = '960px';
          container.style.height = '540px';
          container.style.backgroundColor = '#ffffff';
          wrapper.appendChild(container);
          return { wrapper, container };
        }
      }
    ];

    const outcomes = [];

    for (const app of testApproaches) {
      const { wrapper, container } = app.setup();
      const handle = renderSlide(presentation, slide);
      container.appendChild(handle.element);
      await handle.ready;
      await new Promise(r => setTimeout(r, 60));

      const dataUrl = await htmlToImage.toPng(container, {
        backgroundColor: '#ffffff',
        pixelRatio: 1.5,
        skipFonts: true,
        width: 960,
        height: 540,
      });

      handle.dispose();
      document.body.removeChild(wrapper);

      // Check non-white pixels
      const img = new Image();
      const nonWhite = await new Promise((res) => {
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const d = ctx.getImageData(0, 0, c.width, c.height).data;
          let count = 0;
          for (let i = 0; i < d.length; i += 4) {
            if (d[i] < 250 || d[i+1] < 250 || d[i+2] < 250) count++;
          }
          res(count);
        };
        img.src = dataUrl;
      });

      outcomes.push({
        name: app.name,
        dataUrlLen: dataUrl.length,
        nonWhitePixels: nonWhite
      });
    }

    return outcomes;
  });

  console.log('Outcomes:', JSON.stringify(result, null, 2));
  await browser.close();
}

test().catch(console.error);
