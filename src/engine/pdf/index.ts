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
  let pdf: any;
  let blobUrl: string | null = null;
  try {
    blobUrl = URL.createObjectURL(file);
    const loadingTask = pdfjs.getDocument({ url: blobUrl, verbosity: 0 });
    pdf = await loadingTask.promise;
  } catch {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer, verbosity: 0 });
    pdf = await loadingTask.promise;
  }

  try {
    const totalPages = pdf.numPages;
    const pagesToRender: number[] =
      settings.pages === 'all'
        ? Array.from({ length: totalPages }, (_, i) => i + 1)
        : settings.pages;

    const results: PdfPageImage[] = [];
    const mimeType = getMimeType(settings.format);
    const scale = settings.scale || 2;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    try {
      for (let i = 0; i < pagesToRender.length; i++) {
        const pageNum = pagesToRender[i];
        const page = await pdf.getPage(pageNum);
        try {
          const viewport = page.getViewport({ scale });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

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
        } finally {
          page.cleanup();
        }

        onProgress?.(i + 1, pagesToRender.length);

        if (file.size > 50 * 1024 * 1024 || i % 2 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }

    return results;
  } finally {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    try {
      pdf?.destroy();
    } catch { /* skip */ }
  }
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await loadPdfJs();
  let pdf: any;
  let blobUrl: string | null = null;
  try {
    blobUrl = URL.createObjectURL(file);
    const loadingTask = pdfjs.getDocument({ url: blobUrl, verbosity: 0 });
    pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer, verbosity: 0 });
    pdf = await loadingTask.promise;
    return pdf.numPages;
  } finally {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    try {
      pdf?.destroy();
    } catch { /* skip */ }
  }
}

// ===== PDF COMPRESSION ENGINE =====

export async function compressPdf(
  file: File,
  settings: CompressionSettings,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pdfjs = await loadPdfJs();

  let pdf: any;
  let blobUrl: string | null = null;
  try {
    blobUrl = URL.createObjectURL(file);
    const loadingTask = pdfjs.getDocument({ url: blobUrl, verbosity: 0 });
    pdf = await loadingTask.promise;
  } catch {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer, verbosity: 0 });
    pdf = await loadingTask.promise;
  }

  try {
    const totalPages = pdf.numPages;
    if (totalPages === 0) {
      throw new Error('PDF document contains no pages');
    }

    const isVeryLarge = file.size > 150 * 1024 * 1024; // > 150MB (e.g. 500MB)
    const isLarge = file.size > 50 * 1024 * 1024;      // > 50MB

    // Calculate resolution scale and JPEG compression quality based on mode
    let scale = 1.8;
    let quality = 0.75;

    if (settings.mode === 'preset') {
      switch (settings.preset) {
        case '4k':
          scale = isVeryLarge ? 2.5 : 3.5; // ~250-300 DPI for standard page sizes: 4K UHD crispness
          quality = isVeryLarge ? 0.88 : 0.92;
          break;
        case 'best':
          scale = isVeryLarge ? 2.0 : 2.4; // High fidelity
          quality = 0.85;
          break;
        case 'balanced':
          scale = isVeryLarge ? 1.5 : 1.8; // Daily reading & web
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
        scale = isVeryLarge ? 2.5 : 3.5;
      } else if (settings.resolution === 'high') {
        scale = isVeryLarge ? 1.8 : 2.4;
      } else if (settings.resolution === 'standard') {
        scale = 1.5;
      } else {
        scale = quality >= 0.9 ? (isVeryLarge ? 2.5 : 3.5) : quality >= 0.7 ? 2.0 : 1.4;
      }
    } else if (settings.mode === 'target') {
      const target = settings.targetSize || 500 * 1024;
      const bytesPerPage = target / totalPages;
      if (bytesPerPage >= 1024 * 1024) {
        scale = isVeryLarge ? 2.2 : 3.0;
        quality = isVeryLarge ? 0.82 : 0.88;
      } else if (bytesPerPage >= 500 * 1024) {
        scale = isVeryLarge ? 1.8 : 2.4;
        quality = 0.80;
      } else if (bytesPerPage >= 250 * 1024) {
        scale = 1.6;
        quality = 0.72;
      } else if (bytesPerPage >= 100 * 1024) {
        scale = 1.3;
        quality = 0.60;
      } else {
        scale = 1.0;
        quality = 0.45;
      }
    }

    // Safe dimension cap based on file size to prevent canvas/GPU allocation failure
    const maxAllowedDim = isVeryLarge ? 2160 : isLarge ? 2880 : 4096;

    const newPdf = await PDFDocument.create();

    // Reuse a single canvas across all page renders to prevent GPU memory leaks
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!;

    try {
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        try {
          const originalViewport = page.getViewport({ scale: 1.0 });
          const pageWidthPt = originalViewport.width;
          const pageHeightPt = originalViewport.height;

          // Constrain scale to safe canvas limits
          const maxDim = Math.max(pageWidthPt, pageHeightPt);
          let pageScale = scale;
          if (maxDim * pageScale > maxAllowedDim) {
            pageScale = maxAllowedDim / maxDim;
          }

          const renderViewport = page.getViewport({ scale: pageScale });
          canvas.width = Math.round(renderViewport.width);
          canvas.height = Math.round(renderViewport.height);

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
        } finally {
          // Immediately release internal PDF.js page caches and font structures
          page.cleanup();
        }

        onProgress?.(i, totalPages);

        // Yield to event loop to allow GC and keep UI responsive
        if (isLarge || i % 2 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } finally {
      // Clear canvas buffer memory
      canvas.width = 0;
      canvas.height = 0;
    }

    const compressedBytes = await newPdf.save({ useObjectStreams: true });
    return new Blob([compressedBytes as unknown as BlobPart], { type: 'application/pdf' });
  } finally {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    try {
      pdf?.destroy();
    } catch { /* skip */ }
  }
}

