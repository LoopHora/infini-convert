// ===== UNIT TESTS: UTILITIES & SECURITY =====
import { describe, it, expect } from 'vitest';
import {
  calculateSavings,
  sanitizeFilename,
  formatFileSize,
  replaceExtension,
  getFileExtension,
} from '../utils';

describe('Utility & Security Functions', () => {
  describe('calculateSavings', () => {
    it('calculates savings percentage correctly', () => {
      expect(calculateSavings(1000, 500)).toBe('50.0%');
      expect(calculateSavings(2000, 1500)).toBe('25.0%');
      expect(calculateSavings(1024, 768)).toBe('25.0%');
    });

    it('returns 0% when result is equal or larger than original', () => {
      expect(calculateSavings(1000, 1000)).toBe('0%');
      expect(calculateSavings(1000, 1500)).toBe('0%');
      expect(calculateSavings(0, 100)).toBe('0%');
    });
  });

  describe('sanitizeFilename', () => {
    it('preserves clean standard filenames', () => {
      expect(sanitizeFilename('photo.jpg')).toBe('photo.jpg');
      expect(sanitizeFilename('my_document-2026.pdf')).toBe('my_document-2026.pdf');
    });

    it('neutralizes path traversal attempts and strips directory components', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('system32');
    });

    it('replaces OS reserved characters', () => {
      expect(sanitizeFilename('file*with?bad:chars<>.png')).toBe('file_with_bad_chars__.png');
      expect(sanitizeFilename('document"|name.pdf')).toBe('document__name.pdf');
    });

    it('preserves Unicode and international filenames', () => {
      expect(sanitizeFilename('résumé_日本語_2026.png')).toBe('résumé_日本語_2026.png');
      expect(sanitizeFilename('תמונה.jpg')).toBe('תמונה.jpg');
    });

    it('provides fallback for empty or degenerate inputs', () => {
      expect(sanitizeFilename('')).toBe('file');
      expect(sanitizeFilename('.')).toBe('file');
      expect(sanitizeFilename('..')).toBe('file');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes, KB, MB, and GB', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.50 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1.5)).toBe('1.50 GB');
    });
  });

  describe('replaceExtension', () => {
    it('swaps file extensions cleanly', () => {
      expect(replaceExtension('photo.jpg', 'png')).toBe('photo.png');
      expect(replaceExtension('archive.tar.gz', 'webp')).toBe('archive.tar.webp');
      expect(replaceExtension('no_ext', 'pdf')).toBe('no_ext.pdf');
    });
  });

  describe('getFileExtension', () => {
    it('extracts lowercase extension', () => {
      expect(getFileExtension('image.JPG')).toBe('jpg');
      expect(getFileExtension('doc.PDF')).toBe('pdf');
      expect(getFileExtension('noext')).toBe('noext');
    });
  });

  describe('iPhone HEIC/HEIF format support', () => {
    it('isHeicFormat identifies iPhone photos correctly', async () => {
      const { isHeicFormat } = await import('../engine/codecs');
      expect(isHeicFormat(new File([], 'IMG_1234.HEIC'))).toBe(true);
      expect(isHeicFormat(new File([], 'IMG_1234.heif'))).toBe(true);
      expect(isHeicFormat(new File([], 'photo.jpg', { type: 'image/heic' }))).toBe(true);
      expect(isHeicFormat(new File([], 'photo.jpg', { type: 'image/jpeg' }))).toBe(false);
      expect(isHeicFormat(new File([], 'document.pdf'))).toBe(false);
    });

    it('tool registry includes HEIC in universal tools (compress-image, resize-image, image-to-pdf)', async () => {
      const { getToolById } = await import('../engine/registry');
      const compressImg = getToolById('compress-image');
      expect(compressImg?.inputFormats).toContain('heic');
      expect(compressImg?.inputFormats).toContain('heif');

      const resizeImg = getToolById('resize-image');
      expect(resizeImg?.inputFormats).toContain('heic');
      expect(resizeImg?.inputFormats).toContain('heif');

      const imgToPdf = getToolById('image-to-pdf');
      expect(imgToPdf?.inputFormats).toContain('heic');
      expect(imgToPdf?.inputFormats).toContain('heif');

      const heicToWebp = getToolById('heic-to-webp');
      expect(heicToWebp).toBeDefined();
      expect(heicToWebp?.outputFormats).toContain('webp');

      const compressHeic = getToolById('compress-heic');
      expect(compressHeic).toBeDefined();
    });
  });

  describe('Image Crop & Resize Codecs', () => {
    it('exports cropImage and resizeImage functions', async () => {
      const { cropImage, resizeImage } = await import('../engine/codecs');
      expect(typeof cropImage).toBe('function');
      expect(typeof resizeImage).toBe('function');
    });
  });
});

