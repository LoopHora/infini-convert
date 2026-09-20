// ===== FILE DETECTOR ENGINE =====
// Deterministic in-browser file detection using magic bytes, headers, and metadata.
// 100% client-side, zero server upload.

import { generateId, getFileExtension, getImageDimensions } from '@/utils';
import { getPdfPageCount } from '@/engine/pdf';

export interface DetectedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  detectedFormat: string; // 'jpg' | 'png' | 'webp' | 'heic' | 'pdf' | 'bmp' | 'gif' | 'avif' | 'unknown'
  isImage: boolean;
  isPdf: boolean;
  isPptx: boolean;
  width?: number;
  height?: number;
  pageCount?: number;
  slideCount?: number;
  previewUrl?: string;
  isValid: boolean;
  error?: string;
}

export interface BatchSummary {
  totalFiles: number;
  totalSize: number;
  formatCounts: Record<string, number>;
  allImages: boolean;
  allPdfs: boolean;
  mixedTypes: boolean;
}

/**
 * Reads the first bytes of a file to determine the true format via magic numbers
 */
export async function detectFormatFromSignature(file: File): Promise<string> {
  try {
    const slice = file.slice(0, 32);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // JPEG: FF D8 FF
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'jpg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'png';
    }

    // GIF: 47 49 46 38
    if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
      return 'gif';
    }

    // BMP: 42 4D ("BM")
    if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return 'bmp';
    }

    // PDF: 25 50 44 46 ("%PDF")
    if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return 'pdf';
    }

    // WebP: RIFF .... WEBP
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      return 'webp';
    }

    // ISO Base Media File Format (HEIC / AVIF): offset 4 = "ftyp" (66 74 79 70)
    if (bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
      if (['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(brand)) {
        return 'heic';
      }
      if (['avif', 'avis'].includes(brand)) {
        return 'avif';
      }
    }

    // TIFF: 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
    // ZIP / PPTX: 50 4B 03 04 ("PK\x03\x04")
    if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
      const ext = getFileExtension(file.name);
      if (ext === 'pptx') {
        return 'pptx';
      }
      return 'zip';
    }
  } catch (err) {
    console.warn('Could not read magic bytes from file:', err);
  }

  // Fallback to extension
  const ext = getFileExtension(file.name);
  if (['jpg', 'jpeg'].includes(ext)) return 'jpg';
  if (['png'].includes(ext)) return 'png';
  if (['webp'].includes(ext)) return 'webp';
  if (['heic', 'heif'].includes(ext)) return 'heic';
  if (['avif'].includes(ext)) return 'avif';
  if (['pdf'].includes(ext)) return 'pdf';
  if (['bmp'].includes(ext)) return 'bmp';
  if (['gif'].includes(ext)) return 'gif';
  if (['tiff', 'tif'].includes(ext)) return 'tiff';
  if (['pptx'].includes(ext)) return 'pptx';

  return 'unknown';
}

/**
 * Detects a single file and extracts dimensions/page count safely
 */
export async function detectFile(file: File): Promise<DetectedFile> {
  const id = generateId();
  const format = await detectFormatFromSignature(file);
  const isPdf = format === 'pdf';
  const isPptx = format === 'pptx';
  const isImage = ['jpg', 'png', 'webp', 'heic', 'avif', 'bmp', 'gif', 'tiff'].includes(format);

  let width: number | undefined;
  let height: number | undefined;
  let pageCount: number | undefined;
  let slideCount: number | undefined;
  let previewUrl: string | undefined;
  let error: string | undefined;
  let isValid = format !== 'unknown';

  if (file.size === 0) {
    return {
      id,
      file,
      name: file.name,
      size: 0,
      extension: getFileExtension(file.name),
      mimeType: file.type || 'application/octet-stream',
      detectedFormat: format,
      isImage,
      isPdf,
      isPptx,
      isValid: false,
      error: 'File is empty (0 bytes).',
    };
  }

  if (isPptx) {
    try {
      const { getPptxMetadata } = await import('@/engine/pptx');
      const meta = await getPptxMetadata(file);
      slideCount = meta.slideCount;
      pageCount = meta.slideCount;
    } catch {
      isValid = false;
      error = 'Could not parse PowerPoint presentation. File may be corrupted or encrypted.';
    }
  } else if (isPdf) {
    try {
      pageCount = await getPdfPageCount(file);
    } catch {
      isValid = false;
      error = 'Could not parse PDF. File may be encrypted or corrupted.';
      pageCount = undefined;
    }
  } else if (isImage && format !== 'heic') {
    try {
      const dims = await getImageDimensions(file);
      width = dims.width;
      height = dims.height;
      previewUrl = URL.createObjectURL(file);
    } catch {
      isValid = false;
      error = 'File appears corrupted or cannot be decoded as an image.';
    }
  } else if (format === 'unknown') {
    isValid = false;
    error = 'Unsupported or unrecognized file format.';
  }

  return {
    id,
    file,
    name: file.name,
    size: file.size,
    extension: getFileExtension(file.name),
    mimeType: file.type || 'application/octet-stream',
    detectedFormat: format,
    isImage,
    isPdf,
    isPptx,
    width,
    height,
    pageCount,
    slideCount,
    previewUrl,
    isValid,
    error,
  };
}

/**
 * Detects multiple files in parallel and returns structured batch summary
 */
export async function detectFiles(files: File[]): Promise<{ detected: DetectedFile[]; summary: BatchSummary }> {
  const detected = await Promise.all(files.map((f) => detectFile(f)));

  const formatCounts: Record<string, number> = {};
  let totalSize = 0;
  let imageCount = 0;
  let pdfCount = 0;

  for (const item of detected) {
    totalSize += item.size;
    formatCounts[item.detectedFormat] = (formatCounts[item.detectedFormat] || 0) + 1;
    if (item.isImage) imageCount++;
    if (item.isPdf) pdfCount++;
  }

  const allImages = imageCount === detected.length && detected.length > 0;
  const allPdfs = pdfCount === detected.length && detected.length > 0;
  const mixedTypes = !allImages && !allPdfs;

  return {
    detected,
    summary: {
      totalFiles: detected.length,
      totalSize,
      formatCounts,
      allImages,
      allPdfs,
      mixedTypes,
    },
  };
}
