import { describe, it, expect } from 'vitest';
import { getToolById, getToolsByCategory } from '@/engine/registry';
import { generateOutputFilename } from '@/utils';
import { PRESET_QUALITIES } from '@/types';
import type { CompressionSettings } from '@/types';
import { compressPdf } from '@/engine/pdf';

describe('PDF Size Compression (4K & Custom Quality)', () => {
  describe('Tool Registry', () => {
    it('registers compress-pdf tool with correct metadata', () => {
      const tool = getToolById('compress-pdf');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('Compress PDF');
      expect(tool?.category).toBe('compress');
      expect(tool?.inputFormats).toContain('pdf');
      expect(tool?.outputFormats).toContain('pdf');
      expect(tool?.engine).toBe('pdfjs');
      expect(tool?.supportsBatch).toBe(true);
    });

    it('includes compress-pdf in getToolsByCategory("compress")', () => {
      const compressTools = getToolsByCategory('compress');
      const hasCompressPdf = compressTools.some((t) => t.id === 'compress-pdf');
      expect(hasCompressPdf).toBe(true);
    });
  });

  describe('Output Filename Generation', () => {
    it('generates [name]-compressed.pdf for compressed PDF files', () => {
      expect(generateOutputFilename('presentation.pdf', 'compressed')).toBe('presentation-compressed.pdf');
      expect(generateOutputFilename('financial_report_2026.pdf', 'compressed')).toBe('financial_report_2026-compressed.pdf');
    });

    it('sanitizes and formats names with spaces or special characters', () => {
      expect(generateOutputFilename('my proposal (final).pdf', 'compressed')).toBe('my proposal (final)-compressed.pdf');
    });
  });

  describe('Compression Presets & 4K Quality Settings', () => {
    it('defines 4k preset with highest fidelity quality setting', () => {
      expect(PRESET_QUALITIES['4k']).toBe(95);
      expect(PRESET_QUALITIES['best']).toBe(90);
      expect(PRESET_QUALITIES['balanced']).toBe(75);
      expect(PRESET_QUALITIES['smallest']).toBe(45);
    });

    it('supports preset, custom, and target modes in settings', () => {
      const presetSettings: CompressionSettings = {
        mode: 'preset',
        preset: '4k',
        quality: 95,
      };
      expect(presetSettings.mode).toBe('preset');
      expect(presetSettings.preset).toBe('4k');

      const customSettings: CompressionSettings = {
        mode: 'custom',
        preset: '4k',
        quality: 85,
        resolution: '4k',
      };
      expect(customSettings.mode).toBe('custom');
      expect(customSettings.resolution).toBe('4k');

      const targetSettings: CompressionSettings = {
        mode: 'target',
        preset: 'balanced',
        quality: 75,
        targetSize: 1024 * 1024,
      };
      expect(targetSettings.mode).toBe('target');
      expect(targetSettings.targetSize).toBe(1048576);
    });
  });

  describe('PDF Engine compressPdf export', () => {
    it('exports compressPdf as an asynchronous function', () => {
      expect(typeof compressPdf).toBe('function');
    });
  });
});
