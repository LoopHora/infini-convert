// ===== PDF ENGINE =====
// Image → PDF (using pdf-lib) and PDF → Image (using pdfjs-dist)

import { PDFDocument, PageSizes } from 'pdf-lib';
import type { PdfSettings, PdfToImageSettings } from '@/types';
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
