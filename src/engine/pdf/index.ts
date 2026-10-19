// ===== PDF ENGINE =====
// Image → PDF (using pdf-lib) and PDF → Image (using pdfjs-dist)

import { PDFDocument, PageSizes } from 'pdf-lib';
import type { PdfSettings, PdfToImageSettings, CompressionSettings } from '@/types';
import { canvasToBlob, getMimeType } from '@/utils';
import { decodeHeic } from '@/engine/codecs';

// ===== IMAGE → PDF =====

interface ImageForPdf {
  blob: Blob;
  name: string;
  rotation: number; // degrees: 0, 90, 180, 270
}

const PDF_PAGE_SIZES = {
  a4: PageSizes.A4,
  letter: PageSizes.Letter,
  legal: [612, 1008] as [number, number],
} as const;

export async function imagesToPdf(
  images: ImageForPdf[],
  settings: PdfSettings
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const [pageW, pageH] = PDF_PAGE_SIZES[settings.pageSize] || PageSizes.A4;

  const isLandscape = settings.orientation === 'landscape';
  const width = isLandscape ? Math.max(pageW, pageH) : Math.min(pageW, pageH);
  const height = isLandscape ? Math.min(pageW, pageH) : Math.max(pageW, pageH);

  const marginPt = (settings.margin / 25.4) * 72; // mm to points

  for (const img of images) {
    const arrayBuffer = await img.blob.arrayBuffer();
    const type = img.blob.type || 'image/jpeg';

    let pdfImage;
    try {
      if (type === 'image/png') {
        pdfImage = await pdfDoc.embedPng(arrayBuffer);
      } else {
        // For JPG, WebP, and others — convert to JPG via canvas first if not JPG
        if (type === 'image/jpeg') {
          pdfImage = await pdfDoc.embedJpg(arrayBuffer);
        } else {
          // Convert non-JPG/PNG to JPG for embedding
          const jpgBlob = await convertBlobToJpg(img.blob);
          const jpgBuffer = await jpgBlob.arrayBuffer();
          pdfImage = await pdfDoc.embedJpg(jpgBuffer);
        }
      }
    } catch {
      // Fallback: convert to JPG
      const jpgBlob = await convertBlobToJpg(img.blob);
      const jpgBuffer = await jpgBlob.arrayBuffer();
      pdfImage = await pdfDoc.embedJpg(jpgBuffer);
    }

    const imgW = pdfImage.width;
    const imgH = pdfImage.height;

    // Determine page orientation (explicit or auto-detected per image)
    const isLandscape =
      settings.orientation === 'auto'
        ? imgW > imgH
        : settings.orientation === 'landscape';

    const width = isLandscape ? Math.max(pageW, pageH) : Math.min(pageW, pageH);
    const height = isLandscape ? Math.min(pageW, pageH) : Math.max(pageW, pageH);

    const page = pdfDoc.addPage([width, height]);

    const availW = width - 2 * marginPt;
    const availH = height - 2 * marginPt;

    // Scale to fit within available space
    const scale = Math.min(availW / imgW, availH / imgH, 1);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    // Center on page
    const x = marginPt + (availW - drawW) / 2;
    const y = marginPt + (availH - drawH) / 2;

    page.drawImage(pdfImage, {
      x,
      y,
      width: drawW,
      height: drawH,
    });

    // Apply rotation
    if (img.rotation) {
      page.setRotation({ type: 0, angle: img.rotation } as never);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}

async function convertBlobToJpg(blob: Blob): Promise<Blob> {
  let sourceBlob = blob;
  const isHeic =
    blob.type.includes('heic') ||
    blob.type.includes('heif') ||
    ((blob as any).name && /\.(heic|heif)$/i.test((blob as any).name));

  if (isHeic) {
    try {
      sourceBlob = await decodeHeic(new File([blob], 'temp.heic', { type: 'image/heic' }));
    } catch (e) {
      console.warn('HEIC decoding failed during PDF conversion fallback:', e);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(sourceBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

// ===== PDF → IMAGE =====

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
  return pdfjsLib;
}

export interface PdfPageImage {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
}

export async function pdfToImages(
  file: File,
  settings: PdfToImageSettings,
  onProgress?: (current: number, total: number) => void
): Promise<PdfPageImage[]> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer, verbosity: 0 }).promise;
  const totalPages = pdf.numPages;

  const pagesToRender: number[] =
    settings.pages === 'all'
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : settings.pages;

  const results: PdfPageImage[] = [];
  const mimeType = getMimeType(settings.format);
  const scale = settings.scale || 2;

  for (let i = 0; i < pagesToRender.length; i++) {
    const pageNum = pagesToRender[i];
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    if (settings.format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

    const blob = await canvasToBlob(canvas, mimeType, settings.quality);
    results.push({
      pageNumber: pageNum,
      blob,
      width: viewport.width,
      height: viewport.height,
    });

    onProgress?.(i + 1, pagesToRender.length);
  }

  return results;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer, verbosity: 0 }).promise;
  return pdf.numPages;
}

// ===== PDF COMPRESSION ENGINE =====

export async function compressPdf(
  file: File,
  settings: CompressionSettings,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer, verbosity: 0 }).promise;
  const totalPages = pdf.numPages;

  if (totalPages === 0) {
    throw new Error('PDF document contains no pages');
  }

  // Calculate resolution scale and JPEG compression quality based on mode
  let scale = 1.8;
  let quality = 0.75;

  if (settings.mode === 'preset') {
    switch (settings.preset) {
      case '4k':
        scale = 3.5; // ~250-300 DPI for standard page sizes: 4K UHD crispness
        quality = 0.92;
        break;
      case 'best':
        scale = 2.4; // High fidelity
        quality = 0.85;
        break;
      case 'balanced':
        scale = 1.8; // Daily reading & web
        quality = 0.75;
        break;
      case 'smallest':
        scale = 1.2; // Maximum shrinkage
        quality = 0.55;
        break;
      default:
        scale = 1.8;
        quality = 0.75;
    }
  } else if (settings.mode === 'custom') {
    quality = Math.max(0.05, Math.min(1.0, (settings.quality || 75) / 100));
    if (settings.resolution === '4k') {
      scale = 3.5;
    } else if (settings.resolution === 'high') {
      scale = 2.4;
    } else if (settings.resolution === 'standard') {
      scale = 1.5;
    } else {
      scale = quality >= 0.9 ? 3.5 : quality >= 0.7 ? 2.2 : 1.5;
    }
  } else if (settings.mode === 'target') {
    const target = settings.targetSize || 500 * 1024;
    const bytesPerPage = target / totalPages;
    if (bytesPerPage >= 1024 * 1024) {
      scale = 3.5;
      quality = 0.90;
    } else if (bytesPerPage >= 500 * 1024) {
      scale = 2.5;
      quality = 0.82;
    } else if (bytesPerPage >= 250 * 1024) {
      scale = 1.8;
      quality = 0.72;
    } else if (bytesPerPage >= 100 * 1024) {
      scale = 1.4;
      quality = 0.60;
    } else {
      scale = 1.1;
      quality = 0.45;
    }
  }

  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const originalViewport = page.getViewport({ scale: 1.0 });
    const pageWidthPt = originalViewport.width;
    const pageHeightPt = originalViewport.height;

    // Constrain scale to safe canvas limits (max 4096px dimension)
    const maxDim = Math.max(pageWidthPt, pageHeightPt);
    let pageScale = scale;
    if (maxDim * pageScale > 4096) {
      pageScale = 4096 / maxDim;
    }

    const renderViewport = page.getViewport({ scale: pageScale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(renderViewport.width);
    canvas.height = Math.round(renderViewport.height);
    const ctx = canvas.getContext('2d')!;

    // Fill white background for pages with transparent layer
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport: renderViewport, canvas } as any).promise;

    const pageBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
    const pageBuffer = await pageBlob.arrayBuffer();
    const embeddedImg = await newPdf.embedJpg(pageBuffer);

    const newPage = newPdf.addPage([pageWidthPt, pageHeightPt]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: pageHeightPt,
    });

    onProgress?.(i, totalPages);
  }

  const compressedBytes = await newPdf.save({ useObjectStreams: true });
  return new Blob([compressedBytes as unknown as BlobPart], { type: 'application/pdf' });
}

