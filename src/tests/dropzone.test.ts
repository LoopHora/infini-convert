import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MAX_FILE_SIZE,
  validateDroppedFile,
} from '../components/FileDropzone';

describe('FileDropzone & File Size Limits', () => {
  it('has DEFAULT_MAX_FILE_SIZE set to exactly 1GB (1,073,741,824 bytes)', () => {
    expect(DEFAULT_MAX_FILE_SIZE).toBe(1024 * 1024 * 1024);
    expect(DEFAULT_MAX_FILE_SIZE).toBe(1073741824);
  });

  describe('validateDroppedFile with 1GB default limit', () => {
    it('accepts files up to 1GB', () => {
      // 500 MB file
      const halfGbFile = { name: 'sample.mp4', size: 500 * 1024 * 1024 };
      const resHalf = validateDroppedFile(halfGbFile, { allowAllTypes: true });
      expect(resHalf.valid).toBe(true);
      expect(resHalf.error).toBeUndefined();

      // Exactly 1GB file
      const oneGbFile = { name: 'archive.pdf', size: 1024 * 1024 * 1024 };
      const resOneGb = validateDroppedFile(oneGbFile);
      expect(resOneGb.valid).toBe(true);
      expect(resOneGb.error).toBeUndefined();
    });

    it('rejects files exceeding 1GB with an informative error', () => {
      const overLimitFile = {
        name: 'huge_recording.mp4',
        size: 1024 * 1024 * 1024 + 1024, // 1GB + 1KB
      };
      const res = validateDroppedFile(overLimitFile, { allowAllTypes: true });
      expect(res.valid).toBe(false);
      expect(res.error).toBe('File exceeds limit: huge_recording.mp4 (max 1.00 GB)');
    });

    it('rejects files exceeding 2GB with formatted size limit', () => {
      const twoGbFile = {
        name: 'large_dataset.zip',
        size: 2 * 1024 * 1024 * 1024,
      };
      const res = validateDroppedFile(twoGbFile, { allowAllTypes: true });
      expect(res.valid).toBe(false);
      expect(res.error).toBe('File exceeds limit: large_dataset.zip (max 1.00 GB)');
    });

    it('respects custom maxSize override when specified', () => {
      const customLimit = 50 * 1024 * 1024; // 50MB
      const okFile = { name: 'doc.pdf', size: 30 * 1024 * 1024 };
      const resOk = validateDroppedFile(okFile, { maxSize: customLimit });
      expect(resOk.valid).toBe(true);

      const largeFile = { name: 'video.pdf', size: 60 * 1024 * 1024 };
      const resLarge = validateDroppedFile(largeFile, { maxSize: customLimit });
      expect(resLarge.valid).toBe(false);
      expect(resLarge.error).toBe('File exceeds limit: video.pdf (max 50.0 MB)');
    });

    it('validates supported and unsupported formats', () => {
      const unsupported = { name: 'malicious.exe', size: 1024 };
      const res = validateDroppedFile(unsupported);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Unsupported format: .exe');

      const supported = { name: 'photo.jpg', size: 1024 };
      const resSupp = validateDroppedFile(supported);
      expect(resSupp.valid).toBe(true);
    });

    it('rejects 0-byte empty files unless allowAllTypes is true', () => {
      const emptyFile = { name: 'empty.png', size: 0 };
      const res = validateDroppedFile(emptyFile);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Empty file: empty.png');

      const resAllowAll = validateDroppedFile(emptyFile, { allowAllTypes: true });
      expect(resAllowAll.valid).toBe(true);
    });
  });
});
