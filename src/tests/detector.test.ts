// ===== UNIT TESTS: FILE DETECTOR =====
import { describe, it, expect } from 'vitest';
import { detectFormatFromSignature, detectFiles, detectFile } from '../engine/detector';

describe('File Detection Engine', () => {
  it('detects JPEG from magic bytes', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const file = new File([bytes], 'sample_photo.dat', { type: 'application/octet-stream' });
    const format = await detectFormatFromSignature(file);
    expect(format).toBe('jpg');
  });

  it('detects PNG from magic bytes', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([bytes], 'graphic.dat', { type: 'application/octet-stream' });
    const format = await detectFormatFromSignature(file);
    expect(format).toBe('png');
  });

  it('detects PDF from magic bytes', async () => {
    const bytes = new TextEncoder().encode('%PDF-1.7 header content');
    const file = new File([bytes], 'contract.bin', { type: 'application/octet-stream' });
    const format = await detectFormatFromSignature(file);
    expect(format).toBe('pdf');
  });

  it('detects WebP from RIFF and WEBP signature', async () => {
    const bytes = new Uint8Array(16);
    // 'R', 'I', 'F', 'F'
    bytes.set([0x52, 0x49, 0x46, 0x46], 0);
    // 'W', 'E', 'B', 'P'
    bytes.set([0x57, 0x45, 0x42, 0x50], 8);
    const file = new File([bytes], 'image_no_ext', { type: '' });
    const format = await detectFormatFromSignature(file);
    expect(format).toBe('webp');
  });

  it('detects HEIC from ftypheic signature', async () => {
    const bytes = new Uint8Array(16);
    // offset 4: 'f', 't', 'y', 'p'
    bytes.set([0x66, 0x74, 0x79, 0x70], 4);
    // offset 8: 'h', 'e', 'i', 'c'
    bytes.set([0x68, 0x65, 0x69, 0x63], 8);
    const file = new File([bytes], 'apple_shot', { type: '' });
    const format = await detectFormatFromSignature(file);
    expect(format).toBe('heic');
  });

  it('flags 0-byte file as invalid', async () => {
    const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
    const detected = await detectFile(emptyFile);
    expect(detected.isValid).toBe(false);
    expect(detected.size).toBe(0);
    expect(detected.error).toBeDefined();
  });

  it('computes batch summary across mixed image formats', async () => {
    const jpg = new File([new Uint8Array([0xff, 0xd8, 0xff])], '1.jpg', { type: 'image/jpeg' });
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], '2.png', { type: 'image/png' });
    const files = [jpg, png];

    const { detected, summary } = await detectFiles(files);
    expect(detected.length).toBe(2);
    expect(summary.allImages).toBe(true);
    expect(summary.allPdfs).toBe(false);
    expect(summary.formatCounts['jpg']).toBe(1);
    expect(summary.formatCounts['png']).toBe(1);
  });

  it('detects format with uppercase and mixed-case extensions', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([bytes], 'PHOTO_UPPER.PNG', { type: 'image/png' });
    const format = await detectFormatFromSignature(file);
    expect(format).toBe('png');
  });

  it('identifies file without extension via magic bytes', async () => {
    const bytes = new TextEncoder().encode('%PDF-2.0 content');
    const file = new File([bytes], 'raw_pdf_blob', { type: '' });
    const format = await detectFormatFromSignature(file);
    expect(format).toBe('pdf');
  });

  it('flags unsupported formats as invalid', async () => {
    const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // DOS/PE header
    const file = new File([bytes], 'installer.exe', { type: 'application/octet-stream' });
    const detected = await detectFile(file);
    expect(detected.isValid).toBe(false);
    expect(detected.detectedFormat).toBe('unknown');
    expect(detected.error).toBeDefined();
  });
});
