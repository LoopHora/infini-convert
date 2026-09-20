import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');

  const result = await page.evaluate(async () => {
    const htmlToImage = await import('html-to-image');

    // Test 1: offscreen with left: -10000px
    const div1 = document.createElement('div');
    div1.style.position = 'fixed';
    div1.style.left = '-10000px';
    div1.style.top = '-10000px';
    div1.style.width = '300px';
    div1.style.height = '200px';
    div1.style.backgroundColor = 'red';
    div1.innerHTML = '<h1 style="color:blue;">Hello 1</h1>';
    document.body.appendChild(div1);

    const url1 = await htmlToImage.toPng(div1);

    // Test 2: onscreen
    const div2 = document.createElement('div');
    div2.style.position = 'fixed';
    div2.style.left = '0px';
    div2.style.top = '0px';
    div2.style.zIndex = '-9999';
    div2.style.width = '300px';
    div2.style.height = '200px';
    div2.style.backgroundColor = 'red';
    div2.innerHTML = '<h1 style="color:blue;">Hello 2</h1>';
    document.body.appendChild(div2);

    const url2 = await htmlToImage.toPng(div2);

    return {
      len1: url1.length,
      len2: url2.length,
      data1: url1.slice(0, 100),
      data2: url2.slice(0, 100)
    };
  });

  console.log('Result:', result);
  await browser.close();
}

test().catch(console.error);
