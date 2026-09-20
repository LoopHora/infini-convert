import { describe, it, expect } from 'vitest';
import {
  extractBasename,
  sanitizeFilename,
  generateOutputFilename,
} from '../utils/filename';

describe('extractBasename', () => {
  it('extracts basename and extension from simple filename', () => {
    expect(extractBasename('photo.jpg')).toEqual({ basename: 'photo', extension: 'jpg' });
  });

  it('preserves spaces and normalizes uppercase extensions', () => {
    expect(extractBasename('My Photo.JPG')).toEqual({ basename: 'My Photo', extension: 'jpg' });
  });

  it('handles multiple dots in filename correctly', () => {
    expect(extractBasename('report.final.v2.pdf')).toEqual({
      basename: 'report.final.v2',
      extension: 'pdf',
    });
  });

  it('strips directory path and path traversal', () => {
    expect(extractBasename('../evil.jpg')).toEqual({ basename: 'evil', extension: 'jpg' });
    expect(extractBasename('../../path/to/nested.png')).toEqual({ basename: 'nested', extension: 'png' });
    expect(extractBasename('C:\\Users\\user\\Pictures\\sample.webp')).toEqual({
      basename: 'sample',
      extension: 'webp',
    });
    expect(extractBasename('/var/log/app/data.avif')).toEqual({
      basename: 'data',
      extension: 'avif',
    });
  });

  it('preserves Unicode basenames', () => {
    expect(extractBasename('मेरा फोटो.jpg')).toEqual({ basename: 'मेरा फोटो', extension: 'jpg' });
    expect(extractBasename('日本語画像.png')).toEqual({ basename: '日本語画像', extension: 'png' });
    expect(extractBasename('документ.pdf')).toEqual({ basename: 'документ', extension: 'pdf' });
  });

  it('handles files without extensions', () => {
    expect(extractBasename('unknown_file')).toEqual({ basename: 'unknown_file', extension: '' });
  });

  it('handles empty or dotfile inputs', () => {
    expect(extractBasename('')).toEqual({ basename: 'file', extension: '' });
    expect(extractBasename('.jpg')).toEqual({ basename: 'file', extension: 'jpg' });
  });
});

describe('generateOutputFilename (BUG-014 Requirements)', () => {
  describe('Format Conversions', () => {
    it('photo.jpg -> webp = photo.webp', () => {
      expect(generateOutputFilename('photo.jpg', 'webp')).toBe('photo.webp');
    });

    it('photo.jpg -> png = photo.png', () => {
      expect(generateOutputFilename('photo.jpg', 'png')).toBe('photo.png');
    });

    it('photo.jpg -> avif = photo.avif', () => {
      expect(generateOutputFilename('photo.jpg', 'avif')).toBe('photo.avif');
    });

    it('photo.png -> jpg = photo.jpg', () => {
      expect(generateOutputFilename('photo.png', 'jpg')).toBe('photo.jpg');
    });

    it('photo.png -> webp = photo.webp', () => {
      expect(generateOutputFilename('photo.png', 'webp')).toBe('photo.webp');
    });

    it('photo.webp -> jpg = photo.jpg', () => {
      expect(generateOutputFilename('photo.webp', 'jpg')).toBe('photo.jpg');
    });

    it('photo.heic -> jpg = photo.jpg', () => {
      expect(generateOutputFilename('photo.heic', 'jpg')).toBe('photo.jpg');
    });

    it('photo.heic -> png = photo.png', () => {
      expect(generateOutputFilename('photo.heic', 'png')).toBe('photo.png');
    });
  });

  describe('Compression and Resize', () => {
    it('photo.jpg -> compressed = photo-compressed.jpg', () => {
      expect(generateOutputFilename('photo.jpg', 'compressed')).toBe('photo-compressed.jpg');
    });

    it('photo.png -> compressed = photo-compressed.png', () => {
      expect(generateOutputFilename('photo.png', 'compressed')).toBe('photo-compressed.png');
    });

    it('photo.webp -> compressed = photo-compressed.webp', () => {
      expect(generateOutputFilename('photo.webp', 'compressed')).toBe('photo-compressed.webp');
    });

    it('photo.jpg -> resized = photo-resized.jpg', () => {
      expect(generateOutputFilename('photo.jpg', 'resized')).toBe('photo-resized.jpg');
    });

    it('photo.png -> resized = photo-resized.png', () => {
      expect(generateOutputFilename('photo.png', 'resized')).toBe('photo-resized.png');
    });

    it('photo.jpg -> cropped = photo-cropped.jpg', () => {
      expect(generateOutputFilename('photo.jpg', 'cropped')).toBe('photo-cropped.jpg');
    });

    it('photo.png -> cropped = photo-cropped.png', () => {
      expect(generateOutputFilename('photo.png', 'cropped')).toBe('photo-cropped.png');
    });
  });

  describe('Image <-> PDF Operations', () => {
    it('photo.jpg -> pdf = photo.pdf', () => {
      expect(generateOutputFilename('photo.jpg', 'pdf')).toBe('photo.pdf');
    });

    it('photo.png -> pdf = photo.pdf', () => {
      expect(generateOutputFilename('photo.png', 'pdf')).toBe('photo.pdf');
    });

    it('document.pdf -> pdf-page 1 (jpg) = document-page-1.jpg', () => {
      expect(
        generateOutputFilename('document.pdf', 'pdf-page', { pageNumber: 1, targetFormat: 'jpg' })
      ).toBe('document-page-1.jpg');
    });

    it('document.pdf -> pdf-page 2 (png) = document-page-2.png', () => {
      expect(
        generateOutputFilename('document.pdf', 'pdf-page', { pageNumber: 2, targetFormat: 'png' })
      ).toBe('document-page-2.png');
    });

    it('preserves multi-dot PDF basenames when extracting pages', () => {
      expect(
        generateOutputFilename('report.final.v2.pdf', 'pdf-page', {
          pageNumber: 3,
          targetFormat: 'jpg',
        })
      ).toBe('report.final.v2-page-3.jpg');
    });
  });

  describe('Path Traversal and Security', () => {
    it('strips path traversal and outputs clean basename', () => {
      expect(generateOutputFilename('../evil.jpg', 'webp')).toBe('evil.webp');
      expect(generateOutputFilename('..\\..\\evil.jpg', 'png')).toBe('evil.png');
    });

    it('strips full absolute Windows and POSIX paths', () => {
      expect(generateOutputFilename('C:\\Users\\user\\photo.jpg', 'compressed')).toBe(
        'photo-compressed.jpg'
      );
      expect(generateOutputFilename('/home/user/photo.jpg', 'resized')).toBe(
        'photo-resized.jpg'
      );
    });
  });

  describe('Unicode and Special Characters', () => {
    it('preserves Unicode Hindi filename in conversion', () => {
      expect(generateOutputFilename('मेरा फोटो.jpg', 'webp')).toBe('मेरा फोटो.webp');
    });

    it('preserves Unicode Hindi filename in compression', () => {
      expect(generateOutputFilename('मेरा फोटो.jpg', 'compressed')).toBe('मेरा फोटो-compressed.jpg');
    });

    it('preserves spaces and normalizes uppercase extensions', () => {
      expect(generateOutputFilename('My Photo.JPG', 'webp')).toBe('My Photo.webp');
      expect(generateOutputFilename('My Photo.JPG', 'compressed')).toBe('My Photo-compressed.jpg');
    });

    it('replaces illegal filesystem characters safely', () => {
      expect(generateOutputFilename('photo:test*name?.jpg', 'compressed')).toBe(
        'photo_test_name_-compressed.jpg'
      );
    });
  });

  describe('Fallbacks & Extensionless Files', () => {
    it('handles empty filename string with safe fallback', () => {
      expect(generateOutputFilename('', 'webp')).toBe('file.webp');
      expect(generateOutputFilename('   ', 'compressed')).toBe('file-compressed.jpg');
    });

    it('infers extension from MIME type when source has no extension', () => {
      expect(
        generateOutputFilename('rawimage', 'compressed', { mimeType: 'image/png' })
      ).toBe('rawimage-compressed.png');
    });

    it('replaces raw UUID filenames with human-friendly base', () => {
      expect(generateOutputFilename('36993a16-f3a7-4778-ac1c-d2efea829595.jpg', 'webp')).toBe('image.webp');
      expect(generateOutputFilename('5065d6d5-b6ba-4345-b8d5-6380af4c99c1.jpg', 'compressed')).toBe('image-compressed.jpg');
      expect(generateOutputFilename('9ccd35f5-a5a8-4467-b1af-58d4b89f4f65.pdf', 'pdf-page', { pageNumber: 1, targetFormat: 'jpg' })).toBe('document-page-1.jpg');
    });
  });
});

describe('sanitizeFilename', () => {
  it('cleans invalid OS characters while preserving valid filename text', () => {
    expect(sanitizeFilename('valid-file_name 123.jpg')).toBe('valid-file_name 123.jpg');
    expect(sanitizeFilename('evil/path/name.png')).toBe('name.png');
    expect(sanitizeFilename('name:bad?char*.jpg')).toBe('name_bad_char_.jpg');
  });

  it('preserves non-Latin Unicode characters', () => {
    expect(sanitizeFilename('मेरा फोटो.webp')).toBe('मेरा फोटो.webp');
    expect(sanitizeFilename('日本語.jpg')).toBe('日本語.jpg');
  });
});
