// ===== IMAGE CODECS — Canvas & WASM =====
// Uses browser Canvas API for conversion/compression, with lazy-loaded heic2any
// for iPhone HEIC/HEIF photo decoding.

import { loadImage, canvasToBlob, getMimeType } from '@/utils';
import type { CompressionSettings, ResizeSettings } from '@/types';
import { PRESET_QUALITIES } from '@/types';

/**
 * Check if a file or blob represents an Apple iPhone HEIC/HEIF image
 */
export function isHeicFormat(file: File | Blob): boolean {
  const type = (file.type || '').toLowerCase();
  const name = 'name' in file ? ((file as File).name || '').toLowerCase() : '';
  return (
    type.includes('heic') ||
    type.includes('heif') ||
    /\.(heic|heif)$/i.test(name)
  );
}

/**
 * Decode HEIC/HEIF using heic2any library (lazy loaded)
 */
export async function decodeHeic(file: File | Blob): Promise<Blob> {
  try {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({
      blob: file,
      toType: 'image/png',
      quality: 1,
    });
    // heic2any can return Blob or Blob[]
    if (Array.isArray(result)) return result[0];
    return result as Blob;
  } catch (err) {
    console.warn('[decodeHeic] heic2any decoding error, using fallback frame:', err);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 0, 400, 300);
    }
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || new Blob([])), 'image/png');
    });
  }
}

/**
 * Ensures any image source (including iPhone HEIC) is ready for Canvas operations
 */
export async function prepareDecodedImage(file: File | Blob): Promise<File | Blob> {
  if (isHeicFormat(file)) {
    const pngBlob = await decodeHeic(file);
    const originalName = 'name' in file ? (file as File).name : 'photo.heic';
    const cleanName = originalName.replace(/\.(heic|heif)$/i, '.png');
    return new File([pngBlob], cleanName, { type: 'image/png' });
  }
  return file;
}

/**
 * Convert an image from one format to another using Canvas (handles HEIC automatically)
 */
export async function convertImage(
  file: File | Blob,
  outputFormat: string,
  quality: number = 92
): Promise<Blob> {
  const source = await prepareDecodedImage(file);
  const img = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;

  // For JPG output, fill white background (no transparency)
  if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);
  const mimeType = getMimeType(outputFormat);
  return canvasToBlob(canvas, mimeType, quality);
}

/**
 * Compress an image using Canvas quality settings (supports iPhone HEIC/HEIF)
 */
export async function compressImage(
  file: File,
  settings: CompressionSettings
): Promise<Blob> {
  const isHeic = isHeicFormat(file);
  const decodedFile = (await prepareDecodedImage(file)) as File;
  const ext = isHeic ? 'jpg' : (decodedFile.name.split('.').pop()?.toLowerCase() || 'jpg');

  let quality: number;
  if (settings.mode === 'preset') {
    quality = PRESET_QUALITIES[settings.preset];
  } else if (settings.mode === 'custom') {
    quality = settings.quality;
  } else {
    // target mode - use binary search
    return compressToTargetSize(decodedFile, settings.targetSize || 500 * 1024, ext);
  }

  const outputFormat = ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpg';
  return convertImage(decodedFile, outputFormat, quality);
}

/**
 * Binary search to achieve target file size
 */
async function compressToTargetSize(
  file: File,
  targetBytes: number,
  format: string
): Promise<Blob> {
  const outputFormat = format === 'png' ? 'jpg' : format; // PNG doesn't support quality, fallback to JPG
  let low = 5;
  let high = 100;
  let bestBlob: Blob | null = null;
  let iterations = 0;
  const maxIterations = 12;

  while (low <= high && iterations < maxIterations) {
    const mid = Math.floor((low + high) / 2);
    const blob = await convertImage(file, outputFormat, mid);
    iterations++;

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      low = mid + 1; // Try higher quality
    } else {
      high = mid - 1; // Need lower quality
    }
  }

  // If we couldn't get below target, return the smallest we found
  if (!bestBlob) {
    bestBlob = await convertImage(file, outputFormat, 5);
  }

  return bestBlob;
}

/**
 * Resize an image using Canvas (supports iPhone HEIC/HEIF)
 */
export async function resizeImage(
  file: File,
  settings: ResizeSettings,
  outputFormat?: string,
  quality: number = 92
): Promise<Blob> {
  const isHeic = isHeicFormat(file);
  const decodedSource = await prepareDecodedImage(file);
  const img = await loadImage(decodedSource);
  const origWidth = img.naturalWidth;
  const origHeight = img.naturalHeight;

  let rawW = Math.round(Number(settings.width) || 0);
  let rawH = Math.round(Number(settings.height) || 0);

  let newWidth = rawW > 0 ? rawW : 0;
  let newHeight = rawH > 0 ? rawH : 0;

  if (settings.lockAspectRatio) {
    const aspectRatio = origWidth / origHeight;
    if (newWidth > 0 && newHeight <= 0) {
      newHeight = Math.max(1, Math.round(newWidth / aspectRatio));
    } else if (newHeight > 0 && newWidth <= 0) {
      newWidth = Math.max(1, Math.round(newHeight * aspectRatio));
    } else if (newWidth > 0 && newHeight > 0) {
      // Fit within the box while maintaining aspect ratio
      const scaleW = newWidth / origWidth;
      const scaleH = newHeight / origHeight;
      const scale = Math.min(scaleW, scaleH);
      newWidth = Math.max(1, Math.round(origWidth * scale));
      newHeight = Math.max(1, Math.round(origHeight * scale));
    }
  }

  if (newWidth <= 0) newWidth = origWidth;
  if (newHeight <= 0) newHeight = origHeight;

  // Clamp to safe canvas limits [1, 16384]
  newWidth = Math.max(1, Math.min(16384, newWidth));
  newHeight = Math.max(1, Math.min(16384, newHeight));

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d')!;

  // Use high-quality resampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const rawExt = outputFormat || (isHeic ? 'jpg' : (file.name.split('.').pop()?.toLowerCase() || 'jpg'));
  let ext = rawExt.replace(/^\./, '').toLowerCase();
  if (ext === 'heic' || ext === 'heif') {
    ext = 'jpg';
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  const mimeType = getMimeType(ext);
  return canvasToBlob(canvas, mimeType, quality);
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crop an image to specified rectangular coordinates using Canvas (supports HEIC/HEIF)
 */
export async function cropImage(
  file: File,
  cropArea: CropArea,
  outputFormat?: string,
  quality: number = 92
): Promise<Blob> {
  const isHeic = isHeicFormat(file);
  const decodedSource = await prepareDecodedImage(file);
  const img = await loadImage(decodedSource);
  const origWidth = img.naturalWidth;
  const origHeight = img.naturalHeight;

  // Clamp crop rectangle to natural image dimensions
  const x = Math.max(0, Math.min(origWidth - 1, Math.round(cropArea.x || 0)));
  const y = Math.max(0, Math.min(origHeight - 1, Math.round(cropArea.y || 0)));
  const width = Math.max(1, Math.min(origWidth - x, Math.round(cropArea.width || origWidth)));
  const height = Math.max(1, Math.min(origHeight - y, Math.round(cropArea.height || origHeight)));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const rawExt = outputFormat || (isHeic ? 'jpg' : (file.name.split('.').pop()?.toLowerCase() || 'png'));
  let ext = rawExt.replace(/^\./, '').toLowerCase();
  if (ext === 'heic' || ext === 'heif') {
    ext = 'jpg';
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Draw the selected slice onto the canvas
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
  const mimeType = getMimeType(ext);
  return canvasToBlob(canvas, mimeType, quality);
}


/**
 * Convert HEIC to a target format
 */
export async function convertHeic(
  file: File,
  outputFormat: string,
  quality: number = 92
): Promise<Blob> {
  // First decode HEIC to PNG
  const pngBlob = await decodeHeic(file);
  // Then convert to target format (jpg, webp, avif, or keep png)
  if (outputFormat === 'png') return pngBlob;
  return convertImage(new File([pngBlob], 'temp.png', { type: 'image/png' }), outputFormat, quality);
}
