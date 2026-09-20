// ===== POWERPOINT (.PPTX) ENGINE =====
// 100% client-side, zero server upload.
// Text extraction via JSZip & DOMParser, visual slide rendering via @aiden0z/pptx-renderer & html-to-image,
// and multi-page PDF compilation via pdf-lib.

import { PDFDocument } from 'pdf-lib';

export interface PptxSlideText {
  slideNumber: number;
  title: string;
  lines: string[];
}

export interface PptxTextResult {
  text: string;
  markdown: string;
  slideCount: number;
  slides: PptxSlideText[];
}

export interface PptxRenderedSlide {
  slideNumber: number;
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Fast client-side slide count & metadata inspection without heavy rendering
 */
export async function getPptxMetadata(file: File): Promise<{ slideCount: number }> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const slideFiles = Object.keys(zip.files).filter((path) =>
    /^ppt\/slides\/slide\d+\.xml$/i.test(path)
  );
  return {
    slideCount: Math.max(1, slideFiles.length),
  };
}

function parseXmlSlideParagraphs(xmlText: string): string[] {
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'application/xml');
      const paragraphs = doc.getElementsByTagNameNS('*', 'p');
      const lines: string[] = [];
      for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
        const p = paragraphs[pIdx];
        const textNodes = p.getElementsByTagNameNS('*', 't');
        let lineText = '';
        for (let tIdx = 0; tIdx < textNodes.length; tIdx++) {
          lineText += textNodes[tIdx].textContent || '';
        }
        lineText = lineText.trim();
        if (lineText) {
          lines.push(lineText);
        }
      }
      return lines;
    } catch {
      // fallback to regex below
    }
  }

  // Universal / Node.js fallback:
  // Match each <*:p> ... </*:p>
  const pRegex = /<[a-zA-Z0-9]+:p[^>]*>([\s\S]*?)<\/[a-zA-Z0-9]+:p>/gi;
  const tRegex = /<[a-zA-Z0-9]+:t[^>]*>([^<]*)<\/[a-zA-Z0-9]+:t>/gi;
  const lines: string[] = [];
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(xmlText)) !== null) {
    const pContent = pMatch[1];
    let lineText = '';
    let tMatch: RegExpExecArray | null;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      lineText += tMatch[1];
    }
    lineText = lineText
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
    if (lineText) {
      lines.push(lineText);
    }
  }
  return lines;
}

/**
 * Extract structured slide-by-slide text from a PPTX file
 */
export async function extractPptxText(file: File): Promise<PptxTextResult> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);

  // Find all slide XML files and sort numerically
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return numA - numB;
    });

  const slides: PptxSlideText[] = [];

  for (let idx = 0; idx < slidePaths.length; idx++) {
    const slideNumber = idx + 1;
    const path = slidePaths[idx];
    const xmlText = await zip.files[path].async('string');
    const lines = parseXmlSlideParagraphs(xmlText);
    const slideTitle = lines[0] || `Slide ${slideNumber}`;

    slides.push({
      slideNumber,
      title: slideTitle,
      lines,
    });
  }

  // Format plain text representation
  let textOutput = '';
  slides.forEach((s) => {
    textOutput += `Slide ${s.slideNumber}\n`;
    textOutput += '--------\n';
    if (s.lines.length > 0) {
      s.lines.forEach((line) => {
        textOutput += `${line}\n`;
      });
    } else {
      textOutput += '(No text content)\n';
    }
    textOutput += '\n';
  });

  // Format markdown representation
  let mdOutput = `# Presentation: ${file.name.replace(/\.pptx$/i, '')}\n\n`;
  slides.forEach((s) => {
    mdOutput += `## Slide ${s.slideNumber}: ${s.title}\n\n`;
    if (s.lines.length > 0) {
      s.lines.forEach((line) => {
        mdOutput += `- ${line}\n`;
      });
    } else {
      mdOutput += `*(No text content)*\n`;
    }
    mdOutput += '\n';
  });

  return {
    text: textOutput.trim(),
    markdown: mdOutput.trim(),
    slideCount: slides.length,
    slides,
  };
}

export interface PptxRenderOptions {
  format?: 'png' | 'jpg';
  onProgress?: (current: number, total: number) => void;
}

/**
 * Render all slides to PNG or JPG images in browser DOM
 */
export async function renderPptxSlides(
  file: File,
  options?: PptxRenderOptions
): Promise<PptxRenderedSlide[]> {
  const { parseZip, buildPresentation, RECOMMENDED_ZIP_LIMITS, renderSlide } = await import(
    '@aiden0z/pptx-renderer'
  );
  const htmlToImage = await import('html-to-image');

  const buffer = await file.arrayBuffer();
  const zipFiles = await parseZip(buffer, RECOMMENDED_ZIP_LIMITS);

  // Sanitize all XML strings against unescaped ampersands which cause fatal DOMParser errors
  const sanitizeXml = (str: string) =>
    str ? str.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;') : str;

  if (zipFiles.slides) {
    for (const [key, val] of zipFiles.slides.entries()) {
      zipFiles.slides.set(key, sanitizeXml(val));
    }
  }
  if (zipFiles.slideLayouts) {
    for (const [key, val] of zipFiles.slideLayouts.entries()) {
      zipFiles.slideLayouts.set(key, sanitizeXml(val));
    }
  }
  if (zipFiles.slideMasters) {
    for (const [key, val] of zipFiles.slideMasters.entries()) {
      zipFiles.slideMasters.set(key, sanitizeXml(val));
    }
  }
  if (zipFiles.presentation) {
    zipFiles.presentation = sanitizeXml(zipFiles.presentation);
  }

  const presentation = buildPresentation(zipFiles);

  const total = presentation.slides.length;
  const results: PptxRenderedSlide[] = [];
  const format = options?.format || 'png';

  // Create an offscreen, completely hidden host wrapper so slides never flash or glitch in the viewport
  const hostWrapper = document.createElement('div');
  hostWrapper.style.position = 'fixed';
  hostWrapper.style.left = '-99999px';
  hostWrapper.style.top = '-99999px';
  hostWrapper.style.width = '0px';
  hostWrapper.style.height = '0px';
  hostWrapper.style.overflow = 'hidden';
  hostWrapper.style.pointerEvents = 'none';
  document.body.appendChild(hostWrapper);

  // The rendering canvas container with relative coordinates matching presentation dimensions
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.width = `${presentation.width || 960}px`;
  container.style.height = `${presentation.height || 540}px`;
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#ffffff';
  hostWrapper.appendChild(container);

  try {
    for (let i = 0; i < total; i++) {
      const slide = presentation.slides[i];
      const handle = renderSlide(presentation, slide);

      container.innerHTML = '';
      container.appendChild(handle.element);
      await handle.ready;

      // Small tick to ensure styles and layouts settle
      await new Promise((resolve) => setTimeout(resolve, 80));

      let blob: Blob | null = null;
      if (format === 'jpg') {
        const dataUrl = await htmlToImage.toJpeg(container, {
          quality: 0.92,
          backgroundColor: '#ffffff',
          pixelRatio: 1.5,
          skipFonts: true,
          width: presentation.width || 960,
          height: presentation.height || 540,
        });
        const res = await fetch(dataUrl);
        blob = await res.blob();
      } else {
        const dataUrl = await htmlToImage.toPng(container, {
          backgroundColor: '#ffffff',
          pixelRatio: 1.5,
          skipFonts: true,
          width: presentation.width || 960,
          height: presentation.height || 540,
        });
        const res = await fetch(dataUrl);
        blob = await res.blob();
      }

      handle.dispose();

      if (blob) {
        results.push({
          slideNumber: i + 1,
          blob,
          width: presentation.width || 960,
          height: presentation.height || 540,
        });
      }

      options?.onProgress?.(i + 1, total);
    }
  } finally {
    if (hostWrapper.parentNode) {
      hostWrapper.parentNode.removeChild(hostWrapper);
    }
  }

  return results;
}

/**
 * Compile all PowerPoint slides into a single multi-page PDF document
 */
export async function pptxToPdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  // 1. Render all slides as images
  const slides = await renderPptxSlides(file, {
    format: 'jpg',
    onProgress,
  });

  if (slides.length === 0) {
    throw new Error('No slides could be extracted from presentation.');
  }

  // 2. Compile into PDFDocument matching exact slide dimensions
  const pdfDoc = await PDFDocument.create();

  for (const slide of slides) {
    const arrayBuffer = await slide.blob.arrayBuffer();
    const pdfImage = await pdfDoc.embedJpg(arrayBuffer);

    // Slide page matching exact slide dimensions in points (72 DPI)
    const pageWidth = slide.width;
    const pageHeight = slide.height;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    page.drawImage(pdfImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
}
