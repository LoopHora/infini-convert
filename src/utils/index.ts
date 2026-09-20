// ===== UTILITY FUNCTIONS =====

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format bytes into human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);
  return `${size < 10 ? size.toFixed(2) : size < 100 ? size.toFixed(1) : Math.round(size)} ${units[i]}`;
}

/**
 * Calculate percentage saved (returns 0% if result is equal or larger)
 */
export function calculateSavings(original: number, result: number): string {
  if (original <= 0 || result >= original) return '0%';
  const saved = ((original - result) / original) * 100;
  return `${saved.toFixed(1)}%`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get MIME type from extension
 */
export function getMimeType(extension: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    heic: 'image/heic',
    heif: 'image/heif',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    gif: 'image/gif',
    pdf: 'application/pdf',
  };
  return map[extension] || 'application/octet-stream';
}

/**
 * Get extension from MIME type
 */
export function getExtensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'application/pdf': 'pdf',
  };
  return map[mime] || 'bin';
}

import {
  extractBasename,
  sanitizeFilename,
  generateOutputFilename,
} from './filename';

export {
  extractBasename,
  sanitizeFilename,
  generateOutputFilename,
};
export type { GenerateOutputFilenameOptions } from './filename';

/**
 * Replace file extension safely preserving basename
 */
export function replaceExtension(filename: string, newExt: string): string {
  const { basename } = extractBasename(filename);
  const cleanExt = newExt.replace(/^\./, '').trim();
  return `${basename}.${cleanExt}`;
}

/**
 * Load an image from a File or Blob
 */
export function loadImage(source: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Draw image to canvas and export as blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      mimeType,
      quality / 100
    );
  });
}

/**
 * Create an object URL and track it for cleanup
 */
const objectUrls = new Set<string>();

export function createObjectUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  objectUrls.add(url);
  return url;
}

export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
  objectUrls.delete(url);
}

export function revokeAllObjectUrls(): void {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
  objectUrls.clear();
}

export interface DownloadItem {
  blob: Blob;
  objectUrl: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Creates canonical download metadata and persistent object URL for a real <a download> element.
 */
export function createDownloadItem(blob: Blob, filename: string): DownloadItem {
  let safeName = sanitizeFilename(filename, 'download');

  // If safeName without extension is a raw UUID, replace with meaningful semantic name
  const lastDot = safeName.lastIndexOf('.');
  const base = lastDot > 0 ? safeName.substring(0, lastDot) : safeName;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(base);
  if (isUuid) {
    const existingExt = lastDot > 0 ? safeName.substring(lastDot + 1) : '';
    const mimeExt = blob.type ? getExtensionFromMime(blob.type) : '';
    const ext = existingExt || (mimeExt && mimeExt !== 'bin' ? mimeExt : 'jpg');
    safeName = `download.${ext}`;
  }

  // Ensure an extension is present; if omitted, deduce from blob.type
  if (!safeName.includes('.') && blob.type) {
    const ext = getExtensionFromMime(blob.type);
    if (ext && ext !== 'bin') {
      safeName = `${safeName}.${ext}`;
    }
  }

  // If still no extension, append fallback based on mime
  if (!safeName.includes('.')) {
    const ext = blob.type === 'application/pdf' ? 'pdf' : blob.type === 'application/zip' ? 'zip' : 'jpg';
    safeName = `${safeName}.${ext}`;
  }

  const objectUrl = createObjectUrl(blob);

  return {
    blob,
    objectUrl,
    filename: safeName,
    mimeType: blob.type || 'application/octet-stream',
    size: blob.size,
  };
}


/**
 * Get image dimensions from a file or blob
 */
export function getImageDimensions(source: File | Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Cannot read image dimensions'));
    };
    img.src = url;
  });
}

/**
 * Check if a format is supported by the browser's Canvas API
 */
export async function isFormatSupported(mimeType: string): Promise<boolean> {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob !== null && blob.size > 0),
      mimeType,
      0.5
    );
  });
}

/**
 * Validate a file's type against accepted formats
 */
export function validateFile(file: File, acceptedExtensions: string[]): boolean {
  const ext = getFileExtension(file.name);
  return acceptedExtensions.includes(ext);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export * from './dimensions';

