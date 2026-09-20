// ===== FILENAME HANDLING & GENERATION =====
// Dedicated utility for reliable, sanitized, user-facing filenames across all tools

/**
 * Get extension from MIME type
 */
export function getExtensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
  };
  return map[mime.toLowerCase()] || 'bin';
}

/**
 * Extract clean basename and extension from any raw filename or path.
 * Strips directory traversal, Windows drive prefixes, and path separators.
 * Preserves Unicode characters, spaces, and multiple dots.
 */
export function extractBasename(rawName: string): { basename: string; extension: string } {
  if (!rawName || typeof rawName !== 'string') {
    return { basename: 'file', extension: '' };
  }

  // 1. Strip Windows drive prefixes (e.g. "C:\path" or "d:/path")
  let clean = rawName.replace(/^[a-zA-Z]:[/\\]/, '');

  // 2. Extract only the last path segment (handles both / and \)
  clean = clean.split(/[/\\]/).pop() || '';
  clean = clean.trim();

  // Strip leading traversal artifacts like ".."
  while (clean.startsWith('../') || clean.startsWith('..\\')) {
    clean = clean.substring(3).trim();
  }

  if (!clean || clean === '.' || clean === '..') {
    return { basename: 'file', extension: '' };
  }

  // 3. Separate extension from basename
  const lastDot = clean.lastIndexOf('.');
  if (lastDot <= 0) {
    // Dot is at index 0 (e.g. ".jpg") -> treat as extension with default basename
    if (lastDot === 0 && clean.length > 1) {
      return { basename: 'file', extension: clean.substring(1).toLowerCase() };
    }
    // No dot in filename (e.g. "photo")
    return { basename: clean, extension: '' };
  }

  const basename = clean.substring(0, lastDot).trim() || 'file';
  const extension = clean.substring(lastDot + 1).trim().toLowerCase();

  return { basename, extension };
}

/**
 * Sanitize filename against OS reserved characters, control codes, and traversal.
 * Preserves legitimate Unicode characters, single periods, hyphens, underscores, and spaces.
 */
export function sanitizeFilename(filename: string, fallback: string = 'file'): string {
  if (!filename || typeof filename !== 'string') return fallback;

  // 1. Strip path components
  let clean = filename.replace(/^[a-zA-Z]:[/\\]/, '');
  clean = clean.split(/[/\\]/).pop() || '';

  // 2. Replace OS reserved characters: / \ ? % * : | " < > and control codes (0-31, 127)
  // Preserves Unicode (e.g. Hindi, Chinese, Cyrillic, Accents, Emoji)
  let sanitized = clean
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f/\\?%*:|"<>]/g, '_')
    .replace(/\.\.+/g, '.') // Collapse multiple consecutive dots to prevent traversal
    .trim();

  // 3. Strip trailing dots or spaces which are invalid on Windows filesystems
  sanitized = sanitized.replace(/[. ]+$/, '');

  if (!sanitized || sanitized === '.' || sanitized === '..') {
    return fallback;
  }

  return sanitized;
}

export interface GenerateOutputFilenameOptions {
  pageNumber?: number;
  slideNumber?: number;
  targetFormat?: string;
  mimeType?: string;
}

/**
 * Generate intended output filename strictly following Infini-Convert rules:
 * - Conversion: photo.jpg -> photo.webp, photo.heic -> photo.jpg
 * - Compression: photo.jpg -> photo-compressed.jpg
 * - Resize: photo.jpg -> photo-resized.jpg
 * - Image to PDF: photo.jpg -> photo.pdf
 * - PDF to Image: document.pdf -> document-page-1.jpg
 * - PPTX to Slide: presentation.pptx -> presentation-slide-1.png
 * - PPTX to Text: presentation.pptx -> presentation.txt
 *
 * Runs sanitizeFilename() AFTER constructing the intended filename.
 */
export function generateOutputFilename(
  sourceName: string,
  operationOrFormat: string,
  options?: GenerateOutputFilenameOptions
): string {
  const { basename, extension: srcExt } = extractBasename(sourceName);
  const op = (operationOrFormat || '').toLowerCase().trim();

  // If basename is a raw UUID, replace with human-friendly base
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(basename);
  const isPptx = op === 'presentation-slide' || options?.slideNumber !== undefined || srcExt === 'pptx';
  const isPdf = op === 'pdf-page' || options?.pageNumber !== undefined || srcExt === 'pdf';
  const effectiveBase = isUuid ? (isPptx ? 'presentation' : isPdf ? 'document' : 'image') : basename;

  // Determine effective source extension (use MIME fallback if extensionless)
  let effectiveExt = srcExt;
  if (!effectiveExt && options?.mimeType) {
    const fromMime = getExtensionFromMime(options.mimeType);
    if (fromMime && fromMime !== 'bin') {
      effectiveExt = fromMime;
    }
  }
  if (!effectiveExt) {
    effectiveExt = 'jpg';
  }
  // Standardize jpeg to jpg, and fallback heic/heif to jpg (browser canvas outputs jpg/png)
  if (effectiveExt === 'jpeg') effectiveExt = 'jpg';
  if (effectiveExt === 'heic' || effectiveExt === 'heif') effectiveExt = 'jpg';

  let resultName = '';

  if (op === 'compressed') {
    resultName = `${effectiveBase}-compressed.${effectiveExt}`;
  } else if (op === 'resized') {
    resultName = `${effectiveBase}-resized.${effectiveExt}`;
  } else if (op === 'cropped') {
    resultName = `${effectiveBase}-cropped.${effectiveExt}`;
  } else if (op === 'pdf') {
    resultName = `${effectiveBase}.pdf`;
  } else if (op === 'presentation-slide' || options?.slideNumber !== undefined) {
    const slide = options?.slideNumber ?? 1;
    const format = options?.targetFormat || (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(op) ? op : 'png');
    const outExt = format === 'jpeg' ? 'jpg' : format;
    resultName = `${effectiveBase}-slide-${slide}.${outExt}`;
  } else if (op === 'txt') {
    resultName = `${effectiveBase}.txt`;
  } else if (op === 'md') {
    resultName = `${effectiveBase}.md`;
  } else if (op === 'pdf-page' || options?.pageNumber !== undefined) {
    const page = options?.pageNumber ?? 1;
    const format = options?.targetFormat || (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(op) ? op : 'jpg');
    const outExt = format === 'jpeg' ? 'jpg' : format;
    resultName = `${effectiveBase}-page-${page}.${outExt}`;
  } else {
    // Format conversion (e.g. 'webp', 'png', 'jpg', 'avif')
    const outExt = op === 'jpeg' ? 'jpg' : (op || effectiveExt);
    resultName = `${effectiveBase}.${outExt}`;
  }

  return sanitizeFilename(resultName);
}
