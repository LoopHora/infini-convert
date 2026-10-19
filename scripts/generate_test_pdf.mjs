import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function generateSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  
  // Page 1: Cover page with text and graphics
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  page1.drawRectangle({
    x: 50,
    y: 700,
    width: 495,
    height: 90,
    color: rgb(0.1, 0.4, 0.8),
  });

  // Page 2: Content page with embedded high-res photo
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const imgBytes = fs.readFileSync('test-fixtures/test-800x600.png');
  const pngImage = await pdfDoc.embedPng(imgBytes);

  page2.drawImage(pngImage, {
    x: 50,
    y: 350,
    width: 495,
    height: 371.25,
  });

  // Page 3: Summary page
  const page3 = pdfDoc.addPage([595.28, 841.89]);
  page3.drawRectangle({
    x: 50,
    y: 400,
    width: 495,
    height: 300,
    color: rgb(0.95, 0.95, 0.95),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test-fixtures/large-sample.pdf', pdfBytes);
  console.log(`Created test-fixtures/large-sample.pdf (${pdfBytes.length} bytes)`);
}

generateSamplePdf().catch(console.error);
