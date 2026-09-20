// ===== UNIT TESTS: ACTION RESOLVER =====
import { describe, it, expect } from 'vitest';
import { resolveActions } from '../engine/resolver';
import type { DetectedFile, BatchSummary } from '../engine/detector';

const createMockDetected = (
  name: string,
  detectedFormat: string,
  size = 500000,
  isImage = true,
  isPdf = false,
  isPptx = false
): DetectedFile => ({
  id: 'test-1',
  file: new File(['mock'], name),
  name,
  size,
  extension: name.split('.').pop() || '',
  mimeType: isImage ? `image/${detectedFormat}` : isPdf ? 'application/pdf' : isPptx ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'application/octet-stream',
  detectedFormat,
  isImage,
  isPdf,
  isPptx,
  isValid: true,
});

describe('Action Resolver', () => {
  it('ranks HEIC actions: Convert to JPG is recommended #1', () => {
    const file = createMockDetected('IMG_1234.HEIC', 'heic', 3800000);
    const summary: BatchSummary = {
      totalFiles: 1,
      totalSize: 3800000,
      formatCounts: { heic: 1 },
      allImages: true,
      allPdfs: false,
      mixedTypes: false,
    };

    const resolution = resolveActions([file], summary);
    expect(resolution.primaryActions.length).toBeGreaterThanOrEqual(3);

    const first = resolution.primaryActions[0];
    expect(first.id).toBe('heic-to-jpg');
    expect(first.isRecommended).toBe(true);
    expect(first.targetFormat).toBe('jpg');

    // Make sure impossible actions (like PDF extraction) are NOT present
    const actionIds = resolution.allActions.map((a) => a.id);
    expect(actionIds).not.toContain('pdf-to-jpg');
    expect(actionIds).not.toContain('pdf-to-png');
  });

  it('ranks JPG actions: prioritizes compression for large files', () => {
    const largeFile = createMockDetected('photo.jpg', 'jpg', 4500000);
    const summary: BatchSummary = {
      totalFiles: 1,
      totalSize: 4500000,
      formatCounts: { jpg: 1 },
      allImages: true,
      allPdfs: false,
      mixedTypes: false,
    };

    const resolution = resolveActions([largeFile], summary);
    const first = resolution.primaryActions[0];
    expect(first.category).toBe('compress');
    expect(first.isRecommended).toBe(true);
  });

  it('ranks PNG actions: Convert to WebP is recommended', () => {
    const file = createMockDetected('screenshot.png', 'png', 800000);
    const summary: BatchSummary = {
      totalFiles: 1,
      totalSize: 800000,
      formatCounts: { png: 1 },
      allImages: true,
      allPdfs: false,
      mixedTypes: false,
    };

    const resolution = resolveActions([file], summary);
    const first = resolution.primaryActions[0];
    expect(first.id).toBe('png-to-webp');
    expect(first.targetFormat).toBe('webp');
  });

  it('ranks PDF actions: Extract to JPG and PNG', () => {
    const file = createMockDetected('document.pdf', 'pdf', 1200000, false, true);
    const summary: BatchSummary = {
      totalFiles: 1,
      totalSize: 1200000,
      formatCounts: { pdf: 1 },
      allImages: false,
      allPdfs: true,
      mixedTypes: false,
    };

    const resolution = resolveActions([file], summary);
    expect(resolution.primaryActions.length).toBe(2);
    expect(resolution.primaryActions[0].id).toBe('pdf-to-jpg');
    expect(resolution.primaryActions[1].id).toBe('pdf-to-png');
  });

  it('ranks Multiple Images: recommends Combine All into One PDF', () => {
    const file1 = createMockDetected('1.jpg', 'jpg');
    const file2 = createMockDetected('2.png', 'png');
    const file3 = createMockDetected('3.heic', 'heic');
    const files = [file1, file2, file3];
    const summary: BatchSummary = {
      totalFiles: 3,
      totalSize: 1500000,
      formatCounts: { jpg: 1, png: 1, heic: 1 },
      allImages: true,
      allPdfs: false,
      mixedTypes: false,
    };

    const resolution = resolveActions(files, summary);
    const first = resolution.primaryActions[0];
    expect(first.id).toBe('image-to-pdf-batch');
    expect(first.isRecommended).toBe(true);

    const actionIds = resolution.allActions.map((a) => a.id);
    expect(actionIds).toContain('batch-compress');
    expect(actionIds).toContain('batch-convert-webp');
    expect(actionIds).toContain('batch-convert-jpg');
    expect(actionIds).toContain('batch-resize');
  });
});
